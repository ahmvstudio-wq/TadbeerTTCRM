'use server'

import { createClient } from '@supabase/supabase-js'
import { generateForNewProspects } from '@/lib/ai/outreach-generator'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function bulkImportCompanies(data: Record<string, string>[]) {
  try {
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
        const companyName = row.company_name || row.companyName || row.company || row.name
        if (!companyName || !companyName.trim()) {
          failed++
          continue
        }

        const companyObj: Record<string, any> = {
          company_name: companyName.trim(),
          status: 'prospect',
          created_at: now,
          updated_at: now
        }

        if (row.industry) companyObj.industry = row.industry
        if (row.website) companyObj.website = row.website
        if (row.phone) companyObj.phone = row.phone
        if (row.email) companyObj.email = row.email
        if (row.country) companyObj.country = row.country
        if (row.city) companyObj.city = row.city
        if (row.employee_count || row.employees) {
          companyObj.employee_count = parseInt(row.employee_count || row.employees) || null
        }
        if (row.notes) companyObj.notes = row.notes
        if (row.linkedin_url || row.linkedin) companyObj.linkedin_url = row.linkedin_url || row.linkedin

        companiesToInsert.push(companyObj)

        // Extract contact info for matching after insertion
        const personName = row.person_name || row.contact_name || row.full_name || row.contact || row.person
        const personTitle = row.person_title || row.title || row.job_title || row.contact_title
        const contactEmail = row.contact_email || row.person_email || row.email
        const contactPhone = row.contact_phone || row.person_phone || row.phone
        const whatsapp = row.whatsapp || row.whatsapp_number || row.wa_number
        const contactLinkedin = row.contact_linkedin || row.person_linkedin || row.linkedin

        contactInfoMap.push({
          personName,
          personTitle,
          contactEmail,
          contactPhone,
          whatsapp,
          contactLinkedin,
          companyName: companyName.trim()
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
        continue
      }

      // Map contacts to inserted company IDs
      const contactsToInsert: any[] = []
      insertedCompanies.forEach((insertedComp, idx) => {
        const info = contactInfoMap[idx] || {}
        const finalContactName = info.personName || `${insertedComp.company_name} Representative`

        contactsToInsert.push({
          company_id: insertedComp.id,
          full_name: finalContactName,
          title: info.personTitle || 'Decision Maker',
          email: info.contactEmail || null,
          phone: info.contactPhone || null,
          whatsapp: info.whatsapp || info.contactPhone || null,
          linkedin_url: info.contactLinkedin || null,
          is_primary: true,
          created_at: now
        })
      })

      // Batch Insert Contacts in 1 single HTTP request per chunk
      if (contactsToInsert.length > 0) {
        const { error: contactErr } = await supabase
          .from('contacts')
          .insert(contactsToInsert)

        if (contactErr) {
          console.error('Batch contact insert warning:', contactErr.message)
        }
      }

      imported += insertedCompanies.length
    }

    // Automatically trigger research-grounded outreach draft generation for new prospects
    generateForNewProspects().catch((err) => console.error("Auto draft generation error post-import:", err));

    return { imported, failed, total: data.length }
  } catch (error) {
    return { imported: 0, failed: data.length, total: data.length, error: error instanceof Error ? error.message : 'Import failed' }
  }
}
