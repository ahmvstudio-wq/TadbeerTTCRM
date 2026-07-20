'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  FileText, ArrowLeft, Loader2, Save, Eye, CheckCircle, Download,
  Layers, RefreshCw, Send, ChevronRight, CheckSquare, Square,
  Plus, Trash2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { addToast, ToastContainer } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateSession, getSessionItems, saveProposal } from '@/lib/actions/cadence'
import {
  ProposalPdfPreview,
  type ProposalData,
  type HeroStat,
  type DiagnosisCard,
  type PhaseCard,
  createDefaultProposalData,
  migrateFromLegacy
} from '@/components/cadence/proposal-pdf-preview'

const DIAG_COLORS: Record<string, { border: string }> = {
  LEAK: { border: '#EF4444' },
  RISK: { border: '#F59E0B' },
  GAP:  { border: '#3B82F6' },
}

export default function BulkProposalsPage() {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  
  const [activeItem, setActiveItem] = useState<any>(null)
  const [proposalData, setProposalData] = useState<ProposalData | null>(null)
  const [proposalStatus, setProposalStatus] = useState<'draft' | 'ready' | 'sent'>('draft')
  
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showPreviewItem, setShowPreviewItem] = useState<any>(null)
  const [previewProposalData, setPreviewProposalData] = useState<ProposalData | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchSessionAndItems = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const todayStr = new Date().toISOString().split('T')[0]
      const sessRes = await getOrCreateSession(user?.id || 'c3d4e5f6-a7b8-9012-cdef-123456789012', todayStr)
      
      if (sessRes.data) {
        setSession(sessRes.data)
        const itemsRes = await getSessionItems(sessRes.data.id)
        if (itemsRes.data) {
          setItems(itemsRes.data)
          if (itemsRes.data.length > 0) {
            selectActiveItem(itemsRes.data[0])
          }
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSessionAndItems()
  }, [fetchSessionAndItems])

  const selectActiveItem = (item: any) => {
    setActiveItem(item)
    const proposals = item.companies?.outreach_preparations || []
    const proposal = proposals.find((p: any) => p.use_case_summary === 'PROPOSAL') || proposals[0]
    const companyName = item.companies?.company_name || ''
    const industry = item.companies?.industry || ''
    const contactName = item.companies?.contacts?.[0]?.full_name || ''

    if (proposal?.message_body) {
      const migrated = migrateFromLegacy(proposal.message_body, companyName, industry, contactName)
      setProposalData(migrated)
    } else {
      setProposalData(createDefaultProposalData(companyName, industry, contactName))
    }
    setProposalStatus(proposal?.status || 'draft')
  }

  const handleSaveActive = async (status: 'draft' | 'ready' | 'sent') => {
    if (!activeItem || !proposalData) return
    setIsSaving(true)
    try {
      const companyId = activeItem.company_id
      const contactId = activeItem.companies?.contacts?.[0]?.id || ''
      const serialized = JSON.stringify(proposalData)
      const res = await saveProposal(companyId, contactId, serialized, status)
      
      if (res.error) {
        addToast('error', res.error)
      } else {
        addToast('success', `Proposal for ${activeItem.companies?.company_name} saved as ${status}`)
        setProposalStatus(status)
        const updatedItems = items.map(i => {
          if (i.id === activeItem.id) {
            return { ...i, outreach_preparations: res.data }
          }
          return i
        })
        setItems(updatedItems)
      }
    } catch (err) {
      addToast('error', 'Proposal save failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBulkAction = async (action: 'draft' | 'ready' | 'sent') => {
    if (selectedItems.size === 0) return
    setIsSaving(true)
    let successCount = 0
    try {
      for (const itemId of Array.from(selectedItems)) {
        const item = items.find(i => i.id === itemId)
        if (item) {
          const companyId = item.company_id
          const contactId = item.companies?.contacts?.[0]?.id || ''
          
          let content: string
          if (item.id === activeItem?.id && proposalData) {
            content = JSON.stringify(proposalData)
          } else {
            const proposals = item.companies?.outreach_preparations || []
            const existingProposal = proposals.find((p: any) => p.use_case_summary === 'PROPOSAL') || proposals[0]
            const existing = existingProposal?.message_body || ''
            if (existing.trim()) {
              content = existing
            } else {
              const defaults = createDefaultProposalData(
                item.companies?.company_name || '',
                item.companies?.industry || '',
                item.companies?.contacts?.[0]?.full_name || ''
              )
              content = JSON.stringify(defaults)
            }
          }

          const res = await saveProposal(companyId, contactId, content, action)
          if (!res.error) successCount++
        }
      }
      addToast('success', `Bulk operation completed: ${successCount} proposals updated.`)
      fetchSessionAndItems()
    } catch (err) {
      addToast('error', 'Bulk action execution failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = (item: any) => {
    const companyName = item.companies?.company_name || ''
    const industry = item.companies?.industry || ''
    const contactName = item.companies?.contacts?.[0]?.full_name || ''

    let data: ProposalData
    if (item.id === activeItem?.id && proposalData) {
      data = proposalData
    } else if (item.companies?.outreach_preparations?.length > 0) {
      const proposals = item.companies.outreach_preparations
      const pr = proposals.find((p: any) => p.use_case_summary === 'PROPOSAL') || proposals[0]
      if (pr?.message_body) {
        data = migrateFromLegacy(pr.message_body, companyName, industry, contactName)
      } else {
        data = createDefaultProposalData(companyName, industry, contactName)
      }
    } else {
      data = createDefaultProposalData(companyName, industry, contactName)
    }

    setPreviewProposalData(data)
    setShowPreviewItem(item)
  }

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(items.map(i => i.id)))
    }
  }

  const toggleSelectItem = (id: string) => {
    const updated = new Set(selectedItems)
    if (updated.has(id)) updated.delete(id)
    else updated.add(id)
    setSelectedItems(updated)
  }

  // ── Proposal field updaters (same as prospect-workspace) ──
  const updateField = <K extends keyof ProposalData>(field: K, value: ProposalData[K]) => {
    setProposalData(prev => prev ? { ...prev, [field]: value } : prev)
  }

  const updateHeroStat = (index: number, field: keyof HeroStat, value: string) => {
    setProposalData(prev => {
      if (!prev) return prev
      const updated = [...prev.heroStats]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, heroStats: updated }
    })
  }

  const updateLeak = (index: number, field: keyof DiagnosisCard, value: string) => {
    setProposalData(prev => {
      if (!prev) return prev
      const updated = [...prev.leaks]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, leaks: updated }
    })
  }

  const updatePhase = (index: number, field: keyof PhaseCard, value: string | number) => {
    setProposalData(prev => {
      if (!prev) return prev
      const updated = [...prev.phases]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, phases: updated }
    })
  }

  const addPhase = () => {
    setProposalData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        phases: [...prev.phases, {
          phaseNum: prev.phases.length + 1,
          title: `Phase ${prev.phases.length + 1}: New Phase`,
          description: 'Describe the phase deliverables.',
          timeline: '14 days'
        }]
      }
    })
  }

  const removePhase = (index: number) => {
    setProposalData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        phases: prev.phases.filter((_, i) => i !== index).map((p, i) => ({ ...p, phaseNum: i + 1 }))
      }
    })
  }

  const addSection = () => {
    setProposalData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        additionalSections: [...prev.additionalSections, { title: 'New Section', content: [''] }]
      }
    })
  }

  const removeSection = (index: number) => {
    setProposalData(prev => {
      if (!prev) return prev
      return {
        ...prev,
        additionalSections: prev.additionalSections.filter((_, i) => i !== index)
      }
    })
  }

  const updateSection = (index: number, field: 'title' | 'content', value: string | string[]) => {
    setProposalData(prev => {
      if (!prev) return prev
      const updated = [...prev.additionalSections]
      if (field === 'content') {
        updated[index] = { ...updated[index], content: value as string[] }
      } else {
        updated[index] = { ...updated[index], title: value as string }
      }
      return { ...prev, additionalSections: updated }
    })
  }

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="text-[10px] font-extrabold text-text-muted uppercase mb-1 block tracking-wider">{children}</label>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-brand-teal mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Loading Bulk Proposals Workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      <ToastContainer />

      {showPreviewItem && previewProposalData && (
        <ProposalPdfPreview
          company={showPreviewItem.companies}
          contact={showPreviewItem.companies?.contacts?.[0] || {}}
          proposalData={previewProposalData}
          onClose={() => { setShowPreviewItem(null); setPreviewProposalData(null) }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Link href="/daily-cadence">
            <Button variant="outline" size="icon" className="border-border bg-white hover:bg-cream-dark text-text-secondary h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
              <Layers className="h-6 w-6 text-brand-teal" />
              Bulk Proposal Workspace
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Build SIQR intelligence reports for today's cadence prospects
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={selectedItems.size === 0 || isSaving}
            onClick={() => handleBulkAction('draft')}
            className="border-border text-xs bg-white text-text-secondary hover:bg-slate-50"
          >
            Mark Selected Draft
          </Button>
          <Button
            disabled={selectedItems.size === 0 || isSaving}
            onClick={() => handleBulkAction('ready')}
            className="bg-brand-gold hover:bg-brand-gold/90 text-white text-xs"
          >
            Mark Selected Ready
          </Button>
          <Button
            disabled={selectedItems.size === 0 || isSaving}
            onClick={() => handleBulkAction('sent')}
            className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs"
          >
            Mark Selected Sent
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="border-border bg-white shadow-sm p-16 text-center">
          <FileText className="h-10 w-10 text-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-text-secondary text-sm mb-3">No prospects scheduled in today's active session.</p>
          <Link href="/daily-cadence">
            <Button className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs">
              Go to Command Center
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left: Prospect list */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-border bg-white shadow-sm">
              <CardHeader className="py-3 px-4 border-b border-border/60 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-text-primary">Scheduled Prospects</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="text-[10px] text-brand-teal hover:underline h-auto p-0"
                >
                  {selectedItems.size === items.length ? 'Deselect All' : 'Select All'}
                </Button>
              </CardHeader>
              <CardContent className="p-0 max-h-[60vh] overflow-y-auto">
                <div className="divide-y divide-border-light">
                  {items.map(item => {
                    const isSelected = selectedItems.has(item.id)
                    const isActive = activeItem?.id === item.id
                    const proposals = item.companies?.outreach_preparations || []
                    const proposal = proposals.find((p: any) => p.use_case_summary === 'PROPOSAL') || proposals[0]
                    return (
                      <div
                        key={item.id}
                        onClick={() => selectActiveItem(item)}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                          isActive ? 'bg-brand-teal/5 border-l-4 border-brand-teal' : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSelectItem(item.id); }}
                            className="text-text-muted hover:text-brand-teal"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-brand-teal" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                          <div className="min-w-0 text-xs">
                            <p className="font-bold text-text-primary truncate">{item.companies?.company_name}</p>
                            <p className="text-[10px] text-text-secondary truncate">{item.companies?.contacts?.[0]?.full_name || 'No Contact'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {proposal && (
                            <Badge className={`text-[9px] font-semibold capitalize ${
                              proposal.status === 'sent' ? 'bg-green-50 text-green-700 border-green-200' :
                              proposal.status === 'ready' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              {proposal.status}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(item)}
                            className="h-6 w-6 text-brand-teal hover:bg-white"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Structured Proposal Editor */}
          {activeItem && proposalData && (
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-border bg-white shadow-sm">
                <CardHeader className="py-4 px-6 border-b border-border/60 flex flex-row items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-gold">SIQR Intelligence Report</span>
                    <CardTitle className="text-base font-bold text-text-primary mt-0.5">
                      {activeItem.companies?.company_name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(activeItem)}
                      className="border-border text-xs flex items-center gap-1.5 bg-white hover:bg-slate-50 text-text-primary hover-lift"
                    >
                      <Eye className="h-3.5 w-3.5 text-brand-teal" />
                      Preview Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSaveActive('draft')}
                      disabled={isSaving}
                      className="border-border text-xs flex items-center gap-1.5 bg-white hover:bg-slate-50 text-text-primary hover-lift"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Save Draft
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 max-h-[60vh] overflow-y-auto">

                  {/* Cover Section */}
                  <div className="border border-border-light rounded-xl p-3 bg-slate-50/50 space-y-2">
                    <span className="text-[9px] font-extrabold text-[#0D4F4F] uppercase tracking-wider">01 // Cover Page</span>
                    <div>
                      <SectionLabel>Tagline</SectionLabel>
                      <Input value={proposalData.tagline} onChange={(e) => updateField('tagline', e.target.value)} className="text-xs" />
                    </div>
                    <div>
                      <SectionLabel>Subtitle</SectionLabel>
                      <Textarea rows={2} value={proposalData.subtitle} onChange={(e) => updateField('subtitle', e.target.value)} className="text-xs" />
                    </div>
                    <div>
                      <SectionLabel>Hero Stats</SectionLabel>
                      <div className="grid grid-cols-2 gap-1.5">
                        {proposalData.heroStats.map((stat, i) => (
                          <div key={i} className="flex gap-1 items-start bg-white border border-border-light rounded p-1.5">
                            <input value={stat.value} onChange={(e) => updateHeroStat(i, 'value', e.target.value)} className="w-12 text-xs font-bold border border-border rounded p-0.5 text-center bg-slate-50" />
                            <input value={stat.unit} onChange={(e) => updateHeroStat(i, 'unit', e.target.value)} className="w-16 text-[10px] border border-border rounded p-0.5 bg-slate-50" />
                            <input value={stat.label} onChange={(e) => updateHeroStat(i, 'label', e.target.value)} className="flex-1 text-[10px] border border-border rounded p-0.5 bg-slate-50" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis Section */}
                  <div className="border border-border-light rounded-xl p-3 bg-slate-50/50 space-y-2">
                    <span className="text-[9px] font-extrabold text-red-700 uppercase tracking-wider">02 // Forensic Diagnosis</span>
                    <div>
                      <SectionLabel>Diagnosis Intro</SectionLabel>
                      <Textarea rows={2} value={proposalData.diagnosisIntro} onChange={(e) => updateField('diagnosisIntro', e.target.value)} className="text-xs" />
                    </div>
                    {proposalData.leaks.map((leak, i) => (
                      <div key={i} className="bg-white border border-border-light rounded p-2 space-y-1" style={{ borderLeft: `3px solid ${DIAG_COLORS[leak.type]?.border || '#EF4444'}` }}>
                        <div className="flex items-center gap-1.5">
                          <select value={leak.type} onChange={(e) => updateLeak(i, 'type', e.target.value)} className="text-[9px] font-bold uppercase border border-border rounded px-1 py-0.5 bg-slate-50">
                            <option value="LEAK">LEAK</option>
                            <option value="RISK">RISK</option>
                            <option value="GAP">GAP</option>
                          </select>
                          <input value={leak.title} onChange={(e) => updateLeak(i, 'title', e.target.value)} className="flex-1 text-xs font-bold border border-border rounded p-0.5 bg-slate-50" />
                        </div>
                        <textarea value={leak.description} onChange={(e) => updateLeak(i, 'description', e.target.value)} rows={2} className="w-full text-[10px] border border-border rounded p-1 bg-slate-50 resize-none" />
                      </div>
                    ))}
                  </div>

                  {/* Solution Section */}
                  <div className="border border-border-light rounded-xl p-3 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold text-[#0D4F4F] uppercase tracking-wider">03 // Solution Phases</span>
                      <button onClick={addPhase} className="flex items-center gap-0.5 text-[10px] font-bold text-brand-teal hover:underline"><Plus className="h-3 w-3" /> Add</button>
                    </div>
                    <div>
                      <SectionLabel>Solution Intro</SectionLabel>
                      <Textarea rows={2} value={proposalData.solutionIntro} onChange={(e) => updateField('solutionIntro', e.target.value)} className="text-xs" />
                    </div>
                    {proposalData.phases.map((phase, i) => (
                      <div key={i} className="bg-white border border-border-light rounded p-2 space-y-1" style={{ borderLeft: '3px solid #0D4F4F' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-extrabold text-[#C8A951] uppercase tracking-wider">Phase {String(phase.phaseNum).padStart(2, '0')}</span>
                          {proposalData.phases.length > 1 && (
                            <button onClick={() => removePhase(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                          )}
                        </div>
                        <input value={phase.title} onChange={(e) => updatePhase(i, 'title', e.target.value)} className="w-full text-xs font-bold border border-border rounded p-0.5 bg-slate-50" />
                        <textarea value={phase.description} onChange={(e) => updatePhase(i, 'description', e.target.value)} rows={2} className="w-full text-[10px] border border-border rounded p-1 bg-slate-50 resize-none" />
                      </div>
                    ))}
                  </div>

                  {/* Additional + CTA */}
                  <div className="border border-border-light rounded-xl p-3 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider">Additional Sections</span>
                      <button onClick={addSection} className="flex items-center gap-0.5 text-[10px] font-bold text-brand-teal hover:underline"><Plus className="h-3 w-3" /> Add</button>
                    </div>
                    {proposalData.additionalSections.map((sec, i) => (
                      <div key={i} className="bg-white border border-border-light rounded p-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <input value={sec.title} onChange={(e) => updateSection(i, 'title', e.target.value)} className="flex-1 text-xs font-bold border border-border rounded p-0.5 bg-slate-50" />
                          <button onClick={() => removeSection(i)} className="ml-1.5 text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                        </div>
                        <textarea value={sec.content.join('\n')} onChange={(e) => updateSection(i, 'content', e.target.value.split('\n'))} rows={2} className="w-full text-[10px] border border-border rounded p-1 bg-slate-50 resize-none" />
                      </div>
                    ))}
                    <div className="pt-2">
                      <SectionLabel>Proposal Valid Until</SectionLabel>
                      <Input value={proposalData.proposalValidUntil} onChange={(e) => updateField('proposalValidUntil', e.target.value)} className="text-xs w-40" />
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex justify-between items-center pt-3 border-t border-border-light">
                    <div className="text-[10px] text-text-muted">
                      Status: <span className="font-bold text-text-primary capitalize">{proposalStatus}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleSaveActive('ready')}
                        disabled={isSaving}
                        className="bg-brand-gold hover:bg-brand-gold/90 text-white text-xs px-4 py-2 hover-lift"
                      >
                        Mark Ready
                      </Button>
                      <Button
                        onClick={() => handleSaveActive('sent')}
                        disabled={isSaving}
                        className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs px-4 py-2 hover-lift flex items-center gap-1.5"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Mark Sent
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
