"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search, Plus, Building2, Phone, Mail, ExternalLink, Upload, Loader2,
  AlertTriangle, Trash2, Pencil, X, CheckCircle, ChevronDown, ChevronRight,
  MessageCircle, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CsvImport } from "@/components/ui/csv-import";
import { ToastContainer, addToast } from "@/components/ui/toast";
import { COMPANY_STATUSES, type CompanyStatus } from "@/lib/constants";
import { getCompanies, updateCompanyStatus } from "@/lib/actions/companies";
import { deleteCompany } from "@/lib/actions/delete";
import { bulkImportCompanies } from "@/lib/actions/import";
import { exportToCsv } from "@/lib/export-csv";

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

export default function ProspectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [prospects, setProspects] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchProspects = useCallback(async (searchVal?: string, statusVal?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCompanies({ search: searchVal || undefined, status: statusVal || undefined });
      if (result.error) { setError(result.error); setProspects([]); }
      else { setProspects(result.data || []); setSelectedIds([]); }
    } catch { setError("Failed to load prospects"); setProspects([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProspects(); }, [fetchProspects]);
  useEffect(() => { const t = setTimeout(() => fetchProspects(search, statusFilter), 300); return () => clearTimeout(t); }, [search, statusFilter, fetchProspects]);

  const statusCounts = Object.entries(COMPANY_STATUSES).map(([key, val]) => ({
    key: key as CompanyStatus, label: val.label, count: prospects.filter((p) => p.status === key).length,
  }));

  const handleImport = async (data: Record<string, string>[]) => {
    const result = await bulkImportCompanies(data);
    addToast("success", `Imported ${result.imported} companies`);
    fetchProspects(search, statusFilter);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const result = await deleteCompany(id);
    if (result.error) addToast("error", result.error);
    else { addToast("success", `"${name}" deleted`); fetchProspects(search, statusFilter); }
  };

  const handleExport = () => {
    const dataToExport = selectedIds.length > 0
      ? prospects.filter((p) => selectedIds.includes(p.id))
      : prospects;

    if (dataToExport.length === 0) {
      addToast("error", "No prospects to export");
      return;
    }

    const exportData = dataToExport.map((p) => ({
      person_name: p.contacts?.[0]?.full_name || "",
      person_title: p.contacts?.[0]?.title || "",
      company_name: p.company_name,
      industry: p.industry || "",
      email: p.contacts?.[0]?.email || p.email || "",
      phone: p.contacts?.[0]?.phone || p.phone || "",
      whatsapp: p.contacts?.[0]?.whatsapp || "",
      linkedin: p.contacts?.[0]?.linkedin_url || "",
      website: p.website || "",
      city: p.city || "",
      country: p.country || "",
      status: p.status,
      notes: p.notes || "",
    }));
    exportToCsv(exportData, `prospects-${new Date().toISOString().split("T")[0]}.csv`, [
      { key: "person_name", label: "Person Name" },
      { key: "person_title", label: "Title" },
      { key: "company_name", label: "Company" },
      { key: "industry", label: "Industry" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "linkedin", label: "LinkedIn" },
      { key: "website", label: "Website" },
      { key: "city", label: "City" },
      { key: "country", label: "Country" },
      { key: "status", label: "Status" },
      { key: "notes", label: "Notes" },
    ]);
    addToast("success", `Exported ${dataToExport.length} prospects`);
  };

  return (
    <div className="space-y-5 page-enter">
      <ToastContainer />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Prospects</h1>
          <p className="text-text-secondary text-sm mt-0.5">Manage your prospect pipeline and track outreach progress.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="hover-lift press-effect">
            <Download className="h-3.5 w-3.5 mr-1" />Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)} className="hover-lift press-effect">
            <Upload className="h-3.5 w-3.5 mr-1" />Import CSV
          </Button>
          <Link href="/prospects/new">
            <Button className="bg-brand-teal hover:bg-brand-teal-dark text-white hover-lift press-effect">
              <Plus className="h-4 w-4 mr-2" />Add Prospect
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 stagger-children">
        <button
          onClick={() => setStatusFilter("")}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 press-effect ${
            statusFilter === "" ? "ring-2 ring-brand-teal bg-brand-teal text-white shadow-sm" : "bg-white border border-border text-text-secondary hover:bg-cream-dark hover:border-brand-teal/30"
          }`}
        >
          All <span className="ml-0.5 text-[10px] opacity-70">{prospects.length}</span>
        </button>
        {statusCounts.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(statusFilter === s.key ? "" : s.key)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 press-effect ${
              statusFilter === s.key ? "ring-2 ring-brand-teal shadow-sm " + statusColor[s.key] : "bg-white border border-border text-text-secondary hover:bg-cream-dark hover:border-brand-teal/30"
            }`}
          >
            {s.label} <span className="ml-0.5 text-[10px] opacity-70">{s.count}</span>
          </button>
        ))}
      </div>

      <Card className="animate-fade-in-up">
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <div className="flex-1 flex items-center gap-4">
            <CardTitle>All Prospects</CardTitle>
            {prospects.length > 0 && (
              <div className="flex items-center gap-2 border-l border-border pl-4">
                <input
                  type="checkbox"
                  checked={prospects.length > 0 && selectedIds.length === prospects.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(prospects.map(p => p.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-brand-teal focus:ring-brand-teal cursor-pointer"
                />
                <span className="text-xs text-text-secondary select-none font-medium">Select All ({selectedIds.length} selected)</span>
              </div>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input placeholder="Search company or person..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 px-4">
                  <div className="skeleton h-4 w-4 rounded" />
                  <div className="skeleton h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-2"><div className="skeleton h-4 w-48" /><div className="skeleton h-3 w-32" /></div>
                  <div className="skeleton h-5 w-20 rounded-full" />
                  <div className="skeleton h-4 w-24" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 animate-fade-in">
              <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3 animate-pulse-soft" />
              <p className="text-red-600 text-sm">{error}</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => fetchProspects(search, statusFilter)}>Retry</Button>
            </div>
          ) : prospects.length === 0 ? (
            <div className="text-center py-16 animate-fade-in-up">
              <Building2 className="h-12 w-12 text-text-muted mx-auto mb-4 opacity-40" />
              <p className="text-text-secondary text-sm mb-4">
                {search || statusFilter ? "No prospects match your filters." : "No prospects yet."}
              </p>
              {!search && !statusFilter && (
                <Link href="/prospects/new">
                  <Button className="bg-brand-teal hover:bg-brand-teal-dark text-white hover-lift press-effect" size="sm">
                    <Plus className="h-4 w-4 mr-1.5" />Add First Prospect
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border-light stagger-children">
              {prospects.map((prospect) => {
                const contact = prospect.contacts?.[0];
                const isExpanded = expandedId === prospect.id;
                return (
                  <div key={prospect.id} className="animate-fade-in">
                    <div
                      className="flex items-center gap-4 py-3 px-4 hover:bg-cream-dark/30 cursor-pointer transition-all duration-200"
                      onClick={() => setExpandedId(isExpanded ? null : prospect.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(prospect.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, prospect.id]);
                          } else {
                            setSelectedIds(selectedIds.filter(id => id !== prospect.id));
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-brand-teal focus:ring-brand-teal cursor-pointer"
                      />
                      <button className="flex-shrink-0 text-text-muted transition-transform duration-200" style={{ transform: isExpanded ? "rotate(0)" : "rotate(0)" }}>
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </button>
                      <div className="h-9 w-9 rounded-lg bg-brand-teal-light flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110">
                        <Building2 className="h-4 w-4 text-brand-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-text-primary">{contact?.full_name || prospect.company_name}</span>
                          {contact?.title && <span className="text-xs text-text-muted">· {contact.title}</span>}
                        </div>
                        <p className="text-xs text-text-secondary">{prospect.company_name}{prospect.industry ? ` · ${prospect.industry}` : ""}</p>
                      </div>
                      <div className="hidden sm:block text-xs text-text-muted">{[prospect.city, prospect.country].filter(Boolean).join(", ")}</div>
                      <Badge className={cn("text-[10px] flex-shrink-0 transition-all duration-200", statusColor[prospect.status as CompanyStatus] || statusColor.prospect)}>
                        {COMPANY_STATUSES[prospect.status as CompanyStatus]?.label || prospect.status}
                      </Badge>
                      <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/prospects/${prospect.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted hover:text-brand-teal transition-colors duration-150"><Pencil className="h-3 w-3" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-text-muted hover:text-red-600 transition-colors duration-150" onClick={() => handleDelete(prospect.id, prospect.company_name)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="bg-cream-dark/40 border-t border-border-light px-4 py-3 ml-14 animate-expand-down">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 stagger-children">
                          {contact?.email && (
                            <a href={`mailto:${contact.email}`} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-border-light hover:border-brand-teal hover:shadow-sm transition-all duration-200 group">
                              <div className="h-8 w-8 rounded-lg bg-brand-teal-light flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"><Mail className="h-3.5 w-3.5 text-brand-teal" /></div>
                              <div className="min-w-0"><p className="text-[10px] text-text-muted uppercase tracking-wider">Email</p><p className="text-xs font-medium text-text-primary truncate group-hover:text-brand-teal">{contact.email}</p></div>
                            </a>
                          )}
                          {contact?.phone && (
                            <a href={`tel:${contact.phone}`} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-border-light hover:border-brand-teal hover:shadow-sm transition-all duration-200 group">
                              <div className="h-8 w-8 rounded-lg bg-brand-teal-light flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"><Phone className="h-3.5 w-3.5 text-brand-teal" /></div>
                              <div className="min-w-0"><p className="text-[10px] text-text-muted uppercase tracking-wider">Phone</p><p className="text-xs font-medium text-text-primary truncate group-hover:text-brand-teal">{contact.phone}</p></div>
                            </a>
                          )}
                          {contact?.whatsapp && (
                            <a href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-border-light hover:border-green-400 hover:shadow-sm transition-all duration-200 group">
                              <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"><MessageCircle className="h-3.5 w-3.5 text-green-600" /></div>
                              <div className="min-w-0"><p className="text-[10px] text-text-muted uppercase tracking-wider">WhatsApp</p><p className="text-xs font-medium text-text-primary truncate group-hover:text-green-600">{contact.whatsapp}</p></div>
                            </a>
                          )}
                          {contact?.linkedin_url && (
                            <a href={contact.linkedin_url.startsWith("http") ? contact.linkedin_url : `https://${contact.linkedin_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-border-light hover:border-blue-400 hover:shadow-sm transition-all duration-200 group">
                              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"><ExternalLink className="h-3.5 w-3.5 text-blue-600" /></div>
                              <div className="min-w-0"><p className="text-[10px] text-text-muted uppercase tracking-wider">LinkedIn</p><p className="text-xs font-medium text-text-primary truncate group-hover:text-blue-600">Profile</p></div>
                            </a>
                          )}
                          {prospect.website && (
                            <a href={prospect.website.startsWith("http") ? prospect.website : `https://${prospect.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-border-light hover:border-brand-teal hover:shadow-sm transition-all duration-200 group">
                              <div className="h-8 w-8 rounded-lg bg-brand-teal-light flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"><ExternalLink className="h-3.5 w-3.5 text-brand-teal" /></div>
                              <div className="min-w-0"><p className="text-[10px] text-text-muted uppercase tracking-wider">Website</p><p className="text-xs font-medium text-text-primary truncate group-hover:text-brand-teal">{prospect.website}</p></div>
                            </a>
                          )}
                        </div>
                        {prospect.notes && <p className="mt-2.5 text-xs text-text-muted italic pl-1">{prospect.notes}</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CsvImport open={csvOpen} onClose={() => setCsvOpen(false)} onImport={handleImport} fields={csvFields} title="Import Prospects from CSV" />
    </div>
  );
}
