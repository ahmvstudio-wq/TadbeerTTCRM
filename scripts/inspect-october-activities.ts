import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();

  const { data: acts } = await sb
    .from('activities')
    .select('*')
    .gte('created_at', '2026-10-01T00:00:00.000Z')
    .lte('created_at', '2026-10-06T23:59:59.999Z')
    .order('created_at', { ascending: true });

  console.log('Total activities in Oct 2026:', acts?.length);
  
  const byDay: Record<string, any[]> = {};
  acts?.forEach(a => {
    const d = a.created_at.split('T')[0];
    if (!byDay[d]) byDay[d] = [];
    byDay[d].push(a);
  });

  for (const [day, list] of Object.entries(byDay)) {
    console.log(`\n=== Day ${day}: ${list.length} activities ===`);
    const types: Record<string, number> = {};
    list.forEach(a => {
      types[a.activity_type] = (types[a.activity_type] || 0) + 1;
    });
    console.log('Types:', types);
    console.log('Sample titles:', list.slice(0, 3).map(a => a.title));
  }

  // Also check all whatsapp touches / activities in whole DB
  const { data: waActs } = await sb
    .from('activities')
    .select('id, activity_type, title, description, company_id, created_at')
    .or('activity_type.eq.whatsapp_sent,title.ilike.%whatsapp%,description.ilike.%whatsapp%');
  
  console.log('\nTotal WhatsApp activities across ALL time:', waActs?.length);
  waActs?.forEach(w => {
    console.log(`WA Act [${w.created_at?.split('T')[0]}] type: ${w.activity_type} title: "${w.title}" comp: ${w.company_id}`);
  });

  const { data: waTouches } = await sb
    .from('outreach_touches')
    .select('*')
    .eq('channel', 'whatsapp');
  console.log('\nTotal WhatsApp outreach_touches:', waTouches?.length);
}

main().catch(console.error);
