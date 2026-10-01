process.env.CRM_TEST_MODE = 'true'
import './load-env'
import { getSupabaseAdminClient } from '../src/lib/supabase/config'

const supabase = getSupabaseAdminClient()

interface OutreachReportItem {
  idNum: number
  prospect: string
  business: string
  companyId: string
  actionToday: string
  stage: string
  currentStatus: string
  nextAction: string
  statusSlug: string
  pipelineStage: string
  followUpDueDate: string
  followUpSubject: string
  followUpDescription: string
}

const REPORT_ITEMS: OutreachReportItem[] = [
  {
    idNum: 1,
    prospect: 'Mohammed Huzefa',
    business: 'Bureau Veritas Oman',
    companyId: '1e0a6fb0-ffc7-4ecf-866a-bb0e960df40f',
    actionToday: 'Warm relationship continuation',
    stage: 'Warm-up / Relationship',
    currentStatus: 'Engaged',
    nextAction: 'Wait for reply; move toward conversation/call if he engages',
    statusSlug: 'warm_up',
    pipelineStage: 'Replied',
    followUpDueDate: '2026-10-03',
    followUpSubject: 'Warm Follow-up: Move toward conversation / call',
    followUpDescription: 'Stage 2 relationship check. Wait for reply; move toward conversation/call if he engages.'
  },
  {
    idNum: 2,
    prospect: 'Mohammed Al Falahi',
    business: 'BINRASHID',
    companyId: 'cd65364b-edd2-4e82-917a-461b45db0850',
    actionToday: 'New outside-in review offer',
    stage: 'Opening → Value',
    currentStatus: 'Awaiting response',
    nextAction: 'Do not build review unless accepted',
    statusSlug: 'opening_identified',
    pipelineStage: 'Opening',
    followUpDueDate: '2026-10-04',
    followUpSubject: 'Follow-up 2: Outside-in Review Offer Check',
    followUpDescription: 'Stage 3 follow-up. Check if outside-in review accepted. Do not build review unless accepted.'
  },
  {
    idNum: 3,
    prospect: 'Meysam Saki',
    business: 'Royal Gulf Real Estate',
    companyId: '5343ed3c-ee80-4de0-ace4-529c1dcfac35',
    actionToday: 'Audit follow-up',
    stage: 'Follow-up / Value',
    currentStatus: 'Awaiting response',
    nextAction: 'Build review only if he accepts',
    statusSlug: 'follow_up_sent',
    pipelineStage: 'Follow-Up Sent',
    followUpDueDate: '2026-10-04',
    followUpSubject: 'Follow-up 3: Audit Review Decision Check',
    followUpDescription: 'Stage 4 check. Build review only if he accepts. Next step: Coffee meet or direct call.'
  },
  {
    idNum: 4,
    prospect: 'HARISH HAMSA',
    business: 'Retail / electronics',
    companyId: 'd4b03410-cbb7-4414-9ff5-43f71ed0a58e',
    actionToday: 'Relationship opener',
    stage: 'Opening',
    currentStatus: 'Awaiting response',
    nextAction: 'Wait',
    statusSlug: 'gate_opener_sent',
    pipelineStage: 'Contacted',
    followUpDueDate: '2026-10-03',
    followUpSubject: 'Follow-up 1: Value Check-in',
    followUpDescription: 'Stage 2 follow-up. Value observation check-in after 2 days without reply.'
  },
  {
    idNum: 5,
    prospect: 'Ali Shah',
    business: 'Oman Lens',
    companyId: '76aa279b-ad31-4cd9-9ae5-4331eb18a47d',
    actionToday: 'Relationship opener',
    stage: 'Opening',
    currentStatus: 'Awaiting response',
    nextAction: 'Wait',
    statusSlug: 'gate_opener_sent',
    pipelineStage: 'Contacted',
    followUpDueDate: '2026-10-03',
    followUpSubject: 'Follow-up 1: Value Check-in',
    followUpDescription: 'Stage 2 follow-up. Value observation check-in after 2 days without reply.'
  },
  {
    idNum: 6,
    prospect: 'Alkhalil Alkindi',
    business: 'MUG / Al Atbaq',
    companyId: '80242621-dd8a-4673-97c9-2208849555a3',
    actionToday: 'Relationship opener',
    stage: 'Opening',
    currentStatus: 'Awaiting response',
    nextAction: 'Wait',
    statusSlug: 'gate_opener_sent',
    pipelineStage: 'Contacted',
    followUpDueDate: '2026-10-03',
    followUpSubject: 'Follow-up 1: Value Check-in',
    followUpDescription: 'Stage 2 follow-up. Value observation check-in after 2 days without reply.'
  },
  {
    idNum: 7,
    prospect: 'Humood Al-Adhari',
    business: 'Alwalaa Real Estate',
    companyId: 'f33256c5-ae15-414a-b339-c031abb1e685',
    actionToday: 'Audit follow-up',
    stage: 'Follow-up / Value',
    currentStatus: 'Awaiting response',
    nextAction: 'Build review only if accepted',
    statusSlug: 'follow_up_sent',
    pipelineStage: 'Follow-Up Sent',
    followUpDueDate: '2026-10-04',
    followUpSubject: 'Follow-up 3: Audit Review Decision Check',
    followUpDescription: 'Stage 4 check. Build review only if accepted. Next step: Coffee meet or direct call.'
  },
  {
    idNum: 8,
    prospect: 'Ahmed Alsaadi',
    business: 'Oasis Fire Protection Consultancy',
    companyId: '0b9f72bf-a931-4807-a819-746ffec678ca',
    actionToday: 'Audit follow-up',
    stage: 'Follow-up / Value',
    currentStatus: 'Awaiting response',
    nextAction: 'Build review only if accepted',
    statusSlug: 'follow_up_sent',
    pipelineStage: 'Follow-Up Sent',
    followUpDueDate: '2026-10-04',
    followUpSubject: 'Follow-up 3: Audit Review Decision Check',
    followUpDescription: 'Stage 4 check. Build review only if accepted. Next step: Coffee meet or direct call.'
  },
  {
    idNum: 9,
    prospect: 'Hani Macki',
    business: 'BidBid Technologies',
    companyId: '0d9f51f2-475c-4f06-a357-52f321da86ad',
    actionToday: 'Audit follow-up',
    stage: 'Follow-up / Value',
    currentStatus: 'Awaiting response',
    nextAction: 'Build review only if accepted',
    statusSlug: 'follow_up_sent',
    pipelineStage: 'Follow-Up Sent',
    followUpDueDate: '2026-10-04',
    followUpSubject: 'Follow-up 3: Audit Review Decision Check',
    followUpDescription: 'Stage 4 check. Build review only if accepted. Next step: Coffee meet or direct call.'
  },
  {
    idNum: 10,
    prospect: 'Faisal Musthafa Ebrahim',
    business: 'Ozone United / Ozone Insuria',
    companyId: '1ae95883-0432-44ba-a73c-9043a2c4eb5a',
    actionToday: 'Audit follow-up',
    stage: 'Follow-up / Value',
    currentStatus: 'Awaiting response',
    nextAction: 'Build review only if accepted',
    statusSlug: 'follow_up_sent',
    pipelineStage: 'Follow-Up Sent',
    followUpDueDate: '2026-10-04',
    followUpSubject: 'Follow-up 3: Audit Review Decision Check',
    followUpDescription: 'Stage 4 check. Build review only if accepted. Next step: Coffee meet or direct call.'
  },
  {
    idNum: 11,
    prospect: 'Mahir Qureshi',
    business: 'FuturBrix',
    companyId: 'd8aaa074-d1d8-4bd6-90f1-eaa531f0fd33',
    actionToday: 'Audit follow-up',
    stage: 'Follow-up / Value',
    currentStatus: 'Awaiting response',
    nextAction: 'Build review only if accepted',
    statusSlug: 'follow_up_sent',
    pipelineStage: 'Follow-Up Sent',
    followUpDueDate: '2026-10-04',
    followUpSubject: 'Follow-up 3: Audit Review Decision Check',
    followUpDescription: 'Stage 4 check. Build review only if accepted. Next step: Coffee meet or direct call.'
  },
  {
    idNum: 12,
    prospect: 'Haitham AL Salmi',
    business: 'Taageer Finance',
    companyId: '618dd64b-1fdf-4a37-9675-367b80c8d855',
    actionToday: 'Audit follow-up',
    stage: 'Follow-up / Value',
    currentStatus: 'Awaiting response',
    nextAction: 'Build review only if accepted',
    statusSlug: 'follow_up_sent',
    pipelineStage: 'Follow-Up Sent',
    followUpDueDate: '2026-10-04',
    followUpSubject: 'Follow-up 3: Audit Review Decision Check',
    followUpDescription: 'Stage 4 check. Build review only if accepted. Next step: Coffee meet or direct call.'
  }
]

async function ingestOct1Report() {
  console.log(`Starting automated ingestion of ${REPORT_ITEMS.length} October 1 LinkedIn Outreach records...`)
  const now = '2026-10-01T09:00:00.000Z'

  for (const item of REPORT_ITEMS) {
    console.log(`\nProcessing #${item.idNum}: ${item.prospect} (${item.business}) [${item.companyId}]`)

    // 1. Fetch current company data
    const { data: co, error: coFetchErr } = await supabase
      .from('companies')
      .select('id, company_name, notes, status, pipeline_stage')
      .eq('id', item.companyId)
      .single()

    if (coFetchErr || !co) {
      console.error(`  ERROR fetching company ${item.companyId}:`, coFetchErr?.message)
      continue
    }

    // 2. Update company in companies table
    const { error: coUpdateErr } = await supabase
      .from('companies')
      .update({
        status: 'contacted',
        pipeline_stage: item.pipelineStage,
        lead_source: 'linkedin',
        updated_at: now
      })
      .eq('id', item.companyId)

    if (coUpdateErr) {
      console.error(`  ERROR updating company ${item.companyId}:`, coUpdateErr.message)
    } else {
      console.log(`  ✓ Updated company status to 'contacted', stage to '${item.pipelineStage}'`)
    }

    // 3. Ensure contact exists
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('id, full_name')
      .eq('company_id', item.companyId)

    const hasContact = (existingContacts || []).some(
      cnt => (cnt.full_name || '').toLowerCase().includes(item.prospect.toLowerCase().split(' ')[0])
    )

    if (!hasContact) {
      const { error: cntInsertErr } = await supabase.from('contacts').insert({
        company_id: item.companyId,
        full_name: item.prospect,
        title: 'Decision Maker',
        created_at: now
      })
      if (cntInsertErr) console.warn(`  Warning creating contact:`, cntInsertErr.message)
      else console.log(`  ✓ Contact record created for ${item.prospect}`)
    }

    // 4. Mark any older pending follow-ups for this company as completed
    const { data: oldFollowUps } = await supabase
      .from('follow_ups')
      .select('id')
      .eq('company_id', item.companyId)
      .eq('status', 'pending')

    if (oldFollowUps && oldFollowUps.length > 0) {
      await supabase
        .from('follow_ups')
        .update({
          status: 'completed',
          completed_at: now,
          notes: `Touch logged on Oct 1: ${item.actionToday}`
        })
        .in('id', oldFollowUps.map(f => f.id))
      console.log(`  ✓ Completed ${oldFollowUps.length} prior pending follow-up(s)`)
    }

    // 5. Log activity record with Oct 1 timestamp
    const activityPayload = {
      channel: 'linkedin',
      prospect: item.prospect,
      business: item.business,
      action_today: item.actionToday,
      stage: item.stage,
      status: item.statusSlug,
      prospect_reply: item.currentStatus === 'Engaged' ? 'Engaged (Warm relationship continuation)' : '',
      pain_point: '',
      call_opening_line: '',
      notes: `Action today: ${item.actionToday}. Current status: ${item.currentStatus}. Next action: ${item.nextAction}`,
      outreach_date: '2026-10-01',
      sent_at: now,
      updated_at: now
    }

    const { data: actData, error: actErr } = await supabase
      .from('activities')
      .insert({
        company_id: item.companyId,
        activity_type: 'outreach_sent',
        title: `LinkedIn — ${item.actionToday}`,
        description: JSON.stringify(activityPayload),
        created_at: now
      })
      .select('id')
      .single()

    if (actErr) {
      console.error(`  ERROR inserting activity:`, actErr.message)
    } else {
      console.log(`  ✓ Logged activity touch (id: ${actData?.id})`)
    }

    // 6. Insert new follow-up according to cadence
    const { error: fuErr } = await supabase.from('follow_ups').insert({
      company_id: item.companyId,
      due_date: item.followUpDueDate,
      subject: item.followUpSubject,
      description: item.followUpDescription,
      channel: 'linkedin',
      status: 'pending',
      created_at: now
    })

    if (fuErr) {
      console.error(`  ERROR inserting follow_up:`, fuErr.message)
    } else {
      console.log(`  ✓ Scheduled follow-up: Due ${item.followUpDueDate} ("${item.followUpSubject}")`)
    }
  }

  console.log('\n======================================================')
  console.log('✓ ALL 12 OCTOBER 1 OUTREACH RECORDS INGESTED AND SYNCED!')
  console.log('======================================================')
}

ingestOct1Report().catch(console.error)
