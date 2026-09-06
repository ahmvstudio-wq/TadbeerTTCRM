"use client";

import { useState } from "react";
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  Globe,
  Camera,
  Globe2,
  Users,
  MapPin,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Flame,
  Zap,
  Snowflake,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCompany } from "@/lib/actions/companies";

const QUICK_INDUSTRIES = [
  "Retail",
  "F&B / Cafes",
  "Clinics / Health",
  "Fashion & Beauty",
  "Real Estate",
  "Events & Hospitality",
  "Corporate Services",
  "Automotive",
];

const LEAD_SOURCES = [
  "Direct CRM",
  "Inbound Web",
  "LinkedIn",
  "Instagram",
  "Referral",
  "Cold Outreach",
  "WhatsApp Campaign",
];

interface AddProspectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (newCompany: any) => void;
}

export function AddProspectModal({ open, onClose, onSuccess }: AddProspectModalProps) {
  const [mode, setMode] = useState<"quick" | "full">("quick");
  const [saving, setSaving] = useState(false);
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    contactTitle: "Managing Director / Owner",
    phone: "",
    whatsapp: "",
    email: "",
    industry: "",
    website: "",
    instagram: "",
    linkedin: "",
    employeeCount: "",
    city: "Muscat",
    country: "Oman",
    leadType: "Warm",
    leadSource: "Direct CRM",
    researchNotes: "",
  });

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "phone" && sameAsPhone) {
        next.whatsapp = value;
      }
      return next;
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm((prev) => ({
      ...prev,
      phone: val,
      whatsapp: sameAsPhone ? val : prev.whatsapp,
    }));
  };

  const handleQuickIndustry = (ind: string) => {
    setForm((prev) => ({ ...prev, industry: ind }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.companyName.trim()) {
      setError("Company Name is required.");
      return;
    }
    if (!form.contactName.trim()) {
      setError("Contact Person Name is required.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Phone number is required for outreach.");
      return;
    }

    setSaving(true);

    try {
      const result = await createCompany({
        company_name: form.companyName.trim(),
        industry: form.industry.trim() || "General Business",
        website: form.website.trim() || undefined,
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        city: form.city.trim() || "Muscat",
        country: form.country.trim() || "Oman",
        instagram_url: form.instagram.trim() || undefined,
        research_notes: form.researchNotes.trim() || undefined,
        lead_source: form.leadSource,
        lead_type: form.leadType,
        employee_count: form.employeeCount ? parseInt(form.employeeCount) : undefined,
        firstContact: {
          full_name: form.contactName.trim(),
          title: form.contactTitle.trim() || "Owner / Decision Maker",
          phone: form.phone.trim(),
          whatsapp: (sameAsPhone ? form.phone : form.whatsapp).trim() || form.phone.trim(),
          email: form.email.trim() || undefined,
          linkedin_url: form.linkedin.trim() || undefined,
        },
      });

      if (result.error) {
        setError(result.error);
      } else {
        // Reset form
        setForm({
          companyName: "",
          contactName: "",
          contactTitle: "Managing Director / Owner",
          phone: "",
          whatsapp: "",
          email: "",
          industry: "",
          website: "",
          instagram: "",
          linkedin: "",
          employeeCount: "",
          city: "Muscat",
          country: "Oman",
          leadType: "Warm",
          leadSource: "Direct CRM",
          researchNotes: "",
        });
        if (onSuccess) onSuccess(result.data);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create prospect. Please check fields.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden z-10 font-sans">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#0f343c] text-white flex items-center justify-center shadow-xs">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Add New Prospect
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Manual Entry
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Capture single lead with all verified contact data points.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Selector Pill */}
        <div className="px-5 pt-4 pb-1 bg-white flex items-center justify-between gap-2 border-b border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Entry Depth:
          </span>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setMode("quick")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                mode === "quick"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              Fast Add (4 Core Fields)
            </button>
            <button
              type="button"
              onClick={() => setMode("full")}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                mode === "full"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              Complete Profile (All Data Points)
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Core Company & Contact */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="e.g. Al Huda Modern Trading"
                  className="h-9 text-xs"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Decision Maker Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="contactName"
                  value={form.contactName}
                  onChange={handleChange}
                  placeholder="e.g. Salim Al Maamari"
                  className="h-9 text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  Primary Phone / Mobile <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="phone"
                  value={form.phone}
                  onChange={handlePhoneChange}
                  placeholder="+968 9123 4567"
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    WhatsApp Number
                  </label>
                  <label className="text-[11px] text-slate-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={(e) => {
                        setSameAsPhone(e.target.checked);
                        if (e.target.checked) {
                          setForm((prev) => ({ ...prev, whatsapp: prev.phone }));
                        }
                      }}
                      className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3 w-3"
                    />
                    Same as phone
                  </label>
                </div>
                <Input
                  name="whatsapp"
                  value={form.whatsapp}
                  onChange={handleChange}
                  disabled={sameAsPhone}
                  placeholder="+968 9123 4567"
                  className={`h-9 text-xs font-mono ${sameAsPhone ? "bg-slate-50 text-slate-500" : ""}`}
                />
              </div>
            </div>

            {/* Industry quick selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Industry / Sector
              </label>
              <Input
                name="industry"
                value={form.industry}
                onChange={handleChange}
                placeholder="e.g. Retail, Medical Clinic, Real Estate..."
                className="h-9 text-xs mb-2"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {QUICK_INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => handleQuickIndustry(ind)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border font-medium transition-all ${
                      form.industry === ind
                        ? "bg-[#0f343c] text-white border-[#0f343c]"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Full Data Points (Shown in Full Mode) */}
          {mode === "full" && (
            <div className="space-y-4 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
              {/* Designation & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    Contact Title / Designation
                  </label>
                  <Input
                    name="contactTitle"
                    value={form.contactTitle}
                    onChange={handleChange}
                    placeholder="e.g. Managing Director, CEO, Founder"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    Email Address
                  </label>
                  <Input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="contact@company.om"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Digital Presence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    Website URL
                  </label>
                  <Input
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="https://company.om"
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5 text-pink-500" />
                    Instagram Handle / URL
                  </label>
                  <Input
                    name="instagram"
                    value={form.instagram}
                    onChange={handleChange}
                    placeholder="@company or https://instagram.com/..."
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Globe2 className="h-3.5 w-3.5 text-blue-600" />
                    LinkedIn Profile URL
                  </label>
                  <Input
                    name="linkedin"
                    value={form.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/..."
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    Estimated Employees
                  </label>
                  <Input
                    name="employeeCount"
                    type="number"
                    value={form.employeeCount}
                    onChange={handleChange}
                    placeholder="e.g. 15"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Lead Priority & Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Lead Priority / Temperature
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { type: "Hot", icon: Flame, color: "text-rose-600 border-rose-200 bg-rose-50" },
                      { type: "Warm", icon: Zap, color: "text-amber-600 border-amber-200 bg-amber-50" },
                      { type: "Cold", icon: Snowflake, color: "text-blue-600 border-blue-200 bg-blue-50" },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, leadType: item.type }))}
                        className={`py-1.5 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                          form.leadType === item.type
                            ? item.color + " ring-1 ring-offset-1"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                        {item.type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Lead Channel / Source
                  </label>
                  <select
                    name="leadSource"
                    value={form.leadSource}
                    onChange={handleChange}
                    className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium text-slate-700"
                  >
                    {LEAD_SOURCES.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location (City & Country) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    City / Governorate
                  </label>
                  <Input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Muscat, Sohar, Salalah..."
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    Country
                  </label>
                  <Input
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    placeholder="Oman"
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Research Notes (Direct AI Injection) */}
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-teal-600" />
                    Strategic Research Notes
                  </span>
                  <span className="text-[10px] font-mono text-teal-700 font-medium">
                    Auto-feeds AI Outreach Generator
                  </span>
                </label>
                <Textarea
                  name="researchNotes"
                  value={form.researchNotes}
                  onChange={handleChange}
                  placeholder="e.g. Recently opened a new branch in Al Khoudh. Very active marketing presence on Instagram. No online booking portal currently visible."
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Directly staged for outreach cadence
            </p>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="h-9 px-4 text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-9 px-5 text-xs font-bold bg-[#0f343c] hover:bg-[#091f24] text-white shadow-xs flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{mode === "quick" ? "Save Prospect" : "Save Full Profile"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
