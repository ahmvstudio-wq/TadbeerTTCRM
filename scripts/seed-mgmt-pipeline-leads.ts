import { getSupabaseAdminClient } from '../src/lib/supabase/config';

interface MgmtLeadSeed {
  company_name: string;
  search_aliases: string[];
  contact_name?: string;
  contact_title?: string;
  contact_phone?: string;
  contact_email?: string;
  industry: string;
  category: string;
  stage: 'demo' | 'proposal' | 'follow_up' | 'meeting' | 'won' | 'lost' | 'outreach';
  db_status: 'in_call_queue' | 'meeting_booked' | 'opportunity' | 'contacted' | 'prospect' | 'won' | 'lost';
  pipeline_stage_label: string;
  lead_status: 'New' | 'Contacted' | 'Qualified' | 'Meeting Booked' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost';
  next_action: string;
  action_due_date: string;
  demo_status?: 'required' | 'in_progress' | 'completed' | 'none';
  presentation_status?: 'required' | 'sent' | 'completed' | 'none';
  proposal_status?: 'drafting' | 'sent' | 'negotiating' | 'approved' | 'none';
  follow_up_status?: 'required' | 'scheduled' | 'waiting_response' | 'none';
  demo_urls?: Array<{ title: string; url: string }>;
  presentation_urls?: Array<{ title: string; url: string }>;
  notes?: string;
  assigned_bdm?: string;
}

const MGMT_LEADS: MgmtLeadSeed[] = [
  {
    company_name: 'Skyline Decor',
    search_aliases: ['Skyline', 'Red Skyline Sale'],
    contact_name: 'Management / Owner',
    contact_title: 'Decision Maker',
    industry: 'Interior Design & Fitout',
    category: 'Enterprise / Retail',
    stage: 'demo',
    db_status: 'meeting_booked',
    pipeline_stage_label: 'Demo / Presentation',
    lead_status: 'Qualified',
    next_action: 'Arrange website and ERP solution demo; prepare MOU, presentation covering Training & Development Gap Analysis, Organizational Structuring and Digital Growth services; prepare relevant quotation.',
    action_due_date: '2026-10-09',
    demo_status: 'in_progress',
    presentation_status: 'required',
    proposal_status: 'drafting',
    follow_up_status: 'scheduled',
    notes: 'Demo required for ERP & Website. Comprehensive MOU, Training & Gap analysis presentation and quotation in preparation.',
    assigned_bdm: 'Ramij'
  },
  {
    company_name: 'Gadgets Oman',
    search_aliases: ['Gadgets', '@gadgetsoman.om'],
    contact_name: 'Amir Shamsi',
    contact_title: 'Managing Director / Owner',
    industry: 'Consumer Electronics & Retail',
    category: 'Retail / Technology',
    stage: 'demo',
    db_status: 'meeting_booked',
    pipeline_stage_label: 'Demo / Presentation',
    lead_status: 'Qualified',
    next_action: 'Prepare demos for ERP modules, AI Call Centre and AI Video Monitoring; prepare HR and Training & Development presentation.',
    action_due_date: '2026-10-08',
    demo_status: 'in_progress',
    presentation_status: 'required',
    proposal_status: 'drafting',
    follow_up_status: 'scheduled',
    demo_urls: [
      { title: 'Voice AI Demo', url: 'https://www.tadbeertt.com/the-gadgets-demo' },
      { title: 'ERP / POS Demo', url: 'https://gadgetsdemo-erp.tadbeertt.com/' }
    ],
    presentation_urls: [
      { title: 'Branding & Marketing Questionnaire', url: 'https://www.tadbeertt.com/marketing-questionnaire' }
    ],
    notes: 'High-priority demo client. Voice AI and ERP demo environments live. Preparing AI Video Monitoring and HR / Training presentation.',
    assigned_bdm: 'Ramij'
  },
  {
    company_name: 'PanelTech LLC',
    search_aliases: ['Panel Tech', 'PanelTech'],
    contact_name: 'Executive Leadership',
    contact_title: 'General Manager',
    industry: 'Manufacturing & Industrial Technology',
    category: 'Industrial / B2B',
    stage: 'demo',
    db_status: 'meeting_booked',
    pipeline_stage_label: 'Demo / Presentation',
    lead_status: 'Qualified',
    next_action: 'Arrange CRM demo; prepare Digital Growth presentation and quotation. Digital Setup & Optimization Roadmap attached.',
    action_due_date: '2026-10-09',
    demo_status: 'required',
    presentation_status: 'required',
    proposal_status: 'drafting',
    follow_up_status: 'scheduled',
    presentation_urls: [
      { title: 'PanelTech LLC – Digital Setup & Optimization Roadmap', url: '#roadmap-attached' }
    ],
    notes: 'Digital Setup & Optimization Roadmap attached. CRM demo scheduling in progress.',
    assigned_bdm: 'Ramij'
  },
  {
    company_name: 'Muscle House',
    search_aliases: ['Muscle House (Junaid Abdul Razzak)', 'Muscle House'],
    contact_name: 'Junaid Abdul Razzak',
    contact_title: 'Owner / Managing Director',
    industry: 'Health, Fitness & Nutrition',
    category: 'Retail & Wellness',
    stage: 'demo',
    db_status: 'meeting_booked',
    pipeline_stage_label: 'Demo / Presentation',
    lead_status: 'Qualified',
    next_action: 'Prepare AI CRM demo and Digital Growth strategy/PPT.',
    action_due_date: '2026-10-09',
    demo_status: 'in_progress',
    presentation_status: 'required',
    proposal_status: 'none',
    follow_up_status: 'scheduled',
    notes: 'Active engagement with Junaid Abdul Razzak. AI CRM customized demo and digital growth presentation under preparation.',
    assigned_bdm: 'Ramij'
  },
  {
    company_name: 'Muscat Fragrances',
    search_aliases: ['Muscat Fragrance', 'Muscat Fragrances'],
    contact_name: 'Leadership Team',
    contact_title: 'Managing Director',
    industry: 'Perfumery & Luxury Retail',
    category: 'Luxury / Retail',
    stage: 'demo',
    db_status: 'meeting_booked',
    pipeline_stage_label: 'Demo / Presentation',
    lead_status: 'Qualified',
    next_action: 'Arrange ERP modules and website demos; prepare Digital Growth plan and quotation.',
    action_due_date: '2026-10-08',
    demo_status: 'in_progress',
    presentation_status: 'required',
    proposal_status: 'drafting',
    follow_up_status: 'scheduled',
    demo_urls: [
      { title: 'Website Demo', url: 'https://muscat-fragrance.tadbeertt.com/' },
      { title: 'ERP Software Demo', url: 'https://muscatfragrance-os.tadbeertt.com/' }
    ],
    notes: 'Website demo & ERP OS demo instances live. Digital growth plan and commercial quotation being finalized.',
    assigned_bdm: 'Ramij'
  },
  {
    company_name: 'AQP – Al Qurum Perfume',
    search_aliases: ['Al Qurum Perfume', 'AQP', 'AQP – Al Qurum Perfume'],
    contact_name: 'Hiring Committee / General Manager',
    contact_title: 'General Manager',
    industry: 'Perfumes & Cosmetics Retail',
    category: 'Human Capital / Recruitment',
    stage: 'proposal',
    db_status: 'opportunity',
    pipeline_stage_label: 'Proposal Sent',
    lead_status: 'Proposal Sent',
    next_action: 'Prepare recruitment proposal for an Accountant position.',
    action_due_date: '2026-10-09',
    demo_status: 'none',
    presentation_status: 'none',
    proposal_status: 'drafting',
    follow_up_status: 'required',
    notes: 'Recruitment mandate for Accountant role. Tailored recruitment proposal and fee structure under drafting.',
    assigned_bdm: 'Ramij'
  },
  {
    company_name: 'DCIP',
    search_aliases: ['DCIP', 'DCIP – Ms. Jelan Badr'],
    contact_name: 'Ms. Jelan Badr',
    contact_title: 'Director / Decision Maker',
    industry: 'Design & Corporate Services',
    category: 'Corporate / Consulting',
    stage: 'follow_up',
    db_status: 'opportunity',
    pipeline_stage_label: 'Follow-up / Negotiation',
    lead_status: 'Negotiation',
    next_action: 'Follow up with Ms. Jelan Badr regarding the submitted proposal and determine the next action.',
    action_due_date: '2026-10-08',
    demo_status: 'completed',
    presentation_status: 'completed',
    proposal_status: 'sent',
    follow_up_status: 'required',
    notes: 'Proposal previously submitted to Ms. Jelan Badr. Follow-up required to review feedback and determine next contracting action.',
    assigned_bdm: 'Ramij'
  },
  {
    company_name: 'Elite International',
    search_aliases: ['Elite', 'Elite International'],
    contact_name: 'Senior Management',
    contact_title: 'Managing Director',
    industry: 'Trading & Services',
    category: 'Digital Marketing & Strategy',
    stage: 'proposal',
    db_status: 'opportunity',
    pipeline_stage_label: 'Proposal Sent',
    lead_status: 'Proposal Sent',
    next_action: 'Elite International – Brand & Digital Marketing Audit attached. Follow up on digital audit review and proposal closing.',
    action_due_date: '2026-10-08',
    demo_status: 'completed',
    presentation_status: 'sent',
    proposal_status: 'sent',
    follow_up_status: 'required',
    presentation_urls: [
      { title: 'Elite International – Brand & Digital Marketing Audit', url: '#audit-attached' }
    ],
    notes: 'Brand & Digital Marketing Audit delivered. Active commercial proposal closing in progress.',
    assigned_bdm: 'Ramij'
  },
  {
    company_name: 'YallaPass',
    search_aliases: ['YallaPass', 'Yalla Pass'],
    contact_name: 'Technical & Product Leadership',
    contact_title: 'Co-Founder / Product Lead',
    industry: 'FinTech / Event Ticketing & Passes',
    category: 'Software Solutions',
    stage: 'follow_up',
    db_status: 'opportunity',
    pipeline_stage_label: 'Follow-up / Negotiation',
    lead_status: 'Negotiation',
    next_action: 'Production Launch & Technical Prerequisites Checklist — Email Sent to retrieve help on integrations. The core platform is completed and the production launch is currently dependent on the required external credentials and integrations.',
    action_due_date: '2026-10-08',
    demo_status: 'completed',
    presentation_status: 'completed',
    proposal_status: 'approved',
    follow_up_status: 'required',
    notes: 'Core platform complete. Production launch dependent on partner credentials & third-party payment/gateway integration retrieval.',
    assigned_bdm: 'Ramij'
  }
];

async function seedMgmtLeads() {
  const sb = getSupabaseAdminClient();
  console.log('--- Seeding & Updating Management Pipeline Leads ---');

  for (const lead of MGMT_LEADS) {
    // 1. Check if existing company matches any alias
    let matchedCompany: any = null;

    for (const alias of lead.search_aliases) {
      const { data: cos } = await sb
        .from('companies')
        .select('*')
        .ilike('company_name', `%${alias}%`);

      if (cos && cos.length > 0) {
        // Pick best match
        matchedCompany = cos[0];
        break;
      }
    }

    const researchPayload = {
      ...(matchedCompany?.research_json || {}),
      pipeline_stage: lead.stage,
      next_action: lead.next_action,
      action_due_date: lead.action_due_date,
      demo_status: lead.demo_status || 'none',
      presentation_status: lead.presentation_status || 'none',
      proposal_status: lead.proposal_status || 'none',
      follow_up_status: lead.follow_up_status || 'required',
      demo_urls: lead.demo_urls || [],
      presentation_urls: lead.presentation_urls || [],
      owner: lead.assigned_bdm || 'Ramij',
      mgmt_highlight: true,
      last_updated: new Date().toISOString()
    };

    let companyId: string;

    if (matchedCompany) {
      companyId = matchedCompany.id;
      console.log(`Updating existing company [${companyId}]: "${matchedCompany.company_name}" -> "${lead.company_name}"`);
      
      const { error: updateErr } = await sb
        .from('companies')
        .update({
          company_name: lead.company_name,
          industry: lead.industry,
          category: lead.category,
          status: lead.db_status,
          pipeline_stage: lead.pipeline_stage_label,
          lead_status: lead.lead_status,
          assigned_bdm: lead.assigned_bdm || 'Ramij',
          notes: lead.notes,
          research_json: researchPayload,
          updated_at: new Date().toISOString()
        })
        .eq('id', companyId);

      if (updateErr) {
        console.error(`Error updating company ${companyId}:`, updateErr.message);
      }
    } else {
      console.log(`Creating new company: "${lead.company_name}"`);
      const { data: newCo, error: insertErr } = await sb
        .from('companies')
        .insert({
          company_name: lead.company_name,
          industry: lead.industry,
          category: lead.category,
          status: lead.db_status,
          pipeline_stage: lead.pipeline_stage_label,
          lead_status: lead.lead_status,
          assigned_bdm: lead.assigned_bdm || 'Ramij',
          notes: lead.notes,
          research_json: researchPayload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertErr || !newCo) {
        console.error(`Error creating company ${lead.company_name}:`, insertErr?.message);
        continue;
      }
      companyId = newCo.id;
    }

    // 2. Ensure Contact exists
    if (lead.contact_name) {
      const { data: existingContacts } = await sb
        .from('contacts')
        .select('*')
        .eq('company_id', companyId);

      if (!existingContacts || existingContacts.length === 0) {
        await sb.from('contacts').insert({
          company_id: companyId,
          full_name: lead.contact_name,
          title: lead.contact_title || 'Decision Maker',
          phone: lead.contact_phone || null,
          email: lead.contact_email || null,
          is_primary: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        await sb.from('contacts').update({
          full_name: lead.contact_name,
          title: lead.contact_title || existingContacts[0].title,
          is_primary: true,
          updated_at: new Date().toISOString()
        }).eq('id', existingContacts[0].id);
      }
    }

    // 3. Ensure Follow-Up Scheduled
    const { data: existingFu } = await sb
      .from('follow_ups')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'pending');

    if (!existingFu || existingFu.length === 0) {
      await sb.from('follow_ups').insert({
        company_id: companyId,
        due_date: lead.action_due_date,
        subject: `[Pipeline Action] ${lead.company_name}`,
        description: lead.next_action,
        channel: 'meeting',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else {
      await sb.from('follow_ups').update({
        due_date: lead.action_due_date,
        description: lead.next_action,
        updated_at: new Date().toISOString()
      }).eq('id', existingFu[0].id);
    }

    // 4. Log Activity
    await sb.from('activities').insert({
      company_id: companyId,
      activity_type: 'status_changed',
      title: `Pipeline Stage Updated: ${lead.pipeline_stage_label}`,
      description: `Next Action: ${lead.next_action}`,
      metadata: {
        stage: lead.stage,
        demo_status: lead.demo_status,
        presentation_status: lead.presentation_status,
        proposal_status: lead.proposal_status
      },
      created_at: new Date().toISOString()
    });

    console.log(`✓ Synchronized ${lead.company_name} -> Stage: ${lead.stage} (${lead.pipeline_stage_label})`);
  }

  console.log('\nAll 9 Management accounts successfully seeded and configured!');
}

seedMgmtLeads().catch(console.error);
