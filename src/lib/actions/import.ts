'use server'

import { createClient } from '@/lib/supabase/server'

export async function bulkImportCompanies(data: Record<string, string>[]) {
  try {
    const supabase = await createClient()
    let imported = 0
    let failed = 0

    for (const row of data) {
      const companyData: Record<string, any> = {
        status: 'prospect',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const companyName = row.company_name || row.companyName || row.company || row.name
      if (companyName) {
        companyData.company_name = companyName
      }

      if (row.industry) companyData.industry = row.industry
      if (row.website) companyData.website = row.website
      if (row.phone) companyData.phone = row.phone
      if (row.email) companyData.email = row.email
      if (row.country) companyData.country = row.country
      if (row.city) companyData.city = row.city
      if (row.employee_count || row.employees) {
        companyData.employee_count = parseInt(row.employee_count || row.employees) || null
      }
      if (row.notes) companyData.notes = row.notes
      if (row.linkedin_url || row.linkedin) companyData.linkedin_url = row.linkedin_url || row.linkedin

      if (!companyData.company_name) {
        failed++
        continue
      }

      // Insert company
      const { data: insertedCompany, error: companyErr } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single()

      if (companyErr) {
        failed++
        console.error('Failed to import company row:', companyErr.message)
        continue
      }

      // Extract Contact Information
      const personName = row.person_name || row.contact_name || row.full_name || row.contact || row.person
      const personTitle = row.person_title || row.title || row.job_title || row.contact_title
      const contactEmail = row.contact_email || row.person_email || row.email
      const contactPhone = row.contact_phone || row.person_phone || row.phone
      const whatsapp = row.whatsapp || row.whatsapp_number || row.wa_number
      const contactLinkedin = row.contact_linkedin || row.person_linkedin || row.linkedin

      // If we have contact details, or even just a fallback name from the company, create contact
      const finalContactName = personName || `${companyData.company_name} Representative`

      const { error: contactErr } = await supabase.from('contacts').insert({
        company_id: insertedCompany.id,
        full_name: finalContactName,
        title: personTitle || 'Decision Maker',
        email: contactEmail || null,
        phone: contactPhone || null,
        whatsapp: whatsapp || contactPhone || null,
        linkedin_url: contactLinkedin || null,
        is_primary: true,
        created_at: new Date().toISOString()
      })

      if (contactErr) {
        console.error('Failed to import contact for company:', insertedCompany.id, contactErr.message)
      }

      imported++
    }

    return { imported, failed, total: data.length }
  } catch (error) {
    return { imported: 0, failed: data.length, total: data.length, error: error instanceof Error ? error.message : 'Import failed' }
  }
}
