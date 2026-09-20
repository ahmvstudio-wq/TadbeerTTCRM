"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileCheck,
  Plus,
  Search,
  X,
  FileText,
  Upload,
  Download,
  ExternalLink,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Globe,
  Share2,
  Copy,
  ChevronRight,
  ArrowUpRight,
  Check,
  Loader2,
  User,
  Phone,
  Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { addToast } from "@/components/ui/toast";
import {
  getAudits,
  createAudit,
  updateAuditStatus,
  updateAudit,
  attachAuditPdf,
  deleteAudit,
  type AuditRecord,
  type AuditType,
  type AuditStatus,
  type AuditPdf,
  type CreateAuditInput
} from "@/lib/actions/audits";
import { getCompanies } from "@/lib/actions/companies";
import { useUnifiedLead } from "@/context/unified-lead-context";

const AUDIT_TYPES: AuditType[] = [
  "Business / Operations",
  "Website",
  "Sales",
  "Technology / Automation",
  "AI",
  "ERP",
  "Other",
];

const STATUS_CONFIG: Record<AuditStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  new: {
    label: "New",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
};

export default function AuditsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openLead } = useUnifiedLead();

  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | AuditStatus>("all");

  // Modals & Drawers
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);

  // Read initial filter from URL params (e.g. /audits?status=pending from dashboard)
  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam === "pending" || statusParam === "new" || statusParam === "in_progress" || statusParam === "completed") {
      setStatusFilter(statusParam as any);
    }
  }, [searchParams]);

  // Fetch audits & companies silently or with spinner
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [auditsRes, companiesRes] = await Promise.all([getAudits(), getCompanies()]);
      if (auditsRes.data) setAudits(auditsRes.data);
      if (companiesRes.data) setCompanies(companiesRes.data);
    } catch (err) {
      console.error("Failed to load audits:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
    const handleLeadUpdated = () => loadData(true);
    window.addEventListener("lead-updated", handleLeadUpdated);
    return () => window.removeEventListener("lead-updated", handleLeadUpdated);
  }, [loadData]);

  // Counts
  const counts = useMemo(() => {
    const total = audits.length;
    const newCount = audits.filter((a) => a.status === "new").length;
    const inProgressCount = audits.filter((a) => a.status === "in_progress").length;
    const completedCount = audits.filter((a) => a.status === "completed").length;
    const pendingCount = newCount + inProgressCount;
    return { total, newCount, inProgressCount, completedCount, pendingCount };
  }, [audits]);

  // Filtered Audits
  const filteredAudits = useMemo(() => {
    return audits.filter((audit) => {
      // Status filter
      if (statusFilter === "pending") {
        if (audit.status === "completed") return false;
      } else if (statusFilter !== "all") {
        if (audit.status !== statusFilter) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesBusiness = audit.business_name.toLowerCase().includes(q);
        const matchesProblem = (audit.problem_statement || "").toLowerCase().includes(q);
        const matchesContact = (audit.contact_person || "").toLowerCase().includes(q);
        const matchesDetails = (audit.contact_details || "").toLowerCase().includes(q);
        const matchesType = (audit.audit_type || "").toLowerCase().includes(q);
        const matchesNotes = (audit.additional_notes || "").toLowerCase().includes(q);
        if (!matchesBusiness && !matchesProblem && !matchesContact && !matchesDetails && !matchesType && !matchesNotes) {
          return false;
        }
      }

      return true;
    });
  }, [audits, statusFilter, searchQuery]);

  // Status Change Handler (Optimistic & Silent)
  const handleStatusChange = async (id: string, newStatus: AuditStatus) => {
    setAudits((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
    if (selectedAudit && selectedAudit.id === id) {
      setSelectedAudit((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    addToast("success", `Audit status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
    const res = await updateAuditStatus(id, newStatus);
    if (!res.success) {
      addToast("error", res.error || "Failed to update status");
      loadData(true);
    }
  };

  // Delete Audit Handler
  const handleDeleteAudit = async (id: string, businessName: string) => {
    if (!confirm(`Are you sure you want to delete the audit for "${businessName}"?`)) return;
    setAudits((prev) => prev.filter((a) => a.id !== id));
    if (selectedAudit?.id === id) setSelectedAudit(null);
    addToast("success", "Audit deleted");
    const res = await deleteAudit(id);
    if (!res.success) {
      addToast("error", res.error || "Failed to delete audit");
      loadData(true);
    }
  };

  return (
    <div className="space-y-6 page-enter pb-24 max-w-[1700px] w-full mx-auto font-sans">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-[#0f343c] text-white border border-[#16434d] flex items-center gap-1.5">
              <FileCheck className="h-3 w-3" />
              Audits Engine
            </span>
          </div>
          <h1 className="text-xl font-black text-black tracking-tight">Business Audits</h1>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Capture business requirements → complete audit → attach PDF → share with client.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setNewModalOpen(true)}
            className="bg-black hover:bg-neutral-800 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Audit
          </Button>
        </div>
      </div>

      {/* ── Filters & Search Bar ────────────────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide text-xs font-mono">
            <button
              onClick={() => setStatusFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
                statusFilter === "all"
                  ? "bg-black text-white border-black"
                  : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
              )}
            >
              All ({counts.total})
            </button>

            <button
              onClick={() => setStatusFilter("pending")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
                statusFilter === "pending"
                  ? "bg-amber-500 text-white border-amber-600"
                  : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              )}
            >
              Pending ({counts.pendingCount})
            </button>

            <button
              onClick={() => setStatusFilter("new")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
                statusFilter === "new"
                  ? "bg-black text-white border-black"
                  : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
              )}
            >
              New ({counts.newCount})
            </button>

            <button
              onClick={() => setStatusFilter("in_progress")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
                statusFilter === "in_progress"
                  ? "bg-blue-600 text-white border-blue-700"
                  : "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
              )}
            >
              In Progress ({counts.inProgressCount})
            </button>

            <button
              onClick={() => setStatusFilter("completed")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5",
                statusFilter === "completed"
                  ? "bg-emerald-600 text-white border-emerald-700"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              )}
            >
              Completed ({counts.completedCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audits, problems, types..."
              className="h-8.5 pl-8 pr-8 text-xs bg-neutral-50 border-neutral-200 rounded-xl focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-black cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Audits Table ────────────────────────────────────────────────────── */}
      <div className="bg-white border border-neutral-200 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-16 space-y-2">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            <span className="text-xs text-neutral-400 ml-2 font-mono">Loading audits...</span>
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="p-16 text-center">
            <div className="h-12 w-12 rounded-2xl bg-neutral-100 border border-neutral-200 text-neutral-400 flex items-center justify-center mx-auto mb-3">
              <FileCheck className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-neutral-800">No audits found</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No audits matching "${searchQuery}". Try clearing search.`
                : statusFilter !== "all"
                ? `No audits with status "${statusFilter}".`
                : "Ismail can click '+ New Audit' to add the first business audit."}
            </p>
            <Button
              onClick={() => setNewModalOpen(true)}
              className="mt-4 bg-black hover:bg-neutral-800 text-white font-bold text-xs h-8 px-3 rounded-lg cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Audit
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4 font-bold">Business</th>
                  <th className="py-3 px-4 font-bold">Audit Type</th>
                  <th className="py-3 px-4 font-bold">Problem / Requirement</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Audit PDF</th>
                  <th className="py-3 px-4 font-bold">Date Added</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-xs">
                {filteredAudits.map((audit) => {
                  const statusCfg = STATUS_CONFIG[audit.status] || STATUS_CONFIG.new;
                  const dateDisplay = audit.date_added
                    ? new Date(audit.date_added).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—";

                  return (
                    <tr
                      key={audit.id}
                      onClick={() => setSelectedAudit(audit)}
                      className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Business */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 font-mono font-black text-xs flex items-center justify-center shrink-0">
                            {audit.business_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-black group-hover:underline">
                                {audit.business_name}
                              </span>
                              {audit.company_id && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                                  CRM LINKED
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                              {audit.contact_person && (
                                <span className="truncate max-w-[140px] text-neutral-600">
                                  {audit.contact_person}
                                </span>
                              )}
                              {audit.website && (
                                <span className="truncate max-w-[120px] hover:text-black">
                                  {audit.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Audit Type */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {audit.audit_type}
                        </span>
                      </td>

                      {/* Problem / Requirement */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="line-clamp-2 text-neutral-700 leading-relaxed">
                          {audit.problem_statement || "No specific problem noted."}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={audit.status}
                          onChange={(e) => handleStatusChange(audit.id, e.target.value as AuditStatus)}
                          className={cn(
                            "text-[10px] font-mono font-bold rounded px-2.5 py-1 border transition-all cursor-pointer outline-none",
                            statusCfg.bg,
                            statusCfg.text,
                            statusCfg.border
                          )}
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>

                      {/* Audit PDF */}
                      <td className="py-3.5 px-4 font-mono" onClick={(e) => e.stopPropagation()}>
                        {audit.audit_pdf ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={audit.audit_pdf.data || audit.audit_pdf.url || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={audit.audit_pdf.name || `${audit.business_name}-Audit.pdf`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                              title="Download Audit PDF"
                            >
                              <Download className="h-3 w-3 text-emerald-600" />
                              <span>PDF Attached</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-400 font-mono">No PDF yet</span>
                        )}
                      </td>

                      {/* Date Added */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-500">
                        {dateDisplay}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedAudit(audit)}
                            className="h-7 px-2 text-neutral-600 hover:text-black hover:bg-neutral-100 text-xs font-mono font-bold rounded cursor-pointer"
                          >
                            Details
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAudit(audit.id, audit.business_name)}
                            className="h-7 w-7 p-0 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Delete Audit"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── NEW AUDIT MODAL (FAST FOR ISMAIL) ────────────────────────────────── */}
      {newModalOpen && (
        <NewAuditModal
          companies={companies}
          onClose={() => setNewModalOpen(false)}
          onCreated={(newAudit) => {
            setAudits((prev) => [newAudit, ...prev]);
            setNewModalOpen(false);
            addToast("success", `Audit created for ${newAudit.business_name}!`);
          }}
        />
      )}

      {/* ── AUDIT DETAILS DRAWER & PDF ATTACHMENT ────────────────────────────── */}
      {selectedAudit && (
        <AuditDetailsModal
          audit={selectedAudit}
          onClose={() => setSelectedAudit(null)}
          onUpdate={(updatedAudit) => {
            setAudits((prev) => prev.map((a) => (a.id === updatedAudit.id ? updatedAudit : a)));
            setSelectedAudit(updatedAudit);
          }}
          onOpenLeadWorkspace={(companyId) => {
            setSelectedAudit(null);
            openLead(companyId);
          }}
          onDelete={(id) => {
            handleDeleteAudit(id, selectedAudit.business_name);
          }}
        />
      )}
    </div>
  );
}

// ─── NEW AUDIT MODAL COMPONENT ───────────────────────────────────────────────
function NewAuditModal({
  companies,
  onClose,
  onCreated,
}: {
  companies: any[];
  onClose: () => void;
  onCreated: (audit: AuditRecord) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [auditType, setAuditType] = useState<AuditType>("Business / Operations");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [status, setStatus] = useState<AuditStatus>("new");
  const [linkedCompanyId, setLinkedCompanyId] = useState<string>("");

  // PDF state
  const [pdfFile, setPdfFile] = useState<AuditPdf | null>(null);
  const [pdfLink, setPdfLink] = useState("");

  // Handle existing company selection to pre-fill
  const handleSelectExistingCompany = (companyId: string) => {
    setLinkedCompanyId(companyId);
    if (!companyId) return;
    const co = companies.find((c) => c.id === companyId);
    if (co) {
      if (!businessName) setBusinessName(co.company_name);
      if (!website && co.website) setWebsite(co.website);
      if (!socialUrl && co.linkedin_url) setSocialUrl(co.linkedin_url);
      const contact = co.contacts?.[0];
      if (contact) {
        if (!contactPerson && contact.full_name) setContactPerson(contact.full_name);
        if (!contactDetails) {
          const detail = contact.phone || contact.whatsapp || contact.email || co.phone || co.email || "";
          setContactDetails(detail);
        }
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("File size exceeds 25MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPdfFile({
        name: file.name,
        data: reader.result as string,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploaded_at: new Date().toISOString(),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      alert("Please enter a business name.");
      return;
    }

    setSubmitting(true);
    let finalPdf: AuditPdf | null = pdfFile;
    if (!finalPdf && pdfLink.trim()) {
      finalPdf = {
        name: `${businessName.trim()} Audit Link`,
        url: pdfLink.trim(),
        uploaded_at: new Date().toISOString(),
      };
    }

    const input: CreateAuditInput = {
      business_name: businessName.trim(),
      company_id: linkedCompanyId || null,
      website: website.trim(),
      social_url: socialUrl.trim(),
      contact_person: contactPerson.trim(),
      contact_details: contactDetails.trim(),
      problem_statement: problemStatement.trim(),
      audit_type: auditType,
      additional_notes: additionalNotes.trim(),
      status,
      audit_pdf: finalPdf,
      date_added: new Date().toISOString(),
    };

    const res = await createAudit(input);
    setSubmitting(false);

    if (res.error || !res.data) {
      alert(`Error creating audit: ${res.error || "Unknown error"}`);
    } else {
      onCreated(res.data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200">
          <div>
            <h2 className="text-base font-black text-black">New Business Audit</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Quick form to capture business details and what they need.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Link to Existing Company (Optional) */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Link to Existing Prospect (Optional)
            </label>
            <select
              value={linkedCompanyId}
              onChange={(e) => handleSelectExistingCompany(e.target.value)}
              className="w-full text-xs rounded-xl border border-neutral-200 p-2 bg-neutral-50 focus:bg-white transition-colors"
            >
              <option value="">-- Standalone Audit (or type new name below) --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} {c.industry ? `(${c.industry})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-1">
              Business Name *
            </label>
            <Input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Al Balushi Trading, Muscat Clinic..."
              className="text-xs rounded-xl"
            />
          </div>

          {/* Audit Type */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-1">
              Audit Type
            </label>
            <select
              value={auditType}
              onChange={(e) => setAuditType(e.target.value as AuditType)}
              className="w-full text-xs rounded-xl border border-neutral-200 p-2.5 bg-neutral-50 focus:bg-white transition-colors font-medium"
            >
              {AUDIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* What they need / Problem */}
          <div>
            <label className="block text-xs font-bold text-neutral-900 mb-1">
              What they need / Problem Statement
            </label>
            <Textarea
              rows={3}
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              placeholder="e.g. Inquiries dropped on WhatsApp, no ERP sync for inventory, looking to build automated customer booking..."
              className="text-xs rounded-xl resize-none"
            />
          </div>

          {/* Grid: Contact Person & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Contact Person
              </label>
              <Input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Mohammed Al Harthy"
                className="text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Contact Details
              </label>
              <Input
                value={contactDetails}
                onChange={(e) => setContactDetails(e.target.value)}
                placeholder="Phone, WhatsApp, or Email"
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Grid: Website & LinkedIn / Instagram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Website
              </label>
              <Input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="e.g. company.om"
                className="text-xs rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                LinkedIn / Instagram
              </label>
              <Input
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                placeholder="Profile link or @handle"
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Additional Notes
            </label>
            <Textarea
              rows={2}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Any specifics from the meeting, urgency, budget..."
              className="text-xs rounded-xl resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Initial Status
            </label>
            <div className="flex gap-2 font-mono text-xs">
              {(["new", "in_progress", "completed"] as AuditStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={cn(
                    "flex-1 py-1.5 rounded-lg border font-bold text-center cursor-pointer transition-all",
                    status === st
                      ? "bg-black text-white border-black"
                      : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                  )}
                >
                  {STATUS_CONFIG[st].label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Initial PDF Upload */}
          <div className="pt-2 border-t border-neutral-100">
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Attach Audit PDF (Optional)
            </label>
            <div className="space-y-2">
              <label className="flex items-center justify-center p-3 border-2 border-dashed border-neutral-200 hover:border-neutral-400 rounded-xl cursor-pointer bg-neutral-50/50 hover:bg-neutral-50 transition-colors">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <Upload className="h-4 w-4 text-neutral-500" />
                  <span>
                    {pdfFile ? (
                      <span className="font-bold text-emerald-700">{pdfFile.name}</span>
                    ) : (
                      "Upload PDF file"
                    )}
                  </span>
                </div>
              </label>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-400 font-mono text-[10px]">OR LINK:</span>
                <Input
                  value={pdfLink}
                  onChange={(e) => setPdfLink(e.target.value)}
                  placeholder="External Google Drive / Dropbox link"
                  className="h-8 text-xs rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs font-bold rounded-xl h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-black hover:bg-neutral-800 text-white font-bold text-xs rounded-xl h-9 px-5 shadow-xs"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Audit"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── AUDIT DETAILS MODAL & PDF MANAGER ───────────────────────────────────────
function AuditDetailsModal({
  audit,
  onClose,
  onUpdate,
  onOpenLeadWorkspace,
  onDelete,
}: {
  audit: AuditRecord;
  onClose: () => void;
  onUpdate: (audit: AuditRecord) => void;
  onOpenLeadWorkspace: (companyId: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit fields
  const [businessName, setBusinessName] = useState(audit.business_name);
  const [website, setWebsite] = useState(audit.website || "");
  const [socialUrl, setSocialUrl] = useState(audit.social_url || "");
  const [contactPerson, setContactPerson] = useState(audit.contact_person || "");
  const [contactDetails, setContactDetails] = useState(audit.contact_details || "");
  const [problemStatement, setProblemStatement] = useState(audit.problem_statement || "");
  const [auditType, setAuditType] = useState<AuditType>(audit.audit_type);
  const [additionalNotes, setAdditionalNotes] = useState(audit.additional_notes || "");
  const [status, setStatus] = useState<AuditStatus>(audit.status);

  // PDF Upload & Link state
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [externalLink, setExternalLink] = useState("");
  const [markCompleteOnUpload, setMarkCompleteOnUpload] = useState(true);

  useEffect(() => {
    setBusinessName(audit.business_name);
    setWebsite(audit.website || "");
    setSocialUrl(audit.social_url || "");
    setContactPerson(audit.contact_person || "");
    setContactDetails(audit.contact_details || "");
    setProblemStatement(audit.problem_statement || "");
    setAuditType(audit.audit_type);
    setAdditionalNotes(audit.additional_notes || "");
    setStatus(audit.status);
  }, [audit]);

  // Handle direct status toggle
  const handleQuickStatusChange = async (newStatus: AuditStatus) => {
    setStatus(newStatus);
    const updated = { ...audit, status: newStatus };
    onUpdate(updated);
    addToast("success", `Status updated to ${STATUS_CONFIG[newStatus].label}`);
    await updateAuditStatus(audit.id, newStatus);
  };

  // Handle PDF file upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("PDF size exceeds 25MB.");
      return;
    }

    setUploadingPdf(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const pdfData: AuditPdf = {
        name: file.name,
        data: reader.result as string,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploaded_at: new Date().toISOString(),
      };

      const nextStatus = markCompleteOnUpload ? "completed" : audit.status;
      await attachAuditPdf(audit.id, pdfData);
      if (markCompleteOnUpload && audit.status !== "completed") {
        await updateAuditStatus(audit.id, "completed");
      }

      const updated = {
        ...audit,
        audit_pdf: pdfData,
        status: nextStatus as AuditStatus,
      };
      onUpdate(updated);
      setUploadingPdf(false);
      addToast("success", "Audit PDF uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  // Handle External PDF Link attach
  const handleAttachLink = async () => {
    if (!externalLink.trim()) return;

    setUploadingPdf(true);
    const pdfData: AuditPdf = {
      name: `${audit.business_name} Audit Document`,
      url: externalLink.trim(),
      uploaded_at: new Date().toISOString(),
    };

    const nextStatus = markCompleteOnUpload ? "completed" : audit.status;
    await attachAuditPdf(audit.id, pdfData);
    if (markCompleteOnUpload && audit.status !== "completed") {
      await updateAuditStatus(audit.id, "completed");
    }

    const updated = {
      ...audit,
      audit_pdf: pdfData,
      status: nextStatus as AuditStatus,
    };
    onUpdate(updated);
    setExternalLink("");
    setUploadingPdf(false);
    addToast("success", "Audit link attached successfully!");
  };

  // Remove PDF
  const handleRemovePdf = async () => {
    if (!confirm("Remove the attached PDF from this audit?")) return;
    await attachAuditPdf(audit.id, null);
    const updated = { ...audit, audit_pdf: null };
    onUpdate(updated);
    addToast("info", "PDF removed");
  };

  // Save edits
  const handleSaveEdits = async () => {
    setSaving(true);
    const res = await updateAudit(audit.id, {
      business_name: businessName,
      website,
      social_url: socialUrl,
      contact_person: contactPerson,
      contact_details: contactDetails,
      problem_statement: problemStatement,
      audit_type: auditType,
      additional_notes: additionalNotes,
      status,
    });
    setSaving(false);

    if (res.success) {
      onUpdate({
        ...audit,
        business_name: businessName,
        website,
        social_url: socialUrl,
        contact_person: contactPerson,
        contact_details: contactDetails,
        problem_statement: problemStatement,
        audit_type: auditType,
        additional_notes: additionalNotes,
        status,
      });
      setEditing(false);
      addToast("success", "Audit details updated");
    } else {
      alert(`Error saving: ${res.error}`);
    }
  };

  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-neutral-100 border border-neutral-200 text-black font-black text-sm flex items-center justify-center font-mono">
              {audit.business_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-black">{audit.business_name}</h2>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {audit.audit_type}
                </Badge>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Added on{" "}
                {new Date(audit.date_added || audit.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
                className="h-8 text-xs font-bold rounded-lg cursor-pointer"
              >
                <Edit2 className="h-3 w-3 mr-1" /> Edit
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status Switcher Strip */}
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                AUDIT LIFECYCLE
              </span>
              <p className="text-xs font-bold text-neutral-800">
                Current Status: <span className={statusCfg.text}>{statusCfg.label}</span>
              </p>
            </div>

            <div className="flex items-center gap-1 font-mono text-xs">
              {(["new", "in_progress", "completed"] as AuditStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleQuickStatusChange(st)}
                  className={cn(
                    "px-3 py-1 rounded-lg border font-bold transition-all cursor-pointer",
                    status === st
                      ? "bg-black text-white border-black shadow-xs"
                      : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                  )}
                >
                  {STATUS_CONFIG[st].label}
                </button>
              ))}
            </div>
          </div>

          {/* ── CORE AUDIT PDF SECTION ───────────────────────────────────────── */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-black" />
                <h3 className="text-xs font-black uppercase tracking-wider text-black font-mono">
                  Audit PDF / Deliverable
                </h3>
              </div>
              {audit.audit_pdf && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Ready to Share
                </span>
              )}
            </div>

            {audit.audit_pdf ? (
              /* Attached PDF View */
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900 truncate max-w-xs sm:max-w-md">
                      {audit.audit_pdf.name || "Audit Deliverable.pdf"}
                    </h4>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      {audit.audit_pdf.size ? `${audit.audit_pdf.size} • ` : ""}
                      Attached on{" "}
                      {audit.audit_pdf.uploaded_at
                        ? new Date(audit.audit_pdf.uploaded_at).toLocaleDateString("en-GB")
                        : "Recently"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={audit.audit_pdf.data || audit.audit_pdf.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={audit.audit_pdf.name || `${audit.business_name}-Audit.pdf`}
                    className="px-3 py-1.5 rounded-lg bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Open / Download
                  </a>
                  <button
                    onClick={handleRemovePdf}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove PDF"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* PDF Upload Area */
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-neutral-300 hover:border-black rounded-xl cursor-pointer bg-neutral-50/60 hover:bg-neutral-50 transition-colors text-center">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfUpload}
                    disabled={uploadingPdf}
                    className="hidden"
                  />
                  <Upload className="h-6 w-6 text-neutral-400 mb-1" />
                  <span className="text-xs font-bold text-neutral-800">
                    {uploadingPdf ? "Attaching PDF..." : "Upload Audit PDF"}
                  </span>
                  <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    Click to browse or drop PDF here (Max 25MB)
                  </span>
                </label>

                {/* Or External Link */}
                <div className="flex items-center gap-2">
                  <Input
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="Or paste Google Drive / Dropbox link..."
                    className="h-8 text-xs rounded-xl"
                  />
                  <Button
                    size="sm"
                    onClick={handleAttachLink}
                    disabled={!externalLink.trim() || uploadingPdf}
                    className="h-8 text-xs font-bold rounded-xl px-3 shrink-0"
                  >
                    Attach Link
                  </Button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="markComplete"
                    checked={markCompleteOnUpload}
                    onChange={(e) => setMarkCompleteOnUpload(e.target.checked)}
                    className="rounded border-neutral-300 text-black focus:ring-black h-3.5 w-3.5"
                  />
                  <label htmlFor="markComplete" className="text-[11px] text-neutral-600 font-medium">
                    Automatically mark audit as <span className="font-bold text-emerald-700">Completed</span> when PDF is attached
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ── AUDIT DETAILS / EDIT FORM ────────────────────────────────────── */}
          {editing ? (
            <div className="space-y-4 pt-2 border-t border-neutral-100">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Business Name</label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="text-xs" />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Audit Type</label>
                <select
                  value={auditType}
                  onChange={(e) => setAuditType(e.target.value as AuditType)}
                  className="w-full text-xs rounded-xl border border-neutral-200 p-2 bg-white"
                >
                  {AUDIT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  What they need / Problem
                </label>
                <Textarea
                  rows={3}
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Contact Person</label>
                  <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className="text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Contact Details</label>
                  <Input value={contactDetails} onChange={(e) => setContactDetails(e.target.value)} className="text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Website</label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">LinkedIn / Instagram</label>
                  <Input value={socialUrl} onChange={(e) => setSocialUrl(e.target.value)} className="text-xs" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Additional Notes</label>
                <Textarea
                  rows={2}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="text-xs">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSaveEdits} disabled={saving} className="bg-black text-white text-xs">
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            /* Read-Only View of Details */
            <div className="space-y-4">
              {/* Problem / What they need */}
              <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                  WHAT THEY NEED / PROBLEM
                </span>
                <p className="text-xs text-neutral-900 whitespace-pre-wrap leading-relaxed">
                  {audit.problem_statement || "No specific problem noted."}
                </p>
              </div>

              {/* Contact & Links Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-neutral-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                    CONTACT PERSON & DETAILS
                  </span>
                  <p className="text-xs font-bold text-neutral-800">
                    {audit.contact_person || "Not provided"}
                  </p>
                  <p className="text-xs text-neutral-500 font-mono">
                    {audit.contact_details || "No contact info"}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-neutral-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                    ONLINE PRESENCE
                  </span>
                  <div className="flex flex-col gap-1 text-xs font-mono">
                    {audit.website ? (
                      <a
                        href={audit.website.startsWith("http") ? audit.website : `https://${audit.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neutral-700 hover:text-black flex items-center gap-1 truncate hover:underline"
                      >
                        <Globe className="h-3 w-3" /> {audit.website}
                      </a>
                    ) : (
                      <span className="text-neutral-400">No website</span>
                    )}

                    {audit.social_url && (
                      <a
                        href={audit.social_url.startsWith("http") ? audit.social_url : `https://${audit.social_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 truncate hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> {audit.social_url}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              {audit.additional_notes && (
                <div className="p-3 rounded-xl border border-neutral-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                    ADDITIONAL NOTES
                  </span>
                  <p className="text-xs text-neutral-700 whitespace-pre-wrap leading-relaxed">
                    {audit.additional_notes}
                  </p>
                </div>
              )}

              {/* CRM Prospect Link */}
              {audit.company_id && (
                <div className="p-3 rounded-xl bg-neutral-900 text-white flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                      LINKED CRM RECORD
                    </span>
                    <p className="text-xs font-bold text-white">
                      Linked to prospect: {audit.companies?.company_name || audit.business_name}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onOpenLeadWorkspace(audit.company_id!)}
                    className="bg-white text-black hover:bg-neutral-200 text-xs font-bold rounded-lg h-7 px-3 cursor-pointer shrink-0"
                  >
                    Open Lead Workspace <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-200 bg-neutral-50 text-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(audit.id)}
            className="text-neutral-400 hover:text-red-600 hover:bg-red-50 text-xs cursor-pointer font-bold"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Audit
          </Button>

          <Button
            size="sm"
            onClick={onClose}
            className="bg-black text-white hover:bg-neutral-800 text-xs font-bold rounded-xl px-4"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
