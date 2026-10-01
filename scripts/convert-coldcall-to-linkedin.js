const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env.local'));
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function convertColdCallToLinkedIn() {
  console.log('--- 1. Updating Activities: Convert cold call to LinkedIn ---');

  // Fetch all activities
  let allActivities = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    allActivities = allActivities.concat(data);
    if (data.length < 1000) break;
    page++;
  }

  console.log('Total activities in DB:', allActivities.length);
  let updatedActCount = 0;

  for (const act of allActivities) {
    let payload = {};
    try { payload = JSON.parse(act.description); } catch {}
    
    const actTitle = (act.title || '').toLowerCase();
    const actType = (act.activity_type || '').toLowerCase();
    const ch = (payload.channel || '').toLowerCase();

    const isColdCall = ch === 'cold_call' || actTitle.includes('cold call') || actType === 'call_made';

    if (isColdCall) {
      payload.channel = 'linkedin';
      if (!payload.template_used || payload.template_used === 'cold_call') {
        payload.template_used = 'gate_opener';
      }

      const updatedTitle = (act.title || 'Outreach').replace(/cold call/gi, 'LinkedIn');

      const { error: actUpErr } = await supabase
        .from('activities')
        .update({
          activity_type: 'outreach_sent',
          title: updatedTitle.includes('LinkedIn') ? updatedTitle : 'LinkedIn — ' + updatedTitle,
          description: JSON.stringify(payload)
        })
        .eq('id', act.id);

      if (!actUpErr) {
        updatedActCount++;
      }
    }
  }

  console.log(`Updated ${updatedActCount} cold call activities to LinkedIn!`);

  console.log('\n--- 2. Updating Companies: Convert lead_source/target_channel from cold call to LinkedIn ---');
  let allCompanies = [];
  page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    allCompanies = allCompanies.concat(data);
    if (data.length < 1000) break;
    page++;
  }

  let updatedCompCount = 0;

  for (const comp of allCompanies) {
    let rJson = {};
    try {
      if (typeof comp.research_json === 'object') rJson = comp.research_json || {};
      else if (comp.research_json) rJson = JSON.parse(comp.research_json);
    } catch {}

    let needsUpdate = false;
    const leadSrc = (comp.lead_source || '').toLowerCase();

    if (leadSrc.includes('call') || leadSrc === 'cold_call') {
      comp.lead_source = 'LinkedIn';
      needsUpdate = true;
    }

    if (rJson.target_channel === 'cold_call') {
      rJson.target_channel = 'linkedin';
      needsUpdate = true;
    }

    if (needsUpdate) {
      const { error: compUpErr } = await supabase
        .from('companies')
        .update({
          lead_source: comp.lead_source === 'LinkedIn' ? 'LinkedIn' : comp.lead_source,
          research_json: rJson
        })
        .eq('id', comp.id);

      if (!compUpErr) {
        updatedCompCount++;
      }
    }
  }

  console.log(`Updated ${updatedCompCount} companies from cold call to LinkedIn!`);
}

convertColdCallToLinkedIn();
