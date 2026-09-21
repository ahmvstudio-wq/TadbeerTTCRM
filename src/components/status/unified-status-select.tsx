"use client";

import { useState } from "react";
import {
  UNIFIED_STATUSES,
  getUnifiedStatus,
  type UnifiedStatusConfig
} from "@/lib/constants/statuses";
import { StatusFollowUpModal } from "./status-follow-up-modal";
import { updateLeadStatusAndScheduleFollowUp } from "@/lib/actions/companies";
import { cn } from "@/lib/utils";
import { addToast } from "@/components/ui/toast";

interface UnifiedStatusSelectProps {
  status?: string | null;
  companyId: string;
  companyName: string;
  activityId?: string;
  defaultChannel?: string;
  className?: string;
  onStatusChanged?: (newStatus: string, dueDate: string | null) => void;
}

export function UnifiedStatusSelect({
  status,
  companyId,
  companyName,
  activityId,
  defaultChannel,
  className,
  onStatusChanged,
}: UnifiedStatusSelectProps) {
  const currentConfig = getUnifiedStatus(status);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetModalStatus, setTargetModalStatus] = useState<string>(currentConfig.id);

  const handleChange = async (newStatusId: string) => {
    // If user picks a status that benefits from immediate follow-up scheduling (e.g. reply_received, no_reply, opening_identified):
    // Open the compound modal so they can confirm +2d or +3d with 1 click!
    if (["reply_received", "no_reply", "opening_identified", "proposal_requested", "coffee_invited"].includes(newStatusId)) {
      setTargetModalStatus(newStatusId);
      setModalOpen(true);
      return;
    }

    // Otherwise, perform direct update
    try {
      await updateLeadStatusAndScheduleFollowUp({
        companyId,
        activityId,
        status: newStatusId,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("lead-updated", {
            detail: {
              source: "status_select",
              companyId,
              status: newStatusId,
            },
          })
        );
      }

      addToast("success", `Status updated to "${getUnifiedStatus(newStatusId).label}"`);
      if (onStatusChanged) {
        onStatusChanged(newStatusId, null);
      }
    } catch (err: any) {
      console.error("Status update error:", err);
      addToast("error", err?.message || "Failed to update status");
    }
  };

  return (
    <>
      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <select
          value={currentConfig.id}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            "text-[10px] font-mono font-bold rounded-lg px-2 py-1 border transition-all cursor-pointer shadow-2xs",
            currentConfig.badgeClass,
            className
          )}
        >
          <optgroup label="Outreach & Cold" className="bg-white text-slate-900 font-bold font-sans">
            {UNIFIED_STATUSES.filter(s => s.category === "outreach").map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </optgroup>

          <optgroup label="Conversations & Replies" className="bg-white text-slate-900 font-bold font-sans">
            {UNIFIED_STATUSES.filter(s => s.category === "conversation").map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </optgroup>

          <optgroup label="Pipeline, Calls & Deals" className="bg-white text-slate-900 font-bold font-sans">
            {UNIFIED_STATUSES.filter(s => s.category === "pipeline").map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </optgroup>

          <optgroup label="Outcomes & Snoozed" className="bg-white text-slate-900 font-bold font-sans">
            {UNIFIED_STATUSES.filter(s => s.category === "closed").map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </optgroup>
        </select>

        {/* Quick follow-up trigger button */}
        <button
          type="button"
          onClick={() => {
            setTargetModalStatus(currentConfig.id);
            setModalOpen(true);
          }}
          title="Schedule Follow-Up or change status with custom follow-up"
          className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition cursor-pointer"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </button>
      </div>

      {modalOpen && (
        <StatusFollowUpModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          companyId={companyId}
          companyName={companyName}
          currentStatus={targetModalStatus}
          activityId={activityId}
          defaultChannel={defaultChannel}
          onSuccess={(newStatus, dueDate) => {
            if (onStatusChanged) {
              onStatusChanged(newStatus, dueDate);
            }
          }}
        />
      )}
    </>
  );
}
