"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  Phone,
  MessageCircle,
  Mail,
  Loader2,
  AlertCircle
} from "lucide-react";
import { FollowUp, Meeting } from "@/lib/types/database";
import { createFollowUp, completeFollowUp } from "@/lib/actions/followups";
import { bookMeeting } from "@/lib/actions/meetings";

interface LeadTasksManagerProps {
  companyId: string;
  contactId?: string;
  followUps: FollowUp[];
  meetings: Meeting[];
  onRefresh?: () => void;
}

export function LeadTasksManager({
  companyId,
  contactId,
  followUps = [],
  meetings = [],
  onRefresh
}: LeadTasksManagerProps) {
  const [taskType, setTaskType] = useState<"follow_up" | "meeting">("follow_up");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [channel, setChannel] = useState("call");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!subject.trim() || !dueDate) return;
    setCreating(true);

    if (taskType === "follow_up") {
      await createFollowUp({
        company_id: companyId,
        contact_id: contactId,
        subject: subject.trim(),
        due_date: dueDate,
        due_time: dueTime || undefined,
        channel,
        description: description.trim() || undefined
      });
    } else {
      await bookMeeting({
        company_id: companyId,
        contact_id: contactId,
        title: subject.trim(),
        meeting_date: `${dueDate}T${dueTime || "10:00"}:00`,
        duration_minutes: 30,
        description: description.trim() || undefined
      });
    }

    setSubject("");
    setDueDate("");
    setDueTime("");
    setDescription("");
    setCreating(false);
    if (onRefresh) onRefresh();
  };

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    await completeFollowUp(id, "Completed directly from Lead Workspace");
    setCompletingId(null);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600" />
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Next Actions, Follow-ups & Meetings
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-medium">
          Surfaced automatically on Daily Dashboard
        </span>
      </div>

      {/* ── Action Creation Form ────────────────────────────────────────── */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center gap-3 border-b border-slate-200/80 pb-2">
          <span className="text-[10px] font-black text-slate-700 uppercase">Action Type:</span>
          <button
            onClick={() => setTaskType("follow_up")}
            className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
              taskType === "follow_up"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            Follow-Up / Task
          </button>
          <button
            onClick={() => setTaskType("meeting")}
            className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
              taskType === "meeting"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white border border-slate-200 text-slate-600"
            }`}
          >
            Schedule Meeting
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">
              {taskType === "follow_up" ? "Action Subject / Goal" : "Meeting Title"}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={taskType === "follow_up" ? "e.g. Call tomorrow regarding proposal" : "e.g. 15-min Solution Demo"}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Preferred Channel</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-2 font-medium cursor-pointer"
            >
              <option value="call">Cold Call / Phone</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add optional notes or objective for this next step..."
            className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs font-medium"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !subject.trim() || !dueDate}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 text-teal-400" />}
            Schedule
          </button>
        </div>
      </div>

      {/* ── Pending Tasks & Scheduled Meetings List ────────────────────── */}
      <div className="space-y-2">
        <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider block">
          Scheduled Tasks & Meetings ({followUps.length + meetings.length})
        </span>

        {followUps.length === 0 && meetings.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2 text-center bg-slate-50 rounded-xl border border-slate-200/60">
            No pending follow-ups or meetings scheduled for this lead.
          </p>
        ) : (
          <div className="space-y-2">
            {followUps.map((fu) => (
              <div
                key={fu.id}
                className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    fu.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-slate-900 block truncate">{fu.subject}</span>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      Due: {fu.due_date} {fu.due_time || ""} • Channel: <span className="uppercase font-mono text-[10px]">{fu.channel}</span>
                    </p>
                  </div>
                </div>

                {fu.status === "pending" && (
                  <button
                    onClick={() => handleComplete(fu.id)}
                    disabled={completingId === fu.id}
                    className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-[11px] rounded-lg cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Done
                  </button>
                )}
              </div>
            ))}

            {meetings.map((m) => (
              <div
                key={m.id}
                className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-purple-200 text-purple-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-purple-950 block truncate">Meeting: {m.title}</span>
                    <p className="text-[11px] text-purple-800 font-medium truncate">
                      Date: {m.meeting_date} (Duration: {m.duration_minutes} mins)
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-purple-200 text-purple-950 font-black text-[10px] uppercase rounded-lg">
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
