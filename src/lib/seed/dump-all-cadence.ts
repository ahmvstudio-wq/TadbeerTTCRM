import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length > 0) process.env[k.trim()] = v.join('=').trim();
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function dumpAllSessions() {
  const { data: sessions } = await supabase
    .from('daily_outreach_sessions')
    .select('*, daily_outreach_items(*, companies(company_name))')
    .order('session_date', { ascending: false });

  console.log('=== ALL SESSIONS AND ITEMS ===');
  for (const s of sessions || []) {
    console.log(`Session ID: ${s.id} | User ID: ${s.user_id} | Date: ${s.session_date} | Target Count: ${s.target_count} | Items Count: ${s.daily_outreach_items?.length}`);
    for (const item of s.daily_outreach_items || []) {
      console.log(`   - Item ID: ${item.id} | Status: ${item.status} | Company: ${item.companies?.company_name} (${item.company_id})`);
    }
  }
}

dumpAllSessions();
