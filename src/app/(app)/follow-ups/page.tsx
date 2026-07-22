"use client";

import { useState, useEffect } from "react";
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  RotateCcw,
  Building2,
  User,
  Trash2,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getFollowUps, createFollowUp, completeFollowUp, rescheduleFollowUp } from "@/lib/actions/followups";
import { deleteFollowUp } from "@/lib/actions/delete";
import { getCompanies } from "@/lib/actions/companies";

const CHANNEL_ICONS: Record<string, React.ElementType> = { call: Phone, email: Mail, whatsapp: MessageSquare, meeting: Calendar };
const CHANNEL_COLORS: Record<string, string> = { call: "text-brand-teal", email: "text-amber-600", whatsapp: "text-green-600", linkedin: "text-blue-600", meeting: "text-purple-600" };

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState<any>(null);
  const [completeNotes, setCompleteNotes] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [newForm, setNewForm] = useState({ company_id: "", subject: "", description: "", channel: "call", date: "", time: "" });

  const fetchData = async () => {
    setLoading(true);
    const [fuRes, coRes] = await Promise.all([getFollowUps("all"), getCompanies()]);
    if (fuRes.data) setFollowups(fuRes.data);
    if (coRes.data) setCompanies(coRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const today = new Date().toISOString().split("T")[0];
  const dueToday = followups.filter((f) => f.due_date === today && f.status === "pending");
  const overdue = followups.filter((f) => f.due_date < today && f.status === "pending");
  const allPending = followups.filter((f) => f.status === "pending");

  const handleComplete = async () => {
    if (!selectedFollowup) return;
    const result = await completeFollowUp(selectedFollowup.id, completeNotes);
    if (result.error) { setToast({ type: "error", message: result.error }); return; }
    setCompleteDialogOpen(false);
    setSelectedFollowup(null);
    setCompleteNotes("");
    setToast({ type: "success", message: "Follow-up completed" });
    fetchData();
  };

  const handleReschedule = async (id: string) => {
    const newDate = prompt("Enter new date (YYYY-MM-DD):");
    if (newDate) {
      const result = await rescheduleFollowUp(id, newDate);
      if (result.error) { setToast({ type: "error", message: result.error }); return; }
      setToast({ type: "success", message: "Rescheduled" });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this follow-up?")) return;
    const result = await deleteFollowUp(id);
    if (result.error) { setToast({ type: "error", message: result.error }); return; }
    setToast({ type: "success", message: "Follow-up deleted" });
    fetchData();
  };

  const handleNewFollowup = async () => {
    if (!newForm.company_id || !newForm.subject) return;
    const result = await createFollowUp({
      company_id: newForm.company_id,
      subject: newForm.subject,
      description: newForm.description || undefined,
      channel: newForm.channel,
      due_date: newForm.date || today,
      due_time: newForm.time || undefined,
    });
    if (result.error) { setToast({ type: "error", message: result.error }); return; }
    setNewDialogOpen(false);
    setNewForm({ company_id: "", subject: "", description: "", channel: "call", date: "", time: "" });
    setToast({ type: "success", message: "Follow-up created" });
    fetchData();
  };

  const renderFollowupCard = (followup: any) => {
    const isOverdue = followup.due_date < today && followup.status === "pending";
    const isDueToday = followup.due_date === today && followup.status === "pending";
    const Icon = CHANNEL_ICONS[followup.channel] || Phone;
    const companyName = followup.companies?.company_name || "Unknown";
    const contactName = followup.contacts?.full_name || "";

    return (
      <Card key={followup.id} className={cn("mb-3 transition-all hover:shadow-md", isOverdue && "bg-red-50/70 border-red-200", isDueToday && "bg-amber-50/70 border-amber-200")}>
        <CardContent className="p-3.5 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Building2 className="h-4 w-4 text-text-muted flex-shrink-0" />
                <span className="font-semibold text-text-primary text-sm truncate max-w-[200px] sm:max-w-none">{companyName}</span>
                <Badge variant={isOverdue ? "destructive" : isDueToday ? "default" : "secondary"} className="text-[10px]">
                  {isOverdue ? "Overdue" : isDueToday ? "Due Today" : "Upcoming"}
                </Badge>
              </div>
              {contactName && (
                <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-1.5">
                  <User className="h-3 w-3" /> <span>{contactName}</span>
                </div>
              )}
              <p className="text-xs sm:text-sm text-text-primary font-semibold mb-2">{followup.subject}</p>
              <div className="flex items-center gap-3 text-xs text-text-muted flex-wrap">
                <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /><span>{followup.due_date}</span></div>
                {followup.due_time && <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{followup.due_time}</span></div>}
                <div className={cn("flex items-center gap-1 font-medium", CHANNEL_COLORS[followup.channel])}><Icon className="h-3 w-3" /><span className="capitalize">{followup.channel}</span></div>
              </div>
            </div>
            {followup.status === "pending" && (
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                <Button size="sm" variant="outline" className="text-xs px-2.5 h-7" onClick={() => handleReschedule(followup.id)}><RotateCcw className="h-3 w-3 mr-1" /> Reschedule</Button>
                <Button size="sm" className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs px-2.5 h-7" onClick={() => { setSelectedFollowup(followup); setCompleteDialogOpen(true); }}><CheckCircle2 className="h-3 w-3 mr-1" /> Complete</Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0" onClick={() => handleDelete(followup.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin h-8 w-8 text-brand-teal" /></div>;

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-4">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.message}<button onClick={() => setToast(null)} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Follow-ups</h1>
          <p className="text-slate-500">Manage your pending follow-ups</p>
        </div>
        <Button className="bg-brand-gold hover:bg-brand-gold/90 text-brand-teal-dark" onClick={() => setNewDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Follow-up
        </Button>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="today" className="flex items-center gap-2"><Clock className="h-4 w-4" /> Due Today <Badge variant="secondary" className="ml-1">{dueToday.length}</Badge></TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Overdue <Badge variant="destructive" className="ml-1">{overdue.length}</Badge></TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">All <Badge variant="secondary" className="ml-1">{allPending.length}</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value="today">{dueToday.length === 0 ? <Card className="bg-slate-50"><CardContent className="p-8 text-center"><CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" /><p className="text-slate-600">No follow-ups due today</p></CardContent></Card> : dueToday.map(renderFollowupCard)}</TabsContent>
        <TabsContent value="overdue">{overdue.length === 0 ? <Card className="bg-slate-50"><CardContent className="p-8 text-center"><CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" /><p className="text-slate-600">No overdue follow-ups</p></CardContent></Card> : overdue.map(renderFollowupCard)}</TabsContent>
        <TabsContent value="all">{allPending.map(renderFollowupCard)}</TabsContent>
      </Tabs>

      <Dialog open={newDialogOpen} onClose={() => setNewDialogOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Follow-up</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Company *</label>
              <Select options={companies.map((c) => ({ value: c.id, label: c.company_name }))} value={newForm.company_id} onChange={(e) => setNewForm({ ...newForm, company_id: e.target.value })} placeholder="Select company" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Subject *</label>
              <Input placeholder="Follow-up subject" value={newForm.subject} onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Description</label>
              <Textarea placeholder="Additional details..." value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Channel</label>
              <Select options={[{ value: "call", label: "Call" }, { value: "email", label: "Email" }, { value: "whatsapp", label: "WhatsApp" }, { value: "linkedin", label: "LinkedIn" }, { value: "meeting", label: "Meeting" }]} value={newForm.channel} onChange={(e) => setNewForm({ ...newForm, channel: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">Date</label><Input type="date" value={newForm.date} onChange={(e) => setNewForm({ ...newForm, date: e.target.value })} /></div>
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">Time</label><Input type="time" value={newForm.time} onChange={(e) => setNewForm({ ...newForm, time: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
            <Button className="bg-brand-teal hover:bg-brand-teal-dark text-white" onClick={handleNewFollowup}>Create Follow-up</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Complete Follow-up</DialogTitle></DialogHeader>
          {selectedFollowup && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg"><p className="font-medium">{selectedFollowup.companies?.company_name}</p><p className="text-sm text-slate-600">{selectedFollowup.subject}</p></div>
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">Notes</label><Textarea placeholder="Add completion notes..." value={completeNotes} onChange={(e) => setCompleteNotes(e.target.value)} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialogOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleComplete}><CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
