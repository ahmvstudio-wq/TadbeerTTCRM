"use client";

import { useState, useEffect } from "react";
import {
  Phone,
  MessageCircle,
  CheckCircle2,
  X,
  Plus,
  Loader2,
  ChevronRight,
  User,
  Building2,
  RefreshCw,
  Clock,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Company } from "@/lib/types/database";
import { useUnifiedLead } from "@/context/unified-lead-context";
import { loadMoreCallBatch } from "@/lib/actions/cadence";
import { updateCompanyStatus, addCompanyActivity } from "@/lib/actions/companies";
import { formatWhatsAppNumber, formatPhoneNumberForDisplay } from "@/lib/utils";

interface ToCallListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialLeads: Company[];
  totalPoolCount: number;
}

export function ToCallListDrawer({
  isOpen,
  onClose,
  initialLeads,
  totalPoolCount
}: ToCallListDrawerProps) {
  const { openLead } = useUnifiedLead();
  const [leads, setLeads] = useState<Company[]>(initialLeads);
  const [loadingMore, setLoadingMore] = useState(false);
  const [calledIds, setCalledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLeads(initialLeads);
    const called = new Set<string>();
    initialLeads.forEach(l => {
      if (l.status === 'called' || l.status === 'contacted' || l.status === 'meeting_booked') {
        called.add(l.id);
      }
    });
    setCalledIds(called);
  }, [initialLeads]);

  if (!isOpen) return null;

  const totalBatch = leads.length;
  const completedCount = calledIds.size;
  const progressPct = totalBatch > 0 ? Math.round((completedCount / totalBatch) * 100) : 0;
  const allCompleted = totalBatch > 0 && completedCount >= totalBatch;

  const handleMarkCalled = async (lead: Company) => {
    const nextSet = new Set(calledIds);
    nextSet.add(lead.id);
    setCalledIds(nextSet);

    await updateCompanyStatus(lead.id, "called");
    await addCompanyActivity(lead.id, "call_made", `Cold call completed with ${lead.company_name}`);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const res = await loadMoreCallBatch(20, "Ramij");
    if (res.data && res.data.length > 0) {
      setLeads(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newUnique = res.data.filter((d: any) => !existingIds.has(d.id));
        return [...prev, ...newUnique];
      });
    }
    setLoadingMore(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col font-sans border-l border-slate-200">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Phone className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-white">Daily To Call List</h2>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                  Limit: 20 Leads
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Targeting Ramij&apos;s daily 20 verified numbers ({totalPoolCount} Total Verified Pool)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Daily Batch Progress Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#174E59]" />
              Daily Outreach Progress
            </span>
            <span className="text-[#174E59] font-black">
              {completedCount} of {totalBatch} Reached Out ({progressPct}%)
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden p-0.5">
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-amber-500 via-teal-600 to-teal-700 rounded-full transition-all duration-500"
            />
          </div>

          {allCompleted && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-teal-900 font-bold">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-teal-600" /> Excellent! All 20 daily call leads reached out.</span>
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                size="sm"
                className="h-7 text-[11px] font-black bg-[#174E59] hover:bg-[#0f343c] text-white rounded-lg"
              >
                {loadingMore ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                Load Next 20 Leads
              </Button>
            </div>
          )}
        </div>

        {/* Lead List Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {leads.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium space-y-3">
              <Phone className="h-10 w-10 mx-auto text-slate-300 stroke-1" />
              <p>No call leads currently assigned to today&apos;s batch.</p>
              <Button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="h-9 text-xs font-bold bg-[#174E59] text-white rounded-xl"
              >
                {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                Fetch Today&apos;s 20 Verified Leads
              </Button>
            </div>
          ) : (
            leads.map((lead, idx) => {
              const isCalled = calledIds.has(lead.id);
              const primaryContact = ((lead as any).contacts || []).find((c: any) => c.is_primary) || (lead as any).contacts?.[0];
              const phoneNum = lead.phone || primaryContact?.phone || primaryContact?.whatsapp || "";
              const contactName = primaryContact?.full_name || "Decision Maker";

              const isSerialId = !lead.company_name || /^TT-\d+/i.test(lead.company_name.trim());
              const displayName = isSerialId 
                ? (primaryContact?.full_name ? `${primaryContact.full_name}${lead.industry ? ` - ${lead.industry}` : ''}` : lead.industry ? `${lead.industry} Enterprise` : lead.company_name)
                : lead.company_name;

              return (
                <div
                  key={lead.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCalled
                      ? "bg-slate-50 border-slate-200 opacity-75"
                      : "bg-white border-slate-200 shadow-xs hover:shadow-md hover:border-[#174E59]/40"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 tracking-tight">
                        {displayName}
                      </h4>
                      {isCalled ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-teal-600" /> Called
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Call
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" /> {contactName}
                      </span>
                      <span>•</span>
                      <span className="text-slate-600 font-bold">{lead.industry || "Enterprise"}</span>
                    </div>

                    <p className="text-xs font-mono font-bold text-teal-700 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-teal-600 inline" /> {phoneNum ? formatPhoneNumberForDisplay(phoneNum) : "No phone listed"}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {phoneNum && (
                      <>
                        <a
                          href={`tel:${phoneNum}`}
                          className="h-8 px-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-extrabold text-xs flex items-center gap-1 border border-teal-200"
                          title="Click to Call"
                        >
                          <Phone className="h-3.5 w-3.5 text-teal-600" /> Call
                        </a>
                        {formatWhatsAppNumber(phoneNum) && (
                          <a
                            href={`https://wa.me/${formatWhatsAppNumber(phoneNum)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1 border border-emerald-700 shadow-xs"
                            title="Open WhatsApp Chat"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> WA
                          </a>
                        )}
                      </>
                    )}

                    <Button
                      onClick={() => openLead(lead.id)}
                      className="h-8 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1"
                    >
                      Workspace
                    </Button>

                    {!isCalled && (
                      <Button
                        onClick={() => handleMarkCalled(lead)}
                        className="h-8 px-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs"
                        title="Mark as Reached Out"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer: Manual Load More Contacts Button */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-900">{leads.length}</span> of <span className="font-bold text-slate-900">{totalPoolCount}</span> Verified Pool
          </div>

          <Button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="h-9 px-4 text-xs font-extrabold bg-[#174E59] hover:bg-[#0f343c] text-white rounded-2xl shadow-xs"
          >
            {loadingMore ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Plus className="h-3.5 w-3.5 mr-1.5" />
            )}
            More Contacts (+20 Leads)
          </Button>
        </div>

      </div>
    </div>
  );
}
