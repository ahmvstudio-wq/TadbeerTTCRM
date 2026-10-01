import './load-env';
import { getSupabaseAdminClient } from '../src/lib/supabase/config';
import * as fs from 'fs';

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
  const companies = await fetchAllRows(sb, 'companies', 'id, company_name, status, pipeline_stage, notes, website, linkedin_url, phone, industry');
  const contacts = await fetchAllRows(sb, 'contacts', 'id, full_name, company_id, linkedin_url, phone');
  const linkedinProspects = await fetchAllRows(sb, 'linkedin_prospects', '*');
  const followUps = await fetchAllRows(sb, 'follow_ups', '*');

  console.log(`Fetched TOTAL: ${companies.length} companies, ${contacts.length} contacts, ${linkedinProspects.length} linkedin_prospects, ${followUps.length} follow_ups.`);

  const csvPath = 'C:/Users/Mohammed_Rehan/Downloads/TTT_consolidated_outreach_data.csv';
  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.split('\n').filter(l => l.trim().length > 0).slice(1);

  let matchedCompanies = 0;
  let missingInCompanies: any[] = [];

  for (const line of lines) {
    const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(line)) !== null) {
      let val = m[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      matches.push(val.trim());
      if (regex.lastIndex >= line.length) break;
    }

    const channel = matches[0] || '';
    const prospect = matches[1] || '';
    const company = matches[2] || '';
    const lastTouch = matches[3] || '';
    const interaction = matches[4] || '';
    const response = matches[5] || '';
    const factualState = matches[6] || '';

    const pLower = prospect.toLowerCase().trim();
    const cLower = company.toLowerCase().trim();

    // Match in companies
    const comp = companies.find(c => {
      const name = c.company_name.toLowerCase().trim();
      if (cLower && (name === cLower || name.includes(cLower) || cLower.includes(name))) return true;
      if (pLower && (name === pLower || name.includes(pLower) || pLower.includes(name))) return true;
      return false;
    });

    const cont = contacts.find(ct => {
      const name = ct.full_name.toLowerCase().trim();
      return pLower && (name === pLower || name.includes(pLower) || pLower.includes(name));
    });

    if (comp || cont) {
      matchedCompanies++;
    } else {
      missingInCompanies.push({ channel, prospect, company, lastTouch, factualState });
    }
  }

  console.log(`\nResults across all 1,163 companies:`);
  console.log(`Matched: ${matchedCompanies} / ${lines.length}`);
  console.log(`Missing: ${missingInCompanies.length} / ${lines.length}`);
  if (missingInCompanies.length > 0) {
    console.log('\nMissing details:');
    console.log(JSON.stringify(missingInCompanies, null, 2));
  }
}

main().catch(console.error);
