import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length > 0) process.env[k.trim()] = v.join('=').trim();
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function testFetchCadence(userId: string, selectedDate: string) {
  console.log(`Testing for User ${userId} on Date ${selectedDate}...`);

  let { data: session } = await supabase
    .from('daily_outreach_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('session_date', selectedDate)
    .maybeSingle();

  console.log('Found session:', session?.id);

  if (session) {
    const { data: items } = await supabase
      .from('daily_outreach_items')
      .select(`
        *,
        companies (
          *,
          contacts (*),
          outreach_preparations (*)
        )
      `)
      .eq('session_id', session.id)
      .order('position', { ascending: true });

    console.log(`Items count for session ${session.id}:`, items?.length);
    if (items) {
      items.forEach(i => console.log(` - ${i.companies?.company_name} (Status: ${i.status})`));
    }
  }
}

async function run() {
  const users = [
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    '69d83509-31f9-4ad9-9e96-206474fe48d4',
    'c2ff4e32-6a48-496a-a8b4-bd2d14385219'
  ];

  for (const u of users) {
    await testFetchCadence(u, '2026-07-22');
    await testFetchCadence(u, '2026-07-21');
    await testFetchCadence(u, '2026-07-20');
  }
}

run();
