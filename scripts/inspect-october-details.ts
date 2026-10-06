import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();

  const { data: acts } = await sb
    .from('activities')
    .select('id, company_id, title, description, activity_type, created_at')
    .gte('created_at', '2026-10-02T00:00:00.000Z')
    .lte('created_at', '2026-10-05T23:59:59.999Z')
    .order('created_at', { ascending: true });

  console.log('Total activities from Oct 2 to Oct 5:', acts?.length);
  
  const outreachActs = (acts || []).filter(a => a.activity_type === 'outreach_sent' || a.activity_type === 'call_made' || a.activity_type === 'whatsapp_sent');
  console.log('Outreach / touch activities:', outreachActs.length);
  
  const notesAndOthers = (acts || []).filter(a => a.activity_type !== 'outreach_sent' && a.activity_type !== 'call_made' && a.activity_type !== 'whatsapp_sent');
  console.log('Notes / other activities:', notesAndOthers.length);

  // Group by company
  const companyActs: Record<string, any[]> = {};
  acts?.forEach(a => {
    if (!companyActs[a.company_id]) companyActs[a.company_id] = [];
    companyActs[a.company_id].push(a);
  });

  console.log('Unique companies with activities in this range:', Object.keys(companyActs).length);

  for (const [cid, cList] of Object.entries(companyActs).slice(0, 10)) {
    console.log(`Company ${cid}: ${cList.length} activities (${cList.map(a => `${a.created_at.split('T')[0]}: ${a.title}`).join(', ')})`);
  }
}

main().catch(console.error);
