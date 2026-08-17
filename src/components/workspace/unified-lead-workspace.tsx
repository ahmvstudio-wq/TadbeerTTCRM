"use client";

import { useState, useEffect } from "react";
import {
  Building,
  User,
  Sparkles,
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
  Loader2
} from "lucide-react";
import { Company, Contact, Activity, FollowUp, Meeting, OutreachPreparation } from "@/lib/types/database";
import { getCompany, updateCompany, updateCompanyStatus, assignCompanyLead, upsertCompanyContact } from "@/lib/actions/companies";
import { ContactChannelsGrid } from "./contact-channels-grid";
import { ActivityTimeline } from "./activity-timeline";
import { LeadResearchCard } from "./lead-research-card";
import { LeadScriptsTemplates } from "./lead-scripts-templates";
import { LeadTasksManager } from "./lead-tasks-manager";
import { LeadAICopilot } from "./lead-ai-copilot";

export const UNIFIED_STATUSES = [
  { id: "prospect", label: "Prospect", color: "bg-slate-100 text-slate-800 border-slate-300" },
  { id: "contacted", label: "Reached Out", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "no_reply", label: "No Reply", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "reply_received", label: "Reply Received", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { id: "interested", label: "Interested", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "objection", label: "Objection", color: "bg-rose-100 text-rose-800 border-rose-300" },
  { id: "followup_required", label: "Follow-up Required", color: "bg-teal-100 text-teal-800 border-teal-300" },
  { id: "meeting_booked", label: "Meeting Booked", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "proposal", label: "Proposal Sent", color: "bg-violet-100 text-violet-800 border-violet-300" },
  { id: "won", label: "Won", color: "bg-emerald-600 text-white border-emerald-700" },
  { id: "lost", label: "Lost", color: "bg-slate-800 text-white border-slate-900" },
  { id: "dormant", label: "Dormant", color: "bg-gray-200 text-gray-700 border-gray-300" }
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
}

export function UnifiedLeadWorkspace({
  companyId,
  onClose,
  currentUser = "Ramij"
}: UnifiedLeadWorkspaceProps) {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [preparations, setPreparations] = useState<OutreachPreparation[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [touches, setTouches] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"overview" | "research" | "history" | "scripts" | "tasks" | "ai">("overview");

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

  const fetchLeadData = async () => {
    setLoading(true);
    try {
      const res = await getCompany(companyId);
      if (res.data) {
        const data = res.data;
        setCompany(data);
        setContacts(data.contacts || []);
        setActivities(data.activities || []);
        setPreparations(data.preparations || []);
        setFollowUps(data.follow_ups || []);
        setMeetings(data.meetings || []);
        setTouches(data.outreach_touches || []);

        // Populate edit fields
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchLeadData();
    } else {
      setLoading(false);
    }
  }, [companyId]);

  if (loading || !company) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3 bg-white rounded-2xl">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-xs font-bold text-slate-500">Loading Unified Lead Workspace...</p>
      </div>
    );
  }

  const primaryContact = contacts.find(c => c.is_primary) || contacts[0] || null;
  const assignedRep = company.assigned_to;
  const isAssignedToOther = assignedRep && assignedRep !== currentUser;

  const handleStatusChange = async (newStatus: string) => {
    await updateCompanyStatus(company.id, newStatus);
    fetchLeadData();
  };

  const handleAssign = async (repId: string | null) => {
    await assignCompanyLead(company.id, repId);
    fetchLeadData();
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
    fetchLeadData();
  };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-xl overflow-hidden font-sans flex flex-col max-w-6xl w-full mx-auto my-2">
      {/* ── 1. Unified Lead Workspace Header ───────────────────────────── */}
      <div className="bg-slate-900 text-white p-5 space-y-3 border-b border-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-black flex items-center justify-center text-xl shadow-lg shrink-0">
              {company.company_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white truncate">
                  {company.company_name}
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {company.industry || "General Lead"}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium truncate mt-0.5 flex items-center gap-2">
                <span>📍 {company.city || "Location n/a"}{company.country ? `, ${company.country}` : ""}</span>
                <span>•</span>
                <span>👤 {primaryContact ? `${primaryContact.full_name} (${primaryContact.title || "Contact"})` : "No primary contact"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Team Ownership Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-slate-400 font-bold text-[11px]">Owner:</span>
              <select
                value={assignedRep || ""}
                onChange={(e) => handleAssign(e.target.value || null)}
                className="bg-transparent text-white font-extrabold cursor-pointer focus:outline-none text-xs"
              >
                <option value="" className="bg-slate-900 text-slate-300">Unassigned (Available)</option>
                {TEAM_MEMBERS.map(m => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                    Assigned to {m.name}
                  </option>
                ))}
              </select>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Duplicate Work Warning Banner */}
        {isAssignedToOther && (
          <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-200">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>Warning:</strong> This lead is currently assigned to <strong>{assignedRep}</strong>. Communicate with them before taking action to avoid duplicate outreach.
            </span>
          </div>
        )}

        {/* Unified Status Ribbon */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Unified Status:</span>
            <select
              value={company.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-slate-800 text-teal-300 border border-slate-700 rounded-xl px-3 py-1 font-extrabold cursor-pointer focus:ring-2 focus:ring-teal-500 shadow-2xs"
            >
              {UNIFIED_STATUSES.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>Last Updated: {new Date(company.updated_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>Total Activities: {activities.length}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Contact Channels Grid Bar ───────────────────────────────── */}
      <div className="p-4 bg-slate-100 border-b border-slate-200">
        <ContactChannelsGrid
          company={company}
          primaryContact={primaryContact}
          onRefresh={fetchLeadData}
          onEditContact={() => setActiveTab("overview")}
        />
      </div>

      {/* ── 3. Workspace Navigation Tabs ────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-5 flex items-center gap-2 overflow-x-auto">
        {[
          { id: "overview", label: "Overview & Info", icon: Building },
          { id: "research", label: "Research & Angles", icon: Sparkles },
          { id: "history", label: `History (${activities.length})`, icon: Clock },
          { id: "scripts", label: "Scripts & Templates", icon: FileText },
          { id: "tasks", label: `Tasks & Meetings (${followUps.length + meetings.length})`, icon: Calendar },
          { id: "ai", label: "AI Copilot", icon: Bot }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 text-xs font-black flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-slate-900 text-slate-900 bg-slate-50/80"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── 4. Main Body Content Area ───────────────────────────────────── */}
      <div className="p-5 overflow-y-auto max-h-[600px] space-y-4">
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Company & Contact Information
              </h3>
              {!editingOverview ? (
                <button
                  onClick={() => setEditingOverview(true)}
                  className="px-3 py-1 bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Pencil className="h-3 w-3 text-teal-400" /> Edit Details
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingOverview(false)}
                    className="px-3 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveOverview}
                    disabled={saving}
                    className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {editingOverview ? (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-4 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Company Fields</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Company Name</label>
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Industry</label>
                    <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Website</label>
                    <input type="text" value={website} onChange={e => setWebsite(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Company Phone</label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Company Email</label>
                    <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">City / Country</label>
                    <div className="flex gap-1">
                      <input type="text" value={city} placeholder="City" onChange={e => setCity(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 p-2 rounded-lg" />
                      <input type="text" value={country} placeholder="Country" onChange={e => setCountry(e.target.value)} className="w-1/2 bg-slate-50 border border-slate-200 p-2 rounded-lg" />
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block pt-2 border-t border-slate-100">Primary Contact Fields</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Contact Full Name</label>
                    <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Title / Role</label>
                    <input type="text" value={contactTitle} onChange={e => setContactTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">WhatsApp Number</label>
                    <input type="text" value={contactWhatsapp} onChange={e => setContactWhatsapp(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">LinkedIn URL</label>
                    <input type="text" value={contactLinkedin} onChange={e => setContactLinkedin(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Company Card</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Name</span>
                      <span className="font-extrabold text-slate-900 truncate block">{company.company_name}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Industry</span>
                      <span className="font-extrabold text-slate-800 truncate block">{company.industry || "n/a"}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Location</span>
                      <span className="font-semibold text-slate-800 truncate block">{company.city || ""}{company.country ? `, ${company.country}` : "n/a"}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Website</span>
                      <span className="font-semibold text-slate-800 truncate block">{company.website || "n/a"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Primary Contact Person</span>
                  {primaryContact ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Contact Name</span>
                        <span className="font-extrabold text-slate-900 truncate block">{primaryContact.full_name}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Role / Title</span>
                        <span className="font-extrabold text-slate-800 truncate block">{primaryContact.title || "Decision Maker"}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">WhatsApp</span>
                        <span className="font-semibold text-slate-800 truncate block">{primaryContact.whatsapp || "n/a"}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">LinkedIn</span>
                        <span className="font-semibold text-slate-800 truncate block">{primaryContact.linkedin_url || "n/a"}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic py-4 text-center">No primary contact recorded. Click edit to add contact details.</p>
                  )}
                </div>
              </div>
            )}

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
