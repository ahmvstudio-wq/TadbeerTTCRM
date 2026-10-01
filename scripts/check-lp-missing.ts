import './load-env';
import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function fetchAllRows(sb: any, table: string, selectCols: string = '*') {
  let all: any[] = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await sb.from(table).select(selectCols).range(from, from + batchSize - 1);
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
      break;
    }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return all;
}

async function main() {
  const sb = getSupabaseAdminClient();
  const companies = await fetchAllRows(sb, 'companies', 'id, company_name, status, pipeline_stage');
  const linkedinProspects = await fetchAllRows(sb, 'linkedin_prospects', '*');

  let matched = 0;
  const missing: any[] = [];

  for (const lp of linkedinProspects) {
    const n = (lp.name || '').toLowerCase().trim();
    const c = (lp.company || '').toLowerCase().trim();

    const comp = companies.find(co => {
      const coName = co.company_name.toLowerCase().trim();
      return (c && (coName === c || coName.includes(c) || c.includes(coName))) ||
             (n && (coName === n || coName.includes(n) || n.includes(coName)));
    });

    if (comp) {
      matched++;
    } else {
      missing.push({ id: lp.id, name: lp.name, company: lp.company, title: lp.title, notes: lp.notes });
    }
  }

  console.log(`linkedin_prospects (${linkedinProspects.length}): Matched ${matched}, Missing from companies: ${missing.length}`);
  if (missing.length > 0) {
    console.log('Sample missing linkedin_prospects:');
    console.log(JSON.stringify(missing.slice(0, 10), null, 2));
  }
}

main().catch(console.error);
