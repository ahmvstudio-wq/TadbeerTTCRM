'use server'

import { createClient } from '@supabase/supabase-js'
import { generateOutreachMessage } from '@/lib/ai/outreach-generator'
import { requireAuth } from '@/lib/auth-guard'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

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
      query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
      const limit = Math.min(Math.max(1, filters.limit), 500)
      const offset = Math.max(0, filters.offset || 0)
      query = query.range(offset, offset + limit - 1)
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

    if (companyError) {
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

    return {
      data: {
        ...company,
        contacts: company.contacts || [],
        activities: (company.activities || []).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 100),
        preparations: [],
        follow_ups: (company.follow_ups || []).sort((a: any, b: any) => String(a.due_date || '').localeCompare(String(b.due_date || ''))),
        meetings: (company.meetings || []).sort((a: any, b: any) => String(b.meeting_date || '').localeCompare(String(a.meeting_date || ''))),
        opportunities: (company.opportunities || []).sort((a: any, b: any) => String(b.created_at || '').localeCompare(String(a.created_at || ''))),
        outreach_touches: []
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function createCompany(data: {
  company_name: string; industry?: string; website?: string; phone?: string; email?: string; country?: string; city?: string; notes?: string; employee_count?: number;
  instagram_url?: string; research_notes?: string; lead_source?: string;
  firstContact?: { full_name: string; email?: string; phone?: string; title?: string; whatsapp?: string; linkedin_url?: string; instagram_url?: string; }
}) {
  try {
    await requireAuth()
    const { firstContact, instagram_url, research_notes, lead_source, ...companyData } = data

    // Gracefully fold extra fields into notes if columns don't exist
    let enrichedNotes = companyData.notes || ''
    if (instagram_url) enrichedNotes += `\nInstagram: ${instagram_url}`
    if (research_notes) enrichedNotes += `\n\nResearch Notes:\n${research_notes}`

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        ...companyData,
        notes: enrichedNotes || undefined,
        lead_type: lead_source || companyData.notes ? undefined : 'new_lead',
        status: 'prospect',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (companyError) return { data: null, error: companyError.message }

    if (firstContact && firstContact.full_name) {
      const { error: contactError } = await supabase.from('contacts').insert({
        company_id: company.id,
        full_name: firstContact.full_name,
        email: firstContact.email,
        phone: firstContact.phone,
        title: firstContact.title,
        whatsapp: firstContact.whatsapp,
        linkedin_url: firstContact.linkedin_url,
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

    // Auto-generate research-grounded outreach message draft if research notes provided
    if (enrichedNotes || research_notes) {
      generateOutreachMessage(company.id).catch(err => console.error("Auto draft error:", err))
    }

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
    return { data: company, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function updateCompanyStatus(id: string, status: string) {
  try {
    await requireAuth()
    const { data: company, error: updateError } = await supabase
      .from('companies')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (updateError) return { data: null, error: updateError.message }

    await supabase.from('activities').insert({
      company_id: id,
      activity_type: 'status_changed',
      title: 'Company status updated',
      description: `Status changed to "${status}"`,
      metadata: { new_status: status },
      created_at: new Date().toISOString()
    })

    return { data: company, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function updateCompanyLeadType(id: string, lead_type: string) {
  try {
    await requireAuth()
    const { data: company, error } = await supabase
      .from('companies')
      .update({ lead_type, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: error.message }
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

    return { data: company, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function upsertCompanyContact(companyId: string, contactData: { id?: string; full_name: string; title?: string; email?: string; phone?: string; whatsapp?: string; linkedin_url?: string; is_primary?: boolean }) {
  try {
    await requireAuth()
    if (contactData.id) {
      const { data, error } = await supabase
        .from('contacts')
        .update({ ...contactData })
        .eq('id', contactData.id)
        .select()
        .single()

      if (error) return { data: null, error: error.message }
      return { data, error: null }
    } else {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          company_id: companyId,
          ...contactData,
          is_primary: contactData.is_primary ?? true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) return { data: null, error: error.message }
      return { data, error: null }
    }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}
