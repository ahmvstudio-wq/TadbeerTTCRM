import './load-env';
import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();
  const clinics = [
    'Plaza Clinic',
    'GHC CLINIC',
    'MCC Medical Clinic',
    'AHMED BEAUTY LOUNGE',
    'Hussain Beauty Lounge',
    'Yusr Real Estate'
  ];

  const { data: companies } = await sb.from('companies').select('id, company_name, status, pipeline_stage');

  for (const c of clinics) {
    const found = companies?.find(co => co.company_name.toLowerCase().includes(c.toLowerCase()));
    console.log(c, '->', found ? `FOUND (${found.id}, status: ${found.status})` : 'NOT FOUND');
  }
}

main().catch(console.error);
