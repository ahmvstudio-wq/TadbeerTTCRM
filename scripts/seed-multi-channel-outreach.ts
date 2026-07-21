import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { OUTREACH_LIBRARY } from '../src/lib/outreach-messages-library'

// Read env variables manually
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valParts] = trimmed.split('=')
      if (key && valParts.length > 0) {
        process.env[key.trim()] = valParts.join('=').trim().replace(/^["']|["']$/g, '')
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function seedMultiChannelOutreach() {
  console.log('🚀 Seeding Multi-Channel Outreach Messages (WhatsApp, LinkedIn, Email) for all 10 Leads...')

  const entries = Object.entries(OUTREACH_LIBRARY)

  for (const [companyId, channels] of entries) {
    console.log(`\n📌 Seeding outreach for company ID: ${companyId}`)

    // Get contact ID
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('company_id', companyId)
      .limit(1)

    const contactId = contacts && contacts.length > 0 ? contacts[0].id : null

    // Seed 1: WhatsApp
    const { data: existingWa } = await supabase
      .from('outreach_preparations')
      .select('id')
      .eq('company_id', companyId)
      .eq('use_case_summary', 'OUTREACH_WHATSAPP')
      .maybeSingle()

    if (existingWa) {
      await supabase
        .from('outreach_preparations')
        .update({
          contact_id: contactId,
          message_body: channels.whatsapp,
          status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingWa.id)
      console.log('  ✓ Updated OUTREACH_WHATSAPP entry.')
    } else {
      await supabase.from('outreach_preparations').insert({
        company_id: companyId,
        contact_id: contactId,
        use_case_summary: 'OUTREACH_WHATSAPP',
        message_body: channels.whatsapp,
        status: 'ready',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      console.log('  ✓ Inserted OUTREACH_WHATSAPP entry.')
    }

    // Seed 2: LinkedIn
    const { data: existingLi } = await supabase
      .from('outreach_preparations')
      .select('id')
      .eq('company_id', companyId)
      .eq('use_case_summary', 'OUTREACH_LINKEDIN')
      .maybeSingle()

    if (existingLi) {
      await supabase
        .from('outreach_preparations')
        .update({
          contact_id: contactId,
          message_body: channels.linkedin,
          status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLi.id)
      console.log('  ✓ Updated OUTREACH_LINKEDIN entry.')
    } else {
      await supabase.from('outreach_preparations').insert({
        company_id: companyId,
        contact_id: contactId,
        use_case_summary: 'OUTREACH_LINKEDIN',
        message_body: channels.linkedin,
        status: 'ready',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      console.log('  ✓ Inserted OUTREACH_LINKEDIN entry.')
    }

    // Seed 3: Email
    const { data: existingEm } = await supabase
      .from('outreach_preparations')
      .select('id')
      .eq('company_id', companyId)
      .eq('use_case_summary', 'OUTREACH_EMAIL')
      .maybeSingle()

    if (existingEm) {
      await supabase
        .from('outreach_preparations')
        .update({
          contact_id: contactId,
          message_body: channels.email,
          status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingEm.id)
      console.log('  ✓ Updated OUTREACH_EMAIL entry.')
    } else {
      await supabase.from('outreach_preparations').insert({
        company_id: companyId,
        contact_id: contactId,
        use_case_summary: 'OUTREACH_EMAIL',
        message_body: channels.email,
        status: 'ready',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      console.log('  ✓ Inserted OUTREACH_EMAIL entry.')
    }

    // Seed 4: General OUTREACH default (WhatsApp fallback)
    const { data: existingGen } = await supabase
      .from('outreach_preparations')
      .select('id')
      .eq('company_id', companyId)
      .eq('use_case_summary', 'OUTREACH')
      .maybeSingle()

    if (existingGen) {
      await supabase
        .from('outreach_preparations')
        .update({
          contact_id: contactId,
          message_body: channels.whatsapp,
          status: 'ready',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGen.id)
      console.log('  ✓ Updated default OUTREACH entry.')
    } else {
      await supabase.from('outreach_preparations').insert({
        company_id: companyId,
        contact_id: contactId,
        use_case_summary: 'OUTREACH',
        message_body: channels.whatsapp,
        status: 'ready',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      console.log('  ✓ Inserted default OUTREACH entry.')
    }
  }

  console.log('\n🎉 ALL 3 Channels (WhatsApp, LinkedIn, Email) successfully seeded for all 10 Leads!')
}

seedMultiChannelOutreach().catch(err => {
  console.error('Fatal outreach seeding error:', err)
  process.exit(1)
})
