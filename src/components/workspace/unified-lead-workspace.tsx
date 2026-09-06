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
import { getCleanIndustry } from "@/lib/utils";

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

  const rJson: any = (company as any).research_json || {};
  const igUrl = extractInstagramUrl(company);
  const igHandle = rJson.instagram_handle || (igUrl ? '@' + igUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '') : null);
  const displayIndustry = getCleanIndustry(company);
  const businessType = rJson.business_type || (company.industry && !company.industry.startsWith('@') && company.industry !== displayIndustry ? company.industry : null);
  const followers = rJson.followers;

  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-xl overflow-hidden font-sans flex flex-col max-w-6xl w-full mx-auto my-2">
      {/* ── 1. Unified Lead Workspace Header ───────────────────────────── */}
      <div className="bg-[#091f24] text-white p-5 space-y-3 border-b border-[#16434d]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 rounded-lg bg-[#0f343c] border border-[#16434d] text-white font-mono font-black flex items-center justify-center text-lg shrink-0 shadow-xs">
              {company.company_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap font-mono">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate font-sans">
                  {company.company_name}
                </h1>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#163f47] text-white border border-[#296875]">
                  {displayIndustry}
                </span>
                {businessType && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#163f47] text-white border border-[#296875]">
                    {businessType}
                  </span>
                )}
                {followers && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#163f47] text-white border border-[#296875]">
                    {followers}
                  </span>
                )}
                {igHandle && (
                  <a
                    href={igUrl || `https://instagram.com/${igHandle.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#163f47] text-white border border-[#296875] hover:bg-[#1f5560] transition flex items-center gap-1"
                  >
                    {igHandle} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              <p className="text-xs text-neutral-300 font-medium truncate mt-1 flex items-center gap-2 font-sans">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-neutral-400" /> {company.city || "Location n/a"}{company.country ? `, ${company.country}` : ""}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><User className="h-3 w-3 text-neutral-400" /> {primaryContact ? `${primaryContact.full_name} (${primaryContact.title || "Contact"})` : "No primary contact"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Team Ownership Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#0f343c] border border-[#16434d] rounded-lg px-2.5 py-1 text-xs font-mono">
              <User className="h-3 w-3 text-neutral-300" />
              <span className="text-neutral-300 font-bold text-[10px]">OWNER:</span>
              <select
                value={assignedRep || ""}
                onChange={(e) => handleAssign(e.target.value || null)}
                className="bg-transparent text-white font-black cursor-pointer focus:outline-none text-xs"
              >
                <option value="" className="bg-[#091f24] text-neutral-300">Unassigned (Available)</option>
                {TEAM_MEMBERS.map(m => (
                  <option key={m.id} value={m.id} className="bg-[#091f24] text-white">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg bg-[#0f343c] text-neutral-300 hover:text-white border border-[#16434d] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Duplicate Work Warning Banner */}
        {isAssignedToOther && (
          <div className="p-2.5 bg-[#0f343c] border border-[#16434d] rounded-lg flex items-center gap-2 text-xs text-white">
            <ShieldAlert className="h-4 w-4 text-white shrink-0" />
            <span>
              <strong>Notice:</strong> This lead is currently assigned to <strong>{assignedRep}</strong>. Communicate before taking action to avoid duplicate touches.
            </span>
          </div>
        )}

        {/* Unified Status Ribbon */}
        <div className="flex items-center justify-between pt-2 border-t border-[#16434d] gap-2 flex-wrap text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-neutral-300 uppercase tracking-wider">STAGE:</span>
            <select
              value={company.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-[#0f343c] text-white border border-[#16434d] rounded-lg px-2.5 py-0.5 font-bold cursor-pointer focus:outline-none"
            >
              {UNIFIED_STATUSES.map(s => (
                <option key={s.id} value={s.id} className="bg-[#091f24] text-white">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-neutral-300">
            <span>UPDATED: {new Date(company.updated_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>TOUCHES: {activities.length}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Contact Channels Grid Bar ───────────────────────────────── */}
      <div className="p-3.5 bg-neutral-50 border-b border-neutral-200">
        <ContactChannelsGrid
          company={company}
          primaryContact={primaryContact}
          onRefresh={fetchLeadData}
          onEditContact={() => setActiveTab("overview")}
        />
      </div>

      {/* ── 3. Workspace Navigation Tabs ────────────────────────────────── */}
      <div className="bg-white border-b border-neutral-200 px-4 flex items-center gap-1 overflow-x-auto font-mono">
        {[
          { id: "overview", label: "Overview", icon: Building },
          { id: "research", label: "Research", icon: Sparkles },
          { id: "history", label: `History (${activities.length})`, icon: Clock },
          { id: "scripts", label: "Scripts", icon: FileText },
          { id: "tasks", label: `Tasks (${followUps.length + meetings.length})`, icon: Calendar },
          { id: "ai", label: "AI Assistant", icon: Bot }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-3 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-black text-black bg-neutral-100 font-black"
                  : "border-transparent text-neutral-500 hover:text-black hover:bg-neutral-50"
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-black" : "text-neutral-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── 4. Main Body Content Area ───────────────────────────────────── */}
      <div className="p-4 overflow-y-auto max-h-[600px] space-y-4">
        {activeTab === "overview" && (
          <div className="space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <h3 className="text-xs font-mono font-black text-black uppercase tracking-wider">
                Company & Contact
              </h3>
              {!editingOverview ? (
                <button
                  onClick={() => setEditingOverview(true)}
                  className="px-2.5 py-1 bg-black text-white font-mono font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Pencil className="h-3 w-3 text-white" /> Edit Details
                </button>
              ) : (
                <div className="flex gap-1.5 font-mono">
                  <button
                    onClick={() => setEditingOverview(false)}
                    className="px-2.5 py-1 bg-neutral-100 text-neutral-700 font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveOverview}
                    disabled={saving}
                    className="px-2.5 py-1 bg-black text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            {editingOverview ? (
              <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-4 text-xs">
                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Company Fields</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Company Name</label>
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Industry</label>
                    <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Website</label>
                    <input type="text" value={website} onChange={e => setWebsite(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Phone</label>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Email</label>
                    <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">City / Country</label>
                    <div className="flex gap-1">
                      <input type="text" value={city} placeholder="City" onChange={e => setCity(e.target.value)} className="w-1/2 bg-neutral-50 border border-neutral-200 p-2 rounded-lg" />
                      <input type="text" value={country} placeholder="Country" onChange={e => setCountry(e.target.value)} className="w-1/2 bg-neutral-50 border border-neutral-200 p-2 rounded-lg" />
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block pt-2 border-t border-neutral-100">Primary Contact Fields</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Contact Full Name</label>
                    <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">Title / Role</label>
                    <input type="text" value={contactTitle} onChange={e => setContactTitle(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">WhatsApp Number</label>
                    <input type="text" value={contactWhatsapp} onChange={e => setContactWhatsapp(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded-lg" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 block mb-0.5">LinkedIn URL</label>
                    <input type="text" value={contactLinkedin} onChange={e => setContactLinkedin(e.target.value)} className="w-full bg-neutral-50 border border-neutral-200 p-2 rounded-lg" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Company Info</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block">Name</span>
                      <span className="font-bold text-black truncate block">{company.company_name}</span>
                    </div>
                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block">Industry</span>
                      <span className="font-bold text-black truncate block">{displayIndustry}</span>
                    </div>
                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block">Location</span>
                      <span className="font-bold text-black truncate block">{company.city || "n/a"}{company.country ? `, ${company.country}` : ""}</span>
                    </div>
                    <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block">Website</span>
                      <span className="font-bold text-black truncate block">{company.website || "n/a"}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-neutral-200 space-y-3">
                  <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider block">Primary Contact</span>
                  {primaryContact ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase block">Name</span>
                        <span className="font-bold text-black truncate block">{primaryContact.full_name || "n/a"}</span>
                      </div>
                      <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase block">Title</span>
                        <span className="font-bold text-black truncate block">{primaryContact.title || "Decision Maker"}</span>
                      </div>
                      <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase block">WhatsApp</span>
                        <span className="font-bold text-black truncate block font-mono">{primaryContact.whatsapp || "n/a"}</span>
                      </div>
                      <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase block">Email</span>
                        <span className="font-bold text-black truncate block">{primaryContact.email || "n/a"}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 italic py-4">No primary contact recorded. Click edit to add.</p>
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
