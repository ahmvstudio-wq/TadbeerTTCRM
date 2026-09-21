'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/config'
import { generateForNewProspects, normalizeCategory, buildDeterministicSequence } from '@/lib/ai/outreach-generator'
import { requireAuth } from '@/lib/auth-guard'
import { CHANNEL_CONFIG, type OutreachChannel, type SectorCategory } from '@/lib/types/outreach'
import { isValidLinkedInUrl } from '@/lib/utils'

import { revalidatePath } from 'next/cache'

const supabase = getSupabaseAdminClient()

function revalidateAllCRMPages() {
  try {
    revalidatePath('/outreach')
    revalidatePath('/daily-cadence')
    revalidatePath('/dashboard')
    revalidatePath('/companies')
    revalidatePath('/prospects')
    revalidatePath('/ig-dm')
  } catch (e) {
    // Non-fatal if called outside request context
  }
}

function getValidActivityType(channel: string): string {
  if (channel === 'email') return 'email_sent'
  if (channel === 'whatsapp') return 'whatsapp_sent'
  if (channel === 'instagram_dm' || channel === 'linkedin') return 'outreach_sent'
  return 'call_made'
}

function normalizeCompanyStatus(rawStatus?: string, fallback: string = 'contacted'): string {
  if (!rawStatus) return fallback
  const s = rawStatus.toLowerCase().trim()
  if (['prospect', 'contacted', 'in_call_queue', 'meeting_booked', 'opportunity', 'won', 'lost'].includes(s)) {
    return s
  }
  if (s.includes('sent') || s.includes('contact') || s.includes('warm') || s.includes('opening') || s.includes('staged')) return 'contacted'
  if (s.includes('call')) return 'in_call_queue'
  if (s.includes('meeting') || s.includes('booked') || s.includes('coffee')) return 'meeting_booked'
  if (s.includes('opp') || s.includes('deal') || s.includes('proposal')) return 'opportunity'
  if (s.includes('won')) return 'won'
  if (s.includes('lost')) return 'lost'
  return fallback
}

function formatHandleToName(handle: string): string {
  const clean = handle.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/^@/, '').replace(/\/$/, '').replace(/[_.]+/g, ' ').trim()
  return clean.replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function bulkImportCompanies(
  data: Record<string, string>[],
  targetChannel?: OutreachChannel | 'all',
  initialPipelineStatus: 'contacted' | 'prospect' = 'contacted'
) {
  try {
    await requireAuth()

    if (!Array.isArray(data) || data.length === 0) {
      return { imported: 0, failed: 0, total: 0 }
    }

    let imported = 0
    let failed = 0

    const now = new Date().toISOString()
    const CHUNK_SIZE = 100

    // Process rows in chunks of 100
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE)
      
      const companiesToInsert: any[] = []
      const contactInfoMap: any[] = []

      for (const row of chunk) {
        // Extract IG handle
        const rawIg = row.instagram_handle || row.instagram || row.ig_handle || row.ig || row.handle || row.username || ''
        const cleanIg = rawIg ? (rawIg.startsWith('@') ? rawIg : `@${rawIg.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')}`) : null

        // Intelligent Company Name resolution
        let companyName = (
          row.company_name ||
          row.companyName ||
          row.company ||
          row.business_name ||
          row.business ||
          row.brand_name ||
          row.brand ||
          row.clinic_name ||
          row.clinic ||
          row.store_name ||
          row.name ||
          row.person_name ||
          row.full_name ||
          row.doctor_name ||
          row.founder ||
          ''
        ).trim()

        if (!companyName && cleanIg) {
          companyName = formatHandleToName(cleanIg)
        } else if (!companyName && row.phone) {
          companyName = `Prospect (${row.phone})`
        } else if (!companyName && row.email) {
          companyName = row.email.split('@')[0]
        }

        if (!companyName) {
          companyName = 'Oman Prospect'
        }
        
        const rawCat = row.category || row.sector || row.industry || 'general'
        const normalizedSector = (await normalizeCategory(rawCat)) as SectorCategory

        const observation = row.specific_observation || row.observation || row.research_notes || row.pain_point || row.notes || ''
        const contactPerson = row.person_name || row.contact_name || row.full_name || row.contact || row.person || row.doctor_name || row.founder || ''

        // Pre-build sequence based on user-chosen channel or auto-detection
        const rawLiInRow = row.linkedin_url || row.linkedin || row.contact_linkedin || row.person_linkedin
        const hasValidLiInRow = isValidLinkedInUrl(rawLiInRow)
        const rawPhoneInRow = row.whatsapp || row.phone || row.contact_phone || row.person_phone
        const hasValidPhoneInRow = Boolean(rawPhoneInRow && String(rawPhoneInRow).replace(/\D/g, '').length >= 7)
        const rawEmailInRow = row.email || row.contact_email || row.person_email
        const hasValidEmailInRow = Boolean(rawEmailInRow && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(rawEmailInRow).trim()))

        let prefChannel: OutreachChannel = 'cold_call'
        if (targetChannel && targetChannel !== 'all') {
          prefChannel = targetChannel
        } else if (cleanIg) {
          prefChannel = 'instagram_dm'
        } else if (hasValidPhoneInRow) {
          prefChannel = 'whatsapp'
        } else if (hasValidLiInRow) {
          prefChannel = 'linkedin'
        } else if (hasValidEmailInRow) {
          prefChannel = 'email'
        } else {
          prefChannel = 'cold_call'
        }

        const preStagedSeq = buildDeterministicSequence(
          companyName.trim(),
          contactPerson,
          normalizedSector,
          observation,
          prefChannel,
          row.city || 'Muscat'
        )

        // If custom touch messages were mapped in the CSV, override the defaults
        const customTouch1 = row.touch_1_message || row.draft_message || row.first_touch || row.dm_script || row.message
        if (customTouch1 && customTouch1.trim() && preStagedSeq.touch_1) {
          preStagedSeq.touch_1.message = customTouch1.trim()
        }

        const customTouch2 = row.touch_2_message || row.followup_1 || row.follow_up_1 || row.followup_message
        if (customTouch2 && customTouch2.trim() && preStagedSeq.touch_2) {
          preStagedSeq.touch_2.message = customTouch2.trim()
        }

        const customTouch3 = row.touch_3_message || row.followup_2 || row.follow_up_2 || row.breakaway_message
        if (customTouch3 && customTouch3.trim() && preStagedSeq.touch_3) {
          preStagedSeq.touch_3.message = customTouch3.trim()
        }

        const customCallScript = row.cold_call_script || row.call_opener || row.call_script
        if (customCallScript && customCallScript.trim()) {
          if (preStagedSeq.cold_call_script) {
            preStagedSeq.cold_call_script.opener = customCallScript.trim()
          } else {
            preStagedSeq.cold_call_script = {
              opener: customCallScript.trim(),
              context_bridge: 'We help leading businesses across Muscat optimize customer bookings and eliminate dropped inquiries.',
              close_for_coffee: 'Can I buy you a quick 10-minute coffee in Muscat to share what we are seeing work?'
            }
          }
        }

        const initialStatus = row.stage || row.status || 'prospect'

        let mappedLeadSource = 'Direct CRM';
        if (prefChannel === 'whatsapp') mappedLeadSource = 'WhatsApp';
        else if (prefChannel === 'instagram_dm') mappedLeadSource = 'Instagram';
        else if (prefChannel === 'linkedin') mappedLeadSource = 'LinkedIn';

        const coStatus = normalizeCompanyStatus(row.status || row.stage, initialPipelineStatus)
        const pStage = coStatus === 'contacted' ? 'Contacted' : (coStatus === 'in_call_queue' ? 'Call Ready' : 'New')

        const companyObj: Record<string, any> = {
          company_name: companyName.trim(),
          industry: normalizedSector || row.industry || 'general',
          status: coStatus,
          pipeline_stage: pStage,
          lead_status: coStatus === 'contacted' ? 'Opener Staged' : 'New',
          lead_source: mappedLeadSource,
          research_json: { target_channel: prefChannel },
          notes: JSON.stringify({
            category: normalizedSector,
            instagram_handle: cleanIg,
            specific_observation: observation || preStagedSeq.touch_1.specific_observation,
            staged_sequence: preStagedSeq,
            original_notes: row.notes || '',
            target_channel: prefChannel,
            draft_message: preStagedSeq.touch_1.message
          }),
          created_at: now,
          updated_at: now
        }

        if (row.website) companyObj.website = row.website
        if (row.phone) companyObj.phone = row.phone
        if (row.email) companyObj.email = row.email
        if (row.country) companyObj.country = row.country
        if (row.city) companyObj.city = row.city
        if (row.employee_count || row.employees) {
          companyObj.employee_count = parseInt(row.employee_count || row.employees) || null
        }
        const rawCompanyLi = row.linkedin_url || row.linkedin
        if (isValidLinkedInUrl(rawCompanyLi)) {
          companyObj.linkedin_url = String(rawCompanyLi).trim()
        }

        companiesToInsert.push(companyObj)

        // Extract contact info for matching after insertion
        const personTitle = row.person_title || row.title || row.job_title || row.contact_title
        const contactEmail = row.contact_email || row.person_email || row.email
        const contactPhone = row.contact_phone || row.person_phone || row.phone
        const whatsapp = row.whatsapp || row.whatsapp_number || row.wa_number || row.phone
        const rawContactLi = row.contact_linkedin || row.person_linkedin || (!companyObj.linkedin_url ? row.linkedin : null)
        const contactLinkedin = isValidLinkedInUrl(rawContactLi) ? String(rawContactLi).trim() : null

        contactInfoMap.push({
          personName: contactPerson,
          personTitle,
          contactEmail,
          contactPhone,
          whatsapp,
          contactLinkedin,
          cleanIg,
          companyName: companyName.trim(),
          preStagedSeq,
          observation: observation || preStagedSeq.touch_1.specific_observation,
          channel: prefChannel,
        })
      }

      if (companiesToInsert.length === 0) continue

      // Batch Insert Companies in 1 single HTTP request per chunk
      const { data: insertedCompanies, error: companyErr } = await supabase
        .from('companies')
        .insert(companiesToInsert)
        .select('id, company_name')

      if (companyErr || !insertedCompanies) {
        console.error('Batch company insert failed:', companyErr?.message)
        failed += companiesToInsert.length
        return { imported, failed, total: data.length, error: companyErr?.message }
      }

      // Map contacts to inserted company IDs
      const contactsToInsert: any[] = []
      insertedCompanies.forEach((insertedComp, idx) => {
        const info = contactInfoMap[idx] || {}
        const finalContactName = info.personName || info.companyName || 'Business Contact'

        contactsToInsert.push({
          company_id: insertedComp.id,
          full_name: finalContactName,
          title: info.personTitle || (info.personName ? 'Decision Maker' : 'Owner / Manager'),
          email: info.contactEmail || null,
          phone: info.contactPhone || null,
          whatsapp: info.whatsapp || info.contactPhone || null,
          linkedin_url: info.contactLinkedin || null,
          is_primary: true,
          created_at: now
        })
      })

      // Batch Insert Contacts
      if (contactsToInsert.length > 0) {
        const { error: contactErr } = await supabase
          .from('contacts')
          .insert(contactsToInsert)

        if (contactErr) {
          console.error('Batch contact insert warning:', contactErr.message)
        }
      }

      // Batch Insert Activities for Outreach visibility
      if (initialPipelineStatus === 'contacted') {
        const activitiesToInsert = insertedCompanies.map((insertedComp, idx) => {
          const info = contactInfoMap[idx] || {}
          const seq = info.preStagedSeq
          const ch: OutreachChannel = info.channel || 'cold_call'
          const handle = ch === 'instagram_dm' ? (info.cleanIg || '') : ch === 'linkedin' ? (info.contactLinkedin || '') : (info.whatsapp || info.contactPhone || '')
          
          const payload = {
            channel: ch,
            handle: handle || info.companyName || '',
            template_used: 'growth_offer',
            status: 'gate_opener_staged',
            prospect_reply: '',
            pain_point: '',
            call_opening_line: seq?.cold_call_script?.opener || '',
            notes: seq?.touch_1?.message || info.observation || 'Imported via CSV',
          }

          return {
            company_id: insertedComp.id,
            activity_type: getValidActivityType(ch),
            title: (CHANNEL_CONFIG[ch]?.label || 'Outreach') + ' — Opener Staged',
            description: JSON.stringify(payload),
            created_at: now,
          }
        })

        if (activitiesToInsert.length > 0) {
          try {
            const { error: actErr } = await supabase.from('activities').insert(activitiesToInsert)
            if (actErr) {
              console.warn("Activities insert warning in bulkImportCompanies:", actErr.message)
            }
          } catch (aErr) {
            console.warn("Activities insert error:", aErr)
          }
        }
      }

      // Automatically register initial staging touch in outreach_touches
      const touchesToInsert = insertedCompanies.map((insertedComp, idx) => {
        const info = contactInfoMap[idx] || {}
        const seq = info.preStagedSeq
        const rawCh = String(info.channel || 'whatsapp').toLowerCase()
        const validChannel = rawCh.includes('email') ? 'email' : (rawCh.includes('linkedin') ? 'linkedin' : (rawCh.includes('wa') || rawCh.includes('whatsapp') ? 'whatsapp' : 'call'))

        return {
          lead_id: insertedComp.id,
          channel: validChannel,
          step_number: 1,
          message: seq?.touch_1?.message || 'Warm greeting',
          status: 'staged',
          sent_at: now,
        }
      })

      if (touchesToInsert.length > 0) {
        try {
          const { error: touchErr } = await supabase.from('outreach_touches').insert(touchesToInsert)
          if (touchErr) {
            console.warn("Outreach touches insert warning:", touchErr.message)
          }
        } catch (tErr) {
          console.warn("Outreach touches insert skipped:", tErr)
        }
      }

      imported += insertedCompanies.length
    }

    revalidateAllCRMPages()
    return { imported, failed, total: data.length }
  } catch (error) {
    return { imported: 0, failed: data.length, total: data.length, error: error instanceof Error ? error.message : 'Import failed' }
  }
}
