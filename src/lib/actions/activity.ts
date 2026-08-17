'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-guard'

export async function logActivity(data: {
  company_id: string
  activity_type: string
  title: string
  description?: string
  contact_id?: string
  user_id?: string
  metadata?: Record<string, any>
}) {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        company_id: data.company_id,
        activity_type: data.activity_type,
        title: data.title,
        description: data.description,
        contact_id: data.contact_id,
        user_id: data.user_id,
        metadata: data.metadata || {},
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: activity, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function getCompanyActivities(companyId: string, limit: number = 50) {
  try {
    await requireAuth()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        contacts (full_name, email),
        users (full_name, avatar_url)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) return { data: null, error: error.message }

    const activities = data?.map(activity => ({
      ...activity,
      contact_name: (activity.contacts as any)?.full_name,
      contact_email: (activity.contacts as any)?.email,
      user_name: (activity.users as any)?.full_name,
      user_avatar: (activity.users as any)?.avatar_url
    })) || []

    return { data: activities, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}
