"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X, Check, ArrowRight, ExternalLink, MessageCircle, Phone, Mail,
  Copy, FileText, ShieldCheck, ChevronLeft, ChevronRight, Zap, Building2, User,
  RotateCcw, Filter, Pencil, CheckCircle2, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatWhatsAppNumber, formatPhoneNumberForDisplay, getCleanDraftMessage, getCleanObservation, openEmailComposer, isValidLinkedInUrl, type EmailClientType } from "@/lib/utils";
import {
  CHANNEL_CONFIG, SECTOR_CONFIG,
  type OutreachLead, type OutreachChannel, type SectorCategory
} from "@/lib/types/outreach";
import { markChannelTouchSent } from "@/lib/actions/ig-dm";
import { buildDeterministicSequence, normalizeCategorySync } from "@/lib/outreach-playbook";
import { updateCompany } from "@/lib/actions/companies";

interface PowerHourModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: OutreachChannel;
  leads: OutreachLead[];
  initialSector?: SectorCategory | "all";
  onLeadSent?: (leadId: string) => void;
}

/**
 * Resolves the accurate SectorCategory for a lead, inspecting:
 * 1. Explicit lead.sector
 * 2. lead.category
 * 3. lead.industry
 * 4. lead.company_name (e.g. "Abdullah - Perfume Shop" -> social_commerce_dtc)
 * 5. lead.notes
 */
export function resolveLeadSector(lead: OutreachLead): SectorCategory {
  if (lead.sector && SECTOR_CONFIG[lead.sector as SectorCategory]) {
    return lead.sector as SectorCategory;
  }
  const combined = [lead.category, lead.industry, lead.notes, lead.company_name].filter(Boolean).join(" ");
  return normalizeCategorySync(combined, lead.company_name);
}

export function PowerHourModal({
  isOpen,
  onClose,
  channel,
  leads,
  initialSector = "all",
  onLeadSent,
}: PowerHourModalProps) {
  // Industry / Category Queue Filter State
  const [selectedSector, setSelectedSector] = useState<SectorCategory | "all">(initialSector);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [editedMessage, setEditedMessage] = useState<string>("");
  const [isReclassifying, setIsReclassifying] = useState(false);

  // Synchronize initial sector if passed from parent
  useEffect(() => {
    if (initialSector) {
      setSelectedSector(initialSector);
    }
  }, [initialSector]);

  // Reset pagination & sent tracker when leads or channel change
  useEffect(() => {
    setCurrentIndex(0);
    setSentIds(new Set());
  }, [channel, leads.length]);

  // Compute lead counts across each sector
  const sectorCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: leads.length,
      aesthetic_clinics: 0,
      dental_clinics: 0,
      social_commerce_dtc: 0,
      hospitality_fnb: 0,
      training_education: 0,
      general: 0,
    };
    for (const l of leads) {
      const sec = resolveLeadSector(l);
      if (counts[sec] !== undefined) {
        counts[sec]++;
      } else {
        counts.general++;
      }
    }
    return counts;
  }, [leads]);

  // Filtered queue of leads strictly matching the selected sector
  const filteredLeads = useMemo(() => {
    if (selectedSector === "all") return leads;
    return leads.filter((l) => resolveLeadSector(l) === selectedSector);
  }, [leads, selectedSector]);

  // Handle changing the sector queue filter
  const handleSectorFilterChange = (newSector: SectorCategory | "all") => {
    setSelectedSector(newSector);
    setCurrentIndex(0);
  };

  const currentLead = filteredLeads[currentIndex] || filteredLeads[0];
  const channelCfg = CHANNEL_CONFIG[channel] || CHANNEL_CONFIG.whatsapp;
  const leadSector = currentLead ? resolveLeadSector(currentLead) : (selectedSector !== "all" ? selectedSector : "general");
  const sectorCfg = SECTOR_CONFIG[leadSector] || SECTOR_CONFIG.general;

  // Synchronize message draft whenever currentLead changes
  useEffect(() => {
    if (currentLead) {
      const sec = resolveLeadSector(currentLead);
      const existing = getCleanDraftMessage(currentLead);
      if (existing && existing.trim().length > 10) {
        setEditedMessage(existing);
      } else {
        const obs = currentLead.specific_observation || getCleanObservation(currentLead) || "your business operations in Muscat";
        const seq = buildDeterministicSequence(
          currentLead.company_name,
          currentLead.contact_name || "there",
          sec,
          obs,
          channel
        );
        const initialMsg = channel === "cold_call" ? (seq.cold_call_script?.opener || seq.touch_1.message) : seq.touch_1.message;
        setEditedMessage(initialMsg);
      }
    }
  }, [currentLead?.id, currentIndex, channel]);

  // Keyboard shortcut listener: ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const staged = currentLead?.staged_sequence;
  const observation = currentLead ? getCleanObservation(currentLead) : "";
  const contactName = currentLead?.contact_name || "Owner/Manager";

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
  const waDigits = phone ? formatWhatsAppNumber(phone) : "";
  const waUrl = waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(editedMessage)}` : null;

  // 2. Instagram Handle & URL Extraction
  let rawIg = currentLead?.instagram_handle;
  if (!rawIg && currentLead?.notes) {
    try {
      const p = JSON.parse(currentLead.notes);
      if (p.instagram_handle) rawIg = p.instagram_handle;
    } catch {}
    const match = currentLead.notes.match(/["']?instagram_handle["']?\s*:\s*["'](@?[^"']+)["']/i) || currentLead.notes.match(/Instagram:\s*(@?[^\s,]+)/i);
    if (match?.[1]) rawIg = match[1];
  }
  if (!rawIg && currentLead?.handle && (currentLead.handle.startsWith("@") || currentLead.handle.includes("instagram.com") || channel === "instagram_dm")) {
    rawIg = currentLead.handle;
  }
  const cleanIg = rawIg ? String(rawIg).replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^\/+/, "").replace(/\/+$/, "").replace(/^@+/, "").trim() : "";
  const igUrl = cleanIg ? `https://www.instagram.com/${cleanIg}/` : null;

  // 3. LinkedIn URL Extraction
  let rawLi = currentLead?.linkedin_url;
  if (!isValidLinkedInUrl(rawLi) && currentLead?.notes) {
    try {
      const p = JSON.parse(currentLead.notes);
      if (isValidLinkedInUrl(p.linkedin_url)) rawLi = p.linkedin_url;
    } catch {}
    const match = currentLead.notes.match(/["']?linkedin_url["']?\s*:\s*["']([^"']+)["']/i) || currentLead.notes.match(/LinkedIn:\s*([^\s,]+)/i);
    if (match?.[1] && isValidLinkedInUrl(match[1])) rawLi = match[1];
  }
  if (!isValidLinkedInUrl(rawLi) && currentLead?.handle && isValidLinkedInUrl(currentLead.handle)) {
    rawLi = currentLead.handle;
  }
  const cleanLi = isValidLinkedInUrl(rawLi) ? (rawLi!.startsWith("http") ? rawLi!.trim() : `https://${rawLi!.replace(/^\/+/, "").trim()}`) : null;

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
  const email = rawEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(rawEmail).trim()) ? String(rawEmail).trim() : null;

  // Display handle
  const displayHandle = channel === "instagram_dm"
    ? (cleanIg ? `@${cleanIg}` : currentLead?.handle || "No handle")
    : (channel === "whatsapp" || channel === "cold_call"
      ? (phone ? formatPhoneNumberForDisplay(phone) : currentLead?.handle || "No phone")
      : (channel === "linkedin" ? (cleanLi || "No LinkedIn profile") : (email || currentLead?.handle || "No contact")));

  // Re-classify this specific company's sector in database
  const handleReclassifyLead = async (newSec: SectorCategory) => {
    if (!currentLead) return;
    try {
      await updateCompany(currentLead.company_id, {
        industry: SECTOR_CONFIG[newSec].label,
        category: newSec,
      });
      currentLead.sector = newSec;
      currentLead.industry = SECTOR_CONFIG[newSec].label;
      currentLead.category = newSec;

      const obs = observation || currentLead.specific_observation || "your business growth in Muscat";
      const seq = buildDeterministicSequence(
        currentLead.company_name,
        contactName,
        newSec,
        obs,
        channel
      );
      const newMsg = channel === "cold_call" ? (seq.cold_call_script?.opener || seq.touch_1.message) : seq.touch_1.message;
      setEditedMessage(newMsg);
      setIsReclassifying(false);
    } catch (e) {
      console.warn("Could not persist company sector change:", e);
    }
  };

  // Reset to original sector template
  const handleResetToTemplate = () => {
    if (!currentLead) return;
    const obs = observation || currentLead.specific_observation || "your business growth in Muscat";
    const seq = buildDeterministicSequence(
      currentLead.company_name,
      contactName,
      leadSector,
      obs,
      channel
    );
    const newMsg = channel === "cold_call" ? (seq.cold_call_script?.opener || seq.touch_1.message) : seq.touch_1.message;
    setEditedMessage(newMsg);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(editedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchEmail = (client: EmailClientType = "gmail") => {
    navigator.clipboard.writeText(editedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (email && currentLead) {
      openEmailComposer({
        client,
        to: email,
        companyName: currentLead.company_name,
        prospectName: contactName,
        subject: `Observation regarding ${currentLead.company_name}`,
        body: editedMessage,
      });
    }
  };

  const handleLaunchAndCopy = () => {
    navigator.clipboard.writeText(editedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    if (channel === "whatsapp" && waUrl) {
      window.open(waUrl, "_blank");
    } else if (channel === "instagram_dm" && igUrl) {
      window.open(igUrl, "_blank");
    } else if (channel === "linkedin") {
      if (cleanLi) {
        window.open(cleanLi, "_blank");
      } else {
        alert("This prospect does not have a verified LinkedIn profile URL.");
      }
    } else if (channel === "cold_call" && phone) {
      window.location.href = `tel:${phone}`;
    } else if (channel === "email" && email) {
      handleLaunchEmail("gmail");
    }
  };

  const handleMarkSentAndNext = async () => {
    if (!currentLead) return;
    setSending(true);
    try {
      await markChannelTouchSent({
        company_id: currentLead.company_id,
        channel,
        message: editedMessage,
        handle: currentLead.handle,
        observation,
      });

      const nextSent = new Set(sentIds);
      nextSent.add(currentLead.id);
      setSentIds(nextSent);

      if (onLeadSent) onLeadSent(currentLead.id);

      // Advance to next lead in filtered queue
      if (currentIndex < filteredLeads.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const completedCount = sentIds.size;
  const totalQueueCount = filteredLeads.length;
  const progressPct = totalQueueCount > 0 ? Math.round((completedCount / totalQueueCount) * 100) : 0;
  const wordCount = editedMessage.trim() ? editedMessage.trim().split(/\s+/).length : 0;
  const charCount = editedMessage.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 font-bold text-lg">
                {channelCfg.emoji || "⚡"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black tracking-tight text-white">Power-Hour Dispatcher</h2>
                  <Badge className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-[10px] font-bold">
                    {channelCfg.label}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {totalQueueCount > 0 ? `Lead ${currentIndex + 1} of ${totalQueueCount}` : "Queue empty"} • {completedCount} dispatched today
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Category Filter Dropdown in Top Header */}
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                <Filter className="h-3.5 w-3.5 text-teal-400" />
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Industry:</span>
                <select
                  value={selectedSector}
                  onChange={(e) => handleSectorFilterChange(e.target.value as any)}
                  className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1"
                  title="Filter Power-Hour queue by industry"
                >
                  <option value="all" className="bg-slate-900 text-white">🌐 All Categories ({sectorCounts.all})</option>
                  <option value="social_commerce_dtc" className="bg-slate-900 text-white">🛍️ Social-Commerce & DTC ({sectorCounts.social_commerce_dtc})</option>
                  <option value="aesthetic_clinics" className="bg-slate-900 text-white">🩺 Aesthetic & Derma ({sectorCounts.aesthetic_clinics})</option>
                  <option value="dental_clinics" className="bg-slate-900 text-white">🦷 Dental Clinics ({sectorCounts.dental_clinics})</option>
                  <option value="hospitality_fnb" className="bg-slate-900 text-white">☕ Hospitality & F&B ({sectorCounts.hospitality_fnb})</option>
                  <option value="training_education" className="bg-slate-900 text-white">🎓 Training & Education ({sectorCounts.training_education})</option>
                  <option value="general" className="bg-slate-900 text-white">🏢 General SME ({sectorCounts.general})</option>
                </select>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close modal (Esc)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5">
          <div
            className="bg-teal-500 h-1.5 transition-all duration-300"
            style={{ width: `${Math.max(5, progressPct)}%` }}
          />
        </div>

        {/* Modal Body */}
        {totalQueueCount === 0 || !currentLead ? (
          /* Empty State for Selected Filter */
          <div className="p-12 text-center space-y-4 my-auto">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-400/20 text-amber-500 flex items-center justify-center mx-auto text-3xl">
              {selectedSector !== "all" ? SECTOR_CONFIG[selectedSector]?.emoji || "🏢" : "📋"}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No {selectedSector !== "all" ? SECTOR_CONFIG[selectedSector]?.label : ""} leads found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                There are currently no active leads matching this industry filter for {channelCfg.label}.
              </p>
            </div>
            <Button
              onClick={() => handleSectorFilterChange("all")}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
            >
              Show All Industries ({leads.length})
            </Button>
          </div>
        ) : (
          /* Main Lead Card */
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            
            {/* Company & Persona Info */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {currentLead.company_name}
                  </h3>
                  
                  {/* Industry Queue Selector Dropdown (Filters Prospects in Power Hour) */}
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 shadow-2xs">
                    <span className="text-xs">{sectorCfg.emoji || "🏢"}</span>
                    <select
                      value={selectedSector}
                      onChange={(e) => handleSectorFilterChange(e.target.value as any)}
                      className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
                      title="Filter Power-Hour queue to only leads of this industry"
                    >
                      <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🌐 All Categories ({sectorCounts.all})</option>
                      <option value="social_commerce_dtc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🛍️ Social-Commerce & DTC ({sectorCounts.social_commerce_dtc})</option>
                      <option value="aesthetic_clinics" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🩺 Aesthetic & Derma ({sectorCounts.aesthetic_clinics})</option>
                      <option value="dental_clinics" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🦷 Dental Clinics ({sectorCounts.dental_clinics})</option>
                      <option value="hospitality_fnb" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">☕ Hospitality & Premium F&B ({sectorCounts.hospitality_fnb})</option>
                      <option value="training_education" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🎓 Training & Education ({sectorCounts.training_education})</option>
                      <option value="general" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🏢 General SME ({sectorCounts.general})</option>
                    </select>
                  </div>

                  {/* Reclassify Lead Sector (Option to fix misclassified company records) */}
                  {isReclassifying ? (
                    <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-xl px-2 py-0.5 text-xs animate-in fade-in">
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold">Assign lead to:</span>
                      <select
                        defaultValue={leadSector}
                        onChange={(e) => handleReclassifyLead(e.target.value as SectorCategory)}
                        className="bg-transparent text-xs font-bold text-amber-900 dark:text-amber-100 focus:outline-none cursor-pointer"
                      >
                        <option value="social_commerce_dtc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🛍️ Social-Commerce & DTC</option>
                        <option value="aesthetic_clinics" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🩺 Aesthetic & Derma</option>
                        <option value="dental_clinics" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🦷 Dental Clinics</option>
                        <option value="hospitality_fnb" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">☕ Hospitality & F&B</option>
                        <option value="training_education" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🎓 Training & Education</option>
                        <option value="general" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">🏢 General SME</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsReclassifying(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsReclassifying(true)}
                      className="text-[10px] font-medium text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 transition cursor-pointer"
                      title="Re-classify this specific company's industry in the database"
                    >
                      <Pencil className="h-2.5 w-2.5" />
                      Re-tag
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1 font-semibold">
                    <User className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    {contactName} {currentLead.contact_title ? `(${currentLead.contact_title})` : ""}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    {displayHandle}
                  </span>
                </div>
              </div>

              {/* Quick Navigation Arrows strictly operating over filteredLeads */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition cursor-pointer text-slate-700 dark:text-slate-300"
                  title="Previous prospect in queue"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-slate-500 px-1 font-mono">
                  {currentIndex + 1}/{totalQueueCount}
                </span>
                <button
                  disabled={currentIndex >= totalQueueCount - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQueueCount - 1, prev + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition cursor-pointer text-slate-700 dark:text-slate-300"
                  title="Next prospect in queue"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Specific Observation Snippet */}
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <FileText className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Pre-Researched Observation:</span> &ldquo;{observation || "No specific observation logged"}&rdquo;
              </div>
            </div>

            {/* Interactive Message Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Outreach Message Editor
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    ({wordCount} words • {charCount} chars)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetToTemplate}
                    className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Reset to official sector playbook template"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset to Template
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 transition cursor-pointer"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy Text"}
                  </button>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-sans text-sm leading-relaxed text-slate-900 dark:text-slate-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all resize-y shadow-inner-xs"
                  placeholder="Type or personalize your message..."
                />
              </div>
            </div>

            {/* Direct Email Client Chooser if Email Channel */}
            {channel === "email" && email && (
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
                    onClick={() => handleLaunchEmail("gmail")}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    Gmail
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunchEmail("outlook")}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                    Outlook
                  </button>
                </div>
              </div>
            )}

            {/* Cold Call Script if calling */}
            {channel === "cold_call" && staged?.cold_call_script && (
              <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <p className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">30-Second Phone Script:</p>
                <p><span className="font-bold text-slate-400">1. Opener:</span> {staged.cold_call_script.opener}</p>
                <p><span className="font-bold text-slate-400">2. Bridge:</span> {staged.cold_call_script.context_bridge}</p>
                <p><span className="font-bold text-teal-400">3. Coffee Ask:</span> {staged.cold_call_script.close_for_coffee}</p>
              </div>
            )}
          </div>
        )}

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
            {channel === "email" ? (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleLaunchEmail("gmail")}
                  disabled={!currentLead || !email}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs gap-1.5 px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Open Gmail
                </Button>
                <Button
                  onClick={() => handleLaunchEmail("outlook")}
                  disabled={!currentLead || !email}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Open Outlook
                </Button>
              </div>
            ) : channel === "whatsapp" ? (
              <Button
                onClick={handleLaunchAndCopy}
                disabled={!currentLead}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-2 px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer flex items-center"
              >
                <MessageCircle className="h-4 w-4 fill-current" />
                Launch WhatsApp Chat
              </Button>
            ) : channel === "instagram_dm" ? (
              <Button
                onClick={handleLaunchAndCopy}
                disabled={!currentLead}
                className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold text-xs gap-2 px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer flex items-center"
              >
                <ExternalLink className="h-4 w-4" />
                Open Instagram & Copy
              </Button>
            ) : (
              <Button
                onClick={handleLaunchAndCopy}
                disabled={!currentLead}
                className="bg-[#0A66C2] hover:bg-[#084e96] text-white font-bold text-xs gap-2 px-5 py-2.5 rounded-xl shadow-sm transition cursor-pointer flex items-center"
              >
                <ExternalLink className="h-4 w-4" />
                {channelCfg.actionLabel}
              </Button>
            )}

            <Button
              onClick={handleMarkSentAndNext}
              disabled={sending || !currentLead}
              className="bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs gap-2 px-6 py-2.5 rounded-xl shadow-md transition cursor-pointer disabled:opacity-40"
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
