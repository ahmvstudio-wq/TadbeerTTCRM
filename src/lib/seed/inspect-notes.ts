import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectNotes() {
  const { data: companies, error } = await supabase.from('companies').select('*, contacts(*), activities(*)');
  if (error) {
    console.error('Error fetching companies:', error);
    return;
  }
  console.log(`Total companies: ${companies?.length}`);

  let withInstagram = 0;
  let withResearchNotes = 0;
  let sampleNotes: string[] = [];

  companies?.forEach(c => {
    const notesStr = (c.notes || '') + ' ' + (c.website || '') + ' ' + (c.pain_point || '');
    if (notesStr.toLowerCase().includes('instagram.com') || notesStr.toLowerCase().includes('instagram:')) {
      withInstagram++;
    }
    if (c.notes && (c.notes.toLowerCase().includes('research') || c.notes.length > 50)) {
      withResearchNotes++;
      if (sampleNotes.length < 10) sampleNotes.push(`${c.company_name} | Notes: ${c.notes.slice(0, 120)}...`);
    }
  });

  console.log(`Companies with Instagram in notes/website: ${withInstagram}`);
  console.log(`Companies with >50 chars notes: ${withResearchNotes}`);
  console.log(`Sample notes:\n`, sampleNotes.join('\n'));
}

inspectNotes();
