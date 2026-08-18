"use client";

import { useState } from "react";
import {
  Phone,
  MessageCircle,
  Globe2,
  Camera,
  Mail,
  Globe,
  Plus,
  ExternalLink,
  CheckCircle2,
  X,
  Save,
  Loader2,
  Pencil
} from "lucide-react";
import { Company, Contact } from "@/lib/types/database";
import { addCompanyActivity, updateCompany, upsertCompanyContact } from "@/lib/actions/companies";
import { formatWhatsAppNumber, formatPhoneNumberForDisplay, getCleanDraftMessage, getCleanObservation } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmailComposerModal } from "@/components/outreach/email-composer-modal";

interface ContactChannelsGridProps {
  company: Company;
  primaryContact: Contact | null;
  onRefresh?: () => void;
  onEditContact?: () => void;
}

export function extractInstagramUrl(input: any): string {
  if (!input) return "";

  // 0. Direct JSON check if input has notes or research_json
  if (typeof input === "object") {
    try {
      if (input.instagram_handle) {
        const clean = String(input.instagram_handle).replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^\/+/, '').replace(/\/+$/, '').replace(/^@+/, '').trim();
        if (clean) return `https://www.instagram.com/${clean}/`;
      }
      if (input.notes && (input.notes.startsWith('{') || input.notes.startsWith('['))) {
        const parsed = JSON.parse(input.notes);
        if (parsed.instagram_handle) {
          const clean = String(parsed.instagram_handle).replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^\/+/, '').replace(/\/+$/, '').replace(/^@+/, '').trim();
          if (clean) return `https://www.instagram.com/${clean}/`;
        }
      }
    } catch {}
  }

  const textToScan = typeof input === "object"
    ? `${input.website || ""} ${input.notes || ""} ${input.pain_point || ""} ${(input.contacts || []).map((c: any) => c.notes || '').join(' ')}`
    : String(input);

  // 1. Direct http(s) Instagram URL anywhere in text
  const directMatch = textToScan.match(/https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9_.]+(?:\/[^\s\n"']*)?/i);
  if (directMatch) {
    return directMatch[0].trim().replace(/[,;)]$/, '');
  }

  // 2. Pattern: Instagram: @handle OR Instagram: handle OR Instagram: https://...
  const handleMatch = textToScan.match(/Instagram:\s*@?([a-zA-Z0-9_./:]+)/i);
  if (handleMatch && handleMatch[1]) {
    const val = handleMatch[1].trim();
    if (val.toLowerCase().startsWith("http")) {
      return val;
    }
    const handle = val.replace(/^@/, '').replace(/\/$/, '');
    if (handle && handle.length >= 2) {
      return `https://www.instagram.com/${handle}/`;
    }
  }

  // 3. Pattern: @handle in text
  const atMatch = textToScan.match(/@([a-zA-Z0-9_.]+)/);
  if (atMatch && atMatch[1]) {
    const handle = atMatch[1].trim();
    if (handle.length >= 3 && !['gmail', 'yahoo', 'hotmail', 'outlook', 'today', 'team', 'gmail.com'].includes(handle.toLowerCase())) {
      return `https://www.instagram.com/${handle}/`;
    }
  }

  return "";
}

export function ContactChannelsGrid({
  company,
  primaryContact,
  onRefresh,
  onEditContact
}: ContactChannelsGridProps) {
  const [loggingChannel, setLoggingChannel] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Form states for contact channels modal
  const [formContactName, setFormContactName] = useState(primaryContact?.full_name || company.company_name || "");
  const [formTitle, setFormTitle] = useState(primaryContact?.title || "Decision Maker");
  const [formPhone, setFormPhone] = useState(primaryContact?.phone || company.phone || "");
  const [formWhatsapp, setFormWhatsapp] = useState(primaryContact?.whatsapp || primaryContact?.phone || company.phone || "");
  const [formEmail, setFormEmail] = useState(primaryContact?.email || company.email || "");
  const [formWebsite, setFormWebsite] = useState(company.website && !company.website.includes("instagram.com") ? company.website : "");
  const [formInstagram, setFormInstagram] = useState(extractInstagramUrl(company) || "");
  const [formLinkedin, setFormLinkedin] = useState(primaryContact?.linkedin_url || company.linkedin_url || "");

  // Channel extractors
  const phone = primaryContact?.phone || company.phone;
  const whatsapp = primaryContact?.whatsapp || primaryContact?.phone || company.phone;
  const linkedin = primaryContact?.linkedin_url || company.linkedin_url;
  
  // Extract Instagram distinctly (never confuse with corporate website)
  const instagram = extractInstagramUrl(company);

  const email = primaryContact?.email || company.email;

  // Corporate website ONLY if it's not a social media link
  const rawWebsite = company.website;
  const isWebsiteSocial = rawWebsite ? (rawWebsite.includes("instagram.com") || rawWebsite.includes("linkedin.com")) : false;
  const corporateWebsite = (rawWebsite && !isWebsiteSocial) ? rawWebsite : null;

  const waDigits = whatsapp ? formatWhatsAppNumber(whatsapp) : "";
  const waUrl = waDigits ? `https://wa.me/${waDigits}` : null;
  const cleanWebsite = corporateWebsite
    ? corporateWebsite.startsWith("http") ? corporateWebsite : `https://${corporateWebsite}`
    : null;

  const handleSaveContactChannels = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Update company record (website, phone, email)
      let notesUpdate = company.notes || "";
      if (formInstagram && !notesUpdate.toLowerCase().includes("instagram:")) {
        notesUpdate += `\nInstagram: ${formInstagram}`;
      }

      await updateCompany(company.id, {
        phone: formPhone,
        email: formEmail,
        website: formWebsite,
        notes: notesUpdate
      });

      // 2. Upsert primary contact record
      await upsertCompanyContact(company.id, {
        id: primaryContact?.id,
        full_name: formContactName,
        title: formTitle,
        phone: formPhone,
        whatsapp: formWhatsapp,
        email: formEmail,
        linkedin_url: formLinkedin,
        is_primary: true
      });

      setShowEditModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to update contact info:", err);
    } finally {
      setSaving(false);
    }
  };

  const channels = [
    {
      id: "phone",
      name: "Phone Call",
      available: !!phone,
      value: phone ? formatPhoneNumberForDisplay(phone) : null,
      icon: Phone,
      color: "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700",
      missingColor: "bg-slate-50 text-slate-400 border-slate-200",
      actionLabel: "Call Now",
      action: () => {
        if (phone) {
          window.location.href = `tel:${phone}`;
          logQuickTouch("phone", `Initiated call to ${phone}`);
        }
      }
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      available: !!whatsapp,
      value: whatsapp ? formatPhoneNumberForDisplay(whatsapp) : null,
      icon: MessageCircle,
      color: "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700",
      missingColor: "bg-slate-50 text-slate-400 border-slate-200",
      actionLabel: "Open Chat",
      action: () => {
        if (waUrl) {
          window.open(waUrl, "_blank");
          logQuickTouch("whatsapp", `Opened WhatsApp chat with ${whatsapp}`);
        }
      }
    },
    {
      id: "instagram",
      name: "Instagram",
      available: !!instagram,
      value: instagram ? (instagram.length > 28 ? instagram.slice(0, 26) + "..." : instagram) : null,
      icon: Camera,
      color: "bg-pink-600 text-white border-pink-700 hover:bg-pink-700",
      missingColor: "bg-slate-50 text-slate-400 border-slate-200",
      actionLabel: "Open IG",
      action: () => {
        if (instagram) {
          const url = instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace(/^@/, '')}`;
          window.open(url, "_blank");
          logQuickTouch("instagram", `Opened Instagram profile: ${instagram}`);
        }
      }
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      available: !!linkedin,
      value: linkedin ? (linkedin.length > 28 ? linkedin.slice(0, 26) + "..." : linkedin) : null,
      icon: Globe2,
      color: "bg-blue-600 text-white border-blue-700 hover:bg-blue-700",
      missingColor: "bg-slate-50 text-slate-400 border-slate-200",
      actionLabel: "Open Profile",
      action: () => {
        if (linkedin) {
          const url = linkedin.startsWith("http") ? linkedin : `https://${linkedin}`;
          window.open(url, "_blank");
          logQuickTouch("linkedin", `Opened LinkedIn profile: ${linkedin}`);
        }
      }
    },
    {
      id: "email",
      name: "Email",
      available: !!email,
      value: email,
      icon: Mail,
      color: "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700",
      missingColor: "bg-slate-50 text-slate-400 border-slate-200",
      actionLabel: "Send Email",
      action: () => {
        if (email) {
          setEmailModalOpen(true);
        }
      }
    },
    {
      id: "website",
      name: "Corporate Website",
      available: !!corporateWebsite,
      value: corporateWebsite ? (corporateWebsite.length > 25 ? corporateWebsite.slice(0, 23) + "..." : corporateWebsite) : null,
      icon: Globe,
      color: "bg-slate-800 text-white border-slate-900 hover:bg-slate-900",
      missingColor: "bg-slate-50 text-slate-400 border-slate-200",
      actionLabel: "Visit Site",
      action: () => {
        if (cleanWebsite) {
          window.open(cleanWebsite, "_blank");
        }
      }
    }
  ];

  const logQuickTouch = async (channelId: string, desc: string) => {
    setLoggingChannel(channelId);
    await addCompanyActivity(
      company.id,
      `Action: ${channelId.toUpperCase()}`,
      desc,
      "outreach_sent"
    );
    setLoggingChannel(null);
    if (onRefresh) onRefresh();
  };

  const availableCount = channels.filter(c => c.available).length;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 font-sans">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Verified Contact Channels
          </span>
          <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-teal-100 text-teal-900 border border-teal-200">
            {availableCount} / {channels.length} Configured
          </span>
        </div>

        <button
          onClick={() => setShowEditModal(true)}
          className="text-xs text-teal-800 font-black hover:text-teal-950 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
        >
          <Pencil className="h-3.5 w-3.5 text-teal-700" /> Edit Contact Info
        </button>
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {channels.map((ch) => {
          const Icon = ch.icon;
          return (
            <div
              key={ch.id}
              className={`p-3 rounded-2xl border flex flex-col justify-between transition-all ${
                ch.available
                  ? "bg-slate-50/90 border-slate-200/90 hover:border-slate-300"
                  : ch.missingColor
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      ch.available ? "text-slate-800" : "text-slate-400"
                    }`}
                  />
                  <span className="text-[11px] font-black truncate text-slate-900">
                    {ch.name}
                  </span>
                </div>
                {ch.available ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <span className="text-[9px] font-black text-slate-400 uppercase shrink-0">
                    MISSING
                  </span>
                )}
              </div>

              {ch.available ? (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-700 truncate" title={String(ch.value)}>
                    {ch.value}
                  </p>
                  <button
                    onClick={ch.action}
                    disabled={loggingChannel === ch.id}
                    className={`w-full text-[10px] font-extrabold py-1.5 px-2 rounded-xl border shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer ${ch.color}`}
                  >
                    <span>{ch.actionLabel}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  <p className="text-[10px] font-medium italic text-slate-400">Not provided</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Interactive Edit Contact Channels Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)}>
        <DialogContent className="sm:max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl font-sans">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
              <Pencil className="h-4 w-4 text-teal-600" /> Edit Prospect Contact Channels
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveContactChannels} className="space-y-3.5 pt-2 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Primary Contact Full Name</label>
              <Input value={formContactName} onChange={e => setFormContactName(e.target.value)} placeholder="Full Name" className="h-9 text-xs rounded-xl bg-slate-50" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Title / Role</label>
                <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Owner / Director" className="h-9 text-xs rounded-xl bg-slate-50" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Phone Number (+968)</label>
                <Input value={formPhone} onChange={e => setFormPhone(e.target.value)} placeholder="+968 9xxx xxxx" className="h-9 text-xs rounded-xl bg-slate-50 font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">WhatsApp Number</label>
                <Input value={formWhatsapp} onChange={e => setFormWhatsapp(e.target.value)} placeholder="+968 9xxx xxxx" className="h-9 text-xs rounded-xl bg-slate-50 font-mono" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Email Address</label>
                <Input value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="info@company.com" className="h-9 text-xs rounded-xl bg-slate-50" />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-2 space-y-3">
              <span className="text-[10px] font-black text-teal-800 uppercase tracking-wider block">Dedicated Social & Web Footprint</span>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Instagram Profile / Handle</label>
                <Input value={formInstagram} onChange={e => setFormInstagram(e.target.value)} placeholder="https://instagram.com/brand or @brand" className="h-9 text-xs rounded-xl bg-slate-50 font-mono" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">LinkedIn Profile Link</label>
                <Input value={formLinkedin} onChange={e => setFormLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className="h-9 text-xs rounded-xl bg-slate-50 font-mono" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Corporate Website (Non-Social)</label>
                <Input value={formWebsite} onChange={e => setFormWebsite(e.target.value)} placeholder="https://company.com" className="h-9 text-xs rounded-xl bg-slate-50 font-mono" />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="h-9 text-xs rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="h-9 text-xs rounded-xl font-black bg-slate-900 text-white hover:bg-slate-800">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                Save Channels
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Direct Email Composer with Gmail & Outlook Chooser */}
      {email && (
        <EmailComposerModal
          isOpen={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          email={email}
          companyName={company.company_name}
          prospectName={primaryContact?.full_name}
          draftMessage={getCleanDraftMessage(company)}
          observation={getCleanObservation(company)}
          onSent={() => logQuickTouch("email", `Initiated email to ${email}`)}
        />
      )}
    </div>
  );
}
