"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ToastContainer, addToast } from "@/components/ui/toast";
import {
  MessageCircle, ExternalLink, Mail, Phone, Calendar, Plus, Edit, Trash2,
  Copy, Eye, FileText, ChevronDown, ChevronRight,
} from "lucide-react";
import { type MessageTemplate, PLACEHOLDERS, DEFAULT_WHATSAPP_TEMPLATES, DEFAULT_LINKEDIN_TEMPLATES, DEFAULT_EMAIL_TEMPLATES } from "@/lib/outreach-templates";

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  whatsapp: MessageCircle, linkedin: ExternalLink, email: Mail, call: Phone, meeting: Calendar,
};

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "bg-green-100 text-green-700", linkedin: "bg-blue-100 text-blue-700",
  email: "bg-slate-100 text-slate-700", call: "bg-amber-100 text-amber-700",
};

export function TemplateManager({ templates, onUpdate }: { templates: MessageTemplate[]; onUpdate: (t: MessageTemplate[]) => void }) {
  const [selectedChannel, setSelectedChannel] = useState<string>("whatsapp");
  const [editDialog, setEditDialog] = useState<{ open: boolean; template: MessageTemplate | null; isNew: boolean }>({ open: false, template: null, isNew: false });
  const [form, setForm] = useState({ name: "", channel: "whatsapp", category: "", subject: "", body: "", touch_number: 1 });
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);

  const channelTemplates = templates.filter((t) => t.channel === selectedChannel);
  const ChannelIcon = CHANNEL_ICONS[selectedChannel] || FileText;

  const openNew = () => {
    setForm({ name: "", channel: selectedChannel, category: "", subject: "", body: "", touch_number: 1 });
    setEditDialog({ open: true, template: null, isNew: true });
  };

  const openEdit = (template: MessageTemplate) => {
    setForm({ name: template.name, channel: template.channel, category: template.category, subject: template.subject || "", body: template.body, touch_number: template.touch_number || 1 });
    setEditDialog({ open: true, template, isNew: false });
  };

  const saveTemplate = () => {
    if (!form.name || !form.body) { addToast("error", "Name and body are required"); return; }
    if (editDialog.isNew) {
      const newTemplate: MessageTemplate = {
        id: String(Date.now()),
        name: form.name,
        channel: form.channel as any,
        category: form.category,
        subject: form.subject || undefined,
        body: form.body,
        touch_number: form.touch_number,
        created_at: new Date().toISOString(),
      };
      onUpdate([...templates, newTemplate]);
      addToast("success", "Template created");
    } else if (editDialog.template) {
      onUpdate(templates.map((t) => t.id === editDialog.template!.id ? { ...t, ...form, channel: form.channel as any } : t));
      addToast("success", "Template updated");
    }
    setEditDialog({ open: false, template: null, isNew: false });
  };

  const deleteTemplate = (id: string) => {
    if (!confirm("Delete this template?")) return;
    onUpdate(templates.filter((t) => t.id !== id));
    addToast("success", "Template deleted");
  };

  const insertPlaceholder = (placeholder: string) => {
    setForm((prev) => ({ ...prev, body: prev.body + placeholder }));
  };

  return (
    <div className="space-y-4">
      <ToastContainer />

      {/* Channel Tabs */}
      <div className="flex gap-2">
        {["whatsapp", "linkedin", "email"].map((ch) => {
          const Icon = CHANNEL_ICONS[ch] || FileText;
          const count = templates.filter((t) => t.channel === ch).length;
          return (
            <button key={ch} onClick={() => setSelectedChannel(ch)} className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all press-effect", selectedChannel === ch ? "bg-brand-teal text-white shadow-sm" : "bg-white border border-border text-text-secondary hover:bg-cream-dark")}>
              <Icon className="h-3.5 w-3.5" />
              {ch.charAt(0).toUpperCase() + ch.slice(1)}
              <span className="text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
        <div className="flex-1" />
        <Button size="sm" onClick={openNew} className="bg-brand-teal hover:bg-brand-teal-dark text-white hover-lift press-effect"><Plus className="h-3.5 w-3.5 mr-1" />New Template</Button>
      </div>

      {/* Placeholders Reference */}
      <Card className="hover-lift"><CardContent className="p-3">
        <p className="text-[10px] font-medium text-text-muted uppercase mb-2">Available Placeholders</p>
        <div className="flex flex-wrap gap-1.5">
          {PLACEHOLDERS.map((p) => (
            <button key={p.key} onClick={() => insertPlaceholder(p.key)} className="px-2 py-1 rounded-lg bg-cream-dark border border-border text-[10px] font-mono text-brand-teal hover:bg-brand-teal-light hover:border-brand-teal transition-all press-effect" title={p.description}>
              {p.key}
            </button>
          ))}
        </div>
      </CardContent></Card>

      {/* Template List */}
      <div className="space-y-2 stagger-children">
        {channelTemplates.map((template) => {
          const Icon = CHANNEL_ICONS[template.channel] || FileText;
          return (
            <Card key={template.id} className="hover-lift">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", CHANNEL_COLORS[template.channel])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-text-primary">{template.name}</span>
                      {template.touch_number && <Badge className="text-[9px] bg-brand-teal-light text-brand-teal">T{template.touch_number}</Badge>}
                      <Badge className="text-[9px] bg-cream-dark text-text-muted">{template.category}</Badge>
                    </div>
                    <p className="text-[11px] text-text-secondary line-clamp-2 whitespace-pre-wrap">{template.body.substring(0, 200)}{template.body.length > 200 ? "..." : ""}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setPreviewTemplate(template)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(template)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500" onClick={() => deleteTemplate(template.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {channelTemplates.length === 0 && (
          <Card><CardContent className="p-8 text-center">
            <FileText className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-sm text-text-secondary">No templates for this channel yet.</p>
            <Button size="sm" className="mt-2 bg-brand-teal hover:bg-brand-teal-dark text-white" onClick={openNew}><Plus className="h-3.5 w-3.5 mr-1" />Create Template</Button>
          </CardContent></Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, template: null, isNew: false })} className="max-w-2xl">
        <DialogHeader><DialogTitle>{editDialog.isNew ? "New Template" : "Edit Template"}</DialogTitle><DialogClose onClick={() => setEditDialog({ open: false, template: null, isNew: false })} /></DialogHeader>
        <DialogContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Template Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. WA Step 1: Introduction" /></div>
            <div><label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Channel</label><Select options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "linkedin", label: "LinkedIn" }, { value: "email", label: "Email" }]} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Category</label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Cold Outreach" /></div>
            <div><label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Touch Number</label><Input type="number" value={form.touch_number} onChange={(e) => setForm({ ...form, touch_number: parseInt(e.target.value) || 1 })} min={1} max={7} /></div>
          </div>
          {form.channel === "email" && (
            <div><label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Subject Line</label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Email subject with {placeholders}" /></div>
          )}
          <div>
            <label className="text-[10px] font-medium text-text-muted uppercase mb-1 block">Message Body *</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {PLACEHOLDERS.slice(0, 6).map((p) => (
                <button key={p.key} onClick={() => setForm({ ...form, body: form.body + p.key })} className="px-1.5 py-0.5 rounded bg-cream-dark border border-border text-[9px] font-mono text-brand-teal hover:bg-brand-teal-light transition-colors">{p.key}</button>
              ))}
            </div>
            <Textarea rows={8} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Write your message template here. Use {placeholders} for dynamic content." className="font-mono text-xs" />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setEditDialog({ open: false, template: null, isNew: false })}>Cancel</Button>
          <Button onClick={saveTemplate} className="bg-brand-teal hover:bg-brand-teal-dark text-white">{editDialog.isNew ? "Create" : "Save"}</Button>
        </DialogFooter>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onClose={() => setPreviewTemplate(null)} className="max-w-lg">
        <DialogHeader><DialogTitle>{previewTemplate?.name}</DialogTitle><DialogClose onClick={() => setPreviewTemplate(null)} /></DialogHeader>
        <DialogContent>
          <div className="p-4 bg-white rounded-xl border border-border text-sm whitespace-pre-wrap leading-relaxed">
            {previewTemplate?.body}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
