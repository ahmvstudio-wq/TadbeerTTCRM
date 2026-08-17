"use client";

import { useState } from "react";
import {
  Clock,
  Phone,
  MessageCircle,
  Mail,
  Camera,
  Globe2,
  Calendar,
  FileText,
  User,
  Plus,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { Activity, FollowUp, Meeting } from "@/lib/types/database";
import { addCompanyActivity } from "@/lib/actions/companies";

interface ActivityTimelineProps {
  companyId: string;
  activities: Activity[];
  followUps?: FollowUp[];
  meetings?: Meeting[];
  touches?: any[];
  onRefresh?: () => void;
}

export function ActivityTimeline({
  companyId,
  activities,
  followUps = [],
  meetings = [],
  touches = [],
  onRefresh
}: ActivityTimelineProps) {
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [filterChannel, setFilterChannel] = useState<string>("all");

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    await addCompanyActivity(
      companyId,
      "Note Added",
      newNote.trim(),
      "note_added"
    );
    setNewNote("");
    setAddingNote(false);
    if (onRefresh) onRefresh();
  };

  // Combine activities, follow-ups, meetings, touches into a single timeline feed
  const timelineItems: Array<{
    id: string;
    date: string;
    type: string;
    title: string;
    description: string;
    user: string;
    channel?: string;
    icon: any;
    color: string;
  }> = [];

  // 1. Standard activities
  activities.forEach((act) => {
    let icon = FileText;
    let color = "bg-slate-100 text-slate-700 border-slate-200";

    if (act.activity_type.includes("call") || act.title.toLowerCase().includes("call")) {
      icon = Phone;
      color = "bg-emerald-100 text-emerald-800 border-emerald-300";
    } else if (act.activity_type.includes("whatsapp") || act.title.toLowerCase().includes("whatsapp")) {
      icon = MessageCircle;
      color = "bg-emerald-100 text-emerald-800 border-emerald-300";
    } else if (act.activity_type.includes("email") || act.title.toLowerCase().includes("email")) {
      icon = Mail;
      color = "bg-indigo-100 text-indigo-800 border-indigo-300";
    } else if (act.activity_type.includes("instagram") || act.title.toLowerCase().includes("instagram")) {
      icon = Camera;
      color = "bg-pink-100 text-pink-800 border-pink-300";
    } else if (act.activity_type.includes("linkedin") || act.title.toLowerCase().includes("linkedin")) {
      icon = Globe2;
      color = "bg-blue-100 text-blue-800 border-blue-300";
    } else if (act.activity_type.includes("meeting") || act.title.toLowerCase().includes("meeting")) {
      icon = Calendar;
      color = "bg-purple-100 text-purple-800 border-purple-300";
    }

    timelineItems.push({
      id: act.id,
      date: act.created_at,
      type: act.activity_type,
      title: act.title,
      description: act.description || "",
      user: (act as any).user?.full_name || "Team Member",
      channel: (act as any).metadata?.channel || undefined,
      icon,
      color
    });
  });

  // 2. Outreach touches
  touches.forEach((touch) => {
    timelineItems.push({
      id: touch.id,
      date: touch.sent_at || touch.created_at,
      type: `touch_${touch.channel}`,
      title: `${touch.channel.toUpperCase()} Outreach Sent`,
      description: touch.message || touch.response || "Outreach touchpoint logged.",
      user: touch.sent_by || "Sales Rep",
      channel: touch.channel,
      icon: touch.is_call ? Phone : Send,
      color: "bg-teal-100 text-teal-900 border-teal-300"
    });
  });

  // 3. Follow-ups
  followUps.forEach((fu) => {
    timelineItems.push({
      id: fu.id,
      date: fu.created_at,
      type: "follow_up",
      title: `Follow-Up: ${fu.subject}`,
      description: `${fu.description || "Scheduled follow-up"} (Due: ${fu.due_date} ${fu.due_time || ""}) - Status: ${fu.status.toUpperCase()}`,
      user: "Assigned Rep",
      channel: fu.channel,
      icon: Clock,
      color: fu.status === "completed" ? "bg-emerald-100 text-emerald-900 border-emerald-300" : "bg-amber-100 text-amber-900 border-amber-300"
    });
  });

  // 4. Meetings
  meetings.forEach((m) => {
    timelineItems.push({
      id: m.id,
      date: m.created_at || m.meeting_date,
      type: "meeting",
      title: `Meeting: ${m.title}`,
      description: `${m.description || "Scheduled Meeting"} - Date: ${m.meeting_date} (Status: ${m.status})`,
      user: "Closer",
      icon: Calendar,
      color: "bg-purple-100 text-purple-900 border-purple-300"
    });
  });

  // Sort descending by date
  timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter by channel if selected
  const filteredItems = filterChannel === "all"
    ? timelineItems
    : timelineItems.filter(item => item.channel === filterChannel || item.type.toLowerCase().includes(filterChannel));

  return (
    <div className="space-y-4 font-sans">
      {/* ── Add Note Quick Input ────────────────────────────────────────── */}
      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
        <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center justify-between">
          <span>Log Activity Note</span>
          <span className="text-[10px] text-slate-500 font-normal">Notes are saved permanently in lead history</span>
        </label>
        <div className="flex gap-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Type notes from phone call, WhatsApp reply, key insight, or internal update..."
            className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 resize-none h-16"
          />
          <button
            onClick={handleAddNote}
            disabled={addingNote || !newNote.trim()}
            className="px-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-xs flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {addingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 text-teal-400" />}
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* ── Filter Ribbon ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Complete Relationship History ({filteredItems.length})
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          {["all", "phone", "whatsapp", "linkedin", "instagram", "email", "meeting"].map((ch) => (
            <button
              key={ch}
              onClick={() => setFilterChannel(ch)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold capitalize cursor-pointer transition-all ${
                filterChannel === ch
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* ── Timeline List ──────────────────────────────────────────────── */}
      {filteredItems.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500">No interaction history recorded yet.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Use quick contact actions or add a note above to record touches.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const dateStr = new Date(item.date).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            });

            return (
              <div key={item.id} className="relative group">
                {/* Timeline Bullet Node */}
                <div className={`absolute -left-[23px] top-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] shadow-2xs ${item.color}`}>
                  <Icon className="h-3 w-3" />
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:border-slate-300 transition-all space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{item.title}</span>
                      {item.channel && (
                        <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-md bg-slate-100 text-slate-700">
                          {item.channel}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{dateStr}</span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 mt-2">
                    <span className="flex items-center gap-1 font-semibold">
                      <User className="h-2.5 w-2.5" /> {item.user}
                    </span>
                    <span className="capitalize font-mono text-[9px]">{item.type.replace(/_/g, " ")}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
