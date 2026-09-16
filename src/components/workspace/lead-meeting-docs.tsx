"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  Link as LinkIcon,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  Download
} from "lucide-react";
import { Company, Meeting, Contact } from "@/lib/types/database";
import { saveCompanyMeetingDocsAndSDRSheet } from "@/lib/actions/companies";
import { addToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface MeetingDoc {
  id: string;
  title: string;
  type: "pdf" | "link" | "doc" | "sheet" | "presentation" | "other";
  url?: string;
  data?: string;
  fileName?: string;
  fileSize?: string;
  notes?: string;
  addedAt: string;
  addedBy?: string;
}

interface LeadMeetingDocsProps {
  company: Company;
  primaryContact: Contact | null;
  meetings?: Meeting[];
  onRefresh?: () => void;
}

export function LeadMeetingDocs({
  company,
  primaryContact,
  meetings = [],
  onRefresh
}: LeadMeetingDocsProps) {
  const rJson = ((company as any).research_json && typeof (company as any).research_json === "object")
    ? (company as any).research_json
    : {};

  const existingDocs: MeetingDoc[] = Array.isArray(rJson.meeting_docs) ? rJson.meeting_docs : [];
  const [docs, setDocs] = useState<MeetingDoc[]>(existingDocs);

  // Form toggles & states
  const [activeMode, setActiveMode] = useState<"list" | "upload" | "link">("list");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkType, setLinkType] = useState<"link" | "pdf" | "doc" | "sheet" | "presentation">("link");
  const [linkNotes, setLinkNotes] = useState("");

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const freshRJson = ((company as any).research_json && typeof (company as any).research_json === "object")
      ? (company as any).research_json
      : {};
    if (Array.isArray(freshRJson.meeting_docs)) {
      setDocs(freshRJson.meeting_docs);
    }
  }, [company]);

  const hasDocs = docs.length > 0;

  const formatBytes = (bytes: number) => {
    if (!+bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Add Link Handler
  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() || !linkUrl.trim()) {
      addToast("error", "Please provide both document title and link URL");
      return;
    }

    let cleanUrl = linkUrl.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    const newDoc: MeetingDoc = {
      id: "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      title: linkTitle.trim(),
      type: linkType,
      url: cleanUrl,
      notes: linkNotes.trim() || undefined,
      addedAt: new Date().toISOString()
    };

    const updatedDocs = [newDoc, ...docs];
    setDocs(updatedDocs);
    setActiveMode("list");
    setLinkTitle("");
    setLinkUrl("");
    setLinkNotes("");

    const res = await saveCompanyMeetingDocsAndSDRSheet(company.id, {
      meeting_docs: updatedDocs
    });

    if (res.error) {
      addToast("error", "Failed to save link: " + res.error);
    } else {
      addToast("success", `Document link "${newDoc.title}" added`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lead-updated", { detail: { companyId: company.id } }));
      }
      if (onRefresh) onRefresh();
    }
  };

  // Upload File Handler
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      addToast("error", "Please select a file to upload");
      return;
    }

    if (uploadFile.size > 15 * 1024 * 1024) {
      addToast("error", "File is too large (max 15MB). Consider using an external document link.");
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        let detectedType: MeetingDoc["type"] = "other";
        const nameLower = uploadFile.name.toLowerCase();
        if (uploadFile.type.includes("pdf") || nameLower.endsWith(".pdf")) detectedType = "pdf";
        else if (uploadFile.type.includes("sheet") || nameLower.endsWith(".xlsx") || nameLower.endsWith(".csv")) detectedType = "sheet";
        else if (uploadFile.type.includes("presentation") || nameLower.endsWith(".pptx") || nameLower.endsWith(".ppt")) detectedType = "presentation";
        else if (uploadFile.type.includes("word") || uploadFile.type.includes("document") || nameLower.endsWith(".docx") || nameLower.endsWith(".doc")) detectedType = "doc";

        const newDoc: MeetingDoc = {
          id: "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
          title: uploadTitle.trim() || uploadFile.name,
          type: detectedType,
          data: base64Data,
          fileName: uploadFile.name,
          fileSize: formatBytes(uploadFile.size),
          notes: uploadNotes.trim() || undefined,
          addedAt: new Date().toISOString()
        };

        const updatedDocs = [newDoc, ...docs];
        setDocs(updatedDocs);
        setActiveMode("list");
        setUploadFile(null);
        setUploadTitle("");
        setUploadNotes("");

        const res = await saveCompanyMeetingDocsAndSDRSheet(company.id, {
          meeting_docs: updatedDocs
        });

        if (res.error) {
          addToast("error", "Failed to save file: " + res.error);
        } else {
          addToast("success", `Document "${newDoc.title}" uploaded`);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("lead-updated", { detail: { companyId: company.id } }));
          }
          if (onRefresh) onRefresh();
        }
      };

      reader.onerror = () => {
        addToast("error", "Failed to read file.");
      };

      reader.readAsDataURL(uploadFile);
    } catch (err) {
      addToast("error", "File upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // Delete Doc Handler
  const handleDeleteDoc = async (docId: string, title: string) => {
    if (!confirm(`Delete meeting document "${title}"?`)) return;
    const updatedDocs = docs.filter(d => d.id !== docId);
    setDocs(updatedDocs);

    const res = await saveCompanyMeetingDocsAndSDRSheet(company.id, {
      meeting_docs: updatedDocs
    });

    if (res.error) {
      addToast("error", "Failed to remove doc: " + res.error);
    } else {
      addToast("success", `Removed "${title}"`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lead-updated", { detail: { companyId: company.id } }));
      }
      if (onRefresh) onRefresh();
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Status Banner ───────────────────────────────────────────────── */}
      {!hasDocs ? (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <span>No meeting documents attached yet. Upload PDFs, decks, or add external links for SDR calls.</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setActiveMode("upload")}
              className="text-xs font-medium text-amber-900 underline underline-offset-2 hover:text-black cursor-pointer"
            >
              Upload PDF
            </button>
            <span className="text-amber-400">·</span>
            <button
              onClick={() => setActiveMode("link")}
              className="text-xs font-medium text-amber-900 underline underline-offset-2 hover:text-black cursor-pointer"
            >
              Add Link
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>{docs.length} meeting document{docs.length !== 1 ? "s" : ""} attached</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMode(activeMode === "upload" ? "list" : "upload")}
              className="text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer font-medium"
            >
              + Upload File
            </button>
            <span className="text-neutral-300">·</span>
            <button
              onClick={() => setActiveMode(activeMode === "link" ? "list" : "link")}
              className="text-xs text-neutral-600 hover:text-neutral-900 cursor-pointer font-medium"
            >
              + Add Link
            </button>
          </div>
        </div>
      )}

      {/* ── Upload File Form ────────────────────────────────────────────── */}
      {activeMode === "upload" && (
        <form onSubmit={handleFileUpload} className="p-4 rounded-lg border border-neutral-200 bg-neutral-50 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-neutral-800">Upload Document / PDF (Max 15MB)</span>
            <button
              type="button"
              onClick={() => setActiveMode("list")}
              className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Document Title</label>
              <Input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Tadbeer Proposal Deck V2"
                className="bg-white text-xs h-8"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Select File</label>
              <input
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setUploadFile(f);
                    if (!uploadTitle) setUploadTitle(f.name.replace(/\.[^/.]+$/, ""));
                  }
                }}
                className="block w-full text-xs text-neutral-700 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:bg-neutral-100 file:text-neutral-700 hover:file:bg-neutral-200 cursor-pointer bg-white border border-neutral-200 rounded-md p-1"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] text-neutral-400 block mb-1">Context Notes (Optional)</label>
              <Input
                type="text"
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder="e.g. Scoping document prepared for discovery call"
                className="bg-white text-xs h-8"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={!uploadFile || isUploading}
              size="sm"
              className="text-xs h-7 px-3"
            >
              {isUploading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Upload className="h-3 w-3 mr-1" />}
              Save Document
            </Button>
          </div>
        </form>
      )}

      {/* ── Add Link Form ───────────────────────────────────────────────── */}
      {activeMode === "link" && (
        <form onSubmit={handleAddLink} className="p-4 rounded-lg border border-neutral-200 bg-neutral-50 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium text-neutral-800">Add External Document Link</span>
            <button
              type="button"
              onClick={() => setActiveMode("list")}
              className="text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Document Title *</label>
              <Input
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="e.g. Google Docs Agenda"
                className="bg-white text-xs h-8"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Link URL *</label>
              <Input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://docs.google.com/..."
                className="bg-white text-xs h-8"
              />
            </div>

            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Type</label>
              <select
                value={linkType}
                onChange={(e) => setLinkType(e.target.value as any)}
                className="w-full h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-300"
              >
                <option value="link">Web Document / Link</option>
                <option value="pdf">Cloud PDF</option>
                <option value="doc">Google Doc / Word</option>
                <option value="sheet">Spreadsheet / Sheet</option>
                <option value="presentation">Pitch Deck / Slides</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="text-[10px] text-neutral-400 block mb-1">Context Notes (Optional)</label>
              <Input
                type="text"
                value={linkNotes}
                onChange={(e) => setLinkNotes(e.target.value)}
                placeholder="e.g. Contains competitor analysis and SLA terms"
                className="bg-white text-xs h-8"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              size="sm"
              className="text-xs h-7 px-3"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Link
            </Button>
          </div>
        </form>
      )}

      {/* ── Document List ───────────────────────────────────────────────── */}
      {docs.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-neutral-200 rounded-lg space-y-2">
          <FileText className="h-7 w-7 text-neutral-300 mx-auto" />
          <p className="text-xs text-neutral-600 font-medium">No documents uploaded yet</p>
          <p className="text-[11px] text-neutral-400 max-w-sm mx-auto">
            Attach PDFs, proposals, or document links so your SDR has quick access during sales calls.
          </p>
          <div className="flex justify-center gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setActiveMode("upload")} className="text-xs h-7">
              <Upload className="h-3 w-3 mr-1" /> Upload PDF / File
            </Button>
            <Button size="sm" variant="outline" onClick={() => setActiveMode("link")} className="text-xs h-7">
              <LinkIcon className="h-3 w-3 mr-1" /> Add Doc Link
            </Button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 border border-neutral-200 rounded-lg overflow-hidden bg-white">
          {docs.map((doc) => {
            const isDownloadable = !!doc.data;
            const isUrl = !!doc.url;

            return (
              <div key={doc.id} className="p-3.5 flex items-start justify-between gap-3 hover:bg-neutral-50/50 transition">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase bg-neutral-100 text-neutral-500 border border-neutral-200">
                      {doc.type}
                    </span>
                    <span className="text-xs font-medium text-neutral-900 truncate">{doc.title}</span>
                    {doc.fileSize && (
                      <span className="text-[10px] text-neutral-400">({doc.fileSize})</span>
                    )}
                  </div>

                  {doc.notes && (
                    <p className="text-[11px] text-neutral-500 line-clamp-1">{doc.notes}</p>
                  )}

                  <div className="flex items-center gap-3 pt-0.5 text-[11px]">
                    {isUrl ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-neutral-700 hover:text-black underline underline-offset-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open Link
                      </a>
                    ) : isDownloadable ? (
                      <a
                        href={doc.data}
                        download={doc.fileName || `${doc.title}.pdf`}
                        className="inline-flex items-center gap-1 text-neutral-700 hover:text-black underline underline-offset-2"
                      >
                        <Download className="h-3 w-3" />
                        Download {doc.fileName ? `(${doc.fileName})` : "File"}
                      </a>
                    ) : null}

                    <span className="text-neutral-300">·</span>
                    <span className="text-neutral-400 text-[10px]">
                      Added {new Date(doc.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteDoc(doc.id, doc.title)}
                  className="p-1 text-neutral-300 hover:text-red-600 transition cursor-pointer"
                  title="Delete document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
