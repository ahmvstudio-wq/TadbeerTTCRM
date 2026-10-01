import './load-env';
import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();
  const ids = [
    'e372997d-b37e-4eab-8f71-6d4351917c69',
    '3bd68dd2-0c4e-44d7-b269-3a77f99cf53e',
    '248c3ee4-82d2-4b85-b56f-c38363adca7d',
    'c9167874-11c8-4a51-a57b-a24c2fe4bc34',
    'a377e503-ce4f-4cb4-99b8-a398dea3ad3e',
    'c82c9210-68d1-4f03-8049-a0922e51ed13',
    'c2d268e1-6a48-4c98-86d7-c7b4f45e2abc'
  ];

  const { data: companies } = await sb.from('companies').select('*').in('id', ids);
  for (const c of (companies || [])) {
    console.log(`ID: ${c.id} | Name: "${c.company_name}" | Status: ${c.status} | Stage: ${c.pipeline_stage}`);
  }
}

main().catch(console.error);
