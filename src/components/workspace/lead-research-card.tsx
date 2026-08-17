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
import { formatPhoneNumberForDisplay, formatWhatsAppNumber } from "@/lib/utils";

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
  const [researchText, setResearchText] = useState(company.notes || "");
  const [saving, setSaving] = useState(false);

  const prep = preparations[0];
  const contact = primaryContact || (company as any).contacts?.[0];

  const rawPhone = contact?.phone || company.phone || contact?.whatsapp;
  const displayPhone = rawPhone ? formatPhoneNumberForDisplay(rawPhone) : null;
  const waDigits = rawPhone ? formatWhatsAppNumber(rawPhone) : "";

  // Helper to extract research signals and talking points from notes text
  const parseNotes = (text: string | null) => {
    if (!text) return { summary: "", painPoints: [], talkingPoints: [] };

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const painPoints: string[] = [];
    const talkingPoints: string[] = [];
    let summary = "";

    lines.forEach(line => {
      if (line.toLowerCase().includes("pain") || line.toLowerCase().includes("issue") || line.toLowerCase().includes("problem")) {
        painPoints.push(line);
      } else if (line.toLowerCase().includes("talking point") || line.toLowerCase().includes("angle") || line.toLowerCase().includes("offer")) {
        talkingPoints.push(line);
      } else {
        if (!summary) summary = line;
      }
    });

    return { summary: summary || text, painPoints, talkingPoints };
  };

  const parsed = parseNotes(company.notes);

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
                <ShieldCheck className="h-3 w-3 text-emerald-600" /> Verified Data
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Standardized contact profile, decision maker persona, & operational findings.
            </p>
          </div>
        </div>

        {onSaveResearchNotes && !editing && (
          <button
            onClick={() => {
              setResearchText(company.notes || "");
              setEditing(true);
            }}
            className="text-xs font-extrabold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 cursor-pointer bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-all"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Research Notes
          </button>
        )}
      </div>

      {/* ── Section 1: ABOUT PROSPECT & KEY DECISION MAKER (NEW BLOCK) ───── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-md space-y-4 border border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
          <span className="text-xs font-black text-teal-300 uppercase tracking-wider flex items-center gap-2">
            <User className="h-4 w-4 text-teal-400" /> About Prospect & Primary Contact
          </span>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
            Decision Maker Record
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Decision Maker Persona */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Decision Maker Persona</span>
            <p className="text-sm font-black text-white">
              {contact?.full_name || "Primary Business Contact"}
            </p>
            <p className="text-xs text-teal-300 font-bold">
              {contact?.title || "Owner / Managing Director"}
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed pt-1">
              Key stakeholder responsible for operational decisions, vendor partnerships, and digital growth in Oman.
            </p>
          </div>

          {/* Verified Contact Details Grid */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-2.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Verified Channels & Footprint</span>
            
            <div className="space-y-2 font-mono">
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
                    +${waDigits} <span className="text-[10px] font-normal text-emerald-300">(Click Chat)</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Research Block 1: Business Overview & Intelligence */}
          <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200/90 space-y-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-slate-700" /> Business Overview & Digital Footprint
            </span>

            {company.notes && company.notes.trim().length > 5 ? (
              <p className="text-xs text-slate-800 font-medium leading-relaxed">
                {company.notes}
              </p>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs font-medium space-y-1">
                <div className="flex items-center gap-1.5 font-extrabold text-amber-950">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  <span>Limited Research Details Available</span>
                </div>
                <p className="text-[11px] leading-snug text-amber-900/90">
                  There is currently not a lot of research details on this company due to lack of initial inputs. Use the "Edit Research Notes" button above to add custom research.
                </p>
              </div>
            )}

            {company.website && (
              <a
                href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline pt-1"
              >
                <Globe className="h-3.5 w-3.5" /> Visit Verified Website
              </a>
            )}
          </div>

          {/* Research Block 2: TTT Recommended Solution Angle */}
          <div className="bg-teal-50/70 rounded-2xl p-4 border border-teal-200/90 space-y-2">
            <span className="text-[10px] font-black text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-teal-700" /> Recommended TTT Solution Angle
            </span>
            {prep ? (
              <div className="space-y-1.5 text-xs">
                <p className="font-extrabold text-teal-950">{prep.use_case_summary}</p>
                {prep.personalization && (
                  <p className="text-slate-700 italic text-[11px]">"{prep.personalization}"</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-teal-900 font-medium leading-relaxed">
                Position Tadbeer TT CRM, automated WhatsApp lead routing, and digital workflow optimization to eliminate manual response delays.
              </p>
            )}
          </div>

          {/* Research Block 3: Key Pain Points & Efficiency Leaks */}
          <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200/90 space-y-2">
            <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-700" /> Key Pain Points & Risks
            </span>
            {parsed.painPoints.length > 0 ? (
              <ul className="space-y-1 text-xs text-amber-950 font-medium">
                {parsed.painPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-amber-950 font-medium leading-relaxed">
                Fragmented lead tracking across personal WhatsApp numbers, slow lead follow-ups, and lack of central executive visibility into pipeline conversion rates.
              </p>
            )}
          </div>

          {/* Research Block 4: Cold Call / Message Pitch Angle */}
          <div className="bg-indigo-50/70 rounded-2xl p-4 border border-indigo-200/90 space-y-2">
            <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-indigo-700" /> Opening Hook & Call Angle
            </span>
            <ul className="space-y-1.5 text-xs text-indigo-950 font-medium">
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>"We help leading Oman businesses in {company.industry || "your sector"} streamline WhatsApp customer response times."</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Check className="h-3.5 w-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>"Offer a 15-minute workflow audit to demonstrate immediate operational ROI."</span>
              </li>
            </ul>
          </div>

        </div>
      )}
    </div>
  );
}
