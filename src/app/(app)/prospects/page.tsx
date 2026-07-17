"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Building2,
  Phone,
  Mail,
  ExternalLink,
  Upload,
  Loader2,
  AlertTriangle,
  Trash2,
  Pencil,
  X,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CsvImport } from "@/components/ui/csv-import";
import { COMPANY_STATUSES, type CompanyStatus } from "@/lib/constants";
import { getCompanies, updateCompanyStatus } from "@/lib/actions/companies";
import { deleteCompany } from "@/lib/actions/delete";
import { bulkImportCompanies } from "@/lib/actions/import";

const statusColor: Record<CompanyStatus, string> = {
  prospect: "bg-slate-100 text-slate-700",
  contacted: "bg-blue-100 text-blue-700",
  in_call_queue: "bg-amber-100 text-amber-700",
  meeting_booked: "bg-purple-100 text-purple-700",
  opportunity: "bg-teal-100 text-teal-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
};

const csvFields = [
  { key: "company_name", label: "Company Name", required: true },
  { key: "industry", label: "Industry" },
  { key: "website", label: "Website" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "country", label: "Country" },
  { key: "city", label: "City" },
  { key: "employee_count", label: "Employee Count" },
  { key: "linkedin_url", label: "LinkedIn URL" },
  { key: "notes", label: "Notes" },
];

export default function ProspectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchProspects = async (searchVal?: string, statusVal?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCompanies({
        search: searchVal || undefined,
        status: statusVal || undefined,
      });
      if (result.error) {
        setError(result.error);
        setProspects([]);
      } else {
        setProspects(result.data || []);
      }
    } catch (err) {
      setError("Failed to load prospects");
      setProspects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProspects();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProspects(search, statusFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleImport = async (data: Record<string, string>[]) => {
    setImporting(true);
    try {
      const result = await bulkImportCompanies(data);
      if (result.failed > 0) {
        setToast({ type: "error", message: `Imported ${result.imported}, failed ${result.failed}` });
      } else {
        setToast({ type: "success", message: `Successfully imported ${result.imported} companies` });
      }
      fetchProspects(search, statusFilter);
    } catch (err) {
      setToast({ type: "error", message: "Import failed" });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    const result = await deleteCompany(id);
    if (result.error) {
      setToast({ type: "error", message: result.error });
    } else {
      setToast({ type: "success", message: `"${name}" deleted` });
      fetchProspects(search, statusFilter);
    }
  };

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const statusCounts = Object.entries(COMPANY_STATUSES).map(([key, val]) => ({
    key: key as CompanyStatus,
    label: val.label,
    count: prospects.filter((p) => p.status === key).length,
  }));

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
        }`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Prospects</h1>
          <p className="text-slate-500 mt-1">Manage your prospect pipeline and track outreach progress.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setCsvOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Link href="/prospects/new">
            <Button className="bg-brand-teal hover:bg-brand-teal-dark text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Prospect
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter("")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            statusFilter === "" ? "ring-2 ring-brand-teal bg-brand-teal-light text-brand-teal" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All <span className="ml-0.5 text-[10px] opacity-70">{prospects.length}</span>
        </button>
        {statusCounts.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(statusFilter === s.key ? "" : s.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s.key ? "ring-2 ring-brand-teal " + statusColor[s.key] : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s.label} <span className="ml-0.5 text-[10px] opacity-70">{s.count}</span>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <div className="flex-1">
            <CardTitle>All Prospects</CardTitle>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-brand-teal mx-auto mb-3 animate-spin" />
              <p className="text-slate-500 text-sm">Loading prospects...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
              <p className="text-red-600 text-sm">{error}</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => fetchProspects(search, statusFilter)}>Retry</Button>
            </div>
          ) : prospects.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                {search || statusFilter ? "No prospects match your filters." : "No prospects yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-light">
              {prospects.map((prospect) => {
                const contact = prospect.contacts?.[0];
                const isExpanded = expandedId === prospect.id;
                return (
                  <div key={prospect.id}>
                    {/* Main row */}
                    <div
                      className="flex items-center gap-4 py-3 px-4 hover:bg-cream-dark/30 cursor-pointer transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : prospect.id)}
                    >
                      {/* Expand arrow */}
                      <button className="flex-shrink-0 text-text-muted">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>

                      {/* Person icon */}
                      <div className="h-9 w-9 rounded-lg bg-brand-teal-light flex items-center justify-center flex-shrink-0">
                        <Building2 className="h-4 w-4 text-brand-teal" />
                      </div>

                      {/* Person + Company */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">{contact?.full_name || prospect.company_name}</span>
                          {contact?.title && <span className="text-xs text-text-muted">· {contact.title}</span>}
                        </div>
                        <p className="text-xs text-text-secondary">{prospect.company_name}{prospect.industry ? ` · ${prospect.industry}` : ""}</p>
                      </div>

                      {/* Location */}
                      <div className="hidden sm:block text-xs text-text-muted">
                        {[prospect.city, prospect.country].filter(Boolean).join(", ")}
                      </div>

                      {/* Status */}
                      <Badge className={cn("text-[10px] flex-shrink-0", statusColor[prospect.status as CompanyStatus] || statusColor.prospect)}>
                        {COMPANY_STATUSES[prospect.status as CompanyStatus]?.label || prospect.status}
                      </Badge>

                      {/* Actions */}
                      <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/prospects/${prospect.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted hover:text-brand-teal"><Pencil className="h-3 w-3" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted hover:text-red-600" onClick={() => handleDelete(prospect.id, prospect.company_name)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>

                    {/* Expanded contact card */}
                    {isExpanded && (
                      <div className="bg-cream-dark/40 border-t border-border-light px-4 py-3 ml-9">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          {contact?.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-border-light hover:border-brand-teal transition-colors group">
                              <div className="h-8 w-8 rounded-md bg-brand-teal-light flex items-center justify-center flex-shrink-0"><Mail className="h-3.5 w-3.5 text-brand-teal" /></div>
                              <div className="min-w-0"><p className="text-[11px] text-text-muted">Email</p><p className="text-xs font-medium text-text-primary truncate group-hover:text-brand-teal">{contact.email}</p></div>
                            </a>
                          )}
                          {contact?.phone && (
                            <a href={`tel:${contact.phone}`} className="flex items-center gap-2 p-2 rounded-lg bg-white border border-border-light hover:border-brand-teal transition-colors group">
                              <div className="h-8 w-8 rounded-md bg-brand-teal-light flex items-center justify-center flex-shrink-0"><Phone className="h-3.5 w-3.5 text-brand-teal" /></div>
                              <div className="min-w-0"><p className="text-[11px] text-text-muted">Phone</p><p className="text-xs font-medium text-text-primary truncate group-hover:text-brand-teal">{contact.phone}</p></div>
                            </a>
                          )}
                          {contact?.whatsapp && (
                            <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-white border border-border-light hover:border-green-400 transition-colors group">
                              <div className="h-8 w-8 rounded-md bg-green-50 flex items-center justify-center flex-shrink-0"><MessageCircle className="h-3.5 w-3.5 text-green-600" /></div>
                              <div className="min-w-0"><p className="text-[11px] text-text-muted">WhatsApp</p><p className="text-xs font-medium text-text-primary truncate group-hover:text-green-600">{contact.whatsapp}</p></div>
                            </a>
                          )}
                          {contact?.linkedin_url && (
                            <a href={contact.linkedin_url.startsWith("http") ? contact.linkedin_url : `https://${contact.linkedin_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-white border border-border-light hover:border-blue-400 transition-colors group">
                              <div className="h-8 w-8 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0"><ExternalLink className="h-3.5 w-3.5 text-blue-600" /></div>
                              <div className="min-w-0"><p className="text-[11px] text-text-muted">LinkedIn</p><p className="text-xs font-medium text-text-primary truncate group-hover:text-blue-600">Profile</p></div>
                            </a>
                          )}
                          {prospect.website && (
                            <a href={prospect.website.startsWith("http") ? prospect.website : `https://${prospect.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-white border border-border-light hover:border-brand-teal transition-colors group">
                              <div className="h-8 w-8 rounded-md bg-brand-teal-light flex items-center justify-center flex-shrink-0"><ExternalLink className="h-3.5 w-3.5 text-brand-teal" /></div>
                              <div className="min-w-0"><p className="text-[11px] text-text-muted">Website</p><p className="text-xs font-medium text-text-primary truncate group-hover:text-brand-teal">{prospect.website}</p></div>
                            </a>
                          )}
                        </div>
                        {prospect.notes && (
                          <p className="mt-2 text-xs text-text-muted italic">{prospect.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CsvImport
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        onImport={handleImport}
        fields={csvFields}
        title="Import Prospects from CSV"
      />
    </div>
  );
}
