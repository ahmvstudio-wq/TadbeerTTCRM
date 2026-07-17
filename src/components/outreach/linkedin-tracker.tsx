"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ToastContainer, addToast } from "@/components/ui/toast";
import { exportToCsv } from "@/lib/export-csv";
import {
  ExternalLink, CheckCircle, Clock, AlertTriangle, Send, Copy, Eye,
  ChevronDown, ChevronRight, Users, Filter, BarChart3,
} from "lucide-react";
import { DEFAULT_LINKEDIN_TEMPLATES, fillTemplate, CHANNEL_RULES } from "@/lib/outreach-templates";

interface LinkedInSequence {
  lead_id: string;
  company_name: string;
  contact_name: string;
  touches: {
    step: number;
    status: "pending" | "done" | "no_reply" | "interested";
    date: string;
    response: string;
  }[];
}

export function LinkedInTracker({ leads }: { leads: any[] }) {
  const [sequences, setSequences] = useState<LinkedInSequence[]>([]);
  const [selectedLead, setSelectedLead] = useState<string>("");
  const [touchDialog, setTouchDialog] = useState<{ open: boolean; leadId: string; step: number }>({ open: false, leadId: "", step: 0 });
  const [touchNotes, setTouchNotes] = useState("");
  const [touchStatus, setTouchStatus] = useState("done");
  const [filter, setFilter] = useState<string>("all");

  const rules = CHANNEL_RULES.linkedin;

  // Initialize sequences for leads that don't have one
  const allSequences = useMemo(() => {
    const existing = new Map(sequences.map((s) => [s.lead_id, s]));
    return leads.map((lead) => {
      if (existing.has(lead.id)) return existing.get(lead.id)!;
      return {
        lead_id: lead.id,
        company_name: lead.company_name,
        contact_name: lead.contacts?.[0]?.full_name || lead.contact_name || "",
        touches: rules.steps.map((_, i) => ({
          step: i + 1,
          status: "pending" as const,
          date: "",
          response: "",
        })),
      };
    });
  }, [leads, sequences, rules.steps]);

  const filteredSequences = useMemo(() => {
    if (filter === "all") return allSequences;
    if (filter === "in_progress") return allSequences.filter((s) => s.touches.some((t) => t.status === "done") && !s.touches.every((t) => t.status === "done"));
    if (filter === "completed") return allSequences.filter((s) => s.touches.every((t) => t.status === "done" || t.status === "no_reply"));
    if (filter === "not_started") return allSequences.filter((s) => s.touches.every((t) => t.status === "pending"));
    return allSequences;
  }, [allSequences, filter]);

  const overallStats = useMemo(() => {
    const total = allSequences.length * 7;
    const done = allSequences.reduce((s, seq) => s + seq.touches.filter((t) => t.status === "done").length, 0);
    const replies = allSequences.reduce((s, seq) => s + seq.touches.filter((t) => t.status === "interested").length, 0);
    return { total, done, replies, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }, [allSequences]);

  const logTouch = () => {
    setSequences((prev) => {
      const updated = [...prev];
      const idx = updated.findIndex((s) => s.lead_id === touchDialog.leadId);
      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          touches: updated[idx].touches.map((t) =>
            t.step === touchDialog.step ? { ...t, status: touchStatus as any, date: new Date().toISOString().split("T")[0], response: touchNotes } : t
          ),
        };
      } else {
        const seq = allSequences.find((s) => s.lead_id === touchDialog.leadId);
        if (seq) {
          updated.push({
            ...seq,
            touches: seq.touches.map((t) =>
              t.step === touchDialog.step ? { ...t, status: touchStatus as any, date: new Date().toISOString().split("T")[0], response: touchNotes } : t
            ),
          });
        }
      }
      return updated;
    });
    setTouchDialog({ open: false, leadId: "", step: 0 });
    setTouchNotes("");
    setTouchStatus("done");
    addToast("success", "Touch logged");
  };

  const handleExport = () => {
    exportToCsv(allSequences.flatMap((s) => s.touches.map((t) => ({
      company: s.company_name, contact: s.contact_name,
      step: `T${t.step}`, status: t.status, date: t.date, response: t.response,
    }))), `linkedin-sequences-${new Date().toISOString().split("T")[0]}.csv`);
    addToast("success", "LinkedIn sequences exported");
  };

  const statusColors: Record<string, string> = {
    pending: "bg-slate-200", done: "bg-green-500", no_reply: "bg-red-400", interested: "bg-blue-500",
  };

  return (
    <div className="space-y-4">
      <ToastContainer />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 stagger-children">
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-blue-600">{overallStats.done}/{overallStats.total}</p>
          <p className="text-[10px] text-text-muted">Touches Completed</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-green-600">{overallStats.replies}</p>
          <p className="text-[10px] text-text-muted">Positive Responses</p>
        </CardContent></Card>
        <Card className="hover-lift"><CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-brand-teal">{overallStats.pct}%</p>
          <p className="text-[10px] text-text-muted">Sequence Progress</p>
        </CardContent></Card>
      </div>

      {/* Daily Target */}
      <Card className="hover-lift"><CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-text-secondary">Daily LinkedIn Target: 15 connections + 10 DMs + 5 warm DMs</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-blue-50 text-center"><p className="text-lg font-bold text-blue-600">0</p><p className="text-[10px] text-text-muted">Connections</p></div>
          <div className="p-2 rounded-lg bg-blue-50 text-center"><p className="text-lg font-bold text-blue-600">0</p><p className="text-[10px] text-text-muted">DMs</p></div>
          <div className="p-2 rounded-lg bg-blue-50 text-center"><p className="text-lg font-bold text-blue-600">0</p><p className="text-[10px] text-text-muted">Warm DMs</p></div>
        </div>
      </CardContent></Card>

      {/* Filter */}
      <div className="flex gap-2">
        {["all", "not_started", "in_progress", "completed"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("px-3 py-1.5 rounded-full text-[11px] font-medium transition-all press-effect", filter === f ? "bg-brand-teal text-white" : "bg-white border border-border text-text-secondary hover:bg-cream-dark")}>
            {f.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={handleExport} className="text-[11px]"><Send className="h-3 w-3 mr-1" />Export</Button>
      </div>

      {/* Sequence Table */}
      <Card className="hover-lift">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-3 font-medium text-text-muted">Lead</th>
                {rules.steps.map((step, i) => (
                  <th key={i} className="text-center py-2.5 px-2 font-medium text-text-muted min-w-[80px]">
                    <div>T{i + 1}</div>
                    <div className="text-[9px] font-normal">{step}</div>
                  </th>
                ))}
                <th className="text-center py-2.5 px-2 font-medium text-text-muted">Progress</th>
              </tr>
            </thead>
            <tbody>
              {filteredSequences.map((seq) => {
                const done = seq.touches.filter((t) => t.status === "done" || t.status === "interested").length;
                const pct = Math.round((done / 7) * 100);
                return (
                  <tr key={seq.lead_id} className="border-b border-border-light hover:bg-cream-dark/30 transition-colors">
                    <td className="py-2.5 px-3">
                      <p className="font-medium text-text-primary">{seq.contact_name}</p>
                      <p className="text-[10px] text-text-muted">{seq.company_name}</p>
                    </td>
                    {seq.touches.map((touch) => (
                      <td key={touch.step} className="text-center py-2.5 px-2">
                        <button
                          onClick={() => setTouchDialog({ open: true, leadId: seq.lead_id, step: touch.step })}
                          className={cn("w-8 h-8 rounded-full mx-auto flex items-center justify-center transition-all duration-200 hover:scale-110 press-effect", statusColors[touch.status])}
                          title={touch.status === "pending" ? "Log touch" : `${touch.status} - ${touch.date}`}
                        >
                          {touch.status === "done" || touch.status === "interested" ? (
                            <CheckCircle className="h-4 w-4 text-white" />
                          ) : touch.status === "no_reply" ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-white" />
                          ) : (
                            <span className="text-[10px] font-bold text-white">T{touch.step}</span>
                          )}
                        </button>
                        {touch.date && <p className="text-[9px] text-text-muted mt-0.5">{touch.date.slice(5)}</p>}
                      </td>
                    ))}
                    <td className="text-center py-2.5 px-2">
                      <div className="w-12 h-1.5 bg-cream-dark rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-brand-teal rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[9px] text-text-muted mt-0.5">{pct}%</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Touch Log Dialog */}
      <Dialog open={touchDialog.open} onClose={() => setTouchDialog({ open: false, leadId: "", step: 0 })}>
        <DialogHeader><DialogTitle>Log LinkedIn Touch T{touchDialog.step}</DialogTitle><DialogClose onClick={() => setTouchDialog({ open: false, leadId: "", step: 0 })} /></DialogHeader>
        <DialogContent className="space-y-3">
          <div>
            <label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Status</label>
            <Select options={[{ value: "done", label: "Done" }, { value: "no_reply", label: "No Reply" }, { value: "interested", label: "Interested" }]} value={touchStatus} onChange={(e) => setTouchStatus(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Notes / Response</label>
            <Textarea rows={3} value={touchNotes} onChange={(e) => setTouchNotes(e.target.value)} placeholder="What happened with this touch?" />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setTouchDialog({ open: false, leadId: "", step: 0 })}>Cancel</Button>
          <Button onClick={logTouch} className="bg-brand-teal hover:bg-brand-teal-dark text-white">Save</Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
