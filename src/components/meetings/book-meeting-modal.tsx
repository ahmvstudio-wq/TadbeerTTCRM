"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Phone,
  Coffee,
  Building2,
  Check,
  X,
  Loader2,
  Sparkles,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { addToast } from "@/components/ui/toast";
import { CRMCache } from "@/lib/cache/crm-cache";
import { bookMeeting } from "@/lib/actions/meetings";

interface BookMeetingModalProps {
  isOpen: boolean;
  companyId: string;
  companyName: string;
  contactId?: string;
  contactName?: string;
  contactPhone?: string;
  initialDate?: string;
  initialTime?: string;
  onClose: () => void;
  onSuccess?: (meeting: any) => void;
}

const MEETING_TYPES = [
  { id: "in_person", label: "In-Person", icon: Building2, desc: "Office or client location" },
  { id: "video", label: "Google Meet", icon: Video, desc: "Virtual demo / video call" },
  { id: "phone", label: "Phone Call", icon: Phone, desc: "Direct voice call" },
  { id: "coffee", label: "Coffee Invite", icon: Coffee, desc: "Casual discovery chat" },
];

const DURATION_OPTIONS = [15, 30, 45, 60];

export function BookMeetingModal({
  isOpen,
  companyId,
  companyName,
  contactId,
  contactName,
  contactPhone,
  initialDate,
  initialTime = "10:00",
  onClose,
  onSuccess,
}: BookMeetingModalProps) {
  // Tomorrow's date as default
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const [date, setDate] = useState(() => initialDate || getTomorrowStr());
  const [time, setTime] = useState(initialTime);
  const [title, setTitle] = useState(`Discovery Meeting with ${companyName}`);
  const [meetingType, setMeetingType] = useState<string>("in_person");
  const [duration, setDuration] = useState<number>(30);
  const [location, setLocation] = useState("Muscat Office / Client Location");
  const [description, setDescription] = useState("Review workforce & operational workflow, present Tadbeer solutions.");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleShortcut = (daysAhead: number, targetTime: string) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setDate(d.toISOString().split("T")[0]);
    setTime(targetTime);
  };

  const handleConfirm = async () => {
    if (!title.trim() || !date || !time) {
      addToast("error", "Please specify the meeting title, date, and time.");
      return;
    }

    setSaving(true);
    try {
      const fullIsoDate = new Date(`${date}T${time}:00`).toISOString();

      const res = await bookMeeting({
        company_id: companyId,
        contact_id: contactId,
        title: title.trim(),
        meeting_date: fullIsoDate,
        duration_minutes: duration,
        meeting_type: meetingType,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
      });

      if (res.error) {
        addToast("error", res.error);
        setSaving(false);
        return;
      }

      // Universal client cache invalidation
      CRMCache.invalidate("meetings");
      CRMCache.invalidate("pipeline");
      CRMCache.invalidate("outreach");
      CRMCache.invalidate("cadence");

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("lead-updated", {
            detail: {
              source: "book_meeting_modal",
              companyId,
              status: "meeting_booked",
              meetingDate: fullIsoDate,
            },
          })
        );
        window.dispatchEvent(new CustomEvent("meetings-updated"));
        window.dispatchEvent(
          new CustomEvent("outreach-imported", {
            detail: { date },
          })
        );
      }

      const formattedReadable = new Date(`${date}T${time}:00`).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

      addToast("success", `Meeting booked with ${companyName} on ${formattedReadable}!`);

      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err: any) {
      addToast("error", err?.message || "Failed to book meeting");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0">
      <div
        className="bg-white rounded-3xl border border-neutral-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-900 border border-purple-200 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-neutral-900 tracking-tight">
                Schedule Meeting & Set Date/Time
              </h2>
              <p className="text-[11px] text-neutral-500 font-light truncate max-w-[280px]">
                {companyName} {contactName ? `· ${contactName}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-700 flex items-center justify-center cursor-pointer transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Title */}
          <div>
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Meeting Title / Purpose *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Discovery Meeting & Presentation"
              className="h-9 text-xs font-medium rounded-xl border-neutral-200 bg-neutral-50/50 focus:bg-white"
            />
          </div>

          {/* Date & Time Picker */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">
                Meeting Date & Time *
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">Gulf Standard Time (GST)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9 text-xs rounded-xl border-neutral-200 bg-white"
                />
              </div>
              <div className="relative">
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-9 text-xs rounded-xl border-neutral-200 bg-white"
                />
              </div>
            </div>

            {/* Quick Timing Shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[10px] font-mono text-neutral-400">Quick:</span>
              <button
                type="button"
                onClick={() => handleShortcut(1, "10:00")}
                className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
              >
                Tomorrow 10 AM
              </button>
              <button
                type="button"
                onClick={() => handleShortcut(1, "14:00")}
                className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
              >
                Tomorrow 2 PM
              </button>
              <button
                type="button"
                onClick={() => handleShortcut(2, "11:00")}
                className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
              >
                +2 Days 11 AM
              </button>
              <button
                type="button"
                onClick={() => handleShortcut(3, "10:00")}
                className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
              >
                +3 Days 10 AM
              </button>
            </div>
          </div>

          {/* Meeting Format */}
          <div>
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">
              Meeting Format / Channel
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MEETING_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = meetingType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setMeetingType(t.id);
                      if (t.id === "video" && (!location || location.includes("Muscat"))) {
                        setLocation("Google Meet (link to be shared)");
                      } else if (t.id === "in_person" && location.includes("Google Meet")) {
                        setLocation("Client Office / Muscat");
                      }
                    }}
                    className={cn(
                      "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2",
                      isSelected
                        ? "bg-purple-50/80 border-purple-400 text-purple-950 shadow-2xs"
                        : "bg-white hover:bg-neutral-50 border-neutral-200 text-neutral-700"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", isSelected ? "text-purple-700" : "text-neutral-400")} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-none">{t.label}</p>
                      <p className="text-[10px] text-neutral-400 leading-tight mt-0.5 truncate">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Duration
              </label>
              <div className="flex items-center gap-1">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                      duration === d
                        ? "bg-black text-white border-black"
                        : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300"
                    )}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                Location or Video Link
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Office, Meet link, Cafe..."
                className="h-9 text-xs rounded-xl border-neutral-200 bg-neutral-50/50 focus:bg-white"
              />
            </div>
          </div>

          {/* Agenda / Notes */}
          <div>
            <label className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider block mb-1">
              Agenda & Discovery Notes
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What topics will be covered in this meeting?"
              rows={2}
              className="text-xs rounded-xl border-neutral-200 bg-neutral-50/50 focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-xs text-neutral-500 hover:text-black cursor-pointer rounded-xl"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="bg-black hover:bg-neutral-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Confirm & Sync to Meetings Tab
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
