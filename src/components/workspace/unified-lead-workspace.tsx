"use client";

import { useState, useEffect } from "react";
import {
  Building,
  User,
  Compass,
  Clock,
  FileText,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Pencil,
  Save,
  X,
  Plus,
  Bot,
  Trash2,
  ExternalLink,
  ShieldAlert,
  Loader2,
  MapPin
} from "lucide-react";
import { Company, Contact, Activity, FollowUp, Meeting, OutreachPreparation } from "@/lib/types/database";
import { getCompany, updateCompany, updateCompanyStatus, assignCompanyLead, upsertCompanyContact } from "@/lib/actions/companies";
import { ContactChannelsGrid, extractInstagramUrl } from "./contact-channels-grid";
import { ActivityTimeline } from "./activity-timeline";
import { LeadResearchCard } from "./lead-research-card";
import { LeadScriptsTemplates } from "./lead-scripts-templates";
import { LeadTasksManager } from "./lead-tasks-manager";
import { LeadAICopilot } from "./lead-ai-copilot";
import { LeadMeetingDocs } from "./lead-meeting-docs";
import { getCleanIndustry, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const UNIFIED_STATUSES = [
  { id: "prospect", label: "Prospect (New)", color: "bg-slate-200 text-slate-900 border-slate-400" },
  { id: "contacted", label: "Reached Out / Contacted", color: "bg-blue-100 text-blue-900 border-blue-400" },
  { id: "no_reply", label: "No Reply (Follow-up Due)", color: "bg-rose-100 text-rose-900 border-rose-400" },
  { id: "reply_received", label: "Reply Received", color: "bg-indigo-100 text-indigo-900 border-indigo-400" },
  { id: "warm_up", label: "Warm-Up In Progress", color: "bg-indigo-100 text-indigo-900 border-indigo-400" },
  { id: "interested", label: "Interested / Opportunity", color: "bg-emerald-100 text-emerald-900 border-emerald-400" },
  { id: "opening_identified", label: "Opening Identified", color: "bg-amber-100 text-amber-900 border-amber-400" },
  { id: "objection", label: "Objection Handled", color: "bg-rose-100 text-rose-900 border-rose-400" },
  { id: "followup_required", label: "Follow-up Required", color: "bg-teal-100 text-teal-900 border-teal-400" },
  { id: "ready_for_call", label: "Ready for Call (Call Queue)", color: "bg-teal-100 text-teal-900 border-teal-400 font-bold" },
  { id: "in_call_queue", label: "In Call Queue", color: "bg-teal-100 text-teal-900 border-teal-400 font-bold" },
  { id: "coffee_invited", label: "Coffee Invited", color: "bg-orange-100 text-orange-900 border-orange-400" },
  { id: "called", label: "Called", color: "bg-violet-100 text-violet-900 border-violet-400" },
  { id: "meeting_booked", label: "Meeting Booked", color: "bg-purple-100 text-purple-900 border-purple-400 font-bold" },
  { id: "proposal", label: "Proposal Sent", color: "bg-violet-100 text-violet-900 border-violet-400" },
  { id: "proposal_requested", label: "Proposal Requested", color: "bg-violet-100 text-violet-900 border-violet-400" },
  { id: "won", label: "Won (Closed)", color: "bg-emerald-700 text-white border-emerald-800" },
  { id: "lost", label: "Lost", color: "bg-slate-900 text-white border-slate-950" },
  { id: "dormant", label: "Dormant (60d Snooze)", color: "bg-gray-200 text-gray-800 border-gray-400" }
];

export const TEAM_MEMBERS = [
  { id: "Ramij", name: "Ramij (Sales Lead)", role: "bd_rep" },
  { id: "Taufiq", name: "Taufiq (Automation)", role: "bd_rep" },
  { id: "Ismail", name: "Ismail (Closer)", role: "closer" },
  { id: "Ahmed", name: "Ahmed Al-Rashid", role: "admin" }
];

interface UnifiedLeadWorkspaceProps {
  companyId: string;
  onClose?: () => void;
  currentUser?: string;
  initialTab?: "overview" | "research" | "history" | "scripts" | "tasks" | "ai" | "meeting_docs";
}

export function UnifiedLeadWorkspace({
  companyId,
  onClose,
  currentUser = "Ramij",
  initialTab
}: UnifiedLeadWorkspaceProps) {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [preparations, setPreparations] = useState<OutreachPreparation[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [touches, setTouches] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"overview" | "research" | "history" | "scripts" | "tasks" | "ai" | "meeting_docs">(initialTab || "overview");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Edit states
  const [editingOverview, setEditingOverview] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  const [contactName, setContactName] = useState("");
  const [contactTitle, setContactTitle] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [contactLinkedin, setContactLinkedin] = useState("");

  const [saving, setSaving] = useState(false);

  const fetchLeadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const cleanId = String(companyId || '').replace(/^staged-/, '').trim();
      const res = await getCompany(cleanId);
      if (res.data) {
        const data = res.data;
        setCompany(data);
        setContacts(data.contacts || []);
        setActivities(data.activities || []);
        setPreparations(data.preparations || []);
        setFollowUps(data.follow_ups || []);
        setMeetings(data.meetings || []);
        setTouches(data.outreach_touches || []);

        setCompanyName(data.company_name || "");
        setIndustry(data.industry || "");
        setWebsite(data.website || "");
        setPhone(data.phone || "");
        setEmail(data.email || "");
        setCountry(data.country || "");
        setCity(data.city || "");
        setNotes(data.notes || "");

        const primary = (data.contacts || []).find((c: Contact) => c.is_primary) || data.contacts[0];
        if (primary) {
          setContactName(primary.full_name || "");
          setContactTitle(primary.title || "");
          setContactWhatsapp(primary.whatsapp || "");
          setContactLinkedin(primary.linkedin_url || "");
        }
      }
    } catch (err) {
      console.error("Failed to load lead details:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchLeadData(false);
    } else {
      setLoading(false);
    }
    const handleLeadUpdated = (e: any) => {
      if (e?.detail?.source === "workspace_status") return;
      const updatedId = e?.detail?.companyId;
      const cleanId = String(companyId || '').replace(/^staged-/, '').trim();
      if (!updatedId || updatedId === cleanId) {
        fetchLeadData(true);
      }
    };
    window.addEventListener("lead-updated", handleLeadUpdated);
    return () => window.removeEventListener("lead-updated", handleLeadUpdated);
  }, [companyId]);

  if (loading || !company) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white rounded-xl border border-neutral-200">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        <p className="text-xs text-neutral-400">Loading workspace...</p>
      </div>
    );
  }

  const primaryContact = contacts.find(c => c.is_primary) || contacts[0] || null;
  const assignedRep = company.assigned_to;
  const isAssignedToOther = assignedRep && assignedRep !== currentUser;

  const handleStatusChange = async (newStatus: string) => {
    setCompany(prev => prev ? { ...prev, status: newStatus } : null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", { detail: { source: "workspace_status", companyId: company.id, status: newStatus } }));
    }
    await updateCompanyStatus(company.id, newStatus);
    fetchLeadData(true);
  };

  const handleAssign = async (repId: string | null) => {
    setCompany(prev => prev ? { ...prev, assigned_to: repId || null } : null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", { detail: { source: "workspace_status", companyId: company.id } }));
    }
    await assignCompanyLead(company.id, repId);
    fetchLeadData(true);
  };

  const handleSaveOverview = async () => {
    setSaving(true);
    await updateCompany(company.id, {
      company_name: companyName,
      industry,
      website,
      phone,
      email,
      country,
      city,
      notes
    });

    if (contactName) {
      await upsertCompanyContact(company.id, {
        id: primaryContact?.id,
        full_name: contactName,
        title: contactTitle,
        whatsapp: contactWhatsapp,
        linkedin_url: contactLinkedin,
        phone,
        email
      });
    }

    setSaving(false);
    setEditingOverview(false);
    await fetchLeadData();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lead-updated", { detail: { companyId: company.id } }));
    }
  };

  const rJson: any = (company as any).research_json || {};
  const igUrl = extractInstagramUrl(company);
  const igHandle = rJson.instagram_handle || (igUrl ? '@' + igUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '') : null);
  const displayIndustry = getCleanIndustry(company);
  const businessType = rJson.business_type || (company.industry && !company.industry.startsWith('@') && company.industry !== displayIndustry ? company.industry : null);
  const followers = rJson.followers;

  const rawCoStatus = (company.status || '').toLowerCase();
  const rawCoStage = (company.pipeline_stage || '').toLowerCase();
  let currentActiveStatus = company.status;
  if (UNIFIED_STATUSES.some(s => s.id === currentActiveStatus)) {
    // exact match
  } else if (rawCoStatus === 'in_call_queue' || rawCoStage === 'call ready') {
    currentActiveStatus = 'ready_for_call';
  } else if (rawCoStatus === 'meeting_booked' || rawCoStage === 'meeting booked') {
    currentActiveStatus = 'meeting_booked';
  } else if (rawCoStage === 'replied') {
    currentActiveStatus = 'reply_received';
  } else {
    currentActiveStatus = 'prospect';
  }

  const meetingDocsCount = Array.isArray((company as any)?.research_json?.meeting_docs)
    ? (company as any).research_json.meeting_docs.length : 0;
  const hasMeetingDocs = meetingDocsCount > 0;

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "meeting_docs", label: `Meeting Docs${meetingDocsCount > 0 ? ` (${meetingDocsCount})` : ""}`, badge: !hasMeetingDocs ? "!" : undefined },
    { id: "research", label: "Research" },
    { id: "history", label: `History (${activities.length})` },
    { id: "scripts", label: "Scripts" },
    { id: "tasks", label: `Tasks (${followUps.length + meetings.length})` },
    { id: "ai", label: "AI Assistant" },
  ];

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-lg overflow-hidden flex flex-col max-w-6xl w-full mx-auto my-2">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-3 border-b border-neutral-200 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-700 font-bold flex items-center justify-center text-base shrink-0">
            {company.company_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-semibold text-neutral-900 truncate">{company.company_name}</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 border border-neutral-200 font-medium">
                {displayIndustry}
              </span>
              {businessType && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 border border-neutral-200 font-medium">
                  {businessType}
                </span>
              )}
              {followers && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 border border-neutral-200 font-medium">
                  {followers}
                </span>
              )}
              {igHandle && (
                <a
                  href={igUrl || `https://instagram.com/${igHandle.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 border border-neutral-200 hover:text-neutral-800 transition flex items-center gap-1"
                >
                  {igHandle} <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                {company.city || "Location n/a"}{company.country ? `, ${company.country}` : ""}
              </span>
              {primaryContact && (
                <>
                  <span className="text-neutral-300">·</span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 shrink-0" />
                    {primaryContact.full_name}{primaryContact.title ? ` — ${primaryContact.title}` : ""}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Owner assignment */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="hidden sm:inline text-neutral-400 text-[11px]">Owner:</span>
            <select
              value={assignedRep || ""}
              onChange={(e) => handleAssign(e.target.value || null)}
              className="text-xs text-neutral-700 border border-neutral-200 rounded-md px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-300"
            >
              <option value="">Unassigned</option>
              {TEAM_MEMBERS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="h-7 w-7 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Pipeline Status + Meta row ──────────────────────────────────── */}
      <div className="px-5 py-2.5 border-b border-neutral-100 bg-neutral-50 flex flex-wrap items-center gap-3">
        {isAssignedToOther && (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
            <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
            <span>Assigned to <strong>{assignedRep}</strong> — coordinate before outreach</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="text-neutral-400">Stage:</span>
          <select
            value={currentActiveStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-xs text-neutral-800 font-medium border border-neutral-200 rounded-md px-2 py-1 bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-neutral-300"
          >
            {UNIFIED_STATUSES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-3 text-[11px] text-neutral-400">
          <span>Updated {new Date(company.updated_at).toLocaleDateString()}</span>
          <span>·</span>
          <span>{activities.length} touches</span>
        </div>
      </div>

      {/* ── Contact Channels Bar ─────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-neutral-100">
        <ContactChannelsGrid
          company={company}
          primaryContact={primaryContact}
          onRefresh={fetchLeadData}
          onEditContact={() => setActiveTab("overview")}
        />
      </div>

      {/* ── Navigation Tabs ──────────────────────────────────────────────── */}
      <div className="border-b border-neutral-200 px-5 flex items-center gap-0 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "py-2.5 px-3 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                isActive
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-400 hover:text-neutral-700"
              )}
            >
              {tab.label}
              {tab.badge && (
                <span className="px-1 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 border border-amber-200 font-semibold leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────── */}
      <div className="p-5 overflow-y-auto max-h-[600px] space-y-5">

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* Company & Contact section header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Company & Contact</span>
              {!editingOverview ? (
                <button
                  onClick={() => setEditingOverview(true)}
                  className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 transition cursor-pointer"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingOverview(false)}
                    className="text-xs text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveOverview}
                    disabled={saving}
                    className="flex items-center gap-1 text-xs text-neutral-800 font-semibold border border-neutral-300 rounded-md px-2.5 py-1 hover:bg-neutral-50 cursor-pointer"
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save
                  </button>
                </div>
              )}
            </div>

            {editingOverview ? (
              <div className="space-y-4 text-xs">
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium mb-2">Company</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: "Company Name", val: companyName, set: setCompanyName },
                      { label: "Industry", val: industry, set: setIndustry },
                      { label: "Website", val: website, set: setWebsite },
                      { label: "Phone", val: phone, set: setPhone },
                      { label: "Email", val: email, set: setEmail },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-[10px] text-neutral-400 block mb-1">{f.label}</label>
                        <input
                          type="text"
                          value={f.val}
                          onChange={e => f.set(e.target.value)}
                          className="w-full border border-neutral-200 rounded-md px-2.5 py-1.5 text-xs text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-[10px] text-neutral-400 block mb-1">City / Country</label>
                      <div className="flex gap-1.5">
                        <input type="text" value={city} placeholder="City" onChange={e => setCity(e.target.value)} className="w-1/2 border border-neutral-200 rounded-md px-2.5 py-1.5 text-xs text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300" />
                        <input type="text" value={country} placeholder="Country" onChange={e => setCountry(e.target.value)} className="w-1/2 border border-neutral-200 rounded-md px-2.5 py-1.5 text-xs text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300" />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium mb-2">Primary Contact</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Full Name", val: contactName, set: setContactName },
                      { label: "Title / Role", val: contactTitle, set: setContactTitle },
                      { label: "WhatsApp", val: contactWhatsapp, set: setContactWhatsapp },
                      { label: "LinkedIn URL", val: contactLinkedin, set: setContactLinkedin },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-[10px] text-neutral-400 block mb-1">{f.label}</label>
                        <input
                          type="text"
                          value={f.val}
                          onChange={e => f.set(e.target.value)}
                          className="w-full border border-neutral-200 rounded-md px-2.5 py-1.5 text-xs text-neutral-800 bg-white focus:outline-none focus:ring-1 focus:ring-neutral-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Company info */}
                <div className="space-y-1">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium mb-2">Company</p>
                  <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-lg overflow-hidden">
                    {[
                      { label: "Name", value: company.company_name },
                      { label: "Industry", value: displayIndustry },
                      { label: "Location", value: [company.city, company.country].filter(Boolean).join(", ") || "—" },
                      { label: "Website", value: company.website || "—" },
                      { label: "Phone", value: company.phone || "—" },
                      { label: "Email", value: company.email || "—" },
                    ].map(row => (
                      <div key={row.label} className="flex items-center px-3 py-2 text-xs">
                        <span className="w-20 shrink-0 text-neutral-400">{row.label}</span>
                        <span className="text-neutral-800 truncate">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-1">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-medium mb-2">Primary Contact</p>
                  {primaryContact ? (
                    <div className="divide-y divide-neutral-100 border border-neutral-100 rounded-lg overflow-hidden">
                      {[
                        { label: "Name", value: primaryContact.full_name || "—" },
                        { label: "Title", value: primaryContact.title || "—" },
                        { label: "WhatsApp", value: primaryContact.whatsapp || "—" },
                        { label: "Email", value: primaryContact.email || "—" },
                        { label: "LinkedIn", value: primaryContact.linkedin_url || "—" },
                      ].map(row => (
                        <div key={row.label} className="flex items-center px-3 py-2 text-xs">
                          <span className="w-20 shrink-0 text-neutral-400">{row.label}</span>
                          <span className="text-neutral-800 truncate">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 italic py-4">No primary contact recorded. Click Edit to add.</p>
                  )}
                </div>
              </div>
            )}

            {/* Meeting Docs status strip */}
            <div className={cn(
              "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 rounded-lg border text-xs",
              hasMeetingDocs
                ? "bg-neutral-50 border-neutral-200 text-neutral-600"
                : "bg-amber-50 border-amber-200 text-amber-800"
            )}>
              <div className="flex items-center gap-2">
                {hasMeetingDocs
                  ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  : <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                }
                <span>
                  {hasMeetingDocs
                    ? `Meeting docs ready — ${meetingDocsCount} document(s) attached`
                    : "No meeting documents attached yet — upload proposals or links for SDR calls"}
                </span>
              </div>
              <button
                onClick={() => setActiveTab("meeting_docs")}
                className="text-xs font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900 cursor-pointer shrink-0"
              >
                {hasMeetingDocs ? "View docs" : "Add docs"}
              </button>
            </div>

            <LeadResearchCard
              company={company}
              primaryContact={primaryContact}
              preparations={preparations}
              onSaveResearchNotes={async (newNotes) => {
                await updateCompany(company.id, { notes: newNotes });
                fetchLeadData();
              }}
            />
          </div>
        )}

        {activeTab === "meeting_docs" && (
          <LeadMeetingDocs
            company={company}
            primaryContact={primaryContact}
            meetings={meetings}
            onRefresh={fetchLeadData}
          />
        )}

        {activeTab === "research" && (
          <LeadResearchCard
            company={company}
            primaryContact={primaryContact}
            preparations={preparations}
            onSaveResearchNotes={async (newNotes) => {
              await updateCompany(company.id, { notes: newNotes });
              fetchLeadData();
            }}
          />
        )}

        {activeTab === "history" && (
          <ActivityTimeline
            companyId={company.id}
            activities={activities}
            followUps={followUps}
            meetings={meetings}
            touches={touches}
            onRefresh={fetchLeadData}
          />
        )}

        {activeTab === "scripts" && (
          <LeadScriptsTemplates
            company={company}
            primaryContact={primaryContact}
            onRefresh={fetchLeadData}
          />
        )}

        {activeTab === "tasks" && (
          <LeadTasksManager
            companyId={company.id}
            contactId={primaryContact?.id}
            followUps={followUps}
            meetings={meetings}
            onRefresh={fetchLeadData}
          />
        )}

        {activeTab === "ai" && (
          <LeadAICopilot
            company={company}
            primaryContact={primaryContact}
            activities={activities}
            preparations={preparations}
          />
        )}
      </div>
    </div>
  );
}
