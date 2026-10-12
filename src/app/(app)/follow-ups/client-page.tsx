"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Send,
  MessageSquare,
  Building,
  User,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Phone,
  Flame,
  ChevronRight,
  FileCheck,
  CalendarCheck,
  XCircle,
  HelpCircle,
  Loader2,
  Share2,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { addToast } from "@/components/ui/toast";
import { useUnifiedLead } from "@/context/unified-lead-context";
import {
  getCadenceFollowUps,
  advanceCadenceStage,
  recordProspectReply,
  switchSequenceTrack,
  type CadenceFollowUpItem
} from "@/lib/actions/followups";
import {
  type SequenceTrack,
  type ProspectPersona,
  type ReplySentiment,
  COLD_CADENCE_STAGES,
  CONVERSATION_STAGES,
  PROSPECT_PERSONAS,
  REPLY_SENTIMENTS,
  generateConversationScript,
} from "@/lib/constants/sequences";
import { cn } from "@/lib/utils";
import { CRMCache } from "@/lib/cache/crm-cache";

// ─── Channel Icon Helper ───────────────────────────────────────────────────────
function ChannelBadge({ channel }: { channel: string }) {
  if (channel === "instagram_dm" || channel.includes("instagram")) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 text-pink-700 border border-pink-200/50">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <circle cx="12" cy="12" r="3.5" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
        Instagram DM
      </span>
    );
  }

  if (channel === "linkedin") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        LinkedIn
      </span>
    );
  }

  if (channel === "whatsapp") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
        <MessageSquare className="h-3 w-3" />
        WhatsApp
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
      <Phone className="h-3 w-3" />
      Phone / Call
    </span>
  );
}

// ─── Stage Stepper Component ───────────────────────────────────────────────────
function CadenceStageStepper({
  currentStage,
  track = "cold_cadence",
}: {
  currentStage: number;
  track?: SequenceTrack;
}) {
  const isConversation = track === "conversation";
  const stageMap = isConversation ? CONVERSATION_STAGES : COLD_CADENCE_STAGES;
  const stages = [1, 2, 3, 4].map((num) => ({
    num,
    label: stageMap[num]?.shortLabel || `Stage ${num}`,
    delay: stageMap[num]?.delay || "",
  }));

  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-between relative">
        <div
          className={cn(
            "absolute left-6 right-6 top-1/2 -translate-y-1/2 h-[2px] -z-0",
            isConversation ? "bg-purple-100" : "bg-neutral-200"
          )}
        />
        {stages.map((stage) => {
          const isCompleted = stage.num < currentStage;
          const isCurrent = stage.num === currentStage;

          return (
            <div key={stage.num} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all shadow-xs",
                  isCompleted && (isConversation ? "bg-purple-600 text-white ring-4 ring-purple-50" : "bg-emerald-600 text-white ring-4 ring-emerald-50"),
                  isCurrent && (isConversation ? "bg-purple-900 text-white ring-4 ring-purple-200 scale-110" : "bg-black text-white ring-4 ring-neutral-200 scale-110"),
                  !isCompleted && !isCurrent && "bg-neutral-100 text-neutral-400 border border-neutral-300"
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : stage.num}
              </div>
              <div className="text-center mt-1">
                <p
                  className={cn(
                    "text-[10px] font-medium leading-tight whitespace-nowrap",
                    isCurrent
                      ? isConversation ? "text-purple-950 font-bold" : "text-neutral-900 font-semibold"
                      : "text-neutral-500"
                  )}
                >
                  {stage.label}
                </p>
                <span className="text-[9px] text-neutral-400 font-mono block">
                  {stage.delay}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CadenceFollowUpsClient({ initialItems = [] }: { initialItems?: CadenceFollowUpItem[] }) {
  const { openLead } = useUnifiedLead();
  
  const cachedItems = useMemo(() => {
    return initialItems.length > 0 ? initialItems : (CRMCache.get<CadenceFollowUpItem[]>("followups-cadence") || []);
  }, [initialItems]);

  const [items, setItems] = useState<CadenceFollowUpItem[]>(cachedItems);
  const [loading, setLoading] = useState<boolean>(() => cachedItems.length === 0);
  const [activeTab, setActiveTab] = useState<"today" | "overdue" | "upcoming" | "all">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [trackFilter, setTrackFilter] = useState<"all" | "cold_cadence" | "conversation">("all");

  // Per-card local message edit buffer
  const [editedMessages, setEditedMessages] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  // Track & Persona Switcher modal state
  const [trackModalItem, setTrackModalItem] = useState<CadenceFollowUpItem | null>(null);
  const [modalTrack, setModalTrack] = useState<SequenceTrack>("conversation");
  const [modalPersona, setModalPersona] = useState<ProspectPersona>("owner_founder");
  const [modalSentiment, setModalSentiment] = useState<ReplySentiment>("interested");
  const [modalStage, setModalStage] = useState<number>(1);
  const [modalNotes, setModalNotes] = useState<string>("");
  const [modalMeetingDate, setModalMeetingDate] = useState<string>("");
  const [switchingTrack, setSwitchingTrack] = useState(false);

  const openTrackModal = (item: CadenceFollowUpItem, defaultTrack?: SequenceTrack) => {
    setTrackModalItem(item);
    const targetTrack = defaultTrack || item.track || "conversation";
    setModalTrack(targetTrack);
    setModalPersona(item.persona || "owner_founder");
    setModalSentiment(item.reply_sentiment || "interested");
    setModalStage(item.current_stage || 1);
    setModalNotes(item.reply_notes || "");
    setModalMeetingDate("");
  };

  const handleSwitchTrackSubmit = async () => {
    if (!trackModalItem) return;
    setSwitchingTrack(true);
    try {
      const res = await switchSequenceTrack({
        companyId: trackModalItem.company_id,
        track: modalTrack,
        persona: modalPersona,
        replySentiment: modalSentiment,
        replyNotes: modalNotes,
        currentStage: modalStage,
        followUpId: trackModalItem.id,
        directChannel: trackModalItem.direct_channel,
      });

      if (res.error) {
        addToast("error", `Failed to switch sequence track: ${res.error}`);
      } else {
        addToast(
          "success",
          `Switched ${trackModalItem.company_name} to ${modalTrack === "conversation" ? "Active Conversation" : "Cold Cadence"} track!`
        );

        if (modalTrack === "conversation") {
          const newScript = generateConversationScript({
            stage: modalStage,
            persona: modalPersona,
            replySentiment: modalSentiment,
            companyName: trackModalItem.company_name,
            contactName: trackModalItem.contact_name,
            channel: trackModalItem.direct_channel,
          });
          setEditedMessages((prev) => ({
            ...prev,
            [trackModalItem.id]: newScript,
          }));
        }

        setTrackModalItem(null);
        await loadData();
      }
    } catch (err: any) {
      addToast("error", err.message || "Failed to switch sequence track");
    } finally {
      setSwitchingTrack(false);
    }
  };

  const modalPreviewScript = useMemo(() => {
    if (!trackModalItem) return "";
    if (modalTrack === "conversation") {
      return generateConversationScript({
        stage: modalStage,
        persona: modalPersona,
        replySentiment: modalSentiment,
        companyName: trackModalItem.company_name,
        contactName: trackModalItem.contact_name,
        channel: trackModalItem.direct_channel,
      });
    }
    const stageCfg = COLD_CADENCE_STAGES[modalStage] || COLD_CADENCE_STAGES[1];
    return `Ahlan ${trackModalItem.contact_name || "there"}, following up on our recent note regarding ${trackModalItem.company_name}. [${stageCfg.label}]`;
  }, [trackModalItem, modalTrack, modalStage, modalPersona, modalSentiment]);

  // Load Cadence Follow-ups with silent background support
  const loadData = useCallback(async (silent = false) => {
    if (!silent && !CRMCache.get("followups-cadence")) setLoading(true);
    try {
      const res = await getCadenceFollowUps();
      if (res.error) {
        if (!silent) addToast("error", `Failed to load follow-ups: ${res.error}`);
      } else {
        const fresh = res.data || [];
        setItems(fresh);
        CRMCache.set("followups-cadence", fresh);
      }
    } catch (err: any) {
      if (!silent) addToast("error", err.message || "Failed to load cadence follow-ups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialItems.length > 0) {
      CRMCache.set("followups-cadence", initialItems);
    }
    if (cachedItems.length === 0 || CRMCache.isStale("followups-cadence", 60000)) {
      loadData(cachedItems.length > 0);
    }
  }, [initialItems, cachedItems.length, loadData]);

  useEffect(() => {
    const handleLeadUpdated = () => {
      loadData(true);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("lead-updated", handleLeadUpdated);
      return () => window.removeEventListener("lead-updated", handleLeadUpdated);
    }
  }, [loadData]);

  // Derived metrics
  const todayCount = useMemo(() => items.filter((i) => i.is_today).length, [items]);
  const overdueCount = useMemo(() => items.filter((i) => i.is_overdue).length, [items]);
  const upcomingCount = useMemo(() => items.filter((i) => !i.is_today && !i.is_overdue).length, [items]);
  const coldCadenceCount = useMemo(() => items.filter((i) => i.track === "cold_cadence").length, [items]);
  const conversationCount = useMemo(() => items.filter((i) => i.track === "conversation").length, [items]);
  const totalCount = items.length;

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tab filter
      if (activeTab === "today" && !item.is_today) return false;
      if (activeTab === "overdue" && !item.is_overdue) return false;
      if (activeTab === "upcoming" && (item.is_today || item.is_overdue)) return false;

      // Track filter
      if (trackFilter !== "all" && item.track !== trackFilter) return false;

      // Channel filter
      if (channelFilter !== "all") {
        if (channelFilter === "instagram" && item.direct_channel !== "instagram_dm") return false;
        if (channelFilter === "linkedin" && item.direct_channel !== "linkedin") return false;
        if (channelFilter === "whatsapp" && item.direct_channel !== "whatsapp") return false;
      }

      // Stage filter
      if (stageFilter !== "all") {
        if (String(item.current_stage) !== stageFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCompany = item.company_name.toLowerCase().includes(q);
        const matchesContact = (item.contact_name || "").toLowerCase().includes(q);
        const matchesIndustry = (item.industry || "").toLowerCase().includes(q);
        const matchesHandle = (item.instagram_handle || "").toLowerCase().includes(q);
        if (!matchesCompany && !matchesContact && !matchesIndustry && !matchesHandle) {
          return false;
        }
      }

      return true;
    });
  }, [items, activeTab, channelFilter, stageFilter, searchQuery]);

  // 1-Click Copy Template
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast("success", "Message template copied to clipboard!");
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  // 1-Click Mark Touch Sent & Advance Cadence
  const handleAdvanceStage = async (item: CadenceFollowUpItem) => {
    setAdvancingId(item.id);
    try {
      const customMessage = editedMessages[item.id] || item.recommended_template;
      const res = await advanceCadenceStage({
        companyId: item.company_id,
        currentStage: item.current_stage,
        channel: item.direct_channel,
        contactId: item.contact_id,
        followUpId: item.id,
        customNotes: customMessage,
      });

      if (res.error) {
        addToast("error", `Failed to advance cadence: ${res.error}`);
      } else {
        addToast(
          "success",
          `Touch recorded! Advanced ${item.company_name} to Stage ${res.data?.nextStage} (Next due: ${res.data?.nextDueDate})`
        );
        // Refresh local items
        await loadData();
      }
    } catch (err: any) {
      addToast("error", err.message || "Failed to advance stage");
    } finally {
      setAdvancingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafc] pb-24 font-body">
      {/* ─── Top Header & Cadence Rule Banner ─────────────────────────────────── */}
      <div className="bg-white border-b border-black/[0.06] shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-black text-white">
                  <Clock className="h-4 w-4" />
                </span>
                <h1 className="text-xl sm:text-2xl font-light text-neutral-900 tracking-tight font-display">
                  Follow-up Command Center
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-neutral-500 font-light mt-1">
                Manage and execute upcoming outreach follow-ups across Instagram, LinkedIn, and WhatsApp.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(false)}
                disabled={loading}
                className="gap-1.5 text-xs text-neutral-600 hover:text-black border-neutral-200 hover:bg-neutral-50 cursor-pointer"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                Refresh Queue
              </Button>
            </div>
          </div>

          {/* ─── Dual Track Cadence Showcase Banner ──────────────────────────────────── */}
          <div className="mt-5 p-3.5 rounded-2xl bg-neutral-50/80 border border-black/[0.04] space-y-2 text-xs text-neutral-600">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-medium text-neutral-900">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span>Cold Cadence (Linear 4-Touch):</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 font-medium">
                  Stage 1: Greeting
                </span>
                <ArrowRight className="h-3 w-3 text-neutral-400" />
                <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                  +2 Days: Value Check-in
                </span>
                <ArrowRight className="h-3 w-3 text-neutral-400" />
                <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 font-semibold">
                  +3 Days: Audit Offer
                </span>
                <ArrowRight className="h-3 w-3 text-neutral-400" />
                <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                  +5 Days: Coffee Meet / Call
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-black/[0.04] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-medium text-purple-900">
                <MessageSquare className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                <span>Active Conversation Track (When Replied):</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-purple-100/70 border border-purple-200 text-purple-800 font-medium">
                  Stage 1: Polite Slide-In
                </span>
                <ArrowRight className="h-3 w-3 text-purple-300" />
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold">
                  +1-2d: Context & Discovery
                </span>
                <ArrowRight className="h-3 w-3 text-purple-300" />
                <span className="px-2 py-0.5 rounded-md bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-700 font-semibold">
                  +2-3d: Value & Audit Review
                </span>
                <ArrowRight className="h-3 w-3 text-purple-300" />
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                  +2-3d: Muscat Coffee / Meeting Close
                </span>
              </div>
            </div>
          </div>

          {/* ─── Metric Counter Tabs ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            <button
              onClick={() => setActiveTab("today")}
              className={cn(
                "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden",
                activeTab === "today"
                  ? "bg-white border-black text-black shadow-sm ring-1 ring-black"
                  : "bg-white/60 hover:bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-light">Due Today</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-light font-display text-neutral-900">{todayCount}</span>
                <span className="text-[10px] text-neutral-400 font-light">Immediate action</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("overdue")}
              className={cn(
                "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden",
                activeTab === "overdue"
                  ? "bg-rose-50/50 border-rose-500 text-rose-950 shadow-sm ring-1 ring-rose-500"
                  : "bg-white/60 hover:bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-light text-rose-800">Overdue</span>
                <Flame className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-light font-display text-rose-600">{overdueCount}</span>
                <span className="text-[10px] text-rose-400 font-light">Needs catch-up</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("upcoming")}
              className={cn(
                "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden",
                activeTab === "upcoming"
                  ? "bg-white border-black text-black shadow-sm ring-1 ring-black"
                  : "bg-white/60 hover:bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-light">Upcoming</span>
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-light font-display text-neutral-900">{upcomingCount}</span>
                <span className="text-[10px] text-neutral-400 font-light">Scheduled ahead</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("all")}
              className={cn(
                "p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden",
                activeTab === "all"
                  ? "bg-white border-black text-black shadow-sm ring-1 ring-black"
                  : "bg-white/60 hover:bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-light">All Active Cadences</span>
                <Clock className="h-3.5 w-3.5 text-neutral-400" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-light font-display text-neutral-900">{totalCount}</span>
                <span className="text-[10px] text-neutral-400 font-light">In pipeline</span>
              </div>
            </button>
          </div>

          {/* ─── Search & Filters Bar ────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-black/[0.04]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by company, contact, or sector..."
                className="pl-9 bg-neutral-50/70 border-neutral-200 text-xs rounded-xl h-9"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Sequence Track Filter */}
              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value as any)}
                className="bg-neutral-50/70 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs text-neutral-700 focus:outline-none focus:border-black cursor-pointer font-medium"
              >
                <option value="all">All Tracks ({totalCount})</option>
                <option value="cold_cadence">Cold Cadence ({coldCadenceCount})</option>
                <option value="conversation">In Conversation ({conversationCount})</option>
              </select>

              {/* Channel Filter */}
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="bg-neutral-50/70 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs text-neutral-700 focus:outline-none focus:border-black cursor-pointer"
              >
                <option value="all">All Channels</option>
                <option value="instagram">Instagram DM</option>
                <option value="linkedin">LinkedIn</option>
                <option value="whatsapp">WhatsApp</option>
              </select>

              {/* Stage Filter */}
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="bg-neutral-50/70 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-xs text-neutral-700 focus:outline-none focus:border-black cursor-pointer"
              >
                <option value="all">All Stages</option>
                <option value="1">Stage 1: Greeting Sent / Slide-In</option>
                <option value="2">Stage 2: Value Check-in / Discovery</option>
                <option value="3">Stage 3: Audit Offer / Value Review</option>
                <option value="4">Stage 4: Coffee / Meeting Close</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Follow-ups Stream ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-900 mb-3" />
            <p className="text-xs font-light">Loading cadence command center...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-black/[0.05] p-8 shadow-2xs">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-light text-neutral-900 font-display">Queue Cleared!</h3>
            <p className="text-xs text-neutral-500 font-light mt-1 max-w-md mx-auto">
              {activeTab === "today"
                ? "No pending follow-ups due today. Check the Upcoming tab or switch filters."
                : "No matching cadence follow-ups found for the selected filter."}
            </p>
            {activeTab !== "all" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTab("all");
                  setSearchQuery("");
                }}
                className="mt-4 text-xs cursor-pointer"
              >
                View All Active Follow-ups
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {filteredItems.map((item) => {
              const currentMessage = editedMessages[item.id] !== undefined ? editedMessages[item.id] : item.recommended_template;
              const isCopied = copiedId === item.id;
              const isAdvancing = advancingId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "bg-white rounded-3xl border transition-all duration-200 overflow-hidden shadow-2xs hover:shadow-md",
                    item.is_today && "border-emerald-300/80 ring-1 ring-emerald-200/50",
                    item.is_overdue && "border-rose-200 bg-rose-50/[0.03]",
                    !item.is_today && !item.is_overdue && "border-black/[0.06]"
                  )}
                >
                  {/* Card Header */}
                  <div className="p-5 sm:p-6 pb-4 border-b border-black/[0.04]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <button
                            onClick={() => openLead(item.company_id)}
                            className="text-base sm:text-lg font-light text-neutral-900 hover:text-black tracking-tight font-display hover:underline flex items-center gap-1.5 cursor-pointer text-left"
                          >
                            <span>{item.company_name}</span>
                            <ExternalLink className="h-3.5 w-3.5 opacity-40 hover:opacity-100" />
                          </button>

                          <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider bg-neutral-50 text-neutral-600 border-neutral-200">
                            {item.industry || "General"}
                          </Badge>

                          <ChannelBadge channel={item.direct_channel} />

                          {item.track === "conversation" ? (
                            <button
                              type="button"
                              onClick={() => openTrackModal(item)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors cursor-pointer"
                              title="Click to change track or persona"
                            >
                              <MessageSquare className="h-3 w-3 text-purple-600" />
                              <span>Conversation Track</span>
                              <span className="text-purple-300">•</span>
                              <span>{PROSPECT_PERSONAS[item.persona]?.shortLabel || "Founder"}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openTrackModal(item, "conversation")}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200/70 transition-colors cursor-pointer"
                              title="Click to switch to active conversation track"
                            >
                              <Layers className="h-3 w-3 text-neutral-400" />
                              <span>Cold Cadence (4-Touch)</span>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 font-light">
                          <span className="font-normal text-neutral-800">{item.contact_name}</span>
                          {item.contact_title && (
                            <>
                              <span>•</span>
                              <span>{item.contact_title}</span>
                            </>
                          )}
                          {item.instagram_handle && (
                            <>
                              <span>•</span>
                              <span className="text-pink-600 font-mono">{item.instagram_handle}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Due Date Indicator */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        {item.is_today && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            DUE TODAY
                          </span>
                        )}
                        {item.is_overdue && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
                            <Flame className="h-3.5 w-3.5 text-rose-600" />
                            Overdue by {item.days_overdue} {item.days_overdue === 1 ? "day" : "days"} ({item.due_date})
                          </span>
                        )}
                        {!item.is_today && !item.is_overdue && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-neutral-400" />
                            Due in {item.days_until_due} {item.days_until_due === 1 ? "day" : "days"} ({item.due_date})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cadence Stepper */}
                    <div className="mt-4 pt-3 border-t border-black/[0.03]">
                      <CadenceStageStepper currentStage={item.current_stage} track={item.track} />
                    </div>
                  </div>

                  {/* Card Body: Recommended Message & 1-Click Action */}
                  <div className="p-5 sm:p-6 bg-neutral-50/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 flex-wrap">
                        {item.track === "conversation" ? (
                          <>
                            <MessageSquare className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                            <span className="text-purple-950 font-semibold">Tailored Conversation Script:</span>
                            <span className="text-[11px] text-purple-700 font-normal">
                              ({item.stage_label}) • {REPLY_SENTIMENTS[item.reply_sentiment]?.shortLabel || "Interested"} • {PROSPECT_PERSONAS[item.persona]?.shortLabel || "Founder"}
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            <span>Recommended Playbook Message:</span>
                            <span className="text-[11px] text-neutral-400 font-light font-mono">
                              (Stage {item.current_stage}: {item.stage_label})
                            </span>
                          </>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyMessage(item.id, currentMessage)}
                        className="h-7 px-2.5 text-xs text-neutral-600 hover:text-black gap-1 cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Template</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Editable Message Box */}
                    <div className="relative">
                      <Textarea
                        value={currentMessage}
                        onChange={(e) =>
                          setEditedMessages((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        rows={3}
                        className="bg-white border-neutral-200 text-xs sm:text-sm text-neutral-800 rounded-2xl resize-none focus:border-black focus:ring-1 focus:ring-black font-light leading-relaxed"
                        placeholder="Customize message if needed before sending..."
                      />
                    </div>

                    {/* Action Bar */}
                    <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-black/[0.04]">
                      {/* Direct 1-Click Channel Link */}
                      <div className="flex items-center gap-2">
                        {item.direct_url ? (
                          <a
                            href={item.direct_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white hover:bg-neutral-100 text-neutral-900 border border-neutral-200 transition-all shadow-2xs active:scale-98 cursor-pointer"
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-neutral-500" />
                            <span>
                              {item.direct_channel === "instagram_dm"
                                ? "Open Instagram DM"
                                : item.direct_channel === "linkedin"
                                ? "Open LinkedIn Chat"
                                : item.direct_channel === "whatsapp"
                                ? "Open WhatsApp"
                                : "Call Phone"}
                            </span>
                          </a>
                        ) : (
                          <span className="text-xs text-neutral-400 font-light italic">
                            No direct channel URL found
                          </span>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openLead(item.company_id)}
                          className="text-xs text-neutral-500 hover:text-black cursor-pointer"
                        >
                          View Lead Details
                        </Button>
                      </div>

                      {/* Main Cadence Advancement Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {/* Switch Track / Update Persona Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openTrackModal(item, item.track === "cold_cadence" ? "conversation" : undefined)}
                          className={cn(
                            "text-xs font-medium cursor-pointer transition-colors",
                            item.track === "conversation"
                              ? "text-purple-700 bg-purple-50/80 border-purple-200 hover:bg-purple-100"
                              : "text-neutral-700 bg-white border-neutral-200 hover:bg-neutral-50"
                          )}
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
                          {item.track === "conversation" ? (
                            <span>Persona ({PROSPECT_PERSONAS[item.persona]?.shortLabel || "Founder"})</span>
                          ) : (
                            <span>Prospect Replied / Switch Track</span>
                          )}
                        </Button>

                        {/* 1-Click Mark Sent & Advance Stage Button */}
                        <Button
                          size="sm"
                          disabled={isAdvancing}
                          onClick={() => handleAdvanceStage(item)}
                          className={cn(
                            "text-xs font-medium text-white shadow-sm cursor-pointer min-w-[170px]",
                            item.track === "conversation" ? "bg-purple-950 hover:bg-purple-900" : "bg-black hover:bg-neutral-800"
                          )}
                        >
                          {isAdvancing ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                              Advancing...
                            </>
                          ) : (
                            <>
                              <Send className="h-3.5 w-3.5 mr-1.5" />
                              Mark Sent & Advance
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Switch Sequence Track & Persona Modal ────────────────────────────── */}
      {trackModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-black/[0.08] p-6 max-w-xl w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.05]">
              <div>
                <h3 className="text-base font-light text-neutral-900 font-display">
                  Sequence Track & Prospect Persona
                </h3>
                <p className="text-xs text-neutral-500 font-light mt-0.5">
                  {trackModalItem.company_name} ({trackModalItem.contact_name}) • {trackModalItem.industry || "General"}
                </p>
              </div>
              <button
                onClick={() => setTrackModalItem(null)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Track Selector Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-700 block">
                Select Active Sequence Track:
              </label>
              <div className="grid grid-cols-2 gap-2 bg-neutral-100/80 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setModalTrack("conversation")}
                  className={cn(
                    "py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer",
                    modalTrack === "conversation"
                      ? "bg-white text-purple-950 shadow-xs ring-1 ring-black/[0.05]"
                      : "text-neutral-500 hover:text-neutral-900"
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 text-purple-600" />
                  <span>Active Conversation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalTrack("cold_cadence")}
                  className={cn(
                    "py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer",
                    modalTrack === "cold_cadence"
                      ? "bg-white text-neutral-950 shadow-xs ring-1 ring-black/[0.05]"
                      : "text-neutral-500 hover:text-neutral-900"
                  )}
                >
                  <Clock className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Cold Cadence (4-Touch)</span>
                </button>
              </div>
            </div>

            {modalTrack === "conversation" ? (
              <div className="space-y-4">
                {/* 1. Prospect Persona Selection */}
                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1.5">
                    Prospect Persona / Decision Maker:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(PROSPECT_PERSONAS) as ProspectPersona[]).map((key) => {
                      const p = PROSPECT_PERSONAS[key];
                      const isSel = modalPersona === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setModalPersona(key)}
                          className={cn(
                            "p-2.5 rounded-2xl border text-left transition-all cursor-pointer",
                            isSel
                              ? "bg-purple-50/70 border-purple-400 text-purple-950 ring-1 ring-purple-400"
                              : "bg-neutral-50/50 border-neutral-200 hover:bg-white text-neutral-700"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{p.icon}</span>
                            <span className="text-xs font-semibold">{p.shortLabel}</span>
                          </div>
                          <span className="text-[10px] text-neutral-500 font-light block mt-0.5 line-clamp-1">
                            {p.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Reply Status / Sentiment */}
                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1.5">
                    Prospect Reply Sentiment:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(REPLY_SENTIMENTS) as ReplySentiment[]).map((key) => {
                      const s = REPLY_SENTIMENTS[key];
                      const isSel = modalSentiment === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setModalSentiment(key)}
                          className={cn(
                            "p-2 rounded-xl border text-left transition-all cursor-pointer",
                            isSel
                              ? "bg-indigo-50/70 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400"
                              : "bg-neutral-50/50 border-neutral-200 hover:bg-white text-neutral-700"
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{s.icon}</span>
                            <span className="text-[11px] font-medium leading-tight">{s.shortLabel}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Conversation Stage */}
                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1.5">
                    Conversation Stage:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((stageNum) => {
                      const cfg = CONVERSATION_STAGES[stageNum];
                      const isSel = modalStage === stageNum;
                      return (
                        <button
                          key={stageNum}
                          type="button"
                          onClick={() => setModalStage(stageNum)}
                          className={cn(
                            "p-2 rounded-xl border text-center transition-all cursor-pointer",
                            isSel
                              ? "bg-black text-white border-black font-semibold"
                              : "bg-neutral-50/60 border-neutral-200 text-neutral-700 hover:bg-white text-xs"
                          )}
                        >
                          <div className="text-[11px] font-medium">{cfg.shortLabel}</div>
                          <div className="text-[9px] opacity-70 font-mono">{cfg.delay}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Notes / Prospect Reply Summary */}
                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1">
                    Prospect Response / Notes:
                  </label>
                  <Textarea
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    placeholder="e.g. Asked if we do Instagram ad management and how much it costs..."
                    rows={2}
                    className="text-xs rounded-xl resize-none font-light"
                  />
                </div>

                {/* 5. Live Script Preview */}
                <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-purple-900">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-purple-600" />
                      Generated Next Script Preview:
                    </span>
                    <span className="text-[10px] text-purple-600 font-mono">Auto-populates on apply</span>
                  </div>
                  <p className="text-xs text-neutral-800 font-light italic leading-relaxed">
                    &ldquo;{modalPreviewScript}&rdquo;
                  </p>
                </div>
              </div>
            ) : (
              /* Cold Cadence Options */
              <div className="space-y-4">
                <div className="p-3.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs text-neutral-600 font-light leading-relaxed">
                  Resetting to linear Cold Cadence for accounts without reply. Follows strict 2d → 3d → 5d cadence timing.
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 block mb-1.5">
                    Cold Cadence Stage:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((stageNum) => {
                      const cfg = COLD_CADENCE_STAGES[stageNum];
                      const isSel = modalStage === stageNum;
                      return (
                        <button
                          key={stageNum}
                          type="button"
                          onClick={() => setModalStage(stageNum)}
                          className={cn(
                            "p-2 rounded-xl border text-center transition-all cursor-pointer",
                            isSel
                              ? "bg-black text-white border-black font-semibold"
                              : "bg-neutral-50/60 border-neutral-200 text-neutral-700 hover:bg-white text-xs"
                          )}
                        >
                          <div className="text-[11px] font-medium">{cfg.shortLabel}</div>
                          <div className="text-[9px] opacity-70 font-mono">{cfg.delay}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-black/[0.05]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTrackModalItem(null)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={switchingTrack}
                onClick={handleSwitchTrackSubmit}
                className={cn(
                  "text-xs text-white cursor-pointer min-w-[150px]",
                  modalTrack === "conversation" ? "bg-purple-950 hover:bg-purple-900" : "bg-black hover:bg-neutral-800"
                )}
              >
                {switchingTrack ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Updating Track...
                  </>
                ) : (
                  "Update Sequence Track"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
