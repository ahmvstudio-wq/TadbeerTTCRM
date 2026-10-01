import './load-env';
import { getSupabaseAdminClient } from '../src/lib/supabase/config';
import * as fs from 'fs';

async function fetchAllRows(sb: any, table: string, selectCols: string = '*') {
  let all: any[] = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await sb.from(table).select(selectCols).range(from, from + batchSize - 1);
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
      break;
    }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  return all;
}

async function main() {
  const sb = getSupabaseAdminClient();
  console.log('=== STARTING RECONCILIATION & FOLLOW-UP SEEDING (V2) ===');

  const existingCompanies = await fetchAllRows(sb, 'companies', 'id, company_name, status, pipeline_stage, notes, website, linkedin_url, phone, industry');
  const existingContacts = await fetchAllRows(sb, 'contacts', 'id, full_name, company_id, linkedin_url, phone');
  const existingFollowUps = await fetchAllRows(sb, 'follow_ups', 'id, company_id, status, subject, due_date');

  console.log(`Initial: ${existingCompanies.length} companies, ${existingContacts.length} contacts, ${existingFollowUps.length} follow-ups.`);

  // Valid DB statuses: 'prospect' | 'contacted' | 'lost' | 'opportunity' | 'in_call_queue' | 'meeting_booked'
  // Valid DB channels for follow_ups: 'whatsapp' | 'call' | 'email' | 'linkedin'

  const missingRecords = [
    {
      company_name: 'Rahul Kandoriya Agency',
      contact_name: 'Rahul Kandoriya',
      industry: 'Marketing & Agency',
      channel: 'linkedin',
      status: 'contacted',
      pipeline_stage: 'Audit Offered',
      notes: '[2026-05-13] Asked about repetitive/manual ops + offered audit.',
      touch_date: '2026-05-13'
    },
    {
      company_name: 'Shobha Moni',
      contact_name: 'Shobha Moni',
      industry: 'Consulting',
      channel: 'linkedin',
      status: 'lost',
      pipeline_stage: 'Lost',
      notes: '[2026-06-03] Asked about structure vs figuring things out. Dormant.',
      touch_date: '2026-06-03'
    },
    {
      company_name: 'Renuka A',
      contact_name: 'Renuka A',
      industry: 'Consulting',
      channel: 'linkedin',
      status: 'lost',
      pipeline_stage: 'Lost',
      notes: '[2026-05-23] User message: hey no reply yet. Dormant.',
      touch_date: '2026-05-23'
    },
    {
      company_name: 'Kush Verma',
      contact_name: 'Kush Verma',
      industry: 'Consulting',
      channel: 'linkedin',
      status: 'lost',
      pipeline_stage: 'Lost',
      notes: '[2026-05-16] Asked whether execution issue was workload. Dormant.',
      touch_date: '2026-05-16'
    },
    {
      company_name: 'HIPTHER',
      contact_name: 'Cantor Aurel Sebastian',
      industry: 'Media & Events',
      channel: 'linkedin',
      status: 'lost',
      pipeline_stage: 'Lost',
      notes: '[2026-09-30] Inbound vendor pitch for sponsored articles. Not a prospect.',
      touch_date: '2026-09-30'
    },
    {
      company_name: 'Eduardo Middleton',
      contact_name: 'Eduardo Middleton',
      industry: 'Technology',
      channel: 'linkedin',
      status: 'lost',
      pipeline_stage: 'Lost',
      notes: '[2026-05-23] Inbound vendor pitch. Not a prospect.',
      touch_date: '2026-05-23'
    },
    {
      company_name: 'سَـديم',
      contact_name: 'سَـديم',
      industry: 'Retail & Fashion',
      channel: 'instagram_dm',
      status: 'contacted',
      pipeline_stage: 'Follow-up Sent',
      notes: '[2026-09-28] Instagram outreach (3d). Value Check-in sent. [Instagram DM]',
      touch_date: '2026-09-28'
    },
    {
      company_name: 'عيادات سحر الابتسامة للأسنان',
      contact_name: 'عيادات سحر الابتسامة',
      industry: 'Healthcare',
      channel: 'instagram_dm',
      status: 'contacted',
      pipeline_stage: 'Audit Offered',
      notes: '[2026-09-26] Instagram outreach (5d). Outside-in Audit Offered. [Instagram DM]',
      touch_date: '2026-09-26'
    },
    {
      company_name: 'Dentology Dental Clinic',
      contact_name: 'Dentology 🦷🧠',
      industry: 'Healthcare',
      channel: 'instagram_dm',
      status: 'contacted',
      pipeline_stage: 'Audit Offered',
      notes: '[2026-09-26] Instagram outreach (5d). Outside-in Audit Offered. [Instagram DM]',
      touch_date: '2026-09-26'
    },
    {
      company_name: 'Kaya Clinic Arabia',
      contact_name: 'Kaya Clinic Arabia',
      industry: 'Healthcare',
      channel: 'instagram_dm',
      status: 'contacted',
      pipeline_stage: 'Audit Offered',
      notes: '[2026-09-26] Instagram outreach (5d). Outside-in Audit Offered. [Instagram DM]',
      touch_date: '2026-09-26'
    },
    {
      company_name: 'BY OMNIYAT Real Estate',
      contact_name: 'BY OMNIYAT🌎',
      industry: 'Real Estate',
      channel: 'instagram_dm',
      status: 'contacted',
      pipeline_stage: 'Audit Offered',
      notes: '[2026-09-26] Instagram outreach (5d). Outside-in Audit Offered. [Instagram DM]',
      touch_date: '2026-09-26'
    },
    {
      company_name: 'عيادات لافورا',
      contact_name: 'عيادات لافورا',
      industry: 'Healthcare',
      channel: 'instagram_dm',
      status: 'contacted',
      pipeline_stage: 'Audit Offered',
      notes: '[2026-09-26] Instagram outreach (5d). Outside-in Audit Offered. [Instagram DM]',
      touch_date: '2026-09-26'
    },
    {
      company_name: 'Design Dev Oman',
      contact_name: 'Design Dev',
      industry: 'Technology',
      channel: 'instagram_dm',
      status: 'lost',
      pipeline_stage: 'Lost',
      notes: '[2026-09-24] 1w touch. Dormant.',
      touch_date: '2026-09-24'
    },
    {
      company_name: 'The W Society',
      contact_name: 'The W Society',
      industry: 'Food & Beverage',
      channel: 'instagram_dm',
      status: 'lost',
      pipeline_stage: 'Lost',
      notes: '[2026-09-24] 1w touch. Dormant.',
      touch_date: '2026-09-24'
    },
    {
      company_name: "India Sotheby's Int. Realty",
      contact_name: "India Sotheby's",
      industry: 'Real Estate',
      channel: 'instagram_dm',
      status: 'lost',
      pipeline_stage: 'Lost',
      notes: '[2026-09-24] 1w touch. Dormant.',
      touch_date: '2026-09-24'
    },
    {
      company_name: 'Abhishek Vvyas',
      contact_name: 'Abhishek Vvyas',
      industry: 'Real Estate',
      channel: 'instagram_dm',
      status: 'lost',
      pipeline_stage: 'Lost',
      notes: '[2026-09-24] 1w touch. Dormant.',
      touch_date: '2026-09-24'
    },
    {
      company_name: 'Mohammed Saalim',
      contact_name: 'Mohammed Saalim',
      industry: 'Consulting',
      channel: 'instagram_dm',
      status: 'lost',
      pipeline_stage: 'Lost',
      notes: '[2026-09-24] 1w touch. Dormant.',
      touch_date: '2026-09-24'
    }
  ];

  // Ingest remaining missing companies & contacts
  for (const item of missingRecords) {
    let comp = existingCompanies.find(c => c.company_name.toLowerCase().trim() === item.company_name.toLowerCase().trim());
    if (!comp) {
      const { data: newComp, error: compErr } = await sb.from('companies').insert({
        company_name: item.company_name,
        industry: item.industry,
        status: item.status,
        pipeline_stage: item.pipeline_stage,
        notes: item.notes,
        assigned_bdm: 'Mohammed Rehan',
        created_at: new Date(item.touch_date).toISOString(),
        updated_at: new Date().toISOString()
      }).select().single();

      if (compErr) {
        console.error('Failed to insert company:', item.company_name, compErr.message);
        continue;
      }
      comp = newComp;
      console.log(`+ Created company: ${comp.company_name} (${comp.id})`);
    }

    let cont = existingContacts.find(c => c.company_id === comp.id);
    if (!cont) {
      const { data: newCont, error: contErr } = await sb.from('contacts').insert({
        company_id: comp.id,
        full_name: item.contact_name,
        title: item.industry.includes('Healthcare') ? 'Clinic Director / Owner' : 'Decision Maker',
        is_primary: true,
        created_at: new Date(item.touch_date).toISOString()
      }).select().single();

      if (!contErr) {
        console.log(`+ Created primary contact: ${newCont.full_name} for ${item.company_name}`);
      }
    }
  }

  // 2. Fetch fresh companies and contacts
  const allCompanies = await fetchAllRows(sb, 'companies', 'id, company_name, status, pipeline_stage, notes, industry, assigned_bdm');
  const allContacts = await fetchAllRows(sb, 'contacts', 'id, full_name, company_id, title');
  const currentFollowUps = await fetchAllRows(sb, 'follow_ups', 'id, company_id, status, subject, due_date');

  // 3. Process CSV rows and ensure every active outreach lead has an exact cadence follow-up
  const csvPath = 'C:/Users/Mohammed_Rehan/Downloads/TTT_consolidated_outreach_data.csv';
  const csv = fs.readFileSync(csvPath, 'utf8');
  const lines = csv.split('\n').filter(l => l.trim().length > 0).slice(1);

  let newlyScheduled = 0;

  for (const line of lines) {
    const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
    const matches: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = regex.exec(line)) !== null) {
      let val = m[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      matches.push(val.trim());
      if (regex.lastIndex >= line.length) break;
    }

    const channelRaw = matches[0] || 'LinkedIn';
    const prospect = matches[1] || '';
    const company = matches[2] || '';
    const lastTouch = matches[3] || '';
    const interaction = matches[4] || '';
    const response = matches[5] || '';
    const factualState = matches[6] || '';

    const pLower = prospect.toLowerCase().trim();
    const cLower = company.toLowerCase().trim();

    // Skip dormant / non-prospects
    if (
      factualState.includes('Not a TTT prospect') ||
      factualState.includes('boundary') ||
      factualState.includes('Old record') ||
      lastTouch.includes('1w') ||
      lastTouch.includes('2w') ||
      lastTouch.includes('14w') ||
      lastTouch.includes('15w')
    ) {
      continue;
    }

    const comp = allCompanies.find(c => {
      const name = c.company_name.toLowerCase().trim();
      return (cLower && (name === cLower || name.includes(cLower) || cLower.includes(name))) ||
             (pLower && (name === pLower || name.includes(pLower) || pLower.includes(name)));
    });

    if (!comp) continue;

    // Check if company already has a pending follow-up
    const hasPending = currentFollowUps.some(fu => fu.company_id === comp.id && fu.status === 'pending');
    if (hasPending) continue;

    const cont = allContacts.find(ct => ct.company_id === comp.id);
    const isInstagram = channelRaw.toLowerCase().includes('instagram');
    const fuChannel = isInstagram ? 'whatsapp' : 'linkedin'; // Must be whatsapp, call, email, or linkedin per check constraint

    let dueDate = '2026-10-02';
    let subject = '';
    let description = '';

    if (prospect.toLowerCase().includes('abdul rahman') || comp.company_name.toLowerCase().includes('muscat al khair')) {
      dueDate = '2026-10-03'; // +3 days
      subject = 'Follow-up: Verify Meeting Booking Confirmation (TTT Link Sent)';
      description = 'Abdul Rahman requested audit on 2026-09-30. Audit delivered & TTT calendar booking link sent. Follow up to confirm Muscat meeting or call.';
    } else if (lastTouch === '2026-09-20' || factualState.includes('Audit offered; not accepted')) {
      dueDate = '2026-09-25'; // Overdue (+5 days from Sep 20)
      subject = 'Follow-up 3: Coffee Meet in Muscat or Direct Call Proposal';
      description = `Stage 4 cadence. Outside-in audit was offered on Sep 20. Follow up proposing a 10-minute coffee meeting in Muscat or direct call. [${channelRaw}]`;
    } else if (lastTouch === '3d' || comp.pipeline_stage === 'Follow-up Sent') {
      dueDate = '2026-10-01'; // Due TODAY (+3 days from 3d ago)
      subject = 'Follow-up 2: Audit Offer ("We prepared an audit of your business")';
      description = `Stage 3 cadence. Offer outside-in business audit prepared for their business ("we looked into their business and prepared an audit and if they would be open to it"). [${channelRaw}]`;
    } else if (lastTouch === '5d' || comp.pipeline_stage === 'Audit Offered') {
      dueDate = '2026-10-01'; // Due TODAY (+5 days from 5d ago)
      subject = 'Follow-up 3: Coffee Meet / Direct Call Proposal';
      description = `Stage 4 cadence. Propose 10-minute coffee in Muscat or direct call based on the audit. [${channelRaw}]`;
    } else if (lastTouch === '2026-09-30' || lastTouch === '16h' || comp.status === 'contacted') {
      dueDate = '2026-10-02'; // Due in +2 days (tomorrow)
      subject = 'Follow-up 1: Value Check-in';
      description = `Stage 2 cadence. First value observation check-in after 2 days without reply. [${channelRaw}]`;
    } else {
      continue;
    }

    const { data: newFu, error: fuErr } = await sb.from('follow_ups').insert({
      company_id: comp.id,
      contact_id: cont?.id || null,
      due_date: dueDate,
      subject,
      description,
      channel: fuChannel,
      status: 'pending',
      created_at: new Date().toISOString()
    }).select().single();

    if (fuErr) {
      console.error(`Failed to insert follow-up for ${comp.company_name}:`, fuErr.message);
    } else {
      newlyScheduled++;
      console.log(`[Scheduled] ${comp.company_name} | Channel: ${fuChannel} (${channelRaw}) | Due: ${dueDate} | ${subject}`);
    }
  }

  console.log(`\nReconciliation finished! ${newlyScheduled} new cadence follow-ups successfully scheduled.`);
}

main().catch(console.error);
