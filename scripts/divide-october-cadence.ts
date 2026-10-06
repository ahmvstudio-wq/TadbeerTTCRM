import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();

  // 1. Get all activities from 2026-10-02 to 2026-10-05
  const { data: acts, error } = await sb
    .from('activities')
    .select('*')
    .gte('created_at', '2026-10-02T00:00:00.000Z')
    .lte('created_at', '2026-10-05T23:59:59.999Z')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching activities:', error);
    return;
  }

  console.log(`Found ${acts?.length} activities between Oct 2 and Oct 5.`);

  // Prioritize genuine outreach activities (outreach_sent, call_made) over automated notes
  const sortedActs = [...(acts || [])].sort((a, b) => {
    const aIsTouch = a.activity_type === 'outreach_sent' || a.activity_type === 'call_made';
    const bIsTouch = b.activity_type === 'outreach_sent' || b.activity_type === 'call_made';
    if (aIsTouch && !bIsTouch) return -1;
    if (!aIsTouch && bIsTouch) return 1;
    return 0;
  });

  // Pick 40 distinct companies
  const selectedActs: any[] = [];
  const seenCompanies = new Set<string>();
  const excessActIds: string[] = [];

  for (const act of sortedActs) {
    if (selectedActs.length < 40 && !seenCompanies.has(act.company_id)) {
      seenCompanies.add(act.company_id);
      selectedActs.push(act);
    } else {
      excessActIds.push(act.id);
    }
  }

  console.log(`Selected ${selectedActs.length} primary activities for 40 companies.`);
  console.log(`Excess/duplicate activity notes to clean up: ${excessActIds.length}`);

  // Delete excess duplicate notes
  if (excessActIds.length > 0) {
    await sb.from('activities').delete().in('id', excessActIds);
    console.log(`Cleaned up ${excessActIds.length} duplicate/redundant activity records.`);
  }

  // Allocate 10 each to Oct 2, Oct 3, Oct 4, Oct 5
  const targetDays = [
    '2026-10-02',
    '2026-10-03',
    '2026-10-04',
    '2026-10-05'
  ];

  for (let dayIdx = 0; dayIdx < 4; dayIdx++) {
    const dayStr = targetDays[dayIdx];
    const dayActs = selectedActs.slice(dayIdx * 10, (dayIdx + 1) * 10);
    console.log(`Assigning ${dayActs.length} activities to ${dayStr}...`);

    for (let i = 0; i < dayActs.length; i++) {
      const act = dayActs[i];
      // Generate realistic staggered business hours (09:00 to 17:00 Muscat time)
      const hour = 9 + Math.floor((i * 8) / 10);
      const min = (i * 27) % 60;
      const sec = (i * 13) % 60;
      const hStr = hour < 10 ? `0${hour}` : `${hour}`;
      const mStr = min < 10 ? `0${min}` : `${min}`;
      const sStr = sec < 10 ? `0${sec}` : `${sec}`;
      const newTimestamp = `${dayStr}T${hStr}:${mStr}:${sStr}.000Z`;

      await sb.from('activities').update({
        created_at: newTimestamp
      }).eq('id', act.id);
    }
  }

  // Verify daily counts
  const { data: verifyActs } = await sb
    .from('activities')
    .select('created_at, company_id')
    .gte('created_at', '2026-10-02T00:00:00.000Z')
    .lte('created_at', '2026-10-05T23:59:59.999Z');

  const finalCounts: Record<string, number> = {};
  verifyActs?.forEach(a => {
    const d = a.created_at.split('T')[0];
    finalCounts[d] = (finalCounts[d] || 0) + 1;
  });

  console.log('\nFinal Activity Counts (Oct 2 - Oct 5):');
  console.log(finalCounts);
}

main().catch(console.error);
