"use client";

import { useState } from "react";
import {
  X, Mail, ExternalLink, Copy, Check, Sparkles, Building2, User, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { openEmailComposer, type EmailClientType } from "@/lib/utils";

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  companyName: string;
  prospectName?: string;
  draftMessage?: string;
  observation?: string;
  onSent?: () => Promise<void> | void;
}

export function EmailComposerModal({
  isOpen,
  onClose,
  email,
  companyName,
  prospectName,
  draftMessage = "",
  observation = "",
  onSent
}: EmailComposerModalProps) {
  const [subject, setSubject] = useState(
    companyName ? `Observation regarding ${companyName}` : "Quick inquiry"
  );
  const [message, setMessage] = useState(draftMessage || "Assalamu Alaikum, I noticed your business growth in Muscat and wanted to reach out.");
  const [copied, setCopied] = useState(false);
  const [logging, setLogging] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunch = async (client: EmailClientType) => {
    handleCopy();
    openEmailComposer({
      client,
      to: email,
      companyName,
      prospectName,
      subject,
      body: message
    });

    if (onSent) {
      setLogging(true);
      try {
        await onSent();
      } catch (e) {
        console.error(e);
      } finally {
        setLogging(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/20 border border-violet-400/30 flex items-center justify-center text-violet-400 font-black text-lg">
              <Mail className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Send Direct Email</h3>
                <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/30 text-[10px] font-bold">
                  Gmail & Outlook Ready
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pre-embedded recipient, subject line, & custom greeting
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          
          {/* Target Lead Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Company / Recipient</span>
              <span className="font-extrabold text-slate-900 dark:text-white truncate block mt-0.5">{companyName}</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px] truncate block">{email}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Decision Maker</span>
              <span className="font-extrabold text-slate-900 dark:text-white truncate block mt-0.5">{prospectName || "Business Owner"}</span>
              <span className="text-slate-500 text-[11px] block">Primary Stakeholder</span>
            </div>
          </div>

          {/* Observation Note if Available */}
          {observation && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Pre-Researched Signal:</span> &ldquo;{observation}&rdquo;
              </div>
            </div>
          )}

          {/* Subject Line Input */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Email Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Message Body Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Email Body Draft
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied to Clipboard!" : "Copy Body"}
              </button>
            </div>
            <textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-xl text-xs text-slate-900 dark:text-white font-medium leading-relaxed resize-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>

        {/* Action Footer with Gmail, Outlook, Default App choices */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 font-bold">
            Select composer client to launch:
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              onClick={() => handleLaunch('gmail')}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              Open Gmail Web
            </Button>

            <Button
              type="button"
              onClick={() => handleLaunch('outlook')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              Open Outlook Web
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleLaunch('default')}
              className="text-xs font-semibold px-3 py-2.5 rounded-xl border-slate-300 cursor-pointer"
            >
              Default App
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
