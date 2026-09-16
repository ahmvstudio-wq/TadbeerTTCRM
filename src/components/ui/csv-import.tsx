"use client";

import { useState, useRef, useMemo } from "react";
import { Upload, FileText, AlertTriangle, CheckCircle2, X, ArrowRight, Filter, MessageSquare, PhoneCall, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { type OutreachChannel, CHANNEL_CONFIG } from "@/lib/types/outreach";

interface CsvImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: Record<string, string>[], channel?: OutreachChannel | 'all') => void;
  fields?: { key: string; label: string; required?: boolean; group?: 'credentials' | 'messages' | 'context' }[];
  title?: string;
  defaultChannel?: OutreachChannel | 'all';
}

const TARGET_CHANNELS: { key: OutreachChannel | 'all'; label: string; icon: string; requiredKey: string; hint: string }[] = [
  { key: 'all',            label: 'Multi-Channel (Auto-Detect)', icon: '', requiredKey: '',                 hint: 'Accepts all available credentials across channels.' },
  { key: 'instagram_dm',   label: 'Instagram DM',              icon: '', requiredKey: 'instagram_handle', hint: 'Strictly requires Instagram @handle or profile URLs for DM campaigns.' },
  { key: 'whatsapp',       label: 'WhatsApp',                  icon: '', requiredKey: 'phone',            hint: 'Strictly requires valid mobile / WhatsApp numbers (e.g. +968...).' },
  { key: 'cold_call',      label: 'Cold Call',                 icon: '', requiredKey: 'phone',            hint: 'Strictly requires valid direct phone numbers and contact names.' },
  { key: 'linkedin',       label: 'LinkedIn',                  icon: '', requiredKey: 'linkedin_url',     hint: 'Strictly requires LinkedIn profile or company URLs.' },
  { key: 'email',          label: 'Direct Email',              icon: '', requiredKey: 'email',            hint: 'Strictly requires valid direct business email addresses.' },
];

export function CsvImport({
  open,
  onClose,
  onImport,
  title = "Import Researched Prospects (Bulk CSV)",
  defaultChannel = "all",
}: CsvImportProps) {
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [selectedChannel, setSelectedChannel] = useState<OutreachChannel | 'all'>(defaultChannel);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Dynamic field definitions grouped cleanly by channel
  const effectiveFields = useMemo(() => {
    if (selectedChannel === 'instagram_dm') {
      return [
        // 1. Credentials
        { key: "instagram_handle", label: "Instagram Handle (@handle or Profile Link)", required: true, group: 'credentials' as const },
        { key: "company_name", label: "Business Name (Optional: auto-derived from @handle)", group: 'credentials' as const },
        { key: "person_name", label: "Contact Person / Doctor / Founder Name", group: 'credentials' as const },
        
        // 2. Pre-Staged Messages & Touchpoints
        { key: "touch_1_message", label: "Touch 1: DM Gate-Opener Message", group: 'messages' as const, note: "Auto-generated if skipped" },
        { key: "touch_2_message", label: "Touch 2: Value / Observation Follow-Up", group: 'messages' as const, note: "Auto-generated if skipped" },
        { key: "touch_3_message", label: "Touch 3: Breakaway / Graceful Close", group: 'messages' as const, note: "Auto-generated if skipped" },
        { key: "stage", label: "Initial Touchpoint Stage (e.g. gate_opener_staged)", group: 'messages' as const, note: "Defaults to Staged" },

        // 3. Context & Segmentation
        { key: "specific_observation", label: "Pre-Researched Observation Note", group: 'context' as const },
        { key: "category", label: "Sector / Category (e.g. Derma, Dental, DTC)", group: 'context' as const },
        { key: "city", label: "City (e.g. Muscat, Salalah)", group: 'context' as const },
        { key: "notes", label: "General Notes / Angles", group: 'context' as const },
      ];
    }

    if (selectedChannel === 'whatsapp') {
      return [
        // 1. Credentials
        { key: "phone", label: "Phone / WhatsApp Number (+968...)", required: true, group: 'credentials' as const },
        { key: "company_name", label: "Business Name (Optional: auto-derived if skipped)", group: 'credentials' as const },
        { key: "person_name", label: "Contact Person / Doctor / Founder Name", group: 'credentials' as const },

        // 2. Pre-Staged Messages & Touchpoints
        { key: "touch_1_message", label: "Touch 1: WhatsApp Gate-Opener Message", group: 'messages' as const, note: "Auto-generated if skipped" },
        { key: "touch_2_message", label: "Touch 2: Market Observation Follow-Up", group: 'messages' as const, note: "Auto-generated if skipped" },
        { key: "touch_3_message", label: "Touch 3: Breakaway / Graceful Close", group: 'messages' as const, note: "Auto-generated if skipped" },
        { key: "stage", label: "Initial Touchpoint Stage", group: 'messages' as const, note: "Defaults to Staged" },

        // 3. Context & Segmentation
        { key: "specific_observation", label: "Pre-Researched Observation Note", group: 'context' as const },
        { key: "category", label: "Sector / Category", group: 'context' as const },
        { key: "city", label: "City", group: 'context' as const },
        { key: "notes", label: "General Notes", group: 'context' as const },
      ];
    }

    if (selectedChannel === 'cold_call') {
      return [
        // 1. Credentials
        { key: "phone", label: "Direct Phone Number", required: true, group: 'credentials' as const },
        { key: "company_name", label: "Business Name (Optional: auto-derived if skipped)", group: 'credentials' as const },
        { key: "person_name", label: "Decision Maker Name", group: 'credentials' as const },
        { key: "person_title", label: "Title / Role (e.g. Owner, GM, Doctor)", group: 'credentials' as const },

        // 2. Call Scripts & Touchpoints
        { key: "cold_call_script", label: "30-Second Cold Call Script / Opener", group: 'messages' as const, note: "Auto-generated if skipped" },
        { key: "touch_1_message", label: "SMS / WhatsApp Follow-up Post-Call", group: 'messages' as const, note: "Auto-generated if skipped" },
        { key: "stage", label: "Initial Call Queue Stage", group: 'messages' as const, note: "Defaults to Call Queue" },

        // 3. Context & Segmentation
        { key: "specific_observation", label: "Pre-Researched Observation Note", group: 'context' as const },
        { key: "category", label: "Sector / Category", group: 'context' as const },
        { key: "city", label: "City", group: 'context' as const },
        { key: "notes", label: "General Notes", group: 'context' as const },
      ];
    }

    if (selectedChannel === 'linkedin') {
      return [
        // 1. Credentials
        { key: "linkedin_url", label: "LinkedIn Profile URL", required: true, group: 'credentials' as const },
        { key: "company_name", label: "Company Name (Optional: auto-derived if skipped)", group: 'credentials' as const },
        { key: "person_name", label: "Contact Full Name", group: 'credentials' as const },
        { key: "person_title", label: "Job Title / Role", group: 'credentials' as const },

        // 2. Messages & Touchpoints
        { key: "touch_1_message", label: "Touch 1: Connection Request Note / InMail", group: 'messages' as const, note: "Auto-generated if skipped" },
        { key: "touch_2_message", label: "Touch 2: Value Observation Follow-Up", group: 'messages' as const, note: "Auto-generated if skipped" },
        { key: "stage", label: "Initial Touchpoint Stage", group: 'messages' as const, note: "Defaults to Staged" },

        // 3. Context & Segmentation
        { key: "specific_observation", label: "Pre-Researched Observation Note", group: 'context' as const },
        { key: "category", label: "Sector / Category", group: 'context' as const },
        { key: "city", label: "City", group: 'context' as const },
        { key: "notes", label: "General Notes", group: 'context' as const },
      ];
    }

    if (selectedChannel === 'email') {
      return [
        // 1. Credentials
        { key: "email", label: "Direct Email Address", required: true, group: 'credentials' as const },
        { key: "company_name", label: "Company Name (Optional: auto-derived if skipped)", group: 'credentials' as const },
        { key: "person_name", label: "Contact Full Name", group: 'credentials' as const },
        { key: "person_title", label: "Job Title / Role", group: 'credentials' as const },

        // 2. Messages & Touchpoints
        { key: "touch_1_message", label: "Touch 1: Direct Email Body (Gate-Opener)", group: 'messages' as const, note: "Auto-generated if skipped" },
        { key: "touch_2_message", label: "Touch 2: Follow-Up Email", group: 'messages' as const, note: "Auto-generated if skipped" },
        { key: "touch_3_message", label: "Touch 3: Breakaway Email", group: 'messages' as const, note: "Auto-generated if skipped" },
        { key: "stage", label: "Initial Touchpoint Stage", group: 'messages' as const, note: "Defaults to Staged" },

        // 3. Context & Segmentation
        { key: "specific_observation", label: "Pre-Researched Observation Note", group: 'context' as const },
        { key: "category", label: "Sector / Category", group: 'context' as const },
        { key: "city", label: "City", group: 'context' as const },
        { key: "notes", label: "General Notes", group: 'context' as const },
      ];
    }

    // Default 'all' Multi-Channel
    return [
      { key: "company_name", label: "Company / Clinic / Brand Name (Optional: auto-derived)", group: 'credentials' as const },
      { key: "person_name", label: "Contact Person Name", group: 'credentials' as const },
      { key: "phone", label: "Phone / WhatsApp Number", group: 'credentials' as const },
      { key: "instagram_handle", label: "Instagram Handle (@handle)", group: 'credentials' as const },
      { key: "linkedin_url", label: "LinkedIn Profile URL", group: 'credentials' as const },
      { key: "email", label: "Email Address", group: 'credentials' as const },
      { key: "touch_1_message", label: "Touch 1 Message (Gate-Opener)", group: 'messages' as const, note: "Auto-generated if skipped" },
      { key: "touch_2_message", label: "Touch 2 Message (Follow-Up)", group: 'messages' as const, note: "Auto-generated if skipped" },
      { key: "touch_3_message", label: "Touch 3 Message (Breakaway)", group: 'messages' as const, note: "Auto-generated if skipped" },
      { key: "cold_call_script", label: "30-Second Cold Call Script", group: 'messages' as const, note: "Auto-generated if skipped" },
      { key: "stage", label: "Initial Stage / Status", group: 'messages' as const, note: "Defaults to Staged" },
      { key: "specific_observation", label: "Observation Note", group: 'context' as const },
      { key: "category", label: "Sector / Category", group: 'context' as const },
      { key: "city", label: "City", group: 'context' as const },
      { key: "notes", label: "General Notes", group: 'context' as const },
    ];
  }, [selectedChannel]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a valid CSV file");
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

      // Intelligent auto-mapping heuristics
      const autoMapping: Record<string, string> = {};
      effectiveFields.forEach((field) => {
        const fieldKeyClean = field.key.toLowerCase().replace(/[^a-z0-9]/g, "");
        const fieldLabelClean = field.label.toLowerCase().replace(/[^a-z0-9]/g, "");

        const match = headers.find((h) => {
          const hClean = h.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (hClean === fieldKeyClean || hClean === fieldLabelClean) return true;
          if (field.key === 'company_name' && (hClean.includes('company') || hClean.includes('clinic') || hClean.includes('brand') || hClean.includes('name') || hClean.includes('business'))) return true;
          if (field.key === 'instagram_handle' && (hClean.includes('instagram') || hClean.includes('ig') || hClean.includes('handle') || hClean.includes('username'))) return true;
          if (field.key === 'phone' && (hClean.includes('phone') || hClean.includes('whatsapp') || hClean.includes('mobile') || hClean.includes('contactnumber') || hClean.includes('tel'))) return true;
          if (field.key === 'linkedin_url' && (hClean.includes('linkedin') || hClean.includes('profileurl') || hClean.includes('li'))) return true;
          if (field.key === 'email' && (hClean.includes('email') || hClean.includes('mail'))) return true;
          if (field.key === 'category' && (hClean.includes('category') || hClean.includes('sector') || hClean.includes('industry') || hClean.includes('niche'))) return true;
          if (field.key === 'specific_observation' && (hClean.includes('observation') || hClean.includes('pain') || hClean.includes('research') || hClean.includes('angle') || hClean.includes('notes'))) return true;
          if (field.key === 'touch_1_message' && (hClean.includes('touch1') || hClean.includes('gateopener') || hClean.includes('opener') || hClean.includes('firstmessage') || hClean.includes('draftmessage') || hClean.includes('dmscript'))) return true;
          if (field.key === 'touch_2_message' && (hClean.includes('touch2') || hClean.includes('followup1') || hClean.includes('followup') || hClean.includes('touchtwo'))) return true;
          if (field.key === 'touch_3_message' && (hClean.includes('touch3') || hClean.includes('followup2') || hClean.includes('breakaway') || hClean.includes('touchthree'))) return true;
          if (field.key === 'cold_call_script' && (hClean.includes('callscript') || hClean.includes('script') || hClean.includes('coldcall') || hClean.includes('phonescript'))) return true;
          if (field.key === 'stage' && (hClean.includes('stage') || hClean.includes('status') || hClean.includes('touchpoint'))) return true;
          return false;
        });

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
    const requiredFields = effectiveFields.filter((f) => f.required);
    const missing = requiredFields.filter((f) => !mapping[f.key]);

    if (missing.length > 0) {
      setError(`Channel Requirements: Please map the required column for ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    setImporting(true);
    setError(null);

    try {
      const mappedData = csvRows.map((row) => {
        const record: Record<string, string> = {
          lead_source: mapping["lead_source"] || (selectedChannel !== 'all' ? `${selectedChannel} List` : "CSV Import"),
        };
        effectiveFields.forEach((field) => {
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

      // Validate that at least some rows have the target credential
      if (selectedChannel === 'instagram_dm') {
        const withIg = mappedData.filter(r => r.instagram_handle && r.instagram_handle.trim().length > 0);
        if (withIg.length === 0) {
          setError("Error: No Instagram handles found in the mapped Instagram column! Please ensure your CSV contains valid @handles or Instagram profile links.");
          setImporting(false);
          return;
        }
      } else if (selectedChannel === 'whatsapp' || selectedChannel === 'cold_call') {
        const withPhone = mappedData.filter(r => r.phone && r.phone.trim().length > 0);
        if (withPhone.length === 0) {
          setError("Error: No phone numbers found in the mapped Phone column! Please ensure your CSV contains valid phone numbers.");
          setImporting(false);
          return;
        }
      }

      onImport(mappedData, selectedChannel);
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
    setSelectedChannel(defaultChannel);
    onClose();
  };

  const channelMeta = TARGET_CHANNELS.find(c => c.key === selectedChannel) || TARGET_CHANNELS[0];

  return (
    <Dialog open={open} onClose={resetAndClose} className="max-w-3xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-slate-900">
          <Upload className="h-5 w-5 text-teal-600" />
          <span>{title}</span>
        </DialogTitle>
        <DialogClose onClick={resetAndClose} />
      </DialogHeader>

      <DialogContent>
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-xs font-bold border border-red-200 mb-3 shadow-2xs">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* ── Channel Selector Ribbon ───────────────────────────────────────── */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-teal-600" />
              <span>Target Outreach Channel for this Import</span>
            </label>
            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
              Enforces Channel Credentials & Sequences
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            {TARGET_CHANNELS.map(ch => {
              const isSelected = selectedChannel === ch.key;
              return (
                <button
                  key={ch.key}
                  type="button"
                  onClick={() => setSelectedChannel(ch.key)}
                  className={cn(
                    "px-2 py-2 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1",
                    isSelected
                      ? "bg-white text-slate-900 shadow-xs font-extrabold border border-teal-500/40 ring-1 ring-teal-500/20"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/60 font-semibold"
                  )}
                >
                  <span className="text-base">{ch.icon}</span>
                  <span className="text-[10px] leading-tight truncate max-w-full">
                    {ch.label.replace(/^.*? /, '')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Channel Guidance Alert */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="text-sm">{channelMeta.icon}</span>
            <div className="flex-1 text-[11px]">
              <strong className="font-bold text-slate-900">{channelMeta.label}: </strong>
              {channelMeta.hint}
            </div>
          </div>
        </div>

        {step === "upload" && (
          <div
            className="border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-2xl p-10 text-center transition-all cursor-pointer bg-slate-50/50 hover:bg-teal-50/20"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-black text-slate-900 mb-1">Click to upload or drag & drop CSV</p>
            <p className="text-xs text-slate-500 font-medium">Supports pre-researched CSV files with observations, custom draft messages, and scripts</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs bg-teal-50 border border-teal-200 text-teal-900 px-3.5 py-2 rounded-xl font-bold">
              <span>Found <strong>{csvRows.length}</strong> prospect rows in CSV file</span>
              <span className="text-[11px] font-medium text-teal-700">Map fields & message sequences below:</span>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              
              {/* Group 1: Target Channel Credentials */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1">
                  <Layers className="h-3 w-3 text-teal-600" />
                  <span>1. Channel Credentials & Contact Info</span>
                </div>
                {effectiveFields.filter(f => f.group === 'credentials').map(field => {
                  const isMapped = Boolean(mapping[field.key]);
                  return (
                    <div
                      key={field.key}
                      className={cn(
                        "flex items-center justify-between gap-3 p-2 rounded-xl border transition-all text-xs",
                        field.required && !isMapped
                          ? "bg-amber-50/60 border-amber-300"
                          : isMapped
                          ? "bg-emerald-50/40 border-emerald-300"
                          : "bg-white border-slate-200"
                      )}
                    >
                      <label className="w-52 font-extrabold text-slate-900 flex items-center gap-1.5 flex-shrink-0">
                        <span>{field.label}</span>
                        {field.required && (
                          <span className="bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                            Required
                          </span>
                        )}
                      </label>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <Select
                        options={[
                          { value: "", label: "-- Skip Field --" },
                          ...csvHeaders.map((h) => ({ value: h, label: `CSV Column: "${h}"` })),
                        ]}
                        value={mapping[field.key] || ""}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                        className="flex-1 text-xs"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Group 2: Messages & Touchpoints Sequence */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-teal-900">
                    <MessageSquare className="h-3 w-3 text-teal-600" />
                    <span>2. Messages & Touchpoints Sequence</span>
                  </div>
                  <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    Auto-generates via Oman Playbook if skipped
                  </span>
                </div>
                {effectiveFields.filter(f => f.group === 'messages').map(field => {
                  const isMapped = Boolean(mapping[field.key]);
                  return (
                    <div
                      key={field.key}
                      className={cn(
                        "flex items-center justify-between gap-3 p-2 rounded-xl border transition-all text-xs",
                        isMapped ? "bg-emerald-50/40 border-emerald-300" : "bg-slate-50/60 border-slate-200"
                      )}
                    >
                      <div className="w-52 flex-shrink-0">
                        <label className="font-extrabold text-slate-900 block">{field.label}</label>
                        {field.note && <span className="text-[10px] text-slate-500 font-medium">{field.note}</span>}
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <Select
                        options={[
                          { value: "", label: "-- Skip (Auto-Generate via Playbook) --" },
                          ...csvHeaders.map((h) => ({ value: h, label: `CSV Column: "${h}"` })),
                        ]}
                        value={mapping[field.key] || ""}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                        className="flex-1 text-xs"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Group 3: Context & Segmentation */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-1">
                  <Layers className="h-3 w-3 text-amber-600" />
                  <span>3. Research Context & Segmentation</span>
                </div>
                {effectiveFields.filter(f => f.group === 'context').map(field => {
                  const isMapped = Boolean(mapping[field.key]);
                  return (
                    <div
                      key={field.key}
                      className={cn(
                        "flex items-center justify-between gap-3 p-2 rounded-xl border transition-all text-xs",
                        isMapped ? "bg-emerald-50/40 border-emerald-300" : "bg-white border-slate-200"
                      )}
                    >
                      <label className="w-52 font-extrabold text-slate-900 flex-shrink-0">{field.label}</label>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <Select
                        options={[
                          { value: "", label: "-- Skip Field --" },
                          ...csvHeaders.map((h) => ({ value: h, label: `CSV Column: "${h}"` })),
                        ]}
                        value={mapping[field.key] || ""}
                        onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                        className="flex-1 text-xs"
                      />
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}
      </DialogContent>

      <DialogFooter>
        <Button variant="ghost" onClick={resetAndClose} className="rounded-xl text-xs font-bold">
          Cancel
        </Button>
        {step === "map" && (
          <Button
            onClick={handleImport}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black px-5 shadow-xs"
            disabled={importing}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {importing ? "Processing..." : `Import ${csvRows.length} Prospects to ${selectedChannel !== 'all' ? channelMeta.label.replace(/^.*? /, '') : 'CRM'}`}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
