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
      
      {/* ── TOP OF DASHBOARD: Dedicated Lean White/Black Outreach Workstation ── */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-neutral-200 shadow-xs space-y-6 font-sans">
        
        {/* Section 1: Today's Calls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-[#0f343c] border border-[#16434d] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                  Today&apos;s Calls
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#0f343c]/10 text-[#0f343c] border border-[#0f343c]/20">
                  20 Calls
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#0f343c] text-white border border-[#16434d]">
                  Ready
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-1 font-medium">
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
            <div className="p-4 rounded-2xl bg-neutral-50/60 hover:bg-white border border-neutral-200 hover:border-[#0f343c] transition-all duration-150 flex flex-col justify-between space-y-3.5 group shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white border border-neutral-200 text-[#0f343c] flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#0f343c] transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="3.5"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-black text-neutral-900">Instagram</h4>
                  <p className="text-[11px] text-neutral-400 font-medium">Target: 25 / day</p>
                </div>
              </div>
              <Button
                onClick={() => handleLaunchChannelPowerHour('instagram_dm')}
                disabled={loadingChannel === 'instagram_dm'}
                className="w-full bg-white hover:bg-[#0f343c] text-neutral-900 hover:text-white border border-neutral-200 hover:border-[#0f343c] font-bold text-xs py-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs font-mono"
              >
                {loadingChannel === 'instagram_dm' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Start 25 Batch
              </Button>
            </div>

            {/* Channel 2: WhatsApp */}
            <div className="p-4 rounded-2xl bg-neutral-50/60 hover:bg-white border border-neutral-200 hover:border-[#0f343c] transition-all duration-150 flex flex-col justify-between space-y-3.5 group shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white border border-neutral-200 text-[#0f343c] flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#0f343c] transition-colors">
                  <MessageCircle className="h-4 w-4 text-[#0f343c]" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-neutral-900">WhatsApp</h4>
                  <p className="text-[11px] text-neutral-400 font-medium">Target: 25 / day</p>
                </div>
              </div>
              <Button
                onClick={() => handleLaunchChannelPowerHour('whatsapp')}
                disabled={loadingChannel === 'whatsapp'}
                className="w-full bg-white hover:bg-[#0f343c] text-neutral-900 hover:text-white border border-neutral-200 hover:border-[#0f343c] font-bold text-xs py-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs font-mono"
              >
                {loadingChannel === 'whatsapp' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Start 25 Batch
              </Button>
            </div>

            {/* Channel 3: LinkedIn */}
            <div className="p-4 rounded-2xl bg-neutral-50/60 hover:bg-white border border-neutral-200 hover:border-[#0f343c] transition-all duration-150 flex flex-col justify-between space-y-3.5 group shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white border border-neutral-200 text-[#0f343c] flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#0f343c] transition-colors">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-black text-neutral-900">LinkedIn</h4>
                  <p className="text-[11px] text-neutral-400 font-medium">Target: 25 / day</p>
                </div>
              </div>
              <Button
                onClick={() => handleLaunchChannelPowerHour('linkedin')}
                disabled={loadingChannel === 'linkedin'}
                className="w-full bg-white hover:bg-[#0f343c] text-neutral-900 hover:text-white border border-neutral-200 hover:border-[#0f343c] font-bold text-xs py-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs font-mono"
              >
                {loadingChannel === 'linkedin' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Start 25 Batch
              </Button>
            </div>

            {/* Channel 4: Email */}
            <div className="p-4 rounded-2xl bg-neutral-50/60 hover:bg-white border border-neutral-200 hover:border-[#0f343c] transition-all duration-150 flex flex-col justify-between space-y-3.5 group shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white border border-neutral-200 text-[#0f343c] flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#0f343c] transition-colors">
                  <Mail className="h-4 w-4 text-[#0f343c]" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-neutral-900">Email</h4>
                  <p className="text-[11px] text-neutral-400 font-medium">Target: 25 / day</p>
                </div>
              </div>
              <Button
                onClick={() => handleLaunchChannelPowerHour('email')}
                disabled={loadingChannel === 'email'}
                className="w-full bg-white hover:bg-[#0f343c] text-neutral-900 hover:text-white border border-neutral-200 hover:border-[#0f343c] font-bold text-xs py-2 rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs font-mono"
              >
                {loadingChannel === 'email' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Start 25 Batch
              </Button>
            </div>

          </div>
        </div>

      </div>

      {/* ── 4 CORE HIGH-DENSITY COMPACT KPI CARDS ──────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 font-mono">
        
        {/* KPI 1: Total Prospects */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-neutral-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5 truncate">
              <Users className="h-3.5 w-3.5 text-[#0f343c] shrink-0" /> Total Leads
            </span>
            <span className="text-[9px] text-[#0f343c] font-bold bg-[#0f343c]/10 px-2 py-0.5 rounded border border-[#0f343c]/20">LIVE</span>
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-black tracking-tight">{totalProspects}</h3>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500 font-bold font-sans">
            <span>In Database</span>
            <span className="text-black font-mono">All records</span>
          </div>
        </div>

        {/* KPI 2: Active Pipeline */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-neutral-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5 truncate">
              <Send className="h-3.5 w-3.5 text-[#0f343c] shrink-0" /> In Outreach
            </span>
            <span className="text-[9px] text-white font-bold bg-[#0f343c] border border-[#16434d] px-2 py-0.5 rounded">ACTIVE</span>
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-black tracking-tight">{activePipeline}</h3>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500 font-bold font-sans">
            <span>Active</span>
            <span className="text-[#0f343c] font-mono">{activePipeline} in progress</span>
          </div>
        </div>

        {/* KPI 3: Meetings Booked */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-neutral-200 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5 truncate">
              <Calendar className="h-3.5 w-3.5 text-[#0f343c] shrink-0" /> Meetings
            </span>
            <span className="text-[9px] text-[#0f343c] font-bold bg-[#0f343c]/10 border border-[#0f343c]/20 px-2 py-0.5 rounded">BOOKED</span>
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-black tracking-tight">{meetingsBooked}</h3>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500 font-bold font-sans">
            <span>Confirmed</span>
            <span className="text-[#0f343c] font-mono">Booked meetings</span>
          </div>
        </div>

        {/* KPI 4: Estimated Pipeline Value (Dark Teal) */}
        <div className="bg-[#091f24] rounded-xl p-4 sm:p-5 border border-[#16434d] text-white shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5 truncate">
              <DollarSign className="h-3.5 w-3.5 text-[#2d7a88] shrink-0" /> Pipeline Value
            </span>
            <span className="text-[9px] text-white font-bold bg-[#16434d] border border-[#235863] px-2 py-0.5 rounded">{conversionRate}% Conv</span>
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <h3 className="text-3xl font-black text-white tracking-tight">
              {pipelineValue > 0 ? `OMR ${(pipelineValue / 1000).toFixed(1)}k` : "OMR 0"}
            </h3>
          </div>
          <div className="pt-2 border-t border-[#16434d] flex items-center justify-between text-[10px] text-neutral-400 font-bold font-sans">
            <span>Estimated Value</span>
            <span className="text-neutral-200 font-mono font-bold">Active pipeline</span>
          </div>
        </div>

      </div>

      {/* ── VISUAL DATA GRAPHICS SECTION: Funnel & Channels ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        
        {/* Graph 1: Stage Progression Funnel Visualization */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5 text-[#0f343c]" /> Pipeline Stages
              </h3>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">Leads moving through stages</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#0f343c] bg-[#0f343c]/10 border border-[#0f343c]/20 px-2.5 py-1 rounded">
              {conversionRate}% CONV
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {stageFunnel.map((stage, idx) => {
              const barColor = idx === 0 ? "bg-[#091f24]" : idx === 1 ? "bg-[#0f343c]" : idx === 2 ? "bg-[#16434d]" : "bg-[#1b505b]";
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-neutral-800">{stage.label}</span>
                    <span className="font-mono font-black text-black">{stage.count} <span className="text-[10px] text-neutral-400 font-normal">({stage.pct}%)</span></span>
                  </div>
                  <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200">
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
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
                <PieChart className="h-3.5 w-3.5 text-[#0f343c]" /> Leads by Channel
              </h3>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">Where your leads are reached</p>
            </div>
            <span className="text-xs font-mono font-bold text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded border border-neutral-200">
              {channelBreakdown.total} TOTAL
            </span>
          </div>

          <div className="space-y-3">
            <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden flex border border-neutral-200 gap-0.5">
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
        <div className="lg:col-span-8 bg-white rounded-xl p-5 border border-neutral-200 shadow-xs flex flex-col justify-between space-y-5">
          
          {/* Header */}
          <div className="flex items-start justify-between flex-wrap gap-4 border-b border-neutral-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-neutral-100 text-black border border-neutral-200 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-black" /> ACTIVITY
                </span>
                <span className="text-xs font-mono font-bold text-neutral-400">DAILY ACTIVITY</span>
              </div>
              <h2 className="text-2xl font-black text-black font-mono tracking-tight mt-1">
                {totalProspects} <span className="text-xs font-bold text-neutral-500 font-sans">Total Leads</span>
              </h2>
            </div>

            {/* Toggle + Legend */}
            <div className="flex flex-col items-end gap-2">
              <div className="bg-neutral-100 p-0.5 rounded-lg flex items-center gap-1 border border-neutral-200 text-xs font-bold">
                <button
                  onClick={() => setChartView("monthly")}
                  className={cn(
                    "px-3 py-1 rounded transition-all cursor-pointer",
                    chartView === "monthly" ? "bg-black text-white shadow-xs font-black" : "text-neutral-500 hover:text-black"
                  )}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setChartView("yearly")}
                  className={cn(
                    "px-3 py-1 rounded transition-all cursor-pointer",
                    chartView === "yearly" ? "bg-black text-white shadow-xs font-black" : "text-neutral-500 hover:text-black"
                  )}
                >
                  Monthly
                </button>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-neutral-500 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-black" /> Leads
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-neutral-500" /> Touches
                </span>
              </div>
            </div>
          </div>

          {/* Bar & Curve Timeline Chart Graphic */}
          <div className="pt-2 pb-1">
            <div className="h-44 flex items-end justify-between gap-1.5 px-2 relative">
              
              {/* Horizontal Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] font-mono text-neutral-300 font-bold">
                <div className="border-b border-dashed border-neutral-100 pb-1">HIGH</div>
                <div className="border-b border-dashed border-neutral-100 pb-1">MED</div>
                <div className="border-b border-dashed border-neutral-100 pb-1">BASE</div>
                <div>0</div>
              </div>

              {monthlyBars.map((b, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end z-10 group relative">
                  
                  {/* Active Month Floating Tooltip */}
                  {b.count > 0 && (
                    <div className="absolute -top-9 bg-black text-white font-mono font-black text-[9px] px-2 py-0.5 rounded shadow-lg flex flex-col items-center z-20">
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
                  <span className={cn("text-[10px] font-mono font-bold mt-2", b.count > 0 ? "text-black font-black" : "text-neutral-400")}>
                    {b.month}
                  </span>
                </div>
              ))}

            </div>
          </div>

        </div>

        {/* Right Column: Speedometer Overview */}
        <div className="lg:col-span-4 bg-white rounded-xl p-5 border border-neutral-200 shadow-xs flex flex-col justify-between">
          
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-black uppercase tracking-wider">Conversion Rate</h3>
            <span className="text-[9px] font-mono font-black px-2 py-0.5 bg-neutral-100 rounded text-neutral-700">ACTIVE</span>
          </div>

          {/* Speedometer Gauge Graphic */}
          <div className="my-auto py-2">
            <TealGauge percentage={conversionRate} />
          </div>

          {/* Bottom Metrics with Progress Bar */}
          <div className="space-y-2.5 pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs font-mono">
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Meetings</p>
                <p className="text-sm font-black text-black mt-0.5">{meetingsBooked} Booked</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Total: <span className="text-black font-black">{totalProspects}</span></p>
              </div>
            </div>
            <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200">
              <div
                style={{ width: `${Math.min(100, Math.max(0, conversionRate))}%` }}
                className="h-full bg-black rounded-full transition-all duration-500"
              />
            </div>
          </div>

        </div>

      </div>

      {/* ── Bottom Section: Workspaces Hub ───────────────── */}
      <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-3">
          <div>
            <h2 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
              <Compass className="h-3.5 w-3.5 text-black" />
              <span>Workspaces</span>
            </h2>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              Jump to any section in the CRM.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/prospects">
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 hover:border-black hover:bg-white transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded bg-black text-white flex items-center justify-center font-bold">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-xs font-black text-black mt-3 uppercase tracking-wider">Prospects</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">All {totalProspects} lead records.</p>
            </div>
          </Link>

          <div onClick={() => setIsToCallDrawerOpen(true)} className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 hover:border-black hover:bg-white transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 rounded bg-black text-white flex items-center justify-center font-bold">
                <Phone className="h-4 w-4 text-white" />
              </div>
              <span className="text-[9px] font-mono font-black bg-neutral-200 text-black px-1.5 py-0.5 rounded">20 QUEUE</span>
            </div>
            <h3 className="text-xs font-black text-black mt-3 uppercase tracking-wider">Calls</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">{callReadyLeads.length} leads in call queue.</p>
          </div>

          <Link href="/follow-ups">
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 hover:border-black hover:bg-white transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded bg-black text-white flex items-center justify-center font-bold">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-xs font-black text-black mt-3 uppercase tracking-wider">Follow-ups</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">{outreachFollowupsRemaining.length} awaiting reply.</p>
            </div>
          </Link>

          <Link href="/pipeline">
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 hover:border-black hover:bg-white transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded bg-black text-white flex items-center justify-center font-bold">
                  <Layers className="h-4 w-4 text-white" />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
              </div>
              <h3 className="text-xs font-black text-black mt-3 uppercase tracking-wider">Pipeline</h3>
              <p className="text-[11px] text-neutral-500 mt-0.5">Deals and stages.</p>
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
