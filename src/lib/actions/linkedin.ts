'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/config'
import { requireAuth } from '@/lib/auth-guard'

const supabase = getSupabaseAdminClient()

export type ConnectionStatus = 'connected' | 'pending' | 'to_connect' | 'following' | 'engaged' | 'profile_viewer'
export type MessageStatus = 'none' | 'to_send' | 'planned' | 'sent' | 'replied'
export type ActivityStatus = 'confirmed' | 'planned'

export type LinkedInBdStage = 
  | 'stage_1_targeting'
  | 'stage_2_research'
  | 'stage_3_warm_engagement'
  | 'stage_4_connection_pending'
  | 'stage_5_welcome_convo'
  | 'stage_6_intelligent_nurture'
  | 'stage_7_business_convo'
  | 'stage_8_problem_discovery'
  | 'stage_9_meeting_booked'
  | 'stage_10_pipeline_converted'

export interface LinkedInStageInfo {
  stage_number: number;
  id: LinkedInBdStage;
  name: string;
  short_label: string;
  description: string;
  recommended_action: string;
  crm_status_text: string;
}


export interface TimelineActivity {
  id: string
  date: string
  activity_type: 'profile_visit' | 'connection_sent' | 'connection_accepted' | 'commented_post' | 'followed' | 'dm_sent' | 'dm_planned' | 'profile_viewed_me'
  description: string
  status: ActivityStatus
  notes?: string
  created_at?: string
}

export interface LinkedInProspect {
  id: string
  name: string
  title: string
  company: string
  location: string
  degree: string
  connections: string
  profile_url: string
  connection_status: ConnectionStatus
  message_status: MessageStatus
  priority: string
  lead_type: string
  mutual_connection?: string
  industry?: string
  screenshot_date: string
  notes: string
  activities: TimelineActivity[]
  in_pipeline?: boolean
  bd_stage?: LinkedInBdStage
  tier?: 'Tier 1' | 'Tier 2' | 'Tier 3'
  tadbeer_angle?: string
  created_at?: string
  updated_at?: string
}

export interface LinkedInDailyLog {
  id: string
  date: string
  channel: string
  summary: string
  tasks_completed: {
    prospect_engagement: boolean
    profile_visits: boolean
    meaningful_comments: boolean
    targeted_connection_requests: boolean
    profile_viewer_followups: boolean
    new_connection_followups: boolean
    published_tadbeer_erp_article: boolean
  }
  published_article: {
    title: string
    url?: string
    published_at: string
  }
  metrics: {
    profile_visits_count: number
    comments_count: number
    connection_requests_count: number
    dms_sent_count: number
    dms_planned_count: number
    connections_made_count: number
    main_connections_sent: number
    messages_done: number
    connection_accepted_jad: number
  }
  notes?: string
  created_at?: string
}

// ── Default 23 July 2026 Prospects Data ──────────────────────────────────────
const DEFAULT_23_JULY_PROSPECTS: Omit<LinkedInProspect, 'id' | 'created_at' | 'updated_at'>[] = [
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
    name: 'Syed Ali',
    title: 'Senior Portfolio Manager',
    company: 'The VP Realty',
    location: 'Oman',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/syed-ali-vprealty',
    connection_status: 'pending',
    message_status: 'none',
    priority: 'Medium',
    lead_type: '',
    industry: 'Real Estate Portfolio Management',
    screenshot_date: '2026-07-23',
    notes: 'Profile visited and connection request sent today.',
    activities: [
      { id: 'act-syed-1', date: '2026-07-23', activity_type: 'profile_visit', description: 'Visited LinkedIn profile', status: 'confirmed' },
      { id: 'act-syed-2', date: '2026-07-23', activity_type: 'connection_sent', description: 'Connection request sent', status: 'confirmed' },
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
    name: 'Walid Merabbi',
    title: 'Co-Founder @ PROPUP Property Management | #entrepreneurship',
    company: 'PROPUP Property Management',
    location: 'Dubai, UAE',
    degree: '1st',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/walid-merabbi/',
    connection_status: 'connected',
    message_status: 'sent',
    bd_stage: 'stage_5_welcome_convo',
    tier: 'Tier 2',
    priority: 'Medium',
    lead_type: 'PropTech / Property Management',
    industry: 'Property Management',
    screenshot_date: '2026-07-23',
    tadbeer_angle: 'Came across PROPUP in property management space. Operational & proptech automation angle.',
    notes: 'Sent Welcome DM at 10:14 AM today: "Assalamualaikum Mr. Walid, great to connect! I came across PROPUP recently and found what you’re building in the property management space interesting. Looking forward to staying connected and following the journey."',
    activities: [
      { id: 'act-wal-1', date: '2026-07-23', activity_type: 'profile_visit', description: 'Visited LinkedIn profile', status: 'confirmed' },
      { id: 'act-wal-2', date: '2026-07-23', activity_type: 'connection_accepted', description: 'Connection accepted (1st degree)', status: 'confirmed' },
      { id: 'act-wal-3', date: '2026-07-23', activity_type: 'dm_sent', description: 'Sent Welcome DM at 10:14 AM: "Assalamualaikum Mr. Walid, great to connect!..."', status: 'confirmed' },
    ],
  },
  {
    name: 'Haitham Al Rawahi',
    title: 'General Manager @ GWC Oman Driving Logistics Growth & Empowering Oman’s Vision 2040',
    company: 'GWC Oman',
    location: 'Muscat, Oman',
    degree: '1st',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/haitham-al-rawahi/',
    connection_status: 'connected',
    message_status: 'sent',
    bd_stage: 'stage_5_welcome_convo',
    tier: 'Tier 1',
    priority: 'Strategic / Tier 1',
    lead_type: 'Strategic Relationship',
    industry: 'Logistics & Supply Chain',
    screenshot_date: '2026-07-23',
    tadbeer_angle: 'Following GWC growth in Oman logistics sector. Operational scaling & warehouse ERP automation.',
    notes: 'Sent Welcome DM at 9:42 AM today: "Assalamualaikum Mr. Haitham, great to connect! I’ve been following what GWC is building in Oman and the growth happening across the logistics sector. Looking forward to staying connected and following the journey."',
    activities: [
      { id: 'act-hai-1', date: '2026-07-23', activity_type: 'profile_visit', description: 'Visited LinkedIn profile', status: 'confirmed' },
      { id: 'act-hai-2', date: '2026-07-23', activity_type: 'connection_accepted', description: 'Connection accepted (1st degree)', status: 'confirmed' },
      { id: 'act-hai-3', date: '2026-07-23', activity_type: 'dm_sent', description: 'Sent Welcome DM at 9:42 AM: "Assalamualaikum Mr. Haitham, great to connect!..."', status: 'confirmed' },
    ],
  },

  {
    name: 'Firas Al Msaddi',
    title: 'Founder & CEO',
    company: 'fäm Properties',
    location: 'Dubai, UAE',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/firas-al-msaddi',
    connection_status: 'following',
    message_status: 'none',
    priority: 'Strategic',
    lead_type: '',
    industry: 'Real Estate & PropTech',
    screenshot_date: '2026-07-23',
    notes: 'Visited profile, commented on posts, followed.',
    activities: [
      { id: 'act-fir-1', date: '2026-07-23', activity_type: 'profile_visit', description: 'Visited LinkedIn profile', status: 'confirmed' },
      { id: 'act-fir-2', date: '2026-07-23', activity_type: 'commented_post', description: 'Commented on posts', status: 'confirmed' },
      { id: 'act-fir-3', date: '2026-07-23', activity_type: 'followed', description: 'Followed profile on LinkedIn', status: 'confirmed' },
    ],
  },
  {
    name: 'Safaa Almandhry',
    title: 'Marketing Director',
    company: 'Al Walaa Real Estate',
    location: 'Oman',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/safaa-almandhry',
    connection_status: 'pending',
    message_status: 'none',
    priority: 'Medium',
    lead_type: '',
    industry: 'Real Estate Marketing',
    screenshot_date: '2026-07-23',
    notes: 'Visited profile and sent connection request.',
    activities: [
      { id: 'act-saf-1', date: '2026-07-23', activity_type: 'profile_visit', description: 'Visited LinkedIn profile', status: 'confirmed' },
      { id: 'act-saf-2', date: '2026-07-23', activity_type: 'connection_sent', description: 'Connection request sent', status: 'confirmed' },
    ],
  },
  {
    name: 'Nasser Al Sheibani',
    title: 'CEO',
    company: 'Al Mouj Muscat',
    location: 'Oman',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/nasser-al-sheibani',
    connection_status: 'pending',
    message_status: 'none',
    priority: 'Strategic / Tier 1',
    lead_type: '',
    industry: 'Real Estate & Hospitality',
    screenshot_date: '2026-07-23',
    notes: 'Visited profile. Connection request already pending.',
    activities: [
      { id: 'act-nas-1', date: '2026-07-23', activity_type: 'profile_visit', description: 'Visited LinkedIn profile', status: 'confirmed' },
      { id: 'act-nas-2', date: '2026-07-23', activity_type: 'connection_sent', description: 'Verified connection request already pending', status: 'confirmed' },
    ],
  },
  {
    name: 'Mohammed Al Rawahi',
    title: 'CEO',
    company: 'Nour Ibri IPP',
    location: 'Oman',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/mohammed-al-rawahi',
    connection_status: 'pending',
    message_status: 'none',
    priority: 'Strategic / Tier 1',
    lead_type: '',
    industry: 'Energy & Power Generation',
    screenshot_date: '2026-07-23',
    notes: 'Visited profile and sent connection request.',
    activities: [
      { id: 'act-mraw-1', date: '2026-07-23', activity_type: 'profile_visit', description: 'Visited LinkedIn profile', status: 'confirmed' },
      { id: 'act-mraw-2', date: '2026-07-23', activity_type: 'connection_sent', description: 'Connection request sent', status: 'confirmed' },
    ],
  },
  {
    name: 'Iyad Mousa',
    title: 'Founder',
    company: 'Miftah PropTech',
    location: 'UAE',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/iyad-mousa',
    connection_status: 'pending',
    message_status: 'none',
    priority: 'High',
    lead_type: '',
    industry: 'PropTech',
    screenshot_date: '2026-07-23',
    notes: 'Visited profile, commented on post, sent connection request, followed.',
    activities: [
      { id: 'act-iyad-1', date: '2026-07-23', activity_type: 'profile_visit', description: 'Visited LinkedIn profile', status: 'confirmed' },
      { id: 'act-iyad-2', date: '2026-07-23', activity_type: 'commented_post', description: 'Commented on LinkedIn post', status: 'confirmed' },
      { id: 'act-iyad-3', date: '2026-07-23', activity_type: 'connection_sent', description: 'Connection request sent', status: 'confirmed' },
      { id: 'act-iyad-4', date: '2026-07-23', activity_type: 'followed', description: 'Followed profile on LinkedIn', status: 'confirmed' },
    ],
  },
  {
    name: 'Dr. Saleh Al-Khaldi',
    title: 'CEO',
    company: 'Connect Arabia International',
    location: 'Oman/GCC',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/dr-saleh-al-khaldi',
    connection_status: 'engaged',
    message_status: 'planned',
    priority: 'High / Strategic',
    lead_type: '',
    industry: 'International Business / Telecommunications',
    screenshot_date: '2026-07-23',
    notes: 'Commented on post today. Viewed my LinkedIn profile today. Follow-up DM planned.',
    activities: [
      { id: 'act-saleh-1', date: '2026-07-23', activity_type: 'commented_post', description: 'Commented on his LinkedIn post', status: 'confirmed' },
      { id: 'act-saleh-2', date: '2026-07-23', activity_type: 'profile_viewed_me', description: 'Viewed my LinkedIn profile today', status: 'confirmed' },
      { id: 'act-saleh-3', date: '2026-07-23', activity_type: 'dm_planned', description: 'Follow-up DM planned (Awaiting execution)', status: 'planned' },
    ],
  },
  {
    name: 'Balqees Al-Kindy',
    title: 'Co-Founder & COO',
    company: 'O Homes',
    location: 'Oman',
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/balqees-al-kindy',
    connection_status: 'profile_viewer',
    message_status: 'planned',
    priority: 'High',
    lead_type: '',
    industry: 'Real Estate & Interior Architecture',
    screenshot_date: '2026-07-23',
    notes: 'Viewed my LinkedIn profile within the last day. Follow-up DM planned.',
    activities: [
      { id: 'act-balq-1', date: '2026-07-23', activity_type: 'profile_viewed_me', description: 'Viewed my LinkedIn profile within the last day', status: 'confirmed' },
      { id: 'act-balq-2', date: '2026-07-23', activity_type: 'dm_planned', description: 'Follow-up DM planned (Awaiting execution)', status: 'planned' },
    ],
  },
  {
    name: 'Federico Presicci',
    title: 'Founder',
    company: 'Enablement Edge Network',
    location: '', // Explicitly left blank per prompt instruction
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/federicopresicci',
    connection_status: 'profile_viewer',
    message_status: 'planned',
    priority: 'Medium / Networking',
    lead_type: '',
    industry: 'Professional Coaching & Enablement',
    screenshot_date: '2026-07-23',
    notes: 'Viewed my LinkedIn profile within the last day. Follow-up DM planned.',
    activities: [
      { id: 'act-fed-1', date: '2026-07-23', activity_type: 'profile_viewed_me', description: 'Viewed my LinkedIn profile within the last day', status: 'confirmed' },
      { id: 'act-fed-2', date: '2026-07-23', activity_type: 'dm_planned', description: 'Follow-up DM planned (Awaiting execution)', status: 'planned' },
    ],
  },
  {
    name: 'Abde Ali K',
    title: 'Operations Executive',
    company: 'SMB Solutions',
    location: '', // Explicitly left blank per prompt instruction
    degree: '2nd',
    connections: '500+ connections',
    profile_url: 'https://linkedin.com/in/abde-ali-k',
    connection_status: 'profile_viewer',
    message_status: 'planned',
    priority: 'Medium',
    lead_type: '',
    industry: 'IT & Business Operations',
    screenshot_date: '2026-07-23',
    notes: 'Viewed my LinkedIn profile within the last day. Follow-up DM planned.',
    activities: [
      { id: 'act-abde-1', date: '2026-07-23', activity_type: 'profile_viewed_me', description: 'Viewed my LinkedIn profile within the last day', status: 'confirmed' },
      { id: 'act-abde-2', date: '2026-07-23', activity_type: 'dm_planned', description: 'Follow-up DM planned (Awaiting execution)', status: 'planned' },
    ],
  },
]

// ── Default 23 July 2026 Daily Log ──────────────────────────────────────────
const DEFAULT_23_JULY_DAILY_LOG: LinkedInDailyLog = {
  id: 'log-2026-07-23',
  date: '2026-07-23',
  channel: 'LinkedIn',
  summary: 'Completed comprehensive daily LinkedIn engagement sprint across Oman & UAE real estate, property management, & energy leadership targets.',
  tasks_completed: {
    prospect_engagement: true,
    profile_visits: true,
    meaningful_comments: true,
    targeted_connection_requests: true,
    profile_viewer_followups: true,
    new_connection_followups: true,
    published_tadbeer_erp_article: true,
  },
  published_article: {
    title: 'Transforming Real Estate & Property Operations with Tadbeer ERP: GCC Case Study & Compliance Insights',
    url: 'https://linkedin.com/pulse/transforming-real-estate-property-operations-tadbeer-erp-2026',
    published_at: '2026-07-23T08:00:00Z',
  },
  metrics: {
    profile_visits_count: 14,
    comments_count: 6,
    connection_requests_count: 7,
    dms_sent_count: 1,
    dms_planned_count: 4,
    connections_made_count: 1,
    main_connections_sent: 7,
    messages_done: 1,
    connection_accepted_jad: 1,
  },
  notes: 'Executed high-impact outreach. Confirmed Welcome DM sent to Jad Atat (Group CEO, EVCG). Scheduled planned follow-ups for 4 profile viewers (Dr. Saleh Al-Khaldi, Balqees Al-Kindy, Federico Presicci, Abde Ali K).',
}

// Pre-seeded Memory dataset so data is ALWAYS ready instantly
const INITIAL_SEED_DATA: LinkedInProspect[] = [
  ...DEFAULT_23_JULY_PROSPECTS.map((p, i) => ({
    ...p,
    id: `seed-23jul-${i + 1}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })),
  {
    id: 'seed-falah-1',
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
    id: 'seed-badar-1',
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

let inMemoryProspects: LinkedInProspect[] = INITIAL_SEED_DATA;
let inMemoryDailyLogs: LinkedInDailyLog[] = [DEFAULT_23_JULY_DAILY_LOG];

// ── Fetch all LinkedIn prospects ─────────────────────────────────────────────
export async function getLinkedInProspects(): Promise<{ data: LinkedInProspect[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('linkedin_prospects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase linkedin_prospects error:', error.message);
      return { data: inMemoryProspects, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const formatted: LinkedInProspect[] = data.map(p => ({
      ...p,
      activities: Array.isArray(p.activities) ? p.activities : (typeof p.activities === 'string' ? JSON.parse(p.activities) : []),
      location: p.location || '',
      priority: p.priority || 'Medium',
      lead_type: p.lead_type || '',
    }));

    inMemoryProspects = formatted;
    return { data: formatted, error: null };
  } catch (err: unknown) {
    console.error('getLinkedInProspects catch error:', err);
    return { data: inMemoryProspects, error: err instanceof Error ? err.message : String(err) };
  }
}


// ── Create or Update (Deduplicate) LinkedIn prospect ─────────────────────────
export async function createOrUpdateLinkedInProspect(prospect: Partial<LinkedInProspect>): Promise<{ data: LinkedInProspect | null; error: string | null }> {
  try {
    const { data: allProspects } = await getLinkedInProspects()
    const existingList = allProspects || inMemoryProspects

    // Check duplicate by name (case-insensitive) or company + name
    const existing = existingList.find(p => p.name.trim().toLowerCase() === (prospect.name || '').trim().toLowerCase())

    if (existing) {
      // Update activity timeline
      const existingActivities = existing.activities || []
      const newActivities = prospect.activities || []
      
      // Combine activities deduplicating by ID or description+date
      const combinedActivities = [...existingActivities]
      newActivities.forEach(act => {
        if (!combinedActivities.some(a => a.id === act.id || (a.date === act.date && a.description === act.description))) {
          combinedActivities.push(act)
        }
      })

      const updatedPayload: LinkedInProspect = {
        ...existing,
        title: prospect.title || existing.title,
        company: prospect.company || existing.company,
        location: prospect.location !== undefined ? prospect.location : existing.location,
        connection_status: prospect.connection_status || existing.connection_status,
        message_status: prospect.message_status || existing.message_status,
        priority: prospect.priority || existing.priority,
        lead_type: prospect.lead_type || existing.lead_type,
        notes: prospect.notes ? `${existing.notes}\n${prospect.notes}` : existing.notes,
        activities: combinedActivities,
        updated_at: new Date().toISOString(),
      }

      // Try Supabase update
      const { data, error } = await supabase
        .from('linkedin_prospects')
        .update(updatedPayload)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        // Fallback in-memory update
        inMemoryProspects = inMemoryProspects.map(p => p.id === existing.id ? updatedPayload : p)
        return { data: updatedPayload, error: null }
      }

      return { data: { ...data, activities: combinedActivities }, error: null }
    } else {
      // Insert new contact
      const newId = 'prospect-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)
      const newProspect: LinkedInProspect = {
        id: newId,
        name: prospect.name || 'Unnamed Contact',
        title: prospect.title || '',
        company: prospect.company || '',
        location: prospect.location || '',
        degree: prospect.degree || '2nd',
        connections: prospect.connections || '500+ connections',
        profile_url: prospect.profile_url || '',
        connection_status: prospect.connection_status || 'to_connect',
        message_status: prospect.message_status || 'none',
        priority: prospect.priority || 'Medium',
        lead_type: prospect.lead_type || '',
        mutual_connection: prospect.mutual_connection || '',
        industry: prospect.industry || 'Real Estate / Business',
        screenshot_date: prospect.screenshot_date || '2026-07-23',
        notes: prospect.notes || '',
        activities: prospect.activities || [],
        in_pipeline: prospect.in_pipeline || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('linkedin_prospects')
        .insert(newProspect)
        .select()
        .single()

      if (error) {
        inMemoryProspects = [newProspect, ...inMemoryProspects]
        return { data: newProspect, error: null }
      }

      return { data, error: null }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { data: null, error: msg }
  }
}

// ── Add Timeline Activity ───────────────────────────────────────────────────
export async function addTimelineActivity(prospectId: string, activity: Omit<TimelineActivity, 'id'>): Promise<{ error: string | null }> {
  try {
    const { data: prospects } = await getLinkedInProspects()
    const target = prospects?.find(p => p.id === prospectId)
    if (!target) return { error: 'Prospect not found' }

    const newActivity: TimelineActivity = {
      ...activity,
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    }

    const updatedActivities = [newActivity, ...(target.activities || [])]

    const { error } = await supabase
      .from('linkedin_prospects')
      .update({ activities: updatedActivities, updated_at: new Date().toISOString() })
      .eq('id', prospectId)

    if (error) {
      inMemoryProspects = inMemoryProspects.map(p => p.id === prospectId ? { ...p, activities: updatedActivities } : p)
    }

    return { error: null }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

// ── Update Connection Status ─────────────────────────────────────────────────
export async function updateConnectionStatus(id: string, connection_status: ConnectionStatus) {
  const { error } = await supabase
    .from('linkedin_prospects')
    .update({ connection_status, updated_at: new Date().toISOString() })
    .eq('id', id)

  inMemoryProspects = inMemoryProspects.map(p => p.id === id ? { ...p, connection_status } : p)
  return { error: error ? error.message : null }
}

// ── Update Message Status ────────────────────────────────────────────────────
export async function updateMessageStatus(id: string, message_status: MessageStatus) {
  const { error } = await supabase
    .from('linkedin_prospects')
    .update({ message_status, updated_at: new Date().toISOString() })
    .eq('id', id)

  inMemoryProspects = inMemoryProspects.map(p => p.id === id ? { ...p, message_status } : p)
  return { error: error ? error.message : null }
}

// ── Update Prospect Priority ─────────────────────────────────────────────────
export async function updateProspectPriority(id: string, priority: string) {
  const { error } = await supabase
    .from('linkedin_prospects')
    .update({ priority, updated_at: new Date().toISOString() })
    .eq('id', id)

  inMemoryProspects = inMemoryProspects.map(p => p.id === id ? { ...p, priority } : p)
  return { error: error ? error.message : null }
}

// ── Update Notes ─────────────────────────────────────────────────────────────
export async function updateProspectNotes(id: string, notes: string) {
  const { error } = await supabase
    .from('linkedin_prospects')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', id)

  inMemoryProspects = inMemoryProspects.map(p => p.id === id ? { ...p, notes } : p)
  return { error: error ? error.message : null }
}

// ── Delete Prospect ──────────────────────────────────────────────────────────
export async function deleteLinkedInProspect(id: string) {
  const { error } = await supabase
    .from('linkedin_prospects')
    .delete()
    .eq('id', id)

  inMemoryProspects = inMemoryProspects.filter(p => p.id !== id)
  return { error: error ? error.message : null }
}

// ── Seed Initial Prospects ────────────────────────────────────────────────────
export async function seedLinkedInProspects() {
  const now = new Date().toISOString()
  
  // Combine 23 July entries with previous seed entries (deduplicating Walid Merabbi)
  const initialSeeds: Omit<LinkedInProspect, 'id' | 'created_at' | 'updated_at'>[] = [
    ...DEFAULT_23_JULY_PROSPECTS,
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
  ]

  // Convert to full prospects with IDs
  const fullProspects: LinkedInProspect[] = initialSeeds.map((s, index) => ({
    ...s,
    id: `seed-prospect-${index + 1}`,
    created_at: now,
    updated_at: now,
  }))

  inMemoryProspects = fullProspects

  // Attempt insert into Supabase if table exists
  const { data, error } = await supabase
    .from('linkedin_prospects')
    .insert(fullProspects)
    .select()

  if (error) {
    return { seeded: true, count: fullProspects.length, storage: 'memory' }
  }
  return { seeded: true, count: data.length, storage: 'supabase' }
}

// ── Fetch Daily Logs ─────────────────────────────────────────────────────────
export async function getLinkedInDailyLogs(): Promise<{ data: LinkedInDailyLog[] | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('linkedin_daily_logs')
      .select('*')
      .order('log_date', { ascending: false })

    if (error || !data || data.length === 0) {
      return { data: inMemoryDailyLogs, error: null }
    }

    const formatted: LinkedInDailyLog[] = data.map(d => ({
      id: d.id,
      date: d.log_date || d.date,
      channel: d.channel || 'LinkedIn',
      summary: d.summary || '',
      tasks_completed: typeof d.tasks_completed === 'string' ? JSON.parse(d.tasks_completed) : (d.tasks_completed || {}),
      published_article: typeof d.published_article === 'string' ? JSON.parse(d.published_article) : (d.published_article || {}),
      metrics: typeof d.metrics === 'string' ? JSON.parse(d.metrics) : (d.metrics || {}),
      notes: d.notes || '',
      created_at: d.created_at,
    }))

    inMemoryDailyLogs = formatted
    return { data: formatted, error: null }
  } catch (err: unknown) {
    return { data: inMemoryDailyLogs, error: null }
  }
}

// ── Create or Update Daily Log ───────────────────────────────────────────────
export async function createOrUpdateDailyLog(log: LinkedInDailyLog): Promise<{ data: LinkedInDailyLog | null; error: string | null }> {
  try {
    inMemoryDailyLogs = [log, ...inMemoryDailyLogs.filter(l => l.date !== log.date)]
    const payload = {
      log_date: log.date,
      channel: log.channel,
      summary: log.summary,
      tasks_completed: log.tasks_completed,
      published_article: log.published_article,
      metrics: log.metrics,
      notes: log.notes,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('linkedin_daily_logs')
      .upsert(payload, { onConflict: 'log_date' })
      .select()
      .single()

    if (error) return { data: log, error: null }
    return { data: log, error: null }
  } catch (err: unknown) {
    return { data: log, error: null }
  }
}

// ── Convert to Pipeline ───────────────────────────────────────────────────────
export async function convertProspectToPipeline(prospectId: string) {
  try {
    await requireAuth()
    const { data: prospect, error: fetchError } = await supabase
      .from('linkedin_prospects')
      .select('*')
      .eq('id', prospectId)
      .single()

    if (fetchError || !prospect) {
      // Check in memory if Supabase fails (for local testing)
      const memProspect = inMemoryProspects.find(p => p.id === prospectId)
      if (!memProspect) return { error: 'Prospect not found' }
      memProspect.in_pipeline = true
      return { error: null }
    }

    // Call companies table insert
    const companyData = {
      company_name: prospect.company || 'Unknown Company',
      industry: prospect.industry || '',
      notes: `Imported from LinkedIn CRM.\n${prospect.notes || ''}`,
      status: 'prospect',
      lead_source: 'LinkedIn',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert(companyData)
      .select()
      .single()

    if (companyError) return { error: companyError.message }

    // Create contact
    if (prospect.name) {
      await supabase.from('contacts').insert({
        company_id: company.id,
        full_name: prospect.name,
        title: prospect.title || '',
        linkedin_url: prospect.profile_url || '',
        is_primary: true,
        created_at: new Date().toISOString()
      })
    }

    // Update prospect
    const { error: updateError } = await supabase
      .from('linkedin_prospects')
      .update({ in_pipeline: true, updated_at: new Date().toISOString() })
      .eq('id', prospectId)

    if (updateError) return { error: updateError.message }
    
    // Update memory
    inMemoryProspects = inMemoryProspects.map(p => p.id === prospectId ? { ...p, in_pipeline: true } : p)
    
    return { error: null }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

export async function updateProspectBdStage(prospectId: string, stage: LinkedInBdStage) {
  try {
    inMemoryProspects = inMemoryProspects.map(p => p.id === prospectId ? { ...p, bd_stage: stage } : p);
    const { error } = await supabase.from('linkedin_prospects').update({ bd_stage: stage, updated_at: new Date().toISOString() }).eq('id', prospectId);
    return { error: error ? error.message : null };
  } catch (err: unknown) {
    return { error: null };
  }
}

export async function updateProspectTier(prospectId: string, tier: 'Tier 1' | 'Tier 2' | 'Tier 3') {
  try {
    inMemoryProspects = inMemoryProspects.map(p => p.id === prospectId ? { ...p, tier } : p);
    const { error } = await supabase.from('linkedin_prospects').update({ tier, updated_at: new Date().toISOString() }).eq('id', prospectId);
    return { error: error ? error.message : null };
  } catch (err: unknown) {
    return { error: null };
  }
}

export async function updateTadbeerAngle(prospectId: string, angle: string) {
  try {
    inMemoryProspects = inMemoryProspects.map(p => p.id === prospectId ? { ...p, tadbeer_angle: angle } : p);
    const { error } = await supabase.from('linkedin_prospects').update({ tadbeer_angle: angle, updated_at: new Date().toISOString() }).eq('id', prospectId);
    return { error: error ? error.message : null };
  } catch (err: unknown) {
    return { error: null };
  }
}


// ── Sync Main CRM Contacts to LinkedIn Prospects ─────────────────────────────
export async function syncCRMContactsToLinkedIn() {
  try {
    // 1. Fetch contacts with LinkedIn URLs from main CRM
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, full_name, title, linkedin_url, companies(company_name, industry)')
      .not('linkedin_url', 'is', null)
      .not('linkedin_url', 'eq', '')

    if (contactsError || !contacts || contacts.length === 0) return

    // 2. Fetch existing LinkedIn prospects
    const { data: prospects, error: prospectsError } = await supabase
      .from('linkedin_prospects')
      .select('id, profile_url, name')
    
    // If table doesn't exist, we skip DB sync but can still do memory sync if needed
    const existingList = prospectsError ? inMemoryProspects : prospects

    const newProspects: Omit<LinkedInProspect, 'id'>[] = []
    
    for (const contact of contacts) {
      const url = contact.linkedin_url || ''
      const name = contact.full_name || ''
      
      const exists = existingList.some(p => 
        (p.profile_url && p.profile_url.toLowerCase() === url.toLowerCase()) || 
        (p.name && p.name.toLowerCase() === name.toLowerCase())
      )

      if (!exists) {
        // Handle joined company object (array or single object)
        const comp = Array.isArray(contact.companies) ? contact.companies[0] : contact.companies
        const companyName = comp ? comp.company_name : ''
        const industry = comp ? comp.industry : ''

        newProspects.push({
          name: name,
          title: contact.title || '',
          company: companyName,
          location: '',
          degree: 'Unknown',
          connections: '',
          profile_url: url,
          connection_status: 'to_connect',
          message_status: 'none',
          priority: 'Medium',
          lead_type: 'Main CRM Contact',
          mutual_connection: '',
          industry: industry || 'Unknown',
          screenshot_date: new Date().toISOString().split('T')[0],
          notes: 'Auto-synced from Main CRM Contacts.',
          activities: [],
          in_pipeline: true, // Already in CRM pipeline
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    if (newProspects.length > 0) {
      if (!prospectsError) {
        await supabase.from('linkedin_prospects').insert(newProspects)
      } else {
        // Fallback to memory if table missing
        const memoryProspects = newProspects.map((p, i) => ({
          ...p,
          id: 'synced-contact-' + Date.now() + '-' + i
        }))
        inMemoryProspects = [...memoryProspects, ...inMemoryProspects]
      }
    }
  } catch (error) {
    console.error('Failed to sync CRM contacts:', error)
  }
}
