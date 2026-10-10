'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/config'
import { requireAuth } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import { CADENCE_DELAYS, calculateNextDueDate, TTT_CATEGORY_PLAYBOOKS, normalizeCategory } from '@/lib/outreach-playbook'
import { formatWhatsAppNumber, extractInstagramUrl } from '@/lib/utils'

const supabase = getSupabaseAdminClient()

function revalidateAllCRMPages() {
  // Client components maintain instant state via optimistic UI and CustomEvents.
}

export interface CadenceFollowUpItem {
  id: string
  company_id: string
  contact_id: string | null
  company_name: string
  industry: string
  category: string
  contact_name: string
  contact_title: string
  phone: string | null
  whatsapp_number: string | null
  instagram_handle: string | null
  instagram_url: string | null
  linkedin_url: string | null
  direct_channel: 'instagram_dm' | 'linkedin' | 'whatsapp' | 'call' | 'email'
  direct_url: string | null
  due_date: string
  due_time: string | null
  subject: string
  description: string | null
  channel: string
  status: 'pending' | 'completed' | 'overdue'
  current_stage: number // 1: Greeting, 2: Value Check-in, 3: Audit Offer, 4: Coffee / Call, 5: Active
  stage_label: string
  next_step_label: string
  next_delay_days: number
  recommended_template: string
  is_overdue: boolean
  is_today: boolean
  days_overdue: number
  days_until_due: number
  assigned_bdm: string | null
  company_status: string
  created_at: string
}

export async function getFollowUps(filter: 'due_today' | 'overdue' | 'all' | 'pending') {
  try {
    await requireAuth()

    let query = supabase
      .from('follow_ups')
      .select(`
        *,
        companies (company_name),
        contacts (full_name)
      `)
      .order('due_date', { ascending: true })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    switch (filter) {
      case 'due_today':
        query = query
          .eq('due_date', todayStr)
          .eq('status', 'pending')
        break
      case 'overdue':
        query = query
          .lt('due_date', todayStr)
          .eq('status', 'pending')
        break
      case 'pending':
        query = query.eq('status', 'pending')
        break
      case 'all':
      default:
        break
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

/**
 * Returns all active cadence follow-ups enriched with company, contact, direct channel URLs,
 * and pre-filled stage message templates with strict 2d -> 3d -> 5d delays.
 */
export async function getCadenceFollowUps(): Promise<{ data: CadenceFollowUpItem[] | null; error: string | null }> {
  try {
    await requireAuth()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    // 1. Fetch all pending follow-ups
    const { data: followUpsData, error: fuErr } = await supabase
      .from('follow_ups')
      .select(`
        *,
        companies (
          id, company_name, industry, phone, email, website, linkedin_url, status, pipeline_stage, notes, research_json, assigned_bdm
        ),
        contacts (
          id, full_name, title, phone, whatsapp, email, linkedin_url
        )
      `)
      .eq('status', 'pending')
      .order('due_date', { ascending: true })

    if (fuErr) return { data: null, error: fuErr.message }

    const items: CadenceFollowUpItem[] = []

    for (const fu of (followUpsData || [])) {
      const comp = fu.companies as any || {}
      const cont = fu.contacts as any || {}

      if (!comp.id) continue

      // Determine channel & URLs
      const igUrl = extractInstagramUrl(comp) || extractInstagramUrl(cont)
      const igHandle = igUrl ? '@' + igUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/$/, '') : null
      const liUrl = cont.linkedin_url || comp.linkedin_url || null
      const rawWa = cont.whatsapp || cont.phone || comp.phone || null
      const waNumber = rawWa ? formatWhatsAppNumber(rawWa) : null

      let directChannel: 'instagram_dm' | 'linkedin' | 'whatsapp' | 'call' | 'email' = 'whatsapp'
      let directUrl: string | null = null

      const descLower = (fu.description || '').toLowerCase()
      const subLower = (fu.subject || '').toLowerCase()
      const isInstagramTouch = fu.channel === 'instagram_dm' || descLower.includes('instagram') || subLower.includes('instagram') || (igUrl && !liUrl && !waNumber)

      if (isInstagramTouch) {
        directChannel = 'instagram_dm'
        directUrl = igUrl || (igHandle ? `https://instagram.com/${igHandle.replace('@', '')}` : null)
      } else if (fu.channel === 'linkedin' || (liUrl && !waNumber)) {
        directChannel = 'linkedin'
        directUrl = liUrl
      } else if (waNumber) {
        directChannel = 'whatsapp'
        directUrl = `https://wa.me/${waNumber.replace('+', '')}`
      } else if (comp.phone) {
        directChannel = 'call'
        directUrl = `tel:${comp.phone}`
      } else if (comp.email || cont.email) {
        directChannel = 'email'
        directUrl = `mailto:${cont.email || comp.email}`
      }

      // Determine cadence stage from subject or company status
      const sub = (fu.subject || '').toLowerCase()
      const coStatus = (comp.status || '').toLowerCase()

      let currentStage = 1
      let stageLabel = 'Stage 1: Greeting'
      let nextStepLabel = 'Follow-up 1 (Value Check-in)'
      let nextDelayDays: number = CADENCE_DELAYS.GREETING_TO_FOLLOWUP_1 // 2 days

      if (sub.includes('follow-up 2') || sub.includes('audit offer') || coStatus === 'follow_up_sent' || coStatus.includes('stage 2')) {
        currentStage = 2
        stageLabel = 'Stage 2: Value Check-in'
        nextStepLabel = 'Follow-up 2 (Audit Offer)'
        nextDelayDays = CADENCE_DELAYS.FOLLOWUP_1_TO_AUDIT_OFFER // 3 days
      } else if (sub.includes('follow-up 3') || sub.includes('coffee') || sub.includes('call proposal') || coStatus === 'audit_offered' || coStatus.includes('stage 3')) {
        currentStage = 3
        stageLabel = 'Stage 3: Audit Offer'
        nextStepLabel = 'Follow-up 3 (Coffee / Call Proposal)'
        nextDelayDays = CADENCE_DELAYS.AUDIT_OFFER_TO_COFFEE_CALL // 5 days
      } else if (sub.includes('decision') || sub.includes('meeting') || coStatus === 'coffee_invited' || coStatus.includes('stage 4')) {
        currentStage = 4
        stageLabel = 'Stage 4: Coffee / Call Proposed'
        nextStepLabel = 'Meeting Confirmation / Decision'
        nextDelayDays = 5
      }

      // Pre-fill stage message template
      const sector = await normalizeCategory(comp.industry)
      const playbook = TTT_CATEGORY_PLAYBOOKS[sector] || TTT_CATEGORY_PLAYBOOKS.general
      const contactFirstName = (cont.full_name || 'there').split(' ')[0]

      let template = ''
      if (currentStage === 1) {
        template = playbook.touch_2_template
      } else if (currentStage === 2) {
        template = playbook.audit_offer_template
      } else if (currentStage === 3) {
        template = playbook.touch_3_template
      } else {
        template = `Ahlan ${contactFirstName}, following up on our recent note regarding [Company]. Would love to see if we can connect for a 10-minute coffee in Muscat or a direct call this week.`
      }

      const filledTemplate = template
        .replace(/\[Name\]/g, contactFirstName)
        .replace(/\[Company\]/g, comp.company_name || 'your business')
        .replace(/\[specific observation\]/g, 'your recent work and growth in Muscat')
        .replace(/\[Area\]/g, comp.city || 'Muscat')

      // Date calculations
      const fuDueDate = fu.due_date ? String(fu.due_date).split('T')[0] : todayStr
      const isOverdue = fuDueDate < todayStr
      const isToday = fuDueDate === todayStr

      const diffMs = new Date(fuDueDate).getTime() - today.getTime()
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

      items.push({
        id: fu.id,
        company_id: comp.id,
        contact_id: cont.id || null,
        company_name: comp.company_name,
        industry: comp.industry || 'General',
        category: sector,
        contact_name: cont.full_name || 'Business Contact',
        contact_title: cont.title || 'Decision Maker',
        phone: comp.phone || null,
        whatsapp_number: waNumber,
        instagram_handle: igHandle,
        instagram_url: igUrl || null,
        linkedin_url: liUrl,
        direct_channel: directChannel,
        direct_url: directUrl,
        due_date: fuDueDate,
        due_time: fu.due_time || null,
        subject: fu.subject,
        description: fu.description,
        channel: fu.channel || directChannel,
        status: isOverdue ? 'overdue' : 'pending',
        current_stage: currentStage,
        stage_label: stageLabel,
        next_step_label: nextStepLabel,
        next_delay_days: nextDelayDays,
        recommended_template: filledTemplate,
        is_overdue: isOverdue,
        is_today: isToday,
        days_overdue: isOverdue ? Math.abs(diffDays) : 0,
        days_until_due: !isOverdue ? Math.max(0, diffDays) : 0,
        assigned_bdm: comp.assigned_bdm || null,
        company_status: comp.status || 'contacted',
        created_at: fu.created_at
      })
    }

    return { data: items, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

/**
 * Advances a lead through the strict non-linear cadence:
 * - Stage 1 (Greeting Sent) -> Auto-schedules Stage 2 in +2 days
 * - Stage 2 (Value Check-in) -> Auto-schedules Stage 3 in +3 days
 * - Stage 3 (Audit Offer) -> Auto-schedules Stage 4 in +5 days
 * - Stage 4 (Coffee / Call) -> Direct meeting booking or closure
 */
export async function advanceCadenceStage(data: {
  companyId: string
  currentStage: number
  channel: string
  contactId?: string | null
  followUpId?: string | null
  customNotes?: string
}) {
  try {
    await requireAuth()
    const now = new Date()
    const nowIso = now.toISOString()

    const { companyId, currentStage, channel, contactId, followUpId, customNotes } = data

    // 1. Mark current follow_up as completed if provided
    if (followUpId) {
      await supabase
        .from('follow_ups')
        .update({
          status: 'completed',
          completed_at: nowIso,
          notes: customNotes || `Stage ${currentStage} touch executed`
        })
        .eq('id', followUpId)
    } else {
      // Mark all pending follow_ups for this company as completed
      await supabase
        .from('follow_ups')
        .update({
          status: 'completed',
          completed_at: nowIso,
          notes: customNotes || `Advanced to next cadence stage`
        })
        .eq('company_id', companyId)
        .eq('status', 'pending')
    }

    let nextStage = currentStage + 1
    let delayDays = 2
    let nextSubject = ''
    let nextDescription = ''
    let pipelineStage = 'Contacted'
    let activityTitle = ''

    if (currentStage === 1) {
      // Stage 1 Greeting sent -> Next is Follow-up 1 (Value Check-in) after +2 days
      delayDays = CADENCE_DELAYS.GREETING_TO_FOLLOWUP_1 // 2 days
      pipelineStage = 'Follow-up Sent'
      activityTitle = `Greeting Sent via ${channel}`
      nextSubject = 'Follow-up 1: Value Check-in'
      nextDescription = `Stage 2 follow-up. Value observation check-in after 2 days without reply. [${channel}]`
    } else if (currentStage === 2) {
      // Stage 2 Value Check-in sent -> Next is Follow-up 2 (Audit Offer) after +3 days
      delayDays = CADENCE_DELAYS.FOLLOWUP_1_TO_AUDIT_OFFER // 3 days
      pipelineStage = 'Audit Offered'
      activityTitle = `Follow-up 1 (Value Check-in) Sent via ${channel}`
      nextSubject = 'Follow-up 2: Audit Offer'
      nextDescription = `Stage 3 follow-up. Offer outside-in business audit ("we looked into their business and prepared an audit and if they would be open to it"). [${channel}]`
    } else if (currentStage === 3) {
      // Stage 3 Audit Offer sent -> Next is Follow-up 3 (Coffee / Call) after +5 days
      delayDays = CADENCE_DELAYS.AUDIT_OFFER_TO_COFFEE_CALL // 5 days
      pipelineStage = 'Coffee Invited'
      activityTitle = `Follow-up 2 (Audit Offer) Sent via ${channel}`
      nextSubject = 'Follow-up 3: Coffee Meet / Call Proposal'
      nextDescription = `Stage 4 follow-up. Propose 10-minute coffee in Muscat or direct call based on the audit. [${channel}]`
    } else {
      // Stage 4 Coffee / Call sent -> Next is Decision Check-in after +5 days
      delayDays = 5
      pipelineStage = 'Decision Pending'
      activityTitle = `Coffee Meet / Direct Call Proposed via ${channel}`
      nextSubject = 'Follow-up 4: Meeting Confirmation & Decision'
      nextDescription = `Stage 4 check-in. Awaiting date/time confirmation for Muscat coffee or call. [${channel}]`
    }

    const nextDueDate = calculateNextDueDate(delayDays, now)

    // DB constraints: follow_ups.channel only accepts 'whatsapp' | 'call' | 'email' | 'linkedin'
    const dbChannel = (channel === 'instagram_dm' || channel === 'instagram')
      ? 'whatsapp'
      : (['whatsapp', 'call', 'email', 'linkedin'].includes(channel) ? channel : 'whatsapp')

    // 2. Schedule the next follow-up in follow_ups table
    const { data: newFu, error: fuErr } = await supabase
      .from('follow_ups')
      .insert({
        company_id: companyId,
        contact_id: contactId || null,
        due_date: nextDueDate,
        subject: nextSubject,
        description: nextDescription,
        channel: dbChannel,
        status: 'pending',
        created_at: nowIso
      })
      .select()
      .single()

    if (fuErr) {
      console.error('Failed to create next follow-up:', fuErr.message)
    }

    // 3. Log outreach activity
    const fuActivityPayload = {
      stage_completed: currentStage,
      next_stage: nextStage,
      channel,
      next_due_date: nextDueDate,
      delay_days: delayDays,
      notes: customNotes || ''
    }

    await supabase.from('activities').insert({
      company_id: companyId,
      contact_id: contactId || null,
      activity_type: 'outreach_sent',
      title: activityTitle,
      description: customNotes || `${activityTitle} completed`,
      metadata: fuActivityPayload,
      created_at: nowIso
    })

    // 4. Update company record (companies.status allows: 'contacted' | 'lost' | 'opportunity' | 'in_call_queue' | 'meeting_booked' | 'prospect')
    await supabase
      .from('companies')
      .update({
        status: 'contacted',
        pipeline_stage: pipelineStage,
        updated_at: nowIso
      })
      .eq('id', companyId)

    revalidateAllCRMPages()
    return { data: { nextStage, nextDueDate, followUp: newFu }, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

/**
 * Handles dynamic branch when a prospect replies:
 * - audit_requested: Sets status to audit_requested, schedules audit delivery in 2 days
 * - booking_link_sent: Sets status to booking_link_sent, schedules booking check-in in 3 days
 * - meeting_booked: Confirms meeting date, syncs to meetings table!
 * - reply_received: General conversation, stops cold sequence and prompts rep
 * - not_interested: Marks dormant
 */
export async function recordProspectReply(data: {
  companyId: string
  contactId?: string | null
  followUpId?: string | null
  replyType: 'audit_requested' | 'booking_link_sent' | 'meeting_booked' | 'reply_received' | 'objection' | 'dormant'
  replyText?: string
  meetingDate?: string
}) {
  try {
    await requireAuth()
    const nowIso = new Date().toISOString()
    const { companyId, contactId, followUpId, replyType, replyText, meetingDate } = data

    // 1. Complete existing pending follow-ups
    if (followUpId) {
      await supabase.from('follow_ups').update({
        status: 'completed',
        completed_at: nowIso,
        notes: `Reply received: ${replyType}`
      }).eq('id', followUpId)
    }
    await supabase.from('follow_ups').update({
      status: 'completed',
      completed_at: nowIso,
      notes: `Cadence paused: Prospect responded`
    }).eq('company_id', companyId).eq('status', 'pending')

    let dbStatus: 'contacted' | 'meeting_booked' | 'lost' = 'contacted'
    let pipelineStage = 'Replied'
    let nextSubject = 'Reply Received: Respond to Prospect'
    let nextDelay = 1

    if (replyType === 'audit_requested') {
      dbStatus = 'contacted'
      pipelineStage = 'Audit Requested'
      nextSubject = 'Prepare & Deliver Outside-In Audit'
      nextDelay = 2
    } else if (replyType === 'booking_link_sent') {
      dbStatus = 'contacted'
      pipelineStage = 'Booking Link Sent'
      nextSubject = 'Verify Meeting Booking Confirmation'
      nextDelay = 3
    } else if (replyType === 'meeting_booked') {
      dbStatus = 'meeting_booked'
      pipelineStage = 'Meeting Booked'
      nextSubject = 'Meeting Scheduled — Prepare Discovery Notes'
      nextDelay = 1

      // Insert meeting if date provided
      if (meetingDate) {
        await supabase.from('meetings').insert({
          company_id: companyId,
          contact_id: contactId || null,
          title: 'Discovery Meeting / Coffee',
          meeting_date: new Date(meetingDate).toISOString(),
          status: 'scheduled',
          notes: replyText || 'Booked via CRM Cadence',
          created_at: nowIso
        })
      }
    } else if (replyType === 'objection') {
      dbStatus = 'contacted'
      pipelineStage = 'Objection Raised'
      nextSubject = 'Handle Objection via Playbook'
      nextDelay = 2
    } else if (replyType === 'dormant') {
      dbStatus = 'lost'
      pipelineStage = 'Lost'
      nextDelay = 0
    }

    // 2. Schedule follow-up if not dormant
    if (nextDelay > 0) {
      const dueDate = calculateNextDueDate(nextDelay)
      await supabase.from('follow_ups').insert({
        company_id: companyId,
        contact_id: contactId || null,
        due_date: dueDate,
        subject: nextSubject,
        description: replyText || `Prospect status updated to ${pipelineStage}`,
        channel: 'whatsapp',
        status: 'pending',
        created_at: nowIso
      })
    }

    // 3. Log activity
    await supabase.from('activities').insert({
      company_id: companyId,
      contact_id: contactId || null,
      activity_type: replyType === 'meeting_booked' ? 'meeting_booked' : 'status_changed',
      title: `Prospect Response — ${pipelineStage}`,
      description: replyText || `Prospect updated to ${pipelineStage}`,
      metadata: { replyType, replyText, meetingDate },
      created_at: nowIso
    })

    // 4. Update company
    await supabase.from('companies').update({
      status: dbStatus,
      pipeline_stage: pipelineStage,
      updated_at: nowIso
    }).eq('id', companyId)

    revalidateAllCRMPages()
    return { data: { status: dbStatus, pipelineStage }, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function createFollowUp(data: {
  company_id: string
  contact_id?: string
  due_date: string
  due_time?: string
  subject: string
  description?: string
  channel?: string
}) {
  try {
    await requireAuth()

    const rawChannel = data.channel || 'call'
    const dbChannel = (rawChannel === 'instagram_dm' || rawChannel === 'instagram')
      ? 'whatsapp'
      : (['whatsapp', 'call', 'email', 'linkedin', 'meeting'].includes(rawChannel) ? rawChannel : 'call')
    const channelTag = (rawChannel === 'instagram_dm' || rawChannel === 'instagram') ? ' [Channel: Instagram DM]' : ''
    const description = (data.description || '') + channelTag

    // Auto-complete older pending follow-ups for this company to prevent duplicates
    await supabase
      .from('follow_ups')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: 'Superceded by newly scheduled follow-up'
      })
      .eq('company_id', data.company_id)
      .eq('status', 'pending')

    const { data: followUp, error } = await supabase
      .from('follow_ups')
      .insert({
        company_id: data.company_id,
        contact_id: data.contact_id,
        due_date: data.due_date,
        due_time: data.due_time,
        subject: data.subject,
        description: description || null,
        channel: dbChannel,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }

    await supabase.from('activities').insert({
      company_id: data.company_id,
      activity_type: 'follow_up_scheduled',
      title: 'Follow-up scheduled',
      description: `Follow-up scheduled for ${data.due_date}: ${data.subject}`,
      contact_id: data.contact_id,
      metadata: {
        follow_up_id: followUp.id,
        due_date: data.due_date,
        channel: data.channel
      },
      created_at: new Date().toISOString()
    })

    await supabase.from('companies').update({
      updated_at: new Date().toISOString()
    }).eq('id', data.company_id)

    revalidateAllCRMPages()
    return { data: followUp, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function completeFollowUp(id: string, notes?: string) {
  try {
    await requireAuth()

    const { data: followUp, error: fetchError } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) return { data: null, error: fetchError.message }

    const { data: completed, error: updateError } = await supabase
      .from('follow_ups')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: notes || followUp.notes
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) return { data: null, error: updateError.message }

    await supabase.from('activities').insert({
      company_id: followUp.company_id,
      activity_type: 'follow_up_completed',
      title: 'Follow-up completed',
      description: notes || 'Follow-up marked as completed',
      contact_id: followUp.contact_id,
      metadata: { follow_up_id: id },
      created_at: new Date().toISOString()
    })

    if (followUp.company_id) {
      await supabase.from('companies').update({
        updated_at: new Date().toISOString()
      }).eq('id', followUp.company_id)
    }

    revalidateAllCRMPages()
    return { data: completed, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function rescheduleFollowUp(id: string, newDate: string, newTime?: string) {
  try {
    await requireAuth()

    const updateData: Record<string, any> = { due_date: newDate }
    if (newTime) updateData.due_time = newTime

    const { data: updated, error: updateError } = await supabase
      .from('follow_ups')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) return { data: null, error: updateError.message }
    revalidateAllCRMPages()
    return { data: updated, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}
