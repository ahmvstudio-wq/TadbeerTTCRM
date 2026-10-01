const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env.local'));
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const list = [
  { name: 'Abdul Rahman', action: 'Audit follow-up', status: 'Sent', stage: 'Follow-up / Audit offered', url: '', date: '2026-09-29' },
  { name: 'Almothana ALBusaidi', action: 'Warm check-in', status: 'Sent', stage: 'Nurture / Relationship', url: '', date: '2026-09-29' },
  { name: 'P.B Boss', action: 'Warm check-in', status: 'Sent', stage: 'Nurture / Relationship', url: '', date: '2026-09-29' },
  { name: 'Mostafa Zidan', action: 'Warm check-in', status: 'Sent', stage: 'Nurture / Relationship', url: '', date: '2026-09-29' },
  { name: 'Priyank Shah', action: 'Warm check-in', status: 'Sent', stage: 'Nurture / Relationship', url: '', date: '2026-09-29' },
  { name: 'Azmath Sheikh', action: 'Warm check-in', status: 'Sent', stage: 'Nurture / Relationship', url: '', date: '2026-09-29' },
  { name: 'Saeed Mirzaei', action: 'Warm check-in', status: 'Sent', stage: 'Nurture / Relationship', url: '', date: '2026-09-29' },
  { name: 'Said Al-Maskari', action: 'Warm check-in', status: 'Sent', stage: 'Nurture / Relationship', url: '', date: '2026-09-29' },
  { name: 'Qaboos Al Said', action: 'Audit offer', status: 'Sent', stage: 'Audit offered / Awaiting response', url: 'https://www.linkedin.com/in/ACoAAA_tm9IBCVSRRcMKhq9sdOhFBjgXytBBrcQ', date: '2026-09-29' },
  { name: 'Faisal Al-Balushi', action: 'Warm check-in', status: 'Sent', stage: 'Audit follow-up / Awaiting response', url: 'https://www.linkedin.com/in/ACoAAAjHupoBI9kXl6eOMKubdAHk832uBH7IW3o', date: '2026-09-29' },
  { name: 'Haitham Al Rawahi', action: 'Warm check-in', status: 'Sent', stage: 'Relationship nurture', url: 'https://www.linkedin.com/in/ACoAADiDgMoBiaJHL4K29nHqVOWP1W7TEHk8_Nw', date: '2026-09-29' },
  { name: 'Mohammad Danish Khan', action: 'New connection opener', status: 'Sent', stage: 'New connection / Relationship opener', url: 'https://www.linkedin.com/in/mohammad-danish-khan-55408b36/', date: '2026-09-29' },
  { name: 'Faisal Al-Rashdi', action: 'New connection opener', status: 'Sent', stage: 'New connection / Relationship opener', url: 'https://www.linkedin.com/in/faisal-al-rashdi-916877104/', date: '2026-09-30' },
  { name: 'Mohamed Al Salmi', action: 'New connection opener', status: 'Sent', stage: 'New connection / Relationship opener', url: 'https://www.linkedin.com/in/mohamed-al-salmi-6a142850/', date: '2026-09-30' },
  { name: 'Manoj Prem Mulani', action: 'Connection request', status: 'Sent / Pending', stage: 'New prospect', url: 'https://www.linkedin.com/in/manoj-prem-mulani-a100a8103/', date: '2026-09-30' },
  { name: 'Yousuf Allamki', action: 'Connection request', status: 'Sent / Pending', stage: 'New prospect', url: 'https://www.linkedin.com/in/yousuf-allamki-004970182/', date: '2026-09-30' },
  { name: 'Vishal Sobti', action: 'Connection request', status: 'Sent / Pending', stage: 'New prospect', url: 'https://www.linkedin.com/in/vishal-sobti-94a3049b/', date: '2026-09-30' },
  { name: 'H.H.Thweiny AL-Said', action: 'Connection request', status: 'Sent / Pending', stage: 'New prospect', url: 'https://www.linkedin.com/in/h-h-thweiny-al-said-61587014/', date: '2026-09-30' },
  { name: 'Alham Alnassri', action: 'Connection request', status: 'Sent / Pending', stage: 'New prospect', url: 'https://www.linkedin.com/in/alham-alnassri-8579a3171/', date: '2026-09-30' },
  { name: 'rachad abouzaki', action: 'Connection request', status: 'Sent / Pending', stage: 'New prospect', url: 'https://www.linkedin.com/in/rachad-abouzaki-322840274/', date: '2026-09-30' },
  { name: 'Fahd Siddiqui', action: 'Connection request', status: 'Sent / Pending', stage: 'New prospect', url: 'https://www.linkedin.com/in/fahd-siddiqui-b4149248/', date: '2026-09-30' },
  { name: 'Karl Whelan', action: 'Connection request', status: 'Sent / Pending', stage: 'New prospect', url: 'https://www.linkedin.com/in/karl-whelan-b17a7414/', date: '2026-09-30' },
  { name: 'Hind AlMamari', action: 'Connection request', status: 'Sent / Pending', stage: 'New prospect', url: 'https://www.linkedin.com/in/hindalmamari/', date: '2026-09-30' },
  { name: 'HARISH HAMSA', action: 'Connection request', status: 'Sent / Pending', stage: 'New prospect', url: 'https://www.linkedin.com/in/harish-hamsa-8771833a7/', date: '2026-09-30' }
];

async function executeSync() {
  console.log('--- Step 1: Fetch all current tables ---');
  const { data: allLP } = await supabase.from('linkedin_prospects').select('*');
  const { data: allCompanies } = await supabase.from('companies').select('*');
  const { data: allContacts } = await supabase.from('contacts').select('*');

  let updatedLP = 0;
  let insertedLP = 0;
  let updatedComp = 0;
  let insertedComp = 0;
  let updatedContacts = 0;
  let insertedContacts = 0;

  for (const item of list) {
    const cleanName = item.name.trim().toLowerCase();
    
    // Determine connection & message statuses
    let connStatus = 'pending';
    let msgStatus = 'none';
    let actType = 'connection_sent';

    if (item.action.toLowerCase().includes('follow-up') || item.action.toLowerCase().includes('check-in') || item.action.toLowerCase().includes('audit offer')) {
      connStatus = 'connected';
      msgStatus = 'sent';
      actType = 'dm_sent';
    } else if (item.action.toLowerCase().includes('opener')) {
      connStatus = 'connected';
      msgStatus = 'sent';
      actType = 'dm_sent';
    } else if (item.action.toLowerCase().includes('connection request')) {
      connStatus = 'pending';
      msgStatus = 'none';
      actType = 'connection_sent';
    }

    const activityObj = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      date: item.date,
      activity_type: actType,
      description: item.action + ': ' + item.stage,
      status: 'confirmed'
    };

    // 1. Process linkedin_prospects table
    const existingLP = allLP.find(p => p.name.trim().toLowerCase() === cleanName || (item.url && p.profile_url && p.profile_url.toLowerCase().includes(item.url.toLowerCase())));

    if (existingLP) {
      const existingActs = Array.isArray(existingLP.activities) ? existingLP.activities : [];
      const updatedActs = [activityObj, ...existingActs.filter(a => !(a.date === item.date && a.description === activityObj.description))];
      
      const newNote = '[' + item.date + '] ' + item.action + ' (' + item.stage + ')';
      const updatedNotes = existingLP.notes ? (existingLP.notes.includes(item.stage) ? existingLP.notes : existingLP.notes + '\n' + newNote) : newNote;

      const updateData = {
        connection_status: connStatus,
        message_status: msgStatus,
        screenshot_date: item.date,
        profile_url: item.url || existingLP.profile_url,
        notes: updatedNotes,
        activities: updatedActs,
        updated_at: new Date().toISOString()
      };

      const { error: lpErr } = await supabase.from('linkedin_prospects').update(updateData).eq('id', existingLP.id);
      if (lpErr) console.error('LP Update Error for ' + item.name + ':', lpErr.message);
      else {
        console.log('Updated LP:', item.name);
        updatedLP++;
      }
    } else {
      const newLP = {
        name: item.name,
        title: item.stage.includes('New') ? 'Decision Maker / Executive' : 'Executive Leader',
        company: item.name,
        location: 'Muscat, Oman',
        degree: '2nd',
        connections: '500+ connections',
        profile_url: item.url || '',
        connection_status: connStatus,
        message_status: msgStatus,
        priority: 'High',
        lead_type: 'LinkedIn Outreach',
        mutual_connection: '',
        industry: 'General Business Enterprise',
        screenshot_date: item.date,
        notes: '[' + item.date + '] ' + item.action + ' (' + item.stage + ')',
        activities: [activityObj],
        created_at: item.date + 'T10:00:00.000Z',
        updated_at: new Date().toISOString()
      };

      const { error: lpInsertErr } = await supabase.from('linkedin_prospects').insert(newLP);
      if (lpInsertErr) console.error('LP Insert Error for ' + item.name + ':', lpInsertErr.message);
      else {
        console.log('Inserted LP:', item.name);
        insertedLP++;
      }
    }

    // 2. Process Companies & Contacts in main CRM
    const existingComp = allCompanies.find(c => c.company_name.trim().toLowerCase() === cleanName);
    const existingContact = allContacts.find(c => c.full_name.trim().toLowerCase() === cleanName);

    let targetCompanyId = existingComp ? existingComp.id : (existingContact ? existingContact.company_id : null);

    // Map pipeline stage & lead status
    let compPipelineStage = 'Contacted';
    let compLeadStatus = 'Contacted';

    if (item.stage.includes('Audit')) {
      compPipelineStage = 'Audit Sent';
      compLeadStatus = 'Contacted';
    } else if (item.stage.includes('Nurture') || item.stage.includes('Relationship')) {
      compPipelineStage = 'Follow-up Sent';
      compLeadStatus = 'Contacted';
    } else if (item.stage.includes('New prospect')) {
      compPipelineStage = 'Contacted';
      compLeadStatus = 'Contacted';
    }

    if (targetCompanyId) {
      // Update company
      const { error: cUpErr } = await supabase.from('companies').update({
        pipeline_stage: compPipelineStage,
        lead_status: compLeadStatus,
        linkedin_url: item.url || (existingComp ? existingComp.linkedin_url : null),
        updated_at: new Date().toISOString()
      }).eq('id', targetCompanyId);

      if (cUpErr) console.error('Company Update Error for ' + item.name + ':', cUpErr.message);
      else {
        console.log('Updated Company:', item.name);
        updatedComp++;
      }
    } else {
      // Create company
      const { data: newComp, error: newCompErr } = await supabase.from('companies').insert({
        company_name: item.name,
        industry: 'General Business Enterprise',
        linkedin_url: item.url || null,
        lead_status: compLeadStatus,
        pipeline_stage: compPipelineStage,
        lead_source: 'LinkedIn',
        status: 'contacted',
        date_added: item.date,
        created_at: item.date + 'T10:00:00.000Z',
        updated_at: new Date().toISOString()
      }).select().single();

      if (newCompErr) {
        console.error('New Company Insert Error for ' + item.name + ':', newCompErr.message);
      } else {
        targetCompanyId = newComp.id;
        console.log('Inserted Company:', item.name);
        insertedComp++;
      }
    }

    // Update or Insert Contact
    if (existingContact) {
      const { error: ctUpErr } = await supabase.from('contacts').update({
        linkedin_url: item.url || existingContact.linkedin_url,
        updated_at: new Date().toISOString()
      }).eq('id', existingContact.id);

      if (ctUpErr) console.error('Contact Update Error for ' + item.name + ':', ctUpErr.message);
      else {
        console.log('Updated Contact:', item.name);
        updatedContacts++;
      }
    } else if (targetCompanyId) {
      const { error: ctInErr } = await supabase.from('contacts').insert({
        company_id: targetCompanyId,
        full_name: item.name,
        title: 'Decision Maker',
        linkedin_url: item.url || null,
        is_primary: true,
        created_at: item.date + 'T10:00:00.000Z'
      });

      if (ctInErr) console.error('Contact Insert Error for ' + item.name + ':', ctInErr.message);
      else {
        console.log('Inserted Contact:', item.name);
        insertedContacts++;
      }
    }
  }

  console.log('\n=== EXECUTION SUMMARY ===');
  console.log('LinkedIn Prospects -> Updated:', updatedLP, '| Inserted:', insertedLP);
  console.log('Companies -> Updated:', updatedComp, '| Inserted:', insertedComp);
  console.log('Contacts -> Updated:', updatedContacts, '| Inserted:', insertedContacts);
}

executeSync();
