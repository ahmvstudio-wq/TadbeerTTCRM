const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env.local'));
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const list = [
  // 11 items yesterday (2026-09-29)
  { 
    name: 'Beitak Real Estate', 
    matchKey: 'Beitak Real Estate',
    handle: '@beitak_real_estates', 
    url: 'https://www.instagram.com/beitak_real_estates/', 
    action: 'New outreach', 
    status: 'Sent', 
    stage: 'New prospect', 
    notes: 'Exact handle verified via current web research', 
    date: '2026-09-29', 
    industry: 'Real Estate, Property & Interiors' 
  },
  { 
    name: 'RIKAZ', 
    matchKey: 'RIKAZ',
    handle: '@rikaz.om', 
    url: 'https://www.instagram.com/rikaz.om/', 
    action: 'New outreach', 
    status: 'Sent', 
    stage: 'New prospect', 
    notes: 'Exact handle verified via current web research', 
    date: '2026-09-29', 
    industry: 'Real Estate, Property & Interiors' 
  },
  { 
    name: 'Midan Real Estate', 
    matchKey: 'Midan Real Estate',
    handle: '@realestate_market', 
    url: 'https://www.instagram.com/realestate_market/', 
    action: 'New outreach', 
    status: 'Sent', 
    stage: 'New prospect', 
    notes: 'Exact handle verified via current web research', 
    date: '2026-09-29', 
    industry: 'Real Estate, Property & Interiors' 
  },
  { 
    name: 'Royal Gulf Estate', 
    matchKey: 'Royal Gulf Estate',
    handle: null, 
    url: null, 
    action: 'New outreach', 
    status: 'Sent', 
    stage: 'New prospect', 
    notes: 'Account contacted today; exact @handle not exposed in screenshot/search results', 
    date: '2026-09-29', 
    industry: 'Real Estate, Property & Interiors' 
  },
  { 
    name: 'Wassan Specialty Dental Center', 
    matchKey: 'Wassan Specialty Dental Center',
    handle: null, 
    url: null, 
    action: 'New outreach', 
    status: 'Sent', 
    stage: 'New prospect', 
    notes: 'Account contacted today; exact @handle not verified', 
    date: '2026-09-29', 
    industry: 'Dental & Orthodontic Clinics' 
  },
  { 
    name: 'Kenz Dental & Orthodontic Center', 
    matchKey: 'Kenz Dental & Orthodontic Centre',
    handle: null, 
    url: null, 
    action: 'New outreach', 
    status: 'Sent', 
    stage: 'New prospect', 
    notes: 'Account contacted today; exact @handle not verified', 
    date: '2026-09-29', 
    industry: 'Dental & Orthodontic Clinics' 
  },
  { 
    name: 'Arabic-named clinic', 
    matchKey: 'Arabic-named clinic',
    handle: null, 
    url: null, 
    action: 'New outreach', 
    status: 'Sent', 
    stage: 'New prospect', 
    notes: 'Display name visible; exact @handle not readable from screenshot', 
    date: '2026-09-29', 
    industry: 'Healthcare & Medical Centers' 
  },
  { 
    name: 'Plaza Clinic', 
    matchKey: 'Plaza Clinic',
    handle: null, 
    url: null, 
    action: 'New outreach', 
    status: 'Sent', 
    stage: 'New prospect', 
    notes: 'Display name visible; exact @handle not verified', 
    date: '2026-09-29', 
    industry: 'Healthcare & Medical Centers' 
  },
  { 
    name: 'GHC CLINIC Dental-Aesthetics', 
    matchKey: 'GHC CLINIC Dental-Aesthetics',
    handle: null, 
    url: null, 
    action: 'New outreach', 
    status: 'Sent', 
    stage: 'New prospect', 
    notes: 'Display name visible; exact @handle not verified', 
    date: '2026-09-29', 
    industry: 'Aesthetic & Derma Clinics' 
  },
  { 
    name: 'MCC Medical Clinic Muscat', 
    matchKey: 'MCC Medical Clinics Muscat',
    handle: '@medicalconsultantsclinics.om', 
    url: 'https://www.instagram.com/medicalconsultantsclinics.om/', 
    action: 'New outreach', 
    status: 'Sent', 
    stage: 'New prospect', 
    notes: 'Display name visible; exact @handle not verified', 
    date: '2026-09-29', 
    industry: 'Healthcare & Medical Centers' 
  },
  { 
    name: 'AHMED BEAUTY LOUNGE', 
    matchKey: 'AHMED BEAUTY LOUNGE',
    handle: null, 
    url: null, 
    action: 'Follow-up', 
    status: 'Sent', 
    stage: 'Follow-up / Audit transition', 
    notes: 'Exact @handle not exposed in screenshot', 
    date: '2026-09-29', 
    industry: 'Fashion, Abayas & Boutiques' 
  },

  // 10 items today (2026-09-30)
  { 
    name: 'Arabic-named salon', 
    matchKey: 'Arabic-named salon',
    handle: null, 
    url: null, 
    action: 'Follow-up', 
    status: 'Sent', 
    stage: 'Follow-up / Audit transition', 
    notes: 'Display name visible; exact @handle not readable', 
    date: '2026-09-30', 
    industry: 'Fashion, Abayas & Boutiques' 
  },
  { 
    name: 'Hussain Beauty Lounge', 
    matchKey: 'Hussein Beauty Lounge',
    handle: '@hussein_beauty_lounge', 
    url: 'https://www.instagram.com/hussein_beauty_lounge/', 
    action: 'Follow-up', 
    status: 'Sent', 
    stage: 'Follow-up / Audit transition', 
    notes: 'Exact @handle not verified', 
    date: '2026-09-30', 
    industry: 'Fashion, Abayas & Boutiques' 
  },
  { 
    name: '194°F Specialty Coffee', 
    matchKey: '194°F Specialty Coffee',
    handle: '@194f.cafe', 
    url: 'https://www.instagram.com/194f.cafe/', 
    action: 'Follow-up', 
    status: 'Sent', 
    stage: 'Follow-up / Audit transition', 
    notes: 'Exact @handle not verified', 
    date: '2026-09-30', 
    industry: 'Food & Beverage (F&B / Cafés)' 
  },
  { 
    name: 'Especiale Café', 
    matchKey: 'Especiale Café',
    handle: '@especiale.om', 
    url: 'https://www.instagram.com/especiale.om/', 
    action: 'Follow-up', 
    status: 'Sent', 
    stage: 'Follow-up / Audit transition', 
    notes: 'Exact handle verified via current web research', 
    date: '2026-09-30', 
    industry: 'Food & Beverage (F&B / Cafés)' 
  },
  { 
    name: 'Muscat Hair & Beauty Salon', 
    matchKey: 'Muscat Hair & Beauty Salon',
    handle: '@muscatbeautysalon', 
    url: 'https://www.instagram.com/muscatbeautysalon/', 
    action: 'Follow-up', 
    status: 'Sent', 
    stage: 'Follow-up / Audit transition', 
    notes: 'Exact handle verified via current web research', 
    date: '2026-09-30', 
    industry: 'Fashion, Abayas & Boutiques' 
  },
  { 
    name: 'Lumare Aesthetic Clinic', 
    matchKey: 'Lumare Aesthetic Clinic',
    handle: null, 
    url: null, 
    action: 'Follow-up / Audit transition', 
    status: 'Sent', 
    stage: 'Audit transition', 
    notes: 'Exact @handle not verified', 
    date: '2026-09-30', 
    industry: 'Aesthetic & Derma Clinics' 
  },
  { 
    name: 'Mazaya', 
    matchKey: 'Mazaya Dental Center',
    handle: '@mazaya.dental.center', 
    url: 'https://www.instagram.com/mazaya.dental.center/', 
    action: 'Pending', 
    status: 'Not sent', 
    stage: 'Waiting for message request acceptance', 
    notes: 'Message request not accepted', 
    date: '2026-09-30', 
    industry: 'Dental & Orthodontic Clinics' 
  },
  { 
    name: 'Blend', 
    matchKey: 'Blend — بلِند',
    handle: '@blendcafe.om', 
    url: 'https://www.instagram.com/blendcafe.om/', 
    action: 'Pending', 
    status: 'Not sent', 
    stage: 'Waiting for message request acceptance', 
    notes: 'Message request not accepted', 
    date: '2026-09-30', 
    industry: 'Food & Beverage (F&B / Cafés)' 
  },
  { 
    name: 'Dentology Dental Clinic', 
    matchKey: 'Dentology Dental Clinic',
    handle: '@dentology_om', 
    url: 'https://www.instagram.com/dentology_om/', 
    action: 'Cancelled', 
    status: 'Not sent', 
    stage: 'Removed from today\'s batch', 
    notes: 'Instagram profile not found', 
    date: '2026-09-30', 
    industry: 'Dental & Orthodontic Clinics' 
  },
  { 
    name: 'Yusr Real Estate', 
    matchKey: 'Yusr Real Estate',
    handle: null, 
    url: null, 
    action: 'Cancelled', 
    status: 'Not sent', 
    stage: 'Removed from today\'s batch', 
    notes: 'Instagram profile not found', 
    date: '2026-09-30', 
    industry: 'Real Estate, Property & Interiors' 
  }
];

async function syncInstagramBatch() {
  console.log('--- Step 1: Fetch all current companies and contacts ---');
  const { data: allCompanies } = await supabase.from('companies').select('*');
  const { data: allContacts } = await supabase.from('contacts').select('*');

  let updatedCompanies = 0;
  let insertedCompanies = 0;
  let updatedContacts = 0;
  let insertedContacts = 0;

  for (const item of list) {
    const cleanSearchName = item.name.toLowerCase().trim();
    const cleanMatchKey = item.matchKey ? item.matchKey.toLowerCase().trim() : cleanSearchName;

    // Find existing company
    const existingComp = allCompanies.find(c => {
      const cname = c.company_name.toLowerCase().trim();
      return cname === cleanSearchName || cname === cleanMatchKey || (item.matchKey && cname.includes(cleanMatchKey));
    });

    // Map pipeline stage, lead status & status
    let compPipelineStage = 'Contacted';
    let compLeadStatus = 'Contacted';
    let compStatus = 'contacted';

    if (item.action === 'Cancelled') {
      compPipelineStage = 'Lost';
      compLeadStatus = 'Dormant';
      compStatus = 'dormant';
    } else if (item.action === 'Pending') {
      compPipelineStage = 'Pending';
      compLeadStatus = 'New';
      compStatus = 'prospect';
    } else if (item.stage.includes('Audit')) {
      compPipelineStage = 'Audit Sent';
      compLeadStatus = 'Contacted';
      compStatus = 'contacted';
    } else if (item.stage.includes('Follow-up')) {
      compPipelineStage = 'Follow-up Sent';
      compLeadStatus = 'Contacted';
      compStatus = 'contacted';
    } else if (item.stage.includes('New prospect')) {
      compPipelineStage = 'Contacted';
      compLeadStatus = 'Contacted';
      compStatus = 'contacted';
    }

    const igNoteEntry = `[${item.date}] Instagram ${item.action} | Status: ${item.status} | Stage: ${item.stage}` + 
      (item.handle ? ` | Handle: ${item.handle}` : '') + 
      (item.url ? ` | URL: ${item.url}` : '') + 
      (item.notes ? `\nNote: ${item.notes}` : '');

    let targetCompanyId = null;

    if (existingComp) {
      targetCompanyId = existingComp.id;
      
      // Preserve JSON structure if existing notes is JSON, or append note cleanly
      let updatedNotes = existingComp.notes;
      if (!updatedNotes) {
        updatedNotes = igNoteEntry;
      } else if (typeof updatedNotes === 'string') {
        if (updatedNotes.startsWith('{') && updatedNotes.endsWith('}')) {
          try {
            const parsed = JSON.parse(updatedNotes);
            if (item.handle) parsed.instagram_handle = item.handle;
            parsed.instagram_status = item.status;
            parsed.instagram_stage = item.stage;
            parsed.instagram_action = item.action;
            parsed.instagram_updated_at = item.date;
            parsed.instagram_log = (parsed.instagram_log ? parsed.instagram_log + '\n' : '') + igNoteEntry;
            updatedNotes = JSON.stringify(parsed);
          } catch (e) {
            updatedNotes = updatedNotes + '\n' + igNoteEntry;
          }
        } else {
          updatedNotes = updatedNotes.includes(item.stage) ? updatedNotes : updatedNotes + '\n' + igNoteEntry;
        }
      }

      const updatePayload = {
        industry: existingComp.industry || item.industry,
        pipeline_stage: compPipelineStage,
        lead_status: compLeadStatus,
        status: compStatus,
        notes: updatedNotes,
        updated_at: new Date().toISOString()
      };

      const { error: compUpErr } = await supabase.from('companies').update(updatePayload).eq('id', existingComp.id);
      if (compUpErr) console.error('Company Update Error for ' + item.name + ':', compUpErr.message);
      else {
        console.log('Updated Company:', existingComp.company_name, '-> Stage:', compPipelineStage);
        updatedCompanies++;
      }
    } else {
      // Create new company record
      const insertPayload = {
        company_name: item.name,
        industry: item.industry,
        lead_status: compLeadStatus,
        pipeline_stage: compPipelineStage,
        lead_source: 'Instagram',
        status: compStatus,
        notes: igNoteEntry,
        date_added: item.date,
        created_at: item.date + 'T10:00:00.000Z',
        updated_at: new Date().toISOString()
      };

      const { data: newComp, error: compInErr } = await supabase.from('companies').insert(insertPayload).select().single();
      if (compInErr) {
        console.error('Company Insert Error for ' + item.name + ':', compInErr.message);
      } else {
        targetCompanyId = newComp.id;
        console.log('Inserted New Company:', item.name);
        insertedCompanies++;
      }
    }

    // Process Contacts
    const existingContact = allContacts.find(c => {
      const cname = c.full_name.toLowerCase().trim();
      return cname === cleanSearchName || (targetCompanyId && c.company_id === targetCompanyId);
    });

    if (existingContact) {
      const { error: ctUpErr } = await supabase.from('contacts').update({
        updated_at: new Date().toISOString()
      }).eq('id', existingContact.id);
      if (!ctUpErr) updatedContacts++;
    } else if (targetCompanyId) {
      const { error: ctInErr } = await supabase.from('contacts').insert({
        company_id: targetCompanyId,
        full_name: item.name,
        title: 'Decision Maker / Owner',
        is_primary: true,
        created_at: item.date + 'T10:00:00.000Z'
      });
      if (!ctInErr) {
        console.log('Inserted Contact for:', item.name);
        insertedContacts++;
      }
    }
  }

  console.log('\n=== INSTAGRAM BATCH EXECUTION SUMMARY ===');
  console.log('Companies -> Updated:', updatedCompanies, '| Inserted:', insertedCompanies);
  console.log('Contacts  -> Updated:', updatedContacts, '| Inserted:', insertedContacts);
}

syncInstagramBatch();
