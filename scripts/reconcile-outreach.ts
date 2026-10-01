import './load-env';
import { getSupabaseAdminClient } from '../src/lib/supabase/config';
import * as fs from 'fs';

async function main() {
  const sb = getSupabaseAdminClient();
  const csvPath = 'C:/Users/Mohammed_Rehan/Downloads/TTT_consolidated_outreach_data.csv';
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim().length > 0).slice(1);

  // Fetch all companies and contacts
  const { data: companies } = await sb.from('companies').select('id, company_name, status, pipeline_stage, notes');
  const { data: contacts } = await sb.from('contacts').select('id, full_name, company_id');
  const { data: lpList } = await sb.from('linkedin_prospects').select('*');

  console.log(`Initial state: ${companies?.length} companies, ${contacts?.length} contacts, ${lpList?.length} linkedin_prospects.`);

  let inCompanies = 0;
  let inLP = 0;
  let completelyNew = 0;

  for (const line of lines) {
    // Regex for CSV
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

    const compMatch = companies?.find(c => {
      const name = c.company_name.toLowerCase().trim();
      if (cLower && (name === cLower || name.includes(cLower) || cLower.includes(name))) return true;
      if (pLower && (name === pLower || name.includes(pLower) || pLower.includes(name))) return true;
      return false;
    });

    const lpMatch = lpList?.find(l => {
      const name = (l.name || '').toLowerCase().trim();
      const comp = (l.company || '').toLowerCase().trim();
      if (pLower && (name === pLower || name.includes(pLower) || pLower.includes(name))) return true;
      if (cLower && (comp === cLower || comp.includes(cLower) || cLower.includes(comp))) return true;
      return false;
    });

    if (compMatch) {
      inCompanies++;
    } else if (lpMatch) {
      inLP++;
    } else {
      completelyNew++;
      console.log(`Completely New: [${channel}] "${prospect}" | "${company}" | Touch: ${lastTouch} | State: ${factualState}`);
    }
  }

  console.log(`\nReconciliation Breakdown:`);
  console.log(`- Already in companies: ${inCompanies}`);
  console.log(`- In linkedin_prospects (needs migration to companies): ${inLP}`);
  console.log(`- Completely new (needs ingestion into companies): ${completelyNew}`);
}

main().catch(console.error);
