"use client";

import { useState } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  HelpCircle,
  ShieldAlert,
  Calendar,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { Company, Contact, Activity, OutreachPreparation } from "@/lib/types/database";

interface LeadAICopilotProps {
  company: Company;
  primaryContact: Contact | null;
  activities: Activity[];
  preparations: OutreachPreparation[];
}

export function LeadAICopilot({
  company,
  primaryContact,
  activities,
  preparations
}: LeadAICopilotProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: `Hi! I'm your AI Sales Assistant for **${company.company_name}**.\n\nI have full context of this lead:\n` +
               `• Industry: ${company.industry || "General"}\n` +
               `• Contact: ${primaryContact?.full_name || "Primary Lead"} (${primaryContact?.title || "Decision Maker"})\n` +
               `• Status: ${company.status.toUpperCase()}\n` +
               `• Activity Count: ${activities.length} recorded interactions\n\n` +
               `How can I assist you right now? Try asking:\n` +
               `- "What should I say on a phone call with ${company.company_name}?"\n` +
               `- "They said pricing is too high. How should I respond?"\n` +
               `- "Draft a personalized WhatsApp follow-up message."`
    }
  ]);

  const quickQuestions = [
    "What should I say to this prospect on a call?",
    "How to handle 'already have someone' objection?",
    "Draft a personalized WhatsApp follow-up",
    "Summarize this prospect's history and best next step"
  ];

  const handleAsk = async (queryText?: string) => {
    const textToAsk = queryText || prompt.trim();
    if (!textToAsk || loading) return;

    const userMsg = { role: "user" as const, content: textToAsk };
    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setPrompt("");
    setLoading(true);

    try {
      // Call server action / AI endpoint with full context
      const res = await fetch("/api/ai/lead-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          prompt: textToAsk,
          company,
          primaryContact,
          activitiesSummary: activities.slice(0, 10).map(a => `${a.created_at.split("T")[0]}: ${a.title} - ${a.description}`).join("\n")
        })
      });

      if (!res.ok) {
        throw new Error("AI request failed");
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "I've analyzed the lead context and generated recommendations above." }]);
    } catch (err) {
      // Fallback smart response using local context if API unavailable
      const fallbackReply = generateFallbackAIReply(textToAsk, company, primaryContact, activities);
      setMessages(prev => [...prev, { role: "assistant", content: fallbackReply }]);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackAIReply = (q: string, comp: Company, contact: Contact | null, acts: Activity[]) => {
    const qLower = q.toLowerCase();
    const cName = contact?.full_name || "the prospect";
    const compName = comp.company_name;

    if (qLower.includes("say") || qLower.includes("call") || qLower.includes("script")) {
      return `**Recommended Calling Strategy for ${compName}**\n\n` +
             `1. **Greeting**: "Hi ${cName}, this is Ramij from Tadbeer Transformation."\n` +
             `2. **Value Hook**: "I noticed ${compName}'s work in ${comp.industry || "your market"}. We've helped similar businesses automate WhatsApp lead routing and cut response times by 80%."\n` +
             `3. **Qualifying Question**: "Are you currently managing inquiry follow-ups manually, or do you have a dedicated system?"\n` +
             `4. **Meeting Ask**: "Could we block 15 minutes this Thursday for a quick demo of how this applies to ${compName}?"`;
    } else if (qLower.includes("price") || qLower.includes("objection") || qLower.includes("high")) {
      return `**Objection Handling Guide for ${compName}**\n\n` +
             `"I completely understand budget is top of mind ${cName}. Many of our clients thought the same until they saw that Tadbeer TT CRM pays for itself in week 1 by converting leads that would otherwise drop off.\n\n` +
             `Can I send you a 1-page ROI breakdown specific to ${compName}'s scale?"`;
    } else if (qLower.includes("whatsapp") || qLower.includes("follow-up") || qLower.includes("message")) {
      return `**Tailored WhatsApp Message for ${cName}**\n\n` +
             `"Hi ${cName}! Following up on ${compName}'s sales workflow optimization. We currently have a complimentary 15-minute digital growth audit slot available for your team. Would Thursday at 11 AM work?"`;
    } else {
      return `**Prospect Intelligence Summary for ${compName}**\n\n` +
             `• **Current Status**: ${comp.status.toUpperCase()}\n` +
             `• **Primary Contact**: ${cName} (${contact?.title || "Key Executive"})\n` +
             `• **Recorded Interactions**: ${acts.length} touchpoints logged\n\n` +
             `**Recommended Next Step**: Call ${cName} directly or send the tailored WhatsApp follow-up above.`;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 font-sans flex flex-col h-[550px]">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
            <Bot className="h-4 w-4 text-teal-400" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              AI Sales Copilot (Full Lead Context)
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time advice grounded in {company.company_name}'s complete history
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick Prompts Ribbon ────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 shrink-0">
        {quickQuestions.map((qq, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(qq)}
            className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 hover:border-teal-200 text-slate-700 font-semibold text-[10px] rounded-lg cursor-pointer whitespace-nowrap transition-all"
          >
            {qq}
          </button>
        ))}
      </div>

      {/* ── Chat Messages Container ────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-slate-50 rounded-xl border border-slate-200/80">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="h-7 w-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <Bot className="h-3.5 w-3.5 text-teal-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-slate-900 text-white font-medium rounded-tr-xs"
                  : "bg-white border border-slate-200 text-slate-800 font-medium shadow-2xs rounded-tl-xs whitespace-pre-wrap"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="h-7 w-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
            <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
            <span>Analyzing lead history & generating response...</span>
          </div>
        )}
      </div>

      {/* ── Input Box ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-200 shrink-0">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder={`Ask AI anything about pitching ${company.company_name}...`}
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-teal-500"
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading || !prompt.trim()}
          className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <span>Ask AI</span>
          <Send className="h-3.5 w-3.5 text-teal-400" />
        </button>
      </div>
    </div>
  );
}
