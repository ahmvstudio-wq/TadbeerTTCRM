"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Plus,
  Phone,
  MessageSquare,
  Search,
  Check,
  User,
  Building2,
  Sparkles,
  Loader2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { useUnifiedLead } from "@/context/unified-lead-context";
import {
  getCadenceFollowUps,
  createFollowUp,
  completeFollowUp,
  type CadenceFollowUpItem,
} from "@/lib/actions/followups";
import { getCompaniesLookup } from "@/lib/actions/companies";
import { cn } from "@/lib/utils";
import { CRMCache } from "@/lib/cache/crm-cache";

// ─── Channel Icon Helper ───────────────────────────────────────────────────────
function ChannelBadge({ channel }: { channel: string }) {
  if (channel === "instagram_dm" || channel.includes("instagram")) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 text-pink-700 border border-pink-200/50">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-2.5 w-2.5">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <circle cx="12" cy="12" r="3.5" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
        Instagram
      </span>
    );
  }

  if (channel === "linkedin") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-2.5 w-2.5">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        LinkedIn
      </span>
    );
  }

  if (channel === "whatsapp") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
        <MessageSquare className="h-2.5 w-2.5" />
        WhatsApp
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
      <Phone className="h-2.5 w-2.5" />
      Call
    </span>
  );
}

export function DashboardFollowUpsPanel({
  initialItems = [],
  companiesLookup = [],
}: {
  initialItems?: CadenceFollowUpItem[];
  companiesLookup?: any[];
}) {
  const router = useRouter();
  const { openLead } = useUnifiedLead();

  const [items, setItems] = useState<CadenceFollowUpItem[]>(
    () => initialItems.length > 0 ? initialItems : (CRMCache.get<CadenceFollowUpItem[]>("followups-cadence") || [])
  );
  const [companies, setCompanies] = useState<any[]>(
    () => companiesLookup.length > 0 ? companiesLookup : (CRMCache.get<any[]>("companies-lookup") || [])
  );
  const [loading, setLoading] = useState<boolean>(() => items.length === 0);
  const [activeTab, setActiveTab] = useState<"today" | "overdue" | "upcoming" | "all">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Quick Schedule Task Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    company_id: "",
    subject: "",
    due_date: new Date().toISOString().split("T")[0],
    due_time: "10:00",
    channel: "whatsapp",
    description: "",
  });
  const [submittingTask, setSubmittingTask] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!silent && items.length === 0) setLoading(true);
    try {
      const [fuRes, compRes] = await Promise.all([
        getCadenceFollowUps(),
        getCompaniesLookup(),
      ]);

      if (fuRes.data) {
        setItems(fuRes.data);
        CRMCache.set("followups-cadence", fuRes.data);
      }
      if (compRes.data) {
        setCompanies(compRes.data);
        CRMCache.set("companies-lookup", compRes.data);
      }
    } catch (err) {
      console.error("Error loading dashboard follow-ups:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [items.length]);

  useEffect(() => {
    if (items.length === 0) {
      loadData(false);
    }
    const handleLeadUpdated = () => {
      loadData(true);
    };
    window.addEventListener("lead-updated", handleLeadUpdated);
    return () => window.removeEventListener("lead-updated", handleLeadUpdated);
  }, [loadData, items.length]);

  // Counts
  const todayCount = useMemo(() => items.filter((i) => i.is_today).length, [items]);
  const overdueCount = useMemo(() => items.filter((i) => i.is_overdue).length, [items]);
  const upcomingCount = useMemo(
    () => items.filter((i) => !i.is_today && !i.is_overdue).length,
    [items]
  );
  const totalCount = items.length;

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeTab === "today" && !item.is_today) return false;
      if (activeTab === "overdue" && !item.is_overdue) return false;
      if (activeTab === "upcoming" && (item.is_today || item.is_overdue)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCo = item.company_name.toLowerCase().includes(q);
        const matchCnt = (item.contact_name || "").toLowerCase().includes(q);
        const matchSub = (item.subject || "").toLowerCase().includes(q);
        const matchDesc = (item.description || "").toLowerCase().includes(q);
        if (!matchCo && !matchCnt && !matchSub && !matchDesc) return false;
      }

      return true;
    });
  }, [items, activeTab, searchQuery]);

  // Handle Mark Completed
  const handleComplete = async (e: React.MouseEvent, id: string, companyId: string) => {
    e.stopPropagation();
    setCompletingId(id);
    // Optimistic UI removal
    setItems((prev) => prev.filter((item) => item.id !== id));
    await completeFollowUp(id, "Completed from Daily Dashboard action panel");
    setCompletingId(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lead-updated", { detail: { companyId, followUpId: id } })
      );
    }
  };

  // Handle Create Scheduled Task
  const handleScheduleTask = async () => {
    if (!scheduleForm.company_id || !scheduleForm.subject.trim() || !scheduleForm.due_date) {
      return;
    }
    setSubmittingTask(true);
    const targetCompanyId = scheduleForm.company_id;
    await createFollowUp({
      company_id: scheduleForm.company_id,
      subject: scheduleForm.subject.trim(),
      due_date: scheduleForm.due_date,
      due_time: scheduleForm.due_time || undefined,
      channel: scheduleForm.channel,
      description: scheduleForm.description.trim() || undefined,
    });

    setSubmittingTask(false);
    setScheduleModalOpen(false);
    setScheduleForm({
      company_id: "",
      subject: "",
      due_date: new Date().toISOString().split("T")[0],
      due_time: "10:00",
      channel: "whatsapp",
      description: "",
    });

    loadData(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lead-updated", { detail: { companyId: targetCompanyId } })
      );
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 sm:p-6 border border-black/[0.06] shadow-glass space-y-4 font-sans">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-black/[0.04] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-black/[0.04] text-black border border-black/[0.06] uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3 w-3 text-black" /> TODAY&apos;S TASKS &amp; FOLLOW-UPS
            </span>
            <span className="text-[11px] font-mono text-[#8a8d95]">
              {todayCount} Due Today • {overdueCount} Overdue
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-light text-black font-display tracking-tight mt-1">
            Follow-up Queue &amp; Scheduled Actions
          </h2>
          <p className="text-xs text-[#6b7280] font-light mt-0.5">
            Execute today&apos;s scheduled cadence touches and prospect tasks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => setScheduleModalOpen(true)}
            className="bg-black hover:bg-neutral-800 text-white text-xs font-light rounded-xl h-8.5 px-3 cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Schedule Task</span>
          </Button>

          <Link href="/outreach?tab=followups">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-light rounded-xl h-8.5 px-3 border-black/[0.08] hover:bg-neutral-50 cursor-pointer flex items-center gap-1.5"
            >
              <span>Command Center</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Filter Tabs & Search Row ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
          <button
            onClick={() => setActiveTab("today")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5",
              activeTab === "today"
                ? "bg-black text-white border-black shadow-xs"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
            )}
          >
            <span>Due Today</span>
            <span
              className={cn(
                "font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold",
                activeTab === "today" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-900"
              )}
            >
              {todayCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("overdue")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5",
              activeTab === "overdue"
                ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                : "bg-rose-50/70 text-rose-800 border-rose-200 hover:bg-rose-100"
            )}
          >
            <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
            <span>Overdue</span>
            <span
              className={cn(
                "font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold",
                activeTab === "overdue" ? "bg-white/20 text-white" : "bg-rose-200 text-rose-900"
              )}
            >
              {overdueCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("upcoming")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5",
              activeTab === "upcoming"
                ? "bg-black text-white border-black shadow-xs"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
            )}
          >
            <span>Upcoming</span>
            <span
              className={cn(
                "font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold",
                activeTab === "upcoming" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-700"
              )}
            >
              {upcomingCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5",
              activeTab === "all"
                ? "bg-black text-white border-black shadow-xs"
                : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
            )}
          >
            <span>All Active</span>
            <span
              className={cn(
                "font-mono text-[10px] px-1.5 py-0.2 rounded font-semibold",
                activeTab === "all" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-700"
              )}
            >
              {totalCount}
            </span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks or company..."
            className="pl-8 bg-neutral-50/70 border-neutral-200 text-xs rounded-xl h-8.5"
          />
        </div>
      </div>

      {/* ── Compact Task List ─────────────────────────────────────────────── */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-neutral-400">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-900 mr-2" />
            <span className="text-xs">Loading today&apos;s follow-ups...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-10 bg-neutral-50/60 rounded-xl border border-dashed border-neutral-200 p-6">
            <CheckCircle2 className="h-7 w-7 text-emerald-600 mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-neutral-900">
              {activeTab === "today" ? "All Caught Up for Today!" : "No tasks found in this view"}
            </h4>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              {activeTab === "today"
                ? "No pending follow-ups due today. You can schedule new tasks or check upcoming."
                : "No matching scheduled tasks found."}
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScheduleModalOpen(true)}
                className="text-xs h-7 rounded-lg"
              >
                + Schedule Follow-up
              </Button>
              <Link href="/outreach?tab=followups">
                <Button
                  size="sm"
                  className="text-xs h-7 rounded-lg bg-black text-white hover:bg-neutral-800"
                >
                  Go to Command Center
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isCompleting = completingId === item.id;

            return (
              <div
                key={item.id}
                className={cn(
                  "bg-white rounded-xl p-3.5 border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-black/20 hover:shadow-xs",
                  item.is_today && "border-emerald-300/80 bg-emerald-50/[0.02]",
                  item.is_overdue && "border-rose-200 bg-rose-50/[0.02]"
                )}
              >
                {/* Left: Complete Checkbox + Details */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    onClick={(e) => handleComplete(e, item.id, item.company_id)}
                    disabled={isCompleting}
                    title="Mark Done"
                    className={cn(
                      "mt-0.5 h-5 w-5 rounded-full border border-neutral-300 hover:border-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors shrink-0 cursor-pointer",
                      isCompleting && "opacity-50 cursor-wait"
                    )}
                  >
                    {isCompleting ? (
                      <Loader2 className="h-3 w-3 animate-spin text-neutral-500" />
                    ) : (
                      <Check className="h-3 w-3 text-transparent hover:text-emerald-600" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => openLead(item.company_id)}
                        className="text-xs font-semibold text-neutral-900 hover:text-black hover:underline cursor-pointer truncate text-left"
                      >
                        {item.company_name}
                      </button>

                      <ChannelBadge channel={item.direct_channel} />

                      {item.contact_name && (
                        <span className="text-[11px] text-neutral-500 font-light truncate">
                          • {item.contact_name} {item.contact_title ? `(${item.contact_title})` : ""}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-neutral-700 mt-0.5 truncate font-normal">
                      {item.subject || item.description || "Outreach follow-up touch due"}
                    </p>
                  </div>
                </div>

                {/* Right: Due Date & Action Trigger */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <span
                    className={cn(
                      "text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full",
                      item.is_today
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : item.is_overdue
                        ? "bg-rose-100 text-rose-900 border border-rose-200"
                        : "bg-neutral-100 text-neutral-700 border border-neutral-200"
                    )}
                  >
                    {item.is_today
                      ? "Due Today"
                      : item.is_overdue
                      ? `Overdue (${item.due_date})`
                      : item.due_date}
                  </span>

                  {item.direct_url && (
                    <a
                      href={item.direct_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 flex items-center gap-1 transition-colors"
                    >
                      <span>Touch</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openLead(item.company_id)}
                    className="h-7 px-2 text-xs font-light hover:bg-neutral-100 text-neutral-700"
                  >
                    Details
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Quick Schedule Task Modal ─────────────────────────────────────── */}
      <Dialog open={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)}>
        <DialogContent className="max-w-md bg-white rounded-2xl border border-black/[0.08] shadow-glass p-5 font-sans">
          <DialogHeader>
            <DialogTitle className="font-display font-light text-lg text-neutral-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-black" />
              <span>Schedule Follow-up / Task</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 text-xs font-sans mt-2">
            {/* Prospect / Company Selector */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Target Prospect / Company *
              </label>
              <select
                value={scheduleForm.company_id}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, company_id: e.target.value })
                }
                className="w-full text-xs rounded-xl px-3 py-2 border border-neutral-300 bg-white"
              >
                <option value="">Select a company...</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Task / Action Subject *
              </label>
              <Input
                placeholder="e.g. Value Check-in, Call Decision Maker, Proposal Review"
                value={scheduleForm.subject}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, subject: e.target.value })
                }
                className="rounded-xl text-xs"
              />
            </div>

            {/* Channel & Due Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                  Channel
                </label>
                <select
                  value={scheduleForm.channel}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, channel: e.target.value })
                  }
                  className="w-full text-xs rounded-xl px-3 py-2 border border-neutral-300 bg-white"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram_dm">Instagram DM</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="call">Phone Call</option>
                  <option value="meeting">Discovery Meeting</option>
                  <option value="email">Email</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                  Due Date *
                </label>
                <Input
                  type="date"
                  value={scheduleForm.due_date}
                  onChange={(e) =>
                    setScheduleForm({ ...scheduleForm, due_date: e.target.value })
                  }
                  className="rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {/* Description / Notes */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Action Notes / Context
              </label>
              <Textarea
                rows={2}
                placeholder="Details on what needs to be discussed or sent..."
                value={scheduleForm.description}
                onChange={(e) =>
                  setScheduleForm({ ...scheduleForm, description: e.target.value })
                }
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setScheduleModalOpen(false)}
              className="rounded-xl text-xs font-light cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleScheduleTask}
              disabled={submittingTask || !scheduleForm.company_id || !scheduleForm.subject.trim()}
              className="bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-light px-4 cursor-pointer"
            >
              {submittingTask ? "Scheduling..." : "Save Scheduled Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
