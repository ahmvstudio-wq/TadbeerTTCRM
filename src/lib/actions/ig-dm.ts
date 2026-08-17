'use server'

import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth-guard'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

import {
  type OutreachChannel,
  type OutreachStatus,
  type OutreachTemplate,
  type OutreachLead,
  CHANNEL_CONFIG,
  STATUS_CONFIG,
  TEMPLATE_LABELS
} from "../types/outreach"

function getValidActivityType(channel: string): string {
  if (channel === 'email') return 'email_sent';
  if (channel === 'whatsapp') return 'whatsapp_sent';
  return 'call_made';
}

// ─── Log outreach ─────────────────────────────────────────────────────────────
export async function logOutreach(data: {
  company_name: string
  industry: string
  channel: OutreachChannel
  handle: string
  template_used: OutreachTemplate
  phone?: string
  notes?: string
  outreach_date?: string
}) {
  try {
    await requireAuth()
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .ilike('company_name', data.company_name.trim())
      .limit(1)
      .maybeSingle()

    let companyId = existing?.id

    if (!companyId) {
      const { data: newCo, error: coErr } = await supabase
        .from('companies')
        .insert({
          company_name: data.company_name.trim(),
          industry: data.industry.trim() || 'General',
          phone: data.phone || null,
          status: 'prospect',
          notes: CHANNEL_CONFIG[data.channel].handleLabel + ': ' + data.handle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (coErr) return { data: null, error: coErr.message }
      companyId = newCo.id
    }

    const createdAt = data.outreach_date
      ? new Date(data.outreach_date).toISOString()
      : new Date().toISOString()

    const payload = {
      channel: data.channel,
      handle: data.handle,
      template_used: data.template_used,
      status: 'sent',
      prospect_reply: '',
      pain_point: '',
      call_opening_line: '',
      notes: data.notes || '',
    }

    const { data: activity, error: actErr } = await supabase
      .from('activities')
      .insert({
        company_id: companyId,
        activity_type: getValidActivityType(data.channel),
        title: CHANNEL_CONFIG[data.channel].label + ' — ' + TEMPLATE_LABELS[data.template_used],
        description: JSON.stringify(payload),
        created_at: createdAt,
      })
      .select()
      .single()

    if (actErr) return { data: null, error: actErr.message }
    return { data: { activityId: activity.id, companyId }, error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

// ─── Bulk log outreach for existing companies ──────────────────────────────
export async function bulkLogOutreach(data: {
  companies: { id: string; name: string; phone?: string | null }[]
  channel: OutreachChannel
  template_used: OutreachTemplate
  notes?: string
  outreach_date?: string
}) {
  try {
    await requireAuth()
    const createdAt = data.outreach_date
      ? new Date(data.outreach_date).toISOString()
      : new Date().toISOString()

    const records = data.companies.map(co => {
      const payload = {
        channel: data.channel,
        handle: co.phone || 'Existing Contact',
        template_used: data.template_used,
        status: 'sent',
        prospect_reply: '',
        pain_point: '',
        call_opening_line: '',
        notes: data.notes || '',
      }
      return {
        company_id: co.id,
        activity_type: getValidActivityType(data.channel),
        title: CHANNEL_CONFIG[data.channel].label + ' — ' + TEMPLATE_LABELS[data.template_used],
        description: JSON.stringify(payload),
        created_at: createdAt,
      }
    })

    const { error } = await supabase.from('activities').insert(records)
    if (error) return { error: error.message }
    return { error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

// ─── Update entry (any field) ────────────────────────────────────────────────
export async function updateOutreachEntry(activityId: string, update: {
  status?: OutreachStatus
  company_name?: string
  handle?: string
  channel?: OutreachChannel
  prospect_reply?: string
  pain_point?: string
  call_opening_line?: string
  notes?: string
  outreach_date?: string
}) {
  try {
    const { data: existing } = await supabase
      .from('activities')
      .select('company_id, description, created_at')
      .eq('id', activityId)
      .single()

    const current = existing?.description ? JSON.parse(existing.description) : {}
    const updated = { ...current, ...update }
    const channel: OutreachChannel = updated.channel || 'cold_call'
    const status: OutreachStatus = updated.status || 'sent'

    const dbPayload: any = {
      description: JSON.stringify(updated),
      title: (CHANNEL_CONFIG[channel]?.label || 'Outreach') + ' — ' + (STATUS_CONFIG[status]?.label || status),
      activity_type: getValidActivityType(channel),
    }

    if (update.outreach_date) {
      dbPayload.created_at = new Date(update.outreach_date + 'T12:00:00.000Z').toISOString()
    }

    const { error } = await supabase
      .from('activities')
      .update(dbPayload)
      .eq('id', activityId)

    if (error) return { error: error.message }

    // Sync company status & name in companies table if changed
    if (existing?.company_id) {
      const coUpdate: any = {}
      if (update.company_name) coUpdate.company_name = update.company_name
      
      let coStatus: string | null = null
      if (status === 'meeting_booked') coStatus = 'opportunity'
      else if (status === 'ready_for_call' || status === 'replied_interested') coStatus = 'lead'
      if (coStatus) coUpdate.status = coStatus

      if (Object.keys(coUpdate).length > 0) {
        coUpdate.updated_at = new Date().toISOString()
        await supabase.from('companies').update(coUpdate).eq('id', existing.company_id)
      }
    }

    return { error: null }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function updateOutreachStatus(activityId: string, update: {
  status: OutreachStatus
  prospect_reply?: string
  pain_point?: string
  call_opening_line?: string
  notes?: string
}) {
  return updateOutreachEntry(activityId, update)
}

// ─── Get all outreach leads ───────────────────────────────────────────────────
export async function getOutreachLeads(
  dateFilter: string = 'today',
  channelFilter?: OutreachChannel
) {
  try {
    let query = supabase
      .from('activities')
      .select('*, companies(id, company_name, industry, phone, notes)')
      .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach'])
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: false })

    if (dateFilter === 'today') {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      query = query.gte('created_at', today.toISOString())
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.gte('created_at', weekAgo.toISOString())
    } else if (dateFilter !== 'all' && dateFilter.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const startDate = new Date(dateFilter)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(dateFilter)
      endDate.setHours(23, 59, 59, 999)
      query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query.limit(300)
    if (error) return { data: null, error: error.message }

    let parsed = (data || []).map((act: any) => {
      let payload: any = {}
      try { payload = act.description ? JSON.parse(act.description) : {} } catch {}
      return {
        id: act.id,
        company_id: act.company_id,
        company_name: act.companies?.company_name || 'Unknown',
        industry: act.companies?.industry || 'Unknown',
        phone: act.companies?.phone || null,
        channel: (payload.channel || 'cold_call') as OutreachChannel,
        handle: payload.handle || '',
        template_used: (payload.template_used || 'custom') as OutreachTemplate,
        status: (payload.status || 'sent') as OutreachStatus,
        prospect_reply: payload.prospect_reply || '',
        pain_point: payload.pain_point || '',
        call_opening_line: payload.call_opening_line || '',
        notes: payload.notes || act.notes || '',
        sent_at: act.created_at,
        updated_at: act.updated_at || act.created_at,
      } as OutreachLead
    })

    if (channelFilter) {
      parsed = parsed.filter(l => l.channel === channelFilter)
    }

    return { data: parsed, error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

// ─── Also support legacy ig_dm activity_type entries ─────────────────────────
export async function getAllLeadsForPipeline(
  dateFilter: string = 'today',
  channelFilter?: OutreachChannel
) {
  try {
    let query = supabase
      .from('activities')
      .select('*, companies(id, company_name, industry, phone, notes)')
      .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach'])
      .order('created_at', { ascending: false })

    if (dateFilter === 'today') {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      query = query.gte('created_at', today.toISOString())
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
      query = query.gte('created_at', weekAgo.toISOString())
    } else if (dateFilter !== 'all' && dateFilter.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const startDate = new Date(`${dateFilter}T00:00:00.000Z`)
      const endDate = new Date(`${dateFilter}T23:59:59.999Z`)
      query = query.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString())
    }

    const { data, error } = await query.limit(300)
    if (error) return { data: null, error: error.message }

    let parsed = (data || []).map((act: any) => {
      let payload: any = {}
      try { payload = act.description ? JSON.parse(act.description) : {} } catch {}

      // Normalise legacy ig_dm records
      const channel: OutreachChannel = payload.channel || (act.activity_type === 'ig_dm' ? 'instagram_dm' : 'cold_call')
      let rawStatus = payload.status || payload.dm_status || 'sent'
      if (rawStatus === 'dm_sent') rawStatus = 'sent'
      const status: OutreachStatus = rawStatus as OutreachStatus
      const handle                    = payload.handle || payload.instagram_handle || ''

      return {
        id: act.id,
        company_id: act.company_id,
        company_name: act.companies?.company_name || 'Unknown',
        industry: act.companies?.industry || 'Unknown',
        phone: act.companies?.phone || null,
        channel,
        handle,
        template_used: (payload.template_used || 'custom') as OutreachTemplate,
        status,
        prospect_reply: payload.prospect_reply || '',
        pain_point: payload.pain_point || '',
        call_opening_line: payload.call_opening_line || '',
        notes: payload.notes || act.notes || '',
        sent_at: act.created_at,
        updated_at: act.updated_at || act.created_at,
      } as OutreachLead
    })

    let combined = parsed;
    if (channelFilter) {
      combined = combined.filter(l => l.channel === channelFilter)
    }

    return { data: combined, error: null }
  } catch (err) {
    return { data: null, error: (err as Error).message }
  }
}

export async function deleteOutreachLog(activityId: string) {
  try {
    const { error } = await supabase.from('activities').delete().eq('id', activityId)
    return { error: error?.message || null }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

export async function getOutreachCountsForMonth(year: number, month: number) {
  try {
    const startDate = new Date(year, month - 1, 1, 0, 0, 0).toISOString()
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

    const { data, error } = await supabase
      .from('activities')
      .select('created_at')
      .in('activity_type', ['call_made', 'email_sent', 'whatsapp_sent', 'ig_dm', 'outreach'])
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (error) return { data: {}, error: error.message }

    const counts: Record<string, number> = {}
    ;(data || []).forEach((act: any) => {
      if (act.created_at) {
        const day = act.created_at.split('T')[0]
        counts[day] = (counts[day] || 0) + 1
      }
    })

    return { data: counts, error: null }
  } catch (err) {
    return { data: {}, error: (err as Error).message }
  }
}

// ─── Import CSV Outreach ──────────────────────────────────────────────────────
export interface MappedCSVRow {
  // Supabase companies table
  company_name?: string
  industry?: string
  phone?: string
  website?: string
  email?: string
  linkedin_url?: string

  // Supabase contacts table
  contact_name?: string
  contact_title?: string
  contact_whatsapp?: string

  // Supabase activities table (Outreach Log)
  handle?: string
  channel?: OutreachChannel
  status?: OutreachStatus
  notes?: string
  prospect_reply?: string
  pain_point?: string
  call_opening_line?: string
  outreach_date?: string
}

export async function importCSVOutreach(data: {
  rows: MappedCSVRow[]
  defaultChannel: OutreachChannel
  defaultDate: string
  defaultTemplate?: OutreachTemplate
}) {
  try {
    if (!data.rows || data.rows.length === 0) {
      return { count: 0, error: "No rows provided for import" }
    }

    // 1. Gather all unique company names to resolve or create
    const companyNames = Array.from(
      new Set(
        data.rows
          .map((r, i) => r.company_name?.trim() || `Prospect #${i + 1}`)
          .filter(Boolean)
      )
    )

    // 2. Fetch existing companies matching these names in Supabase
    const { data: existingCos } = await supabase
      .from('companies')
      .select('id, company_name')
      .in('company_name', companyNames)

    const companyMap = new Map<string, string>()
    if (existingCos) {
      existingCos.forEach(co => {
        companyMap.set(co.company_name.toLowerCase().trim(), co.id)
      })
    }

    // 3. Find names that don't exist yet and insert into `companies` table
    const missingNames = companyNames.filter(
      name => !companyMap.has(name.toLowerCase().trim())
    )

    if (missingNames.length > 0) {
      const newCompaniesPayload = missingNames.map(name => {
        const sampleRow = data.rows.find(
          (r, i) => (r.company_name?.trim() || `Prospect #${i + 1}`).toLowerCase().trim() === name.toLowerCase().trim()
        )
        return {
          company_name: name,
          industry: sampleRow?.industry?.trim() || 'General',
          phone: sampleRow?.phone?.trim() || null,
          website: sampleRow?.website?.trim() || null,
          email: sampleRow?.email?.trim() || null,
          linkedin_url: sampleRow?.linkedin_url?.trim() || null,
          status: 'prospect',
          notes: sampleRow?.notes?.trim() || 'Imported via CSV',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      })

      const { data: insertedCos, error: coErr } = await supabase
        .from('companies')
        .insert(newCompaniesPayload)
        .select('id, company_name')

      if (coErr) return { count: 0, error: coErr.message }

      if (insertedCos) {
        insertedCos.forEach(co => {
          companyMap.set(co.company_name.toLowerCase().trim(), co.id)
        })
      }
    }

    // 4. Create primary contacts in Supabase `contacts` table
    const contactsPayload: any[] = []
    data.rows.forEach((row, idx) => {
      const rawName = row.company_name?.trim() || `Prospect #${idx + 1}`
      const companyId = companyMap.get(rawName.toLowerCase().trim())
      if (companyId && (row.contact_name || row.contact_title || row.contact_whatsapp || row.phone || row.email || row.linkedin_url)) {
        contactsPayload.push({
          company_id: companyId,
          full_name: row.contact_name?.trim() || `${rawName} Representative`,
          title: row.contact_title?.trim() || 'Decision Maker',
          phone: row.phone?.trim() || null,
          whatsapp: row.contact_whatsapp?.trim() || row.phone?.trim() || null,
          email: row.email?.trim() || null,
          linkedin_url: row.linkedin_url?.trim() || null,
          is_primary: true,
          created_at: new Date().toISOString(),
        })
      }
    })

    if (contactsPayload.length > 0) {
      await supabase.from('contacts').insert(contactsPayload)
    }

    // 5. Create activity logs in Supabase `activities` table
    const activityRecords = data.rows.map((row, idx) => {
      const rawName = row.company_name?.trim() || `Prospect #${idx + 1}`
      const companyId = companyMap.get(rawName.toLowerCase().trim())
      const ch = (row.channel || data.defaultChannel) as OutreachChannel
      const st = (row.status || 'sent') as OutreachStatus
      const dt = row.outreach_date?.trim() || data.defaultDate
      const createdAt = dt ? new Date(dt + 'T12:00:00.000Z').toISOString() : new Date().toISOString()

      const payload = {
        channel: ch,
        handle: row.handle?.trim() || row.phone?.trim() || row.contact_whatsapp?.trim() || '',
        template_used: data.defaultTemplate || 'growth_offer',
        status: st,
        prospect_reply: row.prospect_reply?.trim() || '',
        pain_point: row.pain_point?.trim() || '',
        call_opening_line: row.call_opening_line?.trim() || '',
        notes: row.notes?.trim() || '',
      }

      return {
        company_id: companyId,
        activity_type: getValidActivityType(ch),
        title: (CHANNEL_CONFIG[ch]?.label || 'Outreach') + ' — CSV Import',
        description: JSON.stringify(payload),
        created_at: createdAt,
      }
    })

    const { error: actErr } = await supabase.from('activities').insert(activityRecords)
    if (actErr) return { count: 0, error: actErr.message }

    return { count: activityRecords.length, error: null }
  } catch (err) {
    return { count: 0, error: (err as Error).message }
  }
}


