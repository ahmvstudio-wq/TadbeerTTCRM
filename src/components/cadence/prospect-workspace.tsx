'use client'

import React, { useState, useEffect } from 'react'
import {
  Building2, User, Mail, Phone, ExternalLink, MessageCircle, Send,
  History, FileText, CheckCircle, Clock, ArrowRight, ChevronRight,
  AlertTriangle, PhoneCall, Save, Eye, RefreshCw, Plus, Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { addToast } from '@/components/ui/toast'
import { saveProposal, markOutreachSent, logResponse } from '@/lib/actions/cadence'
import { updateCompany } from '@/lib/actions/companies'
import {
  ProposalPdfPreview,
  type ProposalData,
  type HeroStat,
  type DiagnosisCard,
  type PhaseCard,
  type AdditionalSection,
  createDefaultProposalData,
  migrateFromLegacy
} from './proposal-pdf-preview'
import { getOutreachMessageForChannel } from '@/lib/outreach-messages-library'

const DIAG_COLORS: Record<string, { border: string }> = {
  LEAK: { border: '#EF4444' },
  RISK: { border: '#F59E0B' },
  GAP: { border: '#3B82F6' },
}

interface Contact {
  id: string
  full_name: string
  title?: string
  email?: string
  phone?: string
  whatsapp?: string
  linkedin_url?: string
}

interface Company {
  id: string
  company_name: string
  industry?: string
  website?: string
  linkedin_url?: string
  phone?: string
  email?: string
  city?: string
  country?: string
  status: string
  notes?: string
  employee_count?: number
  next_action?: string
  next_action_due_date?: string
}

interface Preparation {
  id: string
  company_id: string
  use_case_summary: string
  message_body: string
  status: 'draft' | 'ready' | 'sent'
  updated_at: string
}

interface ProspectWorkspaceProps {
  company: Company
  contact: Contact
  preparations: Preparation[]
  activities: any[]
  sessionId?: string
  currentUserRole?: string
  onClose: () => void
  onUpdate: () => void
}

export function ProspectWorkspace({
  company,
  contact,
  preparations,
  activities,
  sessionId,
  currentUserRole = 'bd_rep',
  onClose,
  onUpdate
}: ProspectWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'research' | 'outreach' | 'proposal' | 'history'>('details')

  // Research notes states
  const [researchNotes, setResearchNotes] = useState(company.notes || '')
  const [isSavingResearch, setIsSavingResearch] = useState(false)

  // Sync research notes state when company changes
  useEffect(() => {
    setResearchNotes(company.notes || '')
  }, [company.id, company.notes])

  // States for outreach
  const [outreachChannel, setOutreachChannel] = useState<'whatsapp' | 'linkedin' | 'email'>('whatsapp')
  const [outreachMessage, setOutreachMessage] = useState('')
  const [isSendingOutreach, setIsSendingOutreach] = useState(false)

  // States for proposals — structured data
  const [proposalData, setProposalData] = useState<ProposalData>(
    createDefaultProposalData(company.company_name, company.industry || '', contact.full_name)
  )
  const [proposalStatus, setProposalStatus] = useState<'draft' | 'ready' | 'sent'>('draft')
  const [showPdfPreview, setShowPdfPreview] = useState(false)
  const [isSavingProposal, setIsSavingProposal] = useState(false)

  // States for response logging
  const [responseType, setResponseType] = useState<string>('none')
  const [responseNotes, setResponseNotes] = useState('')
  const [isLoggingResponse, setIsLoggingResponse] = useState(false)

  // Playbook Templates from the Outreach & Objection Manual PDF & Strategy
  const PLAYBOOK_TEMPLATES = [
    {
      id: 'tadbeer-strat-relationship',
      name: 'Tadbeer Strategy — Target Accounts & Relationships',
      body: 'Assalamu Alaikum [Name],\n\nI was looking into [Company] and the great work you are doing in [sector]. In line with our Tadbeer Transformations operating principle of "relevance before relationship," I wanted to reach out. We build custom operational engines to convert Target Accounts into genuine Conversations and Meetings. Let\'s connect and stay in touch.'
    },
    {
      id: 'tadbeer-strat-insight',
      name: 'Tadbeer Strategy — Research before Relevance',
      body: 'Assalamu Alaikum [Name],\n\nI\'ve been researching [Company] and noticed potential operational bottlenecks in your scaling phase. We follow a strict philosophy: "relationship before request" and "diagnosis before proposal." I would love to share a few specific observations about your operations in [sector] if you\'re open to it.'
    },
    {
      id: 'playbook-a',
      name: 'Approach A — Relationship-Led',
      body: 'Assalamu Alaikum [Name], I came across your work with [Company] while looking into businesses in [sector]. I found what you\'re doing around [specific observation] interesting. Would be good to connect and stay in touch.'
    },
    {
      id: 'playbook-b',
      name: 'Approach B — Insight-Led',
      body: 'Assalamu Alaikum [Name], I was looking into [Company] and noticed [specific observation]. We\'ve been working quite closely around business operations and transformation, and it reminded me of something we frequently see with companies at this stage. Happy to share the observation if useful.'
    },
    {
      id: 'playbook-c',
      name: 'Approach C — Trigger-Led',
      body: 'Assalamu Alaikum [Name], congratulations on [expansion/hiring/announcement]. I was looking at what [Company] is building and had one thought around [relevant operational area] as businesses scale through this stage. Thought I\'d reach out rather than send you a generic introduction.'
    },
    {
      id: 'playbook-d',
      name: 'Approach D — Value/Audit-Led',
      body: 'Assalamu Alaikum [Name], I spent some time looking at [Company] and noticed a few areas around [specific process] that may be worth exploring from an operations perspective. I put together a few observations—not a sales proposal. Happy to send them across if they would be useful.'
    },
    {
      id: 'followup-touch2',
      name: 'Follow-up — Touch 2/3 (Insight Share)',
      body: 'Just came across this while looking further into [topic] and thought it might be relevant to what you\'re doing at [Company]. Sharing it here in case useful.'
    },
    {
      id: 'obj-details',
      name: 'Objection — "Send me some details"',
      body: 'Absolutely. To make sure I send something relevant rather than generic company information, is [specific area] the main priority for you currently, or is there another area you\'re exploring?'
    },
    {
      id: 'obj-not-interested',
      name: 'Objection — "We\'re not interested"',
      body: 'Understood, thank you for letting me know. I\'ll leave it there. Always happy to stay connected, and if anything around [relevant area] becomes a priority in future, feel free to reach out.'
    },
    {
      id: 'obj-provider',
      name: 'Objection — "Already have a provider"',
      body: 'That makes sense. We\'re not necessarily looking to replace an existing partner. In some cases we support businesses around specific gaps or transformation initiatives alongside existing providers. Either way, good to stay connected.'
    },
    {
      id: 'obj-not-now',
      name: 'Objection — "Not right now"',
      body: 'Completely understood. Would it be alright if I reconnect around [appropriate timeframe]?'
    },
    {
      id: 'obj-what-do-you-do',
      name: 'Objection — "What exactly do you do?"',
      body: 'We work with businesses on improving how their operations and technology work together. In your case, the area that made me reach out was specifically [X].'
    }
  ]

  // Initialize values from existing preparation data & channel library
  useEffect(() => {
    const proposal = preparations.find(p => p.use_case_summary === 'PROPOSAL')
    if (proposal) {
      setProposalStatus(proposal.status)
      const migrated = migrateFromLegacy(
        proposal.message_body || '',
        company.company_name,
        company.industry || '',
        contact.full_name
      )
      setProposalData(migrated)
    } else {
      setProposalStatus('draft')
      setProposalData(createDefaultProposalData(company.company_name, company.industry || '', contact.full_name))
    }

    // Load channel-specific outreach message
    const channelUpper = outreachChannel.toUpperCase()
    const prepMatch = preparations.find(p => p.use_case_summary === `OUTREACH_${channelUpper}` || p.use_case_summary === 'OUTREACH')
    
    if (prepMatch && prepMatch.message_body && prepMatch.message_body.length > 50 && prepMatch.use_case_summary === `OUTREACH_${channelUpper}`) {
      setOutreachMessage(prepMatch.message_body)
    } else {
      const channelMsg = getOutreachMessageForChannel(company.id, company.company_name, contact.full_name, outreachChannel)
      setOutreachMessage(channelMsg)
    }
  }, [preparations, company.id, company.company_name, company.industry, contact.full_name, outreachChannel])

  const displayNextAction = company.next_action || 'RESEARCH PROSPECT'
  const displayNextActionDueDate = company.next_action_due_date || ''

  const handleSelectTemplate = (templateId: string) => {
    const selected = PLAYBOOK_TEMPLATES.find(t => t.id === templateId)
    if (!selected) return
    let text = selected.body

    // Get specific observation if available from proposalData or default fallback
    const specificObs = (proposalData as any)?.specificObservation ||
      `your team's work in ${company.industry || 'the sector'} and overall operational scale`

    // Replace all placeholders including [specific observation] and {specific_observation}
    text = text.replace(/\[Name\]/gi, contact.full_name || 'there')
    text = text.replace(/\{name\}/gi, contact.full_name || 'there')
    text = text.replace(/\[Company\]/gi, company.company_name || 'your company')
    text = text.replace(/\{company\}/gi, company.company_name || 'your company')
    text = text.replace(/\[sector\]/gi, company.industry || 'your sector')
    text = text.replace(/\{sector\}/gi, company.industry || 'your sector')
    text = text.replace(/\[specific observation\]/gi, specificObs)
    text = text.replace(/\{specific_observation\}/gi, specificObs)
    text = text.replace(/\[specific process\]/gi, specificObs)
    text = text.replace(/\[relevant operational area\]/gi, specificObs)
    text = text.replace(/\[topic\]/gi, company.industry || 'operational scale')

    // Append the strategic intelligence proposal to the message body
    if (proposalData) {
      text += `\n\n---\nSTRATEGIC PROPOSAL PACKAGE\nReport: ${proposalData.tagline}\nValid Until: ${proposalData.proposalValidUntil}`
    }

    setOutreachMessage(text)
  }

  // ── Proposal field updaters ────────────────────────────────────────────
  const updateProposalField = <K extends keyof ProposalData>(field: K, value: ProposalData[K]) => {
    setProposalData(prev => ({ ...prev, [field]: value }))
  }

  const updateHeroStat = (index: number, field: keyof HeroStat, value: string) => {
    setProposalData(prev => {
      const updated = [...prev.heroStats]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, heroStats: updated }
    })
  }

  const updateLeak = (index: number, field: keyof DiagnosisCard, value: string) => {
    setProposalData(prev => {
      const updated = [...prev.leaks]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, leaks: updated }
    })
  }

  const updatePhase = (index: number, field: keyof PhaseCard, value: string | number) => {
    setProposalData(prev => {
      const updated = [...prev.phases]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, phases: updated }
    })
  }

  const addPhase = () => {
    setProposalData(prev => ({
      ...prev,
      phases: [...prev.phases, {
        phaseNum: prev.phases.length + 1,
        title: `Phase ${prev.phases.length + 1}: New Phase`,
        description: 'Describe the phase deliverables and outcomes.',
        timeline: '14 days'
      }]
    }))
  }

  const removePhase = (index: number) => {
    setProposalData(prev => ({
      ...prev,
      phases: prev.phases.filter((_, i) => i !== index).map((p, i) => ({ ...p, phaseNum: i + 1 }))
    }))
  }

  const addSection = () => {
    setProposalData(prev => ({
      ...prev,
      additionalSections: [...prev.additionalSections, { title: 'New Section', content: [''] }]
    }))
  }

  const removeSection = (index: number) => {
    setProposalData(prev => ({
      ...prev,
      additionalSections: prev.additionalSections.filter((_, i) => i !== index)
    }))
  }

  const updateSection = (index: number, field: 'title' | 'content', value: string | string[]) => {
    setProposalData(prev => {
      const updated = [...prev.additionalSections]
      if (field === 'content') {
        updated[index] = { ...updated[index], content: value as string[] }
      } else {
        updated[index] = { ...updated[index], title: value as string }
      }
      return { ...prev, additionalSections: updated }
    })
  }

  // ── Save / Send handlers ───────────────────────────────────────────────
  const handleSaveProposal = async (status: 'draft' | 'ready' | 'sent') => {
    setIsSavingProposal(true)
    try {
      const serialized = JSON.stringify(proposalData)
      const res = await saveProposal(company.id, contact.id, serialized, status)
      if (res.error) {
        addToast('error', res.error)
      } else {
        setProposalStatus(status)
        addToast('success', `Proposal saved as ${status}`)
        onUpdate()
      }
    } catch (err) {
      addToast('error', 'Failed to save proposal')
    } finally {
      setIsSavingProposal(false)
    }
  }

  const handleMarkSent = async () => {
    // Open the redirect immediately (synchronously in the event handler) to bypass browser popup blockers
    if (outreachChannel === 'whatsapp' && contact.whatsapp) {
      const phone = contact.whatsapp.replace(/\D/g, '')
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(outreachMessage)}`, '_blank')
    } else if (outreachChannel === 'linkedin' && contact.linkedin_url) {
      window.open(contact.linkedin_url, '_blank')
    } else if (outreachChannel === 'email' && contact.email) {
      window.open(`mailto:${contact.email}?subject=Tadbeer%20Transformations&body=${encodeURIComponent(outreachMessage)}`, '_blank')
    }

    setIsSendingOutreach(true)
    try {
      const res = await markOutreachSent({
        sessionId,
        companyId: company.id,
        contactId: contact.id,
        channel: outreachChannel,
        messageBody: outreachMessage
      })
      if (res.error) {
        addToast('error', res.error)
      } else {
        addToast('success', 'Outreach logged successfully')
        setOutreachMessage('')
        onUpdate()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lead-updated', { detail: { companyId: company.id } }))
        }
      }
    } catch (err) {
      addToast('error', 'Outreach log failed')
    } finally {
      setIsSendingOutreach(false)
    }
  }

  const handleLogResponseSubmit = async () => {
    setIsLoggingResponse(true)
    try {
      const res = await logResponse({
        companyId: company.id,
        contactId: contact.id,
        responseType: responseType as any,
        notes: responseNotes
      })
      if (res.error) {
        addToast('error', res.error)
      } else {
        addToast('success', 'Response registered and cadence recalculated')
        setResponseType('none')
        setResponseNotes('')
        onUpdate()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lead-updated', { detail: { companyId: company.id } }))
        }
      }
    } catch (err) {
      addToast('error', 'Failed to log response')
    } finally {
      setIsLoggingResponse(false)
    }
  }

  const handleSaveResearch = async () => {
    setIsSavingResearch(true)
    try {
      const res = await updateCompany(company.id, { notes: researchNotes })
      if (res.error) {
        addToast('error', res.error)
      } else {
        addToast('success', 'Research notes saved successfully')
        onUpdate()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('lead-updated', { detail: { companyId: company.id } }))
        }
      }
    } catch (err) {
      addToast('error', 'Failed to save research notes')
    } finally {
      setIsSavingResearch(false)
    }
  }

  // ── Section label helper ───────────────────────────────────────────────
  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[10px] font-extrabold text-text-muted uppercase mb-1 block tracking-wider">{children}</label>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      {showPdfPreview && (
        <ProposalPdfPreview
          company={company}
          contact={contact}
          proposalData={proposalData}
          onClose={() => setShowPdfPreview(false)}
        />
      )}

      {/* Left Column: Context Card */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="shadow-sm border-border bg-white">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-brand-teal-light flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-brand-teal" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">{company.company_name}</h3>
                  <p className="text-xs text-text-secondary">{company.industry || 'No Industry'} · {company.city || 'Muscat'}</p>
                </div>
              </div>
              <Badge className="bg-brand-teal text-white text-[10px] capitalize">
                {company.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="p-3 bg-cream-dark/20 border border-border-light rounded-xl flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-brand-gold-light flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-brand-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-text-primary truncate">{contact.full_name}</p>
                <p className="text-[10px] text-text-secondary truncate">{contact.title || 'Contact'}</p>
              </div>
            </div>

            <div className="p-3 bg-brand-teal/5 border border-brand-teal/20 rounded-xl">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-teal/60">Next Best Action</span>
              <div className="flex items-center justify-between mt-1">
                <div className="text-xs font-bold text-brand-teal flex items-center gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5 text-brand-gold" />
                  {displayNextAction}
                </div>
                {displayNextActionDueDate && (
                  <Badge variant="outline" className="border-brand-teal/30 text-brand-teal text-[9px] bg-white">
                    Due: {displayNextActionDueDate}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase font-extrabold text-text-muted">Direct Outlets</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-border-light hover:border-brand-teal hover:bg-white transition-all text-text-primary">
                    <Phone className="h-3.5 w-3.5 text-brand-teal" /> Call
                  </a>
                )}
                {(() => {
                  const waRaw = contact.whatsapp || contact.phone;
                  if (!waRaw) return null;
                  let digits = waRaw.replace(/\D/g, "");
                  if (!digits) return null;
                  if (digits.length === 8 && (digits.startsWith("9") || digits.startsWith("7") || digits.startsWith("2"))) {
                    digits = "968" + digits;
                  } else if (!digits.startsWith("968") && digits.length <= 9) {
                    digits = "968" + digits;
                  }
                  return (
                    <a href={`https://wa.me/${digits}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-border-light hover:border-green-400 hover:bg-white transition-all text-text-primary">
                      <MessageCircle className="h-3.5 w-3.5 text-green-600" /> WhatsApp (+968)
                    </a>
                  );
                })()}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-border-light hover:border-blue-400 hover:bg-white transition-all text-text-primary col-span-2">
                    <Mail className="h-3.5 w-3.5 text-blue-600" />
                    <span className="truncate">{contact.email}</span>
                  </a>
                )}
                {(() => {
                  const url = contact.linkedin_url || company.linkedin_url;
                  if (!url || !url.toLowerCase().includes('linkedin.com')) return null;
                  const validUrl = url.startsWith('http') ? url : `https://${url}`;
                  return (
                    <a href={validUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 p-2 rounded-lg bg-slate-50 border border-border-light hover:border-sky-500 hover:bg-white transition-all text-text-primary col-span-2">
                      <ExternalLink className="h-3.5 w-3.5 text-sky-600" />
                      <span className="truncate">Open LinkedIn</span>
                    </a>
                  );
                })()}
              </div>
            </div>

            {/* ── WhatsApp Proposal Shortcut ── */}
            {(() => {
              const waSection = proposalData?.additionalSections?.find(s => s.title === 'WhatsApp Message')
              const waMsg = waSection?.content?.join('\n') || ''
              const rawPhone = contact.whatsapp || contact.phone
              if (!waMsg || !rawPhone) return null
              let digits = rawPhone.replace(/\D/g, '')
              if (digits.length === 8 && (digits.startsWith("9") || digits.startsWith("7") || digits.startsWith("2"))) {
                digits = "968" + digits;
              } else if (!digits.startsWith("968") && digits.length <= 9) {
                digits = "968" + digits;
              }
              const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(waMsg)}`
              return (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-[9px] uppercase tracking-wider font-extrabold text-green-700 mb-2">Proposal WhatsApp Shortcut</p>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-all hover-lift shadow-sm"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Send Proposal on WhatsApp (+968)
                  </a>
                  <p className="text-[9px] text-green-600 mt-1 text-center">Opens WhatsApp · Attach PDF after</p>
                </div>
              );
            })()}

            <div>
              <p className="text-[10px] uppercase font-extrabold text-text-muted mb-1">CRM Notes</p>
              <div className="p-3 bg-slate-50 border border-border-light rounded-xl text-xs text-text-secondary max-h-[120px] overflow-y-auto italic">
                {company.notes || 'No notes logged.'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Execution Workspace */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center gap-1 border-b border-border bg-white rounded-t-xl overflow-x-auto scrollbar-hide p-1.5">
          {(['details', 'research', 'outreach', 'proposal', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[75px] py-2 px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-center whitespace-nowrap transition-all rounded-lg ${activeTab === tab
                  ? 'bg-brand-teal text-white shadow-xs'
                  : 'text-text-secondary hover:text-brand-teal hover:bg-slate-50'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-white border border-border border-t-0 rounded-b-xl p-6 min-h-[400px]">
          {/* ── Details & Response Log ── */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-2">Log Prospect Response</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <SectionLabel>Response Category</SectionLabel>
                    <Select
                      options={[
                        { value: 'none', label: 'Select category...' },
                        { value: 'positive_call', label: 'Positive — Needs Call' },
                        { value: 'call_tomorrow', label: 'Call Back Tomorrow' },
                        { value: 'contact_next_month', label: 'Contact Next Month' },
                        { value: 'not_interested', label: 'Not Interested' },
                        { value: 'meeting_booked', label: 'Meeting Booked' },
                        { value: 'proposal_requested', label: 'Proposal Requested' }
                      ]}
                      value={responseType}
                      onChange={(e) => setResponseType(e.target.value)}
                    />
                  </div>
                  <div>
                    <SectionLabel>Details / Notes</SectionLabel>
                    <input
                      type="text"
                      className="w-full text-xs border border-border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-teal bg-slate-50"
                      placeholder="e.g. Call at 10 AM, warm response"
                      value={responseNotes}
                      onChange={(e) => setResponseNotes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={handleLogResponseSubmit}
                    disabled={isLoggingResponse || responseType === 'none'}
                    className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs px-4 py-2 hover-lift"
                  >
                    {isLoggingResponse ? 'Logging...' : 'Register Response & Update Cadence'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Research & Intel ── */}
          {activeTab === 'research' && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="text-sm font-bold text-text-primary mb-2">Company Intelligence & Research Notes</h4>
                <p className="text-text-secondary">Analyze the target's profile and record your custom research notes below.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 p-4 bg-slate-50 border border-border-light rounded-xl space-y-3">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-gold font-bold">Website & Bio</span>
                    <p className="font-semibold text-text-primary mt-1 truncate">{company.website || 'No Website linked'}</p>
                    <p className="text-[11px] text-text-secondary mt-1">Industry: {company.industry || 'N/A'} · City: {company.city || 'Muscat'}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-teal font-bold block mb-1">Company Details</span>
                    <p className="text-[11px] text-text-secondary">Size: {company.employee_count || 'N/A'} employees</p>
                    <p className="text-[11px] text-text-secondary">Country: {company.country || 'Oman'}</p>
                  </div>
                </div>

                <div className="md:col-span-2 p-4 bg-slate-50 border border-border-light rounded-xl flex flex-col space-y-3">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-teal font-bold">Research Notes</span>
                    <p className="text-[10px] text-text-secondary mt-0.5">Write down your findings, pain points, or custom pitch angles here.</p>
                  </div>
                  <Textarea
                    rows={8}
                    value={researchNotes}
                    onChange={(e) => setResearchNotes(e.target.value)}
                    placeholder="Enter your custom research findings here..."
                    className="text-xs bg-white flex-1"
                  />
                  <div className="flex justify-end pt-1">
                    <Button
                      onClick={handleSaveResearch}
                      disabled={isSavingResearch}
                      className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs px-4 py-2 hover-lift flex items-center gap-1.5 font-bold"
                    >
                      <Save className="h-3.5 w-3.5" />
                      {isSavingResearch ? 'Saving...' : 'Save Research Notes'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Outreach Execution ── */}
          {activeTab === 'outreach' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-text-primary">Personalized Outreach Campaign</h4>
                <p className="text-xs text-text-secondary mt-0.5">Select a channel and customize your messaging. Prefilled variables are ready.</p>
              </div>

              <div className="flex gap-2 border-b border-border-light pb-3">
                {(['whatsapp', 'linkedin', 'email'] as const).map(ch => (
                  <button
                    key={ch}
                    onClick={() => setOutreachChannel(ch)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${outreachChannel === ch
                        ? 'bg-brand-teal border-brand-teal text-white shadow-sm'
                        : 'bg-white border-border text-text-secondary hover:bg-slate-50'
                      }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div>
                  <SectionLabel>Outreach Playbook Templates</SectionLabel>
                  <Select
                    options={[
                      { value: '', label: 'Select playbook template...' },
                      ...PLAYBOOK_TEMPLATES.map(t => ({ value: t.id, label: t.name }))
                    ]}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                  />
                </div>

                <div>
                  <SectionLabel>Custom Message Body</SectionLabel>
                  <Textarea
                    rows={6}
                    value={outreachMessage}
                    onChange={(e) => setOutreachMessage(e.target.value)}
                    placeholder="Write or paste your personalized message content..."
                    className="text-xs"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-[10px] text-text-muted">
                    Variables loaded: <span className="font-semibold text-text-primary">{'{name}'}, {'{company}'}</span>
                  </div>
                  <Button
                    onClick={handleMarkSent}
                    disabled={isSendingOutreach || !outreachMessage.trim()}
                    className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs px-4 py-2 hover-lift flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isSendingOutreach ? 'Logging...' : 'Mark Outreach Sent & Redirect'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── PROPOSAL — Structured SIQR Form ── */}
          {activeTab === 'proposal' && (
            <div className="space-y-5">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-bold text-text-primary">SIQR Intelligence Report Builder</h4>
                  <p className="text-xs text-text-secondary mt-0.5">Fill in the fields — the system auto-generates a branded proposal deck.</p>
                </div>
                <Badge className={
                  proposalStatus === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                    proposalStatus === 'ready' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                }>
                  {proposalStatus}
                </Badge>
              </div>

              {/* ── COVER PAGE SECTION ── */}
              <div className="border border-border-light rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-5 w-5 rounded bg-[#0D4F4F] flex items-center justify-center">
                    <span className="text-[8px] font-black text-white">01</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#0D4F4F] uppercase tracking-wider">Cover Page — Hero Stats</span>
                </div>

                <div>
                  <SectionLabel>Collaboration Title Structure</SectionLabel>
                  <Input
                    value={proposalData.coverTitleFormat || `Tadbeer × ${company.company_name}`}
                    onChange={(e) => updateProposalField('coverTitleFormat', e.target.value)}
                    className="text-xs font-bold"
                    placeholder="Tadbeer × [Company Name]"
                  />
                </div>
                <div>
                  <SectionLabel>Tagline</SectionLabel>
                  <Input
                    value={proposalData.tagline}
                    onChange={(e) => updateProposalField('tagline', e.target.value)}
                    className="text-xs"
                    placeholder="e.g. Operational Transformation Map for..."
                  />
                </div>
                <div>
                  <SectionLabel>Strategic Subtitle</SectionLabel>
                  <Textarea
                    rows={2}
                    value={proposalData.subtitle}
                    onChange={(e) => updateProposalField('subtitle', e.target.value)}
                    className="text-xs"
                    placeholder="A precision assessment built specifically for..."
                  />
                </div>
                <div>
                  <SectionLabel>Why This Specific Conversation (About Tadbeer Context)</SectionLabel>
                  <Textarea
                    rows={2}
                    value={proposalData.aboutTadbeerContext || ''}
                    onChange={(e) => updateProposalField('aboutTadbeerContext', e.target.value)}
                    className="text-xs"
                    placeholder="Based on operational complexity across your environment..."
                  />
                </div>

                <div>
                  <SectionLabel>4 KPI Hero Stat Cards</SectionLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {proposalData.heroStats.map((stat, i) => (
                      <div key={i} className="flex gap-1.5 items-start bg-white border border-border-light rounded-lg p-2">
                        <input
                          value={stat.value}
                          onChange={(e) => updateHeroStat(i, 'value', e.target.value)}
                          className="w-14 text-xs font-bold border border-border rounded p-1 text-center bg-slate-50"
                          placeholder="25"
                        />
                        <input
                          value={stat.unit}
                          onChange={(e) => updateHeroStat(i, 'unit', e.target.value)}
                          className="w-20 text-[10px] border border-border rounded p-1 bg-slate-50"
                          placeholder="% increase"
                        />
                        <input
                          value={stat.label}
                          onChange={(e) => updateHeroStat(i, 'label', e.target.value)}
                          className="flex-1 text-[10px] border border-border rounded p-1 bg-slate-50"
                          placeholder="Efficiency"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── FORENSIC DIAGNOSIS SECTION ── */}
              <div className="border border-border-light rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-5 w-5 rounded bg-red-500 flex items-center justify-center">
                    <span className="text-[8px] font-black text-white">02</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-red-700 uppercase tracking-wider">Forensic Diagnosis — Operational Leaks</span>
                </div>

                <div>
                  <SectionLabel>Introduction Paragraph</SectionLabel>
                  <Textarea
                    rows={2}
                    value={proposalData.diagnosisIntro}
                    onChange={(e) => updateProposalField('diagnosisIntro', e.target.value)}
                    className="text-xs"
                    placeholder="Our deep-scrape and market analysis revealed..."
                  />
                </div>

                {proposalData.leaks.map((leak, i) => (
                  <div key={i} className="bg-white border border-border-light rounded-lg p-3 space-y-1.5" style={{ borderLeft: `3px solid ${DIAG_COLORS[leak.type]?.border || '#EF4444'}` }}>
                    <div className="flex items-center gap-2">
                      <select
                        value={leak.type}
                        onChange={(e) => updateLeak(i, 'type', e.target.value)}
                        className="text-[9px] font-bold uppercase border border-border rounded px-1.5 py-0.5 bg-slate-50"
                      >
                        <option value="LEAK">LEAK</option>
                        <option value="RISK">RISK</option>
                        <option value="GAP">GAP</option>
                      </select>
                      <input
                        value={leak.title}
                        onChange={(e) => updateLeak(i, 'title', e.target.value)}
                        className="flex-1 text-xs font-bold border border-border rounded p-1 bg-slate-50"
                        placeholder="Finding title"
                      />
                    </div>
                    <textarea
                      value={leak.description}
                      onChange={(e) => updateLeak(i, 'description', e.target.value)}
                      rows={2}
                      className="w-full text-[10px] border border-border rounded p-1.5 bg-slate-50 resize-none"
                      placeholder="Describe the operational finding..."
                    />
                  </div>
                ))}
              </div>

              {/* ── SOLUTION / PHASES SECTION ── */}
              <div className="border border-border-light rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-[#C8A951] flex items-center justify-center">
                      <span className="text-[8px] font-black text-white">03</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#0D4F4F] uppercase tracking-wider">Solution — Implementation Phases</span>
                  </div>
                  <button onClick={addPhase} className="flex items-center gap-1 text-[10px] font-bold text-brand-teal hover:underline">
                    <Plus className="h-3 w-3" /> Add Phase
                  </button>
                </div>

                <div>
                  <SectionLabel>Solution Introduction</SectionLabel>
                  <Textarea
                    rows={2}
                    value={proposalData.solutionIntro}
                    onChange={(e) => updateProposalField('solutionIntro', e.target.value)}
                    className="text-xs"
                    placeholder="We don't just build software..."
                  />
                </div>

                {proposalData.phases.map((phase, i) => (
                  <div key={i} className="bg-white border border-border-light rounded-lg p-3 space-y-1.5" style={{ borderLeft: '3px solid #0D4F4F' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold text-[#C8A951] uppercase tracking-wider">Phase {String(phase.phaseNum).padStart(2, '0')}</span>
                      {proposalData.phases.length > 1 && (
                        <button onClick={() => removePhase(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                      )}
                    </div>
                    <input
                      value={phase.title}
                      onChange={(e) => updatePhase(i, 'title', e.target.value)}
                      className="w-full text-xs font-bold border border-border rounded p-1 bg-slate-50"
                      placeholder="Phase title"
                    />
                    <textarea
                      value={phase.description}
                      onChange={(e) => updatePhase(i, 'description', e.target.value)}
                      rows={2}
                      className="w-full text-[10px] border border-border rounded p-1.5 bg-slate-50 resize-none"
                      placeholder="Describe the phase..."
                    />
                  </div>
                ))}
              </div>

              {/* ── ADDITIONAL SECTIONS ── */}
              <div className="border border-border-light rounded-xl p-4 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded bg-slate-500 flex items-center justify-center">
                      <Plus className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Additional Sections (Optional)</span>
                  </div>
                  <button onClick={addSection} className="flex items-center gap-1 text-[10px] font-bold text-brand-teal hover:underline">
                    <Plus className="h-3 w-3" /> Add Section
                  </button>
                </div>

                {proposalData.additionalSections.length === 0 && (
                  <p className="text-[10px] text-text-muted text-center py-3">No additional sections. Click "Add Section" to create extra proposal pages.</p>
                )}

                {proposalData.additionalSections.map((sec, i) => (
                  <div key={i} className="bg-white border border-border-light rounded-lg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <input
                        value={sec.title}
                        onChange={(e) => updateSection(i, 'title', e.target.value)}
                        className="flex-1 text-xs font-bold border border-border rounded p-1 bg-slate-50"
                        placeholder="Section title"
                      />
                      <button onClick={() => removeSection(i)} className="ml-2 text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                    </div>
                    <textarea
                      value={sec.content.join('\n')}
                      onChange={(e) => updateSection(i, 'content', e.target.value.split('\n'))}
                      rows={3}
                      className="w-full text-[10px] border border-border rounded p-1.5 bg-slate-50 resize-none"
                      placeholder="Content paragraphs (one per line)..."
                    />
                  </div>
                ))}
              </div>

              {/* ── CTA / VALIDITY ── */}
              <div className="border border-border-light rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-5 w-5 rounded bg-emerald-600 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Call-to-Action Page</span>
                </div>
                <div>
                  <SectionLabel>Proposal Valid Until</SectionLabel>
                  <Input
                    value={proposalData.proposalValidUntil}
                    onChange={(e) => updateProposalField('proposalValidUntil', e.target.value)}
                    className="text-xs w-48"
                    placeholder="21/5/2026"
                  />
                </div>
              </div>

              {/* ── Action Buttons ── */}
              <div className="space-y-3 pt-3 border-t border-border-light">
                {/* Quick Send Shortcuts */}
                {(() => {
                  const waSection = proposalData?.additionalSections?.find(s => s.title === 'WhatsApp Message')
                  const waMsg = waSection?.content?.join('\n') || ''
                  const hasWa = !!waMsg && !!contact.whatsapp
                  const hasEmail = !!contact.email
                  if (!hasWa && !hasEmail) return null
                  return (
                    <div className="flex gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <span className="text-[9px] uppercase tracking-wider font-extrabold text-green-700 self-center whitespace-nowrap">Quick Send:</span>
                      {hasWa && (
                        <a
                          href={`https://wa.me/${contact.whatsapp!.replace(/\D/g, '')}?text=${encodeURIComponent(waMsg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-all hover-lift shadow-sm"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp + PDF
                        </a>
                      )}
                      {hasEmail && (
                        <a
                          href={`mailto:${contact.email}?subject=AI Transformation Proposal — ${company.company_name}&body=${encodeURIComponent(waMsg)}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all hover-lift shadow-sm"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Email + PDF
                        </a>
                      )}
                      <span className="text-[9px] text-green-600 self-center ml-auto">Attach exported PDF after opening</span>
                    </div>
                  )
                })()}

                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPdfPreview(true)}
                      className="border-border text-xs flex items-center gap-1 bg-white hover:bg-slate-50 hover-lift text-text-primary"
                    >
                      <Eye className="h-3.5 w-3.5 text-brand-teal" />
                      Preview Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveProposal('draft')}
                      disabled={isSavingProposal}
                      className="border-border text-xs flex items-center gap-1 bg-white hover:bg-slate-50 hover-lift text-text-primary"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save Draft
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSaveProposal('ready')}
                      disabled={isSavingProposal}
                      className="bg-brand-gold hover:bg-brand-gold/90 text-white text-xs px-4 py-2 hover-lift"
                    >
                      Mark Ready
                    </Button>
                    <Button
                      onClick={() => handleSaveProposal('sent')}
                      disabled={isSavingProposal}
                      className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs px-4 py-2 hover-lift flex items-center gap-1.5"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Mark Sent (Log CRM)
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── History ── */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-text-primary mb-3">Chronological Outreach Timeline</h4>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {activities.length === 0 ? (
                  <p className="text-xs text-text-muted text-center py-6">No previous relationship touchpoints logged.</p>
                ) : (
                  activities.map((act, index) => (
                    <div key={act.id || index} className="flex gap-3 relative">
                      {index !== activities.length - 1 && (
                        <div className="absolute left-3 top-6 bottom-[-16px] w-[1px] bg-border" />
                      )}
                      <div className="h-6 w-6 rounded-full bg-brand-teal-light border border-border flex items-center justify-center flex-shrink-0 relative z-10">
                        <History className="h-3 w-3 text-brand-teal" />
                      </div>
                      <div className="flex-1 text-xs">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-text-primary">{act.title}</span>
                          <span className="text-[10px] text-text-muted">
                            {new Date(act.created_at).toLocaleDateString()} {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {act.description && <p className="text-text-secondary mt-0.5">{act.description}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
