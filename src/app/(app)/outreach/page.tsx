"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users, MessageCircle, Mail, ExternalLink, TrendingUp, BarChart3,
  Target, FlaskConical, FileText, Upload, Download, Plus, X, CheckCircle,
  ChevronRight, ChevronDown, Loader2, Send, Building2, Filter, Tag,
  Folder, FileUp, FileSpreadsheet, ArrowRight, Clock, Bell, Eye, Copy,
  Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ToastContainer, addToast } from "@/components/ui/toast";
import { exportToCsv } from "@/lib/export-csv";
import { generatePdfReport, generateDailyReport, generateLeadsReport } from "@/lib/pdf-report";
import { getCompanies } from "@/lib/actions/companies";
import { CHANNEL_RULES, DEFAULT_WHATSAPP_TEMPLATES, DEFAULT_LINKEDIN_TEMPLATES, DEFAULT_EMAIL_TEMPLATES, type MessageTemplate } from "@/lib/outreach-templates";
import { DailyOutreachTracker } from "@/components/outreach/daily-tracker";
import { LinkedInTracker } from "@/components/outreach/linkedin-tracker";
import { TemplateManager } from "@/components/outreach/template-manager";

// ─── Types ──────────────────────────────────────────────────────────
interface Lead {
  id: string; company_name: string; contact_name: string; job_title: string;
  industry: string; city: string; country: string; phone: string; email: string;
  linkedin_url: string; est_deal_value: number; lead_status: string;
  contacts?: any[];
}

interface OutreachEntry {
  id: string; lead_id: string; company_name: string; contact_name: string;
  channel: string; step_number: number; message: string;
  status: "pending" | "sent" | "replied" | "no_response" | "interested" | "not_interested";
  sent_at: string; response_notes: string; next_action: string;
  next_action_date: string; follow_up_scheduled: boolean;
}

// ─── Main Page ──────────────────────────────────────────────────────
export default function OutreachPage() {
  const [phase, setPhase] = useState<"gate" | "active">("gate");
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [entries, setEntries] = useState<OutreachEntry[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([...DEFAULT_WHATSAPP_TEMPLATES, ...DEFAULT_LINKEDIN_TEMPLATES, ...DEFAULT_EMAIL_TEMPLATES]);
  const [loading, setLoading] = useState(false);
  const [selectMode, setSelectMode] = useState<"all" | "custom">("all");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);

  const selectedLeads = useMemo(() => allLeads.filter((l) => selectedLeadIds.has(l.id)), [allLeads, selectedLeadIds]);

  // Load all prospects from database
  const loadAllLeads = async () => {
    setLoading(true);
    const result = await getCompanies();
    if (result.data) {
      const mapped = result.data.map((c: any) => ({
        id: c.id, company_name: c.company_name, contact_name: c.contacts?.[0]?.full_name || "",
        job_title: c.contacts?.[0]?.title || "", industry: c.industry || "", city: c.city || "",
        country: c.country || "", phone: c.contacts?.[0]?.phone || c.phone || "",
        email: c.contacts?.[0]?.email || c.email || "", linkedin_url: c.contacts?.[0]?.linkedin_url || "",
        est_deal_value: c.est_deal_value || 0, lead_status: c.lead_status || c.status || "New",
        contacts: c.contacts || [],
      }));
      setAllLeads(mapped);
    }
    setLoading(false);
  };

  useEffect(() => { loadAllLeads(); }, []);

  const startOutreach = (mode: "all" | "custom") => {
    setSelectMode(mode);
    if (mode === "all") {
      setSelectedLeadIds(new Set(allLeads.map((l) => l.id)));
    }
    setPhase("active");
  };

  const handleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedLeadIds.size === allLeads.length) setSelectedLeadIds(new Set());
    else setSelectedLeadIds(new Set(allLeads.map((l) => l.id)));
  };

  const addEntry = (entry: OutreachEntry) => {
    setEntries((prev) => [entry, ...prev]);
  };

  const handleExportCsv = () => {
    exportToCsv(entries.map((e) => ({
      date: e.sent_at.split("T")[0], time: new Date(e.sent_at).toLocaleTimeString(),
      company: e.company_name, contact: e.contact_name, channel: e.channel,
      step: e.step_number, status: e.status, message: e.message.substring(0, 200),
      response: e.response_notes, next_action: e.next_action, next_date: e.next_action_date,
    })), `outreach-report-${new Date().toISOString().split("T")[0]}.csv`);
    addToast("success", "CSV exported");
  };

  const handleExportPdf = () => {
    generateDailyReport(new Date().toISOString().split("T")[0], entries, selectedLeads);
    addToast("success", "PDF report generated");
  };

  const handleExportLeadsPdf = () => {
    generateLeadsReport(selectedLeads, {}, {}, []);
    addToast("success", "Leads report generated");
  };

  const handleGenerateReport = () => {
    generateDailyReport(reportDate, entries, selectedLeads);
    setReportDialogOpen(false);
    addToast("success", `Report for ${reportDate} generated`);
  };

  // ─── GATE PHASE: Choose how to start ──────────────────────────────
  if (phase === "gate") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center page-enter">
        <ToastContainer />
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="h-16 w-16 rounded-2xl bg-brand-teal flex items-center justify-center mx-auto mb-4">
              <Send className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary">Outreach Tracker</h1>
            <p className="text-text-secondary mt-2 max-w-md mx-auto">Start an outreach session by selecting prospects from your database or importing a new file.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
            {/* Option 1: Choose from existing */}
            <Card className="hover-lift press-effect cursor-pointer border-2 border-transparent hover:border-brand-teal transition-all duration-300" onClick={() => startOutreach("all")}>
              <CardContent className="p-8 text-center">
                <div className="h-14 w-14 rounded-xl bg-brand-teal-light flex items-center justify-center mx-auto mb-4">
                  <Users className="h-7 w-7 text-brand-teal" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Choose from Prospects</h3>
                <p className="text-sm text-text-secondary mb-4">Select from {allLeads.length} existing prospects in your database</p>
                <div className="flex items-center justify-center gap-2 text-brand-teal text-sm font-medium">
                  Start with existing data <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            {/* Option 2: Import file */}
            <Card className="hover-lift press-effect cursor-pointer border-2 border-transparent hover:border-brand-gold transition-all duration-300" onClick={() => setImportDialogOpen(true)}>
              <CardContent className="p-8 text-center">
                <div className="h-14 w-14 rounded-xl bg-brand-gold-light flex items-center justify-center mx-auto mb-4">
                  <FileUp className="h-7 w-7 text-brand-gold" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Import from File</h3>
                <p className="text-sm text-text-secondary mb-4">Import prospects from CSV, Excel, or paste data</p>
                <div className="flex items-center justify-center gap-2 text-brand-gold text-sm font-medium">
                  Import new data <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent activity preview */}
          {entries.length > 0 && (
            <Card className="animate-fade-in-up">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-text-muted" />
                    <span className="text-sm text-text-secondary">Last session: {entries.length} touches logged</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setPhase("active")} className="text-brand-teal">
                    Resume <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Dialog */}
          <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} className="max-w-2xl">
            <DialogHeader><DialogTitle>Import Prospects</DialogTitle><DialogClose onClick={() => setImportDialogOpen(false)} /></DialogHeader>
            <DialogContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-brand-teal transition-colors cursor-pointer" onClick={() => document.getElementById("import-outreach-file")?.click()}>
                <Upload className="h-10 w-10 text-text-muted mx-auto mb-3" />
                <p className="text-sm font-medium text-text-primary mb-1">Click to upload CSV or Excel file</p>
                <p className="text-xs text-text-secondary">Supports: CSV, XLSX, XLS</p>
                <input id="import-outreach-file" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => {
                  if (e.target.files?.[0]) {
                    addToast("success", "File imported successfully");
                    setImportDialogOpen(false);
                    startOutreach("all");
                  }
                }} />
              </div>
              <div className="text-center">
                <p className="text-xs text-text-muted">Or paste data directly</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // ─── ACTIVE PHASE: Full outreach system ────────────────────────────
  const TABS = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
    { id: "linkedin", label: "LinkedIn", icon: ExternalLink },
    { id: "email", label: "Email", icon: Mail },
    { id: "templates", label: "Templates", icon: FileText },
  ];

  return (
    <div className="space-y-5 page-enter">
      <ToastContainer />

      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setPhase("gate")} className="text-text-muted hover:text-text-primary">
            <ArrowRight className="h-4 w-4 mr-1 rotate-180" />Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Outreach Session</h1>
            <p className="text-text-secondary text-sm mt-0.5">{selectedLeads.length} prospects selected · {entries.length} touches logged</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setReportDialogOpen(true)} className="hover-lift press-effect"><Printer className="h-3.5 w-3.5 mr-1" />Report</Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="hover-lift press-effect"><Download className="h-3.5 w-3.5 mr-1" />CSV</Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf} className="hover-lift press-effect"><FileText className="h-3.5 w-3.5 mr-1" />PDF</Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 stagger-children">
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-brand-teal">{selectedLeads.length}</p>
          <p className="text-[10px] text-text-muted">Prospects</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-green-600">{entries.filter((e) => e.status !== "pending").length}</p>
          <p className="text-[10px] text-text-muted">Sent</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{entries.filter((e) => ["replied", "interested"].includes(e.status)).length}</p>
          <p className="text-[10px] text-text-muted">Replies</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-amber-600">{entries.filter((e) => e.follow_up_scheduled).length}</p>
          <p className="text-[10px] text-text-muted">Follow-ups</p>
        </CardContent></Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border pb-0">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-all rounded-t-lg border-b-2 -mb-px", activeTab === tab.id ? "bg-brand-teal text-white border-brand-teal" : "text-text-secondary border-transparent hover:text-brand-teal hover:bg-white/60")}>
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === "dashboard" && <DashboardTab entries={entries} leads={selectedLeads} />}
        {activeTab === "whatsapp" && <WhatsAppTab leads={selectedLeads} templates={templates} onEntry={addEntry} />}
        {activeTab === "linkedin" && <LinkedInTabComp leads={selectedLeads} templates={templates} />}
        {activeTab === "email" && <EmailTabComp leads={selectedLeads} templates={templates} onEntry={addEntry} />}
        {activeTab === "templates" && <TemplatesTabComp templates={templates} setTemplates={setTemplates} />}
      </div>

      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)}>
        <DialogHeader><DialogTitle>Generate Report</DialogTitle><DialogClose onClick={() => setReportDialogOpen(false)} /></DialogHeader>
        <DialogContent className="space-y-3">
          <div>
            <label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Report Date</label>
            <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => { handleExportCsv(); setReportDialogOpen(false); }}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
            <Button variant="outline" onClick={() => { handleExportLeadsPdf(); setReportDialogOpen(false); }}><FileText className="h-4 w-4 mr-2" />Leads Report</Button>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setReportDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleGenerateReport} className="bg-brand-teal hover:bg-brand-teal-dark text-white">Generate PDF Report</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}

// ─── DASHBOARD TAB ──────────────────────────────────────────────────
function DashboardTab({ entries, leads }: { entries: OutreachEntry[]; leads: Lead[] }) {
  const today = new Date().toISOString().split("T")[0];
  const todayEntries = entries.filter((e) => e.sent_at?.startsWith(today));
  const channels = ["whatsapp", "linkedin", "email", "call", "meeting"];

  return (
    <div className="space-y-4">
      <Card className="hover-lift"><CardContent className="p-4">
        <p className="text-sm font-medium text-text-primary mb-3">Today's Performance</p>
        <div className="grid grid-cols-5 gap-2 stagger-children">
          {channels.map((ch) => {
            const count = todayEntries.filter((e) => e.channel === ch).length;
            const replies = todayEntries.filter((e) => e.channel === ch && ["replied", "interested"].includes(e.status)).length;
            return (
              <div key={ch} className="p-3 rounded-xl bg-white border border-border-light text-center">
                <p className="text-lg font-bold text-brand-teal">{count}</p>
                <p className="text-[10px] text-text-muted capitalize">{ch}</p>
                {count > 0 && <p className="text-[9px] text-green-600">{replies} replies</p>}
              </div>
            );
          })}
        </div>
      </CardContent></Card>

      {/* Prospect Summary */}
      <Card className="hover-lift"><CardContent className="p-4">
        <p className="text-sm font-medium text-text-primary mb-3">Selected Prospects Summary</p>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {leads.map((l) => {
            const leadEntries = entries.filter((e) => e.lead_id === l.id);
            const lastEntry = leadEntries[0];
            return (
              <div key={l.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-cream-dark/30 transition-colors">
                <div className="h-7 w-7 rounded-md bg-brand-teal-light flex items-center justify-center flex-shrink-0">
                  <Users className="h-3.5 w-3.5 text-brand-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary">{l.contact_name || l.company_name}</p>
                  <p className="text-[10px] text-text-muted">{l.company_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-medium text-text-secondary">{leadEntries.length} touches</p>
                  {lastEntry && <p className="text-[9px] text-text-muted">{lastEntry.channel} · T{lastEntry.step_number}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent></Card>
    </div>
  );
}

// ─── WHATSAPP TAB ───────────────────────────────────────────────────
function WhatsAppTab({ leads, templates, onEntry }: { leads: Lead[]; templates: MessageTemplate[]; onEntry: (e: OutreachEntry) => void }) {
  return <DailyOutreachTracker leads={leads} templates={templates} channel="whatsapp" onEntry={onEntry} />;
}

// ─── LINKEDIN TAB ───────────────────────────────────────────────────
function LinkedInTabComp({ leads, templates }: { leads: Lead[]; templates: MessageTemplate[] }) {
  return <LinkedInTracker leads={leads} />;
}

// ─── EMAIL TAB ──────────────────────────────────────────────────────
function EmailTabComp({ leads, templates, onEntry }: { leads: Lead[]; templates: MessageTemplate[]; onEntry: (e: OutreachEntry) => void }) {
  return <DailyOutreachTracker leads={leads} templates={templates} channel="email" onEntry={onEntry} />;
}

// ─── TEMPLATES TAB ──────────────────────────────────────────────────
function TemplatesTabComp({ templates, setTemplates }: { templates: MessageTemplate[]; setTemplates: (t: MessageTemplate[]) => void }) {
  return <TemplateManager templates={templates} onUpdate={setTemplates} />;
}
