'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'
import { revalidatePath } from 'next/cache'

function revalidateAllCRMPages() {
  try {
    revalidatePath('/follow-ups')
    revalidatePath('/outreach')
    revalidatePath('/daily-cadence')
    revalidatePath('/dashboard')
    revalidatePath('/prospects')
    revalidatePath('/pipeline')
    revalidatePath('/meetings')
    revalidatePath('/calls')
  } catch {
    // safe fallback
  }
}

export async function getFollowUps(filter: 'due_today' | 'overdue' | 'all' | 'pending') {
  try {
    await requireAuth()
    const supabase = await createClient()

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
    const supabase = await createClient()

    const { data: followUp, error } = await supabase
      .from('follow_ups')
      .insert({
        company_id: data.company_id,
        contact_id: data.contact_id,
        due_date: data.due_date,
        due_time: data.due_time,
        subject: data.subject,
        description: data.description,
        channel: data.channel || 'call',
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }

    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        company_id: data.company_id,
        activity_type: 'follow_up_scheduled',
        title: 'Follow-up scheduled',
        description: `Follow-up scheduled for ${data.due_date}`,
        contact_id: data.contact_id,
        metadata: {
          follow_up_id: followUp.id,
          due_date: data.due_date,
          channel: data.channel
        },
        created_at: new Date().toISOString()
      })

    if (activityError) {
      console.error('Failed to log activity:', activityError)
    }

    if (data.company_id) {
      await supabase.from('companies').update({
        updated_at: new Date().toISOString()
      }).eq('id', data.company_id)
    }

    revalidateAllCRMPages()
    return { data: followUp, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function completeFollowUp(id: string, notes?: string) {
  try {
    await requireAuth()
    const supabase = await createClient()

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

    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        company_id: followUp.company_id,
        activity_type: 'follow_up_completed',
        title: 'Follow-up completed',
        description: notes || 'Follow-up marked as completed',
        contact_id: followUp.contact_id,
        metadata: { follow_up_id: id },
        created_at: new Date().toISOString()
      })

    if (activityError) {
      console.error('Failed to log activity:', activityError)
    }

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
    const supabase = await createClient()

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
