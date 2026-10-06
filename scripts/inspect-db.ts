import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();

  // 1. Check all activities
  const { data: acts, error: actErr } = await sb
    .from('activities')
    .select('id, activity_type, title, description, company_id, created_at')
    .order('created_at', { ascending: false });

  if (actErr) {
    console.error('Act error:', actErr);
    return;
  }

  console.log('Total activities count:', acts?.length);

  const byDate = {} as Record<string, number>;
  const byType = {} as Record<string, number>;
  const waActivities: any[] = [];

  acts?.forEach(a => {
    const d = a.created_at ? a.created_at.split('T')[0] : 'unknown';
    byDate[d] = (byDate[d] || 0) + 1;
    byType[a.activity_type] = (byType[a.activity_type] || 0) + 1;

    const tLower = (a.title || '').toLowerCase();
    const dLower = (a.description || '').toLowerCase();
    const typeLower = (a.activity_type || '').toLowerCase();
    if (
      typeLower.includes('whatsapp') ||
      tLower.includes('whatsapp') ||
      dLower.includes('whatsapp')
    ) {
      waActivities.push(a);
    }
  });

  console.log('Activities by Date:', byDate);
  console.log('Activities by Type:', byType);
  console.log('WhatsApp related activities count:', waActivities.length);
  if (waActivities.length > 0) {
    console.log('Sample WA activities:', waActivities.slice(0, 5).map(a => ({
      id: a.id,
      title: a.title,
      type: a.activity_type,
      created_at: a.created_at,
      company_id: a.company_id
    })));
  }

  // 2. Check companies categories and industries
  const { data: cos, error: cosErr } = await sb
    .from('companies')
    .select('id, company_name, industry, category, status, pipeline_stage, notes, research_json');

  if (cosErr) {
    console.error('Cos error:', cosErr);
    return;
  }

  console.log('Total companies count:', cos?.length);

  const indCounts = {} as Record<string, number>;
  const catCounts = {} as Record<string, number>;
  const statusCounts = {} as Record<string, number>;

  let dtcCompanies: any[] = [];

  cos?.forEach(c => {
    const ind = c.industry || 'none';
    const cat = c.category || 'none';
    indCounts[ind] = (indCounts[ind] || 0) + 1;
    catCounts[cat] = (catCounts[cat] || 0) + 1;
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;

    const indL = ind.toLowerCase();
    const catL = cat.toLowerCase();
    if (
      catL.includes('dtc') ||
      catL.includes('commerce') ||
      indL.includes('dtc') ||
      indL.includes('commerce') ||
      indL.includes('retail') ||
      indL.includes('boutique') ||
      indL.includes('fashion') ||
      indL.includes('perfume') ||
      indL.includes('oud') ||
      indL.includes('cafe') ||
      indL.includes('clothing')
    ) {
      dtcCompanies.push(c);
    }
  });

  console.log('Top 15 industries:', Object.entries(indCounts).sort((a,b) => b[1] - a[1]).slice(0, 15));
  console.log('Categories:', catCounts);
  console.log('Statuses:', statusCounts);
  console.log('DTC / Commerce matching companies found:', dtcCompanies.length);
  console.log('DTC / Commerce sample companies:', dtcCompanies.slice(0, 10).map(c => ({
    name: c.company_name,
    industry: c.industry,
    category: c.category,
    status: c.status,
    pipeline_stage: c.pipeline_stage
  })));
}

main().catch(console.error);
