"use client";

import { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  X,
  Check,
  Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  type DateFilterShortcut,
  type ResolvedDateRange,
  resolveDateRange,
  formatFriendlyDate,
  toDateString
} from "@/lib/date-utils";

interface DateRangeFilterProps {
  value: string; // e.g. "all", "today", "yesterday", "week", "month", "last_30_days", "2026-09-30", "2026-09-01:2026-09-30"
  onChange: (newValue: string, resolved: ResolvedDateRange) => void;
  className?: string;
  showShortcutsInline?: boolean;
}

const SHORTCUT_PRESETS: { id: DateFilterShortcut; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "last_30_days", label: "Last 30 Days" },
  { id: "quarter", label: "This Quarter" },
  { id: "all", label: "All Time" }
];

export function DateRangeFilter({
  value,
  onChange,
  className,
  showShortcutsInline = true
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolved current range
  const resolved = resolveDateRange(value);

  // Custom picker state
  const [customStart, setCustomStart] = useState<string>(resolved.startDate || "");
  const [customEnd, setCustomEnd] = useState<string>(resolved.endDate || "");
  const [singleDate, setSingleDate] = useState<string>(
    resolved.startDate === resolved.endDate && resolved.startDate ? resolved.startDate : ""
  );

  // Sync inputs when external value changes
  useEffect(() => {
    const res = resolveDateRange(value);
    setCustomStart(res.startDate || "");
    setCustomEnd(res.endDate || "");
    if (res.startDate === res.endDate && res.startDate) {
      setSingleDate(res.startDate);
    } else {
      setSingleDate("");
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleShortcutSelect = (shortcut: DateFilterShortcut) => {
    const newRes = resolveDateRange(shortcut);
    onChange(shortcut, newRes);
    setIsOpen(false);
  };

  const handleApplyCustomRange = () => {
    if (!customStart && !customEnd) {
      handleShortcutSelect("all");
      return;
    }

    const start = customStart || customEnd;
    const end = customEnd || customStart;

    if (start === end) {
      const newRes = resolveDateRange(start);
      onChange(start, newRes);
    } else {
      const rangeStr = `${start}:${end}`;
      const newRes = resolveDateRange(rangeStr);
      onChange(rangeStr, newRes);
    }
    setIsOpen(false);
  };

  const handleApplySingleDate = (d: string) => {
    setSingleDate(d);
    if (d) {
      const newRes = resolveDateRange(d);
      onChange(d, newRes);
      setIsOpen(false);
    }
  };

  const isCustomActive = resolved.shortcut === "custom";

  return (
    <div ref={containerRef} className={cn("relative inline-flex items-center gap-1.5", className)}>
      {/* Inline shortcut strip (optional) */}
      {showShortcutsInline && (
        <div className="hidden lg:flex items-center gap-1 bg-neutral-100/80 p-0.5 rounded-xl border border-black/[0.04] text-[11px] font-medium">
          {SHORTCUT_PRESETS.map((p) => {
            const isActive = resolved.shortcut === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleShortcutSelect(p.id)}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                  isActive
                    ? "bg-white text-black font-semibold shadow-2xs"
                    : "text-neutral-500 hover:text-black hover:bg-white/50"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Trigger Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all border shadow-2xs cursor-pointer",
          isCustomActive || value !== "all"
            ? "bg-black text-white border-black font-medium"
            : "bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200"
        )}
      >
        <CalendarIcon className="h-3.5 w-3.5 opacity-80" />
        <span className="font-medium whitespace-nowrap">
          {resolved.label}
        </span>
        <ChevronDown className={cn("h-3 w-3 opacity-60 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Active Range Clear Button */}
      {value !== "all" && (
        <button
          type="button"
          onClick={() => handleShortcutSelect("all")}
          className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
          title="Reset to All Time"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 w-72 sm:w-80 bg-white/95 backdrop-blur-2xl rounded-2xl border border-black/[0.08] shadow-2xl p-4 text-xs font-body animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-black/[0.04]">
            <span className="font-semibold text-neutral-900 font-display">Date Filter & Ranges</span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {resolved.label}
            </span>
          </div>

          {/* Quick Preset Grid */}
          <div className="mb-4">
            <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider block mb-1.5 font-mono">
              Quick Shortcuts
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {SHORTCUT_PRESETS.map((p) => {
                const isActive = resolved.shortcut === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleShortcutSelect(p.id)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-xl text-left text-xs transition-all flex items-center justify-between cursor-pointer border",
                      isActive
                        ? "bg-black text-white border-black font-medium shadow-xs"
                        : "bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200/60"
                    )}
                  >
                    <span>{p.label}</span>
                    {isActive && <Check className="h-3 w-3 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single Specific Day */}
          <div className="mb-4 pt-3 border-t border-black/[0.04]">
            <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider block mb-1.5 font-mono">
              Particular Single Day
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={singleDate}
                onChange={(e) => handleApplySingleDate(e.target.value)}
                className="h-8 text-xs bg-neutral-50 rounded-xl"
              />
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="pt-3 border-t border-black/[0.04]">
            <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider block mb-1.5 font-mono">
              Custom Date Range
            </span>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5 font-light">Start Date</label>
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="h-8 text-xs bg-neutral-50 rounded-xl"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5 font-light">End Date</label>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="h-8 text-xs bg-neutral-50 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-7 text-xs text-neutral-500 hover:text-black cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!customStart && !customEnd}
                onClick={handleApplyCustomRange}
                className="h-7 text-xs bg-black text-white hover:bg-neutral-800 cursor-pointer"
              >
                Apply Range
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
