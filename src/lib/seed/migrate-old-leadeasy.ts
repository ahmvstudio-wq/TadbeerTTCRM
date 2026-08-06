import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

const envContent = fs.readFileSync('.env.local', 'utf-8')
const env: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...value] = line.split('=')
    if (key && value) {
      env[key.trim()] = value.join('=').trim()
    }
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, company_name, notes, created_at')
    
  if (error) {
    console.error('Error fetching companies:', error)
    return
  }

  const leadeasy = companies.filter(c => c.notes?.toLowerCase().includes('leadeasy') || c.notes?.toLowerCase().includes('lead easy'))
  console.log(`Found ${leadeasy.length} companies with leadeasy in their notes.`)

  if (leadeasy.length > 0) {
    let updatedCount = 0
    for (const c of leadeasy) {
      const newNotes = c.notes.replace(/leadeasy/gi, 'Insights').replace(/lead easy/gi, 'Insights')
      const { error: updateError } = await supabase
        .from('companies')
        .update({ notes: newNotes })
        .eq('id', c.id)
      
      if (!updateError) updatedCount++
    }
    console.log(`Successfully updated ${updatedCount} old LeadEasy companies to Insights.`)
  }
}

main()
