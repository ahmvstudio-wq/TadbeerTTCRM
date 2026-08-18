"use client";

import { useState, useEffect } from "react";
import {
  X, Check, ArrowRight, ExternalLink, MessageCircle, Phone, Mail,
  Copy, Sparkles, ShieldCheck, ChevronLeft, ChevronRight, Zap, Building2, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatWhatsAppNumber, formatPhoneNumberForDisplay, getCleanDraftMessage, getCleanObservation, openEmailComposer, type EmailClientType } from "@/lib/utils";
import {
  CHANNEL_CONFIG, SECTOR_CONFIG,
  type OutreachLead, type OutreachChannel, type SectorCategory
} from "@/lib/types/outreach";
import { markChannelTouchSent } from "@/lib/actions/ig-dm";

interface PowerHourModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: OutreachChannel;
  leads: OutreachLead[];
  onLeadSent?: (leadId: string) => void;
}

export function PowerHourModal({
  isOpen,
  onClose,
  channel,
  leads,
  onLeadSent,
}: PowerHourModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCurrentIndex(0);
    setSentIds(new Set());
  }, [leads, channel]);

  if (!isOpen || leads.length === 0) return null;

  const currentLead = leads[currentIndex] || leads[0];
  const channelCfg = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.whatsapp;
  const sector = (currentLead?.sector || 'general') as SectorCategory;
  const sectorCfg = SECTOR_CONFIG[sector] || SECTOR_CONFIG.general;

  const staged = currentLead?.staged_sequence;
  const openerMessage = getCleanDraftMessage(currentLead);
  const observation = getCleanObservation(currentLead);
  const contactName = currentLead?.contact_name || 'Owner/Manager';

  // 1. WhatsApp & Phone Extraction
  let rawPhone = currentLead?.phone;
  if (!rawPhone && currentLead?.notes) {
    try {
      const p = JSON.parse(currentLead.notes);
      if (p.phone || p.whatsapp) rawPhone = p.phone || p.whatsapp;
    } catch {}
  }
  if (!rawPhone && currentLead?.handle && /^(\+|00|[0-9])[\d\s-]{6,}$/.test(currentLead.handle.trim())) {
    rawPhone = currentLead.handle.trim();
  }
  const phone = rawPhone || null;
  const waDigits = phone ? formatWhatsAppNumber(phone) : '';
  const waUrl = waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(openerMessage)}` : null;

  // 2. Instagram Handle & URL Extraction (Strictly preserves dots e.g. @tephra.om)
  let rawIg = currentLead?.instagram_handle;
  if (!rawIg && currentLead?.notes) {
    try {
      const p = JSON.parse(currentLead.notes);
      if (p.instagram_handle) rawIg = p.instagram_handle;
    } catch {}
    const match = currentLead.notes.match(/["']?instagram_handle["']?\s*:\s*["'](@?[^"']+)["']/i) || currentLead.notes.match(/Instagram:\s*(@?[^\s,]+)/i);
    if (match?.[1]) rawIg = match[1];
  }
  if (!rawIg && currentLead?.handle && (currentLead.handle.startsWith('@') || currentLead.handle.includes('instagram.com') || channel === 'instagram_dm')) {
    rawIg = currentLead.handle;
  }
  const cleanIg = rawIg ? String(rawIg).replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^\/+/, '').replace(/\/+$/, '').replace(/^@+/, '').trim() : '';
  const igUrl = cleanIg ? `https://www.instagram.com/${cleanIg}/` : null;

  // 3. LinkedIn URL Extraction
  let rawLi = currentLead?.linkedin_url;
  if (!rawLi && currentLead?.notes) {
    try {
      const p = JSON.parse(currentLead.notes);
      if (p.linkedin_url) rawLi = p.linkedin_url;
    } catch {}
    const match = currentLead.notes.match(/["']?linkedin_url["']?\s*:\s*["']([^"']+)["']/i) || currentLead.notes.match(/LinkedIn:\s*([^\s,]+)/i);
    if (match?.[1]) rawLi = match[1];
  }
  if (!rawLi && currentLead?.handle && currentLead.handle.includes('linkedin.com')) {
    rawLi = currentLead.handle;
  }
  const cleanLi = rawLi ? (rawLi.startsWith('http') ? rawLi.trim() : `https://${rawLi.replace(/^\/+/, '').trim()}`) : null;

  // 4. Email Extraction
  let rawEmail = currentLead?.email;
  if (!rawEmail && currentLead?.notes) {
    try {
      const p = JSON.parse(currentLead.notes);
      if (p.email) rawEmail = p.email;
    } catch {}
    const match = currentLead.notes.match(/["']?email["']?\s*:\s*["']([^"']+)["']/i) || currentLead.notes.match(/Email:\s*([^\s,]+)/i);
    if (match?.[1]) rawEmail = match[1];
  }
  const email = rawEmail || null;

  // Display handle
  const displayHandle = channel === 'instagram_dm'
    ? (cleanIg ? `@${cleanIg}` : currentLead.handle || 'No handle')
    : (channel === 'whatsapp' || channel === 'cold_call'
      ? (phone ? formatPhoneNumberForDisplay(phone) : currentLead.handle || 'No phone')
      : (channel === 'linkedin' ? (cleanLi || 'No LinkedIn') : (email || currentLead.handle || 'No contact')));

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(openerMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchEmail = (client: EmailClientType = 'gmail') => {
    navigator.clipboard.writeText(openerMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (email && currentLead) {
      openEmailComposer({
        client,
        to: email,
        companyName: currentLead.company_name,
        prospectName: contactName,
        subject: `Observation regarding ${currentLead.company_name}`,
        body: openerMessage,
      });
    }
  };

  const handleLaunchAndCopy = () => {
    navigator.clipboard.writeText(openerMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (channel === 'whatsapp' && waUrl) {
      window.open(waUrl, '_blank');
    } else if (channel === 'instagram_dm' && igUrl) {
      window.open(igUrl, '_blank');
    } else if (channel === 'linkedin' && cleanLi) {
      window.open(cleanLi, '_blank');
    } else if (channel === 'cold_call' && phone) {
      window.location.href = `tel:${phone}`;
    } else if (channel === 'email' && email) {
      handleLaunchEmail('gmail');
    }
  };

  const handleMarkSentAndNext = async () => {
    if (!currentLead) return;
    setSending(true);
    try {
      await markChannelTouchSent({
        company_id: currentLead.company_id,
        channel,
        message: openerMessage,
        handle: currentLead.handle,
        observation,
      });

      const nextSent = new Set(sentIds);
      nextSent.add(currentLead.id);
      setSentIds(nextSent);

      if (onLeadSent) onLeadSent(currentLead.id);

      if (currentIndex < leads.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const completedCount = sentIds.size;
  const progressPct = Math.round((completedCount / leads.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 font-bold text-lg">
              {channelCfg.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">Power-Hour Dispatcher</h2>
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-[10px] font-bold">
                  {channelCfg.label}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Lead {currentIndex + 1} of {leads.length} • {completedCount} dispatched today
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5">
          <div
            className="bg-teal-500 h-1.5 transition-all duration-300"
            style={{ width: `${Math.max(5, progressPct)}%` }}
          />
        </div>

        {/* Main Lead Card */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Company & Persona Info */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {currentLead.company_name}
                </h3>
                <Badge variant="outline" className="text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-800">
                  {sectorCfg.emoji} {sectorCfg.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <User className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  {contactName} {currentLead.contact_title ? `(${currentLead.contact_title})` : ''}
                </span>
                <span>•</span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  {displayHandle}
                </span>
              </div>
            </div>

            {/* Quick Navigation Arrows */}
            <div className="flex items-center gap-1">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-slate-500 px-1">
                {currentIndex + 1}/{leads.length}
              </span>
              <button
                disabled={currentIndex >= leads.length - 1}
                onClick={() => setCurrentIndex(prev => Math.min(leads.length - 1, prev + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Specific Observation Snippet */}
          <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Pre-Researched Observation:</span> &ldquo;{observation}&rdquo;
            </div>
          </div>

          {/* Formatted Warm Gate-Opener Message */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Warm Gate-Opener (Zero-Pitch Human Opener)
              </label>
              <button
                onClick={handleCopyMessage}
                className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy Text"}
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-sans text-sm leading-relaxed text-slate-800 dark:text-slate-200 select-all whitespace-pre-line">
              {openerMessage}
            </div>
          </div>

          {/* Direct Email Client Chooser if Email Channel */}
          {channel === 'email' && email && (
            <div className="bg-violet-50/80 dark:bg-violet-950/30 p-3.5 rounded-2xl border border-violet-200 dark:border-violet-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-violet-600 shrink-0" />
                <div>
                  <span className="font-bold text-violet-950 dark:text-violet-200 block">Recipient: {email}</span>
                  <span className="text-[11px] text-violet-700 dark:text-violet-300">Opens compose window with pre-filled greeting, subject & message:</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleLaunchEmail('gmail')}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  Gmail
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchEmail('outlook')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  Outlook
                </button>
              </div>
            </div>
          )}

          {/* Cold Call Script if calling */}
          {channel === 'cold_call' && staged?.cold_call_script && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <p className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">30-Second Phone Script:</p>
              <p><span className="font-bold text-slate-400">1. Opener:</span> {staged.cold_call_script.opener}</p>
              <p><span className="font-bold text-slate-400">2. Bridge:</span> {staged.cold_call_script.context_bridge}</p>
              <p><span className="font-bold text-teal-400">3. Coffee Ask:</span> {staged.cold_call_script.close_for_coffee}</p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs font-semibold"
          >
            Close Batch
          </Button>

          <div className="flex items-center gap-3">
            {channel === 'email' ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleLaunchEmail('gmail')}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Open Gmail
                </Button>
                <Button
                  onClick={() => handleLaunchEmail('outlook')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 px-4 py-2.5 rounded-xl shadow-md transition cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Open Outlook
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleLaunchAndCopy}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs gap-2 px-5 py-2.5 rounded-xl shadow-md transition cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                {channelCfg.actionLabel}
              </Button>
            )}

            <Button
              onClick={handleMarkSentAndNext}
              disabled={sending}
              className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-black text-xs gap-2 px-6 py-2.5 rounded-xl shadow-lg transition cursor-pointer"
            >
              <Check className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
              Mark Sent & Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
