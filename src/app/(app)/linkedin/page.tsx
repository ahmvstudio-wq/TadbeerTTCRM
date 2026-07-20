'use client'

import React, { useState } from 'react'
import {
  UserCheck, Clock, MessageSquare, UserPlus,
  ChevronDown, ChevronRight, Eye, Filter,
  Users, TrendingUp, CheckCircle2, Send, AlertCircle, RefreshCw
} from 'lucide-react'

// Inline LinkedIn logo SVG
function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────
type ConnectionStatus =
  | 'connected'     // 1st connection – only need to message
  | 'pending'       // invitation sent, awaiting acceptance
  | 'to_connect'    // haven't sent invitation yet
  | 'following'     // following but not connected – send message

type MessageStatus = 'to_send' | 'sent' | 'replied'

interface LinkedInProfile {
  id: string
  name: string
  title: string
  company: string
  location: string
  degree: string          // "1st" | "2nd" | "3rd"
  connections: string     // "123 connections" | "500+ connections"
  profileUrl: string
  connectionStatus: ConnectionStatus
  messageStatus: MessageStatus
  mutualConnection?: string
  industry?: string
  screenshotDate: string
  notes: string
}

// ── Parsed profiles from screenshots ──────────────────────────────────────────
const INITIAL_PROFILES: LinkedInProfile[] = [
  {
    id: '1',
    name: 'Mohammed Al Falahi',
    title: 'Founder & CEO | BINRASHID Real Estate | Property Investment & Management | National Tennis Team Coach',
    company: 'BINRASHID Real Estate',
    location: 'Muscat, Masqat, Oman',
    degree: '1st',
    connections: '123 connections',
    profileUrl: 'https://linkedin.com/in/mohammed-al-falahi-0726b0110/',
    connectionStatus: 'connected',
    messageStatus: 'to_send',
    industry: 'Real Estate',
    screenshotDate: '2026-07-20',
    notes: 'Already connected. Send outreach message.',
  },
  {
    id: '2',
    name: 'SUHAIL TM',
    title: 'Managing Director at Medicorp Oman',
    company: 'Medicorp Oman',
    location: 'Masqat, Oman',
    degree: '2nd',
    connections: '500+ connections',
    profileUrl: 'https://linkedin.com/in/suhail-tm-b108071a5/',
    connectionStatus: 'to_connect',
    messageStatus: 'to_send',
    mutualConnection: 'Mohan',
    industry: 'Healthcare / Medical',
    screenshotDate: '2026-07-20',
    notes: 'Not connected yet. Send connection request + follow up with message.',
  },
  {
    id: '3',
    name: 'Nada Al-Hajri',
    title: 'Country CEO — Oman | ECOBLOX | Deputy CEO Bug bounty',
    company: 'ECOBLOX',
    location: 'Masqat, Oman',
    degree: '2nd',
    connections: '500+ connections',
    profileUrl: 'https://linkedin.com/in/nada-al-hajri/',
    connectionStatus: 'to_connect',
    messageStatus: 'to_send',
    mutualConnection: 'Ismail',
    industry: 'Technology / Cybersecurity',
    screenshotDate: '2026-07-20',
    notes: 'Not connected. IT professional, 11 years exp. Send connection + message.',
  },
  {
    id: '4',
    name: 'Amin Jassem Zare',
    title: 'MD at CHEMICAL CHEMICAL MANUFACTURING (YQS GROUP LLC OMAN)',
    company: 'YQS GROUP OMAN',
    location: 'Muscat, Masqat, Oman',
    degree: '2nd',
    connections: '500+ connections',
    profileUrl: 'https://linkedin.com/in/amin-jassem-zare-71027b210/',
    connectionStatus: 'pending',
    messageStatus: 'to_send',
    mutualConnection: 'Mohammed',
    industry: 'Chemical Manufacturing',
    screenshotDate: '2026-07-20',
    notes: 'Invitation sent to Amin — awaiting acceptance. Message when connected.',
  },
  {
    id: '5',
    name: 'Saeed Al Hosni',
    title: 'Managing Director at Voltech, Oman',
    company: 'VOLTECH LLC (OM)',
    location: 'Al Khaburah, Al Batinah North Governorate, Oman',
    degree: '2nd',
    connections: '500+ connections',
    profileUrl: 'https://linkedin.com/in/saeed-al-hosni-12b50b55/',
    connectionStatus: 'pending',
    messageStatus: 'to_send',
    mutualConnection: 'Faisal',
    industry: 'Technology / Engineering',
    screenshotDate: '2026-07-20',
    notes: 'Invitation sent to Saeed — 3,865 followers. Message when connected.',
  },
  {
    id: '6',
    name: 'Faiz Mohammad Riaz',
    title: 'Group Managing Director | Vice Chairman at Oman Golf Association | Board Member Ghala Golf Club | Strategic Partnerships | Mohammed Riaz & Partner LLC',
    company: 'Mohammed Riaz & Partner LLC',
    location: 'Muscat, Masqat, Oman',
    degree: '2nd',
    connections: '500+ connections',
    profileUrl: 'https://linkedin.com/in/faiz-mohammad-riaz/',
    connectionStatus: 'following',
    messageStatus: 'to_send',
    mutualConnection: 'Raheem',
    industry: 'Business / Golf / Investment',
    screenshotDate: '2026-07-20',
    notes: 'Following. 5,795 followers. Send direct message.',
  },
  {
    id: '7',
    name: 'Shradha Mour',
    title: 'We tell brands which visitor is a serious buyer and which isn\'t | ZipLabs',
    company: 'ZipLabs',
    location: 'Bengaluru, Karnataka, India',
    degree: '3rd',
    connections: '500+ connections',
    profileUrl: 'https://linkedin.com/in/shradha-mour/',
    connectionStatus: 'pending',
    messageStatus: 'to_send',
    industry: 'SaaS / B2B Sales Intelligence',
    screenshotDate: '2026-07-20',
    notes: 'Invitation sent (toast: "Invitation sent to Media Solutions"). Message when connected.',
  },
  {
    id: '8',
    name: 'Mohammed Aflah',
    title: 'Deputy GM Oman International Group',
    company: 'Oman International Group',
    location: 'Oman',
    degree: '3rd',
    connections: '500+ connections',
    profileUrl: 'https://linkedin.com/in/mohammed-aflah/',
    connectionStatus: 'following',
    messageStatus: 'to_send',
    industry: 'Conglomerate / Business Group',
    screenshotDate: '2026-07-20',
    notes: 'Following. 1,140 followers. No recent posts. Send direct message.',
  },
  {
    id: '9',
    name: 'Badar Al Shanfari',
    title: 'Chief Operating Officer',
    company: 'Ominvest',
    location: 'Muscat, Masqat, Oman',
    degree: '2nd',
    connections: '500+ connections',
    profileUrl: 'https://linkedin.com/in/badar-al-shanfari/',
    connectionStatus: 'pending',
    messageStatus: 'to_send',
    industry: 'Investment / Financial Services',
    screenshotDate: '2026-07-20',
    notes: 'Invitation sent to Badar — COO at major investment group. High priority.',
  },
  {
    id: '10',
    name: 'Walid Merabbi',
    title: 'Co-Founder @ PROPUP Property Management | #entrepreneurship',
    company: 'PROPUP Property Management',
    location: 'Dubai, United Arab Emirates',
    degree: '3rd',
    connections: '500+ connections',
    profileUrl: 'https://linkedin.com/in/walid-merabbi/',
    connectionStatus: 'following',
    messageStatus: 'to_send',
    industry: 'Property Management / Real Estate',
    screenshotDate: '2026-07-20',
    notes: 'Following. 1,204 followers. Send direct message for partnership.',
  },
]

// ── Status config ──────────────────────────────────────────────────────────────
const CONNECTION_STATUS_CONFIG: Record<ConnectionStatus, { label: string; color: string; bg: string; icon: React.ReactNode; action: string }> = {
  connected:  { label: '1st – Connected',    color: '#16A34A', bg: '#F0FDF4', icon: <UserCheck size={12} />,  action: 'Send Message' },
  pending:    { label: 'Invitation Pending',  color: '#D97706', bg: '#FFFBEB', icon: <Clock size={12} />,      action: 'Awaiting Accept' },
  to_connect: { label: 'Not Connected',       color: '#6B7280', bg: '#F9FAFB', icon: <UserPlus size={12} />,  action: 'Send Invite + Msg' },
  following:  { label: 'Following',           color: '#7C3AED', bg: '#F5F3FF', icon: <Eye size={12} />,       action: 'Send Message' },
}

const MESSAGE_STATUS_CONFIG: Record<MessageStatus, { label: string; color: string; bg: string }> = {
  to_send: { label: 'To Send',  color: '#DC2626', bg: '#FEF2F2' },
  sent:    { label: 'Sent',     color: '#D97706', bg: '#FFFBEB' },
  replied: { label: 'Replied',  color: '#16A34A', bg: '#F0FDF4' },
}

// ── Degree badge ───────────────────────────────────────────────────────────────
function DegreeBadge({ degree }: { degree: string }) {
  const color = degree === '1st' ? '#16A34A' : degree === '2nd' ? '#2563EB' : '#9CA3AF'
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, color, border: `1px solid ${color}`,
      borderRadius: '4px', padding: '1px 5px', letterSpacing: '0.03em',
    }}>
      {degree}
    </span>
  )
}

// ── Profile card ───────────────────────────────────────────────────────────────
function ProfileCard({
  profile,
  onUpdateConnection,
  onUpdateMessage,
}: {
  profile: LinkedInProfile
  onUpdateConnection: (id: string, status: ConnectionStatus) => void
  onUpdateMessage: (id: string, status: MessageStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const cs = CONNECTION_STATUS_CONFIG[profile.connectionStatus]
  const ms = MESSAGE_STATUS_CONFIG[profile.messageStatus]

  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      border: '1px solid #E5E7EB',
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.10)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)')}
    >
      {/* Top strip */}
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #0A66C2, #0891B2)' }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          {/* Avatar placeholder */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #0A66C2, #0891B2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, color: '#fff', fontSize: '16px', fontWeight: 700,
          }}>
            {profile.name.charAt(0)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: '#111827' }}>{profile.name}</span>
              <DegreeBadge degree={profile.degree} />
            </div>
            <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '2px', lineHeight: '1.4' }}>
              {profile.title.length > 80 ? profile.title.slice(0, 80) + '…' : profile.title}
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '3px' }}>
              📍 {profile.location} · {profile.connections}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
            <a
              href={profile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', color: '#0A66C2', fontWeight: 600,
                textDecoration: 'none', padding: '4px 8px',
                border: '1px solid #0A66C2', borderRadius: '6px',
              }}
            >
              <LinkedInIcon size={11} /> View
            </a>
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '2px',
                fontSize: '11px', padding: '2px',
              }}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {expanded ? 'Less' : 'More'}
            </button>
          </div>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Connection status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: cs.bg, color: cs.color,
            border: `1px solid ${cs.color}30`,
            borderRadius: '20px', padding: '4px 10px', fontSize: '11px', fontWeight: 600,
          }}>
            {cs.icon} {cs.label}
          </div>

          {/* Message status */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: ms.bg, color: ms.color,
            border: `1px solid ${ms.color}30`,
            borderRadius: '20px', padding: '4px 10px', fontSize: '11px', fontWeight: 600,
          }}>
            <MessageSquare size={11} /> {ms.label}
          </div>

          {profile.mutualConnection && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: '#F0F9FF', color: '#0369A1',
              borderRadius: '20px', padding: '4px 10px', fontSize: '11px',
            }}>
              <Users size={11} /> via {profile.mutualConnection}
            </div>
          )}

          {profile.industry && (
            <div style={{
              background: '#F5F3FF', color: '#7C3AED',
              borderRadius: '20px', padding: '4px 10px', fontSize: '11px',
            }}>
              {profile.industry}
            </div>
          )}
        </div>

        {/* Expanded section */}
        {expanded && (
          <div style={{ marginTop: '14px', borderTop: '1px solid #F3F4F6', paddingTop: '14px' }}>
            <div style={{
              fontSize: '12px', color: '#6B7280', marginBottom: '12px',
              background: '#F9FAFB', borderRadius: '8px', padding: '10px 12px',
              borderLeft: '3px solid #0A66C2',
            }}>
              📝 {profile.notes}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {/* Update connection */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {(['connected', 'pending', 'to_connect', 'following'] as ConnectionStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => onUpdateConnection(profile.id, s)}
                    style={{
                      fontSize: '11px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
                      background: profile.connectionStatus === s ? '#0A66C2' : '#F3F4F6',
                      color: profile.connectionStatus === s ? '#fff' : '#4B5563',
                      border: 'none', fontWeight: 500, transition: 'all 0.15s',
                    }}
                  >
                    {CONNECTION_STATUS_CONFIG[s].label.split(' – ')[0].split(' ')[0]}
                  </button>
                ))}
              </div>

              <div style={{ width: '1px', background: '#E5E7EB', alignSelf: 'stretch' }} />

              {/* Update message */}
              {(['to_send', 'sent', 'replied'] as MessageStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => onUpdateMessage(profile.id, s)}
                  style={{
                    fontSize: '11px', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
                    background: profile.messageStatus === s
                      ? MESSAGE_STATUS_CONFIG[s].color : '#F3F4F6',
                    color: profile.messageStatus === s ? '#fff' : '#4B5563',
                    border: 'none', fontWeight: 500, transition: 'all 0.15s',
                  }}
                >
                  {MESSAGE_STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function LinkedInPage() {
  const [profiles, setProfiles] = useState<LinkedInProfile[]>(INITIAL_PROFILES)
  const [filterConnection, setFilterConnection] = useState<ConnectionStatus | 'all'>('all')
  const [filterMessage, setFilterMessage] = useState<MessageStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const handleUpdateConnection = (id: string, status: ConnectionStatus) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, connectionStatus: status } : p))
  }

  const handleUpdateMessage = (id: string, status: MessageStatus) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, messageStatus: status } : p))
  }

  const filtered = profiles.filter(p => {
    if (filterConnection !== 'all' && p.connectionStatus !== filterConnection) return false
    if (filterMessage !== 'all' && p.messageStatus !== filterMessage) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.company.toLowerCase().includes(search.toLowerCase()) &&
        !p.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Stats
  const stats = {
    total: profiles.length,
    connected: profiles.filter(p => p.connectionStatus === 'connected').length,
    pending: profiles.filter(p => p.connectionStatus === 'pending').length,
    toConnect: profiles.filter(p => p.connectionStatus === 'to_connect').length,
    following: profiles.filter(p => p.connectionStatus === 'following').length,
    messageSent: profiles.filter(p => p.messageStatus === 'sent').length,
    replied: profiles.filter(p => p.messageStatus === 'replied').length,
    toSend: profiles.filter(p => p.messageStatus === 'to_send').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0A66C2 0%, #0891B2 100%)',
        padding: '28px 32px',
        color: '#fff',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <LinkedInIcon size={28} />
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
              LinkedIn Outreach Tracker
            </h1>
            <span style={{
              background: 'rgba(255,255,255,0.2)', borderRadius: '20px',
              padding: '2px 10px', fontSize: '12px', fontWeight: 600,
            }}>
              July 20, 2026
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.8 }}>
            Track connection requests, pending invites, and message status for all LinkedIn prospects
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Profiles', value: stats.total, icon: <Users size={16} />, color: '#0A66C2', bg: '#EFF6FF' },
            { label: 'Connected', value: stats.connected, icon: <UserCheck size={16} />, color: '#16A34A', bg: '#F0FDF4' },
            { label: 'Pending', value: stats.pending, icon: <Clock size={16} />, color: '#D97706', bg: '#FFFBEB' },
            { label: 'To Connect', value: stats.toConnect, icon: <UserPlus size={16} />, color: '#6B7280', bg: '#F9FAFB' },
            { label: 'Following', value: stats.following, icon: <Eye size={16} />, color: '#7C3AED', bg: '#F5F3FF' },
            { label: 'Msgs Pending', value: stats.toSend, icon: <Send size={16} />, color: '#DC2626', bg: '#FEF2F2' },
            { label: 'Msgs Sent', value: stats.messageSent, icon: <CheckCircle2 size={16} />, color: '#0891B2', bg: '#ECFEFF' },
            { label: 'Replied', value: stats.replied, icon: <TrendingUp size={16} />, color: '#059669', bg: '#ECFDF5' },
          ].map(s => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: '12px',
              padding: '14px 16px', border: `1px solid ${s.color}20`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: s.color, marginBottom: '6px' }}>
                {s.icon}
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{s.label}</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB',
          padding: '14px 16px', marginBottom: '20px',
          display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
        }}>
          <Filter size={14} style={{ color: '#6B7280' }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>Filter:</span>

          <input
            type="text"
            placeholder="Search name, company…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              border: '1px solid #E5E7EB', borderRadius: '8px',
              padding: '6px 12px', fontSize: '12px', outline: 'none',
              minWidth: '180px',
            }}
          />

          <select
            value={filterConnection}
            onChange={e => setFilterConnection(e.target.value as ConnectionStatus | 'all')}
            style={{
              border: '1px solid #E5E7EB', borderRadius: '8px',
              padding: '6px 10px', fontSize: '12px', outline: 'none', background: '#fff',
            }}
          >
            <option value="all">All Connections</option>
            <option value="connected">Connected (1st)</option>
            <option value="pending">Pending</option>
            <option value="to_connect">To Connect</option>
            <option value="following">Following</option>
          </select>

          <select
            value={filterMessage}
            onChange={e => setFilterMessage(e.target.value as MessageStatus | 'all')}
            style={{
              border: '1px solid #E5E7EB', borderRadius: '8px',
              padding: '6px 10px', fontSize: '12px', outline: 'none', background: '#fff',
            }}
          >
            <option value="all">All Messages</option>
            <option value="to_send">Message to Send</option>
            <option value="sent">Message Sent</option>
            <option value="replied">Replied</option>
          </select>

          {(filterConnection !== 'all' || filterMessage !== 'all' || search) && (
            <button
              onClick={() => { setFilterConnection('all'); setFilterMessage('all'); setSearch('') }}
              style={{
                background: '#F3F4F6', border: 'none', borderRadius: '8px',
                padding: '6px 10px', fontSize: '11px', color: '#6B7280',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <RefreshCw size={11} /> Reset
            </button>
          )}

          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9CA3AF' }}>
            Showing {filtered.length} of {profiles.length}
          </span>
        </div>

        {/* Priority banner */}
        {stats.toConnect > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #FEF3C7, #FFF7ED)',
            border: '1px solid #FCD34D',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <AlertCircle size={16} style={{ color: '#D97706', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', color: '#92400E' }}>
              <strong>{stats.toConnect} profile(s)</strong> haven't been sent a connection request yet — send invites today!
              {stats.pending > 0 && <> · <strong>{stats.pending} pending</strong> — follow up with a message once they accept.</>}
            </span>
          </div>
        )}

        {/* Profiles grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: '14px' }}>
          {filtered.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onUpdateConnection={handleUpdateConnection}
              onUpdateMessage={handleUpdateMessage}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
            <LinkedInIcon size={48} />
            <p style={{ fontSize: '15px', fontWeight: 600 }}>No profiles match your filters</p>
            <p style={{ fontSize: '13px' }}>Try adjusting your search or filters</p>
          </div>
        )}

        {/* Footer date group */}
        <div style={{
          marginTop: '24px', background: '#fff', borderRadius: '12px',
          border: '1px solid #E5E7EB', padding: '16px 18px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LinkedInIcon size={14} />
            Outreach Session: July 20, 2026
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '12px', color: '#6B7280' }}>
            <span>📨 <strong>{stats.pending}</strong> invitations pending</span>
            <span>✉️ <strong>{stats.toSend}</strong> messages to send</span>
            <span>🤝 <strong>{stats.connected}</strong> direct connections</span>
            <span>👁️ <strong>{stats.following}</strong> following (not connected)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
