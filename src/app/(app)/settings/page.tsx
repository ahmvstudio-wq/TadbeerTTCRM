"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { UserCog, Building2, Palette, Shield } from "lucide-react";

const users = [
  { name: "Ahmed Al-Rashid", email: "ahmed@tadbeer.com", role: "admin", status: "Active" },
  { name: "Ismail Khan", email: "ismail@tadbeer.com", role: "closer", status: "Active" },
  { name: "Fatima Hassan", email: "fatima@tadbeer.com", role: "bd_rep", status: "Active" },
];

const roleColors: Record<string, string> = {
  admin: "bg-amber-100 text-amber-700",
  closer: "bg-teal-100 text-teal-700",
  bd_rep: "bg-blue-100 text-blue-700",
};

const roleLabels: Record<string, string> = {
  admin: "Admin",
  closer: "Closer",
  bd_rep: "BD Rep",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your CRM configuration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <Input defaultValue="Tadbeer Transformation Trading" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Default Currency</label>
              <Select options={[{ value: "SAR", label: "SAR - Saudi Riyal" }, { value: "AED", label: "AED - UAE Dirham" }, { value: "USD", label: "USD - US Dollar" }]} defaultValue="SAR" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Daily Outreach Target</label>
              <Input type="number" defaultValue={10} />
            </div>
            <Button className="w-full">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-teal-600" />
              <CardTitle>Team Members</CardTitle>
            </div>
            <Button size="sm">Add Member</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Name</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Role</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.email} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900">{user.name}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <Badge className={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-100 text-green-700">{user.status}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
  );
}
