"use client";

import { useState, useEffect, useMemo } from "react";
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
  GripVertical,
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
import { cn } from "@/lib/utils";
import {
  getOpportunities,
  createOpportunity,
  updateOpportunityStage,
} from "@/lib/actions/opportunities";
import { deleteOpportunity } from "@/lib/actions/delete";
import { getCompanies } from "@/lib/actions/companies";
import { OPPORTUNITY_STAGES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { useUnifiedLead } from "@/context/unified-lead-context";

const STAGE_CONFIGS: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  qualified: {
    label: "Qualified",
    bg: "bg-blue-50/80",
    text: "text-blue-700",
    border: "border-blue-200/80",
    dot: "bg-blue-500",
  },
  proposal_sent: {
    label: "Proposal Sent",
    bg: "bg-amber-50/80",
    text: "text-amber-700",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
  },
  negotiation: {
    label: "Negotiation",
    bg: "bg-purple-50/80",
    text: "text-purple-700",
    border: "border-purple-200/80",
    dot: "bg-purple-500",
  },
  verbal_commit: {
    label: "Verbal Commit",
    bg: "bg-teal-50/80",
    text: "text-teal-700",
    border: "border-teal-200/80",
    dot: "bg-teal-500",
  },
  won: {
    label: "Won",
    bg: "bg-emerald-50/80",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
  lost: {
    label: "Lost",
    bg: "bg-rose-50/80",
    text: "text-rose-700",
    border: "border-rose-200/80",
    dot: "bg-rose-500",
  },
};

const KANBAN_STAGES = [
  "qualified",
  "proposal_sent",
  "negotiation",
  "verbal_commit",
  "won",
  "lost",
];

export default function PipelinePage() {
  const { openLead } = useUnifiedLead();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"board" | "table">("board");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [newForm, setNewForm] = useState({
    company_id: "",
    title: "",
    estimated_value: "",
    stage: "qualified",
    description: "",
  });

  // Drag & Drop State
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Pagination for Table view
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    const [oRes, cRes] = await Promise.all([getOpportunities(), getCompanies()]);
    if (oRes.data) setOpportunities(oRes.data);
    if (cRes.data) setCompanies(cRes.data);
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    fetchData(false);
    const handleLeadUpdated = (e: any) => {
      if (e?.detail?.source === "pipeline_page") return;
      fetchData(true);
    };
    window.addEventListener("lead-updated", handleLeadUpdated);
    return () => window.removeEventListener("lead-updated", handleLeadUpdated);
  }, []);

  const activeOpps = opportunities.filter(
    (o) => o.stage !== "won" && o.stage !== "lost"
  );
  const totalValue = activeOpps.reduce(
    (sum, o) => sum + (Number(o.estimated_value) || 0),
    0
  );
  const weightedValue = activeOpps.reduce(
    (sum, o) =>
      sum + (Number(o.estimated_value) || 0) * ((o.probability || 0) / 100),
    0
  );

  // Table pagination
  const totalItems = opportunities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedOpportunities = useMemo(() => {
    if (pageSize >= 999999) return opportunities;
    const start = (currentPage - 1) * pageSize;
    return opportunities.slice(start, start + pageSize);
  }, [opportunities, currentPage, pageSize]);

  const handleCreate = async () => {
    if (!newForm.company_id || !newForm.title || !newForm.estimated_value) return;
    const targetCompanyId = newForm.company_id;
    const result = await createOpportunity({
      company_id: newForm.company_id,
      title: newForm.title,
      estimated_value: parseFloat(newForm.estimated_value),
      stage: newForm.stage,
      description: newForm.description || undefined,
    });
    if (result.error) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setNewDialogOpen(false);
    setNewForm({
      company_id: "",
      title: "",
      estimated_value: "",
      stage: "qualified",
      description: "",
    });
    setToast({ type: "success", message: "Opportunity created" });
    fetchData();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", { detail: { companyId: targetCompanyId } }));
    }
  };

  const handleStageChange = async (id: string, stage: string) => {
    // Optimistic UI update
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, stage } : o))
    );
    const result = await updateOpportunityStage(id, stage);
    if (result.error) {
      setToast({ type: "error", message: result.error });
      fetchData();
      return;
    }
    setToast({
      type: "success",
      message: `Stage updated to ${STAGE_CONFIGS[stage]?.label || stage}`,
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", { detail: { source: "pipeline_page", opportunityId: id, stage } }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this opportunity?")) return;
    const result = await deleteOpportunity(id);
    if (result.error) {
      setToast({ type: "error", message: result.error });
      return;
    }
    setToast({ type: "success", message: "Opportunity deleted" });
    fetchData();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", { detail: { opportunityId: id, deleted: true } }));
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-brand-teal" />
      </div>
    );

  return (
    <div className="p-3 sm:p-6 max-w-[1700px] mx-auto space-y-6 font-sans">
      {toast && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-xs font-medium backdrop-blur-md shadow-glass transition-all ${
            toast.type === "success"
              ? "bg-emerald-50/90 text-emerald-800 border border-emerald-200"
              : "bg-red-50/90 text-red-800 border border-red-200"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-black/[0.06] shadow-glass">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-black/[0.04] border border-black/[0.06] text-black mb-1">
            <DollarSign className="h-3 w-3 text-black" />
            <span>SALES PIPELINE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-light tracking-tight text-black font-display">
            Pipeline & Deals
          </h1>
          <p className="text-neutral-500 text-xs mt-0.5 font-light font-body">
            Track deals across pipeline stages. Drag and drop deals smoothly between columns.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-neutral-100/80 p-0.5 rounded-xl border border-black/[0.04]">
            <button
              onClick={() => setViewMode("board")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all",
                viewMode === "board"
                  ? "bg-[#0c0d0f] text-white shadow-xs font-bold"
                  : "text-neutral-600 hover:text-black"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Board</span>
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

          <Button
            className="bg-[#0f343c] hover:bg-[#091f24] text-white border border-[#16434d] text-xs font-mono font-bold px-3.5 h-8.5 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            onClick={() => setNewDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Deal</span>
          </Button>
        </div>
      </div>

      {/* ── KPI Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-xl p-4.5 rounded-2xl border border-black/[0.06] shadow-glass text-center">
          <p className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider">
            Total Pipeline Value
          </p>
          <p className="text-2xl font-light text-black mt-1 font-display">
            {formatCurrency(totalValue)}
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl p-4.5 rounded-2xl border border-black/[0.06] shadow-glass text-center">
          <p className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider">
            Weighted Value
          </p>
          <p className="text-2xl font-light text-black mt-1 font-display">
            {formatCurrency(weightedValue)}
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-xl p-4.5 rounded-2xl border border-black/[0.06] shadow-glass text-center">
          <p className="text-[10px] text-neutral-400 font-mono font-bold uppercase tracking-wider">
            Active Deals
          </p>
          <p className="text-2xl font-light text-black mt-1 font-display">
            {activeOpps.length}
          </p>
        </div>
      </div>

      {opportunities.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-xl p-12 rounded-2xl border border-black/[0.06] shadow-glass text-center">
          <TrendingUp className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-xs font-medium text-neutral-500">
            No deals found in pipeline. Click "+ New Deal" to create one.
          </p>
        </div>
      ) : viewMode === "board" ? (
        /* ── KANBAN BOARD VIEW WITH SMOOTH DRAG & DROP ────────────────── */
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide" style={{ minHeight: "680px" }}>
          {KANBAN_STAGES.map((stageKey) => {
            const stageDeals = opportunities.filter((o) => o.stage === stageKey);
            const stageConfig = STAGE_CONFIGS[stageKey];
            const stageTotal = stageDeals.reduce(
              (sum, o) => sum + (Number(o.estimated_value) || 0),
              0
            );
            const isDragOver = dragOverStage === stageKey;

            return (
              <div
                key={stageKey}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverStage !== stageKey) setDragOverStage(stageKey);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  if (dragOverStage === stageKey) setDragOverStage(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverStage(null);
                  const dealId =
                    e.dataTransfer.getData("text/plain") || draggedDealId;
                  if (!dealId) return;
                  const targetDeal = opportunities.find((o) => o.id === dealId);
                  if (!targetDeal || targetDeal.stage === stageKey) return;
                  handleStageChange(dealId, stageKey);
                }}
                className={cn(
                  "flex-shrink-0 w-80 bg-white/75 backdrop-blur-xl rounded-2xl border border-black/[0.06] shadow-glass flex flex-col max-h-[820px] transition-all duration-200",
                  isDragOver &&
                    "ring-2 ring-brand-teal/50 bg-teal-500/[0.06] border-brand-teal/40 scale-[1.01]"
                )}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-black/[0.06] bg-white/80 backdrop-blur-md rounded-t-2xl flex items-center justify-between sticky top-0 z-10 shadow-2xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", stageConfig.dot)} />
                    <h3 className="text-xs font-bold text-black uppercase tracking-wider">
                      {stageConfig.label}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-neutral-800">
                      {formatCurrency(stageTotal)}
                    </span>
                    <span className="bg-neutral-100 text-black text-[10px] font-bold px-2 py-0.5 rounded border border-neutral-200">
                      {stageDeals.length}
                    </span>
                  </div>
                </div>

                {/* Deal Cards Container */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {stageDeals.map((opp) => {
                    const isBeingDragged = draggedDealId === opp.id;

                    return (
                      <div
                        key={opp.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", opp.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggedDealId(opp.id);
                        }}
                        onDragEnd={() => {
                          setDraggedDealId(null);
                          setDragOverStage(null);
                        }}
                        className={cn(
                          "bg-white/95 backdrop-blur-md rounded-xl p-3.5 border border-black/[0.06] shadow-2xs hover:border-black/30 hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing group relative space-y-2.5 select-none",
                          isBeingDragged &&
                            "opacity-35 scale-95 border-dashed border-black/40 rotate-1 shadow-lg"
                        )}
                      >
                        {/* Card Header: Value & Stage Badge */}
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-mono font-bold text-black bg-neutral-100/90 border border-neutral-200 px-2 py-0.5 rounded-lg">
                            {formatCurrency(Number(opp.estimated_value) || 0)}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                              stageConfig.bg,
                              stageConfig.text,
                              stageConfig.border
                            )}
                          >
                            {opp.probability || 0}% Prob
                          </span>
                        </div>

                        {/* Title & Company */}
                        <div>
                          <h4 className="text-xs font-bold text-black group-hover:underline line-clamp-2">
                            {opp.title}
                          </h4>
                          {opp.companies?.company_name && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                opp.company_id && openLead(opp.company_id);
                              }}
                              className="text-[11px] text-[#0f343c] font-semibold hover:underline mt-0.5 flex items-center gap-1 cursor-pointer truncate text-left"
                            >
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{opp.companies.company_name}</span>
                              <ChevronRight className="h-3 w-3 shrink-0" />
                            </button>
                          )}
                        </div>

                        {/* Card Footer: Quick Actions */}
                        <div className="flex items-center justify-between text-[10px] pt-2 border-t border-neutral-100 font-mono">
                          <span className="text-neutral-400">
                            {opp.created_at
                              ? new Date(opp.created_at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })
                              : "Recent"}
                          </span>
                          <div className="flex items-center gap-1">
                            {stageKey !== "won" && (
                              <button
                                onClick={() => handleStageChange(opp.id, "won")}
                                title="Mark as Won"
                                className="p-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {stageKey !== "lost" && (
                              <button
                                onClick={() => handleStageChange(opp.id, "lost")}
                                title="Mark as Lost"
                                className="p-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(opp.id)}
                              title="Delete Deal"
                              className="p-1 rounded text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Drop Placeholder */}
                  {isDragOver &&
                    draggedDealId &&
                    !stageDeals.some((o) => o.id === draggedDealId) && (
                      <div className="h-16 rounded-xl border-2 border-dashed border-brand-teal/40 bg-teal-500/10 flex items-center justify-center text-[11px] font-mono font-bold text-brand-teal animate-pulse">
                        Drop to move to {stageConfig.label}
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── TABLE VIEW WITH PAGINATION ──────────────────────────────── */
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-black/[0.06] shadow-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="border-b border-black/[0.05] bg-[#f5f5f7]/80 text-[10px] font-mono font-medium text-[#6b7280] uppercase tracking-wider">
                  <th className="py-3 px-4">Deal Title</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Value</th>
                  <th className="py-3 px-4 text-right">Probability</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs font-medium">
                {paginatedOpportunities.map((opp) => (
                  <tr
                    key={opp.id}
                    className="hover:bg-neutral-50/80 transition-colors duration-150"
                  >
                    <td className="py-3.5 px-4 font-bold text-black">{opp.title}</td>
                    <td className="py-3.5 px-4 text-neutral-600">
                      <button
                        onClick={() => opp.company_id && openLead(opp.company_id)}
                        className="font-semibold text-[#0f343c] hover:underline cursor-pointer text-left flex items-center gap-1"
                      >
                        <Building2 className="h-3 w-3" />
                        <span>{opp.companies?.company_name || "Unknown Company"}</span>
                        <span>→</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={opp.stage}
                        onChange={(e) => handleStageChange(opp.id, e.target.value)}
                        className={cn(
                          "text-xs font-medium rounded-lg px-2.5 py-1 border transition-all cursor-pointer font-mono",
                          STAGE_CONFIGS[opp.stage]?.bg || "bg-neutral-100",
                          STAGE_CONFIGS[opp.stage]?.text || "text-neutral-800",
                          STAGE_CONFIGS[opp.stage]?.border || "border-neutral-200"
                        )}
                      >
                        {Object.entries(OPPORTUNITY_STAGES).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-black">
                      {formatCurrency(Number(opp.estimated_value) || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-neutral-500">
                      {opp.probability || 0}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 font-mono text-xs">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-emerald-600 hover:text-emerald-700 h-7 px-2"
                          onClick={() => handleStageChange(opp.id, "won")}
                        >
                          Won
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-500 hover:text-rose-700 h-7 px-2"
                          onClick={() => handleStageChange(opp.id, "lost")}
                        >
                          Lost
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-neutral-400 hover:text-rose-600 h-7 w-7 p-0"
                          onClick={() => handleDelete(opp.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* New Opportunity Modal */}
      <Dialog open={newDialogOpen} onClose={() => setNewDialogOpen(false)}>
        <DialogContent className="max-w-lg bg-white/95 backdrop-blur-xl border border-black/[0.08] shadow-glass rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display font-light text-xl">
              New Opportunity
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 font-sans text-xs">
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Company *
              </label>
              <Select
                options={companies.map((c) => ({
                  value: c.id,
                  label: c.company_name,
                }))}
                value={newForm.company_id}
                onChange={(e) =>
                  setNewForm({ ...newForm, company_id: e.target.value })
                }
                placeholder="Select company"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Deal Title *
              </label>
              <Input
                placeholder="e.g. Enterprise AI Consulting Agreement"
                value={newForm.title}
                onChange={(e) =>
                  setNewForm({ ...newForm, title: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                  Value (OMR) *
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 15000"
                  value={newForm.estimated_value}
                  onChange={(e) =>
                    setNewForm({ ...newForm, estimated_value: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                  Initial Stage
                </label>
                <Select
                  options={Object.entries(OPPORTUNITY_STAGES).map(([k, v]) => ({
                    value: k,
                    label: v.label,
                  }))}
                  value={newForm.stage}
                  onChange={(e) =>
                    setNewForm({ ...newForm, stage: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-neutral-700 mb-1 block">
                Description
              </label>
              <Textarea
                placeholder="Opportunity details and notes..."
                value={newForm.description}
                onChange={(e) =>
                  setNewForm({ ...newForm, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setNewDialogOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              className="bg-[#0f343c] hover:bg-[#091f24] text-white rounded-xl text-xs font-mono font-bold"
              onClick={handleCreate}
            >
              Create Deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
