'use server'

import { createClient } from '@/lib/supabase/server'

interface CompanyFilters {
  status?: string
  search?: string
}

export async function getCompanies(filters?: CompanyFilters) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`company_name.ilike.%${filters.search}%,industry.ilike.%${filters.search}%`)
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

export async function getCompany(id: string) {
  try {
    const supabase = await createClient()

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (companyError) {
      return { data: null, error: companyError.message }
    }

    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', id)

    if (contactsError) {
      return { data: null, error: contactsError.message }
    }

    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (activitiesError) {
      return { data: null, error: activitiesError.message }
    }

    return {
      data: {
        ...company,
        contacts: contacts || [],
        activities: activities || []
      },
      error: null
    }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function createCompany(data: {
  company_name: string
  industry?: string
  website?: string
  phone?: string
  email?: string
  country?: string
  city?: string
  notes?: string
  firstContact?: {
    full_name: string
    email?: string
    phone?: string
    title?: string
    whatsapp?: string
    linkedin_url?: string
  }
}) {
  try {
    const supabase = await createClient()

    const { firstContact, ...companyData } = data

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        ...companyData,
        status: 'prospect',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (companyError) {
      return { data: null, error: companyError.message }
    }

    if (firstContact) {
      const { error: contactError } = await supabase
        .from('contacts')
        .insert({
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
        return { data: null, error: contactError.message }
      }
    }

    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        company_id: company.id,
        activity_type: 'company_created',
        title: 'Company created',
        description: `New company "${company.company_name}" added to CRM`,
        created_at: new Date().toISOString()
      })

    if (activityError) {
      console.error('Failed to log activity:', activityError)
    }

    return { data: company, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function updateCompany(id: string, data: {
  company_name?: string
  industry?: string
  website?: string
  phone?: string
  email?: string
  country?: string
  city?: string
  employee_count?: number
  notes?: string
}) {
  try {
    const supabase = await createClient()

    const { data: company, error } = await supabase
      .from('companies')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: company, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function updateCompanyStatus(id: string, status: string) {
  try {
    const supabase = await createClient()

    const { data: company, error: updateError } = await supabase
      .from('companies')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return { data: null, error: updateError.message }
    }

    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        company_id: id,
        activity_type: 'status_changed',
        title: 'Company status updated',
        description: `Status changed to "${status}"`,
        metadata: { new_status: status },
        created_at: new Date().toISOString()
      })

    if (activityError) {
      console.error('Failed to log activity:', activityError)
    }

    return { data: company, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}
