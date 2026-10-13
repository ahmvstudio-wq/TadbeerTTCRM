'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import { invalidateServerCache } from '@/lib/cache/server-cache'

function revalidateAllCRMPages() {
  invalidateServerCache()
  try {
    revalidatePath('/pipeline')
    revalidatePath('/meetings')
    revalidatePath('/outreach')
    revalidatePath('/daily-cadence')
  } catch {}
}

export async function getMeetings(filter: 'upcoming' | 'past' | 'all') {
  try {
    await requireAuth()
    const supabase = await createClient()

    // 1. Auto-sync missing meetings for companies that have status meeting_booked
    try {
      const { data: bookedCos } = await supabase
        .from('companies')
        .select('id, company_name, phone, status, pipeline_stage, research_json, updated_at, contacts(id, full_name, phone)')
        .or('status.eq.meeting_booked,pipeline_stage.ilike.%meeting%')

      if (bookedCos && bookedCos.length > 0) {
        const { data: existingMeetings } = await supabase
          .from('meetings')
          .select('company_id')

        const meetingCoIds = new Set((existingMeetings || []).map((m: any) => m.company_id))

        for (const co of bookedCos) {
          if (!meetingCoIds.has(co.id)) {
            let rJson: any = {}
            try {
              if (typeof co.research_json === 'string') rJson = JSON.parse(co.research_json)
              else if (typeof co.research_json === 'object') rJson = co.research_json
            } catch {}

            const targetDate = rJson.meeting_date || rJson.action_due_date || new Date().toISOString()
            const primaryContact = co.contacts?.[0] || null

            await supabase.from('meetings').insert({
              company_id: co.id,
              contact_id: primaryContact?.id || null,
              title: rJson.meeting_title || `Discovery Meeting with ${co.company_name}`,
              meeting_date: targetDate.includes('T') ? targetDate : `${targetDate}T10:00:00.000Z`,
              duration_minutes: 30,
              meeting_type: rJson.meeting_type || 'in_person',
              location: rJson.meeting_location || null,
              description: rJson.next_action || 'Scheduled discovery & presentation meeting',
              status: 'scheduled',
              created_at: new Date().toISOString(),
            })
          }
        }
      }
    } catch (syncErr) {
      console.warn("Meeting auto-sync notice:", syncErr)
    }

    let query = supabase
      .from('meetings')
      .select(`
        *,
        companies (*),
        contacts (*)
      `)

    const now = new Date().toISOString()

    switch (filter) {
      case 'upcoming':
        query = query
          .gte('meeting_date', now)
          .order('meeting_date', { ascending: true })
        break
      case 'past':
        query = query
          .lt('meeting_date', now)
          .order('meeting_date', { ascending: false })
        break
      case 'all':
      default:
        query = query.order('meeting_date', { ascending: false })
        break
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function bookMeeting(data: {
  company_id: string
  contact_id?: string
  title: string
  meeting_date: string
  duration_minutes?: number
  meeting_type?: string
  location?: string
  description?: string
  notes?: string
}) {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        company_id: data.company_id,
        contact_id: data.contact_id,
        title: data.title,
        meeting_date: data.meeting_date,
        duration_minutes: data.duration_minutes || 30,
        meeting_type: data.meeting_type || 'in_person',
        location: data.location,
        description: data.description,
        notes: data.notes,
        status: 'scheduled',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (meetingError) return { data: null, error: meetingError.message }

    // Preserve and enrich research_json with scheduled meeting details
    const { data: currentCo } = await supabase
      .from('companies')
      .select('research_json')
      .eq('id', data.company_id)
      .maybeSingle()

    let curR: any = {}
    if (currentCo?.research_json) {
      if (typeof currentCo.research_json === 'string') {
        try { curR = JSON.parse(currentCo.research_json) } catch {}
      } else if (typeof currentCo.research_json === 'object') {
        curR = currentCo.research_json
      }
    }

    const meetingDateObj = new Date(data.meeting_date)
    const timeFormatted = isNaN(meetingDateObj.getTime())
      ? ''
      : meetingDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    const updatedR = {
      ...curR,
      unified_status: 'meeting_booked',
      pipeline_stage: 'meeting',
      meeting_date: data.meeting_date,
      meeting_time: timeFormatted,
      meeting_title: data.title,
      meeting_type: data.meeting_type || 'in_person',
      meeting_location: data.location || null,
      action_due_date: data.meeting_date.split('T')[0],
      next_action: `Meeting: ${data.title} (${timeFormatted})`,
      stage_updated_at: new Date().toISOString(),
    }

    const { error: statusError } = await supabase
      .from('companies')
      .update({
        status: 'meeting_booked',
        pipeline_stage: 'Meeting Booked',
        research_json: updatedR,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.company_id)

    if (statusError) {
      console.error('Failed to update company status:', statusError)
    }

    // Also sync or insert outreach activity with status: meeting_booked
    const { data: acts } = await supabase
      .from('activities')
      .select('id, description, metadata')
      .eq('company_id', data.company_id)
      .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach', 'outreach_sent'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (acts && acts.length > 0) {
      let p: any = acts[0].metadata || {}
      if (!acts[0].metadata && acts[0].description) {
        try { p = JSON.parse(acts[0].description) } catch { p = { notes: acts[0].description } }
      }
      const updatedPayload = { ...p, status: 'meeting_booked', updated_at: new Date().toISOString() }
      await supabase.from('activities').update({
        description: updatedPayload.notes || updatedPayload.prospect_reply || 'Meeting Scheduled — meeting_booked',
        metadata: updatedPayload
      }).eq('id', acts[0].id)
    } else {
      const newPayload = {
        channel: 'cold_call',
        status: 'meeting_booked',
        updated_at: new Date().toISOString()
      }
      await supabase.from('activities').insert({
        company_id: data.company_id,
        activity_type: 'call_made',
        title: 'Meeting Scheduled — meeting_booked',
        description: 'Meeting Scheduled — meeting_booked',
        metadata: newPayload,
        created_at: new Date().toISOString()
      })
    }

    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        company_id: data.company_id,
        activity_type: 'meeting_booked',
        title: 'Meeting booked',
        description: `Meeting "${data.title}" scheduled for ${new Date(data.meeting_date).toLocaleDateString()}`,
        contact_id: data.contact_id,
        metadata: {
          meeting_id: meeting.id,
          meeting_date: data.meeting_date,
          meeting_type: data.meeting_type
        },
        created_at: new Date().toISOString()
      })

    if (activityError) {
      console.error('Failed to log activity:', activityError)
    }

    revalidateAllCRMPages()

    return { data: meeting, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function updateMeetingStatus(id: string, status: 'completed' | 'cancelled' | 'no_show') {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { data: meeting, error: fetchError } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) return { data: null, error: fetchError.message }

    const { data: updated, error: updateError } = await supabase
      .from('meetings')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (updateError) return { data: null, error: updateError.message }

    // If meeting was completed, advance company to opportunity; if cancelled/no-show, only revert if currently meeting_booked
    if (meeting.company_id) {
      if (status === 'completed') {
        await supabase.from('companies').update({
          status: 'opportunity',
          pipeline_stage: 'Opportunity',
          updated_at: new Date().toISOString()
        }).eq('id', meeting.company_id)
      } else if (status === 'cancelled' || status === 'no_show') {
        const { data: currentCo } = await supabase
          .from('companies')
          .select('status')
          .eq('id', meeting.company_id)
          .single()
        if (currentCo?.status === 'meeting_booked') {
          await supabase.from('companies').update({
            status: 'contacted',
            pipeline_stage: 'Contacted',
            updated_at: new Date().toISOString()
          }).eq('id', meeting.company_id)
        }
      }
    }

    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        company_id: meeting.company_id,
        activity_type: `meeting_${status}`,
        title: `Meeting ${status.replace('_', ' ')}`,
        description: `Meeting "${meeting.title}" was ${status.replace('_', ' ')}`,
        contact_id: meeting.contact_id,
        metadata: { meeting_id: id, status },
        created_at: new Date().toISOString()
      })

    if (activityError) {
      console.error('Failed to log activity:', activityError)
    }

    revalidateAllCRMPages()

    return { data: updated, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}
