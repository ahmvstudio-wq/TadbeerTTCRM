const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env.local'));
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function updateAbdulRahman() {
  console.log('--- Updating Abdul Rahman (Muscat Al Khair Investment SPC) ---');

  // 1. Update Companies table
  const { data: comp, error: compErr } = await supabase
    .from('companies')
    .update({
      pipeline_stage: 'Audit Sent',
      lead_status: 'Qualified',
      lead_type: 'Warm',
      status: 'contacted',
      notes: 'Owner @ Muscat Al Khair Investment SPC | Business Development, Logistics Management.\n[2026-09-30] Replied: Requested an audit ("would love to see an audit"). Marked Warm & Audit Sent.',
      updated_at: new Date().toISOString()
    })
    .eq('id', '1ef9007e-0214-484a-904d-f7b2f021b3a9')
    .select()
    .single();

  console.log('Company update result:', compErr ? compErr.message : 'SUCCESS', comp ? { name: comp.company_name, stage: comp.pipeline_stage, lead_type: comp.lead_type, lead_status: comp.lead_status } : null);

  // 2. Update LinkedIn Prospects table
  const { data: lpList } = await supabase.from('linkedin_prospects').select('*').eq('id', 'bfa960fe-0948-4044-a5e4-11d74f1ac23f');
  if (lpList && lpList.length > 0) {
    const lp = lpList[0];
    const newAct = {
      id: 'act-' + Date.now() + '-aud',
      date: '2026-09-30',
      activity_type: 'dm_sent',
      description: 'Prospect replied: Requested an audit. Audit Sent & Marked Warm.',
      status: 'confirmed'
    };
    const updatedActivities = [newAct, ...(Array.isArray(lp.activities) ? lp.activities : [])];

    const { data: updatedLp, error: lpErr } = await supabase
      .from('linkedin_prospects')
      .update({
        connection_status: 'connected',
        message_status: 'replied',
        priority: 'High',
        lead_type: 'Warm Prospect / Audit In Progress',
        notes: (lp.notes || '') + '\n[2026-09-30] Replied: Requested audit. Marked Warm & Audit Sent.',
        activities: updatedActivities,
        updated_at: new Date().toISOString()
      })
      .eq('id', lp.id)
      .select()
      .single();

    console.log('LinkedIn Prospect update result:', lpErr ? lpErr.message : 'SUCCESS', updatedLp ? { name: updatedLp.name, msg_status: updatedLp.message_status, lead_type: updatedLp.lead_type } : null);
  }
}

updateAbdulRahman();
