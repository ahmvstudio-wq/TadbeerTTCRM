"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ToastContainer, addToast } from "@/components/ui/toast";
import { exportToCsv } from "@/lib/export-csv";
import {
  MessageCircle, ExternalLink, Mail, Phone, Calendar, Clock, CheckCircle,
  XCircle, AlertTriangle, Send, Copy, Eye, Plus, Trash2, History,
  ArrowRight, ChevronDown, ChevronRight, Loader2, Bell, Users, Filter,
} from "lucide-react";
import { CHANNEL_RULES, type MessageTemplate, fillTemplate, PLACEHOLDERS } from "@/lib/outreach-templates";

// ─── Types ──────────────────────────────────────────────────────────
interface OutreachEntry {
  id: string;
  lead_id: string;
  company_name: string;
  contact_name: string;
  contact_title: string;
  channel: string;
  step_number: number;
  message: string;
  status: "pending" | "sent" | "replied" | "no_response" | "interested" | "not_interested";
  sent_at: string;
  response_received: boolean;
  response_notes: string;
  next_action: string;
  next_action_date: string;
  follow_up_scheduled: boolean;
  template_id: string;
}

interface DailyOutreach {
  date: string;
  entries: OutreachEntry[];
  total_sent: number;
  total_replies: number;
  by_channel: Record<string, { sent: number; replies: number }>;
}

// ─── Channel Config ─────────────────────────────────────────────────
const CHANNEL_ICONS: Record<string, React.ElementType> = {
  whatsapp: MessageCircle, linkedin: ExternalLink, email: Mail,
  call: Phone, meeting: Calendar,
};

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-700 border-green-200",
  linkedin: "bg-blue-100 text-blue-700 border-blue-200",
  email: "bg-slate-100 text-slate-700 border-slate-200",
  call: "bg-amber-100 text-amber-700 border-amber-200",
  meeting: "bg-purple-100 text-purple-700 border-purple-200",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-600", sent: "bg-blue-100 text-blue-600",
  replied: "bg-green-100 text-green-600", no_response: "bg-amber-100 text-amber-600",
  interested: "bg-emerald-100 text-emerald-600", not_interested: "bg-red-100 text-red-600",
};

// ─── Main Component ─────────────────────────────────────────────────
export function DailyOutreachTracker({ leads, templates, channel, onEntry }: {
  leads: any[]; templates: MessageTemplate[]; channel: string;
  onEntry?: (entry: OutreachEntry) => void;
}) {
  const [entries, setEntries] = useState<OutreachEntry[]>([]);
  const [selectedLead, setSelectedLead] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [messageText, setMessageText] = useState("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [responseDialog, setResponseDialog] = useState<{ open: boolean; entry: OutreachEntry | null }>({ open: false, entry: null });
  const [responseNotes, setResponseNotes] = useState("");
  const [responseStatus, setResponseStatus] = useState("replied");

  const rules = CHANNEL_RULES[channel as keyof typeof CHANNEL_RULES] || CHANNEL_RULES.whatsapp;
  const channelTemplates = templates.filter((t) => t.channel === channel);
  const ChannelIcon = CHANNEL_ICONS[channel] || Send;

  const todayEntries = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return entries.filter((e) => e.sent_at.startsWith(today));
  }, [entries]);

  const stats = useMemo(() => ({
    sent: todayEntries.filter((e) => e.status !== "pending").length,
    replies: todayEntries.filter((e) => ["replied", "interested"].includes(e.status)).length,
    pending: todayEntries.filter((e) => e.status === "pending").length,
    responseRate: todayEntries.length > 0
      ? Math.round((todayEntries.filter((e) => ["replied", "interested"].includes(e.status)).length / todayEntries.filter((e) => e.status !== "pending").length) * 100) || 0
      : 0,
  }), [todayEntries]);

  const handleSelectLead = (leadId: string) => {
    setSelectedLead(leadId);
    const lead = leads.find((l) => l.id === leadId);
    if (lead && selectedTemplate) {
      const template = channelTemplates.find((t) => t.id === selectedTemplate);
      if (template) {
        const contact = lead.contacts?.[0];
        const filled = fillTemplate(template.body, {
          "{name}": contact?.full_name || lead.contact_name || "",
          "{first_name}": (contact?.full_name || lead.contact_name || "").split(" ")[0],
          "{company}": lead.company_name,
          "{title}": contact?.title || lead.job_title || "",
          "{industry}": lead.industry || "",
          "{city}": lead.city || "",
          "{country}": lead.country || "",
          "{service}": "our services",
          "{use_case}": "",
          "{bdm}": lead.assigned_bdm || "Your team",
          "{date}": new Date().toLocaleDateString(),
          "{referral_name}": "",
        });
        setMessageText(filled);
      }
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = channelTemplates.find((t) => t.id === templateId);
    if (template && selectedLead) {
      const lead = leads.find((l) => l.id === selectedLead);
      if (lead) {
        const contact = lead.contacts?.[0];
        const filled = fillTemplate(template.body, {
          "{name}": contact?.full_name || lead.contact_name || "",
          "{first_name}": (contact?.full_name || lead.contact_name || "").split(" ")[0],
          "{company}": lead.company_name,
          "{title}": contact?.title || lead.job_title || "",
          "{industry}": lead.industry || "",
          "{city}": lead.city || "",
          "{country}": lead.country || "",
          "{service}": "our services",
          "{use_case}": "",
          "{bdm}": lead.assigned_bdm || "Your team",
          "{date}": new Date().toLocaleDateString(),
          "{referral_name}": "",
        });
        setMessageText(filled);
      }
    }
  };

  const handleSend = () => {
    if (!selectedLead || !messageText.trim()) return;
    const lead = leads.find((l) => l.id === selectedLead);
    if (!lead) return;
    const contact = lead.contacts?.[0];
    const existingSteps = entries.filter((e) => e.lead_id === selectedLead && e.channel === channel).length;

    const newEntry: OutreachEntry = {
      id: String(Date.now()),
      lead_id: selectedLead,
      company_name: lead.company_name,
      contact_name: contact?.full_name || lead.contact_name || "",
      contact_title: contact?.title || lead.job_title || "",
      channel,
      step_number: existingSteps + 1,
      message: messageText,
      status: "sent",
      sent_at: new Date().toISOString(),
      response_received: false,
      response_notes: "",
      next_action: `Follow up in ${rules.follow_up_interval_days} days`,
      next_action_date: new Date(Date.now() + rules.follow_up_interval_days * 86400000).toISOString().split("T")[0],
      follow_up_scheduled: true,
      template_id: selectedTemplate,
    };

    setEntries((prev) => [newEntry, ...prev]);
    onEntry?.(newEntry);

    // Open respective channel app
    const phone = (lead.phone || contact?.phone || "").replace(/\D/g, "");
    const email = lead.email || contact?.email || "";
    const encodedMessage = encodeURIComponent(messageText);

    if (channel === "whatsapp" && phone) {
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
    } else if (channel === "linkedin" && lead.linkedin_url) {
      const url = lead.linkedin_url.startsWith("http") ? lead.linkedin_url : `https://linkedin.com${lead.linkedin_url}`;
      window.open(url, "_blank");
    } else if (channel === "email" && email) {
      const subject = encodeURIComponent(`Partnership Opportunity — Tadbeer Transformations`);
      window.open(`mailto:${email}?subject=${subject}&body=${encodedMessage}`, "_blank");
    } else if (channel === "call" && phone) {
      window.open(`tel:${phone}`, "_blank");
    } else if (channel === "meeting") {
      window.open(`https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(`Meeting with ${newEntry.contact_name}`)}&details=${encodedMessage}`, "_blank");
    }

    setSelectedLead("");
    setSelectedTemplate("");
    setMessageText("");
    setSendDialogOpen(false);
    addToast("success", `Opening ${rules.name} for ${newEntry.contact_name}`);
  };

  const handleLogResponse = (entryId: string) => {
    setEntries((prev) => prev.map((e) =>
      e.id === entryId ? { ...e, status: responseStatus as any, response_received: true, response_notes: responseNotes } : e
    ));
    setResponseDialog({ open: false, entry: null });
    setResponseNotes("");
    addToast("success", "Response logged");
  };

  const handleExport = () => {
    exportToCsv(entries.map((e) => ({
      date: e.sent_at.split("T")[0], company: e.company_name, contact: e.contact_name,
      channel: e.channel, step: e.step_number, status: e.status,
      message_preview: e.message.substring(0, 100), response: e.response_notes,
      next_action: e.next_action, next_date: e.next_action_date,
    })), `${channel}-outreach-${new Date().toISOString().split("T")[0]}.csv`);
    addToast("success", "Outreach history exported");
  };

  return (
    <div className="space-y-4">
      <ToastContainer />

      {/* Daily Stats */}
      <div className="grid grid-cols-4 gap-3 stagger-children">
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-brand-teal">{stats.sent}</p>
          <p className="text-[10px] text-text-muted">Sent Today</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-green-600">{stats.replies}</p>
          <p className="text-[10px] text-text-muted">Replies</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-amber-600">{stats.pending}</p>
          <p className="text-[10px] text-text-muted">Pending</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-purple-600">{stats.responseRate}%</p>
          <p className="text-[10px] text-text-muted">Reply Rate</p>
        </CardContent></Card>
      </div>

      {/* Daily Target Progress */}
      <Card className="hover-lift"><CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-secondary">Daily Target: {rules.max_daily_touches} touches</span>
          <span className="text-xs font-bold text-brand-teal">{stats.sent}/{rules.max_daily_touches}</span>
        </div>
        <div className="bg-cream-dark rounded-full h-2 overflow-hidden">
          <div className="bg-brand-teal h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min((stats.sent / rules.max_daily_touches) * 100, 100)}%` }} />
        </div>
      </CardContent></Card>

      {/* Quick Send */}
      <Card className="hover-lift">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Send className="h-4 w-4" />Quick Send — {rules.name}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Select Lead</label>
              <Select options={leads.map((l) => ({ value: l.id, label: `${l.contact_name || l.company_name} — ${l.company_name}` }))} value={selectedLead} onChange={(e) => handleSelectLead(e.target.value)} placeholder="Choose a lead..." />
            </div>
            <div>
              <label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Message Template</label>
              <Select options={channelTemplates.map((t) => ({ value: t.id, label: t.name }))} value={selectedTemplate} onChange={(e) => handleSelectTemplate(e.target.value)} placeholder="Choose template..." />
            </div>
          </div>
          {messageText && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-medium text-text-muted uppercase">Message Preview</label>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => { navigator.clipboard.writeText(messageText); addToast("success", "Copied!"); }}><Copy className="h-3 w-3 mr-1" />Copy</Button>
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-border text-xs text-text-primary whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">{messageText}</div>
            </div>
          )}
          {messageText && selectedLead && (
            <Button onClick={handleSend} className="w-full bg-brand-teal hover:bg-brand-teal-dark text-white hover-lift press-effect animate-fade-in">
              <Send className="h-4 w-4 mr-2" />Send {rules.name} Message
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Today's Activity */}
      {todayEntries.length > 0 && (
        <Card className="hover-lift">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Today's Activity ({todayEntries.length})</CardTitle>
            <Button size="sm" variant="ghost" onClick={handleExport} className="text-[11px]"><Send className="h-3 w-3 mr-1" />Export</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 stagger-children">
              {todayEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-border-light hover:border-brand-teal/30 transition-all duration-200">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", CHANNEL_COLORS[entry.channel])}>
                    <ChannelIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text-primary">{entry.contact_name}</span>
                      <span className="text-[10px] text-text-muted">Step {entry.step_number}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary truncate">{entry.company_name}</p>
                  </div>
                  <Badge className={cn("text-[10px]", STATUS_COLORS[entry.status])}>{entry.status.replace("_", " ")}</Badge>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {entry.status === "sent" && (
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-green-600" onClick={() => setResponseDialog({ open: true, entry })}>Log Reply</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Follow-ups */}
      {entries.filter((e) => e.follow_up_scheduled && e.status === "sent").length > 0 && (
        <Card className="hover-lift">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4 text-amber-500" />Upcoming Follow-ups</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {entries.filter((e) => e.follow_up_scheduled && e.status === "sent").sort((a, b) => a.next_action_date.localeCompare(b.next_action_date)).slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                  <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-primary">{entry.contact_name} — {entry.company_name}</p>
                    <p className="text-[10px] text-text-muted">{entry.next_action} · Due: {entry.next_action_date}</p>
                  </div>
                  <Badge className="text-[10px] bg-amber-100 text-amber-700">Follow-up</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response Dialog */}
      <Dialog open={responseDialog.open} onClose={() => setResponseDialog({ open: false, entry: null })}>
        <DialogHeader><DialogTitle>Log Response</DialogTitle><DialogClose onClick={() => setResponseDialog({ open: false, entry: null })} /></DialogHeader>
        <DialogContent className="space-y-3">
          <p className="text-xs text-text-muted">From: {responseDialog.entry?.contact_name} — {responseDialog.entry?.company_name}</p>
          <div>
            <label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Response Type</label>
            <Select options={[{ value: "replied", label: "Replied" }, { value: "interested", label: "Interested" }, { value: "not_interested", label: "Not Interested" }, { value: "no_response", label: "No Response" }]} value={responseStatus} onChange={(e) => setResponseStatus(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Notes</label>
            <Textarea rows={3} value={responseNotes} onChange={(e) => setResponseNotes(e.target.value)} placeholder="What did they say?" />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setResponseDialog({ open: false, entry: null })}>Cancel</Button>
          <Button onClick={() => responseDialog.entry && handleLogResponse(responseDialog.entry.id)} className="bg-brand-teal hover:bg-brand-teal-dark text-white">Save</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
