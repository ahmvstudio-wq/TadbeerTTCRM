import { NextRequest, NextResponse } from 'next/server';
import { TADBEER_AI_EMPLOYEE_PROMPT } from '@/lib/ai/system-prompt';
import {
  aiTools,
  getDashboardMetricsHandler,
  sendEmailOutreachHandler,
  draftReplyHandler,
  getDailyAiReportHandler
} from '@/lib/ai/ai-tools';
import { getFollowUps } from '@/lib/actions/followups';
import { getOpportunities, getPipelineStats } from '@/lib/actions/opportunities';
import { getMeetings } from '@/lib/actions/meetings';
import { getCompanies } from '@/lib/actions/companies';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Clean messages for LLM API
    const rawMessages = messages || [];
    const cleanedMessages = rawMessages
      .filter((m: any) => m && m.content && (m.role === 'user' || m.role === 'assistant'))
      .slice(-2) // Keep only the last 2 messages to prevent Groq token limits
      .map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: String(m.content).substring(0, 1000) // Truncate huge payloads from previous tool results
      }));

    const lastUserMessage = cleanedMessages[cleanedMessages.length - 1]?.content || '';
    const lowerQuery = lastUserMessage.toLowerCase();

    // Helper for formatting tool outputs into natural text if model text is empty
    // Helper for formatting tool outputs into natural text if model text is empty
    const formatToolResultsToText = (toolResults: any[]) => {
      if (!toolResults || toolResults.length === 0) return '';
      let text = '### 🤖 AI Actions Executed & Data Updated\n\n';
      for (const t of toolResults) {
        const name = t.toolName || t.tool || 'CRM Action';
        const formattedName = name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        text += `- ✅ **${formattedName}**\n`;
        const val = t.output || t.result;
        if (val) {
          if (typeof val === 'object') {
            text += `  - Details: \`${JSON.stringify(val).substring(0, 300)}\`\n`;
          } else {
            text += `  - Details: ${val}\n`;
          }
        }
      }
      return text;
    };

    // 1. Check for GEMINI_API_KEY or GROQ_API_KEY (Custom ReAct Loop to bypass Vercel SDK tool limits)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (geminiKey || process.env.GROQ_API_KEY) {
      const { generateText } = await import('ai');
      let chatModel;
      
      if (geminiKey) {
        const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
        const google = createGoogleGenerativeAI({ apiKey: geminiKey });
        chatModel = google('gemini-1.5-flash');
      } else {
        const { groq } = await import('@ai-sdk/groq');
        chatModel = groq('llama-3.1-8b-instant');
      }
      
      let responseContent = '';
      const executedTools: any[] = [];
      let toolResultsData: any[] = [];

      try {
        // PASS 1: Ask model which tools to call
        const toolDecisionResult = await generateText({
          model: chatModel,
          system: `You are an elite AI Sales Operations Agent. You must decide which actions to take to fulfill the user's request.
Output ONLY a raw JSON array of tool calls you want to execute. Do not output any markdown formatting, just the raw JSON.
Example format:
[
  { "tool": "search_companies_and_contacts", "args": { "query": "tech" } },
  { "tool": "create_followup", "args": { "company_id": "123", "subject": "Check in", "due_date": "2026-08-01" } }
]
If you do not need any tools, output: []

Available tools:
- auto_populate_daily_cadence_and_proposals: { user_email?: string }
- get_daily_ai_performance_report: {}
- get_followups: { filter: 'due_today' | 'overdue' | 'pending' | 'all' }
- create_followup: { company_id: string, contact_id?: string, due_date: string (YYYY-MM-DD), due_time?: string, subject: string, description?: string, channel?: 'call' | 'whatsapp' | 'email' | 'linkedin' | 'meeting' }
- complete_followup: { id: string, notes?: string }
- get_pipeline_and_deals: { stage?: string }
- update_deal_stage: { opportunity_id?: string, deal_id?: string, stage: string }
- create_deal: { company_id: string, contact_id?: string, title: string, estimated_value: number, currency: string, stage: string }
- search_companies_and_contacts: { query: string }
- get_meetings_schedule: { filter: 'upcoming' | 'past' | 'all' }
- schedule_meeting: { company_id: string, contact_id?: string, title: string, description?: string, meeting_date: string, duration_minutes: number }
- update_meeting_status: { id: string, status: 'completed' | 'cancelled' | 'no_show' }
- send_email_outreach: { company_id: string, contact_id?: string, recipient_email: string, subject: string, body: string, service_line?: string }
- draft_reply_to_lead: { incoming_message: string, objection_type?: string, service_line?: string }
- get_dashboard_metrics: {}
- create_company: { company_name: string, industry?: string, website?: string, phone?: string, email?: string, country?: string, city?: string, notes?: string, contact_name?: string, contact_email?: string, contact_phone?: string, contact_title?: string }
- update_company: { id: string, company_name?: string, industry?: string, website?: string, phone?: string, email?: string, country?: string, city?: string, notes?: string }
- delete_record: { entity_type: 'company' | 'contact' | 'opportunity' | 'followup' | 'meeting', id: string }
- get_call_queue: {}
- record_call_log: { call_queue_id?: string, company_id?: string, contact_id?: string, call_status?: 'connected' | 'no_answer' | 'busy' | 'voicemail' | 'wrong_number', call_notes?: string, duration_seconds?: number }
- find_and_delete_duplicates: {} (ALWAYS call this when the user asks to delete or remove duplicate entries)
`,
          messages: cleanedMessages,
        } as any);

        // Parse tool calls
        let toolCalls = [];
        try {
          const rawText = toolDecisionResult.text.replace(/```json/g, '').replace(/```/g, '').trim();
          toolCalls = JSON.parse(rawText);
        } catch (e) {
          console.error("Groq JSON tool parsing failed:", e, toolDecisionResult.text);
        }

        // Execute tools autonomously
        if (Array.isArray(toolCalls) && toolCalls.length > 0) {
          for (const tc of toolCalls) {
            if (tc.tool && aiTools[tc.tool]) {
              try {
                const rawData = await aiTools[tc.tool].execute(tc.args || {}, {});
                executedTools.push({ tool: tc.tool, result: tc.args });
                toolResultsData.push({ tool: tc.tool, output: rawData });
              } catch (execErr) {
                console.error(`Failed to execute tool ${tc.tool}:`, execErr);
              }
            }
          }
        }

        // PASS 2: Generate natural language response with truncated data
        let rawDataStr = JSON.stringify(toolResultsData);
        if (rawDataStr.length > 2000) {
          rawDataStr = rawDataStr.substring(0, 2000) + '... (truncated)';
        }

        try {
          const finalResult = await generateText({
            model: chatModel,
            system: TADBEER_AI_EMPLOYEE_PROMPT + (toolResultsData.length > 0 
              ? `\n\n[CRM DATA RETRIEVED]\nYou have retrieved/modified data by executing tools. Summarize the actions you took and the data found conversationally for the user. Do not output raw JSON.` 
              : ''),
            messages: [
              ...cleanedMessages,
              ...(toolResultsData.length > 0 ? [{ role: 'assistant', content: `[Raw CRM Tool Data]\n${rawDataStr}` }] : [])
            ] as any,
          });
          responseContent = finalResult.text;
        } catch (pass2Err) {
          console.error("Groq Pass 2 text generation error:", pass2Err);
          responseContent = formatToolResultsToText(toolResultsData);
        }

      } catch (err) {
        console.error("Groq autonomous loop failed:", err);
      }

      if (!responseContent || responseContent.trim() === '') {
        if (toolResultsData.length > 0) {
          responseContent = formatToolResultsToText(toolResultsData);
        } else {
          responseContent = `Hello! I am **Tadbeer Co-Pilot**, your AI Sales Operations Employee. How can I assist your sales team today?`;
        }
      }

      return NextResponse.json({
        role: 'assistant',
        content: responseContent,
        executedTools
      });
    }

    // 2. If OpenAI API key is set, use OpenAI with generateText
    if (process.env.OPENAI_API_KEY) {
      const { createOpenAI } = await import('@ai-sdk/openai');
      const { generateText } = await import('ai');
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const result = await generateText({
        model: openai('gpt-4o'),
        system: TADBEER_AI_EMPLOYEE_PROMPT,
        messages: cleanedMessages,
        tools: aiTools,
        maxSteps: 5,
      } as any);

      const allToolCalls = result.steps 
        ? result.steps.flatMap((s: any) => s.toolCalls || [])
        : (result.toolCalls || []);

      const allToolResults = result.steps 
        ? result.steps.flatMap((s: any) => s.toolResults || [])
        : [];

      const executedTools = allToolCalls.map(tc => ({ 
        tool: tc.toolName, 
        result: (tc as any).args 
      }));

      let responseContent = result.text;
      if (!responseContent || responseContent.trim() === '') {
        responseContent = formatToolResultsToText(allToolResults);
      }

      if (!responseContent || responseContent.trim() === '') {
        responseContent = `Hello! I am **Tadbeer Co-Pilot**, your AI Sales Operations Employee. How can I assist your sales team today?`;
      }

      return NextResponse.json({
        role: 'assistant',
        content: responseContent,
        executedTools
      });
    }

    return NextResponse.json({
      role: 'assistant',
      content: 'I encountered a system error generating an autonomous response. Please check the CRM logs or try again.',
      executedTools: []
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
