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

async function debugSpecificCompanies() {
  const targets = ["american eagle", "belleza", "matalan", "sara plaza", "lamori", "armada", "redtag", "first fashion", "choice"];
  
  const { data: companies } = await supabase.from('companies').select('*, contacts(*), activities(*)');

  companies?.forEach(c => {
    const name = (c.company_name || '').toLowerCase();
    const notes = (c.notes || '').toLowerCase();
    
    if (targets.some(t => name.includes(t) || notes.includes(t))) {
      console.log('==================================================');
      console.log(`ID: ${c.id}`);
      console.log(`Company Name: ${c.company_name}`);
      console.log(`Industry: ${c.industry}`);
      console.log(`Phone: ${c.phone}`);
      console.log(`Website: ${c.website}`);
      console.log(`Notes:\n${c.notes}`);
      console.log(`Contacts:`, c.contacts);
      console.log(`Activities count: ${c.activities?.length}`);
    }
  });
}

debugSpecificCompanies();
