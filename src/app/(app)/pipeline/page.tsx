"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp,
  DollarSign,
  Loader2,
  X,
  Trash2,
  Plus,
  LayoutGrid,
  List,
  ChevronRight,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Phone,
  Mail,
  Sparkles,
  Edit3,
  Play,
  FileText,
  Search,
  Filter,
  Check,
  RefreshCw,
  FolderPlus
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";
import { cn, formatCurrency } from "@/lib/utils";
import { useUnifiedLead } from "@/context/unified-lead-context";
import { CRMCache } from "@/lib/cache/crm-cache";
import {
  getPipelineOverview,
  updatePipelineLeadStage,
  updatePipelineLeadDetails,
} from "@/lib/actions/pipeline";
import type {
  PipelineLead,
  PipelineStageKey,
  DemoStatus,
  PresentationStatus,
  ProposalStatus,
  PipelineFollowUpStatus,
  IntelligenceFilterKey,
  DemoUrlItem,
} from "@/lib/types/pipeline";

// ─── STAGE CONFIGURATIONS ─────────────────────────────────────────────────────
const STAGE_CONFIGS: Record<
  PipelineStageKey,
  {
    label: string;
    shortLabel: string;
    subtext: string;
    bg: string;
    activeBg: string;
    text: string;
    activeText: string;
    border: string;
    dot: string;
    countBadge: string;
  }
> = {
  outreach: {
    label: "Outreach / Initial Contact",
    shortLabel: "Outreach",
    subtext: "Active multi-channel touches & cold/warm cadence",
    bg: "bg-blue-50/60 hover:bg-blue-50/90",
    activeBg: "bg-blue-600 text-white shadow-md",
    text: "text-blue-900",
    activeText: "text-white",
    border: "border-blue-200",
    dot: "bg-blue-500",
    countBadge: "bg-blue-100 text-blue-800",
  },
  meeting: {
    label: "Meeting / Fixed",
    shortLabel: "Meeting",
    subtext: "Coffee invites, calls scheduled & discovery booked",
    bg: "bg-purple-50/60 hover:bg-purple-50/90",
    activeBg: "bg-purple-600 text-white shadow-md",
    text: "text-purple-900",
    activeText: "text-white",
    border: "border-purple-200",
    dot: "bg-purple-500",
    countBadge: "bg-purple-100 text-purple-800",
  },
  demo: {
    label: "Demo / Presentation",
    shortLabel: "Demo",
    subtext: "Custom software/AI demos, ERP modules & digital roadmaps",
    bg: "bg-amber-50/60 hover:bg-amber-50/90",
    activeBg: "bg-amber-600 text-white shadow-md",
    text: "text-amber-900",
    activeText: "text-white",
    border: "border-amber-200",
    dot: "bg-amber-500",
    countBadge: "bg-amber-100 text-amber-900",
  },
  proposal: {
    label: "Proposal Sent",
    shortLabel: "Proposal",
    subtext: "Quotations, transformation scopes & MOUs under client review",
    bg: "bg-indigo-50/60 hover:bg-indigo-50/90",
    activeBg: "bg-indigo-600 text-white shadow-md",
    text: "text-indigo-900",
    activeText: "text-white",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
    countBadge: "bg-indigo-100 text-indigo-900",
  },
  follow_up: {
    label: "Follow-up / Negotiation",
    shortLabel: "Follow-up",
    subtext: "Commercial negotiations, launch prerequisites & closing checks",
    bg: "bg-orange-50/60 hover:bg-orange-50/90",
    activeBg: "bg-orange-600 text-white shadow-md",
    text: "text-orange-900",
    activeText: "text-white",
    border: "border-orange-200",
    dot: "bg-orange-500",
    countBadge: "bg-orange-100 text-orange-900",
  },
  won: {
    label: "Won / Closed",
    shortLabel: "Won",
    subtext: "Agreements executed, commercial contracts active & onboarded",
    bg: "bg-emerald-50/60 hover:bg-emerald-50/90",
    activeBg: "bg-emerald-700 text-white shadow-md",
    text: "text-emerald-900",
    activeText: "text-white",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
    countBadge: "bg-emerald-100 text-emerald-900",
  },
  lost: {
    label: "Lost / Dormant",
    shortLabel: "Lost",
    subtext: "Disqualified, declined or snoozed accounts",
    bg: "bg-rose-50/60 hover:bg-rose-50/90",
    activeBg: "bg-neutral-800 text-white shadow-md",
    text: "text-rose-900",
    activeText: "text-white",
    border: "border-rose-200",
    dot: "bg-rose-500",
    countBadge: "bg-rose-100 text-rose-900",
  },
};

const STAGE_KEYS: PipelineStageKey[] = [
  "outreach",
  "meeting",
  "demo",
  "proposal",
  "follow_up",
  "won",
  "lost",
];

export default function PipelinePage() {
  const { openLead } = useUnifiedLead();

  const [leads, setLeads] = useState<PipelineLead[]>(
    () => CRMCache.get<PipelineLead[]>("mgmt-pipeline-leads") || []
  );
  const [loading, setLoading] = useState(() => !CRMCache.get("mgmt-pipeline-leads"));
  const [selectedStage, setSelectedStage] = useState<PipelineStageKey>("demo");
  const [intelligenceFilter, setIntelligenceFilter] =
    useState<IntelligenceFilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  // Edit Action / Demo Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<PipelineLead | null>(null);
  const [editForm, setEditForm] = useState<{
    stage: PipelineStageKey;
    nextAction: string;
    actionDueDate: string;
    demoStatus: DemoStatus;
    presentationStatus: PresentationStatus;
    proposalStatus: ProposalStatus;
    followUpStatus: PipelineFollowUpStatus;
    demoUrls: DemoUrlItem[];
    presentationUrls: DemoUrlItem[];
    assignedBdm: string;
    notes: string;
  }>({
    stage: "demo",
    nextAction: "",
    actionDueDate: "",
    demoStatus: "none",
    presentationStatus: "none",
    proposalStatus: "none",
    followUpStatus: "none",
    demoUrls: [],
    presentationUrls: [],
    assignedBdm: "Ramij",
    notes: "",
  });

  const [newUrlTitle, setNewUrlTitle] = useState("");
  const [newUrlLink, setNewUrlLink] = useState("");
  const [newUrlType, setNewUrlType] = useState<"demo" | "presentation">("demo");

  // Toast state
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Pagination for Table View
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchPipeline = useCallback(async (silent = false) => {
    if (!silent && !CRMCache.get("mgmt-pipeline-leads")) {
      setLoading(true);
    }
    const res = await getPipelineOverview();
    if (res.leads) {
      setLeads(res.leads);
      CRMCache.set("mgmt-pipeline-leads", res.leads);
    }
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchPipeline(false);
    const handleLeadUpdated = (e: any) => {
      fetchPipeline(true);
    };
    window.addEventListener("lead-updated", handleLeadUpdated);
    return () => window.removeEventListener("lead-updated", handleLeadUpdated);
  }, [fetchPipeline]);

  // ─── FILTERING & COUNTS ──────────────────────────────────────────────────────
  const stageCounts = useMemo(() => {
    const counts: Record<PipelineStageKey, number> = {
      outreach: 0,
      meeting: 0,
      demo: 0,
      proposal: 0,
      follow_up: 0,
      won: 0,
      lost: 0,
    };
    for (const lead of leads) {
      counts[lead.canonical_stage] = (counts[lead.canonical_stage] || 0) + 1;
    }
    return counts;
  }, [leads]);

  const metrics = useMemo(() => {
    let overdueCount = 0;
    let todayCount = 0;
    let upcomingCount = 0;
    let waitingResponseCount = 0;
    let waitingDemoCount = 0;
    let waitingProposalCount = 0;
    let needsActionCount = 0;

    for (const lead of leads) {
      if (lead.canonical_stage === "won" || lead.canonical_stage === "lost") continue;
      if (lead.is_overdue) overdueCount++;
      if (lead.is_today) todayCount++;
      if (lead.next_follow_up && lead.next_follow_up.days_diff > 0) upcomingCount++;
      if (lead.follow_up_status === "waiting_response" || lead.status === "contacted")
        waitingResponseCount++;
      if (lead.demo_status === "in_progress" || lead.demo_status === "required")
        waitingDemoCount++;
      if (lead.proposal_status === "sent" || lead.proposal_status === "drafting")
        waitingProposalCount++;
      if (lead.needs_action || lead.next_action) needsActionCount++;
    }

    return {
      total: leads.length,
      overdueCount,
      todayCount,
      upcomingCount,
      waitingResponseCount,
      waitingDemoCount,
      waitingProposalCount,
      needsActionCount,
    };
  }, [leads]);

  // Leads matching selected stage and filters
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Stage match
      if (lead.canonical_stage !== selectedStage) return false;

      // 2. Intelligence Filter
      if (intelligenceFilter === "overdue" && !lead.is_overdue) return false;
      if (intelligenceFilter === "today" && !lead.is_today) return false;
      if (
        intelligenceFilter === "upcoming" &&
        (!lead.next_follow_up || lead.next_follow_up.days_diff <= 0)
      )
        return false;
      if (
        intelligenceFilter === "waiting_demo" &&
        lead.demo_status !== "in_progress" &&
        lead.demo_status !== "required"
      )
        return false;
      if (
        intelligenceFilter === "waiting_proposal" &&
        lead.proposal_status !== "sent" &&
        lead.proposal_status !== "drafting"
      )
        return false;
      if (
        intelligenceFilter === "waiting_response" &&
        lead.follow_up_status !== "waiting_response" &&
        lead.status !== "contacted"
      )
        return false;
      if (
        intelligenceFilter === "needs_action" &&
        !lead.needs_action &&
        !lead.next_action
      )
        return false;

      // 3. Search query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = lead.company_name.toLowerCase().includes(query);
        const matchesContact = lead.primary_contact?.full_name
          ?.toLowerCase()
          .includes(query);
        const matchesAction = lead.next_action?.toLowerCase().includes(query);
        const matchesIndustry = lead.industry?.toLowerCase().includes(query);
        const matchesOwner = lead.owner_name?.toLowerCase().includes(query);
        if (
          !matchesName &&
          !matchesContact &&
          !matchesAction &&
          !matchesIndustry &&
          !matchesOwner
        ) {
          return false;
        }
      }

      return true;
    });
  }, [leads, selectedStage, intelligenceFilter, searchQuery]);

  // Paginated leads for Table view
  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedLeads = useMemo(() => {
    if (pageSize >= 999999) return filteredLeads;
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  // ─── STAGE TRANSITIONS ───────────────────────────────────────────────────────
  const handleQuickStageMove = async (leadId: string, newStage: PipelineStageKey) => {
    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId ? { ...l, canonical_stage: newStage } : l
      )
    );

    const res = await updatePipelineLeadStage(leadId, newStage);
    if (res.error) {
      setToast({ type: "error", message: res.error });
      fetchPipeline(true);
      return;
    }

    setToast({
      type: "success",
      message: `Moved to ${STAGE_CONFIGS[newStage]?.label || newStage}`,
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lead-updated", { detail: { companyId: leadId, stage: newStage } })
      );
    }
  };

  // Open Edit Action & Demo Modal
  const openEditModal = (lead: PipelineLead) => {
    setEditingLead(lead);
    setEditForm({
      stage: lead.canonical_stage,
      nextAction: lead.next_action || "",
      actionDueDate: lead.action_due_date || "",
      demoStatus: lead.demo_status,
      presentationStatus: lead.presentation_status,
      proposalStatus: lead.proposal_status,
      followUpStatus: lead.follow_up_status,
      demoUrls: lead.demo_urls || [],
      presentationUrls: lead.presentation_urls || [],
      assignedBdm: lead.assigned_bdm || "Ramij",
      notes: lead.notes || "",
    });
    setNewUrlTitle("");
    setNewUrlLink("");
    setEditModalOpen(true);
  };

  // Save Edit Action & Demo
  const handleSaveEdit = async () => {
    if (!editingLead) return;

    const companyId = editingLead.id;
    const stageChanged = editForm.stage !== editingLead.canonical_stage;

    // 1. If stage changed, update stage
    if (stageChanged) {
      await updatePipelineLeadStage(
        companyId,
        editForm.stage,
        editForm.nextAction,
        editForm.actionDueDate || undefined
      );
    }

    // 2. Update Action & Demo details
    const res = await updatePipelineLeadDetails(companyId, {
      nextAction: editForm.nextAction,
      actionDueDate: editForm.actionDueDate,
      demoStatus: editForm.demoStatus,
      presentationStatus: editForm.presentationStatus,
      proposalStatus: editForm.proposalStatus,
      followUpStatus: editForm.followUpStatus,
      demoUrls: editForm.demoUrls,
      presentationUrls: editForm.presentationUrls,
      assignedBdm: editForm.assignedBdm,
      notes: editForm.notes,
    });

    if (res.error) {
      setToast({ type: "error", message: res.error });
      return;
    }

    setEditModalOpen(false);
    setToast({
      type: "success",
      message: `Updated action plan & details for ${editingLead.company_name}`,
    });
    fetchPipeline(true);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lead-updated", { detail: { companyId } })
      );
    }
  };

  const handleAddUrl = () => {
    if (!newUrlTitle.trim() || !newUrlLink.trim()) return;
    const item = { title: newUrlTitle.trim(), url: newUrlLink.trim() };
    if (newUrlType === "demo") {
      setEditForm((prev) => ({
        ...prev,
        demoUrls: [...prev.demoUrls, item],
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        presentationUrls: [...prev.presentationUrls, item],
      }));
    }
    setNewUrlTitle("");
    setNewUrlLink("");
  };

  const handleRemoveUrl = (type: "demo" | "presentation", index: number) => {
    if (type === "demo") {
      setEditForm((prev) => ({
        ...prev,
        demoUrls: prev.demoUrls.filter((_, i) => i !== index),
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        presentationUrls: prev.presentationUrls.filter((_, i) => i !== index),
      }));
    }
  };

  if (loading && leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin h-9 w-9 text-black" />
        <p className="text-xs font-mono font-medium text-neutral-500">
          Loading End-to-End Sales Pipeline...
        </p>
      </div>
    );
  }

  const currentStageConfig = STAGE_CONFIGS[selectedStage];

  return (
    <div className="p-3 sm:p-6 max-w-[1750px] mx-auto space-y-6 font-sans">
      {/* ── Toast Notification ────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-xl text-xs font-medium backdrop-blur-md shadow-glass transition-all ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-300"
              : "bg-red-50 text-red-900 border border-red-300"
          }`}
        >
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto cursor-pointer p-0.5 hover:opacity-75"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/85 backdrop-blur-xl p-5 rounded-2xl border border-black/[0.08] shadow-glass">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-black/[0.05] border border-black/[0.08] text-black mb-1.5">
            <TrendingUp className="h-3 w-3 text-black" />
            <span>EXECUTIVE SALES PIPELINE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-light tracking-tight text-black font-display flex items-center gap-2.5">
            <span>Sales & Pipeline Visibility</span>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200">
              {leads.length} Total Accounts
            </span>
          </h1>
          <p className="text-neutral-500 text-xs mt-0.5 font-light">
            Instant stage-by-stage visibility from cold outreach to demo presentations, quotations, and closed contracts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPipeline(false)}
            className="h-9 px-3 rounded-xl border-black/[0.08] text-xs font-medium cursor-pointer flex items-center gap-1.5 hover:bg-neutral-100"
          >
            <RefreshCw className="h-3.5 w-3.5 text-neutral-600" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-neutral-100/90 p-0.5 rounded-xl border border-black/[0.06]">
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all",
                viewMode === "cards"
                  ? "bg-[#0c0d0f] text-white shadow-xs font-bold"
                  : "text-neutral-600 hover:text-black"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all",
                viewMode === "table"
                  ? "bg-[#0c0d0f] text-white shadow-xs font-bold"
                  : "text-neutral-600 hover:text-black"
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── STAGE NAVIGATION TABS (REQUIRED CONTROLS) ────────────────────── */}
      <div className="bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-black/[0.08] shadow-glass">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {STAGE_KEYS.map((stageKey) => {
            const config = STAGE_CONFIGS[stageKey];
            const isSelected = selectedStage === stageKey;
            const count = stageCounts[stageKey] || 0;

            return (
              <button
                key={stageKey}
                onClick={() => {
                  setSelectedStage(stageKey);
                  setCurrentPage(1);
                }}
                className={cn(
                  "p-3 rounded-xl text-left transition-all cursor-pointer relative border flex flex-col justify-between min-h-[78px]",
                  isSelected
                    ? "bg-[#0c0d0f] text-white border-black shadow-md ring-2 ring-black/20"
                    : "bg-white/70 hover:bg-neutral-50 text-neutral-800 border-neutral-200/80 hover:border-neutral-300"
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        isSelected ? "bg-white" : config.dot
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold uppercase tracking-wider",
                        isSelected ? "text-neutral-300" : "text-neutral-500"
                      )}
                    >
                      {config.shortLabel}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-mono font-bold px-2 py-0.5 rounded-md",
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-neutral-100 text-neutral-800 border border-neutral-200"
                    )}
                  >
                    {count}
                  </span>
                </div>

                <div className="mt-1.5">
                  <p
                    className={cn(
                      "text-xs font-bold leading-tight truncate",
                      isSelected ? "text-white" : "text-black"
                    )}
                  >
                    {config.label.split("/")[0]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FOLLOW-UP INTELLIGENCE STRIP ──────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-xl p-3.5 rounded-2xl border border-black/[0.08] shadow-glass flex flex-wrap items-center justify-between gap-3 font-sans">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono font-bold uppercase text-neutral-400 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            <span>Intelligence:</span>
          </span>

          <button
            onClick={() => setIntelligenceFilter("all")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border",
              intelligenceFilter === "all"
                ? "bg-black text-white border-black font-bold shadow-xs"
                : "bg-white text-neutral-700 border-neutral-200 hover:border-neutral-300"
            )}
          >
            All in Stage ({stageCounts[selectedStage] || 0})
          </button>

          <button
            onClick={() => setIntelligenceFilter("overdue")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5",
              intelligenceFilter === "overdue"
                ? "bg-rose-600 text-white border-rose-700 font-bold shadow-xs"
                : "bg-rose-50/80 text-rose-800 border-rose-200 hover:bg-rose-100"
            )}
          >
            <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
            <span>Overdue Follow-ups</span>
            <span className="font-mono text-[10px] font-bold bg-rose-200/80 px-1.5 py-0.2 rounded text-rose-900">
              {metrics.overdueCount}
            </span>
          </button>

          <button
            onClick={() => setIntelligenceFilter("today")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5",
              intelligenceFilter === "today"
                ? "bg-amber-600 text-white border-amber-700 font-bold shadow-xs"
                : "bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100"
            )}
          >
            <Clock className="h-3 w-3 text-amber-600 shrink-0" />
            <span>Due Today</span>
            <span className="font-mono text-[10px] font-bold bg-amber-200/80 px-1.5 py-0.2 rounded text-amber-900">
              {metrics.todayCount}
            </span>
          </button>

          <button
            onClick={() => setIntelligenceFilter("waiting_demo")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5",
              intelligenceFilter === "waiting_demo"
                ? "bg-purple-600 text-white border-purple-700 font-bold shadow-xs"
                : "bg-purple-50/80 text-purple-800 border-purple-200 hover:bg-purple-100"
            )}
          >
            <Play className="h-3 w-3 text-purple-600 shrink-0" />
            <span>Demo In Progress / Feedback</span>
            <span className="font-mono text-[10px] font-bold bg-purple-200/80 px-1.5 py-0.2 rounded text-purple-900">
              {metrics.waitingDemoCount}
            </span>
          </button>

          <button
            onClick={() => setIntelligenceFilter("waiting_proposal")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5",
              intelligenceFilter === "waiting_proposal"
                ? "bg-indigo-600 text-white border-indigo-700 font-bold shadow-xs"
                : "bg-indigo-50/80 text-indigo-800 border-indigo-200 hover:bg-indigo-100"
            )}
          >
            <FileText className="h-3 w-3 text-indigo-600 shrink-0" />
            <span>Proposal Approval</span>
            <span className="font-mono text-[10px] font-bold bg-indigo-200/80 px-1.5 py-0.2 rounded text-indigo-900">
              {metrics.waitingProposalCount}
            </span>
          </button>

          <button
            onClick={() => setIntelligenceFilter("needs_action")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5",
              intelligenceFilter === "needs_action"
                ? "bg-teal-600 text-white border-teal-700 font-bold shadow-xs"
                : "bg-teal-50/80 text-teal-800 border-teal-200 hover:bg-teal-100"
            )}
          >
            <Sparkles className="h-3 w-3 text-teal-600 shrink-0" />
            <span>Action Required</span>
            <span className="font-mono text-[10px] font-bold bg-teal-200/80 px-1.5 py-0.2 rounded text-teal-900">
              {metrics.needsActionCount}
            </span>
          </button>
        </div>

        {/* Search within stage */}
        <div className="relative w-full sm:w-64">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Search company, action..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8.5 rounded-xl border-neutral-200 bg-white/90"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── STAGE INFO BANNER ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur-md p-3 px-4 rounded-xl border border-black/[0.05]">
        <div className="flex items-center gap-2">
          <span className={cn("h-3 w-3 rounded-full", currentStageConfig.dot)} />
          <h2 className="text-sm font-bold text-black font-display">
            {currentStageConfig.label}
          </h2>
          <span className="text-neutral-400 text-xs">—</span>
          <span className="text-xs text-neutral-500 font-light">
            {currentStageConfig.subtext}
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-neutral-700">
          Showing {filteredLeads.length} of {stageCounts[selectedStage] || 0} accounts
        </span>
      </div>

      {/* ── MAIN STAGE CONTENT (CARDS OR TABLE) ───────────────────────────── */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl p-12 rounded-2xl border border-black/[0.06] shadow-glass text-center space-y-3">
          <TrendingUp className="h-10 w-10 text-neutral-300 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-700">
            No accounts match this stage or filter
          </h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            {intelligenceFilter !== "all"
              ? `No accounts in "${currentStageConfig.label}" with the "${intelligenceFilter}" filter.`
              : `There are currently no accounts in the "${currentStageConfig.label}" stage.`}
          </p>
          {intelligenceFilter !== "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIntelligenceFilter("all")}
              className="rounded-xl text-xs"
            >
              Reset Filter
            </Button>
          )}
        </div>
      ) : viewMode === "cards" ? (
        /* ── HIGH VISIBILITY STAGE CARDS VIEW ────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredLeads.map((lead) => {
            const hasDemos =
              lead.demo_urls && lead.demo_urls.length > 0;
            const hasPresentations =
              lead.presentation_urls && lead.presentation_urls.length > 0;

            return (
              <div
                key={lead.id}
                className={cn(
                  "bg-white/90 backdrop-blur-xl rounded-2xl p-5 border transition-all duration-150 shadow-glass flex flex-col justify-between space-y-4 hover:border-black/30",
                  lead.mgmt_highlight
                    ? "ring-1 ring-amber-500/40 border-amber-300/80 bg-amber-50/[0.04]"
                    : "border-black/[0.08]"
                )}
              >
                {/* 1. Card Top Header: Company Name, Category, Contact & Owner */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openLead(lead.id)}
                          className="text-base font-bold text-black hover:text-[#0f343c] hover:underline cursor-pointer text-left flex items-center gap-1.5 group"
                        >
                          <Building2 className="h-4 w-4 text-neutral-400 group-hover:text-black shrink-0" />
                          <span>{lead.company_name}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-neutral-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>

                        {lead.mgmt_highlight && (
                          <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-mono text-[10px] font-bold">
                            Mgmt Focus
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {lead.industry && (
                          <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/80">
                            {lead.industry}
                          </span>
                        )}
                        {lead.category && lead.category !== lead.industry && (
                          <span className="text-[11px] font-medium text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200/80">
                            {lead.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Owner / Assignee */}
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                        Assigned BDM
                      </span>
                      <span className="text-xs font-mono font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-md border border-neutral-200 inline-block mt-0.5">
                        {lead.owner_name || "Ramij"}
                      </span>
                    </div>
                  </div>

                  {/* Primary Contact Details */}
                  {lead.primary_contact && (
                    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-600 bg-neutral-50/80 p-2.5 rounded-xl border border-black/[0.04]">
                      <div className="flex items-center gap-1.5 font-medium text-black">
                        <User className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                        <span>{lead.primary_contact.full_name}</span>
                        {lead.primary_contact.title && (
                          <span className="text-neutral-400 font-normal">
                            ({lead.primary_contact.title})
                          </span>
                        )}
                      </div>

                      {lead.primary_contact.phone && (
                        <a
                          href={`tel:${lead.primary_contact.phone}`}
                          className="flex items-center gap-1 text-neutral-600 hover:text-black font-mono text-[11px]"
                        >
                          <Phone className="h-3 w-3 text-neutral-400" />
                          <span>{lead.primary_contact.phone}</span>
                        </a>
                      )}

                      {lead.primary_contact.whatsapp && (
                        <a
                          href={`https://wa.me/${lead.primary_contact.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-mono text-[11px]"
                        >
                          <MessageSquare className="h-3 w-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {lead.primary_contact.email && (
                        <a
                          href={`mailto:${lead.primary_contact.email}`}
                          className="flex items-center gap-1 text-neutral-600 hover:text-black text-[11px] truncate max-w-[180px]"
                        >
                          <Mail className="h-3 w-3 text-neutral-400" />
                          <span className="truncate">{lead.primary_contact.email}</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. REQUIRED NEXT ACTION BANNER (HIGH PROMINENCE) */}
                <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-900 font-mono text-[11px] font-bold uppercase tracking-wider">
                      <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                      <span>Next Action Required:</span>
                    </div>

                    {lead.action_due_date && (
                      <span
                        className={cn(
                          "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border",
                          lead.is_overdue
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : lead.is_today
                            ? "bg-amber-200 text-amber-900 border-amber-400"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        )}
                      >
                        {lead.is_overdue
                          ? "Overdue"
                          : lead.is_today
                          ? "Due Today"
                          : `Due: ${lead.action_due_date}`}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-neutral-900 leading-relaxed">
                    {lead.next_action || (
                      <span className="text-neutral-400 italic font-normal">
                        No explicit next action defined. Click &ldquo;Edit Plan&rdquo; to set one.
                      </span>
                    )}
                  </p>
                </div>

                {/* 3. DEMO & PRESENTATION STATUS + DIRECT URLS */}
                {(hasDemos ||
                  hasPresentations ||
                  lead.demo_status !== "none" ||
                  lead.presentation_status !== "none" ||
                  lead.canonical_stage === "demo") && (
                  <div className="bg-neutral-50/90 p-3 rounded-xl border border-black/[0.05] space-y-2 font-mono text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase">
                          Demo Status:
                        </span>
                        <Badge
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.2 capitalize",
                            lead.demo_status === "in_progress"
                              ? "bg-amber-100 text-amber-900 border-amber-300"
                              : lead.demo_status === "completed"
                              ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                              : lead.demo_status === "required"
                              ? "bg-blue-100 text-blue-900 border-blue-300"
                              : "bg-neutral-200 text-neutral-700 border-neutral-300"
                          )}
                        >
                          {lead.demo_status.replace("_", " ")}
                        </Badge>
                      </div>

                      {lead.presentation_status !== "none" && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">
                            Presentation:
                          </span>
                          <Badge className="bg-purple-100 text-purple-900 border-purple-300 text-[10px] font-bold px-2 py-0.2 capitalize">
                            {lead.presentation_status}
                          </Badge>
                        </div>
                      )}

                      {lead.proposal_status !== "none" && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-neutral-400 uppercase">
                            Proposal:
                          </span>
                          <Badge className="bg-indigo-100 text-indigo-900 border-indigo-300 text-[10px] font-bold px-2 py-0.2 capitalize">
                            {lead.proposal_status}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Direct Clickable Demo & Presentation Links */}
                    {(hasDemos || hasPresentations) && (
                      <div className="pt-2 border-t border-neutral-200/70 space-y-1.5 font-sans">
                        {lead.demo_urls?.map((demo, idx) => (
                          <div
                            key={`demo-${idx}`}
                            className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded-lg border border-black/[0.06]"
                          >
                            <span className="font-semibold text-neutral-900 flex items-center gap-1.5 truncate">
                              <Play className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              <span className="truncate">{demo.title}</span>
                            </span>
                            <a
                              href={demo.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 shrink-0 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                            >
                              <span>Open Demo</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ))}

                        {lead.presentation_urls?.map((pres, idx) => (
                          <div
                            key={`pres-${idx}`}
                            className="flex items-center justify-between gap-2 text-xs bg-white p-2 rounded-lg border border-black/[0.06]"
                          >
                            <span className="font-semibold text-neutral-900 flex items-center gap-1.5 truncate">
                              <FileText className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                              <span className="truncate">{pres.title}</span>
                            </span>
                            <a
                              href={pres.url.startsWith("http") ? pres.url : "#"}
                              onClick={(e) => {
                                if (!pres.url.startsWith("http")) {
                                  e.preventDefault();
                                  setToast({
                                    type: "success",
                                    message: `${pres.title} is linked to this account record.`,
                                  });
                                }
                              }}
                              target={pres.url.startsWith("http") ? "_blank" : undefined}
                              rel="noreferrer"
                              className="text-[11px] font-mono font-bold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1 shrink-0 bg-purple-50 px-2 py-0.5 rounded border border-purple-200"
                            >
                              <span>{pres.url.startsWith("http") ? "View Link" : "Attached"}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Last Activity & Follow-up Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 pt-1 font-mono">
                  <div>
                    {lead.last_activity ? (
                      <span>
                        Last touch:{" "}
                        <strong className="text-neutral-700">
                          {lead.last_activity.title || lead.last_activity.type}
                        </strong>{" "}
                        (
                        {new Date(lead.last_activity.created_at).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric" }
                        )}
                        )
                      </span>
                    ) : (
                      <span>Recent activity recorded</span>
                    )}
                  </div>

                  {lead.next_follow_up && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-neutral-400" />
                      <span>
                        Next FU:{" "}
                        <strong className="text-black">
                          {lead.next_follow_up.due_date}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* 5. Footer: Quick Stage Advancement & Action Modal Trigger */}
                <div className="pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-2">
                  {/* Stage Dropdown Selector */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase">
                      Stage:
                    </span>
                    <select
                      value={lead.canonical_stage}
                      onChange={(e) =>
                        handleQuickStageMove(
                          lead.id,
                          e.target.value as PipelineStageKey
                        )
                      }
                      className="text-xs font-mono font-bold rounded-lg px-2.5 py-1 border bg-white border-neutral-300 text-neutral-900 cursor-pointer shadow-2xs hover:border-black transition-colors"
                    >
                      {STAGE_KEYS.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_CONFIGS[s].label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(lead)}
                      className="rounded-xl text-xs font-semibold h-8 px-3 border-neutral-300 hover:bg-neutral-100 flex items-center gap-1"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-neutral-600" />
                      <span>Edit Plan</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => openLead(lead.id)}
                      className="bg-[#0c0d0f] hover:bg-black text-white rounded-xl text-xs font-bold font-mono h-8 px-3 flex items-center gap-1"
                    >
                      <span>Workspace</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── DENSE TABLE VIEW ─────────────────────────────────────────────── */
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-black/[0.08] shadow-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#f5f5f7]/80 text-[10px] font-mono font-bold text-[#6b7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Primary Contact</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Next Required Action</th>
                  <th className="py-3 px-4">Demo / Presentation</th>
                  <th className="py-3 px-4">Follow-Up Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs font-medium">
                {paginatedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-neutral-50/80 transition-colors duration-150"
                  >
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => openLead(lead.id)}
                        className="font-bold text-black hover:text-[#0f343c] hover:underline cursor-pointer text-left flex items-center gap-1"
                      >
                        <Building2 className="h-3.5 w-3.5 text-neutral-400" />
                        <span>{lead.company_name}</span>
                      </button>
                      <span className="text-[10px] text-neutral-400 block font-mono">
                        {lead.industry || lead.category || "General"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-neutral-700 font-sans">
                      {lead.primary_contact ? (
                        <div>
                          <p className="font-semibold text-black">
                            {lead.primary_contact.full_name}
                          </p>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {lead.primary_contact.phone ||
                              lead.primary_contact.email ||
                              "No direct contact"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-neutral-400 font-mono">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <select
                        value={lead.canonical_stage}
                        onChange={(e) =>
                          handleQuickStageMove(
                            lead.id,
                            e.target.value as PipelineStageKey
                          )
                        }
                        className="text-xs font-mono font-bold rounded-lg px-2 py-1 border bg-white border-neutral-300 text-neutral-900 cursor-pointer shadow-2xs"
                      >
                        {STAGE_KEYS.map((s) => (
                          <option key={s} value={s}>
                            {STAGE_CONFIGS[s].shortLabel}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {lead.next_action ? (
                        <p className="text-neutral-900 line-clamp-2 text-xs font-medium">
                          {lead.next_action}
                        </p>
                      ) : (
                        <span className="text-neutral-400 italic font-mono text-[11px]">
                          None set
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <Badge
                          className={cn(
                            "text-[10px] font-mono font-bold px-1.5 py-0.2 w-fit capitalize",
                            lead.demo_status === "in_progress"
                              ? "bg-amber-100 text-amber-900 border-amber-300"
                              : lead.demo_status === "completed"
                              ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                              : "bg-neutral-100 text-neutral-600 border-neutral-200"
                          )}
                        >
                          Demo: {lead.demo_status.replace("_", " ")}
                        </Badge>
                        {lead.demo_urls && lead.demo_urls.length > 0 && (
                          <span className="text-[10px] font-mono text-blue-600 font-semibold">
                            {lead.demo_urls.length} Demo Link(s)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {lead.action_due_date ? (
                        <span
                          className={cn(
                            "text-[11px] font-bold px-2 py-0.5 rounded",
                            lead.is_overdue
                              ? "bg-rose-100 text-rose-800"
                              : lead.is_today
                              ? "bg-amber-100 text-amber-800"
                              : "text-neutral-700"
                          )}
                        >
                          {lead.action_due_date}
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">Pending</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditModal(lead)}
                          className="h-7 px-2 text-xs font-medium"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openLead(lead.id)}
                          className="h-7 px-2.5 bg-[#0c0d0f] hover:bg-black text-white text-xs font-mono font-bold rounded-lg"
                        >
                          Open
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table View Pagination */}
          <div className="p-3 bg-white/60 border-t border-black/[0.05]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100]}
            />
          </div>
        </div>
      )}

      {/* ── EDIT ACTION & DEMO DETAILS MODAL ──────────────────────────────── */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-2xl border border-black/[0.08] shadow-glass rounded-2xl p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="font-display font-light text-xl text-black flex items-center justify-between">
              <span>Pipeline Action & Demo Details</span>
              {editingLead && (
                <span className="text-xs font-mono font-bold bg-neutral-100 px-2.5 py-1 rounded-md text-neutral-800">
                  {editingLead.company_name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs font-sans mt-2 max-h-[70vh] overflow-y-auto pr-1">
            {/* Stage Selector */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 mb-1 block">
                  Pipeline Stage *
                </label>
                <select
                  value={editForm.stage}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      stage: e.target.value as PipelineStageKey,
                    })
                  }
                  className="w-full text-xs font-mono font-bold rounded-xl px-3 py-2 border border-neutral-300 bg-white"
                >
                  {STAGE_KEYS.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_CONFIGS[s].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 mb-1 block">
                  Assigned BDM / Owner
                </label>
                <Input
                  value={editForm.assignedBdm}
                  onChange={(e) =>
                    setEditForm({ ...editForm, assignedBdm: e.target.value })
                  }
                  placeholder="e.g. Ramij"
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Next Action & Action Due Date */}
            <div>
              <label className="text-xs font-bold text-neutral-700 mb-1 block flex items-center justify-between">
                <span>Required Next Action Plan *</span>
                <span className="text-[10px] font-normal text-neutral-400">
                  Visible to management on pipeline board
                </span>
              </label>
              <Textarea
                rows={3}
                placeholder="e.g. Arrange website and ERP solution demo; prepare MOU and relevant quotation."
                value={editForm.nextAction}
                onChange={(e) =>
                  setEditForm({ ...editForm, nextAction: e.target.value })
                }
                className="rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 mb-1 block">
                  Action / Follow-Up Due Date
                </label>
                <Input
                  type="date"
                  value={editForm.actionDueDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, actionDueDate: e.target.value })
                  }
                  className="rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 mb-1 block">
                  Demo Status
                </label>
                <select
                  value={editForm.demoStatus}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      demoStatus: e.target.value as DemoStatus,
                    })
                  }
                  className="w-full text-xs font-mono rounded-xl px-3 py-2 border border-neutral-300 bg-white"
                >
                  <option value="none">None</option>
                  <option value="required">Demo Required</option>
                  <option value="in_progress">Demo In Progress</option>
                  <option value="completed">Demo Completed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-neutral-700 mb-1 block">
                  Presentation Status
                </label>
                <select
                  value={editForm.presentationStatus}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      presentationStatus: e.target.value as PresentationStatus,
                    })
                  }
                  className="w-full text-xs font-mono rounded-xl px-3 py-2 border border-neutral-300 bg-white"
                >
                  <option value="none">None</option>
                  <option value="required">Presentation Required</option>
                  <option value="sent">Presentation Sent</option>
                  <option value="completed">Presentation Completed</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-700 mb-1 block">
                  Proposal Status
                </label>
                <select
                  value={editForm.proposalStatus}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      proposalStatus: e.target.value as ProposalStatus,
                    })
                  }
                  className="w-full text-xs font-mono rounded-xl px-3 py-2 border border-neutral-300 bg-white"
                >
                  <option value="none">None</option>
                  <option value="drafting">Drafting / Preparing</option>
                  <option value="sent">Proposal Sent</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>

            {/* Attached Demo Links & Presentation Materials */}
            <div className="bg-neutral-50 p-3.5 rounded-xl border border-neutral-200/80 space-y-3">
              <label className="text-xs font-bold text-neutral-800 block">
                Demo & Presentation Links / Attachments
              </label>

              {/* Existing Demo URLs */}
              <div className="space-y-1.5">
                {editForm.demoUrls.map((d, i) => (
                  <div
                    key={`d-${i}`}
                    className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-neutral-200"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Play className="h-3 w-3 text-amber-600 shrink-0" />
                      <span className="font-semibold">{d.title}:</span>
                      <span className="text-neutral-500 truncate font-mono text-[11px]">
                        {d.url}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveUrl("demo", i)}
                      className="text-neutral-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {editForm.presentationUrls.map((p, i) => (
                  <div
                    key={`p-${i}`}
                    className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-neutral-200"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="h-3 w-3 text-purple-600 shrink-0" />
                      <span className="font-semibold">{p.title}:</span>
                      <span className="text-neutral-500 truncate font-mono text-[11px]">
                        {p.url}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveUrl("presentation", i)}
                      className="text-neutral-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Link input */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-200">
                <Input
                  placeholder="Title (e.g. Voice AI Demo)"
                  value={newUrlTitle}
                  onChange={(e) => setNewUrlTitle(e.target.value)}
                  className="rounded-lg text-xs"
                />
                <Input
                  placeholder="URL (e.g. https://...)"
                  value={newUrlLink}
                  onChange={(e) => setNewUrlLink(e.target.value)}
                  className="rounded-lg text-xs font-mono"
                />
                <div className="flex items-center gap-1">
                  <select
                    value={newUrlType}
                    onChange={(e) =>
                      setNewUrlType(e.target.value as "demo" | "presentation")
                    }
                    className="text-xs rounded-lg px-2 py-1.5 border border-neutral-300 bg-white"
                  >
                    <option value="demo">Demo Link</option>
                    <option value="presentation">Presentation</option>
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddUrl}
                    className="rounded-lg text-xs font-mono font-bold bg-[#0c0d0f] hover:bg-black text-white px-2.5 h-8"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Operational Notes */}
            <div>
              <label className="text-xs font-bold text-neutral-700 mb-1 block">
                Executive Notes & Strategy
              </label>
              <Textarea
                rows={2}
                placeholder="Key meeting takeaways, client objections, commercial terms..."
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                className="rounded-xl text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-[#0c0d0f] hover:bg-black text-white rounded-xl text-xs font-mono font-bold px-4"
            >
              Save Pipeline Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
