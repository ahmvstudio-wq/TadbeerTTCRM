"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageCircle,
  Loader2,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Send,
  Check,
  AlertTriangle,
  BookOpen,
  Sparkles,
  Filter,
  Share2,
  BarChart3,
  Layers,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  getAllLeadsForPipeline,
  updateOutreachStatus,
  updateOutreachEntry,
  deleteOutreachLog,
  getOutreachCountsForMonth
} from "@/lib/actions/ig-dm";
import {
  CHANNEL_CONFIG,
  STATUS_CONFIG,
  type OutreachChannel,
  type OutreachStatus,
  type OutreachLead
} from "@/lib/types/outreach";
import { ColdCallScriptModal } from "@/components/outreach/cold-call-script-modal";
import { ShareProgressModal } from "@/components/cadence/share-progress-modal";
import { OutreachAnalyticsDashboard } from "@/components/cadence/outreach-analytics-dashboard";
import { useUnifiedLead } from "@/context/unified-lead-context";

const CHANNELS: OutreachChannel[] = [
  "instagram_dm", "linkedin", "whatsapp", "cold_call", "referral", "email", "event", "walk_in"
];

const STATUSES: OutreachStatus[] = [
  "sent", "no_reply", "reply_received", "replied_interested", "replied_objection", "ready_for_call", "called", "meeting_booked"
];

export default function DailyCadencePage() {
  const today = new Date();
  const [activeTab, setActiveTab] = useState<"analytics" | "calendar">("analytics");
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
      const tabParam = params.get("tab");
      if (tabParam === "calendar" || tabParam === "analytics") {
        setActiveTab(tabParam as any);
      }
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
    if (res.error && (res.error.includes("Unauthorized") || res.error.includes("session"))) {
      window.location.href = "/login";
      return;
    }
    setLeads((res.data as OutreachLead[]) || []);
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

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = (new Date(currentYear, currentMonth - 1, 1).getDay() + 6) % 7;

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const total = leads.length;
  const replied = leads.filter(l => l.status === "reply_received" || l.status === "replied_interested" || l.status === "replied_objection").length;
  const ready = leads.filter(l => l.status === "ready_for_call").length;
  const booked = leads.filter(l => l.status === "meeting_booked").length;

  return (
    <div className="space-y-6 page-enter pb-24 max-w-[1850px] w-full mx-auto font-sans">
      
      {/* ── Top Header with Tab Switcher ────────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-[#0f343c] text-[#e8d5a7] border border-[#16434d]">
              Daily Cadence
            </span>
          </div>
          <h1 className="text-xl font-black text-black tracking-tight">Daily Outreach & Activity</h1>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Track messages, replies, and view day-by-day activity.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-100 p-1 rounded-xl border border-neutral-200 text-xs font-mono">
            <button
              onClick={() => setActiveTab("analytics")}
              className={cn(
                "px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === "analytics" ? "bg-[#0f343c] text-white shadow-xs" : "text-neutral-600 hover:text-black"
              )}
            >
              <BarChart3 className="h-3.5 w-3.5 text-[#c5a059]" />
              Stats & Graphs
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={cn(
                "px-3 py-1.5 font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === "calendar" ? "bg-[#0f343c] text-white shadow-xs" : "text-neutral-600 hover:text-black"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5 text-[#c5a059]" />
              Daily Logs
            </button>
          </div>
        </div>
      </div>

      {/* ── TAB 1: OUTREACH ANALYTICS & INDUSTRY GRAPHS ──────────────────────── */}
      {activeTab === "analytics" && (
        <OutreachAnalyticsDashboard />
      )}

      {/* ── TAB 2: DAILY CADENCE CALENDAR & LOGS ─────────────────────────────── */}
      {activeTab === "calendar" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ── Left Column: Interactive Month Calendar ─────────────────────── */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
              
              {/* Month Header Controls */}
              <div className="flex items-center justify-between font-mono">
                <span className="text-sm font-black text-black">
                  {monthNames[currentMonth - 1]} {currentYear}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1.5 font-mono">
                {/* Empty padding days */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-11 rounded-xl bg-neutral-50/50" />
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
                        "h-11 rounded-xl p-1 flex flex-col items-center justify-between border transition-all cursor-pointer relative",
                        isSelected
                          ? "bg-[#0f343c] text-white border-[#16434d] shadow-xs font-black"
                          : isToday
                          ? "bg-[#0f343c]/10 text-[#0f343c] border-[#0f343c]/25 font-extrabold"
                          : "bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50"
                      )}
                    >
                      <span className="text-xs font-bold leading-tight mt-0.5">{dayNum}</span>
                      {count > 0 && (
                        <span
                          className={cn(
                            "text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border leading-none mb-0.5",
                            isSelected
                              ? "bg-white/20 text-white border-white/30"
                              : isToday
                              ? "bg-[#0f343c] text-white border-[#16434d]"
                              : "bg-neutral-100 text-neutral-800 border-neutral-200"
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#0f343c]" /> Active days
                </span>
                <span className="font-bold text-black">{Object.keys(dailyCounts).length} days</span>
              </div>

            </div>
          </div>

          {/* ── Right Column: Selected Date Outreach History & Cards ────────── */}
          <div className="lg:col-span-7 space-y-4 font-sans">
            
            {/* Selected Date Header & Metrics */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">Activity on</p>
                  <h2 className="text-base font-black text-black">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                  </h2>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-neutral-100 text-black border border-neutral-200">
                    {total} Messages
                  </span>
                  <Button
                    onClick={() => setShareModalOpen(true)}
                    className="h-8 bg-[#0f343c] hover:bg-[#091f24] text-white font-bold text-xs px-3 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all border border-[#16434d]"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    Share Progress
                  </Button>
                </div>
              </div>

              {/* Metric Pills */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-neutral-100 text-center font-mono">
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase">Sent</p>
                  <p className="text-sm font-black text-black mt-0.5">{total}</p>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase">Replies</p>
                  <p className="text-sm font-black text-black mt-0.5">{replied}</p>
                </div>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-2.5">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase">Ready</p>
                  <p className="text-sm font-black text-black mt-0.5">{ready}</p>
                </div>
                <div className="bg-neutral-900 border border-neutral-800 text-white rounded-lg p-2.5">
                  <p className="text-[9px] font-bold text-neutral-400 uppercase">Booked</p>
                  <p className="text-sm font-black text-white mt-0.5">{booked}</p>
                </div>
              </div>

              {/* Channel filter */}
              <div className="flex gap-1.5 flex-wrap pt-1 font-mono">
                <button
                  onClick={() => setChannelFilter("all")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                    channelFilter === "all"
                      ? "bg-black text-white border-black"
                      : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  All Channels
                </button>
                {CHANNELS.map(ch => (
                  <button
                    key={ch}
                    onClick={() => setChannelFilter(ch)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                      channelFilter === ch
                        ? "bg-black text-white border-black"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                    )}
                  >
                    {CHANNEL_CONFIG[ch]?.label || ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards List */}
            {loading ? (
              <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-neutral-200">
                <Loader2 className="h-7 w-7 animate-spin text-black" />
              </div>
            ) : leads.length === 0 ? (
              <div className="bg-white border border-dashed border-neutral-300 rounded-2xl p-10 text-center">
                <Send className="h-7 w-7 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-neutral-700">No messages logged on this date</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Select another day on the calendar.</p>
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
      )}

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

// ─── Minimal Monochrome Calendar Lead Card ──────────────────────────────────
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
    <div className="bg-white rounded-2xl border border-neutral-200 hover:border-neutral-300 shadow-xs overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center justify-center font-black text-xs shrink-0">
            {channel.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-black truncate">{companyName}</p>
            <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
              {lead.industry} · {channelLabel}{handle ? ` · ${handle}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border border-neutral-200 bg-neutral-100 text-neutral-800">
            {statusConfig.label}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 p-4 space-y-3.5 bg-neutral-50/30">
          
          {/* Status Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Update Status</p>
              {saving && <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span>}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  className={cn(
                    "text-xs font-black px-3 py-1 rounded-xl border transition-all cursor-pointer",
                    status === s
                      ? "bg-black text-white border-black shadow-xs"
                      : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                  )}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Details & Notes Section */}
          {editing ? (
            <div className="space-y-3 pt-1 border-t border-neutral-200 mt-3">
              <p className="text-[10px] font-black text-black uppercase tracking-wider">Edit Log Entry Fields</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-neutral-600 block mb-1">Company Name</label>
                  <Input
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="text-xs bg-white border-neutral-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-600 block mb-1">Handle / Contact Info</label>
                  <Input
                    value={handle}
                    onChange={e => setHandle(e.target.value)}
                    placeholder="@handle or phone number"
                    className="text-xs bg-white border-neutral-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-600 block mb-1">Outreach Channel</label>
                  <select
                    value={channel}
                    onChange={e => setChannel(e.target.value as OutreachChannel)}
                    className="w-full text-xs bg-white border border-neutral-200 rounded-xl h-9 px-3 font-bold text-neutral-800"
                  >
                    {CHANNELS.map(ch => (
                      <option key={ch} value={ch}>{CHANNEL_CONFIG[ch]?.label || ch}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-600 block mb-1">Outreach Date</label>
                  <Input
                    type="date"
                    value={outreachDate}
                    onChange={e => setOutreachDate(e.target.value)}
                    className="text-xs bg-white border-neutral-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-600 block mb-1">Logged Notes</label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes about outreach..."
                  className="text-xs resize-none bg-white border-neutral-200 rounded-xl p-3"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-neutral-600 block mb-1">Prospect Response</label>
                <Textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  placeholder={`What did ${companyName} say?`}
                  className="text-xs resize-none bg-white border-neutral-200 rounded-xl p-3"
                  rows={2}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-1">
              {notes && (
                <div className="bg-white border border-neutral-200 rounded-xl p-3 shadow-xs">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-0.5">Logged Notes</p>
                  <p className="text-xs text-neutral-800 font-medium">{notes}</p>
                </div>
              )}
              {reply && (
                <div className="bg-white border border-neutral-200 rounded-xl p-3 shadow-xs">
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-0.5">Prospect Reply</p>
                  <p className="text-xs text-neutral-800 font-medium italic">&ldquo;{reply}&rdquo;</p>
                </div>
              )}
              {pain && (
                <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-3 shadow-xs">
                  <p className="text-[9px] font-black text-neutral-600 uppercase tracking-wider mb-0.5">Pain Point</p>
                  <p className="text-xs text-neutral-900 font-bold">{pain}</p>
                </div>
              )}
              {opening && (
                <div className="bg-neutral-100 border border-neutral-200 rounded-xl p-3 shadow-xs">
                  <p className="text-[9px] font-black text-neutral-600 uppercase tracking-wider mb-0.5">Opening Script</p>
                  <p className="text-xs text-neutral-900 font-bold leading-relaxed">&ldquo;{opening}&rdquo;</p>
                </div>
              )}
              {!hasContext && (
                <p className="text-xs text-neutral-400 italic py-1">No call notes or replies recorded yet.</p>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 flex-wrap">
            {editing ? (
              <>
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="bg-black hover:bg-neutral-800 text-white text-xs font-black h-8 px-4 rounded-xl shadow-xs"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Check className="h-3.5 w-3.5 mr-1.5" />}
                  Save All Changes
                </Button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-xs font-bold text-neutral-500 hover:text-black px-3 py-1.5"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-neutral-200"
              >
                Edit Entry
              </button>
            )}

            <button
              type="button"
              onClick={() => openLead(lead.company_id)}
              className="flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Open Lead Workspace
            </button>

            <button
              type="button"
              onClick={() => setScriptModalOpen(true)}
              className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-neutral-200"
            >
              <BookOpen className="h-3.5 w-3.5 text-neutral-700" />
              Select Script
            </button>

            <button
              onClick={handleDelete}
              className="ml-auto flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer border border-red-200"
              title="Delete log"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
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
