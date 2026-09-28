import './load-env';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

interface LeadInput {
  name: string;
  role: string;
  company: string;
  companyNameInCRM: string;
  industry: string;
  statusText: string;
  linkedinUrl: string;
  searchUrl: string;
  notes: string;
  isExistingCompanyId?: string;
  isExistingContactId?: string;
  sentMessage?: string;
}

const leads: LeadInput[] = [
  {
    name: 'Abdulhamid Al-Riyami',
    role: 'Owner',
    company: 'Spectrum Travel House, Track Direction Travel & Tourism, Twilight Hotel',
    companyNameInCRM: 'Spectrum Travel House',
    industry: 'Hospitality & Tourism',
    statusText: 'Invitation sent',
    linkedinUrl: 'https://www.linkedin.com/in/abdulhamid-al-riyami/',
    searchUrl: 'https://www.linkedin.com/search/results/all/?keywords=Abdulhamid%20Al-Riyami',
    notes: 'Owner — Spectrum Travel House, Track Direction Travel & Tourism, Twilight Hotel. LinkedIn invitation sent on Sep 27, 2026.'
  },
  {
    name: 'Alkhalil Alkindi',
    role: 'Managing Director & Owner',
    company: 'Al Atbaq International LLC / Mug Coffee & Roastery',
    companyNameInCRM: 'Al Atbaq International LLC',
    industry: 'F&B & Hospitality',
    statusText: 'Invitation sent',
    linkedinUrl: 'https://www.linkedin.com/in/alkhalil-alkindi/',
    searchUrl: 'https://www.linkedin.com/search/results/all/?keywords=Alkhalil%20Alkindi',
    notes: 'Managing Director & Owner — Al Atbaq International LLC / Mug Coffee & Roastery. LinkedIn invitation sent on Sep 27, 2026.'
  },
  {
    name: 'Lamia Alkharusi',
    role: 'Co-Owner',
    company: 'Nine.Oman',
    companyNameInCRM: 'Nine.Oman',
    industry: 'Fashion & Retail',
    statusText: 'Invitation sent',
    linkedinUrl: 'https://www.linkedin.com/in/lamia-alkharusi/',
    searchUrl: 'https://www.linkedin.com/search/results/all/?keywords=Lamia%20Alkharusi',
    notes: 'Co-Owner — Nine.Oman. LinkedIn invitation sent on Sep 27, 2026.'
  },
  {
    name: 'Hussain Moosa Al Lawati',
    role: 'Founder & CEO',
    company: 'ARGANA OMAN',
    companyNameInCRM: 'ARGANA OMAN',
    industry: 'Trading & Services',
    statusText: 'Invitation sent',
    linkedinUrl: 'https://www.linkedin.com/in/hussain-moosa-al-lawati/',
    searchUrl: 'https://www.linkedin.com/search/results/all/?keywords=Hussain%20Moosa%20Al%20Lawati',
    notes: 'Founder & CEO — ARGANA OMAN. LinkedIn invitation sent on Sep 27, 2026.'
  },
  {
    name: 'Salim Al Kalbani',
    role: 'Owner / Restaurateur / Omani Gastronomy',
    company: 'Omani Gastronomy / Al Loomie',
    companyNameInCRM: 'Salim Al Kalbani Gastronomy',
    industry: 'Hospitality & F&B',
    statusText: 'Invitation sent',
    linkedinUrl: 'https://www.linkedin.com/in/salim-al-kalbani/',
    searchUrl: 'https://www.linkedin.com/search/results/all/?keywords=Salim%20Al%20Kalbani',
    notes: 'Owner / Restaurateur / Omani Gastronomy (Al Loomie). LinkedIn invitation sent on Sep 27, 2026.'
  },
  {
    name: 'Mohammed Al Zadjali',
    role: 'Owner',
    company: 'Mohammed Al Zadjali Enterprises',
    companyNameInCRM: 'Mohammed Al Zadjali',
    industry: 'General Business',
    statusText: 'Invitation sent',
    linkedinUrl: 'https://www.linkedin.com/in/mohammed-al-zadjali/',
    searchUrl: 'https://www.linkedin.com/search/results/all/?keywords=Mohammed%20Al%20Zadjali',
    notes: 'Owner. LinkedIn invitation sent on Sep 27, 2026.'
  },
  {
    name: 'Ahmed Amir',
    role: 'Company Owner & CEO',
    company: 'Al Kenz Al Aali L.L.C',
    companyNameInCRM: 'Al Kenz Al Aali L.L.C',
    industry: 'Trading & Contracting',
    statusText: 'Invitation sent',
    linkedinUrl: 'https://www.linkedin.com/in/ahmed-amir/',
    searchUrl: 'https://www.linkedin.com/search/results/all/?keywords=Ahmed%20Amir%20Al%20Kenz',
    notes: 'Company Owner & CEO — Al Kenz Al Aali L.L.C. LinkedIn invitation sent on Sep 27, 2026.'
  },
  {
    name: 'Saleh Hamoud',
    role: 'Owner & Co-Founder',
    company: 'Rikaz Real Estate Development & Sandhills Lounge',
    companyNameInCRM: 'Rikaz Real Estate Development',
    industry: 'Real Estate & Hospitality',
    statusText: 'Invitation sent',
    linkedinUrl: 'https://www.linkedin.com/in/saleh-hamoud/',
    searchUrl: 'https://www.linkedin.com/search/results/all/?keywords=Saleh%20Hamoud',
    notes: 'Owner & Co-Founder — Rikaz Real Estate Development & Sandhills Lounge. LinkedIn invitation sent on Sep 27, 2026.'
  },
  {
    name: 'Mohamed Al Salmi',
    role: 'Co-Founder & Owner',
    company: 'The Story Teller (TST)',
    companyNameInCRM: 'The Story Teller (TST)',
    industry: 'Media & Hospitality',
    statusText: 'Invitation sent',
    linkedinUrl: 'https://www.linkedin.com/in/mohamed-al-salmi/',
    searchUrl: 'https://www.linkedin.com/search/results/all/?keywords=Mohamed%20Al%20Salmi%20TST',
    notes: 'Co-Founder & Owner — The Story Teller (TST). LinkedIn invitation sent on Sep 27, 2026.'
  },
  {
    name: 'Firdous Nidunthol',
    role: 'Founder & CEO',
    company: 'Tea Time Break LLC / Firdous Futures SPC; Managing Director, HFC',
    companyNameInCRM: 'Tea Time Break LLC',
    industry: 'F&B & Cafés',
    statusText: 'Invitation sent',
    linkedinUrl: 'https://www.linkedin.com/in/firdous-nidunthol/',
    searchUrl: 'https://www.linkedin.com/search/results/all/?keywords=Firdous%20Nidunthol',
    notes: 'Founder & CEO — Tea Time Break LLC / Firdous Futures SPC; Managing Director, HFC. LinkedIn invitation sent on Sep 27, 2026.'
  },
  {
    name: 'Mohsin Al-Jahdhami',
    role: 'CEO',
    company: 'O Homes',
    companyNameInCRM: 'O Homes',
    industry: 'Real Estate & Interior Architecture',
    statusText: 'Invitation sent',
    linkedinUrl: 'https://www.linkedin.com/in/mohsin-al-jahdhami/',
    searchUrl: 'https://www.linkedin.com/search/results/all/?keywords=Mohsin%20Al-Jahdhami',
    notes: 'CEO — O Homes. LinkedIn invitation sent on Sep 27, 2026.',
    isExistingCompanyId: 'ec0b96e9-b297-4f76-a059-919472dfecc9'
  },
  {
    name: 'Abdul Rahman',
    role: 'Owner @ Muscat Al Khair Investment SPC | Business Development, Logistics Management',
    company: 'Muscat Al Khair Investment SPC',
    companyNameInCRM: 'Muscat Al Khair Investment SPC',
    industry: 'Investment & Logistics',
    statusText: '1st connection — message sent today',
    linkedinUrl: 'https://www.linkedin.com/in/abdul-rahman-4564372b0/',
    searchUrl: 'https://www.linkedin.com/search/results/all/?keywords=Abdul%20Rahman%20Muscat%20Al%20Khair',
    sentMessage: 'Salam Alaikum Mr. Abdul Rahman, hope you’re doing well inshaAllah, I came across your work with Muscat Al Khair, thought it would be good to connect and stay in touch.',
    notes: 'Owner @ Muscat Al Khair Investment SPC | Business Development, Logistics Management. 1st connection — message sent on Sep 27, 2026.',
    isExistingCompanyId: '1ef9007e-0214-484a-904d-f7b2f021b3a9',
    isExistingContactId: 'af610858-fee8-484a-9f92-abc697d27862'
  }
];

async function run() {
  console.log('🚀 Starting ingestion of 12 LinkedIn Connections for Sep 27, 2026...\n');

  const nowIso = new Date('2026-09-27T10:00:00.000Z').toISOString();

  for (const lead of leads) {
    console.log(`\n==================================================`);
    console.log(`Processing: ${lead.name} (${lead.role})`);
    console.log(`Company: ${lead.company}`);
    console.log(`LinkedIn URL: ${lead.linkedinUrl}`);
    console.log(`Status: ${lead.statusText}`);

    let companyId = lead.isExistingCompanyId;

    // 1. Manage Company
    if (companyId) {
      console.log(`  -> Existing company detected: ${companyId}`);
      if (lead.name === 'Abdul Rahman') {
        const { error: compUpdErr } = await supabase
          .from('companies')
          .update({
            company_name: lead.companyNameInCRM,
            industry: lead.industry,
            linkedin_url: lead.linkedinUrl,
            status: 'contacted',
            pipeline_stage: 'Contacted',
            lead_status: 'Contacted',
            draft_message: lead.sentMessage,
            notes: lead.notes,
            research_json: {
              target_channel: 'linkedin',
              linkedin_url: lead.linkedinUrl,
              search_url: lead.searchUrl,
              prospect_name: lead.name,
              role: lead.role,
              company: lead.company,
              unified_status: 'sent',
              active_statuses: ['sent'],
              stage_updated_at: nowIso,
              draft_message: lead.sentMessage
            },
            updated_at: nowIso
          })
          .eq('id', companyId);
        if (compUpdErr) console.error('  Error updating company:', compUpdErr);
        else console.log('  ✓ Updated company details & research_json.');
      } else if (lead.name === 'Mohsin Al-Jahdhami') {
        // O Homes existing company
        const { data: curComp } = await supabase.from('companies').select('notes, research_json').eq('id', companyId).single();
        const existingNotes = curComp?.notes || '';
        const updatedNotes = `${existingNotes}\n[Sep 27, 2026] LinkedIn invitation sent to CEO Mohsin Al-Jahdhami.`;
        await supabase
          .from('companies')
          .update({
            notes: updatedNotes,
            updated_at: nowIso
          })
          .eq('id', companyId);
        console.log('  ✓ Appended note to existing O Homes company.');
      }
    } else {
      // Check if company already exists by name
      const { data: existingComp } = await supabase
        .from('companies')
        .select('id')
        .ilike('company_name', lead.companyNameInCRM)
        .maybeSingle();

      if (existingComp) {
        companyId = existingComp.id;
        console.log(`  -> Found existing company by name: ${companyId}`);
        await supabase
          .from('companies')
          .update({
            linkedin_url: lead.linkedinUrl,
            industry: lead.industry,
            notes: lead.notes,
            research_json: {
              target_channel: 'linkedin',
              linkedin_url: lead.linkedinUrl,
              search_url: lead.searchUrl,
              prospect_name: lead.name,
              role: lead.role,
              company: lead.company,
              unified_status: 'sent',
              active_statuses: ['sent'],
              stage_updated_at: nowIso
            },
            updated_at: nowIso
          })
          .eq('id', companyId);
      } else {
        const { data: newComp, error: compErr } = await supabase
          .from('companies')
          .insert({
            company_name: lead.companyNameInCRM,
            industry: lead.industry,
            linkedin_url: lead.linkedinUrl,
            status: 'contacted',
            pipeline_stage: 'Contacted',
            lead_status: 'Contacted',
            date_added: '2026-09-27',
            lead_source: 'LinkedIn',
            lead_type: 'Cold',
            lead_folder: 'Unsorted',
            fawtara_flag: 'Pending',
            est_deal_value: 0,
            draft_status: 'ready_to_send',
            notes: lead.notes,
            research_json: {
              target_channel: 'linkedin',
              linkedin_url: lead.linkedinUrl,
              search_url: lead.searchUrl,
              prospect_name: lead.name,
              role: lead.role,
              company: lead.company,
              unified_status: 'sent',
              active_statuses: ['sent'],
              stage_updated_at: nowIso
            },
            created_at: nowIso,
            updated_at: nowIso
          })
          .select('id')
          .single();

        if (compErr) {
          console.error('  Error inserting company:', compErr);
          continue;
        }
        companyId = newComp.id;
        console.log(`  ✓ Created new company ID: ${companyId}`);
      }
    }

    // 2. Manage Contact
    let contactId = lead.isExistingContactId;
    if (contactId) {
      const { error: contUpdErr } = await supabase
        .from('contacts')
        .update({
          full_name: lead.name,
          title: lead.role,
          linkedin_url: lead.linkedinUrl,
          updated_at: nowIso
        })
        .eq('id', contactId);
      if (contUpdErr) console.error('  Error updating contact:', contUpdErr);
      else console.log(`  ✓ Updated contact ID: ${contactId}`);
    } else {
      // Check if contact exists under this company
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('company_id', companyId)
        .ilike('full_name', lead.name)
        .maybeSingle();

      if (existingContact) {
        contactId = existingContact.id;
        await supabase
          .from('contacts')
          .update({
            title: lead.role,
            linkedin_url: lead.linkedinUrl,
            updated_at: nowIso
          })
          .eq('id', contactId);
        console.log(`  ✓ Updated existing contact ID: ${contactId}`);
      } else {
        const { data: newContact, error: contErr } = await supabase
          .from('contacts')
          .insert({
            company_id: companyId,
            full_name: lead.name,
            title: lead.role,
            linkedin_url: lead.linkedinUrl,
            is_primary: lead.name === 'Mohsin Al-Jahdhami' ? false : true,
            created_at: nowIso,
            updated_at: nowIso
          })
          .select('id')
          .single();

        if (contErr) console.error('  Error inserting contact:', contErr);
        else {
          contactId = newContact?.id;
          console.log(`  ✓ Created new contact ID: ${contactId}`);
        }
      }
    }

    // 3. Manage Activity Log in CRM activities table
    const isAbdulRahman = lead.name === 'Abdul Rahman';
    const actPayload = {
      channel: 'linkedin',
      handle: lead.name,
      template_used: isAbdulRahman ? 'custom' : 'connection_request',
      status: 'sent',
      prospect_reply: '',
      pain_point: '',
      call_opening_line: '',
      notes: isAbdulRahman ? lead.notes : 'LinkedIn connection invitation sent.',
      linkedin_url: lead.linkedinUrl,
      message_body: isAbdulRahman ? lead.sentMessage : undefined
    };

    const { error: actErr } = await supabase
      .from('activities')
      .insert({
        company_id: companyId,
        activity_type: 'outreach_sent',
        title: isAbdulRahman ? 'LinkedIn — 1st Connection Message Sent' : 'LinkedIn — Invitation Sent',
        description: JSON.stringify(actPayload),
        created_at: nowIso
      });

    if (actErr) console.error('  Error inserting activity:', actErr);
    else console.log(`  ✓ Logged activity in activities table.`);

    // 4. Manage linkedin_prospects table
    const { data: existingLp } = await supabase
      .from('linkedin_prospects')
      .select('id, activities')
      .ilike('name', lead.name)
      .maybeSingle();

    const lpActivity = isAbdulRahman
      ? {
          id: `act-ar-${Date.now()}`,
          date: '2026-09-27',
          activity_type: 'dm_sent',
          description: `Sent LinkedIn Message: "${lead.sentMessage}"`,
          status: 'confirmed'
        }
      : {
          id: `act-lp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          date: '2026-09-27',
          activity_type: 'connection_sent',
          description: 'Connection request invitation sent',
          status: 'confirmed'
        };

    if (existingLp) {
      const curActs = Array.isArray(existingLp.activities)
        ? existingLp.activities
        : (typeof existingLp.activities === 'string' ? JSON.parse(existingLp.activities) : []);
      curActs.push(lpActivity);

      const { error: lpUpdErr } = await supabase
        .from('linkedin_prospects')
        .update({
          title: lead.role,
          company: lead.company,
          profile_url: lead.linkedinUrl,
          connection_status: isAbdulRahman ? 'connected' : 'pending',
          message_status: isAbdulRahman ? 'sent' : 'none',
          screenshot_date: '2026-09-27',
          notes: lead.notes,
          activities: curActs,
          updated_at: nowIso
        })
        .eq('id', existingLp.id);

      if (lpUpdErr) console.error('  Error updating linkedin_prospects:', lpUpdErr);
      else console.log(`  ✓ Updated existing linkedin_prospects record: ${existingLp.id}`);
    } else {
      const { error: lpInsErr } = await supabase
        .from('linkedin_prospects')
        .insert({
          name: lead.name,
          title: lead.role,
          company: lead.company,
          location: 'Muscat, Oman',
          degree: isAbdulRahman ? '1st' : '2nd',
          connections: '500+ connections',
          profile_url: lead.linkedinUrl,
          connection_status: isAbdulRahman ? 'connected' : 'pending',
          message_status: isAbdulRahman ? 'sent' : 'none',
          priority: isAbdulRahman ? 'High' : 'Medium',
          lead_type: 'LinkedIn Prospect',
          industry: lead.industry,
          screenshot_date: '2026-09-27',
          notes: lead.notes,
          activities: [lpActivity],
          created_at: nowIso,
          updated_at: nowIso
        });

      if (lpInsErr) console.error('  Error inserting linkedin_prospects:', lpInsErr);
      else console.log(`  ✓ Inserted new record into linkedin_prospects.`);
    }
  }

  console.log('\n🎉 Finished processing all 12 LinkedIn leads for Sep 27!');
}

run().catch(console.error);
