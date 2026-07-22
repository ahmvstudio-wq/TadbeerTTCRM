import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length > 0) process.env[k.trim()] = v.join('=').trim();
  });
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const JULY20_COMPANIES = [
  'Oman Flour Mills',
  'Muna Noor',
  'Al Jassar Group',
  'Vertex+',
  'Stay Development',
  'Arak Medical',
  'National Finance',
  'Mwasalat',
  'Premium Motors',
  'Kenz Hypermarket'
];

const JULY21_COMPANIES = [
  'Oman Flour Mills',
  'Muna Noor',
  'Al Jassar Group',
  'Vertex+',
  'Stay Development',
  'Arak Medical',
  'National Finance',
  'Mwasalat',
  'Premium Motors',
  'Kenz Hypermarket'
];

const JULY22_COMPANIES = [
  '350 Youth Clothing',
  'Lights And Fans Shop',
  'Flower Story',
  'Perfumes Icud',
  'Obaidani Stores',
  'Smart City',
  'Supermarket Comex',
  'Maria Flowers',
  'Flowers And Gifts',
  'Junaid'
];

async function fixAllUserSessions() {
  console.log('Fixing and deduplicating all sessions for all dates...');

  const { data: users } = await supabase.from('users').select('*');
  const dates = ['2026-07-20', '2026-07-21', '2026-07-22'];

  for (const user of users || []) {
    for (const dateStr of dates) {
      // 1. Get all sessions for this user and date
      const { data: sessions } = await supabase
        .from('daily_outreach_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('session_date', dateStr)
        .order('created_at', { ascending: true });

      let primarySession = sessions?.[0];

      if (!primarySession) {
        const { data: newSess } = await supabase
          .from('daily_outreach_sessions')
          .insert({ user_id: user.id, session_date: dateStr, target_count: 10 })
          .select()
          .single();
        primarySession = newSess;
      }

      // If duplicate sessions exist, move their items to primarySession and delete duplicates
      if (sessions && sessions.length > 1) {
        for (let i = 1; i < sessions.length; i++) {
          const dup = sessions[i];
          await supabase.from('daily_outreach_items').update({ session_id: primarySession.id }).eq('session_id', dup.id);
          await supabase.from('daily_outreach_sessions').delete().eq('id', dup.id);
          console.log(`Deduplicated session ${dup.id} into ${primarySession.id}`);
        }
      }

      // Determine company list for date
      const companyList = dateStr === '2026-07-20' ? JULY20_COMPANIES : (dateStr === '2026-07-21' ? JULY21_COMPANIES : JULY22_COMPANIES);

      let pos = 1;
      for (const compName of companyList) {
        const { data: comp } = await supabase
          .from('companies')
          .select('*, outreach_preparations(*)')
          .ilike('company_name', `%${compName}%`)
          .limit(1)
          .maybeSingle();

        if (!comp) continue;

        const prep = comp.outreach_preparations?.[0];

        const { data: existingItem } = await supabase
          .from('daily_outreach_items')
          .select('*')
          .eq('session_id', primarySession.id)
          .eq('company_id', comp.id)
          .maybeSingle();

        if (!existingItem) {
          await supabase.from('daily_outreach_items').insert({
            session_id: primarySession.id,
            company_id: comp.id,
            preparation_id: prep?.id || null,
            position: pos,
            status: 'prepared'
          });
          console.log(`Added ${comp.company_name} to date ${dateStr} for user ${user.full_name}`);
        } else {
          await supabase.from('daily_outreach_items').update({
            preparation_id: prep?.id || existingItem.preparation_id,
            status: 'prepared'
          }).eq('id', existingItem.id);
        }
        pos++;
      }
    }
  }

  console.log('Deduplication and full session sync finished successfully!');
}

fixAllUserSessions().catch(err => {
  console.error('Error in session sync:', err);
  process.exit(1);
});
