const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env.local'));
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const linkedInYesterday = [
  'Abdul Rahman', 'Almothana ALBusaidi', 'P.B Boss', 'Mostafa Zidan', 'Priyank Shah', 'Azmath Sheikh',
  'Saeed Mirzaei', 'Said Al-Maskari', 'Qaboos Al Said', 'Faisal Al-Balushi', 'Haitham Al Rawahi', 'Mohammad Danish Khan'
];

const linkedInToday = [
  'Faisal Al-Rashdi', 'Mohamed Al Salmi', 'Manoj Prem Mulani', 'Yousuf Allamki', 'Vishal Sobti',
  'H.H.Thweiny AL-Said', 'Alham Alnassri', 'rachad abouzaki', 'Fahd Siddiqui', 'Karl Whelan',
  'Hind AlMamari', 'HARISH HAMSA'
];

const igYesterday = [
  'Beitak Real Estate', 'RIKAZ', 'Midan Real Estate', 'Royal Gulf Estate', 'Wassan Specialty Dental Center',
  'Kenz Dental & Orthodontic Center', 'Arabic-named clinic', 'Plaza Clinic', 'GHC CLINIC Dental-Aesthetics',
  'MCC Medical Clinic Muscat', 'AHMED BEAUTY LOUNGE'
];

const igToday = [
  'Arabic-named salon', 'Hussain Beauty Lounge', '194°F Specialty Coffee', 'Especiale Café',
  'Muscat Hair & Beauty Salon', 'Lumare Aesthetic Clinic', 'Mazaya', 'Blend', 'Dentology Dental Clinic',
  'Yusr Real Estate'
];

async function logAllActivities() {
  console.log('--- Fetching all companies from DB ---');
  let allCompanies = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .range(page * 1000, (page + 1) * 1000 - 1);
    if (error || !data || data.length === 0) break;
    allCompanies = allCompanies.concat(data);
    if (data.length < 1000) break;
    page++;
  }

  console.log('Total companies in DB:', allCompanies.length);

  const activitiesToInsert = [];

  function findComp(name) {
    const clean = name.toLowerCase().trim();
    return allCompanies.find(c => {
      const cn = c.company_name.toLowerCase().trim();
      return cn === clean || cn.includes(clean) || clean.includes(cn) ||
        (clean.includes('kenz') && cn.includes('kenz')) ||
        (clean.includes('hussain') && cn.includes('hussein')) ||
        (clean.includes('mazaya') && cn.includes('mazaya')) ||
        (clean.includes('blend') && cn.includes('blend')) ||
        (clean.includes('mcc') && cn.includes('mcc')) ||
        (clean.includes('abdul rahman') && cn.includes('muscat al khair'));
    });
  }

  // 1. LinkedIn Yesterday (2026-09-29)
  for (const name of linkedInYesterday) {
    const comp = findComp(name);
    if (comp) {
      activitiesToInsert.push({
        company_id: comp.id,
        activity_type: 'outreach_sent',
        title: 'LinkedIn — Outreach Sent',
        description: JSON.stringify({
          channel: 'linkedin',
          handle: comp.linkedin_url || comp.company_name,
          status: 'sent',
          template_used: 'gate_opener',
          notes: '[2026-09-29] LinkedIn outreach touchpoint completed for ' + name,
          outreach_date: '2026-09-29'
        }),
        created_at: '2026-09-29T10:00:00.000Z'
      });
    }
  }

  // 2. LinkedIn Today (2026-09-30)
  for (const name of linkedInToday) {
    const comp = findComp(name);
    if (comp) {
      activitiesToInsert.push({
        company_id: comp.id,
        activity_type: 'outreach_sent',
        title: 'LinkedIn — Connection Request Sent',
        description: JSON.stringify({
          channel: 'linkedin',
          handle: comp.linkedin_url || comp.company_name,
          status: 'sent',
          template_used: 'gate_opener',
          notes: '[2026-09-30] LinkedIn connection request sent for ' + name,
          outreach_date: '2026-09-30'
        }),
        created_at: '2026-09-30T10:00:00.000Z'
      });
    }
  }

  // 3. Instagram Yesterday (2026-09-29)
  for (const name of igYesterday) {
    const comp = findComp(name);
    if (comp) {
      activitiesToInsert.push({
        company_id: comp.id,
        activity_type: 'outreach_sent',
        title: 'Instagram DM — Gate Opener Sent',
        description: JSON.stringify({
          channel: 'instagram_dm',
          handle: comp.company_name,
          status: 'sent',
          template_used: 'gate_opener',
          notes: '[2026-09-29] Instagram outreach sent for ' + name,
          outreach_date: '2026-09-29'
        }),
        created_at: '2026-09-29T11:00:00.000Z'
      });
    }
  }

  // 4. Instagram Today (2026-09-30)
  for (const name of igToday) {
    const comp = findComp(name);
    if (comp) {
      const isCancelled = name.includes('Dentology') || name.includes('Yusr');
      const isPending = name.includes('Mazaya') || name.includes('Blend');
      const statusStr = isCancelled ? 'not_now_snoozed' : isPending ? 'warm_up' : 'follow_up_sent';
      const titleStr = isCancelled ? 'Instagram DM — Cancelled' : isPending ? 'Instagram DM — Pending Request' : 'Instagram DM — Follow-up Sent';

      activitiesToInsert.push({
        company_id: comp.id,
        activity_type: 'outreach_sent',
        title: titleStr,
        description: JSON.stringify({
          channel: 'instagram_dm',
          handle: comp.company_name,
          status: statusStr,
          template_used: isCancelled ? 'custom' : 'follow_up',
          notes: '[2026-09-30] Instagram touchpoint for ' + name,
          outreach_date: '2026-09-30'
        }),
        created_at: '2026-09-30T11:00:00.000Z'
      });
    }
  }

  console.log('Total activities prepared to insert:', activitiesToInsert.length);
  const { data, error } = await supabase.from('activities').insert(activitiesToInsert);
  if (error) {
    console.error('Error inserting activities:', error.message);
  } else {
    console.log('🎉 Successfully logged all outreach activities into Daily Cadence for Sep 29 and Sep 30!');
  }
}

logAllActivities();
