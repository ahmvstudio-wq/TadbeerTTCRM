"use client";

import { useState } from "react";
import {
  Upload,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  Loader2,
  X,
  Table,
  FileText,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addToast } from "@/components/ui/toast";
import { CRMCache } from "@/lib/cache/crm-cache";
import {
  importCSVOutreach,
  type MappedCSVRow
} from "@/lib/actions/ig-dm";
import {
  CHANNEL_CONFIG,
  STATUS_CONFIG,
  type OutreachChannel,
  type OutreachStatus,
  type OutreachTemplate
} from "@/lib/types/outreach";

interface CsvOutreachImportModalProps {
  isOpen: boolean;
  initialDate?: string;
  initialChannel?: OutreachChannel;
  onClose: () => void;
  onSuccess?: (info: { count: number; date: string }) => void;
}

const CHANNELS: OutreachChannel[] = [
  "linkedin",
  "instagram_dm",
  "whatsapp",
  "cold_call",
  "email",
  "referral",
  "event",
  "walk_in"
];

const STATUSES: OutreachStatus[] = [
  "sent",
  "gate_opener_sent",
  "gate_opener_staged",
  "warm_up",
  "reply_received",
  "replied_interested",
  "replied_objection",
  "opening_identified",
  "follow_up_sent",
  "audit_requested",
  "audit_sent",
  "ready_for_call",
  "called",
  "coffee_invited",
  "meeting_booked"
];

const MAPPING_FIELDS: { key: keyof MappedCSVRow; label: string; desc: string; table: string }[] = [
  { key: "company_name", label: "Business / Company Name", desc: "Target account name (deduplicated)", table: "companies" },
  { key: "contact_name", label: "Contact Person / DM", desc: "Decision maker full name", table: "contacts" },
  { key: "handle", label: "Handle / Profile URL / Phone", desc: "@handle, LinkedIn profile, or mobile", table: "activities" },
  { key: "phone", label: "Phone / WhatsApp", desc: "Direct phone digits", table: "contacts" },
  { key: "industry", label: "Industry / Sector", desc: "Retail, Clinic, Real Estate, FMCG, etc.", table: "companies" },
  { key: "website", label: "Website URL", desc: "Corporate website domain", table: "companies" },
  { key: "email", label: "Email Address", desc: "Contact email", table: "contacts" },
  { key: "linkedin_url", label: "LinkedIn Profile URL", desc: "LinkedIn profile or company link", table: "contacts" },
  { key: "channel", label: "Channel Override", desc: "Platform used for this touch", table: "activities" },
  { key: "status", label: "Outreach Status", desc: "Initial stage/status", table: "activities" },
  { key: "notes", label: "Notes / Message Sent", desc: "Copy of message or notes", table: "activities" },
  { key: "outreach_date", label: "Outreach Date Column", desc: "Optional per-row date override", table: "activities" }
];

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const parsedRows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n' && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
      if (currentRow.some(c => c.length > 0)) {
        parsedRows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      parsedRows.push(currentRow);
    }
  }

  if (parsedRows.length === 0) return { headers: [], rows: [] };
  const headers = parsedRows[0];
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < parsedRows.length; i++) {
    const vals = parsedRows[i];
    if (!vals.some(v => v.length > 0)) continue;
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = vals[idx] || '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

function autoMatchHeaders(headers: string[]): Record<keyof MappedCSVRow, string> {
  const mapping: Record<keyof MappedCSVRow, string> = {
    company_name: '',
    industry: '',
    phone: '',
    website: '',
    email: '',
    linkedin_url: '',
    contact_name: '',
    contact_title: '',
    contact_whatsapp: '',
    handle: '',
    channel: '',
    status: '',
    notes: '',
    prospect_reply: '',
    pain_point: '',
    call_opening_line: '',
    outreach_date: '',
  };

  headers.forEach(h => {
    const clean = h.toLowerCase().trim();
    if (!mapping.company_name && /company|business|name|client|prospect|lead|account/i.test(clean) && !/contact|person|full_name/i.test(clean)) {
      mapping.company_name = h;
    } else if (!mapping.contact_name && /contact|person|full_name|representative|owner|founder/i.test(clean)) {
      mapping.contact_name = h;
    } else if (!mapping.industry && /industry|sector|category|niche|type/i.test(clean)) {
      mapping.industry = h;
    } else if (!mapping.website && /website|domain|site/i.test(clean) && !/linkedin|instagram/i.test(clean)) {
      mapping.website = h;
    } else if (!mapping.email && /email|mail/i.test(clean)) {
      mapping.email = h;
    } else if (!mapping.linkedin_url && /linkedin/i.test(clean)) {
      mapping.linkedin_url = h;
    } else if (!mapping.handle && /handle|username|profile|instagram|ig|social/i.test(clean)) {
      mapping.handle = h;
    } else if (!mapping.phone && /phone|mobile|tel|number|whatsapp/i.test(clean)) {
      mapping.phone = h;
    } else if (!mapping.notes && /notes|message|comment|remark|text|details|copy/i.test(clean)) {
      mapping.notes = h;
    } else if (!mapping.status && /status|stage|state/i.test(clean)) {
      mapping.status = h;
    } else if (!mapping.outreach_date && /date|sent_at|time/i.test(clean)) {
      mapping.outreach_date = h;
    }
  });

  return mapping;
}

export function CsvOutreachImportModal({
  isOpen,
  initialDate,
  initialChannel = "linkedin",
  onClose,
  onSuccess
}: CsvOutreachImportModalProps) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [targetDate, setTargetDate] = useState(() => initialDate || todayStr);
  const [defaultChannel, setDefaultChannel] = useState<OutreachChannel>(initialChannel);
  const [template, setTemplate] = useState<OutreachTemplate>("growth_offer");

  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<keyof MappedCSVRow, string>>({
    company_name: '', industry: '', phone: '', website: '', email: '', linkedin_url: '',
    contact_name: '', contact_title: '', contact_whatsapp: '',
    handle: '', channel: '', status: '', notes: '', prospect_reply: '', pain_point: '', call_opening_line: '', outreach_date: ''
  });
  const [customValues, setCustomValues] = useState<Record<keyof MappedCSVRow, string>>({
    company_name: '', industry: '', phone: '', website: '', email: '', linkedin_url: '',
    contact_name: '', contact_title: '', contact_whatsapp: '',
    handle: '', channel: initialChannel, status: 'sent', notes: '', prospect_reply: '', pain_point: '', call_opening_line: '', outreach_date: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const { headers, rows } = parseCSV(text);
        if (rows.length === 0) {
          setError("No data rows found in the uploaded CSV file.");
          return;
        }
        setCsvHeaders(headers);
        setCsvRows(rows);
        setColumnMap(autoMatchHeaders(headers));

        const isLi = file.name.toLowerCase().includes('linkedin') || headers.some(h => /linkedin/i.test(h));
        if (isLi) {
          setDefaultChannel('linkedin');
          setCustomValues(prev => ({ ...prev, channel: 'linkedin' }));
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (csvRows.length === 0) {
      setError("Please upload a CSV file with at least one row.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const getValForField = (key: keyof MappedCSVRow, r: Record<string, string>): string | undefined => {
        const mapVal = columnMap[key];
        if (mapVal === "__custom__") return customValues[key] || undefined;
        if (mapVal && r[mapVal]) return r[mapVal];
        return undefined;
      };

      const mappedRows: MappedCSVRow[] = csvRows.map(r => {
        const row: MappedCSVRow = {};
        const co = getValForField('company_name', r); if (co) row.company_name = co;
        const ind = getValForField('industry', r); if (ind) row.industry = ind;
        const ph = getValForField('phone', r); if (ph) row.phone = ph;
        const web = getValForField('website', r); if (web) row.website = web;
        const em = getValForField('email', r); if (em) row.email = em;
        const li = getValForField('linkedin_url', r); if (li) row.linkedin_url = li;

        const cnVal = getValForField('contact_name', r); if (cnVal) row.contact_name = cnVal;
        const h = getValForField('handle', r); if (h) row.handle = h;
        const ch = getValForField('channel', r); if (ch) row.channel = ch as OutreachChannel;
        const st = getValForField('status', r); if (st) row.status = st as OutreachStatus;
        const n = getValForField('notes', r); if (n) row.notes = n;
        const od = getValForField('outreach_date', r); if (od) row.outreach_date = od;

        return row;
      });

      const result = await importCSVOutreach({
        rows: mappedRows,
        defaultChannel,
        defaultDate: targetDate,
        defaultTemplate: template,
      });

      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }

      // Universal Cache Invalidation
      CRMCache.invalidate();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("outreach-imported", {
          detail: { date: targetDate, count: result.count }
        }));
        window.dispatchEvent(new CustomEvent("lead-updated", {
          detail: { invalidateAll: true, source: "outreach_import" }
        }));
      }

      const matchMsg = result.matched ? ` (${result.matched} matched existing companies, duplicate prevented)` : '';
      addToast("success", `Successfully imported ${result.count} outreach records for ${targetDate}${matchMsg}!`);

      if (onSuccess) {
        onSuccess({ count: result.count || mappedRows.length, date: targetDate });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during import.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col border border-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-teal-500/20 text-teal-300 rounded-xl flex items-center justify-center font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black text-sm text-white flex items-center gap-2">
                <span>Import Outreach by CSV</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Duplicate Immune
                </span>
              </p>
              <p className="text-neutral-400 text-xs mt-0.5">
                Log or import outreach for any day — updates universally across CRM
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 font-sans text-xs">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 rounded-xl p-3 font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          {/* Date & Default Channel Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50 border border-neutral-200 p-3.5 rounded-2xl">
            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-500" />
                <span>Target Outreach Date</span>
                <span className="text-red-500">*</span>
              </label>
              <Input
                type="date"
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="h-9 text-xs bg-white border-neutral-200 rounded-xl font-bold font-mono"
                required
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Outreach logs will attach to this date on Daily Cadence
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-neutral-700 block mb-1">
                Default Channel
              </label>
              <select
                value={defaultChannel}
                onChange={e => {
                  const ch = e.target.value as OutreachChannel;
                  setDefaultChannel(ch);
                  setCustomValues(prev => ({ ...prev, channel: ch }));
                }}
                className="w-full text-xs bg-white border border-neutral-200 rounded-xl h-9 px-3 font-bold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900 cursor-pointer"
              >
                {CHANNELS.map(ch => (
                  <option key={ch} value={ch}>
                    {CHANNEL_CONFIG[ch]?.label || ch}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-neutral-400 mt-1 block">
                Used if row does not specify an outreach channel
              </span>
            </div>
          </div>

          {/* File Upload Box */}
          {!csvFileName ? (
            <label className="border-2 border-dashed border-neutral-300 hover:border-neutral-900 bg-neutral-50/70 hover:bg-neutral-100/70 transition-all rounded-2xl p-6 text-center cursor-pointer block space-y-2">
              <div className="h-10 w-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center mx-auto shadow-sm">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black text-neutral-900">Upload Outreach CSV</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Select your CSV file. Automatic header matching with duplicate immunity.
                </p>
              </div>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
          ) : (
            <div className="bg-neutral-900 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-teal-500/20 text-teal-300 rounded-xl flex items-center justify-center font-bold">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-white">{csvFileName}</p>
                  <p className="text-[10px] text-teal-300 font-medium font-mono">
                    {csvRows.length} rows found · {csvHeaders.length} columns detected
                  </p>
                </div>
              </div>
              <label className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors">
                Change File
                <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}

          {/* Duplicate Immunity Notice */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3 flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
            <p className="text-xs text-teal-950 font-medium leading-relaxed">
              <strong className="font-extrabold text-teal-900">Duplicate Immunity Active:</strong> Existing accounts will be matched by company name, LinkedIn profile, or contact details. Duplicate companies and duplicate outreach entries on the same day are automatically merged instead of duplicated.
            </p>
          </div>

          {/* Field Mapping Grid */}
          {csvHeaders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-neutral-600" />
                  <span>Column Field Mapping</span>
                </h3>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {Object.values(columnMap).filter(Boolean).length} mapped
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
                {MAPPING_FIELDS.map(field => {
                  const selectedVal = columnMap[field.key] || '';
                  const isMapped = Boolean(selectedVal);
                  const isCustom = selectedVal === "__custom__";

                  return (
                    <div
                      key={field.key}
                      className={cn(
                        "border rounded-xl p-2.5 space-y-1 transition-all",
                        isCustom
                          ? "bg-amber-50/70 border-amber-300"
                          : isMapped
                          ? "bg-emerald-50/50 border-emerald-300"
                          : "bg-white border-neutral-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-extrabold text-neutral-900 truncate">
                          {field.label}
                        </label>
                        <span className="text-[9px] font-mono text-neutral-400 font-bold bg-neutral-100 px-1 py-0.5 rounded">
                          {field.table}
                        </span>
                      </div>

                      <select
                        value={selectedVal}
                        onChange={e => setColumnMap(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className={cn(
                          "w-full text-xs rounded-lg h-8 px-2 font-bold transition-all focus:outline-none cursor-pointer",
                          isMapped
                            ? "bg-white border-emerald-400 text-emerald-950"
                            : "bg-neutral-50 border-neutral-200 text-neutral-700"
                        )}
                      >
                        <option value="">-- Skip / Do Not Map --</option>
                        <option value="__custom__">Manual Fixed Value...</option>
                        {csvHeaders.map(h => {
                          const sampleVal = csvRows[0]?.[h] ? ` (e.g. "${csvRows[0][h].slice(0, 16)}")` : '';
                          return (
                            <option key={h} value={h}>
                              CSV: "{h}"{sampleVal}
                            </option>
                          );
                        })}
                      </select>

                      {isCustom && (
                        <div className="pt-1">
                          {field.key === "channel" ? (
                            <select
                              value={customValues.channel || "linkedin"}
                              onChange={e => setCustomValues(prev => ({ ...prev, channel: e.target.value as OutreachChannel }))}
                              className="w-full text-xs bg-white border border-amber-300 rounded-lg h-7 px-2 font-bold text-amber-950"
                            >
                              {CHANNELS.map(ch => (
                                <option key={ch} value={ch}>{CHANNEL_CONFIG[ch]?.label || ch}</option>
                              ))}
                            </select>
                          ) : field.key === "status" ? (
                            <select
                              value={customValues.status || "sent"}
                              onChange={e => setCustomValues(prev => ({ ...prev, status: e.target.value as OutreachStatus }))}
                              className="w-full text-xs bg-white border border-amber-300 rounded-lg h-7 px-2 font-bold text-amber-950"
                            >
                              {STATUSES.map(st => (
                                <option key={st} value={st}>{STATUS_CONFIG[st]?.label || st}</option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              type={field.key === "outreach_date" ? "date" : "text"}
                              placeholder={`Fixed value for ${field.label}...`}
                              value={customValues[field.key] || ''}
                              onChange={e => setCustomValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                              className="h-7 text-xs bg-white border-amber-300 text-amber-950 font-bold"
                            />
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[9px]">
                        <span className="text-neutral-400">{field.desc}</span>
                        {isMapped && (
                          <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                            <Check className="h-2.5 w-2.5" /> Mapped
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Preview Table */}
          {csvRows.length > 0 && (
            <div className="space-y-1.5 bg-neutral-50 border border-neutral-200 p-3 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-neutral-800 text-xs">
                  <Table className="h-3.5 w-3.5 text-neutral-600" />
                  <span>Preview (First 3 Rows)</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">
                  Total: {csvRows.length} records
                </span>
              </div>

              <div className="overflow-x-auto border border-neutral-200 rounded-xl bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 border-b border-neutral-200 text-neutral-700 font-bold text-[11px]">
                    <tr>
                      <th className="p-2 border-r border-neutral-200">#</th>
                      <th className="p-2 border-r border-neutral-200">Company Name</th>
                      <th className="p-2 border-r border-neutral-200">Contact</th>
                      <th className="p-2 border-r border-neutral-200">Handle / Phone</th>
                      <th className="p-2">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-800 text-[11px]">
                    {csvRows.slice(0, 3).map((r, i) => {
                      const getPreviewVal = (key: keyof MappedCSVRow) => {
                        const mapVal = columnMap[key];
                        if (mapVal === "__custom__") return customValues[key] || '';
                        if (mapVal && r[mapVal]) return r[mapVal];
                        return '';
                      };

                      const coName = getPreviewVal('company_name') || getPreviewVal('contact_name') || 'Unnamed Lead';
                      const contactName = getPreviewVal('contact_name') || '-';
                      const handleVal = getPreviewVal('handle') || getPreviewVal('phone') || '-';
                      const noteVal = getPreviewVal('notes') || '-';

                      return (
                        <tr key={i} className="hover:bg-neutral-50/50">
                          <td className="p-2 font-mono text-[10px] text-neutral-400 border-r border-neutral-200">{i + 1}</td>
                          <td className="p-2 font-bold text-neutral-900 border-r border-neutral-200 truncate max-w-[150px]">{coName}</td>
                          <td className="p-2 border-r border-neutral-200 truncate max-w-[120px] text-neutral-700">{contactName}</td>
                          <td className="p-2 border-r border-neutral-200 font-mono text-[10px] truncate max-w-[120px]">{handleVal}</td>
                          <td className="p-2 truncate max-w-[150px] text-neutral-500 italic">{noteVal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-3 border-t border-neutral-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-9 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || csvRows.length === 0}
              className="flex-1 h-9 bg-neutral-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing & Deduplicating...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4 text-teal-400" />
                  <span>Import {csvRows.length} Records to {targetDate}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
