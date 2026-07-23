"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users, Send, Phone, Clock, Calendar, TrendingUp, AlertTriangle,
  Building2, ChevronDown, ChevronRight, Sparkles, Zap, Flame, DollarSign,
  Activity, ArrowRight, MessageCircle, Mail, ExternalLink, CheckCircle2,
  BarChart3, PieChart, RefreshCw, ShieldAlert, ArrowUpRight, Plus, Filter,
  Target, Layers, Compass, Award, Percent, CheckSquare, LineChart, Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDashboardStats, getRecentActivity } from "@/lib/actions/dashboard";
import { getCompanies } from "@/lib/actions/companies";
import { getCallQueue } from "@/lib/actions/calls";
import { getFollowUps } from "@/lib/actions/followups";
import { getMeetings } from "@/lib/actions/meetings";
import { getOpportunities } from "@/lib/actions/opportunities";
import { getLinkedInProspects } from "@/lib/actions/linkedin";
import { formatOmanWhatsAppUrl, isValidLinkedInUrl } from "@/app/(app)/prospects/page";

// Inline LinkedIn Icon
function LinkedInIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "Recently";
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Raw datasets
  const [companies, setCompanies] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [followUpsList, setFollowUpsList] = useState<any[]>([]);
  const [meetingsList, setMeetingsList] = useState<any[]>([]);
  const [opportunitiesList, setOpportunitiesList] = useState<any[]>([]);
  const [linkedinProspects, setLinkedinProspects] = useState<any[]>([]);

  // Interactivity Filters
  const [selectedStageFilter, setSelectedStageFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'action' | 'calls' | 'pipeline' | 'activity'>('action');

  useEffect(() => {
    async function fetchData() {
      const [
        statsRes,
        activityRes,
        compRes,
        callsRes,
        fuRes,
        meetingsRes,
        oppsRes,
        liRes
      ] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(15),
        getCompanies(),
        getCallQueue(),
        getFollowUps("pending"),
        getMeetings("upcoming"),
        getOpportunities(),
        getLinkedInProspects()
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (activityRes.data) setActivity(activityRes.data);
      if (compRes.data) setCompanies(compRes.data);
      if (callsRes.data) setCalls(callsRes.data);
      if (fuRes.data) setFollowUpsList(fuRes.data);
      if (meetingsRes.data) setMeetingsList(meetingsRes.data);
      if (oppsRes.data) setOpportunitiesList(oppsRes.data);
      if (liRes.data) setLinkedinProspects(liRes.data);

      setLoading(false);
    }
    fetchData();
  }, []);

  // ── Derived Funnel Metrics ────────────────────────────────────────────────
  const totalCompanies = companies.length;
  const prospectsCount = companies.filter(c => c.status === 'prospect').length;
  const contactedCount = companies.filter(c => c.status === 'contacted').length;
  const bookedCount = companies.filter(c => c.status === 'meeting_booked').length;
  const opportunityCount = companies.filter(c => c.status === 'opportunity').length;
  const wonCount = companies.filter(c => c.status === 'won').length;

  const pipelineValue = useMemo(() => {
    return opportunitiesList.reduce((acc, o) => acc + (o.estimated_value || 0), 0);
  }, [opportunitiesList]);

  // Industry Breakdown Metrics
  const industryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    companies.forEach(c => {
      const ind = c.industry || 'Corporate / General';
      counts[ind] = (counts[ind] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: totalCompanies > 0 ? Math.round((count / totalCompanies) * 100) : 0
    })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [companies, totalCompanies]);

  // Lead Temperature Breakdown
  const leadTypeStats = useMemo(() => {
    const types = ['Hot', 'Warm', 'Cold', 'VIP', 'Inbound', 'Referral'];
    return types.map(t => {
      const cnt = companies.filter(c => (c.lead_type || 'Cold') === t).length;
      return {
        type: t,
        count: cnt,
        pct: totalCompanies > 0 ? Math.round((cnt / totalCompanies) * 100) : 0
      };
    });
  }, [companies, totalCompanies]);

  // Channel breakdown metrics
  const linkedinLeadCount = useMemo(() => {
    return companies.filter(c => 
      c.lead_source === 'LinkedIn' || 
      isValidLinkedInUrl(c.linkedin_url) || 
      isValidLinkedInUrl(c.contacts?.[0]?.linkedin_url) ||
      c.notes?.toLowerCase().includes('linkedin')
    ).length;
  }, [companies]);

  const overdueActions = useMemo(() => {
    return followUpsList.filter(f => f.due_date < new Date().toISOString().split('T')[0] && f.status === 'pending');
  }, [followUpsList]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-white rounded-3xl border border-slate-200 shadow-sm m-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-teal mb-3" />
        <p className="text-slate-600 font-bold text-sm">Loading Executive Operations Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter pb-24 max-w-[1650px] mx-auto px-2 sm:px-4 font-sans">

      {/* ── Executive Operations Dark Hero Banner ──────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-slate-800">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-60 -bottom-20 h-60 w-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold mb-3">
              <Zap className="h-3.5 w-3.5 text-teal-400 fill-teal-400" />
              <span>Real-Time Sales Operations & Visual Analytics</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Executive CRM Command & Analytics</h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl font-medium leading-relaxed">
              Data visualizations, pipeline conversion funnel graphics, industry segment distribution, and interconnected BDM workstation triggers.
            </p>
          </div>

          {/* Quick Launcher Shortcuts */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/daily-cadence">
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg shadow-teal-500/25 text-xs font-bold h-10 rounded-xl px-4 border border-emerald-400/30 transition-all hover:scale-105">
                <Phone className="h-4 w-4 mr-2 fill-white/20" />Launch Cadence Call Queue
              </Button>
            </Link>
            <Link href="/linkedin">
              <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold h-10 rounded-xl px-4 backdrop-blur-md">
                <LinkedInIcon size={14} /> <span className="ml-2">10-Stage LinkedIn BD</span>
              </Button>
            </Link>
            <Link href="/prospects">
              <Button variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs font-bold h-10 rounded-xl px-4 backdrop-blur-md">
                <Building2 className="h-4 w-4 mr-2 text-teal-300" />Prospects Hub
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Key Financial & Operational Pulse Cards ───────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 flex-shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pipeline Value</p>
              <p className="text-2xl font-black text-white leading-tight mt-0.5">
                OMR {pipelineValue > 0 ? (pipelineValue >= 1000 ? (pipelineValue / 1000).toFixed(1) + 'K' : pipelineValue.toLocaleString()) : '0'}
              </p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 flex-shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Prospect Base</p>
              <p className="text-2xl font-black text-white leading-tight mt-0.5">{totalCompanies}</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center text-red-300 flex-shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overdue Actions</p>
              <p className="text-2xl font-black text-white leading-tight mt-0.5">{overdueActions.length}</p>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">LinkedIn CRM Tracked</p>
              <p className="text-2xl font-black text-white leading-tight mt-0.5">{linkedinProspects.length || linkedinLeadCount} Contacts</p>
            </div>
            <LinkedInIcon size={24} />
          </div>
        </div>
      </div>

      {/* ── Visual Graphics Grid Section 1 ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 1. Interactive Conversion Funnel Graphic (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-brand-teal" />
                Pipeline Conversion Funnel Visualizer
              </h3>
              <p className="text-xs text-slate-500 font-medium">Click any stage bar to filter live prospect records dynamically.</p>
            </div>
            {selectedStageFilter && (
              <Button size="sm" variant="ghost" onClick={() => setSelectedStageFilter(null)} className="text-xs text-brand-teal font-bold bg-teal-50 hover:bg-teal-100">
                Reset Filter
              </Button>
            )}
          </div>

          {/* CSS Interactive Funnel Bars */}
          <div className="space-y-3 pt-2">
            {[
              { key: 'prospect', label: '1. Uncontacted Prospects', count: prospectsCount, color: 'bg-slate-700 text-white' },
              { key: 'contacted', label: '2. Outreach & Cadence Initiated', count: contactedCount, color: 'bg-blue-600 text-white' },
              { key: 'meeting_booked', label: '3. Executive Demos & Meetings Booked', count: bookedCount, color: 'bg-purple-600 text-white' },
              { key: 'opportunity', label: '4. Open Commercial Proposals', count: opportunityCount, color: 'bg-teal-600 text-white' },
              { key: 'won', label: '5. Closed Deals Won', count: wonCount, color: 'bg-emerald-500 text-white' },
            ].map((stage) => {
              const pct = totalCompanies > 0 ? Math.round((stage.count / totalCompanies) * 100) : 0;
              const isSelected = selectedStageFilter === stage.key;

              return (
                <div
                  key={stage.key}
                  onClick={() => setSelectedStageFilter(isSelected ? null : stage.key)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                    isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]' : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className={isSelected ? 'text-white' : 'text-slate-900'}>{stage.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] opacity-80">{pct}% Conversion Rate</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${stage.color}`}>{stage.count} Leads</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-200/70 h-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${stage.color.split(' ')[0]}`} style={{ width: `${Math.max(pct, stage.count > 0 ? 5 : 0)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Channel & Source Velocity Graphic (1 col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-brand-teal" />
                Channel Velocity & Outlets
              </h3>
            </div>

            <div className="space-y-3.5 pt-4">
              {(() => {
                const liCount = linkedinProspects.length || linkedinLeadCount;
                const waCount = companies.filter(c => c.contacts?.[0]?.whatsapp || c.phone).length;
                const liPct = totalCompanies > 0 ? Math.round((liCount / totalCompanies) * 100) : 0;
                const waPct = totalCompanies > 0 ? Math.round((waCount / totalCompanies) * 100) : 0;
                const mtgPct = totalCompanies > 0 ? Math.round((meetingsList.length / totalCompanies) * 100) : 0;

                return (
                  <>
                    <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-blue-900">
                        <span className="flex items-center gap-1.5"><LinkedInIcon size={14} /> LinkedIn BD Network</span>
                        <span className="text-base font-black">{liCount} Leads</span>
                      </div>
                      <div className="w-full bg-blue-200/60 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(liPct, liCount > 0 ? 5 : 0)}%` }} />
                      </div>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-emerald-900">
                        <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4 text-emerald-600" /> WhatsApp (+968 Oman)</span>
                        <span className="text-base font-black">{waCount} Direct Outlets</span>
                      </div>
                      <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(waPct, waCount > 0 ? 5 : 0)}%` }} />
                      </div>
                    </div>

                    <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-purple-900">
                        <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-purple-600" /> Executive Demos</span>
                        <span className="text-base font-black">{meetingsList.length} Scheduled</span>
                      </div>
                      <div className="w-full bg-purple-200/60 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(mtgPct, meetingsList.length > 0 ? 5 : 0)}%` }} />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>


          <Link href="/prospects" className="w-full">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs h-10 rounded-xl">
              View Prospects Directory <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Visual Graphics Grid Section 2: Industry & Lead Temperature ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 3. Industry Sector Segment Distribution Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-brand-teal" />
              Industry Sector Segment Breakdown
            </h3>
            <span className="text-xs font-bold text-slate-400">Top 5 Target Markets</span>
          </div>

          <div className="space-y-3.5 pt-2">
            {industryStats.map((ind, idx) => {
              const colors = [
                'bg-teal-500 text-white',
                'bg-blue-600 text-white',
                'bg-purple-600 text-white',
                'bg-amber-500 text-white',
                'bg-slate-700 text-white',
              ];
              const barColor = colors[idx % colors.length];

              return (
                <div key={ind.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="truncate max-w-[240px]">{ind.name}</span>
                    <span className="text-slate-500">{ind.count} Accounts ({ind.pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${barColor.split(' ')[0]}`} style={{ width: `${Math.max(ind.pct, 8)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Lead Categorization Temperature Gauge */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Flame className="h-5 w-5 text-red-500" />
              Lead Temperature & Account Categorization
            </h3>
            <span className="text-xs font-bold text-slate-400">Active Segmentation</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {leadTypeStats.map((lt) => {
              const badges: Record<string, { label: string; bg: string; text: string; border: string }> = {
                Hot: { label: '🔥 Hot Lead', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
                Warm: { label: '☀️ Warm Lead', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
                Cold: { label: '❄️ Cold Lead', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                VIP: { label: '👑 VIP Account', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                Inbound: { label: '📥 Inbound', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
                Referral: { label: '🤝 Referral', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
              };
              const style = badges[lt.type] || badges.Cold;

              return (
                <div key={lt.type} className={`p-4 rounded-2xl border ${style.bg} ${style.border} flex flex-col justify-between space-y-2`}>
                  <span className={`text-xs font-black ${style.text}`}>{style.label}</span>
                  <div>
                    <span className="text-2xl font-black text-slate-900">{lt.count}</span>
                    <span className="text-[10px] text-slate-500 font-bold block">{lt.pct}% of Base</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* ── Interconnected BDM Operations Workstation ──────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up">
        {/* Workstation Header Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('action')}
            className={`py-4 text-xs font-black border-b-2 mr-6 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'action' ? "border-brand-teal text-brand-teal" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span>🚨 Overdue & Immediate Actions ({overdueActions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`py-4 text-xs font-black border-b-2 mr-6 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'calls' ? "border-brand-teal text-brand-teal" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Phone className="h-4 w-4 text-teal-600" />
            <span>📞 Call Queue ({calls.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`py-4 text-xs font-black border-b-2 mr-6 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'pipeline' ? "border-brand-teal text-brand-teal" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span>💼 Active Opportunities ({opportunitiesList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-4 text-xs font-black border-b-2 mr-6 whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'activity' ? "border-brand-teal text-brand-teal" : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Activity className="h-4 w-4 text-blue-600" />
            <span>⚡ Audit Activity Feed</span>
          </button>
        </div>

        {/* Workstation Tab Body */}
        <div className="p-6">
          {activeTab === 'action' ? (
            /* Tab 1: Overdue Actions */
            overdueActions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">All actions are caught up!</h4>
                <p className="text-xs text-slate-500 mt-0.5">No overdue follow-up tasks in your pipeline.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {overdueActions.map(action => {
                  const waUrl = formatOmanWhatsAppUrl(action.contacts?.whatsapp || action.contacts?.phone);
                  return (
                    <div key={action.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold flex-shrink-0">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{action.subject || 'Follow-up Action'}</p>
                          <p className="text-xs text-slate-500 font-medium">
                            {action.companies?.company_name} · Contact: <span className="font-bold text-slate-800">{action.contacts?.full_name || 'Primary Contact'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-100 text-red-700 border border-red-200">
                          Due {action.due_date}
                        </span>
                        {waUrl && (
                          <a href={waUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white font-bold text-xs flex items-center gap-1 transition-colors">
                            <MessageCircle className="h-4 w-4" /> WhatsApp (+968)
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : activeTab === 'calls' ? (
            /* Tab 2: Call Queue */
            calls.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <Phone className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">Call queue is empty</h4>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {calls.map(call => (
                  <div key={call.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{call.companies?.company_name}</p>
                      <p className="text-xs text-slate-500">Contact: {call.contacts?.full_name || 'N/A'} · Phone: {call.contacts?.phone || 'N/A'}</p>
                    </div>
                    <Link href="/daily-cadence">
                      <Button size="sm" className="bg-brand-teal text-white font-bold text-xs h-8 rounded-lg">
                        Call Now
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'pipeline' ? (
            /* Tab 3: Opportunities */
            opportunitiesList.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800">No open commercial opportunities</h4>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {opportunitiesList.map(opp => (
                  <div key={opp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{opp.name || 'Commercial Opportunity'}</h4>
                        <p className="text-xs text-slate-500">{opp.companies?.company_name}</p>
                      </div>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        OMR {opp.estimated_value ? (opp.estimated_value).toLocaleString() : '0'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Tab 4: Audit Stream */
              <div className="space-y-3">
                {activity.map(act => (
                  <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{act.title}</span>
                      {act.companies?.company_name && <span className="text-slate-500 font-medium"> · {act.companies.company_name}</span>}
                      {act.description && <p className="text-slate-600 mt-0.5">{act.description}</p>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">{timeAgo(act.created_at)}</span>
                  </div>
                ))}
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
