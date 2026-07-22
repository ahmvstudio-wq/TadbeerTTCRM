import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length > 0) process.env[k.trim()] = v.join('=').trim();
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkCadenceItems() {
  const { data: sessions } = await supabase
    .from('daily_outreach_sessions')
    .select('*, daily_outreach_items(*, companies(company_name))')
    .eq('session_date', '2026-07-22');

  console.log('Sessions for 2026-07-22:', JSON.stringify(sessions, null, 2));
}

checkCadenceItems();
