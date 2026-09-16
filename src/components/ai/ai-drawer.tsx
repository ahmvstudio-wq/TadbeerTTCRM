'use client';

import React, { useState } from 'react';
import { X, ChevronUp, Bot } from 'lucide-react';
import { AIChatInterface } from './ai-chat-interface';

export function AIDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center space-x-2 bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-indigo-400/30"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-indigo-200 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <span className="font-semibold text-sm tracking-wide pr-1">AI Employee Co-Pilot</span>
        </button>
      )}

      {/* Expanded Drawer Modal Panel */}
      {isOpen && (
        <div className="w-[440px] max-w-[92vw] h-[620px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Top Bar Controls */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-950 text-white border-b border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-300">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span>Tadbeer AI Employee Drawer</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Interface Inside Drawer */}
          <div className="flex-1 overflow-hidden">
            <AIChatInterface isCompact={true} />
          </div>
        </div>
      )}
    </div>
  );
}
