import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();

  // 1. Find all activities with whatsapp
  const { data: waActs } = await sb
    .from('activities')
    .select('id, company_id, activity_type, title, description')
    .or('activity_type.eq.whatsapp_sent,title.ilike.%whatsapp%');

  console.log(`Found ${waActs?.length} WhatsApp activities in activities table.`);
  const waCompanyIds = new Set<string>();

  if (waActs && waActs.length > 0) {
    for (const act of waActs) {
      if (act.company_id) waCompanyIds.add(act.company_id);
    }
    const actIds = waActs.map(a => a.id);
    const { error: delActErr } = await sb.from('activities').delete().in('id', actIds);
    if (delActErr) console.error('Error deleting WA activities:', delActErr);
    else console.log(`Deleted ${actIds.length} false WhatsApp activities.`);
  }

  // 2. Delete all outreach_touches with channel = 'whatsapp'
  const { data: waTouches } = await sb
    .from('outreach_touches')
    .select('id, lead_id')
    .eq('channel', 'whatsapp');

  console.log(`Found ${waTouches?.length} WhatsApp touches in outreach_touches table.`);
  if (waTouches && waTouches.length > 0) {
    for (const t of waTouches) {
      if (t.lead_id) waCompanyIds.add(t.lead_id);
    }
    const touchIds = waTouches.map(t => t.id);
    const { error: delTouchErr } = await sb.from('outreach_touches').delete().in('id', touchIds);
    if (delTouchErr) console.error('Error deleting WA touches:', delTouchErr);
    else console.log(`Deleted ${touchIds.length} false WhatsApp outreach_touches.`);
  }

  // 3. For all affected companies, check if they have ANY other genuine outreach activity (e.g. LinkedIn, Instagram, Call)
  console.log(`Checking ${waCompanyIds.size} companies to see if they should be reset to 'prospect'...`);
  let resetCount = 0;

  for (const compId of waCompanyIds) {
    const { data: remainingActs } = await sb
      .from('activities')
      .select('id, activity_type, title')
      .eq('company_id', compId);

    // If company has no other outreach activities, reset status to prospect / New
    const hasOtherOutreach = (remainingActs || []).some(a =>
      ['outreach_sent', 'call_made', 'ig_dm', 'email_sent'].includes(a.activity_type) ||
      (a.title || '').toLowerCase().includes('instagram') ||
      (a.title || '').toLowerCase().includes('linkedin')
    );

    if (!hasOtherOutreach) {
      await sb.from('companies').update({
        status: 'prospect',
        pipeline_stage: 'New'
      }).eq('id', compId);
      resetCount++;
    }
  }

  console.log(`Reset ${resetCount} companies back to uncontacted 'prospect' status.`);

  // 4. Verify 0 WhatsApp activities remain
  const { data: verifyWa } = await sb
    .from('activities')
    .select('id')
    .or('activity_type.eq.whatsapp_sent,title.ilike.%whatsapp%');

  console.log(`Remaining WhatsApp activities in DB: ${verifyWa?.length || 0}`);
}

main().catch(console.error);
