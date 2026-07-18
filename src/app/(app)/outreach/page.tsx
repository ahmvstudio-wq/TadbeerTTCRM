"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Users, MessageCircle, Mail, Phone, ExternalLink, Calendar, Send, Plus, X,
  CheckCircle, ChevronDown, ChevronRight, Download, FileText,
  Edit, Trash2, ArrowRight, Bell, Search, Rocket, Flag, PhoneCall, Loader2,
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
import { saveTouch as saveTouchToDb, getTouches, updateTouch, deleteTouch as deleteTouchAction, saveCampaign, getCampaigns, markReached as markReachedAction, unmarkReached as unmarkReachedAction, getReachedLeads } from "@/lib/actions/outreach";
import { CHANNEL_RULES, DEFAULT_WHATSAPP_TEMPLATES, DEFAULT_LINKEDIN_TEMPLATES, DEFAULT_EMAIL_TEMPLATES, fillTemplate } from "@/lib/outreach-templates";

interface Lead { id: string; company_name: string; contact_name: string; job_title: string; industry: string; city: string; phone: string; email: string; linkedin_url: string; est_deal_value: number; contacts?: any[]; }
interface TouchRecord { id: string; lead_id: string; channel: string; step: number; message: string; status: string; sent_at: string; response?: string; follow_up_date?: string; campaign_id?: string; is_call?: boolean; call_duration?: number; call_outcome?: string; }
interface Campaign { id: string; name: string; description: string; created_at: string; lead_ids: string[]; status: "active" | "completed"; }

const CHANNELS = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "bg-green-100 text-green-700", ring: "ring-green-400" },
  { id: "linkedin", label: "LinkedIn", icon: ExternalLink, color: "bg-blue-100 text-blue-700", ring: "ring-blue-400" },
  { id: "email", label: "Email", icon: Mail, color: "bg-slate-100 text-slate-700", ring: "ring-slate-400" },
  { id: "call", label: "Call", icon: Phone, color: "bg-amber-100 text-amber-700", ring: "ring-amber-400" },
];
const ALL_TEMPLATES = [...DEFAULT_WHATSAPP_TEMPLATES, ...DEFAULT_LINKEDIN_TEMPLATES, ...DEFAULT_EMAIL_TEMPLATES];
const PAGE_SIZE = 20;

function mapLead(c: any): Lead {
  return {
    id: c.id, company_name: c.company_name, contact_name: c.contacts?.[0]?.full_name || "",
    job_title: c.contacts?.[0]?.title || "", industry: c.industry || "", city: c.city || "",
    phone: c.contacts?.[0]?.phone || c.phone || "", email: c.contacts?.[0]?.email || c.email || "",
    linkedin_url: c.contacts?.[0]?.linkedin_url || "", est_deal_value: c.est_deal_value || 0, contacts: c.contacts || [],
  };
}

function mapTouch(t: any): TouchRecord {
  return {
    id: t.id, lead_id: t.lead_id, channel: t.channel, step: t.step_number,
    message: t.message || "", status: t.status, sent_at: t.sent_at,
    response: t.response, follow_up_date: t.follow_up_date, campaign_id: t.campaign_id,
    is_call: t.is_call, call_duration: t.call_duration, call_outcome: t.call_outcome,
  };
}

export default function OutreachPage() {
  const [phase, setPhase] = useState<"gate" | "active">("gate");
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [touches, setTouches] = useState<TouchRecord[]>([]);
  const [reachedLeads, setReachedLeads] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [touchDialog, setTouchDialog] = useState<{ open: boolean; leadId: string; channel: string }>({ open: false, leadId: "", channel: "" });
  const [callDialog, setCallDialog] = useState<{ open: boolean; leadId: string }>({ open: false, leadId: "" });
  const [editDialog, setEditDialog] = useState<{ open: boolean; touch: TouchRecord | null }>({ open: false, touch: null });
  const [touchMessage, setTouchMessage] = useState("");
  const [touchResponse, setTouchResponse] = useState("");
  const [callForm, setCallForm] = useState({ duration: "", outcome: "connected", notes: "" });
  const [reportOpen, setReportOpen] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: "", description: "" });
  const [campaignLeads, setCampaignLeads] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);
  const [expandedTouches, setExpandedTouches] = useState<Record<string, TouchRecord[]>>({});
  const [showAllInDialog, setShowAllInDialog] = useState(false);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const [cRes, rRes, lRes] = await Promise.all([
        getCampaigns().catch(() => ({ data: null })),
        getReachedLeads().catch(() => ({ data: null })),
        getCompanies().catch(() => ({ data: null })),
      ]);
      if (cRes.data) setCampaigns(cRes.data.map((c: any) => ({ id: c.id, name: c.name, description: c.description || "", created_at: c.created_at, lead_ids: c.lead_ids || [], status: c.status })));
      if (rRes.data) setReachedLeads(new Set(rRes.data));
      if (lRes.data) setAllLeads(lRes.data.map(mapLead));
    } catch (e) { console.error("loadInitial:", e); }
    setLoading(false);
  };

  const enterActive = async (leadIds?: string[], campaign?: Campaign) => {
    setLoading(true);
    try {
      // Always load leads from DB
      const lRes = await getCompanies().catch(() => ({ data: null }));
      if (lRes.data) {
        const all = lRes.data.map(mapLead);
        setAllLeads(all);
        if (leadIds && leadIds.length > 0) {
          setSelectedLeads(all.filter((l) => leadIds.includes(l.id)));
        } else {
          setSelectedLeads(all);
        }
      } else if (leadIds && leadIds.length > 0) {
        // Fallback: use already loaded leads
        setSelectedLeads(allLeads.filter((l) => leadIds.includes(l.id)));
      } else {
        setSelectedLeads(allLeads);
      }
      // Load touches
      const tRes = await getTouches().catch(() => ({ data: null }));
      if (tRes.data) setTouches(tRes.data.map(mapTouch));
      if (campaign) setActiveCampaign(campaign);
    } catch (e) { console.error("enterActive:", e); }
    setPhase("active");
    setLoading(false);
  };

  useEffect(() => { loadInitial(); }, []);

  const getTouchesForLead = useCallback((leadId: string) => touches.filter((t) => t.lead_id === leadId), [touches]);
  const getTouchesByDate = useCallback((date: string) => touches.filter((t) => t.sent_at.startsWith(date)), [touches]);
  const allDates = useMemo(() => [...new Set(touches.map((t) => t.sent_at.split("T")[0]))].sort().reverse(), [touches]);
  const today = new Date().toISOString().split("T")[0];
  const todayTouches = touches.filter((t) => t.sent_at.startsWith(today));
  const pendingFollowUps = touches.filter((t) => t.follow_up_date && t.follow_up_date <= today && !reachedLeads.has(t.lead_id));

  // ─── GATE ─────────────────────────────────────────────────────────
  if (phase === "gate") {
    const untouchedList = allLeads.filter((l) => !reachedLeads.has(l.id) && !touches.some((t) => t.lead_id === l.id));

    return (
      <div className="min-h-[70vh] page-enter">
        <ToastContainer />
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="h-16 w-16 rounded-2xl bg-brand-teal flex items-center justify-center mx-auto mb-4"><Rocket className="h-8 w-8 text-white" /></div>
            <h1 className="text-3xl font-bold text-text-primary">Outreach Tracker</h1>
            <p className="text-text-secondary mt-2">Create a campaign or continue an existing one.</p>
          </div>

          <Card className="hover-lift press-effect cursor-pointer border-2 border-dashed border-brand-teal/40 hover:border-brand-teal transition-all" onClick={() => setNewCampaignOpen(true)}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-brand-teal flex items-center justify-center flex-shrink-0"><Plus className="h-6 w-6 text-white" /></div>
              <div><h3 className="text-lg font-semibold text-text-primary">Create New Campaign</h3><p className="text-sm text-text-secondary">{untouchedList.length} untouched prospects available</p></div>
            </CardContent>
          </Card>

          {campaigns.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-text-muted uppercase">Your Campaigns ({campaigns.length})</p>
                <Button size="sm" variant="ghost" onClick={() => enterActive()} className="text-[11px] text-brand-teal hover:underline">View All</Button>
              </div>
              {campaigns.map((camp) => {
                const campReached = camp.lead_ids.filter((id) => reachedLeads.has(id)).length;
                return (
                  <Card key={camp.id} className="hover-lift press-effect cursor-pointer" onClick={() => enterActive(camp.lead_ids, camp)}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-brand-teal-light flex items-center justify-center"><Send className="h-5 w-5 text-brand-teal" /></div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{camp.name}</p>
                          <p className="text-xs text-text-muted">{camp.lead_ids.length} prospects · {campReached} reached</p>
                        </div>
                      </div>
                      <Badge className={cn("text-[10px]", camp.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600")}>{camp.status}</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="hover-lift press-effect cursor-pointer border-2 border-transparent hover:border-brand-gold transition-all" onClick={() => enterActive()}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-brand-gold-light flex items-center justify-center flex-shrink-0"><Users className="h-6 w-6 text-brand-gold" /></div>
              <div><h3 className="text-base font-semibold text-text-primary">Quick Start — All Prospects</h3><p className="text-sm text-text-secondary">Jump in with all {allLeads.length} prospects</p></div>
            </CardContent>
          </Card>

          <Dialog open={newCampaignOpen} onClose={() => setNewCampaignOpen(false)} className="max-w-3xl">
            <DialogHeader><DialogTitle>Create New Campaign</DialogTitle><DialogClose onClick={() => setNewCampaignOpen(false)} /></DialogHeader>
            <DialogContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Campaign Name *</label><Input value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="e.g. Q3 Oman Outreach" /></div>
                <div><label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Description</label><Input value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} placeholder="Optional" /></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-medium text-text-muted uppercase">Select Prospects ({campaignLeads.size} selected)</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowAllInDialog(!showAllInDialog)} className={cn("text-[10px] px-2 py-0.5 rounded-full transition-colors", showAllInDialog ? "bg-brand-teal text-white" : "bg-cream-dark text-text-muted hover:bg-slate-200")}>{showAllInDialog ? "All" : "Untouched"}</button>
                    <button onClick={() => { const list = showAllInDialog ? allLeads : untouchedList; setCampaignLeads(campaignLeads.size === list.length ? new Set() : new Set(list.map((l) => l.id))); }} className="text-[10px] text-brand-teal hover:underline">Select All</button>
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto border border-border rounded-xl divide-y divide-border-light">
                  {(showAllInDialog ? allLeads : untouchedList).length === 0 ? <div className="p-6 text-center text-sm text-text-muted">No prospects available.</div> : (showAllInDialog ? allLeads : untouchedList).slice(0, 50).map((lead) => (
                    <label key={lead.id} className="flex items-center gap-3 p-2.5 hover:bg-cream-dark/30 cursor-pointer transition-colors">
                      <input type="checkbox" checked={campaignLeads.has(lead.id)} onChange={() => { const n = new Set(campaignLeads); n.has(lead.id) ? n.delete(lead.id) : n.add(lead.id); setCampaignLeads(n); }} className="rounded" />
                      <div className="flex-1 min-w-0"><p className="text-xs font-medium text-text-primary">{lead.contact_name || lead.company_name}</p><p className="text-[10px] text-text-muted">{lead.company_name}</p></div>
                      {reachedLeads.has(lead.id) && <Badge className="text-[9px] bg-emerald-100 text-emerald-700">Reached</Badge>}
                    </label>
                  ))}
                </div>
              </div>
            </DialogContent>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setNewCampaignOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!campaignForm.name || campaignLeads.size === 0) { addToast("error", "Name and prospects required"); return; }
                const result = await saveCampaign({ name: campaignForm.name, description: campaignForm.description, lead_ids: Array.from(campaignLeads) });
                if (result.error) { addToast("error", result.error); return; }
                const c: Campaign = { id: result.data.id, name: campaignForm.name, description: campaignForm.description, created_at: result.data.created_at, lead_ids: Array.from(campaignLeads), status: "active" };
                setCampaigns((p) => [...p, c]); setNewCampaignOpen(false); setCampaignForm({ name: "", description: "" }); setCampaignLeads(new Set());
                addToast("success", `Campaign "${c.name}" created`);
              }} className="bg-brand-teal hover:bg-brand-teal-dark text-white">Create Campaign</Button>
            </DialogFooter>
          </Dialog>
        </div>
      </div>
    );
  }

  // ─── Actions ──────────────────────────────────────────────────────
  const openTouchDialog = (leadId: string, channel: string) => {
    const lead = selectedLeads.find((l) => l.id === leadId);
    if (!lead) return;
    const contact = lead.contacts?.[0];
    const existingSteps = touches.filter((t) => t.lead_id === leadId && t.channel === channel).length;
    const template = ALL_TEMPLATES.find((t) => t.channel === channel && t.touch_number === existingSteps + 1);
    let msg = "";
    if (template) {
      msg = fillTemplate(template.body, {
        "{name}": contact?.full_name || lead.contact_name || "", "{first_name}": (contact?.full_name || lead.contact_name || "").split(" ")[0],
        "{company}": lead.company_name, "{title}": contact?.title || lead.job_title || "", "{industry}": lead.industry || "",
        "{city}": lead.city || "", "{country}": "", "{service}": "our services", "{use_case}": "",
        "{bdm}": "Tadbeer Team", "{date}": new Date().toLocaleDateString(), "{referral_name}": "",
      });
    }
    setTouchMessage(msg); setTouchDialog({ open: true, leadId, channel });
  };

  const saveTouch = async () => {
    const lead = selectedLeads.find((l) => l.id === touchDialog.leadId);
    if (!lead || !touchMessage.trim()) return;
    const existingSteps = touches.filter((t) => t.lead_id === touchDialog.leadId && t.channel === touchDialog.channel).length;
    const rules = CHANNEL_RULES[touchDialog.channel as keyof typeof CHANNEL_RULES];
    const followUpDate = new Date(Date.now() + (rules?.follow_up_interval_days || 3) * 86400000).toISOString().split("T")[0];
    const result = await saveTouchToDb({ lead_id: touchDialog.leadId, channel: touchDialog.channel, step: existingSteps + 1, message: touchMessage, campaign_id: activeCampaign?.id, follow_up_date: followUpDate });
    if (result.error) { addToast("error", result.error); return; }
    const newTouch: TouchRecord = { id: result.data.id, lead_id: touchDialog.leadId, channel: touchDialog.channel, step: existingSteps + 1, message: touchMessage, status: "sent", sent_at: new Date().toISOString(), follow_up_date: followUpDate, campaign_id: activeCampaign?.id };
    setTouches((p) => [newTouch, ...p]);
    setExpandedTouches((prev) => ({ ...prev, [touchDialog.leadId]: [newTouch, ...(prev[touchDialog.leadId] || [])] }));
    const phone = (lead.phone || "").replace(/\D/g, "");
    const encoded = encodeURIComponent(touchMessage);
    if (touchDialog.channel === "whatsapp" && phone) window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
    else if (touchDialog.channel === "linkedin" && lead.linkedin_url) window.open(lead.linkedin_url.startsWith("http") ? lead.linkedin_url : `https://linkedin.com${lead.linkedin_url}`, "_blank");
    else if (touchDialog.channel === "email" && lead.email) window.open(`mailto:${lead.email}?subject=${encodeURIComponent("Tadbeer Transformations")}&body=${encoded}`, "_blank");
    else if (touchDialog.channel === "call" && phone) window.open(`tel:${phone}`, "_blank");
    setTouchDialog({ open: false, leadId: "", channel: "" }); setTouchMessage("");
    addToast("success", `${touchDialog.channel} touch logged`);
  };

  const saveCall = async () => {
    const lead = selectedLeads.find((l) => l.id === callDialog.leadId);
    if (!lead) return;
    const result = await saveTouchToDb({ lead_id: callDialog.leadId, channel: "call", step: touches.filter((t) => t.lead_id === callDialog.leadId && t.channel === "call").length + 1, message: callForm.notes || "Call completed", campaign_id: activeCampaign?.id, is_call: true, call_duration: parseInt(callForm.duration) || 0, call_outcome: callForm.outcome });
    if (result.error) { addToast("error", result.error); return; }
    const newTouch: TouchRecord = { id: result.data.id, lead_id: callDialog.leadId, channel: "call", step: touches.filter((t) => t.lead_id === callDialog.leadId && t.channel === "call").length + 1, message: callForm.notes || "Call completed", status: "sent", sent_at: new Date().toISOString(), is_call: true, call_duration: parseInt(callForm.duration) || 0, call_outcome: callForm.outcome, campaign_id: activeCampaign?.id };
    setTouches((p) => [newTouch, ...p]);
    setExpandedTouches((prev) => ({ ...prev, [callDialog.leadId]: [newTouch, ...(prev[callDialog.leadId] || [])] }));
    setCallDialog({ open: false, leadId: "" }); setCallForm({ duration: "", outcome: "connected", notes: "" });
    addToast("success", "Call logged");
  };

  const saveEdit = async () => {
    if (!editDialog.touch) return;
    const result = await updateTouch(editDialog.touch.id, { response: touchResponse });
    if (result.error) { addToast("error", result.error); return; }
    setTouches((p) => p.map((t) => t.id === editDialog.touch!.id ? { ...t, response: touchResponse } : t));
    setEditDialog({ open: false, touch: null }); setTouchResponse(""); addToast("success", "Updated");
  };

  const deleteTouchFn = async (id: string, leadId: string) => {
    const result = await deleteTouchAction(id);
    if (result.error) { addToast("error", result.error); return; }
    setTouches((p) => p.filter((t) => t.id !== id));
    setExpandedTouches((prev) => ({ ...prev, [leadId]: (prev[leadId] || []).filter((t) => t.id !== id) }));
    addToast("success", "Deleted");
  };

  const markReachedFn = async (leadId: string) => {
    const result = await markReachedAction(leadId);
    if (result.error) { addToast("error", result.error); return; }
    setReachedLeads((prev) => new Set([...prev, leadId]));
    addToast("success", "Prospect reached");
  };

  const unmarkReachedFn = async (leadId: string) => {
    const result = await unmarkReachedAction(leadId);
    if (result.error) { addToast("error", result.error); return; }
    setReachedLeads((prev) => { const n = new Set(prev); n.delete(leadId); return n; });
    addToast("success", "Prospect unmarked");
  };

  const handleExport = () => {
    exportToCsv(touches.map((t) => { const l = selectedLeads.find((x) => x.id === t.lead_id); return { date: t.sent_at.split("T")[0], company: l?.company_name || "", contact: l?.contact_name || "", channel: t.channel, step: t.step, message: t.message.substring(0, 200), response: t.response || "", follow_up: t.follow_up_date || "" }; }), `outreach-${today}.csv`);
    addToast("success", "CSV exported");
  };

  const handlePdfReport = () => {
    generateDailyReport(selectedDate || today, touches.map((t) => { const l = selectedLeads.find((x) => x.id === t.lead_id); return { ...t, company_name: l?.company_name || "", contact_name: l?.contact_name || "" }; }), selectedLeads);
    addToast("success", "PDF report generated");
  };

  const filteredLeads = useMemo(() => {
    const filtered = selectedLeads.filter((l) => !search || l.company_name.toLowerCase().includes(search.toLowerCase()) || l.contact_name.toLowerCase().includes(search.toLowerCase()));
    return filtered.slice(0, displayCount);
  }, [selectedLeads, search, displayCount]);

  const totalFiltered = selectedLeads.filter((l) => !search || l.company_name.toLowerCase().includes(search.toLowerCase()) || l.contact_name.toLowerCase().includes(search.toLowerCase())).length;
  const hasMore = totalFiltered > displayCount;
  const chCfg = (ch: string) => CHANNELS.find((c) => c.id === ch) || CHANNELS[0];
  const reachedCount = selectedLeads.filter((l) => reachedLeads.has(l.id)).length;

  const loadTouchesForLead = async (leadId: string) => {
    if (expandedTouches[leadId]) return;
    try {
      const result = await getTouches();
      if (result.data) {
        const leadTouches = result.data.filter((t: any) => t.lead_id === leadId).map(mapTouch);
        setExpandedTouches((prev) => ({ ...prev, [leadId]: leadTouches }));
      }
    } catch (e) { console.error("loadTouchesForLead:", e); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin h-8 w-8 text-brand-teal" /></div>;

  // ─── ACTIVE ───────────────────────────────────────────────────────
  return (
    <div className="space-y-5 page-enter">
      <ToastContainer />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setPhase("gate"); loadInitial(); }} className="text-text-muted"><ArrowRight className="h-4 w-4 mr-1 rotate-180" />Back</Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{activeCampaign ? activeCampaign.name : "Outreach Session"}</h1>
            <p className="text-text-secondary text-sm">{selectedLeads.length} prospects · {reachedCount} reached</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setReportOpen(true)} className="hover-lift press-effect"><FileText className="h-3.5 w-3.5 mr-1" />Report</Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="hover-lift press-effect"><Download className="h-3.5 w-3.5 mr-1" />CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 stagger-children">
        {CHANNELS.map((ch) => { const count = todayTouches.filter((t) => t.channel === ch.id).length; const Icon = ch.icon; return (
          <Card key={ch.id} className="hover-lift"><CardContent className="p-3 flex items-center gap-3">
            <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", ch.color)}><Icon className="h-4 w-4" /></div>
            <div><p className="text-lg font-bold text-text-primary">{count}</p><p className="text-[10px] text-text-muted">{ch.label}</p></div>
          </CardContent></Card>
        ); })}
        <Card className="hover-lift"><CardContent className="p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-emerald-100 text-emerald-700"><CheckCircle className="h-4 w-4" /></div>
          <div><p className="text-lg font-bold text-emerald-600">{reachedCount}</p><p className="text-[10px] text-text-muted">Reached</p></div>
        </CardContent></Card>
      </div>

      {pendingFollowUps.length > 0 && (
        <Card className="hover-lift border-amber-200 bg-amber-50/30"><CardContent className="p-3">
          <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-amber-500" /><span className="text-sm font-medium text-amber-700">{pendingFollowUps.length} Follow-ups Due</span></div>
        </CardContent></Card>
      )}

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" /><Input placeholder="Search prospects..." value={search} onChange={(e) => { setSearch(e.target.value); setDisplayCount(PAGE_SIZE); }} className="pl-9" /></div>

      <div className="space-y-2">
        {filteredLeads.map((lead) => {
          const leadTouches = getTouchesForLead(lead.id); const isExpanded = expandedLead === lead.id;
          const isReached = reachedLeads.has(lead.id);
          const leadTouchCount = touches.filter((t) => t.lead_id === lead.id).length;
          return (
            <Card key={lead.id} className={cn("hover-lift transition-all", isReached && "bg-emerald-50/30 border-emerald-200")}>
              <CardContent className="p-0">
                <div className="flex items-center gap-3 py-3 px-4 cursor-pointer hover:bg-cream-dark/30 transition-colors" onClick={() => { setExpandedLead(isExpanded ? null : lead.id); if (!isExpanded) loadTouchesForLead(lead.id); }}>
                  <button className="flex-shrink-0 text-text-muted">{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button>
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0", isReached ? "bg-emerald-100" : "bg-brand-teal-light")}>
                    {isReached ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Users className="h-4 w-4 text-brand-teal" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text-primary">{lead.contact_name || lead.company_name}</span>
                      {lead.contact_name && lead.company_name && <span className="text-xs text-text-muted">· {lead.company_name}</span>}
                      {isReached && <Badge className="text-[9px] bg-emerald-100 text-emerald-700">Reached</Badge>}
                    </div>
                    {leadTouchCount > 0 && <p className="text-[10px] text-text-muted">{leadTouchCount} touches</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {!isReached && CHANNELS.map((ch) => { const chT = leadTouches.filter((t) => t.channel === ch.id); const Icon = ch.icon; return (
                      <button key={ch.id} onClick={() => ch.id === "call" ? setCallDialog({ open: true, leadId: lead.id }) : openTouchDialog(lead.id, ch.id)} className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-all press-effect", chT.length > 0 ? ch.color + " ring-2 " + ch.ring : "bg-cream-dark text-text-muted hover:bg-white border border-border")} title={`${ch.label} (${chT.length})`}><Icon className="h-3.5 w-3.5" /></button>
                    ); })}
                    <button onClick={(e) => { e.stopPropagation(); isReached ? unmarkReachedFn(lead.id) : markReachedFn(lead.id); }} className={cn("h-8 w-8 rounded-lg flex items-center justify-center transition-all press-effect", isReached ? "bg-emerald-500 text-white" : "bg-cream-dark text-text-muted hover:bg-emerald-100 hover:text-emerald-600 border border-border")} title={isReached ? "Unmark" : "Mark reached"}>
                      <Flag className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t border-border-light px-4 py-3 animate-expand-down">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-[11px]">
                      {lead.phone && <div><span className="text-text-muted">Phone</span><p className="font-medium">{lead.phone}</p></div>}
                      {lead.email && <div><span className="text-text-muted">Email</span><p className="font-medium truncate">{lead.email}</p></div>}
                      {lead.linkedin_url && <div><span className="text-text-muted">LinkedIn</span><p className="font-medium truncate">{lead.linkedin_url}</p></div>}
                      <div><span className="text-text-muted">Industry</span><p className="font-medium">{lead.industry || "—"}</p></div>
                    </div>
                    {(expandedTouches[lead.id] || []).length > 0 ? (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-medium text-text-muted uppercase">History ({(expandedTouches[lead.id] || []).length} touches)</p>
                        {(expandedTouches[lead.id] || []).map((t) => { const ch = chCfg(t.channel); const Icon = ch.icon; return (
                          <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-white border border-border-light group">
                            <div className={cn("h-6 w-6 rounded flex items-center justify-center flex-shrink-0", ch.color)}><Icon className="h-3 w-3" /></div>
                            <span className="text-[10px] text-text-muted w-16 flex-shrink-0">{new Date(t.sent_at).toLocaleDateString()}</span>
                            <span className="text-xs font-medium text-text-primary flex-1">T{t.step}{t.is_call && " · Call"}</span>
                            <span className="text-[10px] text-text-secondary truncate max-w-[200px]">{t.message.substring(0, 80)}...</span>
                            {t.follow_up_date && <Badge className="text-[9px] bg-amber-100 text-amber-700">FU: {t.follow_up_date}</Badge>}
                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={(e) => { e.stopPropagation(); setEditDialog({ open: true, touch: t }); setTouchResponse(t.response || ""); }} className="p-1 rounded hover:bg-cream-dark"><Edit className="h-3 w-3 text-text-muted" /></button>
                              <button onClick={(e) => { e.stopPropagation(); deleteTouchFn(t.id, lead.id); }} className="p-1 rounded hover:bg-red-50"><Trash2 className="h-3 w-3 text-red-400" /></button>
                            </div>
                          </div>
                        ); })}
                      </div>
                    ) : <p className="text-xs text-text-muted text-center py-2">No touches yet.</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasMore && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => setDisplayCount((p) => p + PAGE_SIZE)} className="hover-lift press-effect">Load More ({totalFiltered - displayCount} remaining)</Button>
        </div>
      )}

      <Dialog open={touchDialog.open} onClose={() => setTouchDialog({ open: false, leadId: "", channel: "" })}>
        <DialogHeader><DialogTitle className="flex items-center gap-2">{(() => { const ch = chCfg(touchDialog.channel); const Icon = ch.icon; return <><div className={cn("h-6 w-6 rounded flex items-center justify-center", ch.color)}><Icon className="h-3.5 w-3.5" /></div>Log {ch.label}</>; })()}</DialogTitle><DialogClose onClick={() => setTouchDialog({ open: false, leadId: "", channel: "" })} /></DialogHeader>
        <DialogContent className="space-y-3">
          <div className="text-xs text-text-muted">{(() => { const l = selectedLeads.find((x) => x.id === touchDialog.leadId); return l ? `${l.contact_name} — ${l.company_name}` : ""; })()}</div>
          <div><label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Message</label><Textarea rows={6} value={touchMessage} onChange={(e) => setTouchMessage(e.target.value)} placeholder="Write your message..." className="text-xs" /></div>
        </DialogContent>
        <DialogFooter><Button variant="ghost" onClick={() => setTouchDialog({ open: false, leadId: "", channel: "" })}>Cancel</Button><Button onClick={saveTouch} className="bg-brand-teal hover:bg-brand-teal-dark text-white"><Send className="h-4 w-4 mr-1" />Send & Open</Button></DialogFooter>
      </Dialog>

      <Dialog open={callDialog.open} onClose={() => setCallDialog({ open: false, leadId: "" })}>
        <DialogHeader><DialogTitle className="flex items-center gap-2"><PhoneCall className="h-4 w-4 text-amber-600" />Log Call</DialogTitle><DialogClose onClick={() => setCallDialog({ open: false, leadId: "" })} /></DialogHeader>
        <DialogContent className="space-y-3">
          <div className="text-xs text-text-muted">{(() => { const l = selectedLeads.find((x) => x.id === callDialog.leadId); return l ? `${l.contact_name} — ${l.company_name} · ${l.phone}` : ""; })()}</div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Duration (min)</label><Input type="number" value={callForm.duration} onChange={(e) => setCallForm({ ...callForm, duration: e.target.value })} placeholder="e.g. 15" /></div>
            <div><label className="text-[10px] font-medium text-text-muted uppercase mb-0 block">Outcome</label><Select options={[{ value: "connected", label: "Connected" }, { value: "no_answer", label: "No Answer" }, { value: "voicemail", label: "Voicemail" }, { value: "callback", label: "Callback" }]} value={callForm.outcome} onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })} /></div>
          </div>
          <div><label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Notes</label><Textarea rows={3} value={callForm.notes} onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })} placeholder="Call notes..." /></div>
        </DialogContent>
        <DialogFooter><Button variant="ghost" onClick={() => setCallDialog({ open: false, leadId: "" })}>Cancel</Button><Button onClick={saveCall} className="bg-brand-teal hover:bg-brand-teal-dark text-white">Save Call</Button></DialogFooter>
      </Dialog>

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, touch: null })}>
        <DialogHeader><DialogTitle>Edit Touch</DialogTitle><DialogClose onClick={() => setEditDialog({ open: false, touch: null })} /></DialogHeader>
        <DialogContent><div><label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Response / Notes</label><Textarea rows={3} value={touchResponse} onChange={(e) => setTouchResponse(e.target.value)} placeholder="What happened?" /></div></DialogContent>
        <DialogFooter><Button variant="ghost" onClick={() => setEditDialog({ open: false, touch: null })}>Cancel</Button><Button onClick={saveEdit} className="bg-brand-teal hover:bg-brand-teal-dark text-white">Save</Button></DialogFooter>
      </Dialog>

      <Dialog open={reportOpen} onClose={() => setReportOpen(false)}>
        <DialogHeader><DialogTitle>Generate Report</DialogTitle><DialogClose onClick={() => setReportOpen(false)} /></DialogHeader>
        <DialogContent><div><label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Report Date</label><Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} /></div></DialogContent>
        <DialogFooter><Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button><Button onClick={() => { setReportOpen(false); handlePdfReport(); }} className="bg-brand-teal hover:bg-brand-teal-dark text-white">Generate PDF</Button></DialogFooter>
      </Dialog>
    </div>
  );
}
