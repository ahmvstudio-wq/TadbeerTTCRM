"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  MessageCircle, ExternalLink, Mail, CheckCircle, Send, Loader2, Plus, X,
  Trash2, CheckSquare, Square, Upload, AlertTriangle, ArrowRight, Eye,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────
interface OutreachItem {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  channel: string;
  use_case: string;
  service_line: string;
  message: string;
  status: "pending" | "sent" | "skipped";
}

// ─── CSV Fields ───────────────────────────────────────────────────────────
const CSV_FIELDS = [
  { key: "company_name", label: "Company Name", required: true },
  { key: "industry", label: "Industry" },
  { key: "country", label: "Country" },
  { key: "city", label: "City" },
  { key: "contact_name", label: "Contact Name", required: true },
  { key: "contact_title", label: "Contact Title" },
  { key: "contact_email", label: "Contact Email" },
  { key: "contact_phone", label: "Contact Phone" },
  { key: "contact_whatsapp", label: "Contact WhatsApp" },
  { key: "channel", label: "Channel" },
  { key: "service_line", label: "Service Line" },
  { key: "use_case", label: "Use Case" },
  { key: "message", label: "Message / Script" },
];

const CHANNEL_ICONS: Record<string, React.ElementType> = { whatsapp: MessageCircle, linkedin: ExternalLink, email: Mail };
const CHANNEL_COLORS: Record<string, string> = { whatsapp: "bg-green-100 text-green-700", linkedin: "bg-blue-100 text-blue-700", email: "bg-slate-100 text-slate-700" };

// ─── CSV Import Dialog ───────────────────────────────────────────────────
function CsvImportDialog({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (data: OutreachItem[]) => void }) {
  const [step, setStep] = useState<"upload" | "map">("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) { setError("Need header + at least 1 row"); return; }
      const headers = parseLine(lines[0]);
      const rows = lines.slice(1).map((l) => parseLine(l));
      setCsvHeaders(headers);
      setCsvRows(rows);
      setError(null);
      const auto: Record<string, string> = {};
      CSV_FIELDS.forEach((f) => {
        const match = headers.find((h) => h.toLowerCase().replace(/[^a-z0-9]/g, "") === f.label.toLowerCase().replace(/[^a-z0-9]/g, ""));
        if (match) auto[f.key] = match;
      });
      setMapping(auto);
      setStep("map");
    };
    reader.readAsText(file);
  };

  const parseLine = (line: string) => {
    const r: string[] = []; let cur = "", q = false;
    for (const c of line) { if (c === '"') q = !q; else if (c === "," && !q) { r.push(cur.trim()); cur = ""; } else cur += c; }
    r.push(cur.trim()); return r;
  };

  const handleImport = () => {
    const items: OutreachItem[] = csvRows.map((row, idx) => {
      const get = (key: string) => { const h = mapping[key]; if (!h) return ""; const i = csvHeaders.indexOf(h); return i !== -1 ? (row[i] || "") : ""; };
      return {
        id: String(Date.now()) + idx,
        company_name: get("company_name") || "Unknown",
        contact_name: get("contact_name"),
        contact_email: get("contact_email"),
        contact_phone: get("contact_phone") || get("contact_whatsapp"),
        channel: get("channel") || "whatsapp",
        use_case: get("use_case"),
        service_line: get("service_line"),
        message: get("message"),
        status: "pending" as const,
      };
    });
    onImport(items);
    reset();
    onClose();
  };

  const reset = () => { setStep("upload"); setCsvHeaders([]); setCsvRows([]); setMapping({}); setError(null); };

  return (
    <Dialog open={open} onClose={() => { reset(); onClose(); }} className="max-w-2xl">
      <DialogHeader><DialogTitle>Import Outreach List from CSV</DialogTitle><DialogClose onClick={() => { reset(); onClose(); }} /></DialogHeader>
      <DialogContent>
        {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200 mb-4"><AlertTriangle className="h-4 w-4" />{error}</div>}
        {step === "upload" && (
          <div className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-brand-teal transition-colors cursor-pointer" onClick={() => document.getElementById("outreach-csv-input")?.click()}>
            <Upload className="h-10 w-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm font-medium text-text-primary mb-1">Click to upload CSV</p>
            <p className="text-xs text-text-secondary">Pre-decided outreach data with contacts, channels, and messages</p>
            <input id="outreach-csv-input" type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>
        )}
        {step === "map" && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">Map columns. Found <strong>{csvRows.length}</strong> rows. Preview: <strong>{csvRows[0]?.slice(0, 3).join(", ")}</strong></p>
            <div className="max-h-[400px] overflow-y-auto space-y-2">
              {CSV_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-2">
                  <label className="w-32 text-xs font-medium text-text-secondary flex-shrink-0">{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</label>
                  <ArrowRight className="h-3 w-3 text-text-muted flex-shrink-0" />
                  <Select options={[{ value: "", label: "-- Skip --" }, ...csvHeaders.map((h) => ({ value: h, label: h }))]} value={mapping[f.key] || ""} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })} className="flex-1 h-8 text-xs" />
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
      <DialogFooter>
        <Button variant="ghost" onClick={() => { reset(); onClose(); }}>Cancel</Button>
        {step === "map" && <Button onClick={handleImport} className="bg-brand-teal hover:bg-brand-teal-dark text-white"><Upload className="h-4 w-4 mr-1" />Import {csvRows.length} Entries</Button>}
      </DialogFooter>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function OutreachPage() {
  const [items, setItems] = useState<OutreachItem[]>([]);
  const [loading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [csvOpen, setCsvOpen] = useState(false);
  const [viewItem, setViewItem] = useState<OutreachItem | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const sentCount = items.filter((i) => i.status === "sent").length;
  const pendingCount = items.filter((i) => i.status === "pending").length;

  // ── Selection ──
  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const selectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  // ── Actions ──
  const markSent = (id: string) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "sent" as const } : i));
  const markSelectedSent = () => { setItems((prev) => prev.map((i) => selected.has(i.id) ? { ...i, status: "sent" as const } : i)); setSelected(new Set()); setToast({ type: "success", message: "Marked as sent" }); };
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const removeSelected = () => { setItems((prev) => prev.filter((i) => !selected.has(i.id))); setSelected(new Set()); };
  const skipItem = (id: string) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "skipped" as const } : i));

  const handleCsvImport = (imported: OutreachItem[]) => {
    setItems((prev) => [...prev, ...imported]);
    setToast({ type: "success", message: `Imported ${imported.length} outreach entries` });
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.message}<button onClick={() => setToast(null)} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Daily Outreach</h1>
          <p className="text-text-secondary text-sm mt-0.5">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCsvOpen(true)}><Upload className="h-3.5 w-3.5 mr-1" />Import CSV</Button>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Daily Progress</span>
          <span className="font-semibold text-text-primary">{sentCount} / 10</span>
        </div>
        <div className="bg-cream-dark rounded-full h-2">
          <div className="bg-brand-teal h-2 rounded-full transition-all" style={{ width: `${Math.min((sentCount / 10) * 100, 100)}%` }} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-green-600">{sentCount}</p><p className="text-[11px] text-text-muted">Sent</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-text-muted">{pendingCount}</p><p className="text-[11px] text-text-muted">Pending</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold text-brand-teal">{items.length}</p><p className="text-[11px] text-text-muted">Total</p></CardContent></Card>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-brand-teal/5 border border-brand-teal/20 rounded-lg">
          <span className="text-sm font-medium text-brand-teal">{selected.size} selected</span>
          <Button size="sm" variant="outline" onClick={markSelectedSent}><CheckCircle className="h-3.5 w-3.5 mr-1" />Mark Sent</Button>
          <Button size="sm" variant="outline" onClick={removeSelected} className="text-red-600 hover:text-red-700"><Trash2 className="h-3.5 w-3.5 mr-1" />Remove</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <Card><CardContent className="p-16 text-center">
          <Send className="h-10 w-10 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm mb-3">No outreach entries yet. Import your pre-decided outreach list from a CSV.</p>
          <Button size="sm" className="bg-brand-teal hover:bg-brand-teal-dark text-white" onClick={() => setCsvOpen(true)}><Upload className="h-3.5 w-3.5 mr-1" />Import CSV</Button>
        </CardContent></Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 px-3 py-2.5"><button onClick={selectAll} className="text-text-muted hover:text-text-primary">{selected.size === items.length && items.length > 0 ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}</button></th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-medium text-text-muted uppercase">Company</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-medium text-text-muted uppercase">Contact</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-medium text-text-muted uppercase">Channel</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-medium text-text-muted uppercase">Use Case</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-medium text-text-muted uppercase">Message</th>
                  <th className="text-left px-3 py-2.5 text-[11px] font-medium text-text-muted uppercase">Status</th>
                  <th className="text-right px-3 py-2.5 text-[11px] font-medium text-text-muted uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const ChIcon = CHANNEL_ICONS[item.channel] || Mail;
                  return (
                    <tr key={item.id} className={cn("border-b border-border-light hover:bg-cream-dark/30 transition-colors", item.status === "sent" && "bg-green-50/30", item.status === "skipped" && "opacity-40")}>
                      <td className="px-3 py-2.5"><button onClick={() => toggleSelect(item.id)}>{selected.has(item.id) ? <CheckSquare className="h-4 w-4 text-brand-teal" /> : <Square className="h-4 w-4 text-text-muted" />}</button></td>
                      <td className="px-3 py-2.5 font-medium text-text-primary">{item.company_name}</td>
                      <td className="px-3 py-2.5">
                        <div className="text-text-secondary">{item.contact_name}</div>
                        {item.contact_email && <div className="text-[11px] text-text-muted">{item.contact_email}</div>}
                      </td>
                      <td className="px-3 py-2.5"><Badge className={cn("text-[10px]", CHANNEL_COLORS[item.channel] || "bg-slate-100 text-slate-700")}>{item.channel}</Badge></td>
                      <td className="px-3 py-2.5 text-text-secondary max-w-[200px] truncate">{item.use_case || "—"}</td>
                      <td className="px-3 py-2.5">
                        {item.message ? (
                          <button onClick={() => setViewItem(item)} className="text-brand-teal hover:underline text-xs flex items-center gap-1"><Eye className="h-3 w-3" />View</button>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        {item.status === "sent" ? <Badge className="bg-green-100 text-green-700 text-[10px]">Sent</Badge> :
                         item.status === "skipped" ? <Badge className="bg-slate-100 text-slate-500 text-[10px]">Skipped</Badge> :
                         <Badge className="bg-amber-100 text-amber-700 text-[10px]">Pending</Badge>}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status === "pending" && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-green-600 hover:text-green-700" onClick={() => markSent(item.id)}><CheckCircle className="h-3 w-3 mr-0.5" />Send</Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px]" onClick={() => skipItem(item.id)}>Skip</Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-text-muted hover:text-red-600" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Message view dialog */}
      <Dialog open={!!viewItem} onClose={() => setViewItem(null)} className="max-w-xl">
        <DialogHeader><DialogTitle>{viewItem?.company_name} — Message</DialogTitle><DialogClose onClick={() => setViewItem(null)} /></DialogHeader>
        <DialogContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <span>To: <strong className="text-text-primary">{viewItem?.contact_name}</strong></span>
              {viewItem?.contact_email && <span>· {viewItem.contact_email}</span>}
              {viewItem?.contact_phone && <span>· {viewItem.contact_phone}</span>}
            </div>
            <div className="p-4 bg-cream/60 rounded-lg text-sm text-text-primary whitespace-pre-wrap font-mono leading-relaxed border border-border-light">
              {viewItem?.message || "No message"}
            </div>
            <Button size="sm" variant="outline" onClick={() => viewItem?.message && navigator.clipboard.writeText(viewItem.message)}>
              Copy to Clipboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CsvImportDialog open={csvOpen} onClose={() => setCsvOpen(false)} onImport={handleCsvImport} />
    </div>
  );
}
