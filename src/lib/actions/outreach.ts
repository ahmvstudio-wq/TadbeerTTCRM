'use server'

import { createClient } from '@/lib/supabase/server'

export async function getOrCreateDailySession(userId: string) {
  try {
    const supabase = await createClient()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const { data: existingSession, error: fetchError } = await supabase
      .from('daily_outreach_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_date', todayStr)
      .single()

    if (!fetchError && existingSession) {
      return { data: existingSession, error: null }
    }

    const { data: newSession, error: createError } = await supabase
      .from('daily_outreach_sessions')
      .insert({
        user_id: userId,
        session_date: todayStr,
        target_count: 10,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      return { data: null, error: createError.message }
    }

    return { data: newSession, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function getDailyOutreachItems(sessionId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('daily_outreach_items')
      .select(`
        *,
        companies (*),
        outreach_preparations (*),
        contacts (*)
      `)
      .eq('session_id', sessionId)
      .order('position', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function addToOutreach(sessionId: string, companyId: string, position?: number) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('daily_outreach_items')
      .insert({
        session_id: sessionId,
        company_id: companyId,
        position: position || 0,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function removeFromOutreach(sessionId: string, companyId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('daily_outreach_items')
      .delete()
      .eq('session_id', sessionId)
      .eq('company_id', companyId)

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function updateOutreachItemStatus(itemId: string, status: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('daily_outreach_items')
      .update({ status })
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function createOutreachPreparation(data: {
  company_id: string
  contact_id?: string
  service_line_id?: string
  use_case_summary: string
  personalization?: string
  outreach_channel: string
  message_body?: string
}) {
  try {
    const supabase = await createClient()

    const { data: prep, error } = await supabase
      .from('outreach_preparations')
      .insert({
        ...data,
        status: 'ready',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: prep, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function markOutreachSent(preparationId: string) {
  try {
    const supabase = await createClient()

    const { error: prepUpdateError } = await supabase
      .from('outreach_preparations')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', preparationId)

    if (prepUpdateError) {
      return { data: null, error: prepUpdateError.message }
    }

    return { data: { success: true }, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}
