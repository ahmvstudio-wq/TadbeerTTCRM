import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function testFilter() {
  const sb = getSupabaseAdminClient();
  const { data: cos } = await sb.from('companies').select('*');
  const { data: acts } = await sb.from('activities').select('company_id');
  const contactedCoIds = new Set(acts?.map(a => a.company_id));

  const stages: Record<string, number> = {
    outreach: 0,
    meeting: 0,
    demo: 0,
    proposal: 0,
    follow_up: 0,
    won: 0,
    lost: 0,
    uncontacted_directory: 0
  };

  cos?.forEach(c => {
    const rJson = c.research_json || {};
    const pStage = String(c.pipeline_stage || '').toLowerCase();
    const dbStatus = String(c.status || '').toLowerCase();
    const leadStatus = String(c.lead_status || '').toLowerCase();
    const hasActivity = contactedCoIds.has(c.id);

    if (rJson.pipeline_stage) {
      const raw = String(rJson.pipeline_stage).toLowerCase().trim();
      if (['outreach', 'meeting', 'demo', 'proposal', 'follow_up', 'won', 'lost'].includes(raw)) {
        stages[raw]++;
        return;
      }
    }

    if (dbStatus === 'won' || leadStatus === 'won' || pStage.includes('won')) {
      stages.won++;
      return;
    }

    if (dbStatus === 'lost' || leadStatus === 'lost' || leadStatus === 'archived' || dbStatus === 'dormant' || pStage.includes('lost') || pStage.includes('dormant')) {
      stages.lost++;
      return;
    }

    if (pStage.includes('demo') || pStage.includes('presentation') || rJson.demo_status === 'in_progress' || rJson.demo_status === 'required' || (rJson.demo_urls && rJson.demo_urls.length > 0)) {
      stages.demo++;
      return;
    }

    if (pStage.includes('proposal') || pStage.includes('quotation') || pStage.includes('mou') || leadStatus.includes('proposal') || rJson.proposal_status === 'sent' || rJson.proposal_status === 'drafting') {
      stages.proposal++;
      return;
    }

    if (pStage.includes('negotiation') || pStage.includes('follow-up / negotiation') || leadStatus.includes('negotiation') || rJson.follow_up_status === 'required' || rJson.follow_up_status === 'waiting_response') {
      stages.follow_up++;
      return;
    }

    if (dbStatus === 'meeting_booked' || leadStatus.includes('meeting') || pStage.includes('meeting') || pStage.includes('coffee')) {
      stages.meeting++;
      return;
    }

    // Active outreach check: only leads with actual outreach touches or active outreach statuses
    const isOutreach =
      hasActivity ||
      dbStatus === 'contacted' ||
      dbStatus === 'in_call_queue' ||
      pStage.includes('contacted') ||
      pStage.includes('follow-up') ||
      pStage.includes('audit') ||
      pStage.includes('warm-up') ||
      pStage.includes('no reply') ||
      pStage.includes('replied') ||
      pStage.includes('call ready') ||
      pStage.includes('opening');

    if (isOutreach) {
      stages.outreach++;
      return;
    }

    // Raw uncontacted directory lead
    stages.uncontacted_directory++;
  });

  console.log('Filtered Stage Distribution:');
  console.log(stages);
  process.exit(0);
}

testFilter().catch(console.error);
