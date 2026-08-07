"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Clock, AlertTriangle, CheckCircle2, RefreshCw, X, MessageCircle,
  Phone, Send, Sparkles, Filter, Search, User, Building, Mail, Calendar, Loader2
} from "lucide-react";
import { getAllLeadsForPipeline, updateOutreachStatus, deleteOutreachLog, updateOutreachEntry } from "@/lib/actions/ig-dm";
import { getFollowUps } from "@/lib/actions/followups";
import { type OutreachLead, type OutreachStatus, CHANNEL_CONFIG, STATUS_CONFIG } from "@/lib/types/outreach";
import { ContactDetailDrawer } from "@/components/outreach/contact-detail-drawer";
import { ColdCallScriptModal } from "@/components/outreach/cold-call-script-modal";

function getDaysElapsed(dateStr: string): number {
  if (!dateStr) return 0;
  const sentDate = new Date(dateStr).getTime();
  if (isNaN(sentDate)) return 0;
  const diffTime = Math.max(0, Date.now() - sentDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export default function FollowUpsPage() {
  const [outreachLeads, setOutreachLeads] = useState<OutreachLead[]>([]);
  const [legacyFollowups, setLegacyFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overdue" | "replies" | "all">("overdue");
  
  // Modals & Drawer State
  const [drawerLead, setDrawerLead] = useState<OutreachLead | null>(null);
  const [scriptLead, setScriptLead] = useState<OutreachLead | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchFollowupsData = useCallback(async () => {
    setLoading(true);
    const [outRes, legRes] = await Promise.all([
      getAllLeadsForPipeline("all"),
      getFollowUps("all")
    ]);
    setOutreachLeads(outRes.data || []);
    setLegacyFollowups(legRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFollowupsData();
  }, [fetchFollowupsData]);

  // Outreach Follow-up Categorizations:
  // Overdue / Due (2-3+ days elapsed with no reply)
  const overdueFollowups = outreachLeads.filter(l => 
    (l.status === "sent" || l.status === "no_reply") && getDaysElapsed(l.sent_at) >= 2
  );

  // Replies Received needing review / follow-up
  const repliesFollowups = outreachLeads.filter(l => 
    l.status === "reply_received" || l.status === "replied_objection" || l.status === "replied_interested"
  );

  // All pending follow-ups
  const allOutreachFollowups = outreachLeads.filter(l => 
    l.status !== "called" && l.status !== "meeting_booked"
  );

  // Filter based on active tab and search query
  const displayedLeads = (
    activeTab === "overdue" ? overdueFollowups :
    activeTab === "replies" ? repliesFollowups :
    allOutreachFollowups
  ).filter(l => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      l.company_name.toLowerCase().includes(q) ||
      (l.handle || "").toLowerCase().includes(q) ||
      (l.phone || "").toLowerCase().includes(q) ||
      (l.industry || "").toLowerCase().includes(q)
    );
  });

  const handleMarkFollowedUp = async (lead: OutreachLead) => {
    // Update status to sent with today's date
    const res = await updateOutreachEntry(lead.id, {
      status: "sent",
      outreach_date: new Date().toISOString(),
      notes: `${lead.notes ? lead.notes + ' | ' : ''}Followed up on ${new Date().toLocaleDateString()}`
    });

    if (res.error) {
      setToast({ type: "error", message: res.error });
    } else {
      setToast({ type: "success", message: `Marked followed up for ${lead.company_name}` });
      fetchFollowupsData();
    }
  };

  const handleMarkReadyForCall = async (lead: OutreachLead) => {
    const res = await updateOutreachStatus(lead.id, { status: "ready_for_call" });
    if (res.error) {
      setToast({ type: "error", message: res.error });
    } else {
      setToast({ type: "success", message: `Moved ${lead.company_name} to Call Queue!` });
      fetchFollowupsData();
    }
  };

  return (
    <div className="space-y-4 max-w-[1850px] w-full mx-auto font-sans pb-20">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${toast.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto text-slate-400 hover:text-slate-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Top Header & Tab Controls ─────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <span>Outreach Follow-ups Workstation</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">
              Tracks 2–3+ day overdue contacts, prospect replies & scheduled follow-ups across all channels.
            </p>
          </div>

          <button
            onClick={fetchFollowupsData}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl font-bold border border-slate-200/60 flex-wrap">
            <button
              onClick={() => setActiveTab("overdue")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "overdue" ? "bg-white text-amber-800 shadow-2xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              ⏰ Due / Overdue (2–3+ Days) ({overdueFollowups.length})
            </button>
            <button
              onClick={() => setActiveTab("replies")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "replies" ? "bg-white text-indigo-800 shadow-2xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              📬 Replies Received ({repliesFollowups.length})
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "all" ? "bg-white text-slate-900 shadow-2xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              📆 All Pending ({allOutreachFollowups.length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:max-w-xs">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Search prospect, @handle..."
              className="h-8 text-xs bg-slate-50 border-slate-200 rounded-xl pr-8"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Follow-ups Data Table ────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      ) : displayedLeads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 font-medium">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No pending follow-ups in this section!</p>
          <p className="text-xs text-slate-400 mt-1">All contacts are up to date.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden font-sans">
          <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Showing {displayedLeads.length} follow-up contacts</span>
            <span className="text-slate-400 text-[11px]">Click "Mark Followed Up" after sending a follow-up message</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-black text-[11px]">
                <tr>
                  <th className="p-3">Company / Business</th>
                  <th className="p-3">Channel & Contact</th>
                  <th className="p-3">Outreach Age</th>
                  <th className="p-3">Reply / Notes</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {displayedLeads.map(lead => {
                  const daysAgo = getDaysElapsed(lead.sent_at);
                  const phoneNum = lead.phone || (lead.channel === "cold_call" || lead.channel === "whatsapp" ? lead.handle : null);
                  const waUrl = phoneNum ? `https://wa.me/${phoneNum.replace(/\D/g, "")}` : null;
                  const channelLabel = CHANNEL_CONFIG[lead.channel]?.label || lead.channel;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Company Name */}
                      <td className="p-3">
                        <span className="font-black text-slate-900 text-xs block truncate max-w-[200px]">
                          {lead.company_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[180px]">
                          {lead.industry || "General"}
                        </span>
                      </td>

                      {/* Channel & Contact */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700 truncate max-w-[160px]">
                            {lead.handle || channelLabel}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                            {channelLabel}
                          </span>
                        </div>
                      </td>

                      {/* Outreach Age */}
                      <td className="p-3">
                        {daysAgo >= 3 ? (
                          <span className="font-extrabold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md text-[11px]">
                            ⏰ {daysAgo} Days Overdue
                          </span>
                        ) : daysAgo === 2 ? (
                          <span className="font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[11px]">
                            ⏰ 2 Days Due
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">
                            {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
                          </span>
                        )}
                      </td>

                      {/* Reply / Notes */}
                      <td className="p-3">
                        {lead.prospect_reply ? (
                          <span className="text-[11px] font-bold text-indigo-900 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200 block truncate max-w-[300px]">
                            💬 "{lead.prospect_reply}"
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] truncate block max-w-[240px]">
                            {lead.notes || "No reply yet"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-extrabold hover:bg-emerald-200 transition-colors"
                            >
                              WA
                            </a>
                          )}

                          <button
                            onClick={() => handleMarkReadyForCall(lead)}
                            className="px-2 py-1 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-bold hover:bg-teal-100 transition-colors cursor-pointer"
                            title="Move to Call Queue"
                          >
                            📞 Ready to Call
                          </button>

                          <button
                            onClick={() => handleMarkFollowedUp(lead)}
                            className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold transition-colors cursor-pointer"
                          >
                            ✓ Followed Up
                          </button>

                          <button
                            onClick={() => setDrawerLead(lead)}
                            className="px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-extrabold hover:bg-slate-800 transition-colors cursor-pointer"
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
        </div>
      )}

      {/* ── Cold Call Script Modal ────────────────────────────────────────── */}
      {scriptLead && (
        <ColdCallScriptModal
          ctx={{
            companyName: scriptLead.company_name,
            industry: scriptLead.industry,
            handle: scriptLead.handle,
            painPoint: scriptLead.pain_point,
            prospectReply: scriptLead.prospect_reply,
            openingLine: scriptLead.call_opening_line,
          }}
          onClose={() => setScriptLead(null)}
        />
      )}

      {/* ── Standardized Contact Detail Drawer ─────────────────────────────── */}
      <ContactDetailDrawer
        isOpen={!!drawerLead}
        onClose={() => setDrawerLead(null)}
        lead={drawerLead}
        onStatusChange={async (id, s) => {
          await updateOutreachStatus(id, { status: s });
          fetchFollowupsData();
        }}
        onDelete={async (id) => {
          await deleteOutreachLog(id);
          fetchFollowupsData();
        }}
        onSaveEntry={async (id, data) => {
          await updateOutreachEntry(id, data);
          fetchFollowupsData();
        }}
      />
    </div>
  );
}
