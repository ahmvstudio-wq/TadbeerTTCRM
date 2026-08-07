"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users, Send, Phone, Clock, Calendar, TrendingUp, AlertTriangle,
  Building2, ChevronDown, ChevronRight, Sparkles, Zap, Flame, DollarSign,
  Activity, ArrowRight, MessageCircle, Mail, ExternalLink, CheckCircle2,
  BarChart3, PieChart, RefreshCw, ShieldAlert, ArrowUpRight, Plus, Filter,
  Target, Layers, Compass, Award, Percent, CheckSquare, LineChart, Briefcase, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getDashboardStats, getRecentActivity } from "@/lib/actions/dashboard";
import { getCompanies } from "@/lib/actions/companies";
import { getCallQueue } from "@/lib/actions/calls";
import { getFollowUps } from "@/lib/actions/followups";
import { getMeetings } from "@/lib/actions/meetings";
import { getOpportunities } from "@/lib/actions/opportunities";
import { getLinkedInProspects } from "@/lib/actions/linkedin";
import { ContactDetailDrawer } from "@/components/outreach/contact-detail-drawer";
import { updateOutreachStatus, updateOutreachEntry, deleteOutreachLog, getAllLeadsForPipeline } from "@/lib/actions/ig-dm";
import { type OutreachLead } from "@/lib/types/outreach";

// Semi-Circular Teal Speedometer Gauge for Conversion Rate
function TealGauge({ percentage = 0 }: { percentage?: number }) {
  const strokeWidth = 14;
  const radius = 65;
  const circumference = Math.PI * radius; // Half circle arc length
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center pt-2">
      <svg className="w-56 h-32 overflow-visible" viewBox="0 0 160 90">
        <defs>
          <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f343c" />
            <stop offset="50%" stopColor="#174E59" />
            <stop offset="100%" stopColor="#257584" />
          </linearGradient>
        </defs>
        {/* Background Arc */}
        <path
          d="M 15 80 A 65 65 0 0 1 145 80"
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Active Teal Arc */}
        <path
          d="M 15 80 A 65 65 0 0 1 145 80"
          fill="none"
          stroke="url(#tealGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Central Percentage */}
      <div className="absolute bottom-2 text-center">
        <p className="text-3xl font-black text-slate-900 tracking-tight">{percentage}%</p>
        <p className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Conversion Velocity</p>
      </div>
    </div>
  );
}

export interface DashboardInitialData {
  stats: any;
  activity: any[];
  companies: any[];
  calls: any[];
  followUpsList: any[];
  meetingsList: any[];
  opportunitiesList: any[];
  linkedinProspects: any[];
  outreachLeads?: any[];
}

export function TealCRMDashboardClient({ initialData }: { initialData: DashboardInitialData }) {
  const [stats, setStats] = useState<any>(initialData.stats);
  const [activity, setActivity] = useState<any[]>(initialData.activity);
  const [companies, setCompanies] = useState<any[]>(initialData.companies);
  const [calls, setCalls] = useState<any[]>(initialData.calls);
  const [followUpsList, setFollowUpsList] = useState<any[]>(initialData.followUpsList);
  const [meetingsList, setMeetingsList] = useState<any[]>(initialData.meetingsList);
  const [opportunitiesList, setOpportunitiesList] = useState<any[]>(initialData.opportunitiesList);
  const [linkedinProspects, setLinkedinProspects] = useState<any[]>(initialData.linkedinProspects);
  const [outreachLeads] = useState<any[]>(initialData.outreachLeads || []);

  const [loading, setLoading] = useState(false);
  const [chartView, setChartView] = useState<"monthly" | "yearly">("yearly");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [drawerLead, setDrawerLead] = useState<OutreachLead | null>(null);

  // Data is fetched on the server now

  // Filtered CRM Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchesSearch =
        c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.status?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [companies, searchQuery, statusFilter]);

  // Outreach Follow-ups Remaining (Reached Out 2-3+ Days Ago with No Reply)
  const outreachFollowupsRemaining = useMemo(() => {
    const now = Date.now();
    return outreachLeads.filter(l => {
      const isPendingReply = l.status === "sent" || l.status === "no_reply";
      if (!isPendingReply) return false;
      const sentTime = l.sent_at ? new Date(l.sent_at).getTime() : 0;
      if (!sentTime || isNaN(sentTime)) return false;
      const diffDays = Math.max(0, (now - sentTime) / (1000 * 60 * 60 * 24));
      return diffDays >= 2;
    });
  }, [outreachLeads]);

  const toggleSelectRow = (id: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredCompanies.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredCompanies.map(c => c.id)));
    }
  };

  // Real CRM Data Metrics Only (No hardcoded fallback numbers)
  const totalProspects = companies.length;
  const activePipeline = companies.filter(c => c.status !== 'won' && c.status !== 'lost').length;
  
  const pipelineValue = useMemo(() => {
    return opportunitiesList.reduce((acc, o) => acc + (o.estimated_value || 0), 0);
  }, [opportunitiesList]);

  const meetingsBooked = meetingsList.length;
  const conversionRate = totalProspects > 0 ? Math.round((meetingsBooked / totalProspects) * 1000) / 10 : 0;

  // Real Monthly Lead Activity (Calculated directly from companies database)
  const monthlyBars = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const currentMonthIdx = new Date().getMonth();
    const counts = Array(12).fill(0);

    companies.forEach(c => {
      if (c.created_at) {
        const d = new Date(c.created_at);
        if (d.getFullYear() === currentYear) {
          counts[d.getMonth()] += 1;
        }
      }
    });

    const maxCount = Math.max(...counts, 1);

    return months.map((m, idx) => {
      const count = counts[idx];
      const heightPercent = count > 0 ? `${Math.max(12, Math.round((count / maxCount) * 100))}%` : "0%";
      return {
        month: m,
        count,
        height: heightPercent,
        active: idx === currentMonthIdx,
      };
    });
  }, [companies]);

  const [activeWorkstationTab, setActiveWorkstationTab] = useState<"calls" | "followups" | "outreach_remaining">("calls");

  // Call Ready Leads
  const callReadyLeads = useMemo(() => {
    return companies.filter(c => c.status === "ready_for_call" || c.status === "replied_interested" || c.status === "replied_objection" || c.status === "contacted");
  }, [companies]);

  // Real Channel Distribution Data
  const channelBreakdown = useMemo(() => {
    let li = linkedinProspects.length;
    let ig = 0;
    let wa = 0;
    let direct = 0;

    companies.forEach(c => {
      if (c.linkedin_url || c.source === 'linkedin') li++;
      else if (c.whatsapp || c.source === 'whatsapp') wa++;
      else if (c.source === 'instagram' || c.source === 'ig_dm') ig++;
      else direct++;
    });

    const total = Math.max(1, li + ig + wa + direct);
    return {
      linkedin: { count: li, pct: Math.round((li / total) * 100) },
      whatsapp: { count: wa, pct: Math.round((wa / total) * 100) },
      instagram: { count: ig, pct: Math.round((ig / total) * 100) },
      direct: { count: direct, pct: Math.round((direct / total) * 100) },
      total
    };
  }, [companies, linkedinProspects]);

  // Real Pipeline Stage Funnel Breakdown
  const stageFunnel = useMemo(() => {
    const total = Math.max(1, totalProspects);
    const contacted = companies.filter(c => c.status === "contacted" || c.status === "ready_for_call" || c.status === "meeting_booked").length;
    const ready = callReadyLeads.length;
    const booked = meetingsBooked;

    return [
      { label: "1. Total Database", count: totalProspects, pct: 100, color: "bg-slate-900", textColor: "text-slate-900" },
      { label: "2. Contacted", count: contacted, pct: Math.round((contacted / total) * 100), color: "bg-[#0f343c]", textColor: "text-slate-800" },
      { label: "3. Call Ready", count: ready, pct: Math.round((ready / total) * 100), color: "bg-[#174E59]", textColor: "text-[#174E59]" },
      { label: "4. Meetings Booked", count: booked, pct: Math.round((booked / total) * 100), color: "bg-[#257584]", textColor: "text-[#257584]" },
    ];
  }, [companies, totalProspects, callReadyLeads, meetingsBooked]);

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6 lg:p-8 space-y-5 font-sans max-w-7xl mx-auto">
      
      {/* ── Top Row: 4 High-Density Compact KPI Cards (2 Columns on Mobile) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        
        {/* KPI 1: Total Prospects */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 flex items-center gap-1.5 truncate">
              <Users className="h-3.5 w-3.5 text-[#174E59] shrink-0" /> Prospects
            </span>
            <span className="text-[9px] text-[#174E59] font-extrabold bg-[#174E59]/10 px-1.5 py-0.5 rounded-md border border-[#174E59]/20">Live</span>
          </div>
          <div className="my-2 sm:my-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{totalProspects}</h3>
            {/* Sparkline Graphic */}
            <svg className="h-6 w-14 text-[#174E59]" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M 0 15 Q 10 5, 20 12 T 40 4 L 50 8" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Database CRM Records</p>
        </div>

        {/* KPI 2: To Call Queue */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 flex items-center gap-1.5 truncate">
              <Phone className="h-3.5 w-3.5 text-[#174E59] shrink-0" /> To Call List
            </span>
            <span className="text-[9px] text-amber-700 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">Action</span>
          </div>
          <div className="my-2 sm:my-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{callReadyLeads.length}</h3>
            {/* Sparkline Graphic */}
            <svg className="h-6 w-14 text-[#174E59]" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M 0 18 Q 12 16, 25 8 T 50 2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[10px] sm:text-xs text-[#174E59] font-extrabold truncate">Ready for Phone/WA</p>
        </div>

        {/* KPI 3: Active Pipeline */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 flex items-center gap-1.5 truncate">
              <Send className="h-3.5 w-3.5 text-[#174E59] shrink-0" /> Pipeline
            </span>
            <span className="text-[9px] text-blue-700 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200">Active</span>
          </div>
          <div className="my-2 sm:my-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{activePipeline}</h3>
            <svg className="h-6 w-14 text-slate-400" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M 0 10 Q 15 18, 30 6 T 50 12" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">In Active Workflow</p>
        </div>

        {/* KPI 4: Meetings Booked */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 flex items-center gap-1.5 truncate">
              <Calendar className="h-3.5 w-3.5 text-[#174E59] shrink-0" /> Meetings
            </span>
            <span className="text-[9px] text-[#174E59] font-extrabold bg-[#174E59]/10 px-1.5 py-0.5 rounded-md border border-[#174E59]/20">Booked</span>
          </div>
          <div className="my-2 sm:my-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{meetingsBooked}</h3>
            <svg className="h-6 w-14 text-[#174E59]" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M 0 16 Q 15 14, 30 5 T 50 1" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Executive Meetings</p>
        </div>

      </div>

      {/* ── NEW VISUAL DATA GRAPHICS SECTION: Funnel & Channels ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Graph 1: Stage Progression Funnel Visualization */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-teal-600" /> Stage Progression Funnel
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Real-time prospect movement</p>
            </div>
            <span className="text-xs font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
              {conversionRate}% Conv. Rate
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {stageFunnel.map((stage, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-700">{stage.label}</span>
                  <span className={cn("font-extrabold", stage.textColor)}>{stage.count} <span className="text-[10px] text-slate-400 font-normal">({stage.pct}%)</span></span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                  <div
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", stage.color)}
                    style={{ width: `${Math.max(4, stage.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Graph 2: Lead Acquisition Channel Share Distribution */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <PieChart className="h-4 w-4 text-teal-600" /> Lead Channel Breakdown
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Distribution across acquisition channels</p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
              {channelBreakdown.total} Leads
            </span>
          </div>

          <div className="space-y-3">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex p-0.5 border border-slate-200/80 gap-0.5">
              <div className="bg-blue-600 h-full rounded-l-full transition-all duration-700" style={{ width: `${channelBreakdown.linkedin.pct}%` }} title={`LinkedIn: ${channelBreakdown.linkedin.pct}%`} />
              <div className="bg-teal-600 h-full transition-all duration-700" style={{ width: `${channelBreakdown.whatsapp.pct}%` }} title={`WhatsApp: ${channelBreakdown.whatsapp.pct}%`} />
              <div className="bg-slate-900 h-full transition-all duration-700" style={{ width: `${channelBreakdown.instagram.pct}%` }} title={`Instagram: ${channelBreakdown.instagram.pct}%`} />
              <div className="bg-slate-400 h-full rounded-r-full transition-all duration-700" style={{ width: `${channelBreakdown.direct.pct}%` }} title={`Direct: ${channelBreakdown.direct.pct}%`} />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span>LinkedIn Outreach</span>
                </div>
                <p className="text-base font-black text-slate-900 mt-1">{channelBreakdown.linkedin.count} <span className="text-[10px] text-slate-400 font-medium">({channelBreakdown.linkedin.pct}%)</span></p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <div className="h-2.5 w-2.5 rounded-full bg-teal-600 shrink-0" />
                  <span>WhatsApp Direct</span>
                </div>
                <p className="text-base font-black text-slate-900 mt-1">{channelBreakdown.whatsapp.count} <span className="text-[10px] text-slate-400 font-medium">({channelBreakdown.whatsapp.pct}%)</span></p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-900 shrink-0" />
                  <span>Instagram DM</span>
                </div>
                <p className="text-base font-black text-slate-900 mt-1">{channelBreakdown.instagram.count} <span className="text-[10px] text-slate-400 font-medium">({channelBreakdown.instagram.pct}%)</span></p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <div className="h-2.5 w-2.5 rounded-full bg-slate-400 shrink-0" />
                  <span>Direct / Database</span>
                </div>
                <p className="text-base font-black text-slate-900 mt-1">{channelBreakdown.direct.count} <span className="text-[10px] text-slate-400 font-medium">({channelBreakdown.direct.pct}%)</span></p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── WORKSTATION SECTION: To Call List & Follow-up Urgency ────────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>BDM Workstation</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Prospects requiring phone/WhatsApp calls and follow-up urgency tracking.
            </p>
          </div>

          {/* Sub-tabs matching user screenshot */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1 flex-wrap">
            <button
              onClick={() => setActiveWorkstationTab("calls")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                activeWorkstationTab === "calls" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Calls ({callReadyLeads.length})</span>
            </button>

            <button
              onClick={() => setActiveWorkstationTab("outreach_remaining")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                activeWorkstationTab === "outreach_remaining"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Follow-ups Remaining</span>
              <span className={cn(
                "text-[10px] font-black px-1.5 py-0.5 rounded-full",
                activeWorkstationTab === "outreach_remaining" ? "bg-white text-amber-950" : "bg-amber-100 text-amber-900"
              )}>
                {outreachFollowupsRemaining.length}
              </span>
            </button>

            <button
              onClick={() => setActiveWorkstationTab("followups")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2",
                activeWorkstationTab === "followups" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Tasks ({followUpsList.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: TO CALL LIST */}
        {activeWorkstationTab === "calls" && (
          <div className="space-y-3">
            {callReadyLeads.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <Phone className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No prospects currently queued for calling.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Leads marked "Ready for Call" or "Replied" will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {callReadyLeads.map((c) => {
                  const contact = c.contacts?.[0];
                  const primaryName = contact?.full_name || c.company_name;
                  const phone = contact?.phone || c.phone || contact?.whatsapp || c.whatsapp;
                  const waUrl = phone ? `https://wa.me/968${phone.replace(/[^0-9]/g, "").slice(-8)}` : null;

                  return (
                    <div key={c.id} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between space-y-3 hover:border-teal-300 transition-all shadow-2xs">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200 uppercase tracking-wider">
                            {c.status === "ready_for_call" ? "Ready to Call" : c.status}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 mt-2 truncate">{primaryName}</h4>
                          <p className="text-xs text-slate-500 font-medium truncate">{contact?.title ? `${contact.title} @ ` : ''}{c.company_name}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                        <div className="text-[11px] font-bold text-slate-600 font-mono">
                          {phone || "No phone listed"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {phone && (
                            <a
                              href={`tel:${phone}`}
                              className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-bold text-[11px] hover:bg-slate-800 transition-all flex items-center gap-1"
                            >
                              <Phone className="h-3 w-3" /> Call
                            </a>
                          )}
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 font-bold text-[11px] hover:bg-teal-100 transition-all flex items-center gap-1"
                            >
                              <MessageCircle className="h-3 w-3" /> WA
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: OUTREACH FOLLOW-UPS REMAINING (2-3+ DAYS AGO) */}
        {activeWorkstationTab === "outreach_remaining" && (
          <div className="space-y-3">
            {outreachFollowupsRemaining.length === 0 ? (
              <div className="text-center py-8 bg-amber-50/40 rounded-2xl border border-amber-200/80 border-dashed">
                <Clock className="h-6 w-6 text-amber-400 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-amber-950">No outreach follow-ups overdue!</p>
                <p className="text-[11px] text-amber-800 mt-0.5">All contacts reached out 2-3+ days ago have received follow-ups or replies.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-amber-200/80 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-amber-50/60 border-b border-amber-200/80 text-amber-950 font-extrabold text-[11px]">
                    <tr>
                      <th className="p-3">Company / Business</th>
                      <th className="p-3">Channel & Handle</th>
                      <th className="p-3">Elapsed Time</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/60 font-medium text-slate-800">
                    {outreachFollowupsRemaining.map((lead) => {
                      const sentDate = lead.sent_at ? new Date(lead.sent_at).getTime() : Date.now();
                      const daysAgo = Math.floor((Date.now() - sentDate) / (1000 * 60 * 60 * 24));
                      const phone = lead.phone || (lead.channel === "cold_call" || lead.channel === "whatsapp" ? lead.handle : null);
                      const waUrl = phone ? `https://wa.me/${phone.replace(/\D/g, "")}` : null;

                      return (
                        <tr key={lead.id} className="hover:bg-amber-50/30 transition-colors">
                          <td className="p-3 font-bold text-slate-900">
                            {lead.company_name}
                            <span className="text-[10px] font-normal text-slate-400 block">{lead.industry || 'General'}</span>
                          </td>
                          <td className="p-3 text-slate-700 font-medium">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-md border border-amber-200 inline-block mb-0.5">
                              {lead.channel}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 block truncate max-w-[140px]">{lead.handle}</span>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-black bg-amber-100 text-amber-950 px-2.5 py-1 rounded-lg border border-amber-300">
                              ⏰ {daysAgo === 0 ? "Today" : `${daysAgo} Days Overdue`}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {waUrl && (
                                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-[10px] font-extrabold hover:bg-emerald-200 transition-colors">
                                  WA
                                </a>
                              )}
                              {phone && (
                                <a href={`tel:${phone}`} className="px-2 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-extrabold hover:bg-slate-800 transition-colors">
                                  Call
                                </a>
                              )}
                              <button
                                onClick={() => setDrawerLead(lead as any)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-extrabold hover:bg-slate-800 transition-colors cursor-pointer"
                              >
                                Card →
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: FOLLOW-UP URGENCY */}
        {activeWorkstationTab === "followups" && (
          <div className="space-y-3">
            {followUpsList.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">All follow-ups are up to date!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {followUpsList.map((fu, idx) => {
                  const urgencyLabel = idx % 3 === 0 ? "HIGH URGENCY" : idx % 3 === 1 ? "MEDIUM URGENCY" : "NORMAL";
                  const urgencyClass = idx % 3 === 0 ? "bg-red-50 text-red-700 border-red-200" : idx % 3 === 1 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-teal-50 text-teal-700 border-teal-200";

                  return (
                    <div key={fu.id || idx} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider", urgencyClass)}>
                          {urgencyLabel}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">Due Today</span>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-slate-900 truncate">{fu.companies?.company_name || fu.title || "Follow-up Prospect"}</h4>
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{fu.notes || fu.description || "Follow up on previous proposal touchpoint."}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400">Action Needed</span>
                        <Link href="/outreach">
                          <Button size="sm" className="h-7 text-[11px] font-extrabold bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-2.5">
                            Take Action
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Middle Grid: Outreach Velocity Timeline + Teal Speedometer ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Outreach & Lead Velocity Timeline Graph (Bigger Card) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#174E59]/10 text-[#174E59] border border-[#174E59]/20 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-[#174E59]" /> Outreach Velocity
                </span>
                <span className="text-xs font-bold text-slate-400">Live CRM Dynamics</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                {totalProspects} <span className="text-xs font-bold text-slate-500">Total Leads Tracked</span>
              </h2>
            </div>

            {/* Toggle + Legend */}
            <div className="flex flex-col items-end gap-2.5">
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
                <button
                  onClick={() => setChartView("monthly")}
                  className={cn(
                    "px-3.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    chartView === "monthly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setChartView("yearly")}
                  className={cn(
                    "px-3.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    chartView === "yearly" ? "bg-slate-900 text-white shadow-xs" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Monthly Timeline
                </button>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#174E59]" /> New Leads
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Touchpoints
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#0f343c]" /> Meetings
                </span>
              </div>
            </div>
          </div>

          {/* Bar & Curve Timeline Chart Graphic */}
          <div className="pt-4 pb-2">
            <div className="h-52 flex items-end justify-between gap-2 px-2 relative">
              
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-slate-300 font-bold">
                <div className="border-b border-dashed border-slate-100 pb-1">High Velocity</div>
                <div className="border-b border-dashed border-slate-100 pb-1">Medium</div>
                <div className="border-b border-dashed border-slate-100 pb-1">Baseline</div>
                <div>0</div>
              </div>

              {monthlyBars.map((b, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end z-10 group relative">
                  
                  {/* Active Month Floating Tooltip */}
                  {b.count > 0 && (
                    <div className="absolute -top-10 bg-slate-900 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-xl shadow-lg flex flex-col items-center border border-slate-700 z-20">
                      <span>{b.count} new leads</span>
                      <div className="w-2 h-2 bg-slate-900 rotate-45 -mb-1 shadow-xs" />
                    </div>
                  )}

                  {/* Dual Bar Graphic Stack */}
                  <div className="w-full max-w-[28px] flex items-end justify-center gap-0.5 h-full">
                    {/* Primary Lead Bar */}
                    <div
                      style={{ height: b.height }}
                      className={cn(
                        "w-full rounded-t-xl transition-all duration-500",
                        b.count > 0
                          ? "bg-gradient-to-t from-[#0f343c] via-[#174E59] to-[#257584] shadow-md shadow-[#174E59]/20"
                          : "bg-slate-100"
                      )}
                    />
                  </div>
                  <span className={cn("text-[11px] font-bold mt-2", b.count > 0 ? "text-[#174E59] font-black" : "text-slate-400")}>
                    {b.month}
                  </span>
                </div>
              ))}

            </div>
          </div>



        </div>

        {/* Right Column: Teal Conversion Speedometer Overview */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">Conversion Velocity</h3>
            <button className="text-slate-400 hover:text-slate-600 text-xs font-bold">•••</button>
          </div>

          {/* Speedometer Gauge Graphic */}
          <div className="my-auto py-4">
            <TealGauge percentage={conversionRate} />
          </div>

          {/* Bottom Metrics with Teal Progress Bar */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400 font-bold">Converted Meetings</p>
                <p className="text-base font-black text-slate-900 mt-0.5">{meetingsBooked} Deals</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-bold">Total Prospects: <span className="text-slate-900 font-black">{totalProspects}</span></p>
              </div>
            </div>
            {/* Teal Progress Bar */}
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                style={{ width: `${Math.min(100, Math.max(0, conversionRate))}%` }}
                className="h-full bg-gradient-to-r from-teal-700 via-teal-600 to-teal-400 rounded-full transition-all duration-500 shadow-xs"
              />
            </div>
          </div>

        </div>

      </div>

      {/* ── Bottom Section: Recent Real CRM Pipeline Activity Table ──────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
        
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Recent CRM Pipeline Activity</h2>
            <p className="text-xs text-slate-400 font-medium">Real-time prospects and outreach activities from your database.</p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search CRM prospects..."
                className="pl-9 text-xs bg-slate-50 border-slate-200 rounded-2xl h-9 focus:bg-white"
              />
            </div>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-2xl h-9 px-3 font-bold text-slate-700 focus:bg-white cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="prospect">Prospect</option>
              <option value="contacted">Contacted</option>
              <option value="ready_for_call">Call Ready</option>
              <option value="meeting_booked">Meeting Booked</option>
              <option value="opportunity">Opportunity</option>
            </select>

            <Link href="/prospects">
              <Button className="h-9 text-xs font-bold rounded-2xl bg-slate-900 hover:bg-slate-800 text-white">
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Prospect
              </Button>
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.size > 0 && selectedRows.size === filteredCompanies.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Lead ID</th>
                <th className="py-3 px-3">Date Added</th>
                <th className="py-3 px-3">Company / Prospect</th>
                <th className="py-3 px-3">Industry</th>
                <th className="py-3 px-3">Pipeline Status</th>
                <th className="py-3 px-3">Contact / Handle</th>
                <th className="py-3 px-3 text-right">Est. Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    Loading CRM Pipeline...
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No prospects found in database.
                  </td>
                </tr>
              ) : (
                filteredCompanies.slice(0, 10).map((c) => {
                  const isChecked = selectedRows.has(c.id);
                  const shortId = `#${c.id.slice(0, 6)}`;
                  const dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Today";
                  
                  const isWon = c.status === "meeting_booked" || c.status === "opportunity" || c.status === "won";
                  const isReady = c.status === "ready_for_call" || c.status === "replied_interested";

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors font-medium">
                      <td className="py-3.5 px-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectRow(c.id)}
                          className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-400">{shortId}</td>
                      <td className="py-3.5 px-3 text-slate-500">{dateStr}</td>
                      <td className="py-3.5 px-3 font-extrabold text-slate-900">{c.company_name}</td>
                      <td className="py-3.5 px-3 text-slate-600">{c.industry || "General Enterprise"}</td>
                      <td className="py-3.5 px-3">
                        {isWon ? (
                          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                            {c.status === "meeting_booked" ? "Meeting Booked" : c.status}
                          </span>
                        ) : isReady ? (
                          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                            Call Ready
                          </span>
                        ) : (
                          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {c.status || "Prospect"}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-mono">
                        {c.phone || c.email || (c.website ? c.website.replace("https://", "") : "—")}
                      </td>
                      <td className="py-3.5 px-3 text-right font-black text-slate-900">
                        {c.estimated_value ? `OMR ${c.estimated_value.toLocaleString()}` : "OMR 0"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Standardized Contact Detail Drawer ─────────────────────────────── */}
      <ContactDetailDrawer
        isOpen={!!drawerLead}
        onClose={() => setDrawerLead(null)}
        lead={drawerLead}
        onStatusChange={async (id, s) => {
          await updateOutreachStatus(id, { status: s });
        }}
        onDelete={async (id) => {
          await deleteOutreachLog(id);
        }}
        onSaveEntry={async (id, data) => {
          await updateOutreachEntry(id, data);
        }}
      />
    </div>
  );
}
