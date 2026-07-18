"use client";

import { useState, useEffect } from "react";
import { Send, Users, CheckCircle, Clock, ArrowRight, Plus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ToastContainer, addToast } from "@/components/ui/toast";
import { getCompanies } from "@/lib/actions/companies";
import { saveCampaign, getCampaigns, getReachedLeads, getTouches } from "@/lib/actions/outreach";

interface Campaign {
  id: string; name: string; description: string; created_at: string;
  lead_ids: string[]; status: "active" | "completed";
}

interface CampaignStats {
  campaign: Campaign;
  totalLeads: number;
  reachedCount: number;
  touchCount: number;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [reachedIds, setReachedIds] = useState<Set<string>>(new Set());
  const [allTouches, setAllTouches] = useState<any[]>([]);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState({ name: "", description: "" });
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [campsRes, leadsRes, reachedRes, touchesRes] = await Promise.all([
        getCampaigns().catch(() => ({ data: [] })),
        getCompanies().catch(() => ({ data: [] })),
        getReachedLeads().catch(() => ({ data: [] })),
        getTouches().catch(() => ({ data: [] })),
      ]);

      const camps = (campsRes.data || []).map((c: any) => ({
        id: c.id, name: c.name, description: c.description || "",
        created_at: c.created_at, lead_ids: c.lead_ids || [], status: c.status,
      }));

      const leads = (leadsRes.data || []).map((c: any) => ({
        id: c.id, company_name: c.company_name, contact_name: c.contacts?.[0]?.full_name || "",
      }));

      const reached = new Set(reachedRes.data || []);
      const touches = touchesRes.data || [];

      setAllLeads(leads);
      setReachedIds(reached);
      setAllTouches(touches);

      const stats: CampaignStats[] = camps.map((camp) => ({
        campaign: camp,
        totalLeads: camp.lead_ids.length,
        reachedCount: camp.lead_ids.filter((id: string) => reached.has(id)).length,
        touchCount: touches.filter((t: any) => t.campaign_id === camp.id).length,
      }));

      setCampaigns(stats);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleCreate = async () => {
    if (!campaignForm.name || selectedLeads.size === 0) {
      showToast("error", "Name and at least 1 prospect required");
      return;
    }
    try {
      const result = await saveCampaign({
        name: campaignForm.name,
        description: campaignForm.description,
        lead_ids: Array.from(selectedLeads),
      });
      if (result.error) {
        showToast("error", result.error);
        return;
      }
      showToast("success", `Campaign "${campaignForm.name}" created with ${selectedLeads.size} prospects`);
      setNewCampaignOpen(false);
      setCampaignForm({ name: "", description: "" });
      setSelectedLeads(new Set());
      loadData();
    } catch (err) {
      showToast("error", "Failed to create campaign");
    }
  };

  const reachedList = allLeads.filter((l) => reachedIds.has(l.id));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-brand-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {toast && (
        <div className={cn("flex items-center gap-2 p-3 rounded-xl text-sm fixed top-4 right-4 z-50 shadow-lg animate-slide-in-down",
          toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
        )}>
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <span className="text-xs font-medium">{toast.message}</span>}
          {toast.type === "success" && <span className="text-xs font-medium">{toast.message}</span>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Campaigns</h1>
          <p className="text-text-secondary text-sm mt-0.5">{campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} total</p>
        </div>
        <Button onClick={() => setNewCampaignOpen(true)} className="bg-brand-teal hover:bg-brand-teal-dark text-white hover-lift press-effect">
          <Plus className="h-4 w-4 mr-2" />New Campaign
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 stagger-children">
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-brand-teal">{campaigns.length}</p>
          <p className="text-[10px] text-text-muted">Campaigns</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{campaigns.reduce((s, c) => s + c.totalLeads, 0)}</p>
          <p className="text-[10px] text-text-muted">Total Prospects</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{campaigns.reduce((s, c) => s + c.reachedCount, 0)}</p>
          <p className="text-[10px] text-text-muted">Reached</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-amber-600">{campaigns.reduce((s, c) => s + c.touchCount, 0)}</p>
          <p className="text-[10px] text-text-muted">Total Touches</p>
        </CardContent></Card>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Send className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-text-secondary text-sm mb-3">No campaigns yet. Create one to start outreach.</p>
          <Button size="sm" onClick={() => setNewCampaignOpen(true)} className="bg-brand-teal hover:bg-brand-teal-dark text-white">
            <Plus className="h-3.5 w-3.5 mr-1" />Create First Campaign
          </Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3 stagger-children">
          {campaigns.map((cs) => {
            const reachedPct = cs.totalLeads > 0 ? Math.round((cs.reachedCount / cs.totalLeads) * 100) : 0;
            return (
              <Card key={cs.campaign.id} className="hover-lift">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-brand-teal-light flex items-center justify-center">
                        <Send className="h-5 w-5 text-brand-teal" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">{cs.campaign.name}</h3>
                        {cs.campaign.description && <p className="text-xs text-text-muted">{cs.campaign.description}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-[10px]", cs.campaign.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600")}>{cs.campaign.status}</Badge>
                      <span className="text-xs text-text-muted">{new Date(cs.campaign.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-slate-50">
                      <p className="text-lg font-bold text-text-primary">{cs.totalLeads}</p>
                      <p className="text-[10px] text-text-muted">Prospects</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-emerald-50">
                      <p className="text-lg font-bold text-emerald-600">{cs.reachedCount}</p>
                      <p className="text-[10px] text-text-muted">Reached ({reachedPct}%)</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-amber-50">
                      <p className="text-lg font-bold text-amber-600">{cs.touchCount}</p>
                      <p className="text-[10px] text-text-muted">Touches</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-50">
                      <p className="text-lg font-bold text-blue-600">{cs.totalLeads - cs.reachedCount}</p>
                      <p className="text-[10px] text-text-muted">Remaining</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-brand-teal h-2 rounded-full transition-all duration-500" style={{ width: `${reachedPct}%` }} />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <a href={`/outreach?campaign=${cs.campaign.id}`}>
                      <Button size="sm" variant="outline" className="hover-lift press-effect">
                        Open Campaign <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={newCampaignOpen} onClose={() => setNewCampaignOpen(false)} className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
          <DialogClose onClick={() => setNewCampaignOpen(false)} />
        </DialogHeader>
        <DialogContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Campaign Name *</label>
              <Input value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="e.g. Q3 Oman Outreach" />
            </div>
            <div>
              <label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Description</label>
              <Input value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} placeholder="Optional" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-medium text-text-muted uppercase">Select Prospects ({selectedLeads.size} selected)</label>
              <button onClick={() => setSelectedLeads(selectedLeads.size === allLeads.length ? new Set() : new Set(allLeads.map((l) => l.id)))} className="text-[10px] text-brand-teal hover:underline">
                {selectedLeads.size === allLeads.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto border border-border rounded-xl divide-y divide-border-light">
              {allLeads.length === 0 ? (
                <div className="p-6 text-center text-sm text-text-muted">No prospects in database.</div>
              ) : (
                allLeads.slice(0, 100).map((lead) => (
                  <label key={lead.id} className="flex items-center gap-3 p-2.5 hover:bg-cream-dark/30 cursor-pointer transition-colors">
                    <input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={() => {
                      const n = new Set(selectedLeads);
                      n.has(lead.id) ? n.delete(lead.id) : n.add(lead.id);
                      setSelectedLeads(n);
                    }} className="rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary">{lead.contact_name || lead.company_name}</p>
                      <p className="text-[10px] text-text-muted">{lead.company_name}</p>
                    </div>
                    {reachedIds.has(lead.id) && <Badge className="text-[9px] bg-emerald-100 text-emerald-700">Reached</Badge>}
                  </label>
                ))
              )}
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setNewCampaignOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} className="bg-brand-teal hover:bg-brand-teal-dark text-white">
            Create Campaign
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
