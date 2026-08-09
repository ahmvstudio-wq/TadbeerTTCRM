"use client";
// Clean CRM UI

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search, Plus, Building2, Phone, Mail, ExternalLink, Upload,
  AlertTriangle, Trash2, Pencil, ChevronDown, ChevronRight,
  MessageCircle, Download, LayoutGrid, List, ArrowUpDown, 
  TrendingUp, Users, Target, Clock, ArrowRight, Loader2, Activity,
  Sparkles, Flame, UserCheck, X, FileText, Send, CheckCircle2,
  Grid, Calendar, Filter, Zap, Globe, MapPin, Tag, User, Layers, PhoneCall, Bot, Camera
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CsvImport } from "@/components/ui/csv-import";
import { ToastContainer, addToast } from "@/components/ui/toast";
import { COMPANY_STATUSES, type CompanyStatus } from "@/lib/constants";
import { getCompanies, updateCompanyStatus, updateCompanyLeadType, addCompanyActivity } from "@/lib/actions/companies";
import { addToCallQueue, addBatchToCallQueue } from "@/lib/actions/calls";
import { deleteCompany } from "@/lib/actions/delete";
import { bulkImportCompanies } from "@/lib/actions/import";
import { exportToCsv } from "@/lib/export-csv";

// Inline LinkedIn Icon
function LinkedInIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

// Oman WhatsApp Helper Function
export function formatOmanWhatsAppUrl(phone?: string, message?: string): string | null {
  if (!phone || typeof phone !== 'string') return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  
  if (digits.length === 8 && (digits.startsWith("9") || digits.startsWith("7") || digits.startsWith("2"))) {
    digits = "968" + digits;
  } else if (!digits.startsWith("968") && digits.length <= 9) {
    digits = "968" + digits;
  }

  const baseUrl = `https://wa.me/${digits}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

// Legitimate LinkedIn URL Validator
export function isValidLinkedInUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === '#' || trimmed === 'n/a') return false;
  return trimmed.includes('linkedin.com') || (trimmed.startsWith('http') && trimmed.includes('linkedin'));
}

// Stage styling configs
const statusColor: Record<CompanyStatus, { bg: string; text: string; border: string; dot: string }> = {
  prospect: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-400" },
  contacted: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
  in_call_queue: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  meeting_booked: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500" },
  opportunity: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", dot: "bg-teal-500" },
  won: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  lost: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", dot: "bg-rose-500" },
};

const statusOrder: CompanyStatus[] = [
  "prospect", "contacted", "in_call_queue", "meeting_booked", "opportunity", "won", "lost"
];

// Lead Temperature Badges
const LEAD_TYPES = [
  { key: 'Hot', label: '🔥 Hot Lead', bg: 'bg-red-50 text-red-700 border-red-200' },
  { key: 'Warm', label: '☀️ Warm Lead', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'Cold', label: '❄️ Cold Lead', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'VIP', label: '👑 VIP Account', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'Inbound', label: '📥 Inbound Lead', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
  { key: 'Referral', label: '🤝 Referral', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
];

const avatarGradients = [
  "from-teal-600 to-emerald-800",
  "from-blue-600 to-indigo-800",
  "from-purple-600 to-pink-700",
  "from-amber-600 to-orange-700",
  "from-cyan-600 to-teal-800",
];

const csvFields = [
  { key: "company_name", label: "Company Name", required: true },
  { key: "person_name", label: "Contact Person Name" },
  { key: "person_title", label: "Contact Title" },
  { key: "contact_email", label: "Contact Email" },
  { key: "contact_phone", label: "Contact Phone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "contact_linkedin", label: "Contact LinkedIn" },
  { key: "industry", label: "Industry" },
  { key: "website", label: "Website" },
  { key: "phone", label: "Company Phone" },
  { key: "email", label: "Company Email" },
  { key: "country", label: "Country" },
  { key: "city", label: "City" },
  { key: "employee_count", label: "Employee Count" },
  { key: "linkedin_url", label: "Company LinkedIn" },
  { key: "notes", label: "Notes" },
];

type SortOption = 'urgency' | 'newest' | 'oldest' | 'name' | 'status';
type ViewMode = 'table' | 'board' | 'grid';

export default function ProspectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [leadTypeFilter, setLeadTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [leadSegment, setLeadSegment] = useState<"all" | "new" | "database">("all");
  const [prospects, setProspects] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  
  // Drawer Workstation State
  const [activeProspect, setActiveProspect] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'action' | 'activity' | 'category'>('action');
  const [activityNote, setActivityNote] = useState("");
  const [activityType, setActivityType] = useState("call");
  const [savingNote, setSavingNote] = useState(false);

  // UI Modes
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortOption>('urgency');

  const fetchProspects = useCallback(async (searchVal?: string, statusVal?: string, isRetry = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCompanies({ search: searchVal || undefined, status: statusVal || undefined });
      if (result.error) { setError(result.error); setProspects([]); }
      else { setProspects(result.data || []); setSelectedIds([]); }
    } catch (err) {
      if (!isRetry && err instanceof TypeError) {
        setTimeout(() => fetchProspects(searchVal, statusVal, true), 1500);
        return;
      }
      setError("Connection error. Please check the server is running and click Retry.");
      setProspects([]);
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);
  useEffect(() => { const t = setTimeout(() => fetchProspects(search, statusFilter), 300); return () => clearTimeout(t); }, [search, statusFilter, fetchProspects]);

  const handleImport = async (data: Record<string, string>[]) => {
    const result = await bulkImportCompanies(data);
    addToast("success", `Imported ${result.imported} prospects`);
    fetchProspects(search, statusFilter);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const result = await deleteCompany(id);
    if (result.error) addToast("error", result.error);
    else { 
      addToast("success", `"${name}" deleted`); 
      fetchProspects(search, statusFilter); 
      if (activeProspect?.id === id) setDrawerOpen(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await updateCompanyStatus(id, newStatus);
    if (res.error) addToast("error", res.error);
    else {
      addToast("success", `Status updated to ${COMPANY_STATUSES[newStatus as CompanyStatus]?.label}`);
      setProspects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      if (activeProspect?.id === id) {
        setActiveProspect((prev: any) => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  const handleSendToCadence = async (id: string, name: string) => {
    const res = await addToCallQueue(id);
    addToast("success", `"${name}" added to Daily Cadence Call Queue!`);
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status: 'in_call_queue' } : p));
    if (activeProspect?.id === id) {
      setActiveProspect((prev: any) => prev ? { ...prev, status: 'in_call_queue' } : null);
    }
  };

  const handleBatchSendToCadence = async () => {
    if (selectedIds.length === 0) return;
    const res = await addBatchToCallQueue(selectedIds);
    addToast("success", `Queued ${res.count || selectedIds.length} prospects to Daily Cadence Call Queue!`);
    fetchProspects(search, statusFilter);
  };

  const handleLeadTypeChange = async (id: string, newType: string) => {
    const res = await updateCompanyLeadType(id, newType);
    if (res.error) addToast("error", res.error);
    else {
      addToast("success", `Categorized as ${newType}`);
      setProspects(prev => prev.map(p => p.id === id ? { ...p, lead_type: newType } : p));
      if (activeProspect?.id === id) {
        setActiveProspect((prev: any) => prev ? { ...prev, lead_type: newType } : null);
      }
    }
  };

  const handleAddActivityNote = async () => {
    if (!activeProspect || !activityNote.trim()) return;
    setSavingNote(true);
    const title = activityType === 'call' ? 'Call Logged' : activityType === 'email' ? 'Email Sent' : 'BDM Note';
    const res = await addCompanyActivity(activeProspect.id, title, activityNote, activityType);
    setSavingNote(false);
    if (res.error) {
      addToast("error", res.error);
    } else {
      addToast("success", "Activity logged successfully");
      setActivityNote("");
      const newAct = res.data;
      setActiveProspect((prev: any) => prev ? { ...prev, activities: [newAct, ...(prev.activities || [])] } : null);
    }
  };

  const handleBatchStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    let count = 0;
    for (const id of selectedIds) {
      const res = await updateCompanyStatus(id, newStatus);
      if (!res.error) count++;
    }
    addToast("success", `Updated ${count} prospects to ${COMPANY_STATUSES[newStatus as CompanyStatus]?.label}`);
    fetchProspects(search, statusFilter);
  };

  const extractInstagramUrl = (input: any): string => {
    if (!input) return "";
    const notes = typeof input === "string" ? input : (input.notes || "");
    const match = notes.match(/https?:\/\/(?:www\.)?instagram\.com\/[^\s\n"']+/i) ||
                  notes.match(/Instagram:\s*@?([a-zA-Z0-9_.]+)/i);
    if (match) {
      if (match[0].toLowerCase().startsWith("http")) return match[0];
      if (match[1]) return `https://instagram.com/${match[1].replace(/^@/, '')}`;
    }
    if (notes.toLowerCase().includes("instagram") || notes.includes("@")) {
      const handleMatch = notes.match(/@([a-zA-Z0-9_.]+)/);
      if (handleMatch) return `https://instagram.com/${handleMatch[1]}`;
    }
    return "";
  };

  // Strict channel contact validators
  const hasValidWhatsApp = useCallback((p: any): boolean => {
    if (!p) return false;

    // Exclude explicitly user-flagged companies with false / dummy / landline numbers
    const excludedCompanies = [
      "sohar plaza",
      "matalan oman avenues mall",
      "armada couture muscat oman",
      "tresore boutique",
      "middle ages clothing co",
      "al kauther designer wear",
      "alwan salalah",
      "drapes boutique",
      "r&b sohar city centre",
      "city centre sohar",
      "house of s",
      "first fashion",
      "american eagle",
      "famous",
      "r&b sohar",
      "sara plaza - city centre muscat",
      "junaid jamshed",
      "lamori boutiques",
      "kashkha",
      "choice muscat grand mall",
      "dubai bazaar abaya",
      "belleza",
      "en boutique",
      "mehdi store nizwa",
      "redtag",
      "trueno fashion",
      "sara plaza - sohar",
      "centrepoint",
      "oua retail sohar",
      "sh corner",
      "sohar market",
      "nazih beauty",
      "billorat sohar trad co llc",
      "luxe haven"
    ];

    const compName = (p.company_name || '').toLowerCase().trim();
    if (excludedCompanies.some(ex => compName.includes(ex) || ex.includes(compName))) {
      return false;
    }

    const checkMobileWhatsApp = (val?: any): boolean => {
      if (!val || typeof val !== 'string') return false;
      const lower = val.toLowerCase().trim();
      if (lower === 'n/a' || lower === 'none' || lower === 'null' || lower === 'no number' || lower === 'company lead' || lower === 'undefined') return false;
      
      const digits = val.replace(/\D/g, '');
      if (digits.length < 8) return false;

      // Reject dummy sequence digits like 12345678, 00000000, 99999999
      if (/^(\d)\1+$/.test(digits) || digits === '12345678' || digits === '98765432') return false;

      let localDigits = digits;
      if (localDigits.startsWith('968')) {
        localDigits = localDigits.slice(3);
      }

      // Oman mobile numbers start with 9 or 7 (Landlines start with 2 and do NOT support WhatsApp)
      if (localDigits.length === 8 && (localDigits.startsWith('9') || localDigits.startsWith('7'))) {
        return true;
      }

      // International mobile numbers (>= 10 digits, not starting with Oman landline 9682)
      if (digits.length >= 10 && !digits.startsWith('9682')) {
        return true;
      }

      return false;
    };

    const waRaw = p.contacts?.[0]?.whatsapp || p.whatsapp;
    if (checkMobileWhatsApp(waRaw)) return true;

    const phoneRaw = p.contacts?.[0]?.phone || p.phone;
    if (checkMobileWhatsApp(phoneRaw)) return true;

    return false;
  }, []);

  const hasValidPhone = useCallback((p: any): boolean => {
    if (!p) return false;
    const cleanDigits = (val?: any) => {
      if (!val || typeof val !== 'string') return '';
      const lower = val.toLowerCase().trim();
      if (lower === 'n/a' || lower === 'none' || lower === 'null' || lower === 'no number' || lower === 'company lead' || lower === 'undefined') return '';
      return val.replace(/\D/g, '');
    };

    const phoneDigits = cleanDigits(p.contacts?.[0]?.phone || p.phone || p.contacts?.[0]?.whatsapp || p.whatsapp);
    return phoneDigits.length >= 7;
  }, []);

  const hasValidEmail = useCallback((p: any): boolean => {
    if (!p) return false;
    const email = p.contacts?.[0]?.email || p.email;
    if (email && typeof email === 'string') {
      const lower = email.toLowerCase().trim();
      if (lower !== 'n/a' && lower !== 'none' && lower !== 'null' && lower.includes('@')) return true;
    }
    return false;
  }, []);

  // Helper to determine Source Channel strictly
  const getLeadSource = (prospect: any) => {
    const isInsights =
      prospect.lead_source?.toLowerCase().includes("insights") ||
      prospect.notes?.toLowerCase().includes("insights") ||
      prospect.status === 'insights';
      
    if (isInsights) {
      return { type: 'insights', label: '⚡ Insight Generated Contacts', bg: 'bg-[#174E59]/10 text-[#174E59] border-[#174E59]/30 font-black' };
    }

    const contactLinkedin = prospect.contacts?.[0]?.linkedin_url;
    const companyLinkedin = prospect.linkedin_url;
    const hasValidLinkedinUrl = isValidLinkedInUrl(contactLinkedin) || isValidLinkedInUrl(companyLinkedin);
    const isPushedFromLinkedIn = prospect.lead_source === 'LinkedIn' || prospect.notes?.startsWith('Imported from LinkedIn CRM');

    if (isPushedFromLinkedIn || hasValidLinkedinUrl) {
      return { type: 'linkedin', label: 'LinkedIn Lead', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
    if (prospect.notes?.toLowerCase().includes('csv import')) {
      return { type: 'csv', label: 'CSV Import', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
    }
    if (prospect.lead_type === 'Inbound') {
      return { type: 'inbound', label: 'Inbound Web', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
    }
    return { type: 'crm', label: 'Direct CRM', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
  };

  // Channel Category counts derived automatically from DB prospects
  const channelCategoryCounts = useMemo(() => {
    const counts = {
      all: prospects.length,
      whatsapp: 0,
      instagram: 0,
      linkedin: 0,
      phone: 0,
      email: 0,
      insights: 0,
      csv: 0
    };

    prospects.forEach(p => {
      const hasWa = hasValidWhatsApp(p);
      const hasIg = Boolean(extractInstagramUrl(p));
      const hasLi = isValidLinkedInUrl(p.contacts?.[0]?.linkedin_url) || isValidLinkedInUrl(p.linkedin_url) || getLeadSource(p).type === 'linkedin';
      const hasPh = hasValidPhone(p);
      const hasEm = hasValidEmail(p);
      const isIns = getLeadSource(p).type === 'insights';
      const isCsv = getLeadSource(p).type === 'csv';

      if (hasWa) counts.whatsapp++;
      if (hasIg) counts.instagram++;
      if (hasLi) counts.linkedin++;
      if (hasPh) counts.phone++;
      if (hasEm) counts.email++;
      if (isIns) counts.insights++;
      if (isCsv) counts.csv++;
    });

    return counts;
  }, [prospects, hasValidWhatsApp, hasValidPhone, hasValidEmail]);

  // Date Filter Matcher
  const isDateMatch = (created_at: string, filter: string): boolean => {
    if (!filter || filter === 'all') return true;
    if (!created_at) return false;
    const date = new Date(created_at);
    const now = new Date();
    
    if (filter === 'today') {
      return date.toDateString() === now.toDateString();
    }
    if (filter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return date.toDateString() === yesterday.toDateString();
    }
    if (filter === 'week') {
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (filter === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  };

  // Filter & Sort Logic
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      if (leadTypeFilter && (p.lead_type || 'Cold') !== leadTypeFilter) return false;
      if (sourceFilter === 'insights' && getLeadSource(p).type !== 'insights') return false;
      if (sourceFilter === 'linkedin' && getLeadSource(p).type !== 'linkedin') return false;
      if (sourceFilter === 'csv' && getLeadSource(p).type !== 'csv') return false;

      // Channel Category Filter
      if (channelFilter === 'whatsapp') {
        if (!hasValidWhatsApp(p)) return false;
      }
      if (channelFilter === 'instagram') {
        if (!extractInstagramUrl(p)) return false;
      }
      if (channelFilter === 'linkedin') {
        const hasLi = isValidLinkedInUrl(p.contacts?.[0]?.linkedin_url) || isValidLinkedInUrl(p.linkedin_url) || getLeadSource(p).type === 'linkedin';
        if (!hasLi) return false;
      }
      if (channelFilter === 'phone') {
        if (!hasValidPhone(p)) return false;
      }
      if (channelFilter === 'email') {
        if (!hasValidEmail(p)) return false;
      }
      if (channelFilter === 'insights') {
        if (getLeadSource(p).type !== 'insights') return false;
      }
      if (channelFilter === 'csv') {
        if (getLeadSource(p).type !== 'csv') return false;
      }

      if (!isDateMatch(p.created_at, dateFilter)) return false;
      if (leadSegment === 'new' && p.lead_source !== 'new_lead') return false;
      if (leadSegment === 'database' && p.lead_source === 'new_lead') return false;
      return true;
    });
  }, [prospects, leadTypeFilter, sourceFilter, dateFilter, leadSegment, channelFilter, hasValidWhatsApp, hasValidPhone, hasValidEmail]);

  const sortedProspects = useMemo(() => {
    return [...filteredProspects].sort((a, b) => {
      if (sortBy === 'urgency') {
        const urgencyScore = (p: any) => {
          let score = 0;
          if (p.lead_type === 'Hot') score += 10;
          if (p.lead_type === 'VIP') score += 8;
          if (p.status === 'opportunity') score += 7;
          if (p.status === 'meeting_booked') score += 6;
          if (p.status === 'prospect') score += 4;
          return score;
        };
        return urgencyScore(b) - urgencyScore(a);
      }
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'name') {
        const nameA = a.contacts?.[0]?.full_name || a.company_name;
        const nameB = b.contacts?.[0]?.full_name || b.company_name;
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'status') return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
      return 0;
    });
  }, [filteredProspects, sortBy]);

  const handleExport = () => {
    const dataToExport = selectedIds.length > 0
      ? sortedProspects.filter((p) => selectedIds.includes(p.id))
      : sortedProspects;

    if (dataToExport.length === 0) {
      addToast("error", "No prospects matching the current filter to export");
      return;
    }

    const exportData = dataToExport.map((p) => {
      const waUrl = formatOmanWhatsAppUrl(p.contacts?.[0]?.whatsapp || p.contacts?.[0]?.phone || p.phone) || "";
      const igUrl = extractInstagramUrl(p);

      return {
        contact_name: p.contacts?.[0]?.full_name || p.company_name,
        contact_title: p.contacts?.[0]?.title || "",
        company_name: p.company_name,
        industry: p.industry || "",
        lead_source: getLeadSource(p).label,
        lead_type: p.lead_type || "Cold",
        email: p.contacts?.[0]?.email || p.email || "",
        phone: p.contacts?.[0]?.phone || p.phone || "",
        whatsapp: p.contacts?.[0]?.whatsapp || "",
        whatsapp_url: waUrl,
        instagram_url: igUrl,
        linkedin: isValidLinkedInUrl(p.contacts?.[0]?.linkedin_url) ? p.contacts[0].linkedin_url : (isValidLinkedInUrl(p.linkedin_url) ? p.linkedin_url : ""),
        website: p.website || "",
        city: p.city || "",
        country: p.country || "",
        status: COMPANY_STATUSES[p.status as CompanyStatus]?.label || p.status,
        date_added: p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
        notes: p.notes || "",
      };
    });

    const channelTag = channelFilter !== 'all' ? `${channelFilter}-` : '';
    exportToCsv(exportData, `prospects-${channelTag}${new Date().toISOString().split("T")[0]}.csv`, [
      { key: "contact_name", label: "Primary Contact Name" },
      { key: "contact_title", label: "Title" },
      { key: "company_name", label: "Company" },
      { key: "industry", label: "Industry" },
      { key: "lead_source", label: "Source Channel" },
      { key: "lead_type", label: "Categorization" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "whatsapp", label: "WhatsApp Contact" },
      { key: "whatsapp_url", label: "WhatsApp Direct Link" },
      { key: "instagram_url", label: "Instagram Profile Link" },
      { key: "linkedin", label: "LinkedIn Link" },
      { key: "website", label: "Website" },
      { key: "city", label: "City" },
      { key: "country", label: "Country" },
      { key: "status", label: "Stage" },
      { key: "date_added", label: "Date Added" },
      { key: "notes", label: "Notes" },
    ]);
    addToast("success", `Exported ${dataToExport.length} prospects to CSV`);
  };
  const totalCount = prospects.length;
  const insightsCount = prospects.filter(p => getLeadSource(p).type === 'insights').length;
  const linkedinCount = prospects.filter(p => getLeadSource(p).type === 'linkedin').length;
  const todayCount = prospects.filter(p => isDateMatch(p.created_at, 'today')).length;
  const hotCount = prospects.filter(p => p.lead_type === 'Hot' || p.status === 'opportunity').length;

  const openDrawer = (prospect: any) => {
    setActiveProspect(prospect);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6 page-enter pb-24 max-w-[1850px] w-full mx-auto px-2 sm:px-4 font-sans">
      <ToastContainer />

      {/* ── BDM Command Header ────────────────────────────────────────────── */}
      <div className="rounded-3xl bg-white text-slate-900 p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold mb-2">
              <Zap className="h-3.5 w-3.5 text-teal-600 fill-teal-600" />
              <span>BDM Outreach Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">Prospect & Lead Intelligence</h1>
            <p className="text-slate-500 text-xs mt-1 max-w-2xl font-medium leading-relaxed">
              Date distinction, 1-click batch sending to Daily Cadence, verified LinkedIn channel tracking, and automatic Oman (+968) WhatsApp formatting.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/daily-cadence">
              <Button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold h-9 rounded-xl px-4 transition-all cursor-pointer">
                <PhoneCall className="h-3.5 w-3.5 mr-2 text-teal-400" />Open Daily Cadence
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 text-xs font-black h-9 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              Export {channelFilter !== 'all' ? `${channelFilter.toUpperCase()} ` : ""}CSV ({sortedProspects.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCsvOpen(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200 text-xs font-bold h-9 rounded-xl transition-all cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 mr-2 text-slate-500" />Import Prospects
            </Button>
          </div>
        </div>

        {/* ── Metric Bar Highlights ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
          
          {/* Card 1: Total Database */}
          <div
            onClick={() => { setSourceFilter(""); setChannelFilter("all"); }}
            className={cn(
              "rounded-2xl p-3.5 border flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01]",
              !sourceFilter && channelFilter === "all" ? "bg-[#174E59]/10 border-[#174E59]/30 shadow-xs" : "bg-slate-50/70 border-slate-200"
            )}
          >
            <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0 shadow-xs">
              <Users className="h-4 w-4 text-[#174E59]" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Database</p>
              <p className="text-xl font-black text-slate-900 leading-tight mt-0.5">{totalCount}</p>
            </div>
          </div>

          {/* Card 2: ⚡ Insight Generated Contacts (Interactive Clickable Filter!) */}
          <div 
            onClick={() => {
              if (channelFilter === "insights") {
                setChannelFilter("all");
                setSourceFilter("");
              } else {
                setChannelFilter("insights");
                setSourceFilter("insights");
              }
            }}
            className={cn(
              "rounded-2xl p-4 border transition-all duration-300 cursor-pointer flex flex-col justify-between",
              channelFilter === "insights" || sourceFilter === "insights"
                ? "bg-[#174E59] border-[#174E59] shadow-lg shadow-[#174E59]/20 scale-[1.02] ring-2 ring-white/20"
                : "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-[#174E59]/30"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={cn(
                "p-2.5 rounded-xl transition-colors duration-300",
                channelFilter === "insights" || sourceFilter === "insights" ? "bg-white/10" : "bg-[#174E59]/10"
              )}>
                <Zap className={cn("w-5 h-5", channelFilter === "insights" || sourceFilter === "insights" ? "text-teal-300" : "text-[#174E59]")} />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <p className={cn("text-[10px] font-extrabold uppercase tracking-wider", channelFilter === "insights" || sourceFilter === "insights" ? "text-teal-200" : "text-[#174E59]")}>
                  ⚡ Insight Generated Contacts
                </p>
              </div>
              <p className={cn("text-xl font-black leading-tight mt-0.5", channelFilter === "insights" || sourceFilter === "insights" ? "text-white" : "text-slate-900")}>
                {insightsCount} <span className={cn("text-[10px] font-bold", channelFilter === "insights" || sourceFilter === "insights" ? "text-teal-200" : "text-[#174E59]")}>(Click to Filter)</span>
              </p>
            </div>
          </div>

          {/* Card 3: LinkedIn Prospects */}
          <div
            onClick={() => {
              if (channelFilter === "linkedin") {
                setChannelFilter("all");
                setSourceFilter("");
              } else {
                setChannelFilter("linkedin");
                setSourceFilter("linkedin");
              }
            }}
            className={cn(
              "rounded-2xl p-3.5 border flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.01]",
              channelFilter === "linkedin" || sourceFilter === "linkedin" ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50/70 border-slate-200"
            )}
          >
            <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0 shadow-xs">
              <LinkedInIcon size={16} />
            </div>
            <div>
              <p className={cn("text-[10px] font-bold uppercase tracking-wider", channelFilter === "linkedin" || sourceFilter === "linkedin" ? "text-blue-100" : "text-slate-400")}>LinkedIn Prospects</p>
              <p className={cn("text-xl font-black leading-tight mt-0.5", channelFilter === "linkedin" || sourceFilter === "linkedin" ? "text-white" : "text-slate-900")}>{linkedinCount}</p>
            </div>
          </div>

          {/* Card 4: Cadence Workflow */}
          <div className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-[#174E59] uppercase tracking-wider">Cadence Workflow</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">1-Click Batch Send</p>
            </div>
            <PhoneCall className="h-5 w-5 text-[#174E59] opacity-80" />
          </div>
        </div>
      </div>

      {/* ── BDM Control Bar & Compact Filters ─────────────────────────────── */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Row 1: Search + Sort + View Toggle + Lead Count */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search contact, company, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs w-full bg-slate-50 border-slate-200 rounded-xl focus:bg-white font-semibold"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 h-8 px-2.5 focus:bg-white cursor-pointer"
            >
              <option value="">All Stages ({prospects.length})</option>
              {statusOrder.map((sKey) => (
                <option key={sKey} value={sKey}>
                  {COMPANY_STATUSES[sKey]?.label} ({prospects.filter(p => p.status === sKey).length})
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 h-8 px-2.5 focus:bg-white cursor-pointer"
            >
              <option value="urgency">Sort: 🎯 Urgency</option>
              <option value="newest">Sort: 📅 Newest</option>
              <option value="oldest">Sort: 📅 Oldest</option>
              <option value="name">Sort: 👤 Name (A-Z)</option>
              <option value="status">Sort: 📊 Stage</option>
            </select>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={cn("px-2.5 py-1 rounded-lg transition-all text-xs font-bold flex items-center gap-1", viewMode === 'table' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900")}
              >
                <List className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={cn("px-2.5 py-1 rounded-lg transition-all text-xs font-bold flex items-center gap-1", viewMode === 'board' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Board</span>
              </button>
            </div>
            
            <span className="text-xs text-slate-500 font-extrabold px-2 py-1 bg-slate-100 border border-slate-200 rounded-xl">
              {sortedProspects.length} shown
            </span>
          </div>
        </div>

        {/* Row 2: Compact Date & Segment Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 pt-1.5 border-t border-slate-100 scrollbar-hide text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter:</span>
          
          {(['all', 'new', 'database'] as const).map(seg => (
            <button
              key={seg}
              onClick={() => setLeadSegment(seg)}
              className={cn(
                "px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all border cursor-pointer shrink-0",
                leadSegment === seg ? "bg-slate-900 text-white border-slate-900 shadow-xs" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              )}
            >
              {seg === 'all' ? 'All Leads' : seg === 'new' ? '🆕 New Leads' : '📦 Database'}
            </button>
          ))}

          <span className="text-slate-300">|</span>

          {[
            { key: 'all', label: 'All Dates' },
            { key: 'today', label: 'Added Today' },
            { key: 'yesterday', label: 'Yesterday' },
            { key: 'week', label: 'This Week' },
          ].map((df) => (
            <button
              key={df.key}
              onClick={() => setDateFilter(df.key)}
              className={cn(
                "px-2.5 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0",
                dateFilter === df.key ? "bg-teal-700 text-white border-teal-700 shadow-xs" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              )}
            >
              {df.label}
            </button>
          ))}
        </div>

        {/* ── Row 3: Dynamic Channel Categories Filter Buttons ────────────────── */}
        <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-teal-600" /> Channel Categories:
          </span>
          
          <button
            onClick={() => setChannelFilter("all")}
            className={cn(
              "px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5",
              channelFilter === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-2xs font-black"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            All Channels ({channelCategoryCounts.all})
          </button>

          <button
            onClick={() => setChannelFilter("whatsapp")}
            className={cn(
              "px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5",
              channelFilter === "whatsapp"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs font-black"
                : "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50"
            )}
          >
            <span>💬 WhatsApp</span>
            <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full font-black", channelFilter === "whatsapp" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800")}>
              {channelCategoryCounts.whatsapp}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("instagram")}
            className={cn(
              "px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5",
              channelFilter === "instagram"
                ? "bg-pink-600 text-white border-pink-600 shadow-2xs font-black"
                : "bg-white text-pink-800 border-pink-200 hover:bg-pink-50"
            )}
          >
            <span>📸 Instagram</span>
            <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full font-black", channelFilter === "instagram" ? "bg-white/20 text-white" : "bg-pink-100 text-pink-800")}>
              {channelCategoryCounts.instagram}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("linkedin")}
            className={cn(
              "px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5",
              channelFilter === "linkedin"
                ? "bg-blue-600 text-white border-blue-600 shadow-2xs font-black"
                : "bg-white text-blue-800 border-blue-200 hover:bg-blue-50"
            )}
          >
            <LinkedInIcon size={12} />
            <span>LinkedIn</span>
            <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full font-black", channelFilter === "linkedin" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800")}>
              {channelCategoryCounts.linkedin}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("phone")}
            className={cn(
              "px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5",
              channelFilter === "phone"
                ? "bg-amber-600 text-white border-amber-600 shadow-2xs font-black"
                : "bg-white text-amber-800 border-amber-200 hover:bg-amber-50"
            )}
          >
            <span>📞 Cold Call / Phone</span>
            <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full font-black", channelFilter === "phone" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800")}>
              {channelCategoryCounts.phone}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("email")}
            className={cn(
              "px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5",
              channelFilter === "email"
                ? "bg-violet-600 text-white border-violet-600 shadow-2xs font-black"
                : "bg-white text-violet-800 border-violet-200 hover:bg-violet-50"
            )}
          >
            <span>✉️ Email</span>
            <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full font-black", channelFilter === "email" ? "bg-white/20 text-white" : "bg-violet-100 text-violet-800")}>
              {channelCategoryCounts.email}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("insights")}
            className={cn(
              "px-3 py-1 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5",
              channelFilter === "insights"
                ? "bg-[#174E59] text-white border-[#174E59] shadow-2xs font-black"
                : "bg-white text-[#174E59] border-[#174E59]/30 hover:bg-teal-50"
            )}
          >
            <Zap className="h-3 w-3" />
            <span>Insights / AI</span>
            <span className={cn("text-[10px] px-1.5 py-0.2 rounded-full font-black", channelFilter === "insights" ? "bg-white/20 text-white" : "bg-teal-100 text-[#174E59]")}>
              {channelCategoryCounts.insights}
            </span>
          </button>
        </div>
      </div>

      {/* Floating Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl p-3 shadow-2xl border border-slate-700 flex items-center gap-4 animate-bounce-in">
          <span className="text-xs font-bold px-3 py-1 bg-brand-teal rounded-lg">{selectedIds.length} Selected</span>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleBatchSendToCadence}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-8 px-3 rounded-xl shadow-md flex items-center gap-1.5"
            >
              <PhoneCall className="h-3.5 w-3.5" /> Send ({selectedIds.length}) to Daily Cadence
            </Button>
            <select
              onChange={(e) => { if (e.target.value) handleBatchStatusChange(e.target.value); }}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl h-8 px-2 focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>Change Stage To...</option>
              {statusOrder.map(s => (
                <option key={s} value={s}>{COMPANY_STATUSES[s]?.label}</option>
              ))}
            </select>
            <Button size="sm" variant="ghost" onClick={handleExport} className="text-slate-300 hover:text-white text-xs h-8">
              <Download className="h-3.5 w-3.5 mr-1" /> Export
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} className="text-slate-400 hover:text-white text-xs h-8">
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* ── Main Display Body ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Loader2 className="h-10 w-10 animate-spin text-brand-teal mb-3" />
          <p className="text-sm font-bold text-slate-600">Loading prospects directory...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-red-200 p-8 shadow-sm">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Error loading prospects</h3>
          <p className="text-xs text-slate-500 mt-1">{error}</p>
          <Button size="sm" className="mt-4 bg-brand-teal text-white" onClick={() => fetchProspects(search, statusFilter)}>Retry</Button>
        </div>
      ) : sortedProspects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No prospects match filters</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing date or stage filters.</p>
        </div>
      ) : viewMode === 'table' ? (

        /* ── CATEGORIZED TABLE VIEW ──────────────────────────────────────── */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-4 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === sortedProspects.length}
                      onChange={(e) => setSelectedIds(e.target.checked ? sortedProspects.map(p => p.id) : [])}
                      className="h-4 w-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal cursor-pointer"
                    />
                  </th>
                  <th className="py-4 px-4">Primary Contact & Company</th>
                  <th className="py-4 px-4 hidden md:table-cell">Source Channel</th>
                  <th className="py-4 px-4 hidden md:table-cell">Industry</th>
                  <th className="py-4 px-4 hidden lg:table-cell">Date Added</th>
                  <th className="py-4 px-4">Stage</th>
                  <th className="py-4 px-4 text-right">Cadence Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sortedProspects.map((prospect, idx) => {
                  const contact = prospect.contacts?.[0];
                  const primaryName = contact?.full_name || prospect.company_name;
                  const companySub = contact?.full_name ? prospect.company_name : 'Company Lead';
                  const titleSub = contact?.title || '';
                  const source = getLeadSource(prospect);
                  const style = statusColor[prospect.status as CompanyStatus] || statusColor.prospect;
                  const gradient = avatarGradients[idx % avatarGradients.length];
                  const addedDate = prospect.created_at ? new Date(prospect.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';
                  const isAddedToday = isDateMatch(prospect.created_at, 'today');

                  const linkedinUrl = isValidLinkedInUrl(contact?.linkedin_url) 
                    ? contact?.linkedin_url 
                    : (isValidLinkedInUrl(prospect?.linkedin_url) ? prospect?.linkedin_url : null);

                  const waPhone = contact?.whatsapp || contact?.phone || prospect?.whatsapp || prospect?.phone;
                  const waUrl = formatOmanWhatsAppUrl(waPhone);

                  return (
                    <tr
                      key={prospect.id}
                      onClick={() => openDrawer(prospect)}
                      className="hover:bg-teal-50/30 transition-colors duration-150 cursor-pointer group"
                    >
                      <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(prospect.id)}
                          onChange={(e) => setSelectedIds(e.target.checked ? [...selectedIds, prospect.id] : selectedIds.filter(id => id !== prospect.id))}
                          className="h-4 w-4 rounded border-slate-300 text-brand-teal focus:ring-brand-teal cursor-pointer"
                        />
                      </td>

                      {/* Primary Contact Person */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                            {primaryName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900 text-sm group-hover:text-brand-teal transition-colors truncate">
                                {primaryName}
                              </span>
                              {isAddedToday && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ✨ Added Today
                                </span>
                              )}
                              {prospect.lead_type && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                  {prospect.lead_type}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 font-medium text-xs mt-0.5 truncate">
                              {titleSub && <span className="text-slate-700 font-semibold">{titleSub}</span>}
                              {titleSub && <span>·</span>}
                              <span className="font-bold text-slate-800">{companySub}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Source Channel */}
                      <td className="py-4 px-4 hidden md:table-cell">
                        {source.type === 'linkedin' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-xs">
                            <LinkedInIcon size={12} />
                            LinkedIn Lead
                          </span>
                        ) : (
                          <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] font-bold border", source.bg)}>
                            {source.label}
                          </span>
                        )}
                      </td>

                      {/* Industry */}
                      <td className="py-4 px-4 hidden md:table-cell">
                        <span className="font-bold text-slate-800 text-xs px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                          {prospect.industry || 'Corporate'}
                        </span>
                      </td>

                      {/* Date Added Distinction */}
                      <td className="py-4 px-4 hidden lg:table-cell text-slate-500 font-semibold text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span className={isAddedToday ? "font-bold text-emerald-700" : ""}>{addedDate}</span>
                        </div>
                      </td>

                      {/* Stage */}
                      <td className="py-4 px-4">
                        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border", style.bg, style.text, style.border)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                          {COMPANY_STATUSES[prospect.status as CompanyStatus]?.label || prospect.status}
                        </span>
                      </td>

                      {/* Cadence Actions */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendToCadence(prospect.id, primaryName)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 text-xs font-bold h-8 rounded-xl flex items-center gap-1 shadow-xs"
                            title="Send directly to Daily Cadence Call Queue"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                            <span className="hidden xl:inline">Cadence</span>
                          </Button>
                          {waUrl && (
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors" title="WhatsApp (+968 Oman format)">
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {linkedinUrl && (
                            <a href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors" title="Verified LinkedIn Profile">
                              <LinkedInIcon size={12} />
                            </a>
                          )}
                          {prospect.website && (
                            <a href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors" title="Website">
                              <Globe className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {extractInstagramUrl(prospect.notes) && (
                            <a href={extractInstagramUrl(prospect.notes)!} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-500 hover:text-white transition-colors" title="Instagram">
                              <Camera className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl text-slate-400 group-hover:text-brand-teal" onClick={() => openDrawer(prospect)}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'board' ? (

        /* ── KANBAN BOARD VIEW ───────────────────────────────────────────── */
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide animate-fade-in-up" style={{ minHeight: '650px' }}>
          {statusOrder.map((statusKey) => {
            const columnProspects = sortedProspects.filter(p => p.status === statusKey);
            const style = statusColor[statusKey];
            const statusConfig = COMPANY_STATUSES[statusKey];
            
            return (
              <div key={statusKey} className="flex-shrink-0 w-80 bg-slate-100/60 rounded-3xl border border-slate-200/80 flex flex-col max-h-[800px]">
                <div className="p-4 border-b border-slate-200/80 bg-white rounded-t-3xl flex items-center justify-between sticky top-0 z-10 shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", style.dot)} />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{statusConfig?.label}</h3>
                  </div>
                  <span className="bg-slate-100 text-slate-700 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-slate-200">{columnProspects.length}</span>
                </div>

                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {columnProspects.map(prospect => {
                    const contact = prospect.contacts?.[0];
                    const primaryName = contact?.full_name || prospect.company_name;
                    const source = getLeadSource(prospect);

                    return (
                      <div
                        key={prospect.id}
                        onClick={() => openDrawer(prospect)}
                        className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-brand-teal/40 transition-all duration-200 cursor-pointer group relative space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          {source.type === 'linkedin' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                              <LinkedInIcon size={10} /> LinkedIn
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {prospect.industry || 'Corporate'}
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            {prospect.website && (
                              <a href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`} target="_blank" rel="noopener noreferrer" className="p-1 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors" title="Website" onClick={e => e.stopPropagation()}>
                                <Globe className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {extractInstagramUrl(prospect.notes) && (
                              <a href={extractInstagramUrl(prospect.notes)!} target="_blank" rel="noopener noreferrer" className="p-1 bg-pink-50 text-pink-600 hover:bg-pink-500 hover:text-white rounded-lg transition-colors" title="Instagram" onClick={e => e.stopPropagation()}>
                                <Camera className="h-3.5 w-3.5" />
                              </a>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => { e.stopPropagation(); handleSendToCadence(prospect.id, primaryName); }}
                              className="h-6 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 rounded-lg"
                            >
                              + Cadence
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-brand-teal transition-colors truncate">
                            {primaryName}
                          </h4>
                          <p className="text-[11px] font-semibold text-slate-600 truncate mt-0.5">
                            {contact?.title ? `${contact.title} @ ` : ''}{prospect.company_name}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-2 border-t border-slate-100">
                          <span>Added {prospect.created_at ? new Date(prospect.created_at).toLocaleDateString() : 'recently'}</span>
                          <span>{[prospect.city, prospect.country].filter(Boolean).join(", ") || ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (

        /* ── GRID CARDS VIEW ─────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
          {sortedProspects.map((prospect, idx) => {
            const contact = prospect.contacts?.[0];
            const primaryName = contact?.full_name || prospect.company_name;
            const style = statusColor[prospect.status as CompanyStatus] || statusColor.prospect;
            const gradient = avatarGradients[idx % avatarGradients.length];
            const source = getLeadSource(prospect);
            const waPhone = contact?.whatsapp || contact?.phone || prospect?.phone;
            const waUrl = formatOmanWhatsAppUrl(waPhone);

            return (
              <div
                key={prospect.id}
                onClick={() => openDrawer(prospect)}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-lg hover:border-brand-teal/40 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    {source.type === 'linkedin' ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                        <LinkedInIcon size={10} /> LinkedIn Lead
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {source.label}
                      </span>
                    )}

                    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border", style.bg, style.text, style.border)}>
                      {COMPANY_STATUSES[prospect.status as CompanyStatus]?.label || prospect.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn("h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0", gradient)}>
                      {primaryName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-black text-slate-900 group-hover:text-brand-teal transition-colors truncate">{primaryName}</h3>
                      <p className="text-xs font-semibold text-slate-600 truncate">{contact?.title ? `${contact.title} @ ` : ''}{prospect.company_name}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-bold uppercase text-[10px]">Industry</span>
                      <span className="font-bold text-slate-800">{prospect.industry || 'Corporate'}</span>
                    </div>
                    {contact?.email && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Email</span>
                        <span className="font-semibold text-brand-teal truncate max-w-[180px]">{contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold" onClick={(e) => e.stopPropagation()}>
                  <span>Added {prospect.created_at ? new Date(prospect.created_at).toLocaleDateString() : 'recently'}</span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      onClick={() => handleSendToCadence(prospect.id, primaryName)}
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-500 hover:text-white border border-emerald-200 text-xs font-bold h-7 rounded-lg"
                    >
                      + Cadence
                    </Button>
                    {waUrl && (
                      <a href={waUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors">
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {prospect.website && (
                      <a href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors" title="Website" onClick={e => e.stopPropagation()}>
                        <Globe className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {extractInstagramUrl(prospect.notes) && (
                      <a href={extractInstagramUrl(prospect.notes)!} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-pink-50 text-pink-600 hover:bg-pink-500 hover:text-white transition-colors" title="Instagram" onClick={e => e.stopPropagation()}>
                        <Camera className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl text-slate-400 group-hover:text-brand-teal" onClick={() => openDrawer(prospect)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BDM WORKSTATION DRAWER (Right Inspector Panel) ────────────────── */}
      {drawerOpen && activeProspect && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs animate-fade-in flex justify-end">
          <div
            className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black flex items-center justify-center text-xl shadow-lg">
                  {(activeProspect.contacts?.[0]?.full_name || activeProspect.company_name).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold leading-tight text-white">
                    {activeProspect.contacts?.[0]?.full_name || activeProspect.company_name}
                  </h2>
                  <p className="text-xs text-teal-300 font-medium">
                    {activeProspect.contacts?.[0]?.title ? `${activeProspect.contacts[0].title} @ ` : ''}{activeProspect.company_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="h-8 w-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Action Ribbon */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Stage:</span>
                <select
                  value={activeProspect.status}
                  onChange={(e) => handleStatusChange(activeProspect.id, e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 px-3 py-1.5 focus:ring-2 focus:ring-brand-teal cursor-pointer shadow-xs"
                >
                  {statusOrder.map(s => (
                    <option key={s} value={s}>{COMPANY_STATUSES[s]?.label}</option>
                  ))}
                </select>
              </div>

              <Button
                size="sm"
                onClick={() => handleSendToCadence(activeProspect.id, activeProspect.contacts?.[0]?.full_name || activeProspect.company_name)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs h-8 px-3 rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <PhoneCall className="h-3.5 w-3.5" /> Send to Daily Cadence
              </Button>
            </div>

            {/* Workstation Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Source Banner inside Drawer */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Source & Channel</span>
                  {getLeadSource(activeProspect).type === 'linkedin' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                      <LinkedInIcon size={12} /> Verified LinkedIn Lead
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {getLeadSource(activeProspect).label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  Added on {activeProspect.created_at ? new Date(activeProspect.created_at).toLocaleDateString() : 'N/A'}.
                </p>
              </div>

              {/* Primary Contact Card & Outlets */}
              {(() => {
                const contact = activeProspect.contacts?.[0];
                const email = contact?.email || activeProspect.email;
                const phone = contact?.phone || activeProspect.phone;
                const waPhone = contact?.whatsapp || contact?.phone || activeProspect.whatsapp || activeProspect.phone;
                const linkedinUrl = isValidLinkedInUrl(contact?.linkedin_url) ? contact.linkedin_url : (isValidLinkedInUrl(activeProspect.linkedin_url) ? activeProspect.linkedin_url : null);
                const waUrl = formatOmanWhatsAppUrl(waPhone);

                return (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                    <div className="border-b border-slate-200/80 pb-2.5">
                      <p className="text-xs font-bold text-slate-400 uppercase">Primary Contact / Account</p>
                      <p className="text-base font-bold text-slate-900 mt-0.5">{contact?.full_name || activeProspect.company_name}</p>
                      <p className="text-xs text-slate-500 font-medium">{contact?.title ? `${contact.title} @ ` : ''}{activeProspect.company_name}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {email && (
                        <a href={`mailto:${email}`} className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:border-brand-teal font-semibold">
                          <Mail className="h-4 w-4 text-brand-teal" />
                          <span className="truncate">{email}</span>
                        </a>
                      )}
                      {phone && (
                        <a href={`tel:${phone}`} className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 hover:border-brand-teal font-semibold">
                          <Phone className="h-4 w-4 text-brand-teal" />
                          <span>{phone}</span>
                        </a>
                      )}
                      {waUrl && (
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-emerald-700 font-semibold">
                          <MessageCircle className="h-4 w-4 text-emerald-500" />
                          <span>WhatsApp (+968)</span>
                        </a>
                      )}
                      {linkedinUrl && (
                        <a href={linkedinUrl.startsWith("http") ? linkedinUrl : `https://${linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-blue-700 font-semibold">
                          <LinkedInIcon size={14} />
                          <span>LinkedIn Profile</span>
                        </a>
                      )}
                      {activeProspect.website && (
                        <a href={activeProspect.website.startsWith("http") ? activeProspect.website : `https://${activeProspect.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-blue-700 font-semibold hover:border-blue-300">
                          <Globe className="h-4 w-4 text-blue-500" />
                          <span className="truncate">Website</span>
                        </a>
                      )}
                      {extractInstagramUrl(activeProspect.notes) && (
                        <a href={extractInstagramUrl(activeProspect.notes)!} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-pink-700 font-semibold hover:border-pink-300">
                          <Camera className="h-4 w-4 text-pink-500" />
                          <span className="truncate">Instagram</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Firmographic Specs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Categorization</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Company Name</span>
                    <span className="font-bold text-slate-800">{activeProspect.company_name}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Industry Classification</span>
                    <span className="font-bold text-slate-800">{activeProspect.industry || 'Corporate'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <Link href={`/prospects/${activeProspect.id}`} className="w-full">
                <Button className="w-full bg-teal-600 text-white font-bold text-xs h-10 rounded-xl hover:bg-teal-700">
                  <Bot className="h-4 w-4 mr-2" /> AI Sales Assistant
                </Button>
              </Link>
              <Link href={`/prospects/${activeProspect.id}/edit`} className="w-full">
                <Button className="w-full bg-slate-900 text-white font-bold text-xs h-10 rounded-xl hover:bg-slate-800">
                  <Pencil className="h-4 w-4 mr-2" /> Edit Record
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => handleDelete(activeProspect.id, activeProspect.company_name)}
                className="bg-white text-red-600 border-red-200 hover:bg-red-50 text-xs font-bold h-10 rounded-xl px-3"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImport open={csvOpen} onClose={() => setCsvOpen(false)} onImport={handleImport} fields={csvFields} title="Import Prospects from CSV" />
    </div>
  );
}
