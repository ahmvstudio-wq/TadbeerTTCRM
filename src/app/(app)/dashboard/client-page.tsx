"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users, Send, Phone, Clock, Calendar, TrendingUp, AlertTriangle,
  Building2, ChevronDown, ChevronRight, Sparkles, Zap, Flame, DollarSign,
  Activity, ArrowRight, MessageCircle, Mail, ExternalLink, CheckCircle2,
  BarChart3, PieChart, RefreshCw, ShieldAlert, ArrowUpRight, Plus, Filter,
  Target, Layers, Compass, Award, Percent, CheckSquare, LineChart, Briefcase, Search, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatWhatsAppNumber, formatPhoneNumberForDisplay } from "@/lib/utils";
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
import { useUnifiedLead } from "@/context/unified-lead-context";
import { generateDailyCallBatch, getOrCreateDailyCallBatch } from "@/lib/actions/cadence";
import { ToCallListDrawer } from "@/components/dashboard/to-call-list-drawer";
import { PowerHourModal } from "@/components/outreach/power-hour-modal";
import { getChannelDailyBatch } from "@/lib/actions/ig-dm";
import { type OutreachChannel, CHANNEL_CONFIG } from "@/lib/types/outreach";
import { Badge } from "@/components/ui/badge";

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
  const [outreachLeads, setOutreachLeads] = useState<any[]>(initialData.outreachLeads || []);
  const { openLead } = useUnifiedLead();
  const [loading, setLoading] = useState(false);
  const [generatingBatch, setGeneratingBatch] = useState(false);
  const [dailyBatchLeads, setDailyBatchLeads] = useState<any[]>([]);
  const [isToCallDrawerOpen, setIsToCallDrawerOpen] = useState(false);
  const [dailyCallBatch, setDailyCallBatch] = useState<any[]>([]);

  // Multi-Channel Power-Hour State
  const [powerHourOpen, setPowerHourOpen] = useState(false);
  const [powerHourChannel, setPowerHourChannel] = useState<OutreachChannel>('instagram_dm');
  const [powerHourLeads, setPowerHourLeads] = useState<OutreachLead[]>([]);
  const [loadingChannel, setLoadingChannel] = useState<string | null>(null);

  useEffect(() => {
    async function loadBatch() {
      const res = await getOrCreateDailyCallBatch(20, "Ramij");
      if (res.data && res.data.length > 0) {
        setDailyCallBatch(res.data);
      }
    }
    loadBatch();
  }, []);

  const handleLaunchChannelPowerHour = async (channel: OutreachChannel) => {
    setLoadingChannel(channel);
    try {
      const res = await getChannelDailyBatch(channel, 25);
      if (res.data && res.data.length > 0) {
        setPowerHourLeads(res.data);
        setPowerHourChannel(channel);
        setPowerHourOpen(true);
      } else {
        alert(`No uncontacted leads currently available for ${CHANNEL_CONFIG[channel]?.label || channel}. All leads on this channel have been contacted or need new list imports!`);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingChannel(null);
    }
  };

  const handleGenerateCallBatch = async () => {
    setGeneratingBatch(true);
    const res = await generateDailyCallBatch(20, "Ramij");
    if (res.data) {
      setDailyBatchLeads(res.data);
      setDailyCallBatch(res.data);
    }
    setGeneratingBatch(false);
  };
  const [chartView, setChartView] = useState<"monthly" | "yearly">("yearly");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [drawerLead, setDrawerLead] = useState<OutreachLead | null>(null);

  // Data is fetched on the server now

  // Verified Uncontacted & Ready Leads with Phone/WhatsApp
  const callReadyLeads = useMemo(() => {
    return companies.filter(c => {
      if (c.status === "won" || c.status === "lost" || c.status === "dormant") return false;
      const phoneNum = c.phone || (c.contacts && c.contacts.find((cnt: any) => cnt.phone || cnt.whatsapp)?.phone) || (c.contacts && c.contacts.find((cnt: any) => cnt.whatsapp)?.whatsapp);
      return Boolean(phoneNum && String(phoneNum).trim().length >= 7);
    });
  }, [companies]);

  // Filtered CRM Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchesSearch =
        c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.status?.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === "call_ready") {
        const phoneNum = c.phone || (c.contacts && c.contacts.find((cnt: any) => cnt.phone || cnt.whatsapp)?.phone) || (c.contacts && c.contacts.find((cnt: any) => cnt.whatsapp)?.whatsapp);
        matchesStatus = Boolean(phoneNum && String(phoneNum).trim().length >= 7) && c.status !== "won" && c.status !== "lost" && c.status !== "dormant";
      } else if (statusFilter !== "all") {
        matchesStatus = c.status === statusFilter;
      }
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
      
      {/* ── TOP OF DASHBOARD: Dedicated To-Call List Workstation ────────────── */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0f343c] text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-black text-xl shrink-0 shadow-inner">
              📞
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  Today&apos;s To-Call List
                </h2>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/30 text-[10px] font-bold">
                  Daily 20 Limit
                </Badge>
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-[10px] font-bold">
                  Zero Contradictions
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Strict uncontacted phone queue with pre-staged 30-second cold call scripts & 1-click dialers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              onClick={() => setIsToCallDrawerOpen(true)}
              className="bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-white/15 transition cursor-pointer"
            >
              <Phone className="h-3.5 w-3.5 text-amber-400" />
              Open Call List ({dailyCallBatch.length > 0 ? dailyCallBatch.length : 20})
            </Button>
            <Button
              onClick={() => handleLaunchChannelPowerHour('cold_call')}
              disabled={loadingChannel === 'cold_call'}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              {loadingChannel === 'cold_call' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 fill-current" />}
              Launch Cold Call 25 Batch
            </Button>
          </div>
        </div>
      </div>

      {/* ── BELOW: REMAINING 4 DIGITAL OUTREACH CHANNELS (25/day Target) ───── */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-teal-400" /> Today&apos;s Multi-Channel Daily Targets
              </h3>
              <Badge className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-[10px] font-bold">
                Remaining 4 Channels (25 / Day)
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict uncontacted queues with pre-staged sequences — zero duplicate touches or contradictions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/outreach" className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition">
              Open Master Outreach Board <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* 4 Remaining Channel Cards: Instagram, WhatsApp, LinkedIn, Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Channel 1: Instagram DM */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-teal-400 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-400 font-bold text-sm">
                  📸
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Instagram DM</h4>
                  <p className="text-[10px] text-slate-400">Target: 25 / day</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleLaunchChannelPowerHour('instagram_dm')}
              disabled={loadingChannel === 'instagram_dm'}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs py-2 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loadingChannel === 'instagram_dm' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Launch 25 Batch
            </Button>
          </div>

          {/* Channel 2: WhatsApp */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-400 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  💬
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">WhatsApp</h4>
                  <p className="text-[10px] text-slate-400">Target: 25 / day</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleLaunchChannelPowerHour('whatsapp')}
              disabled={loadingChannel === 'whatsapp'}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loadingChannel === 'whatsapp' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Launch 25 Batch
            </Button>
          </div>

          {/* Channel 3: LinkedIn */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-blue-400 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                  🔗
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">LinkedIn Note</h4>
                  <p className="text-[10px] text-slate-400">Target: 25 / day</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleLaunchChannelPowerHour('linkedin')}
              disabled={loadingChannel === 'linkedin'}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loadingChannel === 'linkedin' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Launch 25 Batch
            </Button>
          </div>

          {/* Channel 4: Email */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-violet-400 transition-all flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-400 font-bold text-sm">
                  ✉️
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Direct Email</h4>
                  <p className="text-[10px] text-slate-400">Target: 25 / day</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleLaunchChannelPowerHour('email')}
              disabled={loadingChannel === 'email'}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs py-2 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loadingChannel === 'email' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Launch 25 Batch
            </Button>
          </div>

        </div>
      </div>

      {/* ── 4 CORE HIGH-DENSITY COMPACT KPI CARDS ──────────────────────────── */}
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
            <svg className="h-6 w-14 text-[#174E59]" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M 0 15 Q 10 5, 20 12 T 40 4 L 50 8" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Database CRM Records</p>
        </div>

        {/* KPI 2: Active Pipeline */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 flex items-center gap-1.5 truncate">
              <Send className="h-3.5 w-3.5 text-[#174E59] shrink-0" /> Pipeline
            </span>
            <span className="text-[9px] text-blue-700 font-extrabold bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200">Active</span>
          </div>
          <div className="my-2 sm:my-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{activePipeline}</h3>
            <svg className="h-6 w-14 text-blue-500" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M 0 10 Q 15 18, 30 6 T 50 12" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">In Active Workflow</p>
        </div>

        {/* KPI 3: Meetings Booked */}
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

        {/* KPI 4: Estimated Pipeline Value / Conversion */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500 flex items-center gap-1.5 truncate">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> Pipeline Value
            </span>
            <span className="text-[9px] text-emerald-800 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">{conversionRate}% Conv</span>
          </div>
          <div className="my-2 sm:my-3 flex items-baseline justify-between">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {pipelineValue > 0 ? `OMR ${(pipelineValue / 1000).toFixed(1)}k` : "OMR 0"}
            </h3>
            <svg className="h-6 w-14 text-emerald-600" viewBox="0 0 50 20" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M 0 18 Q 12 16, 25 8 T 50 2" strokeLinecap="round" />
            </svg>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 font-medium truncate">Estimated Deal Value</p>
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

      {/* ── Bottom Section: Executive CRM Quick Access Hub ───────────────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Compass className="h-5 w-5 text-teal-700" />
              <span>CRM Module Workspaces</span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Access full contact records, call queues, follow-ups, and sales pipelines in their dedicated views.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/prospects">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-400 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <Users className="h-5 w-5 text-teal-400" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mt-3">Prospects View</h3>
              <p className="text-xs text-slate-500 mt-0.5">All {totalProspects} prospect companies and contacts in database.</p>
            </div>
          </Link>

          <div onClick={() => setIsToCallDrawerOpen(true)} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-400 transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold">
                <Phone className="h-5 w-5 text-teal-200" />
              </div>
              <span className="text-[10px] font-black bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">Daily 20</span>
            </div>
            <h3 className="text-sm font-black text-slate-900 mt-3">To Call List Drawer</h3>
            <p className="text-xs text-slate-500 mt-0.5">{callReadyLeads.length} verified phone leads in daily batch queue.</p>
          </div>

          <Link href="/follow-ups">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-amber-400 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Clock className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mt-3">Follow-ups View</h3>
              <p className="text-xs text-slate-500 mt-0.5">{outreachFollowupsRemaining.length} outreach touches awaiting reply.</p>
            </div>
          </Link>

          <Link href="/pipeline">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-400 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Layers className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mt-3">Pipeline View</h3>
              <p className="text-xs text-slate-500 mt-0.5">Kanban board & deal tracking stages.</p>
            </div>
          </Link>
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

      {/* ── Dedicated Slide-Over Window for Daily To Call List ──────────── */}
      <ToCallListDrawer
        isOpen={isToCallDrawerOpen}
        onClose={() => setIsToCallDrawerOpen(false)}
        initialLeads={dailyCallBatch.length > 0 ? dailyCallBatch : callReadyLeads.slice(0, 20)}
        totalPoolCount={callReadyLeads.length}
      />

      {/* ── Dedicated Power-Hour Focus Mode Modal ──────────────────────── */}
      <PowerHourModal
        isOpen={powerHourOpen}
        onClose={() => setPowerHourOpen(false)}
        channel={powerHourChannel}
        leads={powerHourLeads}
        onLeadSent={(sentId) => {
          setPowerHourLeads(prev => prev.filter(l => l.id !== sentId));
        }}
      />
    </div>
  );
}
