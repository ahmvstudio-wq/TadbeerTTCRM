'use server'

import { requireAuth } from '@/lib/auth-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/config'
import { getAllLeadsForPipeline } from '@/lib/actions/ig-dm'

import { resolveDateRange, isDateInRange, type ResolvedDateRange } from '@/lib/date-utils'

const supabase = getSupabaseAdminClient()

export async function getDashboardStats(dateFilter: string = 'all') {
  try {
    await requireAuth()

    const range = resolveDateRange(dateFilter)
    const isFiltered = Boolean(range.startDate && range.endDate)

    const [
      companiesResult,
      contactsResult,
      callsResult,
      meetingsResult,
      followUpsResult,
      opportunitiesResult,
      auditsResult,
      activitiesResult,
      outreachPipelineResult
    ] = await Promise.all([
      supabase.from('companies').select('id, status, pipeline_stage, lead_source, est_deal_value, phone, lead_type, created_at, date_added').range(0, 4999),
      supabase.from('contacts').select('id, created_at').range(0, 4999),
      supabase.from('calls').select('id, outcome, call_date, created_at').range(0, 4999),
      supabase.from('meetings').select('id, status, meeting_date, created_at').range(0, 4999),
      supabase.from('follow_ups').select('id, status, due_date, created_at').range(0, 4999),
      supabase.from('opportunities').select('id, estimated_value, probability, stage, created_at').range(0, 4999),
      supabase.from('activities').select('id, metadata, created_at').eq('activity_type', 'note').contains('metadata', { is_audit: true }).range(0, 4999),
      supabase.from('activities').select('id, activity_type, created_at, company_id, description').range(0, 4999),
      getAllLeadsForPipeline(dateFilter)
    ])

    if (companiesResult.error) {
      return { data: null, error: companiesResult.error.message }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const allCompanies = companiesResult.data || []
    // Filter active companies for dashboard outreach & metrics
    const companies = allCompanies.filter((c: any) => c.lead_type !== 'Dormant' && c.status !== 'dormant')
    const contacts = contactsResult.data || []
    const calls = callsResult.data || []
    const meetings = meetingsResult.data || []
    const followUps = followUpsResult.data || []
    const opportunities = opportunitiesResult.data || []
    const audits = auditsResult?.data || []
    const pendingAudits = audits.filter((a: any) => a.metadata?.status !== 'completed').length

    // Filter slices if dateFilter is active
    const periodCalls = isFiltered
      ? calls.filter((c: any) => isDateInRange(c.call_date || c.created_at, range.startDate, range.endDate))
      : calls
    const periodMeetings = isFiltered
      ? meetings.filter((m: any) => isDateInRange(m.created_at || m.meeting_date, range.startDate, range.endDate))
      : meetings
    const periodFollowUps = isFiltered
      ? followUps.filter((f: any) => isDateInRange(f.due_date || f.created_at, range.startDate, range.endDate))
      : followUps
    const periodAudits = isFiltered
      ? audits.filter((a: any) => isDateInRange(a.created_at, range.startDate, range.endDate))
      : audits
    const periodCompaniesAdded = isFiltered
      ? companies.filter((c: any) => isDateInRange(c.created_at || c.date_added, range.startDate, range.endDate))
      : companies

    const activeScheduledMeetings = isFiltered
      ? periodMeetings.filter(m => m.status === 'scheduled').length
      : meetings.filter(m => m.status === 'scheduled').length
    const activeTotalBooked = isFiltered
      ? periodMeetings.filter(m => m.status === 'scheduled' || m.status === 'completed').length
      : meetings.filter(m => m.status === 'scheduled' || m.status === 'completed').length
    const activePendingAudits = isFiltered
      ? periodAudits.filter((a: any) => a.metadata?.status !== 'completed').length
      : pendingAudits

    const outreachLeads = (outreachPipelineResult?.data as any[]) || []

    const stats = {
      is_filtered: isFiltered,
      date_range: range,
      filter_label: range.label,
      total_companies: isFiltered
        ? (outreachLeads.length > 0 ? outreachLeads.length : periodCompaniesAdded.length)
        : companies.length,
      total_database_all: allCompanies.length,
      dormant_companies: allCompanies.length - companies.length,
      period_companies_added: periodCompaniesAdded.length,
      companies_by_status: {} as Record<string, number>,
      total_contacts: contacts.length,
      total_calls: periodCalls.length,
      calls_by_outcome: {} as Record<string, number>,
      upcoming_meetings: activeScheduledMeetings,
      total_meetings_booked: activeTotalBooked,
      pending_follow_ups: (isFiltered ? periodFollowUps : followUps).filter(f =>
        f.status === 'pending' && f.due_date >= todayStr
      ).length,
      overdue_follow_ups: (isFiltered ? periodFollowUps : followUps).filter(f =>
        f.status === 'pending' && f.due_date < todayStr
      ).length,
      pending_audits: activePendingAudits,
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
      if (c.status === 'contacted' || c.pipeline_stage === 'Contacted' || c.pipeline_stage === 'Replied' || c.status === 'meeting_booked' || c.status === 'in_call_queue' || c.pipeline_stage === 'Call Ready' || c.status === 'opportunity') {
        inOutreachCount++
      }
      if (c.status === 'contacted' || c.pipeline_stage === 'Contacted' || c.pipeline_stage === 'Replied' || c.pipeline_stage === 'Call Ready' || c.status === 'in_call_queue' || c.status === 'meeting_booked' || c.status === 'opportunity') {
        contactedCount++
      }
      if (c.status === 'in_call_queue' || c.pipeline_stage === 'Call Ready' || c.status === 'ready_for_call') {
        callReadyCount++
      }
    })

    const totalCo = Math.max(1, companies.length)
    const bookedCount = activeTotalBooked

    if (isFiltered) {
      let fLi = 0, fWa = 0, fIg = 0, fDir = 0
      const sourceList = outreachLeads.length > 0 ? outreachLeads : periodCompaniesAdded
      sourceList.forEach((item: any) => {
        const ch = (item.channel || item.lead_source || '').toLowerCase()
        if (ch.includes('whatsapp')) fWa++
        else if (ch.includes('instagram')) fIg++
        else if (ch.includes('linkedin')) fLi++
        else fDir++
      })
      const fTotal = Math.max(1, sourceList.length)
      stats.channel_breakdown = {
        linkedin: { count: fLi, pct: Math.round((fLi / fTotal) * 100) },
        whatsapp: { count: fWa, pct: Math.round((fWa / fTotal) * 100) },
        instagram: { count: fIg, pct: Math.round((fIg / fTotal) * 100) },
        direct: { count: fDir, pct: Math.round((fDir / fTotal) * 100) },
        total: sourceList.length
      }

      const totalOutreachLeads = outreachLeads.length
      stats.in_outreach = totalOutreachLeads
      const denominator = Math.max(1, totalOutreachLeads > 0 ? totalOutreachLeads : periodCompaniesAdded.length)
      stats.conversion_rate = Math.round((bookedCount / denominator) * 1000) / 10

      const fCallReady = outreachLeads.filter((l: any) => l.status === 'ready_for_call' || l.stage === 'ready_for_call' || l.status === 'called').length
      stats.stage_funnel = [
        { label: `1. Active in ${range.label}`, count: sourceList.length, pct: 100, color: "bg-slate-900", textColor: "text-slate-900" },
        { label: "2. Contacted", count: totalOutreachLeads, pct: Math.round((totalOutreachLeads / fTotal) * 100), color: "bg-[#0f343c]", textColor: "text-slate-800" },
        { label: "3. Call Ready", count: fCallReady, pct: Math.round((fCallReady / fTotal) * 100), color: "bg-[#174E59]", textColor: "text-[#174E59]" },
        { label: "4. Meetings Booked", count: bookedCount, pct: Math.round((bookedCount / fTotal) * 100), color: "bg-[#257584]", textColor: "text-[#257584]" },
      ]
    } else {
      stats.channel_breakdown = {
        linkedin: { count: liCount, pct: Math.round((liCount / totalCo) * 100) },
        whatsapp: { count: waCount, pct: Math.round((waCount / totalCo) * 100) },
        instagram: { count: igCount, pct: Math.round((igCount / totalCo) * 100) },
        direct: { count: directCount, pct: Math.round((directCount / totalCo) * 100) },
        total: companies.length
      }

      const totalOutreachLeads = outreachLeads.length > 0 ? outreachLeads.length : inOutreachCount
      stats.in_outreach = totalOutreachLeads
      stats.conversion_rate = totalCo > 0 ? Math.round((bookedCount / totalCo) * 1000) / 10 : 0

      stats.stage_funnel = [
        { label: "1. Total Database", count: companies.length, pct: 100, color: "bg-slate-900", textColor: "text-slate-900" },
        { label: "2. Contacted", count: totalOutreachLeads, pct: Math.round((totalOutreachLeads / totalCo) * 100), color: "bg-[#0f343c]", textColor: "text-slate-800" },
        { label: "3. Call Ready", count: callReadyCount, pct: Math.round((callReadyCount / totalCo) * 100), color: "bg-[#174E59]", textColor: "text-[#174E59]" },
        { label: "4. Meetings Booked", count: bookedCount, pct: Math.round((bookedCount / totalCo) * 100), color: "bg-[#257584]", textColor: "text-[#257584]" },
      ]
    }

    periodCalls.forEach((c: any) => {
      stats.calls_by_outcome[c.outcome] = (stats.calls_by_outcome[c.outcome] || 0) + 1
    })

    opportunities.forEach(o => {
      if (o.stage !== 'lost' && o.stage !== 'won') {
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
