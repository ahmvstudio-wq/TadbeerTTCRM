"use client";

import { useState } from "react";
import {
  X, Phone, MessageCircle, Mail, Globe, Sparkles, Pencil,
  Trash2, Calendar, Building, User, Clock, CheckCircle2,
  FileText, ExternalLink, Loader2, AlertCircle, AlertTriangle, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  STATUS_CONFIG, CHANNEL_CONFIG,
  type OutreachChannel, type OutreachStatus, type OutreachLead
} from "@/lib/types/outreach";
import { ColdCallScriptModal } from "./cold-call-script-modal";
import { DMEmailTemplateModal } from "./dm-email-template-modal";
import { EmailComposerModal } from "./email-composer-modal";
import { formatWhatsAppNumber, formatPhoneNumberForDisplay, getCleanDisplayNotes, getCleanObservation, getCleanDraftMessage } from "@/lib/utils";

interface ContactDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lead: OutreachLead | null;
  onStatusChange?: (id: string, newStatus: OutreachStatus) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onSaveEntry?: (id: string, data: Partial<OutreachLead>) => Promise<void>;
}

export function ContactDetailDrawer({
  isOpen,
  onClose,
  lead,
  onStatusChange,
  onDelete,
  onSaveEntry
}: ContactDetailDrawerProps) {
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [handle, setHandle] = useState("");
  const [channel, setChannel] = useState<OutreachChannel>("cold_call");
  const [status, setStatus] = useState<OutreachStatus>("sent");
  const [notes, setNotes] = useState("");
  const [reply, setReply] = useState("");
  const [pain, setPain] = useState("");
  const [opening, setOpening] = useState("");

  if (!isOpen || !lead) return null;

  // Initialize edit fields when entering edit mode
  const startEdit = () => {
    setCompanyName(lead.company_name);
    setHandle(lead.handle || "");
    setChannel(lead.channel);
    setStatus(lead.status);
    setNotes(lead.notes || "");
    setReply(lead.prospect_reply || "");
    setPain(lead.pain_point || "");
    setOpening(lead.call_opening_line || "");
    setEditing(true);
  };

  const handleSave = async () => {
    if (!onSaveEntry) return;
    setSaving(true);
    await onSaveEntry(lead.id, {
      company_name: companyName,
      handle,
      channel,
      status,
      notes,
      prospect_reply: reply,
      pain_point: pain,
      call_opening_line: opening,
    });
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove outreach log entry for "${lead.company_name}"?`)) return;
    if (!onDelete) return;
    setDeleting(true);
    await onDelete(lead.id);
    setDeleting(false);
    onClose();
  };

  const phone = lead.phone || (lead.channel === "cold_call" || lead.channel === "whatsapp" ? lead.handle : null);
  const email = lead.email || (lead.handle && lead.handle.includes('@') && !lead.handle.startsWith('@') ? lead.handle : null);
  const waDigits = phone ? formatWhatsAppNumber(phone) : "";
  const waUrl = waDigits ? `https://wa.me/${waDigits}` : null;
  const displayPhone = phone ? formatPhoneNumberForDisplay(phone) : null;
  const channelLabel = CHANNEL_CONFIG[lead.channel]?.label || lead.channel;
  const statusCfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.sent;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end font-sans">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Standardized Header ────────────────────────────────────────── */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black flex items-center justify-center text-lg shadow-md shrink-0">
              {lead.company_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black leading-snug text-white truncate">
                {lead.company_name}
              </h2>
              <p className="text-xs text-teal-300 font-semibold truncate flex items-center gap-1.5 mt-0.5">
                <span>{lead.industry || "General Prospect"}</span>
                <span>•</span>
                <span>{channelLabel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Status & Quick Actions Ribbon ────────────────────────────── */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pipeline Status:</span>
            {onStatusChange ? (
              <select
                value={lead.status}
                onChange={async (e) => {
                  const newS = e.target.value as OutreachStatus;
                  await onStatusChange(lead.id, newS);
                }}
                className="bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 px-3 py-1 focus:ring-2 focus:ring-teal-500 cursor-pointer shadow-2xs"
              >
                {Object.keys(STATUS_CONFIG).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s as OutreachStatus].label}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                {statusCfg.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => setScriptModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] h-7 px-3 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-teal-400" /> Script
            </button>
            <button
              onClick={() => setTemplateModalOpen(true)}
              className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-[11px] h-7 px-3 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              📝 Templates
            </button>
          </div>
        </div>

        {/* ── Main Body (Standardized Layout & Sections) ───────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">

          {/* Section 1: 📍 Primary Outlets & Contact Handles */}
          <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-teal-600" /> 1. Contact & Social Channels
              </span>
              <span className="text-[10px] font-bold text-slate-500">{channelLabel}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-900 font-bold hover:border-slate-400 transition-all"
                >
                  <Phone className="h-4 w-4 text-slate-700" />
                  <span className="truncate">{displayPhone}</span>
                </a>
              )}
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/90 text-emerald-800 font-bold hover:border-emerald-300 transition-all"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  <span>WhatsApp Chat</span>
                </a>
              )}
              {email && (
                <button
                  type="button"
                  onClick={() => setEmailModalOpen(true)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/90 text-violet-900 font-bold hover:border-violet-300 transition-all cursor-pointer"
                >
                  <Mail className="h-4 w-4 text-violet-600" />
                  <span>Send Email (Gmail/Outlook)</span>
                </button>
              )}
              {lead.handle && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200/90 text-slate-800 font-semibold truncate">
                  <Send className="h-3.5 w-3.5 text-teal-600" />
                  <span className="truncate">{lead.handle}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: 🏢 Company Categorization */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 space-y-3 shadow-2xs">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-slate-600" /> 2. Company Details
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Business Name</span>
                <span className="font-extrabold text-slate-900 text-xs block truncate">{lead.company_name}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Industry Sector</span>
                <span className="font-extrabold text-slate-800 text-xs block truncate">{lead.industry || "General"}</span>
              </div>
            </div>
          </div>

          {/* Section 3: 💬 Prospect Reply & Call Preparation Context */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FileText className="h-3.5 w-3.5 text-indigo-600" /> 3. Call Notes & Reply Intelligence
            </span>

            {lead.prospect_reply && (
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-3">
                <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block mb-0.5">💬 Prospect's Reply</span>
                <span className="text-indigo-950 font-medium italic text-xs">"{lead.prospect_reply}"</span>
              </div>
            )}

            {/* Specific Observation */}
            {(() => {
              const cleanObs = getCleanObservation(lead);
              if (!cleanObs || cleanObs.includes('{')) return null;
              return (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
                  <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider block mb-0.5">✨ Pre-Researched Observation</span>
                  <span className="text-amber-950 font-bold text-xs">{cleanObs}</span>
                </div>
              );
            })()}

            {/* Staged Warm Opener Message */}
            {(() => {
              const cleanMsg = getCleanDraftMessage(lead);
              if (!cleanMsg || cleanMsg.includes('{')) return null;
              return (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mb-0.5">📨 Staged Gate-Opener Message</span>
                  <p className="text-slate-800 font-medium text-xs italic leading-relaxed">&ldquo;{cleanMsg}&rdquo;</p>
                </div>
              );
            })()}

            {lead.call_opening_line && (
              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3">
                <span className="text-[9px] font-black text-teal-800 uppercase tracking-wider block mb-0.5">📞 Cold Call Script Opener</span>
                <span className="text-teal-950 font-bold text-xs leading-relaxed">&ldquo;{lead.call_opening_line}&rdquo;</span>
              </div>
            )}

            {/* Clean Notes */}
            {(() => {
              const cleanNotes = getCleanDisplayNotes(lead.notes);
              if (!cleanNotes || cleanNotes === getCleanObservation(lead)) return null;
              return (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">📝 Logged Notes</span>
                  <span className="text-slate-800 font-medium text-xs">{cleanNotes}</span>
                </div>
              );
            })()}
          </div>

          {/* Section 4: Edit Form Mode */}
          {editing && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-wider block">Edit Record Fields</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Company Name</label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="h-8 text-xs bg-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Handle / Contact</label>
                  <Input value={handle} onChange={e => setHandle(e.target.value)} className="h-8 text-xs bg-white" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Notes</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="text-xs resize-none bg-white p-2" rows={2} />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-8 text-xs">Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 text-xs bg-slate-900 text-white font-bold">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Standardized Footer Actions ──────────────────────────────── */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          {!editing && onSaveEntry && (
            <Button onClick={startEdit} variant="outline" className="bg-white text-slate-800 font-bold text-xs h-9 rounded-xl border-slate-200">
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Record
            </Button>
          )}

          {onDelete && (
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-white text-red-600 border-red-200 hover:bg-red-50 text-xs font-bold h-9 rounded-xl ml-auto"
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
              Delete Log
            </Button>
          )}
        </div>
      </div>

      {/* Script & Template Modals */}
      {scriptModalOpen && (
        <ColdCallScriptModal
          ctx={{
            companyName: lead.company_name,
            industry: lead.industry,
            handle: lead.handle,
            painPoint: lead.pain_point,
            prospectReply: lead.prospect_reply,
            openingLine: lead.call_opening_line,
          }}
          onClose={() => setScriptModalOpen(false)}
        />
      )}
      {templateModalOpen && (
        <DMEmailTemplateModal
          ctx={{
            companyName: lead.company_name,
            industry: lead.industry,
            contactName: (lead.handle && !/^[\d\+\-\s\(\)]+$/.test(lead.handle)) ? lead.handle : "Contact",
            channel: lead.channel,
            handle: lead.handle,
          }}
          onClose={() => setTemplateModalOpen(false)}
        />
      )}
      {emailModalOpen && (
        <EmailComposerModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          email={email || ""}
          companyName={lead.company_name}
          prospectName={lead.contact_name}
          draftMessage={getCleanDraftMessage(lead)}
          observation={getCleanObservation(lead)}
        />
      )}
    </div>
  );
}
