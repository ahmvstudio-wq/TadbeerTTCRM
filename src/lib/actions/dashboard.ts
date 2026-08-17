'use server'

import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth-guard'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function getDashboardStats() {
  try {
    await requireAuth()

    const [
      companiesResult,
      contactsResult,
      callsResult,
      meetingsResult,
      followUpsResult,
      opportunitiesResult
    ] = await Promise.all([
      supabase.from('companies').select('id, status'),
      supabase.from('contacts').select('id'),
      supabase.from('calls').select('id, outcome'),
      supabase.from('meetings').select('id, status, meeting_date'),
      supabase.from('follow_ups').select('id, status, due_date'),
      supabase.from('opportunities').select('id, estimated_value, probability, stage')
    ])

    if (companiesResult.error) {
      return { data: null, error: companiesResult.error.message }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString()

    const companies = companiesResult.data || []
    const contacts = contactsResult.data || []
    const calls = callsResult.data || []
    const meetings = meetingsResult.data || []
    const followUps = followUpsResult.data || []
    const opportunities = opportunitiesResult.data || []

    const stats = {
      total_companies: companies.length,
      companies_by_status: {} as Record<string, number>,
      total_contacts: contacts.length,
      total_calls: calls.length,
      calls_by_outcome: {} as Record<string, number>,
      upcoming_meetings: meetings.filter(m =>
        m.status === 'scheduled' && m.meeting_date >= todayStr
      ).length,
      pending_follow_ups: followUps.filter(f =>
        f.status === 'pending' && f.due_date >= todayStr
      ).length,
      overdue_follow_ups: followUps.filter(f =>
        f.status === 'pending' && f.due_date < todayStr
      ).length,
      pipeline: {
        total_value: 0,
        weighted_value: 0,
        open_opportunities: 0
      }
    }

    companies.forEach(c => {
      stats.companies_by_status[c.status] = (stats.companies_by_status[c.status] || 0) + 1
    })

    calls.forEach(c => {
      stats.calls_by_outcome[c.outcome] = (stats.calls_by_outcome[c.outcome] || 0) + 1
    })

    opportunities.forEach(o => {
      if (o.stage !== 'lost') {
        stats.pipeline.open_opportunities++
        stats.pipeline.total_value += o.estimated_value || 0
        stats.pipeline.weighted_value += (o.estimated_value || 0) * ((o.probability || 0) / 100)
      }
    })

    return { data: stats, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function getRecentActivity(limit: number = 20) {
  try {
    await requireAuth()

    const { data, error } = await supabase
      .from('activities')
      .select(`
        *,
        companies (company_name),
        users (full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { data: null, error: error.message }
    }

    const activities = data?.map(activity => ({
      ...activity,
      company_name: (activity.companies as any)?.company_name,
      user_name: (activity.users as any)?.full_name,
      user_avatar: (activity.users as any)?.avatar_url
    })) || []

    return { data: activities, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}
