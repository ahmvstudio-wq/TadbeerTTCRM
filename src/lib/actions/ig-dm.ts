'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/config'
import { requireAuth } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import { getServerCached, setServerCached, invalidateServerCache } from '@/lib/cache/server-cache'

const supabase = getSupabaseAdminClient()

function revalidateAllCRMPages() {
  invalidateServerCache()
}

import {
  type OutreachChannel,
  type OutreachStatus,
  type OutreachTemplate,
  type OutreachLead,
  CHANNEL_CONFIG,
  STATUS_CONFIG,
  TEMPLATE_LABELS
} from "../types/outreach"
import { isValidLinkedInUrl, extractInstagramUrl } from '@/lib/utils'
import { normalizeCategorySync } from '@/lib/outreach-playbook'
import { resolveLeadPriority } from '@/lib/constants/priorities'
import {
  mapToDbLeadStatus,
  mapToDbCompanyStatus,
  mapToDbPipelineStage,
  mapToOutreachStatus,
  getUnifiedStatus
} from '@/lib/constants/statuses'
import { resolveDateRange, isDateInRange } from '@/lib/date-utils'

function getValidActivityType(channel: string): string {
  if (channel === 'email') return 'email_sent';
  if (channel === 'whatsapp') return 'whatsapp_sent';
  if (channel === 'instagram_dm' || channel === 'linkedin') return 'outreach_sent';
  return 'call_made';
}

function toSafeFollowUpChannel(ch?: string): 'whatsapp' | 'call' | 'email' | 'linkedin' {
  if (!ch) return 'whatsapp';
  const lower = ch.toLowerCase();
  if (lower === 'call' || lower === 'phone') return 'call';
  if (lower === 'email') return 'email';
  if (lower === 'linkedin') return 'linkedin';
  return 'whatsapp';
}

function parseSafeOutreachDate(dateStr?: string | null): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00.000Z`);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function extractActivityPayload(act: any): any {
  if (act?.metadata && typeof act.metadata === 'object' && Object.keys(act.metadata).length > 0) {
    return act.metadata;
  }
  if (act?.description) {
    try {
      const parsed = JSON.parse(act.description);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch {}
  }
  return {};
}

function normalizeCompanyName(name?: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanDigits(phone?: string | null): string {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

function cleanLinkedinSlug(url?: string | null): string {
  if (!url) return '';
  return url
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?([a-z]{2}\.)?linkedin\.com\/in\//i, '')
    .replace(/\/+$/, '')
    .trim();
}

// ─── Log outreach ─────────────────────────────────────────────────────────────
export async function logOutreach(data: {
  company_name: string
  industry: string
  channel: OutreachChannel
  handle: string
  template_used: OutreachTemplate
  phone?: string
  notes?: string
  outreach_date?: string
}) {
  try {
    await requireAuth()
    const rawCoName = data.company_name.trim()
    const normCoName = normalizeCompanyName(rawCoName)

    // Check existing company by exact name, normalized name, or phone
    const { data: allCos } = await supabase
      .from('companies')
      .select('id, company_name, phone, linkedin_url, contacts(id, full_name, phone, whatsapp, linkedin_url)')
      .limit(3000)

    const existing = (allCos || []).find((c: any) =>
      c.company_name?.toLowerCase().trim() === rawCoName.toLowerCase() ||
      normalizeCompanyName(c.company_name) === normCoName ||
      (data.phone && cleanDigits(c.phone) === cleanDigits(data.phone) && cleanDigits(data.phone).length >= 7)
    )

    let companyId = existing?.id

    if (!companyId) {
      const { data: newCo, error: coErr } = await supabase
        .from('companies')
        .insert({
          company_name: rawCoName,
          industry: data.industry.trim() || 'General',
          phone: data.phone || null,
          status: 'contacted',
          pipeline_stage: 'Contacted',
          lead_status: 'Contacted',
          notes: CHANNEL_CONFIG[data.channel].handleLabel + ': ' + data.handle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (coErr) return { data: null, error: coErr.message }
      companyId = newCo.id
    } else {
      await supabase
        .from('companies')
        .update({
          status: 'contacted',
          pipeline_stage: 'Contacted',
          lead_status: 'Contacted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId)
    }

    // Contact Deduplication: Ensure contact exists for this company
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('id, full_name, phone')
      .eq('company_id', companyId)

    if (!existingContacts || existingContacts.length === 0) {
      await supabase.from('contacts').insert({
        company_id: companyId,
        full_name: data.handle && !data.handle.startsWith('@') && !/^[\d\+\-\s]+$/.test(data.handle)
          ? data.handle
          : `${rawCoName} Contact`,
        phone: data.phone || null,
        title: 'Decision Maker',
        is_primary: true,
        created_at: new Date().toISOString()
      })
    }

    const effectiveDate = data.outreach_date
      ? data.outreach_date.split('T')[0]
      : new Date().toISOString().split('T')[0]

    const createdAt = `${effectiveDate}T12:00:00.000Z`

    const payload = {
      channel: data.channel,
      handle: data.handle,
      template_used: data.template_used,
      status: 'sent',
      prospect_reply: '',
      pain_point: '',
      call_opening_line: '',
      notes: data.notes || '',
      outreach_date: effectiveDate,
    }

    // Activity Deduplication: check if activity already logged for this company on this date
    const { data: existingActs } = await supabase
      .from('activities')
      .select('id, metadata')
      .eq('company_id', companyId)
      .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach', 'outreach_sent'])
      .gte('created_at', `${effectiveDate}T00:00:00.000Z`)
      .lte('created_at', `${effectiveDate}T23:59:59.999Z`)
      .limit(1)

    let activityId: string
    if (existingActs && existingActs.length > 0) {
      // Update existing activity
      const actId = existingActs[0].id
      await supabase
        .from('activities')
        .update({
          title: CHANNEL_CONFIG[data.channel].label + ' — ' + TEMPLATE_LABELS[data.template_used],
          description: data.notes || `${CHANNEL_CONFIG[data.channel].label} outreach updated`,
          metadata: { ...existingActs[0].metadata, ...payload },
          created_at: createdAt
        })
        .eq('id', actId)
      activityId = actId
    } else {
      // Insert new activity
      const { data: newAct, error: actErr } = await supabase
        .from('activities')
        .insert({
          company_id: companyId,
          activity_type: getValidActivityType(data.channel),
          title: CHANNEL_CONFIG[data.channel].label + ' — ' + TEMPLATE_LABELS[data.template_used],
          description: data.notes || `${CHANNEL_CONFIG[data.channel].label} outreach sent`,
          metadata: payload,
          created_at: createdAt,
        })
        .select()
        .single()

      if (actErr) return { data: null, error: actErr.message }
      activityId = newAct.id
    }

    // Dual-write to outreach_touches for unified pipeline normalization
    const rawCh = String(data.channel).toLowerCase()
    const validTouchChannel = rawCh.includes('email') ? 'email' : (rawCh.includes('linkedin') ? 'linkedin' : (rawCh.includes('wa') || rawCh.includes('whatsapp') ? 'whatsapp' : 'call'))
    try {
      await supabase.from('outreach_touches').insert({
        lead_id: companyId,
        channel: validTouchChannel,
        step_number: 1,
        message: data.notes || `${CHANNEL_CONFIG[data.channel].label} outreach sent`,
        status: 'sent',
        sent_at: createdAt,
      })
    } catch (touchErr) {
      console.warn("Touch insert note:", touchErr)
    }

    // Auto-schedule Follow-up 1 for exactly +2 days (Undeniable Cadence Delay)
    const nextDueDate = new Date(createdAt)
    nextDueDate.setDate(nextDueDate.getDate() + 2)
    const nextDueDateStr = nextDueDate.toISOString().split('T')[0]

    // Complete any previous pending follow-ups to prevent duplicates
    await supabase.from('follow_ups').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes: 'Superceded by Stage 1 outreach touch'
    }).eq('company_id', companyId).eq('status', 'pending')

    const dbChannel = toSafeFollowUpChannel(data.channel)
    const channelTag = String(data.channel || '').toLowerCase().includes('instagram') ? ' [Channel: Instagram DM]' : ''

    await supabase.from('follow_ups').insert({
      company_id: companyId,
      due_date: nextDueDateStr,
      subject: 'Follow-up 1: Value Check-in',
      description: `Stage 2 follow-up. Value observation check-in after 2 days without reply.${channelTag}`,
      channel: dbChannel,
      status: 'pending',
      created_at: new Date().toISOString()
    })

    revalidateAllCRMPages()
    return { data: { activityId, companyId, date: effectiveDate }, error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

// ─── Bulk log outreach for existing companies ──────────────────────────────
export async function bulkLogOutreach(data: {
  companies: { id: string; name: string; phone?: string | null }[]
  channel: OutreachChannel
  template_used: OutreachTemplate
  notes?: string
  outreach_date?: string
}) {
  try {
    await requireAuth()
    const effectiveDate = data.outreach_date
      ? data.outreach_date.split('T')[0]
      : new Date().toISOString().split('T')[0]
    const createdAt = `${effectiveDate}T12:00:00.000Z`

    const compIds = data.companies.map(c => c.id).filter(Boolean)
    if (compIds.length === 0) return { error: 'No companies selected' }

    // Deduplication: Fetch any activities already logged for these companies on this date
    const { data: existingActs } = await supabase
      .from('activities')
      .select('id, company_id, metadata')
      .in('company_id', compIds)
      .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach', 'outreach_sent'])
      .gte('created_at', `${effectiveDate}T00:00:00.000Z`)
      .lte('created_at', `${effectiveDate}T23:59:59.999Z`)

    const existingActByCo = new Map<string, any>()
    ;(existingActs || []).forEach((a: any) => existingActByCo.set(a.company_id, a))

    for (const co of data.companies) {
      const payload = {
        channel: data.channel,
        handle: co.phone || 'Existing Contact',
        template_used: data.template_used,
        status: 'sent',
        prospect_reply: '',
        pain_point: '',
        call_opening_line: '',
        notes: data.notes || '',
        outreach_date: effectiveDate,
      }

      if (existingActByCo.has(co.id)) {
        const existing = existingActByCo.get(co.id)
        await supabase
          .from('activities')
          .update({
            title: CHANNEL_CONFIG[data.channel].label + ' — ' + TEMPLATE_LABELS[data.template_used],
            description: data.notes || `${CHANNEL_CONFIG[data.channel].label} outreach updated`,
            metadata: { ...existing.metadata, ...payload },
            created_at: createdAt
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('activities')
          .insert({
            company_id: co.id,
            activity_type: getValidActivityType(data.channel),
            title: CHANNEL_CONFIG[data.channel].label + ' — ' + TEMPLATE_LABELS[data.template_used],
            description: data.notes || `${CHANNEL_CONFIG[data.channel].label} outreach sent`,
            metadata: payload,
            created_at: createdAt,
          })
      }
    }

    await supabase
      .from('companies')
      .update({
        status: 'contacted',
        pipeline_stage: 'Contacted',
        lead_status: 'Contacted',
        updated_at: createdAt,
      })
      .in('id', compIds)

    revalidateAllCRMPages()
    return { error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

// ─── Update entry (any field) ────────────────────────────────────────────────
export async function updateOutreachEntry(activityId: string, update: {
  status?: OutreachStatus
  statuses?: string[]
  company_name?: string
  handle?: string
  channel?: OutreachChannel
  prospect_reply?: string
  pain_point?: string
  call_opening_line?: string
  notes?: string
  outreach_date?: string
}) {
  try {
    await requireAuth()

    // 1. Resolve target companyId and actual activity ID
    let companyId: string | null = null
    let actualActivityId: string | null = null
    let existingActivity: any = null

    if (activityId.startsWith('staged-')) {
      companyId = activityId.replace(/^staged-/, '').trim()
    } else {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activityId)
      if (isUuid) {
        const { data: act } = await supabase
          .from('activities')
          .select('id, company_id, description, created_at')
          .eq('id', activityId)
          .maybeSingle()

        if (act) {
          actualActivityId = act.id
          companyId = act.company_id
          existingActivity = act
        } else {
          // Check if this UUID is a company_id
          const { data: co } = await supabase
            .from('companies')
            .select('id')
            .eq('id', activityId)
            .maybeSingle()
          if (co) {
            companyId = co.id
          }
        }
      }
    }

    // If we have a companyId but no actualActivityId, check if this company already has an outreach activity
    if (companyId && !actualActivityId) {
      const { data: act } = await supabase
        .from('activities')
        .select('id, company_id, description, metadata, created_at')
        .eq('company_id', companyId)
        .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach', 'outreach_sent'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (act) {
        actualActivityId = act.id
        existingActivity = act
      }
    }

    let current: any = extractActivityPayload(existingActivity)
    const status: OutreachStatus = (update as any).status || current.status || 'sent'
    const statuses: string[] = update.statuses || current.statuses || (status ? [status] : ['sent'])
    const updated = {
      ...current,
      ...update,
      status,
      statuses,
      updated_at: new Date().toISOString()
    }
    const channel: OutreachChannel = updated.channel || 'cold_call'
    const readableDesc = updated.notes || updated.prospect_reply || updated.ai_summary || null
    const dbPayload: any = {
      description: readableDesc,
      metadata: updated,
      title: (CHANNEL_CONFIG[channel]?.label || 'Outreach') + ' — ' + (STATUS_CONFIG[status]?.label || status),
      activity_type: getValidActivityType(channel),
    }

    if (update.outreach_date) {
      dbPayload.created_at = parseSafeOutreachDate(update.outreach_date)
    } else if (update.status === 'follow_up_sent' || update.status === 'called') {
      dbPayload.created_at = new Date().toISOString()
    }

    if (actualActivityId) {
      const { error: actUpdateErr } = await supabase
        .from('activities')
        .update(dbPayload)
        .eq('id', actualActivityId)

      if (actUpdateErr) return { error: actUpdateErr.message }
    } else if (companyId) {
      // Create new activity row for this company
      const createdAt = parseSafeOutreachDate(update.outreach_date)

      const { data: newAct, error: actInsertErr } = await supabase
        .from('activities')
        .insert({
          company_id: companyId,
          ...dbPayload,
          created_at: createdAt,
        })
        .select('id')
        .single()

      if (actInsertErr) return { error: actInsertErr.message }
      actualActivityId = newAct.id
    }

    // 2. Sync company record in `companies` table (both status & pipeline_stage)
    if (companyId) {
      const coUpdate: any = {
        updated_at: new Date().toISOString()
      }
      if (update.company_name) coUpdate.company_name = update.company_name

      const unified = getUnifiedStatus(status)
      const coStatus = mapToDbCompanyStatus(unified.id)
      const pipelineStage = mapToDbPipelineStage(unified.id)
      const dbLeadStatus = mapToDbLeadStatus(unified.id)

      const { data: existingCo } = await supabase
        .from('companies')
        .select('research_json')
        .eq('id', companyId)
        .maybeSingle()

      let curR: any = {}
      if (existingCo?.research_json) {
        if (typeof existingCo.research_json === 'string') {
          try { curR = JSON.parse(existingCo.research_json) } catch {}
        } else if (typeof existingCo.research_json === 'object') {
          curR = existingCo.research_json
        }
      }
      const updatedR = {
        ...curR,
        unified_status: unified.id,
        active_statuses: statuses,
        stage_updated_at: new Date().toISOString()
      }

      coUpdate.status = coStatus
      coUpdate.pipeline_stage = pipelineStage
      coUpdate.lead_status = dbLeadStatus
      coUpdate.research_json = updatedR

      if (update.prospect_reply && update.prospect_reply.trim().length > 0) {
        coUpdate.draft_message = update.prospect_reply.trim()
      }

      const { error: coUpdateErr } = await supabase.from('companies').update(coUpdate).eq('id', companyId)
      if (coUpdateErr) {
        console.error("Company stage update error in updateOutreachEntry:", coUpdateErr.message)
      }

      // Schedule follow-up if requested
      let scheduledDueDate: string | null = null
      const updAny = update as any
      if (updAny.followUpDate) {
        scheduledDueDate = updAny.followUpDate
      } else if (typeof updAny.followUpDays === 'number' && updAny.followUpDays > 0) {
        const d = new Date()
        d.setDate(d.getDate() + updAny.followUpDays)
        scheduledDueDate = d.toISOString().split('T')[0]
      } else if (updAny.followUpDays !== null) {
        const unifiedConfig = getUnifiedStatus(status)
        if (typeof unifiedConfig.defaultFollowUpDays === 'number' && unifiedConfig.defaultFollowUpDays > 0) {
          const d = new Date()
          d.setDate(d.getDate() + unifiedConfig.defaultFollowUpDays)
          scheduledDueDate = d.toISOString().split('T')[0]
        }
      }

      if (scheduledDueDate) {
        // Complete any previous pending follow-ups to prevent duplicates
        await supabase.from('follow_ups').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          notes: 'Superceded by status update follow-up'
        }).eq('company_id', companyId).eq('status', 'pending')

        const followUpSubject = updAny.followUpNote || `Follow up on ${status.replace(/_/g, ' ')}`
        const rawChannel = updAny.followUpChannel || channel || 'call'
        const dbChannel = toSafeFollowUpChannel(rawChannel)
        const channelTag = (rawChannel === 'instagram_dm' || rawChannel === 'instagram') ? ' [Channel: Instagram DM]' : ''

        await supabase.from('follow_ups').insert({
          company_id: companyId,
          due_date: scheduledDueDate,
          subject: followUpSubject,
          description: `Scheduled during status update to ${status}.${channelTag}`,
          channel: dbChannel,
          status: 'pending',
          created_at: new Date().toISOString()
        })

        await supabase.from('activities').insert({
          company_id: companyId,
          activity_type: 'note',
          title: `Follow-up Scheduled — Due ${scheduledDueDate}`,
          description: followUpSubject,
          metadata: {
            status,
            due_date: scheduledDueDate,
            subject: followUpSubject,
            channel: updAny.followUpChannel || channel || 'call',
            created_at: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
      }

      // If follow-up was sent or completed, mark any pending follow_ups rows as completed
      if (status === 'follow_up_sent' || status === 'called' || status === 'meeting_booked') {
        await supabase.from('follow_ups').update({
          status: 'completed',
          completed_at: new Date().toISOString()
        }).eq('company_id', companyId).eq('status', 'pending')
      }
    }

    revalidateAllCRMPages()
    return { data: { activityId: actualActivityId, companyId }, error: null }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function updateOutreachStatus(activityId: string, update: {
  status: OutreachStatus
  statuses?: string[]
  prospect_reply?: string
  pain_point?: string
  call_opening_line?: string
  notes?: string
  followUpDays?: number | null
  followUpDate?: string | null
  followUpNote?: string | null
  followUpChannel?: string | null
}) {
  return updateOutreachEntry(activityId, update)
}

// ─── Bulk Update Outreach Status (For multi-select rows) ─────────────────────
export async function bulkUpdateOutreachStatus(data: {
  leadIds: string[]
  status: OutreachStatus
  statuses?: string[]
  notes?: string
  followUpDays?: number | null
  followUpDate?: string | null
  followUpNote?: string | null
  followUpChannel?: string | null
}) {
  try {
    await requireAuth()
    const promises = data.leadIds.map(leadId =>
      updateOutreachEntry(leadId, {
        status: data.status,
        statuses: data.statuses || [data.status],
        notes: data.notes,
        ...((data as any))
      })
    )
    const results = await Promise.all(promises)
    revalidateAllCRMPages()
    return { count: results.length, error: null }
  } catch (err) {
    return { count: 0, error: (err as Error).message }
  }
}

// ─── Mark Lead Followed Up (Universal Sync) ──────────────────────────────────
export async function markLeadFollowedUp(activityOrCompanyId: string, companyIdHint?: string, notes?: string) {
  try {
    await requireAuth()
    const now = new Date().toISOString()

    let companyId = companyIdHint || null
    let actualActivityId: string | null = null
    let existingActivity: any = null

    if (activityOrCompanyId.startsWith('staged-')) {
      companyId = activityOrCompanyId.replace(/^staged-/, '').trim()
    } else {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(activityOrCompanyId)
      if (isUuid) {
        const { data: act } = await supabase
          .from('activities')
          .select('id, company_id, description, created_at')
          .eq('id', activityOrCompanyId)
          .maybeSingle()

        if (act) {
          actualActivityId = act.id
          companyId = act.company_id
          existingActivity = act
        } else {
          const { data: co } = await supabase
            .from('companies')
            .select('id')
            .eq('id', activityOrCompanyId)
            .maybeSingle()
          if (co) companyId = co.id
        }
      }
    }

    if (!companyId && companyIdHint) {
      companyId = companyIdHint
    }

    let currentPayload: any = {}
    if (existingActivity?.description) {
      try { currentPayload = JSON.parse(existingActivity.description) } catch {}
    }

    const channel: OutreachChannel = currentPayload.channel || 'cold_call'
    const updatedPayload = {
      ...currentPayload,
      status: 'follow_up_sent',
      notes: notes || currentPayload.notes || 'Follow-up touch completed',
      updated_at: now
    }

    const fuSentDesc = notes || updatedPayload.notes || 'Follow-up sent'
    // 1. Insert a fresh follow_up_sent activity record so cadence logs it on today's date
    const { data: newAct, error: actErr } = await supabase
      .from('activities')
      .insert({
        company_id: companyId,
        activity_type: getValidActivityType(channel),
        title: (CHANNEL_CONFIG[channel]?.label || 'Outreach') + ' — Follow-up Sent',
        description: fuSentDesc,
        metadata: updatedPayload,
        created_at: now
      })
      .select('id')
      .single()

    if (actErr) {
      console.error("Error inserting follow-up activity:", actErr.message)
    }

    // 2. Also update previous activity description so it reflects the latest status
    if (actualActivityId) {
      await supabase.from('activities').update({
        description: fuSentDesc,
        metadata: updatedPayload
      }).eq('id', actualActivityId)
    }

    // 3. Update company in companies table
    if (companyId) {
      await supabase.from('companies').update({
        status: 'follow_up_sent',
        pipeline_stage: 'Follow-Up Sent',
        updated_at: now
      }).eq('id', companyId)

      // 4. Mark pending follow-up in follow_ups table as completed
      await supabase.from('follow_ups').update({
        status: 'completed',
        completed_at: now,
        notes: notes || 'Follow-up 1 (Value Check-in) completed'
      }).eq('company_id', companyId).eq('status', 'pending')

      // 5. Auto-schedule Stage 3: Audit Offer for exactly +3 days (Undeniable Cadence Delay)
      const auditDueDate = new Date()
      auditDueDate.setDate(auditDueDate.getDate() + 3)
      const auditDueDateStr = auditDueDate.toISOString().split('T')[0]

      const dbChannel = toSafeFollowUpChannel(channel)
      const channelTag = String(channel || '').toLowerCase().includes('instagram') ? ' [Channel: Instagram DM]' : ''

      await supabase.from('follow_ups').insert({
        company_id: companyId,
        due_date: auditDueDateStr,
        subject: 'Follow-up 2: Audit Offer',
        description: `Stage 3 follow-up. Offer outside-in business audit ("we looked into their business and prepared an audit and if they would be open to it").${channelTag}`,
        channel: dbChannel,
        status: 'pending',
        created_at: now
      })
    }

    revalidateAllCRMPages()
    return { data: { companyId, activityId: newAct?.id || actualActivityId }, error: null }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

// ─── Get all outreach leads ───────────────────────────────────────────────────
export async function getOutreachLeads(
  dateFilter: string = 'today',
  channelFilter?: OutreachChannel
) {
  try {
    let query = supabase
      .from('activities')
      .select('*, companies(id, company_name, industry, phone, notes)')
      .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach', 'outreach_sent'])
      .order('created_at', { ascending: false })

    const range = resolveDateRange(dateFilter)
    if (range.startDate) {
      query = query.gte('created_at', `${range.startDate}T00:00:00.000Z`)
    }
    if (range.endDate) {
      query = query.lte('created_at', `${range.endDate}T23:59:59.999Z`)
    }

    const { data, error } = await query.limit(500)
    if (error) return { data: null, error: error.message }

    let parsed = (data || []).map((act: any) => {
      const payload: any = extractActivityPayload(act)
      const actTitle = (act.title || '').toLowerCase()
      const channel: OutreachChannel = payload.channel || (
        act.activity_type === 'ig_dm' || actTitle.includes('instagram') ? 'instagram_dm' :
        act.activity_type === 'whatsapp_sent' || actTitle.includes('whatsapp') ? 'whatsapp' :
        act.activity_type === 'email_sent' || actTitle.includes('email') ? 'email' :
        actTitle.includes('linkedin') ? 'linkedin' :
        'cold_call'
      )
      return {
        id: act.id,
        company_id: act.company_id,
        company_name: act.companies?.company_name || 'Unknown',
        industry: act.companies?.industry || 'Unknown',
        phone: act.companies?.phone || (payload.handle && /^[\d\+\-\s\(\)]+$/.test(payload.handle) ? payload.handle : null),
        channel,
        handle: payload.handle || '',
        template_used: (payload.template_used || 'custom') as OutreachTemplate,
        status: (payload.status || 'sent') as OutreachStatus,
        prospect_reply: payload.prospect_reply || payload.reply || '',
        pain_point: payload.pain_point || '',
        call_opening_line: payload.call_opening_line || '',
        notes: payload.notes || payload.message || payload.sent_message || act.notes || '',
        sent_at: act.created_at,
        updated_at: act.updated_at || act.created_at,
      } as OutreachLead
    })

    if (channelFilter) {
      parsed = parsed.filter(l => l.channel === channelFilter)
    }

    return { data: parsed, error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

// ─── Get all outreach leads unified across companies and activities ─────────
export async function getAllLeadsForPipeline(
  dateFilter: string = 'all',
  channelFilter?: OutreachChannel
) {
  try {
    await requireAuth()

    const cacheKey = `pipeline-leads-${dateFilter}-${channelFilter || 'all'}`
    const cached = getServerCached<OutreachLead[]>(cacheKey, 20000)
    if (cached) {
      return { data: cached, error: null }
    }

    // 1. Fetch activities and active outreach companies concurrently with Promise.all
    const range = resolveDateRange(dateFilter)

    let actQuery = supabase
      .from('activities')
      .select('id, company_id, description, activity_type, title, created_at, metadata, companies(id, company_name, industry, phone, notes, research_json, category, draft_message, status, pipeline_stage)')
      .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach', 'outreach_sent'])
      .order('created_at', { ascending: false })
      .range(0, 4999)

    if (range.startDate && range.endDate) {
      const sBuf = new Date(range.startDate);
      sBuf.setDate(sBuf.getDate() - 1);
      const eBuf = new Date(range.endDate);
      eBuf.setDate(eBuf.getDate() + 1);
      actQuery = actQuery
        .gte('created_at', `${sBuf.toISOString().split('T')[0]}T00:00:00.000Z`)
        .lte('created_at', `${eBuf.toISOString().split('T')[0]}T23:59:59.999Z`);
    } else if (range.startDate) {
      const sBuf = new Date(range.startDate);
      sBuf.setDate(sBuf.getDate() - 1);
      actQuery = actQuery.gte('created_at', `${sBuf.toISOString().split('T')[0]}T00:00:00.000Z`);
    }

    const coQuery = supabase
      .from('companies')
      .select('id, company_name, industry, category, phone, email, linkedin_url, lead_source, lead_type, lead_folder, status, pipeline_stage, notes, research_json, draft_message, draft_angle_reasoning, created_at, updated_at, contacts(id, full_name, title, phone, whatsapp, email, linkedin_url, is_primary)')
      .not('status', 'in', '("dormant","lost")')
      .not('lead_type', 'eq', 'Dormant')
      .order('created_at', { ascending: false })
      .range(0, 4999)

    const [{ data: activities, error: actErr }, { data: allCompanies, error: coErr }] = await Promise.all([
      actQuery,
      coQuery
    ])

    if (actErr) {
      console.warn("Activities query warning:", actErr.message)
    }
    if (coErr) {
      console.warn("Companies query warning:", coErr.message)
    }

    const companyById = new Map<string, any>((allCompanies || []).map((c: any) => [c.id, c]))
    const leadMap = new Map<string, OutreachLead>();

    // Only map companies that have active outreach status (not raw uncontacted directory prospects)
    const activeOutreachCompanies = (allCompanies || []).filter((co: any) => {
      if (co.lead_type === 'Dormant' || co.status === 'dormant' || co.status === 'lost') return false
      const s = (co.status || '').toLowerCase().trim()
      const p = (co.pipeline_stage || '').toLowerCase().trim()
      return s !== 'prospect' && s !== 'new' && p !== 'new' && p !== 'raw' && p !== 'prospect'
    });

    activeOutreachCompanies.forEach((co: any) => {
      const contact = co.contacts?.[0] || {}
      let rJson: any = {}
      try {
        if (co.research_json && typeof co.research_json === 'object') rJson = co.research_json
        else if (co.notes && (co.notes.startsWith('{') || co.notes.startsWith('['))) rJson = JSON.parse(co.notes)
      } catch {}

      const rawIg = rJson.instagram_handle || rJson.instagram || rJson.ig_handle || (co.notes && co.notes.match(/["']?instagram_handle["']?\s*:\s*["'](@?[^"']+)["']/i)?.[1]) || (co.notes && co.notes.match(/Instagram:\s*(@?[^\s,]+)/i)?.[1]) || (co.lead_source === 'instagram' ? `@${co.company_name.toLowerCase().replace(/[^a-z0-9._]/g, '')}` : null)
      const cleanIg = rawIg ? (rawIg.startsWith('@') ? rawIg : `@${rawIg.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^\/+/, '').replace(/\/+$/, '')}`) : null
      const igHandle = cleanIg && !cleanIg.includes(' ') && cleanIg.length >= 2 ? cleanIg : null
      const rawPhone = co.phone || contact.phone || contact.whatsapp || null
      const phoneDigits = rawPhone ? String(rawPhone).replace(/\D/g, '') : ''
      const hasPhone = phoneDigits.length >= 7
      const phone = hasPhone ? rawPhone : null

      const liUrl = (isValidLinkedInUrl(co.linkedin_url) ? co.linkedin_url : null) || (isValidLinkedInUrl(contact.linkedin_url) ? contact.linkedin_url : null)
      const validEmail = co.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(co.email).trim())
        ? co.email
        : (contact.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(contact.email).trim()) ? contact.email : null)

      let channel: OutreachChannel = 'linkedin'
      const coSrc = (co.lead_source || '').toLowerCase()
      if (coSrc.includes('instagram') || rJson.target_channel === 'instagram_dm') {
        channel = 'instagram_dm'
      } else if (coSrc.includes('linkedin') || rJson.target_channel === 'linkedin' || liUrl) {
        channel = 'linkedin'
      } else if (coSrc.includes('whatsapp') || rJson.target_channel === 'whatsapp') {
        channel = 'whatsapp'
      } else if (rJson.target_channel && ['whatsapp', 'instagram_dm', 'linkedin', 'email', 'cold_call'].includes(rJson.target_channel)) {
        channel = rJson.target_channel === 'cold_call' ? 'linkedin' : rJson.target_channel
      } else if (igHandle) {
        channel = 'instagram_dm'
      } else if (liUrl) {
        channel = 'linkedin'
      } else if (hasPhone) {
        channel = 'whatsapp'
      } else if (validEmail) {
        channel = 'email'
      } else {
        channel = 'linkedin'
      }

      let handle = co.company_name
      if (channel === 'instagram_dm' && igHandle) handle = igHandle
      else if ((channel === 'whatsapp') && phone) handle = phone
      else if (channel === 'linkedin') handle = liUrl || co.company_name
      else if (channel === 'email' && validEmail) handle = validEmail

      const specificObs = rJson.specific_observation || rJson.staged_sequence?.touch_1?.specific_observation || co.draft_angle_reasoning || (co.notes && !co.notes.startsWith('{') ? co.notes : '') || 'Recent business growth & market positioning'

      const stagedSeq = rJson.staged_sequence || undefined
      const openerMessage = co.draft_message || stagedSeq?.touch_1?.message || 'Warm inquiry regarding operations'

      const exactSource = rJson?.unified_status || co.pipeline_stage || co.status
      const derivedStatus: OutreachStatus = (mapToOutreachStatus(exactSource) as OutreachStatus) || 'gate_opener_staged'
      const rawStatuses = rJson?.active_statuses || (derivedStatus ? [derivedStatus] : ['gate_opener_staged'])
      const stagedStatuses = Array.isArray(rawStatuses) ? rawStatuses : [derivedStatus]

      leadMap.set(co.id, {
        id: `staged-${co.id}`,
        company_id: co.id,
        company_name: co.company_name || 'Unknown',
        contact_name: contact.full_name || 'Owner/Manager',
        contact_title: contact.title || 'Decision Maker',
        industry: co.industry || co.category || 'General',
        sector: (co.category || 'general') as any,
        phone,
        instagram_handle: igHandle,
        linkedin_url: liUrl,
        email: validEmail,
        channel,
        handle,
        template_used: 'gate_opener',
        status: derivedStatus,
        stage: derivedStatus as any,
        statuses: stagedStatuses,
        touch_count: 0,
        specific_observation: specificObs,
        prospect_reply: '',
        pain_point: '',
        call_opening_line: stagedSeq?.cold_call_script?.opener || '',
        notes: co.notes || '',
        staged_sequence: stagedSeq,
        sent_at: co.created_at,
        updated_at: co.updated_at || co.created_at,
      })
    })

    const seenCompanyActivities = new Set<string>()

    // Next, overlay actual logged activities so live status, replies, and sent timestamps are 100% accurate.
    // activities are ordered by created_at DESC (newest first), so the FIRST activity encountered for a company
    // is its most recent state! Older activities must NOT overwrite the newest activity.
    ;(activities || []).forEach((act: any) => {
      const payload: any = extractActivityPayload(act)

      const compId = act.company_id
      const co = (compId ? companyById.get(compId) : null) || act.companies || {}
      
      // Never show dormant or deleted companies in active outreach pipeline
      if (co.lead_type === 'Dormant' || co.status === 'dormant' || co.status === 'lost') {
        return
      }

      const existingLead = compId ? leadMap.get(compId) : undefined

      // Always count touches across all logged activities
      if (existingLead) {
        existingLead.touch_count = (existingLead.touch_count || 0) + 1
      }

      // If we have already applied the most recent activity for this company, do not overwrite with an older one!
      if (compId && seenCompanyActivities.has(compId)) {
        return
      }
      if (compId) {
        seenCompanyActivities.add(compId)
      }

      const actTitle = (act.title || '').toLowerCase()
      const hasValidLi = isValidLinkedInUrl(co.linkedin_url) || isValidLinkedInUrl(existingLead?.linkedin_url) || isValidLinkedInUrl(payload.profile_url) || isValidLinkedInUrl(payload.handle)
      const hasValidIg = (payload.handle && (payload.handle.startsWith('@') || payload.handle.includes('instagram.com'))) || (actTitle.includes('instagram') && !actTitle.includes('linkedin')) || act.activity_type === 'ig_dm'

      let channel: OutreachChannel
      if (payload.channel && ['instagram_dm', 'linkedin', 'whatsapp', 'cold_call', 'email', 'referral', 'event', 'walk_in'].includes(payload.channel)) {
        channel = payload.channel as OutreachChannel
      } else if (hasValidLi && !hasValidIg) {
        channel = 'linkedin'
      } else if (hasValidIg && !hasValidLi) {
        channel = 'instagram_dm'
      } else if (act.activity_type === 'ig_dm' || actTitle.includes('instagram')) {
        channel = 'instagram_dm'
      } else if (act.activity_type === 'whatsapp_sent' || actTitle.includes('whatsapp')) {
        channel = 'whatsapp'
      } else if (act.activity_type === 'email_sent' || actTitle.includes('email')) {
        channel = 'email'
      } else if (act.activity_type === 'call_made' || actTitle.includes('call')) {
        channel = 'cold_call'
      } else if (actTitle.includes('linkedin') || hasValidLi) {
        channel = 'linkedin'
      } else {
        channel = (existingLead?.channel || 'linkedin') as OutreachChannel
      }
      let rJson: any = {}
      try {
        if (co.research_json && typeof co.research_json === 'object') rJson = co.research_json
        else if (co.notes && (co.notes.startsWith('{') || co.notes.startsWith('['))) rJson = JSON.parse(co.notes)
      } catch {}

      // Prefer payload.status from most recent activity, or company unified_status / pipeline_stage
      const candidateStatus = payload.status || rJson?.unified_status || co.pipeline_stage || co.status
      let status: OutreachStatus = (mapToOutreachStatus(candidateStatus) as OutreachStatus) || 'gate_opener_sent'

      const coStatus = (co.status || '').toLowerCase().trim()
      const pStage = (co.pipeline_stage || '').toLowerCase().trim()

      // Synchronize terminal or special stages
      if (pStage === 'meeting booked' || coStatus === 'meeting_booked' || coStatus === 'opportunity' || coStatus === 'won') {
        status = 'meeting_booked'
      } else if (coStatus === 'lost' || pStage === 'lost' || coStatus === 'dormant' || pStage === 'dormant') {
        status = 'not_now_snoozed'
      }
      const stagedSeq = existingLead?.staged_sequence || rJson?.staged_sequence || undefined

      const specificObs = payload.pain_point || existingLead?.specific_observation || rJson?.specific_observation || ''
      const contact = co.contacts?.[0] || {}

      const phone = co.phone || contact.phone || existingLead?.phone || (payload.handle && /^[\d\+\-\s\(\)]+$/.test(payload.handle) ? payload.handle : null)
      const igHandle = existingLead?.instagram_handle || (channel === 'instagram_dm' ? (payload.handle || co.notes?.match(/@[\w.]+/)?.[0]) : null)
      const liUrl = existingLead?.linkedin_url || (channel === 'linkedin' ? (payload.profile_url || co.linkedin_url) : null)
      const email = existingLead?.email || co.email || contact.email || null

      const replySnippet = payload.prospect_reply || payload.reply || (co.pipeline_stage === 'Replied' || co.pipeline_stage === 'Call Ready' ? (co.draft_message || '') : '') || existingLead?.prospect_reply || ''

      leadMap.set(act.company_id || act.id, {
        id: act.id,
        company_id: act.company_id,
        company_name: co.company_name || existingLead?.company_name || 'Unknown',
        contact_name: existingLead?.contact_name || contact.full_name || payload.contact_name || 'Decision Maker',
        contact_title: existingLead?.contact_title || contact.title || 'Owner',
        industry: co.industry || existingLead?.industry || 'General',
        sector: existingLead?.sector || (co.category as any) || 'general',
        phone,
        instagram_handle: igHandle,
        linkedin_url: liUrl,
        email,
        channel,
        handle: payload.handle || existingLead?.handle || '',
        template_used: (payload.template_used || 'gate_opener') as OutreachTemplate,
        status,
        stage: status as any,
        statuses: Array.isArray(payload.statuses) ? payload.statuses : (Array.isArray(rJson?.active_statuses) ? rJson.active_statuses : (existingLead?.statuses || [status])),
        touch_count: existingLead?.touch_count || 1,
        specific_observation: specificObs,
        prospect_reply: replySnippet,
        pain_point: payload.pain_point || '',
        call_opening_line: payload.call_opening_line || existingLead?.call_opening_line || stagedSeq?.cold_call_script?.opener || '',
        notes: payload.notes || act.notes || existingLead?.notes || '',
        staged_sequence: stagedSeq,
        sent_at: act.created_at,
        updated_at: payload.updated_at || act.created_at,
        priority: resolveLeadPriority(co || existingLead),
      })
    })

    let combined: OutreachLead[] = []

    if (!range.startDate && !range.endDate) {
      combined = Array.from(leadMap.values())
    } else {
      const matchedCompanyIds = new Set<string>()

      // 1. Matches from logged activities in target date range
      ;(activities || []).forEach((act: any) => {
        if (!act.created_at) return
        const payload: any = extractActivityPayload(act)

        const createdDate = act.created_at ? act.created_at.split('T')[0] : null
        const explicitDate = payload.outreach_date ? payload.outreach_date.split('T')[0] : null
        const updatedDate = payload.updated_at ? payload.updated_at.split('T')[0] : null

        const isMatch =
          (explicitDate && isDateInRange(explicitDate, range.startDate, range.endDate)) ||
          (createdDate && isDateInRange(createdDate, range.startDate, range.endDate)) ||
          (updatedDate && isDateInRange(updatedDate, range.startDate, range.endDate))

        if (isMatch) {
          const compId = act.company_id || act.id
          const co = (act.company_id ? companyById.get(act.company_id) : null) || act.companies || {}
          if (co.lead_type === 'Dormant' || co.status === 'dormant' || co.status === 'lost') return
          matchedCompanyIds.add(compId)
        }
      })

      // 2. Also match companies created/contacted in target date range
      activeOutreachCompanies.forEach((co: any) => {
        const coDate = co.created_at ? co.created_at.split('T')[0] : null
        const coUpd = co.updated_at ? co.updated_at.split('T')[0] : null
        const dateAdded = co.date_added || null
        if (
          (dateAdded && isDateInRange(dateAdded, range.startDate, range.endDate)) ||
          (coDate && isDateInRange(coDate, range.startDate, range.endDate)) ||
          (coUpd && isDateInRange(coUpd, range.startDate, range.endDate))
        ) {
          matchedCompanyIds.add(co.id)
        }
      })

      // 3. Assemble rich lead records from leadMap for active outreach touches
      matchedCompanyIds.forEach(compId => {
        const lead = leadMap.get(compId)
        if (lead) {
          combined.push(lead)
        }
      })
    }

    if (channelFilter) {
      combined = combined.filter(l => l.channel === channelFilter)
    }

    // Exclude dormant / snoozed leads from active outreach pipelines
    combined = combined.filter(l => l.status !== 'not_now_snoozed' && l.stage !== 'not_now_snoozed')

    setServerCached(cacheKey, combined)
    return { data: combined, error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

// ─── Get Dedicated Daily Batch per Channel (Strict 25 Contacts per Day) ───
export async function getChannelDailyBatch(
  channel: OutreachChannel,
  limit: number = 25,
  industry?: string,
  priority?: 1 | 2 | 3 | 'all'
) {
  try {
    await requireAuth()

    // 1. Find all company IDs that ALREADY had an outreach activity logged on this channel
    let channelActTypes: string[] = []
    if (channel === 'whatsapp') channelActTypes = ['whatsapp_sent']
    else if (channel === 'instagram_dm') channelActTypes = ['ig_dm']
    else if (channel === 'linkedin') channelActTypes = ['linkedin_sent']
    else if (channel === 'cold_call') channelActTypes = ['call_made']
    else if (channel === 'email') channelActTypes = ['email_sent']
    else channelActTypes = [getValidActivityType(channel)]

    const { data: touchedActs } = await supabase
      .from('activities')
      .select('company_id, title, description, activity_type')
      .in('activity_type', [...channelActTypes, 'outreach_sent'])

    const touchedCompanyIds = new Set(
      (touchedActs || [])
        .filter(a => {
          const t = (a.title || '').toLowerCase()
          const d = (a.description || '').toLowerCase()
          if (t.includes('opener staged') || t.includes('staged')) return false
          if (d.includes('"gate_opener_staged"')) return false
          if (a.activity_type === 'outreach_sent') {
            if (channel === 'instagram_dm') return t.includes('instagram') || d.includes('instagram') || (!t.includes('linkedin') && !t.includes('whatsapp') && !t.includes('call'))
            if (channel === 'linkedin') return t.includes('linkedin') || d.includes('linkedin')
            if (channel === 'whatsapp') return t.includes('whatsapp') || d.includes('whatsapp')
            if (channel === 'cold_call') return t.includes('call') || d.includes('call')
            return false
          }
          return true
        })
        .map(a => a.company_id)
        .filter(Boolean)
    )

    // 2. Query companies eligible for this channel that HAVE NOT been touched yet
    let coQuery = supabase
      .from('companies')
      .select('*, contacts(*)')
      .not('status', 'in', '("won","lost","archived")')
      .order('created_at', { ascending: false })

    const { data: companies, error: coErr } = await coQuery.limit(1000)
    if (coErr) return { data: [], totalAvailable: 0, error: coErr.message }

    // Filter strictly out touched companies and filter by channel & industry suitability
    const uncontacted = (companies || []).filter(c => {
      if (touchedCompanyIds.has(c.id)) return false
      const st = (c.status || '').toLowerCase().trim()
      const pst = (c.pipeline_stage || '').toLowerCase().trim()
      if (st === 'contacted' || st === 'meeting_booked' || st === 'in_call_queue' || st === 'opportunity' || st === 'won' || st === 'lost' || st === 'dormant') return false
      if (pst === 'contacted' || pst === 'replied' || pst === 'call ready' || pst === 'follow-up sent' || pst === 'meeting booked') return false

      if (industry && industry !== 'all') {
        const cat = (c.category || '').toLowerCase().trim()
        const ind = (c.industry || '').toLowerCase().trim()
        const targetInd = industry.toLowerCase().trim()
        let match = cat === targetInd || ind === targetInd
        if (!match) {
          const norm = normalizeCategorySync(c.category || c.industry, c.company_name)
          match = norm === targetInd
        }
        if (!match) return false
      }

      let rJson: any = {}
      try {
        if (c.research_json && typeof c.research_json === 'object' && Object.keys(c.research_json).length > 0) rJson = c.research_json
        else if (c.notes && (c.notes.startsWith('{') || c.notes.startsWith('['))) rJson = JSON.parse(c.notes)
      } catch {}

      if (channel === 'instagram_dm') {
        const igUrl = extractInstagramUrl(c)
        let rawIg = rJson.instagram_handle || (c.notes && c.notes.match(/["']?instagram_handle["']?\s*:\s*["'](@?[^"']+)["']/i)?.[1]) || (c.notes && c.notes.match(/Instagram:\s*(@?[^\s,]+)/i)?.[1])
        if (!rawIg && igUrl) {
          const m = igUrl.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i)
          if (m) rawIg = m[1]
        }
        const clean = rawIg ? String(rawIg).replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@+/, '').replace(/\/+$/, '').trim() : ''
        return Boolean(clean && clean.length >= 2 && !clean.includes(' '))
      }
      if (channel === 'whatsapp' || channel === 'cold_call') {
        const ph = c.phone || c.contacts?.[0]?.phone || c.contacts?.[0]?.whatsapp
        return Boolean(ph && String(ph).replace(/\D/g, '').length >= 7)
      }
      if (channel === 'linkedin') {
        const li = (isValidLinkedInUrl(c.linkedin_url) ? c.linkedin_url : null) || c.contacts?.find((cnt: any) => isValidLinkedInUrl(cnt.linkedin_url))?.linkedin_url
        return Boolean(li)
      }
      if (channel === 'email') {
        const em = c.email || c.contacts?.[0]?.email
        return Boolean(em && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(em).trim()))
      }
      return true
    })

    // If a specific priority tier is requested (1, 2, or 3), return up to `limit` of that priority.
    // If priority is 'all' or omitted, return a balanced pool (up to `limit` per priority tier, e.g. 25 of P1, 25 of P2, 25 of P3)
    // so the client-side Power Hour queue has leads ready for any priority the user selects in the "Send to:" dropdown.
    let selectedBatch: any[] = []
    if (priority && priority !== 'all') {
      const filteredByPrio = uncontacted.filter(c => resolveLeadPriority(c) === priority)
      selectedBatch = filteredByPrio.slice(0, limit)
    } else {
      const p1: any[] = []
      const p2: any[] = []
      const p3: any[] = []
      for (const c of uncontacted) {
        const pri = resolveLeadPriority(c)
        if (pri === 1) {
          if (p1.length < limit) p1.push(c)
        } else if (pri === 2) {
          if (p2.length < limit) p2.push(c)
        } else {
          if (p3.length < limit) p3.push(c)
        }
      }
      selectedBatch = [...p1, ...p2, ...p3]
    }

    const mapped: OutreachLead[] = selectedBatch.map(c => {
      const contact = c.contacts?.[0] || {}
      let rJson: any = {}
      try {
        if (c.research_json && typeof c.research_json === 'object' && Object.keys(c.research_json).length > 0) rJson = c.research_json
        else if (c.notes && (c.notes.startsWith('{') || c.notes.startsWith('['))) rJson = JSON.parse(c.notes)
      } catch {}

      const igUrl = extractInstagramUrl(c)
      let rawIg = rJson.instagram_handle || (c.notes && c.notes.match(/["']?instagram_handle["']?\s*:\s*["'](@?[^"']+)["']/i)?.[1]) || (c.notes && c.notes.match(/Instagram:\s*(@?[^\s,]+)/i)?.[1]) || null
      if (!rawIg && igUrl) {
        const m = igUrl.match(/instagram\.com\/([a-zA-Z0-9_.]+)/i)
        if (m) rawIg = m[1]
      }
      const cleanIg = rawIg ? (rawIg.startsWith('@') ? rawIg : `@${rawIg.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^\/+/, '').replace(/\/+$/, '')}`) : null
      const ig = cleanIg && !cleanIg.includes(' ') && cleanIg.length >= 2 ? cleanIg : null

      const cleanLi = (isValidLinkedInUrl(c.linkedin_url) ? c.linkedin_url : null) || c.contacts?.find((cnt: any) => isValidLinkedInUrl(cnt.linkedin_url))?.linkedin_url || null
      const validPhone = (c.phone || contact.phone || contact.whatsapp) && String(c.phone || contact.phone || contact.whatsapp).replace(/\D/g, '').length >= 7
        ? (c.phone || contact.phone || contact.whatsapp)
        : null
      const validEmail = (c.email || contact.email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c.email || contact.email).trim())
        ? (c.email || contact.email)
        : null

      let handle = c.company_name
      if (channel === 'instagram_dm') handle = ig || c.company_name
      else if (channel === 'linkedin') handle = cleanLi || c.company_name
      else if (channel === 'whatsapp' || channel === 'cold_call') handle = validPhone || c.company_name
      else if (channel === 'email') handle = validEmail || c.company_name

      const stagedSeq = rJson.staged_sequence || undefined

      return {
        id: `daily-${c.id}`,
        company_id: c.id,
        company_name: c.company_name,
        contact_name: contact.full_name || 'Owner/Manager',
        contact_title: contact.title || 'Decision Maker',
        industry: c.industry || c.category || 'General',
        sector: c.category || 'general',
        phone: validPhone,
        instagram_handle: ig,
        linkedin_url: cleanLi,
        email: validEmail,
        channel,
        handle,
        template_used: 'gate_opener',
        status: 'gate_opener_staged',
        stage: 'gate_opener_staged',
        touch_count: 0,
        specific_observation: rJson.specific_observation || rJson.staged_sequence?.touch_1?.specific_observation || c.draft_angle_reasoning || (c.notes && !c.notes.startsWith('{') ? c.notes : '') || 'Recent business growth & market positioning',
        prospect_reply: '',
        pain_point: '',
        call_opening_line: stagedSeq?.cold_call_script?.opener || `Ahlan, this is from Tadbeer in Muscat regarding ${c.company_name}. Have 30 seconds?`,
        notes: c.notes || '',
        staged_sequence: stagedSeq,
        priority: resolveLeadPriority(c),
        sent_at: c.created_at,
        updated_at: c.updated_at || c.created_at,
      } as OutreachLead
    })

    return { data: mapped, totalAvailable: uncontacted.length, error: null }
  } catch (err) {
    return { data: [], totalAvailable: 0, error: (err as Error).message }
  }
}

// ─── Mark Channel Touch Sent (Instant 1-Click Action) ─────────────────────────
export async function markChannelTouchSent(data: {
  company_id: string
  channel: OutreachChannel
  message?: string
  handle?: string
  observation?: string
  notes?: string
}) {
  try {
    await requireAuth()
    const createdAt = new Date().toISOString()
    const payload = {
      channel: data.channel,
      handle: data.handle || '',
      template_used: 'gate_opener',
      status: 'gate_opener_sent',
      prospect_reply: '',
      pain_point: data.observation || '',
      call_opening_line: '',
      notes: data.notes || '',
      sent_message: data.message || '',
      outreach_date: createdAt.split('T')[0],
    }

    // 1. Insert activity log
    const { data: act, error: actErr } = await supabase
      .from('activities')
      .insert({
        company_id: data.company_id,
        activity_type: getValidActivityType(data.channel),
        title: `${CHANNEL_CONFIG[data.channel]?.label || data.channel} — Gate-Opener Sent`,
        description: data.notes || data.message || 'Gate-Opener Sent',
        metadata: payload,
        created_at: createdAt,
      })
      .select('id')
      .single()

    if (actErr) return { data: null, error: actErr.message }

    // 2. Insert outreach_touches row with mapped valid channel constraint
    const rawCh = String(data.channel).toLowerCase()
    const validTouchChannel = rawCh.includes('email') ? 'email' : (rawCh.includes('linkedin') ? 'linkedin' : (rawCh.includes('wa') || rawCh.includes('whatsapp') ? 'whatsapp' : 'call'))

    try {
      await supabase.from('outreach_touches').insert({
        lead_id: data.company_id,
        channel: validTouchChannel,
        step_number: 1,
        message: data.message || 'Gate-opener sent',
        status: 'sent',
        sent_at: createdAt,
      })
    } catch (touchErr) {
      console.warn("Touch insert note:", touchErr)
    }

    // 3. Update company status and touch date
    await supabase.from('companies').update({
      status: 'contacted',
      updated_at: createdAt,
    }).eq('id', data.company_id)

    // 4. Auto-schedule Follow-up 1 for exactly +2 days (Strict Cadence Delay)
    const nextDueDate = new Date(createdAt)
    nextDueDate.setDate(nextDueDate.getDate() + 2)
    const nextDueDateStr = nextDueDate.toISOString().split('T')[0]

    // Complete any previous pending follow-ups to prevent duplicates
    await supabase.from('follow_ups').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes: 'Superceded by Stage 1 outreach touch'
    }).eq('company_id', data.company_id).eq('status', 'pending')

    const dbChannel = toSafeFollowUpChannel(data.channel)
    const channelTag = String(data.channel || '').toLowerCase().includes('instagram') ? ' [Channel: Instagram DM]' : ''

    await supabase.from('follow_ups').insert({
      company_id: data.company_id,
      due_date: nextDueDateStr,
      subject: 'Follow-up 1: Value Check-in',
      description: `Stage 2 follow-up. Value observation check-in after 2 days without reply.${channelTag}`,
      channel: dbChannel,
      status: 'pending',
      created_at: createdAt
    })

    revalidateAllCRMPages()
    return { data: { activityId: act.id, companyId: data.company_id }, error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

export async function deleteOutreachLog(activityId: string) {
  try {
    const { error } = await supabase.from('activities').delete().eq('id', activityId)
    revalidateAllCRMPages()
    return { error: error?.message || null }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function getOutreachCountsForMonth(year: number, month: number) {
  try {
    const formattedMonth = month < 10 ? `0${month}` : `${month}`
    const startDayStr = `${year}-${formattedMonth}-01`
    const lastDayOfMonth = new Date(year, month, 0).getDate()
    const endDayStr = `${year}-${formattedMonth}-${lastDayOfMonth < 10 ? `0${lastDayOfMonth}` : lastDayOfMonth}`

    const sBuf = new Date(startDayStr)
    sBuf.setDate(sBuf.getDate() - 1)
    const eBuf = new Date(endDayStr)
    eBuf.setDate(eBuf.getDate() + 1)

    const [actRes, coRes] = await Promise.all([
      supabase
        .from('activities')
        .select('id, created_at, company_id, description, activity_type, metadata')
        .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach', 'outreach_sent'])
        .gte('created_at', `${sBuf.toISOString().split('T')[0]}T00:00:00.000Z`)
        .lte('created_at', `${eBuf.toISOString().split('T')[0]}T23:59:59.999Z`)
        .range(0, 4999),
      supabase
        .from('companies')
        .select('id, status, lead_type')
        .range(0, 4999)
    ])

    if (actRes.error) return { data: {}, error: actRes.error.message }

    const companyById = new Map<string, any>((coRes.data || []).map((c: any) => [c.id, c]))
    const dateToCompanySet: Record<string, Set<string>> = {}

    ;(actRes.data || []).forEach((act: any) => {
      if (!act.created_at) return
      const compId = act.company_id || act.id
      const co = companyById.get(compId)
      if (co && (co.lead_type === 'Dormant' || co.status === 'dormant' || co.status === 'lost')) return

      const payload: any = extractActivityPayload(act)

      const day = payload.outreach_date ? payload.outreach_date.split('T')[0] : act.created_at.split('T')[0]
      if (day && day >= startDayStr && day <= endDayStr) {
        if (!dateToCompanySet[day]) dateToCompanySet[day] = new Set()
        dateToCompanySet[day].add(compId)
      }
    })

    const counts: Record<string, number> = {}
    Object.keys(dateToCompanySet).forEach(d => {
      counts[d] = dateToCompanySet[d].size
    })

    return { data: counts, error: null }
  } catch (err) {
    return { data: {}, error: (err as Error).message }
  }
}

// ─── Import CSV Outreach ──────────────────────────────────────────────────────
export interface MappedCSVRow {
  // Supabase companies table
  company_name?: string
  industry?: string
  phone?: string
  website?: string
  email?: string
  linkedin_url?: string

  // Supabase contacts table
  contact_name?: string
  contact_title?: string
  contact_whatsapp?: string

  // Supabase activities table (Outreach Log)
  handle?: string
  channel?: OutreachChannel
  status?: OutreachStatus
  notes?: string
  prospect_reply?: string
  pain_point?: string
  call_opening_line?: string
  outreach_date?: string
}

export async function importCSVOutreach(data: {
  rows: MappedCSVRow[]
  defaultChannel: OutreachChannel
  defaultDate: string
  defaultTemplate?: OutreachTemplate
}) {
  try {
    await requireAuth()
    if (!data.rows || data.rows.length === 0) {
      return { count: 0, imported: 0, matched: 0, newCos: 0, error: "No rows provided for import" }
    }

    const effectiveDefaultDate = (data.defaultDate && /^\d{4}-\d{2}-\d{2}$/.test(data.defaultDate.trim()))
      ? data.defaultDate.trim()
      : new Date().toISOString().split('T')[0]

    // 1. Fetch all existing companies and their contacts to build index lookups
    const { data: allExistingCos, error: fetchErr } = await supabase
      .from('companies')
      .select('id, company_name, industry, phone, email, website, linkedin_url, status, contacts(id, full_name, phone, whatsapp, email, linkedin_url)')
      .range(0, 4999)

    if (fetchErr) {
      return { count: 0, error: fetchErr.message }
    }

    const coById = new Map<string, any>()
    const coByExactName = new Map<string, string>() // lower -> id
    const coByNormName = new Map<string, string>()  // normalized -> id
    const coByLinkedin = new Map<string, string>()  // clean slug -> id
    const coByPhone = new Map<string, string>()     // clean digits -> id
    const coByContactName = new Map<string, string>() // normalized contact -> companyId

    const registerCompanyInMaps = (co: any) => {
      coById.set(co.id, co)
      if (co.company_name) {
        coByExactName.set(co.company_name.toLowerCase().trim(), co.id)
        coByNormName.set(normalizeCompanyName(co.company_name), co.id)
      }
      if (co.linkedin_url) {
        const slug = cleanLinkedinSlug(co.linkedin_url)
        if (slug) coByLinkedin.set(slug, co.id)
      }
      if (co.phone) {
        const digits = cleanDigits(co.phone)
        if (digits.length >= 7) coByPhone.set(digits, co.id)
      }
      if (co.contacts && Array.isArray(co.contacts)) {
        co.contacts.forEach((ct: any) => {
          if (ct.full_name) {
            coByContactName.set(normalizeCompanyName(ct.full_name), co.id)
          }
          if (ct.linkedin_url) {
            const slug = cleanLinkedinSlug(ct.linkedin_url)
            if (slug) coByLinkedin.set(slug, co.id)
          }
          if (ct.phone || ct.whatsapp) {
            const digits = cleanDigits(ct.phone || ct.whatsapp)
            if (digits.length >= 7) coByPhone.set(digits, co.id)
          }
        })
      }
    }

    ;(allExistingCos || []).forEach(registerCompanyInMaps)

    const getRowCompanyName = (r: MappedCSVRow, idx: number): string => {
      if (r.company_name?.trim()) return r.company_name.trim();
      if (r.contact_name?.trim()) return r.contact_name.trim();
      if (r.handle?.trim()) return r.handle.trim().replace(/^@/, '');
      return `Lead ${idx + 1}`;
    };

    let matchedCount = 0
    let createdCoCount = 0
    let createdActCount = 0
    let updatedActCount = 0

    // Fetch existing activities on candidate dates to avoid intra-day duplicates
    const { data: existingActivitiesForDates } = await supabase
      .from('activities')
      .select('id, company_id, created_at, activity_type, metadata')
      .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach', 'outreach_sent'])
      .range(0, 4999)

    // Map of `${companyId}_${day}` -> activity
    const activityByCoAndDay = new Map<string, any>()
    ;(existingActivitiesForDates || []).forEach((act: any) => {
      const payload = extractActivityPayload(act)
      const day = payload.outreach_date ? payload.outreach_date.split('T')[0] : act.created_at?.split('T')[0]
      if (act.company_id && day) {
        activityByCoAndDay.set(`${act.company_id}_${day}`, act)
      }
    })

    // Process each row with complete duplicate immunity
    for (let idx = 0; idx < data.rows.length; idx++) {
      const row = data.rows[idx]
      const rawName = getRowCompanyName(row, idx)
      const normName = normalizeCompanyName(rawName)
      const rowPhone = row.phone || row.contact_whatsapp || null
      const rowDigits = cleanDigits(rowPhone)
      const rowLi = row.linkedin_url || (row.handle?.includes('linkedin.com') ? row.handle : null)
      const rowLiSlug = cleanLinkedinSlug(rowLi)
      const rowContactName = row.contact_name?.trim() || null

      // Find company match with complete duplicate immunity
      let companyId: string | undefined = undefined

      if (coByExactName.has(rawName.toLowerCase().trim())) {
        companyId = coByExactName.get(rawName.toLowerCase().trim())
      } else if (normName && coByNormName.has(normName)) {
        companyId = coByNormName.get(normName)
      } else if (rowLiSlug && coByLinkedin.has(rowLiSlug)) {
        companyId = coByLinkedin.get(rowLiSlug)
      } else if (rowDigits.length >= 7 && coByPhone.has(rowDigits)) {
        companyId = coByPhone.get(rowDigits)
      } else if (rowContactName && coByContactName.has(normalizeCompanyName(rowContactName))) {
        companyId = coByContactName.get(normalizeCompanyName(rowContactName))
      }

      if (companyId) {
        matchedCount++
        // Update company with any missing fields provided in this row
        const existingCo = coById.get(companyId)
        const updates: any = {
          status: 'contacted',
          pipeline_stage: 'Contacted',
          lead_status: 'Contacted',
          updated_at: new Date().toISOString()
        }
        if (!existingCo?.phone && rowPhone) updates.phone = rowPhone
        if (!existingCo?.linkedin_url && rowLi) updates.linkedin_url = rowLi
        if (!existingCo?.email && row.email) updates.email = row.email
        if (!existingCo?.website && row.website) updates.website = row.website
        if ((!existingCo?.industry || existingCo.industry === 'General') && row.industry) updates.industry = row.industry

        await supabase.from('companies').update(updates).eq('id', companyId)
      } else {
        // Create new company
        createdCoCount++
        const isLi = Boolean(rowLiSlug || row.channel === 'linkedin' || data.defaultChannel === 'linkedin')
        const isIg = Boolean(row.handle && (row.handle.startsWith('@') || row.handle.includes('instagram.com'))) || row.channel === 'instagram_dm' || data.defaultChannel === 'instagram_dm'

        const { data: newCo, error: newCoErr } = await supabase
          .from('companies')
          .insert({
            company_name: rawName,
            industry: row.industry?.trim() || 'General',
            phone: rowPhone,
            website: row.website?.trim() || null,
            email: row.email?.trim() || null,
            linkedin_url: rowLi,
            lead_source: isLi ? 'LinkedIn' : isIg ? 'Instagram' : 'CSV Import',
            status: 'contacted',
            pipeline_stage: 'Contacted',
            lead_status: 'Contacted',
            notes: row.notes?.trim() || 'Imported via CSV',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select('id, company_name, phone, email, website, linkedin_url, industry, status')
          .single()

        if (newCoErr) {
          console.error("Failed to insert company:", newCoErr.message)
          continue
        }
        companyId = newCo.id
        registerCompanyInMaps({ ...newCo, contacts: [] })
      }

      if (!companyId) continue

      // Contact Deduplication: check if contact exists for this company
      const existingCo = coById.get(companyId)
      const existingContacts = existingCo?.contacts || []
      const hasContactMatch = existingContacts.some((c: any) =>
        (rowContactName && normalizeCompanyName(c.full_name) === normalizeCompanyName(rowContactName)) ||
        (rowDigits.length >= 7 && cleanDigits(c.phone || c.whatsapp) === rowDigits) ||
        (rowLiSlug && cleanLinkedinSlug(c.linkedin_url) === rowLiSlug)
      )

      if (!hasContactMatch && (rowContactName || rowPhone || rowLi || row.email)) {
        const { data: newContact } = await supabase.from('contacts').insert({
          company_id: companyId,
          full_name: rowContactName || `${rawName} Contact`,
          title: row.contact_title?.trim() || 'Decision Maker',
          phone: rowPhone,
          whatsapp: row.contact_whatsapp?.trim() || rowPhone,
          email: row.email?.trim() || null,
          linkedin_url: rowLi,
          is_primary: existingContacts.length === 0,
          created_at: new Date().toISOString()
        }).select().maybeSingle()

        if (newContact) {
          existingContacts.push(newContact)
          registerCompanyInMaps({ ...existingCo, contacts: existingContacts })
        }
      }

      // Outreach Activity Deduplication on Target Date
      const rowDate = (row.outreach_date?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(row.outreach_date.trim()))
        ? row.outreach_date.trim().slice(0, 10)
        : effectiveDefaultDate

      let ch = (row.channel || data.defaultChannel) as OutreachChannel
      if (rowLiSlug || row.channel === 'linkedin' || data.defaultChannel === 'linkedin') {
        ch = 'linkedin'
      } else if ((row.handle && (row.handle.startsWith('@') || row.handle.includes('instagram.com'))) || row.channel === 'instagram_dm' || data.defaultChannel === 'instagram_dm') {
        ch = 'instagram_dm'
      }

      const st = (row.status || 'sent') as OutreachStatus
      const createdAt = `${rowDate}T12:00:00.000Z`
      const actKey = `${companyId}_${rowDate}`

      const payload = {
        channel: ch,
        handle: row.handle?.trim() || row.linkedin_url?.trim() || rowPhone || '',
        template_used: data.defaultTemplate || 'growth_offer',
        status: st,
        prospect_reply: row.prospect_reply?.trim() || '',
        pain_point: row.pain_point?.trim() || '',
        call_opening_line: row.call_opening_line?.trim() || '',
        notes: row.notes?.trim() || '',
        outreach_date: rowDate,
      }

      if (activityByCoAndDay.has(actKey)) {
        // UPDATE existing activity (duplicate immunity)
        const existingAct = activityByCoAndDay.get(actKey)
        await supabase
          .from('activities')
          .update({
            title: (CHANNEL_CONFIG[ch]?.label || 'Outreach') + ' — ' + (STATUS_CONFIG[st]?.label || 'CSV Import'),
            description: row.notes?.trim() || existingAct.description || 'Imported via CSV',
            metadata: { ...existingAct.metadata, ...payload },
            created_at: createdAt
          })
          .eq('id', existingAct.id)
        updatedActCount++
      } else {
        // INSERT new activity
        const { data: newAct } = await supabase
          .from('activities')
          .insert({
            company_id: companyId,
            activity_type: getValidActivityType(ch),
            title: (CHANNEL_CONFIG[ch]?.label || 'Outreach') + ' — ' + (STATUS_CONFIG[st]?.label || 'CSV Import'),
            description: row.notes?.trim() || 'Imported via CSV',
            metadata: payload,
            created_at: createdAt,
          })
          .select('id, company_id, created_at, metadata')
          .maybeSingle()

        if (newAct) {
          activityByCoAndDay.set(actKey, newAct)
          createdActCount++
        }
      }
    }

    revalidateAllCRMPages()
    return {
      count: createdActCount + updatedActCount,
      imported: createdActCount,
      updated: updatedActCount,
      matched: matchedCount,
      newCos: createdCoCount,
      date: effectiveDefaultDate,
      error: null
    }
  } catch (err) {
    return { count: 0, error: (err as Error).message }
  }
}


