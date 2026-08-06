"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Save,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Globe,
  Link as LinkIcon,
  Camera,
  Users,
  FileText,
  Zap,
  FlaskConical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCompany } from "@/lib/actions/companies";

type Mode = "quick" | "full";

export default function NewProspectPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("quick");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    industry: "",
    website: "",
    linkedin: "",
    instagram: "",
    employeeCount: "",
    researchNotes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.contactName.trim() || !form.phone.trim()) {
      setToast({ type: "error", message: "Company Name, Contact Name, and Phone are required." });
      return;
    }
    if (mode === "full" && !form.industry.trim()) {
      setToast({ type: "error", message: "Industry is required for new leads." });
      return;
    }

    setSaving(true);
    setToast(null);

    try {
      const result = await createCompany({
        company_name: form.companyName.trim(),
        industry: form.industry.trim() || "General",
        website: form.website.trim() || undefined,
        phone: form.phone.trim(),
        instagram_url: form.instagram.trim() || undefined,
        research_notes: form.researchNotes.trim() || undefined,
        lead_source: mode === "full" ? "new_lead" : "quick_add",
        employee_count: form.employeeCount ? parseInt(form.employeeCount) : undefined,
        city: "Muscat",
        country: "Oman",
        firstContact: {
          full_name: form.contactName.trim(),
          phone: form.phone.trim(),
          whatsapp: form.phone.trim(),
          linkedin_url: form.linkedin.trim() || undefined,
          title: "Decision Maker",
        },
      });

      if (result.error) {
        setToast({ type: "error", message: result.error });
      } else {
        setToast({ type: "success", message: `"${form.companyName}" added successfully!` });
        setTimeout(() => router.push("/prospects"), 800);
      }
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "An unexpected error occurred" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/prospects">
          <Button variant="outline" size="icon" type="button" className="h-9 w-9 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-teal-600" />
            Add Prospect
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Choose how much information you have available.</p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setMode("quick")}
          className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
            mode === "quick"
              ? "border-teal-500 bg-teal-50 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${mode === "quick" ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"}`}>
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className={`text-sm font-bold ${mode === "quick" ? "text-teal-800" : "text-slate-800"}`}>Quick Add</p>
            <p className={`text-xs mt-0.5 ${mode === "quick" ? "text-teal-600" : "text-slate-500"}`}>
              Name, phone, done. For contacts from existing databases.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode("full")}
          className={`flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all ${
            mode === "full"
              ? "border-violet-500 bg-violet-50 shadow-sm"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${mode === "full" ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500"}`}>
            <FlaskConical className="h-4 w-4" />
          </div>
          <div>
            <p className={`text-sm font-bold ${mode === "full" ? "text-violet-800" : "text-slate-800"}`}>Full New Lead</p>
            <p className={`text-xs mt-0.5 ${mode === "full" ? "text-violet-600" : "text-slate-500"}`}>
              Rich profile + research notes for maximum AI accuracy.
            </p>
          </div>
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

        {/* Core Fields — always shown */}
        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Required Information</p>

          <FormField label="Company Name" required icon={<Building2 className="h-4 w-4 text-slate-400" />}>
            <Input name="companyName" value={form.companyName} onChange={handleChange} placeholder="e.g. Lynx Event Company" className="pl-9 h-10 text-sm bg-white" required autoFocus />
          </FormField>

          <FormField label="Contact Person Name" required icon={<User className="h-4 w-4 text-slate-400" />}>
            <Input name="contactName" value={form.contactName} onChange={handleChange} placeholder="e.g. Mohammed Al Rashdi" className="pl-9 h-10 text-sm bg-white" required />
          </FormField>

          <FormField label="Phone / WhatsApp" required icon={<Phone className="h-4 w-4 text-slate-400" />}>
            <Input name="phone" value={form.phone} onChange={handleChange} placeholder="e.g. +968 9123 4567" className="pl-9 h-10 text-sm bg-white" required />
          </FormField>
        </div>

        {/* Quick Add optional */}
        {mode === "quick" && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1">Optional</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Industry</label>
                <Input name="industry" value={form.industry} onChange={handleChange} placeholder="e.g. Events, Retail..." className="h-9 text-xs bg-slate-50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Website</label>
                <Input name="website" value={form.website} onChange={handleChange} placeholder="https://..." className="h-9 text-xs bg-slate-50" />
              </div>
            </div>
          </div>
        )}

        {/* Full New Lead fields */}
        {mode === "full" && (
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest pb-1">Digital Presence</p>

            <FormField label="Industry" required icon={<Building2 className="h-4 w-4 text-slate-400" />}>
              <Input name="industry" value={form.industry} onChange={handleChange} placeholder="e.g. Fashion, Events, F&B, Real Estate..." className="pl-9 h-10 text-sm bg-white" required />
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Website URL" icon={<Globe className="h-4 w-4 text-slate-400" />}>
                <Input name="website" value={form.website} onChange={handleChange} placeholder="https://example.com" className="pl-9 h-10 text-sm bg-white" />
              </FormField>
              <FormField label="Employee Count" icon={<Users className="h-4 w-4 text-slate-400" />}>
                <Input name="employeeCount" type="number" value={form.employeeCount} onChange={handleChange} placeholder="e.g. 12" className="pl-9 h-10 text-sm bg-white" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="LinkedIn Profile URL" icon={<LinkIcon className="h-4 w-4 text-slate-400" />}>
                <Input name="linkedin" value={form.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." className="pl-9 h-10 text-sm bg-white" />
              </FormField>
              <FormField label="Instagram URL" icon={<Camera className="h-4 w-4 text-slate-400" />}>
                <Input name="instagram" value={form.instagram} onChange={handleChange} placeholder="https://instagram.com/..." className="pl-9 h-10 text-sm bg-white" />
              </FormField>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5 block">
                <FileText className="h-3.5 w-3.5 text-violet-500" />
                Research Notes
                <span className="text-[10px] font-semibold text-slate-400 ml-1 normal-case">(Feeds the AI directly)</span>
              </label>
              <Textarea
                name="researchNotes"
                value={form.researchNotes}
                onChange={handleChange}
                placeholder={"E.g.:\n• Expanding to a new branch in Al Mouj\n• Very active on Instagram, 12k followers\n• Recently ran a Eid campaign – strong seasonal business\n• No visible website – relies on walk-ins"}
                className="text-sm bg-white resize-none border-violet-200 focus:ring-violet-400 rounded-xl min-h-[120px]"
                rows={5}
              />
              <p className="text-[10px] text-slate-400 mt-1.5">These notes are instantly injected into the AI Sales Assistant for this contact.</p>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Link href="/prospects">
            <Button variant="outline" type="button" className="text-xs h-9 px-4">Cancel</Button>
          </Link>
          <Button
            type="submit"
            className={`text-white text-xs font-bold h-9 px-5 ${mode === "full" ? "bg-violet-600 hover:bg-violet-700" : "bg-teal-600 hover:bg-teal-700"}`}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {saving ? "Saving..." : mode === "full" ? "Save Full Lead" : "Quick Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, required, icon, children }: { label: string; required?: boolean; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-slate-700 mb-1.5 block">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">{icon}</div>}
        {children}
      </div>
    </div>
  );
}
