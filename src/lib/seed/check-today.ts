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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, company_name, notes, created_at')
    .gte('created_at', today.toISOString())

  if (error) {
    console.error('Error fetching companies:', error)
    return
  }

  console.log(`Found ${companies.length} companies created today.`)
  if (companies.length > 60) {
    const others = companies.filter(c => !c.notes?.toLowerCase().includes('insights'))
    console.log(`Found ${others.length} companies created today without Insights tag.`)
    console.log('Sample:', others.slice(0, 5).map(c => c.company_name).join(', '))
  }
}

main()
