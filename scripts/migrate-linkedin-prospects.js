const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env.local'));
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
  console.log('=== STARTING LINKEDIN PROSPECTS TO CRM MIGRATION ===');

  const { data: lp, error: lpErr } = await supabase.from('linkedin_prospects').select('*');
  if (lpErr) {
    console.error('Error fetching linkedin_prospects:', lpErr);
    return;
  }

  const { data: allCompanies, error: cErr } = await supabase.from('companies').select('id, company_name, linkedin_url, status, pipeline_stage');
  if (cErr) {
    console.error('Error fetching companies:', cErr);
    return;
  }

  const { data: allContacts, error: ctErr } = await supabase.from('contacts').select('id, company_id, full_name, linkedin_url, is_primary');
  if (ctErr) {
    console.error('Error fetching contacts:', ctErr);
    return;
  }

  const { data: allActivities, error: actErr } = await supabase.from('activities').select('id, company_id, metadata, description');
  if (actErr) {
    console.error('Error fetching activities:', actErr);
    return;
  }

  const compByName = new Map();
  allCompanies.forEach(c => {
    if (c.company_name) compByName.set(c.company_name.trim().toLowerCase(), c);
  });

  const contactsByNameOrUrl = new Map();
  allContacts.forEach(ct => {
    if (ct.full_name) contactsByNameOrUrl.set(ct.full_name.trim().toLowerCase(), ct);
    if (ct.linkedin_url) contactsByNameOrUrl.set(ct.linkedin_url.trim().toLowerCase(), ct);
  });

  let createdCompanies = 0;
  let updatedCompanies = 0;
  let createdContacts = 0;
  let updatedContacts = 0;
  let createdActivities = 0;

  for (const p of lp) {
    const rawComp = (p.company || '').trim();
    const compName = (rawComp && rawComp.toLowerCase() !== 'unknown') ? rawComp : p.name.trim();
    const compKey = compName.toLowerCase();

    // 1. Resolve or Create Company
    let comp = compByName.get(compKey);

    // Stage determination
    let unifiedStatus = 'contacted';
    let dbStatus = 'contacted';
    let dbPipeline = 'Contacted';

    if (p.message_status === 'replied' || (p.notes && p.notes.toLowerCase().includes('replied'))) {
      unifiedStatus = 'warm_up';
      dbStatus = 'contacted';
      dbPipeline = 'Warm-Up In Progress';
    } else if (p.message_status === 'sent' || p.connection_status === 'connected') {
      unifiedStatus = 'contacted';
      dbStatus = 'contacted';
      dbPipeline = 'Contacted';
    } else {
      unifiedStatus = 'prospect';
      dbStatus = 'prospect';
      dbPipeline = 'New';
    }

    if (!comp) {
      const newCoPayload = {
        company_name: compName,
        industry: p.industry || 'General Business Enterprise',
        city: 'Muscat, Oman',
        country: 'Oman',
        linkedin_url: p.profile_url || null,
        lead_source: 'LinkedIn',
        status: dbStatus,
        pipeline_stage: dbPipeline,
        lead_status: 'Contacted',
        notes: p.notes || null,
        created_at: p.created_at || '2026-07-24T10:00:00.000Z',
        updated_at: new Date().toISOString()
      };

      const { data: newCo, error: insertCoErr } = await supabase
        .from('companies')
        .insert(newCoPayload)
        .select('id, company_name, linkedin_url, status, pipeline_stage')
        .single();

      if (insertCoErr) {
        console.error(`Failed to create company for ${compName}:`, insertCoErr.message);
        continue;
      }

      comp = newCo;
      compByName.set(compKey, comp);
      createdCompanies++;
      console.log(`+ Created company: ${compName} (${comp.id})`);
    } else {
      // If company has no linkedin_url and prospect has one, update it
      if (!comp.linkedin_url && p.profile_url) {
        await supabase.from('companies').update({
          linkedin_url: p.profile_url,
          updated_at: new Date().toISOString()
        }).eq('id', comp.id);
        comp.linkedin_url = p.profile_url;
        updatedCompanies++;
      }
    }

    // 2. Resolve or Create Contact
    const nameKey = p.name ? p.name.trim().toLowerCase() : '';
    const urlKey = p.profile_url ? p.profile_url.trim().toLowerCase() : '';
    let contact = (nameKey && contactsByNameOrUrl.get(nameKey)) || (urlKey && contactsByNameOrUrl.get(urlKey));

    if (!contact) {
      const newCtPayload = {
        company_id: comp.id,
        full_name: p.name,
        title: p.title || 'Decision Maker',
        linkedin_url: p.profile_url || null,
        is_primary: true,
        created_at: p.created_at || '2026-07-24T10:00:00.000Z',
        updated_at: new Date().toISOString()
      };

      const { data: newCt, error: insertCtErr } = await supabase
        .from('contacts')
        .insert(newCtPayload)
        .select('id, company_id, full_name, linkedin_url, is_primary')
        .single();

      if (insertCtErr) {
        console.error(`Failed to create contact for ${p.name}:`, insertCtErr.message);
      } else {
        contact = newCt;
        if (nameKey) contactsByNameOrUrl.set(nameKey, contact);
        if (urlKey) contactsByNameOrUrl.set(urlKey, contact);
        createdContacts++;
        console.log(`+ Created contact: ${p.name} for ${compName}`);
      }
    } else {
      // Update contact if profile_url or company_id needs linking
      const ctUpdates = {};
      if (!contact.linkedin_url && p.profile_url) {
        ctUpdates.linkedin_url = p.profile_url;
      }
      if (!contact.company_id) {
        ctUpdates.company_id = comp.id;
      }
      if (Object.keys(ctUpdates).length > 0) {
        await supabase.from('contacts').update(ctUpdates).eq('id', contact.id);
        updatedContacts++;
      }
    }

    // 3. Resolve and Insert Historical Activities
    const acts = Array.isArray(p.activities) && p.activities.length > 0
      ? p.activities
      : [{ description: p.notes || `LinkedIn outreach with ${p.name}`, date: p.screenshot_date }];

    for (const act of acts) {
      const actDesc = act.description || p.notes || 'LinkedIn outreach touch';
      const alreadyHas = allActivities.some(a => 
        (a.metadata?.linkedin_prospect_id === p.id && a.metadata?.original_act_id === act.id) ||
        (a.company_id === comp.id && a.metadata?.original_act_id === act.id) ||
        (a.company_id === comp.id && a.description === actDesc && a.metadata?.channel === 'linkedin')
      );

      if (!alreadyHas) {
        let actStatus = 'contacted';
        if (actDesc.toLowerCase().includes('replied') || actDesc.toLowerCase().includes('reply')) {
          actStatus = 'reply_received';
        } else if (actDesc.toLowerCase().includes('audit')) {
          actStatus = 'audit_offered';
        }

        const createdAt = act.date 
          ? `${act.date}T10:00:00.000Z` 
          : (p.created_at || '2026-07-24T10:00:00.000Z');

        const { error: insActErr } = await supabase.from('activities').insert({
          company_id: comp.id,
          contact_id: contact?.id || null,
          activity_type: 'outreach_sent',
          title: `LinkedIn — ${actDesc}`,
          description: actDesc,
          metadata: {
            channel: 'linkedin',
            status: actStatus,
            handle: p.profile_url || p.name,
            notes: actDesc,
            connection_status: p.connection_status,
            message_status: p.message_status,
            profile_url: p.profile_url,
            linkedin_prospect_id: p.id,
            original_act_id: act.id || null,
            template_used: 'custom',
            outreach_date: act.date || (p.screenshot_date || createdAt.split('T')[0])
          },
          created_at: createdAt
        });

        if (insActErr) {
          console.error(`Error inserting activity for ${compName}:`, insActErr.message);
        } else {
          createdActivities++;
          allActivities.push({
            company_id: comp.id,
            description: actDesc,
            metadata: { linkedin_prospect_id: p.id, original_act_id: act.id, channel: 'linkedin' }
          });
        }
      }
    }
  }

  console.log('\n=== MIGRATION SUMMARY ===');
  console.log(`Companies: ${createdCompanies} created, ${updatedCompanies} updated`);
  console.log(`Contacts: ${createdContacts} created, ${updatedContacts} updated`);
  console.log(`Activities: ${createdActivities} unified historical activities created`);
}

migrate();
