"use client";

import { useState } from "react";
import { ChevronDown, Calendar, Clock } from "lucide-react";
import { getUnifiedStatus, type UnifiedStatusConfig } from "@/lib/constants/statuses";
import { StatusFollowUpModal } from "./status-follow-up-modal";
import { cn } from "@/lib/utils";

interface UnifiedStatusBadgeProps {
  status?: string | null;
  statuses?: string[];
  companyId: string;
  companyName: string;
  activityId?: string;
  defaultChannel?: string;
  className?: string;
  showFollowUpTrigger?: boolean;
  onStatusChanged?: (newStatus: string, dueDate: string | null, newStatuses?: string[]) => void;
}

export function UnifiedStatusBadge({
  status,
  statuses,
  companyId,
  companyName,
  activityId,
  defaultChannel,
  className,
  showFollowUpTrigger = true,
  onStatusChanged,
}: UnifiedStatusBadgeProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const activeList = (statuses && statuses.length > 0) ? statuses : (status ? [status] : ['prospect']);
  const primaryConfig = getUnifiedStatus(activeList[0] || status);

  return (
    <>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setModalOpen(true);
        }}
        title="Click to change status or schedule follow-up"
        className="flex flex-wrap items-center gap-1 cursor-pointer group max-w-[280px]"
      >
        {activeList.slice(0, 2).map((stId, idx) => {
          const cfg = getUnifiedStatus(stId);
          return (
            <span
              key={stId + idx}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold font-mono transition-all duration-150 shadow-2xs hover:brightness-95 group-hover:border-slate-400",
                cfg.badgeClass,
                className
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dotColor)} />
              <span className="truncate max-w-[120px]">{cfg.shortLabel || cfg.label}</span>
              {idx === 0 && activeList.length === 1 && (
                <ChevronDown className="h-2.5 w-2.5 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
            </span>
          );
        })}
        {activeList.length > 2 && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            +{activeList.length - 2}
          </span>
        )}
        {activeList.length > 1 && (
          <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 text-slate-500 shrink-0" />
        )}
      </div>

      {modalOpen && (
        <StatusFollowUpModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          companyId={companyId}
          companyName={companyName}
          currentStatus={primaryConfig.id}
          currentStatuses={activeList}
          activityId={activityId}
          defaultChannel={defaultChannel}
          onSuccess={(newStatus, dueDate, newStatuses) => {
            if (onStatusChanged) {
              onStatusChanged(newStatus, dueDate, newStatuses);
            }
          }}
        />
      )}
    </>
  );
}
