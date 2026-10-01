import './load-env';
import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();
  const names = ['Plaza Clinic', 'GHC CLINIC', 'Ahmed', 'Hussain', 'Yusr', 'Manoj Prem', 'Yousuf Allamki', 'Vishal Sobti'];

  for (const n of names) {
    const { data: acts } = await sb.from('activities').select('*').ilike('description', `%${n}%`);
    if (acts && acts.length > 0) {
      console.log(`\n=== Matches for ${n} (${acts.length}) ===`);
      for (const a of acts) {
        console.log(`Activity ID: ${a.id}, company_id: ${a.company_id}, title: ${a.title}`);
        console.log(`Description: ${a.description}`);
      }
    }
  }
}

main().catch(console.error);
