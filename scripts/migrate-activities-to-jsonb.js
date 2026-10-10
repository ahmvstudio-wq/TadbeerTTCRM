const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env.local'));
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function migrateActivitiesToJsonb() {
  console.log('=== STARTING ACTIVITIES JSONB CLEANUP ===\n');

  // Fetch all activities
  let allActs = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    allActs = allActs.concat(data);
    if (data.length < 1000) break;
    page++;
  }

  console.log(`Loaded ${allActs.length} activities.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const act of allActs) {
    let payload = null;
    const desc = act.description ? act.description.trim() : '';

    if (desc.startsWith('{') || desc.startsWith('[')) {
      try {
        const parsed = JSON.parse(desc);
        if (parsed && typeof parsed === 'object') {
          payload = parsed;
        }
      } catch {}
    }

    // If description was stringified JSON
    if (payload) {
      const mergedMetadata = {
        ...(act.metadata && typeof act.metadata === 'object' ? act.metadata : {}),
        ...payload
      };

      // Create a clean human-readable description
      const cleanDesc = payload.notes || payload.prospect_reply || payload.call_opening_line || act.title || 'Outreach activity logged';

      const { error: upErr } = await supabase
        .from('activities')
        .update({
          metadata: mergedMetadata,
          description: cleanDesc
        })
        .eq('id', act.id);

      if (upErr) {
        console.error(`Error updating activity ${act.id}:`, upErr.message);
      } else {
        migratedCount++;
      }
    } else {
      // Description is already clean text
      if (!act.metadata && desc) {
        // Just ensure metadata is at least an empty object or leave as is
      }
      skippedCount++;
    }
  }

  console.log(`\nCleanup results:
  - Migrated from stringified text to native metadata JSONB: ${migratedCount}
  - Already clean text description: ${skippedCount}
  - Total processed: ${allActs.length}`);

  // Verification: check if any activities still have stringified JSON in description
  const { data: verifyActs } = await supabase.from('activities').select('id, description, metadata').limit(50);
  const stillJson = verifyActs?.filter(a => a.description && (a.description.startsWith('{') || a.description.startsWith('['))) || [];
  console.log(`\nVerification: Activities still storing JSON in description: ${stillJson.length}`);
  console.log('Sample updated activity:', {
    id: verifyActs?.[0]?.id,
    description: verifyActs?.[0]?.description,
    metadata: verifyActs?.[0]?.metadata
  });

  console.log('\n=== ACTIVITIES CLEANUP COMPLETE ===');
}

migrateActivitiesToJsonb();
