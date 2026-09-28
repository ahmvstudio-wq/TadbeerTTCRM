import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valParts] = trimmed.split('=');
      if (key && valParts.length > 0) {
        process.env[key.trim()] = valParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function cleanBusinessName(name: string): string {
  if (!name) return '';
  return name
    .replace(/\s+L\.?L\.?C\.?$/i, '')
    .replace(/\s+S\.?P\.?C\.?$/i, '')
    .replace(/\s+S\.?A\.?O\.?G\.?$/i, '')
    .replace(/\s+S\.?A\.?Q\.?G\.?$/i, '')
    .replace(/\s+S\.?A\.?O\.?C\.?$/i, '')
    .replace(/\s+W\.?L\.?L\.?$/i, '')
    .trim();
}

function generatePersonalizedMessage(contactName: string | null | undefined, companyName: string): string {
  const cleanComp = cleanBusinessName(companyName);
  const trimmedName = contactName ? contactName.trim() : '';

  const isGenericName = !trimmedName || 
    /^(decision maker|owner|manager|owner\/manager|admin|reception|team|general|sales|n\/a|none|contact)$/i.test(trimmedName);

  // If company name is just an individual's name (e.g. "Amal", "Ameer", "Aslam")
  const isIndividualNameCompany = /^[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/.test(companyName.trim()) &&
    (trimmedName.toLowerCase() === companyName.trim().toLowerCase() || isGenericName);

  if (isIndividualNameCompany) {
    const targetName = !isGenericName ? trimmedName : companyName.trim();
    return `Salam Alaikum ${targetName}, hope you’re doing well. I came across your work and thought it would be good to connect and stay in touch.`;
  }

  if (!isGenericName) {
    return `Salam Alaikum ${trimmedName}, hope you’re doing well. I came across your work with ${cleanComp} and thought it would be good to connect and stay in touch.`;
  } else {
    return `Salam Alaikum, hope you’re doing well. I came across your work with ${cleanComp} and thought it would be good to connect and stay in touch.`;
  }
}

async function runUpdate() {
  console.log('🚀 Starting batch update for WhatsApp leads message tabs and staged sequences...\n');

  // Fetch all companies where target_channel is whatsapp OR lead_source is WhatsApp
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, company_name, industry, phone, lead_source, lead_status, pipeline_stage, notes, research_json, draft_message')
    .or('lead_source.ilike.%whatsapp%,research_json->>target_channel.eq.whatsapp');

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Found ${companies?.length || 0} WhatsApp leads to update.`);

  let updatedCount = 0;
  const batchSize = 50;

  for (let i = 0; i < (companies || []).length; i += batchSize) {
    const chunk = companies!.slice(i, i + batchSize);
    const chunkIds = chunk.map(c => c.id);

    // Fetch contacts for this chunk
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, company_id, full_name, title')
      .in('company_id', chunkIds);

    const contactsByCompany = new Map<string, any[]>();
    contacts?.forEach(ct => {
      if (ct.company_id) {
        const arr = contactsByCompany.get(ct.company_id) || [];
        arr.push(ct);
        contactsByCompany.set(ct.company_id, arr);
      }
    });

    for (const comp of chunk) {
      const compContacts = contactsByCompany.get(comp.id) || [];
      let contactName = compContacts[0]?.full_name;

      if (!contactName && comp.notes) {
        try {
          const parsed = JSON.parse(comp.notes);
          if (parsed.staged_sequence?.touch_1?.target_name) {
            contactName = parsed.staged_sequence.touch_1.target_name;
          }
        } catch {}
      }

      const personalizedMessage = generatePersonalizedMessage(contactName, comp.company_name);

      // Build updated research_json
      let rJson: any = {};
      if (comp.research_json && typeof comp.research_json === 'object') {
        rJson = { ...comp.research_json };
      } else if (comp.notes && (comp.notes.startsWith('{') || comp.notes.startsWith('['))) {
        try {
          rJson = JSON.parse(comp.notes);
        } catch {}
      }

      rJson.target_channel = 'whatsapp';
      rJson.draft_message = personalizedMessage;
      if (!rJson.staged_sequence) rJson.staged_sequence = {};
      if (!rJson.staged_sequence.touch_1) rJson.staged_sequence.touch_1 = {};
      rJson.staged_sequence.touch_1.message = personalizedMessage;
      rJson.staged_sequence.touch_1.channel = 'whatsapp';

      // Build updated notes if notes was JSON
      let updatedNotes = comp.notes;
      if (comp.notes && (comp.notes.startsWith('{') || comp.notes.startsWith('['))) {
        try {
          const parsed = JSON.parse(comp.notes);
          parsed.draft_message = personalizedMessage;
          if (!parsed.staged_sequence) parsed.staged_sequence = {};
          if (!parsed.staged_sequence.touch_1) parsed.staged_sequence.touch_1 = {};
          parsed.staged_sequence.touch_1.message = personalizedMessage;
          parsed.staged_sequence.touch_1.channel = 'whatsapp';
          updatedNotes = JSON.stringify(parsed);
        } catch {}
      }

      // Update in companies table
      const { error: updErr } = await supabase
        .from('companies')
        .update({
          draft_message: personalizedMessage,
          research_json: rJson,
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', comp.id);

      if (updErr) {
        console.error(`Error updating company ${comp.id} (${comp.company_name}):`, updErr);
      } else {
        updatedCount++;
      }
    }

    console.log(`Updated ${Math.min(i + batchSize, companies!.length)} / ${companies!.length} companies...`);
  }

  console.log(`\n🎉 Successfully updated all ${updatedCount} WhatsApp leads with personalized templates!`);
}

runUpdate().catch(console.error);
