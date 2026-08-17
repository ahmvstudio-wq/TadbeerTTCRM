"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Phone, MessageCircle,
  Loader2, Trash2, CheckCircle2, RefreshCw, Send, Check, AlertTriangle, BookOpen, Sparkles, Filter, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getAllLeadsForPipeline, updateOutreachStatus, updateOutreachEntry, deleteOutreachLog, getOutreachCountsForMonth
} from "@/lib/actions/ig-dm";
import {
  CHANNEL_CONFIG, STATUS_CONFIG,
  type OutreachChannel, type OutreachStatus, type OutreachLead
} from "@/lib/types/outreach";
import { ColdCallScriptModal } from "@/components/outreach/cold-call-script-modal";
import { ShareProgressModal } from "@/components/cadence/share-progress-modal";
import { useUnifiedLead } from "@/context/unified-lead-context";
import { generateDailyCallBatch } from "@/lib/actions/cadence";

const CHANNELS: OutreachChannel[] = [
  "instagram_dm", "linkedin", "whatsapp", "cold_call", "referral", "email", "event", "walk_in"
];

const STATUSES: OutreachStatus[] = [
  "sent", "no_reply", "reply_received", "replied_interested", "replied_objection", "ready_for_call", "called", "meeting_booked"
];

export default function DailyCadenceCalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-indexed
  const [selectedDate, setSelectedDate] = useState(() => today.toISOString().split("T")[0]);

  const [dailyCounts, setDailyCounts] = useState<Record<string, number>>({});
  const [leads, setLeads] = useState<OutreachLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<OutreachChannel | "all">("all");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Sync date with URL search params on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const dateParam = params.get("date");
      if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        setSelectedDate(dateParam);
        const [y, m] = dateParam.split("-").map(Number);
        if (y && m) {
          setCurrentYear(y);
          setCurrentMonth(m);
        }
      }
    }
  }, []);

  const changeSelectedDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("date", dateKey);
      window.history.replaceState({}, "", url.toString());
    }
  };

  // Fetch month counts
  const fetchMonthCounts = useCallback(async () => {
    const res = await getOutreachCountsForMonth(currentYear, currentMonth);
    setDailyCounts(res.data || {});
  }, [currentYear, currentMonth]);

  // Fetch leads for selected date
  const fetchDateLeads = useCallback(async () => {
    setLoading(true);
    const res = await getAllLeadsForPipeline(selectedDate, channelFilter === "all" ? undefined : channelFilter);
    setLeads(res.data || []);
    setLoading(false);
  }, [selectedDate, channelFilter]);

  useEffect(() => {
    fetchMonthCounts();
  }, [fetchMonthCounts]);

  useEffect(() => {
    fetchDateLeads();
  }, [fetchDateLeads]);

  // Month Navigation
  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  // Calendar Days Calculation
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth - 1, 1).getDay() + 6) % 7; // Monday = 0

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Selected date metrics
  const total = leads.length;
  const replied = leads.filter(l => l.status === "reply_received" || l.status === "replied_interested" || l.status === "replied_objection").length;
  const ready = leads.filter(l => l.status === "ready_for_call").length;
  const booked = leads.filter(l => l.status === "meeting_booked").length;

  return (
    <div className="space-y-6 page-enter pb-24 max-w-[1850px] w-full mx-auto">
      
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-extrabold mb-2 border border-teal-200">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Outreach History & Calendar</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Outreach Calendar</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">
            Click any date below to inspect all outreach logged, prospect replies, notes, and cold call scripts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={e => e.target.value && changeSelectedDate(e.target.value)}
            className="h-9 text-xs font-bold bg-slate-50 border-slate-200 rounded-xl"
          />
          <Button
            onClick={() => { fetchMonthCounts(); fetchDateLeads(); }}
            variant="outline"
            className="h-9 text-xs font-bold rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left Column: Interactive Month Calendar ─────────────────────── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            
            {/* Month Header Controls */}
            <div className="flex items-center justify-between">
              <span className="text-base font-extrabold text-slate-900">
                {monthNames[currentMonth - 1]} {currentYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty padding days */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-12 rounded-2xl bg-slate-50/50" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
                const formattedMonth = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;
                const dateKey = `${currentYear}-${formattedMonth}-${formattedDay}`;
                
                const isSelected = dateKey === selectedDate;
                const isToday = dateKey === today.toISOString().split("T")[0];
                const count = dailyCounts[dateKey] || 0;

                return (
                  <button
                    key={dateKey}
                    onClick={() => changeSelectedDate(dateKey)}
                    className={cn(
                      "h-12 rounded-2xl p-1 flex flex-col items-center justify-between border transition-all cursor-pointer relative",
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10"
                        : isToday
                        ? "bg-slate-50 text-slate-900 border-slate-300 font-black"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    )}
                  >
                    <span className="text-xs font-bold leading-tight mt-0.5">{dayNum}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          "text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border leading-none mb-0.5",
                          isSelected
                            ? "bg-white/20 text-white border-white/30"
                            : "bg-teal-50 text-teal-700 border-teal-200"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-teal-500" /> Days with logged outreach
              </span>
              <span className="font-extrabold text-slate-900">{Object.keys(dailyCounts).length} active days</span>
            </div>

          </div>
        </div>

        {/* ── Right Column: Selected Date Outreach History & Cards ────────── */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Selected Date Header & Metrics */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Outreach Logged For</p>
                <h2 className="text-lg font-black text-slate-900">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                  {total} Total Logs
                </span>
                <Button
                  onClick={() => setShareModalOpen(true)}
                  className="h-8 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Share Progress
                </Button>
              </div>
            </div>

            {/* Metric Pills */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
                <p className="text-[9px] font-black text-slate-400 uppercase">Reached</p>
                <p className="text-base font-black text-slate-900 mt-0.5">{total}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
                <p className="text-[9px] font-black text-slate-400 uppercase">Replied</p>
                <p className="text-base font-black text-slate-900 mt-0.5">{replied}</p>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-2xl p-2.5">
                <p className="text-[9px] font-black text-teal-600 uppercase">Call Ready</p>
                <p className="text-base font-black text-teal-900 mt-0.5">{ready}</p>
              </div>
              <div className="bg-pink-50 border border-pink-200 rounded-2xl p-2.5">
                <p className="text-[9px] font-black text-pink-600 uppercase">Booked</p>
                <p className="text-base font-black text-pink-900 mt-0.5">{booked}</p>
              </div>
            </div>

            {/* Channel filter */}
            <div className="flex gap-1.5 flex-wrap pt-1">
              <button
                onClick={() => setChannelFilter("all")}
                className={cn("px-2.5 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer", channelFilter === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300")}
              >
                All Channels
              </button>
              {CHANNELS.map(ch => (
                <button
                  key={ch}
                  onClick={() => setChannelFilter(ch)}
                  className={cn("px-2.5 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer", channelFilter === ch ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300")}
                >
                  {CHANNEL_CONFIG[ch]?.label || ch}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
              <Loader2 className="h-7 w-7 animate-spin text-slate-700" />
            </div>
          ) : leads.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
              <Send className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-extrabold text-slate-700">No outreach logged on this date</p>
              <p className="text-xs text-slate-400 mt-1">Select another date on the calendar to view outreach history.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map(lead => (
                <CalendarLeadCard
                  key={lead.id}
                  lead={lead}
                  expanded={expandedCard === lead.id}
                  onToggle={() => setExpandedCard(expandedCard === lead.id ? null : lead.id)}
                  onUpdate={fetchDateLeads}
                />
              ))}
            </div>
          )}

        </div>

      </div>

      {shareModalOpen && (
        <ShareProgressModal
          date={selectedDate}
          leads={leads}
          dailyCounts={dailyCounts}
          onClose={() => setShareModalOpen(false)}
        />
      )}

    </div>
  );
}

// ─── Minimal Calendar Lead Card ───────────────────────────────────────────────
function CalendarLeadCard({
  lead,
  expanded,
  onToggle,
  onUpdate
}: {
  lead: OutreachLead;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: () => void;
}) {
  const { openLead } = useUnifiedLead();
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
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
    if (!confirm(`Delete outreach log entry for "${lead.company_name}"?`)) return;
    await deleteOutreachLog(lead.id);
    await onUpdate();
  };

  const channelLabel = CHANNEL_CONFIG[channel]?.label || "Outreach";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.sent;
  const hasContext = Boolean(notes || reply || pain || opening);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
            {channel.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900 truncate">{companyName}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {lead.industry} · {channelLabel}{handle ? ` · ${handle}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs font-extrabold px-3 py-1 rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
            {statusConfig.label}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-4 bg-slate-50/30">
          
          {/* Status Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-slate-700">Update Status</p>
              {saving && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span>}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    "text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-all cursor-pointer",
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

          {/* Details & Notes Section */}
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
                  placeholder="What problem or challenge came up?"
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
              onClick={() => openLead(lead.company_id)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Open Lead Workspace
            </button>

            <button
              type="button"
              onClick={() => setScriptModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold px-3 py-2 rounded-xl transition-all cursor-pointer border border-slate-200"
            >
              <BookOpen className="h-3.5 w-3.5 text-teal-600" />
              Select Script
            </button>

            <button
              onClick={handleDelete}
              className="ml-auto flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors cursor-pointer border border-red-200"
              title="Delete log"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete Entry
            </button>
          </div>

        </div>
      )}

      {scriptModalOpen && (
        <ColdCallScriptModal
          ctx={{
            companyName,
            industry: lead.industry,
            handle,
            painPoint: pain,
            prospectReply: reply,
            openingLine: opening,
          }}
          onClose={() => setScriptModalOpen(false)}
        />
      )}
    </div>
  );
}
