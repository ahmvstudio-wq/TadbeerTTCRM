"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
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
  FolderPlus,
  Layers,
  Send,
  HelpCircle,
  Copy,
  FileCheck
} from "lucide-react";
import { ModuleSubNav, type SubNavTab } from "@/components/layout/module-sub-nav";
import { MeetingsClient } from "@/app/(app)/meetings/page";
import { AuditsClient } from "@/app/(app)/audits/page";
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
    dot: string;
  }
> = {
  outreach: {
    label: "Outreach / Initial Contact",
    shortLabel: "Outreach",
    subtext: "Active multi-channel touches & cold/warm cadence",
    dot: "bg-blue-500",
  },
  meeting: {
    label: "Meeting / Fixed",
    shortLabel: "Meeting",
    subtext: "Coffee invites, calls scheduled & discovery booked",
    dot: "bg-purple-500",
  },
  demo: {
    label: "Demo / Presentation",
    shortLabel: "Demo",
    subtext: "Custom software/AI demos, ERP modules & digital roadmaps",
    dot: "bg-amber-500",
  },
  proposal: {
    label: "Proposal Sent",
    shortLabel: "Proposal",
    subtext: "Quotations, transformation scopes & MOUs under client review",
    dot: "bg-indigo-500",
  },
  follow_up: {
    label: "Follow-up / Negotiation",
    shortLabel: "Follow-up",
    subtext: "Commercial negotiations, launch prerequisites & closing checks",
    dot: "bg-orange-500",
  },
  won: {
    label: "Won / Closed",
    shortLabel: "Won",
    subtext: "Agreements executed, commercial contracts active & onboarded",
    dot: "bg-emerald-500",
  },
  lost: {
    label: "Lost / Dormant",
    shortLabel: "Lost",
    subtext: "Disqualified, declined or snoozed accounts",
    dot: "bg-neutral-500",
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

// ─── PIPELINE STAGE STEPPER ───────────────────────────────────────────────────
function PipelineStageStepper({ currentStage }: { currentStage: PipelineStageKey | string }) {
  const stages: { key: PipelineStageKey; num: number; label: string; sub: string }[] = [
    { key: "outreach", num: 1, label: "Outreach", sub: "Cadence" },
    { key: "meeting", num: 2, label: "Meeting", sub: "Discovery" },
    { key: "demo", num: 3, label: "Demo", sub: "Showcase" },
    { key: "proposal", num: 4, label: "Proposal", sub: "Quotation" },
    { key: "follow_up", num: 5, label: "Follow-up", sub: "Negotiate" },
  ];

  const stageOrder: Record<string, number> = {
    outreach: 1,
    meeting: 2,
    demo: 3,
    proposal: 4,
    follow_up: 5,
    won: 6,
    lost: 0,
  };

  const currentNum = stageOrder[currentStage] || 1;

  if (currentStage === "won") {
    return (
      <div className="w-full py-2 px-3 bg-emerald-50/90 rounded-2xl border border-emerald-200/80 flex items-center justify-center gap-2 text-emerald-800 text-xs font-semibold">
        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>Deal Closed & Won — Contract Active & Onboarded</span>
      </div>
    );
  }

  if (currentStage === "lost") {
    return (
      <div className="w-full py-2 px-3 bg-neutral-100/90 rounded-2xl border border-neutral-200 flex items-center justify-center gap-2 text-neutral-700 text-xs font-semibold">
        <XCircle className="h-4 w-4 text-neutral-500 shrink-0" />
        <span>Account Archived / Snoozed</span>
      </div>
    );
  }

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative max-w-lg mx-auto">
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] bg-neutral-200 -z-0" />
        {stages.map((stage) => {
          const isCompleted = stage.num < currentNum;
          const isCurrent = stage.num === currentNum;

          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all shadow-xs",
                  isCompleted && "bg-emerald-600 text-white ring-4 ring-emerald-50",
                  isCurrent && "bg-black text-white ring-4 ring-neutral-200 scale-110",
                  !isCompleted && !isCurrent && "bg-neutral-100 text-neutral-400 border border-neutral-300"
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : stage.num}
              </div>
              <div className="text-center mt-1">
                <p
                  className={cn(
                    "text-[10px] font-medium leading-tight whitespace-nowrap",
                    isCurrent ? "text-neutral-900 font-semibold" : "text-neutral-500"
                  )}
                >
                  {stage.label}
                </p>
                <span className="text-[9px] text-neutral-400 font-mono block">
                  {stage.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

  // Consolidated Module Tabs: Deals & Stages vs Meetings vs Audits
  const [activeModuleTab, setActiveModuleTab] = useState<"deals" | "meetings" | "audits">("deals");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "meetings" || tab === "meeting") {
        setActiveModuleTab("meetings");
      } else if (tab === "audits" || tab === "audit") {
        setActiveModuleTab("audits");
      } else {
        setActiveModuleTab("deals");
      }
    }
  }, []);

  const handleModuleTabChange = (tabId: string) => {
    setActiveModuleTab(tabId as any);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabId);
      window.history.replaceState({}, "", url.toString());
    }
  };

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
    assignedBdm: "",
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
    const handleLeadUpdated = () => {
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
      if (lead.canonical_stage !== "uncontacted") {
        counts[lead.canonical_stage as PipelineStageKey] =
          (counts[lead.canonical_stage as PipelineStageKey] || 0) + 1;
      }
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
      if (lead.canonical_stage === "won" || lead.canonical_stage === "lost" || lead.canonical_stage === "uncontacted")
        continue;
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

  // Get Next Stage in sequence
  const getNextStage = (current: PipelineStageKey): PipelineStageKey | null => {
    const sequence: PipelineStageKey[] = ["outreach", "meeting", "demo", "proposal", "follow_up", "won"];
    const idx = sequence.indexOf(current);
    if (idx !== -1 && idx < sequence.length - 1) {
      return sequence[idx + 1];
    }
    return null;
  };

  // Open Edit Action & Demo Modal
  const openEditModal = (lead: PipelineLead) => {
    setEditingLead(lead);
    setEditForm({
      stage: (lead.canonical_stage === "uncontacted" ? "outreach" : lead.canonical_stage) as PipelineStageKey,
      nextAction: lead.next_action || "",
      actionDueDate: lead.action_due_date || "",
      demoStatus: lead.demo_status,
      presentationStatus: lead.presentation_status,
      proposalStatus: lead.proposal_status,
      followUpStatus: lead.follow_up_status,
      demoUrls: lead.demo_urls || [],
      presentationUrls: lead.presentation_urls || [],
      assignedBdm: "",
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

  const currentStageConfig = STAGE_CONFIGS[selectedStage];

  const pipelineTabs: SubNavTab[] = [
    { id: "deals", label: "Deals & Stages", icon: TrendingUp },
    { id: "meetings", label: "Meetings", icon: Calendar },
    { id: "audits", label: "Audits", icon: FileCheck },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <ModuleSubNav
          title="Sales Pipeline & Deals"
          subtitle="Deal progression, scheduled meetings, and client diagnostics"
          tabs={pipelineTabs}
          activeTab={activeModuleTab}
          onTabChange={handleModuleTabChange}
        />
      </div>

      {activeModuleTab === "meetings" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <MeetingsClient />
        </div>
      )}

      {activeModuleTab === "audits" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <AuditsClient />
        </div>
      )}

      {activeModuleTab === "deals" && (
        <>
          {/* ─── Top Control Panel Header (Follow-up Command Center Style) ──────── */}
          <div className="bg-white border-b border-black/[0.06] sticky top-0 z-20 backdrop-blur-md bg-white/95 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-light tracking-tight text-neutral-900 font-display">
                  Pipeline & Sales Operations
                </h1>
                <Badge variant="outline" className="text-[11px] font-mono tracking-wider uppercase bg-neutral-50 text-neutral-600 border-neutral-200">
                  Live View
                </Badge>
              </div>
              <p className="text-xs text-neutral-500 font-light mt-0.5">
                End-to-end management pipeline tracking deals from initial outreach to demo presentation, proposal review, and closing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPipeline(false)}
                className="text-xs font-light rounded-xl h-9 px-3.5 border-black/[0.08] hover:bg-neutral-50 cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5 text-neutral-500" />
                <span>Refresh Pipeline</span>
              </Button>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-neutral-100/90 p-0.5 rounded-xl border border-black/[0.06]">
                <button
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all",
                    viewMode === "cards"
                      ? "bg-black text-white shadow-xs font-semibold"
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
                      ? "bg-black text-white shadow-xs font-semibold"
                      : "text-neutral-600 hover:text-black"
                  )}
                >
                  <List className="h-3.5 w-3.5" />
                  <span>Table</span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── Metric Tabs (Stage Navigation Cards) ───────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-5">
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
                    "p-3.5 rounded-2xl text-left transition-all cursor-pointer border relative overflow-hidden",
                    isSelected
                      ? "bg-black text-white border-black shadow-md ring-2 ring-neutral-200"
                      : "bg-white hover:bg-neutral-50/80 text-neutral-800 border-black/[0.06] hover:border-black/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[10px] uppercase font-mono tracking-wider font-semibold",
                        isSelected ? "text-neutral-400" : "text-neutral-500"
                      )}
                    >
                      {config.shortLabel}
                    </span>
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isSelected ? "bg-white" : config.dot
                      )}
                    />
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span
                      className={cn(
                        "text-2xl font-light font-display",
                        isSelected ? "text-white" : "text-neutral-900"
                      )}
                    >
                      {count}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-light truncate",
                        isSelected ? "text-neutral-400" : "text-neutral-400"
                      )}
                    >
                      {stageKey === "outreach"
                        ? "In Cadence"
                        : stageKey === "meeting"
                        ? "Booked"
                        : stageKey === "demo"
                        ? "Showcases"
                        : stageKey === "proposal"
                        ? "Sent"
                        : stageKey === "follow_up"
                        ? "Closing"
                        : stageKey === "won"
                        ? "Won"
                        : "Archived"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ─── Search & Intelligence Filter Bar ────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-black/[0.04]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by company, contact, action or sector..."
                className="pl-9 bg-neutral-50/70 border-neutral-200 text-xs rounded-xl h-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIntelligenceFilter("all")}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border",
                  intelligenceFilter === "all"
                    ? "bg-black text-white border-black shadow-xs"
                    : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                )}
              >
                All in Stage ({stageCounts[selectedStage] || 0})
              </button>

              <button
                onClick={() => setIntelligenceFilter("overdue")}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5",
                  intelligenceFilter === "overdue"
                    ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                    : "bg-rose-50/70 text-rose-800 border-rose-200 hover:bg-rose-100"
                )}
              >
                <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
                <span>Overdue</span>
                <span className="font-mono text-[10px] font-bold bg-rose-200/80 px-1.5 py-0.2 rounded text-rose-900">
                  {metrics.overdueCount}
                </span>
              </button>

              <button
                onClick={() => setIntelligenceFilter("today")}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5",
                  intelligenceFilter === "today"
                    ? "bg-amber-600 text-white border-amber-700 shadow-xs"
                    : "bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100"
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
                  "px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5",
                  intelligenceFilter === "waiting_demo"
                    ? "bg-purple-600 text-white border-purple-700 shadow-xs"
                    : "bg-purple-50/70 text-purple-800 border-purple-200 hover:bg-purple-100"
                )}
              >
                <Play className="h-3 w-3 text-purple-600 shrink-0" />
                <span>Demo In Progress</span>
                <span className="font-mono text-[10px] font-bold bg-purple-200/80 px-1.5 py-0.2 rounded text-purple-900">
                  {metrics.waitingDemoCount}
                </span>
              </button>

              <button
                onClick={() => setIntelligenceFilter("needs_action")}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border flex items-center gap-1.5",
                  intelligenceFilter === "needs_action"
                    ? "bg-teal-600 text-white border-teal-700 shadow-xs"
                    : "bg-teal-50/70 text-teal-800 border-teal-200 hover:bg-teal-100"
                )}
              >
                <Sparkles className="h-3 w-3 text-teal-600 shrink-0" />
                <span>Action Required</span>
                <span className="font-mono text-[10px] font-bold bg-teal-200/80 px-1.5 py-0.2 rounded text-teal-900">
                  {metrics.needsActionCount}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Pipeline Stream (Follow-up Command Center Clean Layout) ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`flex items-center gap-2.5 p-3.5 mb-6 rounded-2xl text-xs font-medium backdrop-blur-md shadow-2xs transition-all ${
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

        {loading && leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-900 mb-3" />
            <p className="text-xs font-light">Loading sales pipeline...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-black/[0.05] p-8 shadow-2xs">
            <div className="h-12 w-12 rounded-2xl bg-neutral-100 text-neutral-500 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-base font-light text-neutral-900 font-display">
              No accounts in {currentStageConfig.label}
            </h3>
            <p className="text-xs text-neutral-500 font-light mt-1 max-w-md mx-auto">
              {intelligenceFilter !== "all"
                ? `No accounts in "${currentStageConfig.shortLabel}" with the "${intelligenceFilter}" filter.`
                : `There are currently no accounts in the "${currentStageConfig.label}" stage.`}
            </p>
            {intelligenceFilter !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIntelligenceFilter("all")}
                className="mt-4 text-xs cursor-pointer rounded-xl"
              >
                Reset Filter
              </Button>
            )}
          </div>
        ) : viewMode === "cards" ? (
          /* ─── MINIMAL CARD STREAM ─────────────────────────────────────────── */
          <div className="space-y-5">
            {filteredLeads.map((lead) => {
              const nextStageKey = getNextStage(lead.canonical_stage as PipelineStageKey);
              const hasDemos = lead.demo_urls && lead.demo_urls.length > 0;
              const hasPresentations = lead.presentation_urls && lead.presentation_urls.length > 0;

              return (
                <div
                  key={lead.id}
                  className={cn(
                    "bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-2xs hover:shadow-md",
                    lead.is_today && "border-emerald-300/80 ring-1 ring-emerald-200/50",
                    lead.is_overdue && "border-rose-200 bg-rose-50/[0.02]",
                    lead.mgmt_highlight && "border-amber-300/90 ring-1 ring-amber-200/60",
                    !lead.is_today && !lead.is_overdue && !lead.mgmt_highlight && "border-black/[0.06]"
                  )}
                >
                  {/* Card Header (Identical to Follow-up Command Center) */}
                  <div className="p-5 sm:p-6 pb-4 border-b border-black/[0.04]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <button
                            onClick={() => openLead(lead.id)}
                            className="text-base sm:text-lg font-light text-neutral-900 hover:text-black tracking-tight font-display hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                          >
                            <span>{lead.company_name}</span>
                            <ExternalLink className="h-3.5 w-3.5 opacity-40 hover:opacity-100" />
                          </button>

                          <Badge
                            variant="outline"
                            className="text-[10px] uppercase font-mono tracking-wider bg-neutral-50 text-neutral-600 border-neutral-200"
                          >
                            {lead.industry || lead.category || "General"}
                          </Badge>

                          {lead.mgmt_highlight && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                              <Sparkles className="h-3 w-3 text-amber-600" />
                              Mgmt Focus
                            </span>
                          )}
                        </div>

                        {/* Contact details */}
                        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 font-light flex-wrap">
                          {lead.primary_contact ? (
                            <>
                              <span className="font-normal text-neutral-800">
                                {lead.primary_contact.full_name}
                              </span>
                              {lead.primary_contact.title && (
                                <>
                                  <span>•</span>
                                  <span>{lead.primary_contact.title}</span>
                                </>
                              )}
                              {lead.primary_contact.phone && (
                                <>
                                  <span>•</span>
                                  <a
                                    href={`tel:${lead.primary_contact.phone}`}
                                    className="font-mono text-neutral-600 hover:text-black hover:underline"
                                  >
                                    {lead.primary_contact.phone}
                                  </a>
                                </>
                              )}
                              {lead.primary_contact.whatsapp && (
                                <>
                                  <span>•</span>
                                  <a
                                    href={`https://wa.me/${lead.primary_contact.whatsapp.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-700 hover:text-emerald-900 font-mono font-medium flex items-center gap-1"
                                  >
                                    <MessageSquare className="h-3 w-3" />
                                    <span>WhatsApp</span>
                                  </a>
                                </>
                              )}
                            </>
                          ) : (
                            <span className="text-neutral-400">No primary contact recorded</span>
                          )}
                        </div>
                      </div>

                      {/* Due Date Indicator */}
                      <div className="flex items-center gap-2 self-start sm:self-center font-mono">
                        {lead.is_today && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            DUE TODAY
                          </span>
                        )}
                        {lead.is_overdue && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                            <AlertTriangle className="h-3 w-3 text-rose-500" />
                            Overdue ({lead.action_due_date || "Past"})
                          </span>
                        )}
                        {!lead.is_today && !lead.is_overdue && lead.action_due_date && (
                          <span className="px-3 py-1 rounded-full text-xs text-neutral-600 bg-neutral-100 border border-neutral-200">
                            Due: {lead.action_due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stage Stepper Component */}
                  <div className="px-5 sm:px-6 py-4 bg-neutral-50/40 border-b border-black/[0.04]">
                    <PipelineStageStepper currentStage={lead.canonical_stage} />
                  </div>

                  {/* ─── REQUIRED NEXT ACTION & PLAYBOOK BOX ─────────────────── */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="bg-neutral-50/70 p-4 sm:p-5 rounded-2xl border border-black/[0.04] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-neutral-500 flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-neutral-700" />
                          <span>Required Sales Action Plan</span>
                        </span>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(lead)}
                          className="h-6 px-2 text-[11px] text-neutral-500 hover:text-black font-light"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          <span>Edit Plan</span>
                        </Button>
                      </div>

                      <p className="text-xs sm:text-sm text-neutral-800 leading-relaxed font-light">
                        {lead.next_action || (
                          <span className="text-neutral-400 italic">
                            No explicit sales action specified. Click &ldquo;Edit Plan&rdquo; to define the next milestone.
                          </span>
                        )}
                      </p>

                      {/* Demo & Presentation Links (if any) */}
                      {(hasDemos || hasPresentations) && (
                        <div className="pt-3 border-t border-neutral-200/60 flex flex-wrap items-center gap-2">
                          {lead.demo_urls?.map((d, i) => (
                            <a
                              key={`d-${i}`}
                              href={d.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 transition-colors"
                            >
                              <Play className="h-3 w-3 text-amber-600 shrink-0" />
                              <span>{d.title}</span>
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                          ))}

                          {lead.presentation_urls?.map((p, i) => (
                            <a
                              key={`p-${i}`}
                              href={p.url.startsWith("http") ? p.url : "#"}
                              onClick={(e) => {
                                if (!p.url.startsWith("http")) {
                                  e.preventDefault();
                                  setToast({
                                    type: "success",
                                    message: `${p.title} is linked to this account.`,
                                  });
                                }
                              }}
                              target={p.url.startsWith("http") ? "_blank" : undefined}
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-purple-50 text-purple-900 border border-purple-200/80 hover:bg-purple-100 transition-colors"
                            >
                              <FileText className="h-3 w-3 text-purple-600 shrink-0" />
                              <span>{p.title}</span>
                              <ExternalLink className="h-3 w-3 opacity-60" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Actions (Follow-up Command Center Minimal Button Bar) */}
                  <div className="p-4 sm:p-5 bg-neutral-50/40 border-t border-black/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Quick Stage Changer */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase font-bold text-neutral-400">
                        Current Stage:
                      </span>
                      <select
                        value={lead.canonical_stage}
                        onChange={(e) =>
                          handleQuickStageMove(
                            lead.id,
                            e.target.value as PipelineStageKey
                          )
                        }
                        className="bg-white border border-neutral-200 rounded-xl px-3 py-1.5 text-xs font-medium text-neutral-800 cursor-pointer shadow-2xs hover:border-black transition-colors"
                      >
                        {STAGE_KEYS.map((s) => (
                          <option key={s} value={s}>
                            {STAGE_CONFIGS[s].label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Right: Operational Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openLead(lead.id)}
                        className="text-xs font-light rounded-xl h-9 px-3.5 border-black/[0.08] hover:bg-neutral-50 cursor-pointer"
                      >
                        View Lead Details
                      </Button>

                      {nextStageKey && (
                        <Button
                          size="sm"
                          onClick={() => handleQuickStageMove(lead.id, nextStageKey)}
                          className="bg-black text-white hover:bg-neutral-800 text-xs font-light rounded-xl h-9 px-4 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Advance to {STAGE_CONFIGS[nextStageKey].shortLabel}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── DENSE TABLE VIEW ──────────────────────────────────────────── */
          <div className="bg-white rounded-3xl border border-black/[0.06] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans">
                <thead>
                  <tr className="border-b border-black/[0.04] bg-neutral-50/70 text-[10px] font-mono font-semibold text-neutral-500 uppercase tracking-wider">
                    <th className="py-3 px-5">Company</th>
                    <th className="py-3 px-4">Primary Contact</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Required Next Action</th>
                    <th className="py-3 px-4">Demo / Presentation</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs font-light">
                  {paginatedLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <button
                          onClick={() => openLead(lead.id)}
                          className="font-normal text-neutral-900 hover:underline cursor-pointer text-left block"
                        >
                          {lead.company_name}
                        </button>
                        <span className="text-[10px] text-neutral-400 font-mono">
                          {lead.industry || lead.category || "General"}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-neutral-600">
                        {lead.primary_contact ? (
                          <div>
                            <p className="font-normal text-neutral-800">
                              {lead.primary_contact.full_name}
                            </p>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {lead.primary_contact.phone || lead.primary_contact.email || "No direct phone"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <select
                          value={lead.canonical_stage}
                          onChange={(e) =>
                            handleQuickStageMove(
                              lead.id,
                              e.target.value as PipelineStageKey
                            )
                          }
                          className="bg-white border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-800 cursor-pointer"
                        >
                          {STAGE_KEYS.map((s) => (
                            <option key={s} value={s}>
                              {STAGE_CONFIGS[s].shortLabel}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-4 px-4 max-w-xs">
                        <p className="text-neutral-800 line-clamp-2 text-xs font-normal">
                          {lead.next_action || <span className="text-neutral-400 italic">None set</span>}
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-mono capitalize text-neutral-700">
                            {lead.demo_status !== "none" ? `Demo: ${lead.demo_status.replace("_", " ")}` : "—"}
                          </span>
                          {lead.demo_urls && lead.demo_urls.length > 0 && (
                            <span className="text-[10px] font-mono text-blue-600 font-medium">
                              {lead.demo_urls.length} link(s)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono">
                        {lead.action_due_date ? (
                          <span
                            className={cn(
                              "text-[11px] px-2 py-0.5 rounded-full font-medium",
                              lead.is_overdue
                                ? "bg-rose-100 text-rose-800"
                                : lead.is_today
                                ? "bg-amber-100 text-amber-800"
                                : "text-neutral-600"
                            )}
                          >
                            {lead.action_due_date}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(lead)}
                            className="h-7 px-2 text-xs font-light"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openLead(lead.id)}
                            className="h-7 px-2.5 bg-black text-white text-xs font-light rounded-lg"
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

            <div className="p-4 bg-neutral-50/50 border-t border-black/[0.04]">
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
      </div>

      {/* ── EDIT ACTION & DEMO DETAILS MODAL ──────────────────────────────── */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl border border-black/[0.08] shadow-glass p-6 font-sans">
          <DialogHeader>
            <DialogTitle className="font-display font-light text-xl text-neutral-900 flex items-center justify-between">
              <span>Pipeline Action & Demo Details</span>
              {editingLead && (
                <span className="text-xs font-mono font-normal bg-neutral-100 px-2.5 py-1 rounded-lg text-neutral-800">
                  {editingLead.company_name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs font-sans mt-2 max-h-[70vh] overflow-y-auto pr-1">
            {/* Stage Selector */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
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
                className="w-full text-xs font-mono rounded-xl px-3 py-2 border border-neutral-300 bg-white"
              >
                {STAGE_KEYS.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_CONFIGS[s].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Next Action & Action Due Date */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block flex items-center justify-between">
                <span>Required Next Action Plan *</span>
                <span className="text-[10px] font-normal text-neutral-400">
                  Visible to executive team in pipeline stream
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
                <label className="text-xs font-semibold text-neutral-700 mb-1 block">
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
                <label className="text-xs font-semibold text-neutral-700 mb-1 block">
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
                <label className="text-xs font-semibold text-neutral-700 mb-1 block">
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
                <label className="text-xs font-semibold text-neutral-700 mb-1 block">
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
            <div className="bg-neutral-50/80 p-4 rounded-2xl border border-neutral-200/80 space-y-3">
              <label className="text-xs font-semibold text-neutral-800 block">
                Demo & Presentation Links / Attachments
              </label>

              {/* Existing Demo URLs */}
              <div className="space-y-1.5">
                {editForm.demoUrls.map((d, i) => (
                  <div
                    key={`d-${i}`}
                    className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-neutral-200"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Play className="h-3 w-3 text-amber-600 shrink-0" />
                      <span className="font-medium">{d.title}:</span>
                      <span className="text-neutral-500 truncate font-mono text-[11px]">
                        {d.url}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveUrl("demo", i)}
                      className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}

                {editForm.presentationUrls.map((p, i) => (
                  <div
                    key={`p-${i}`}
                    className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-neutral-200"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="h-3 w-3 text-purple-600 shrink-0" />
                      <span className="font-medium">{p.title}:</span>
                      <span className="text-neutral-500 truncate font-mono text-[11px]">
                        {p.url}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveUrl("presentation", i)}
                      className="text-neutral-400 hover:text-rose-600 p-1 cursor-pointer"
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
                  className="rounded-xl text-xs"
                />
                <Input
                  placeholder="URL (e.g. https://...)"
                  value={newUrlLink}
                  onChange={(e) => setNewUrlLink(e.target.value)}
                  className="rounded-xl text-xs font-mono"
                />
                <div className="flex items-center gap-1">
                  <select
                    value={newUrlType}
                    onChange={(e) =>
                      setNewUrlType(e.target.value as "demo" | "presentation")
                    }
                    className="text-xs rounded-xl px-2.5 py-1.5 border border-neutral-300 bg-white"
                  >
                    <option value="demo">Demo Link</option>
                    <option value="presentation">Presentation</option>
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddUrl}
                    className="rounded-xl text-xs font-light bg-black hover:bg-neutral-800 text-white px-3 h-8 cursor-pointer"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Operational Notes */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
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
              className="rounded-xl text-xs font-light cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-light px-4 cursor-pointer"
            >
              Save Pipeline Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}
