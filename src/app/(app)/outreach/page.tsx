"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users, Phone, MessageCircle, Mail, ExternalLink, TrendingUp, BarChart3,
  Target, FlaskConical, FileText, Upload, Download, Plus, X, CheckCircle,
  ChevronRight, ChevronDown, Loader2, AlertTriangle, Send, Eye, Calendar,
  Clock, Building2, GitBranch, TestTube2, ClipboardList, ArrowUpRight,
  Folder, FolderOpen, Tag, Filter, Flame, Sun, Snowflake, RefreshCw,
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
import { getCompanies } from "@/lib/actions/companies";

// ─── Mini Bar Chart Component ──────────────────────────────────────
function MiniBarChart({ data, maxVal }: { data: { label: string; value: number; color: string }[]; maxVal?: number }) {
  const max = maxVal || Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-text-primary">{d.value}</span>
          <div className="w-full rounded-t transition-all duration-500" style={{ height: `${Math.max((d.value / max) * 70, 4)}px`, backgroundColor: d.color }} />
          <span className="text-[9px] text-text-muted leading-tight text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Progress Ring ──────────────────────────────────────────────────
function ProgressRing({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const r = 36, c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width="80" height="80" className="-rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#e8e3d8" strokeWidth="6" />
          <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-text-primary">{Math.round(pct)}%</span>
        </div>
      </div>
      <span className="text-[11px] text-text-muted text-center">{label}</span>
      <span className="text-xs font-semibold text-text-primary">{value}/{max}</span>
    </div>
  );
}

// ─── Data Types ─────────────────────────────────────────────────────
interface Lead {
  id: string; lead_id: string; date_added: string; company_name: string; contact_name: string;
  job_title: string; industry: string; company_size: string; city: string; phone: string;
  email: string; linkedin_url: string; lead_source: string; assigned_bdm: string;
  icp_match: string; fawtara_flag: string; lead_status: string; pipeline_stage: string;
  est_deal_value: number; notes: string; contacts?: any[];
}

interface ActivityEntry {
  id: string; date: string; company_name: string; contact_name: string; channel: string;
  touch_number: number; message_sent: boolean; response_received: boolean; response_type: string;
  outcome_notes: string; next_action: string; next_action_date: string; bdm: string;
}

interface PipelineDeal {
  id: string; company_name: string; contact_name: string; service_pillar: string;
  deal_stage: string; est_value: number; probability: number; meeting_status: string;
  proposal_sent_date: string; expected_close_date: string; objection: string;
}

interface WeeklyReport {
  id: string; week_number: number; week_start: string; leads_added: number;
  total_touches: number; li_touches: number; wa_touches: number; email_touches: number;
  calls_made: number; total_responses: number; meetings_booked: number;
  meetings_completed: number; deals_won: number; revenue_closed_omr: number;
  pipeline_value_omr: number; key_observation: string;
  no_shows?: number;
}

interface AbTest {
  id: string; test_id: string; week_number: number; test_type: string; channel: string;
  variant_a_description: string; variant_a_sends: number; variant_a_replies: number;
  variant_b_description: string; variant_b_sends: number; variant_b_replies: number;
  statistical_winner: string; action_taken: string;
}

interface PillarTarget {
  id: string; pillar_name: string; target_revenue_omr: number; target_deals: number;
  target_leads: number; actual_revenue_omr: number; actual_deals: number; actual_leads: number;
}

// ─── Category Types ─────────────────────────────────────────────────
interface LeadCategory {
  id: string; name: string; color: string; icon: string; sort_order: number;
  subcategories?: LeadCategory[];
}

interface OutreachCategory {
  id: string; name: string; color: string; icon: string; description: string; sort_order: number;
}

const DEFAULT_LEAD_CATEGORIES: LeadCategory[] = [
  { id: "cat1", name: "Hot Leads", color: "#ef4444", icon: "flame", sort_order: 1 },
  { id: "cat2", name: "Warm Leads", color: "#f59e0b", icon: "sun", sort_order: 2 },
  { id: "cat3", name: "Cold Leads", color: "#3b82f6", icon: "snowflake", sort_order: 3 },
  { id: "cat4", name: "Referrals", color: "#10b981", icon: "users", sort_order: 4 },
  { id: "cat5", name: "Inbound", color: "#8b5cf6", icon: "arrow-down-left", sort_order: 5 },
  { id: "cat6", name: "Outbound", color: "#0d9488", icon: "arrow-up-right", sort_order: 6 },
  { id: "cat7", name: "Event Leads", color: "#ec4899", icon: "calendar", sort_order: 7 },
  { id: "cat8", name: "Website Leads", color: "#6366f1", icon: "globe", sort_order: 8 },
];

const DEFAULT_OUTREACH_CATEGORIES: OutreachCategory[] = [
  { id: "oc1", name: "Cold Outreach", color: "#3b82f6", icon: "snowflake", description: "First-time contact", sort_order: 1 },
  { id: "oc2", name: "Warm Follow-up", color: "#f59e0b", icon: "sun", description: "Following up on previous interaction", sort_order: 2 },
  { id: "oc3", name: "Re-engagement", color: "#8b5cf6", icon: "refresh-cw", description: "Re-activating dormant leads", sort_order: 3 },
  { id: "oc4", name: "Upsell/Cross-sell", color: "#10b981", icon: "trending-up", description: "Existing clients — new services", sort_order: 4 },
  { id: "oc5", name: "Referral Outreach", color: "#ec4899", icon: "users", description: "Contacts from referrals", sort_order: 5 },
  { id: "oc6", name: "Event Follow-up", color: "#0d9488", icon: "calendar", description: "Post-event networking", sort_order: 6 },
  { id: "oc7", name: "Demo/Presentation", color: "#6366f1", icon: "presentation", description: "Product demo or pitch meetings", sort_order: 7 },
  { id: "oc8", name: "Contract Negotiation", color: "#ef4444", icon: "file-text", description: "Active deal discussions", sort_order: 8 },
];

const LEAD_TYPES = ["Cold", "Warm", "Hot", "Referral", "Inbound", "VIP", "Dormant"];

const LEAD_TYPE_COLORS: Record<string, string> = {
  Cold: "#3b82f6", Warm: "#f59e0b", Hot: "#ef4444", Referral: "#10b981",
  Inbound: "#8b5cf6", VIP: "#C8A951", Dormant: "#94a3b8",
};

// ─── Tab Config ─────────────────────────────────────────────────────
const TABS = [
  { id: "leads", label: "Leads Database", icon: Users },
  { id: "activity", label: "Activity Log", icon: ClipboardList },
  { id: "pipeline", label: "Pipeline", icon: TrendingUp },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "linkedin", label: "LinkedIn", icon: ExternalLink },
  { id: "pillars", label: "Pillar Targets", icon: Target },
  { id: "abtest", label: "A/B Testing", icon: FlaskConical },
  { id: "reports", label: "Weekly Reports", icon: BarChart3 },
];

// ─── Main Page ──────────────────────────────────────────────────────
export default function OutreachPage() {
  const [activeTab, setActiveTab] = useState("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [pipeline, setPipeline] = useState<PipelineDeal[]>([]);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [abTests, setAbTests] = useState<AbTest[]>([]);
  const [pillarTargets, setPillarTargets] = useState<PillarTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [importOpen, setImportOpen] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [leadCategories] = useState<LeadCategory[]>(DEFAULT_LEAD_CATEGORIES);
  const [outreachCategories] = useState<OutreachCategory[]>(DEFAULT_OUTREACH_CATEGORIES);
  const [selectedLeadCategory, setSelectedLeadCategory] = useState<string | null>(null);
  const [selectedLeadType, setSelectedLeadType] = useState<string | null>(null);
  const [categoryDialog, setCategoryDialog] = useState<{ open: boolean; leadId: string | null }>({ open: false, leadId: null });
  const [leadTypeMap, setLeadTypeMap] = useState<Record<string, string>>({});
  const [leadCategoryMap, setLeadCategoryMap] = useState<Record<string, string[]>>({});
  const [outreachCatFilter, setOutreachCatFilter] = useState<string | null>(null);

  useEffect(() => {
    // Load sample data for demo
    loadDemoData();
    setLoading(false);
  }, []);

  const loadDemoData = () => {
    setLeads(sampleLeads);
    setActivities(sampleActivities);
    setPipeline(samplePipeline);
    setWeeklyReports(sampleWeeklyReports);
    setAbTests(sampleAbTests);
    setPillarTargets(samplePillarTargets);
  };

  const handleImport = (data: Record<string, string>[]) => {
    addToast("success", `Imported ${data.length} records`);
    setImportOpen(false);
  };

  const handleExport = () => {
    exportToCsv(leads.map((l) => ({
      lead_id: l.lead_id, company_name: l.company_name, contact_name: l.contact_name,
      job_title: l.job_title, industry: l.industry, city: l.city, phone: l.phone,
      email: l.email, lead_source: l.lead_source, lead_status: l.lead_status,
      lead_type: leadTypeMap[l.id] || "Cold", categories: (leadCategoryMap[l.id] || []).join("; "),
      est_deal_value: l.est_deal_value, notes: l.notes,
    })), `outreach-leads-${new Date().toISOString().split("T")[0]}.csv`);
    addToast("success", "Leads exported");
  };

  const assignLeadType = (leadId: string, type: string) => {
    setLeadTypeMap((prev) => ({ ...prev, [leadId]: type }));
    addToast("success", `Lead type set to "${type}"`);
  };

  const assignLeadCategory = (leadId: string, categoryId: string) => {
    setLeadCategoryMap((prev) => {
      const current = prev[leadId] || [];
      const updated = current.includes(categoryId) ? current.filter((c) => c !== categoryId) : [...current, categoryId];
      return { ...prev, [leadId]: updated };
    });
  };

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (selectedLeadCategory) {
      result = result.filter((l) => (leadCategoryMap[l.id] || []).includes(selectedLeadCategory));
    }
    if (selectedLeadType) {
      result = result.filter((l) => (leadTypeMap[l.id] || "Cold") === selectedLeadType);
    }
    return result;
  }, [leads, selectedLeadCategory, selectedLeadType, leadTypeMap, leadCategoryMap]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin h-8 w-8 text-brand-teal" />
    </div>
  );

  return (
    <div className="space-y-5 page-enter">
      <ToastContainer />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Outreach Tracker</h1>
          <p className="text-text-secondary text-sm mt-0.5">Tadbeer Transformations — Complete Outreach Management System</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="hover-lift press-effect"><Download className="h-3.5 w-3.5 mr-1" />Export</Button>
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} className="hover-lift press-effect"><Upload className="h-3.5 w-3.5 mr-1" />Import</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        <Card className="hover-lift"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-brand-teal">{leads.length}</p>
          <p className="text-[11px] text-text-muted">Total Leads</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{leads.filter((l) => l.lead_status === "Won").length}</p>
          <p className="text-[11px] text-text-muted">Deals Won</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{activities.length}</p>
          <p className="text-[11px] text-text-muted">Total Touches</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">OMR {pipeline.reduce((s, p) => s + (p.est_value * p.probability / 100), 0).toFixed(0)}</p>
          <p className="text-[11px] text-text-muted">Weighted Pipeline</p>
        </CardContent></Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-border pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap transition-all rounded-t-lg border-b-2 -mb-px",
              activeTab === tab.id
                ? "bg-brand-teal text-white border-brand-teal"
                : "text-text-secondary border-transparent hover:text-brand-teal hover:bg-white/60"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === "leads" && <LeadsTab leads={filteredLeads} expandedLead={expandedLead} setExpandedLead={setExpandedLead} leadCategories={leadCategories} leadTypeMap={leadTypeMap} leadCategoryMap={leadCategoryMap} onAssignType={assignLeadType} onAssignCategory={assignLeadCategory} selectedLeadCategory={selectedLeadCategory} setSelectedLeadCategory={setSelectedLeadCategory} selectedLeadType={selectedLeadType} setSelectedLeadType={setSelectedLeadType} outreachCategories={outreachCategories} outreachCatFilter={outreachCatFilter} setOutreachCatFilter={setOutreachCatFilter} />}
        {activeTab === "activity" && <ActivityTab activities={activities} />}
        {activeTab === "pipeline" && <PipelineTab pipeline={pipeline} />}
        {activeTab === "whatsapp" && <WhatsAppTab />}
        {activeTab === "linkedin" && <LinkedInTab />}
        {activeTab === "pillars" && <PillarsTab targets={pillarTargets} />}
        {activeTab === "abtest" && <AbTestTab tests={abTests} />}
        {activeTab === "reports" && <ReportsTab reports={weeklyReports} />}
      </div>
    </div>
  );
}

// ─── LEADS TAB ──────────────────────────────────────────────────────
function LeadsTab({ leads, expandedLead, setExpandedLead, leadCategories, leadTypeMap, leadCategoryMap, onAssignType, onAssignCategory, selectedLeadCategory, setSelectedLeadCategory, selectedLeadType, setSelectedLeadType, outreachCategories, outreachCatFilter, setOutreachCatFilter }: {
  leads: Lead[]; expandedLead: string | null; setExpandedLead: (id: string | null) => void;
  leadCategories: LeadCategory[]; leadTypeMap: Record<string, string>; leadCategoryMap: Record<string, string[]>;
  onAssignType: (id: string, type: string) => void; onAssignCategory: (id: string, catId: string) => void;
  selectedLeadCategory: string | null; setSelectedLeadCategory: (id: string | null) => void;
  selectedLeadType: string | null; setSelectedLeadType: (type: string | null) => void;
  outreachCategories: OutreachCategory[]; outreachCatFilter: string | null; setOutreachCatFilter: (id: string | null) => void;
}) {
  const [catDialogLead, setCatDialogLead] = useState<string | null>(null);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => { counts[l.lead_status] = (counts[l.lead_status] || 0) + 1; });
    return counts;
  }, [leads]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const cats = leadCategoryMap[l.id] || [];
      cats.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
    });
    return counts;
  }, [leads, leadCategoryMap]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const t = leadTypeMap[l.id] || "Cold";
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [leads, leadTypeMap]);

  const statusColors: Record<string, string> = {
    New: "bg-slate-100 text-slate-700", Contacted: "bg-blue-100 text-blue-700",
    Qualified: "bg-amber-100 text-amber-700", "Meeting Booked": "bg-purple-100 text-purple-700",
    "Proposal Sent": "bg-indigo-100 text-indigo-700", Negotiation: "bg-teal-100 text-teal-700",
    Won: "bg-emerald-100 text-emerald-700", Lost: "bg-red-100 text-red-700",
  };

  const iconMap: Record<string, React.ElementType> = {
    flame: Flame, sun: Sun, snowflake: Snowflake, users: Users, calendar: Calendar,
    globe: ExternalLink, "arrow-down-left": ArrowUpRight, "arrow-up-right": ArrowUpRight,
    "refresh-cw": RefreshCw, "trending-up": TrendingUp, "file-text": FileText,
  };

  return (
    <div className="space-y-4">
      {/* Outreach Type Filter */}
      <Card className="hover-lift"><CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-3.5 w-3.5 text-text-muted" />
          <span className="text-xs font-medium text-text-secondary">Outreach Type</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setOutreachCatFilter(null)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium transition-all press-effect", !outreachCatFilter ? "bg-brand-teal text-white" : "bg-white border border-border text-text-secondary hover:bg-cream-dark")}>All</button>
          {outreachCategories.map((cat) => (
            <button key={cat.id} onClick={() => setOutreachCatFilter(outreachCatFilter === cat.id ? null : cat.id)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium transition-all press-effect flex items-center gap-1", outreachCatFilter === cat.id ? "text-white" : "bg-white border border-border text-text-secondary hover:bg-cream-dark")} style={outreachCatFilter === cat.id ? { backgroundColor: cat.color } : {}}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.name}
            </button>
          ))}
        </div>
      </CardContent></Card>

      {/* Lead Type + Category Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="hover-lift"><CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-3.5 w-3.5 text-text-muted" />
            <span className="text-xs font-medium text-text-secondary">Lead Type</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSelectedLeadType(null)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium transition-all press-effect", !selectedLeadType ? "bg-brand-teal text-white" : "bg-white border border-border text-text-secondary hover:bg-cream-dark")}>All</button>
            {LEAD_TYPES.map((type) => (
              <button key={type} onClick={() => setSelectedLeadType(selectedLeadType === type ? null : type)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium transition-all press-effect flex items-center gap-1", selectedLeadType === type ? "text-white" : "bg-white border border-border text-text-secondary hover:bg-cream-dark")} style={selectedLeadType === type ? { backgroundColor: LEAD_TYPE_COLORS[type] } : {}}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LEAD_TYPE_COLORS[type] }} />
                {type} <span className="opacity-60">{typeCounts[type] || 0}</span>
              </button>
            ))}
          </div>
        </CardContent></Card>

        <Card className="hover-lift"><CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Folder className="h-3.5 w-3.5 text-text-muted" />
            <span className="text-xs font-medium text-text-secondary">Lead Category</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setSelectedLeadCategory(null)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium transition-all press-effect", !selectedLeadCategory ? "bg-brand-teal text-white" : "bg-white border border-border text-text-secondary hover:bg-cream-dark")}>All</button>
            {leadCategories.map((cat) => {
              const Icon = iconMap[cat.icon] || Folder;
              return (
                <button key={cat.id} onClick={() => setSelectedLeadCategory(selectedLeadCategory === cat.id ? null : cat.id)} className={cn("px-2.5 py-1 rounded-full text-[11px] font-medium transition-all press-effect flex items-center gap-1", selectedLeadCategory === cat.id ? "text-white" : "bg-white border border-border text-text-secondary hover:bg-cream-dark")} style={selectedLeadCategory === cat.id ? { backgroundColor: cat.color } : {}}>
                  <Icon className="h-3 w-3" />
                  {cat.name} <span className="opacity-60">{categoryCounts[cat.id] || 0}</span>
                </button>
              );
            })}
          </div>
        </CardContent></Card>
      </div>

      {/* Leads List */}
      <div className="divide-y divide-border-light stagger-children">
        {leads.map((lead) => {
          const contact = lead.contacts?.[0];
          const isExpanded = expandedLead === lead.id;
          const leadType = leadTypeMap[lead.id] || "Cold";
          const leadCats = leadCategoryMap[lead.id] || [];

          return (
            <div key={lead.id} className="animate-fade-in">
              <div className="flex items-center gap-3 py-3 px-4 hover:bg-cream-dark/30 cursor-pointer transition-all duration-200" onClick={() => setExpandedLead(isExpanded ? null : lead.id)}>
                <button className="flex-shrink-0 text-text-muted transition-transform duration-200">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
                <div className="h-9 w-9 rounded-lg bg-brand-teal-light flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110">
                  <Users className="h-4 w-4 text-brand-teal" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-text-primary">{lead.contact_name}</span>
                    <span className="text-xs text-text-muted">· {lead.job_title}</span>
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: LEAD_TYPE_COLORS[leadType] }} title={leadType} />
                  </div>
                  <p className="text-xs text-text-secondary">{lead.company_name} · {lead.industry} · {lead.city}</p>
                </div>
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                  {leadCats.slice(0, 2).map((catId) => {
                    const cat = leadCategories.find((c) => c.id === catId);
                    return cat ? <Badge key={catId} className="text-[9px] px-1.5 py-0" style={{ backgroundColor: cat.color + "20", color: cat.color }}>{cat.name}</Badge> : null;
                  })}
                </div>
                <Badge className={cn("text-[10px] flex-shrink-0", statusColors[lead.lead_status] || "bg-slate-100")}>{lead.lead_status}</Badge>
                <span className="text-xs font-medium text-text-muted flex-shrink-0">OMR {lead.est_deal_value.toLocaleString()}</span>
              </div>

              {/* Expanded card */}
              {isExpanded && (
                <div className="bg-cream-dark/40 border-t border-border-light px-4 py-3 ml-9 animate-expand-down">
                  {/* Type + Category Assignment */}
                  <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-border-light">
                    <span className="text-[10px] font-medium text-text-muted uppercase">Type:</span>
                    <Select options={LEAD_TYPES.map((t) => ({ value: t, label: t }))} value={leadType} onChange={(e) => onAssignType(lead.id, e.target.value)} className="h-7 w-28 text-xs" />
                    <span className="text-[10px] font-medium text-text-muted uppercase ml-2">Categories:</span>
                    <button onClick={(e) => { e.stopPropagation(); setCatDialogLead(lead.id); }} className="h-7 px-2 rounded-lg border border-dashed border-border text-[11px] text-text-muted hover:border-brand-teal hover:text-brand-teal transition-colors flex items-center gap-1">
                      <Plus className="h-3 w-3" />Assign
                    </button>
                    {leadCats.map((catId) => {
                      const cat = leadCategories.find((c) => c.id === catId);
                      return cat ? (
                        <button key={catId} onClick={(e) => { e.stopPropagation(); onAssignCategory(lead.id, catId); }} className="h-6 px-2 rounded-full text-[10px] font-medium flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ backgroundColor: cat.color + "20", color: cat.color }}>
                          {cat.name} <X className="h-2.5 w-2.5" />
                        </button>
                      ) : null;
                    })}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs stagger-children">
                    <div className="space-y-1"><span className="text-text-muted">Phone</span><p className="font-medium">{lead.phone || "—"}</p></div>
                    <div className="space-y-1"><span className="text-text-muted">Email</span><p className="font-medium">{lead.email || "—"}</p></div>
                    <div className="space-y-1"><span className="text-text-muted">LinkedIn</span><p className="font-medium">{lead.linkedin_url || "—"}</p></div>
                    <div className="space-y-1"><span className="text-text-muted">Source</span><p className="font-medium">{lead.lead_source || "—"}</p></div>
                    <div className="space-y-1"><span className="text-text-muted">BDM</span><p className="font-medium">{lead.assigned_bdm || "—"}</p></div>
                    <div className="space-y-1"><span className="text-text-muted">ICP Match</span><p className="font-medium">{lead.icp_match || "—"}</p></div>
                    <div className="space-y-1"><span className="text-text-muted">Fawtara</span><p className="font-medium">{lead.fawtara_flag || "—"}</p></div>
                    <div className="space-y-1"><span className="text-text-muted">Deal Value</span><p className="font-medium">OMR {lead.est_deal_value.toLocaleString()}</p></div>
                  </div>
                  {lead.notes && <p className="mt-2 text-xs text-text-muted italic">{lead.notes}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Category Assignment Dialog */}
      <Dialog open={!!catDialogLead} onClose={() => setCatDialogLead(null)}>
        <DialogHeader><DialogTitle>Assign Categories</DialogTitle><DialogClose onClick={() => setCatDialogLead(null)} /></DialogHeader>
        <DialogContent>
          <div className="grid grid-cols-2 gap-2">
            {leadCategories.map((cat) => {
              const Icon = iconMap[cat.icon] || Folder;
              const assigned = catDialogLead ? (leadCategoryMap[catDialogLead] || []).includes(cat.id) : false;
              return (
                <button key={cat.id} onClick={() => catDialogLead && onAssignCategory(catDialogLead, cat.id)} className={cn("flex items-center gap-2 p-3 rounded-xl border transition-all duration-200 press-effect text-left", assigned ? "border-brand-teal bg-brand-teal-light" : "border-border hover:border-brand-teal/30 hover:bg-cream-dark/50")}>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat.color + "20" }}>
                    <Icon className="h-4 w-4" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-text-primary">{cat.name}</p>
                    {assigned && <p className="text-[10px] text-brand-teal">Assigned</p>}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── ACTIVITY LOG TAB ───────────────────────────────────────────────
function ActivityTab({ activities }: { activities: ActivityEntry[] }) {
  const channelColors: Record<string, string> = { WhatsApp: "bg-green-100 text-green-700", LinkedIn: "bg-blue-100 text-blue-700", Email: "bg-slate-100 text-slate-700", Call: "bg-amber-100 text-amber-700", Meeting: "bg-purple-100 text-purple-700" };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2 stagger-children">
        {["WhatsApp", "LinkedIn", "Email", "Call", "Meeting"].map((ch) => (
          <Card key={ch} className="hover-lift"><CardContent className="p-3 text-center">
            <p className="text-lg font-bold">{activities.filter((a) => a.channel === ch).length}</p>
            <p className="text-[10px] text-text-muted">{ch}</p>
          </CardContent></Card>
        ))}
      </div>
      <div className="space-y-2 stagger-children">
        {activities.map((a) => (
          <Card key={a.id} className="hover-lift"><CardContent className="p-3 flex items-center gap-3">
            <Badge className={cn("text-[10px]", channelColors[a.channel])}>{a.channel}</Badge>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{a.company_name} — {a.contact_name}</p>
              <p className="text-xs text-text-muted">Touch #{a.touch_number} · {a.date} · {a.outcome_notes}</p>
            </div>
            <div className="flex items-center gap-1">
              {a.message_sent && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
              {a.response_received && <Badge className="bg-green-100 text-green-700 text-[10px]">Reply</Badge>}
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ─── PIPELINE TAB ───────────────────────────────────────────────────
function PipelineTab({ pipeline }: { pipeline: PipelineDeal[] }) {
  const stages = ["Qualified", "Proposal Sent", "Negotiation", "Verbal Commit", "Won", "Lost"];
  const stageColors: Record<string, string> = { Qualified: "#3b82f6", "Proposal Sent": "#f59e0b", Negotiation: "#8b5cf6", "Verbal Commit": "#0d9488", Won: "#10b981", Lost: "#ef4444" };

  const stageData = stages.map((s) => ({ label: s.replace(" ", "\n"), value: pipeline.filter((p) => p.deal_stage === s).length, color: stageColors[s] || "#94a3b8" }));
  const totalValue = pipeline.reduce((s, p) => s + p.est_value, 0);
  const weightedValue = pipeline.reduce((s, p) => s + (p.est_value * p.probability / 100), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 stagger-children">
        <Card className="hover-lift"><CardContent className="p-4 text-center">
          <p className="text-xl font-bold text-brand-teal">OMR {totalValue.toLocaleString()}</p>
          <p className="text-[11px] text-text-muted">Total Pipeline</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-4 text-center">
          <p className="text-xl font-bold text-green-600">OMR {weightedValue.toLocaleString()}</p>
          <p className="text-[11px] text-text-muted">Weighted Value</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-4 text-center">
          <p className="text-xl font-bold text-purple-600">{pipeline.length}</p>
          <p className="text-[11px] text-text-muted">Active Deals</p>
        </CardContent></Card>
      </div>
      <Card className="hover-lift"><CardContent className="p-4">
        <p className="text-xs font-medium text-text-muted mb-3">Deals by Stage</p>
        <MiniBarChart data={stageData} />
      </CardContent></Card>
      <div className="space-y-2 stagger-children">
        {pipeline.map((p) => (
          <Card key={p.id} className="hover-lift"><CardContent className="p-3 flex items-center gap-3">
            <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: stageColors[p.deal_stage] || "#94a3b8" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{p.company_name}</p>
              <p className="text-xs text-text-muted">{p.contact_name} · {p.service_pillar}</p>
            </div>
            <Badge className="text-[10px]" style={{ backgroundColor: stageColors[p.deal_stage] + "20", color: stageColors[p.deal_stage] }}>{p.deal_stage}</Badge>
            <span className="text-xs font-semibold text-text-primary">OMR {p.est_value.toLocaleString()}</span>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ─── WHATSAPP TAB ───────────────────────────────────────────────────
function WhatsAppTab() {
  const steps = [1, 2, 3, 4, 5];
  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4">
        <p className="text-xs text-text-muted mb-2">WhatsApp Flow — Max 40-50 new touches/day. 60% reply rate target.</p>
        <div className="grid grid-cols-5 gap-2 stagger-children">
          {steps.map((s) => (
            <Card key={s} className="hover-lift"><CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-green-600">Step {s}</p>
              <p className="text-[10px] text-text-muted">{["Intro", "Value Prop", "Case Study", "Follow-up", "Final"][s - 1]}</p>
            </CardContent></Card>
          ))}
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-6 text-center">
        <MessageCircle className="h-10 w-10 text-green-500 mx-auto mb-3 opacity-40" />
        <p className="text-sm text-text-secondary">Import WhatsApp tracker data to see activity here.</p>
        <p className="text-xs text-text-muted mt-1">Supports CSV import with WA tracking columns.</p>
      </CardContent></Card>
    </div>
  );
}

// ─── LINKEDIN TAB ───────────────────────────────────────────────────
function LinkedInTab() {
  const touches = ["T1: Connection", "T2: Welcome", "T3: Value", "T4: Case Study", "T5: Follow-up", "T6: Break-up", "T7: Final"];
  return (
    <div className="space-y-4">
      <Card><CardContent className="p-4">
        <p className="text-xs text-text-muted mb-3">7-Touch LinkedIn Sequence — Target: 15 connections + 10 DMs + 5 warm DMs daily.</p>
        <div className="grid grid-cols-7 gap-1 stagger-children">
          {touches.map((t, i) => (
            <div key={i} className="text-center p-2 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs font-bold text-blue-700">T{i + 1}</p>
              <p className="text-[9px] text-text-muted mt-0.5">{t.split(": ")[1]}</p>
            </div>
          ))}
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-6 text-center">
        <ExternalLink className="h-10 w-10 text-blue-500 mx-auto mb-3 opacity-40" />
        <p className="text-sm text-text-secondary">Import LinkedIn sequence data to track touch progress.</p>
      </CardContent></Card>
    </div>
  );
}

// ─── PILLARS TAB ────────────────────────────────────────────────────
function PillarsTab({ targets }: { targets: PillarTarget[] }) {
  const totalTarget = targets.reduce((s, t) => s + t.target_revenue_omr, 0);
  const totalActual = targets.reduce((s, t) => s + t.actual_revenue_omr, 0);
  const overallPct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card className="hover-lift"><CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-text-primary">Overall Target Progress</p>
          <p className="text-sm font-bold text-brand-teal">OMR {totalActual.toLocaleString()} / {totalTarget.toLocaleString()}</p>
        </div>
        <div className="bg-cream-dark rounded-full h-3 overflow-hidden">
          <div className="bg-brand-teal h-3 rounded-full transition-all duration-1000" style={{ width: `${Math.min(overallPct, 100)}%` }} />
        </div>
        <p className="text-xs text-text-muted mt-1">{overallPct}% achieved</p>
      </CardContent></Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
        {targets.map((t) => (
          <Card key={t.id} className="hover-lift">
            <CardContent className="p-4 flex flex-col items-center">
              <ProgressRing value={t.actual_revenue_omr} max={t.target_revenue_omr} label={t.pillar_name} color="#0D4F4F" />
              <div className="mt-2 text-center">
                <p className="text-xs text-text-muted">Deals: {t.actual_deals}/{t.target_deals}</p>
                <p className="text-xs text-text-muted">Leads: {t.actual_leads}/{t.target_leads}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── A/B TEST TAB ───────────────────────────────────────────────────
function AbTestTab({ tests }: { tests: AbTest[] }) {
  return (
    <div className="space-y-3 stagger-children">
      {tests.map((t) => (
        <Card key={t.id} className="hover-lift">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">{t.test_type} — {t.channel}</p>
                <p className="text-xs text-text-muted">Week {t.week_number}</p>
              </div>
              <Badge className="bg-brand-teal text-white text-[10px]">Winner: {t.statistical_winner}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                <p className="text-xs font-medium text-blue-700 mb-1">Variant A</p>
                <p className="text-xs text-text-secondary">{t.variant_a_description}</p>
                <p className="text-sm font-bold text-blue-700 mt-1">{t.variant_a_replies}/{t.variant_a_sends} ({t.variant_a_sends > 0 ? Math.round((t.variant_a_replies / t.variant_a_sends) * 100) : 0}%)</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                <p className="text-xs font-medium text-amber-700 mb-1">Variant B</p>
                <p className="text-xs text-text-secondary">{t.variant_b_description}</p>
                <p className="text-sm font-bold text-amber-700 mt-1">{t.variant_b_replies}/{t.variant_b_sends} ({t.variant_b_sends > 0 ? Math.round((t.variant_b_replies / t.variant_b_sends) * 100) : 0}%)</p>
              </div>
            </div>
            {t.action_taken && <p className="mt-2 text-xs text-text-muted italic">Action: {t.action_taken}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── WEEKLY REPORTS TAB ─────────────────────────────────────────────
function ReportsTab({ reports }: { reports: WeeklyReport[] }) {
  const latest = reports[reports.length - 1];
  return (
    <div className="space-y-4">
      {latest && (
        <Card className="hover-lift"><CardContent className="p-4">
          <p className="text-sm font-medium text-text-primary mb-3">Latest Week (Week {latest.week_number})</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 stagger-children">
            <div className="text-center"><p className="text-lg font-bold text-brand-teal">{latest.leads_added}</p><p className="text-[10px] text-text-muted">Leads Added</p></div>
            <div className="text-center"><p className="text-lg font-bold text-blue-600">{latest.total_touches}</p><p className="text-[10px] text-text-muted">Total Touches</p></div>
            <div className="text-center"><p className="text-lg font-bold text-green-600">{latest.total_responses}</p><p className="text-[10px] text-text-muted">Responses</p></div>
            <div className="text-center"><p className="text-lg font-bold text-purple-600">{latest.meetings_booked}</p><p className="text-[10px] text-text-muted">Meetings Booked</p></div>
            <div className="text-center"><p className="text-lg font-bold text-emerald-600">{latest.deals_won}</p><p className="text-[10px] text-text-muted">Deals Won</p></div>
            <div className="text-center"><p className="text-lg font-bold text-amber-600">OMR {latest.revenue_closed_omr.toLocaleString()}</p><p className="text-[10px] text-text-muted">Revenue</p></div>
          </div>
          {latest.key_observation && <p className="mt-3 text-xs text-text-muted italic bg-cream-dark/50 p-2 rounded">{latest.key_observation}</p>}
        </CardContent></Card>
      )}

      <Card className="hover-lift"><CardContent className="p-4">
        <p className="text-xs font-medium text-text-muted mb-3">Channel Performance Over Time</p>
        <MiniBarChart data={reports.map((r) => ({ label: `W${r.week_number}`, value: r.total_responses, color: "#0D4F4F" }))} />
      </CardContent></Card>

      <div className="space-y-2 stagger-children">
        {reports.slice().reverse().map((r) => (
          <Card key={r.id} className="hover-lift"><CardContent className="p-3 flex items-center gap-4 text-xs">
            <span className="font-semibold text-text-primary w-12">W{r.week_number}</span>
            <span className="text-text-muted">{r.leads_added} leads</span>
            <span className="text-text-muted">{r.total_touches} touches</span>
            <span className="text-green-600">{r.meetings_booked} meetings</span>
            <span className="text-amber-600">OMR {r.revenue_closed_omr.toLocaleString()}</span>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}

// ─── SAMPLE DATA ────────────────────────────────────────────────────
const sampleLeads: Lead[] = [
  { id: "1", lead_id: "L001", date_added: "2026-01-15", company_name: "Saudi Digital Solutions", contact_name: "Mohammed Al-Farsi", job_title: "CTO", industry: "Technology", company_size: "250", city: "Riyadh", phone: "+966501234567", email: "mohammed@saudidigital.sa", linkedin_url: "linkedin.com/in/mohammed-alfarsi", lead_source: "Referral", assigned_bdm: "Ahmed", icp_match: "High", fawtara_flag: "Compliant", lead_status: "Qualified", pipeline_stage: "Negotiation", est_deal_value: 15000, notes: "Interested in ERP modernization" },
  { id: "2", lead_id: "L002", date_added: "2026-01-18", company_name: "Gulf AI Systems", contact_name: "Sarah Al-Maktoum", job_title: "CEO", industry: "AI & Machine Learning", company_size: "120", city: "Dubai", phone: "+971509876543", email: "sarah@gulfai.ae", linkedin_url: "linkedin.com/in/sarah-almaktoum", lead_source: "LinkedIn", assigned_bdm: "Fatima", icp_match: "High", fawtara_flag: "Compliant", lead_status: "Meeting Booked", pipeline_stage: "Qualified", est_deal_value: 20000, notes: "AI analytics platform demo scheduled" },
  { id: "3", lead_id: "L003", date_added: "2026-01-20", company_name: "Emirates Marketing Group", contact_name: "Khalid Bin Hamad", job_title: "Marketing Director", industry: "Marketing", company_size: "80", city: "Abu Dhabi", phone: "+971555551234", email: "khalid@emiratesmktg.ae", linkedin_url: "", lead_source: "Cold Outreach", assigned_bdm: "Ahmed", icp_match: "Medium", fawtara_flag: "Pending", lead_status: "Contacted", pipeline_stage: "", est_deal_value: 8000, notes: "Sent intro email, awaiting response" },
  { id: "4", lead_id: "L004", date_added: "2026-01-22", company_name: "Riyadh Tech Hub", contact_name: "Abdullah Al-Otaibi", job_title: "VP Engineering", industry: "Technology", company_size: "500", city: "Riyadh", phone: "+966507654321", email: "abdullah@riyadhtech.sa", linkedin_url: "linkedin.com/in/abdullah-otaibi", lead_source: "Referral", assigned_bdm: "Fatima", icp_match: "High", fawtara_flag: "Compliant", lead_status: "Proposal Sent", pipeline_stage: "Proposal Sent", est_deal_value: 25000, notes: "Proposal for team augmentation sent" },
  { id: "5", lead_id: "L005", date_added: "2026-01-25", company_name: "Kuwait Innovation Labs", contact_name: "Yousef Al-Sabah", job_title: "Innovation Lead", industry: "Technology", company_size: "75", city: "Kuwait City", phone: "+96599887766", email: "yousef@kuwaitinnovate.kw", linkedin_url: "", lead_source: "Website", assigned_bdm: "Ahmed", icp_match: "Medium", fawtara_flag: "N/A", lead_status: "New", pipeline_stage: "", est_deal_value: 10000, notes: "" },
];

const sampleActivities: ActivityEntry[] = [
  { id: "1", date: "2026-07-15", company_name: "Saudi Digital Solutions", contact_name: "Mohammed Al-Farsi", channel: "WhatsApp", touch_number: 1, message_sent: true, response_received: true, response_type: "Interested", outcome_notes: "Positive response, wants demo", next_action: "Schedule demo", next_action_date: "2026-07-18", bdm: "Ahmed" },
  { id: "2", date: "2026-07-16", company_name: "Gulf AI Systems", contact_name: "Sarah Al-Maktoum", channel: "LinkedIn", touch_number: 2, message_sent: true, response_received: true, response_type: "Replied", outcome_notes: "Asked for case studies", next_action: "Send case study PDF", next_action_date: "2026-07-17", bdm: "Fatima" },
  { id: "3", date: "2026-07-17", company_name: "Emirates Marketing Group", contact_name: "Khalid Bin Hamad", channel: "Email", touch_number: 1, message_sent: true, response_received: false, response_type: "", outcome_notes: "Intro email sent", next_action: "Follow up in 3 days", next_action_date: "2026-07-20", bdm: "Ahmed" },
  { id: "4", date: "2026-07-14", company_name: "Riyadh Tech Hub", contact_name: "Abdullah Al-Otaibi", channel: "Call", touch_number: 3, message_sent: true, response_received: true, response_type: "Callback", outcome_notes: "Discussed pricing, sent proposal", next_action: "Follow up on proposal", next_action_date: "2026-07-19", bdm: "Fatima" },
  { id: "5", date: "2026-07-13", company_name: "Kuwait Innovation Labs", contact_name: "Yousef Al-Sabah", channel: "WhatsApp", touch_number: 1, message_sent: true, response_received: false, response_type: "", outcome_notes: "Initial outreach sent", next_action: "Follow up in 2 days", next_action_date: "2026-07-15", bdm: "Ahmed" },
];

const samplePipeline: PipelineDeal[] = [
  { id: "1", company_name: "Saudi Digital Solutions", contact_name: "Mohammed Al-Farsi", service_pillar: "Software Solutions", deal_stage: "Negotiation", est_value: 15000, probability: 70, meeting_status: "Completed", proposal_sent_date: "2026-07-10", expected_close_date: "2026-08-01", objection: "Budget concerns" },
  { id: "2", company_name: "Gulf AI Systems", contact_name: "Sarah Al-Maktoum", service_pillar: "AI Technology", deal_stage: "Qualified", est_value: 20000, probability: 30, meeting_status: "Scheduled", proposal_sent_date: "", expected_close_date: "2026-08-15", objection: "" },
  { id: "3", company_name: "Riyadh Tech Hub", contact_name: "Abdullah Al-Otaibi", service_pillar: "Software Solutions", deal_stage: "Proposal Sent", est_value: 25000, probability: 50, meeting_status: "Completed", proposal_sent_date: "2026-07-12", expected_close_date: "2026-07-30", objection: "Need to compare with competitor" },
  { id: "4", company_name: "Kuwait Innovation Labs", contact_name: "Yousef Al-Sabah", service_pillar: "AI Technology", deal_stage: "Qualified", est_value: 10000, probability: 20, meeting_status: "", proposal_sent_date: "", expected_close_date: "2026-09-01", objection: "" },
  { id: "5", company_name: "Oman Cybersecurity Group", contact_name: "Hesham Al Ghawi", service_pillar: "Software Solutions", deal_stage: "Won", est_value: 18000, probability: 100, meeting_status: "Completed", proposal_sent_date: "2026-06-20", expected_close_date: "2026-07-01", objection: "" },
];

const sampleWeeklyReports: WeeklyReport[] = [
  { id: "1", week_number: 28, week_start: "2026-07-07", leads_added: 15, total_touches: 87, li_touches: 35, wa_touches: 30, email_touches: 12, calls_made: 10, total_responses: 28, meetings_booked: 3, meetings_completed: 2, no_shows: 1, deals_won: 0, revenue_closed_omr: 0, pipeline_value_omr: 70000, key_observation: "Strong LinkedIn engagement this week. WhatsApp reply rate improving." },
  { id: "2", week_number: 29, week_start: "2026-07-14", leads_added: 18, total_touches: 95, li_touches: 40, wa_touches: 32, email_touches: 13, calls_made: 10, total_responses: 32, meetings_booked: 4, meetings_completed: 3, no_shows: 1, deals_won: 1, revenue_closed_omr: 18000, pipeline_value_omr: 70000, key_observation: "Won Oman Cybersecurity deal. LinkedIn T3 touch getting best response rate." },
];

const sampleAbTests: AbTest[] = [
  { id: "1", test_id: "AB001", week_number: 28, test_type: "Opening Hook", channel: "WhatsApp", variant_a_description: "Industry-specific question", variant_a_sends: 50, variant_a_replies: 18, variant_b_description: "Generic greeting", variant_b_sends: 50, variant_b_replies: 8, statistical_winner: "Variant A", action_taken: "Locked industry-specific hook as default", },
  { id: "2", test_id: "AB002", week_number: 29, test_type: "CTA", channel: "LinkedIn", variant_a_description: "Book a 15-min call", variant_a_sends: 50, variant_a_replies: 12, variant_b_description: "Download case study", variant_b_sends: 50, variant_b_replies: 19, statistical_winner: "Variant B", action_taken: "Switched to case study CTA for warm leads", },
];

const samplePillarTargets: PillarTarget[] = [
  { id: "1", pillar_name: "Software Solutions", target_revenue_omr: 25000, target_deals: 12, target_leads: 60, actual_revenue_omr: 18000, actual_deals: 1, actual_leads: 28 },
  { id: "2", pillar_name: "AI Technology", target_revenue_omr: 18000, target_deals: 8, target_leads: 45, actual_revenue_omr: 0, actual_deals: 0, actual_leads: 15 },
  { id: "3", pillar_name: "Digital Marketing", target_revenue_omr: 12000, target_deals: 6, target_leads: 30, actual_revenue_omr: 0, actual_deals: 0, actual_leads: 10 },
  { id: "4", pillar_name: "Human Capital", target_revenue_omr: 8000, target_deals: 4, target_leads: 16, actual_revenue_omr: 0, actual_deals: 0, actual_leads: 5 },
];
