"use client";

import { useState } from "react";
import {
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
  AlertTriangle,
  ExternalLink,
  Users,
  Compass,
  FileText,
  HelpCircle,
  Shield
} from "lucide-react";
import { Company, Contact, OutreachPreparation } from "@/lib/types/database";
import { formatPhoneNumberForDisplay, formatWhatsAppNumber, parseLeadNotes, getCleanObservation, getCleanDraftMessage, getCleanDisplayNotes, getCleanIndustry } from "@/lib/utils";
import { extractInstagramUrl } from "./contact-channels-grid";

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

  // Deep extraction from research_json or notes
  const rJson: any = (company as any).research_json || {};
  const parsedNotes = parseLeadNotes(company.notes);
  const cleanObs = getCleanObservation(company);
  const cleanNotes = getCleanDisplayNotes(company.notes);
  
  const rawIgUrl = extractInstagramUrl(company);
  const igHandle = rJson.instagram_handle || parsedNotes.instagram_handle || (rawIgUrl ? '@' + rawIgUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '') : null);
  const igUrl = rawIgUrl || rJson.instagram_url || parsedNotes.instagram_url || (igHandle ? `https://www.instagram.com/${igHandle.replace(/^@/, '')}/` : null);

  const cleanInd = getCleanIndustry(company);
  const businessType = rJson.business_type || parsedNotes.business_type || (cleanInd !== 'General Enterprise' ? cleanInd : null);
  const followers = rJson.followers || parsedNotes.followers;
  const researchSignal = rJson.research_signal || parsedNotes.research_signal;
  const confidence = rJson.confidence || parsedNotes.confidence || "High";
  const qualification = rJson.qualification || parsedNotes.qualification;
  const executionNote = rJson.execution_note || parsedNotes.execution_note;
  const staged = rJson.staged_sequence || parsedNotes.staged_sequence;

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
            <Compass className="h-5 w-5 text-teal-700" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Research & Outreach Intelligence
              </h3>
              {followers && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  <Users className="h-3 w-3 text-slate-500" /> {followers} Followers
                </span>
              )}
              {confidence && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="h-3 w-3 text-emerald-600" /> {confidence} Confidence
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Multi-channel intelligence, operating model context, discovery criteria & 4-touch sequences.
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

      {/* ── Section 1: Executive Profile & Scale ───────────────────────────── */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-[10px] font-black text-teal-400 uppercase tracking-wider block">
            Target Executive & Business Footprint
          </span>
          {businessType && (
            <span className="text-xs font-extrabold text-white bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
              {businessType}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm text-white">{contact?.full_name || company.company_name}</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {contact?.title || "Decision Maker"}
              </span>
            </div>

            {researchSignal && (
              <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 block mb-0.5">Research Signal:</span>
                <p className="text-slate-200 font-bold">{researchSignal}</p>
              </div>
            )}
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2 text-xs">
            {igUrl && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-pink-400" /> Instagram:
                </span>
                <a
                  href={igUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-pink-300 hover:underline flex items-center gap-1"
                >
                  {igHandle || "View Profile"} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-teal-400" /> Direct Phone:
              </span>
              <span className="font-bold text-white">{displayPhone || "No direct phone listed"}</span>
            </div>

            {waDigits && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp:
                </span>
                <a
                  href={`https://wa.me/${waDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  +{waDigits} <span className="text-[10px] font-normal text-emerald-300">(Open Chat)</span>
                </a>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-teal-400" /> Location:
              </span>
              <span className="font-bold text-slate-200">{company.city ? `${company.city}, Oman` : "Muscat & Regional, Oman"}</span>
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
              <FileText className="h-3.5 w-3.5 text-amber-700" /> Pre-Researched Observation
            </span>
            <p className="text-xs text-amber-950 font-bold leading-relaxed">
              &ldquo;{cleanObs}&rdquo;
            </p>
          </div>

          {/* Research Block 2: Discovery & Qualification Checklist */}
          {qualification && (
            <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-200/80 space-y-1.5">
              <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-indigo-700" /> Discovery & Qualification Criteria
              </span>
              <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                {qualification}
              </p>
            </div>
          )}

          {/* Research Block 3: Operational Guardrails & Execution Notes */}
          {executionNote && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-slate-600" /> Execution Notes & Verification
              </span>
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {executionNote}
              </p>
            </div>
          )}

          {/* Research Block 4: Multi-Touch Sequence (Touches 1-4) */}
          {staged && (
            <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200 space-y-3">
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-teal-600" /> Pre-Staged Multi-Touch Cadence Sequence
              </span>

              <div className="space-y-2.5 text-xs">
                {staged.touch_1?.message && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[9px] font-black text-teal-700 uppercase tracking-wider block mb-1">
                      Touch 1: Human Opener (Zero Pitch)
                    </span>
                    <p className="text-slate-800 italic leading-relaxed">&ldquo;{staged.touch_1.message}&rdquo;</p>
                  </div>
                )}

                {staged.touch_2?.message && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block mb-1">
                      Touch 2: Warm-up & Value Observation (Day +3)
                    </span>
                    <p className="text-slate-800 italic leading-relaxed">&ldquo;{staged.touch_2.message}&rdquo;</p>
                  </div>
                )}

                {staged.touch_3?.message && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider block mb-1">
                      Touch 3: Transition & Inquiry Question (Day +5)
                    </span>
                    <p className="text-slate-800 italic leading-relaxed">&ldquo;{staged.touch_3.message}&rdquo;</p>
                  </div>
                )}

                {staged.touch_4?.message && (
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200/80">
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider block mb-1">
                      Touch 4: Muscat Coffee CTA (Day +7)
                    </span>
                    <p className="text-slate-800 italic leading-relaxed">&ldquo;{staged.touch_4.message}&rdquo;</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Research Block 5: Cold Call 30-Second Script */}
          {staged?.cold_call_script && (
            <div className="bg-teal-50/70 rounded-2xl p-4 border border-teal-200 space-y-2">
              <span className="text-[10px] font-black text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-teal-700" /> Cold Call 30-Second Phone Script
              </span>
              <div className="space-y-1.5 text-xs text-teal-950">
                <p><strong>1. Opener:</strong> &ldquo;{staged.cold_call_script.opener}&rdquo;</p>
                {staged.cold_call_script.context_bridge && (
                  <p><strong>2. Context Bridge:</strong> &ldquo;{staged.cold_call_script.context_bridge}&rdquo;</p>
                )}
                {staged.cold_call_script.close_for_coffee && (
                  <p><strong>3. Coffee Invitation:</strong> &ldquo;{staged.cold_call_script.close_for_coffee}&rdquo;</p>
                )}
              </div>
            </div>
          )}

          {/* Research Block 6: Custom Notes */}
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
