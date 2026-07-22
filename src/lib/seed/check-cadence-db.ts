import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length > 0) process.env[k.trim()] = v.join('=').trim();
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function checkSessions() {
  const { data: users } = await supabase.from('users').select('*');
  console.log('All users in DB:', users);

  const { data: sessions } = await supabase.from('daily_outreach_sessions').select('*');
  console.log('All sessions in DB:', sessions);

  const { data: items } = await supabase.from('daily_outreach_items').select('*');
  console.log('All items count in DB:', items?.length);
  if (items && items.length > 0) {
    console.log('Sample item:', items[0]);
  }
}

checkSessions();
