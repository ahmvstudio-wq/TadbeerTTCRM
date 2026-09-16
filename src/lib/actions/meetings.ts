'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'

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
  } catch (e) {
    // ignore in non-request contexts
  }
}

export async function getMeetings(filter: 'upcoming' | 'past' | 'all') {
  try {
    await requireAuth()
    const supabase = await createClient()

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

    const { error: statusError } = await supabase
      .from('companies')
      .update({
        status: 'meeting_booked',
        pipeline_stage: 'Meeting Booked',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.company_id)

    if (statusError) {
      console.error('Failed to update company status:', statusError)
    }

    // Also sync or insert outreach activity with status: meeting_booked
    const { data: acts } = await supabase
      .from('activities')
      .select('id, description')
      .eq('company_id', data.company_id)
      .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach', 'outreach_sent'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (acts && acts.length > 0) {
      let p: any = {}
      try { p = acts[0].description ? JSON.parse(acts[0].description) : {} } catch {}
      await supabase.from('activities').update({
        description: JSON.stringify({ ...p, status: 'meeting_booked', updated_at: new Date().toISOString() })
      }).eq('id', acts[0].id)
    } else {
      await supabase.from('activities').insert({
        company_id: data.company_id,
        activity_type: 'call_made',
        title: 'Meeting Scheduled — meeting_booked',
        description: JSON.stringify({
          channel: 'cold_call',
          status: 'meeting_booked',
          updated_at: new Date().toISOString()
        }),
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

    // If meeting was completed, advance company to opportunity; if cancelled, set back to contacted
    if (meeting.company_id) {
      const coUpdate = status === 'completed'
        ? { status: 'opportunity', pipeline_stage: 'Opportunity', updated_at: new Date().toISOString() }
        : { status: 'contacted', pipeline_stage: 'Contacted', updated_at: new Date().toISOString() }
      await supabase.from('companies').update(coUpdate).eq('id', meeting.company_id)
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
