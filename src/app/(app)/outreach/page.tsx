"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus, X, ChevronDown, ChevronUp, Phone, MessageCircle,
  Loader2, Trash2, CheckCircle2, RefreshCw, Moon, Send,
  Check, AlertTriangle, Mail, BookOpen, Globe,
  Upload, FileSpreadsheet, Table, Settings2, FileUp, FileText,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatWhatsAppNumber, getCleanDisplayNotes, getCleanObservation, getCleanDraftMessage } from "@/lib/utils";
import {
  logOutreach, updateOutreachStatus, updateOutreachEntry, getAllLeadsForPipeline, deleteOutreachLog, bulkLogOutreach, importCSVOutreach, markChannelTouchSent, markLeadFollowedUp, type MappedCSVRow
} from "@/lib/actions/ig-dm";
import { getCompanies } from "@/lib/actions/companies";
import {
  CHANNEL_CONFIG, STATUS_CONFIG, STAGE_CONFIG, SECTOR_CONFIG, TEMPLATE_LABELS,
  type OutreachChannel, type OutreachStatus, type OutreachStage, type SectorCategory, type OutreachTemplate, type OutreachLead,
} from "@/lib/types/outreach";
import { ColdCallScriptModal } from "@/components/outreach/cold-call-script-modal";
import { DMEmailTemplateModal } from "@/components/outreach/dm-email-template-modal";
import { PowerHourModal } from "@/components/outreach/power-hour-modal";
import { EmailComposerModal } from "@/components/outreach/email-composer-modal";
import { CsvImport } from "@/components/ui/csv-import";
import { Pagination } from "@/components/ui/pagination";
import { bulkImportCompanies } from "@/lib/actions/import";
import { PLAYBOOK_TEMPLATES } from "@/lib/outreach-messages-library";
import { useUnifiedLead } from "@/context/unified-lead-context";

// ─── Channel Icon Renderer ────────────────────────────────────────────────────
function ChannelIcon({ channel, size = 14 }: { channel: OutreachChannel; size?: number }) {
  const cls = `h-[${size}px] w-[${size}px]`;
  const icons: Record<OutreachChannel, React.ReactNode> = {
    instagram_dm: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={cn("h-4 w-4")} style={{width: size, height: size}}><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>,
    linkedin:     <svg viewBox="0 0 24 24" fill="currentColor" style={{width: size, height: size}}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    whatsapp:     <svg viewBox="0 0 24 24" fill="currentColor" style={{width: size, height: size}}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.374 0 0 5.373 0 12c0 2.127.558 4.18 1.613 5.978L.058 23.695a.75.75 0 00.96.93l5.87-1.924C8.52 23.591 10.228 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-1.794 0-3.54-.484-5.064-1.397l-.36-.215-3.744 1.227 1.255-3.635-.237-.375A9.712 9.712 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>,
    cold_call:    <Phone style={{width: size, height: size}} />,
    referral:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width: size, height: size}}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    email:        <Mail style={{width: size, height: size}} />,
    event:        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width: size, height: size}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    walk_in:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} style={{width: size, height: size}}><circle cx="12" cy="5" r="2"/><path d="M8 21l1-9 3 3 3-3 1 9M12 9l-3 4h6l-3-4z"/></svg>,
  };
  return <>{icons[channel]}</>;
}

// ─── Helper function for elapsed days ─────────────────────────────────────────
function getDaysElapsed(dateStr: string): number {
  if (!dateStr) return 0;
  const sentDate = new Date(dateStr).getTime();
  if (isNaN(sentDate)) return 0;
  const diffTime = Math.max(0, Date.now() - sentDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// ─── Status chip styles ───────────────────────────────────────────────────────
const STATUS_CHIP: Record<OutreachStatus, string> = {
  gate_opener_staged: "bg-slate-200 text-slate-900 border-slate-400 font-bold",
  gate_opener_sent:   "bg-blue-100 text-blue-950 border-blue-400 font-bold",
  warm_up:            "bg-indigo-100 text-indigo-950 border-indigo-400 font-bold",
  opening_identified: "bg-amber-100 text-amber-950 border-amber-400 font-bold",
  coffee_invited:     "bg-orange-100 text-orange-950 border-orange-400 font-bold",
  meeting_booked:     "bg-emerald-100 text-emerald-950 border-emerald-500 font-bold",
  follow_up_sent:     "bg-teal-100 text-teal-950 border-teal-400 font-bold",
  proposal_requested: "bg-purple-100 text-purple-950 border-purple-400 font-bold",
  not_now_snoozed:    "bg-gray-200 text-gray-800 border-gray-400 font-bold",
  agency_existing:    "bg-cyan-100 text-cyan-950 border-cyan-400 font-bold",
  sent:               "bg-blue-100 text-blue-950 border-blue-400 font-bold",
  no_reply:           "bg-rose-100 text-rose-950 border-rose-300 font-bold",
  reply_received:     "bg-indigo-100 text-indigo-950 border-indigo-400 font-bold",
  replied_interested: "bg-emerald-100 text-emerald-950 border-emerald-500 font-bold",
  replied_objection:  "bg-amber-100 text-amber-950 border-amber-400 font-bold",
  ready_for_call:     "bg-teal-100 text-teal-950 border-teal-500 font-bold",
  called:             "bg-violet-100 text-violet-950 border-violet-400 font-bold",
};

const STATUSES: OutreachStatus[] = [
  "gate_opener_staged",
  "gate_opener_sent",
  "warm_up",
  "opening_identified",
  "coffee_invited",
  "meeting_booked",
  "follow_up_sent",
  "proposal_requested",
  "not_now_snoozed",
  "agency_existing",
  "sent",
  "no_reply",
  "reply_received",
  "replied_interested",
  "replied_objection",
  "ready_for_call",
  "called"
];

const CHANNELS: OutreachChannel[] = [
  "instagram_dm","whatsapp","linkedin","cold_call","email","referral","event","walk_in"
];

const SECTORS: SectorCategory[] = [
  "aesthetic_clinics", "dental_clinics", "social_commerce_dtc", "training_education", "hospitality_fnb", "general"
];

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OutreachPipelinePage() {
  const [leads, setLeads] = useState<OutreachLead[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<OutreachChannel | "all">("all");
  const [sectorFilter, setSectorFilter] = useState<SectorCategory | "all">("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { openLead } = useUnifiedLead();
  const [viewMode, setViewMode] = useState<"all" | "followups" | "calls" | "kanban">("all");
  const [logOpen, setLogOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "followups" || tab === "follow-ups") setViewMode("followups");
      else if (tab === "calls" || tab === "call") setViewMode("calls");
      else if (tab === "kanban") setViewMode("kanban");
    }
  }, []);

  // Power-Hour Focus State
  const [powerHourOpen, setPowerHourOpen] = useState(false);
  const [powerHourChannel, setPowerHourChannel] = useState<OutreachChannel>("instagram_dm");
  const [powerHourLeads, setPowerHourLeads] = useState<OutreachLead[]>([]);
  const [isFreshImportOpen, setIsFreshImportOpen] = useState(false);

  // Pagination State for Table View
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Kanban Drag & Drop State
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const fetchLeads = useCallback(async (isSilent = false) => {
    if (!isSilent) setInitialLoading(true);
    const result = await getAllLeadsForPipeline(
      dateFilter,
      channelFilter === "all" ? undefined : channelFilter
    );
    if (result.error && (result.error.includes("Unauthorized") || result.error.includes("session"))) {
      window.location.href = "/login";
      return;
    }
    setLeads((result.data as OutreachLead[]) || []);
    setInitialLoading(false);
  }, [dateFilter, channelFilter]);

  useEffect(() => { fetchLeads(false); }, [fetchLeads]);

  const handleSilentUpdate = useCallback(() => {
    fetchLeads(true);
  }, [fetchLeads]);

  useEffect(() => {
    const handleLeadUpdated = () => {
      fetchLeads(true);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("lead-updated", handleLeadUpdated);
      return () => window.removeEventListener("lead-updated", handleLeadUpdated);
    }
  }, [fetchLeads]);

  // Filtered Leads by Search Query, Sector, and Stage
  const filteredLeads = leads.filter(l => {
    if (sectorFilter !== "all" && l.sector !== sectorFilter) return false;
    if (stageFilter !== "all" && l.stage !== stageFilter && l.status !== stageFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = l.company_name.toLowerCase().includes(q);
      const matchesContact = (l.contact_name || "").toLowerCase().includes(q);
      const matchesHandle = (l.handle || "").toLowerCase().includes(q);
      const matchesPhone = (l.phone || "").toLowerCase().includes(q);
      const matchesIndustry = (l.industry || "").toLowerCase().includes(q);
      const matchesNotes = (l.notes || "").toLowerCase().includes(q);
      const matchesLi = (l.linkedin_url || "").toLowerCase().includes(q);
      if (!matchesName && !matchesContact && !matchesHandle && !matchesPhone && !matchesIndustry && !matchesNotes && !matchesLi) return false;
    }
    return true;
  });

  // Priority sort: Contacted / In Outreach leads first so active relationships appear on Page 1
  const sortedFilteredLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      const aTouched = a.status !== "gate_opener_staged" ? 1 : 0;
      const bTouched = b.status !== "gate_opener_staged" ? 1 : 0;
      if (aTouched !== bTouched) return bTouched - aTouched;
      const aTime = a.sent_at ? new Date(a.sent_at).getTime() : 0;
      const bTime = b.sent_at ? new Date(b.sent_at).getTime() : 0;
      return bTime - aTime;
    });
  }, [filteredLeads]);

  // Reset pagination on filter or viewMode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, channelFilter, sectorFilter, stageFilter, searchQuery, viewMode]);

  // Metrics & Compiled Lists
  const total             = leads.length;
  const replyReceivedList = filteredLeads.filter(l => l.status === "reply_received" || l.stage === "warm_up");
  // Clean follow-ups list — only show leads with explicitly scheduled / assigned follow-up status
  const followupsDueList  = leads.filter(l => ((l.status as string) === "follow_up_due" || (l as any).needs_followup === true) && !["not_now_snoozed", "lost", "dormant"].includes(l.status as string));
  const interested        = leads.filter(l => l.status === "replied_interested" || l.stage === "opening_identified").length;
  const callReady         = leads.filter(l => l.status === "ready_for_call" || l.stage === "coffee_invited").length;
  const booked            = leads.filter(l => l.status === "meeting_booked" || l.stage === "meeting_booked").length;

  const callList          = filteredLeads.filter(l => l.status === "ready_for_call" || l.stage === "coffee_invited");
  const pipeList          = filteredLeads.filter(l => l.status === "sent" || l.status === "no_reply" || l.status === "replied_interested" || l.status === "replied_objection");
  const doneList          = filteredLeads.filter(l => l.status === "called" || l.status === "meeting_booked");

  // Active Leads for Current Compiled Tab
  const activeLeadsList = useMemo(() => {
    if (viewMode === "followups") {
      return followupsDueList.filter(l => {
        if (sectorFilter !== "all" && l.sector !== sectorFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return l.company_name.toLowerCase().includes(q) || (l.handle || "").toLowerCase().includes(q);
        }
        return true;
      });
    }
    if (viewMode === "calls") {
      return callList.filter(l => {
        if (sectorFilter !== "all" && l.sector !== sectorFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          return l.company_name.toLowerCase().includes(q) || (l.handle || "").toLowerCase().includes(q);
        }
        return true;
      });
    }
    return sortedFilteredLeads;
  }, [viewMode, followupsDueList, callList, sortedFilteredLeads, sectorFilter, searchQuery]);

  const totalItems = activeLeadsList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedLeads = useMemo(() => {
    if (pageSize >= 999999) return activeLeadsList;
    const start = (currentPage - 1) * pageSize;
    return activeLeadsList.slice(start, start + pageSize);
  }, [activeLeadsList, currentPage, pageSize]);

  const handleMarkFollowedUp = async (lead: OutreachLead) => {
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: "follow_up_sent", sent_at: new Date().toISOString() } : l));
    try {
      await markLeadFollowedUp(lead.id, lead.company_id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lead-updated", {
          detail: { companyId: lead.company_id || lead.id, status: "follow_up_sent" }
        }));
      }
      handleSilentUpdate();
    } catch (err) {
      console.error("Failed to mark follow-up:", err);
      fetchLeads(true);
    }
  };

  const handleDropToColumn = async (leadId: string, targetCol: "call_tonight" | "reply_received" | "pipeline" | "done") => {
    let targetStatus: OutreachStatus = "sent";
    if (targetCol === "call_tonight") targetStatus = "ready_for_call";
    else if (targetCol === "reply_received") targetStatus = "reply_received";
    else if (targetCol === "pipeline") targetStatus = "sent";
    else if (targetCol === "done") targetStatus = "called";

    const targetLead = leads.find(l => l.id === leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: targetStatus } : l));
    try {
      await updateOutreachStatus(leadId, { status: targetStatus });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lead-updated", {
          detail: { companyId: targetLead?.company_id || leadId, status: targetStatus }
        }));
      }
      handleSilentUpdate();
    } catch (err) {
      console.error("Failed to update status on drop:", err);
      fetchLeads(true);
    }
  };

  const handleLaunchPowerHour = () => {
    const ch = channelFilter === "all" ? "instagram_dm" : channelFilter;
    const batch = filteredLeads.filter(l => l.channel === ch || channelFilter === "all").slice(0, 25);
    setPowerHourLeads(batch.length > 0 ? batch : filteredLeads.slice(0, 25));
    setPowerHourChannel(ch);
    setPowerHourOpen(true);
  };

  return (
    <div className="space-y-4 page-enter pb-24 max-w-[1850px] w-full mx-auto font-sans">

      {/* ── Unified Minimal Top Header ────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-4 space-y-3.5 shadow-2xs">
        {/* Row 1: Title + View Switcher + Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Send className="h-5 w-5 text-teal-600" />
              <span>Outreach Pipeline (Oman Operating System)</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5 font-medium">
              Zero-pitch human conversation arcs, relationship-first gate-openers & multi-channel execution.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Compiled Outreach View Switcher */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold border border-slate-200/60 flex-wrap gap-1">
              <button
                onClick={() => { setViewMode("all"); setCurrentPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                  viewMode === "all" ? "bg-white text-slate-900 shadow-2xs font-extrabold" : "text-slate-500 hover:text-slate-900"
                )}
              >
                All Outreach ({total})
              </button>
              <button
                onClick={() => { setViewMode("followups"); setCurrentPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                  viewMode === "followups" ? "bg-white text-amber-900 shadow-2xs font-extrabold ring-1 ring-amber-300" : "text-slate-500 hover:text-slate-900"
                )}
              >
                Due Follow-ups ({followupsDueList.length})
              </button>
              <button
                onClick={() => { setViewMode("calls"); setCurrentPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                  viewMode === "calls" ? "bg-white text-teal-900 shadow-2xs font-extrabold ring-1 ring-teal-300" : "text-slate-500 hover:text-slate-900"
                )}
              >
                Call Queue ({callList.length})
              </button>
              <button
                onClick={() => { setViewMode("kanban"); setCurrentPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                  viewMode === "kanban" ? "bg-white text-slate-900 shadow-2xs font-extrabold" : "text-slate-500 hover:text-slate-900"
                )}
              >
                7-Stage Kanban
              </button>
            </div>

            <Button
              onClick={handleLaunchPowerHour}
              className="bg-teal-600 hover:bg-teal-700 text-white font-black h-9 px-3.5 rounded-xl text-xs cursor-pointer shadow-md flex items-center gap-1.5"
            >
              25-Lead Power-Hour
            </Button>

            <Button
              onClick={() => setIsFreshImportOpen(true)}
              variant="outline"
              className="h-9 px-3.5 rounded-xl text-xs font-bold border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Upload className="h-3.5 w-3.5 text-teal-600" /> Import Fresh Leads (CSV)
            </Button>

            <Button
              onClick={() => setLogOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-9 px-3.5 rounded-xl text-xs cursor-pointer shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Log Past Outreach
            </Button>
          </div>
        </div>

        {/* Row 2: Instant Search Bar + Metrics Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Instant Search Bar */}
          <div className="relative w-full sm:max-w-md">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search prospect name, @handle, phone, industry..."
              className="h-8 text-xs bg-slate-50 border-slate-200 rounded-xl pr-8 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Metrics Summary Strip */}
          <div className="flex items-center gap-3.5 flex-wrap">
            <div className="flex items-center gap-1 font-bold">
              <span className="text-slate-400 font-medium">Total:</span>
              <span className="text-slate-900 font-extrabold">{total}</span>
            </div>
            {followupsDueList.length > 0 && (
              <div className="flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                <span>Follow-ups (Day 3+):</span>
                <span className="font-extrabold">{followupsDueList.length}</span>
              </div>
            )}
            <div className="flex items-center gap-1 font-bold">
              <span className="text-slate-400 font-medium">Stage 2 Warm-Up:</span>
              <span className="text-indigo-700 font-extrabold">{replyReceivedList.length}</span>
            </div>
            <div className="flex items-center gap-1 font-bold">
              <span className="text-slate-400 font-medium">Stage 4 Coffee:</span>
              <span className="text-teal-700 font-extrabold">{callReady}</span>
            </div>
            <div className="flex items-center gap-1 font-bold">
              <span className="text-slate-400 font-medium">Stage 5 Meeting:</span>
              <span className="text-pink-700 font-extrabold">{booked}</span>
            </div>
          </div>
        </div>

        {/* Row 3: Sector Categories Filter Strip */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Sector:</span>
          <button
            onClick={() => setSectorFilter("all")}
            className={cn(
              "px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer",
              sectorFilter === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            )}
          >
            All Sectors
          </button>
          {SECTORS.map(sec => {
            const cfg = SECTOR_CONFIG[sec];
            if (!cfg) return null;
            return (
              <button
                key={sec}
                onClick={() => setSectorFilter(sec)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer",
                  sectorFilter === sec
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-white"
                )}
              >
                <span>{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </button>
            );
          })}
        </div>

        {/* Row 4: Channel & Period Filter Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex gap-1 flex-wrap items-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Channel:</span>
            <button
              onClick={() => setChannelFilter("all")}
              className={cn("px-2.5 py-0.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer", channelFilter === "all" ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300")}
            >
              All
            </button>
            {CHANNELS.map(ch => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer",
                  channelFilter === ch
                    ? `bg-slate-900 text-white border-slate-900`
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-white"
                )}
              >
                <ChannelIcon channel={ch} size={11} />
                {CHANNEL_CONFIG[ch].label}
              </button>
            ))}
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="flex bg-slate-100 rounded-xl p-0.5 text-[11px] font-bold">
              {(["today","week","all"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setDateFilter(f)}
                  className={cn("px-2.5 py-0.5 rounded-lg transition-all cursor-pointer", dateFilter === f ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800")}
                >
                  {f === "today" ? "Today" : f === "week" ? "This Week" : "All"}
                </button>
              ))}
            </div>
            <button onClick={() => fetchLeads(false)} className="p-1 rounded-lg bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {initialLoading ? (
        <div className="flex items-center justify-center py-24 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
        </div>
      ) : viewMode !== "kanban" ? (
        /* ── HIGH-DENSITY COMPACT CONTACT TABLE VIEW (NO BORING SCROLLING!) ── */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden font-sans">
          <div className="p-3 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
            <span className="font-extrabold text-slate-700">
              {viewMode === "followups"
                ? `Showing ${activeLeadsList.length} leads due for follow-up (2-3+ days with no reply)`
                : viewMode === "calls"
                ? `Showing ${activeLeadsList.length} leads in Call Queue`
                : `Showing ${activeLeadsList.length} contacts ${searchQuery && `matching "${searchQuery}"`}`}
            </span>
            <span className="text-slate-400 text-[11px]">Click status dropdown to update directly inline</span>
          </div>

          {activeLeadsList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">
              <p className="text-sm font-bold text-slate-600">
                {viewMode === "followups"
                  ? "No follow-ups due right now! All reached-out prospects are up to date."
                  : viewMode === "calls"
                  ? "No calls queued right now. Mark leads Ready for Call or drag them in Kanban."
                  : "No contacts match your search or filters."}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Try clearing search or changing tabs.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-200/90 border-b border-slate-300 text-slate-900 font-black text-[11px] tracking-wide">
                    <tr>
                      <th className="p-3">Company / Business</th>
                      <th className="p-3">Channel & Handle</th>
                      <th className="p-3">Pipeline Status</th>
                      <th className="p-3">Outreach Date</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-900">
                    {paginatedLeads.map(lead => {
                      const daysAgo = getDaysElapsed(lead.sent_at);
                      const phone = lead.phone || (lead.channel === "cold_call" || lead.channel === "whatsapp" ? lead.handle : null);
                      const waDigits = phone ? formatWhatsAppNumber(phone) : "";
                      const waUrl = waDigits ? `https://wa.me/${waDigits}` : null;
                      const cleanH = (lead.handle || "").trim();

                      return (
                        <tr key={lead.id} className="hover:bg-slate-100/70 transition-colors group">
                          {/* Company & Industry */}
                          <td className="p-3">
                            <button
                              onClick={() => openLead(lead.company_id || lead.id)}
                              className="font-black text-slate-950 text-xs block truncate max-w-[220px] hover:text-teal-700 hover:underline cursor-pointer text-left"
                            >
                              {lead.company_name}
                            </button>
                            <span className="text-[10px] text-slate-600 font-medium block truncate max-w-[220px]">
                              {lead.industry || lead.sector || "General"}
                            </span>
                          </td>

                          {/* Channel & Handle */}
                          <td className="p-3">
                            <div className="flex items-center gap-1.5">
                              <span className="p-1 rounded bg-slate-200 text-slate-800">
                                <ChannelIcon channel={lead.channel} size={13} />
                              </span>
                              <span className="font-mono text-[11px] text-slate-800 font-bold truncate max-w-[140px]">
                                {cleanH || "—"}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="p-3">
                            <select
                              value={lead.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value as OutreachStatus;
                                setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: newStatus } : l));
                                await updateOutreachStatus(lead.id, { status: newStatus });
                                if (typeof window !== "undefined") {
                                  window.dispatchEvent(new CustomEvent("lead-updated", {
                                    detail: { companyId: lead.company_id || lead.id, status: newStatus }
                                  }));
                                }
                                handleSilentUpdate();
                              }}
                              className={cn("text-[10px] font-black rounded-lg px-2.5 py-1 border-2 cursor-pointer font-mono shadow-2xs", STATUS_CHIP[lead.status])}
                            >
                              {STATUSES.map(s => (
                                <option key={s} value={s} className="bg-white text-slate-900 font-bold">
                                  {STATUS_CONFIG[s].label}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Outreach Date */}
                          <td className="p-3 text-slate-700 font-mono font-bold text-[11px]">
                            {daysAgo === 0 ? (
                              <span className="text-teal-800 font-extrabold bg-teal-100 px-2 py-0.5 rounded-md border border-teal-300">Today</span>
                            ) : (
                              <span>{daysAgo}d ago</span>
                            )}
                          </td>

                          {/* Actions Row */}
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center gap-1 justify-end">
                              {(viewMode === "followups" || ((lead.status === "sent" || lead.status === "no_reply" || lead.status === "gate_opener_sent") && daysAgo >= 2)) && (
                                <button
                                  onClick={() => handleMarkFollowedUp(lead)}
                                  className="px-2.5 py-1 rounded-md bg-amber-600 text-white text-[10px] font-extrabold hover:bg-amber-700 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Mark follow-up sent / touch completed today"
                                >
                                  <CheckCircle2 className="h-3 w-3" /> Mark Followed Up
                                </button>
                              )}
                              {waUrl && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-extrabold hover:bg-emerald-200 transition-colors"
                                  title="WhatsApp"
                                >
                                  WA
                                </a>
                              )}
                              {phone && (
                                <a
                                  href={`tel:${phone}`}
                                  className="px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-extrabold hover:bg-slate-800 transition-colors"
                                  title="Call"
                                >
                                  Call
                                </a>
                              )}
                              <button
                                onClick={() => openLead(lead.company_id || lead.id)}
                                className="px-2.5 py-1 rounded-md bg-teal-600 text-white text-[10px] font-extrabold hover:bg-teal-700 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              >
                                Open Lead Workspace
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Table View Pagination */}
              <div className="p-3 bg-white/60 border-t border-slate-100">
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
            </>
          )}
        </div>
      ) : (
        /* ── KANBAN BOARD VIEW (WITH SMOOTH DRAG & DROP) ─────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">

          {/* ── Col 1: Call Tonight ─────────────────────────────────────────── */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOverColumn !== "call_tonight") setDragOverColumn("call_tonight");
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              if (dragOverColumn === "call_tonight") setDragOverColumn(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverColumn(null);
              const id = e.dataTransfer.getData("text/plain") || draggedLeadId;
              if (id) handleDropToColumn(id, "call_tonight");
            }}
            className={cn(
              "space-y-2.5 p-2 rounded-2xl transition-all duration-200",
              dragOverColumn === "call_tonight" && "ring-2 ring-teal-500/50 bg-teal-50/50 scale-[1.01]"
            )}
          >
            <ColumnHeader title="Call Tonight" subtitle="Warm leads" count={callList.length} color="teal" />
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {callList.length === 0 ? (
                <EmptyCol icon={<Phone className="h-6 w-6 text-slate-300" />} text="No warm leads queued" sub="Drag cards or mark Ready for Call" />
              ) : callList.map(lead => (
                <div
                  key={lead.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", lead.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggedLeadId(lead.id);
                  }}
                  onDragEnd={() => {
                    setDraggedLeadId(null);
                    setDragOverColumn(null);
                  }}
                  className={cn(
                    "cursor-grab active:cursor-grabbing transition-all duration-150 select-none",
                    draggedLeadId === lead.id && "opacity-35 scale-95 rotate-1"
                  )}
                >
                  <CallReadyCard lead={lead} expanded={activeCard === lead.id} onToggle={() => setActiveCard(activeCard === lead.id ? null : lead.id)} onUpdate={handleSilentUpdate} />
                </div>
              ))}

              {dragOverColumn === "call_tonight" && draggedLeadId && (
                <div className="h-16 rounded-xl border-2 border-dashed border-teal-500/40 bg-teal-500/10 flex items-center justify-center text-[11px] font-mono font-bold text-teal-700 animate-pulse">
                  Drop to move to Call Tonight
                </div>
              )}
            </div>
          </div>

          {/* ── Col 2: Reply Received ────────────────────────────────────────── */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOverColumn !== "reply_received") setDragOverColumn("reply_received");
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              if (dragOverColumn === "reply_received") setDragOverColumn(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverColumn(null);
              const id = e.dataTransfer.getData("text/plain") || draggedLeadId;
              if (id) handleDropToColumn(id, "reply_received");
            }}
            className={cn(
              "space-y-2.5 p-2 rounded-2xl transition-all duration-200",
              dragOverColumn === "reply_received" && "ring-2 ring-indigo-500/50 bg-indigo-50/50 scale-[1.01]"
            )}
          >
            <ColumnHeader title="Reply Received" subtitle="Needs review" count={replyReceivedList.length} color="indigo" />
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {replyReceivedList.length === 0 ? (
                <EmptyCol icon={<Mail className="h-6 w-6 text-slate-300" />} text="No replies received yet" sub="Prospect replies appear here" />
              ) : replyReceivedList.map(lead => (
                <div
                  key={lead.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", lead.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggedLeadId(lead.id);
                  }}
                  onDragEnd={() => {
                    setDraggedLeadId(null);
                    setDragOverColumn(null);
                  }}
                  className={cn(
                    "cursor-grab active:cursor-grabbing transition-all duration-150 select-none",
                    draggedLeadId === lead.id && "opacity-35 scale-95 rotate-1"
                  )}
                >
                  <OutreachCard lead={lead} expanded={activeCard === lead.id} onToggle={() => setActiveCard(activeCard === lead.id ? null : lead.id)} onUpdate={handleSilentUpdate} />
                </div>
              ))}

              {dragOverColumn === "reply_received" && draggedLeadId && (
                <div className="h-16 rounded-xl border-2 border-dashed border-indigo-500/40 bg-indigo-500/10 flex items-center justify-center text-[11px] font-mono font-bold text-indigo-700 animate-pulse">
                  Drop to move to Reply Received
                </div>
              )}
            </div>
          </div>

          {/* ── Col 3: Active Pipeline ──────────────────────────────────────── */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOverColumn !== "pipeline") setDragOverColumn("pipeline");
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              if (dragOverColumn === "pipeline") setDragOverColumn(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverColumn(null);
              const id = e.dataTransfer.getData("text/plain") || draggedLeadId;
              if (id) handleDropToColumn(id, "pipeline");
            }}
            className={cn(
              "space-y-2.5 p-2 rounded-2xl transition-all duration-200",
              dragOverColumn === "pipeline" && "ring-2 ring-slate-500/50 bg-slate-50/50 scale-[1.01]"
            )}
          >
            <ColumnHeader title="Active Pipeline" subtitle="In progress" count={pipeList.length} color="slate" />
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {pipeList.length === 0 ? (
                <EmptyCol icon={<Send className="h-6 w-6 text-slate-300" />} text="Nothing active" sub='Log Outreach to start' />
              ) : pipeList.map(lead => (
                <div
                  key={lead.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", lead.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggedLeadId(lead.id);
                  }}
                  onDragEnd={() => {
                    setDraggedLeadId(null);
                    setDragOverColumn(null);
                  }}
                  className={cn(
                    "cursor-grab active:cursor-grabbing transition-all duration-150 select-none",
                    draggedLeadId === lead.id && "opacity-35 scale-95 rotate-1"
                  )}
                >
                  <OutreachCard lead={lead} expanded={activeCard === lead.id} onToggle={() => setActiveCard(activeCard === lead.id ? null : lead.id)} onUpdate={handleSilentUpdate} />
                </div>
              ))}

              {dragOverColumn === "pipeline" && draggedLeadId && (
                <div className="h-16 rounded-xl border-2 border-dashed border-slate-500/40 bg-slate-500/10 flex items-center justify-center text-[11px] font-mono font-bold text-slate-700 animate-pulse">
                  Drop to move to Active Pipeline
                </div>
              )}
            </div>
          </div>

          {/* ── Col 4: Done ─────────────────────────────────────────────────── */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dragOverColumn !== "done") setDragOverColumn("done");
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              if (dragOverColumn === "done") setDragOverColumn(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverColumn(null);
              const id = e.dataTransfer.getData("text/plain") || draggedLeadId;
              if (id) handleDropToColumn(id, "done");
            }}
            className={cn(
              "space-y-2.5 p-2 rounded-2xl transition-all duration-200",
              dragOverColumn === "done" && "ring-2 ring-violet-500/50 bg-violet-50/50 scale-[1.01]"
            )}
          >
            <ColumnHeader title="Done" subtitle="Completed" count={doneList.length} color="violet" />
            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {doneList.length === 0 ? (
                <EmptyCol icon={<CheckCircle2 className="h-6 w-6 text-slate-300" />} text="No completions" sub="Called leads appear here" />
              ) : doneList.map(lead => (
                <div
                  key={lead.id}
                  draggable={true}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", lead.id);
                    e.dataTransfer.effectAllowed = "move";
                    setDraggedLeadId(lead.id);
                  }}
                  onDragEnd={() => {
                    setDraggedLeadId(null);
                    setDragOverColumn(null);
                  }}
                  className={cn(
                    "cursor-grab active:cursor-grabbing transition-all duration-150 select-none",
                    draggedLeadId === lead.id && "opacity-35 scale-95 rotate-1"
                  )}
                >
                  <OutreachCard lead={lead} expanded={activeCard === lead.id} onToggle={() => setActiveCard(activeCard === lead.id ? null : lead.id)} onUpdate={handleSilentUpdate} compact />
                </div>
              ))}

              {dragOverColumn === "done" && draggedLeadId && (
                <div className="h-16 rounded-xl border-2 border-dashed border-violet-500/40 bg-violet-500/10 flex items-center justify-center text-[11px] font-mono font-bold text-violet-700 animate-pulse">
                  Drop to move to Done
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Dedicated Power-Hour Focus Mode Modal ──────────────────────── */}
      <PowerHourModal
        isOpen={powerHourOpen}
        onClose={() => {
          setPowerHourOpen(false);
          handleSilentUpdate();
        }}
        channel={powerHourChannel}
        leads={powerHourLeads}
        onLeadSent={(sentId) => {
          setPowerHourLeads(prev => prev.filter(l => l.id !== sentId));
          handleSilentUpdate();
        }}
      />

      {/* ── Bulk Fresh Leads Import Modal ───────────────────────────────── */}
      <CsvImport
        open={isFreshImportOpen}
        onClose={() => setIsFreshImportOpen(false)}
        title="Import Fresh Uncontacted Leads (Bulk CSV)"
        onImport={async (data, channel) => {
          await bulkImportCompanies(data, channel);
          setIsFreshImportOpen(false);
          fetchLeads(false);
        }}
      />
    </div>
  );
}

// ─── Column Header ────────────────────────────────────────────────────────────
function ColumnHeader({ title, subtitle, count, color }: { title: string; subtitle: string; count: number; color: string }) {
  const countCls: Record<string, string> = {
    teal: "bg-teal-100 text-teal-950 border-teal-400 font-black",
    indigo: "bg-indigo-100 text-indigo-950 border-indigo-400 font-black",
    slate: "bg-slate-200 text-slate-900 border-slate-400 font-black",
    violet: "bg-violet-100 text-violet-950 border-violet-400 font-black",
  };
  return (
    <div className="flex items-center justify-between mb-0.5">
      <div>
        <p className="text-xs font-black text-slate-950">{title}</p>
        <p className="text-[10px] text-slate-600 font-semibold">{subtitle}</p>
      </div>
      <span className={cn("text-[10px] font-black px-2.5 py-0.5 rounded-full border", countCls[color] || countCls.slate)}>{count}</span>
    </div>
  );
}

// ─── Empty Column ─────────────────────────────────────────────────────────────
function EmptyCol({ icon, text, sub }: { icon: React.ReactNode; text: string; sub: string }) {
  return (
    <div className="bg-slate-100/60 border-2 border-dashed border-slate-300 rounded-xl p-5 text-center">
      <div className="flex justify-center mb-1.5">{icon}</div>
      <p className="text-xs font-black text-slate-700">{text}</p>
      <p className="text-[10px] text-slate-500 font-medium mt-0.5">{sub}</p>
    </div>
  );
}

// ─── Call Ready Card ──────────────────────────────────────────────────────────
function CallReadyCard({ lead, expanded, onToggle, onUpdate }: { lead: OutreachLead; expanded: boolean; onToggle: () => void; onUpdate: () => void }) {
  const [marking, setMarking] = useState(false);
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const markCalled = async () => {
    setMarking(true);
    await updateOutreachStatus(lead.id, { status: "called" });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", {
        detail: { companyId: lead.company_id || lead.id, status: "called" }
      }));
    }
    await onUpdate();
    setMarking(false);
  };
  const markBooked = async () => {
    setMarking(true);
    await updateOutreachStatus(lead.id, { status: "meeting_booked" });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", {
        detail: { companyId: lead.company_id || lead.id, status: "meeting_booked" }
      }));
    }
    await onUpdate();
    setMarking(false);
  };
  const phone = lead.phone || (lead.channel === "cold_call" || lead.channel === "whatsapp" ? lead.handle : null);
  const waDigits = phone ? formatWhatsAppNumber(phone) : "";
  const waUrl = waDigits ? `https://wa.me/${waDigits}` : null;
  const channelLabel = CHANNEL_CONFIG[lead.channel]?.label || "Cold Call";

  return (
    <div className="bg-white border border-slate-300 rounded-xl overflow-hidden hover:border-slate-400 transition-all shadow-2xs">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-100/60 transition-colors cursor-pointer">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-slate-200 border border-slate-300 text-slate-800 flex items-center justify-center shrink-0">
            <ChannelIcon channel={lead.channel} size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-950 truncate">{lead.company_name}</p>
            <p className="text-[10px] text-slate-600 font-medium truncate">{lead.industry || 'General'} · {channelLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-teal-100 text-teal-950 border border-teal-400">Call Ready</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-600" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-600" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-3 space-y-2 bg-slate-50/40">
          {/* Quick Script Trigger Pill Bar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setScriptModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              Call Script
            </button>
            <button
              onClick={() => setTemplateModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Templates
            </button>
          </div>

          {lead.pain_point && (
            <div className="bg-white border border-slate-200/80 rounded-lg p-2 text-xs">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Pain Point</span>
              <span className="text-slate-900 font-medium">{lead.pain_point}</span>
            </div>
          )}
          {lead.prospect_reply && (
            <div className="bg-white border border-slate-200/80 rounded-lg p-2 text-xs">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Their Reply</span>
              <span className="text-slate-700 italic">"{lead.prospect_reply}"</span>
            </div>
          )}
          {lead.call_opening_line && (
            <div className="bg-white border border-slate-200/80 rounded-lg p-2 text-xs">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Opening Line</span>
              <span className="text-slate-900 font-bold leading-snug">"{lead.call_opening_line}"</span>
            </div>
          )}

          <div className="flex gap-1.5 flex-wrap pt-1">
            {phone && <a href={`tel:${phone}`} className="flex items-center gap-1 bg-slate-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg"><Phone className="h-3 w-3" /> Call</a>}
            {waUrl && <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg"><MessageCircle className="h-3 w-3" /> WA</a>}
            <button onClick={markBooked} disabled={marking} className="flex items-center gap-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-900 text-[11px] font-bold px-2.5 py-1.5 rounded-lg ml-auto cursor-pointer">
              {marking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />} Booked
            </button>
            <button onClick={markCalled} disabled={marking} className="flex items-center gap-1 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer">
              {marking ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Called
            </button>
          </div>
        </div>
      )}

      {scriptModalOpen && (
        <ColdCallScriptModal
          ctx={{
            companyName: lead.company_name,
            industry: lead.industry,
            handle: lead.handle,
            painPoint: lead.pain_point,
            prospectReply: lead.prospect_reply,
            openingLine: lead.call_opening_line,
          }}
          onClose={() => setScriptModalOpen(false)}
        />
      )}
      {templateModalOpen && (
        <DMEmailTemplateModal
          ctx={{
            companyName: lead.company_name,
            industry: lead.industry,
            contactName: (lead.handle && !/^[\d\+\-\s\(\)]+$/.test(lead.handle)) ? lead.handle : "Contact",
            channel: lead.channel,
            handle: lead.handle
          }}
          onClose={() => setTemplateModalOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Generic Outreach Card (pipeline + done) ──────────────────────────────────
function OutreachCard({ lead, expanded, onToggle, onUpdate, compact }: { lead: OutreachLead; expanded: boolean; onToggle: () => void; onUpdate: () => void; compact?: boolean }) {
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Editable fields
  const [companyName, setCompanyName] = useState(lead.company_name);
  const [handle, setHandle] = useState(lead.handle || "");
  const [channel, setChannel] = useState<OutreachChannel>(lead.channel);
  const [outreachDate, setOutreachDate] = useState(() => (lead.sent_at ? lead.sent_at.split("T")[0] : new Date().toISOString().split("T")[0]));
  const [status, setStatus] = useState<OutreachStatus>(lead.status);
  const [notes, setNotes] = useState(lead.notes || "");
  const [reply, setReply] = useState(lead.prospect_reply || "");
  const [pain, setPain] = useState(lead.pain_point || "");
  const [opening, setOpening] = useState(lead.call_opening_line || "");

  useEffect(() => {
    setCompanyName(lead.company_name);
    setHandle(lead.handle || "");
    setChannel(lead.channel);
    if (lead.sent_at) setOutreachDate(lead.sent_at.split("T")[0]);
    setStatus(lead.status);
    setNotes(lead.notes || "");
    setReply(lead.prospect_reply || "");
    setPain(lead.pain_point || "");
    setOpening(lead.call_opening_line || "");
  }, [lead]);

  const handleStatusChange = async (newStatus: OutreachStatus) => {
    setStatus(newStatus);
    setSaving(true);
    await updateOutreachEntry(lead.id, {
      status: newStatus,
      company_name: companyName,
      handle,
      channel,
      outreach_date: outreachDate,
      notes,
      prospect_reply: reply,
      pain_point: pain,
      call_opening_line: opening
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", {
        detail: { companyId: lead.company_id || lead.id, status: newStatus }
      }));
    }
    await onUpdate();
    setSaving(false);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    await updateOutreachEntry(lead.id, {
      company_name: companyName,
      handle,
      channel,
      outreach_date: outreachDate,
      status,
      notes,
      prospect_reply: reply,
      pain_point: pain,
      call_opening_line: opening
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", {
        detail: { companyId: lead.company_id || lead.id, status }
      }));
    }
    await onUpdate();
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Remove outreach log entry for "${lead.company_name}"?`)) return;
    setDeleting(true);
    await deleteOutreachLog(lead.id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", {
        detail: { companyId: lead.company_id || lead.id }
      }));
    }
    await onUpdate();
    setDeleting(false);
  };

  const channelLabel = CHANNEL_CONFIG[channel]?.label || "Outreach";
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.sent;
  const chipCls = STATUS_CHIP[status] || "bg-slate-100 text-slate-700 border-slate-200";

  // Strict contact handle detection
  const cleanHandle = (handle || "").trim();
  const isPhone = Boolean(cleanHandle && /^[\d\+\-\s\(\)]+$/.test(cleanHandle));
  const isUrl = Boolean(cleanHandle && (cleanHandle.startsWith('http://') || cleanHandle.startsWith('https://')));
  const isEmail = Boolean(cleanHandle && cleanHandle.includes('@') && cleanHandle.includes('.') && !cleanHandle.startsWith('@'));
  const isIgHandle = Boolean(cleanHandle && !isPhone && !isUrl && !isEmail && (cleanHandle.startsWith('@') || channel === 'instagram_dm'));

  return (
    <div className="bg-white rounded-xl shadow-2xs overflow-hidden border border-slate-200/80 hover:border-slate-300 transition-all font-sans">
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50/70 transition-colors cursor-pointer">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0">
            <ChannelIcon channel={channel} size={14} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-900 truncate">{companyName}</p>
            {!compact && (
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                {lead.industry ? `${lead.industry} • ` : ''}{channelLabel}{handle ? ` • ${handle}` : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-md border", chipCls)}>
            {statusConfig.label}
          </span>
          <div className="p-0.5 text-slate-400">
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && !compact && (
        <div className="border-t border-slate-100 p-3 space-y-2.5 bg-slate-50/40 text-xs">
          {/* Status buttons */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Update Status</span>
              {saving && <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Syncing...</span>}
            </div>
            <div className="flex gap-1 flex-wrap">
              {STATUSES.map(s => (
                <button
                  key={s}
                  type="button"
              onClick={() => handleStatusChange(s)}
                  className={cn(
                    "text-[10px] font-extrabold px-2 py-0.5 rounded-md border transition-all cursor-pointer",
                    status === s
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Form fields matching modal style */}
          {editing ? (
            <div className="space-y-2 pt-2 border-t border-slate-200/60 mt-2">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Edit Log Entry</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Company Name</label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} className="h-7 text-xs bg-white" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Handle / Contact</label>
                  <Input value={handle} onChange={e => setHandle(e.target.value)} className="h-7 text-xs bg-white" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Notes</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="text-xs resize-none bg-white p-2" rows={2} />
              </div>

              <div className="flex justify-end gap-1.5 pt-1">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className="h-7 text-xs">Cancel</Button>
                <Button size="sm" onClick={handleSaveAll} className="h-7 text-xs bg-slate-900 text-white font-bold">Save Changes</Button>
              </div>
            </div>
          ) : (
            <>
              {notes && (
                <div className="bg-white border border-slate-200/80 rounded-lg p-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Notes</span>
                  <span className="text-slate-800 text-xs">{notes}</span>
                </div>
              )}
              {reply && (
                <div className="bg-white border border-slate-200/80 rounded-lg p-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Their Reply</span>
                  <span className="text-slate-700 italic text-xs">"{reply}"</span>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60 flex-wrap">
                <button
                  type="button"
                  onClick={() => setScriptModalOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  Script
                </button>

                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-1 rounded-lg cursor-pointer"
                >
                  Templates
                </button>

                {cleanHandle && (isPhone || channel === 'whatsapp' || channel === 'cold_call') && (
                  <a
                    href={`https://wa.me/${formatWhatsAppNumber(cleanHandle)}${notes ? `?text=${encodeURIComponent(notes)}` : ''}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"
                  >
                    WA
                  </a>
                )}

                {cleanHandle && (isIgHandle || channel === 'instagram_dm') && (
                  <a
                    href={`https://www.instagram.com/${cleanHandle.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^\/+/, '').replace(/\/+$/, '').replace(/^@+/, '')}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-pink-100 hover:bg-pink-200 text-pink-900 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"
                  >
                    IG
                  </a>
                )}

                {/* Direct Email Action with Gmail & Outlook Chooser */}
                {((cleanHandle && cleanHandle.includes('@') && !isIgHandle) || channel === 'email' || lead.email) && (
                  <button
                    type="button"
                    onClick={() => setEmailModalOpen(true)}
                    className="bg-violet-100 hover:bg-violet-200 text-violet-900 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                    title="Send Direct Email (Gmail / Outlook)"
                  >
                    <Mail className="h-3 w-3 text-violet-700" /> Mail
                  </button>
                )}

                <button
                  onClick={() => setEditing(true)}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-900 ml-auto cursor-pointer"
                >
                  Edit
                </button>

                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 cursor-pointer flex items-center"
                >
                  {deleting ? "..." : <Trash2 className="h-3 w-3" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Direct Email Modal (Gmail & Outlook Chooser) */}
      {emailModalOpen && (
        <EmailComposerModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          email={cleanHandle.includes('@') ? cleanHandle : (lead.email || '')}
          companyName={lead.company_name}
          prospectName={lead.contact_name}
          draftMessage={getCleanDraftMessage(lead)}
          observation={getCleanObservation(lead)}
          onSent={onUpdate}
        />
      )}

      {scriptModalOpen && (
        <ColdCallScriptModal
          ctx={{
            companyName: lead.company_name,
            industry: lead.industry,
            handle: lead.handle,
            painPoint: lead.pain_point,
            prospectReply: lead.prospect_reply,
            openingLine: lead.call_opening_line,
          }}
          onClose={() => setScriptModalOpen(false)}
        />
      )}
      {templateModalOpen && (
        <DMEmailTemplateModal
          ctx={{
            companyName: lead.company_name,
            industry: lead.industry,
            contactName: (lead.handle && !/^[\d\+\-\s\(\)]+$/.test(lead.handle)) ? lead.handle : "Contact",
            channel: lead.channel,
            handle: lead.handle,
          }}
          onClose={() => setTemplateModalOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Log Modal ────────────────────────────────────────────────────────────────
const TEMPLATES: { id: OutreachTemplate; label: string }[] = [
  { id: "approach_a",     label: "Approach A"          },
  { id: "approach_b",     label: "Approach B"          },
  { id: "approach_c",     label: "Approach C"          },
  { id: "approach_d",     label: "Approach D"          },
  { id: "growth_offer",   label: "Growth Offer"        },
  { id: "free_website",   label: "Free Website Audit"  },
  { id: "digital_audit",  label: "Digital Audit"       },
  { id: "referral",       label: "Referral"            },
  { id: "event_followup", label: "Event Follow-up"     },
  { id: "custom",         label: "Custom"              },
];

// ─── CSV Parser & Auto Matcher ────────────────────────────────────────────────
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      lines.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);

  const parseLine = (line: string): string[] => {
    const values: string[] = [];
    let val = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') {
          val += '"';
          i++;
        } else {
          q = !q;
        }
      } else if (c === ',' && !q) {
        values.push(val.trim());
        val = '';
      } else {
        val += c;
      }
    }
    values.push(val.trim());
    return values;
  };

  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseLine(lines[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = vals[idx] || '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

function autoMatchHeaders(headers: string[]): Record<keyof MappedCSVRow, string> {
  const mapping: Record<keyof MappedCSVRow, string> = {
    company_name: '',
    industry: '',
    phone: '',
    website: '',
    email: '',
    linkedin_url: '',
    contact_name: '',
    contact_title: '',
    contact_whatsapp: '',
    handle: '',
    channel: '',
    status: '',
    notes: '',
    prospect_reply: '',
    pain_point: '',
    call_opening_line: '',
    outreach_date: '',
  };

  headers.forEach(h => {
    const clean = h.toLowerCase().trim();
    if (!mapping.company_name && /company|business|name|client|prospect|lead|title/i.test(clean) && !/contact|person|full_name/i.test(clean)) {
      mapping.company_name = h;
    } else if (!mapping.contact_name && /contact|person|full_name|representative/i.test(clean)) {
      mapping.contact_name = h;
    } else if (!mapping.contact_title && /job_title|title|role|position/i.test(clean)) {
      mapping.contact_title = h;
    } else if (!mapping.industry && /industry|sector|category|niche|type/i.test(clean)) {
      mapping.industry = h;
    } else if (!mapping.website && /website|url|domain|site/i.test(clean) && !/instagram|linkedin/i.test(clean)) {
      mapping.website = h;
    } else if (!mapping.email && /email|mail/i.test(clean)) {
      mapping.email = h;
    } else if (!mapping.linkedin_url && /linkedin/i.test(clean)) {
      mapping.linkedin_url = h;
    } else if (!mapping.contact_whatsapp && /whatsapp|wa_number|wa/i.test(clean)) {
      mapping.contact_whatsapp = h;
    } else if (!mapping.handle && /handle|username|instagram|ig|social|user/i.test(clean)) {
      mapping.handle = h;
    } else if (!mapping.phone && /phone|mobile|tel|number|call/i.test(clean)) {
      mapping.phone = h;
    } else if (!mapping.notes && /notes|comment|remark|message|details|desc|text/i.test(clean)) {
      mapping.notes = h;
    } else if (!mapping.prospect_reply && /reply|response|said|feedback|answer/i.test(clean)) {
      mapping.prospect_reply = h;
    } else if (!mapping.pain_point && /pain|problem|issue|challenge|need/i.test(clean)) {
      mapping.pain_point = h;
    } else if (!mapping.call_opening_line && /opening|hook|script|intro/i.test(clean)) {
      mapping.call_opening_line = h;
    } else if (!mapping.channel && /channel|platform|source|medium/i.test(clean)) {
      mapping.channel = h;
    } else if (!mapping.status && /status|stage|state/i.test(clean)) {
      mapping.status = h;
    } else if (!mapping.outreach_date && /date|time|sent_at|created/i.test(clean)) {
      mapping.outreach_date = h;
    }
  });

  return mapping;
}

const SUPABASE_TARGET_SECTIONS: {
  tableName: string;
  tableBadge: string;
  title: string;
  fields: { key: keyof MappedCSVRow; label: string; dbCol: string; desc: string }[];
}[] = [
  {
    tableName: "companies",
    tableBadge: "Supabase DB: companies",
    title: "1. Company / Business Profile",
    fields: [
      { key: "company_name",     label: "Company Name",           dbCol: "companies.company_name", desc: "Default: 'Unnamed Prospect #[Row]'" },
      { key: "industry",         label: "Industry / Sector",       dbCol: "companies.industry",     desc: "Default: 'General'" },
      { key: "phone",            label: "Main Office Phone",       dbCol: "companies.phone",        desc: "Main company phone" },
      { key: "website",          label: "Company Website",         dbCol: "companies.website",      desc: "Domain or URL" },
      { key: "email",            label: "Company Email",           dbCol: "companies.email",        desc: "Business email" },
      { key: "linkedin_url",     label: "Company LinkedIn Page",   dbCol: "companies.linkedin_url", desc: "LinkedIn profile" },
    ],
  },
  {
    tableName: "contacts",
    tableBadge: "Supabase DB: contacts",
    title: "2. Primary Contact Person",
    fields: [
      { key: "contact_name",     label: "Contact Person Name",     dbCol: "contacts.full_name",     desc: "Default: Representative" },
      { key: "contact_title",    label: "Contact Job Title",       dbCol: "contacts.title",         desc: "Default: Decision Maker" },
      { key: "contact_whatsapp", label: "WhatsApp Number",         dbCol: "contacts.whatsapp",      desc: "Direct WhatsApp contact" },
    ],
  },
  {
    tableName: "activities",
    tableBadge: "Supabase DB: activities",
    title: "3. Outreach Activity & Log Details",
    fields: [
      { key: "handle",           label: "Social Handle / DM Link", dbCol: "activities.handle",      desc: "Instagram handle or phone" },
      { key: "channel",          label: "Outreach Channel",        dbCol: "activities.channel",     desc: "Default: Selected channel" },
      { key: "status",           label: "Outreach Status",         dbCol: "activities.status",      desc: "Default: 'sent'" },
      { key: "notes",            label: "Logged Notes / Message",  dbCol: "activities.notes",       desc: "Outreach details" },
      { key: "prospect_reply",   label: "Prospect Reply",          dbCol: "activities.prospect_reply", desc: "Reply content" },
      { key: "pain_point",       label: "Pain Point Identified",   dbCol: "activities.pain_point",  desc: "Pain point note" },
      { key: "call_opening_line",label: "Opening Line for Call",   dbCol: "activities.call_opening_line", desc: "Call script intro" },
      { key: "outreach_date",    label: "Outreach Date",           dbCol: "activities.created_at",  desc: "Default: Selected date" },
    ],
  },
];

function LogModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [channel, setChannel] = useState<OutreachChannel>("instagram_dm");
  const [entryMode, setEntryMode] = useState<"new" | "csv" | "existing">("new");
  const [outreachDate, setOutreachDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [form, setForm] = useState({ company_name: "", industry: "", handle: "", phone: "", template_used: "growth_offer" as OutreachTemplate, notes: "" });
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CSV Import State
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<keyof MappedCSVRow, string>>({
    company_name: '', industry: '', phone: '', website: '', email: '', linkedin_url: '',
    contact_name: '', contact_title: '', contact_whatsapp: '',
    handle: '', channel: '', status: '', notes: '', prospect_reply: '', pain_point: '', call_opening_line: '', outreach_date: ''
  });
  const [customValues, setCustomValues] = useState<Record<keyof MappedCSVRow, string>>({
    company_name: '', industry: '', phone: '', website: '', email: '', linkedin_url: '',
    contact_name: '', contact_title: '', contact_whatsapp: '',
    handle: '', channel: 'instagram_dm', status: 'sent', notes: '', prospect_reply: '', pain_point: '', call_opening_line: '', outreach_date: ''
  });

  // AI Scraper State
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiObservation, setAiObservation] = useState("");

  useEffect(() => {
    if (entryMode === "existing" && allCompanies.length === 0) {
      getCompanies().then(res => {
        if (res.data) setAllCompanies(res.data);
      });
    }
  }, [entryMode, allCompanies.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const { headers, rows } = parseCSV(text);
        if (rows.length === 0) {
          setError("No data rows found in the uploaded CSV file.");
          return;
        }
        setCsvHeaders(headers);
        setCsvRows(rows);
        setColumnMap(autoMatchHeaders(headers));
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateObservation = async () => {
    if (!scrapeUrl) return;
    setGeneratingAI(true);
    try {
      const res = await fetch("/api/ai/scrape-observation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: scrapeUrl, 
          companyName: form.company_name || "Company", 
          industry: form.industry 
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setAiObservation(data.observation);
      if (form.notes.includes("[specific observation]")) {
        setForm(prev => ({ ...prev, notes: prev.notes.replace("[specific observation]", data.observation) }));
      }
    } catch (err: any) {
      alert(err.message || "Failed to generate observation");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (entryMode === "new") {
        if (!form.company_name || !form.handle) {
          setError("Business name and contact handle are required.");
          setSaving(false);
          return;
        }
        const result = await logOutreach({
          company_name: form.company_name,
          industry: form.industry || "General",
          channel,
          handle: form.handle,
          template_used: form.template_used,
          phone: form.phone || undefined,
          notes: form.notes || undefined,
          outreach_date: outreachDate
        });
        if (result.error) {
          setError(result.error);
          setSaving(false);
          return;
        }
      } else if (entryMode === "csv") {
        if (!csvRows || csvRows.length === 0) {
          setError("Please select a valid CSV file with at least one row.");
          setSaving(false);
          return;
        }

        const getValForField = (key: keyof MappedCSVRow, r: Record<string, string>): string | undefined => {
          const mapVal = columnMap[key];
          if (mapVal === "__custom__") {
            return customValues[key] || undefined;
          }
          if (mapVal && r[mapVal]) {
            return r[mapVal];
          }
          return undefined;
        };

        const mappedRows: MappedCSVRow[] = csvRows.map(r => {
          const row: MappedCSVRow = {};
          const co = getValForField('company_name', r); if (co) row.company_name = co;
          const ind = getValForField('industry', r); if (ind) row.industry = ind;
          const ph = getValForField('phone', r); if (ph) row.phone = ph;
          const web = getValForField('website', r); if (web) row.website = web;
          const em = getValForField('email', r); if (em) row.email = em;
          const li = getValForField('linkedin_url', r); if (li) row.linkedin_url = li;

          const cn = getValForField('contact_name', r); if (cn) row.contact_name = cn;
          const ct = getValForField('contact_title', r); if (ct) row.contact_title = ct;
          const cw = getValForField('contact_whatsapp', r); if (cw) row.contact_whatsapp = cw;

          const h = getValForField('handle', r); if (h) row.handle = h;
          const ch = getValForField('channel', r); if (ch) row.channel = ch as OutreachChannel;
          const st = getValForField('status', r); if (st) row.status = st as OutreachStatus;
          const n = getValForField('notes', r); if (n) row.notes = n;
          const pr = getValForField('prospect_reply', r); if (pr) row.prospect_reply = pr;
          const pp = getValForField('pain_point', r); if (pp) row.pain_point = pp;
          const col = getValForField('call_opening_line', r); if (col) row.call_opening_line = col;
          const od = getValForField('outreach_date', r); if (od) row.outreach_date = od;
          return row;
        });

        const result = await importCSVOutreach({
          rows: mappedRows,
          defaultChannel: channel,
          defaultDate: outreachDate,
          defaultTemplate: form.template_used,
        });

        if (result.error) {
          setError(result.error);
          setSaving(false);
          return;
        }
      } else {
        if (selectedIds.length === 0) {
          setError("Please select at least one prospect to log outreach.");
          setSaving(false);
          return;
        }
        const selectedCos = allCompanies
          .filter(co => selectedIds.includes(co.id))
          .map(co => ({ id: co.id, name: co.company_name, phone: co.phone }));
        
        const result = await bulkLogOutreach({
          companies: selectedCos,
          channel,
          template_used: form.template_used,
          notes: form.notes || undefined,
          outreach_date: outreachDate
        });
        if (result.error) {
          setError(result.error);
          setSaving(false);
          return;
        }
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const filteredCompanies = allCompanies.filter(co => {
    const matchesSearch = co.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (co.industry && co.industry.toLowerCase().includes(searchQuery.toLowerCase()));
      
    if (!matchesSearch) return false;
    
    if (entryMode === "existing") {
      const hasField = (field: string) => {
        if (co[field]) return true;
        if (co.contacts && Array.isArray(co.contacts)) {
          return co.contacts.some((c: any) => !!c[field]);
        }
        return false;
      };

      switch (channel) {
        case 'linkedin':
          return hasField('linkedin_url');
        case 'whatsapp':
        case 'cold_call':
          return hasField('phone') || hasField('whatsapp');
        case 'email':
          return hasField('email');
        case 'instagram_dm':
          return true;
        default:
          return true;
      }
    }
    return true;
  });

  const cfg = CHANNEL_CONFIG[channel];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className={cn(
        "bg-white rounded-3xl shadow-2xl w-full overflow-hidden max-h-[95vh] flex flex-col border border-slate-200 transition-all",
        entryMode === "csv" ? "max-w-3xl" : "max-w-lg"
      )}>
        {/* Header */}
        <div className="bg-slate-50 text-slate-900 border-b border-slate-100 px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-slate-200/70 text-slate-700 rounded-xl flex items-center justify-center">
              <ChannelIcon channel={channel} size={18} />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900">Log Outreach</p>
              <p className="text-slate-500 text-xs mt-0.5">Track for the call pipeline</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 text-xs font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Mode Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setEntryMode("new")}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                entryMode === "new" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Create New Prospect
            </button>
            <button
              type="button"
              onClick={() => setEntryMode("csv")}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                entryMode === "csv" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-teal-400" />
              Import CSV (Dynamic)
            </button>
            <button
              type="button"
              onClick={() => setEntryMode("existing")}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                entryMode === "existing" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Select Existing (Mass Log)
            </button>
          </div>

          {/* Global Controls: Date & Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Date of Outreach <span className="text-red-500">*</span></label>
              <Input
                type="date"
                value={outreachDate}
                onChange={e => setOutreachDate(e.target.value)}
                className="h-9 text-xs bg-white border-slate-200 rounded-xl"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Default Channel <span className="text-red-500">*</span></label>
              <select
                value={channel}
                onChange={e => setChannel(e.target.value as OutreachChannel)}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl h-9 px-3 font-extrabold text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                {CHANNELS.map(ch => (
                  <option key={ch} value={ch}>{CHANNEL_CONFIG[ch]?.label || ch}</option>
                ))}
              </select>
            </div>
          </div>

          {/* MODE 1: NEW PROSPECT */}
          {entryMode === "new" && (
            <>
              <div>
                <label className="text-xs font-black text-slate-700 block mb-2">Channel Quick Select</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {CHANNELS.map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setChannel(ch)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all cursor-pointer",
                        channel === ch ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      <ChannelIcon channel={ch} size={15} />
                      <span className="text-[10px] font-bold leading-tight">{CHANNEL_CONFIG[ch]?.label || 'Channel'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Business Name <span className="text-red-500">*</span></label>
                  <Input name="company_name" value={form.company_name} onChange={handleChange} placeholder="e.g. Lynx Events" className="h-10 text-sm bg-slate-50" required={entryMode === "new"} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Industry</label>
                  <Input name="industry" value={form.industry} onChange={handleChange} placeholder="e.g. Events, F&B" className="h-10 text-sm bg-slate-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">{cfg?.handleLabel || "Handle"} <span className="text-red-500">*</span></label>
                  <Input name="handle" value={form.handle} onChange={handleChange} placeholder={cfg?.placeholder || ""} className="h-10 text-sm bg-slate-50" required={entryMode === "new"} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Phone (optional)</label>
                  <Input name="phone" value={form.phone} onChange={handleChange} placeholder="+968 …" className="h-10 text-sm bg-slate-50" />
                </div>
              </div>
            </>
          )}

          {/* MODE 2: DYNAMIC IMPORT CSV */}
          {entryMode === "csv" && (
            <div className="space-y-4">
              {/* File Upload Box */}
              {!csvFileName ? (
                <label className="border-2 border-dashed border-slate-300 hover:border-slate-800 bg-slate-50/70 hover:bg-slate-100/70 transition-all rounded-2xl p-6 text-center cursor-pointer block space-y-2">
                  <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Upload CSV File</p>
                    <p className="text-xs text-slate-500 mt-0.5">Click or drag your CSV file here. Dynamic column mapping supported.</p>
                  </div>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
              ) : (
                <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-teal-500/20 text-teal-300 rounded-xl flex items-center justify-center font-bold">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{csvFileName}</p>
                      <p className="text-[10px] text-teal-300 font-medium">{csvRows.length} records found · {csvHeaders.length} columns detected</p>
                    </div>
                  </div>
                  <label className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors">
                    Change File
                    <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              )}

              {/* Info Notice */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                <FileText className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 font-medium leading-relaxed">
                  <strong className="font-extrabold">Supabase Backend Pairing:</strong> Each dropdown maps your CSV columns directly to Supabase database tables (<code className="bg-amber-100 px-1 rounded text-[11px] font-mono font-bold">companies</code>, <code className="bg-amber-100 px-1 rounded text-[11px] font-mono font-bold">contacts</code>, and <code className="bg-amber-100 px-1 rounded text-[11px] font-mono font-bold">activities</code>). None are mandatory.
                </p>
              </div>

              {/* Structured Mapping Sections Grouped by Supabase Table */}
              {csvHeaders.length > 0 && (
                <div className="space-y-4">
                  {SUPABASE_TARGET_SECTIONS.map(section => (
                    <div key={section.tableName} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">{section.title}</h3>
                        </div>
                        <span className="bg-slate-900 text-teal-300 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                          {section.tableBadge}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {section.fields.map(field => {
                          const selectedVal = columnMap[field.key] || '';
                          const isMapped = Boolean(selectedVal);
                          const isCustom = selectedVal === "__custom__";

                          return (
                            <div key={field.key} className={cn(
                              "border rounded-xl p-3 shadow-xs space-y-1.5 transition-all",
                              isCustom
                                ? "bg-amber-50/70 border-amber-300"
                                : isMapped
                                ? "bg-emerald-50/50 border-emerald-300"
                                : "bg-white border-slate-200"
                            )}>
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-extrabold text-slate-900">{field.label}</label>
                                <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                                  {field.dbCol}
                                </span>
                              </div>

                              <select
                                value={selectedVal}
                                onChange={e => setColumnMap(prev => ({ ...prev, [field.key]: e.target.value }))}
                                className={cn(
                                  "w-full text-xs rounded-lg h-9 px-2.5 font-bold transition-all focus:outline-none focus:ring-1 cursor-pointer",
                                  isCustom
                                    ? "bg-white border-amber-400 text-amber-950 focus:ring-amber-600"
                                    : isMapped
                                    ? "bg-white border-emerald-400 text-emerald-950 focus:ring-emerald-600"
                                    : "bg-slate-50 border-slate-200 text-slate-700 focus:ring-slate-900"
                                )}
                              >
                                <option value="">-- Do Not Import / Skip --</option>
                                <option value="__custom__">Type Manual Fixed Value...</option>
                                {csvHeaders.map(h => {
                                  const sampleVal = csvRows[0]?.[h] ? ` (e.g. "${csvRows[0][h].slice(0, 18)}")` : '';
                                  return (
                                    <option key={h} value={h}>
                                      CSV Header: "{h}"{sampleVal}
                                    </option>
                                  );
                                })}
                              </select>

                              {/* Manual Fixed Value Input */}
                              {isCustom && (
                                <div className="pt-1 space-y-1">
                                  {field.key === "channel" ? (
                                    <select
                                      value={customValues.channel || "instagram_dm"}
                                      onChange={e => setCustomValues(prev => ({ ...prev, channel: e.target.value as OutreachChannel }))}
                                      className="w-full text-xs bg-white border border-amber-300 rounded-lg h-8 px-2 font-extrabold text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-600 cursor-pointer"
                                    >
                                      {CHANNELS.map(ch => (
                                        <option key={ch} value={ch}>{CHANNEL_CONFIG[ch]?.label || ch}</option>
                                      ))}
                                    </select>
                                  ) : field.key === "status" ? (
                                    <select
                                      value={customValues.status || "sent"}
                                      onChange={e => setCustomValues(prev => ({ ...prev, status: e.target.value as OutreachStatus }))}
                                      className="w-full text-xs bg-white border border-amber-300 rounded-lg h-8 px-2 font-extrabold text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-600 cursor-pointer"
                                    >
                                      {STATUSES.map(st => (
                                        <option key={st} value={st}>{STATUS_CONFIG[st]?.label || st}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <Input
                                      type={field.key === "outreach_date" ? "date" : "text"}
                                      placeholder={`Enter manual value for ${field.label} (e.g. Events, F&B)...`}
                                      value={customValues[field.key] || ''}
                                      onChange={e => setCustomValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                                      className="h-8 text-xs bg-white border-amber-300 text-amber-950 font-bold placeholder:text-amber-400 rounded-lg"
                                    />
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-0.5">
                                <span className="text-[9px] text-slate-400 font-medium">{field.desc}</span>
                                {isCustom ? (
                                  <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    Manual Fixed Value
                                  </span>
                                ) : isMapped ? (
                                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Check className="h-3 w-3" /> Mapped to CSV
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Data Live Preview */}
              {csvRows.length > 0 && (
                <div className="space-y-2 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Table className="h-4 w-4 text-slate-700" />
                      <h4 className="text-xs font-black text-slate-900">Live Preview Across Supabase Tables (First 3 Rows)</h4>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">Row 1 - {Math.min(3, csvRows.length)} of {csvRows.length}</span>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                        <tr>
                          <th className="p-2 border-r border-slate-200">#</th>
                          <th className="p-2 border-r border-slate-200">companies.company_name</th>
                          <th className="p-2 border-r border-slate-200">contacts.full_name</th>
                          <th className="p-2 border-r border-slate-200">activities.handle / phone</th>
                          <th className="p-2">activities.notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {csvRows.slice(0, 3).map((r, i) => {
                          const getPreviewVal = (key: keyof MappedCSVRow) => {
                            const mapVal = columnMap[key];
                            if (mapVal === "__custom__") return customValues[key] || '';
                            if (mapVal && r[mapVal]) return r[mapVal];
                            return '';
                          };

                          const coName = getPreviewVal('company_name') || `Prospect #${i + 1}`;
                          const contactName = getPreviewVal('contact_name') || `${coName} Rep`;
                          const handleVal = getPreviewVal('handle') || getPreviewVal('phone') || '-';
                          const noteVal = getPreviewVal('notes') || '-';
                          const indVal = getPreviewVal('industry') || 'General';

                          return (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="p-2 font-mono text-[10px] text-slate-400 border-r border-slate-200">{i + 1}</td>
                              <td className="p-2 font-bold text-slate-900 border-r border-slate-200 truncate max-w-[140px]">
                                {coName} <span className="text-[10px] text-slate-400 font-normal">({indVal})</span>
                              </td>
                              <td className="p-2 border-r border-slate-200 truncate max-w-[110px] text-slate-700">{contactName}</td>
                              <td className="p-2 border-r border-slate-200 font-mono text-[11px] truncate max-w-[110px]">{handleVal}</td>
                              <td className="p-2 truncate max-w-[140px] text-slate-500 italic">{noteVal}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* MODE 3: SELECT EXISTING */}
          {entryMode === "existing" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">Select Prospects for Mass Log</label>
                <button
                  type="button"
                  onClick={() => setSelectedIds(selectedIds.length === filteredCompanies.length ? [] : filteredCompanies.map(c => c.id))}
                  className="text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  {selectedIds.length === filteredCompanies.length ? "Deselect All" : "Select All Filtered"}
                </button>
              </div>
              <Input
                type="text"
                placeholder="Search existing prospects by name or industry..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 text-xs bg-slate-50"
              />
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 space-y-1 max-h-40 overflow-y-auto">
                {filteredCompanies.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-400">No prospects found.</p>
                ) : (
                  filteredCompanies.map(co => {
                    const isChecked = selectedIds.includes(co.id);
                    return (
                      <label key={co.id} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedIds(selectedIds.filter(id => id !== co.id));
                            } else {
                              setSelectedIds([...selectedIds, co.id]);
                            }
                          }}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="font-bold text-slate-900 truncate">{co.company_name}</span>
                        {co.industry && <span className="text-[10px] text-slate-400 font-medium">({co.industry})</span>}
                      </label>
                    );
                  })
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-500">{selectedIds.length} prospects selected for mass logging.</p>
            </div>
          )}

          {/* AI Observation Scraper (Available for single prospect or custom notes) */}
          {entryMode !== "csv" && (
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-violet-500" />
                <label className="text-xs font-bold text-slate-700">AI Observation Scraper (Optional)</label>
              </div>
              <div className="flex gap-2">
                <Input
                  value={scrapeUrl}
                  onChange={e => setScrapeUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="h-9 text-xs bg-white flex-1"
                />
                <Button 
                  type="button" 
                  onClick={handleGenerateObservation} 
                  disabled={generatingAI || !scrapeUrl}
                  className="h-9 text-xs bg-violet-600 hover:bg-violet-700 text-white px-3 cursor-pointer"
                >
                  {generatingAI ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : "Generate"}
                </Button>
              </div>
              {aiObservation && (
                <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  Generated: {aiObservation}
                </p>
              )}
            </div>
          )}

          {/* Approach Template Picker */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Message / Approach Used</label>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} type="button" onClick={() => {
                  setForm(prev => {
                    let newNotes = prev.notes;
                    const playbookTemplate = PLAYBOOK_TEMPLATES.approaches.find(a => a.id === t.id);
                    if (playbookTemplate) {
                      let filled = playbookTemplate.template;
                      if (prev.company_name) filled = filled.replace(/\[Company\]/g, prev.company_name);
                      if (prev.industry) filled = filled.replace(/\[sector\]/g, prev.industry);
                      if (prev.handle) filled = filled.replace(/\[Name\]/g, prev.handle);
                      if (aiObservation) filled = filled.replace(/\[specific observation\]/g, aiObservation);
                      newNotes = filled.replace(/^"|"$/g, "");
                    }
                    return { ...prev, template_used: t.id, notes: newNotes };
                  });
                }} className={cn("p-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer", form.template_used === t.id ? "border-slate-700 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300")}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes field */}
          {entryMode !== "csv" && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">Notes</label>
              <Textarea name="notes" value={form.notes} onChange={handleChange} placeholder="What you noticed, any relevant context from their profile or conversation..." className="text-xs resize-none bg-slate-50 border-slate-200 rounded-xl" rows={2} />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-10 text-xs font-bold rounded-xl cursor-pointer">Cancel</Button>
            <Button
              type="submit"
              disabled={saving || (entryMode === "csv" && csvRows.length === 0)}
              className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : entryMode === "csv" ? (
                <FileSpreadsheet className="h-4 w-4 mr-2 text-teal-400" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {saving
                ? "Saving to Database..."
                : entryMode === "csv"
                ? `Import ${csvRows.length} Prospects to DB`
                : entryMode === "existing"
                ? `Mass Log (${selectedIds.length})`
                : "Log Outreach"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

