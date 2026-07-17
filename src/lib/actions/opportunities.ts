'use server'

import { createClient } from '@/lib/supabase/server'

export async function getOpportunities(filter?: { stage?: string }) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('opportunities')
      .select(`
        *,
        companies (company_name),
        contacts (full_name),
        service_lines (name)
      `)
      .order('created_at', { ascending: false })

    if (filter?.stage) {
      query = query.eq('stage', filter.stage)
    }

    const { data, error } = await query

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function createOpportunity(data: {
  company_id: string
  contact_id?: string
  service_line_id?: string
  title: string
  description?: string
  estimated_value: number
  currency?: string
  stage?: string
  expected_close_date?: string
  probability?: number
}) {
  try {
    const supabase = await createClient()

    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .insert({
        company_id: data.company_id,
        contact_id: data.contact_id,
        service_line_id: data.service_line_id,
        title: data.title,
        description: data.description,
        estimated_value: data.estimated_value,
        currency: data.currency || 'SAR',
        stage: data.stage || 'qualified',
        expected_close_date: data.expected_close_date,
        probability: data.probability || 10
      })
      .select()
      .single()

    if (oppError) {
      return { data: null, error: oppError.message }
    }

    const { error: statusError } = await supabase
      .from('companies')
      .update({
        status: 'opportunity',
        updated_at: new Date().toISOString()
      })
      .eq('id', data.company_id)

    if (statusError) {
      console.error('Failed to update company status:', statusError)
    }

    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        company_id: data.company_id,
        activity_type: 'opportunity_created',
        title: 'Opportunity created',
        description: `New opportunity "${data.title}" with value SAR ${data.estimated_value.toLocaleString()}`,
        contact_id: data.contact_id,
        metadata: {
          opportunity_id: opportunity.id,
          estimated_value: data.estimated_value,
          stage: data.stage || 'qualified'
        },
        created_at: new Date().toISOString()
      })

    if (activityError) {
      console.error('Failed to log activity:', activityError)
    }

    return { data: opportunity, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function updateOpportunityStage(id: string, stage: string) {
  try {
    const supabase = await createClient()

    const { data: opportunity, error: fetchError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      return { data: null, error: fetchError.message }
    }

    const stageProbabilities: Record<string, number> = {
      'qualified': 10,
      'proposal_sent': 30,
      'negotiation': 50,
      'verbal_commit': 80,
      'won': 100,
      'lost': 0
    }

    const updateData: Record<string, any> = {
      stage,
      probability: stageProbabilities[stage] ?? opportunity.probability
    }

    if (stage === 'won') {
      updateData.won_at = new Date().toISOString()
    } else if (stage === 'lost') {
      updateData.lost_at = new Date().toISOString()
    }

    const { data: updated, error: updateError } = await supabase
      .from('opportunities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: updateError.message }
    }

    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        company_id: opportunity.company_id,
        activity_type: 'opportunity_stage_changed',
        title: 'Opportunity stage updated',
        description: `Stage changed from "${opportunity.stage}" to "${stage}"`,
        contact_id: opportunity.contact_id,
        metadata: {
          opportunity_id: id,
          old_stage: opportunity.stage,
          new_stage: stage,
          estimated_value: opportunity.estimated_value
        },
        created_at: new Date().toISOString()
      })

    if (activityError) {
      console.error('Failed to log activity:', activityError)
    }

    return { data: updated, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function getPipelineStats() {
  try {
    const supabase = await createClient()

    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('estimated_value, probability, stage')
      .not('stage', 'eq', 'lost')

    if (error) {
      return { data: null, error: error.message }
    }

    const stats = {
      total_value: 0,
      total_count: opportunities?.length || 0,
      weighted_value: 0,
      by_stage: {} as Record<string, { count: number; value: number }>
    }

    opportunities?.forEach(opp => {
      stats.total_value += opp.estimated_value || 0
      stats.weighted_value += (opp.estimated_value || 0) * ((opp.probability || 0) / 100)

      if (!stats.by_stage[opp.stage]) {
        stats.by_stage[opp.stage] = { count: 0, value: 0 }
      }
      stats.by_stage[opp.stage].count++
      stats.by_stage[opp.stage].value += opp.estimated_value || 0
    })

    return { data: stats, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}
