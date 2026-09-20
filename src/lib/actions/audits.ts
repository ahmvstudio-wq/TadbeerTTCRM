'use server'

import { requireAuth } from '@/lib/auth-guard'
import { getSupabaseAdminClient } from '@/lib/supabase/config'
import { revalidatePath } from 'next/cache'

const supabase = getSupabaseAdminClient()

function revalidateAllCRMPages() {
  try {
    revalidatePath('/audits')
    revalidatePath('/dashboard')
    revalidatePath('/outreach')
    revalidatePath('/daily-cadence')
    revalidatePath('/prospects')
    revalidatePath('/pipeline')
    revalidatePath('/meetings')
  } catch (e) {
    // ignore in non-request contexts
  }
}

export type AuditType =
  | 'Business / Operations'
  | 'Website'
  | 'Sales'
  | 'Technology / Automation'
  | 'AI'
  | 'ERP'
  | 'Other';

export type AuditStatus = 'new' | 'in_progress' | 'completed';

export interface AuditPdf {
  name?: string;
  url?: string;
  data?: string; // base64 data url
  size?: string;
  uploaded_at?: string;
}

export interface AuditRecord {
  id: string;
  company_id: string | null;
  business_name: string;
  website?: string;
  social_url?: string;
  contact_person?: string;
  contact_details?: string;
  problem_statement: string;
  audit_type: AuditType;
  additional_notes?: string;
  status: AuditStatus;
  audit_pdf?: AuditPdf | null;
  date_added: string;
  created_at: string;
  updated_at: string;
  companies?: {
    id: string;
    company_name: string;
    industry?: string | null;
    status?: string;
  } | null;
}

export interface CreateAuditInput {
  business_name: string;
  company_id?: string | null;
  website?: string;
  social_url?: string;
  contact_person?: string;
  contact_details?: string;
  problem_statement?: string;
  audit_type?: AuditType;
  additional_notes?: string;
  status?: AuditStatus;
  audit_pdf?: AuditPdf | null;
  date_added?: string;
}

function getCompanyFromRow(row: any) {
  if (!row?.companies) return null
  return Array.isArray(row.companies) ? (row.companies[0] || null) : row.companies
}

// ─── Fetch All Audits ────────────────────────────────────────────────────────
export async function getAudits(): Promise<{ data: AuditRecord[]; error: string | null }> {
  try {
    await requireAuth()

    const { data: activities, error } = await supabase
      .from('activities')
      .select('id, company_id, title, description, metadata, created_at, companies(id, company_name, industry, status)')
      .eq('activity_type', 'note')
      .contains('metadata', { is_audit: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getAudits query error:', error.message)
      return { data: [], error: error.message }
    }

    const audits: AuditRecord[] = (activities || []).map((row: any) => {
      const meta = row.metadata || {}
      const co = getCompanyFromRow(row)
      return {
        id: row.id,
        company_id: row.company_id || meta.company_id || null,
        business_name: meta.business_name || co?.company_name || row.title?.replace(/^Audit:\s*/i, '') || 'Untitled Business',
        website: meta.website || '',
        social_url: meta.social_url || '',
        contact_person: meta.contact_person || '',
        contact_details: meta.contact_details || '',
        problem_statement: meta.problem_statement || row.description || '',
        audit_type: (meta.audit_type || 'Business / Operations') as AuditType,
        additional_notes: meta.additional_notes || '',
        status: (meta.status || 'new') as AuditStatus,
        audit_pdf: meta.audit_pdf || null,
        date_added: meta.date_added || row.created_at,
        created_at: row.created_at,
        updated_at: meta.updated_at || row.created_at,
        companies: co || null
      }
    })

    // Sort by date_added descending
    audits.sort((a, b) => new Date(b.date_added || b.created_at).getTime() - new Date(a.date_added || a.created_at).getTime())

    return { data: audits, error: null }
  } catch (err) {
    console.error('getAudits error:', err)
    return { data: [], error: err instanceof Error ? err.message : 'Failed to fetch audits' }
  }
}

// ─── Fetch Single Audit ──────────────────────────────────────────────────────
export async function getAudit(id: string): Promise<{ data: AuditRecord | null; error: string | null }> {
  try {
    await requireAuth()

    const { data: row, error } = await supabase
      .from('activities')
      .select('id, company_id, title, description, metadata, created_at, companies(id, company_name, industry, status)')
      .eq('id', id)
      .single()

    if (error || !row) {
      return { data: null, error: error?.message || 'Audit not found' }
    }

    const meta = row.metadata || {}
    const co = getCompanyFromRow(row)
    const audit: AuditRecord = {
      id: row.id,
      company_id: row.company_id || meta.company_id || null,
      business_name: meta.business_name || co?.company_name || row.title?.replace(/^Audit:\s*/i, '') || 'Untitled Business',
      website: meta.website || '',
      social_url: meta.social_url || '',
      contact_person: meta.contact_person || '',
      contact_details: meta.contact_details || '',
      problem_statement: meta.problem_statement || row.description || '',
      audit_type: (meta.audit_type || 'Business / Operations') as AuditType,
      additional_notes: meta.additional_notes || '',
      status: (meta.status || 'new') as AuditStatus,
      audit_pdf: meta.audit_pdf || null,
      date_added: meta.date_added || row.created_at,
      created_at: row.created_at,
      updated_at: meta.updated_at || row.created_at,
      companies: co || null
    }

    return { data: audit, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to fetch audit' }
  }
}

// ─── Create New Audit ────────────────────────────────────────────────────────
export async function createAudit(input: CreateAuditInput): Promise<{ data: AuditRecord | null; error: string | null }> {
  try {
    await requireAuth()

    const businessName = (input.business_name || '').trim()
    if (!businessName) {
      return { data: null, error: 'Business name is required' }
    }

    let resolvedCompanyId = input.company_id || null

    // If company_id wasn't explicitly provided, check if a company already exists in the CRM by name
    if (!resolvedCompanyId) {
      const { data: existingCo } = await supabase
        .from('companies')
        .select('id, company_name')
        .ilike('company_name', businessName)
        .limit(1)

      if (existingCo && existingCo.length > 0) {
        resolvedCompanyId = existingCo[0].id
      }
    }

    const now = new Date().toISOString()
    const metadata = {
      is_audit: true,
      business_name: businessName,
      company_id: resolvedCompanyId,
      website: (input.website || '').trim(),
      social_url: (input.social_url || '').trim(),
      contact_person: (input.contact_person || '').trim(),
      contact_details: (input.contact_details || '').trim(),
      problem_statement: (input.problem_statement || '').trim(),
      audit_type: input.audit_type || 'Business / Operations',
      additional_notes: (input.additional_notes || '').trim(),
      status: input.status || 'new',
      audit_pdf: input.audit_pdf || null,
      date_added: input.date_added || now,
      updated_at: now
    }

    const { data: activity, error } = await supabase
      .from('activities')
      .insert({
        company_id: resolvedCompanyId,
        activity_type: 'note',
        title: `Audit: ${businessName}`,
        description: metadata.problem_statement || `Audit created for ${businessName}`,
        metadata
      })
      .select('id, company_id, title, description, metadata, created_at, companies(id, company_name, industry, status)')
      .single()

    if (error || !activity) {
      return { data: null, error: error?.message || 'Failed to create audit' }
    }

    revalidateAllCRMPages()

    const createdAudit: AuditRecord = {
      id: activity.id,
      company_id: resolvedCompanyId,
      business_name: businessName,
      website: metadata.website,
      social_url: metadata.social_url,
      contact_person: metadata.contact_person,
      contact_details: metadata.contact_details,
      problem_statement: metadata.problem_statement,
      audit_type: metadata.audit_type as AuditType,
      additional_notes: metadata.additional_notes,
      status: metadata.status as AuditStatus,
      audit_pdf: metadata.audit_pdf,
      date_added: metadata.date_added,
      created_at: activity.created_at,
      updated_at: now,
      companies: getCompanyFromRow(activity) || null
    }

    return { data: createdAudit, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Failed to create audit' }
  }
}

// ─── Update Audit Status ─────────────────────────────────────────────────────
export async function updateAuditStatus(id: string, status: AuditStatus): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireAuth()

    const { data: current, error: fetchErr } = await supabase
      .from('activities')
      .select('metadata')
      .eq('id', id)
      .single()

    if (fetchErr || !current) {
      return { success: false, error: fetchErr?.message || 'Audit not found' }
    }

    const now = new Date().toISOString()
    const updatedMeta = {
      ...(current.metadata || {}),
      status,
      updated_at: now
    }

    const { error } = await supabase
      .from('activities')
      .update({
        metadata: updatedMeta
      })
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidateAllCRMPages()
    return { success: true, error: null }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update status' }
  }
}

// ─── Update Audit Details ────────────────────────────────────────────────────
export async function updateAudit(id: string, input: Partial<CreateAuditInput>): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireAuth()

    const { data: current, error: fetchErr } = await supabase
      .from('activities')
      .select('company_id, metadata')
      .eq('id', id)
      .single()

    if (fetchErr || !current) {
      return { success: false, error: fetchErr?.message || 'Audit not found' }
    }

    const now = new Date().toISOString()
    const currentMeta = current.metadata || {}
    const updatedMeta = {
      ...currentMeta,
      ...(input.business_name !== undefined ? { business_name: input.business_name.trim() } : {}),
      ...(input.website !== undefined ? { website: input.website.trim() } : {}),
      ...(input.social_url !== undefined ? { social_url: input.social_url.trim() } : {}),
      ...(input.contact_person !== undefined ? { contact_person: input.contact_person.trim() } : {}),
      ...(input.contact_details !== undefined ? { contact_details: input.contact_details.trim() } : {}),
      ...(input.problem_statement !== undefined ? { problem_statement: input.problem_statement.trim() } : {}),
      ...(input.audit_type !== undefined ? { audit_type: input.audit_type } : {}),
      ...(input.additional_notes !== undefined ? { additional_notes: input.additional_notes.trim() } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.audit_pdf !== undefined ? { audit_pdf: input.audit_pdf } : {}),
      updated_at: now
    }

    const updatePayload: any = {
      metadata: updatedMeta
    }

    if (input.business_name) {
      updatePayload.title = `Audit: ${input.business_name.trim()}`
    }
    if (input.problem_statement) {
      updatePayload.description = input.problem_statement.trim()
    }
    if (input.company_id !== undefined) {
      updatePayload.company_id = input.company_id
      updatedMeta.company_id = input.company_id
    }

    const { error } = await supabase
      .from('activities')
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidateAllCRMPages()
    return { success: true, error: null }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update audit' }
  }
}

// ─── Attach / Upload Audit PDF ───────────────────────────────────────────────
export async function attachAuditPdf(id: string, pdf: AuditPdf | null): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireAuth()

    const { data: current, error: fetchErr } = await supabase
      .from('activities')
      .select('metadata')
      .eq('id', id)
      .single()

    if (fetchErr || !current) {
      return { success: false, error: fetchErr?.message || 'Audit not found' }
    }

    const now = new Date().toISOString()
    const updatedMeta = {
      ...(current.metadata || {}),
      audit_pdf: pdf ? { ...pdf, uploaded_at: now } : null,
      updated_at: now
    }

    const { error } = await supabase
      .from('activities')
      .update({
        metadata: updatedMeta
      })
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidateAllCRMPages()
    return { success: true, error: null }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to attach PDF' }
  }
}

// ─── Delete Audit ────────────────────────────────────────────────────────────
export async function deleteAudit(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    await requireAuth()

    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }

    revalidateAllCRMPages()
    return { success: true, error: null }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to delete audit' }
  }
}

// ─── Get Pending Audits Count ────────────────────────────────────────────────
export async function getPendingAuditsCount(): Promise<number> {
  try {
    const { data: activities } = await supabase
      .from('activities')
      .select('metadata')
      .eq('activity_type', 'note')
      .contains('metadata', { is_audit: true })

    if (!activities) return 0
    const pending = activities.filter((a: any) => {
      const st = a.metadata?.status
      return st !== 'completed'
    })
    return pending.length
  } catch {
    return 0
  }
}
