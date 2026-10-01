import './load-env';
import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();
  const { data, error } = await sb.from('linkedin_prospects').select('*').limit(3);
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log('Sample linkedin_prospects count:', data.length);
  if (data.length > 0) {
    console.log('Keys:', Object.keys(data[0]));
    console.log('Row 0:', data[0]);
  }
}

main().catch(console.error);
