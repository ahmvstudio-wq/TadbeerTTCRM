"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatWhatsAppNumber } from "@/lib/utils";
import {
  Phone, CheckCircle2, Loader2, Trash2, X, RefreshCw,
  Search, MessageCircle, Sparkles, AlertCircle, PhoneCall,
  Calendar, Check, User
} from "lucide-react";
import { getCallQueue, recordCall } from "@/lib/actions/calls";
import { getAllLeadsForPipeline, updateOutreachStatus, deleteOutreachLog, updateOutreachEntry } from "@/lib/actions/ig-dm";
import { type OutreachLead, type OutreachStatus } from "@/lib/types/outreach";
import { ContactDetailDrawer } from "@/components/outreach/contact-detail-drawer";
import { ColdCallScriptModal } from "@/components/outreach/cold-call-script-modal";
import { useUnifiedLead } from "@/context/unified-lead-context";

const outcomeOptions = [
  { value: "connected", label: "Connected / Discussed" },
  { value: "no_answer", label: "No Answer / Busy" },
  { value: "left_voicemail", label: "Left Voicemail" },
  { value: "callback_requested", label: "Callback Requested" },
  { value: "meeting_booked", label: "Meeting Booked 🎉" },
];

export default function CallsPage() {
  const { openLead } = useUnifiedLead();
  const [outreachLeads, setOutreachLeads] = useState<OutreachLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ready" | "all_calls" | "completed">("ready");
  
  // Modals & Drawer State
  const [activeCallLead, setActiveCallLead] = useState<OutreachLead | null>(null);
  const [drawerLead, setDrawerLead] = useState<OutreachLead | null>(null);
  const [scriptLead, setScriptLead] = useState<OutreachLead | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Call Record Form
  const [callForm, setCallForm] = useState({
    outcome: "connected",
    duration: "5",
    notes: "",
    newStatus: "called" as OutreachStatus,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCallsData = useCallback(async () => {
    setLoading(true);
    const res = await getAllLeadsForPipeline("all");
    setOutreachLeads((res.data as OutreachLead[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCallsData();
  }, [fetchCallsData]);

  // Filter leads that belong to Call Queue:
  // 1. ready_for_call ("Call Tonight")
  // 2. cold_call channel
  // 3. status === 'called' or 'meeting_booked'
  const callQueueLeads = outreachLeads.filter(l => 
    l.status === "ready_for_call" || l.channel === "cold_call"
  );

  const readyToCallLeads = outreachLeads.filter(l => 
    l.status === "ready_for_call" || (l.channel === "cold_call" && (l.status === "sent" || l.status === "no_reply")) || Boolean(l.phone && l.phone.trim().length >= 7)
  );

  const completedCallsLeads = outreachLeads.filter(l => 
    l.status === "called" || l.status === "meeting_booked"
  );

  // Search filtering
  const displayedLeads = (
    activeTab === "ready" ? readyToCallLeads :
    activeTab === "completed" ? completedCallsLeads :
    callQueueLeads
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

  const handleStartCallRecord = (lead: OutreachLead) => {
    setActiveCallLead(lead);
    setCallForm({
      outcome: "connected",
      duration: "5",
      notes: lead.notes || "",
      newStatus: "called",
    });
  };

  const handleSaveCallRecord = async () => {
    if (!activeCallLead) return;
    setSubmitting(true);

    let targetStatus: OutreachStatus = "called";
    if (callForm.outcome === "meeting_booked") {
      targetStatus = "meeting_booked";
    }

    const res = await updateOutreachStatus(activeCallLead.id, {
      status: targetStatus,
      notes: callForm.notes ? `${activeCallLead.notes ? activeCallLead.notes + ' | ' : ''}Call (${callForm.outcome}): ${callForm.notes}` : activeCallLead.notes,
    });

    setSubmitting(false);
    if (res.error) {
      setToast({ type: "error", message: res.error });
    } else {
      setToast({ type: "success", message: `Call recorded for ${activeCallLead.company_name}` });
      setActiveCallLead(null);
      fetchCallsData();
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

      {/* ── Top Header & Stats Strip ─────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Phone className="h-5 w-5 text-teal-600" />
              <span>Call Queue & Outreach Workstation</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">
              Directly synced with Outreach Pipeline for instant calling & log tracking.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCallsData}
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>

        {/* Tab Selection + Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl font-bold border border-slate-200/60">
            <button
              onClick={() => setActiveTab("ready")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "ready" ? "bg-white text-teal-800 shadow-2xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              📞 Call Tonight ({readyToCallLeads.length})
            </button>
            <button
              onClick={() => setActiveTab("all_calls")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "all_calls" ? "bg-white text-slate-900 shadow-2xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              📋 All Cold Calls ({callQueueLeads.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === "completed" ? "bg-white text-violet-800 shadow-2xs font-black" : "text-slate-500 hover:text-slate-900"
              )}
            >
              ✅ Called & Booked ({completedCallsLeads.length})
            </button>
          </div>

          {/* Instant Search Bar */}
          <div className="relative w-full sm:max-w-xs">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 Filter prospect name, phone..."
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

      {/* ── Call List Table ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      ) : displayedLeads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No calls queued in this view</p>
          <p className="text-xs text-slate-400 mt-1">Mark leads "Ready for Call" in Outreach to automatically add them here!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden font-sans">
          <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Showing {displayedLeads.length} call prospects</span>
            <span className="text-slate-400 text-[11px]">Click "Record Call" to log outcome or "Card" to view details</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-black text-[11px]">
                <tr>
                  <th className="p-3">Company / Business</th>
                  <th className="p-3">Phone Number</th>
                  <th className="p-3">Call Preparation / Notes</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {displayedLeads.map(lead => {
                  const phoneNum = lead.phone || (lead.channel === "cold_call" || lead.channel === "whatsapp" ? lead.handle : null);
                  const waDigits = phoneNum ? formatWhatsAppNumber(phoneNum) : "";
                  const waUrl = waDigits ? `https://wa.me/${waDigits}` : null;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Company Name */}
                      <td className="p-3">
                        <button
                          onClick={() => openLead(lead.company_id || lead.id)}
                          className="font-black text-slate-900 text-xs block truncate max-w-[200px] hover:text-teal-700 hover:underline cursor-pointer text-left"
                        >
                          {lead.company_name}
                        </button>
                        <span className="text-[10px] text-slate-400 font-medium block truncate max-w-[180px]">
                          {lead.industry || "General"}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="p-3 font-mono font-bold text-slate-800">
                        {phoneNum ? (
                          <a href={`tel:${phoneNum}`} className="hover:text-teal-600 transition-colors flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-teal-600" />
                            <span>{phoneNum}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No phone saved</span>
                        )}
                      </td>

                      {/* Notes / Opening Line */}
                      <td className="p-3">
                        {lead.call_opening_line ? (
                          <span className="text-[11px] font-bold text-teal-900 bg-teal-50 px-2 py-1 rounded-lg border border-teal-200 block truncate max-w-[300px]">
                            "{lead.call_opening_line}"
                          </span>
                        ) : lead.pain_point ? (
                          <span className="text-[11px] font-bold text-amber-900 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 block truncate max-w-[300px]">
                            💡 {lead.pain_point}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px] truncate block max-w-[260px]">
                            {lead.notes || "No extra prep notes"}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className={cn(
                          "text-[10px] font-black px-2.5 py-1 rounded-lg border",
                          lead.status === "ready_for_call" ? "bg-teal-50 text-teal-800 border-teal-200" :
                          lead.status === "called" ? "bg-violet-50 text-violet-700 border-violet-200" :
                          lead.status === "meeting_booked" ? "bg-pink-50 text-pink-700 border-pink-200" :
                          "bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          {lead.status === "ready_for_call" ? "📞 Ready to Call" : lead.status === "called" ? "✅ Called" : lead.status === "meeting_booked" ? "🎉 Booked" : lead.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setScriptLead(lead)}
                            className="px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Open Script"
                          >
                            <Sparkles className="h-3 w-3 text-teal-600" /> Script
                          </button>

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
                            onClick={() => handleStartCallRecord(lead)}
                            className="px-2.5 py-1 rounded-md bg-teal-600 text-white text-[10px] font-black hover:bg-teal-700 transition-colors cursor-pointer"
                          >
                            📞 Log Outcome
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

      {/* ── Record Call Outcome Modal ─────────────────────────────────────── */}
      {activeCallLead && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-slate-200 shadow-2xl space-y-4 font-sans animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">Record Call Outcome</h3>
                <p className="text-xs text-slate-400 font-medium">{activeCallLead.company_name}</p>
              </div>
              <button onClick={() => setActiveCallLead(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Call Result / Outcome</label>
                <select
                  value={callForm.outcome}
                  onChange={e => setCallForm({ ...callForm, outcome: e.target.value })}
                  className="w-full h-9 bg-slate-50 border border-slate-200 rounded-xl px-3 font-bold text-slate-800 focus:bg-white"
                >
                  {outcomeOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Call Duration (Minutes)</label>
                <Input
                  type="number"
                  value={callForm.duration}
                  onChange={e => setCallForm({ ...callForm, duration: e.target.value })}
                  className="h-9 text-xs bg-slate-50"
                  placeholder="5"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Call Notes & Key Takeaways</label>
                <Textarea
                  value={callForm.notes}
                  onChange={e => setCallForm({ ...callForm, notes: e.target.value })}
                  placeholder="Enter prospect's response, pain points, or next step..."
                  rows={3}
                  className="text-xs bg-slate-50 resize-none p-2.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="ghost" onClick={() => setActiveCallLead(null)} className="h-9 text-xs">Cancel</Button>
              <Button onClick={handleSaveCallRecord} disabled={submitting} className="h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 rounded-xl">
                {submitting ? "Saving..." : "Save & Update Status"}
              </Button>
            </div>
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
          fetchCallsData();
        }}
        onDelete={async (id) => {
          await deleteOutreachLog(id);
          fetchCallsData();
        }}
        onSaveEntry={async (id, data) => {
          await updateOutreachEntry(id, data);
          fetchCallsData();
        }}
      />
    </div>
  );
}
