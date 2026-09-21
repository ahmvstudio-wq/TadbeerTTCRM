"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X, Calendar, Clock, Check, Sparkles, MessageCircle, Phone,
  Mail, ExternalLink, AlertCircle, ChevronRight, CheckCircle2,
  CalendarCheck, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  UNIFIED_STATUSES,
  UNIFIED_STATUS_MAP,
  getUnifiedStatus,
  type UnifiedStatusConfig,
  type StatusCategory
} from "@/lib/constants/statuses";
import { updateLeadStatusAndScheduleFollowUp } from "@/lib/actions/companies";
import { updateOutreachStatus } from "@/lib/actions/ig-dm";
import { cn } from "@/lib/utils";
import { addToast } from "@/components/ui/toast";

interface StatusFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  currentStatus?: string;
  activityId?: string; // If launched from outreach table
  defaultChannel?: string;
  onSuccess?: (newStatus: string, dueDate: string | null) => void;
}

export function StatusFollowUpModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  currentStatus = "prospect",
  activityId,
  defaultChannel,
  onSuccess,
}: StatusFollowUpModalProps) {
  const currentConfig = useMemo(() => getUnifiedStatus(currentStatus), [currentStatus]);

  const [selectedStatus, setSelectedStatus] = useState<string>(currentConfig.id);
  const [selectedCategory, setSelectedCategory] = useState<StatusCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Follow-Up State
  // followUpOption: 'none' | '1d' | '2d' | '3d' | '7d' | 'custom'
  const [followUpOption, setFollowUpOption] = useState<"none" | "1d" | "2d" | "3d" | "7d" | "custom">("none");
  const [customDate, setCustomDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpChannel, setFollowUpChannel] = useState(defaultChannel || "call");
  const [saving, setSaving] = useState(false);

  // Initialize selected status and smart default follow-up when opened
  useEffect(() => {
    if (isOpen) {
      const conf = getUnifiedStatus(currentStatus);
      setSelectedStatus(conf.id);
      setSelectedCategory("all");
      setSearchQuery("");
      setFollowUpNote("");
      
      // Auto-suggest follow up based on status
      applyDefaultFollowUp(conf.id);
    }
  }, [isOpen, currentStatus]);

  const applyDefaultFollowUp = (statusId: string) => {
    const conf = getUnifiedStatus(statusId);
    if (statusId === "reply_received") {
      setFollowUpOption("2d");
      setFollowUpNote("Reply received — follow up on conversation / discovery");
    } else if (statusId === "no_reply" || statusId === "contacted") {
      setFollowUpOption("3d");
      setFollowUpNote("Touch sent — check for response / next touch");
    } else if (statusId === "opening_identified" || statusId === "objection") {
      setFollowUpOption("2d");
      setFollowUpNote("Opening / objection — follow up with tailored solution");
    } else if (statusId === "ready_for_call" || statusId === "meeting_booked") {
      setFollowUpOption("1d");
      setFollowUpNote(statusId === "meeting_booked" ? "Prepare meeting deck and confirm timing" : "Execute scheduled outbound call");
    } else if (statusId === "proposal_requested" || statusId === "proposal") {
      setFollowUpOption("2d");
      setFollowUpNote("Follow up on proposal review & commercial sign-off");
    } else {
      setFollowUpOption("none");
      setFollowUpNote("");
    }
  };

  const handleStatusSelect = (statusId: string) => {
    setSelectedStatus(statusId);
    applyDefaultFollowUp(statusId);
  };

  // Helper date calculations
  const getDateFromOption = (opt: "none" | "1d" | "2d" | "3d" | "7d" | "custom"): { dateStr: string | null; label: string } => {
    if (opt === "none") return { dateStr: null, label: "No Follow-Up" };
    if (opt === "custom") {
      if (!customDate) return { dateStr: null, label: "Custom Date" };
      const d = new Date(customDate);
      return { 
        dateStr: customDate, 
        label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) 
      };
    }
    const days = opt === "1d" ? 1 : opt === "2d" ? 2 : opt === "3d" ? 3 : 7;
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return { dateStr, label };
  };

  const currentFollowUp = useMemo(() => getDateFromOption(followUpOption), [followUpOption, customDate]);

  // Filter statuses
  const filteredStatuses = useMemo(() => {
    return UNIFIED_STATUSES.filter((s) => {
      if (selectedCategory !== "all" && s.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.label.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  const handleSave = async () => {
    setSaving(true);
    const targetStatusConfig = getUnifiedStatus(selectedStatus);
    const targetDueDate = currentFollowUp.dateStr;

    try {
      // 1. Update company and schedule follow up
      if (activityId) {
        await updateOutreachStatus(activityId, {
          status: targetStatusConfig.id as any,
          followUpDate: targetDueDate,
          followUpNote: followUpNote || `Follow up with ${companyName} (${targetStatusConfig.label})`,
          followUpChannel,
        });
      }

      await updateLeadStatusAndScheduleFollowUp({
        companyId,
        activityId,
        status: targetStatusConfig.id,
        followUpDate: targetDueDate,
        followUpNote: followUpNote || `Follow up with ${companyName} (${targetStatusConfig.label})`,
        followUpChannel,
      });

      // Dispatch real-time event across the window
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("lead-updated", {
            detail: {
              source: "status_followup_modal",
              companyId,
              status: targetStatusConfig.id,
              followUpDate: targetDueDate,
            },
          })
        );
      }

      if (targetDueDate) {
        addToast(
          "success",
          `Status set to "${targetStatusConfig.label}" & follow-up scheduled for ${currentFollowUp.label}!`
        );
      } else {
        addToast("success", `Status updated to "${targetStatusConfig.label}"`);
      }

      if (onSuccess) {
        onSuccess(targetStatusConfig.id, targetDueDate);
      }

      onClose();
    } catch (err: any) {
      console.error("Failed to update status and schedule follow up:", err);
      addToast("error", err?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                Pipeline Stage & Follow-Up
              </span>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-md border font-mono font-bold", currentConfig.badgeClass)}>
                Current: {currentConfig.label}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5 flex items-center gap-2 truncate">
              {companyName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────────────── */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* STEP 1: Select Unified Status */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-brand-teal text-white flex items-center justify-center text-[10px] font-mono">1</span>
                Select New Status
              </label>
              
              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-semibold">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "outreach", label: "Outreach" },
                    { id: "conversation", label: "Replies" },
                    { id: "pipeline", label: "Pipeline" },
                    { id: "closed", label: "Outcomes" },
                  ] as const
                ).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-md transition-colors cursor-pointer",
                      selectedCategory === cat.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
              {filteredStatuses.map((s) => {
                const isSelected = selectedStatus === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStatusSelect(s.id)}
                    className={cn(
                      "flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition cursor-pointer relative",
                      isSelected
                        ? "border-teal-600 bg-teal-50/70 shadow-xs ring-1 ring-teal-500"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                    )}
                  >
                    <div className={cn("h-2.5 w-2.5 rounded-full mt-1 shrink-0", s.dotColor)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn("text-xs font-bold leading-none truncate", isSelected ? "text-teal-950 font-black" : "text-slate-900")}>
                          {s.label}
                        </span>
                        {isSelected && (
                          <span className="h-4 w-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] shrink-0">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1 leading-snug">
                        {s.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Compound Multi-Action Follow-Up Scheduling */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="h-4 w-4 rounded-full bg-brand-teal text-white flex items-center justify-center text-[10px] font-mono">2</span>
                Schedule Follow-Up Action
              </label>
              {followUpOption !== "none" && (
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CalendarCheck className="h-3 w-3" />
                  Due: {currentFollowUp.label}
                </span>
              )}
            </div>

            {/* Quick Timeline Chips */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { id: "none", label: "None", days: 0 },
                { id: "1d", label: "+1 Day", sub: "Tomorrow" },
                { 
                  id: "2d", 
                  label: "+2 Days", 
                  sub: selectedStatus === "reply_received" ? "⭐ Recommended" : "In 2 days",
                  highlight: selectedStatus === "reply_received" 
                },
                { id: "3d", label: "+3 Days", sub: "In 3 days" },
                { id: "7d", label: "+1 Week", sub: "Next week" },
                { id: "custom", label: "Custom", sub: "Pick date" },
              ].map((chip) => {
                const isActive = followUpOption === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setFollowUpOption(chip.id as any)}
                    className={cn(
                      "flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border text-center transition cursor-pointer relative",
                      isActive
                        ? "border-teal-600 bg-teal-600 text-white shadow-xs font-bold"
                        : (chip as any).highlight
                        ? "border-indigo-400 bg-indigo-50/80 text-indigo-950 font-bold hover:bg-indigo-100"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span className="text-xs font-bold">{chip.label}</span>
                    <span className={cn("text-[9px] mt-0.5 truncate max-w-[80px]", isActive ? "text-teal-100" : (chip as any).highlight ? "text-indigo-600 font-bold" : "text-slate-400")}>
                      {chip.sub}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Date Picker if selected */}
            {followUpOption === "custom" && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 animate-in fade-in duration-100">
                <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Select Due Date</label>
                  <input
                    type="date"
                    value={customDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Follow-up Note & Channel details if follow-up is scheduled */}
            {followUpOption !== "none" && (
              <div className="mt-3 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in duration-100">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 shrink-0">Channel:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { id: "call", label: "Phone Call", icon: Phone },
                      { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                      { id: "instagram_dm", label: "Instagram", icon: Sparkles },
                      { id: "linkedin", label: "LinkedIn", icon: ExternalLink },
                      { id: "email", label: "Email", icon: Mail },
                    ].map((ch) => {
                      const isSel = followUpChannel === ch.id;
                      const Icon = ch.icon;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setFollowUpChannel(ch.id)}
                          className={cn(
                            "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border transition cursor-pointer",
                            isSel
                              ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{ch.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Follow-Up Subject / Note (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Follow up on inquiry / discuss Muscat coffee meeting..."
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    className="text-xs bg-white h-8 border-slate-200"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer Actions ──────────────────────────────────────────────── */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={saving}
            className="text-slate-500 hover:text-slate-800 text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving || (followUpOption === "custom" && !customDate)}
            className="bg-slate-900 hover:bg-black text-white font-bold text-xs h-9 px-4 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            {saving ? (
              <>
                <Clock className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                <span>
                  {followUpOption !== "none"
                    ? `Update to "${getUnifiedStatus(selectedStatus).label}" & Follow Up (${currentFollowUp.label})`
                    : `Update to "${getUnifiedStatus(selectedStatus).label}"`}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
