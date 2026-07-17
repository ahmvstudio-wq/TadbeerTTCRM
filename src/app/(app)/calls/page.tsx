"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Phone, CheckCircle, Loader2, Trash2, X } from "lucide-react";
import { getCallQueue, recordCall } from "@/lib/actions/calls";
import { deleteCall } from "@/lib/actions/delete";
import { getCompanies } from "@/lib/actions/companies";

const outcomeOptions = [
  { value: "connected", label: "Connected" },
  { value: "no_answer", label: "No Answer" },
  { value: "left_voicemail", label: "Left Voicemail" },
  { value: "wrong_number", label: "Wrong Number" },
  { value: "callback_requested", label: "Callback Requested" },
  { value: "do_not_call", label: "Do Not Call" },
];

const outcomeColors: Record<string, string> = {
  connected: "bg-green-100 text-green-700",
  no_answer: "bg-slate-100 text-slate-700",
  left_voicemail: "bg-blue-100 text-blue-700",
  wrong_number: "bg-red-100 text-red-700",
  callback_requested: "bg-amber-100 text-amber-700",
  do_not_call: "bg-red-100 text-red-700",
};

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<any>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [callForm, setCallForm] = useState({ outcome: "connected", duration: "", notes: "", follow_up_needed: false, follow_up_date: "" });

  const fetchData = async () => {
    setLoading(true);
    const [qRes, coRes] = await Promise.all([getCallQueue(), getCompanies()]);
    if (qRes.data) setCalls(qRes.data);
    if (coRes.data) setCompanies(coRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  function startCall(item: any) {
    setActiveCall(item);
    setCallForm({ outcome: "connected", duration: "", notes: "", follow_up_needed: false, follow_up_date: "" });
    setCallDialogOpen(true);
  }

  async function completeCall() {
    if (!activeCall) return;
    const result = await recordCall({
      call_queue_id: activeCall.id,
      company_id: activeCall.company_id,
      contact_id: activeCall.contact_id,
      duration_seconds: parseInt(callForm.duration) * 60 || 0,
      outcome: callForm.outcome,
      notes: callForm.notes || undefined,
      follow_up_needed: callForm.follow_up_needed,
      follow_up_date: callForm.follow_up_date || undefined,
    });
    if (result.error) { setToast({ type: "error", message: result.error }); return; }
    setCallDialogOpen(false);
    setToast({ type: "success", message: "Call recorded" });
    fetchData();
  }

  const handleDeleteCompleted = async (id: string) => {
    if (!confirm("Delete this call record?")) return;
    const result = await deleteCall(id);
    if (result.error) { setToast({ type: "error", message: result.error }); return; }
    setToast({ type: "success", message: "Call deleted" });
    setCompleted((prev) => prev.filter((c) => c.id !== id));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin h-8 w-8 text-brand-teal" /></div>;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.message}<button onClick={() => setToast(null)} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Call Queue</h1>
          <p className="text-slate-500 mt-1">{calls.length} calls pending</p>
        </div>
        <Badge className="bg-brand-teal-light text-brand-teal">{calls.length} Pending</Badge>
      </div>

      {calls.length > 0 ? (
        <div className="space-y-3">
          {calls.map((item: any) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="bg-brand-teal-light p-2 rounded-lg mt-0.5"><Phone className="h-5 w-5 text-brand-teal" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text-primary">{item.companies?.company_name || "Unknown"}</h3>
                      <p className="text-xs text-text-muted mt-0.5">{item.contacts?.full_name || "No contact"}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                        {item.companies?.phone && <span>Phone: {item.companies.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <Button className="bg-brand-teal hover:bg-brand-teal-dark text-white" onClick={() => startCall(item)}>
                    <Phone className="h-4 w-4 mr-1" /> Call Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-text-primary">All caught up!</h3>
            <p className="text-text-muted mt-1">No pending calls in the queue.</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={callDialogOpen} onClose={() => setCallDialogOpen(false)}>
        <DialogHeader>
          <DialogTitle>Record Call - {activeCall?.companies?.company_name}</DialogTitle>
          <DialogClose onClick={() => setCallDialogOpen(false)} />
        </DialogHeader>
        <DialogContent className="space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Call Outcome</label><Select options={outcomeOptions} value={callForm.outcome} onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label><Input type="number" value={callForm.duration} onChange={(e) => setCallForm({ ...callForm, duration: e.target.value })} placeholder="e.g. 15" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><Textarea rows={3} value={callForm.notes} onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })} placeholder="Call notes, key points discussed..." /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="followUp" checked={callForm.follow_up_needed} onChange={(e) => setCallForm({ ...callForm, follow_up_needed: e.target.checked })} className="rounded" />
            <label htmlFor="followUp" className="text-sm text-slate-700">Schedule follow-up</label>
          </div>
          {callForm.follow_up_needed && (
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Follow-up Date</label><Input type="date" value={callForm.follow_up_date} onChange={(e) => setCallForm({ ...callForm, follow_up_date: e.target.value })} /></div>
          )}
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setCallDialogOpen(false)}>Cancel</Button>
          <Button onClick={completeCall} className="bg-brand-teal hover:bg-brand-teal-dark text-white">Save Call</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
