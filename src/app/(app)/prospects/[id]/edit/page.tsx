"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getCompany, updateCompany } from "@/lib/actions/companies";

export default function EditProspectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    website: "",
    phone: "",
    email: "",
    country: "",
    city: "",
    employee_count: "",
    notes: "",
  });

  useEffect(() => {
    async function fetchData() {
      const result = await getCompany(id);
      if (result.data) {
        setForm({
          company_name: result.data.company_name || "",
          industry: result.data.industry || "",
          website: result.data.website || "",
          phone: result.data.phone || "",
          email: result.data.email || "",
          country: result.data.country || "",
          city: result.data.city || "",
          employee_count: result.data.employee_count?.toString() || "",
          notes: result.data.notes || "",
        });
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

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
      const result = await updateCompany(id, {
        company_name: form.company_name,
        industry: form.industry || undefined,
        website: form.website || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        country: form.country || undefined,
        city: form.city || undefined,
        employee_count: form.employee_count ? parseInt(form.employee_count) : undefined,
        notes: form.notes || undefined,
      });

      if (result.error) {
        setToast({ type: "error", message: result.error });
      } else {
        setToast({ type: "success", message: "Prospect updated successfully!" });
        setTimeout(() => router.push(`/prospects/${id}`), 1000);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-teal-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/prospects/${id}`}>
          <Button variant="ghost" size="icon" type="button">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Prospect</h1>
          <p className="text-slate-500 mt-1">Update information for {form.company_name}.</p>
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
          {toast.message}
        </div>
      )}

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
              <label className="text-sm font-medium text-slate-700 mb-1 block">Company Name *</label>
              <Input name="company_name" value={form.company_name} onChange={handleChange} required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Industry</label>
              <Input name="industry" value={form.industry} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Website</label>
              <Input name="website" value={form.website} onChange={handleChange} placeholder="https://example.com" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Phone</label>
              <Input name="phone" value={form.phone} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Email</label>
              <Input name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Employee Count</label>
              <Input name="employee_count" type="number" value={form.employee_count} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Country</label>
              <Input name="country" value={form.country} onChange={handleChange} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">City</label>
              <Input name="city" value={form.city} onChange={handleChange} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea name="notes" value={form.notes} onChange={handleChange} rows={5} placeholder="Any additional notes..." />
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <Link href={`/prospects/${id}`}>
          <Button variant="outline" type="button">Cancel</Button>
        </Link>
        <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
