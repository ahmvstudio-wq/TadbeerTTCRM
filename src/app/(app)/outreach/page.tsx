"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, X, ChevronDown, ChevronUp, Phone, MessageCircle,
  Loader2, Trash2, CheckCircle2, RefreshCw, Moon, Send,
  Check, AlertTriangle, Mail, BookOpen, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  logOutreach, updateOutreachStatus, updateOutreachEntry, getAllLeadsForPipeline, deleteOutreachLog, bulkLogOutreach,
} from "@/lib/actions/ig-dm";
import { getCompanies } from "@/lib/actions/companies";
import {
  CHANNEL_CONFIG, STATUS_CONFIG, TEMPLATE_LABELS,
  type OutreachChannel, type OutreachStatus, type OutreachTemplate, type OutreachLead,
} from "@/lib/types/outreach";
import { ColdCallScriptModal } from "@/components/outreach/cold-call-script-modal";

// ─── Channel Icon Renderer ────────────────────────────────────────────────────
function ChannelIcon({ channel, size = 14 }: { channel: OutreachChannel; size?: number }) {
  const cls = `h-[${size}px] w-[${size}px]`;
  const icons: Record<OutreachChannel, React.ReactNode> = {
    instagram_dm: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cn("h-4 w-4")} style={{width: size, height: size}}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>,
    linkedin:     <svg viewBox="0 0 24 24" fill="currentColor" style={{width: size, height: size}}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    whatsapp:     <svg viewBox="0 0 24 24" fill="currentColor" style={{width: size, height: size}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.374 0 0 5.373 0 12c0 2.127.558 4.18 1.613 5.978L.058 23.695a.75.75 0 00.96.93l5.87-1.924C8.52 23.591 10.228 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.794 0-3.54-.484-5.064-1.397l-.36-.215-3.744 1.227 1.255-3.635-.237-.375A9.712 9.712 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>,
    cold_call:    <Phone style={{width: size, height: size}} />,
    referral:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width: size, height: size}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    email:        <Mail style={{width: size, height: size}} />,
    event:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width: size, height: size}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    walk_in:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width: size, height: size}}><circle cx="12" cy="5" r="2"/><path d="M8 21l1-9 3 3 3-3 1 9M12 9l-3 4h6l-3-4z"/></svg>,
  };
  return <>{icons[channel]}</>;
}

// ─── Status chip styles ───────────────────────────────────────────────────────
const STATUS_CHIP: Record<OutreachStatus, string> = {
  sent:               "bg-blue-50 text-blue-700 border-blue-200",
  no_reply:           "bg-slate-100 text-slate-500 border-slate-200",
  replied_interested: "bg-emerald-50 text-emerald-700 border-emerald-200",
  replied_objection:  "bg-amber-50 text-amber-700 border-amber-200",
  ready_for_call:     "bg-teal-50 text-teal-700 border-teal-200",
  called:             "bg-violet-50 text-violet-600 border-violet-200",
  meeting_booked:     "bg-pink-50 text-pink-700 border-pink-200",
};

const CHANNEL_BG: Record<OutreachChannel, string> = {
  instagram_dm: "bg-slate-100 border border-slate-200 text-slate-700",
  linkedin:     "bg-slate-100 border border-slate-200 text-slate-700",
  whatsapp:     "bg-slate-100 border border-slate-200 text-slate-700",
  cold_call:    "bg-slate-100 border border-slate-200 text-slate-700",
  referral:     "bg-slate-100 border border-slate-200 text-slate-700",
  email:        "bg-slate-100 border border-slate-200 text-slate-700",
  event:        "bg-slate-100 border border-slate-200 text-slate-700",
  walk_in:      "bg-slate-100 border border-slate-200 text-slate-700",
};

const CHANNELS: OutreachChannel[] = [
  "instagram_dm","linkedin","whatsapp","cold_call","referral","email","event","walk_in"
];
const STATUSES: OutreachStatus[] = [
  "sent","no_reply","replied_interested","replied_objection","ready_for_call","called","meeting_booked"
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OutreachPipelinePage() {
  const [leads, setLeads] = useState<OutreachLead[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>("today");
  const [channelFilter, setChannelFilter] = useState<OutreachChannel | "all">("all");
  const [logOpen, setLogOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const fetchLeads = useCallback(async (isSilent = false) => {
    if (!isSilent) setInitialLoading(true);
    const result = await getAllLeadsForPipeline(
      dateFilter,
      channelFilter === "all" ? undefined : channelFilter
    );
    setLeads(result.data || []);
    setInitialLoading(false);
  }, [dateFilter, channelFilter]);

  useEffect(() => { fetchLeads(false); }, [fetchLeads]);

  const handleSilentUpdate = useCallback(() => {
    fetchLeads(true);
  }, [fetchLeads]);

  // Metrics
  const total       = leads.length;
  const replied     = leads.filter(l => l.status === "replied_interested" || l.status === "replied_objection").length;
  const interested  = leads.filter(l => l.status === "replied_interested").length;
  const callReady   = leads.filter(l => l.status === "ready_for_call").length;
  const booked      = leads.filter(l => l.status === "meeting_booked").length;

  const callList    = leads.filter(l => l.status === "ready_for_call");
  const pipeList    = leads.filter(l => l.status !== "ready_for_call" && l.status !== "called" && l.status !== "meeting_booked");
  const doneList    = leads.filter(l => l.status === "called" || l.status === "meeting_booked");

  return (
    <div className="space-y-5 page-enter pb-24 max-w-[1850px] w-full mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-white text-slate-900 p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold mb-3">
              <Send className="h-3.5 w-3.5" />
              <span>One Flow · All Channels</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">Outreach Pipeline</h1>
            <p className="text-slate-500 text-sm mt-1.5 max-w-xl font-medium leading-relaxed">
              Log any outreach — IG, LinkedIn, WhatsApp, cold call, referral, email, event. One flow. Dr. calls the warm leads in the evening with full context.
            </p>
          </div>
          <Button
            onClick={() => setLogOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-6 rounded-2xl shadow-xs flex-shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" /> Log Outreach
          </Button>
        </div>

        {/* Metric bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-5 border-t border-slate-100">
          {[
            { label: "Reached Out", value: total,     accent: false },
            { label: "Replied",     value: replied,   accent: false },
            { label: "Interested",  value: interested, accent: false },
            { label: "Ready",       value: callReady, accent: true  },
            { label: "Booked",      value: booked,    accent: false },
          ].map(m => (
            <div key={m.label} className={cn("rounded-2xl p-4 border transition-all", m.accent ? "bg-teal-50/50 border-teal-200 shadow-xs" : "bg-white border-slate-200 shadow-xs")}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{m.label}</p>
              <p className={cn("text-2xl font-black leading-tight mt-1", m.accent ? "text-teal-700" : "text-slate-900")}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        {/* Date */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Period:</span>
          <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
            {(["today","week","all"] as const).map(f => (
              <button key={f} onClick={() => setDateFilter(f)} className={cn("px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all", dateFilter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800")}>
                {f === "today" ? "Today" : f === "week" ? "This Week" : "All Time"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-xl">
            <span className="text-[10px] font-bold text-slate-500">Custom Date:</span>
            <input
              type="date"
              value={dateFilter.match(/^\d{4}-\d{2}-\d{2}$/) ? dateFilter : ""}
              onChange={e => e.target.value && setDateFilter(e.target.value)}
              className="h-7 px-2 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
            />
          </div>
          <button onClick={() => fetchLeads(false)} className="p-2 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors ml-auto">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-slate-400 font-medium">{leads.length} records</span>
        </div>

        {/* Channel filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setChannelFilter("all")}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-bold border transition-all", channelFilter === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300")}
          >
            All Channels
          </button>
          {CHANNELS.map(ch => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                channelFilter === ch
                  ? `bg-gradient-to-r ${CHANNEL_BG[ch]} text-white border-transparent`
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              )}
            >
              <ChannelIcon channel={ch} size={12} />
              {CHANNEL_CONFIG[ch].label}
            </button>
          ))}
        </div>
      </div>

      {initialLoading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── Col 1: Call Tonight ─────────────────────────────────────────── */}
          <div className="space-y-3">
            <ColumnHeader emoji="📞" title="Call Tonight" subtitle="Dr.'s evening block" count={callList.length} color="teal" />
            {callList.length === 0 ? (
              <EmptyCol icon={<Phone className="h-7 w-7 text-slate-300" />} text="No warm leads yet" sub="Mark leads Ready for Call as they reply" />
            ) : callList.map(lead => (
              <CallReadyCard key={lead.id} lead={lead} expanded={activeCard === lead.id} onToggle={() => setActiveCard(activeCard === lead.id ? null : lead.id)} onUpdate={handleSilentUpdate} />
            ))}
          </div>

          {/* ── Col 2: Active Pipeline ──────────────────────────────────────── */}
          <div className="space-y-3">
            <ColumnHeader emoji="💬" title="Active Pipeline" subtitle="Sent, waiting, or in conversation" count={pipeList.length} color="slate" />
            {pipeList.length === 0 ? (
              <EmptyCol icon={<Send className="h-7 w-7 text-slate-300" />} text="Nothing active right now" sub='Click "Log Outreach" to start tracking' />
            ) : pipeList.map(lead => (
              <OutreachCard key={lead.id} lead={lead} expanded={activeCard === lead.id} onToggle={() => setActiveCard(activeCard === lead.id ? null : lead.id)} onUpdate={handleSilentUpdate} />
            ))}
          </div>

          {/* ── Col 3: Done ─────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <ColumnHeader emoji="✅" title="Done" subtitle="Called or meeting booked" count={doneList.length} color="violet" />
            {doneList.length === 0 ? (
              <EmptyCol icon={<CheckCircle2 className="h-7 w-7 text-slate-300" />} text="No completions yet" sub="Called leads will appear here" />
            ) : doneList.map(lead => (
              <OutreachCard key={lead.id} lead={lead} expanded={activeCard === lead.id} onToggle={() => setActiveCard(activeCard === lead.id ? null : lead.id)} onUpdate={handleSilentUpdate} compact />
            ))}
          </div>
        </div>
      )}

      {/* ── Log Modal ──────────────────────────────────────────────────────── */}
      {logOpen && <LogModal onClose={() => setLogOpen(false)} onSuccess={() => { setLogOpen(false); fetchLeads(true); }} />}
    </div>
  );
}

// ─── Column Header ────────────────────────────────────────────────────────────
function ColumnHeader({ emoji, title, subtitle, count, color }: { emoji: string; title: string; subtitle: string; count: number; color: string }) {
  const countCls: Record<string, string> = {
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    violet: "bg-violet-50 text-violet-600 border-violet-200",
  };
  return (
    <div className="flex items-center justify-between mb-1">
      <div>
        <p className="text-sm font-black text-slate-900">{emoji} {title}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      <span className={cn("text-xs font-black px-2.5 py-1 rounded-full border", countCls[color] || countCls.slate)}>{count}</span>
    </div>
  );
}

// ─── Empty Column ─────────────────────────────────────────────────────────────
function EmptyCol({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: string }) {
  return (
    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-7 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-sm font-bold text-slate-500">{text}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}

// ─── Call Ready Card ──────────────────────────────────────────────────────────
function CallReadyCard({ lead, expanded, onToggle, onUpdate }: { lead: OutreachLead; expanded: boolean; onToggle: () => void; onUpdate: () => void }) {
  const [marking, setMarking] = useState(false);
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const markCalled = async () => { setMarking(true); await updateOutreachStatus(lead.id, { status: "called" }); await onUpdate(); setMarking(false); };
  const markBooked = async () => { setMarking(true); await updateOutreachStatus(lead.id, { status: "meeting_booked" }); await onUpdate(); setMarking(false); };
  const phone = lead.phone || (lead.channel === "cold_call" || lead.channel === "whatsapp" ? lead.handle : null);
  const waUrl = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : null;

  const channelBg = CHANNEL_BG[lead.channel] || "from-slate-600 to-slate-700";
  const channelLabel = CHANNEL_CONFIG[lead.channel]?.label || "Cold Call";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/60 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 shadow-xs">
            <ChannelIcon channel={lead.channel} size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 truncate">{lead.company_name}</p>
            <p className="text-xs text-slate-400">{lead.industry} · {channelLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">Ready</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          {/* Script trigger banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-4 w-4 text-slate-300 shrink-0" />
              <div>
                <p className="text-xs font-black text-white">Cold Calling Script Engine</p>
                <p className="text-[10px] text-slate-300">8 Master scripts (Jordan Belfort, Jeremy Miner, etc.)</p>
              </div>
            </div>
            <button
              onClick={() => setScriptModalOpen(true)}
              className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
            >
              Select Script
            </button>
          </div>

          {lead.pain_point && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">💡 Pain Point</p>
              <p className="text-sm text-slate-900 font-medium">{lead.pain_point}</p>
            </div>
          )}
          {lead.prospect_reply && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">💬 Their Reply</p>
              <p className="text-sm text-slate-700 italic">"{lead.prospect_reply}"</p>
            </div>
          )}
          {lead.call_opening_line && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">📞 Opening Line for Dr.</p>
              <p className="text-sm text-slate-900 font-bold leading-relaxed">"{lead.call_opening_line}"</p>
            </div>
          )}
          <div className="flex gap-2 flex-wrap pt-1">
            {phone && <a href={`tel:${phone}`} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl"><Phone className="h-3.5 w-3.5" /> Call</a>}
            {waUrl && <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>}
            <button onClick={markBooked} disabled={marking} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-900 text-xs font-bold px-3 py-2.5 rounded-xl ml-auto cursor-pointer">
              {marking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "📅"} Meeting Booked
            </button>
            <button onClick={markCalled} disabled={marking} className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl cursor-pointer">
              {marking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Mark Called
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
}

// ─── Generic Outreach Card (pipeline + done) ──────────────────────────────────
function OutreachCard({ lead, expanded, onToggle, onUpdate, compact }: { lead: OutreachLead; expanded: boolean; onToggle: () => void; onUpdate: () => void; compact?: boolean }) {
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scriptModalOpen, setScriptModalOpen] = useState(false);

  // Editable fields
  const [companyName, setCompanyName] = useState(lead.company_name);
  const [handle, setHandle] = useState(lead.handle || "");
  const [channel, setChannel] = useState<OutreachChannel>(lead.channel);
  const [outreachDate, setOutreachDate] = useState(() => (lead.sent_at ? lead.sent_at.split("T")[0] : new Date().toISOString().split("T")[0]));
  const [status, setStatus] = useState<OutreachStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes || "");
  const [reply, setReply] = useState(lead.prospect_reply || "");
  const [pain, setPain] = useState(lead.pain_point || "");
  const [opening, setOpening] = useState(lead.call_opening_line || "");

  useEffect(() => {
    setCompanyName(lead.company_name);
    setHandle(lead.handle || "");
    setChannel(lead.channel);
    if (lead.sent_at) setOutreachDate(lead.sent_at.split("T")[0]);
    setStatus(lead.status);
    setNotes(lead.notes || "");
    setReply(lead.prospect_reply || "");
    setPain(lead.pain_point || "");
    setOpening(lead.call_opening_line || "");
  }, [lead]);

  const handleStatusChange = async (newStatus: OutreachStatus) => {
    setStatus(newStatus);
    setSaving(true);
    await updateOutreachEntry(lead.id, {
      status: newStatus,
      company_name: companyName,
      handle,
      channel,
      outreach_date: outreachDate,
      notes,
      prospect_reply: reply,
      pain_point: pain,
      call_opening_line: opening
    });
    await onUpdate();
    setSaving(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    await updateOutreachEntry(lead.id, {
      company_name: companyName,
      handle,
      channel,
      outreach_date: outreachDate,
      status,
      notes,
      prospect_reply: reply,
      pain_point: pain,
      call_opening_line: opening
    });
    await onUpdate();
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Remove outreach log entry for "${lead.company_name}"?`)) return;
    setDeleting(true);
    await deleteOutreachLog(lead.id);
    await onUpdate();
    setDeleting(false);
  };

  const channelLabel = CHANNEL_CONFIG[channel]?.label || "Outreach";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.sent;
  const channelBg = CHANNEL_BG[channel] || "from-slate-600 to-slate-700";
  const hasContext = Boolean(notes || reply || pain || opening);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 hover:border-slate-300 transition-all">
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/70 transition-colors">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-xs shrink-0", channelBg)}>
            <ChannelIcon channel={channel} size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900 truncate">{companyName}</p>
            {!compact && (
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {lead.industry} · {channelLabel}{handle ? ` · ${handle}` : ""}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <span className="text-xs font-extrabold px-3 py-1 rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
            {statusConfig.label}
          </span>
          <div className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && !compact && (
        <div className="border-t border-slate-100 p-5 space-y-4 bg-slate-50/30">
          {/* Status buttons matching modal design */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-slate-700">Update Status</p>
              {saving && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Syncing...</span>}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    "text-xs font-extrabold px-3 py-2 rounded-xl border transition-all cursor-pointer",
                    status === s
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Form fields matching modal style */}
          {editing ? (
            <div className="space-y-3 pt-1 border-t border-slate-200/60 mt-3">
              <p className="text-xs font-black text-slate-900 uppercase tracking-wider">Edit Log Entry Fields</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Company Name</label>
                  <Input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="text-xs bg-white border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Handle / Contact Info</label>
                  <Input
                    value={handle}
                    onChange={e => setHandle(e.target.value)}
                    placeholder="@handle or phone number"
                    className="text-xs bg-white border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Outreach Channel</label>
                  <select
                    value={channel}
                    onChange={e => setChannel(e.target.value as OutreachChannel)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-xl h-9 px-3 font-extrabold text-slate-800"
                  >
                    {CHANNELS.map(ch => (
                      <option key={ch} value={ch}>{CHANNEL_CONFIG[ch]?.label || ch}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-700 block mb-1">Outreach Date</label>
                  <Input
                    type="date"
                    value={outreachDate}
                    onChange={e => setOutreachDate(e.target.value)}
                    className="text-xs bg-white border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">📝 Logged Notes</label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes about outreach..."
                  className="text-xs resize-none bg-white border-slate-200 rounded-xl p-3"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">💬 Prospect's Reply</label>
                <Textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder={`What did ${companyName} say?`}
                  className="text-xs resize-none bg-white border-slate-200 rounded-xl p-3"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-xs font-black text-amber-600 block mb-1">💡 Pain Point Identified</label>
                <Textarea
                  value={pain}
                  onChange={e => setPain(e.target.value)}
                  placeholder="What problem or challenge came up? Dr. uses this on the call."
                  className="text-xs resize-none bg-amber-50/50 border-amber-200 rounded-xl p-3 text-amber-950"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-xs font-black text-teal-700 block mb-1">📞 Opening Line for Dr.</label>
                <Textarea
                  value={opening}
                  onChange={e => setOpening(e.target.value)}
                  placeholder={`"Hi [Name], this is Dr. [Name] from Tadbeer..."`}
                  className="text-xs resize-none bg-teal-50/50 border-teal-200 rounded-xl p-3 text-teal-950"
                  rows={2}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {notes && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">📝 Logged Notes</p>
                  <p className="text-xs text-slate-800 font-medium">{notes}</p>
                </div>
              )}
              {reply && (
                <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">💬 Prospect Reply</p>
                  <p className="text-xs text-slate-800 font-medium italic">"{reply}"</p>
                </div>
              )}
              {pain && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 shadow-xs">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-0.5">💡 Pain Point</p>
                  <p className="text-xs text-amber-950 font-bold">{pain}</p>
                </div>
              )}
              {opening && (
                <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3 shadow-xs">
                  <p className="text-[10px] font-black text-teal-700 uppercase tracking-wider mb-0.5">📞 Opening Line for Dr.</p>
                  <p className="text-xs text-teal-950 font-bold leading-relaxed">"{opening}"</p>
                </div>
              )}
              {!hasContext && (
                <p className="text-xs text-slate-400 italic py-1">No call notes or replies recorded yet.</p>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
            {editing ? (
              <>
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold h-9 px-4 rounded-xl shadow-xs"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                  Save All Changes
                </Button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 px-3 py-2"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold px-3 py-2 rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                ✏️ Edit Entry
              </button>
            )}

            <button
              type="button"
              onClick={() => setScriptModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold px-3 py-2 rounded-xl transition-all cursor-pointer border border-slate-200"
            >
              <BookOpen className="h-3.5 w-3.5 text-teal-600" />
              Select Script
            </button>

            {status === "ready_for_call" && (
              <span className="text-xs text-teal-700 font-extrabold flex items-center gap-1">
                → Moves to Call Tonight Queue
              </span>
            )}
            {status === "meeting_booked" && (
              <span className="text-xs text-pink-700 font-extrabold flex items-center gap-1">
                → 📅 Meeting Booked!
              </span>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="ml-auto p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete record"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
}

// ─── Log Modal ────────────────────────────────────────────────────────────────
const TEMPLATES: { id: OutreachTemplate; label: string }[] = [
  { id: "growth_offer",   label: "📈 Growth Offer"       },
  { id: "free_website",   label: "🌐 Free Website Audit"  },
  { id: "digital_audit",  label: "🔍 Digital Audit"       },
  { id: "referral",       label: "🤝 Referral"            },
  { id: "event_followup", label: "🎪 Event Follow-up"     },
  { id: "custom",         label: "✍️ Custom"              },
];

function LogModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [channel, setChannel] = useState<OutreachChannel>("instagram_dm");
  const [entryMode, setEntryMode] = useState<"new" | "existing">("new");
  const [outreachDate, setOutreachDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState({ company_name: "", industry: "", handle: "", phone: "", template_used: "growth_offer" as OutreachTemplate, notes: "" });
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (entryMode === "existing" && allCompanies.length === 0) {
      getCompanies().then(res => {
        if (res.data) setAllCompanies(res.data);
      });
    }
  }, [entryMode, allCompanies.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (entryMode === "new") {
        if (!form.company_name || !form.handle) {
          setError("Business name and contact handle are required.");
          setSaving(false);
          return;
        }
        const result = await logOutreach({
          company_name: form.company_name,
          industry: form.industry || "General",
          channel,
          handle: form.handle,
          template_used: form.template_used,
          phone: form.phone || undefined,
          notes: form.notes || undefined,
          outreach_date: outreachDate
        });
        if (result.error) {
          setError(result.error);
          setSaving(false);
          return;
        }
      } else {
        if (selectedIds.length === 0) {
          setError("Please select at least one prospect to log outreach.");
          setSaving(false);
          return;
        }
        const selectedCos = allCompanies
          .filter(co => selectedIds.includes(co.id))
          .map(co => ({ id: co.id, name: co.company_name, phone: co.phone }));
        
        const result = await bulkLogOutreach({
          companies: selectedCos,
          channel,
          template_used: form.template_used,
          notes: form.notes || undefined,
          outreach_date: outreachDate
        });
        if (result.error) {
          setError(result.error);
          setSaving(false);
          return;
        }
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = allCompanies.filter(co =>
    co.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (co.industry && co.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const cfg = CHANNEL_CONFIG[channel];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[95vh] flex flex-col border border-slate-200">
        {/* Header */}
        <div className="bg-slate-50 text-slate-900 border-b border-slate-100 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-slate-200/70 text-slate-700 rounded-xl flex items-center justify-center">
              <ChannelIcon channel={channel} size={18} />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900">Log Outreach</p>
              <p className="text-slate-500 text-xs mt-0.5">Track for the call pipeline</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-xs font-semibold"><AlertTriangle className="h-4 w-4 shrink-0" /> {error}</div>}

          {/* Mode Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button type="button" onClick={() => setEntryMode("new")} className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", entryMode === "new" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}>
              Create New Prospect
            </button>
            <button type="button" onClick={() => setEntryMode("existing")} className={cn("flex-1 py-1.5 rounded-lg text-xs font-bold transition-all", entryMode === "existing" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900")}>
              Select Existing (Mass Log)
            </button>
          </div>

          {/* Date of Outreach */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Date of Outreach <span className="text-red-500">*</span></label>
            <Input
              type="date"
              value={outreachDate}
              onChange={e => setOutreachDate(e.target.value)}
              className="h-10 text-sm bg-slate-50 border-slate-200"
              required
            />
          </div>

          {/* Channel selector */}
          <div>
            <label className="text-xs font-black text-slate-700 block mb-2">Channel <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-4 gap-1.5">
              {CHANNELS.map(ch => (
                <button key={ch} type="button" onClick={() => setChannel(ch)} className={cn("flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all", channel === ch ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300")}>
                  <ChannelIcon channel={ch} size={16} />
                  <span className="text-[10px] font-bold leading-tight">{CHANNEL_CONFIG[ch]?.label || 'Channel'}</span>
                </button>
              ))}
            </div>
          </div>

          {entryMode === "new" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Business Name <span className="text-red-500">*</span></label>
                  <Input name="company_name" value={form.company_name} onChange={handleChange} placeholder="e.g. Lynx Events" className="h-10 text-sm bg-slate-50" required={entryMode === "new"} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Industry</label>
                  <Input name="industry" value={form.industry} onChange={handleChange} placeholder="e.g. Events, F&B" className="h-10 text-sm bg-slate-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">{cfg?.handleLabel || "Handle"} <span className="text-red-500">*</span></label>
                  <Input name="handle" value={form.handle} onChange={handleChange} placeholder={cfg?.placeholder || ""} className="h-10 text-sm bg-slate-50" required={entryMode === "new"} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Phone (optional)</label>
                  <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+968 …" className="h-10 text-sm bg-slate-50" />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">Select Prospects for Mass Log</label>
                <button
                  type="button"
                  onClick={() => setSelectedIds(selectedIds.length === filteredCompanies.length ? [] : filteredCompanies.map(c => c.id))}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
                >
                  {selectedIds.length === filteredCompanies.length ? "Deselect All" : "Select All Filtered"}
                </button>
              </div>
              <Input
                type="text"
                placeholder="Search existing prospects by name or industry..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 text-xs bg-slate-50"
              />
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 space-y-1 max-h-40 overflow-y-auto">
                {filteredCompanies.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">No prospects found.</p>
                ) : (
                  filteredCompanies.map(co => {
                    const isChecked = selectedIds.includes(co.id);
                    return (
                      <label key={co.id} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedIds(selectedIds.filter(id => id !== co.id));
                            } else {
                              setSelectedIds([...selectedIds, co.id]);
                            }
                          }}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="font-bold text-slate-900 truncate">{co.company_name}</span>
                        {co.industry && <span className="text-[10px] text-slate-400 font-medium">({co.industry})</span>}
                      </label>
                    );
                  })
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-500">{selectedIds.length} prospects selected for mass logging.</p>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Message / Approach Used</label>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} type="button" onClick={() => setForm({ ...form, template_used: t.id })} className={cn("p-2.5 rounded-xl border text-xs font-bold text-left transition-all", form.template_used === t.id ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Notes</label>
            <Textarea name="notes" value={form.notes} onChange={handleChange} placeholder="What you noticed, any relevant context from their profile or conversation..." className="text-xs resize-none bg-slate-50 border-slate-200 rounded-xl" rows={2} />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-10 text-xs font-bold rounded-xl">Cancel</Button>
            <Button type="submit" disabled={saving} className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              {saving ? "Logging..." : entryMode === "existing" ? `Mass Log (${selectedIds.length})` : "Log Outreach"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
