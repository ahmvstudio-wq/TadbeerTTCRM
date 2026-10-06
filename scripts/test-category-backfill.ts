import { getSupabaseAdminClient } from '../src/lib/supabase/config';
import { normalizeCategorySync } from '../src/lib/outreach-playbook';

async function main() {
  const sb = getSupabaseAdminClient();
  const { data: cos, error } = await sb.from('companies').select('id, company_name, industry, category, phone, linkedin_url, notes, research_json');
  if (error) { console.error(error); return; }

  const counts: Record<string, number> = {};
  const channelCounts: Record<string, Record<string, number>> = {
    social_commerce_dtc: { ig: 0, wa: 0, li: 0, phone: 0 },
    aesthetic_clinics: { ig: 0, wa: 0, li: 0, phone: 0 },
    dental_clinics: { ig: 0, wa: 0, li: 0, phone: 0 },
    training_education: { ig: 0, wa: 0, li: 0, phone: 0 },
    hospitality_fnb: { ig: 0, wa: 0, li: 0, phone: 0 },
    general: { ig: 0, wa: 0, li: 0, phone: 0 }
  };

  cos?.forEach(c => {
    const cat = normalizeCategorySync(c.industry, c.company_name);
    counts[cat] = (counts[cat] || 0) + 1;

    let hasIg = false;
    if (c.research_json?.instagram_url || c.research_json?.instagram_handle) hasIg = true;
    if (c.notes && (c.notes.toLowerCase().includes('instagram') || c.notes.includes('@'))) hasIg = true;
    const hasPhone = Boolean(c.phone && String(c.phone).replace(/\D/g, '').length >= 7);
    const hasLi = Boolean(c.linkedin_url);

    if (hasIg) channelCounts[cat].ig++;
    if (hasPhone) channelCounts[cat].wa++;
    if (hasLi) channelCounts[cat].li++;
    if (hasPhone) channelCounts[cat].phone++;
  });

  console.log('Categories if normalized from industry & name:');
  console.log(counts);
  console.log('\nChannels available per category:');
  console.log(channelCounts);
}

main().catch(console.error);
