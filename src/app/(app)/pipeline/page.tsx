"use client";

import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, Loader2, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { getOpportunities, createOpportunity, updateOpportunityStage } from "@/lib/actions/opportunities";
import { deleteOpportunity } from "@/lib/actions/delete";
import { getCompanies } from "@/lib/actions/companies";
import { OPPORTUNITY_STAGES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

const STAGE_COLORS: Record<string, string> = {
  qualified: "bg-blue-100 text-blue-700",
  proposal_sent: "bg-amber-100 text-amber-700",
  negotiation: "bg-purple-100 text-purple-700",
  verbal_commit: "bg-teal-100 text-teal-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
};

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [newForm, setNewForm] = useState({ company_id: "", title: "", estimated_value: "", stage: "qualified", description: "" });

  const fetchData = async () => {
    setLoading(true);
    const [oRes, cRes] = await Promise.all([getOpportunities(), getCompanies()]);
    if (oRes.data) setOpportunities(oRes.data);
    if (cRes.data) setCompanies(cRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const activeOpps = opportunities.filter((o) => o.stage !== "won" && o.stage !== "lost");
  const totalValue = activeOpps.reduce((sum, o) => sum + (Number(o.estimated_value) || 0), 0);
  const weightedValue = activeOpps.reduce((sum, o) => sum + (Number(o.estimated_value) || 0) * ((o.probability || 0) / 100), 0);

  const handleCreate = async () => {
    if (!newForm.company_id || !newForm.title || !newForm.estimated_value) return;
    const result = await createOpportunity({
      company_id: newForm.company_id,
      title: newForm.title,
      estimated_value: parseFloat(newForm.estimated_value),
      stage: newForm.stage,
      description: newForm.description || undefined,
    });
    if (result.error) { setToast({ type: "error", message: result.error }); return; }
    setNewDialogOpen(false);
    setNewForm({ company_id: "", title: "", estimated_value: "", stage: "qualified", description: "" });
    setToast({ type: "success", message: "Opportunity created" });
    fetchData();
  };

  const handleStageChange = async (id: string, stage: string) => {
    const result = await updateOpportunityStage(id, stage);
    if (result.error) { setToast({ type: "error", message: result.error }); return; }
    setToast({ type: "success", message: "Stage updated" });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this opportunity?")) return;
    const result = await deleteOpportunity(id);
    if (result.error) { setToast({ type: "error", message: result.error }); return; }
    setToast({ type: "success", message: "Opportunity deleted" });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin h-8 w-8 text-brand-teal" /></div>;

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-6">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.message}<button onClick={() => setToast(null)} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline & Deals</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Track your sales opportunities and deal pipeline.</p>
        </div>
        <Button className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs px-3 h-8 self-start sm:self-auto" onClick={() => setNewDialogOpen(true)}>+ New Opportunity</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-text-muted">Total Pipeline</p><p className="text-2xl font-bold text-text-primary">{formatCurrency(totalValue)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-text-muted">Weighted Value</p><p className="text-2xl font-bold text-brand-teal">{formatCurrency(weightedValue)}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-sm text-text-muted">Active Opportunities</p><p className="text-2xl font-bold text-text-primary">{activeOpps.length}</p></CardContent></Card>
      </div>

      {activeOpps.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <TrendingUp className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-text-muted">No active opportunities. Create one to get started.</p>
        </CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>Active Deals</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Deal</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Company</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-text-secondary uppercase">Stage</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Value</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Probability</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-text-secondary uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOpps.map((opp) => (
                    <tr key={opp.id} className="border-b border-border-light hover:bg-surface-hover">
                      <td className="py-3 px-4 text-sm font-medium text-text-primary">{opp.title}</td>
                      <td className="py-3 px-4 text-sm text-text-secondary">{opp.companies?.company_name || "Unknown"}</td>
                      <td className="py-3 px-4">
                        <select
                          value={opp.stage}
                          onChange={(e) => handleStageChange(opp.id, e.target.value)}
                          className={cn("text-xs font-medium rounded-full px-2 py-1 border-0", STAGE_COLORS[opp.stage])}
                        >
                          {Object.entries(OPPORTUNITY_STAGES).filter(([k]) => k !== "won" && k !== "lost").map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4 text-sm text-text-primary text-right font-medium">{formatCurrency(Number(opp.estimated_value) || 0)}</td>
                      <td className="py-3 px-4 text-sm text-text-secondary text-right">{opp.probability}%</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => handleStageChange(opp.id, "won")}>Won</Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleStageChange(opp.id, "lost")}>Lost</Button>
                          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(opp.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={newDialogOpen} onClose={() => setNewDialogOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Opportunity</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-slate-700 mb-1 block">Company *</label><Select options={companies.map((c) => ({ value: c.id, label: c.company_name }))} value={newForm.company_id} onChange={(e) => setNewForm({ ...newForm, company_id: e.target.value })} placeholder="Select company" /></div>
            <div><label className="text-sm font-medium text-slate-700 mb-1 block">Title *</label><Input placeholder="Deal title" value={newForm.title} onChange={(e) => setNewForm({ ...newForm, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">Value (OMR) *</label><Input type="number" placeholder="e.g. 100000" value={newForm.estimated_value} onChange={(e) => setNewForm({ ...newForm, estimated_value: e.target.value })} /></div>
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">Stage</label><Select options={Object.entries(OPPORTUNITY_STAGES).map(([k, v]) => ({ value: k, label: v.label }))} value={newForm.stage} onChange={(e) => setNewForm({ ...newForm, stage: e.target.value })} /></div>
            </div>
            <div><label className="text-sm font-medium text-slate-700 mb-1 block">Description</label><Textarea placeholder="Deal details..." value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button><Button className="bg-brand-teal hover:bg-brand-teal-dark text-white" onClick={handleCreate}>Create Opportunity</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
