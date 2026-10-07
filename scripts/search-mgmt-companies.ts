import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();
  const searchTerms = [
    'Skyline',
    'Gadgets',
    'Panel',
    'Muscle',
    'Fragrance',
    'Al Qurum',
    'Qurum',
    'AQP',
    'DCIP',
    'Jelan',
    'Elite',
    'Yalla'
  ];

  console.log('Searching for specified companies in DB:');
  for (const term of searchTerms) {
    const { data: cos } = await sb
      .from('companies')
      .select('id, company_name, industry, category, pipeline_stage, status, notes, research_json, assigned_to, assigned_bdm, contacts(*)')
      .ilike('company_name', `%${term}%`);

    console.log(`\nResults for "${term}": ${cos?.length || 0}`);
    cos?.forEach(c => {
      console.log(`- [${c.id}] "${c.company_name}" | Stage: ${c.pipeline_stage} | Status: ${c.status} | Contacts: ${c.contacts?.map((cnt: any) => cnt.full_name).join(', ')}`);
    });
  }
}

main().catch(console.error);
