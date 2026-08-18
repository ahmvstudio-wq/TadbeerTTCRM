"use client";

import { useState } from "react";
import {
  Sparkles,
  Building,
  Target,
  Lightbulb,
  MessageSquare,
  Pencil,
  Check,
  Globe,
  User,
  ShieldCheck,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { Company, Contact, OutreachPreparation } from "@/lib/types/database";
import { formatPhoneNumberForDisplay, formatWhatsAppNumber, parseLeadNotes, getCleanObservation, getCleanDraftMessage, getCleanDisplayNotes } from "@/lib/utils";

interface LeadResearchCardProps {
  company: Company;
  primaryContact?: Contact | null;
  preparations?: OutreachPreparation[];
  onSaveResearchNotes?: (notes: string) => Promise<void>;
}

export function LeadResearchCard({
  company,
  primaryContact,
  preparations = [],
  onSaveResearchNotes
}: LeadResearchCardProps) {
  const [editing, setEditing] = useState(false);
  const [researchText, setResearchText] = useState(getCleanDisplayNotes(company.notes) || company.notes || "");
  const [saving, setSaving] = useState(false);

  const prep = preparations[0];
  const contact = primaryContact || (company as any).contacts?.[0];

  const rawPhone = contact?.phone || company.phone || contact?.whatsapp;
  const displayPhone = rawPhone ? formatPhoneNumberForDisplay(rawPhone) : null;
  const waDigits = rawPhone ? formatWhatsAppNumber(rawPhone) : "";

  const parsedNotes = parseLeadNotes(company.notes);
  const cleanObs = getCleanObservation(company);
  const cleanNotes = getCleanDisplayNotes(company.notes);
  const staged = parsedNotes.staged_sequence;

  const handleSave = async () => {
    if (!onSaveResearchNotes) return;
    setSaving(true);
    await onSaveResearchNotes(researchText);
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6 font-sans">
      
      {/* ── Card Header with Verification Badge ────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-black shadow-2xs">
            <Sparkles className="h-5 w-5 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                About Prospect & Research Intelligence
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="h-3 w-3 text-emerald-600" /> Verified Playbook
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Standardized contact profile, decision maker persona, & operational findings.
            </p>
          </div>
        </div>

        {!editing && (
          <button
            onClick={() => {
              setResearchText(cleanNotes || cleanObs || "");
              setEditing(true);
            }}
            className="px-3.5 py-1.5 bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-2xs hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5 text-teal-400" /> Edit Research Notes
          </button>
        )}
      </div>

      {/* ── Section 1: Executive Profile ──────────────────────────────────── */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-3">
        <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider block">
          Target Executive Profile
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">{contact?.full_name || company.company_name}</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {contact?.title || "Decision Maker"}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Primary stakeholder responsible for customer engagement, operational tools, and revenue conversions.
            </p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-teal-400" /> Phone:
              </span>
              <span className="font-bold text-white">{displayPhone || "No phone listed"}</span>
            </div>

            {waDigits && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp:
                </span>
                <a
                  href={`https://wa.me/${waDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  +{waDigits} <span className="text-[10px] font-normal text-emerald-300">(Click Chat)</span>
                </a>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-teal-400" /> Industry:
              </span>
              <span className="font-bold text-teal-200">{company.industry || "General Enterprise"}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-teal-400" /> Location:
              </span>
              <span className="font-bold text-slate-200">{company.city ? `${company.city}, Oman` : "Muscat, Oman"}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── Section 2: RESEARCH BLOCKS ────────────────────────────────────── */}
      {editing ? (
        <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
          <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider block">
            Edit Prospect Research Notes & Operational Intelligence
          </label>
          <textarea
            value={researchText}
            onChange={(e) => setResearchText(e.target.value)}
            rows={5}
            className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-teal-500 font-medium"
            placeholder="Add business model summary, observed pain points, expansion signals, or suggested talking points..."
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-extrabold bg-slate-900 text-white rounded-xl cursor-pointer shadow-2xs hover:bg-slate-800"
            >
              {saving ? "Saving..." : "Save Research Notes"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Research Block 1: Pre-Researched Observation */}
          <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/90 space-y-1.5">
            <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-700" /> Pre-Researched Observation
            </span>
            <p className="text-xs text-amber-950 font-bold leading-relaxed">
              &ldquo;{cleanObs}&rdquo;
            </p>
          </div>

          {/* Research Block 2: Multi-Touch Sequence */}
          {staged && (
            <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200 space-y-3">
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-teal-600" /> Pre-Staged Multi-Touch Sequence
              </span>

              <div className="space-y-2 text-xs">
                {staged.touch_1?.message && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[9px] font-black text-teal-700 uppercase tracking-wider block mb-1">
                      Touch 1: Gate-Opener (Zero Pitch)
                    </span>
                    <p className="text-slate-800 italic leading-relaxed">&ldquo;{staged.touch_1.message}&rdquo;</p>
                  </div>
                )}

                {staged.touch_2?.message && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block mb-1">
                      Touch 2: Value & Market Observation (Day +3)
                    </span>
                    <p className="text-slate-800 italic leading-relaxed">&ldquo;{staged.touch_2.message}&rdquo;</p>
                  </div>
                )}

                {staged.touch_3?.message && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                    <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider block mb-1">
                      Touch 3: Breakaway & Graceful Close (Day +5)
                    </span>
                    <p className="text-slate-800 italic leading-relaxed">&ldquo;{staged.touch_3.message}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Research Block 3: Cold Call 30-Second Script */}
          {staged?.cold_call_script && (
            <div className="bg-teal-50/70 rounded-2xl p-4 border border-teal-200 space-y-2">
              <span className="text-[10px] font-black text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-teal-700" /> Cold Call 30-Second Script
              </span>
              <div className="space-y-1.5 text-xs text-teal-950">
                <p><strong>Opener:</strong> &ldquo;{staged.cold_call_script.opener}&rdquo;</p>
                {staged.cold_call_script.context_bridge && (
                  <p><strong>Bridge:</strong> &ldquo;{staged.cold_call_script.context_bridge}&rdquo;</p>
                )}
                {staged.cold_call_script.close_for_coffee && (
                  <p><strong>Close for Coffee:</strong> &ldquo;{staged.cold_call_script.close_for_coffee}&rdquo;</p>
                )}
              </div>
            </div>
          )}

          {/* Research Block 4: Custom Notes */}
          {cleanNotes && cleanNotes !== cleanObs && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-slate-700" /> Custom Research Notes
              </span>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {cleanNotes}
              </p>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
