'use server'

import { generateOutreachMessage } from '@/lib/ai/outreach-generator'
import { requireAuth } from '@/lib/auth-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/config'
import { isValidLinkedInUrl } from '@/lib/utils'
import {
  mapToDbCompanyStatus,
  mapToDbPipelineStage,
  mapToDbLeadStatus,
  mapToOutreachStatus,
  getUnifiedStatus
} from '@/lib/constants/statuses'
import { revalidatePath } from 'next/cache'

const supabase = getSupabaseAdminClient()

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


interface CompanyFilters {
  status?: string
  search?: string
  limit?: number
  offset?: number
}

// Helper to sanitize search strings for PostgREST filters
function sanitizePostgrestSearch(term: string): string {
  return term.replace(/[%_,()]/g, ' ').trim()
}

export async function getCompanies(filters?: CompanyFilters) {
  try {
    await requireAuth()
    
    let query = supabase
      .from('companies')
      .select('*, contacts(*)')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      const dbStatus = mapToDbCompanyStatus(filters.status)
      const pStage = mapToDbPipelineStage(filters.status)
      if (pStage && pStage !== 'New' && pStage !== 'Contacted') {
        query = query.or(`status.eq.${filters.status},pipeline_stage.ilike.%${pStage}%`)
      } else {
        query = query.or(`status.eq.${filters.status},status.eq.${dbStatus}`)
      }
    }

    if (filters?.limit) {
      const limit = Math.min(Math.max(1, filters.limit), 500)
      const offset = Math.max(0, filters.offset || 0)
      query = query.range(offset, offset + limit - 1)
    } else {
      query = query.range(0, 4999)
    }

    if (filters?.search) {
      const term = sanitizePostgrestSearch(filters.search)
      if (term) {
        const { data: matchedContacts } = await supabase
          .from('contacts')
          .select('company_id')
          .ilike('full_name', `%${term}%`)
        
        const companyIds = (matchedContacts || [])
          .map(c => c.company_id)
          .filter(Boolean)
          .map(id => String(id).replace(/[^a-zA-Z0-9-]/g, ''))
        
        if (companyIds.length > 0) {
          query = query.or(`company_name.ilike.%${term}%,industry.ilike.%${term}%,id.in.(${companyIds.join(',')})`)
        } else {
          query = query.or(`company_name.ilike.%${term}%,industry.ilike.%${term}%`)
        }
      }
    }

    const { data, error } = await query
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function getCompany(id: string) {
  try {
    await requireAuth()
    const cleanId = String(id || '').trim()
    if (!cleanId) return { data: null, error: 'Invalid Company ID' }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select(`
        *,
        contacts (*),
        activities (*),
        follow_ups (*),
        meetings (*),
        opportunities (*)
      `)
      .eq('id', cleanId)
      .single()

    if (companyError || !company) {
      const { data: fallbackCo, error: fbErr } = await supabase
        .from('companies')
        .select('*')
        .eq('id', cleanId)
        .single()

      if (fbErr || !fallbackCo) return { data: null, error: fbErr?.message || 'Company not found' }
      return {
        data: {
          ...fallbackCo,
          contacts: [],
          activities: [],
          preparations: [],
          follow_ups: [],
          meetings: [],
          opportunities: [],
          outreach_touches: []
        },
        error: null
      }
    }

    // Also fetch outreach_touches and outreach_preparations
    const [{ data: touches }, { data: preps }] = await Promise.all([
      supabase.from('outreach_touches').select('*').eq('lead_id', cleanId).order('sent_at', { ascending: false }),
      supabase.from('outreach_preparations').select('*').eq('company_id', cleanId).order('updated_at', { ascending: false })
    ])

    return {
      data: {
        ...company,
        contacts: company.contacts || [],
        activities: (company.activities || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 100),
        preparations: preps || [],
        follow_ups: (company.follow_ups || []).sort((a: any, b: any) => String(a.due_date || '').localeCompare(String(b.due_date || ''))),
        meetings: (company.meetings || []).sort((a: any, b: any) => String(b.meeting_date || '').localeCompare(String(a.meeting_date || ''))),
        opportunities: (company.opportunities || []).sort((a: any, b: any) => String(b.created_at || '').localeCompare(String(a.created_at || ''))),
        outreach_touches: touches || []
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function createCompany(data: {
  company_name: string; industry?: string; website?: string; linkedin_url?: string; phone?: string; email?: string; country?: string; city?: string; notes?: string; employee_count?: number;
  instagram_url?: string; research_notes?: string; lead_source?: string; lead_type?: string;
  firstContact?: { full_name: string; email?: string; phone?: string; title?: string; whatsapp?: string; linkedin_url?: string; instagram_url?: string; }
}) {
  try {
    await requireAuth()
    const { firstContact, instagram_url, research_notes, lead_source, lead_type, ...companyData } = data

    let enrichedNotes = companyData.notes || ''
    if (instagram_url) enrichedNotes += `\nInstagram: ${instagram_url}`
    if (research_notes) enrichedNotes += `\n\nResearch Notes:\n${research_notes}`

    const cleanCompanyLi = isValidLinkedInUrl(companyData.linkedin_url) ? companyData.linkedin_url!.trim() : null
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        ...companyData,
        linkedin_url: cleanCompanyLi,
        lead_source: lead_source || 'Direct CRM',
        lead_type: lead_type || 'Cold',
        notes: enrichedNotes || undefined,
        status: 'prospect',
        pipeline_stage: 'New',
        lead_status: 'New',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (companyError || !company) return { data: null, error: companyError?.message || 'Failed to create company' }

    if (firstContact && firstContact.full_name) {
      const cleanContactLi = isValidLinkedInUrl(firstContact.linkedin_url) ? firstContact.linkedin_url!.trim() : null
      const { error: contactError } = await supabase.from('contacts').insert({
        company_id: company.id,
        full_name: firstContact.full_name,
        email: firstContact.email || null,
        phone: firstContact.phone || null,
        title: firstContact.title || null,
        whatsapp: firstContact.whatsapp || firstContact.phone || null,
        linkedin_url: cleanContactLi,
        is_primary: true,
        created_at: new Date().toISOString()
      })
      if (contactError) {
        console.warn('First contact creation error:', contactError.message)
      }
    }

    await supabase.from('activities').insert({
      company_id: company.id,
      activity_type: 'company_created',
      title: 'Company created',
      description: `New company "${company.company_name}" added to CRM`,
      created_at: new Date().toISOString()
    })

    // Auto-generate pre-staged sequence and warm draft
    generateOutreachMessage(company.id).catch(err => console.error("Auto draft error:", err))

    revalidateAllCRMPages()
    return { data: company, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function updateCompany(id: string, data: { company_name?: string; industry?: string; website?: string; phone?: string; email?: string; country?: string; city?: string; employee_count?: number; notes?: string }) {
  try {
    await requireAuth()
    const { data: company, error } = await supabase
      .from('companies')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    revalidateAllCRMPages()
    return { data: company, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export interface UpdateCompanyStatusOptions {
  followUpDays?: number | null;
  followUpDate?: string | null;
  followUpNote?: string | null;
  followUpChannel?: string | null;
}

export async function updateCompanyStatus(
  id: string,
  status: string,
  options?: UpdateCompanyStatusOptions
) {
  try {
    await requireAuth()

    const cleanId = String(id || '').replace(/^staged-/, '').trim()
    const dbStatus = mapToDbCompanyStatus(status)
    const pipelineStage = mapToDbPipelineStage(status)
    const dbLeadStatus = mapToDbLeadStatus(status)
    const actStatus = mapToOutreachStatus(status)
    const unified = getUnifiedStatus(status)

    const { data: company, error: updateError } = await supabase
      .from('companies')
      .update({
        status: dbStatus,
        pipeline_stage: pipelineStage,
        lead_status: dbLeadStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', cleanId)
      .select()
      .single()

    if (updateError) return { data: null, error: updateError.message }

    // Sync latest outreach activity if exists, or insert new one so ig-dm has matching record
    const { data: acts } = await supabase
      .from('activities')
      .select('id, description, activity_type')
      .eq('company_id', cleanId)
      .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach', 'outreach_sent'])
      .order('created_at', { ascending: false })
      .limit(1)

    if (acts && acts.length > 0) {
      const act = acts[0]
      let p: any = {}
      try { p = act.description ? JSON.parse(act.description) : {} } catch {}
      const newP = { ...p, status: actStatus, updated_at: new Date().toISOString() }
      await supabase.from('activities').update({ description: JSON.stringify(newP) }).eq('id', act.id)
    } else {
      await supabase.from('activities').insert({
        company_id: cleanId,
        activity_type: 'call_made',
        title: `Outreach Status — ${actStatus}`,
        description: JSON.stringify({
          channel: options?.followUpChannel || 'cold_call',
          status: actStatus,
          updated_at: new Date().toISOString()
        }),
        created_at: new Date().toISOString()
      })
    }

    // Schedule follow-up if requested
    let scheduledDueDate: string | null = null
    if (options?.followUpDate) {
      scheduledDueDate = options.followUpDate
    } else if (typeof options?.followUpDays === 'number' && options.followUpDays > 0) {
      const d = new Date()
      d.setDate(d.getDate() + options.followUpDays)
      scheduledDueDate = d.toISOString().split('T')[0]
    }

    if (scheduledDueDate) {
      const followUpSubject = options?.followUpNote || `Follow up with ${company.company_name} (${unified.label})`
      await supabase.from('follow_ups').insert({
        company_id: cleanId,
        due_date: scheduledDueDate,
        subject: followUpSubject,
        description: `Scheduled during status update to ${unified.label}`,
        channel: options?.followUpChannel || 'call',
        status: 'pending',
        created_at: new Date().toISOString()
      })

      // Log follow-up scheduled activity
      await supabase.from('activities').insert({
        company_id: cleanId,
        activity_type: 'note',
        title: `Follow-up Scheduled — Due ${scheduledDueDate}`,
        description: JSON.stringify({
          status: unified.id,
          status_label: unified.label,
          due_date: scheduledDueDate,
          subject: followUpSubject,
          channel: options?.followUpChannel || 'call',
          created_at: new Date().toISOString()
        }),
        created_at: new Date().toISOString()
      })
    }

    // If marked as called, follow_up_sent, or meeting_booked, close existing pending follow-ups
    if (['called', 'follow_up_sent', 'meeting_booked'].includes(actStatus)) {
      await supabase
        .from('follow_ups')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('company_id', cleanId)
        .eq('status', 'pending')
    }

    // Audit status change
    await supabase.from('activities').insert({
      company_id: cleanId,
      activity_type: 'status_changed',
      title: `Status: ${unified.label}`,
      description: scheduledDueDate 
        ? `Status updated to "${unified.label}" • Follow-up scheduled for ${scheduledDueDate}`
        : `Status updated to "${unified.label}" (${pipelineStage})`,
      metadata: { 
        new_status: dbStatus, 
        pipeline_stage: pipelineStage, 
        lead_status: dbLeadStatus,
        outreach_status: actStatus,
        scheduled_follow_up: scheduledDueDate 
      },
      created_at: new Date().toISOString()
    })

    revalidateAllCRMPages()
    return { data: { company, scheduledDueDate }, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function updateLeadStatusAndScheduleFollowUp(params: {
  companyId: string;
  activityId?: string | null;
  status: string;
  followUpDays?: number | null;
  followUpDate?: string | null;
  followUpNote?: string | null;
  followUpChannel?: string | null;
}) {
  return updateCompanyStatus(params.companyId, params.status, {
    followUpDays: params.followUpDays,
    followUpDate: params.followUpDate,
    followUpNote: params.followUpNote,
    followUpChannel: params.followUpChannel,
  })
}

export async function updateCompanyLeadType(id: string, lead_type: string) {
  try {
    await requireAuth()
    const updatePayload: any = { lead_type, updated_at: new Date().toISOString() }
    if (lead_type === 'Dormant') {
      updatePayload.lead_folder = 'Dormant'
      updatePayload.category = 'dormant'
      updatePayload.status = 'lost'
      updatePayload.pipeline_stage = 'Lost'
    } else {
      updatePayload.lead_folder = 'Active'
      if (updatePayload.status === 'lost') {
        updatePayload.status = 'prospect'
        updatePayload.pipeline_stage = 'New'
      }
    }
    const { data: company, error } = await supabase
      .from('companies')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    revalidateAllCRMPages()
    return { data: company, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function reactivateCompany(id: string) {
  try {
    await requireAuth()
    const { data: company, error } = await supabase
      .from('companies')
      .update({
        status: 'prospect',
        pipeline_stage: 'New',
        lead_type: 'Cold',
        lead_folder: 'Active',
        category: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
    revalidateAllCRMPages()
    return { data: company, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function addCompanyActivity(company_id: string, title: string, description?: string, activity_type = 'note_added') {
  try {
    await requireAuth()
    const { data: activity, error } = await supabase.from('activities').insert({
      company_id,
      activity_type,
      title,
      description: description || '',
      created_at: new Date().toISOString()
    }).select().single()

    if (error) return { data: null, error: error.message }
    revalidateAllCRMPages()
    return { data: activity, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function triggerDraftGeneration(prospectId: string) {
  await requireAuth()
  return await generateOutreachMessage(prospectId)
}

export async function triggerBatchDraftGeneration() {
  await requireAuth()
  const { generateForNewProspects } = await import('@/lib/ai/outreach-generator')
  return await generateForNewProspects()
}

export async function assignCompanyLead(id: string, assigned_to: string | null) {
  try {
    await requireAuth()
    const { data: company, error } = await supabase
      .from('companies')
      .update({ assigned_to, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }

    await supabase.from('activities').insert({
      company_id: id,
      activity_type: 'lead_assigned',
      title: 'Lead Assignment Updated',
      description: assigned_to ? `Assigned to ${assigned_to}` : 'Unassigned (Available)',
      metadata: { assigned_to },
      created_at: new Date().toISOString()
    })

    revalidateAllCRMPages()
    return { data: company, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function upsertCompanyContact(companyId: string, contactData: { id?: string; full_name: string; title?: string; email?: string; phone?: string; whatsapp?: string; linkedin_url?: string; is_primary?: boolean }) {
  try {
    await requireAuth()
    const sanitizedContact = {
      ...contactData,
      linkedin_url: isValidLinkedInUrl(contactData.linkedin_url) ? contactData.linkedin_url!.trim() : null
    }
    if (contactData.id) {
      const { data, error } = await supabase
        .from('contacts')
        .update({ ...sanitizedContact })
        .eq('id', contactData.id)
        .select()
        .single()

      if (error) return { data: null, error: error.message }
      revalidateAllCRMPages()
      return { data, error: null }
    } else {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          company_id: companyId,
          ...sanitizedContact,
          is_primary: contactData.is_primary ?? true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) return { data: null, error: error.message }
      revalidateAllCRMPages()
      return { data, error: null }
    }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function saveCompanyMeetingDocsAndSDRSheet(
  companyId: string,
  data: {
    meeting_docs?: any[]
    sdr_sheet?: any
  }
) {
  try {
    await requireAuth()
    const cleanId = String(companyId || '').replace(/^staged-/, '').trim()

    // 1. Fetch current research_json
    const { data: co, error: fetchErr } = await supabase
      .from('companies')
      .select('research_json, notes')
      .eq('id', cleanId)
      .single()

    if (fetchErr) return { data: null, error: fetchErr.message }

    const currentRJson = (co?.research_json && typeof co.research_json === 'object') ? co.research_json : {}
    const updatedRJson = {
      ...currentRJson,
      ...(data.meeting_docs !== undefined ? { meeting_docs: data.meeting_docs } : {}),
      ...(data.sdr_sheet !== undefined ? { sdr_sheet: data.sdr_sheet } : {})
    }

    const { data: updatedCo, error: updateErr } = await supabase
      .from('companies')
      .update({
        research_json: updatedRJson,
        updated_at: new Date().toISOString()
      })
      .eq('id', cleanId)
      .select()
      .single()

    if (updateErr) return { data: null, error: updateErr.message }

    // 2. Log activity timeline item
    const docsCount = Array.isArray(data.meeting_docs) ? data.meeting_docs.length : (updatedRJson.meeting_docs?.length || 0)
    await supabase.from('activities').insert({
      company_id: cleanId,
      activity_type: 'meeting_docs_updated',
      title: 'SDR Meeting Docs & Context Sheet Updated',
      description: `Updated SDR pre-call sheet and meeting documents (${docsCount} doc${docsCount !== 1 ? 's' : ''} attached)`,
      created_at: new Date().toISOString()
    })

    revalidateAllCRMPages()
    return { data: updatedCo, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Failed to save meeting docs' }
  }
}

