"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Users, MessageCircle, Mail, Phone, ExternalLink, Calendar, Send, Plus, X,
  CheckCircle, Clock, ChevronDown, ChevronRight, Loader2, Download, FileText,
  Eye, Edit, Trash2, ArrowRight, Bell, Filter, Search,
} from "lucide-react";
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
import { generateDailyReport } from "@/lib/pdf-report";
import { getCompanies } from "@/lib/actions/companies";
import { CHANNEL_RULES, DEFAULT_WHATSAPP_TEMPLATES, DEFAULT_LINKEDIN_TEMPLATES, DEFAULT_EMAIL_TEMPLATES, type MessageTemplate, fillTemplate } from "@/lib/outreach-templates";

// ─── Types ──────────────────────────────────────────────────────────
interface Lead {
  id: string; company_name: string; contact_name: string; job_title: string;
  industry: string; city: string; phone: string; email: string; linkedin_url: string;
  est_deal_value: number; contacts?: any[];
}

interface TouchRecord {
  id: string; lead_id: string; channel: string; step: number;
  message: string; status: string; sent_at: string;
  response?: string; follow_up_date?: string;
}

// ─── Channel Helpers ─────────────────────────────────────────────────
const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "bg-green-100 text-green-700", ringColor: "ring-green-400" },
  { id: "linkedin", label: "LinkedIn", icon: ExternalLink, color: "bg-blue-100 text-blue-700", ringColor: "ring-blue-400" },
  { id: "email", label: "Email", icon: Mail, color: "bg-slate-100 text-slate-700", ringColor: "ring-slate-400" },
  { id: "call", label: "Call", icon: Phone, color: "bg-amber-100 text-amber-700", ringColor: "ring-amber-400" },
];

const ALL_TEMPLATES = [...DEFAULT_WHATSAPP_TEMPLATES, ...DEFAULT_LINKEDIN_TEMPLATES, ...DEFAULT_EMAIL_TEMPLATES];

// ─── Main Page ──────────────────────────────────────────────────────
export default function OutreachPage() {
  const [phase, setPhase] = useState<"gate" | "active">("gate");
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [touches, setTouches] = useState<TouchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [touchDialog, setTouchDialog] = useState<{ open: boolean; leadId: string; channel: string }>({ open: false, leadId: "", channel: "" });
  const [editDialog, setEditDialog] = useState<{ open: boolean; touch: TouchRecord | null }>({ open: false, touch: null });
  const [touchMessage, setTouchMessage] = useState("");
  const [touchTemplate, setTouchTemplate] = useState("");
  const [touchResponse, setTouchResponse] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);

  // Load leads from database
  const loadLeads = async () => {
    setLoading(true);
    const result = await getCompanies();
    if (result.data) {
      const mapped = result.data.map((c: any) => ({
        id: c.id, company_name: c.company_name, contact_name: c.contacts?.[0]?.full_name || "",
        job_title: c.contacts?.[0]?.title || "", industry: c.industry || "", city: c.city || "",
        phone: c.contacts?.[0]?.phone || c.phone || "", email: c.contacts?.[0]?.email || c.email || "",
        linkedin_url: c.contacts?.[0]?.linkedin_url || "", est_deal_value: c.est_deal_value || 0,
        contacts: c.contacts || [],
      }));
      setAllLeads(mapped);
    }
    setLoading(false);
  };

  // ─── Gate Phase ───────────────────────────────────────────────────
  if (phase === "gate") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center page-enter">
        <ToastContainer />
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="h-16 w-16 rounded-2xl bg-brand-teal flex items-center justify-center mx-auto mb-4"><Send className="h-8 w-8 text-white" /></div>
            <h1 className="text-3xl font-bold text-text-primary">Outreach Tracker</h1>
            <p className="text-text-secondary mt-2">Select prospects to start your outreach session.</p>
          </div>

          <Card className="hover-lift press-effect cursor-pointer border-2 border-transparent hover:border-brand-teal transition-all" onClick={async () => { await loadLeads(); setSelectedLeads(allLeads); setPhase("active"); }}>
            <CardContent className="p-8 text-center">
              <Users className="h-10 w-10 text-brand-teal mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">Start with All Prospects</h3>
              <p className="text-sm text-text-secondary">Load all prospects from your database</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Data Helpers ─────────────────────────────────────────────────
  const getTouchesForLead = useCallback((leadId: string) => touches.filter((t) => t.lead_id === leadId), [touches]);

  const getTouchesByDate = useCallback((date: string) => touches.filter((t) => t.sent_at.startsWith(date)), [touches]);

  const allDates = useMemo(() => [...new Set(touches.map((t) => t.sent_at.split("T")[0]))].sort().reverse(), [touches]);

  const today = new Date().toISOString().split("T")[0];
  const todayTouches = touches.filter((t) => t.sent_at.startsWith(today));
  const pendingFollowUps = touches.filter((t) => t.follow_up_date && t.follow_up_date <= today);

  // ─── Actions ──────────────────────────────────────────────────────
  const openTouchDialog = (leadId: string, channel: string) => {
    const lead = selectedLeads.find((l) => l.id === leadId);
    const contact = lead?.contacts?.[0];
    const existingSteps = touches.filter((t) => t.lead_id === leadId && t.channel === channel).length;
    const rules = CHANNEL_RULES[channel as keyof typeof CHANNEL_RULES];
    const template = ALL_TEMPLATES.find((t) => t.channel === channel && t.touch_number === existingSteps + 1);

    let msg = "";
    if (template && lead) {
      msg = fillTemplate(template.body, {
        "{name}": contact?.full_name || lead.contact_name || "",
        "{first_name}": (contact?.full_name || lead.contact_name || "").split(" ")[0],
        "{company}": lead.company_name,
        "{title}": contact?.title || lead.job_title || "",
        "{industry}": lead.industry || "",
        "{city}": lead.city || "",
        "{country}": "",
        "{service}": "our services",
        "{use_case}": "",
        "{bdm}": "Tadbeer Team",
        "{date}": new Date().toLocaleDateString(),
        "{referral_name}": "",
      });
    }

    setTouchTemplate(template?.id || "");
    setTouchMessage(msg);
    setTouchDialog({ open: true, leadId, channel });
  };

  const saveTouch = () => {
    const lead = selectedLeads.find((l) => l.id === touchDialog.leadId);
    if (!lead || !touchMessage.trim()) return;

    const existingSteps = touches.filter((t) => t.lead_id === touchDialog.leadId && t.channel === touchDialog.channel).length;
    const rules = CHANNEL_RULES[touchDialog.channel as keyof typeof CHANNEL_RULES];
    const newTouch: TouchRecord = {
      id: String(Date.now()),
      lead_id: touchDialog.leadId,
      channel: touchDialog.channel,
      step: existingSteps + 1,
      message: touchMessage,
      status: "sent",
      sent_at: new Date().toISOString(),
      follow_up_date: new Date(Date.now() + (rules?.follow_up_interval_days || 3) * 86400000).toISOString().split("T")[0],
    };

    setTouches((prev) => [newTouch, ...prev]);

    // Open respective channel
    const phone = (lead.phone || "").replace(/\D/g, "");
    const email = lead.email || "";
    const encodedMessage = encodeURIComponent(touchMessage);

    if (touchDialog.channel === "whatsapp" && phone) window.open(`https://wa.me/${phone}?text=${encodedMessage}`, "_blank");
    else if (touchDialog.channel === "linkedin" && lead.linkedin_url) window.open(lead.linkedin_url.startsWith("http") ? lead.linkedin_url : `https://linkedin.com${lead.linkedin_url}`, "_blank");
    else if (touchDialog.channel === "email" && email) window.open(`mailto:${email}?subject=${encodeURIComponent("Tadbeer Transformations")}&body=${encodedMessage}`, "_blank");
    else if (touchDialog.channel === "call" && phone) window.open(`tel:${phone}`, "_blank");

    setTouchDialog({ open: false, leadId: "", channel: "" });
    setTouchMessage("");
    addToast("success", `${touchDialog.channel} touch logged — follow-up auto-scheduled`);
  };

  const saveEdit = () => {
    if (!editDialog.touch) return;
    setTouches((prev) => prev.map((t) => t.id === editDialog.touch!.id ? { ...t, response: touchResponse } : t));
    setEditDialog({ open: false, touch: null });
    setTouchResponse("");
    addToast("success", "Touch updated");
  };

  const deleteTouch = (id: string) => {
    setTouches((prev) => prev.filter((t) => t.id !== id));
    addToast("success", "Touch deleted");
  };

  const handleExport = () => {
    exportToCsv(touches.map((t) => {
      const lead = selectedLeads.find((l) => l.id === t.lead_id);
      return {
        date: t.sent_at.split("T")[0], time: new Date(t.sent_at).toLocaleTimeString(),
        company: lead?.company_name || "", contact: lead?.contact_name || "",
        channel: t.channel, step: t.step, status: t.status,
        message: t.message.substring(0, 200), response: t.response || "",
        follow_up: t.follow_up_date || "",
      };
    }), `outreach-${today}.csv`);
    addToast("success", "CSV exported");
  };

  const handlePdfReport = () => {
    generateDailyReport(selectedDate || today, touches.map((t) => {
      const lead = selectedLeads.find((l) => l.id === t.lead_id);
      return { ...t, company_name: lead?.company_name || "", contact_name: lead?.contact_name || "" };
    }), selectedLeads);
    addToast("success", "PDF report generated");
  };

  const filteredLeads = selectedLeads.filter((l) =>
    !search || l.company_name.toLowerCase().includes(search.toLowerCase()) || l.contact_name.toLowerCase().includes(search.toLowerCase())
  );

  const channelConfig = (ch: string) => CHANNELS.find((c) => c.id === ch) || CHANNELS[0];

  // ─── Active Phase ─────────────────────────────────────────────────
  return (
    <div className="space-y-5 page-enter">
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPhase("gate")} className="text-text-muted"><ArrowRight className="h-4 w-4 mr-1 rotate-180" />Back</Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Daily Outreach</h1>
            <p className="text-text-secondary text-sm">{selectedLeads.length} prospects · {todayTouches.length} touches today</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setReportOpen(true)} className="hover-lift press-effect"><FileText className="h-3.5 w-3.5 mr-1" />Report</Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="hover-lift press-effect"><Download className="h-3.5 w-3.5 mr-1" />CSV</Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 stagger-children">
        {CHANNELS.map((ch) => {
          const count = todayTouches.filter((t) => t.channel === ch.id).length;
          const Icon = ch.icon;
          return (
            <Card key={ch.id} className="hover-lift"><CardContent className="p-3 flex items-center gap-3">
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", ch.color)}><Icon className="h-4 w-4" /></div>
              <div><p className="text-lg font-bold text-text-primary">{count}</p><p className="text-[10px] text-text-muted">{ch.label} today</p></div>
            </CardContent></Card>
          );
        })}
      </div>

      {/* Pending Follow-ups */}
      {pendingFollowUps.length > 0 && (
        <Card className="hover-lift border-amber-200 bg-amber-50/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 mb-2"><Bell className="h-4 w-4 text-amber-500" /><span className="text-sm font-medium text-amber-700">{pendingFollowUps.length} follow-ups due</span></div>
            <div className="flex flex-wrap gap-1.5">
              {pendingFollowUps.slice(0, 5).map((t) => {
                const lead = selectedLeads.find((l) => l.id === t.lead_id);
                return (
                  <button key={t.id} onClick={() => setExpandedLead(t.lead_id)} className="px-2 py-1 rounded-full bg-white border border-amber-200 text-[10px] text-amber-700 hover:bg-amber-100 transition-colors press-effect">
                    {lead?.contact_name || lead?.company_name} · {t.channel}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
        <Input placeholder="Search prospects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Prospects List — One Card Per Lead */}
      <div className="space-y-2 stagger-children">
        {filteredLeads.map((lead) => {
          const leadTouches = getTouchesForLead(lead.id);
          const isExpanded = expandedLead === lead.id;
          const lastTouch = leadTouches[0];
          const hasFollowUp = pendingFollowUps.some((t) => t.lead_id === lead.id);

          return (
            <Card key={lead.id} className={cn("hover-lift transition-all", hasFollowUp && "border-amber-300")}>
              <CardContent className="p-0">
                {/* Main Row */}
                <div className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-cream-dark/30 transition-colors" onClick={() => setExpandedLead(isExpanded ? null : lead.id)}>
                  <button className="flex-shrink-0 text-text-muted">
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <div className="h-9 w-9 rounded-lg bg-brand-teal-light flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-brand-teal" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{lead.contact_name || lead.company_name}</span>
                      {lead.contact_name && lead.company_name && <span className="text-xs text-text-muted">· {lead.company_name}</span>}
                    </div>
                    {lastTouch && <p className="text-[10px] text-text-muted">Last: {lastTouch.channel} T{lastTouch.step} · {new Date(lastTouch.sent_at).toLocaleDateString()}</p>}
                  </div>
                  {/* Quick Channel Buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {CHANNELS.map((ch) => {
                      const chTouches = leadTouches.filter((t) => t.channel === ch.id);
                      const Icon = ch.icon;
                      const hasTouch = chTouches.length > 0;
                      return (
                        <button key={ch.id} onClick={() => openTouchDialog(lead.id, ch.id)} className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-all press-effect", hasTouch ? ch.color + " ring-2 " + ch.ringColor : "bg-cream-dark text-text-muted hover:bg-white hover:border border-border")} title={`${ch.label} (${chTouches.length} touches)`}>
                          <Icon className="h-3.5 w-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expanded — Full History */}
                {isExpanded && (
                  <div className="border-t border-border-light px-4 py-3 animate-expand-down">
                    {/* Lead Details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-[11px]">
                      {lead.phone && <div><span className="text-text-muted">Phone</span><p className="font-medium">{lead.phone}</p></div>}
                      {lead.email && <div><span className="text-text-muted">Email</span><p className="font-medium truncate">{lead.email}</p></div>}
                      {lead.linkedin_url && <div><span className="text-text-muted">LinkedIn</span><p className="font-medium truncate">{lead.linkedin_url}</p></div>}
                      <div><span className="text-text-muted">Industry</span><p className="font-medium">{lead.industry || "—"}</p></div>
                    </div>

                    {/* Touch History */}
                    {leadTouches.length > 0 ? (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-medium text-text-muted uppercase">History ({leadTouches.length} touches)</p>
                        {leadTouches.map((t) => {
                          const ch = channelConfig(t.channel);
                          const Icon = ch.icon;
                          return (
                            <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white border border-border-light group">
                              <div className={cn("h-6 w-6 rounded flex items-center justify-center flex-shrink-0", ch.color)}><Icon className="h-3 w-3" /></div>
                              <span className="text-[10px] text-text-muted w-16 flex-shrink-0">{new Date(t.sent_at).toLocaleDateString()}</span>
                              <span className="text-xs font-medium text-text-primary flex-1">T{t.step}</span>
                              <span className="text-[10px] text-text-secondary truncate max-w-[200px]">{t.message.substring(0, 80)}...</span>
                              {t.follow_up_date && <Badge className="text-[9px] bg-amber-100 text-amber-700">FU: {t.follow_up_date}</Badge>}
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setEditDialog({ open: true, touch: t }); setTouchResponse(t.response || ""); }} className="p-1 rounded hover:bg-cream-dark"><Edit className="h-3 w-3 text-text-muted" /></button>
                                <button onClick={(e) => { e.stopPropagation(); deleteTouch(t.id); }} className="p-1 rounded hover:bg-red-50"><Trash2 className="h-3 w-3 text-red-400" /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-text-muted text-center py-2">No touches yet. Use the channel buttons above to start.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Date History */}
      {allDates.length > 0 && (
        <Card className="hover-lift">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />History by Date</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              {allDates.map((date) => {
                const count = getTouchesByDate(date).length;
                const isSelected = selectedDate === date;
                return (
                  <button key={date} onClick={() => setSelectedDate(isSelected ? null : date)} className={cn("px-3 py-2 rounded-xl text-xs font-medium transition-all press-effect flex-shrink-0", isSelected ? "bg-brand-teal text-white" : "bg-white border border-border text-text-secondary hover:bg-cream-dark")}>
                    <div>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    <div className="text-[10px] opacity-70">{count} touches</div>
                  </button>
                );
              })}
            </div>
            {selectedDate && (
              <div className="mt-3 space-y-1.5 animate-fade-in">
                {getTouchesByDate(selectedDate).map((t) => {
                  const lead = selectedLeads.find((l) => l.id === t.lead_id);
                  const ch = channelConfig(t.channel);
                  const Icon = ch.icon;
                  return (
                    <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-cream-dark/30">
                      <div className={cn("h-5 w-5 rounded flex items-center justify-center", ch.color)}><Icon className="h-3 w-3" /></div>
                      <span className="text-xs font-medium text-text-primary">{lead?.contact_name || lead?.company_name}</span>
                      <span className="text-[10px] text-text-muted">T{t.step}</span>
                      <span className="text-[10px] text-text-secondary flex-1 truncate">{t.message.substring(0, 60)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Touch Dialog */}
      <Dialog open={touchDialog.open} onClose={() => setTouchDialog({ open: false, leadId: "", channel: "" })}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(() => { const ch = channelConfig(touchDialog.channel); const Icon = ch.icon; return <><div className={cn("h-6 w-6 rounded flex items-center justify-center", ch.color)}><Icon className="h-3.5 w-3.5" /></div>Log {ch.label} Touch</>; })()}
          </DialogTitle>
          <DialogClose onClick={() => setTouchDialog({ open: false, leadId: "", channel: "" })} />
        </DialogHeader>
        <DialogContent className="space-y-3">
          <div className="text-xs text-text-muted">
            {(() => { const lead = selectedLeads.find((l) => l.id === touchDialog.leadId); return lead ? `${lead.contact_name} — ${lead.company_name}` : ""; })()}
          </div>
          <div>
            <label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Message</label>
            <Textarea rows={6} value={touchMessage} onChange={(e) => setTouchMessage(e.target.value)} placeholder="Write or paste your message..." className="text-xs" />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setTouchDialog({ open: false, leadId: "", channel: "" })}>Cancel</Button>
          <Button onClick={saveTouch} className="bg-brand-teal hover:bg-brand-teal-dark text-white"><Send className="h-4 w-4 mr-1" />Send & Open</Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, touch: null })}>
        <DialogHeader><DialogTitle>Edit Touch</DialogTitle><DialogClose onClick={() => setEditDialog({ open: false, touch: null })} /></DialogHeader>
        <DialogContent className="space-y-3">
          <div>
            <label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Response / Notes</label>
            <Textarea rows={3} value={touchResponse} onChange={(e) => setTouchResponse(e.target.value)} placeholder="What happened? Any response?" />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setEditDialog({ open: false, touch: null })}>Cancel</Button>
          <Button onClick={saveEdit} className="bg-brand-teal hover:bg-brand-teal-dark text-white">Save</Button>
        </DialogFooter>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={reportOpen} onClose={() => setReportOpen(false)}>
        <DialogHeader><DialogTitle>Generate Report</DialogTitle><DialogClose onClick={() => setReportOpen(false)} /></DialogHeader>
        <DialogContent className="space-y-3">
          <div>
            <label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Report Date</label>
            <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
          <Button onClick={() => { setReportOpen(false); handlePdfReport(); }} className="bg-brand-teal hover:bg-brand-teal-dark text-white">Generate PDF</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
