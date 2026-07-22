"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, MapPin, Users, Plus, CheckCircle2, XCircle, CalendarClock, Trash2, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getMeetings, bookMeeting, updateMeetingStatus } from "@/lib/actions/meetings";
import { deleteMeeting } from "@/lib/actions/delete";
import { getCompanies } from "@/lib/actions/companies";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-purple-100 text-purple-700 border-purple-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  no_show: "bg-amber-100 text-amber-700 border-amber-200",
};

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [newMeeting, setNewMeeting] = useState({ title: "", company_id: "", contact_name: "", date: "", duration: 30, location: "", description: "" });

  const fetchData = async () => {
    setLoading(true);
    const [mRes, cRes] = await Promise.all([getMeetings("all"), getCompanies()]);
    if (mRes.data) setMeetings(mRes.data);
    if (cRes.data) setCompanies(cRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const upcomingMeetings = meetings.filter((m) => m.status === "scheduled");
  const pastMeetings = meetings.filter((m) => m.status !== "scheduled");

  const handleBookMeeting = async () => {
    if (!newMeeting.title || !newMeeting.company_id || !newMeeting.date) return;
    const result = await bookMeeting({
      company_id: newMeeting.company_id,
      title: newMeeting.title,
      meeting_date: new Date(newMeeting.date).toISOString(),
      duration_minutes: newMeeting.duration,
      location: newMeeting.location || undefined,
      description: newMeeting.description || undefined,
    });
    if (result.error) { setToast({ type: "error", message: result.error }); return; }
    setBookDialogOpen(false);
    setNewMeeting({ title: "", company_id: "", contact_name: "", date: "", duration: 30, location: "", description: "" });
    setToast({ type: "success", message: "Meeting booked" });
    fetchData();
  };

  const handleStatusUpdate = async (id: string, status: "completed" | "cancelled") => {
    const result = await updateMeetingStatus(id, status);
    if (result.error) { setToast({ type: "error", message: result.error }); return; }
    setToast({ type: "success", message: `Meeting ${status}` });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this meeting?")) return;
    const result = await deleteMeeting(id);
    if (result.error) { setToast({ type: "error", message: result.error }); return; }
    setToast({ type: "success", message: "Meeting deleted" });
    fetchData();
  };

  const renderMeetingCard = (meeting: any) => (
    <Card key={meeting.id} className={cn("mb-4 transition-all hover:shadow-md", meeting.status === "scheduled" && "border-purple-200", meeting.status === "completed" && "border-green-200 bg-green-50/50", meeting.status === "cancelled" && "border-red-200 bg-red-50/50")}>
      <CardContent className="p-3.5 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className={cn("w-11 h-11 sm:w-12 sm:h-12 rounded-lg flex flex-col items-center justify-center text-white font-bold flex-shrink-0", meeting.status === "scheduled" ? "bg-brand-teal" : meeting.status === "completed" ? "bg-green-600" : "bg-red-600")}>
                <span className="text-[10px] sm:text-xs leading-none uppercase">{new Date(meeting.meeting_date).toLocaleDateString("en", { month: "short" })}</span>
                <span className="text-base sm:text-lg leading-none mt-0.5">{new Date(meeting.meeting_date).getDate()}</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-text-primary text-sm sm:text-base truncate">{meeting.title}</h3>
                  <Badge className={cn("text-[10px]", STATUS_COLORS[meeting.status])} variant="outline">
                    {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1).replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary truncate">{meeting.companies?.company_name || "Unknown"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs sm:text-sm">
              {meeting.contacts?.full_name && <div className="flex items-center gap-1.5 text-text-secondary"><Users className="h-3.5 w-3.5 text-text-muted flex-shrink-0" /><span className="truncate">{meeting.contacts.full_name}</span></div>}
              <div className="flex items-center gap-1.5 text-text-secondary"><Clock className="h-3.5 w-3.5 text-text-muted flex-shrink-0" /><span>{new Date(meeting.meeting_date).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })} ({meeting.duration_minutes}m)</span></div>
              {meeting.location && <div className="flex items-center gap-1.5 text-text-secondary col-span-1 sm:col-span-2"><MapPin className="h-3.5 w-3.5 text-text-muted flex-shrink-0" /><span className="truncate">{meeting.location}</span></div>}
            </div>
            {meeting.description && <p className="text-xs text-text-muted mt-2.5 italic">{meeting.description}</p>}
          </div>
          {meeting.status === "scheduled" && (
            <div className="flex items-center gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
              <Button size="sm" variant="outline" className="text-xs px-2.5 h-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleStatusUpdate(meeting.id, "completed")}><CheckCircle2 className="h-3 w-3 mr-1" /> Complete</Button>
              <Button size="sm" variant="outline" className="text-xs px-2.5 h-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleStatusUpdate(meeting.id, "cancelled")}><XCircle className="h-3 w-3 mr-1" /> Cancel</Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => handleDelete(meeting.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="animate-spin h-8 w-8 text-brand-teal" /></div>;

  return (
    <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-4">
      {toast && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm mb-4 ${toast.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {toast.message}<button onClick={() => setToast(null)} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meetings & Demos</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Manage scheduled prospect calls and presentation meetings.</p>
        </div>
        <Button className="bg-brand-gold hover:bg-brand-gold/90 text-brand-teal-dark text-xs px-3 h-8 self-start sm:self-auto" onClick={() => setBookDialogOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Book Meeting
        </Button>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4"><Calendar className="h-5 w-5 text-brand-teal" /><h2 className="text-lg font-semibold text-text-primary">Upcoming</h2><Badge variant="secondary">{upcomingMeetings.length}</Badge></div>
        {upcomingMeetings.length === 0 ? <Card className="bg-slate-50"><CardContent className="p-8 text-center"><Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No upcoming meetings</p></CardContent></Card> : upcomingMeetings.map(renderMeetingCard)}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4"><CheckCircle2 className="h-5 w-5 text-green-600" /><h2 className="text-lg font-semibold text-text-primary">Past</h2><Badge variant="secondary">{pastMeetings.length}</Badge></div>
        {pastMeetings.length === 0 ? <Card className="bg-slate-50"><CardContent className="p-8 text-center"><CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500">No past meetings</p></CardContent></Card> : pastMeetings.map(renderMeetingCard)}
      </div>

      <Dialog open={bookDialogOpen} onClose={() => setBookDialogOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Book Meeting</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-slate-700 mb-1 block">Title *</label><Input placeholder="Meeting title" value={newMeeting.title} onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })} /></div>
            <div><label className="text-sm font-medium text-slate-700 mb-1 block">Company *</label><Select options={companies.map((c) => ({ value: c.id, label: c.company_name }))} value={newMeeting.company_id} onChange={(e) => setNewMeeting({ ...newMeeting, company_id: e.target.value })} placeholder="Select company" /></div>
            <div><label className="text-sm font-medium text-slate-700 mb-1 block">Date & Time *</label><Input type="datetime-local" value={newMeeting.date} onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">Duration</label><Select options={[{ value: "15", label: "15 min" }, { value: "30", label: "30 min" }, { value: "45", label: "45 min" }, { value: "60", label: "60 min" }]} value={String(newMeeting.duration)} onChange={(e) => setNewMeeting({ ...newMeeting, duration: Number(e.target.value) })} /></div>
              <div><label className="text-sm font-medium text-slate-700 mb-1 block">Location</label><Input placeholder="Location or link" value={newMeeting.location} onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })} /></div>
            </div>
            <div><label className="text-sm font-medium text-slate-700 mb-1 block">Description</label><Textarea placeholder="Meeting agenda or notes" value={newMeeting.description} onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookDialogOpen(false)}>Cancel</Button>
            <Button className="bg-brand-teal hover:bg-brand-teal-dark text-white" onClick={handleBookMeeting}>Book Meeting</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
