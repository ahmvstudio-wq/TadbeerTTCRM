"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, Send, Phone, Clock, Calendar, TrendingUp, AlertTriangle,
  Building2, ChevronDown, ChevronRight, Zap, Flame, DollarSign,
  Activity, ArrowRight, MessageCircle, Mail, ExternalLink, CheckCircle2,
  BarChart3, PieChart, RefreshCw, ShieldAlert, ArrowUpRight, Plus, Filter,
  Target, Layers, Compass, Award, Percent, CheckSquare, LineChart, Briefcase, Search, Loader2,
  FileCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatWhatsAppNumber, formatPhoneNumberForDisplay, isValidLinkedInUrl } from "@/lib/utils";
import { getDashboardStats, getRecentActivity } from "@/lib/actions/dashboard";
import { getCompanies } from "@/lib/actions/companies";
import { getCallQueue } from "@/lib/actions/calls";
import { getFollowUps } from "@/lib/actions/followups";
import { getMeetings } from "@/lib/actions/meetings";
import { getOpportunities } from "@/lib/actions/opportunities";
import { getLinkedInProspects } from "@/lib/actions/linkedin";
import { updateOutreachStatus, updateOutreachEntry, deleteOutreachLog, getAllLeadsForPipeline } from "@/lib/actions/ig-dm";
import { type OutreachLead } from "@/lib/types/outreach";
import { useUnifiedLead } from "@/context/unified-lead-context";
import { generateDailyCallBatch, getOrCreateDailyCallBatch } from "@/lib/actions/cadence";
import { ToCallListDrawer } from "@/components/dashboard/to-call-list-drawer";
import { PowerHourModal } from "@/components/outreach/power-hour-modal";
import { getChannelDailyBatch } from "@/lib/actions/ig-dm";
import { type OutreachChannel, CHANNEL_CONFIG } from "@/lib/types/outreach";
import { Badge } from "@/components/ui/badge";

// Semi-Circular Dark Teal Speedometer Gauge for Conversion Rate
function TealGauge({ percentage = 0 }: { percentage?: number }) {
  const strokeWidth = 14;
  const radius = 65;
  const circumference = Math.PI * radius; // Half circle arc length
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center pt-2">
      <svg className="w-56 h-32 overflow-visible" viewBox="0 0 160 90">
        <defs>
          <linearGradient id="darkTealGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#091f24" />
            <stop offset="50%" stopColor="#0f343c" />
            <stop offset="100%" stopColor="#2d7a88" />
          </linearGradient>
        </defs>
        {/* Background Arc */}
        <path
          d="M 15 80 A 65 65 0 0 1 145 80"
          fill="none"
          stroke="#f0f0f0"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Active Arc */}
        <path
          d="M 15 80 A 65 65 0 0 1 145 80"
          fill="none"
          stroke="url(#darkTealGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Central Percentage */}
      <div className="absolute bottom-2 text-center">
        <p className="text-3xl font-black text-black font-mono tracking-tight">{percentage}%</p>
        <p className="text-[10px] font-bold text-neutral-400 mt-0.5 uppercase tracking-wider font-mono">Conversion Rate</p>
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
  const router = useRouter();
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

  const refreshDashboardData = useCallback(async () => {
    try {
      const [statsRes, compRes, fuRes, meetingsRes, outreachRes] = await Promise.all([
        getDashboardStats(),
        getCompanies(),
        getFollowUps("pending"),
        getMeetings("upcoming"),
        getAllLeadsForPipeline("all")
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (compRes.data) setCompanies(compRes.data);
      if (fuRes.data) setFollowUpsList(fuRes.data);
      if (meetingsRes.data) setMeetingsList(meetingsRes.data);
      if (outreachRes.data) setOutreachLeads(outreachRes.data);
    } catch (err) {
      console.error("Dashboard silent refresh error:", err);
    }
  }, []);

  useEffect(() => {
    const handleLeadUpdated = () => {
      refreshDashboardData();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("lead-updated", handleLeadUpdated);
      return () => window.removeEventListener("lead-updated", handleLeadUpdated);
    }
  }, [refreshDashboardData]);

  // Verified Uncontacted & Ready Leads with Phone/WhatsApp
  const callReadyLeads = useMemo(() => {
    return companies.filter(c => {
      if (c.status === "won" || c.status === "lost" || c.status === "dormant") return false;
      const phoneNum = c.phone || (c.contacts && c.contacts.find((cnt: any) => cnt.phone || cnt.whatsapp)?.phone) || (c.contacts && c.contacts.find((cnt: any) => cnt.whatsapp)?.whatsapp);
      return Boolean(phoneNum && String(phoneNum).trim().length >= 7);
    });
  }, [companies]);

  // Outreach Follow-ups Remaining (Explicitly designated follow-ups only)
  const outreachFollowupsRemaining = useMemo(() => {
    return outreachLeads.filter(l => (l.status === "follow_up_due" || l.needs_followup === true) && !["not_now_snoozed", "lost", "dormant"].includes(l.status));
  }, [outreachLeads]);

  const totalProspects = stats?.total_companies ?? companies.length;
  const inOutreachCount = stats?.in_outreach ?? companies.filter(c => c.status === 'contacted' || c.status === 'in_call_queue' || c.status === 'meeting_booked' || c.pipeline_stage === 'Contacted' || c.pipeline_stage === 'Replied').length;
  const activePipeline = inOutreachCount;
  
  const pipelineValue = useMemo(() => {
    return opportunitiesList.reduce((acc, o) => acc + (o.estimated_value || 0), 0);
  }, [opportunitiesList]);

  const meetingsBooked = stats?.upcoming_meetings ?? meetingsList.length;
  const conversionRate = stats?.conversion_rate ?? (totalProspects > 0 ? Math.round((meetingsBooked / totalProspects) * 1000) / 10 : 0);

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

  // Real Channel Distribution Data (Strict Database Saved Truth)
  const channelBreakdown = useMemo(() => {
    if (stats?.channel_breakdown && companies.length === stats.total_companies) {
      return stats.channel_breakdown;
    }
    let li = 0;
    let ig = 0;
    let wa = 0;
    let direct = 0;

    companies.forEach(c => {
      const src = (c.lead_source || '').toLowerCase();
      if (src.includes('whatsapp')) {
        wa++;
      } else if (src.includes('instagram')) {
        ig++;
      } else if (src.includes('linkedin')) {
        li++;
      } else {
        direct++;
      }
    });

    const total = Math.max(1, companies.length);
    return {
      linkedin: { count: li, pct: Math.round((li / total) * 100) },
      whatsapp: { count: wa, pct: Math.round((wa / total) * 100) },
      instagram: { count: ig, pct: Math.round((ig / total) * 100) },
      direct: { count: direct, pct: Math.round((direct / total) * 100) },
      total: companies.length
    };
  }, [companies, stats]);

  // Real Pipeline Stage Funnel Breakdown (Strict Database Saved Truth)
  const stageFunnel = useMemo(() => {
    if (stats?.stage_funnel && companies.length === stats.total_companies) {
      return stats.stage_funnel;
    }
    const total = Math.max(1, totalProspects);
    const contacted = companies.filter(c => c.status === "contacted" || c.pipeline_stage === "Contacted" || c.pipeline_stage === "Replied" || c.pipeline_stage === "Call Ready" || c.status === "in_call_queue" || c.status === "meeting_booked" || c.status === "opportunity").length;
    const ready = companies.filter(c => c.pipeline_stage === "Call Ready" || c.status === "in_call_queue").length;
    const booked = meetingsBooked;

    return [
      { label: "1. Total Database", count: totalProspects, pct: 100, color: "bg-slate-900", textColor: "text-slate-900" },
      { label: "2. Contacted", count: contacted, pct: Math.round((contacted / total) * 100), color: "bg-[#0f343c]", textColor: "text-slate-800" },
      { label: "3. Call Ready", count: ready, pct: Math.round((ready / total) * 100), color: "bg-[#174E59]", textColor: "text-[#174E59]" },
      { label: "4. Meetings Booked", count: booked, pct: Math.round((booked / total) * 100), color: "bg-[#257584]", textColor: "text-[#257584]" },
    ];
  }, [companies, totalProspects, meetingsBooked, stats]);

  return (
    <div className="min-h-screen bg-transparent p-3 sm:p-6 lg:p-8 space-y-5 font-sans max-w-7xl mx-auto">
      
      {/* ── TOP OF DASHBOARD: Dedicated Lean White/Black Outreach Workstation ── */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-black/[0.06] shadow-glass space-y-6 font-sans">
        
        {/* Section 1: Today's Calls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-black/[0.04]">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-[#0f343c] border border-[#16434d] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-light text-neutral-900 tracking-tight font-display">
                  Today&apos;s Calls
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-[#0f343c]/10 text-[#0f343c] border border-[#0f343c]/20">
                  20 Calls
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-[#0f343c] text-white border border-[#16434d]">
                  Ready
                </span>
              </div>
              <p className="text-xs text-[#6b7280] mt-1 font-light font-body">
                Call uncontacted leads with ready scripts and 1-click dialing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap font-mono">
            <Button
              onClick={() => setIsToCallDrawerOpen(true)}
              variant="outline"
              className="bg-white hover:bg-neutral-50 text-neutral-900 font-bold text-xs px-4 py-2.5 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-all cursor-pointer shadow-2xs"
            >
              <Phone className="h-3.5 w-3.5 mr-1 text-neutral-600" />
              View Call List ({dailyCallBatch.length > 0 ? dailyCallBatch.length : 20})
            </Button>
            <Button
              onClick={() => handleLaunchChannelPowerHour('cold_call')}
              disabled={loadingChannel === 'cold_call'}
              className="bg-[#0f343c] hover:bg-[#091f24] text-white border border-[#16434d] font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {loadingChannel === 'cold_call' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-white fill-current" />}
              Start Calling Batch
            </Button>
          </div>
        </div>

        {/* Section 2: Remaining 4 Digital Outreach Channels */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-neutral-900 tracking-tight flex items-center gap-1.5">
                  Daily Outreach
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0f343c]/10 text-[#0f343c] border border-[#0f343c]/20">
                  Target: 25 / channel
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 font-medium">
                Ready leads with prepared messages. No duplicates.
              </p>
            </div>
            <Link
              href="/outreach"
              className="text-xs font-bold text-[#0f343c] hover:text-[#091f24] flex items-center gap-1 transition-colors self-start sm:self-auto group"
            >
              View All Outreach
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* 4 Digital Channel Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            {/* Channel 1: Instagram */}
            <div className="p-4 rounded-2xl bg-white/60 hover:bg-white border border-black/[0.05] hover:border-black/[0.15] hover:shadow-glass transition-all duration-150 flex flex-col justify-between space-y-3.5 group shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#f5f5f7] border border-black/[0.04] text-black flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-black group-hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="3.5"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-normal text-neutral-900 font-display">Instagram</h4>
                  <p className="text-[11px] text-[#8a8d95] font-light font-body">Target: 25 / day</p>
                </div>
              </div>
              <Button
                onClick={() => handleLaunchChannelPowerHour('instagram_dm')}
                disabled={loadingChannel === 'instagram_dm'}
                className="w-full bg-black hover:bg-neutral-800 text-white font-normal text-xs py-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs font-body"
              >
                {loadingChannel === 'instagram_dm' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Start 25 Batch
              </Button>
            </div>

            {/* Channel 2: WhatsApp */}
            <div className="p-4 rounded-2xl bg-white/60 hover:bg-white border border-black/[0.05] hover:border-black/[0.15] hover:shadow-glass transition-all duration-150 flex flex-col justify-between space-y-3.5 group shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#f5f5f7] border border-black/[0.04] text-black flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-black group-hover:text-white transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-normal text-neutral-900 font-display">WhatsApp</h4>
                  <p className="text-[11px] text-[#8a8d95] font-light font-body">Target: 25 / day</p>
                </div>
              </div>
              <Button
                onClick={() => handleLaunchChannelPowerHour('whatsapp')}
                disabled={loadingChannel === 'whatsapp'}
                className="w-full bg-black hover:bg-neutral-800 text-white font-normal text-xs py-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs font-body"
              >
                {loadingChannel === 'whatsapp' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Start 25 Batch
              </Button>
            </div>

            {/* Channel 3: LinkedIn */}
            <div className="p-4 rounded-2xl bg-white/60 hover:bg-white border border-black/[0.05] hover:border-black/[0.15] hover:shadow-glass transition-all duration-150 flex flex-col justify-between space-y-3.5 group shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#f5f5f7] border border-black/[0.04] text-black flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-black group-hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-normal text-neutral-900 font-display">LinkedIn</h4>
                  <p className="text-[11px] text-[#8a8d95] font-light font-body">Target: 25 / day</p>
                </div>
              </div>
              <Button
                onClick={() => handleLaunchChannelPowerHour('linkedin')}
                disabled={loadingChannel === 'linkedin'}
                className="w-full bg-black hover:bg-neutral-800 text-white font-normal text-xs py-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs font-body"
              >
                {loadingChannel === 'linkedin' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Start 25 Batch
              </Button>
            </div>

            {/* Channel 4: Email */}
            <div className="p-4 rounded-2xl bg-white/60 hover:bg-white border border-black/[0.05] hover:border-black/[0.15] hover:shadow-glass transition-all duration-150 flex flex-col justify-between space-y-3.5 group shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-[#f5f5f7] border border-black/[0.04] text-black flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-black group-hover:text-white transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-normal text-neutral-900 font-display">Email</h4>
                  <p className="text-[11px] text-[#8a8d95] font-light font-body">Target: 25 / day</p>
                </div>
              </div>
              <Button
                onClick={() => handleLaunchChannelPowerHour('email')}
                disabled={loadingChannel === 'email'}
                className="w-full bg-black hover:bg-neutral-800 text-white font-normal text-xs py-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs font-body"
              >
                {loadingChannel === 'email' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Start 25 Batch
              </Button>
            </div>

          </div>
        </div>

      </div>

      {/* ── 5 CORE HIGH-DENSITY COMPACT KPI CARDS ──────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 font-mono">
        
        {/* KPI 1: Total Prospects */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-black/[0.06] shadow-glass hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-normal uppercase tracking-wider text-[#6b7280] flex items-center gap-1.5 truncate font-body">
              <Users className="h-3.5 w-3.5 text-black shrink-0" /> Total Leads
            </span>
            <span className="text-[9px] text-black font-medium bg-black/[0.04] px-2 py-0.5 rounded border border-black/[0.06]">LIVE</span>
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <h3 className="text-3xl font-light text-black tracking-tight font-display">{totalProspects}</h3>
          </div>
          <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[10px] text-[#8a8d95] font-light font-body">
            <span>In Database</span>
            <span className="text-black font-mono">All records</span>
          </div>
        </div>

        {/* KPI 2: Active Pipeline */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-black/[0.06] shadow-glass hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-normal uppercase tracking-wider text-[#6b7280] flex items-center gap-1.5 truncate font-body">
              <Send className="h-3.5 w-3.5 text-black shrink-0" /> In Outreach
            </span>
            <span className="text-[9px] text-white font-medium bg-black px-2 py-0.5 rounded">ACTIVE</span>
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <h3 className="text-3xl font-light text-black tracking-tight font-display">{activePipeline}</h3>
          </div>
          <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[10px] text-[#8a8d95] font-light font-body">
            <span>Active</span>
            <span className="text-black font-mono">{activePipeline} in progress</span>
          </div>
        </div>

        {/* KPI 3: Meetings Booked */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-black/[0.06] shadow-glass hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-normal uppercase tracking-wider text-[#6b7280] flex items-center gap-1.5 truncate font-body">
              <Calendar className="h-3.5 w-3.5 text-black shrink-0" /> Meetings
            </span>
            <span className="text-[9px] text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">BOOKED</span>
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <h3 className="text-3xl font-light text-black tracking-tight font-display">{meetingsBooked}</h3>
          </div>
          <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[10px] text-[#8a8d95] font-light font-body">
            <span>Confirmed</span>
            <span className="text-black font-mono">Booked meetings</span>
          </div>
        </div>

        {/* KPI 4: Pending Audits */}
        <Link
          href="/audits?status=pending"
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-black/[0.06] shadow-glass hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-black/20 transition-all flex flex-col justify-between space-y-2 cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-normal uppercase tracking-wider text-[#6b7280] flex items-center gap-1.5 truncate font-body group-hover:text-black">
              <FileCheck className="h-3.5 w-3.5 text-black shrink-0" /> Pending Audits
            </span>
            <span className={cn(
              "text-[9px] font-medium px-2 py-0.5 rounded border font-mono",
              ((stats?.pending_audits ?? 0) > 0)
                ? "text-amber-800 bg-amber-50 border-amber-200"
                : "text-neutral-600 bg-neutral-100 border-neutral-200"
            )}>
              {(stats?.pending_audits ?? 0) > 0 ? "ACTION" : "CLEAR"}
            </span>
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <h3 className="text-3xl font-light text-black tracking-tight font-display">
              {stats?.pending_audits ?? 0}
            </h3>
          </div>
          <div className="pt-2 border-t border-black/[0.04] flex items-center justify-between text-[10px] text-[#8a8d95] font-light font-body">
            <span>Pending Audits</span>
            <span className="text-black font-mono flex items-center gap-0.5 group-hover:underline">
              Open <ArrowRight className="h-2.5 w-2.5" />
            </span>
          </div>
        </Link>

        {/* KPI 5: Estimated Pipeline Value */}
        <div className="bg-[#0c0d0f] rounded-2xl p-4 sm:p-5 border border-black/40 text-white shadow-glass flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-normal uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 truncate font-body">
              <DollarSign className="h-3.5 w-3.5 text-neutral-400 shrink-0" /> Pipeline Value
            </span>
            <span className="text-[9px] text-white font-medium bg-white/15 border border-white/20 px-2 py-0.5 rounded font-mono">{conversionRate}% Conv</span>
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <h3 className="text-3xl font-light text-white tracking-tight font-display">
              {pipelineValue > 0 ? `OMR ${(pipelineValue / 1000).toFixed(1)}k` : "OMR 0"}
            </h3>
          </div>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-400 font-light font-body">
            <span>Estimated Value</span>
            <span className="text-neutral-200 font-mono font-medium">Active pipeline</span>
          </div>
        </div>

      </div>

      {/* ── VISUAL DATA GRAPHICS SECTION: Funnel & Channels ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        
        {/* Graph 1: Stage Progression Funnel Visualization */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-black/[0.06] shadow-glass space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-normal text-black uppercase tracking-wider flex items-center gap-2 font-display">
                <BarChart3 className="h-3.5 w-3.5 text-black" /> Pipeline Stages
              </h3>
              <p className="text-xs text-[#6b7280] font-light font-body mt-0.5">Leads moving through stages</p>
            </div>
            <span className="text-xs font-mono font-medium text-black bg-black/[0.04] border border-black/[0.06] px-2.5 py-1 rounded">
              {conversionRate}% CONV
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {stageFunnel.map((stage: any, idx: number) => {
              const barColor = idx === 0 ? "bg-[#091f24]" : idx === 1 ? "bg-[#0f343c]" : idx === 2 ? "bg-[#16434d]" : "bg-[#1b505b]";
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-light font-body">
                    <span className="text-neutral-800">{stage.label}</span>
                    <span className="font-mono font-normal text-black">{stage.count} <span className="text-[10px] text-[#9ca3af]">({stage.pct}%)</span></span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100/80 rounded-full overflow-hidden p-0.5 border border-black/[0.04]">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", barColor)}
                      style={{ width: `${Math.max(4, stage.pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graph 2: Lead Acquisition Channel Share Distribution */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-black/[0.06] shadow-glass space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-normal text-black uppercase tracking-wider flex items-center gap-2 font-display">
                <PieChart className="h-3.5 w-3.5 text-black" /> Leads by Channel
              </h3>
              <p className="text-xs text-[#6b7280] font-light font-body mt-0.5">Where your leads are reached</p>
            </div>
            <span className="text-xs font-mono font-medium text-neutral-700 bg-black/[0.03] px-2.5 py-1 rounded border border-black/[0.06]">
              {channelBreakdown.total} TOTAL
            </span>
          </div>

          <div className="space-y-3">
            <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden flex border border-black/[0.04] gap-0.5">
              <div className="bg-[#091f24] h-full transition-all duration-700" style={{ width: `${channelBreakdown.linkedin.pct}%` }} title={`LinkedIn: ${channelBreakdown.linkedin.pct}%`} />
              <div className="bg-[#0f343c] h-full transition-all duration-700" style={{ width: `${channelBreakdown.whatsapp.pct}%` }} title={`WhatsApp: ${channelBreakdown.whatsapp.pct}%`} />
              <div className="bg-[#16434d] h-full transition-all duration-700" style={{ width: `${channelBreakdown.instagram.pct}%` }} title={`Instagram: ${channelBreakdown.instagram.pct}%`} />
              <div className="bg-[#2d7a88] h-full transition-all duration-700" style={{ width: `${channelBreakdown.direct.pct}%` }} title={`Direct: ${channelBreakdown.direct.pct}%`} />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1 font-mono">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
                  <div className="h-2 w-2 rounded-full bg-[#091f24] shrink-0" />
                  <span>LinkedIn</span>
                </div>
                <p className="text-sm font-black text-black mt-1">{channelBreakdown.linkedin.count} <span className="text-[10px] text-neutral-400 font-medium">({channelBreakdown.linkedin.pct}%)</span></p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
                  <div className="h-2 w-2 rounded-full bg-[#0f343c] shrink-0" />
                  <span>WhatsApp</span>
                </div>
                <p className="text-sm font-black text-black mt-1">{channelBreakdown.whatsapp.count} <span className="text-[10px] text-neutral-400 font-medium">({channelBreakdown.whatsapp.pct}%)</span></p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
                  <div className="h-2 w-2 rounded-full bg-[#16434d] shrink-0" />
                  <span>Instagram</span>
                </div>
                <p className="text-sm font-black text-black mt-1">{channelBreakdown.instagram.count} <span className="text-[10px] text-neutral-400 font-medium">({channelBreakdown.instagram.pct}%)</span></p>
              </div>

              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
                  <div className="h-2 w-2 rounded-full bg-[#2d7a88] shrink-0" />
                  <span>Direct</span>
                </div>
                <p className="text-sm font-black text-black mt-1">{channelBreakdown.direct.count} <span className="text-[10px] text-neutral-400 font-medium">({channelBreakdown.direct.pct}%)</span></p>
              </div>
            </div>
          </div>
        </div>

      </div>



      {/* ── Middle Grid: Activity Timeline + Speedometer ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Activity Timeline Graph */}
        <div className="lg:col-span-8 bg-white/80 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-black/[0.06] shadow-glass flex flex-col justify-between space-y-5">
          
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-black/[0.04] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-black/[0.04] text-black border border-black/[0.06] uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-black" /> ACTIVITY
                </span>
                <span className="text-xs font-mono font-light text-[#8a8d95]">DAILY ACTIVITY</span>
              </div>
              <h2 className="text-2xl font-light text-black font-display tracking-tight mt-1">
                {totalProspects} <span className="text-xs font-light text-[#6b7280] font-body">Total Leads</span>
              </h2>
            </div>

            {/* Toggle + Legend */}
            <div className="flex flex-col items-end gap-2">
              <div className="bg-[#f5f5f7] p-0.5 rounded-xl flex items-center gap-1 border border-black/[0.04] text-xs font-body">
                <button
                  onClick={() => setChartView("monthly")}
                  className={cn(
                    "px-3 py-1 rounded-lg transition-all cursor-pointer font-light text-xs",
                    chartView === "monthly" ? "bg-white text-black shadow-xs font-normal" : "text-[#6b7280] hover:text-black"
                  )}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setChartView("yearly")}
                  className={cn(
                    "px-3 py-1 rounded-lg transition-all cursor-pointer font-light text-xs",
                    chartView === "yearly" ? "bg-white text-black shadow-xs font-normal" : "text-[#6b7280] hover:text-black"
                  )}
                >
                  Monthly
                </button>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono font-light text-[#8a8d95] flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-black" /> Leads
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#9ca3af]" /> Touches
                </span>
              </div>
            </div>
          </div>

          {/* Bar & Curve Timeline Chart Graphic */}
          <div className="pt-2 pb-1">
            <div className="h-44 flex items-end justify-between gap-1.5 px-2 relative">
              
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] font-mono text-neutral-300 font-bold">
                <div className="border-b border-dashed border-black/[0.04] pb-1">HIGH</div>
                <div className="border-b border-dashed border-black/[0.04] pb-1">MED</div>
                <div className="border-b border-dashed border-black/[0.04] pb-1">BASE</div>
                <div>0</div>
              </div>

              {monthlyBars.map((b, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end z-10 group relative">
                  
                  {/* Active Month Floating Tooltip */}
                  {b.count > 0 && (
                    <div className="absolute -top-9 bg-black text-white font-mono font-medium text-[9px] px-2 py-0.5 rounded shadow-lg flex flex-col items-center z-20">
                      <span>{b.count} leads</span>
                    </div>
                  )}

                  {/* Dual Bar Graphic Stack */}
                  <div className="w-full max-w-[24px] flex items-end justify-center gap-0.5 h-full">
                    <div
                      style={{ height: b.height }}
                      className={cn(
                        "w-full rounded-t-sm transition-all duration-500",
                        b.count > 0 ? "bg-black group-hover:bg-neutral-800" : "bg-neutral-100"
                      )}
                    />
                  </div>
                  <span className={cn("text-[10px] font-mono mt-2", b.count > 0 ? "text-black font-medium" : "text-[#9ca3af]")}>
                    {b.month}
                  </span>
                </div>
              ))}

            </div>
          </div>

        </div>

        {/* Right Column: Speedometer Overview */}
        <div className="lg:col-span-4 bg-white/80 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-black/[0.06] shadow-glass flex flex-col justify-between">
          
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-normal text-black uppercase tracking-wider font-display">Conversion Rate</h3>
            <span className="text-[9px] font-mono font-medium px-2 py-0.5 bg-black/[0.04] rounded text-neutral-700 border border-black/[0.06]">ACTIVE</span>
          </div>

          {/* Speedometer Gauge Graphic */}
          <div className="my-auto py-2">
            <TealGauge percentage={conversionRate} />
          </div>

          {/* Bottom Metrics with Progress Bar */}
          <div className="space-y-2.5 pt-3 border-t border-black/[0.04]">
            <div className="flex items-center justify-between text-xs font-mono">
              <div>
                <p className="text-[10px] text-[#8a8d95] uppercase">Meetings</p>
                <p className="text-sm font-medium text-black mt-0.5">{meetingsBooked} Booked</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-[#8a8d95] uppercase">Total: <span className="text-black font-medium">{totalProspects}</span></p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-black/[0.04]">
              <div
                style={{ width: `${Math.min(100, Math.max(0, conversionRate))}%` }}
                className="h-full bg-black rounded-full transition-all duration-500"
              />
            </div>
          </div>

        </div>

      </div>

      {/* ── Bottom Section: Workspaces Hub ───────────────── */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-black/[0.06] shadow-glass space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.04] pb-3">
          <div>
            <h2 className="text-xs font-normal text-black uppercase tracking-wider flex items-center gap-2 font-display">
              <Compass className="h-3.5 w-3.5 text-black" />
              <span>Workspaces</span>
            </h2>
            <p className="text-xs text-[#6b7280] font-light font-body mt-0.5">
              Jump to any section in the CRM.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-body">
          <Link href="/prospects">
            <div className="p-4 rounded-xl bg-white/60 hover:bg-white border border-black/[0.05] hover:border-black/[0.15] hover:shadow-glass transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center font-normal">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#9ca3af] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-xs font-normal text-black mt-3 uppercase tracking-wider font-display">Prospects</h3>
              <p className="text-[11px] text-[#8a8d95] font-light mt-0.5">All {totalProspects} lead records.</p>
            </div>
          </Link>

          <div onClick={() => setIsToCallDrawerOpen(true)} className="p-4 rounded-xl bg-white/60 hover:bg-white border border-black/[0.05] hover:border-black/[0.15] hover:shadow-glass transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center font-normal">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <span className="text-[9px] font-mono font-medium bg-black/[0.04] text-black px-1.5 py-0.5 rounded border border-black/[0.06]">20 QUEUE</span>
            </div>
            <h3 className="text-xs font-normal text-black mt-3 uppercase tracking-wider font-display">Calls</h3>
            <p className="text-[11px] text-[#8a8d95] font-light mt-0.5">{callReadyLeads.length} leads in call queue.</p>
          </div>

          <Link href="/follow-ups">
            <div className="p-4 rounded-xl bg-white/60 hover:bg-white border border-black/[0.05] hover:border-black/[0.15] hover:shadow-glass transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center font-normal">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#9ca3af] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-xs font-normal text-black mt-3 uppercase tracking-wider font-display">Follow-ups</h3>
              <p className="text-[11px] text-[#8a8d95] font-light mt-0.5">{outreachFollowupsRemaining.length} awaiting reply.</p>
            </div>
          </Link>

          <Link href="/pipeline">
            <div className="p-4 rounded-xl bg-white/60 hover:bg-white border border-black/[0.05] hover:border-black/[0.15] hover:shadow-glass transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-xl bg-black text-white flex items-center justify-center font-normal">
                  <Layers className="h-4 w-4 text-white" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#9ca3af] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-xs font-normal text-black mt-3 uppercase tracking-wider font-display">Pipeline</h3>
              <p className="text-[11px] text-[#8a8d95] font-light mt-0.5">Deals and stages.</p>
            </div>
          </Link>
        </div>
      </div>

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
