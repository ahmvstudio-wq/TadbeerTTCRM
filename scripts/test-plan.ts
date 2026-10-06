import { getSupabaseAdminClient } from '../src/lib/supabase/config';
import { normalizeCategorySync } from '../src/lib/outreach-playbook';

async function main() {
  const sb = getSupabaseAdminClient();

  // 1. Check all WhatsApp activities in DB
  const { data: waActs } = await sb
    .from('activities')
    .select('id, title, activity_type, company_id, description, created_at')
    .or('activity_type.eq.whatsapp_sent,title.ilike.%whatsapp%');

  console.log('=== WhatsApp Activities in DB ===');
  console.log('Count:', waActs?.length);
  waActs?.forEach(a => {
    console.log(`- [${a.created_at?.split('T')[0]}] type: ${a.activity_type} title: "${a.title}" comp: ${a.company_id}`);
  });

  // 2. Check all WhatsApp outreach touches in DB
  const { data: waTouches } = await sb
    .from('outreach_touches')
    .select('id, lead_id, channel, status, sent_at, message')
    .eq('channel', 'whatsapp');
  console.log('=== WhatsApp Outreach Touches in DB ===');
  console.log('Count:', waTouches?.length);
  waTouches?.forEach(t => {
    console.log(`- [${t.sent_at?.split('T')[0]}] lead: ${t.lead_id} status: ${t.status}`);
  });

  // 3. Check activities on Oct 2, 3, 4, 5
  const { data: octActs } = await sb
    .from('activities')
    .select('id, company_id, title, activity_type, created_at, description')
    .gte('created_at', '2026-10-02T00:00:00.000Z')
    .lte('created_at', '2026-10-05T23:59:59.999Z')
    .order('created_at', { ascending: true });

  console.log('=== Oct 2 to 5 Activities in DB ===');
  console.log('Total count:', octActs?.length);
  const byDate: Record<string, any[]> = {};
  octActs?.forEach(a => {
    const d = a.created_at.split('T')[0];
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(a);
  });
  for (const [d, list] of Object.entries(byDate)) {
    console.log(`Day ${d}: ${list.length} activities`);
  }
}

main().catch(console.error);
