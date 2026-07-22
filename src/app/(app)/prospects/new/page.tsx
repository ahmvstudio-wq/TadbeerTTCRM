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
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCompany } from "@/lib/actions/companies";

export default function NewProspectPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    phone: "",
    industry: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim() || !form.contactName.trim() || !form.phone.trim()) {
      setToast({ type: "error", message: "Please fill in Company Name, Contact Name, and Phone Number." });
      return;
    }

    setSaving(true);
    setToast(null);

    try {
      const cleanPhone = form.phone.trim();
      const result = await createCompany({
        company_name: form.companyName.trim(),
        industry: form.industry.trim() || "General",
        phone: cleanPhone,
        city: "Muscat",
        country: "Oman",
        firstContact: {
          full_name: form.contactName.trim(),
          phone: cleanPhone,
          whatsapp: cleanPhone,
          title: "Decision Maker",
        },
      });

      if (result.error) {
        setToast({ type: "error", message: result.error });
      } else {
        setToast({ type: "success", message: `Prospect "${form.companyName}" added successfully!` });
        setTimeout(() => router.push("/prospects"), 800);
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
    <div className="max-w-xl mx-auto py-4 space-y-6 page-enter">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Link href="/prospects">
          <Button variant="outline" size="icon" type="button" className="h-9 w-9 bg-white hover:bg-slate-50 border-border text-text-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-teal" />
            Quick Add Prospect
          </h1>
          <p className="text-text-secondary text-xs sm:text-sm mt-0.5">
            Add a new prospect to your active CRM pipeline in seconds.
          </p>
        </div>
      </div>

      {toast && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${
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

      <Card className="border-border bg-white shadow-xs rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/70 p-4 border-b border-border/60">
          <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
            Essential Prospect Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-text-primary mb-1.5 block">
                Company Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  placeholder="e.g. 350 Youth Clothing"
                  className="pl-9 h-10 text-xs sm:text-sm bg-white"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary mb-1.5 block">
                Contact Person Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  name="contactName"
                  value={form.contactName}
                  onChange={handleChange}
                  placeholder="e.g. Abdul Aziz"
                  className="pl-9 h-10 text-xs sm:text-sm bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary mb-1.5 block">
                Phone / WhatsApp Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                <Input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="e.g. +968 9123 4567"
                  className="pl-9 h-10 text-xs sm:text-sm bg-white"
                  required
                />
              </div>
              <p className="text-[10px] text-text-secondary mt-1">Used for WhatsApp proposal delivery and closer callback queue.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-text-secondary mb-1.5 block">
                Industry (Optional)
              </label>
              <Input
                name="industry"
                value={form.industry}
                onChange={handleChange}
                placeholder="e.g. Fashion & Retail, Lighting, Flowers..."
                className="h-9 text-xs bg-slate-50/50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
              <Link href="/prospects">
                <Button variant="outline" type="button" className="text-xs h-9 px-4">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs font-bold h-9 px-5 hover-lift press-effect"
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? "Saving..." : "Save Prospect"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
