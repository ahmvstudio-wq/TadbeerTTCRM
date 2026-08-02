import { tool } from 'ai';
import { z } from 'zod';
import { getDashboardStats, getRecentActivity } from '@/lib/actions/dashboard';
import { getFollowUps, createFollowUp, completeFollowUp } from '@/lib/actions/followups';
import { getOpportunities, createOpportunity, updateOpportunityStage, getPipelineStats } from '@/lib/actions/opportunities';
import { getMeetings, bookMeeting, updateMeetingStatus } from '@/lib/actions/meetings';
import { getCompanies, getCompany, createCompany, updateCompany, addCompanyActivity } from '@/lib/actions/companies';
import { deleteCompany, deleteContact, deleteOpportunity, deleteFollowUp, deleteMeeting } from '@/lib/actions/delete';
import { getCallQueue, recordCall } from '@/lib/actions/calls';
import { saveTouch } from '@/lib/actions/outreach';
import { getOutreachMessageForChannel } from '@/lib/outreach-messages-library';
import { CASE_STUDIES_LIBRARY } from '@/lib/credibility-library';
import { runBulkProposalAndCadenceSeeding } from '@/app/api/seed-proposals/route';

export const autoPopulateCadenceHandler = async (userEmail?: string) => {
  return await runBulkProposalAndCadenceSeeding(userEmail || 'w.taufiqq@gmail.com');
};

export const deleteDuplicatesHandler = async () => {
  const { data: companies } = await getCompanies();
  if (!companies || companies.length === 0) {
    return { deleted_count: 0, deleted_companies: [], message: 'No companies found in database.' };
  }

  const seen = new Set<string>();
  const duplicateIds: string[] = [];
  const deletedNames: string[] = [];

  for (const c of companies) {
    const norm = (c.company_name || '').toLowerCase().trim();
    if (norm && seen.has(norm)) {
      duplicateIds.push(c.id);
      deletedNames.push(c.company_name);
    } else if (norm) {
      seen.add(norm);
    }
  }

  for (const id of duplicateIds) {
    await deleteCompany(id);
  }

  return {
    deleted_count: duplicateIds.length,
    deleted_companies: deletedNames,
    message: duplicateIds.length > 0 
      ? `Successfully removed ${duplicateIds.length} duplicate company entry/entries: ${deletedNames.join(', ')}`
      : `No duplicate company entries found in the CRM. Your database is 100% clean.`
  };
};

export const getDashboardMetricsHandler = async () => {
  return await getDashboardStats();
};

export const sendEmailOutreachHandler = async (params: {
  company_id: string;
  contact_id?: string;
  recipient_email: string;
  subject: string;
  body: string;
  service_line?: string;
}) => {
  const touchRes = await saveTouch({
    lead_id: params.company_id,
    channel: 'email',
    step: 1,
    message: `Subject: ${params.subject}\n\n${params.body}`
  });

  const actRes = await addCompanyActivity(
    params.company_id,
    `Email Sent by AI Employee: "${params.subject}"`,
    `To: ${params.recipient_email}\n\n${params.body}`,
    'email_sent'
  );

  return {
    success: true,
    message: `Email successfully sent to ${params.recipient_email}`,
    touch: touchRes.data,
    activity: actRes.data
  };
};

export const draftReplyHandler = async ({ incoming_message, objection_type, service_line }: {
  incoming_message: string;
  objection_type?: 'pricing' | 'competitor' | 'timing' | 'mohre_compliance' | 'general';
  service_line?: string;
}) => {
  let guidance = '';
  if (objection_type === 'pricing') {
    guidance = 'Emphasize zero hidden fees, MOHRE compliance guarantee, and ROI from reduced HR administrative delays.';
  } else if (objection_type === 'timing') {
    guidance = 'Propose a low-friction 10-minute briefing or offer to send our executive summary deck.';
  } else if (objection_type === 'mohre_compliance') {
    guidance = 'Highlight Tadbeer 100% government authorization, WPS integration, and instant Emirates ID stamping.';
  }

  return {
    service_line: service_line || 'Manpower & Executive Search',
    guidance,
    suggested_tone: 'Professional, assertive, value-focused',
    case_studies: CASE_STUDIES_LIBRARY.slice(0, 2)
  };
};

export const getDailyAiReportHandler = async () => {
  const [stats, activities] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(30)
  ]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayActivities = (activities.data || []).filter((a: any) =>
    a.created_at && a.created_at.startsWith(todayStr)
  );

  return {
    date: todayStr,
    summary: {
      total_actions_today: todayActivities.length,
      pending_followups: stats.data?.pending_follow_ups || 0,
      overdue_followups: stats.data?.overdue_follow_ups || 0,
      open_pipeline_value: stats.data?.pipeline.total_value || 0
    },
    actions_logged: todayActivities.map((a: any) => ({
      title: a.title,
      description: a.description,
      company: a.company_name,
      time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }))
  };
};

// Tool definitions for Vercel AI SDK
export const aiTools: Record<string, any> = {
  auto_populate_daily_cadence_and_proposals: tool({
    description: 'Automatically populate today daily outreach cadence queue, generate customized proposal data for all companies, and write personalized WhatsApp/Email outreach messages for all prospects.',
    parameters: z.object({
      user_email: z.string().optional().describe('User email address')
    }),
    execute: async (params: any) => autoPopulateCadenceHandler(params?.user_email)
  } as any),

  get_dashboard_metrics: tool({
    description: 'Fetch real-time dashboard statistics including company counts, call logs, upcoming meetings, overdue follow-ups, and pipeline total values.',
    parameters: z.object({
      format: z.string().optional().default('').describe('Optional format preference')
    }),
    execute: async () => getDashboardMetricsHandler()
  } as any),

  send_email_outreach: tool({
    description: 'Send out an email to a prospect/contact, log the touch in CRM records, and create an activity log.',
    parameters: z.object({
      company_id: z.string().optional().default('').describe('Target company UUID'),
      contact_id: z.string().optional().describe('Target contact UUID'),
      recipient_email: z.string().optional().default('').describe('Email address of recipient'),
      subject: z.string().optional().default('').describe('Email subject line'),
      body: z.string().optional().default('').describe('Email message body'),
      service_line: z.string().optional().describe('Associated Tadbeer service line')
    }),
    execute: async (params: any) => sendEmailOutreachHandler(params)
  } as any),

  draft_reply_to_lead: tool({
    description: 'Draft an intelligent, context-aware reply to an incoming email or WhatsApp message from a prospect.',
    parameters: z.object({
      incoming_message: z.string().optional().default('').describe('The message received from the prospect'),
      objection_type: z.enum(['pricing', 'competitor', 'timing', 'mohre_compliance', 'general']).optional().default('general'),
      service_line: z.string().optional().default('Manpower & Executive Search')
    }),
    execute: async (params: any) => draftReplyHandler(params)
  } as any),

  get_daily_ai_performance_report: tool({
    description: 'Generate an audit report of all tasks, emails sent, follow-ups created/completed, and deals updated by the AI Employee today.',
    parameters: z.object({
      format: z.string().optional().describe('Optional format preference')
    }),
    execute: async () => getDailyAiReportHandler()
  } as any),

  get_followups: tool({
    description: 'Retrieve follow-ups filtered by urgency status: due_today, overdue, pending, or all.',
    parameters: z.object({
      filter: z.enum(['due_today', 'overdue', 'pending', 'all']).default('all')
    }),
    execute: async (params: any) => getFollowUps(params.filter)
  } as any),

  create_followup: tool({
    description: 'Schedule a new follow-up for a company or contact.',
    parameters: z.object({
      company_id: z.string().optional().default('').describe('Target company UUID'),
      contact_id: z.string().optional().describe('Target contact UUID'),
      due_date: z.string().optional().default('').describe('YYYY-MM-DD format due date'),
      due_time: z.string().optional().describe('HH:MM format time'),
      subject: z.string().optional().default('').describe('Short subject or reason for follow-up'),
      description: z.string().optional().describe('Detailed follow-up notes'),
      channel: z.enum(['call', 'whatsapp', 'email', 'linkedin', 'meeting']).optional().default('call')
    }),
    execute: async (params: any) => createFollowUp(params)
  } as any),

  complete_followup: tool({
    description: 'Mark a pending follow-up as completed.',
    parameters: z.object({
      id: z.string().optional().default('').describe('Follow-up UUID'),
      notes: z.string().optional().describe('Completion notes or call summary')
    }),
    execute: async (params: any) => completeFollowUp(params.id, params.notes)
  } as any),

  get_pipeline_and_deals: tool({
    description: 'Fetch sales pipeline metrics and list active opportunities by stage.',
    parameters: z.object({
      stage: z.string().optional().describe('Stage of the deal (e.g., qualified, proposal_sent, won, lost)')
    }),
    execute: async (params: any) => {
      const [stats, opportunities] = await Promise.all([
        getPipelineStats(),
        getOpportunities(params?.stage ? { stage: params.stage } : undefined)
      ]);
      return { stats, opportunities };
    }
  } as any),

  update_deal_stage: tool({
    description: 'Update the pipeline stage of an existing opportunity/deal.',
    parameters: z.object({
      opportunity_id: z.string().optional().describe('Opportunity UUID or name keyword'),
      deal_id: z.string().optional().describe('Alternative name keyword for the deal'),
      stage: z.string().optional().default('').describe('Target stage (qualified, proposal_sent, negotiation, verbal_commit, won, lost)')
    }),
    execute: async (params: any) => updateOpportunityStage(params.opportunity_id || params.deal_id || '', params.stage)
  } as any),

  create_deal: tool({
    description: 'Create a new sales opportunity / deal in the CRM pipeline.',
    parameters: z.object({
      company_id: z.string().optional().default(''),
      contact_id: z.string().optional(),
      title: z.string().optional().default(''),
      estimated_value: z.number().optional().default(0).describe('Estimated monetary value in SAR/AED'),
      currency: z.string().optional().default('SAR'),
      stage: z.enum(['qualified', 'proposal_sent', 'negotiation', 'verbal_commit', 'won', 'lost']).optional().default('qualified')
    }),
    execute: async (params: any) => createOpportunity(params)
  } as any),

  search_companies_and_contacts: tool({
    description: 'Search companies and contacts by name, industry, status, or keyword.',
    parameters: z.object({
      query: z.string().optional().default('').describe('Search query string')
    }),
    execute: async (params: any) => getCompanies({ search: params?.query || '' })
  } as any),

  get_meetings_schedule: tool({
    description: 'Retrieve upcoming or historical meetings.',
    parameters: z.object({
      filter: z.enum(['upcoming', 'past', 'all']).default('all')
    }),
    execute: async (params: any) => getMeetings(params.filter)
  } as any),

  schedule_meeting: tool({
    description: 'Book a meeting for a company or contact.',
    parameters: z.object({
      company_id: z.string().optional().default(''),
      contact_id: z.string().optional(),
      title: z.string().optional().default(''),
      description: z.string().optional(),
      meeting_date: z.string().optional().default('').describe('ISO string or YYYY-MM-DD format'),
      duration_minutes: z.number().optional().default(30)
    }),
    execute: async (params: any) => bookMeeting(params)
  } as any),

  update_meeting_status: tool({
    description: 'Update the status of a scheduled meeting (completed, cancelled, no_show).',
    parameters: z.object({
      id: z.string().optional().default(''),
      status: z.enum(['completed', 'cancelled', 'no_show'])
    }),
    execute: async (params: any) => updateMeetingStatus(params.id, params.status)
  } as any),

  get_outreach_recommendations: tool({
    description: 'Fetch recommended outreach message templates for a specific channel or company.',
    parameters: z.object({
      companyName: z.string().optional().default('Prospect'),
      contactName: z.string().optional().default('Decision Maker'),
      channel: z.enum(['whatsapp', 'linkedin', 'email']).optional().default('whatsapp')
    }),
    execute: async (params: any) => {
      const template = getOutreachMessageForChannel('', params.companyName, params.contactName, params.channel);
      return {
        template,
        channel: params.channel
      };
    }
  } as any),

  create_company: tool({
    description: 'Create a new prospect company record in the CRM along with an optional primary contact.',
    parameters: z.object({
      company_name: z.string().describe('Company name'),
      industry: z.string().optional().describe('Industry type'),
      website: z.string().optional().describe('Company website'),
      phone: z.string().optional().describe('Company phone'),
      email: z.string().optional().describe('Company email'),
      country: z.string().optional().describe('Country'),
      city: z.string().optional().describe('City'),
      notes: z.string().optional().describe('Research notes or observations'),
      contact_name: z.string().optional().describe('Full name of primary contact'),
      contact_email: z.string().optional().describe('Contact email'),
      contact_phone: z.string().optional().describe('Contact phone'),
      contact_title: z.string().optional().describe('Contact job title')
    }),
    execute: async (params: any) => {
      return await createCompany({
        company_name: params.company_name,
        industry: params.industry,
        website: params.website,
        phone: params.phone,
        email: params.email,
        country: params.country,
        city: params.city,
        notes: params.notes,
        firstContact: params.contact_name ? {
          full_name: params.contact_name,
          email: params.contact_email,
          phone: params.contact_phone,
          title: params.contact_title
        } : undefined
      });
    }
  } as any),

  update_company: tool({
    description: 'Update an existing company record details in the CRM.',
    parameters: z.object({
      id: z.string().describe('Target company UUID'),
      company_name: z.string().optional(),
      industry: z.string().optional(),
      website: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      country: z.string().optional(),
      city: z.string().optional(),
      notes: z.string().optional()
    }),
    execute: async (params: any) => updateCompany(params.id, params)
  } as any),

  find_and_delete_duplicates: tool({
    description: 'Find and delete duplicate company and contact entries in the CRM database, returning a list of deleted items.',
    parameters: z.object({}),
    execute: async () => deleteDuplicatesHandler()
  } as any),

  delete_record: tool({
    description: 'Delete a record (company, contact, opportunity, followup, meeting) from the CRM database by ID.',
    parameters: z.object({
      entity_type: z.enum(['company', 'contact', 'opportunity', 'followup', 'meeting']).describe('Entity type to delete'),
      id: z.string().describe('Target record UUID')
    }),
    execute: async (params: any) => {
      if (params.entity_type === 'company') return await deleteCompany(params.id);
      if (params.entity_type === 'contact') return await deleteContact(params.id);
      if (params.entity_type === 'opportunity') return await deleteOpportunity(params.id);
      if (params.entity_type === 'followup') return await deleteFollowUp(params.id);
      if (params.entity_type === 'meeting') return await deleteMeeting(params.id);
      return { error: 'Unknown entity type' };
    }
  } as any),

  get_call_queue: tool({
    description: 'Fetch pending calls from the sales calling queue.',
    parameters: z.object({}),
    execute: async () => getCallQueue()
  } as any),

  record_call_log: tool({
    description: 'Record an executed call log entry with status, notes, and duration.',
    parameters: z.object({
      call_queue_id: z.string().optional(),
      company_id: z.string().optional(),
      contact_id: z.string().optional(),
      call_status: z.enum(['connected', 'no_answer', 'busy', 'voicemail', 'wrong_number']).default('connected'),
      call_notes: z.string().optional().describe('Summary of the call conversation'),
      duration_seconds: z.number().optional().default(180)
    }),
    execute: async (params: any) => recordCall(params)
  } as any)
};
