"use client";

import { useState } from "react";
import { ChevronDown, Calendar, Clock } from "lucide-react";
import { getUnifiedStatus, type UnifiedStatusConfig } from "@/lib/constants/statuses";
import { StatusFollowUpModal } from "./status-follow-up-modal";
import { cn } from "@/lib/utils";

interface UnifiedStatusBadgeProps {
  status?: string | null;
  companyId: string;
  companyName: string;
  activityId?: string;
  defaultChannel?: string;
  className?: string;
  showFollowUpTrigger?: boolean;
  onStatusChanged?: (newStatus: string, dueDate: string | null) => void;
}

export function UnifiedStatusBadge({
  status,
  companyId,
  companyName,
  activityId,
  defaultChannel,
  className,
  showFollowUpTrigger = true,
  onStatusChanged,
}: UnifiedStatusBadgeProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const config = getUnifiedStatus(status);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setModalOpen(true);
        }}
        title="Click to change status or schedule follow-up"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold font-mono transition-all duration-150 cursor-pointer shadow-2xs hover:brightness-95 hover:shadow-xs group",
          config.badgeClass,
          className
        )}
      >
        <span className={cn("h-2 w-2 rounded-full shrink-0", config.dotColor)} />
        <span className="truncate max-w-[130px]">{config.label}</span>
        <ChevronDown className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
      </button>

      {modalOpen && (
        <StatusFollowUpModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          companyId={companyId}
          companyName={companyName}
          currentStatus={config.id}
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
