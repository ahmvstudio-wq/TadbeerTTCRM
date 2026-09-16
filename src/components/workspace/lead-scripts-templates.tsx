"use client";

import { useState } from "react";
import {
  FileText,
  Copy,
  Check,
  Phone,
  MessageCircle,
  Globe2,
  Camera,
  Mail,
  Send
} from "lucide-react";
import { Company, Contact } from "@/lib/types/database";
import { addCompanyActivity } from "@/lib/actions/companies";

interface LeadScriptsTemplatesProps {
  company: Company;
  primaryContact: Contact | null;
  onRefresh?: () => void;
}

export function LeadScriptsTemplates({
  company,
  primaryContact,
  onRefresh
}: LeadScriptsTemplatesProps) {
  const [selectedChannel, setSelectedChannel] = useState<"whatsapp" | "cold_call" | "linkedin" | "instagram" | "email">("whatsapp");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const contactName = primaryContact?.full_name || "Decision Maker";
  const companyName = company.company_name;
  const industry = company.industry || "your industry";

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogSent = async (templateName: string, text: string) => {
    await addCompanyActivity(
      company.id,
      `Outreach Template Sent: ${templateName}`,
      `Channel: ${selectedChannel.toUpperCase()}\nTemplate: ${templateName}\n\nContent:\n"${text}"`,
      "outreach_sent"
    );
    if (onRefresh) onRefresh();
  };

  // Extract staged sequence if available
  let stagedSeq: any = null;
  try {
    if ((company as any).research_json && typeof (company as any).research_json === 'object') {
      stagedSeq = (company as any).research_json.staged_sequence;
    } else if (company.notes && (company.notes.startsWith('{') || company.notes.startsWith('['))) {
      stagedSeq = JSON.parse(company.notes)?.staged_sequence;
    }
  } catch {}

  const observation = (company as any).research_json?.specific_observation || "your active presence and high quality standards";

  // Generate channel-specific tailored templates according to Oman Operating System
  const getTailoredTemplates = () => {
    const t1 = stagedSeq?.touch_1?.message || `Assalamu Alaikum ${contactName}, I was looking at ${companyName}'s work in ${industry} and noticed ${observation}.\n\nWho is the best person on your team to speak with about operations and customer inquiries in Muscat?`;
    const t2 = stagedSeq?.touch_2?.message || `Hi ${contactName}, following up on my previous note. We've been observing how top ${industry} businesses in Muscat handle customer response times and booking flow.\n\nWould you be open to a casual 15-minute coffee sit-down sometime this week?`;
    const t3 = stagedSeq?.touch_3?.message || `Hi ${contactName}, one thing we notice with ${industry} operations is how quickly inquiries can drop off during peak hours without dedicated response automation.\n\nAre you guys handling direct messages in-house or through staff?`;
    const t4 = stagedSeq?.touch_4?.message || `Hi ${contactName}, I'm going to be around Muscat this week. Would love to buy you a 20-minute coffee just to share a few observations on what's working for local ${industry} brands. How does Thursday look?`;

    const ccOpener = stagedSeq?.cold_call_script?.opener || `Assalamu Alaikum ${contactName}, am I speaking with the owner or manager for ${companyName}?`;
    const ccBridge = stagedSeq?.cold_call_script?.context_bridge || `I was reviewing your business in ${industry} and noticed ${observation}. I work with local leaders in Muscat optimizing customer inquiry conversion.`;
    const ccClose = stagedSeq?.cold_call_script?.close_for_coffee || `I'm going to be around your area in Muscat this Thursday — would you be open to a casual 20-minute coffee just to share observations?`;

    switch (selectedChannel) {
      case "whatsapp":
        return [
          {
            id: "wa_t1",
            title: "Touch 1: Human Opener (Zero Pitch)",
            body: t1
          },
          {
            id: "wa_t2",
            title: "Touch 2: Warm-up & Positioning (Day +3)",
            body: t2
          },
          {
            id: "wa_t3",
            title: "Touch 3: Transition & Operational Angle (Day +5)",
            body: t3
          },
          {
            id: "wa_t4",
            title: "Touch 4: Muscat Coffee CTA (Day +7)",
            body: t4
          }
        ];

      case "cold_call":
        return [
          {
            id: "cc_1",
            title: "Oman 30-Second Cold Call Script (Permission → Observation → Coffee)",
            body: `[1. Permission & Greeting]:\n"${ccOpener} Do you have 30 seconds?"\n\n` +
                  `[2. Context & Observation Bridge]:\n"${ccBridge}"\n\n` +
                  `[3. Muscat Coffee Invitation]:\n"${ccClose}"`
          },
          {
            id: "cc_obj1",
            title: "Objection Battlecard: 'Send profile on WhatsApp'",
            body: `"I can certainly send you a note on WhatsApp. But since every business operations are unique, a quick 10-minute sit-down or call is usually 10x more useful. Are you free Thursday morning or afternoon?"`
          },
          {
            id: "cc_obj2",
            title: "Objection Battlecard: 'We already have an agency / system'",
            body: `"Completely understand ${contactName}. Most leaders we speak with already have partners. We're not asking you to replace anyone — simply sharing what we're seeing across top ${industry} brands in Muscat over coffee."`
          }
        ];

      case "instagram":
        return [
          {
            id: "ig_t1",
            title: "Touch 1: Instagram DM Human Opener",
            body: t1
          },
          {
            id: "ig_t2",
            title: "Touch 2: Warm-up & Positioning (Day +3)",
            body: t2
          },
          {
            id: "ig_t3",
            title: "Touch 3: Transition & Inquiry Question (Day +5)",
            body: t3
          },
          {
            id: "ig_t4",
            title: "Touch 4: Direct Coffee CTA (Day +7)",
            body: t4
          }
        ];

      case "linkedin":
        return [
          {
            id: "li_1",
            title: "LinkedIn Executive Note",
            body: `Assalamu Alaikum ${contactName}, impressed by ${companyName}'s growth in ${industry}. Would love to connect and exchange observations on operations in the Oman market.`
          }
        ];

      case "email":
        return [
          {
            id: "em_1",
            title: "Direct Executive Observation",
            body: `Subject: Observation regarding ${companyName}'s operations in Muscat\n\nAssalamu Alaikum ${contactName},\n\nI was reviewing ${companyName} and was impressed by your presence in ${industry}. Specifically noticed ${observation}.\n\nI'm based in Muscat and work with business owners optimizing front-desk customer flow and response times. Would you be open to a casual 20-minute coffee this week in Qurum or Al Mouj?\n\nBest regards,\nRamij | Tadbeer Transformation`
          }
        ];
    }
  };

  const templates = getTailoredTemplates();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-teal-600" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Outreach Scripts & Templates
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Personalized for {companyName}
        </span>
      </div>

      {/* ── Channel Selector Tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
          { id: "cold_call", label: "Cold Call Script", icon: Phone },
          { id: "linkedin", label: "LinkedIn", icon: Globe2 },
          { id: "instagram", label: "Instagram DM", icon: Camera },
          { id: "email", label: "Email", icon: Mail }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedChannel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedChannel(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Template Cards ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">
                {tpl.title}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(tpl.body, tpl.id)}
                  className="px-2.5 py-1 text-[10px] font-extrabold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === tpl.id ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" /> Copy Script
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleLogSent(tpl.title, tpl.body)}
                  className="px-2.5 py-1 text-[10px] font-extrabold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Send className="h-3 w-3" /> Log as Sent
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80 whitespace-pre-wrap">
              {tpl.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
