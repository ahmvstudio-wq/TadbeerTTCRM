"use client";

import { useState } from "react";
import {
  Bot,
  Loader2,
  PhoneCall,
  Target,
  AlertTriangle,
  Send,
  LineChart,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Pencil,
  RefreshCw,
  FlaskConical,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { generateSalesStrategy } from "@/lib/actions/sales-assistant";

export function AISalesAssistant({ company }: { company: any }) {
  const [loading, setLoading] = useState(false);
  const [strategy, setStrategy] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [researchNotes, setResearchNotes] = useState("");
  const [researchOpen, setResearchOpen] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    const result = await generateSalesStrategy(company.id, researchNotes);
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setStrategy(result.data);
    }
    setLoading(false);
  };

  if (!strategy) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Golden Rule</p>
            <p className="text-sm text-amber-700 mt-0.5">
              The objective is <strong>not</strong> to explain every service. Understand their goal, qualify their need, book the meeting.
            </p>
          </div>
        </div>

        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
          <button
            onClick={() => setResearchOpen(!researchOpen)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-violet-100 flex items-center justify-center">
                <FlaskConical className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Add Research Notes</p>
                <p className="text-xs text-slate-500">
                  {researchNotes ? `${researchNotes.length} chars of context added` : "Instagram posts, news, trade shows... the AI will weave these in."}
                </p>
              </div>
            </div>
            {researchOpen ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>
          {researchOpen && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4">
              <Textarea
                value={researchNotes}
                onChange={(e) => setResearchNotes(e.target.value)}
                placeholder={"E.g.:\n• They posted a reel about expanding to a second location\n• Owner was at the Oman tourism expo last week\n• No website but very active on Instagram\n• Sells luxury abayas – target is high-end clientele"}
                className="text-sm resize-none bg-slate-50 border-slate-200 rounded-xl min-h-[120px] focus:ring-violet-500"
                rows={6}
              />
              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                <Bot className="h-3 w-3" /> These notes are injected directly into the AI prompt as high-priority context.
              </p>
            </div>
          )}
        </div>

        <div className="border border-teal-100 bg-gradient-to-br from-teal-50 to-slate-50 rounded-2xl p-8 text-center">
          <div className="h-14 w-14 bg-white rounded-2xl shadow-sm border border-teal-100 flex items-center justify-center mx-auto mb-4">
            <Bot className="h-7 w-7 text-teal-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">AI Sales Assistant</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
            Generate a personalized cold call script for <span className="font-semibold text-slate-700">{company.company_name}</span> based on their industry, website, and your research notes.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-teal-600 hover:bg-teal-700 text-white px-8 h-11 rounded-xl font-bold shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Researching &amp; Generating...
              </>
            ) : (
              <>
                <Bot className="mr-2 h-4 w-4" />
                Generate Cold Call Script
              </>
            )}
          </Button>
          {error && (
            <div className="mt-4 flex items-center gap-2 justify-center text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-white/20 rounded-xl flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight">Script Ready</p>
            <p className="text-xs text-teal-200">Tailored for {company.company_name}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={loading}
          className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs h-8 rounded-xl"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "↺ Regenerate"}
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
        <p className="text-xs font-medium text-amber-700">
          <strong>Objective:</strong> Qualify → Book the meeting. Do not pitch every service on the call.
        </p>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setResearchOpen(!researchOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FlaskConical className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-semibold text-slate-600">Research Notes</span>
            {researchNotes && <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-bold">Active</span>}
          </div>
          {researchOpen ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </button>
        {researchOpen && (
          <div className="px-4 pb-4 border-t border-slate-100 pt-3">
            <Textarea
              value={researchNotes}
              onChange={(e) => setResearchNotes(e.target.value)}
              placeholder="Add research points here and regenerate..."
              className="text-xs resize-none bg-slate-50 border-slate-200 rounded-xl"
              rows={4}
            />
            <Button size="sm" onClick={handleGenerate} disabled={loading} className="mt-2 bg-violet-600 hover:bg-violet-700 text-white text-xs h-8 rounded-lg">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <RefreshCw className="h-3.5 w-3.5 mr-1" />}
              Regenerate with Notes
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="script" className="w-full">
        <TabsList className="w-full grid grid-cols-3 sm:grid-cols-6 h-auto bg-slate-100 p-1 rounded-xl gap-0.5">
          <TabsTrigger value="script" className="text-xs py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <PhoneCall className="h-3 w-3 mr-1" /> Script
          </TabsTrigger>
          <TabsTrigger value="qualification" className="text-xs py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Target className="h-3 w-3 mr-1" /> Qualify
          </TabsTrigger>
          <TabsTrigger value="offer" className="text-xs py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <BookOpen className="h-3 w-3 mr-1" /> Offer
          </TabsTrigger>
          <TabsTrigger value="objections" className="text-xs py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <AlertCircle className="h-3 w-3 mr-1" /> Objections
          </TabsTrigger>
          <TabsTrigger value="followup" className="text-xs py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Send className="h-3 w-3 mr-1" /> Follow-ups
          </TabsTrigger>
          <TabsTrigger value="insights" className="text-xs py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <LineChart className="h-3 w-3 mr-1" /> Insights
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <TabsContent value="script" className="space-y-3 m-0">
            <div className="flex items-center gap-2 mb-1">
              <PhoneCall className="h-4 w-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">Cold Call Script</h3>
              <span className="text-[10px] text-slate-400 ml-auto font-medium">Click any block to edit</span>
            </div>
            <div className="space-y-2">
              <EditableScriptBlock step={1} label="Greeting" content={strategy.script.greeting} />
              <EditableScriptBlock step={2} label="Permission" content={strategy.script.permission} />
              <EditableScriptBlock step={3} label="Introduction" content={strategy.script.introduction} />
              <EditableScriptBlock step={4} label="Context" content={strategy.script.context} />
              <EditableScriptBlock step={5} label="Qualifying Question" content={strategy.script.qualifyingQuestion} highlight />
              <EditableScriptBlock step={6} label="Transition" content={strategy.script.transition} />
              <EditableScriptBlock step={7} label="Meeting Ask" content={strategy.script.meetingAsk} highlight />
              <EditableScriptBlock step={8} label="If They Agree" content={strategy.script.ifTheyAgree} />
              <EditableScriptBlock step={9} label="Discovery Before Deck" content={strategy.script.discoveryBeforeDeck} />
            </div>
          </TabsContent>

          <TabsContent value="qualification" className="m-0">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  Smart Qualification Questions
                </CardTitle>
                <CardDescription className="text-xs">Ask these to uncover pain points without interrogating.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2.5">
                  {strategy.qualificationQuestions.map((q: string, i: number) => (
                    <li key={i} className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="flex items-center justify-center bg-blue-100 text-blue-700 rounded-lg h-6 w-6 text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-sm text-slate-700 font-medium flex-1">{q}</span>
                      <CopyButton text={q} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="offer" className="m-0">
            <Card className="border-teal-100 shadow-sm overflow-hidden rounded-2xl">
              <div className="bg-gradient-to-br from-teal-600 to-teal-700 p-5 text-white">
                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Recommended Offer</p>
                <p className="text-2xl font-black">{strategy.recommendedOffer.offerName}</p>
              </div>
              <CardContent className="pt-5 pb-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Why this offer?</p>
                <p className="text-sm text-slate-700 leading-relaxed">{strategy.recommendedOffer.reasoning}</p>
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    <strong>Do NOT pitch this on the call.</strong> Save it for the discovery meeting. Your only goal now is to book the meeting.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="objections" className="m-0">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                  Objection Handling
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {strategy.objectionHandling.map((item: any, i: number) => (
                  <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-rose-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                      <span className="text-sm font-semibold text-rose-700">&ldquo;{item.objection}&rdquo;</span>
                      <CopyButton text={item.response} />
                    </div>
                    <div className="p-4 bg-white text-sm text-slate-700 leading-relaxed">{item.response}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="followup" className="m-0 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Send className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Follow-up Messages</h3>
              <span className="text-xs text-slate-400 ml-auto">If they do not answer or need time.</span>
            </div>
            <FollowUpBlock platform="WhatsApp" color="emerald" content={strategy.followUpMessages.whatsapp} />
            <FollowUpBlock platform="Instagram DM" color="pink" content={strategy.followUpMessages.instagram} />
            <FollowUpBlock platform="LinkedIn" color="blue" content={strategy.followUpMessages.linkedin} />
            <FollowUpBlock platform="Email" color="slate" content={`Subject: ${strategy.followUpMessages.email.subject}\n\n${strategy.followUpMessages.email.body}`} />
          </TabsContent>

          <TabsContent value="insights" className="m-0 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Meeting Probability</p>
                  <p className="text-3xl font-black text-slate-900">{strategy.salesInsights.meetingProbability}%</p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${strategy.salesInsights.meetingProbability > 60 ? "bg-emerald-500" : strategy.salesInsights.meetingProbability > 30 ? "bg-amber-400" : "bg-rose-500"}`}
                      style={{ width: `${strategy.salesInsights.meetingProbability}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-slate-200 shadow-sm">
                <CardContent className="pt-4 pb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confidence Score</p>
                  <p className="text-3xl font-black text-slate-900">{strategy.salesInsights.confidenceScore}%</p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${strategy.salesInsights.confidenceScore}%` }} />
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="rounded-2xl border-slate-200 shadow-sm">
              <CardContent className="pt-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Pain Points</p>
                  <ul className="space-y-2">
                    {strategy.salesInsights.painPoints.map((pt: string, i: number) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" /> {pt}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Interest Level</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${strategy.salesInsights.interestLevel === "High" ? "bg-emerald-100 text-emerald-700" : strategy.salesInsights.interestLevel === "Medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                      {strategy.salesInsights.interestLevel}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Recommended Next Action</p>
                    <p className="text-sm text-slate-700">{strategy.salesInsights.recommendedNextAction}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Follow-up Timing</p>
                    <p className="text-sm text-slate-700 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {strategy.salesInsights.recommendedFollowUpTime}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function EditableScriptBlock({ step, label, content, highlight = false }: { step: number; label: string; content: string; highlight?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${highlight ? "border-teal-200 bg-teal-50/50" : "border-slate-200 bg-white"}`}>
      <div className={`flex items-center justify-between px-3 py-2 border-b ${highlight ? "border-teal-200 bg-teal-100/60" : "border-slate-100 bg-slate-50"}`}>
        <div className="flex items-center gap-2">
          <span className={`h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-black ${highlight ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"}`}>{step}</span>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${highlight ? "text-teal-700" : "text-slate-500"}`}>{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setEditing(!editing)} className={`h-6 w-6 rounded-lg flex items-center justify-center transition-colors ${editing ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}>
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={handleCopy} className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>
      {editing ? (
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} className={`border-0 rounded-none text-sm resize-none focus:ring-0 focus-visible:ring-0 shadow-none ${highlight ? "bg-teal-50/30" : "bg-white"}`} rows={3} autoFocus onBlur={() => setEditing(false)} />
      ) : (
        <p className="px-3 py-2.5 text-sm text-slate-800 leading-relaxed cursor-text" onClick={() => setEditing(true)}>{value}</p>
      )}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <button onClick={handleCopy} className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-white transition-colors shrink-0">
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function FollowUpBlock({ platform, color, content }: { platform: string; color: string; content: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(content);
  const [copied, setCopied] = useState(false);
  const colorMap: Record<string, string> = { emerald: "border-emerald-200 bg-emerald-50", pink: "border-pink-200 bg-pink-50", blue: "border-blue-200 bg-blue-50", slate: "border-slate-200 bg-slate-50" };
  const handleCopy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className={`border rounded-xl overflow-hidden ${colorMap[color] || colorMap.slate}`}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/5">
        <span className="text-xs font-bold text-slate-700">{platform}</span>
        <div className="flex gap-1">
          <button onClick={() => setEditing(!editing)} className={`h-6 w-6 rounded-lg flex items-center justify-center transition-colors ${editing ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-white/70 hover:text-slate-600"}`}>
            <Pencil className="h-3 w-3" />
          </button>
          <button onClick={handleCopy} className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/70 hover:text-slate-600 transition-colors">
            {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
          </button>
        </div>
      </div>
      {editing ? (
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} className="border-0 rounded-none text-xs bg-white/60 resize-none focus:ring-0 focus-visible:ring-0 shadow-none font-mono" rows={5} autoFocus onBlur={() => setEditing(false)} />
      ) : (
        <p className="px-4 py-3 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed cursor-text" onClick={() => setEditing(true)}>{value}</p>
      )}
    </div>
  );
}
