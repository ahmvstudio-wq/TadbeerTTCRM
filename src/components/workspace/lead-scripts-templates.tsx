"use client";

import { useState } from "react";
import {
  FileText,
  Copy,
  Check,
  Sparkles,
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

  // Generate channel-specific tailored templates
  const getTailoredTemplates = () => {
    switch (selectedChannel) {
      case "whatsapp":
        return [
          {
            id: "wa_1",
            title: "Direct Value Offer (Free Website/Audit)",
            body: `Hi ${contactName}, I noticed ${companyName}'s digital presence in the ${industry} space. We're currently working with companies in your market to double lead response rates using Tadbeer TT CRM and automated WhatsApp routing. Would you be open to a quick 5-min chat this week?`
          },
          {
            id: "wa_2",
            title: "Short Curiosity Follow-Up",
            body: `Hi ${contactName}, just wanted to check if you had a moment to review my earlier message regarding ${companyName}'s digital transformation? We have 2 slots open this week for complimentary audits.`
          }
        ];

      case "cold_call":
        return [
          {
            id: "cc_1",
            title: "High-Converting Cold Call Script (Ramij Framework)",
            body: `[Greeting]: Hi ${contactName}, am I speaking with the owner / lead for ${companyName}?\n` +
                  `[Permission]: Is this a good time to speak for just 60 seconds?\n` +
                  `[Intro]: My name is Ramij from Tadbeer Transformation. We help businesses in ${industry} scale their sales operations and lead handling.\n` +
                  `[Qualifying Question]: Are you currently handling your customer inquiries manually or looking to automate lead routing?\n` +
                  `[Meeting Ask]: Would you be open to a short 15-minute demo meeting this Thursday to see how this works for your team?`
          },
          {
            id: "cc_2",
            title: "Objection Response: 'We already have a system'",
            body: `"That's completely understandable ${contactName}. Most of our clients were already using basic tools before switching to Tadbeer's unified WhatsApp workflow. Would you be open to seeing a 2-minute comparison deck before deciding?"`
          }
        ];

      case "linkedin":
        return [
          {
            id: "li_1",
            title: "Connection & Partnership Pitch",
            body: `Hi ${contactName}, impressed by ${companyName}'s growth in ${industry}. We're helping leadership teams unify their multi-channel sales history and lead tracking into a single workspace. Great to connect!`
          }
        ];

      case "instagram":
        return [
          {
            id: "ig_1",
            title: "Instagram DM Opening Script",
            body: `Hey ${contactName}! Love the content on ${companyName}'s page. Quick question: how are you currently managing lead inquiries coming in through Instagram & WhatsApp?`
          }
        ];

      case "email":
        return [
          {
            id: "em_1",
            title: "Formal Executive Intro",
            body: `Subject: Digital Transformation Opportunity for ${companyName}\n\nDear ${contactName},\n\nI hope this email finds you well.\n\nWe specialize in assisting ${industry} organizations streamline their sales workflows, unify customer interaction history, and implement automated lead follow-ups.\n\nWould you have 15 minutes available for a brief introductory call this week?\n\nBest regards,\nTadbeer Transformation Team`
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
