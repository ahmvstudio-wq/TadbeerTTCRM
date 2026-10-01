import './load-env';
import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();

  // Query PostgreSQL information_schema for check constraints
  const { data, error } = await sb.rpc('exec_sql', {
    sql_string: `
      SELECT tc.table_name, tc.constraint_name, cc.check_clause
      FROM information_schema.table_constraints tc
      JOIN information_schema.check_constraints cc
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_name IN ('companies', 'follow_ups', 'activities')
    `
  });

  if (error) {
    // If exec_sql RPC doesn't exist, let's test valid values by testing a sample
    console.log('RPC exec_sql error:', error.message);
    // Let's inspect distinct statuses in companies and channels in follow_ups
    const { data: compStatuses } = await sb.from('companies').select('status');
    const uniqueCompStatuses = Array.from(new Set(compStatuses?.map(c => c.status)));
    console.log('Existing distinct companies.status:', uniqueCompStatuses);

    const { data: fuChannels } = await sb.from('follow_ups').select('channel');
    const uniqueFuChannels = Array.from(new Set(fuChannels?.map(f => f.channel)));
    console.log('Existing distinct follow_ups.channel:', uniqueFuChannels);
  } else {
    console.log('Constraints:', data);
  }
}

main().catch(console.error);
