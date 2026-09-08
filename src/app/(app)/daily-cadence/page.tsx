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
  MessageSquare,
  Mail,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatWhatsAppNumber, isValidLinkedInUrl } from "@/lib/utils";
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
import { DMEmailTemplateModal } from "@/components/outreach/dm-email-template-modal";
import { ShareProgressModal } from "@/components/cadence/share-progress-modal";
import { OutreachAnalyticsDashboard } from "@/components/cadence/outreach-analytics-dashboard";
import { useUnifiedLead } from "@/context/unified-lead-context";

const CHANNELS: OutreachChannel[] = [
  "instagram_dm", "linkedin", "whatsapp", "cold_call", "referral", "email", "event", "walk_in"
];

const STATUSES: OutreachStatus[] = [
  "gate_opener_sent", "warm_up", "opening_identified", "ready_for_call", "called", "meeting_booked", "no_reply"
];

function normalizeStatus(s: string): string {
  if (s === "sent") return "gate_opener_sent";
  if (s === "reply_received") return "warm_up";
  if (s === "replied_interested" || s === "replied_objection") return "opening_identified";
  return s;
}

export default function DailyCadencePage() {
  const today = new Date();
  const [activeTab, setActiveTab] = useState<"analytics" | "calendar">("calendar");
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
  const replied = leads.filter(l => ['reply_received', 'replied_interested', 'replied_objection', 'warm_up', 'opening_identified'].includes(l.status)).length;
  const ready = leads.filter(l => ['ready_for_call', 'coffee_invited'].includes(l.status)).length;
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
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

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

  // Contact channels detection
  const phone = lead.phone || (lead.channel === "cold_call" || lead.channel === "whatsapp" ? (lead.handle && /^[\d\+\-\s\(\)]+$/.test(lead.handle) ? lead.handle : null) : null);
  const waDigits = phone ? formatWhatsAppNumber(phone) : "";
  const waUrl = waDigits ? `https://wa.me/${waDigits}${notes ? `?text=${encodeURIComponent(notes)}` : ''}` : null;

  const rawIg = lead.instagram_handle || (lead.channel === "instagram_dm" ? lead.handle : (handle && handle.startsWith("@") ? handle : null));
  const cleanIg = rawIg ? rawIg.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^\/+/, '').replace(/\/+$/, '').replace(/^@+/, '') : null;
  const igUrl = cleanIg ? `https://www.instagram.com/${cleanIg}/` : null;

  const rawLi = lead.linkedin_url || (lead.channel === "linkedin" ? (isValidLinkedInUrl(lead.handle) ? lead.handle : null) : (isValidLinkedInUrl(handle) ? handle : null));
  const liUrl = rawLi || null;

  const rawEmail = lead.email || (handle && handle.includes('@') && !handle.startsWith('@') ? handle : null);
  const emailUrl = rawEmail ? `mailto:${rawEmail}` : null;

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 hover:border-neutral-300 shadow-xs overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={cn(
            "h-9 w-9 rounded-xl border flex items-center justify-center font-black text-xs shrink-0 shadow-2xs",
            channel === "instagram_dm" ? "bg-pink-50 border-pink-200 text-pink-700" :
            channel === "whatsapp" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
            channel === "linkedin" ? "bg-blue-50 border-blue-200 text-[#0A66C2]" :
            channel === "email" ? "bg-violet-50 border-violet-200 text-violet-700" :
            "bg-neutral-100 border-neutral-200 text-neutral-800"
          )}>
            {channel === "instagram_dm" ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-pink-600"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            ) : channel === "whatsapp" ? (
              <MessageCircle className="h-4 w-4 text-emerald-600" />
            ) : channel === "linkedin" ? (
              <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" className="text-[#0A66C2]"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            ) : channel === "email" ? (
              <Mail className="h-4 w-4 text-violet-600" />
            ) : (
              <Phone className="h-4 w-4 text-neutral-700" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-black truncate">{companyName}</p>
            <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
              {lead.industry} · {channelLabel}{handle ? ` · ${handle}` : ""}
            </p>
          </div>
        </div>
        
        {/* Header Outreach Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer"
              title="Open WhatsApp Chat"
            >
              <MessageCircle className="h-3 w-3 text-emerald-600" /> WA
            </a>
          )}
          {igUrl && (
            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 px-2 bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-300 rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer"
              title="Open Instagram Profile"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3 text-pink-600"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
              IG
            </a>
          )}
          {liUrl && (
            <a
              href={liUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-7 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer"
              title="Open LinkedIn Profile"
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" className="text-[#0A66C2]"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              LI
            </a>
          )}
          {phone && (
            <a
              href={`tel:${phone}`}
              className="h-7 px-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-300 rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer"
              title="Call Number"
            >
              <Phone className="h-3 w-3 text-neutral-700" /> Call
            </a>
          )}
          {emailUrl && (
            <a
              href={emailUrl}
              className="h-7 px-2 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-300 rounded-lg text-[10px] font-black flex items-center gap-1 transition-colors cursor-pointer"
              title="Send Email"
            >
              <Mail className="h-3 w-3 text-violet-600" /> Mail
            </a>
          )}
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full border border-neutral-200 bg-neutral-100 text-neutral-800">
            {statusConfig.label}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-neutral-100 p-4 space-y-3.5 bg-neutral-50/30">
          
          {/* Status Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-wider text-neutral-500">Pipeline Stage</p>
              {saving && <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving...</span>}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map(s => {
                const isSelected = normalizeStatus(status) === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusChange(s)}
                    className={cn(
                      "text-xs font-black px-3 py-1 rounded-xl border transition-all cursor-pointer",
                      isSelected
                        ? "bg-black text-white border-black shadow-xs"
                        : "bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-100"
                    )}
                  >
                    {STATUS_CONFIG[s]?.label || s}
                  </button>
                );
              })}
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
                <label className="text-[10px] font-bold text-neutral-600 block mb-1">Logged Notes / Sent Message</label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes or message body sent..."
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
                  <p className="text-[9px] font-black text-neutral-400 uppercase tracking-wider mb-0.5">Outreach Message / Notes</p>
                  <p className="text-xs text-neutral-800 font-medium leading-relaxed">{notes}</p>
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
                  <p className="text-[9px] font-black text-neutral-600 uppercase tracking-wider mb-0.5">Pain Point / Angle</p>
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

          {/* Expanded Action Toolbar - All Outreach Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 flex-wrap">
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Launch WhatsApp
              </a>
            )}
            {igUrl && (
              <a
                href={igUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                Open Instagram
              </a>
            )}
            {liUrl && (
              <a
                href={liUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-[#0A66C2] hover:bg-[#084e96] text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                Open LinkedIn
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            )}
            {emailUrl && (
              <a
                href={emailUrl}
                className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-black px-3 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </a>
            )}

            <button
              type="button"
              onClick={() => setScriptModalOpen(true)}
              className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-neutral-200"
            >
              <BookOpen className="h-3.5 w-3.5 text-neutral-700" />
              Call Script
            </button>

            <button
              type="button"
              onClick={() => setTemplateModalOpen(true)}
              className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-neutral-200"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Templates
            </button>

            <button
              type="button"
              onClick={() => openLead(lead.company_id)}
              className="flex items-center gap-1.5 bg-[#0f343c] hover:bg-[#16434d] text-[#e8d5a7] text-xs font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs border border-[#16434d]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Lead Workspace
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('meeting_booked')}
              className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              📅 Booked
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('called')}
              className="flex items-center gap-1 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-300 text-xs font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Called
            </button>

            {editing ? (
              <>
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="bg-black hover:bg-neutral-800 text-white text-xs font-black h-8 px-4 rounded-xl shadow-xs ml-auto"
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
                className="text-xs font-bold text-neutral-600 hover:text-black px-2.5 py-1.5 ml-auto cursor-pointer"
              >
                ✏️ Edit
              </button>
            )}

            <button
              onClick={handleDelete}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer border border-red-200"
              title="Delete log"
            >
              <Trash2 className="h-3.5 w-3.5" />
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

      {templateModalOpen && (
        <DMEmailTemplateModal
          ctx={{
            companyName: lead.company_name,
            industry: lead.industry,
            contactName: (lead.handle && !/^[\d\+\-\s\(\)]+$/.test(lead.handle)) ? lead.handle : "Contact",
            channel: lead.channel,
            handle: lead.handle
          }}
          onClose={() => setTemplateModalOpen(false)}
        />
      )}
    </div>
  );
}
