"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  User,
  Save,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCompany } from "@/lib/actions/companies";

export default function NewProspectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    website: "",
    linkedin: "",
    phone: "",
    email: "",
    country: "",
    city: "",
    employeeCount: "",
    notes: "",
    contactName: "",
    contactTitle: "",
    contactEmail: "",
    contactPhone: "",
    contactWhatsapp: "",
    contactLinkedin: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const result = await createCompany({
        company_name: form.companyName,
        industry: form.industry || undefined,
        website: form.website || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        notes: form.notes || undefined,
        firstContact: form.contactName
          ? {
              full_name: form.contactName,
              email: form.contactEmail || undefined,
              phone: form.contactPhone || undefined,
              title: form.contactTitle || undefined,
              whatsapp: form.contactWhatsapp || undefined,
              linkedin_url: form.contactLinkedin || undefined,
            }
          : undefined,
      });

      if (result.error) {
        setToast({ type: "error", message: result.error });
      } else {
        setToast({ type: "success", message: "Prospect created successfully!" });
        setTimeout(() => router.push("/prospects"), 1000);
      }
    } catch (err) {
      setToast({
        type: "error",
        message: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/prospects">
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Prospect</h1>
          <p className="text-slate-500 mt-1">Add a new company to your prospect pipeline.</p>
        </div>
      </div>

      {toast && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-600" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Company Name *
                  </label>
                  <Input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="e.g. Saudi Digital Solutions"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Industry
                  </label>
                  <Input
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    placeholder="e.g. Technology, Finance, Healthcare"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Website
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      name="website"
                      value={form.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    LinkedIn URL
                  </label>
                  <Input
                    name="linkedin"
                    value={form.linkedin}
                    onChange={handleChange}
                    placeholder="LinkedIn URL"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+966 55 123 4567"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="info@company.com"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Employee Count
                  </label>
                  <Input
                    name="employeeCount"
                    type="number"
                    value={form.employeeCount}
                    onChange={handleChange}
                    placeholder="e.g. 200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Country
                  </label>
                  <Input
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    placeholder="e.g. Saudi Arabia"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="e.g. Riyadh"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-amber-600" />
                Primary Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Full Name *
                  </label>
                  <Input
                    name="contactName"
                    value={form.contactName}
                    onChange={handleChange}
                    placeholder="e.g. Mohammed Al-Farsi"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Title / Position
                  </label>
                  <Input
                    name="contactTitle"
                    value={form.contactTitle}
                    onChange={handleChange}
                    placeholder="e.g. CTO, VP Engineering"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      name="contactEmail"
                      type="email"
                      value={form.contactEmail}
                      onChange={handleChange}
                      placeholder="name@company.com"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      name="contactPhone"
                      value={form.contactPhone}
                      onChange={handleChange}
                      placeholder="+966 55 123 4567"
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    WhatsApp
                  </label>
                  <Input
                    name="contactWhatsapp"
                    value={form.contactWhatsapp}
                    onChange={handleChange}
                    placeholder="+966 55 123 4567"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    LinkedIn
                  </label>
                  <Input
                    name="contactLinkedin"
                    value={form.contactLinkedin}
                    onChange={handleChange}
                    placeholder="LinkedIn URL"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any additional notes about this prospect..."
                rows={5}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <Link href="/prospects">
          <Button variant="outline" type="button">Cancel</Button>
        </Link>
        <Button
          type="submit"
          className="bg-teal-600 hover:bg-teal-700 text-white"
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? "Creating..." : "Create Prospect"}
        </Button>
      </div>
    </form>
  );
}
