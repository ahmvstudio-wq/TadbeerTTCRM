import { getSupabaseAdminClient } from '../src/lib/supabase/config';
import { normalizeCategorySync } from '../src/lib/outreach-playbook';

async function main() {
  const sb = getSupabaseAdminClient();
  const { data: cos, error } = await sb
    .from('companies')
    .select('id, company_name, industry, category');

  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Analyzing ${cos?.length} companies for category backfill...`);

  let updatedCount = 0;
  const updates: { id: string; category: string }[] = [];

  for (const c of (cos || [])) {
    const correctCat = normalizeCategorySync(c.industry, c.company_name);
    if (c.category !== correctCat) {
      updates.push({ id: c.id, category: correctCat });
    }
  }

  console.log(`Found ${updates.length} companies needing category update.`);

  // Batch update in chunks of 50
  for (let i = 0; i < updates.length; i += 50) {
    const chunk = updates.slice(i, i + 50);
    await Promise.all(
      chunk.map(u =>
        sb.from('companies').update({ category: u.category }).eq('id', u.id)
      )
    );
    updatedCount += chunk.length;
    process.stdout.write(`Updated ${updatedCount}/${updates.length} companies...\r`);
  }

  console.log(`\nSuccessfully backfilled categories for ${updatedCount} companies!`);

  // Verify resulting category counts
  const { data: verifyCos } = await sb.from('companies').select('category');
  const counts: Record<string, number> = {};
  verifyCos?.forEach(c => {
    counts[c.category || 'none'] = (counts[c.category || 'none'] || 0) + 1;
  });
  console.log('New Category Counts in Database:');
  console.log(counts);
}

main().catch(console.error);
