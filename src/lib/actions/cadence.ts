'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// ─── Daily Cadence Sessions ──────────────────────────────────────────

export async function getOrCreateSession(userId: string, dateStr: string) {
  try {
    // Check if session exists
    let { data: session, error } = await supabase
      .from('daily_outreach_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_date', dateStr)
      .maybeSingle()

    if (error) return { data: null, error: error.message }

    if (!session) {
      // Create new session
      const { data: newSession, error: createError } = await supabase
        .from('daily_outreach_sessions')
        .insert({
          user_id: userId,
          session_date: dateStr,
          target_count: 10
        })
        .select()
        .single()

      if (createError) return { data: null, error: createError.message }
      session = newSession
    }

    return { data: session, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Session load failed' }
  }
}

export async function getSessionItems(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('daily_outreach_items')
      .select(`
        *,
        companies (
          *,
          contacts (*)
        ),
        outreach_preparations (*)
      `)
      .eq('session_id', sessionId)
      .order('position', { ascending: true })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to fetch items' }
  }
}

export async function addCompaniesToSession(sessionId: string, companyIds: string[]) {
  try {
    // Get current max position
    const { data: currentItems } = await supabase
      .from('daily_outreach_items')
      .select('position')
      .eq('session_id', sessionId)
      .order('position', { ascending: false })
      .limit(1)

    let maxPosition = currentItems && currentItems.length > 0 ? currentItems[0].position : 0

    const itemsToInsert = companyIds.map((cid, index) => ({
      session_id: sessionId,
      company_id: cid,
      position: maxPosition + index + 1,
      status: 'pending'
    }))

    const { data, error } = await supabase
      .from('daily_outreach_items')
      .insert(itemsToInsert)
      .select()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Add failed' }
  }
}

export async function removeCompanyFromSession(sessionId: string, companyId: string) {
  try {
    const { error } = await supabase
      .from('daily_outreach_items')
      .delete()
      .eq('session_id', sessionId)
      .eq('company_id', companyId)

    if (error) return { error: error.message }
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Remove failed' }
  }
}

// ─── Dynamic Next Action Generator ───────────────────────────────────

export async function computeAndUpdateNextAction(companyId: string) {
  try {
    // Fetch latest activities, call queue status, follow-up status, and preparations
    const { data: company } = await supabase.from('companies').select('*').eq('id', companyId).single()
    const { data: contacts } = await supabase.from('contacts').select('*').eq('company_id', companyId)
    const { data: followUps } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
    const { data: callQueue } = await supabase
      .from('call_queue')
      .select('*')
      .eq('company_id', companyId)
      .in('status', ['pending', 'in_progress'])
      .order('queued_at', { ascending: false })
    const { data: preparations } = await supabase
      .from('outreach_preparations')
      .select('*')
      .eq('company_id', companyId)
      .order('updated_at', { ascending: false })

    let nextAction = 'SEND INITIAL OUTREACH'
    let dueDate = new Date().toISOString().split('T')[0]

    // Determine state
    const activeCall = callQueue && callQueue.length > 0 ? callQueue[0] : null
    const activeFollowUp = followUps && followUps.length > 0 ? followUps[0] : null
    const proposalPrep = preparations?.find(p => p.use_case_summary === 'PROPOSAL')

    if (company.status === 'won') {
      nextAction = 'WON / CUSTOMER SUCCESS'
      dueDate = ''
    } else if (company.status === 'lost') {
      nextAction = 'CLOSED LOST / ARCHIVED'
      dueDate = ''
    } else if (activeCall) {
      nextAction = `CALL PROSPECT (BDM)`
      dueDate = activeCall.queued_at.split('T')[0]
    } else if (activeFollowUp) {
      const channelLabel = activeFollowUp.channel ? activeFollowUp.channel.toUpperCase() : 'CALL'
      nextAction = `FOLLOW UP ON ${channelLabel}`
      dueDate = activeFollowUp.due_date
    } else if (proposalPrep && proposalPrep.status === 'draft') {
      nextAction = 'PREPARE PROPOSAL'
      dueDate = new Date().toISOString().split('T')[0]
    } else if (proposalPrep && proposalPrep.status === 'ready') {
      nextAction = 'SEND PROPOSAL'
      dueDate = new Date().toISOString().split('T')[0]
    } else if (proposalPrep && proposalPrep.status === 'sent') {
      nextAction = 'FOLLOW UP ON PROPOSAL'
      // 5 days after proposal sent
      const sentDate = new Date(proposalPrep.sent_at || proposalPrep.updated_at)
      sentDate.setDate(sentDate.getDate() + 5)
      dueDate = sentDate.toISOString().split('T')[0]
    } else if (company.status === 'meeting_booked') {
      nextAction = 'BOOK / HOST MEETING'
      dueDate = new Date().toISOString().split('T')[0]
    } else {
      nextAction = 'RESEARCH PROSPECT'
      dueDate = new Date().toISOString().split('T')[0]
    }

    // Update company details
    await supabase
      .from('companies')
      .update({
        notes: company.notes || '', // preserve notes
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId)

    // Log calculated action inside company notes metadata, or return it for UI use.
    return { data: { nextAction, dueDate }, error: null }
  } catch (error) {
    console.error('Failed to compute next action:', error)
    return { data: { nextAction: 'RESEARCH PROSPECT', dueDate: '' }, error: null }
  }
}

// ─── Proposals ───────────────────────────────────────────────────────

export async function saveProposal(companyId: string, contactId: string, content: string, status: 'draft' | 'ready' | 'sent') {
  try {
    // Query existing proposal prep (identified by use_case_summary = 'PROPOSAL')
    const { data: existing, error: getErr } = await supabase
      .from('outreach_preparations')
      .select('*')
      .eq('company_id', companyId)
      .eq('use_case_summary', 'PROPOSAL')
      .maybeSingle()

    let result
    if (existing) {
      // Update
      const updateData: Record<string, any> = {
        message_body: content,
        status: status,
        updated_at: new Date().toISOString()
      }
      if (status === 'sent' && existing.status !== 'sent') {
        updateData.sent_at = new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('outreach_preparations')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single()
      result = { data, error }
    } else {
      // Create new
      const insertData: Record<string, any> = {
        company_id: companyId,
        contact_id: contactId || null,
        use_case_summary: 'PROPOSAL',
        outreach_channel: 'email',
        message_body: content,
        status: status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      if (status === 'sent') {
        insertData.sent_at = new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('outreach_preparations')
        .insert(insertData)
        .select()
        .single()
      result = { data, error }
    }

    if (result.error) return { data: null, error: result.error.message }

    // If marked sent, log CRM activity and update pipeline stage
    if (status === 'sent') {
      await supabase.from('activities').insert({
        company_id: companyId,
        contact_id: contactId || null,
        activity_type: 'email_sent',
        title: 'Branded Proposal Sent',
        description: 'Highly personalized proposal generated and sent to prospect.',
        created_at: new Date().toISOString()
      })

      // Update company status to 'opportunity'
      await supabase
        .from('companies')
        .update({ status: 'opportunity', updated_at: new Date().toISOString() })
        .eq('id', companyId)
    }

    await computeAndUpdateNextAction(companyId)

    return { data: result.data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Proposal save failed' }
  }
}

// ─── Outreach Execution ("Mark Sent") ─────────────────────────────────

export async function markOutreachSent(data: {
  sessionId?: string
  companyId: string
  contactId?: string
  channel: 'whatsapp' | 'linkedin' | 'email'
  messageBody?: string
}) {
  try {
    const now = new Date().toISOString()
    const todayStr = now.split('T')[0]

    // 1. Create outreach activity in CRM activities
    const activityType = `${data.channel}_sent`
    const { error: actErr } = await supabase.from('activities').insert({
      company_id: data.companyId,
      contact_id: data.contactId || null,
      activity_type: activityType,
      title: `${data.channel.charAt(0).toUpperCase() + data.channel.slice(1)} outreach sent`,
      description: data.messageBody || 'Outreach campaign execution completed.',
      created_at: now
    })
    if (actErr) return { error: actErr.message }

    // 2. Record date, time, and channel in outreach_touches
    // Fetch how many touches already sent for this lead
    const { count } = await supabase
      .from('outreach_touches')
      .select('*', { count: 'exact', head: true })
      .eq('lead_id', data.companyId)
      .eq('channel', data.channel)

    const nextStep = (count || 0) + 1

    await supabase.from('outreach_touches').insert({
      lead_id: data.companyId,
      channel: data.channel,
      step_number: nextStep,
      message: data.messageBody || '',
      status: 'sent',
      sent_at: now
    })

    // 3. Update company's outreach status / status
    await supabase
      .from('companies')
      .update({
        status: 'contacted',
        updated_at: now
      })
      .eq('id', data.companyId)

    // 4. Update Daily Cadence session item status to 'sent'
    if (data.sessionId) {
      await supabase
        .from('daily_outreach_items')
        .update({ status: 'sent' })
        .eq('session_id', data.sessionId)
        .eq('company_id', data.companyId)
    }

    // 5. Calculate default next follow-up interval
    let intervalDays = 3 // default WhatsApp
    if (data.channel === 'linkedin') intervalDays = 4
    if (data.channel === 'email') intervalDays = 5

    const due = new Date()
    due.setDate(due.getDate() + intervalDays)
    const dueDateStr = due.toISOString().split('T')[0]

    // 6. Automatically schedule follow-up task
    await supabase.from('follow_ups').insert({
      company_id: data.companyId,
      contact_id: data.contactId || null,
      due_date: dueDateStr,
      subject: `Automatic Follow-up: Touch ${nextStep + 1} (${data.channel})`,
      description: `Auto-generated follow-up cadence step after Touch ${nextStep} sent.`,
      channel: data.channel,
      status: 'pending',
      created_at: now
    })

    // 7. Schedule a BDM call 24 hours later if no response marked
    if (nextStep === 1) {
      const callTime = new Date()
      callTime.setHours(callTime.getHours() + 24)
      await supabase.from('call_queue').insert({
        company_id: data.companyId,
        contact_id: data.contactId || null,
        priority: 0,
        status: 'pending',
        queued_at: callTime.toISOString()
      })
    }

    await computeAndUpdateNextAction(data.companyId)

    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to log outreach sent' }
  }
}

// ─── Response Logs & Cadence Adjustments ─────────────────────────────

export async function logResponse(data: {
  companyId: string
  contactId?: string
  responseType: 'positive_call' | 'call_tomorrow' | 'contact_next_month' | 'not_interested' | 'meeting_booked' | 'proposal_requested' | 'none'
  notes?: string
}) {
  try {
    const now = new Date().toISOString()

    // 1. Log activity timeline
    await supabase.from('activities').insert({
      company_id: data.companyId,
      contact_id: data.contactId || null,
      activity_type: 'note',
      title: `Response Logged: ${data.responseType.replace(/_/g, ' ')}`,
      description: data.notes || 'User registered a response change.',
      created_at: now
    })

    // 2. Adjust cadences and queues
    // Cancel automatically scheduled BDM call queue tasks if any response is marked
    if (data.responseType && data.responseType !== 'none') {
      await supabase
        .from('call_queue')
        .update({ status: 'cancelled' })
        .eq('company_id', data.companyId)
        .in('status', ['pending', 'in_progress'])
    }

    // Cancel other pending outreach follow-ups for this lead if they get a positive or terminal response
    if (['positive_call', 'call_tomorrow', 'not_interested', 'meeting_booked', 'proposal_requested'].includes(data.responseType)) {
      await supabase
        .from('follow_ups')
        .update({ status: 'cancelled', notes: 'Cancelled due to response category change.' })
        .eq('company_id', data.companyId)
        .eq('status', 'pending')
    }

    if (data.responseType === 'positive_call') {
      // Create Call Queue task immediately
      await supabase.from('call_queue').insert({
        company_id: data.companyId,
        contact_id: data.contactId || null,
        priority: 1, // high priority
        status: 'pending',
        queued_at: now
      })

      // Move company status
      await supabase
        .from('companies')
        .update({ status: 'in_call_queue', updated_at: now })
        .eq('id', data.companyId)

    } else if (data.responseType === 'call_tomorrow') {
      // Create Call Queue task for tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      await supabase.from('call_queue').insert({
        company_id: data.companyId,
        contact_id: data.contactId || null,
        priority: 0,
        status: 'pending',
        queued_at: tomorrow.toISOString() // scheduled for tomorrow
      })

      await supabase
        .from('companies')
        .update({ status: 'in_call_queue', updated_at: now })
        .eq('id', data.companyId)

    } else if (data.responseType === 'contact_next_month') {
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const dueStr = nextMonth.toISOString().split('T')[0]

      // Schedule a long-term follow-up
      await supabase.from('follow_ups').insert({
        company_id: data.companyId,
        contact_id: data.contactId || null,
        due_date: dueStr,
        subject: 'Long-term Cadence Re-engagement',
        description: data.notes || 'Lead asked to be contacted next month.',
        channel: 'email',
        status: 'pending',
        created_at: now
      })

    } else if (data.responseType === 'not_interested') {
      await supabase
        .from('companies')
        .update({ status: 'lost', updated_at: now })
        .eq('id', data.companyId)

    } else if (data.responseType === 'meeting_booked') {
      await supabase
        .from('companies')
        .update({ status: 'meeting_booked', updated_at: now })
        .eq('id', data.companyId)

    } else if (data.responseType === 'proposal_requested') {
      // Insert a draft preparation representation for proposals
      await supabase.from('outreach_preparations').insert({
        company_id: data.companyId,
        contact_id: data.contactId || null,
        use_case_summary: 'PROPOSAL',
        outreach_channel: 'email',
        message_body: '',
        status: 'draft',
        created_at: now,
        updated_at: now
      })

      await supabase
        .from('companies')
        .update({ status: 'opportunity', updated_at: now })
        .eq('id', data.companyId)
    }

    await computeAndUpdateNextAction(data.companyId)

    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to adjust response cadence' }
  }
}

// ─── BDM Call Queue Outcomes ──────────────────────────────────────────

export async function completeCallTask(data: {
  callQueueId: string
  companyId: string
  contactId?: string
  outcome: 'no_answer' | 'callback_requested' | 'connected' | 'interested' | 'not_interested' | 'meeting_requested' | 'meeting_booked' | 'proposal_required' | 'proposal_follow_up' | 'nurture'
  notes?: string
  durationSeconds: number
  followUpDate?: string
}) {
  try {
    const now = new Date().toISOString()

    // 1. Record Call outcome in calls table
    const { data: callRecord, error: callErr } = await supabase
      .from('calls')
      .insert({
        call_queue_id: data.callQueueId,
        company_id: data.companyId,
        contact_id: data.contactId || null,
        caller_id: (await supabase.auth.getUser()).data.user?.id || null,
        duration_seconds: data.durationSeconds,
        outcome: data.outcome === 'interested' ? 'connected' : data.outcome,
        notes: data.notes || '',
        follow_up_needed: !!data.followUpDate,
        follow_up_date: data.followUpDate || null,
        created_at: now
      })
      .select()
      .single()

    if (callErr) return { error: callErr.message }

    // 2. Mark call queue item completed
    await supabase
      .from('call_queue')
      .update({
        status: 'completed',
        completed_at: now
      })
      .eq('id', data.callQueueId)

    // 3. Log completed call in CRM timeline activities
    await supabase.from('activities').insert({
      company_id: data.companyId,
      contact_id: data.contactId || null,
      activity_type: 'call_completed',
      title: `Call outcome: ${data.outcome.toUpperCase().replace(/_/g, ' ')}`,
      description: data.notes || `BDM completed call task. Duration: ${data.durationSeconds}s`,
      created_at: now
    })

    // 4. Cadence outcomes branching
    if (data.outcome === 'no_answer') {
      // Re-queue call task in 1 day
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await supabase.from('call_queue').insert({
        company_id: data.companyId,
        contact_id: data.contactId || null,
        priority: 0,
        status: 'pending',
        queued_at: tomorrow.toISOString()
      })
    } else if (data.outcome === 'callback_requested' && data.followUpDate) {
      // Queue callback call task for requested date
      await supabase.from('call_queue').insert({
        company_id: data.companyId,
        contact_id: data.contactId || null,
        priority: 1,
        status: 'pending',
        queued_at: new Date(data.followUpDate).toISOString()
      })
    } else if (data.outcome === 'meeting_booked' || data.outcome === 'meeting_requested') {
      await supabase
        .from('companies')
        .update({ status: 'meeting_booked', updated_at: now })
        .eq('id', data.companyId)

      if (data.followUpDate) {
        await supabase.from('meetings').insert({
          company_id: data.companyId,
          contact_id: data.contactId || null,
          title: 'Discovery Meeting — Tadbeer Transformations',
          meeting_date: new Date(data.followUpDate).toISOString(),
          notes: data.notes || 'Discovery call booked.',
          status: 'scheduled',
          created_at: now
        })
      }
    } else if (data.outcome === 'proposal_required') {
      // Create outreach prep draft for proposals
      await supabase.from('outreach_preparations').insert({
        company_id: data.companyId,
        contact_id: data.contactId || null,
        use_case_summary: 'PROPOSAL',
        outreach_channel: 'email',
        message_body: '',
        status: 'draft',
        created_at: now,
        updated_at: now
      })
      await supabase
        .from('companies')
        .update({ status: 'opportunity', updated_at: now })
        .eq('id', data.companyId)
    } else if (data.outcome === 'not_interested') {
      await supabase
        .from('companies')
        .update({ status: 'lost', updated_at: now })
        .eq('id', data.companyId)
    }

    await computeAndUpdateNextAction(data.companyId)

    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Call outcomes completion failed' }
  }
}

// ─── Daily History Queries ──────────────────────────────────────────

export async function getDailyHistory(dateStr: string) {
  try {
    // 1. Fetch outreach sessions on this date
    const { data: sessions } = await supabase
      .from('daily_outreach_sessions')
      .select('*')
      .eq('session_date', dateStr)

    const sessionIds = sessions?.map(s => s.id) || []

    // 2. Fetch outreach items for these sessions
    const { data: items } = await supabase
      .from('daily_outreach_items')
      .select(`
        *,
        companies (
          company_name,
          status,
          contacts (*)
        )
      `)
      .in('session_id', sessionIds)

    // 3. Fetch touches, calls, and follow-ups made on this date
    const startOfDay = `${dateStr}T00:00:00.000Z`
    const endOfDay = `${dateStr}T23:59:59.999Z`

    const { data: touches } = await supabase
      .from('outreach_touches')
      .select('*, companies:lead_id(company_name)')
      .gte('sent_at', startOfDay)
      .lte('sent_at', endOfDay)

    const { data: calls } = await supabase
      .from('calls')
      .select('*, companies:company_id(company_name)')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)

    const { data: followUps } = await supabase
      .from('follow_ups')
      .select('*, companies:company_id(company_name)')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)

    const { data: activities } = await supabase
      .from('activities')
      .select('*, companies:company_id(company_name)')
      .gte('created_at', startOfDay)
      .lte('created_at', endOfDay)

    return {
      data: {
        sessions: sessions || [],
        scheduledItems: items || [],
        touches: touches || [],
        calls: calls || [],
        followUps: followUps || [],
        activities: activities || []
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'History query failed' }
  }
}
