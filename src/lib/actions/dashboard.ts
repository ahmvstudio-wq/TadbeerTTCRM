'use server'

import { requireAuth } from '@/lib/auth-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/config'

const supabase = getSupabaseAdminClient()


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
      supabase.from('companies').select('id, status, pipeline_stage, lead_source, est_deal_value, phone'),
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
      },
      channel_breakdown: {
        linkedin: { count: 0, pct: 0 },
        whatsapp: { count: 0, pct: 0 },
        instagram: { count: 0, pct: 0 },
        direct: { count: 0, pct: 0 },
        total: companies.length
      },
      stage_funnel: [] as Array<{ label: string; count: number; pct: number; color: string; textColor: string }>,
      in_outreach: 0,
      conversion_rate: 0
    }

    let liCount = 0;
    let waCount = 0;
    let igCount = 0;
    let directCount = 0;
    let contactedCount = 0;
    let callReadyCount = 0;
    let inOutreachCount = 0;

    companies.forEach(c => {
      stats.companies_by_status[c.status] = (stats.companies_by_status[c.status] || 0) + 1

      // Saved DB lead_source
      const src = (c.lead_source || '').toLowerCase()
      if (src.includes('whatsapp')) {
        waCount++
      } else if (src.includes('instagram')) {
        igCount++
      } else if (src.includes('linkedin')) {
        liCount++
      } else {
        directCount++
      }

      // Outreach & Funnel
      if (c.status === 'contacted' || c.pipeline_stage === 'Contacted' || c.pipeline_stage === 'Replied' || c.status === 'meeting_booked' || c.status === 'in_call_queue') {
        inOutreachCount++
      }
      if (c.status === 'contacted' || c.pipeline_stage === 'Contacted' || c.pipeline_stage === 'Replied') {
        contactedCount++
      }
      if (c.status === 'in_call_queue' || (c.phone && c.status === 'prospect')) {
        callReadyCount++
      }
    })

    const totalCo = Math.max(1, companies.length)
    const bookedCount = meetings.filter(m => m.status === 'scheduled').length

    stats.channel_breakdown = {
      linkedin: { count: liCount, pct: Math.round((liCount / totalCo) * 100) },
      whatsapp: { count: waCount, pct: Math.round((waCount / totalCo) * 100) },
      instagram: { count: igCount, pct: Math.round((igCount / totalCo) * 100) },
      direct: { count: directCount, pct: Math.round((directCount / totalCo) * 100) },
      total: companies.length
    }

    stats.in_outreach = inOutreachCount
    stats.conversion_rate = totalCo > 0 ? Math.round((bookedCount / totalCo) * 1000) / 10 : 0

    stats.stage_funnel = [
      { label: "1. Total Database", count: companies.length, pct: 100, color: "bg-slate-900", textColor: "text-slate-900" },
      { label: "2. Contacted", count: contactedCount, pct: Math.round((contactedCount / totalCo) * 100), color: "bg-[#0f343c]", textColor: "text-slate-800" },
      { label: "3. Call Ready", count: callReadyCount, pct: Math.round((callReadyCount / totalCo) * 100), color: "bg-[#174E59]", textColor: "text-[#174E59]" },
      { label: "4. Meetings Booked", count: bookedCount, pct: Math.round((bookedCount / totalCo) * 100), color: "bg-[#257584]", textColor: "text-[#257584]" },
    ]

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
