import { getSupabaseAdminClient } from '../src/lib/supabase/config';

async function main() {
  const sb = getSupabaseAdminClient();
  const { data: cos } = await sb.from('companies').select('id, company_name, status, pipeline_stage, lead_status, research_json');
  const { data: acts } = await sb.from('activities').select('company_id, activity_type, created_at');
  const { data: preps } = await sb.from('outreach_preparations').select('company_id, status');
  const { data: items } = await sb.from('daily_outreach_items').select('company_id, status');

  const contactedFromActs = new Set(acts?.map(a => a.company_id));
  const contactedFromPreps = new Set(preps?.filter(p => p.status === 'sent').map(p => p.company_id));
  const contactedFromItems = new Set(items?.filter(i => i.status === 'sent').map(i => i.company_id));

  console.log('Total Companies in CRM:', cos?.length);
  console.log('Companies with logged activities:', contactedFromActs.size);
  console.log('Companies with outreach preps sent:', contactedFromPreps.size);
  console.log('Companies with daily outreach items sent:', contactedFromItems.size);

  const statusBreakdown: Record<string, number> = {};
  const stageBreakdown: Record<string, number> = {};

  let activeOutreachCount = 0;
  let uncontactedProspectsCount = 0;

  cos?.forEach(c => {
    statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1;
    stageBreakdown[c.pipeline_stage || 'null'] = (stageBreakdown[c.pipeline_stage || 'null'] || 0) + 1;

    const hasOutreachActivity = contactedFromActs.has(c.id) || contactedFromPreps.has(c.id) || contactedFromItems.has(c.id);
    const hasActiveOutreachStatus = c.status === 'contacted' || c.status === 'in_call_queue' || c.pipeline_stage === 'Contacted' || c.pipeline_stage === 'Follow-Up Sent' || c.pipeline_stage === 'Audit Offered' || c.pipeline_stage === 'No Reply' || c.pipeline_stage === 'Follow-up Sent' || c.pipeline_stage === 'Audit Sent' || c.pipeline_stage === 'Warm-Up In Progress';

    if (hasOutreachActivity || hasActiveOutreachStatus) {
      activeOutreachCount++;
    } else {
      uncontactedProspectsCount++;
    }
  });

  console.log('\nStatus Breakdown:', statusBreakdown);
  console.log('\nPipeline Stage Breakdown:', stageBreakdown);
  console.log('\nActive Outreach Accounts:', activeOutreachCount);
  console.log('Raw Uncontacted Directory Prospects:', uncontactedProspectsCount);
}

main().catch(console.error);
