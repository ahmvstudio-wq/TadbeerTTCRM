"use client";

import { useState, useRef } from "react";
import { Upload, FileText, AlertTriangle, CheckCircle, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";

interface CsvImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: Record<string, string>[]) => void;
  fields: { key: string; label: string; required?: boolean }[];
  title?: string;
}

export function CsvImport({ open, onClose, onImport, fields, title = "Import CSV" }: CsvImportProps) {
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        setError("CSV must have at least a header row and one data row");
        return;
      }

      const headers = parseCSVLine(lines[0]);
      const rows = lines.slice(1).map((line) => parseCSVLine(line));

      setCsvHeaders(headers);
      setCsvRows(rows);
      setError(null);

      const autoMapping: Record<string, string> = {};
      fields.forEach((field) => {
        const match = headers.find(
          (h) => h.toLowerCase().replace(/[^a-z0-9]/g, "") === field.label.toLowerCase().replace(/[^a-z0-9]/g, "")
        );
        if (match) autoMapping[field.key] = match;
      });
      setMapping(autoMapping);
      setStep("map");
    };
    reader.readAsText(file);
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleImport = async () => {
    const requiredFields = fields.filter((f) => f.required);
    const missing = requiredFields.filter((f) => !mapping[f.key]);

    if (missing.length > 0) {
      setError(`Please map required fields: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    setImporting(true);
    try {
      const mappedData = csvRows.map((row) => {
        const record: Record<string, string> = {
          lead_source: mapping["lead_source"] || "Insights",
        };
        fields.forEach((field) => {
          const csvHeader = mapping[field.key];
          if (csvHeader) {
            const headerIndex = csvHeaders.indexOf(csvHeader);
            if (headerIndex !== -1) {
              record[field.key] = row[headerIndex] || "";
            }
          }
        });
        return record;
      });

      onImport(mappedData);
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const resetAndClose = () => {
    setStep("upload");
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={resetAndClose} className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogClose onClick={resetAndClose} />
      </DialogHeader>

      <DialogContent>
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200 mb-4">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {step === "upload" && (
          <div
            className="border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-brand-teal transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-text-muted mx-auto mb-4" />
            <p className="text-sm font-medium text-text-primary mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-text-secondary">CSV files only</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#174E59]/5 border border-[#174E59]/20 flex items-center justify-between">
              <div>
                <label className="text-xs font-black text-[#174E59] block">Source Platform / Lead Generator</label>
                <p className="text-[11px] text-slate-500 font-medium">Tag all imported prospects with their software origin</p>
              </div>
              <select
                value={mapping["lead_source"] || "Insights"}
                onChange={(e) => setMapping({ ...mapping, lead_source: e.target.value })}
                className="bg-white border border-[#174E59]/30 text-[#174E59] rounded-xl text-xs font-black h-9 px-3 focus:outline-none focus:ring-2 focus:ring-[#174E59]/30"
              >
                <option value="Insights">⚡ Insight Generated Contacts</option>
                <option value="LinkedIn Sales Navigator">💼 LinkedIn Sales Navigator</option>
                <option value="WhatsApp Scraper">💬 WhatsApp Scraper</option>
                <option value="Manual / Website">🌐 Manual / Website Import</option>
              </select>
            </div>

            <p className="text-sm text-text-secondary">
              Map your CSV columns to the CRM fields. Found <strong>{csvRows.length}</strong> rows.
            </p>
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {fields.map((field) => (
                <div key={field.key} className="flex items-center gap-3">
                  <label className="w-40 text-sm font-medium text-text-primary flex-shrink-0">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <ArrowRight className="h-4 w-4 text-text-muted flex-shrink-0" />
                  <Select
                    options={[
                      { value: "", label: "-- Skip --" },
                      ...csvHeaders.map((h) => ({ value: h, label: h })),
                    ]}
                    value={mapping[field.key] || ""}
                    onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>

      <DialogFooter>
        <Button variant="ghost" onClick={resetAndClose}>
          Cancel
        </Button>
        {step === "map" && (
          <Button onClick={handleImport} className="bg-brand-teal hover:bg-brand-teal-dark text-white" disabled={importing}>
            <Upload className="h-4 w-4 mr-2" />
            {importing ? "Importing..." : `Import ${csvRows.length} Rows`}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
