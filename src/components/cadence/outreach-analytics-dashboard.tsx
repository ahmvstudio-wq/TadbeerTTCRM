"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  Send,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Layers,
  Phone,
  MessageCircle,
  Mail,
  Camera,
  ArrowUpRight,
  Filter,
  BarChart3,
  Loader2,
  RefreshCw,
  ExternalLink,
  Target,
  Users,
  Compass
} from "lucide-react";
import { getComprehensiveOutreachMetrics, type OutreachMetricsResult } from "@/lib/actions/cadence";
import { useUnifiedLead } from "@/context/unified-lead-context";

function LinkedInIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

interface OutreachAnalyticsDashboardProps {
  onSelectLead?: (companyId: string) => void;
}

export function OutreachAnalyticsDashboard({ onSelectLead }: OutreachAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<OutreachMetricsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<30 | 14 | 7>(30);
  const { openLead } = useUnifiedLead();

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await getComprehensiveOutreachMetrics(timeframe);
      if (res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error("Failed to load outreach metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [timeframe]);

  if (loading && !metrics) {
    return (
      <div className="bg-white border border-neutral-200 rounded-3xl p-12 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-900" />
        <p className="text-xs font-bold text-neutral-500">Aggregating outreach intelligence & response metrics...</p>
      </div>
    );
  }

  const m = metrics || {
    totalOutreaches: 0,
    totalReplies: 0,
    overallReplyRate: 0,
    positiveReplies: 0,
    positiveInterestRate: 0,
    meetingsBooked: 0,
    objectionsCount: 0,
    noReplyCount: 0,
    byChannel: [],
    byIndustry: [],
    dailyTrend: [],
    byStatus: [],
    recentReplies: []
  };

  const maxIndustryCount = Math.max(...(m.byIndustry.map(i => i.outreachCount) || [1]), 1);
  const maxTrendSent = Math.max(...(m.dailyTrend.map(t => t.totalSent) || [1]), 1);

  return (
    <div className="space-y-6 font-sans">
      
      {/* ── Top Bar: Timeframe & Actions ───────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#0f343c] border border-[#16434d] text-[#c5a059] flex items-center justify-center font-black shadow-xs">
            <BarChart3 className="h-4 w-4 text-[#c5a059]" />
          </div>
          <div>
            <h2 className="text-sm font-black text-black uppercase tracking-wider">Outreach Stats & Trends</h2>
            <p className="text-xs text-neutral-500 font-medium">Real-time metrics across channels and industries.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 text-xs font-mono">
            {[
              { id: 7, label: "7 Days" },
              { id: 14, label: "14 Days" },
              { id: 30, label: "30 Days" }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeframe(t.id as any)}
                className={`px-3 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                  timeframe === t.id ? "bg-[#0f343c] text-white shadow-xs" : "text-neutral-600 hover:text-black"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchMetrics}
            className="h-8 px-3 rounded-xl border border-neutral-200 text-xs font-mono font-bold text-neutral-700 hover:bg-neutral-50 flex items-center gap-1.5 transition cursor-pointer"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </div>
      </div>

      {/* ── 1. KPI Metric Grid (Dark Teal Accents) ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        
        {/* Total Outreaches */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Total Sent</span>
            <div className="h-7 w-7 rounded-lg bg-[#0f343c]/10 border border-[#0f343c]/20 flex items-center justify-center">
              <Send className="h-3.5 w-3.5 text-[#0f343c]" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-black tracking-tight">{m.totalOutreaches}</span>
            <span className="text-xs text-neutral-500 font-medium block mt-0.5 font-sans">Across all channels</span>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-600 font-medium font-sans">
            <span>In progress</span>
            <span className="text-[#0f343c] font-mono font-bold">{m.noReplyCount}</span>
          </div>
        </div>

        {/* Total Replies & Reply Rate */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Replies</span>
            <div className="h-7 w-7 rounded-lg bg-[#0f343c]/10 border border-[#0f343c]/20 flex items-center justify-center">
              <MessageSquare className="h-3.5 w-3.5 text-[#0f343c]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black tracking-tight">{m.totalReplies}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#0f343c] text-white border border-[#16434d]">
              {m.overallReplyRate}%
            </span>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-600 font-medium font-sans">
            <span>Conversations</span>
            <span className="text-black font-mono font-bold">{m.totalReplies}</span>
          </div>
        </div>

        {/* Positive Interest Rate (Dark Teal Card) */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Interested</span>
            <div className="h-7 w-7 rounded-lg bg-[#0f343c]/10 border border-[#0f343c]/20 flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#0f343c]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-black tracking-tight">{m.positiveReplies}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#0f343c]/10 text-[#0f343c] border border-[#0f343c]/20">
              {m.positiveInterestRate}%
            </span>
          </div>
          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-600 font-medium font-sans">
            <span>Qualified</span>
            <span className="text-[#0f343c] font-mono font-bold">{m.positiveReplies}</span>
          </div>
        </div>

        {/* Meetings Booked (Dark Teal Card) */}
        <div className="bg-[#091f24] border border-[#16434d] text-white rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300">Meetings</span>
            <div className="h-7 w-7 rounded-lg bg-[#0f343c] border border-[#16434d] flex items-center justify-center">
              <Calendar className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-white tracking-tight">{m.meetingsBooked}</span>
            <span className="text-xs text-neutral-300 font-medium block mt-0.5 font-sans">Booked meetings</span>
          </div>
          <div className="pt-2 border-t border-[#16434d] flex items-center justify-between text-[11px] text-neutral-300 font-medium font-sans">
            <span>Total booked</span>
            <span className="text-white font-mono font-bold">{m.meetingsBooked}</span>
          </div>
        </div>

      </div>

      {/* ── 2. Daily Touch Velocity Trend Chart ────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-black text-black uppercase tracking-wider">
              Daily Activity (Last {timeframe} Days)
            </h3>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              Messages sent vs. replies received.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono font-bold text-neutral-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#0f343c]" /> Sent
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#2d7a88]" /> Replies
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4 overflow-x-auto">
          <div className="flex items-end gap-1.5 h-44 min-w-[600px] border-b border-neutral-200 pb-2 px-1">
            {m.dailyTrend.map((t, idx) => {
              const heightPct = Math.max(Math.round((t.totalSent / maxTrendSent) * 100), t.totalSent > 0 ? 8 : 2);
              const replyHeightPct = Math.max(Math.round((t.replies / maxTrendSent) * 100), t.replies > 0 ? 6 : 0);

              return (
                <div key={t.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-neutral-900 text-white text-[10px] p-2 rounded-xl shadow-xl z-20 whitespace-nowrap pointer-events-none font-mono">
                    <span className="font-bold">{t.displayDate}</span>
                    <span>Sent: {t.totalSent}</span>
                    <span>Replies: {t.replies}</span>
                  </div>

                  {/* Bars */}
                  <div className="w-full flex items-end justify-center gap-0.5 h-36">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full max-w-[14px] rounded-t-sm transition-all ${
                        t.totalSent > 0 ? "bg-[#0f343c] group-hover:bg-[#091f24]" : "bg-neutral-100"
                      }`}
                    />
                    {t.replies > 0 && (
                      <div
                        style={{ height: `${replyHeightPct}%` }}
                        className="w-full max-w-[10px] bg-[#2d7a88] rounded-t-sm transition-all"
                      />
                    )}
                  </div>

                  {/* Date Label */}
                  <span className="text-[9px] font-mono font-bold text-neutral-400 truncate w-full text-center">
                    {idx % (timeframe > 14 ? 3 : 1) === 0 ? t.displayDate.split(" ")[1] : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 3. Two Column Breakdown: Industry Graph & Channel Matrix ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Industry Breakdown Graph */}
        <div className="lg:col-span-6 bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-black uppercase tracking-wider">
                Outreach by Industry
              </h3>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                Messages sent and reply rate by industry.
              </p>
            </div>
          </div>

          <div className="space-y-3.5 pt-1">
            {m.byIndustry.length === 0 ? (
              <p className="text-xs text-neutral-400 italic py-6 text-center">No industry data yet.</p>
            ) : (
              m.byIndustry.map((ind) => {
                const widthPct = Math.max(Math.round((ind.outreachCount / maxIndustryCount) * 100), 6);
                return (
                  <div key={ind.industry} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-black truncate max-w-[200px]">{ind.industry}</span>
                      <div className="flex items-center gap-3 text-neutral-500 text-[11px] font-mono">
                        <span>{ind.outreachCount} sent ({ind.percentage}%)</span>
                        <span className="text-[#0f343c] font-bold">{ind.replyRate}% reply</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className="bg-[#0f343c] h-full rounded-full transition-all"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Channel Performance Matrix */}
        <div className="lg:col-span-6 bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-black uppercase tracking-wider">
                Performance by Channel
              </h3>
              <p className="text-xs text-neutral-500 font-medium mt-0.5">
                Results across each channel.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500 pb-2">
                  <th className="pb-2">Channel</th>
                  <th className="pb-2 text-center">Sent</th>
                  <th className="pb-2 text-center">Replies</th>
                  <th className="pb-2 text-center">Reply %</th>
                  <th className="pb-2 text-right">Meetings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono font-medium">
                {m.byChannel.map((ch) => (
                  <tr key={ch.channel} className="hover:bg-neutral-50/80 transition">
                    <td className="py-2.5 font-bold text-black flex items-center gap-2 font-sans">
                      {ch.channel === "instagram_dm" && <Camera className="h-3.5 w-3.5 text-[#0f343c]" />}
                      {ch.channel === "whatsapp" && <MessageCircle className="h-3.5 w-3.5 text-[#0f343c]" />}
                      {ch.channel === "cold_call" && <Phone className="h-3.5 w-3.5 text-[#0f343c]" />}
                      {ch.channel === "linkedin" && <LinkedInIcon size={14} />}
                      {ch.channel === "email" && <Mail className="h-3.5 w-3.5 text-[#0f343c]" />}
                      {ch.label}
                    </td>
                    <td className="py-2.5 text-center text-neutral-900">{ch.sentCount}</td>
                    <td className="py-2.5 text-center text-neutral-900">{ch.replyCount}</td>
                    <td className="py-2.5 text-center">
                      <span className="font-bold px-2 py-0.5 rounded bg-neutral-100 text-black border border-neutral-200 text-[10px]">
                        {ch.replyRate}%
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-black text-[#0f343c]">{ch.meetingCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── 4. Live Prospect Replies Feed ─────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-black uppercase tracking-wider">
              Recent Replies
            </h3>
            <p className="text-xs text-neutral-500 font-medium mt-0.5">
              Latest responses from leads.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-neutral-100 text-black border border-neutral-200">
            {m.recentReplies.length} Replies
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {m.recentReplies.length === 0 ? (
            <p className="col-span-full text-xs text-neutral-400 italic py-8 text-center">No replies logged yet.</p>
          ) : (
            m.recentReplies.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  if (r.companyId) {
                    openLead(r.companyId);
                  }
                }}
                className="bg-neutral-50/80 hover:bg-white border border-neutral-200 p-4 rounded-xl space-y-2.5 transition cursor-pointer hover:shadow-xs group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black text-black group-hover:underline flex items-center gap-1">
                      {r.companyName} <ExternalLink className="h-2.5 w-2.5 text-neutral-400" />
                    </h4>
                    <span className="text-[10px] font-bold text-neutral-500 block">{r.industry}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#0f343c] text-white border border-[#16434d]">
                    {r.channel.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-neutral-800 font-medium italic line-clamp-2 bg-white p-2.5 rounded-lg border border-neutral-200/80">
                  &ldquo;{r.replyText}&rdquo;
                </p>

                <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-1">
                  <span>{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <span className="text-[#0f343c] font-bold group-hover:underline font-sans">View lead →</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
