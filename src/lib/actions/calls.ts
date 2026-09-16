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

export async function getCallQueue(userId?: string) {
  try {
    await requireAuth()
    const supabase = await createClient()

    let query = supabase
      .from('call_queue')
      .select(`
        *,
        companies (*),
        contacts (*)
      `)
      .in('status', ['pending', 'in_progress'])
      .order('queued_at', { ascending: true })

    if (userId) {
      query = query.eq('assigned_to', userId)
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function startCall(callQueueId: string) {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('call_queue')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', callQueueId)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function recordCall(data: {
  call_queue_id?: string
  company_id: string
  contact_id?: string
  duration_seconds: number
  outcome: string
  notes?: string
  follow_up_needed?: boolean
  follow_up_date?: string
}) {
  try {
    const user = await requireAuth()
    const supabase = await createClient()

    const { data: callRecord, error: callError } = await supabase
      .from('calls')
      .insert({
        call_queue_id: data.call_queue_id,
        company_id: data.company_id,
        contact_id: data.contact_id,
        caller_id: (await supabase.auth.getUser()).data.user?.id || user.email,
        duration_seconds: data.duration_seconds,
        outcome: data.outcome,
        notes: data.notes,
        follow_up_needed: data.follow_up_needed || false,
        follow_up_date: data.follow_up_date,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (callError) return { data: null, error: callError.message }

    if (data.call_queue_id) {
      const { error: queueError } = await supabase
        .from('call_queue')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', data.call_queue_id)

      if (queueError) {
        console.error('Failed to update call queue:', queueError)
      }
    }

    if (data.follow_up_needed && data.follow_up_date) {
      const { error: followUpError } = await supabase
        .from('follow_ups')
        .insert({
          company_id: data.company_id,
          contact_id: data.contact_id,
          call_id: callRecord.id,
          due_date: data.follow_up_date,
          subject: 'Follow-up from call',
          description: data.notes,
          status: 'pending',
          created_at: new Date().toISOString()
        })

      if (followUpError) {
        console.error('Failed to create follow-up:', followUpError)
      }
    }

    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        company_id: data.company_id,
        activity_type: 'call_made',
        title: 'Call completed',
        description: `Call with outcome: ${data.outcome}. Duration: ${Math.floor(data.duration_seconds / 60)}m ${data.duration_seconds % 60}s`,
        contact_id: data.contact_id,
        metadata: {
          call_id: callRecord.id,
          duration_seconds: data.duration_seconds,
          outcome: data.outcome
        },
        created_at: new Date().toISOString()
      })

    if (activityError) {
      console.error('Failed to log activity:', activityError)
    }

    revalidateAllCRMPages()
    return { data: callRecord, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function getCompletedCalls(userId?: string) {
  try {
    await requireAuth()
    const supabase = await createClient()

    let query = supabase
      .from('calls')
      .select(`
        *,
        companies (*),
        contacts (*)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (userId) {
      query = query.eq('caller_id', userId)
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function addToCallQueue(companyId: string, contactId?: string, priority = 'medium') {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { data: existing } = await supabase
      .from('call_queue')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .single()

    if (existing) {
      return { data: existing, error: null }
    }

    const { data, error } = await supabase
      .from('call_queue')
      .insert({
        company_id: companyId,
        contact_id: contactId || null,
        priority: priority,
        status: 'pending',
        queued_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      await supabase.from('companies').update({ status: 'in_call_queue', pipeline_stage: 'Call Ready', updated_at: new Date().toISOString() }).eq('id', companyId)
      return { data: null, error: error.message }
    }

    await supabase
      .from('companies')
      .update({ status: 'in_call_queue', pipeline_stage: 'Call Ready', updated_at: new Date().toISOString() })
      .eq('id', companyId)

    revalidateAllCRMPages()
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function addBatchToCallQueue(companyIds: string[]) {
  try {
    await requireAuth()
    let successCount = 0
    for (const id of companyIds) {
      const res = await addToCallQueue(id)
      if (!res.error) successCount++
    }
    return { count: successCount, error: null }
  } catch (error) {
    return { count: 0, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}
