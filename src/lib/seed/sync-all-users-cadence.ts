import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length > 0) process.env[k.trim()] = v.join('=').trim();
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const TARGET_COMPANIES = [
  'Obaidani Stores',
  'Maria Flowers',
  '350 Youth Clothing',
  'Lights And Fans Shop',
  'Flower Story',
  'Perfumes Icud',
  'Smart City',
  'Supermarket Comex'
];

async function syncAllUserSessions() {
  const sessionDate = '2026-07-22';
  const { data: users } = await supabase.from('users').select('*');

  console.log(`Found ${users?.length} users in database.`);

  for (const user of users || []) {
    // 1. Get or create session for user
    let { data: session } = await supabase
      .from('daily_outreach_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_date', sessionDate)
      .maybeSingle();

    if (!session) {
      const { data: newSess } = await supabase
        .from('daily_outreach_sessions')
        .insert({ user_id: user.id, session_date: sessionDate, target_count: 10 })
        .select()
        .single();
      session = newSess;
    }

    // 2. Add each target company to this session if not already added
    let pos = 1;
    for (const compName of TARGET_COMPANIES) {
      const { data: comp } = await supabase
        .from('companies')
        .select('*, outreach_preparations(*)')
        .ilike('company_name', `%${compName}%`)
        .maybeSingle();

      if (!comp) continue;

      const prep = comp.outreach_preparations?.[0];

      const { data: existingItem } = await supabase
        .from('daily_outreach_items')
        .select('*')
        .eq('session_id', session.id)
        .eq('company_id', comp.id)
        .maybeSingle();

      if (!existingItem) {
        await supabase.from('daily_outreach_items').insert({
          session_id: session.id,
          company_id: comp.id,
          preparation_id: prep?.id || null,
          position: pos,
          status: 'prepared',
        });
        console.log(`Added ${compName} to session ${session.id} for user ${user.full_name}`);
      } else {
        await supabase
          .from('daily_outreach_items')
          .update({ preparation_id: prep?.id || existingItem.preparation_id, status: 'prepared' })
          .eq('id', existingItem.id);
        console.log(`Updated ${compName} in session ${session.id} for user ${user.full_name}`);
      }
      pos++;
    }
  }

  console.log('All user sessions synced successfully for 2026-07-22!');
}

syncAllUserSessions().catch(err => {
  console.error('Error syncing user sessions:', err);
  process.exit(1);
});
