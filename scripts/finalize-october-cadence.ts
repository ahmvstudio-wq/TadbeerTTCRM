import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();

  console.log('=== Step 1: Renaming Placeholder Companies ===');
  const nameUpdates = [
    { id: 'ec9c323b-9240-4fc3-8b9d-e98171a5c09b', newName: 'Imaaduddin Khan' },
    { id: 'c0dbbd45-2b5e-47af-a4f9-5fe74199c7cf', newName: 'Shammas Mohammed' },
    { id: 'd6406da0-4217-4691-b0b6-1e1b92770efd', newName: 'Mehraj Syed' },
    { id: '99d42829-b313-4754-88e9-65c08e8c6806', newName: 'Jithin Joseph' },
    { id: '30141074-7fd3-47cc-8080-a5e829732bb8', newName: 'Deepak Kumar' },
    { id: 'd4e52034-e6da-4206-a0dc-00e1f2de1ab8', newName: 'Anil Menon' },
    { id: 'a630527f-1ccf-45f0-bc20-20173afc6f84', newName: 'Ghala Golf Club / Faiz Mohammad Riaz' },
  ];

  for (const item of nameUpdates) {
    const { error } = await sb
      .from('companies')
      .update({ company_name: item.newName, updated_at: new Date().toISOString() })
      .eq('id', item.id);

    if (error) {
      console.error(`Failed to update company ${item.id}:`, error);
    } else {
      console.log(`Updated company ${item.id} -> "${item.newName}"`);
    }
  }

  console.log('\n=== Step 2: Moving Overflow Activities from Oct 1 to Oct 6 ===');
  // Taageer Finance Company & Mohammed Huzefa
  const move1 = await sb
    .from('activities')
    .update({ created_at: '2026-10-06T09:00:00.000Z' })
    .eq('id', 'ddd0fea1-f38f-4318-ac9e-c08835b88c70');
  console.log('Moved Taageer Finance Company to 2026-10-06T09:00:00.000Z:', move1.error || 'SUCCESS');

  const move2 = await sb
    .from('activities')
    .update({ created_at: '2026-10-06T09:45:00.000Z' })
    .eq('id', 'fdd2d121-66a9-4e30-a1cb-02992a1fbac5');
  console.log('Moved Mohammed Huzefa to 2026-10-06T09:45:00.000Z:', move2.error || 'SUCCESS');

  console.log('\n=== Step 3: Seeding 8 Fresh Prospects for Oct 6 (DTC & Aesthetics) ===');
  const freshCompanyIds = [
    { id: '04f0dc8b-af53-41f0-9f74-2dd96cb54d77', time: '2026-10-06T10:30:00.000Z', channel: 'Instagram DM', title: 'Instagram DM — First Outreach' },
    { id: '303b1759-6773-4499-85ab-b64962211fec', time: '2026-10-06T11:15:00.000Z', channel: 'Instagram DM', title: 'Instagram DM — First Outreach' },
    { id: '8f0c4700-ee5d-4150-8c87-fd3827368c0e', time: '2026-10-06T12:00:00.000Z', channel: 'Instagram DM', title: 'Instagram DM — First Outreach' },
    { id: '5d520514-752d-4bf8-9a38-752635395d98', time: '2026-10-06T12:45:00.000Z', channel: 'Instagram DM', title: 'Instagram DM — First Outreach' },
    { id: '1c60d714-5632-4835-a823-20ab974d6a30', time: '2026-10-06T13:30:00.000Z', channel: 'Instagram DM', title: 'Instagram DM — First Outreach' },
    { id: '1ee810d0-da48-4026-aa38-a9aca560e178', time: '2026-10-06T14:15:00.000Z', channel: 'Instagram DM', title: 'Instagram DM — Clinic Introduction' },
    { id: '5ecbb983-6fb0-4a37-8549-3aca96a15815', time: '2026-10-06T15:00:00.000Z', channel: 'Instagram DM', title: 'Instagram DM — Clinic Introduction' },
    { id: 'bf3e7fca-fac9-4f5a-bc27-24b1e98dad50', time: '2026-10-06T15:45:00.000Z', channel: 'Instagram DM', title: 'Instagram DM — Clinic Introduction' },
  ];

  for (const item of freshCompanyIds) {
    // Fetch company & contact
    const { data: comp } = await sb
      .from('companies')
      .select('*, contacts(*)')
      .eq('id', item.id)
      .single();

    if (!comp) {
      console.warn(`Company ${item.id} not found!`);
      continue;
    }

    const contactId = comp.contacts?.[0]?.id || null;
    const contactName = comp.contacts?.[0]?.full_name || comp.company_name;

    // Check if activity already exists for this company
    const { data: existingAct } = await sb
      .from('activities')
      .select('id')
      .eq('company_id', item.id)
      .limit(1);

    if (existingAct && existingAct.length > 0) {
      console.log(`Activity already exists for ${comp.company_name}, skipping insert.`);
    } else {
      const { error: insErr } = await sb
        .from('activities')
        .insert({
          company_id: item.id,
          contact_id: contactId,
          activity_type: 'outreach_sent',
          title: item.title,
          description: `Dispatched direct outreach to ${contactName} via ${item.channel}. Staged for October 6 cadence.`,
          created_at: item.time,
        });

      if (insErr) {
        console.error(`Failed to insert activity for ${comp.company_name}:`, insErr);
      } else {
        console.log(`Inserted activity for "${comp.company_name}" at ${item.time}`);
      }

      // Update pipeline stage to Contacted
      await sb
        .from('companies')
        .update({
          status: 'contacted',
          pipeline_stage: 'Contacted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);
    }
  }

  console.log('\n=== Step 4: Verification of Daily Counts across October 2026 ===');
  const { data: acts } = await sb
    .from('activities')
    .select('id, created_at, title, companies(company_name)')
    .gte('created_at', '2026-10-01T00:00:00.000Z')
    .lte('created_at', '2026-10-31T23:59:59.999Z')
    .order('created_at', { ascending: true });

  const finalCounts: Record<string, number> = {};
  acts?.forEach((a: any) => {
    const d = a.created_at.split('T')[0];
    finalCounts[d] = (finalCounts[d] || 0) + 1;
  });

  console.log('Daily Outreach Volume in October 2026:');
  console.log(finalCounts);
  console.log(`Total October Activities: ${acts?.length}`);
}

main().catch(console.error);
