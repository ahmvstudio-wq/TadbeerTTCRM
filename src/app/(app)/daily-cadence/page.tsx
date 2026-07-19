'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Users, Zap, Phone, Clock, Calendar, TrendingUp, AlertTriangle, CheckCircle,
  Plus, Search, ArrowRight, Eye, CalendarCheck, Loader2, Play, PlusCircle, RefreshCw,
  FileText, ChevronDown, ChevronRight, PhoneCall
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { ToastContainer, addToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateSession, getSessionItems, addCompaniesToSession, removeCompanyFromSession, completeCallTask, logResponse } from '@/lib/actions/cadence'
import { getCompanies } from '@/lib/actions/companies'
import { getCallQueue } from '@/lib/actions/calls'
import { getFollowUps } from '@/lib/actions/followups'
import { ProspectWorkspace } from '@/components/cadence/prospect-workspace'

export default function DailyCadencePage() {
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentRole, setCurrentRole] = useState<'sdr' | 'bdm' | 'manager'>('sdr')
  const [session, setSession] = useState<any>(null)
  
  // Date Picker & Accordion states
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [expandOutreach, setExpandOutreach] = useState(true)
  const [expandInitiated, setExpandInitiated] = useState(true)
  const [expandCalls, setExpandCalls] = useState(true)
  const [expandFollowUps, setExpandFollowUps] = useState(true)
  const [expandMetrics, setExpandMetrics] = useState(true)

  // Workspace prospects lists
  const [sessionItems, setSessionItems] = useState<any[]>([])
  const [allCompanies, setAllCompanies] = useState<any[]>([])
  const [bdmCalls, setBdmCalls] = useState<any[]>([])
  const [followUps, setFollowUps] = useState<any[]>([])

  // Selection & Details panel
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [addProspectsOpen, setAddProspectsOpen] = useState(false)
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set())
  const [companySearch, setCompanySearch] = useState('')

  // Call logging
  const [callLogOpen, setCallLogOpen] = useState(false)
  const [selectedCallItem, setSelectedCallItem] = useState<any>(null)
  const [callDuration, setCallDuration] = useState('60')
  const [callOutcome, setCallOutcome] = useState<'no_answer' | 'callback_requested' | 'connected' | 'interested' | 'not_interested' | 'meeting_requested' | 'meeting_booked' | 'proposal_required'>('connected')
  const [callNotes, setCallNotes] = useState('')
  const [callFollowUpDate, setCallFollowUpDate] = useState('')
  const [isLoggingCall, setIsLoggingCall] = useState(false)

  // Fetch initial profile
  const fetchProfileAndLoad = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
        setCurrentUser(profile)
        if (profile) {
          if (profile.role === 'admin') setCurrentRole('manager')
          else if (profile.role === 'closer') setCurrentRole('bdm')
          else setCurrentRole('sdr')
        }
      }

      const sessRes = await getOrCreateSession(user?.id || 'c3d4e5f6-a7b8-9012-cdef-123456789012', selectedDate)
      if (sessRes.data) {
        setSession(sessRes.data)
        const itemsRes = await getSessionItems(sessRes.data.id)
        if (itemsRes.data) setSessionItems(itemsRes.data)
      }

      // Fetch BDM Calls, follow-ups, and all companies for selections
      const callsRes = await getCallQueue()
      if (callsRes.data) setBdmCalls(callsRes.data)

      const fuRes = await getFollowUps('pending')
      if (fuRes.data) setFollowUps(fuRes.data)

      const compRes = await getCompanies()
      if (compRes.data) setAllCompanies(compRes.data)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchProfileAndLoad()
  }, [fetchProfileAndLoad])

  const refreshData = async () => {
    if (session) {
      const itemsRes = await getSessionItems(session.id)
      if (itemsRes.data) setSessionItems(itemsRes.data)
    }
    const callsRes = await getCallQueue()
    if (callsRes.data) setBdmCalls(callsRes.data)
    const fuRes = await getFollowUps('pending')
    if (fuRes.data) setFollowUps(fuRes.data)
    const compRes = await getCompanies()
    if (compRes.data) setAllCompanies(compRes.data)

    if (selectedItem) {
      // Re-find selected item to update its state
      const updated = sessionItems.find(i => i.company_id === selectedItem.company_id)
      if (updated) setSelectedItem(updated)
    }
  }

  const handleAddProspectsSubmit = async () => {
    if (selectedCompanyIds.size === 0 || !session) return
    const ids = Array.from(selectedCompanyIds)
    const res = await addCompaniesToSession(session.id, ids)
    if (res.error) {
      addToast('error', res.error)
    } else {
      addToast('success', `Added ${ids.length} prospects to today's queue`)
      setAddProspectsOpen(false)
      setSelectedCompanyIds(new Set())
      refreshData()
    }
  }

  const handleRemoveProspect = async (companyId: string) => {
    if (!session) return
    const res = await removeCompanyFromSession(session.id, companyId)
    if (res.error) {
      addToast('error', res.error)
    } else {
      addToast('success', 'Prospect removed from today\'s queue')
      if (selectedItem?.company_id === companyId) setSelectedItem(null)
      refreshData()
    }
  }

  const handleLogCallSubmit = async () => {
    if (!selectedCallItem) return
    setIsLoggingCall(true)
    try {
      const res = await completeCallTask({
        callQueueId: selectedCallItem.id,
        companyId: selectedCallItem.company_id,
        contactId: selectedCallItem.contact_id || undefined,
        outcome: callOutcome as any,
        notes: callNotes,
        durationSeconds: parseInt(callDuration) || 0,
        followUpDate: callFollowUpDate || undefined
      })
      if (res.error) {
        addToast('error', res.error)
      } else {
        addToast('success', 'Call task logged successfully')
        setCallLogOpen(false)
        setSelectedCallItem(null)
        setCallNotes('')
        setCallFollowUpDate('')
        refreshData()
      }
    } catch (err) {
      addToast('error', 'Failed to log call task')
    } finally {
      setIsLoggingCall(false)
    }
  }

  // Filter prospects for addition modal
  const filteredAvailableCompanies = allCompanies.filter(comp => {
    const isAlreadyInSession = sessionItems.some(item => item.company_id === comp.id)
    if (isAlreadyInSession) return false
    const matchSearch = comp.company_name.toLowerCase().includes(companySearch.toLowerCase()) || 
                        comp.contacts?.[0]?.full_name?.toLowerCase().includes(companySearch.toLowerCase())
    return matchSearch
  })

  // Calculated Dashboard Metrics
  const todayDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const todayProspectsCount = sessionItems.length
  const outreachCompletedCount = sessionItems.filter(i => i.status === 'sent').length
  const outreachRemainingCount = todayProspectsCount - outreachCompletedCount

  const filteredCalls = bdmCalls.filter(call => {
    if (call.status !== 'pending' && call.status !== 'in_progress') return false
    const callDateStr = call.queued_at.split('T')[0]
    return callDateStr <= selectedDate
  })
  const pendingCallsCount = filteredCalls.filter(c => c.status === 'pending').length
  const completedCallsCount = bdmCalls.filter(c => c.status === 'completed').length

  const todayFollowUps = followUps.filter(f => f.due_date === new Date().toISOString().split('T')[0])
  const overdueFollowUps = followUps.filter(f => f.due_date < new Date().toISOString().split('T')[0])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-brand-teal mx-auto mb-4" />
          <p className="text-text-secondary text-sm">Loading Daily Cadence Command Center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 page-enter">
      <ToastContainer />

      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Zap className="h-6 w-6 text-brand-gold animate-pulse-soft" />
            Daily Cadence Command Center
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-text-secondary text-xs">
              Running day workflow for:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedItem(null);
              }}
              className="text-xs border border-border rounded-lg p-1.5 focus:outline-none focus:ring-2 focus:ring-brand-teal bg-white font-bold text-text-primary hover:border-brand-teal transition-colors cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Execution Areas */}
      {selectedItem ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 border border-border rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-secondary">Workspace / </span>
              <span className="text-xs font-bold text-brand-teal">{selectedItem.companies?.company_name}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshData}
                className="text-xs text-text-secondary hover:text-brand-teal"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="text-xs border-border text-text-secondary hover:bg-cream-dark"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
          <ProspectWorkspace
            company={selectedItem.companies}
            contact={selectedItem.companies?.contacts?.[0] || {}}
            preparations={selectedItem.outreach_preparations ? [selectedItem.outreach_preparations] : []}
            activities={selectedItem.companies?.activities || []}
            sessionId={session?.id}
            currentUserRole={currentRole}
            onClose={() => setSelectedItem(null)}
            onUpdate={refreshData}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Workflow Accordions */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. TODAY'S PENDING OUTREACH */}
            <Card className="border-border bg-white shadow-sm overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 border-b border-border/60 cursor-pointer hover:bg-slate-50/50 transition-all select-none"
                onClick={() => setExpandOutreach(!expandOutreach)}
              >
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-brand-teal" />
                  <span className="text-sm font-bold text-text-primary">Today's Pending Outreach ({sessionItems.filter(item => item.status !== 'sent').length})</span>
                </div>
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <Link href="/daily-cadence/bulk-proposals">
                      <Button size="sm" className="bg-brand-gold hover:bg-brand-gold/90 text-white text-xs hover-lift px-2.5 h-8">
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Bulk Proposals
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => setAddProspectsOpen(true)}
                      className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs hover-lift px-2.5 h-8"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Prospects
                    </Button>
                  </div>
                  <button onClick={() => setExpandOutreach(!expandOutreach)} className="text-text-muted hover:text-brand-teal">
                    {expandOutreach ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {expandOutreach && (
                <CardContent className="p-0">
                  {sessionItems.filter(item => item.status !== 'sent').length === 0 ? (
                    <div className="p-10 text-center text-xs">
                      <Users className="h-8 w-8 text-text-muted mx-auto mb-2 opacity-40" />
                      <p className="text-text-secondary mb-2">No pending outreach targets.</p>
                      <Button size="sm" onClick={() => setAddProspectsOpen(true)} className="bg-brand-teal text-white text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Add Prospects
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border-light">
                      {sessionItems.filter(item => item.status !== 'sent').map(item => {
                        const contact = item.companies?.contacts?.[0]
                        const proposal = item.outreach_preparations
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 hover:bg-slate-50/50 cursor-pointer transition-colors"
                            onClick={() => setSelectedItem(item)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-brand-teal-light text-brand-teal">
                                <Play className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-text-primary">{item.companies?.company_name}</span>
                                  <span className="text-xs text-text-secondary">· {contact?.full_name || 'No Contact'}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted">
                                  <span>{item.companies?.industry || 'General'}</span>
                                  <span>·</span>
                                  <span>{item.companies?.city || 'Muscat'}</span>
                                  {proposal && (
                                    <>
                                      <span>·</span>
                                      <span className="font-semibold text-brand-gold">Proposal: {proposal.status}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedItem(item)}
                                className="text-xs text-brand-teal hover:underline"
                              >
                                Open Workspace <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveProspect(item.company_id)}
                                className="h-7 w-7 text-text-muted hover:text-red-500"
                              >
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* 2. OUTREACH INITIATED TODAY */}
            <Card className="border-border bg-white shadow-sm overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 border-b border-border/60 cursor-pointer hover:bg-slate-50/50 transition-all select-none"
                onClick={() => setExpandInitiated(!expandInitiated)}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-bold text-text-primary">Outreach Initiated Today ({sessionItems.filter(item => item.status === 'sent').length})</span>
                </div>
                <button className="text-text-muted hover:text-brand-teal">
                  {expandInitiated ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>

              {expandInitiated && (
                <CardContent className="p-0">
                  {sessionItems.filter(item => item.status === 'sent').length === 0 ? (
                    <p className="p-8 text-center text-xs text-text-muted">No outreach initiated yet today.</p>
                  ) : (
                    <div className="divide-y divide-border-light">
                      {sessionItems.filter(item => item.status === 'sent').map(item => {
                        const contact = item.companies?.contacts?.[0]
                        const proposal = item.outreach_preparations
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 hover:bg-slate-50/50 cursor-pointer transition-colors"
                            onClick={() => setSelectedItem(item)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-green-100 text-green-700">
                                <CheckCircle className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-text-primary">{item.companies?.company_name}</span>
                                  <span className="text-xs text-text-secondary">· {contact?.full_name || 'No Contact'}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted">
                                  <span>{item.companies?.industry || 'General'}</span>
                                  <span>·</span>
                                  <span>{item.companies?.city || 'Muscat'}</span>
                                  {proposal && (
                                    <>
                                      <span>·</span>
                                      <span className="font-semibold text-brand-gold">Proposal: {proposal.status}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedItem(item)}
                                className="text-xs text-brand-teal hover:underline"
                              >
                                Open Workspace <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* 3. BDM CLOSER CALL QUEUE */}
            <Card className="border-border bg-white shadow-sm overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 border-b border-border/60 cursor-pointer hover:bg-slate-50/50 transition-all select-none"
                onClick={() => setExpandCalls(!expandCalls)}
              >
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-bold text-text-primary">BDM Closer Call Queue ({filteredCalls.length})</span>
                </div>
                <button className="text-text-muted hover:text-brand-teal">
                  {expandCalls ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>

              {expandCalls && (
                <CardContent className="p-0">
                  {filteredCalls.length === 0 ? (
                    <div className="p-10 text-center text-xs text-text-muted">Call queue is empty. Nice work!</div>
                  ) : (
                    <div className="divide-y divide-border-light">
                      {filteredCalls.map(call => {
                        const company = call.companies
                        const contact = call.contacts
                        return (
                          <div key={call.id} className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                                <PhoneCall className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-text-primary">{company?.company_name}</span>
                                  <span className="text-text-secondary">· {contact?.full_name}</span>
                                </div>
                                <p className="text-[10px] text-text-muted mt-0.5">Phone: {contact?.phone || 'No phone'} · Queued: {new Date(call.queued_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                onClick={() => { setSelectedCallItem(call); setCallLogOpen(true); }}
                                className="bg-brand-teal hover:bg-brand-teal-dark text-white text-xs hover-lift h-8 px-3"
                              >
                                Log Outcome
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* 4. TODAY'S CADENCE FOLLOW-UPS */}
            <Card className="border-border bg-white shadow-sm overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 border-b border-border/60 cursor-pointer hover:bg-slate-50/50 transition-all select-none"
                onClick={() => setExpandFollowUps(!expandFollowUps)}
              >
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-bold text-text-primary">Today's Cadence Follow-ups ({todayFollowUps.length})</span>
                </div>
                <button className="text-text-muted hover:text-brand-teal">
                  {expandFollowUps ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>

              {expandFollowUps && (
                <CardContent className="p-0">
                  {todayFollowUps.length === 0 ? (
                    <p className="p-8 text-center text-xs text-text-muted">No follow-ups due today.</p>
                  ) : (
                    <div className="divide-y divide-border-light text-xs">
                      {todayFollowUps.map(fu => (
                        <div key={fu.id} className="p-3.5 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-text-primary">{fu.subject}</p>
                            <p className="text-[10px] text-text-secondary mt-0.5">{fu.companies?.company_name} · {fu.contacts?.full_name}</p>
                          </div>
                          <Badge className="bg-purple-100 text-purple-700 capitalize">{fu.channel}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* 5. TEAM OPERATIONAL CONVERSION METRICS */}
            <Card className="border-border bg-white shadow-sm overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 border-b border-border/60 cursor-pointer hover:bg-slate-50/50 transition-all select-none"
                onClick={() => setExpandMetrics(!expandMetrics)}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#0D4F4F]" />
                  <span className="text-sm font-bold text-text-primary">Team Operational Conversion Metrics</span>
                </div>
                <button className="text-text-muted hover:text-brand-teal">
                  {expandMetrics ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>

              {expandMetrics && (
                <CardContent className="pt-4 pb-6 px-6 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-50 border border-border-light rounded-xl">
                      <p className="text-lg font-bold text-brand-teal">{todayProspectsCount}</p>
                      <p className="text-[10px] text-text-muted uppercase font-bold">Cadence Targets</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-border-light rounded-xl">
                      <p className="text-lg font-bold text-green-600">
                        {todayProspectsCount > 0 ? `${Math.round((outreachCompletedCount / todayProspectsCount) * 100)}%` : '0%'}
                      </p>
                      <p className="text-[10px] text-text-muted uppercase font-bold">SDR Send Rate</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-border-light rounded-xl">
                      <p className="text-lg font-bold text-amber-600">{completedCallsCount}</p>
                      <p className="text-[10px] text-text-muted uppercase font-bold">BDM Calls Done</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-border-light rounded-xl">
                      <p className="text-lg font-bold text-brand-gold">{sessionItems.filter(i => i.outreach_preparations?.status === 'sent').length}</p>
                      <p className="text-[10px] text-text-muted uppercase font-bold">Proposals Sent</p>
                    </div>
                  </div>

                  <div className="border-t border-border-light pt-4 space-y-2">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Audit logs & History Archive</h4>
                    <p className="text-xs text-text-secondary">Historical operational reports are saved automatically.</p>
                    <Link href="/daily-cadence/history">
                      <Button size="sm" variant="outline" className="border-border text-xs text-brand-teal bg-white hover:bg-slate-50">
                        Open Daily History Archives
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              )}
            </Card>

          </div>

          {/* Right Column: High-priority panels */}
          <div className="lg:col-span-1 space-y-6">
            {/* Overdue Workspace Actions */}
            <Card className="border-border bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-base font-bold text-red-600 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse-soft" />
                  Overdue Actions ({overdueFollowUps.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {overdueFollowUps.length === 0 ? (
                  <p className="p-6 text-center text-xs text-text-muted">No overdue follow-up tasks. Great tracking!</p>
                ) : (
                  <div className="divide-y divide-border-light text-xs">
                    {overdueFollowUps.slice(0, 5).map(fu => (
                      <div key={fu.id} className="p-3">
                        <p className="font-bold text-red-950">{fu.subject}</p>
                        <p className="text-[10px] text-red-800 mt-0.5">Due: {fu.due_date} · {fu.companies?.company_name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Default Cadence Delay Reference */}
            <Card className="border-border bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-xs font-bold text-text-primary uppercase tracking-wider">Cadence Delays & Configuration</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 text-[11px] text-text-secondary space-y-2">
                <p>Default intervals are computed automatically upon marking outreach sent:</p>
                <div className="space-y-1">
                  <div className="flex justify-between"><span>WhatsApp Interval:</span><span className="font-bold text-text-primary">3 Days</span></div>
                  <div className="flex justify-between"><span>LinkedIn Interval:</span><span className="font-bold text-text-primary">4 Days</span></div>
                  <div className="flex justify-between"><span>Email Interval:</span><span className="font-bold text-text-primary">5 Days</span></div>
                  <div className="flex justify-between"><span>BDM Call Callback:</span><span className="font-bold text-text-primary">2 Days</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Add Prospects Modal Dialog */}
      <Dialog open={addProspectsOpen} onClose={() => setAddProspectsOpen(false)} className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Prospects to Today's Cadence</DialogTitle>
          <DialogClose onClick={() => setAddProspectsOpen(false)} />
        </DialogHeader>
        <DialogContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
            <Input
              placeholder="Search prospects in database..."
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto border border-border rounded-xl divide-y divide-border-light bg-slate-50">
            {filteredAvailableCompanies.length === 0 ? (
              <p className="p-8 text-center text-xs text-text-muted">No prospects available to add.</p>
            ) : (
              filteredAvailableCompanies.map(comp => (
                <label
                  key={comp.id}
                  className="flex items-center gap-3 p-3 hover:bg-cream-dark/20 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedCompanyIds.has(comp.id)}
                    onChange={() => {
                      const updated = new Set(selectedCompanyIds)
                      if (updated.has(comp.id)) updated.delete(comp.id)
                      else updated.add(comp.id)
                      setSelectedCompanyIds(updated)
                    }}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <p className="font-bold text-text-primary">{comp.company_name}</p>
                    <p className="text-[10px] text-text-secondary">{comp.contacts?.[0]?.full_name || 'No Primary Contact'} · {comp.industry || 'General'}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setAddProspectsOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddProspectsSubmit}
            disabled={selectedCompanyIds.size === 0}
            className="bg-brand-teal hover:bg-brand-teal-dark text-white"
          >
            Add {selectedCompanyIds.size} Prospects
          </Button>
        </DialogFooter>
      </Dialog>

      {/* BDM Call Outcome Modal Dialog */}
      <Dialog open={callLogOpen} onClose={() => { setCallLogOpen(false); setSelectedCallItem(null); }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5">
            <PhoneCall className="h-5 w-5 text-amber-600" />
            Log BDM Call Outcome
          </DialogTitle>
          <DialogClose onClick={() => { setCallLogOpen(false); setSelectedCallItem(null); }} />
        </DialogHeader>
        <DialogContent className="space-y-4">
          {selectedCallItem && (
            <div className="text-xs p-3 bg-slate-50 border border-border-light rounded-xl">
              <span className="font-bold text-text-primary">{selectedCallItem.companies?.company_name}</span>
              <p className="text-text-secondary mt-0.5">Contact: {selectedCallItem.contacts?.full_name} · Phone: {selectedCallItem.contacts?.phone}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-text-muted uppercase mb-1 block">Call Duration (seconds)</label>
              <Input
                type="number"
                value={callDuration}
                onChange={(e) => setCallDuration(e.target.value)}
                placeholder="60"
              />
            </div>
            <div>
              <label className="text-[10px] font-extrabold text-text-muted uppercase mb-1 block">Outcome *</label>
              <Select
                options={[
                  { value: 'connected', label: 'Connected' },
                  { value: 'no_answer', label: 'No Answer' },
                  { value: 'callback_requested', label: 'Callback Requested' },
                  { value: 'interested', label: 'Interested / Warm' },
                  { value: 'not_interested', label: 'Not Interested' },
                  { value: 'meeting_booked', label: 'Meeting Booked' },
                  { value: 'proposal_required', label: 'Proposal Required' }
                ]}
                value={callOutcome}
                onChange={(e: any) => setCallOutcome(e.target.value)}
              />
            </div>
          </div>

          {['callback_requested', 'meeting_booked', 'connected', 'interested'].includes(callOutcome) && (
            <div>
              <label className="text-[10px] font-extrabold text-text-muted uppercase mb-1 block">Scheduled Follow-up / Meeting Date</label>
              <Input
                type="date"
                value={callFollowUpDate}
                onChange={(e) => setCallFollowUpDate(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-extrabold text-text-muted uppercase mb-1 block">Call Discussion Notes</label>
            <textarea
              rows={3}
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              className="w-full text-xs border border-border rounded-lg p-2.5 bg-slate-50 focus:ring-2 focus:ring-brand-teal focus:outline-none"
              placeholder="Provide a summary of the discussion..."
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <Button variant="ghost" onClick={() => { setCallLogOpen(false); setSelectedCallItem(null); }}>Cancel</Button>
          <Button
            disabled={isLoggingCall}
            onClick={handleLogCallSubmit}
            className="bg-brand-teal hover:bg-brand-teal-dark text-white"
          >
            {isLoggingCall ? 'Saving...' : 'Complete Call & Update Cadence'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
