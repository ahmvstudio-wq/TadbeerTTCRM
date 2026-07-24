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

interface Activity {
  id: string;
  date: string;
  activity_type: string;
  description: string;
  status: string;
}

interface UpdatePayload {
  name: string;
  company: string;
  title: string;
  connection_status: 'connected' | 'pending' | 'to_connect' | 'following';
  message_status: 'none' | 'to_send' | 'planned' | 'sent' | 'replied';
  notes: string;
  newActivities: Omit<Activity, 'id'>[];
}

const UPDATES: UpdatePayload[] = [
  {
    name: 'Haitham Al Rawahi',
    company: 'GWC Oman',
    title: 'General Manager',
    connection_status: 'connected',
    message_status: 'replied',
    notes: 'Warm relationship. Welcome message sent. Positive reply received. Conversation initiated. Relationship moved to Warm Connection.',
    newActivities: [
      { date: '2026-07-24', activity_type: 'dm_sent', description: 'Welcome message sent', status: 'confirmed' },
      { date: '2026-07-24', activity_type: 'dm_sent', description: 'Conversation initiated & replied', status: 'confirmed' }
    ]
  },
  {
    name: 'Balqees Al-Kindy',
    company: 'O Homes',
    title: 'Co-Founder & COO',
    connection_status: 'connected',
    message_status: 'replied',
    notes: 'Warm relationship. Welcome message sent. Positive reply received. Conversation initiated. Relationship moved to Warm Connection.',
    newActivities: [
      { date: '2026-07-24', activity_type: 'dm_sent', description: 'Welcome message sent', status: 'confirmed' },
      { date: '2026-07-24', activity_type: 'dm_sent', description: 'Conversation initiated & replied', status: 'confirmed' }
    ]
  },
  {
    name: 'Dr. Saleh Al-Khaldi',
    company: 'Connect Arabia International',
    title: 'CEO',
    connection_status: 'connected',
    message_status: 'sent',
    notes: 'Connection request accepted today. Welcome message sent.',
    newActivities: [
      { date: '2026-07-24', activity_type: 'connection_accepted', description: 'Connection request accepted', status: 'confirmed' },
      { date: '2026-07-24', activity_type: 'dm_sent', description: 'Welcome message sent', status: 'confirmed' }
    ]
  },
  {
    name: 'Mohamed Ahmed',
    company: 'Unknown',
    title: 'Business Analyst | AI & Automation | ERP Implementation',
    connection_status: 'connected',
    message_status: 'sent',
    notes: 'Connection request accepted today. Welcome message sent.',
    newActivities: [
      { date: '2026-07-24', activity_type: 'connection_accepted', description: 'Connection request accepted', status: 'confirmed' },
      { date: '2026-07-24', activity_type: 'dm_sent', description: 'Welcome message sent', status: 'confirmed' }
    ]
  },
  {
    name: 'Ebtihal Al Saaidi',
    company: 'Yser',
    title: 'Founder & CEO',
    connection_status: 'connected',
    message_status: 'sent',
    notes: 'Connection request accepted today. Welcome message sent.',
    newActivities: [
      { date: '2026-07-24', activity_type: 'connection_accepted', description: 'Connection request accepted', status: 'confirmed' },
      { date: '2026-07-24', activity_type: 'dm_sent', description: 'Welcome message sent', status: 'confirmed' }
    ]
  },
  {
    name: 'Imad Taleb',
    company: 'PROPUP Property Management',
    title: 'Entrepreneur',
    connection_status: 'connected',
    message_status: 'sent',
    notes: 'Connection request accepted today. Welcome message sent.',
    newActivities: [
      { date: '2026-07-24', activity_type: 'connection_accepted', description: 'Connection request accepted', status: 'confirmed' },
      { date: '2026-07-24', activity_type: 'dm_sent', description: 'Welcome message sent', status: 'confirmed' }
    ]
  },
  {
    name: 'Syed Ali',
    company: 'The VP Realty',
    title: 'Senior Portfolio Manager | Luxury Real Estate Advisor',
    connection_status: 'connected',
    message_status: 'sent',
    notes: 'Connection request accepted today. Welcome message sent today.',
    newActivities: [
      { date: '2026-07-24', activity_type: 'connection_accepted', description: 'Connection request accepted today', status: 'confirmed' },
      { date: '2026-07-24', activity_type: 'dm_sent', description: 'Welcome message sent today', status: 'confirmed' }
    ]
  },
  {
    name: 'Ralitsa Ivanova',
    company: 'clearcue.ai',
    title: 'Founder',
    connection_status: 'connected',
    message_status: 'sent',
    notes: 'Connection request accepted today. Welcome message sent.',
    newActivities: [
      { date: '2026-07-24', activity_type: 'connection_accepted', description: 'Connection request accepted', status: 'confirmed' },
      { date: '2026-07-24', activity_type: 'dm_sent', description: 'Welcome message sent', status: 'confirmed' }
    ]
  },
  {
    name: 'Walid Merabbi',
    company: 'PROPUP Property Management',
    title: 'Co-Founder',
    connection_status: 'connected',
    message_status: 'sent',
    notes: 'Connection request accepted today. Welcome message sent.',
    newActivities: [
      { date: '2026-07-24', activity_type: 'connection_accepted', description: 'Connection request accepted', status: 'confirmed' },
      { date: '2026-07-24', activity_type: 'dm_sent', description: 'Welcome message sent', status: 'confirmed' }
    ]
  }
];

async function run() {
  console.log('Seeding and updating LinkedIn contacts for July 24, 2026 (Using UUID schema)...');

  for (const item of UPDATES) {
    // Check if contact already exists
    const { data: existing } = await supabase
      .from('linkedin_prospects')
      .select('*')
      .eq('name', item.name)
      .maybeSingle();

    const formattedActivities = item.newActivities.map((act, idx) => ({
      ...act,
      id: `act-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`
    }));

    if (existing) {
      console.log(`Updating existing contact: ${item.name}`);
      const updatedActivities = [...formattedActivities, ...(existing.activities || [])];
      
      const { error } = await supabase
        .from('linkedin_prospects')
        .update({
          company: item.company !== 'Unknown' ? item.company : existing.company,
          title: item.title,
          connection_status: item.connection_status,
          message_status: item.message_status,
          notes: item.notes,
          activities: updatedActivities,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error(`Error updating ${item.name}:`, error.message);
      } else {
        console.log(`Successfully updated ${item.name}`);
      }
    } else {
      console.log(`Creating new contact: ${item.name}`);
      const newProspect = {
        name: item.name,
        title: item.title,
        company: item.company,
        location: 'Muscat, Oman',
        degree: '2nd',
        connections: '500+ connections',
        profile_url: '',
        connection_status: item.connection_status,
        message_status: item.message_status,
        priority: 'Medium',
        lead_type: '',
        mutual_connection: '',
        industry: 'General Business',
        screenshot_date: '2026-07-24',
        notes: item.notes,
        activities: formattedActivities,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('linkedin_prospects')
        .insert(newProspect);

      if (error) {
        console.error(`Error inserting ${item.name}:`, error.message);
      } else {
        console.log(`Successfully created ${item.name}`);
      }
    }
  }

  console.log('LinkedIn contacts update finished.');
}

run().catch(console.error);
