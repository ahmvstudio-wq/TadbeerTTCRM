"use client";

import { useState } from "react";
import { X, Copy, Check, PhoneCall, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ScriptContext {
  companyName: string;
  industry?: string;
  handle?: string;
  painPoint?: string;
  prospectReply?: string;
  openingLine?: string;
  sdrName?: string;
}

interface ScriptFramework {
  id: string;
  master: string;
  title: string;
  badge: string;
  tagline: string;
  steps: {
    phase: string;
    heading: string;
    text: string;
  }[];
}

export function getFrameworks(ctx: ScriptContext): ScriptFramework[] {
  const co = ctx.companyName || "your company";
  const ind = ctx.industry || "your industry";
  const pain = ctx.painPoint || "operational bottlenecks and manual workflow friction";
  const reply = ctx.prospectReply || "looking for ways to optimize operations";
  const opening = ctx.openingLine || `Hi, this is Dr. from Tadbeer — you spoke with our team earlier regarding ${co}...`;
  const sdr = ctx.sdrName || "Tadbeer Representative";

  return [
    {
      id: "tadbeer_ismail",
      master: "Tadbeer (Ismail)",
      title: "Value & GCC Transformation Script",
      badge: "Recommended",
      tagline: "Directly bridges DM/Outreach context into a warm, authoritative evening call by Dr.",
      steps: [
        {
          phase: "1. The Context Opener (Zero Cold Start)",
          heading: "Opening Line for Dr.",
          text: opening,
        },
        {
          phase: "2. The Context Bridge",
          heading: "Acknowledge Prior Outreach",
          text: `Our team logged that you mentioned "${reply}". At Tadbeer Transformations (Madinat Qaboos), we specialize in helping leading ${ind} companies in Muscat solve ${pain} without inflating team headcount.`,
        },
        {
          phase: "3. Executive Consultation CTA",
          heading: "Lock In Consultation",
          text: `I'd love to prepare a 15-minute executive briefing specifically tailored for ${co}, showing how we deploy custom automated systems for GCC businesses. Would Thursday morning or afternoon work better on your calendar?`,
        },
      ],
    },
    {
      id: "jordan_belfort",
      master: "Jordan Belfort",
      title: "Straight Line Persuasion (The 3 Tens)",
      badge: "High Certainty",
      tagline: "Builds absolute certainty in the Product, You, and Company within 60 seconds.",
      steps: [
        {
          phase: "1. Sharp & Enthusiastic Opener",
          heading: "Immediate Authority",
          text: `Hi, this is ${sdr} with Tadbeer Transformations out in Madinat Qaboos. The reason for my call today is simple — we've been working with several leading ${ind} enterprises in Muscat, helping them eliminate operational friction. If I caught you with 30 seconds, I'd love to share why ${co} came up on our radar.`,
        },
        {
          phase: "2. Establish Certainty (Product & Pain)",
          heading: "Position Solution",
          text: `From our initial analysis of ${co}, we noticed ${pain}. When top ${ind} firms fix this with custom system architecture, productivity doubles overnight. Does that sound like something you're focused on this quarter?`,
        },
        {
          phase: "3. Close for the Micro-Commitment",
          heading: "No-Brainer Next Step",
          text: `Fair enough. Look, I don't expect you to make a decision right now. How about we schedule a quick 10-minute discovery briefing this Thursday at 11 AM? I'll walk you through our exact blueprint for ${co}. Sound fair?`,
        },
      ],
    },
    {
      id: "jeremy_miner",
      master: "Jeremy Miner",
      title: "NEPQ (Neuro-Linguistic Problem Awareness)",
      badge: "Disarms Resistance",
      tagline: "Uses neutral framing and consequence questions to make the prospect self-persuade.",
      steps: [
        {
          phase: "1. Disarming Low-Pressure Opener",
          heading: "Neutral Permission",
          text: `Hi, it's ${sdr} from Tadbeer. I know I probably caught you right in the middle of your day... do you have 30 seconds to tell me if it makes sense to talk, or should I hang up?`,
        },
        {
          phase: "2. Situation & Problem Questions",
          heading: "Uncover Friction",
          text: `We've been speaking with a lot of ${ind} executives across Oman recently. Most tell us they're struggling with ${pain}. How are you currently managing that at ${co}?`,
        },
        {
          phase: "3. Consequence & Micro-Commitment",
          heading: "Expose Cost of Inaction",
          text: `What happens if you leave that unaddressed over the next 6 months as ${co} scales? ... Would you be open to taking a quick look at how we eliminated that exact gap for similar GCC companies?`,
        },
      ],
    },
    {
      id: "josh_braun",
      master: "Josh Braun",
      title: "Pattern Interrupt & Low-Pressure Discovery",
      badge: "Respectful",
      tagline: "Breaks the traditional sales script pattern and seeks truth over pushy selling.",
      steps: [
        {
          phase: "1. Pattern Interrupt Permission",
          heading: "Full Disclosure",
          text: `Hi, full disclosure — this is a cold call. You can hang up right now, or give me 20 seconds to explain why I called ${co} today. What would you like to do?`,
        },
        {
          phase: "2. Problem Hypothesis",
          heading: "Test the Pain Point",
          text: `I noticed ${co} is growing fast in the ${ind} space. Typically when companies reach this point, they hit a wall with ${pain}. Is that something on your radar at all, or am I way off base?`,
        },
        {
          phase: "3. Frictionless Resource Offer",
          heading: "Low-Friction Value",
          text: `No pressure at all. I have a 2-page transformation breakdown showing how we fixed this for a similar firm in Muscat. Can I drop that over on WhatsApp for you to glance at?`,
        },
      ],
    },
    {
      id: "david_sandler",
      master: "David Sandler",
      title: "Sandler Pain Funnel & Upfront Contract",
      badge: "Qualifies Hard",
      tagline: "Establishes a firm upfront contract and dives deep into the prospect's true commercial pain.",
      steps: [
        {
          phase: "1. The Upfront Contract",
          heading: "Mutual Agreement",
          text: `Hi, this is ${sdr} from Tadbeer. Before I say anything, let's make an agreement: I'll take 45 seconds to explain why I called. At the end, you can tell me 'Yes, let me see more' or 'No, not interested', and I promise I won't pester you. Is that fair?`,
        },
        {
          phase: "2. The Pain Funnel Question",
          heading: "Pinpoint Primary Pain",
          text: `In our work with ${ind} leadership in Oman, they usually come to us with 3 big challenges: ${pain}, loss of operational visibility, or scaling delays. Which of those is hurting ${co} the most right now?`,
        },
        {
          phase: "3. Upfront Commitment",
          heading: "Lock Next Step",
          text: `If we could eliminate that exact friction for ${co}, would it be worth 15 minutes of your time to see how?`,
        },
      ],
    },
    {
      id: "grant_cardone",
      master: "Grant Cardone",
      title: "10X High Energy & Direct Value",
      badge: "High Urgency",
      tagline: "Bold, fast-paced approach focused on high ROI and immediate market dominance.",
      steps: [
        {
          phase: "1. Bold & High Energy Opener",
          heading: "Immediate Impact",
          text: `This is ${sdr} with Tadbeer Transformations in Muscat! I'm calling you directly because we're doubling the operational efficiency of top ${ind} firms in the region, and I knew ${co} needed to be next.`,
        },
        {
          phase: "2. The 10X Value Statement",
          heading: "Bold Result",
          text: `We built an automated system architecture that eliminates ${pain} 10x faster than traditional software agencies. We're booking executive briefings for this week.`,
        },
        {
          phase: "3. Assumptive Close",
          heading: "Choice of Two Times",
          text: `I need 10 minutes on your calendar tomorrow morning. Do you have your calendar handy — is 10:00 AM or 2:00 PM better for you?`,
        },
      ],
    },
    {
      id: "tony_hughes",
      master: "Tony Hughes",
      title: "Research-Led & Trigger Event Opening",
      badge: "Executive Level",
      tagline: "Leads with tailored research, market intelligence, and trigger events.",
      steps: [
        {
          phase: "1. Research & Trigger Reference",
          heading: "Relevant Context",
          text: `Hi, I was researching ${co} in the ${ind} market and noticed your recent expansion. I'm calling because rapid growth in your space almost always creates friction around ${pain}.`,
        },
        {
          phase: "2. Market Insight Hook",
          heading: "Benchmark Value",
          text: `We recently published an operational benchmark report for Omani ${ind} enterprises showing how custom workflows reduced operational overhead by 34%.`,
        },
        {
          phase: "3. Executive Peer Briefing",
          heading: "Peer Exchange",
          text: `Would you be open to a 10-minute peer exchange to see how ${co} benchmarks against top performers in Muscat?`,
        },
      ],
    },
    {
      id: "relationship_first",
      master: "Relationship-First",
      title: "Warm GCC Rapport & Local Context",
      badge: "Muscat Preferred",
      tagline: "Emphasizes respect, local GCC business etiquette, and long-term partnership.",
      steps: [
        {
          phase: "1. Respectful Local Greeting",
          heading: "GCC Etiquette",
          text: `Assalamu Alaikum / Good day, this is ${sdr} from Tadbeer Transformations in Muscat. I hope your week is off to a successful start.`,
        },
        {
          phase: "2. Respect for the Business",
          heading: "Warm Rapport",
          text: `We have great respect for what ${co} has built in the ${ind} space here in Oman. The reason I reached out is to introduce our local team and share how we support GCC business leaders in overcoming ${pain}.`,
        },
        {
          phase: "3. Warm Coffee / Call Invitation",
          heading: "Local Hospitality",
          text: `We'd love to invite you for coffee at our Madinat Qaboos office or host a short 10-minute call to exchange ideas. Would you be open to connecting later this week?`,
        },
      ],
    },
  ];
}

export function ColdCallScriptModal({
  ctx,
  onClose,
}: {
  ctx: ScriptContext;
  onClose: () => void;
}) {
  const frameworks = getFrameworks(ctx);
  const [activeId, setActiveId] = useState<string>(frameworks[0].id);
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  const selected = frameworks.find((f) => f.id === activeId) || frameworks[0];

  const handleCopy = (text: string, stepId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const handleCopyFullScript = () => {
    const fullText = selected.steps
      .map((s) => `[${s.phase}]\n${s.text}`)
      .join("\n\n");
    navigator.clipboard.writeText(fullText);
    setCopiedStep("full");
    setTimeout(() => setCopiedStep(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Minimal Slate Header matching LogModal */}
        <div className="bg-slate-50 text-slate-900 border-b border-slate-100 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-slate-200/70 text-slate-700 rounded-xl flex items-center justify-center">
              <PhoneCall className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-sm text-slate-900">Cold Call Script Engine</p>
                <span className="text-[10px] font-extrabold bg-slate-200/60 text-slate-700 border border-slate-300/60 px-2 py-0.5 rounded-full">
                  8 Master Frameworks
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Calling prospect: <span className="font-bold text-slate-900">{ctx.companyName}</span> ({ctx.industry || "General"})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body: Sidebar + Main Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* Frameworks List (Sidebar) */}
          <div className="w-full md:w-72 bg-slate-50/50 border-r border-slate-100 p-3 space-y-1.5 overflow-y-auto max-h-48 md:max-h-none flex-shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2 py-1">
              Select Framework / Author
            </p>
            {frameworks.map((fw) => {
              const isActive = fw.id === activeId;
              return (
                <button
                  key={fw.id}
                  onClick={() => setActiveId(fw.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1",
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black truncate">{fw.master}</span>
                    <span
                      className={cn(
                        "text-[9px] font-extrabold px-2 py-0.5 rounded-full border",
                        isActive
                          ? "bg-white/20 text-white border-white/30"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      )}
                    >
                      {fw.badge}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-bold leading-tight truncate",
                      isActive ? "text-slate-200" : "text-slate-800"
                    )}
                  >
                    {fw.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Script Content Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-white">
            
            {/* Minimal Framework Banner */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{selected.master}</p>
                <h3 className="text-base font-extrabold text-slate-900">{selected.title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{selected.tagline}</p>
              </div>
              <Button
                onClick={handleCopyFullScript}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs h-9 px-4 rounded-xl shadow-xs shrink-0"
              >
                {copiedStep === "full" ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1.5" /> Copied Full Script!
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Entire Script
                  </>
                )}
              </Button>
            </div>

            {/* Context Pills */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Prospect Industry</span>
                <span className="font-extrabold text-slate-900">{ctx.industry || "General"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Identified Pain Point</span>
                <span className="font-extrabold text-amber-700 truncate block">{ctx.painPoint || "Not specified (using default)"}</span>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {selected.steps.map((st, idx) => (
                <div key={idx} className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{st.phase}</span>
                      <h4 className="text-xs font-extrabold text-slate-900">{st.heading}</h4>
                    </div>
                    <button
                      onClick={() => handleCopy(st.text, `step_${idx}`)}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      {copiedStep === `step_${idx}` ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                      {copiedStep === `step_${idx}` ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 font-medium leading-relaxed shadow-xs">
                    "{st.text}"
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Footer matching LogModal */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between flex-shrink-0 text-xs">
          <p className="text-slate-500 font-medium">
            All placeholders automatically pre-filled for <span className="font-extrabold text-slate-900">{ctx.companyName}</span>.
          </p>
          <Button onClick={onClose} className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs h-9 px-5 rounded-xl">
            Close Engine
          </Button>
        </div>

      </div>
    </div>
  );
}
