'use client'

import React, { useState, useEffect, useTransition, useCallback } from 'react'
import {
  UserCheck, Clock, MessageSquare, UserPlus,
  ChevronDown, ChevronRight, Eye, Filter,
  Users, TrendingUp, CheckCircle2, Send, AlertCircle, RefreshCw,
  Plus, Trash2, Loader2, Save, X
} from 'lucide-react'
import {
  getLinkedInProspects,
  updateConnectionStatus,
  updateMessageStatus,
  updateProspectNotes,
  createLinkedInProspect,
  deleteLinkedInProspect,
  seedLinkedInProspects,
  type LinkedInProspect,
  type ConnectionStatus,
  type MessageStatus,
} from '@/lib/actions/linkedin'

// ── Inline LinkedIn logo SVG ───────────────────────────────────────────────
function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

// ── Status config ────────────────────────────────────────────────────────────
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

// ── Add Prospect Modal ────────────────────────────────────────────────────────
function AddProspectModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '', title: '', company: '', location: '', degree: '2nd',
    connections: '500+ connections', profile_url: '', connection_status: 'to_connect' as ConnectionStatus,
    message_status: 'to_send' as MessageStatus, mutual_connection: '',
    industry: '', screenshot_date: new Date().toISOString().split('T')[0], notes: '',
  })

  const handleSubmit = () => {
    startTransition(async () => {
      const { error } = await createLinkedInProspect(form)
      if (!error) { onSaved(); onClose() }
      else alert('Failed to save: ' + error)
    })
  }

  const inp: React.CSSProperties = {
    width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px',
    padding: '8px 12px', fontSize: '13px', outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '28px',
        width: '560px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Add LinkedIn Prospect</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} style={{ color: '#6B7280' }} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { label: 'Full Name *', key: 'name' },
            { label: 'Title / Role', key: 'title' },
            { label: 'Company', key: 'company' },
            { label: 'Location', key: 'location' },
            { label: 'Industry', key: 'industry' },
            { label: 'LinkedIn URL', key: 'profile_url' },
            { label: 'Mutual Connection', key: 'mutual_connection' },
            { label: 'Screenshot Date', key: 'screenshot_date', type: 'date' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>{label}</label>
              <input
                type={type || 'text'}
                style={inp}
                value={(form as any)[key]}
                onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              />
            </div>
          ))}

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Degree</label>
            <select style={inp} value={form.degree} onChange={e => setForm(p => ({ ...p, degree: e.target.value }))}>
              <option>1st</option><option>2nd</option><option>3rd</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Connection Status</label>
            <select style={inp} value={form.connection_status} onChange={e => setForm(p => ({ ...p, connection_status: e.target.value as ConnectionStatus }))}>
              <option value="to_connect">Not Connected</option>
              <option value="connected">Connected (1st)</option>
              <option value="pending">Pending</option>
              <option value="following">Following</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '12px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', display: 'block', marginBottom: '4px' }}>Notes</label>
          <textarea
            style={{ ...inp, minHeight: '80px', resize: 'vertical' }}
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '9px 18px', borderRadius: '8px', border: '1px solid #E5E7EB',
            background: '#F9FAFB', fontSize: '13px', cursor: 'pointer', fontWeight: 500,
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={pending || !form.name} style={{
            padding: '9px 18px', borderRadius: '8px', border: 'none',
            background: '#0A66C2', color: '#fff', fontSize: '13px', cursor: 'pointer',
            fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
            opacity: pending || !form.name ? 0.6 : 1,
          }}>
            {pending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
            Save Prospect
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Profile card ─────────────────────────────────────────────────────────────
function ProfileCard({
  profile,
  onUpdateConnection,
  onUpdateMessage,
  onDelete,
}: {
  profile: LinkedInProspect
  onUpdateConnection: (id: string, status: ConnectionStatus) => void
  onUpdateMessage: (id: string, status: MessageStatus) => void
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [savingConn, setSavingConn] = useState(false)
  const [savingMsg, setSavingMsg] = useState(false)
  const [localNotes, setLocalNotes] = useState(profile.notes)
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesChanged, setNotesChanged] = useState(false)

  const cs = CONNECTION_STATUS_CONFIG[profile.connection_status]
  const ms = MESSAGE_STATUS_CONFIG[profile.message_status]

  const handleConnChange = async (status: ConnectionStatus) => {
    setSavingConn(true)
    await onUpdateConnection(profile.id, status)
    setSavingConn(false)
  }

  const handleMsgChange = async (status: MessageStatus) => {
    setSavingMsg(true)
    await onUpdateMessage(profile.id, status)
    setSavingMsg(false)
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    const { error } = await updateProspectNotes(profile.id, localNotes)
    if (!error) setNotesChanged(false)
    setSavingNotes(false)
  }

  return (
    <div style={{
      background: '#fff', borderRadius: '14px', border: '1px solid #E5E7EB',
      overflow: 'hidden', transition: 'box-shadow 0.2s',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {/* Avatar */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, #0A66C2, #1a8fe3)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '16px', fontWeight: 700,
          }}>
            {profile.name.charAt(0)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{profile.name}</span>
              <DegreeBadge degree={profile.degree || '2nd'} />
            </div>
            <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.4, marginBottom: '3px' }}>
              {profile.title}
            </div>
            <div style={{ fontSize: '11px', color: '#6B7280' }}>
              {profile.company} · {profile.location}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {profile.profile_url && (
              <a
                href={profile.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: '#0A66C2', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none',
                }}
                title="Open LinkedIn Profile"
              >
                <LinkedInIcon size={14} />
              </a>
            )}
            <button
              onClick={() => onDelete(profile.id)}
              style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: '#FEF2F2', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="Delete Prospect"
            >
              <Trash2 size={13} style={{ color: '#DC2626' }} />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: '#F3F4F6', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
        </div>

        {/* Status row */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          {/* Connection status dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={profile.connection_status}
              onChange={e => handleConnChange(e.target.value as ConnectionStatus)}
              disabled={savingConn}
              style={{
                fontSize: '11px', fontWeight: 600, color: cs.color,
                background: cs.bg, border: `1px solid ${cs.color}40`,
                borderRadius: '20px', padding: '3px 8px', cursor: 'pointer',
                outline: 'none', appearance: 'none', paddingRight: '22px',
              }}
            >
              <option value="to_connect">Not Connected</option>
              <option value="pending">Invitation Pending</option>
              <option value="connected">Connected (1st)</option>
              <option value="following">Following</option>
            </select>
            {savingConn
              ? <Loader2 size={10} style={{ position: 'absolute', right: '6px', top: '6px', color: cs.color, animation: 'spin 1s linear infinite' }} />
              : <ChevronDown size={10} style={{ position: 'absolute', right: '6px', top: '6px', color: cs.color, pointerEvents: 'none' }} />
            }
          </div>

          {/* Message status dropdown */}
          <div style={{ position: 'relative' }}>
            <select
              value={profile.message_status}
              onChange={e => handleMsgChange(e.target.value as MessageStatus)}
              disabled={savingMsg}
              style={{
                fontSize: '11px', fontWeight: 600, color: ms.color,
                background: ms.bg, border: `1px solid ${ms.color}40`,
                borderRadius: '20px', padding: '3px 8px', cursor: 'pointer',
                outline: 'none', appearance: 'none', paddingRight: '22px',
              }}
            >
              <option value="to_send">Msg: To Send</option>
              <option value="sent">Msg: Sent</option>
              <option value="replied">Msg: Replied</option>
            </select>
            {savingMsg
              ? <Loader2 size={10} style={{ position: 'absolute', right: '6px', top: '6px', color: ms.color, animation: 'spin 1s linear infinite' }} />
              : <ChevronDown size={10} style={{ position: 'absolute', right: '6px', top: '6px', color: ms.color, pointerEvents: 'none' }} />
            }
          </div>

          {profile.industry && (
            <span style={{
              fontSize: '11px', color: '#6B7280', background: '#F3F4F6',
              borderRadius: '20px', padding: '3px 8px', fontWeight: 500,
            }}>
              {profile.industry}
            </span>
          )}
          {profile.mutual_connection && (
            <span style={{
              fontSize: '11px', color: '#7C3AED', background: '#F5F3FF',
              borderRadius: '20px', padding: '3px 8px', fontWeight: 500,
            }}>
              via {profile.mutual_connection}
            </span>
          )}
        </div>
      </div>

      {/* Expanded notes */}
      {expanded && (
        <div style={{
          borderTop: '1px solid #F3F4F6', padding: '12px 16px',
          background: '#FAFAFA',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', marginBottom: '6px' }}>Notes</div>
          <textarea
            value={localNotes}
            onChange={e => { setLocalNotes(e.target.value); setNotesChanged(true) }}
            style={{
              width: '100%', border: '1px solid #E5E7EB', borderRadius: '8px',
              padding: '8px 10px', fontSize: '12px', outline: 'none',
              fontFamily: 'inherit', minHeight: '72px', resize: 'vertical',
              boxSizing: 'border-box', background: '#fff',
            }}
          />
          {notesChanged && (
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              style={{
                marginTop: '6px', padding: '5px 12px', borderRadius: '6px',
                border: 'none', background: '#0A66C2', color: '#fff',
                fontSize: '11px', cursor: 'pointer', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '5px',
              }}
            >
              {savingNotes ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={11} />}
              Save Notes
            </button>
          )}
          {profile.connections && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#9CA3AF' }}>
              📊 {profile.connections}  ·  Added {profile.screenshot_date}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LinkedInPage() {
  const [profiles, setProfiles] = useState<LinkedInProspect[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterConnection, setFilterConnection] = useState<ConnectionStatus | 'all'>('all')
  const [filterMessage, setFilterMessage] = useState<MessageStatus | 'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  const loadProfiles = useCallback(async () => {
    setLoading(true)
    const { data, error } = await getLinkedInProspects()
    if (error) {
      // Table may not exist yet — try to seed
      if (error.includes('schema cache') || error.includes('does not exist') || error.includes('not found')) {
        setError('linkedin_prospects table not found. Please run the migration first via /api/migrate-linkedin')
      } else {
        setError(error)
      }
    } else {
      setProfiles(data || [])
      // If empty, seed the initial 10 profiles
      if (!data || data.length === 0) {
        const { seeded } = await seedLinkedInProspects()
        if (seeded) {
          const { data: seededData } = await getLinkedInProspects()
          setProfiles(seededData || [])
        }
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadProfiles() }, [loadProfiles])

  const handleUpdateConnection = async (id: string, status: ConnectionStatus) => {
    await updateConnectionStatus(id, status)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, connection_status: status } : p))
  }

  const handleUpdateMessage = async (id: string, status: MessageStatus) => {
    await updateMessageStatus(id, status)
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, message_status: status } : p))
  }

  const handleDelete = (id: string) => {
    if (!confirm('Delete this LinkedIn prospect?')) return
    startTransition(async () => {
      await deleteLinkedInProspect(id)
      setProfiles(prev => prev.filter(p => p.id !== id))
    })
  }

  const filtered = profiles.filter(p => {
    const matchSearch = !search || [p.name, p.company, p.title, p.industry].some(
      f => f?.toLowerCase().includes(search.toLowerCase())
    )
    const matchConn = filterConnection === 'all' || p.connection_status === filterConnection
    const matchMsg = filterMessage === 'all' || p.message_status === filterMessage
    return matchSearch && matchConn && matchMsg
  })

  const stats = {
    total: profiles.length,
    connected: profiles.filter(p => p.connection_status === 'connected').length,
    pending: profiles.filter(p => p.connection_status === 'pending').length,
    toConnect: profiles.filter(p => p.connection_status === 'to_connect').length,
    following: profiles.filter(p => p.connection_status === 'following').length,
    toSend: profiles.filter(p => p.message_status === 'to_send').length,
    replied: profiles.filter(p => p.message_status === 'replied').length,
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '12px',
      }}>
        <Loader2 size={32} style={{ color: '#0A66C2', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#6B7280', fontSize: '14px' }}>Loading LinkedIn Prospects from Supabase…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px' }}>
        <div style={{
          background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px',
          padding: '24px',
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <AlertCircle size={20} style={{ color: '#DC2626', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontWeight: 700, color: '#991B1B', margin: '0 0 8px' }}>Database Table Missing</p>
              <p style={{ fontSize: '13px', color: '#7F1D1D', margin: '0 0 12px' }}>
                The <code>linkedin_prospects</code> table doesn&apos;t exist yet in Supabase.
                Please run this SQL in your <strong>Supabase SQL Editor</strong>:
              </p>
              <pre style={{
                background: '#fff', borderRadius: '8px', padding: '12px',
                fontSize: '11px', overflow: 'auto', color: '#374151',
                border: '1px solid #FCA5A5',
              }}>{`CREATE TABLE IF NOT EXISTS public.linkedin_prospects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  title text,
  company text,
  location text,
  degree text,
  connections text,
  profile_url text,
  connection_status text NOT NULL DEFAULT 'to_connect',
  message_status text NOT NULL DEFAULT 'to_send',
  mutual_connection text,
  industry text,
  screenshot_date text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.linkedin_prospects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.linkedin_prospects
  FOR ALL USING (true) WITH CHECK (true);`}</pre>
              <button
                onClick={loadProfiles}
                style={{
                  marginTop: '12px', padding: '8px 16px', borderRadius: '8px',
                  background: '#0A66C2', color: '#fff', border: 'none',
                  fontSize: '13px', cursor: 'pointer', fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                <RefreshCw size={13} /> Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {showAddModal && (
        <AddProspectModal onClose={() => setShowAddModal(false)} onSaved={loadProfiles} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: '#0A66C2', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff',
          }}>
            <LinkedInIcon size={20} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#111827' }}>LinkedIn Outreach</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#6B7280' }}>
              {stats.total} prospects · {stats.connected} connected · {stats.toSend} messages to send
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={loadProfiles}
            disabled={loading}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: '1px solid #E5E7EB',
              background: '#fff', fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px', color: '#374151',
              fontWeight: 500,
            }}
          >
            <RefreshCw size={13} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: '#0A66C2', color: '#fff', fontSize: '13px', cursor: 'pointer',
              fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            <Plus size={14} /> Add Prospect
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'Total', value: stats.total, color: '#1D4ED8', bg: '#EFF6FF', icon: <Users size={14} /> },
          { label: 'Connected', value: stats.connected, color: '#16A34A', bg: '#F0FDF4', icon: <UserCheck size={14} /> },
          { label: 'Pending', value: stats.pending, color: '#D97706', bg: '#FFFBEB', icon: <Clock size={14} /> },
          { label: 'To Connect', value: stats.toConnect, color: '#6B7280', bg: '#F9FAFB', icon: <UserPlus size={14} /> },
          { label: 'Following', value: stats.following, color: '#7C3AED', bg: '#F5F3FF', icon: <Eye size={14} /> },
          { label: 'Msgs To Send', value: stats.toSend, color: '#DC2626', bg: '#FEF2F2', icon: <MessageSquare size={14} /> },
          { label: 'Replied', value: stats.replied, color: '#16A34A', bg: '#F0FDF4', icon: <TrendingUp size={14} /> },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: '10px', padding: '12px',
            border: `1px solid ${s.color}20`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: s.color, marginBottom: '4px' }}>
              {s.icon}
              <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#111827' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB',
        padding: '14px 16px', marginBottom: '20px',
        display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        <Filter size={14} style={{ color: '#6B7280' }} />
        <input
          type="text"
          placeholder="Search name, company, industry…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            border: '1px solid #E5E7EB', borderRadius: '8px',
            padding: '6px 12px', fontSize: '12px', outline: 'none', minWidth: '200px',
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
          <option value="to_send">To Send</option>
          <option value="sent">Sent</option>
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
          border: '1px solid #FCD34D', borderRadius: '10px',
          padding: '12px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <AlertCircle size={16} style={{ color: '#D97706', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#92400E' }}>
            <strong>{stats.toConnect} profile(s)</strong> haven&apos;t been sent a connection request yet.
            {stats.pending > 0 && <> · <strong>{stats.pending} pending</strong> — message once they accept.</>}
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
            onDelete={handleDelete}
          />
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
          <LinkedInIcon size={48} />
          <p style={{ fontSize: '15px', fontWeight: 600, marginTop: '12px' }}>
            {profiles.length === 0 ? 'No prospects yet — add your first one!' : 'No profiles match your filters'}
          </p>
          <p style={{ fontSize: '13px' }}>
            {profiles.length === 0
              ? <button onClick={() => setShowAddModal(true)} style={{ background: '#0A66C2', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>+ Add First Prospect</button>
              : 'Try adjusting your search or filters'
            }
          </p>
        </div>
      )}

      {/* Footer summary */}
      {profiles.length > 0 && (
        <div style={{
          marginTop: '24px', background: '#fff', borderRadius: '12px',
          border: '1px solid #E5E7EB', padding: '16px 18px',
        }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <LinkedInIcon size={14} />
            LinkedIn Outreach Summary · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '12px', color: '#6B7280' }}>
            <span>📨 <strong>{stats.pending}</strong> invitations pending</span>
            <span>✉️ <strong>{stats.toSend}</strong> messages to send</span>
            <span>🤝 <strong>{stats.connected}</strong> direct connections</span>
            <span>👁️ <strong>{stats.following}</strong> following (not connected)</span>
            <span>💬 <strong>{stats.replied}</strong> replied</span>
          </div>
        </div>
      )}
    </div>
  )
}
