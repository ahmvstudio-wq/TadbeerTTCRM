'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/config'
import { requireAuth } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'

const supabase = getSupabaseAdminClient()

function revalidateAllCRMPages() {
  try {
    revalidatePath('/outreach')
    revalidatePath('/daily-cadence')
    revalidatePath('/dashboard')
    revalidatePath('/prospects')
    revalidatePath('/pipeline')
    revalidatePath('/meetings')
    revalidatePath('/calls')
    revalidatePath('/follow-ups')
  } catch {
    // safe fallback in case called outside request context
  }
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
import { isValidLinkedInUrl } from '@/lib/utils'
import { mapToDbLeadStatus } from '@/lib/constants/statuses'

function getValidActivityType(channel: string): string {
  if (channel === 'email') return 'email_sent';
  if (channel === 'whatsapp') return 'whatsapp_sent';
  if (channel === 'instagram_dm' || channel === 'linkedin') return 'outreach_sent';
  return 'call_made';
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
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .ilike('company_name', data.company_name.trim())
      .limit(1)
      .maybeSingle()

    let companyId = existing?.id

    if (!companyId) {
      const { data: newCo, error: coErr } = await supabase
        .from('companies')
        .insert({
          company_name: data.company_name.trim(),
          industry: data.industry.trim() || 'General',
          phone: data.phone || null,
          status: 'contacted',
          pipeline_stage: 'Contacted',
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
          updated_at: new Date().toISOString(),
        })
        .eq('id', companyId)
    }

    const createdAt = data.outreach_date
      ? new Date(data.outreach_date).toISOString()
      : new Date().toISOString()

    const payload = {
      channel: data.channel,
      handle: data.handle,
      template_used: data.template_used,
      status: 'sent',
      prospect_reply: '',
      pain_point: '',
      call_opening_line: '',
      notes: data.notes || '',
    }

    const { data: activity, error: actErr } = await supabase
      .from('activities')
      .insert({
        company_id: companyId,
        activity_type: getValidActivityType(data.channel),
        title: CHANNEL_CONFIG[data.channel].label + ' — ' + TEMPLATE_LABELS[data.template_used],
        description: JSON.stringify(payload),
        created_at: createdAt,
      })
      .select()
      .single()

    if (actErr) return { data: null, error: actErr.message }
    revalidateAllCRMPages()
    return { data: { activityId: activity.id, companyId }, error: null }
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
    const createdAt = data.outreach_date
      ? new Date(data.outreach_date).toISOString()
      : new Date().toISOString()

    const records = data.companies.map(co => {
      const payload = {
        channel: data.channel,
        handle: co.phone || 'Existing Contact',
        template_used: data.template_used,
        status: 'sent',
        prospect_reply: '',
        pain_point: '',
        call_opening_line: '',
        notes: data.notes || '',
      }
      return {
        company_id: co.id,
        activity_type: getValidActivityType(data.channel),
        title: CHANNEL_CONFIG[data.channel].label + ' — ' + TEMPLATE_LABELS[data.template_used],
        description: JSON.stringify(payload),
        created_at: createdAt,
      }
    })

    const { error } = await supabase.from('activities').insert(records)
    if (error) return { error: error.message }

    const compIds = data.companies.map(c => c.id).filter(Boolean)
    if (compIds.length > 0) {
      await supabase
        .from('companies')
        .update({
          status: 'contacted',
          pipeline_stage: 'Contacted',
          updated_at: createdAt,
        })
        .in('id', compIds)
    }

    revalidateAllCRMPages()
    return { error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

// ─── Update entry (any field) ────────────────────────────────────────────────
export async function updateOutreachEntry(activityId: string, update: {
  status?: OutreachStatus
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
        .select('id, company_id, description, created_at')
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

    let current: any = {}
    if (existingActivity?.description) {
      try {
        current = JSON.parse(existingActivity.description)
      } catch {
        current = {}
      }
    }
    const updated = { ...current, ...update, updated_at: new Date().toISOString() }
    const channel: OutreachChannel = updated.channel || 'cold_call'
    const status: OutreachStatus = updated.status || 'sent'

    const dbPayload: any = {
      description: JSON.stringify(updated),
      title: (CHANNEL_CONFIG[channel]?.label || 'Outreach') + ' — ' + (STATUS_CONFIG[status]?.label || status),
      activity_type: getValidActivityType(channel),
    }

    if (update.outreach_date) {
      dbPayload.created_at = new Date(update.outreach_date + 'T12:00:00.000Z').toISOString()
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
      const createdAt = update.outreach_date
        ? new Date(update.outreach_date + 'T12:00:00.000Z').toISOString()
        : new Date().toISOString()

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

      let coStatus = 'contacted'
      let pipelineStage = 'Contacted'

      if (status === 'meeting_booked' || status === 'proposal_requested') {
        coStatus = 'meeting_booked'
        pipelineStage = 'Meeting Booked'
      } else if (['ready_for_call', 'coffee_invited'].includes(status)) {
        coStatus = 'in_call_queue'
        pipelineStage = 'Call Ready'
      } else if (status === 'called') {
        coStatus = 'contacted'
        pipelineStage = 'Contacted'
      } else if (['warm_up', 'reply_received', 'replied_interested', 'replied_objection', 'opening_identified'].includes(status) || (update.prospect_reply && update.prospect_reply.trim().length > 0)) {
        coStatus = 'contacted'
        pipelineStage = 'Replied'
      } else if (['gate_opener_sent', 'sent', 'follow_up_sent', 'agency_existing'].includes(status)) {
        coStatus = 'contacted'
        pipelineStage = 'Contacted'
      } else if (status === 'no_reply') {
        coStatus = 'contacted'
        pipelineStage = 'Contacted'
      } else if (status === 'gate_opener_staged') {
        coStatus = 'prospect'
        pipelineStage = 'New'
      } else if (status === 'not_now_snoozed') {
        coStatus = 'lost'
        pipelineStage = 'Lost'
      }

      coUpdate.status = coStatus
      coUpdate.pipeline_stage = pipelineStage
      coUpdate.lead_status = mapToDbLeadStatus(status)

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
      }

      if (scheduledDueDate) {
        const followUpSubject = updAny.followUpNote || `Follow up on ${status.replace(/_/g, ' ')}`
        await supabase.from('follow_ups').insert({
          company_id: companyId,
          due_date: scheduledDueDate,
          subject: followUpSubject,
          description: `Scheduled during status update to ${status}`,
          channel: updAny.followUpChannel || channel || 'call',
          status: 'pending',
          created_at: new Date().toISOString()
        })

        await supabase.from('activities').insert({
          company_id: companyId,
          activity_type: 'note',
          title: `Follow-up Scheduled — Due ${scheduledDueDate}`,
          description: JSON.stringify({
            status,
            due_date: scheduledDueDate,
            subject: followUpSubject,
            channel: updAny.followUpChannel || channel || 'call',
            created_at: new Date().toISOString()
          }),
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

    // 1. Insert a fresh follow_up_sent activity record so cadence logs it on today's date
    const { data: newAct, error: actErr } = await supabase
      .from('activities')
      .insert({
        company_id: companyId,
        activity_type: getValidActivityType(channel),
        title: (CHANNEL_CONFIG[channel]?.label || 'Outreach') + ' — Follow-up Sent',
        description: JSON.stringify(updatedPayload),
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
        description: JSON.stringify(updatedPayload)
      }).eq('id', actualActivityId)
    }

    // 3. Update company in companies table
    if (companyId) {
      await supabase.from('companies').update({
        status: 'contacted',
        pipeline_stage: 'Contacted',
        updated_at: now
      }).eq('id', companyId)

      // 4. Mark pending follow-up in follow_ups table as completed
      await supabase.from('follow_ups').update({
        status: 'completed',
        completed_at: now,
        notes: notes || 'Follow-up completed'
      }).eq('company_id', companyId).eq('status', 'pending')
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

    if (dateFilter === 'today') {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      query = query.gte('created_at', today.toISOString())
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.gte('created_at', weekAgo.toISOString())
    } else if (dateFilter !== 'all' && dateFilter.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const startDate = new Date(dateFilter)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(dateFilter)
      endDate.setHours(23, 59, 59, 999)
      query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query.limit(500)
    if (error) return { data: null, error: error.message }

    let parsed = (data || []).map((act: any) => {
      let payload: any = {}
      try { payload = act.description ? JSON.parse(act.description) : {} } catch {}
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

    // 1. Fetch activities with company joins
    const { data: activities, error: actErr } = await supabase
      .from('activities')
      .select('*, companies(id, company_name, industry, phone, notes, research_json, category, draft_message, status, pipeline_stage)')
      .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach', 'outreach_sent', 'status_changed'])
      .order('created_at', { ascending: false })
      .range(0, 4999)

    if (actErr) {
      console.warn("Activities query warning:", actErr.message)
    }

    // 2. Fetch companies that have entered the active outreach lifecycle (excluding raw uncontacted prospects and dormant)
    const { data: allCompanies, error: coErr } = await supabase
      .from('companies')
      .select('*, contacts(*)')
      .range(0, 4999)
      .order('created_at', { ascending: false })

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

      let channel: OutreachChannel = 'cold_call'
      const coSrc = (co.lead_source || '').toLowerCase()
      if (coSrc.includes('instagram') || rJson.target_channel === 'instagram_dm') {
        channel = 'instagram_dm'
      } else if ((coSrc.includes('linkedin') || rJson.target_channel === 'linkedin') && liUrl) {
        channel = 'linkedin'
      } else if (coSrc.includes('whatsapp') || rJson.target_channel === 'whatsapp') {
        channel = 'whatsapp'
      } else if (rJson.target_channel && ['whatsapp', 'instagram_dm', 'linkedin', 'email', 'cold_call'].includes(rJson.target_channel)) {
        if (rJson.target_channel === 'linkedin' && !liUrl) {
          channel = igHandle ? 'instagram_dm' : hasPhone ? 'whatsapp' : 'cold_call'
        } else {
          channel = rJson.target_channel
        }
      } else if (igHandle) {
        channel = 'instagram_dm'
      } else if (hasPhone) {
        channel = 'whatsapp'
      } else if (liUrl) {
        channel = 'linkedin'
      } else if (validEmail) {
        channel = 'email'
      } else {
        channel = 'cold_call'
      }

      let handle = co.company_name
      if (channel === 'instagram_dm' && igHandle) handle = igHandle
      else if ((channel === 'whatsapp' || channel === 'cold_call') && phone) handle = phone
      else if (channel === 'linkedin' && liUrl) handle = liUrl
      else if (channel === 'email' && validEmail) handle = validEmail

      const specificObs = rJson.specific_observation || rJson.staged_sequence?.touch_1?.specific_observation || co.draft_angle_reasoning || (co.notes && !co.notes.startsWith('{') ? co.notes : '') || 'Recent business growth & market positioning'

      const stagedSeq = rJson.staged_sequence || undefined
      const openerMessage = co.draft_message || stagedSeq?.touch_1?.message || 'Warm inquiry regarding operations'

      let derivedStatus: OutreachStatus = 'gate_opener_staged'
      const rawStatus = (co.status || '').toLowerCase().trim()
      const rawStage = (co.pipeline_stage || '').toLowerCase().trim()

      if (rawStatus === 'meeting_booked' || rawStage === 'meeting booked' || rawStatus === 'opportunity') {
        derivedStatus = 'meeting_booked'
      } else if (rawStatus === 'in_call_queue' || rawStage === 'call ready' || rawStatus === 'ready_for_call' || rawStatus === 'coffee_invited') {
        derivedStatus = 'ready_for_call'
      } else if (rawStatus === 'called') {
        derivedStatus = 'called'
      } else if (rawStage === 'replied' || rawStatus === 'reply_received' || rawStatus === 'warm_up' || rawStatus === 'lead') {
        derivedStatus = 'warm_up'
      } else if (rawStatus === 'interested' || rawStatus === 'replied_interested' || rawStatus === 'opening_identified') {
        derivedStatus = 'opening_identified'
      } else if (rawStatus === 'objection' || rawStatus === 'replied_objection') {
        derivedStatus = 'opening_identified'
      } else if (rawStatus === 'proposal' || rawStage === 'proposal' || rawStatus === 'proposal_requested') {
        derivedStatus = 'proposal_requested'
      } else if (rawStatus === 'contacted' || rawStage === 'contacted' || rawStatus === 'gate_opener_sent' || rawStatus === 'sent') {
        derivedStatus = 'gate_opener_sent'
      } else if (rawStatus === 'no_reply') {
        derivedStatus = 'no_reply'
      } else if (rawStatus === 'lost' || rawStatus === 'dormant' || rawStatus === 'not_now_snoozed') {
        derivedStatus = 'not_now_snoozed'
      } else {
        derivedStatus = 'gate_opener_staged'
      }

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
      let payload: any = {}
      try { payload = act.description ? JSON.parse(act.description) : {} } catch {}

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
      const channel: OutreachChannel = payload.channel || (
        act.activity_type === 'ig_dm' || actTitle.includes('instagram') ? 'instagram_dm' :
        act.activity_type === 'whatsapp_sent' || actTitle.includes('whatsapp') ? 'whatsapp' :
        act.activity_type === 'email_sent' || actTitle.includes('email') ? 'email' :
        (actTitle.includes('linkedin') && hasValidLi) ? 'linkedin' :
        (co.phone || existingLead?.phone) ? 'whatsapp' :
        'cold_call'
      )
      let status: OutreachStatus = payload.status || 'gate_opener_sent'
      if (status === 'sent') status = 'gate_opener_sent'
      if (status === 'reply_received') status = 'warm_up'
      if (status === 'replied_interested' || status === 'replied_objection') status = 'opening_identified'

      const coStatus = (co.status || '').toLowerCase().trim()
      const pStage = (co.pipeline_stage || '').toLowerCase().trim()

      // Synchronize with companies table stage if advanced
      if (pStage === 'meeting booked' || coStatus === 'meeting_booked' || coStatus === 'opportunity' || coStatus === 'won') {
        status = 'meeting_booked'
      } else if (pStage === 'call ready' || coStatus === 'in_call_queue') {
        if (status !== 'meeting_booked' && status !== 'called') status = 'ready_for_call'
      } else if (status === 'called' || coStatus === 'called') {
        status = 'called'
      } else if (status === 'follow_up_sent') {
        status = 'follow_up_sent'
      } else if (pStage === 'replied' || ['warm_up', 'reply_received', 'replied_interested', 'opening_identified'].includes(coStatus)) {
        if (status === 'gate_opener_sent' || status === 'gate_opener_staged') status = 'warm_up'
      } else if (coStatus === 'lost' || pStage === 'lost') {
        status = 'not_now_snoozed'
      }

      let rJson: any = {}
      try {
        if (co.research_json && typeof co.research_json === 'object') rJson = co.research_json
        else if (co.notes && (co.notes.startsWith('{') || co.notes.startsWith('['))) rJson = JSON.parse(co.notes)
      } catch {}
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
        touch_count: existingLead?.touch_count || 1,
        specific_observation: specificObs,
        prospect_reply: replySnippet,
        pain_point: payload.pain_point || '',
        call_opening_line: payload.call_opening_line || existingLead?.call_opening_line || stagedSeq?.cold_call_script?.opener || '',
        notes: payload.notes || act.notes || existingLead?.notes || '',
        staged_sequence: stagedSeq,
        sent_at: act.created_at,
        updated_at: payload.updated_at || act.created_at,
      })
    })

    let combined: OutreachLead[] = []

    if (dateFilter === 'all') {
      combined = Array.from(leadMap.values())
    } else {
      let targetDateStr: string | null = null
      let isWeek = false

      if (dateFilter === 'today') {
        targetDateStr = new Date().toISOString().split('T')[0]
      } else if (dateFilter === 'week') {
        isWeek = true
      } else if (dateFilter.match(/^\d{4}-\d{2}-\d{2}$/)) {
        targetDateStr = dateFilter
      }

      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      weekAgo.setHours(0, 0, 0, 0)

      const matchedCompanyIds = new Set<string>()

      // 1. Matches from logged activities on target date/week
      ;(activities || []).forEach((act: any) => {
        if (!act.created_at) return
        let payload: any = {}
        try { payload = act.description ? JSON.parse(act.description) : {} } catch {}

        const createdDate = act.created_at.split('T')[0]
        const explicitDate = payload.outreach_date ? payload.outreach_date.split('T')[0] : null
        const updatedDate = payload.updated_at ? payload.updated_at.split('T')[0] : null

        let isMatch = false
        if (targetDateStr) {
          isMatch = createdDate === targetDateStr || explicitDate === targetDateStr || updatedDate === targetDateStr
        } else if (isWeek) {
          isMatch = new Date(act.created_at).getTime() >= weekAgo.getTime()
        }

        if (isMatch) {
          const compId = act.company_id || act.id
          const co = (act.company_id ? companyById.get(act.company_id) : null) || act.companies || {}
          if (co.lead_type === 'Dormant' || co.status === 'dormant' || co.status === 'lost') return
          matchedCompanyIds.add(compId)
        }
      })

      // 2. Matches from companies created or contacted on target date/week
      activeOutreachCompanies.forEach((co: any) => {
        const coCreated = co.created_at ? co.created_at.split('T')[0] : null
        const coDateAdded = co.date_added ? co.date_added.split('T')[0] : null
        let isMatch = false
        if (targetDateStr) {
          isMatch = coCreated === targetDateStr || coDateAdded === targetDateStr
        } else if (isWeek) {
          isMatch = co.created_at ? new Date(co.created_at).getTime() >= weekAgo.getTime() : false
        }
        if (isMatch) {
          matchedCompanyIds.add(co.id)
        }
      })

      // 3. Assemble rich lead records from leadMap
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

    return { data: combined, error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

// ─── Get Dedicated Daily Batch per Channel (25 Contacts with 0 Contradictions) ───
export async function getChannelDailyBatch(
  channel: OutreachChannel,
  limit: number = 25
) {
  try {
    await requireAuth()

    // 1. Find all company IDs that ALREADY had an outreach activity logged on this channel
    const validActType = getValidActivityType(channel)
    const { data: touchedActs } = await supabase
      .from('activities')
      .select('company_id')
      .in('activity_type', [validActType, 'ig_dm', 'outreach', 'outreach_sent'])

    const touchedCompanyIds = new Set((touchedActs || []).map(a => a.company_id).filter(Boolean))

    // 2. Query companies eligible for this channel that HAVE NOT been touched yet
    let coQuery = supabase
      .from('companies')
      .select('*, contacts(*)')
      .not('status', 'in', '("won","lost","archived")')
      .order('created_at', { ascending: false })

    if (channel === 'instagram_dm') {
      coQuery = coQuery.or('notes.ilike.%instagram%,notes.ilike.%@%')
    } else if (channel === 'whatsapp' || channel === 'cold_call') {
      coQuery = coQuery.not('phone', 'is', null)
    } else if (channel === 'linkedin') {
      coQuery = coQuery.not('linkedin_url', 'is', null)
    } else if (channel === 'email') {
      coQuery = coQuery.not('email', 'is', null)
    }

    const { data: companies, error: coErr } = await coQuery.limit(limit * 3)
    if (coErr) return { data: [], totalAvailable: 0, error: coErr.message }

    // Filter strictly out touched companies and filter by channel suitability
    const uncontacted = (companies || []).filter(c => {
      if (touchedCompanyIds.has(c.id)) return false

      let rJson: any = {}
      try {
        if (c.research_json && typeof c.research_json === 'object' && Object.keys(c.research_json).length > 0) rJson = c.research_json
        else if (c.notes && (c.notes.startsWith('{') || c.notes.startsWith('['))) rJson = JSON.parse(c.notes)
      } catch {}

      if (channel === 'instagram_dm') {
        const rawIg = rJson.instagram_handle || (c.notes && c.notes.match(/["']?instagram_handle["']?\s*:\s*["'](@?[^"']+)["']/i)?.[1]) || (c.notes && c.notes.match(/Instagram:\s*(@?[^\s,]+)/i)?.[1])
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

    const mapped: OutreachLead[] = uncontacted.slice(0, limit).map(c => {
      const contact = c.contacts?.[0] || {}
      let rJson: any = {}
      try {
        if (c.research_json && typeof c.research_json === 'object' && Object.keys(c.research_json).length > 0) rJson = c.research_json
        else if (c.notes && (c.notes.startsWith('{') || c.notes.startsWith('['))) rJson = JSON.parse(c.notes)
      } catch {}

      const rawIg = rJson.instagram_handle || (c.notes && c.notes.match(/["']?instagram_handle["']?\s*:\s*["'](@?[^"']+)["']/i)?.[1]) || (c.notes && c.notes.match(/Instagram:\s*(@?[^\s,]+)/i)?.[1]) || null
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
    }

    // 1. Insert activity log
    const { data: act, error: actErr } = await supabase
      .from('activities')
      .insert({
        company_id: data.company_id,
        activity_type: getValidActivityType(data.channel),
        title: `${CHANNEL_CONFIG[data.channel]?.label || data.channel} — Gate-Opener Sent`,
        description: JSON.stringify(payload),
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

    const startDate = `${startDayStr}T00:00:00.000Z`
    const endDate = `${endDayStr}T23:59:59.999Z`

    const [actRes, coRes] = await Promise.all([
      supabase
        .from('activities')
        .select('created_at, company_id, description, activity_type')
        .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach', 'outreach_sent', 'status_changed'])
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .range(0, 4999),
      supabase
        .from('companies')
        .select('id, created_at, date_added, status, pipeline_stage, lead_type')
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

      let payload: any = {}
      try { payload = act.description ? JSON.parse(act.description) : {} } catch {}

      const day = payload.outreach_date ? payload.outreach_date.split('T')[0] : act.created_at.split('T')[0]
      if (day && day >= startDayStr && day <= endDayStr) {
        if (!dateToCompanySet[day]) dateToCompanySet[day] = new Set()
        dateToCompanySet[day].add(compId)
      }
    })

    ;(coRes.data || []).forEach((co: any) => {
      if (co.lead_type === 'Dormant' || co.status === 'dormant' || co.status === 'lost') return
      const s = (co.status || '').toLowerCase().trim()
      const p = (co.pipeline_stage || '').toLowerCase().trim()
      if (s === 'prospect' && (p === 'new' || p === 'raw' || p === 'prospect')) return

      const createdDay = co.created_at ? co.created_at.split('T')[0] : null
      const addedDay = co.date_added ? co.date_added.split('T')[0] : null
      const day = createdDay || addedDay
      if (day && day >= startDayStr && day <= endDayStr) {
        if (!dateToCompanySet[day]) dateToCompanySet[day] = new Set()
        dateToCompanySet[day].add(co.id)
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
    if (!data.rows || data.rows.length === 0) {
      return { count: 0, error: "No rows provided for import" }
    }

    // 1. Gather all unique company names to resolve or create
    const companyNames = Array.from(
      new Set(
        data.rows
          .map((r, i) => r.company_name?.trim() || `Prospect #${i + 1}`)
          .filter(Boolean)
      )
    )

    // 2. Fetch existing companies matching these names in Supabase
    const { data: existingCos } = await supabase
      .from('companies')
      .select('id, company_name')
      .in('company_name', companyNames)

    const companyMap = new Map<string, string>()
    if (existingCos) {
      existingCos.forEach(co => {
        companyMap.set(co.company_name.toLowerCase().trim(), co.id)
      })
    }

    // 3. Find names that don't exist yet and insert into `companies` table
    const missingNames = companyNames.filter(
      name => !companyMap.has(name.toLowerCase().trim())
    )

    if (missingNames.length > 0) {
      const newCompaniesPayload = missingNames.map(name => {
        const sampleRow = data.rows.find(
          (r, i) => (r.company_name?.trim() || `Prospect #${i + 1}`).toLowerCase().trim() === name.toLowerCase().trim()
        )
        return {
          company_name: name,
          industry: sampleRow?.industry?.trim() || 'General',
          phone: sampleRow?.phone?.trim() || null,
          website: sampleRow?.website?.trim() || null,
          email: sampleRow?.email?.trim() || null,
          linkedin_url: sampleRow?.linkedin_url?.trim() || null,
          status: 'contacted',
          pipeline_stage: 'Contacted',
          lead_status: 'Contacted',
          notes: sampleRow?.notes?.trim() || 'Imported via CSV',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })

      const { data: insertedCos, error: coErr } = await supabase
        .from('companies')
        .insert(newCompaniesPayload)
        .select('id, company_name')

      if (coErr) return { count: 0, error: coErr.message }

      if (insertedCos) {
        insertedCos.forEach(co => {
          companyMap.set(co.company_name.toLowerCase().trim(), co.id)
        })
      }
    }

    // Update existing companies to contacted status
    const allCompanyIds = Array.from(companyMap.values()).filter(Boolean)
    if (allCompanyIds.length > 0) {
      await supabase
        .from('companies')
        .update({
          status: 'contacted',
          pipeline_stage: 'Contacted',
          updated_at: new Date().toISOString(),
        })
        .in('id', allCompanyIds)
    }

    // 4. Create primary contacts in Supabase `contacts` table
    const contactsPayload: any[] = []
    data.rows.forEach((row, idx) => {
      const rawName = row.company_name?.trim() || `Prospect #${idx + 1}`
      const companyId = companyMap.get(rawName.toLowerCase().trim())
      if (companyId && (row.contact_name || row.contact_title || row.contact_whatsapp || row.phone || row.email || row.linkedin_url)) {
        contactsPayload.push({
          company_id: companyId,
          full_name: row.contact_name?.trim() || `${rawName} Representative`,
          title: row.contact_title?.trim() || 'Decision Maker',
          phone: row.phone?.trim() || null,
          whatsapp: row.contact_whatsapp?.trim() || row.phone?.trim() || null,
          email: row.email?.trim() || null,
          linkedin_url: row.linkedin_url?.trim() || null,
          is_primary: true,
          created_at: new Date().toISOString(),
        })
      }
    })

    if (contactsPayload.length > 0) {
      await supabase.from('contacts').insert(contactsPayload)
    }

    // 5. Create activity logs in Supabase `activities` table
    const activityRecords = data.rows.map((row, idx) => {
      const rawName = row.company_name?.trim() || `Prospect #${idx + 1}`
      const companyId = companyMap.get(rawName.toLowerCase().trim())
      const ch = (row.channel || data.defaultChannel) as OutreachChannel
      const st = (row.status || 'sent') as OutreachStatus
      const dt = row.outreach_date?.trim() || data.defaultDate
      const createdAt = dt ? new Date(dt + 'T12:00:00.000Z').toISOString() : new Date().toISOString()

      const payload = {
        channel: ch,
        handle: row.handle?.trim() || row.phone?.trim() || row.contact_whatsapp?.trim() || '',
        template_used: data.defaultTemplate || 'growth_offer',
        status: st,
        prospect_reply: row.prospect_reply?.trim() || '',
        pain_point: row.pain_point?.trim() || '',
        call_opening_line: row.call_opening_line?.trim() || '',
        notes: row.notes?.trim() || '',
      }

      return {
        company_id: companyId,
        activity_type: getValidActivityType(ch),
        title: (CHANNEL_CONFIG[ch]?.label || 'Outreach') + ' — CSV Import',
        description: JSON.stringify(payload),
        created_at: createdAt,
      }
    })

    const { error: actErr } = await supabase.from('activities').insert(activityRecords)
    if (actErr) return { count: 0, error: actErr.message }

    revalidateAllCRMPages()
    return { count: activityRecords.length, error: null }
  } catch (err) {
    return { count: 0, error: (err as Error).message }
  }
}


