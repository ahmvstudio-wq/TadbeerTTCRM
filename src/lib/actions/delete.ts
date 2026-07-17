'use server'

import { createClient } from '@/lib/supabase/server'

export async function deleteCompany(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('companies').delete().eq('id', id)
    if (error) return { error: error.message }
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function deleteContact(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) return { error: error.message }
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function deleteFollowUp(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('follow_ups').delete().eq('id', id)
    if (error) return { error: error.message }
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function deleteMeeting(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('meetings').delete().eq('id', id)
    if (error) return { error: error.message }
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function deleteOpportunity(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('opportunities').delete().eq('id', id)
    if (error) return { error: error.message }
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function deleteCall(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('calls').delete().eq('id', id)
    if (error) return { error: error.message }
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function deleteActivity(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (error) return { error: error.message }
    return { error: null }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}
