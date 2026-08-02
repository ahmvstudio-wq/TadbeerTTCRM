'use client';

import React from 'react';
import { AIChatInterface } from '@/components/ai/ai-chat-interface';
import { Bot, Sparkles, CheckCircle2, ShieldCheck, Mail, Send, Calendar, PieChart, FileText } from 'lucide-react';

export default function AIEmployeePage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight">Tadbeer AI Employee Workspace</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                Operational
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              Autonomous Sales Operations Lead responsible for managing CRM data, sending outreach emails, drafting replies, and tracking daily performance.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-slate-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold text-white">Full DB Permissions & Audit</div>
            <div>Connected to Supabase CRM & Outreach Engine</div>
          </div>
        </div>
      </div>

      {/* Feature Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Outreach Dispatch</div>
            <div className="text-sm font-bold text-slate-900">Send Emails & Log Touches</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Objection Handling</div>
            <div className="text-sm font-bold text-slate-900">Draft Replies to Leads</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">CRM Cadence</div>
            <div className="text-sm font-bold text-slate-900">Follow-ups & Meetings</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Daily Reports</div>
            <div className="text-sm font-bold text-slate-900">AI Task & Audit Summary</div>
          </div>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div className="flex-1 min-h-0">
        <AIChatInterface isCompact={false} />
      </div>
    </div>
  );
}
