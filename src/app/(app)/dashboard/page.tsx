"use client";

import { useState, useEffect } from "react";
import { Users, Send, Phone, Clock, Calendar, TrendingUp, AlertTriangle, Building2, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getDashboardStats, getRecentActivity } from "@/lib/actions/dashboard";
import { getCompanies } from "@/lib/actions/companies";
import { getCallQueue } from "@/lib/actions/calls";
import { getFollowUps } from "@/lib/actions/followups";
import { getMeetings } from "@/lib/actions/meetings";
import { getOpportunities } from "@/lib/actions/opportunities";

function getDotColor(type: string): string {
  switch (type) {
    case "outreach":
    case "message":
    case "whatsapp_sent":
    case "linkedin_sent":
    case "email_sent":
      return "bg-green-500";
    case "call":
    case "call_made":
    case "call_received":
    case "call_completed":
      return "bg-amber-500";
    case "followup":
    case "follow_up_scheduled":
    case "follow_up_completed":
      return "bg-blue-500";
    case "meeting":
    case "meeting_booked":
    case "meeting_completed":
      return "bg-purple-500";
    case "opportunity":
    case "opportunity_created":
    case "opportunity_stage_changed":
      return "bg-teal-500";
    case "status_changed":
    case "company_created":
      return "bg-slate-500";
    default:
      return "bg-slate-400";
  }
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now.getTime() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded Lists state
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);
  const [followUpsList, setFollowUpsList] = useState<any[]>([]);
  const [meetingsList, setMeetingsList] = useState<any[]>([]);
  const [opportunitiesList, setOpportunitiesList] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [
        statsRes,
        activityRes,
        compRes,
        callsRes,
        fuRes,
        meetingsRes,
        oppsRes
      ] = await Promise.all([
        getDashboardStats(),
        getRecentActivity(10),
        getCompanies(),
        getCallQueue(),
        getFollowUps("pending"),
        getMeetings("upcoming"),
        getOpportunities()
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (activityRes.data) setActivity(activityRes.data);
      if (compRes.data) setCompanies(compRes.data);
      if (callsRes.data) setCalls(callsRes.data);
      if (fuRes.data) setFollowUpsList(fuRes.data);
      if (meetingsRes.data) setMeetingsList(meetingsRes.data);
      if (oppsRes.data) setOpportunitiesList(oppsRes.data);

      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-teal mx-auto mb-3" />
          <p className="text-text-muted text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingCalls = stats?.calls_by_outcome?.pending ?? 0;
  const dueFollowUps = stats?.pending_follow_ups ?? 0;
  const overdueFollowUps = stats?.overdue_follow_ups ?? 0;
  const upcomingMeetings = stats?.upcoming_meetings ?? 0;
  const openOpportunities = stats?.pipeline?.open_opportunities ?? 0;
  const pipelineValue = stats?.pipeline?.total_value ?? 0;
  const prospects = stats?.companies_by_status?.prospect ?? 0;

  const statCards = [
    { label: "Total Prospects", value: stats?.total_companies ?? 0, sub: "companies", icon: Building2, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "New Prospects", value: prospects, sub: "to contact", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Pending Calls", value: pendingCalls, sub: "in queue", icon: Phone, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Follow-ups Due", value: dueFollowUps, sub: "today", icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Overdue", value: overdueFollowUps, sub: "action needed", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50" },
    { label: "Upcoming Meetings", value: upcomingMeetings, sub: "scheduled", icon: Calendar, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: "Active Opportunities", value: openOpportunities, sub: "in pipeline", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Pipeline Value", value: `SAR ${(pipelineValue / 1000).toFixed(0)}K`, sub: "total", icon: Building2, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const renderDetails = () => {
    switch (expandedCard) {
      case "Total Prospects":
        return companies.length === 0 ? (
          <p className="p-6 text-center text-slate-400">No prospects found.</p>
        ) : (
          companies.map(c => (
            <div key={c.id} className="p-3 hover:bg-slate-50/50 flex justify-between items-center transition-colors">
              <div>
                <p className="font-bold text-slate-800">{c.company_name}</p>
                <p className="text-[10px] text-slate-400">{c.industry || 'General'} · {c.city || 'Muscat'}</p>
              </div>
              <Badge className="capitalize bg-slate-100 text-slate-700 font-semibold">{c.status}</Badge>
            </div>
          ))
        );
      case "New Prospects":
        const newProspects = companies.filter(c => c.status === 'prospect');
        return newProspects.length === 0 ? (
          <p className="p-6 text-center text-slate-400">No new prospects to contact.</p>
        ) : (
          newProspects.map(c => (
            <div key={c.id} className="p-3 hover:bg-slate-50/50 flex justify-between items-center transition-colors">
              <div>
                <p className="font-bold text-slate-800">{c.company_name}</p>
                <p className="text-[10px] text-slate-400">{c.industry || 'General'} · {c.city || 'Muscat'}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700 font-semibold">New</Badge>
            </div>
          ))
        );
      case "Pending Calls":
        const activeCalls = calls.filter(c => c.status === 'pending' || c.status === 'in_progress');
        return activeCalls.length === 0 ? (
          <p className="p-6 text-center text-slate-400">No pending closer calls in queue.</p>
        ) : (
          activeCalls.map(c => (
            <div key={c.id} className="p-3 hover:bg-slate-50/50 flex justify-between items-center transition-colors">
              <div>
                <p className="font-bold text-slate-800">{c.companies?.company_name}</p>
                <p className="text-[10px] text-slate-400">Contact: {c.contacts?.full_name || 'No Contact'} · Phone: {c.contacts?.phone || 'No phone'}</p>
              </div>
              <Badge className="bg-amber-100 text-amber-700 font-semibold">Pending Callback</Badge>
            </div>
          ))
        );
      case "Follow-ups Due":
        const dueToday = followUpsList.filter(f => f.due_date === new Date().toISOString().split('T')[0] && f.status === 'pending');
        return dueToday.length === 0 ? (
          <p className="p-6 text-center text-slate-400">No follow-ups scheduled for today.</p>
        ) : (
          dueToday.map(f => (
            <div key={f.id} className="p-3 hover:bg-slate-50/50 flex justify-between items-center transition-colors">
              <div>
                <p className="font-bold text-slate-800">{f.subject}</p>
                <p className="text-[10px] text-slate-400">{f.companies?.company_name} · {f.contacts?.full_name}</p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 capitalize font-semibold">{f.channel}</Badge>
            </div>
          ))
        );
      case "Overdue":
        const overdue = followUpsList.filter(f => f.due_date < new Date().toISOString().split('T')[0] && f.status === 'pending');
        return overdue.length === 0 ? (
          <p className="p-6 text-center text-slate-400">No overdue tasks.</p>
        ) : (
          overdue.map(f => (
            <div key={f.id} className="p-3 hover:bg-slate-50/50 flex justify-between items-center transition-colors">
              <div>
                <p className="font-bold text-red-950">{f.subject}</p>
                <p className="text-[10px] text-red-800">Due: {f.due_date} · {f.companies?.company_name}</p>
              </div>
              <Badge className="bg-red-100 text-red-700 font-semibold">Overdue</Badge>
            </div>
          ))
        );
      case "Upcoming Meetings":
        return meetingsList.length === 0 ? (
          <p className="p-6 text-center text-slate-400">No upcoming meetings scheduled.</p>
        ) : (
          meetingsList.map(m => (
            <div key={m.id} className="p-3 hover:bg-slate-50/50 flex justify-between items-center transition-colors">
              <div>
                <p className="font-bold text-slate-800">{m.title || 'Discussion / Meeting'}</p>
                <p className="text-[10px] text-slate-400">{m.companies?.company_name} · {m.contacts?.full_name} · Date: {new Date(m.meeting_date).toLocaleString()}</p>
              </div>
              <Badge className="bg-indigo-100 text-indigo-700 font-semibold">Scheduled</Badge>
            </div>
          ))
        );
      case "Active Opportunities":
      case "Pipeline Value":
        return opportunitiesList.length === 0 ? (
          <p className="p-6 text-center text-slate-400">No active deals in pipeline.</p>
        ) : (
          opportunitiesList.map(o => (
            <div key={o.id} className="p-3 hover:bg-slate-50/50 flex justify-between items-center transition-colors">
              <div>
                <p className="font-bold text-slate-800">{o.title} ({o.companies?.company_name})</p>
                <p className="text-[10px] text-slate-400">Stage: {o.stage} · Win Prob: {o.probability}%</p>
              </div>
              <span className="font-bold text-emerald-600 text-xs">SAR {(o.estimated_value || 0).toLocaleString()}</span>
            </div>
          ))
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back. Here is your overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {statCards.map((stat) => {
          const isExpanded = expandedCard === stat.label;
          return (
            <div
              key={stat.label}
              onClick={() => setExpandedCard(isExpanded ? null : stat.label)}
              className={`hover-lift press-effect cursor-pointer transition-all duration-200 border rounded-xl overflow-hidden ${
                isExpanded ? "border-brand-teal ring-1 ring-brand-teal bg-brand-teal-light/10" : "border-transparent bg-white shadow-sm"
              }`}
            >
              <Card className="border-0 bg-transparent shadow-none">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold text-slate-900">{stat.value}</span>
                        <span className="text-sm text-slate-400">{stat.sub}</span>
                      </div>
                    </div>
                    <div className={stat.bg + " p-2 rounded-lg"}>
                      <stat.icon className={"h-5 w-5 " + stat.color} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Expanded Detail Panel */}
      {expandedCard && (
        <Card className="border-brand-teal/30 bg-white shadow-sm border animate-slide-in overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-2.5 bg-slate-50/50 px-4 py-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5 capitalize">
                {expandedCard.toLowerCase()} Details
              </CardTitle>
              <p className="text-[10px] text-slate-400">Showing detailed records from CRM database.</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setExpandedCard(null)} className="h-7 text-[10px] text-slate-400 hover:text-red-500">
              Close
            </Button>
          </CardHeader>
          <CardContent className="p-0 max-h-[300px] overflow-y-auto divide-y divide-border-light text-xs">
            {renderDetails()}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className={"mt-1 h-2 w-2 rounded-full flex-shrink-0 " + getDotColor(item.activity_type)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700">{item.title}</p>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.companies?.company_name && (
                          <span className="text-xs text-slate-600 font-medium">{item.companies.company_name}</span>
                        )}
                        <span className="text-xs text-slate-400">{timeAgo(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-red-600">Overdue</CardTitle>
            <Badge className="bg-red-100 text-red-700">{overdueFollowUps}</Badge>
          </CardHeader>
          <CardContent>
            {overdueFollowUps === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No overdue follow-ups</p>
            ) : (
              <div className="space-y-3">
                <Link href="/follow-ups">
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors">
                    <p className="text-sm font-medium text-slate-900">{overdueFollowUps} overdue follow-up{overdueFollowUps !== 1 ? "s" : ""}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Needs immediate attention</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-red-100 text-red-700 text-xs">Overdue</Badge>
                    </div>
                  </div>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pipeline</CardTitle>
          <Link href="/pipeline"><Button variant="ghost" size="sm">View Pipeline</Button></Link>
        </CardHeader>
        <CardContent>
          {openOpportunities === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No active opportunities</p>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-slate-500">{openOpportunities} active opportunit{openOpportunities !== 1 ? "ies" : "y"} in pipeline</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">SAR {pipelineValue.toLocaleString()}</p>
              <Link href="/pipeline">
                <Button size="sm" className="mt-3 bg-teal-600 hover:bg-teal-700 text-white">View Pipeline</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
