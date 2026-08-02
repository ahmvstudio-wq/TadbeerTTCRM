'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, RefreshCw, CheckCircle2, Clock, Calendar, ArrowRight, Zap } from 'lucide-react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  executedTools?: Array<{ tool: string; result: any }>;
}

const STARTER_PROMPTS = [
  { label: '📊 Executive Summary', query: 'Show me today\'s executive summary and key CRM stats' },
  { label: '⚠️ Overdue Follow-ups', query: 'What follow-ups are overdue and need urgent action?' },
  { label: '💼 Pipeline Status', query: 'Give me a breakdown of all active pipeline opportunities' },
  { label: '📅 Meetings Schedule', query: 'Show all upcoming meetings scheduled this week' },
  { label: '✉️ Tadbeer Outreach Pitch', query: 'Recommend outreach message templates for manpower & domestic staffing' }
];

export function AIChatInterface({ isCompact = false }: { isCompact?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### 👋 Welcome to Tadbeer Co-Pilot!
I am your **AI Sales Operations Employee**. I manage CRM records, keep track of daily follow-ups, update deal pipeline stages, and generate high-converting outreach copy.

How can I assist your sales team today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'Action completed successfully.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executedTools: data.executedTools
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '⚠️ **Unable to process request**. Please verify server connection and try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedMarkdown = (content: string) => {
    // Simple markdown renderer for headers, bold, bullet points, and code blocks
    return content.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-lg font-bold text-slate-900 mt-3 mb-1.5">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('#### ')) {
        return <h4 key={idx} className="text-md font-semibold text-slate-800 mt-2 mb-1">{line.replace('#### ', '')}</h4>;
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 border-emerald-500 bg-emerald-50/50 p-2.5 rounded-r text-sm text-slate-700 italic my-2">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      if (line.startsWith('- ')) {
        const parts = line.replace('- ', '').split('**');
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-slate-700 my-1">
            {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold text-slate-900">{p}</strong> : p)}
          </li>
        );
      }
      if (line.trim() === '') return <div key={idx} className="h-1.5" />;
      
      const parts = line.split('**');
      return (
        <p key={idx} className="text-sm text-slate-700 leading-relaxed my-0.5">
          {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="font-semibold text-slate-900">{p}</strong> : p)}
        </p>
      );
    });
  };

  return (
    <div className={`flex flex-col h-full bg-white ${isCompact ? '' : 'rounded-2xl border border-slate-200 shadow-sm overflow-hidden'}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shadow-inner">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-sm tracking-wide text-white">Tadbeer Co-Pilot</h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400">AI Sales Operations & CRM Employee</p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          title="Reset Conversation"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Action Chips Bar */}
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center whitespace-nowrap">
          <Zap className="w-3 h-3 mr-1 text-indigo-500" /> Quick Actions:
        </span>
        {STARTER_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt.query)}
            disabled={isLoading}
            className="px-3 py-1 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 text-xs font-medium rounded-full border border-slate-200 shadow-2xs whitespace-nowrap transition-all flex items-center space-x-1"
          >
            <span>{prompt.label}</span>
          </button>
        ))}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-2xs ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-gradient-to-br from-indigo-600 to-slate-900 text-white'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3.5 shadow-2xs ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-xs'
                : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div>
                  {msg.executedTools && msg.executedTools.length > 0 && (
                    <div className="mb-2.5 flex items-center space-x-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1 text-xs text-indigo-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Executed CRM Tool: <code>{msg.executedTools.map(t => t.tool).join(', ')}</code></span>
                    </div>
                  )}
                  <div className="space-y-1">
                    {renderFormattedMarkdown(msg.content)}
                  </div>
                </div>
              )}

              <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-slate-400'}`}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-slate-900 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs font-medium text-slate-500 ml-1">Analyzing CRM data & executing tasks...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3.5 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Employee to manage CRM, query stats, draft outreach..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none py-1.5"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center justify-center shrink-0 shadow-2xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[11px] text-slate-400 mt-2 text-center">
          Tadbeer AI Employee directly reads & updates your Supabase CRM database with 100% accuracy.
        </p>
      </div>
    </div>
  );
}
