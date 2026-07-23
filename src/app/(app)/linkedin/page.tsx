'use client'

import React, { useState, useEffect, useTransition, useCallback, useMemo } from 'react'
import {
  UserCheck, Clock, MessageSquare, UserPlus,
  ChevronDown, ChevronRight, Eye, Filter,
  Users, TrendingUp, CheckCircle2, Send, AlertCircle, RefreshCw,
  Plus, Trash2, Loader2, Save, X, Calendar, FileText, Check, Award, Flame,
  Share2, ArrowRight, Tag, MapPin, Building2, Sparkles, AlertTriangle,
  Zap, Layers, Target, HelpCircle, CheckSquare, MessageCircle, Search
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  getLinkedInProspects,
  updateConnectionStatus,
  updateMessageStatus,
  updateProspectNotes,
  updateProspectPriority,
  createOrUpdateLinkedInProspect,
  addTimelineActivity,
  deleteLinkedInProspect,
  seedLinkedInProspects,
  getLinkedInDailyLogs,
  createOrUpdateDailyLog,
  convertProspectToPipeline,
  updateProspectBdStage,
  updateProspectTier,
  updateTadbeerAngle,
  type LinkedInProspect,
  type ConnectionStatus,
  type MessageStatus,
  type TimelineActivity,
  type LinkedInDailyLog,
  type LinkedInBdStage,
  type LinkedInStageInfo
} from '@/lib/actions/linkedin'
import { formatOmanWhatsAppUrl, isValidLinkedInUrl } from '@/app/(app)/prospects/page'

export const LINKEDIN_BD_STAGES_MAP: Record<LinkedInBdStage, LinkedInStageInfo> = {
  stage_1_targeting: {
    stage_number: 1,
    id: 'stage_1_targeting',
    name: '1. Targeting & Classification',
    short_label: '1. Targeting',
    description: 'Classify account (Tier 1 Strategic, Tier 2 Good Fit, Tier 3 Network). Identify entry trigger.',
    recommended_action: 'Classify account tier and identify specific entry trigger reason before outreach.',
    crm_status_text: 'Target Identified'
  },
  stage_2_research: {
    stage_number: 2,
    id: 'stage_2_research',
    name: '2. Profile Visit & Research',
    short_label: '2. Research',
    description: 'Check role, company developments & Tadbeer angle. Answer: Why should they talk to Tadbeer?',
    recommended_action: 'Document specific Tadbeer angle in CRM. If no clear angle exists, do not force outreach.',
    crm_status_text: 'Research Completed'
  },
  stage_3_warm_engagement: {
    stage_number: 3,
    id: 'stage_3_warm_engagement',
    name: '3. Warm Engagement',
    short_label: '3. Warm Engage',
    description: 'Visit profile -> Follow -> Engage with post -> Leave thoughtful comment to build name recognition.',
    recommended_action: 'Leave 1 thoughtful comment on recent post. For Tier 1, engage across multiple days.',
    crm_status_text: 'Warm Touch Done'
  },
  stage_4_connection_pending: {
    stage_number: 4,
    id: 'stage_4_connection_pending',
    name: '4. Connection Request Sent',
    short_label: '4. Connect Sent',
    description: 'Connection request sent without sales pitch. Personalised note only if adding real context.',
    recommended_action: 'Wait for acceptance. Do not repeatedly interact just to get noticed.',
    crm_status_text: 'Connection Pending'
  },
  stage_5_welcome_convo: {
    stage_number: 5,
    id: 'stage_5_welcome_convo',
    name: '5. Welcome Conversation (No Pitch)',
    short_label: '5. Welcome DM',
    description: 'Send simple human message within 24h of acceptance (e.g. Haitham style). No pitch or links.',
    recommended_action: 'Send warm human welcome message. Close initial exchange naturally when they reply.',
    crm_status_text: 'Warm Connection'
  },
  stage_6_intelligent_nurture: {
    stage_number: 6,
    id: 'stage_6_intelligent_nurture',
    name: '6. Intelligent Event Nurturing',
    short_label: '6. Event Nurture',
    description: 'Monitor company news, hiring, posts & developments. Engage only when there is a legitimate reason.',
    recommended_action: 'Monitor triggers (e.g. warehouse post, hiring). Reach out only when triggered, not calendar-spam.',
    crm_status_text: 'Nurturing Active'
  },
  stage_7_business_convo: {
    stage_number: 7,
    id: 'stage_7_business_convo',
    name: '7. Start Business Conversation',
    short_label: '7. Business Convo',
    description: 'Transition from relationship to business using contextual observation (e.g. operational scaling).',
    recommended_action: 'Open discussion around their operational approach (not selling services directly).',
    crm_status_text: 'Business Conversation'
  },
  stage_8_problem_discovery: {
    stage_number: 8,
    id: 'stage_8_problem_discovery',
    name: '8. Problem Discovery & Fit',
    short_label: '8. Problem Fit',
    description: 'Uncover problem -> importance -> urgency -> authority -> fit. Propose meeting as logical next step.',
    recommended_action: 'If genuine problem appears, propose meeting as natural next step instead of forced CTA.',
    crm_status_text: 'Meeting Proposed'
  },
  stage_9_meeting_booked: {
    stage_number: 9,
    id: 'stage_9_meeting_booked',
    name: '9. Book Meeting & Briefing',
    short_label: '9. Meeting Booked',
    description: 'Meeting agreed! Generate company intelligence brief with previous interactions & Tadbeer angles.',
    recommended_action: 'Review compiled briefing (who they are, what changed, what they need) before meeting.',
    crm_status_text: 'Meeting Booked'
  },
  stage_10_pipeline_converted: {
    stage_number: 10,
    id: 'stage_10_pipeline_converted',
    name: '10. Sales Pipeline Transition',
    short_label: '10. Sales Pipeline',
    description: 'Transferred into main sales pipeline (Discovery -> Opportunity -> Proposal -> Won/Lost).',
    recommended_action: 'Track in main CRM Pipeline. Continue using LinkedIn as a relationship channel throughout.',
    crm_status_text: 'In Main Pipeline'
  }
};


// ── Inline LinkedIn logo SVG ───────────────────────────────────────────────
function LinkedInIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

// ── Status Config ────────────────────────────────────────────────────────────
const CONNECTION_STATUS_CONFIG: Record<ConnectionStatus, { label: string; color: string; bg: string }> = {
  connected:      { label: 'Connected (1st)',       color: '#16A34A', bg: '#F0FDF4' },
  pending:        { label: 'Invitation Pending',     color: '#D97706', bg: '#FFFBEB' },
  to_connect:     { label: 'Not Connected',          color: '#6B7280', bg: '#F9FAFB' },
  following:      { label: 'Following',              color: '#7C3AED', bg: '#F5F3FF' },
  engaged:        { label: 'Post Engaged',           color: '#2563EB', bg: '#EFF6FF' },
  profile_viewer: { label: 'Viewed My Profile',      color: '#EA580C', bg: '#FFF7ED' },
}

const MESSAGE_STATUS_CONFIG: Record<MessageStatus, { label: string; color: string; bg: string }> = {
  none:    { label: 'No Message',      color: '#9CA3AF', bg: '#F3F4F6' },
  to_send: { label: 'To Send',         color: '#DC2626', bg: '#FEF2F2' },
  planned: { label: 'DM Planned',      color: '#8B5CF6', bg: '#F3E8FF' },
  sent:    { label: 'Welcome DM Sent', color: '#16A34A', bg: '#F0FDF4' },
  replied: { label: 'Replied',         color: '#059669', bg: '#ECFDF5' },
}

function deriveBdStage(prospect: LinkedInProspect): LinkedInBdStage {
  if (prospect.bd_stage) return prospect.bd_stage;
  if (prospect.in_pipeline) return 'stage_10_pipeline_converted';
  if (prospect.connection_status === 'connected' && prospect.message_status === 'replied') return 'stage_6_intelligent_nurture';
  if (prospect.connection_status === 'connected' && prospect.message_status === 'sent') return 'stage_5_welcome_convo';
  if (prospect.connection_status === 'pending') return 'stage_4_connection_pending';
  if (prospect.connection_status === 'engaged' || prospect.connection_status === 'following') return 'stage_3_warm_engagement';
  if (prospect.profile_url) return 'stage_2_research';
  return 'stage_1_targeting';
}

function TierBadge({ tier }: { tier?: string }) {
  const currentTier = tier || 'Tier 2';
  let color = '#2563EB';
  let bg = '#EFF6FF';
  let label = 'Tier 2: Good Fit';

  if (currentTier.includes('Tier 1')) {
    color = '#7C3AED'; bg = '#F5F3FF'; label = '👑 Tier 1: Strategic Account';
  } else if (currentTier.includes('Tier 3')) {
    color = '#059669'; bg = '#ECFDF5'; label = '🌱 Tier 3: Network Relationship';
  }

  return (
    <span style={{
      fontSize: '11px', fontWeight: 800, color, background: bg,
      border: `1px solid ${color}40`, borderRadius: '6px',
      padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px',
    }}>
      {label}
    </span>
  );
}

// ── Add Prospect Modal ────────────────────────────────────────────────────────
function AddProspectModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [pending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '', title: '', company: '', location: '', degree: '2nd',
    connection_status: 'to_connect' as ConnectionStatus,
    message_status: 'none' as MessageStatus, priority: 'High',
    bd_stage: 'stage_1_targeting' as LinkedInBdStage,
    tier: 'Tier 2' as 'Tier 1' | 'Tier 2' | 'Tier 3',
    tadbeer_angle: '',
    lead_type: '', profile_url: '', notes: '', activity_type: 'profile_visit', activity_desc: 'Visited LinkedIn profile today',
    activity_status: 'confirmed' as 'confirmed' | 'planned'
  })

  const handleSubmit = () => {
    if (!form.name.trim() || !form.company.trim()) {
      alert('Please provide at least Contact Name and Company Name.')
      return
    }
    startTransition(async () => {
      const initialActivities: TimelineActivity[] = [
        {
          id: 'act-' + Date.now(),
          date: '2026-07-23',
          activity_type: form.activity_type as any,
          description: form.activity_desc || 'Added to LinkedIn CRM',
          status: form.activity_status,
        }
      ]

      const { error } = await createOrUpdateLinkedInProspect({
        ...form,
        screenshot_date: '2026-07-23',
        activities: initialActivities,
      })

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
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '16px', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '24px',
        width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#111827' }}>Add New LinkedIn Lead</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Full Name *</label>
            <input style={inp} placeholder="e.g. Jad Atat" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Title</label>
              <input style={inp} placeholder="e.g. Group CEO" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Company Name *</label>
              <input style={inp} placeholder="e.g. EVCG" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Account Classification Tier</label>
              <select style={inp} value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value as any })}>
                <option value="Tier 1">👑 Tier 1: High-Value Strategic Account</option>
                <option value="Tier 2">☀️ Tier 2: Good-Fit Prospect</option>
                <option value="Tier 3">🌱 Tier 3: Network Relationship</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>BD Process Stage</label>
              <select style={inp} value={form.bd_stage} onChange={e => setForm({ ...form, bd_stage: e.target.value as any })}>
                {Object.values(LINKEDIN_BD_STAGES_MAP).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>Why conversation with Tadbeer makes sense?</label>
            <input style={inp} placeholder="e.g. Scaling warehouse operations & needs ERP automation" value={form.tadbeer_angle} onChange={e => setForm({ ...form, tadbeer_angle: e.target.value })} />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 700, color: '#374151', display: 'block', marginBottom: '4px' }}>LinkedIn Profile URL</label>
            <input style={inp} placeholder="https://linkedin.com/in/username" value={form.profile_url} onChange={e => setForm({ ...form, profile_url: e.target.value })} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSubmit} disabled={pending} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', background: '#0A66C2', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              {pending ? 'Saving...' : 'Save Prospect'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Single Prospect Card Component ────────────────────────────────────────────
function ProspectCard({
  profile,
  onRefresh,
}: {
  profile: LinkedInProspect
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [savingConn, setSavingConn] = useState(false)
  const [savingMsg, setSavingMsg] = useState(false)
  const [savingStage, setSavingStage] = useState(false)
  const [converting, setConverting] = useState(false)
  const [showAddAct, setShowAddAct] = useState(false)
  const [notes, setNotes] = useState(profile.notes || '')
  const [tadbeerAngle, setTadbeerAngle] = useState(profile.tadbeer_angle || '')
  const [savingNotes, setSavingNotes] = useState(false)

  // New activity form
  const [newActType, setNewActType] = useState<TimelineActivity['activity_type']>('profile_visit')
  const [newActDesc, setNewActDesc] = useState('')
  const [newActStatus, setNewActStatus] = useState<'confirmed' | 'planned'>('confirmed')
  const [savingAct, setSavingAct] = useState(false)

  const currentStage = deriveBdStage(profile)
  const stageInfo = LINKEDIN_BD_STAGES_MAP[currentStage]
  const validLinkedin = isValidLinkedInUrl(profile.profile_url)

  const handleConnChange = async (newStatus: ConnectionStatus) => {
    setSavingConn(true)
    await updateConnectionStatus(profile.id, newStatus)
    setSavingConn(false)
    onRefresh()
  }

  const handleMsgChange = async (newStatus: MessageStatus) => {
    setSavingMsg(true)
    await updateMessageStatus(profile.id, newStatus)
    setSavingMsg(false)
    onRefresh()
  }

  const handleStageChange = async (newStage: LinkedInBdStage) => {
    setSavingStage(true)
    await updateProspectBdStage(profile.id, newStage)
    setSavingStage(false)
    onRefresh()
  }

  const handleTierChange = async (newTier: 'Tier 1' | 'Tier 2' | 'Tier 3') => {
    await updateProspectTier(profile.id, newTier)
    onRefresh()
  }

  const handleSaveAngle = async () => {
    setSavingNotes(true)
    await updateTadbeerAngle(profile.id, tadbeerAngle)
    await updateProspectNotes(profile.id, notes)
    setSavingNotes(false)
    onRefresh()
  }

  const handleAddAct = async () => {
    if (!newActDesc.trim()) return
    setSavingAct(true)
    await addTimelineActivity(profile.id, {
      date: '2026-07-23',
      activity_type: newActType,
      description: newActDesc,
      status: newActStatus,
    })
    setSavingAct(false)
    setNewActDesc('')
    setShowAddAct(false)
    onRefresh()
  }

  const handleConvertToPipeline = async () => {
    if (!confirm(`Send "${profile.name}" (${profile.company}) into main CRM pipeline?`)) return
    setConverting(true)
    const { error } = await convertProspectToPipeline(profile.id)
    setConverting(false)
    if (error) alert(error)
    else {
      await updateProspectBdStage(profile.id, 'stage_10_pipeline_converted')
      alert(`"${profile.name}" has been pushed into the main CRM pipeline!`)
      onRefresh()
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Delete prospect "${profile.name}"?`)) return
    await deleteLinkedInProspect(profile.id)
    onRefresh()
  }

  const cs = CONNECTION_STATUS_CONFIG[profile.connection_status] || CONNECTION_STATUS_CONFIG.to_connect
  const ms = MESSAGE_STATUS_CONFIG[profile.message_status] || MESSAGE_STATUS_CONFIG.none

  return (
    <div style={{
      background: '#ffffff', borderRadius: '16px', border: '1px solid #E5E7EB',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden',
      transition: 'box-shadow 0.2s ease',
    }}>
      {/* ── 10-Stage Progress Stepper Ribbon ───────────────────────────────── */}
      <div style={{
        background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px', fontWeight: 900, color: '#fff', background: '#0A66C2',
            padding: '2px 8px', borderRadius: '12px', letterSpacing: '0.04em'
          }}>
            STAGE {stageInfo.stage_number} / 10
          </span>

          <select
            value={currentStage}
            onChange={e => handleStageChange(e.target.value as LinkedInBdStage)}
            disabled={savingStage}
            style={{
              fontSize: '12px', fontWeight: 800, color: '#1E293B', background: '#fff',
              border: '1px solid #CBD5E1', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer',
              outline: 'none',
            }}
          >
            {Object.values(LINKEDIN_BD_STAGES_MAP).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={profile.tier || 'Tier 2'}
            onChange={e => handleTierChange(e.target.value as any)}
            style={{
              fontSize: '11px', fontWeight: 800, background: '#fff', border: '1px solid #CBD5E1',
              borderRadius: '8px', padding: '3px 8px', cursor: 'pointer'
            }}
          >
            <option value="Tier 1">👑 Tier 1: Strategic Account</option>
            <option value="Tier 2">☀️ Tier 2: Good Fit</option>
            <option value="Tier 3">🌱 Tier 3: Network</option>
          </select>

          {profile.in_pipeline ? (
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: '8px' }}>
              ✓ Main Pipeline Active
            </span>
          ) : (
            <button
              onClick={handleConvertToPipeline}
              disabled={converting}
              style={{
                fontSize: '11px', fontWeight: 800, color: '#fff', background: '#059669',
                border: 'none', borderRadius: '8px', padding: '4px 10px', cursor: 'pointer'
              }}
            >
              {converting ? 'Sending...' : 'Send to Main Pipeline'}
            </button>
          )}
        </div>
      </div>

      {/* Main Card Header */}
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px', flexShrink: 0,
            background: `linear-gradient(135deg, #0A66C2, #004182)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: '18px', fontWeight: 900,
            boxShadow: '0 4px 10px rgba(10,102,194,0.2)',
          }}>
            {profile.name.charAt(0)}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '2px' }}>
              <span style={{ fontWeight: 900, fontSize: '16px', color: '#0F172A' }}>{profile.name}</span>
              <TierBadge tier={profile.tier} />
              {validLinkedin && (
                <a href={profile.profile_url.startsWith('http') ? profile.profile_url : `https://${profile.profile_url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0A66C2' }} title="Verified LinkedIn Profile">
                  <LinkedInIcon size={16} />
                </a>
              )}
            </div>

            <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              {profile.title}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '12px', color: '#64748B' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#0F172A' }}>
                <Building2 size={12} style={{ color: '#0A66C2' }} /> {profile.company}
              </span>
              {profile.location && (
                <span style={{ display: 'inline-flex', gap: '3px' }}>
                  <MapPin size={12} /> {profile.location}
                </span>
              )}
            </div>
          </div>

          <button onClick={handleDelete} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }} title="Delete Prospect">
            <Trash2 size={15} />
          </button>
        </div>

        {/* 🎯 Tadbeer Angle & Strategy Box */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '10px 12px', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#0A66C2', marginBottom: '4px' }}>
            <Target size={13} />
            <span>Tadbeer Angle (Why talk to Tadbeer?):</span>
          </div>
          <p style={{ fontSize: '12px', color: '#334155', margin: 0, fontWeight: 600 }}>
            {profile.tadbeer_angle || profile.notes || 'Document specific Tadbeer angle during Stage 2 Research.'}
          </p>
        </div>

        {/* ⚡ Recommended Action Box for Current Stage */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '10px 12px', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#1E40AF', marginBottom: '2px' }}>
            <Zap size={13} style={{ fill: '#1E40AF' }} />
            <span>Recommended BD Stage Action:</span>
          </div>
          <p style={{ fontSize: '11px', color: '#1E3A8A', margin: 0, fontWeight: 700, lineHeight: '1.4' }}>
            {stageInfo.recommended_action}
          </p>
        </div>

        {/* Status Dropdowns */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <select
              value={profile.connection_status}
              onChange={e => handleConnChange(e.target.value as ConnectionStatus)}
              disabled={savingConn}
              style={{
                fontSize: '11px', fontWeight: 700, color: cs.color,
                background: cs.bg, border: `1px solid ${cs.color}50`,
                borderRadius: '20px', padding: '4px 10px', cursor: 'pointer',
                outline: 'none', appearance: 'none', paddingRight: '22px',
              }}
            >
              <option value="to_connect">Status: Not Connected</option>
              <option value="pending">Status: Invitation Pending</option>
              <option value="connected">Status: Connected (1st)</option>
              <option value="following">Status: Following</option>
              <option value="engaged">Status: Post Engaged</option>
              <option value="profile_viewer">Status: Viewed My Profile</option>
            </select>
            <ChevronDown size={10} style={{ position: 'absolute', right: '8px', top: '7px', color: cs.color, pointerEvents: 'none' }} />
          </div>

          <div style={{ position: 'relative' }}>
            <select
              value={profile.message_status}
              onChange={e => handleMsgChange(e.target.value as MessageStatus)}
              disabled={savingMsg}
              style={{
                fontSize: '11px', fontWeight: 700, color: ms.color,
                background: ms.bg, border: `1px solid ${ms.color}50`,
                borderRadius: '20px', padding: '4px 10px', cursor: 'pointer',
                outline: 'none', appearance: 'none', paddingRight: '22px',
              }}
            >
              <option value="none">DM: None</option>
              <option value="to_send">DM: To Send</option>
              <option value="planned">DM: Planned (Not Sent)</option>
              <option value="sent">Welcome DM Sent</option>
              <option value="replied">DM: Replied</option>
            </select>
            <ChevronDown size={10} style={{ position: 'absolute', right: '8px', top: '7px', color: ms.color, pointerEvents: 'none' }} />
          </div>
        </div>
      </div>

      {/* Activity Timeline Accordion */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          borderTop: '1px solid #F1F5F9', padding: '10px 16px',
          background: '#FAFAFA', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
          <Clock size={13} style={{ color: '#0A66C2' }} />
          Activity Timeline ({profile.activities?.length || 0} entries)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748B' }}>
          <span>{expanded ? 'Hide Details' : 'View History & Notes'}</span>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #E2E8F0', padding: '16px', background: '#F8FAFC' }}>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                Chronological Activity Stream
              </span>
              <button
                onClick={() => setShowAddAct(!showAddAct)}
                style={{
                  fontSize: '11px', fontWeight: 700, color: '#0A66C2', background: '#EFF6FF',
                  border: '1px solid #BFDBFE', borderRadius: '6px', padding: '3px 8px',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}
              >
                <Plus size={11} /> Log Activity
              </button>
            </div>

            {showAddAct && (
              <div style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <select
                    value={newActType}
                    onChange={e => setNewActType(e.target.value as any)}
                    style={{ fontSize: '11px', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="profile_visit">Profile Visited</option>
                    <option value="connection_sent">Connection Sent</option>
                    <option value="commented_post">Commented on Post</option>
                    <option value="followed">Followed Profile</option>
                    <option value="dm_sent">Welcome DM Sent</option>
                    <option value="dm_planned">DM Planned</option>
                  </select>

                  <select
                    value={newActStatus}
                    onChange={e => setNewActStatus(e.target.value as any)}
                    style={{ fontSize: '11px', padding: '6px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="planned">Planned</option>
                  </select>
                </div>

                <input
                  placeholder="Activity details (e.g. Commented on warehouse automation post)..."
                  value={newActDesc}
                  onChange={e => setNewActDesc(e.target.value)}
                  style={{ width: '100%', fontSize: '12px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', marginBottom: '8px', boxSizing: 'border-box' }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                  <button onClick={() => setShowAddAct(false)} style={{ fontSize: '11px', padding: '4px 10px', border: '1px solid #CBD5E1', borderRadius: '6px', background: '#fff' }}>Cancel</button>
                  <button onClick={handleAddAct} disabled={savingAct} style={{ fontSize: '11px', padding: '4px 12px', border: 'none', borderRadius: '6px', background: '#0A66C2', color: '#fff', fontWeight: 700 }}>Save</button>
                </div>
              </div>
            )}

            {/* Timeline Activities List */}
            {profile.activities && profile.activities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {profile.activities.map(act => (
                  <div key={act.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#1E293B' }}>
                      <span>{act.description}</span>
                      <span style={{ fontSize: '10px', color: '#94A3B8' }}>{act.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>No activities logged yet.</p>
            )}
          </div>

          {/* Edit Tadbeer Angle & Prospect Notes */}
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
            <label style={{ fontSize: '11px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
              Edit Tadbeer Angle:
            </label>
            <input
              value={tadbeerAngle}
              onChange={e => setTadbeerAngle(e.target.value)}
              placeholder="Why should this lead talk to Tadbeer?"
              style={{ width: '100%', fontSize: '12px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginBottom: '8px', boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: '11px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '4px' }}>
              Prospect Relationship Notes:
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              style={{ width: '100%', fontSize: '12px', padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
            />
            <button
              onClick={handleSaveAngle}
              disabled={savingNotes}
              style={{ marginTop: '6px', fontSize: '11px', fontWeight: 700, color: '#fff', background: '#0A66C2', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer' }}
            >
              {savingNotes ? 'Saving...' : 'Save Notes & Angle'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main LinkedIn CRM Page ───────────────────────────────────────────────────
export default function LinkedInPage() {
  const [prospects, setProspects] = useState<LinkedInProspect[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStageFilter, setActiveStageFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getLinkedInProspects()
      if (res.data && res.data.length > 0) {
        setProspects(res.data)
      } else {
        await seedLinkedInProspects()
        const retry = await getLinkedInProspects()
        setProspects(retry.data || [])
      }
    } catch (e) {
      console.error('Failed to load prospects:', e)
    } finally {
      setLoading(false)
    }
  }, [])


  useEffect(() => { loadData() }, [loadData])

  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      const stage = deriveBdStage(p);
      if (activeStageFilter !== 'all' && stage !== activeStageFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.company.toLowerCase().includes(q) || p.title.toLowerCase().includes(q);
      }
      return true;
    });
  }, [prospects, activeStageFilter, search]);

  return (
    <div className="space-y-6 page-enter pb-24 max-w-[1650px] mx-auto px-2 sm:px-4 font-sans">
      
      {/* ── Top Hero Header ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold mb-3">
              <LinkedInIcon size={14} />
              <span>Locked-in 10-Stage LinkedIn BD Process</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">LinkedIn Relationship Manager</h1>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl font-medium leading-relaxed">
              Track prospects through the 10-stage event-driven BD workflow: Target → Research → Warm Touch → Connect → Human Welcome → Event Nurture → Business Pivot → Problem Fit → Meeting → Sales Pipeline.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl px-5 shadow-lg border border-blue-400/30"
            >
              <Plus className="h-4 w-4 mr-2" /> Add LinkedIn Lead
            </Button>
          </div>
        </div>
      </div>

      {/* ── 10-Stage BD Stepper & Filter Ribbon ─────────────────────────── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-600" />
            10-Stage LinkedIn BD Workflow Progress
          </span>
          {activeStageFilter !== 'all' && (
            <button onClick={() => setActiveStageFilter('all')} className="text-xs font-bold text-blue-600 hover:underline">
              Clear Stage Filter
            </button>
          )}
        </div>

        {/* 10-Stage Stepper Ribbon */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveStageFilter('all')}
            className={cn(
              "px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all border flex items-center gap-2",
              activeStageFilter === 'all' ? "bg-slate-900 text-white border-slate-900 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
            )}
          >
            <span>All Leads ({prospects.length})</span>
          </button>

          {Object.values(LINKEDIN_BD_STAGES_MAP).map(s => {
            const count = prospects.filter(p => deriveBdStage(p) === s.id).length;
            const isSelected = activeStageFilter === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStageFilter(isSelected ? 'all' : s.id)}
                className={cn(
                  "px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2",
                  isSelected ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                )}
              >
                <span>{s.short_label}</span>
                <span className="bg-slate-200/80 text-slate-800 px-1.5 py-0.5 rounded-md text-[10px] font-black">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            placeholder="Search contact name, company, or title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 h-10 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
          />
        </div>
      </div>

      {/* ── Main Contacts Grid ───────────────────────────────────────────── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
          <p className="text-xs font-bold text-slate-500">Loading 10-stage BD workflow...</p>
        </div>
      ) : filteredProspects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No prospects at this stage</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
          {filteredProspects.map(p => (
            <ProspectCard key={p.id} profile={p} onRefresh={loadData} />
          ))}
        </div>
      )}

      {showAddModal && <AddProspectModal onClose={() => setShowAddModal(false)} onSaved={loadData} />}
    </div>
  )
}
