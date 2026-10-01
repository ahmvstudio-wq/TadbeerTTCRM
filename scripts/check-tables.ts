import './load-env';
import { getSupabaseAdminClient } from '../src/lib/supabase/config';
import * as fs from 'fs';

async function main() {
  const sb = getSupabaseAdminClient();
  
  // 1. Check linkedin_prospects
  const { data: lp, count: lpCount } = await sb.from('linkedin_prospects').select('id, full_name, company_name, lead_type', { count: 'exact' });
  console.log('linkedin_prospects count:', lpCount);

  // 2. Check companies
  const { data: comp, count: compCount } = await sb.from('companies').select('id, company_name, status, pipeline_stage', { count: 'exact' });
  console.log('companies count:', compCount);

  // 3. Check contacts
  const { data: ct, count: ctCount } = await sb.from('contacts').select('id, full_name, company_id', { count: 'exact' });
  console.log('contacts count:', ctCount);

  // 4. Check activities
  const { count: actCount } = await sb.from('activities').select('*', { count: 'exact', head: true });
  console.log('activities count:', actCount);

  // 5. Check CSV vs companies & linkedin_prospects
  const csvPath = 'C:/Users/Mohammed_Rehan/Downloads/TTT_consolidated_outreach_data.csv';
  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.split('\n').filter(l => l.trim().length > 0).slice(1);
  console.log('\n--- Checking 77 CSV Rows ---');
  
  let inCompanies = 0;
  let inLinkedin = 0;
  let missingBoth = 0;
  const missingRows: any[] = [];

  for (const line of lines) {
    const parts = line.split(',');
    const channel = parts[0]?.trim();
    const prospect = parts[1]?.trim().replace(/^"|"$/g, '');
    const company = parts[2]?.trim().replace(/^"|"$/g, '');

    const pLower = prospect.toLowerCase();
    const cLower = company.toLowerCase();

    const compMatch = comp?.find(c => {
      const name = c.company_name.toLowerCase();
      if (cLower && (name === cLower || name.includes(cLower) || cLower.includes(name))) return true;
      if (pLower && (name === pLower || name.includes(pLower) || pLower.includes(name))) return true;
      return false;
    });

    const lpMatch = lp?.find(l => {
      const name = (l.full_name || '').toLowerCase();
      const cName = (l.company_name || '').toLowerCase();
      if (pLower && (name === pLower || name.includes(pLower) || pLower.includes(name))) return true;
      if (cLower && (cName === cLower || cName.includes(cLower) || cLower.includes(name))) return true;
      return false;
    });

    if (compMatch) inCompanies++;
    if (lpMatch) inLinkedin++;
    if (!compMatch && !lpMatch) {
      missingBoth++;
      missingRows.push({ channel, prospect, company });
    }
  }

  console.log(`Matched in companies: ${inCompanies} / ${lines.length}`);
  console.log(`Matched in linkedin_prospects: ${inLinkedin} / ${lines.length}`);
  console.log(`Missing in both: ${missingBoth} / ${lines.length}`);
  if (missingRows.length > 0) {
    console.log('Sample missing:', missingRows.slice(0, 15));
  }
}

main().catch(console.error);
