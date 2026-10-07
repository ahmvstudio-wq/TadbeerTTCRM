import { getPipelineOverview } from '../src/lib/actions/pipeline';

async function test() {
  console.log('Testing getPipelineOverview()...');
  const data = await getPipelineOverview();
  console.log('Total leads retrieved:', data.leads.length);
  console.log('\nStage summaries:');
  Object.entries(data.stageSummaries).forEach(([k, v]) => {
    console.log(`- Stage "${k}": ${v.count} leads`);
  });

  console.log('\nPipeline Intelligence Metrics:', data.metrics);

  console.log('\n--- DEMO STAGE LEADS ---');
  const demoLeads = data.leads.filter(l => l.canonical_stage === 'demo');
  demoLeads.forEach(l => {
    console.log(`\n• ${l.company_name} (Owner: ${l.owner_name})`);
    console.log(`  Action: ${l.next_action}`);
    console.log(`  Due Date: ${l.action_due_date} (Overdue: ${l.is_overdue}, Today: ${l.is_today})`);
    console.log(`  Demo Status: ${l.demo_status}, Presentation: ${l.presentation_status}`);
    if (l.demo_urls?.length) console.log(`  Demo URLs:`, l.demo_urls);
    if (l.presentation_urls?.length) console.log(`  Presentation URLs:`, l.presentation_urls);
  });

  console.log('\n--- PROPOSAL STAGE LEADS ---');
  const proposalLeads = data.leads.filter(l => l.canonical_stage === 'proposal');
  proposalLeads.forEach(l => {
    console.log(`\n• ${l.company_name} (Owner: ${l.owner_name})`);
    console.log(`  Action: ${l.next_action}`);
    console.log(`  Proposal Status: ${l.proposal_status}`);
  });

  console.log('\n--- FOLLOW-UP / NEGOTIATION LEADS ---');
  const fuLeads = data.leads.filter(l => l.canonical_stage === 'follow_up');
  fuLeads.forEach(l => {
    console.log(`\n• ${l.company_name} (Owner: ${l.owner_name})`);
    console.log(`  Action: ${l.next_action}`);
  });
}

test().catch(console.error);
