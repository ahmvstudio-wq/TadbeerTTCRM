import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();

  const { data: companies, error } = await sb
    .from('companies')
    .select('id, company_name, phone, status, pipeline_stage, category')
    .not('status', 'in', '("won","lost","archived")')
    .limit(10);

  console.log('Error:', error);
  console.log('Sample companies fetched count:', companies?.length);
  if (companies && companies.length > 0) {
    console.log('Sample company:', companies[0]);
  }
}

main().catch(console.error);
