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
      }

      if (row.company_name || row.companyName || row.name) {
        companyData.company_name = row.company_name || row.companyName || row.name
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

      const { error } = await supabase.from('companies').insert(companyData)
      if (error) {
        failed++
        console.error('Failed to import row:', error.message)
      } else {
        imported++
      }
    }

    return { imported, failed, total: data.length }
  } catch (error) {
    return { imported: 0, failed: data.length, total: data.length, error: error instanceof Error ? error.message : 'Import failed' }
  }
}
