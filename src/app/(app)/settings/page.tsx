"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Building2, Palette, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your CRM configuration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-500" />
              <CardTitle>Company</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
              <Input defaultValue="Tadbeer TT" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Daily Outreach Target</label>
              <Input type="number" defaultValue={10} />
            </div>
            <Button className="w-full">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              <CardTitle>Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Authentication is managed via Supabase Auth. Configure SSO and MFA in the Supabase dashboard.</p>
          </CardContent>
        </Card>
      </div>

      {/* Service Lines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-purple-500" />
            <CardTitle>Service Lines</CardTitle>
          </div>
          <Button size="sm">Add Service Line</Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {["Software Solutions", "AI Technology", "Digital Marketing", "Human Capital"].map((sl) => (
              <div key={sl} className="p-4 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors">
                <p className="font-medium text-slate-900">{sl}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
