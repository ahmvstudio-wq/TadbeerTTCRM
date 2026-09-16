"use client";
// Clean CRM UI

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search, Plus, Building2, Phone, Mail, ExternalLink, Upload,
  AlertTriangle, Trash2, Pencil, ChevronDown, ChevronRight,
  MessageCircle, Download, LayoutGrid, List, ArrowUpDown, 
  TrendingUp, Users, Target, Clock, ArrowRight, Loader2, Activity,
  Flame, UserCheck, X, FileText, Send, CheckCircle2,
  Grid, Calendar, Filter, Zap, Globe, MapPin, Tag, User, Layers, PhoneCall, Bot, Camera, Copy
} from "lucide-react";
import { cn, formatWhatsAppNumber, formatPhoneNumberForDisplay, formatOmanWhatsAppUrl, isValidLinkedInUrl } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CsvImport } from "@/components/ui/csv-import";
import { Pagination } from "@/components/ui/pagination";
import { ToastContainer, addToast } from "@/components/ui/toast";
import { AddProspectModal } from "@/components/prospects/add-prospect-modal";
import { COMPANY_STATUSES, type CompanyStatus } from "@/lib/constants";
import { getCompanies, updateCompanyStatus, updateCompanyLeadType, addCompanyActivity, triggerDraftGeneration, triggerBatchDraftGeneration } from "@/lib/actions/companies";
import { addToCallQueue, addBatchToCallQueue } from "@/lib/actions/calls";
import { deleteCompany } from "@/lib/actions/delete";
import { bulkImportCompanies } from "@/lib/actions/import";
import { exportToCsv } from "@/lib/export-csv";
import { useUnifiedLead } from "@/context/unified-lead-context";
import { extractInstagramUrl as sharedExtractInstagramUrl } from "@/components/workspace/contact-channels-grid";
import { getCleanIndustry } from "@/lib/utils";

// Inline LinkedIn Icon
function LinkedInIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
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
  { key: 'Hot', label: 'Hot Lead', bg: 'bg-red-50 text-red-700 border-red-200' },
  { key: 'Warm', label: 'Warm Lead', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'Cold', label: 'Cold Lead', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'VIP', label: 'VIP Account', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'Inbound', label: 'Inbound Lead', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
  { key: 'Referral', label: 'Referral', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
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
  const [addModalOpen, setAddModalOpen] = useState(false);
  const { openLead } = useUnifiedLead();

  // AI Outreach Draft State
  const [generatingDraftId, setGeneratingDraftId] = useState<string | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);

  // UI Modes
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortBy, setSortBy] = useState<SortOption>('urgency');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Kanban Drag & Drop State
  const [draggedProspectId, setDraggedProspectId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const fetchProspects = useCallback(async (searchVal?: string, statusVal?: string, isRetry = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCompanies({ search: searchVal || undefined, status: statusVal || undefined });
      if (result.error) {
        if (result.error.includes("Unauthorized") || result.error.includes("session")) {
          window.location.href = "/login";
          return;
        }
        setError(result.error);
        setProspects([]);
      } else {
        setProspects(result.data || []);
        setSelectedIds([]);
      }
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
  useEffect(() => {
    const handleLeadUpdated = () => {
      fetchProspects(search, statusFilter);
    };
    window.addEventListener("lead-updated", handleLeadUpdated);
    return () => window.removeEventListener("lead-updated", handleLeadUpdated);
  }, [fetchProspects, search, statusFilter]);

  const handleImport = async (data: Record<string, string>[], channel?: any) => {
    const result = await bulkImportCompanies(data, channel);
    if (result.error) {
      addToast("error", `Import error: ${result.error}`);
    } else if (result.imported === 0 && result.failed > 0) {
      addToast("error", `Failed to import ${result.failed} rows. Please check that company names are present.`);
    } else {
      addToast("success", `Successfully imported ${result.imported} prospects ${channel && channel !== 'all' ? `to ${channel}` : ''}!`);
    }
    fetchProspects(search, statusFilter);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", { detail: { imported: true } }));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const result = await deleteCompany(id);
    if (result.error) addToast("error", result.error);
    else { 
      addToast("success", `"${name}" deleted`); 
      fetchProspects(search, statusFilter); 
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lead-updated", { detail: { companyId: id, deleted: true } }));
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await updateCompanyStatus(id, newStatus);
    if (res.error) addToast("error", res.error);
    else {
      addToast("success", `Status updated to ${COMPANY_STATUSES[newStatus as CompanyStatus]?.label}`);
      setProspects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lead-updated", { detail: { companyId: id, status: newStatus } }));
      }
    }
  };

  const handleSendToCadence = async (id: string, name: string) => {
    const res = await addToCallQueue(id);
    addToast("success", `"${name}" added to Daily Cadence Call Queue!`);
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status: 'in_call_queue' } : p));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", { detail: { companyId: id, status: 'in_call_queue' } }));
    }
  };

  const handleBatchSendToCadence = async () => {
    if (selectedIds.length === 0) return;
    const res = await addBatchToCallQueue(selectedIds);
    addToast("success", `Queued ${res.count || selectedIds.length} prospects to Daily Cadence Call Queue!`);
    fetchProspects(search, statusFilter);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", { detail: { status: 'in_call_queue' } }));
    }
  };

  const handleLeadTypeChange = async (id: string, newType: string) => {
    const res = await updateCompanyLeadType(id, newType);
    if (res.error) addToast("error", res.error);
    else {
      addToast("success", `Categorized as ${newType}`);
      setProspects(prev => prev.map(p => p.id === id ? { ...p, lead_type: newType } : p));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lead-updated", { detail: { companyId: id, leadType: newType } }));
      }
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", { detail: { status: newStatus } }));
    }
  };

  const extractInstagramUrl = useCallback((input: any): string => {
    return sharedExtractInstagramUrl(input);
  }, []);

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
      return { type: 'insights', label: 'Insight Generated Contacts', bg: 'bg-[#174E59]/10 text-[#174E59] border-[#174E59]/30 font-black' };
    }

    const isInstagramSource =
      prospect.lead_source?.toLowerCase().includes("instagram") ||
      prospect.lead_source?.toLowerCase().includes("ig dm") ||
      (prospect.activities || []).some((a: any) => a.activity_type === "ig_dm" || a.channel === "instagram");

    if (isInstagramSource) {
      return { type: 'instagram', label: 'Instagram DM Lead', bg: 'bg-pink-50 text-pink-700 border-pink-200 font-bold' };
    }

    const contactLinkedin = prospect.contacts?.[0]?.linkedin_url;
    const companyLinkedin = prospect.linkedin_url;
    const hasValidLinkedinUrl = isValidLinkedInUrl(contactLinkedin) || isValidLinkedInUrl(companyLinkedin);
    const isPushedFromLinkedIn = prospect.lead_source === 'LinkedIn' || prospect.notes?.startsWith('Imported from LinkedIn CRM');

    if (isPushedFromLinkedIn || hasValidLinkedinUrl) {
      return { type: 'linkedin', label: 'LinkedIn Lead', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    }

    const isWhatsAppSource = prospect.lead_source?.toLowerCase().includes("whatsapp");
    if (isWhatsAppSource) {
      return { type: 'whatsapp', label: 'WhatsApp Campaign', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold' };
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
      const hasWa = hasValidWhatsApp(p) || p.lead_source?.toLowerCase().includes('whatsapp');
      const hasIg = Boolean(extractInstagramUrl(p)) || p.lead_source?.toLowerCase().includes('instagram');
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

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dateFilter, channelFilter, leadSegment, sortBy]);

  const totalItems = sortedProspects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedProspects = useMemo(() => {
    if (pageSize >= 999999) return sortedProspects;
    const start = (currentPage - 1) * pageSize;
    return sortedProspects.slice(start, start + pageSize);
  }, [sortedProspects, currentPage, pageSize]);

  const handleExport = () => {
    const dataToExport = selectedIds.length > 0
      ? sortedProspects.filter((p) => selectedIds.includes(p.id))
      : sortedProspects;

    if (dataToExport.length === 0) {
      addToast("error", "No prospects matching the current filter to export");
      return;
    }

    const exportData = dataToExport.map((p) => {
      const primaryContact = p.contacts?.[0];
      const rawPhone = primaryContact?.phone || p.phone || primaryContact?.whatsapp || p.whatsapp || "";
      const displayPhone = rawPhone ? formatPhoneNumberForDisplay(rawPhone) : "";
      const waUrl = formatOmanWhatsAppUrl(rawPhone) || "";

      let igUrl = extractInstagramUrl(p);
      if (!igUrl && p.website && p.website.toLowerCase().includes("instagram.com")) {
        igUrl = p.website;
      }

      const liUrl = isValidLinkedInUrl(primaryContact?.linkedin_url)
        ? primaryContact!.linkedin_url
        : (isValidLinkedInUrl(p.linkedin_url) ? p.linkedin_url : "");

      return {
        company_name: p.company_name || "",
        contact_name: primaryContact?.full_name || p.company_name || "",
        contact_title: primaryContact?.title || "Decision Maker",
        phone: displayPhone,
        whatsapp: primaryContact?.whatsapp || p.whatsapp || displayPhone,
        whatsapp_url: waUrl,
        instagram_url: igUrl,
        linkedin: liUrl,
        email: primaryContact?.email || p.email || "",
        industry: p.industry || "General Enterprise",
        city: p.city ? `${p.city}, Oman` : "Muscat, Oman",
        website: p.website || "",
        lead_source: getLeadSource(p).label,
        lead_type: p.lead_type || "Cold",
        status: COMPANY_STATUSES[p.status as CompanyStatus]?.label || p.status,
        date_added: p.created_at ? new Date(p.created_at).toLocaleDateString() : "",
        notes: p.notes || "",
      };
    });

    const channelTag = channelFilter !== 'all' ? `${channelFilter}-` : '';
    exportToCsv(exportData, `tadbeer-prospects-${channelTag}${new Date().toISOString().split("T")[0]}.csv`, [
      { key: "company_name", label: "Company Name" },
      { key: "contact_name", label: "Primary Contact Person" },
      { key: "contact_title", label: "Title / Role" },
      { key: "phone", label: "Phone Number" },
      { key: "whatsapp", label: "WhatsApp Number" },
      { key: "whatsapp_url", label: "WhatsApp Direct Link" },
      { key: "instagram_url", label: "Instagram Profile Link" },
      { key: "linkedin", label: "LinkedIn Profile Link" },
      { key: "email", label: "Email Address" },
      { key: "industry", label: "Industry" },
      { key: "city", label: "Location / City" },
      { key: "website", label: "Website" },
      { key: "lead_source", label: "Source Channel" },
      { key: "lead_type", label: "Categorization" },
      { key: "status", label: "Pipeline Stage" },
      { key: "date_added", label: "Date Added" },
      { key: "notes", label: "Research Notes" },
    ]);
    addToast("success", `Exported ${dataToExport.length} prospects to CSV with Instagram & WhatsApp links`);
  };
  const totalCount = prospects.length;
  const insightsCount = prospects.filter(p => getLeadSource(p).type === 'insights').length;
  const linkedinCount = prospects.filter(p => getLeadSource(p).type === 'linkedin').length;
  const todayCount = prospects.filter(p => isDateMatch(p.created_at, 'today')).length;
  const hotCount = prospects.filter(p => p.lead_type === 'Hot' || p.status === 'opportunity').length;

  const openDrawer = (prospect: any) => {
    openLead(prospect.id);
  };

  return (
    <div className="space-y-6 page-enter pb-24 max-w-[1850px] w-full mx-auto px-2 sm:px-4 font-sans">
      <ToastContainer />

      {/* ── BDM Command Header ────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white/80 backdrop-blur-xl text-[#0c0d0f] p-5 sm:p-6 border border-black/[0.06] shadow-glass space-y-4 font-sans">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider bg-black/[0.04] border border-black/[0.06] text-black mb-1.5">
              <Zap className="h-3 w-3 text-black" />
              <span>LEADS DIRECTORY</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-light tracking-tight text-black font-display">Prospects & Leads</h1>
            <p className="text-[#6b7280] text-xs mt-0.5 max-w-2xl font-light font-body">
              View, search, and reach out to all your leads.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={() => setAddModalOpen(true)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-800 text-xs font-mono font-bold h-8 rounded-lg px-3 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Prospect
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setBatchGenerating(true);
                const results = await triggerBatchDraftGeneration();
                setBatchGenerating(false);
                const ready = results.filter(r => r.status === 'ready_to_send').length;
                if (ready > 0) {
                  addToast("success", `Generated ${ready} message drafts!`);
                } else {
                  addToast("error", "No pending leads found.");
                }
                fetchProspects(search, statusFilter);
              }}
              disabled={batchGenerating}
              className="bg-[#0f343c] hover:bg-[#091f24] text-white border border-[#16434d] text-xs font-mono font-bold h-8 rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              {batchGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-white" />}
              AI Drafts
            </Button>
            <Link href="/daily-cadence">
              <Button className="bg-[#0f343c] hover:bg-[#091f24] text-white border border-[#16434d] text-xs font-mono font-bold h-8 rounded-lg px-3 transition-all cursor-pointer">
                <PhoneCall className="h-3.5 w-3.5 mr-1.5 text-white" />Daily Cadence
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="bg-white hover:bg-neutral-100 text-black border-neutral-200 text-xs font-mono font-bold h-8 rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCsvOpen(true)}
              className="bg-white hover:bg-neutral-100 text-black border-neutral-200 text-xs font-mono font-bold h-8 rounded-lg transition-all cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5 text-black" />Import CSV
            </Button>
          </div>
        </div>

        {/* ── Metric Bar Highlights ────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-neutral-100 font-mono">
          
          {/* Card 1: Total Leads */}
          <div
            onClick={() => { setSourceFilter(""); setChannelFilter("all"); }}
            className={cn(
              "rounded-lg p-3 border flex items-center gap-3 cursor-pointer transition-all",
              !sourceFilter && channelFilter === "all" ? "bg-[#0f343c] text-white border-[#16434d] shadow-xs" : "bg-neutral-50/70 border-neutral-200 hover:bg-white"
            )}
          >
            <div className={cn("h-8 w-8 rounded flex items-center justify-center flex-shrink-0", !sourceFilter && channelFilter === "all" ? "bg-[#091f24] text-white" : "bg-white border border-neutral-200 text-black")}>
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className={cn("text-[9px] font-bold uppercase tracking-wider", !sourceFilter && channelFilter === "all" ? "text-neutral-300" : "text-neutral-500")}>Total Leads</p>
              <p className="text-lg font-black leading-tight mt-0.5">{totalCount}</p>
            </div>
          </div>

          {/* Card 2: Discovered Leads */}
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
              "rounded-lg p-3 border transition-all cursor-pointer flex items-center gap-3",
              channelFilter === "insights" || sourceFilter === "insights"
                ? "bg-[#0f343c] text-white border-[#16434d] shadow-xs"
                : "bg-neutral-50/70 border-neutral-200 hover:bg-white"
            )}
          >
            <div className={cn("h-8 w-8 rounded flex items-center justify-center flex-shrink-0", channelFilter === "insights" || sourceFilter === "insights" ? "bg-[#091f24] text-white" : "bg-white border border-neutral-200 text-[#0f343c]")}>
              <Zap className="h-4 w-4 text-[#0f343c]" />
            </div>
            <div>
              <p className={cn("text-[9px] font-bold uppercase tracking-wider", channelFilter === "insights" || sourceFilter === "insights" ? "text-neutral-300" : "text-neutral-500")}>Discovered</p>
              <p className="text-lg font-black leading-tight mt-0.5">{insightsCount}</p>
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
              "rounded-lg p-3 border flex items-center gap-3 cursor-pointer transition-all",
              channelFilter === "linkedin" || sourceFilter === "linkedin" ? "bg-[#0f343c] text-white border-[#16434d] shadow-xs" : "bg-neutral-50/70 border-neutral-200 hover:bg-white"
            )}
          >
            <div className={cn("h-8 w-8 rounded flex items-center justify-center flex-shrink-0", channelFilter === "linkedin" || sourceFilter === "linkedin" ? "bg-[#091f24] text-white" : "bg-white border border-neutral-200 text-black")}>
              <LinkedInIcon size={14} />
            </div>
            <div>
              <p className={cn("text-[9px] font-bold uppercase tracking-wider", channelFilter === "linkedin" || sourceFilter === "linkedin" ? "text-neutral-300" : "text-neutral-500")}>LinkedIn</p>
              <p className="text-lg font-black leading-tight mt-0.5">{linkedinCount}</p>
            </div>
          </div>

          {/* Card 4: Added Today */}
          <div className="bg-neutral-50/70 rounded-lg p-3 border border-neutral-200 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Added Today</p>
              <p className="text-lg font-black text-black mt-0.5">{todayCount} Leads</p>
            </div>
            <PhoneCall className="h-4 w-4 text-black opacity-80" />
          </div>
        </div>
      </div>

      {/* ── BDM Control Bar & Compact Filters ─────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3 font-sans">
        {/* Row 1: Search + Sort + View Toggle + Lead Count */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
            <Input
              placeholder="Search contact, company, handle, or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs w-full bg-neutral-50 border-neutral-200 rounded-lg focus:bg-white font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-700 h-8 px-2.5 focus:bg-white cursor-pointer font-mono"
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
              className="bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-700 h-8 px-2.5 focus:bg-white cursor-pointer"
            >
              <option value="urgency">Sort: Urgency</option>
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="status">Sort: Stage</option>
            </select>

            <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
              <button
                onClick={() => setViewMode('table')}
                className={cn("px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer", viewMode === 'table' ? "bg-black text-white shadow-xs" : "text-neutral-500 hover:text-black")}
              >
                <List className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
              <button
                onClick={() => setViewMode('board')}
                className={cn("px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 cursor-pointer", viewMode === 'board' ? "bg-black text-white shadow-xs" : "text-neutral-500 hover:text-black")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Board</span>
              </button>
            </div>
            
            <span className="text-xs text-neutral-700 font-mono font-bold px-2 py-1 bg-neutral-100 border border-neutral-200 rounded-lg">
              {sortedProspects.length} shown
            </span>
          </div>
        </div>

        {/* Row 2: Compact Date & Segment Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 pt-1.5 border-t border-neutral-100 scrollbar-hide text-xs">
          <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider shrink-0">SCOPE:</span>
          
          {(['all', 'new', 'database'] as const).map(seg => (
            <button
              key={seg}
              onClick={() => setLeadSegment(seg)}
              className={cn(
                "px-2.5 py-0.5 rounded text-xs font-bold transition-all border cursor-pointer shrink-0 font-mono",
                leadSegment === seg ? "bg-black text-white border-black shadow-xs" : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              )}
            >
              {seg === 'all' ? 'All Leads' : seg === 'new' ? 'New Leads' : 'Database'}
            </button>
          ))}

          <span className="text-neutral-300">|</span>

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
                "px-2.5 py-0.5 rounded text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shrink-0 font-mono",
                dateFilter === df.key ? "bg-black text-white border-black shadow-xs" : "bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              )}
            >
              {df.label}
            </button>
          ))}
        </div>

        {/* ── Row 3: Dynamic Channel Categories Filter Buttons ────────────────── */}
        <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mr-1 flex items-center gap-1 font-mono">
            <Filter className="h-3 w-3 text-black" /> CHANNELS:
          </span>
          
          <button
            onClick={() => setChannelFilter("all")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
              channelFilter === "all"
                ? "bg-black text-white border-black font-black"
                : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100 hover:text-black"
            )}
          >
            All ({channelCategoryCounts.all})
          </button>

          <button
            onClick={() => setChannelFilter("whatsapp")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
              channelFilter === "whatsapp"
                ? "bg-black text-white border-black font-black"
                : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50"
            )}
          >
            <span>WhatsApp</span>
            <span className={cn("text-[9px] px-1.5 py-0.2 rounded font-black", channelFilter === "whatsapp" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-800")}>
              {channelCategoryCounts.whatsapp}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("instagram")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
              channelFilter === "instagram"
                ? "bg-black text-white border-black font-black"
                : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50"
            )}
          >
            <span>Instagram</span>
            <span className={cn("text-[9px] px-1.5 py-0.2 rounded font-black", channelFilter === "instagram" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-800")}>
              {channelCategoryCounts.instagram}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("linkedin")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
              channelFilter === "linkedin"
                ? "bg-black text-white border-black font-black"
                : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50"
            )}
          >
            <LinkedInIcon size={12} />
            <span>LinkedIn</span>
            <span className={cn("text-[9px] px-1.5 py-0.2 rounded font-black", channelFilter === "linkedin" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-800")}>
              {channelCategoryCounts.linkedin}
            </span>
          </button>

          <button
            onClick={() => setChannelFilter("phone")}
            className={cn(
              "px-2.5 py-1 rounded text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5",
              channelFilter === "phone"
                ? "bg-black text-white border-black font-black"
                : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-50"
            )}
          >
            <span>Phone</span>
            <span className={cn("text-[9px] px-1.5 py-0.2 rounded font-black", channelFilter === "phone" ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-800")}>
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
            <span>Email</span>
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
        <div className="text-center py-20 bg-white rounded-xl border border-neutral-200 border-dashed">
          <Building2 className="h-10 w-10 text-neutral-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-neutral-800">No prospects match filters</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Try clearing date or stage filters.</p>
        </div>
      ) : viewMode === 'table' ? (

        /* ── CATEGORIZED TABLE VIEW ──────────────────────────────────────── */
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-black/[0.06] shadow-glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans">
              <thead>
                <tr className="bg-[#f5f5f7]/80 border-b border-black/[0.05] text-[10px] font-mono font-medium text-[#6b7280] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === sortedProspects.length}
                      onChange={(e) => setSelectedIds(e.target.checked ? sortedProspects.map(p => p.id) : [])}
                      className="h-3.5 w-3.5 rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Contact & Company</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Channel</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Industry</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell font-mono">Date</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs font-medium">
                {paginatedProspects.map((prospect) => {
                  const contact = prospect.contacts?.[0];
                  const primaryName = contact?.full_name || prospect.company_name;
                  const companySub = contact?.full_name ? prospect.company_name : 'Company Lead';
                  const titleSub = contact?.title || '';
                  const source = getLeadSource(prospect);
                  const addedDate = prospect.created_at ? new Date(prospect.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Recent';
                  const isAddedToday = isDateMatch(prospect.created_at, 'today');

                  const linkedinUrl = isValidLinkedInUrl(contact?.linkedin_url) 
                    ? contact?.linkedin_url 
                    : (isValidLinkedInUrl(prospect?.linkedin_url) ? prospect?.linkedin_url : null);

                  const waPhone = contact?.whatsapp || contact?.phone || prospect?.whatsapp || prospect?.phone;
                  const waUrl = formatOmanWhatsAppUrl(waPhone);
                  const igUrl = extractInstagramUrl(prospect);

                  return (
                    <tr
                      key={prospect.id}
                      onClick={() => openDrawer(prospect)}
                      className="hover:bg-neutral-50/80 transition-colors duration-150 cursor-pointer group"
                    >
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(prospect.id)}
                          onChange={(e) => setSelectedIds(e.target.checked ? [...selectedIds, prospect.id] : selectedIds.filter(id => id !== prospect.id))}
                          className="h-3.5 w-3.5 rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                        />
                      </td>

                      {/* Primary Contact Person */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded bg-neutral-100 border border-neutral-200 text-neutral-800 font-mono font-black text-xs flex items-center justify-center shrink-0">
                            {primaryName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-black text-xs group-hover:underline truncate">
                                {primaryName}
                              </span>
                              {isAddedToday && (
                                <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-black text-white">
                                  TODAY
                                </span>
                              )}
                              {prospect.lead_type && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                                  {prospect.lead_type}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                              {titleSub ? `${titleSub} @ ` : ''}{companySub}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Source Channel */}
                      <td className="py-3.5 px-4 hidden md:table-cell font-mono">
                        <div className="flex items-center gap-1.5">
                          {source.type === 'linkedin' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-black border border-neutral-200 flex items-center gap-1">
                              <LinkedInIcon size={10} /> LinkedIn
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                              {source.label}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Industry */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="text-neutral-700 text-xs font-semibold truncate block max-w-[160px]">
                          {getCleanIndustry(prospect.industry || prospect.company_name)}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono block">
                          {[prospect.city, prospect.country].filter(Boolean).join(", ") || 'Oman'}
                        </span>
                      </td>

                      {/* Date Added */}
                      <td className="py-3.5 px-4 hidden lg:table-cell font-mono text-[11px] text-neutral-500">
                        {addedDate}
                      </td>

                      {/* Pipeline Stage */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={prospect.status}
                          onChange={(e) => handleStatusChange(prospect.id, e.target.value)}
                          className={cn(
                            "text-[10px] font-mono font-bold rounded px-2 py-1 border transition-all cursor-pointer",
                            statusColor[prospect.status as CompanyStatus]?.bg || "bg-neutral-100",
                            statusColor[prospect.status as CompanyStatus]?.text || "text-neutral-700",
                            statusColor[prospect.status as CompanyStatus]?.border || "border-neutral-200"
                          )}
                        >
                          {statusOrder.map((s) => (
                            <option key={s} value={s}>
                              {COMPANY_STATUSES[s]?.label || s}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Quick Contact & Action Buttons */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Send to Cadence */}
                          <Button
                            size="sm"
                            onClick={() => handleSendToCadence(prospect.id, primaryName)}
                            className="bg-neutral-100 text-black hover:bg-black hover:text-white border border-neutral-200 text-xs font-bold font-mono h-7 px-2 rounded transition-colors"
                          >
                            + Cadence
                          </Button>

                          {/* WhatsApp Link */}
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          )}

                          {/* Instagram Link */}
                          {igUrl && (
                            <a
                              href={igUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white transition-colors"
                              title="Instagram Profile"
                            >
                              <Camera className="h-3.5 w-3.5" />
                            </a>
                          )}

                          {/* LinkedIn Link */}
                          {linkedinUrl && (
                            <a
                              href={linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white transition-colors"
                              title="LinkedIn Profile"
                            >
                              <LinkedInIcon size={14} />
                            </a>
                          )}

                          {/* Website Link */}
                          {prospect.website && (
                            <a
                              href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white transition-colors"
                              title="Company Website"
                            >
                              <Globe className="h-3.5 w-3.5" />
                            </a>
                          )}

                          {/* Open Drawer */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 rounded text-neutral-400 hover:text-black"
                            onClick={() => openDrawer(prospect)}
                          >
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
          {/* Pagination Controls */}
          <div className="p-3 bg-white/60 border-t border-black/[0.05]">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[25, 50, 100]}
            />
          </div>
        </div>
      ) : viewMode === 'board' ? (

        /* ── KANBAN BOARD VIEW ───────────────────────────────────────────── */
        <div className="flex gap-3.5 overflow-x-auto pb-6 scrollbar-hide" style={{ minHeight: '680px' }}>
          {statusOrder.map((statusKey) => {
            const columnProspects = sortedProspects.filter(p => p.status === statusKey);
            const statusConfig = COMPANY_STATUSES[statusKey];
            const isDragOver = dragOverColumn === statusKey;
            
            return (
              <div
                key={statusKey}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverColumn !== statusKey) setDragOverColumn(statusKey);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  if (dragOverColumn === statusKey) setDragOverColumn(null);
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverColumn(null);
                  const prospectId = e.dataTransfer.getData("text/plain") || draggedProspectId;
                  if (!prospectId) return;
                  const targetProspect = prospects.find(p => p.id === prospectId);
                  if (!targetProspect || targetProspect.status === statusKey) return;

                  // Optimistic local UI update
                  setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, status: statusKey } : p));
                  addToast("success", `Moved "${targetProspect.company_name}" to ${statusConfig?.label || statusKey}`);
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("lead-updated", { detail: { companyId: prospectId, status: statusKey } }));
                  }

                  try {
                    const res = await updateCompanyStatus(prospectId, statusKey);
                    if (res.error) {
                      addToast("error", `Failed to update stage: ${res.error}`);
                      fetchProspects(search, statusFilter);
                    }
                  } catch (err) {
                    console.error("Drop stage error:", err);
                    fetchProspects(search, statusFilter);
                  }
                }}
                className={cn(
                  "flex-shrink-0 w-80 bg-white/70 backdrop-blur-xl rounded-2xl border border-black/[0.06] shadow-glass flex flex-col max-h-[820px] transition-all duration-200",
                  isDragOver && "ring-2 ring-brand-teal/50 bg-teal-500/[0.06] border-brand-teal/40 scale-[1.01]"
                )}
              >
                <div className="p-3.5 border-b border-black/[0.06] bg-white/80 backdrop-blur-md rounded-t-2xl flex items-center justify-between sticky top-0 z-10 shadow-2xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", statusColor[statusKey]?.dot || "bg-black")} />
                    <h3 className="text-xs font-bold text-black uppercase tracking-wider">{statusConfig?.label}</h3>
                  </div>
                  <span className="bg-neutral-100 text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-neutral-200">{columnProspects.length}</span>
                </div>

                <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5">
                  {columnProspects.map(prospect => {
                    const contact = prospect.contacts?.[0];
                    const primaryName = contact?.full_name || prospect.company_name;
                    const source = getLeadSource(prospect);
                    const isBeingDragged = draggedProspectId === prospect.id;

                    return (
                      <div
                        key={prospect.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", prospect.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggedProspectId(prospect.id);
                        }}
                        onDragEnd={() => {
                          setDraggedProspectId(null);
                          setDragOverColumn(null);
                        }}
                        onClick={() => openDrawer(prospect)}
                        className={cn(
                          "bg-white/95 backdrop-blur-md rounded-xl p-3 border border-black/[0.06] shadow-2xs hover:border-black/30 hover:shadow-md transition-all duration-150 cursor-grab active:cursor-grabbing group relative space-y-2 select-none",
                          isBeingDragged && "opacity-35 scale-95 border-dashed border-black/40 rotate-1 shadow-lg"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1 font-mono">
                          {source.type === 'linkedin' ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-black border border-neutral-200 flex items-center gap-1">
                              <LinkedInIcon size={10} /> LinkedIn
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                              {getCleanIndustry(prospect.industry || prospect.company_name)}
                            </span>
                          )}

                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            {prospect.website && (
                              <a href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`} target="_blank" rel="noopener noreferrer" className="p-1 bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white rounded transition-colors" title="Website">
                                <Globe className="h-3 w-3" />
                              </a>
                            )}
                            {extractInstagramUrl(prospect) && (
                              <a href={extractInstagramUrl(prospect)!} target="_blank" rel="noopener noreferrer" className="p-1 bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white rounded transition-colors" title="Instagram">
                                <Camera className="h-3 w-3" />
                              </a>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSendToCadence(prospect.id, primaryName)}
                              className="h-5 text-[9px] font-mono font-bold text-black bg-neutral-100 hover:bg-black hover:text-white px-1.5 rounded"
                            >
                              + Cadence
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-black group-hover:underline truncate">
                            {primaryName}
                          </h4>
                          <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                            {contact?.title ? `${contact.title} @ ` : ''}{prospect.company_name}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[9px] font-mono text-neutral-400 pt-1.5 border-t border-neutral-100">
                          <span>Added {prospect.created_at ? new Date(prospect.created_at).toLocaleDateString() : 'recent'}</span>
                          <span>{[prospect.city, prospect.country].filter(Boolean).join(", ") || ''}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Drop Placeholder when hovering */}
                  {isDragOver && draggedProspectId && !columnProspects.some(p => p.id === draggedProspectId) && (
                    <div className="h-16 rounded-xl border-2 border-dashed border-brand-teal/40 bg-teal-500/10 flex items-center justify-center text-[11px] font-mono font-bold text-brand-teal animate-pulse">
                      Drop to move to {statusConfig?.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (

        /* ── GRID CARDS VIEW ─────────────────────────────────────────────── */
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedProspects.map((prospect) => {
              const contact = prospect.contacts?.[0];
              const primaryName = contact?.full_name || prospect.company_name;
              const source = getLeadSource(prospect);
              const waPhone = contact?.whatsapp || contact?.phone || prospect?.phone;
              const waUrl = formatOmanWhatsAppUrl(waPhone);

              return (
                <div
                  key={prospect.id}
                  onClick={() => openDrawer(prospect)}
                  className="bg-white rounded-xl p-4 border border-neutral-200 shadow-xs hover:border-black transition-all cursor-pointer group flex flex-col justify-between font-sans"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3 font-mono">
                      {source.type === 'linkedin' ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-black border border-neutral-200 flex items-center gap-1">
                          <LinkedInIcon size={10} /> LinkedIn
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {source.label}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border border-neutral-200 bg-neutral-100 text-black">
                        {COMPANY_STATUSES[prospect.status as CompanyStatus]?.label || prospect.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-black text-white flex items-center justify-center font-mono font-black text-base flex-shrink-0">
                        {primaryName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-black group-hover:underline truncate">{primaryName}</h3>
                        <p className="text-xs text-neutral-500 truncate">{contact?.title ? `${contact.title} @ ` : ''}{prospect.company_name}</p>
                      </div>
                    </div>

                    <div className="bg-neutral-50 rounded-lg p-2.5 border border-neutral-200 space-y-1 mb-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-400 font-mono font-bold uppercase text-[9px]">Industry</span>
                        <span className="font-semibold text-black truncate max-w-[170px]">{getCleanIndustry(prospect.industry || prospect.company_name)}</span>
                      </div>
                      {contact?.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400 font-mono font-bold uppercase text-[9px]">Email</span>
                          <span className="font-medium text-neutral-800 truncate max-w-[170px]">{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-mono" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px]">Added {prospect.created_at ? new Date(prospect.created_at).toLocaleDateString() : 'recent'}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleSendToCadence(prospect.id, primaryName)}
                        className="bg-neutral-100 text-black hover:bg-black hover:text-white border border-neutral-200 text-xs font-bold h-7 px-2 rounded"
                      >
                        + Cadence
                      </Button>
                      {waUrl && (
                        <a href={waUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white transition-colors">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {prospect.website && (
                        <a href={prospect.website.startsWith('http') ? prospect.website : `https://${prospect.website}`} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white transition-colors" title="Website" onClick={e => e.stopPropagation()}>
                          <Globe className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {extractInstagramUrl(prospect) && (
                        <a href={extractInstagramUrl(prospect)!} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white transition-colors" title="Instagram" onClick={e => e.stopPropagation()}>
                          <Camera className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded text-neutral-400 hover:text-black" onClick={() => openDrawer(prospect)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid View Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[25, 50, 100]}
          />
        </div>
      )}

      {/* CSV Import Modal */}
      <CsvImport open={csvOpen} onClose={() => setCsvOpen(false)} onImport={handleImport} fields={csvFields} title="Import Prospects from CSV" />

      {/* Manual Add Prospect Modal */}
      <AddProspectModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={(newCo) => {
          addToast("success", `Prospect "${newCo?.company_name || 'Lead'}" created successfully!`);
          fetchProspects(search, statusFilter);
        }}
      />
    </div>
  );
}
