import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

if (fs.existsSync('.env.local')) {
  fs.readFileSync('.env.local', 'utf8').split('\n').forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length > 0) process.env[k.trim()] = v.join('=').trim();
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SEEDS = [
  {
    name: 'Jad Atat',
    title: 'Group CEO',
    company: 'EVCG',
    location: 'Oman',
    degree: '1st',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/jad-atat',
    connection_status: 'connected',
    message_status: 'sent',
    priority: 'High',
    lead_type: 'Potential client / strategic relationship',
    industry: 'Conglomerate / Energy & Construction',
    screenshot_date: '2026-07-23',
    notes: 'Connection request sent and accepted today. Commented on his post and sent Welcome DM.',
    activities: [
      { id: 'act-jad-1', date: '2026-07-23', activity_type: 'profile_visit', description: 'Visited LinkedIn profile', status: 'confirmed' },
      { id: 'act-jad-2', date: '2026-07-23', activity_type: 'connection_accepted', description: 'Connection request sent and accepted today', status: 'confirmed' },
      { id: 'act-jad-3', date: '2026-07-23', activity_type: 'commented_post', description: 'Commented on his LinkedIn post', status: 'confirmed' },
      { id: 'act-jad-4', date: '2026-07-23', activity_type: 'dm_sent', description: 'Welcome DM sent', status: 'confirmed' },
    ],
  },
  {
    name: 'Om Yadav',
    title: 'Founder & CEO',
    company: 'The VP Realty',
    location: 'Oman',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/om-yadav-vprealty',
    connection_status: 'engaged',
    message_status: 'none',
    priority: 'High',
    lead_type: '',
    industry: 'Real Estate Development',
    screenshot_date: '2026-07-23',
    notes: 'Profile visited and followed on LinkedIn.',
    activities: [
      { id: 'act-om-1', date: '2026-07-23', activity_type: 'profile_visit', description: 'Visited LinkedIn profile', status: 'confirmed' },
      { id: 'act-om-2', date: '2026-07-23', activity_type: 'followed', description: 'Followed profile on LinkedIn', status: 'confirmed' },
    ],
  },
  {
    name: 'Farhan Safi',
    title: 'Founder',
    company: 'Revo Realty',
    location: 'Dubai, UAE',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/farhan-safi-revo',
    connection_status: 'pending',
    message_status: 'none',
    priority: 'High',
    lead_type: '',
    industry: 'Real Estate Services',
    screenshot_date: '2026-07-23',
    notes: 'Visited profile, commented on post, and sent targeted connection request.',
    activities: [
      { id: 'act-far-1', date: '2026-07-23', activity_type: 'profile_visit', description: 'Visited LinkedIn profile', status: 'confirmed' },
      { id: 'act-far-2', date: '2026-07-23', activity_type: 'commented_post', description: 'Commented on LinkedIn post', status: 'confirmed' },
      { id: 'act-far-3', date: '2026-07-23', activity_type: 'connection_sent', description: 'Connection request sent', status: 'confirmed' },
    ],
  },
  {
    name: 'Faroq Syed',
    title: 'CEO',
    company: 'Springfield Properties',
    location: 'Dubai, UAE',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/faroq-syed-springfield',
    connection_status: 'pending',
    message_status: 'none',
    priority: 'High',
    lead_type: '',
    industry: 'Luxury Real Estate',
    screenshot_date: '2026-07-23',
    notes: 'Visited profile, followed, commented on post, sent connection request.',
    activities: [
      { id: 'act-farq-1', date: '2026-07-23', activity_type: 'profile_visit', description: 'Visited LinkedIn profile', status: 'confirmed' },
      { id: 'act-farq-2', date: '2026-07-23', activity_type: 'followed', description: 'Followed profile on LinkedIn', status: 'confirmed' },
      { id: 'act-farq-3', date: '2026-07-23', activity_type: 'commented_post', description: 'Commented on LinkedIn post', status: 'confirmed' },
      { id: 'act-farq-4', date: '2026-07-23', activity_type: 'connection_sent', description: 'Connection request sent', status: 'confirmed' },
    ],
  },
  {
    name: 'Mohammed Al Falahi',
    title: 'Founder & CEO | BINRASHID Real Estate',
    company: 'BINRASHID Real Estate',
    location: 'Muscat, Masqat, Oman',
    degree: '1st',
    connections: '123 connections',
    profile_url: 'https://linkedin.com/in/mohammed-al-falahi-0726b0110/',
    connection_status: 'connected',
    message_status: 'to_send',
    priority: 'High',
    lead_type: 'Potential client',
    industry: 'Real Estate',
    screenshot_date: '2026-07-20',
    notes: 'Connected on LinkedIn. Outreach sequence ready.',
    activities: [
      { id: 'act-falah-1', date: '2026-07-20', activity_type: 'connection_accepted', description: 'Connected on LinkedIn', status: 'confirmed' }
    ]
  },
  {
    name: 'SUHAIL TM',
    title: 'Managing Director at Medicorp Oman',
    company: 'Medicorp Oman',
    location: 'Masqat, Oman',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/suhail-tm-b108071a5/',
    connection_status: 'to_connect',
    message_status: 'to_send',
    priority: 'Medium',
    lead_type: '',
    mutual_connection: 'Mohan',
    industry: 'Healthcare / Medical',
    screenshot_date: '2026-07-20',
    notes: 'Not connected yet. Send connection request.',
    activities: [
      { id: 'act-suh-1', date: '2026-07-20', activity_type: 'profile_visit', description: 'Visited profile', status: 'confirmed' }
    ]
  },
  {
    name: 'Nada Al-Hajri',
    title: 'Country CEO — Oman | ECOBLOX',
    company: 'ECOBLOX',
    location: 'Masqat, Oman',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/nada-al-hajri/',
    connection_status: 'to_connect',
    message_status: 'to_send',
    priority: 'High',
    lead_type: '',
    mutual_connection: 'Ismail',
    industry: 'Technology / Cybersecurity',
    screenshot_date: '2026-07-20',
    notes: 'IT professional, 11 years exp. Send connection + message.',
    activities: [
      { id: 'act-nada-1', date: '2026-07-20', activity_type: 'profile_visit', description: 'Visited profile', status: 'confirmed' }
    ]
  },
  {
    name: 'Amin Jassem Zare',
    title: 'MD at CHEMICAL MANUFACTURING (YQS GROUP LLC OMAN)',
    company: 'YQS GROUP OMAN',
    location: 'Muscat, Masqat, Oman',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/amin-jassem-zare-71027b210/',
    connection_status: 'pending',
    message_status: 'to_send',
    priority: 'Medium',
    lead_type: '',
    mutual_connection: 'Mohammed',
    industry: 'Chemical Manufacturing',
    screenshot_date: '2026-07-20',
    notes: 'Invitation sent to Amin — awaiting acceptance.',
    activities: [
      { id: 'act-amin-1', date: '2026-07-20', activity_type: 'connection_sent', description: 'Invitation sent', status: 'confirmed' }
    ]
  },
  {
    name: 'Saeed Al Hosni',
    title: 'Managing Director at Voltech, Oman',
    company: 'VOLTECH LLC (OM)',
    location: 'Al Khaburah, Oman',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/saeed-al-hosni-12b50b55/',
    connection_status: 'pending',
    message_status: 'to_send',
    priority: 'Medium',
    lead_type: '',
    mutual_connection: 'Faisal',
    industry: 'Technology / Engineering',
    screenshot_date: '2026-07-20',
    notes: 'Invitation sent to Saeed. Awaiting acceptance.',
    activities: [
      { id: 'act-saeed-1', date: '2026-07-20', activity_type: 'connection_sent', description: 'Invitation sent', status: 'confirmed' }
    ]
  },
  {
    name: 'Faiz Mohammad Riaz',
    title: 'Group Managing Director | Vice Chairman at Oman Golf Association',
    company: 'Mohammed Riaz & Partner LLC',
    location: 'Muscat, Masqat, Oman',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/faiz-mohammad-riaz/',
    connection_status: 'following',
    message_status: 'to_send',
    priority: 'High',
    lead_type: '',
    mutual_connection: 'Raheem',
    industry: 'Business / Investment',
    screenshot_date: '2026-07-20',
    notes: 'Following. 5,795 followers. Direct message pending.',
    activities: [
      { id: 'act-faiz-1', date: '2026-07-20', activity_type: 'followed', description: 'Followed profile', status: 'confirmed' }
    ]
  },
  {
    name: 'Badar Al Shanfari',
    title: 'Chief Operating Officer',
    company: 'Ominvest',
    location: 'Muscat, Masqat, Oman',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/badar-al-shanfari/',
    connection_status: 'pending',
    message_status: 'to_send',
    priority: 'Strategic / Tier 1',
    lead_type: 'Strategic Partner',
    industry: 'Investment / Financial Services',
    screenshot_date: '2026-07-20',
    notes: 'Invitation sent to Badar — COO at major investment group.',
    activities: [
      { id: 'act-badar-1', date: '2026-07-20', activity_type: 'connection_sent', description: 'Invitation sent', status: 'confirmed' }
    ]
  }
];

async function run() {
  console.log('Seeding missing historical LinkedIn contacts...');
  
  for (const s of SEEDS) {
    const { data: existing } = await supabase
      .from('linkedin_prospects')
      .select('id')
      .eq('name', s.name)
      .maybeSingle();

    if (!existing) {
      console.log(`Inserting missing historical lead: ${s.name}`);
      const { error } = await supabase
        .from('linkedin_prospects')
        .insert({
          ...s,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(`Failed to insert ${s.name}:`, error.message);
      } else {
        console.log(`Successfully inserted ${s.name}`);
      }
    } else {
      console.log(`Lead already exists, skipping: ${s.name}`);
    }
  }

  console.log('Historical LinkedIn contacts seeding finished.');
}

run().catch(console.error);
