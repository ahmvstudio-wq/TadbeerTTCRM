import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();

  const { data: compSample } = await sb.from('companies').select('*').limit(1);
  console.log('companies columns:', Object.keys(compSample?.[0] || {}));

  const { data: oppSample } = await sb.from('opportunities').select('*').limit(1);
  console.log('opportunities columns:', Object.keys(oppSample?.[0] || {}));

  const { data: fuSample } = await sb.from('follow_ups').select('*').limit(1);
  console.log('follow_ups columns:', Object.keys(fuSample?.[0] || {}));

  const { data: actSample } = await sb.from('activities').select('*').limit(1);
  console.log('activities columns:', Object.keys(actSample?.[0] || {}));

  // Check distinct pipeline stages and statuses in companies
  const { data: allCos } = await sb.from('companies').select('pipeline_stage, status, lead_status');
  const stages = new Set<string>();
  const statuses = new Set<string>();
  allCos?.forEach(c => {
    if (c.pipeline_stage) stages.add(c.pipeline_stage);
    if (c.status) statuses.add(c.status);
  });
  console.log('\nDistinct companies.pipeline_stage:', Array.from(stages));
  console.log('Distinct companies.status:', Array.from(statuses));
}

main().catch(console.error);
