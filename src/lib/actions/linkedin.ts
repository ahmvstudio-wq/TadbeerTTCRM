'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type ConnectionStatus = 'connected' | 'pending' | 'to_connect' | 'following'
export type MessageStatus = 'to_send' | 'sent' | 'replied'

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
  mutual_connection?: string
  industry?: string
  screenshot_date: string
  notes: string
  created_at?: string
  updated_at?: string
}

// ── Fetch all LinkedIn prospects ─────────────────────────────────────────────
export async function getLinkedInProspects() {
  const { data, error } = await supabase
    .from('linkedin_prospects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ── Create a new LinkedIn prospect ──────────────────────────────────────────
export async function createLinkedInProspect(prospect: Omit<LinkedInProspect, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('linkedin_prospects')
    .insert({ ...prospect, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

// ── Update connection status ─────────────────────────────────────────────────
export async function updateConnectionStatus(id: string, connection_status: ConnectionStatus) {
  const { error } = await supabase
    .from('linkedin_prospects')
    .update({ connection_status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}

// ── Update message status ────────────────────────────────────────────────────
export async function updateMessageStatus(id: string, message_status: MessageStatus) {
  const { error } = await supabase
    .from('linkedin_prospects')
    .update({ message_status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}

// ── Update notes ─────────────────────────────────────────────────────────────
export async function updateProspectNotes(id: string, notes: string) {
  const { error } = await supabase
    .from('linkedin_prospects')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}

// ── Delete a prospect ────────────────────────────────────────────────────────
export async function deleteLinkedInProspect(id: string) {
  const { error } = await supabase
    .from('linkedin_prospects')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  return { error: null }
}

// ── Seed initial 10 prospects if table is empty ──────────────────────────────
export async function seedLinkedInProspects() {
  const { data: existing } = await supabase
    .from('linkedin_prospects')
    .select('id')
    .limit(1)

  if (existing && existing.length > 0) return { seeded: false, message: 'Already has data' }

  const now = new Date().toISOString()
  const seeds: Omit<LinkedInProspect, 'id' | 'created_at' | 'updated_at'>[] = [
    {
      name: 'Mohammed Al Falahi',
      title: 'Founder & CEO | BINRASHID Real Estate | Property Investment & Management | National Tennis Team Coach',
      company: 'BINRASHID Real Estate',
      location: 'Muscat, Masqat, Oman',
      degree: '1st',
      connections: '123 connections',
      profile_url: 'https://linkedin.com/in/mohammed-al-falahi-0726b0110/',
      connection_status: 'connected',
      message_status: 'to_send',
      industry: 'Real Estate',
      screenshot_date: '2026-07-20',
      notes: 'Already connected. Send outreach message.',
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
      mutual_connection: 'Mohan',
      industry: 'Healthcare / Medical',
      screenshot_date: '2026-07-20',
      notes: 'Not connected yet. Send connection request + follow up with message.',
    },
    {
      name: 'Nada Al-Hajri',
      title: "Country CEO — Oman | ECOBLOX | Deputy CEO Bug bounty",
      company: 'ECOBLOX',
      location: 'Masqat, Oman',
      degree: '2nd',
      connections: '500+ connections',
      profile_url: 'https://linkedin.com/in/nada-al-hajri/',
      connection_status: 'to_connect',
      message_status: 'to_send',
      mutual_connection: 'Ismail',
      industry: 'Technology / Cybersecurity',
      screenshot_date: '2026-07-20',
      notes: 'Not connected. IT professional, 11 years exp. Send connection + message.',
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
      mutual_connection: 'Mohammed',
      industry: 'Chemical Manufacturing',
      screenshot_date: '2026-07-20',
      notes: 'Invitation sent to Amin — awaiting acceptance. Message when connected.',
    },
    {
      name: 'Saeed Al Hosni',
      title: 'Managing Director at Voltech, Oman',
      company: 'VOLTECH LLC (OM)',
      location: 'Al Khaburah, Al Batinah North Governorate, Oman',
      degree: '2nd',
      connections: '500+ connections',
      profile_url: 'https://linkedin.com/in/saeed-al-hosni-12b50b55/',
      connection_status: 'pending',
      message_status: 'to_send',
      mutual_connection: 'Faisal',
      industry: 'Technology / Engineering',
      screenshot_date: '2026-07-20',
      notes: 'Invitation sent to Saeed — 3,865 followers. Message when connected.',
    },
    {
      name: 'Faiz Mohammad Riaz',
      title: 'Group Managing Director | Vice Chairman at Oman Golf Association | Board Member Ghala Golf Club',
      company: 'Mohammed Riaz & Partner LLC',
      location: 'Muscat, Masqat, Oman',
      degree: '2nd',
      connections: '500+ connections',
      profile_url: 'https://linkedin.com/in/faiz-mohammad-riaz/',
      connection_status: 'following',
      message_status: 'to_send',
      mutual_connection: 'Raheem',
      industry: 'Business / Golf / Investment',
      screenshot_date: '2026-07-20',
      notes: 'Following. 5,795 followers. Send direct message.',
    },
    {
      name: 'Shradha Mour',
      title: "We tell brands which visitor is a serious buyer and which isn't | ZipLabs",
      company: 'ZipLabs',
      location: 'Bengaluru, Karnataka, India',
      degree: '3rd',
      connections: '500+ connections',
      profile_url: 'https://linkedin.com/in/shradha-mour/',
      connection_status: 'pending',
      message_status: 'to_send',
      industry: 'SaaS / B2B Sales Intelligence',
      screenshot_date: '2026-07-20',
      notes: 'Invitation sent. Message when connected.',
    },
    {
      name: 'Mohammed Aflah',
      title: 'Deputy GM Oman International Group',
      company: 'Oman International Group',
      location: 'Oman',
      degree: '3rd',
      connections: '500+ connections',
      profile_url: 'https://linkedin.com/in/mohammed-aflah/',
      connection_status: 'following',
      message_status: 'to_send',
      industry: 'Conglomerate / Business Group',
      screenshot_date: '2026-07-20',
      notes: 'Following. 1,140 followers. No recent posts. Send direct message.',
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
      industry: 'Investment / Financial Services',
      screenshot_date: '2026-07-20',
      notes: 'Invitation sent to Badar — COO at major investment group. High priority.',
    },
    {
      name: 'Walid Merabbi',
      title: 'Co-Founder @ PROPUP Property Management | #entrepreneurship',
      company: 'PROPUP Property Management',
      location: 'Dubai, United Arab Emirates',
      degree: '3rd',
      connections: '500+ connections',
      profile_url: 'https://linkedin.com/in/walid-merabbi/',
      connection_status: 'following',
      message_status: 'to_send',
      industry: 'Property Management / Real Estate',
      screenshot_date: '2026-07-20',
      notes: 'Following. 1,204 followers. Send direct message for partnership.',
    },
  ]

  const { data, error } = await supabase
    .from('linkedin_prospects')
    .insert(seeds.map(s => ({ ...s, updated_at: now })))
    .select()

  if (error) return { seeded: false, error: error.message }
  return { seeded: true, count: data.length }
}
