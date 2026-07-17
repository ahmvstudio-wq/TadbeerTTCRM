'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Outreach Touches ───────────────────────────────────────────────
export async function saveTouch(data: {
  lead_id: string; channel: string; step: number; message: string;
  campaign_id?: string; follow_up_date?: string; is_call?: boolean;
  call_duration?: number; call_outcome?: string;
}) {
  try {
    const supabase = await createClient()
    const { data: touch, error } = await supabase
      .from('outreach_touches')
      .insert({
        lead_id: data.lead_id,
        channel: data.channel,
        step_number: data.step,
        message: data.message,
        status: 'sent',
        campaign_id: data.campaign_id,
        follow_up_date: data.follow_up_date,
        is_call: data.is_call || false,
        call_duration: data.call_duration,
        call_outcome: data.call_outcome,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: touch, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to save touch' }
  }
}

export async function getTouches(campaignId?: string) {
  try {
    const supabase = await createClient()
    let query = supabase
      .from('outreach_touches')
      .select('*')
      .order('sent_at', { ascending: false })

    if (campaignId && campaignId !== 'all') {
      query = query.eq('campaign_id', campaignId)
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to get touches' }
  }
}

export async function updateTouch(id: string, data: { response?: string }) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('outreach_touches')
      .update({ response: data.response })
      .eq('id', id)

    if (error) return { error: error.message }
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update touch' }
  }
}

export async function deleteTouch(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('outreach_touches')
      .delete()
      .eq('id', id)

    if (error) return { error: error.message }
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to delete touch' }
  }
}

// ─── Campaigns ──────────────────────────────────────────────────────
export async function saveCampaign(data: {
  name: string; description: string; lead_ids: string[];
}) {
  try {
    const supabase = await createClient()
    const { data: campaign, error } = await supabase
      .from('outreach_campaigns')
      .insert({
        name: data.name,
        description: data.description,
        lead_ids: data.lead_ids,
        status: 'active',
      })
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    return { data: campaign, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to save campaign' }
  }
}

export async function getCampaigns() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to get campaigns' }
  }
}

// ─── Reached Status ─────────────────────────────────────────────────
export async function markReached(leadId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('outreach_reached')
      .upsert({ lead_id: leadId, reached_at: new Date().toISOString() })

    if (error) return { error: error.message }
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to mark reached' }
  }
}

export async function unmarkReached(leadId: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('outreach_reached')
      .delete()
      .eq('lead_id', leadId)

    if (error) return { error: error.message }
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to unmark reached' }
  }
}

export async function getReachedLeads() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('outreach_reached')
      .select('lead_id')

    if (error) return { data: null, error: error.message }
    return { data: data?.map((r) => r.lead_id) || [], error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to get reached leads' }
  }
}
