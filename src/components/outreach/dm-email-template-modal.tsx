"use client";

import { useState } from "react";
import { X, Copy, Check, MessageSquare, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PLAYBOOK_TEMPLATES } from "@/lib/outreach-messages-library";

export interface TemplateContext {
  companyName: string;
  industry?: string;
  contactName?: string;
  channel?: string;
  handle?: string;
}

type TabType = "approaches" | "objections" | "followUps";

export function DMEmailTemplateModal({
  ctx,
  onClose,
}: {
  ctx: TemplateContext;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<TabType>("approaches");
  const [activeId, setActiveId] = useState<string>(PLAYBOOK_TEMPLATES.approaches[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // AI Scraper State
  const initialUrl = (ctx.handle && ctx.handle.startsWith('http')) 
    ? ctx.handle 
    : (ctx.channel === 'instagram_dm' && ctx.handle && !/^[\d\+\-\s\(\)]+$/.test(ctx.handle)) 
      ? `https://instagram.com/${ctx.handle.replace('@', '')}` 
      : "";
      
  const [scrapeUrl, setScrapeUrl] = useState(initialUrl);
  const [generatingAI, setGeneratingAI] = useState(false);
  
  // Variables state
  const [variables, setVariables] = useState<Record<string, string>>({
    Company: ctx.companyName,
    Name: ctx.contactName || "Contact",
    sector: ctx.industry || "industry",
  });

  const handleVarChange = (key: string, value: string) => {
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  const getList = () => PLAYBOOK_TEMPLATES[activeTab];
  const selected = getList().find((t) => t.id === activeId) || getList()[0];

  const getFilledTemplate = (template: string) => {
    let result = template;
    selected.variables.forEach((v) => {
      const val = variables[v] || `[${v}]`;
      result = result.replace(new RegExp(`\\[${v}\\]`, "g"), val);
    });
    return result;
  };

  const filledTemplate = getFilledTemplate(selected.template);

  const handleCopy = () => {
    navigator.clipboard.writeText(filledTemplate.replace(/^"|"$/g, ""));
    setCopiedId(selected.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setActiveId(PLAYBOOK_TEMPLATES[tab][0].id);
  };

  const handleGenerateObservation = async () => {
    if (!scrapeUrl) return;
    setGeneratingAI(true);
    try {
      const res = await fetch("/api/ai/scrape-observation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: scrapeUrl, 
          companyName: variables.Company || "Company", 
          industry: variables.sector || "industry"
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      handleVarChange("specific observation", data.observation);
    } catch (err: any) {
      alert(err.message || "Failed to generate observation");
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 text-slate-900 border-b border-slate-100 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-slate-200/70 text-slate-700 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-extrabold text-sm text-slate-900">Message Templates (DM / Email)</p>
                <span className="text-[10px] font-extrabold bg-slate-200/60 text-slate-700 border border-slate-300/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Outreach Playbook
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Drafting message for: <span className="font-bold text-slate-900">{ctx.companyName}</span>
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

        {/* Tabs */}
        <div className="bg-white border-b border-slate-100 px-6 py-3 flex items-center gap-2 shrink-0">
          <Button
            variant={activeTab === "approaches" ? "default" : "outline"}
            onClick={() => handleTabChange("approaches")}
            className={cn("h-8 px-4 text-xs font-bold rounded-xl", activeTab === "approaches" ? "bg-slate-900 text-white" : "text-slate-600")}
          >
            Approaches
          </Button>
          <Button
            variant={activeTab === "objections" ? "default" : "outline"}
            onClick={() => handleTabChange("objections")}
            className={cn("h-8 px-4 text-xs font-bold rounded-xl", activeTab === "objections" ? "bg-slate-900 text-white" : "text-slate-600")}
          >
            Objection Handling
          </Button>
          <Button
            variant={activeTab === "followUps" ? "default" : "outline"}
            onClick={() => handleTabChange("followUps")}
            className={cn("h-8 px-4 text-xs font-bold rounded-xl", activeTab === "followUps" ? "bg-slate-900 text-white" : "text-slate-600")}
          >
            Follow-Ups
          </Button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          
          {/* List Sidebar */}
          <div className="w-full md:w-72 bg-slate-50/50 border-r border-slate-100 p-3 space-y-1.5 overflow-y-auto max-h-48 md:max-h-none flex-shrink-0">
            {getList().map((t) => {
              const isActive = t.id === activeId;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1",
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  )}
                >
                  <span className={cn("text-xs font-black truncate", isActive ? "text-white" : "text-slate-900")}>
                    {t.label}
                  </span>
                  {t.description && (
                    <span className={cn("text-[10px] leading-tight line-clamp-2", isActive ? "text-slate-300" : "text-slate-500")}>
                      {t.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-white">
            
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col gap-2 shadow-xs">
              <h3 className="text-sm font-extrabold text-slate-900">{selected.label}</h3>
              {Boolean((selected as any).rule) && (
                <p className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md self-start">
                  Rule: {(selected as any).rule}
                </p>
              )}
            </div>

            {selected.variables.length > 0 && (
              <div className="space-y-4">
                {selected.variables.includes("specific observation") && (
                  <div className="bg-violet-50/50 border border-violet-100 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-violet-600" />
                      <label className="text-xs font-bold text-violet-900">AI Personalization (Scrape URL)</label>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={scrapeUrl}
                        onChange={e => setScrapeUrl(e.target.value)}
                        placeholder="Website or Instagram URL..."
                        className="h-9 text-xs bg-white flex-1 border-violet-200"
                      />
                      <Button 
                        type="button" 
                        onClick={handleGenerateObservation} 
                        disabled={generatingAI || !scrapeUrl}
                        className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white px-4 rounded-xl shadow-sm"
                      >
                        {generatingAI ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : "Generate"}
                      </Button>
                    </div>
                    <p className="text-[10px] text-violet-600 font-medium leading-tight">
                      The AI will read the URL and automatically fill in the "specific observation" below based on what they do.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fill in Variables</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selected.variables.map((v) => (
                    <div key={v}>
                      <label className="text-xs font-bold text-slate-700 block mb-1">{v}</label>
                      <Input
                        value={variables[v] || ""}
                        onChange={(e) => handleVarChange(v, e.target.value)}
                        placeholder={`Enter ${v}`}
                        className="h-8 text-xs bg-white border-slate-200 rounded-xl"
                      />
                    </div>
                  ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Generated Message</p>
                <Button
                  onClick={handleCopy}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs h-8 px-4 rounded-xl shadow-xs"
                >
                  {copiedId === selected.id ? (
                    <><Check className="h-3.5 w-3.5 mr-1.5" /> Copied</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Message</>
                  )}
                </Button>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 font-medium leading-relaxed shadow-xs whitespace-pre-wrap">
                {filledTemplate.replace(/^"|"$/g, "")}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
