'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  History, ArrowLeft, Calendar, Loader2, CheckCircle, PhoneCall,
  Mail, MessageCircle, Send, FileText, ArrowRight, Zap, RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { addToast, ToastContainer } from '@/components/ui/toast'
import { getDailyHistory } from '@/lib/actions/cadence'

export default function DailyHistoryPage() {
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [historyData, setHistoryData] = useState<any>(null)

  // Default to today
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    setSelectedDate(todayStr)
  }, [])

  const fetchHistory = useCallback(async (dateStr: string) => {
    if (!dateStr) return
    setLoading(true)
    try {
      const res = await getDailyHistory(dateStr)
      if (res.error) {
        addToast('error', res.error)
      } else {
        setHistoryData(res.data)
      }
    } catch (err) {
      addToast('error', 'Failed to retrieve historical data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchHistory(selectedDate)
    }
  }, [selectedDate, fetchHistory])

  // Calculated summary metrics for the selected date
  const scheduledCount = historyData?.scheduledItems?.length || 0
  const touchesSentCount = historyData?.touches?.length || 0
  const callsCompletedCount = historyData?.calls?.length || 0
  const followUpsCreatedCount = historyData?.followUps?.length || 0

  return (
    <div className="space-y-6 page-enter">
      <ToastContainer />

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
              <History className="h-6 w-6 text-brand-teal" />
              Daily Cadence History Archives
            </h1>
            <p className="text-text-secondary text-sm mt-1">
              Select a date to audit historical snapshots of SDR and BDM operations
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 bg-white p-2 border border-border rounded-xl">
          <Calendar className="h-4 w-4 text-brand-teal ml-1" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-none bg-transparent p-0 text-xs font-semibold focus:ring-0 w-32 focus:outline-none"
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => fetchHistory(selectedDate)}
            className="h-7 w-7 text-text-secondary hover:text-brand-teal"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 text-brand-teal mx-auto mb-4" />
            <p className="text-text-secondary text-sm">Querying historical records...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border bg-white shadow-sm">
              <CardContent className="p-4">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold block">Prospects Scheduled</span>
                <p className="text-2xl font-bold text-text-primary mt-1">{scheduledCount}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-white shadow-sm">
              <CardContent className="p-4">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold block">Outreach Completed</span>
                <p className="text-2xl font-bold text-green-600 mt-1">{touchesSentCount}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-white shadow-sm">
              <CardContent className="p-4">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold block">BDM Calls Completed</span>
                <p className="text-2xl font-bold text-amber-600 mt-1">{callsCompletedCount}</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-white shadow-sm">
              <CardContent className="p-4">
                <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold block">Follow-ups Set</span>
                <p className="text-2xl font-bold text-purple-600 mt-1">{followUpsCreatedCount}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scheduled Targets Status List */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-border bg-white shadow-sm">
                <CardHeader className="border-b border-border/60 pb-3">
                  <CardTitle className="text-base font-bold text-text-primary">Scheduled Cadence Snapshots</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {scheduledCount === 0 ? (
                    <p className="p-8 text-center text-xs text-text-muted">No prospects were scheduled for this date.</p>
                  ) : (
                    <div className="divide-y divide-border-light text-xs">
                      {historyData?.scheduledItems?.map((item: any) => (
                        <div key={item.id} className="p-3.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-text-primary">{item.companies?.company_name}</span>
                            <span className="text-text-secondary text-[11px] ml-2">· {item.companies?.contacts?.[0]?.full_name || 'No Contact'}</span>
                          </div>
                          <Badge className={
                            item.status === 'sent' ? 'bg-green-100 text-green-700' :
                            item.status === 'skipped' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-700'
                          }>
                            {item.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Outreach Touches Sent */}
              <Card className="border-border bg-white shadow-sm">
                <CardHeader className="border-b border-border/60 pb-3">
                  <CardTitle className="text-base font-bold text-text-primary">Outreach Actions Executed</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {touchesSentCount === 0 ? (
                    <p className="p-8 text-center text-xs text-text-muted">No outreach was logged sent on this date.</p>
                  ) : (
                    <div className="divide-y divide-border-light text-xs">
                      {historyData?.touches?.map((touch: any) => (
                        <div key={touch.id} className="p-3.5 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-text-primary">{touch.companies?.company_name || 'Unknown Company'}</span>
                            <p className="text-[10px] text-text-secondary mt-0.5">Touch Step {touch.step_number} · Sent at: {new Date(touch.sent_at).toLocaleTimeString()}</p>
                          </div>
                          <Badge className="bg-brand-teal text-white capitalize">{touch.channel}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Calls and activities */}
            <div className="lg:col-span-1 space-y-6">
              {/* Calls Completed */}
              <Card className="border-border bg-white shadow-sm">
                <CardHeader className="border-b border-border/60 pb-3">
                  <CardTitle className="text-base font-bold text-text-primary">BDM Calls Completed</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {callsCompletedCount === 0 ? (
                    <p className="p-6 text-center text-xs text-text-muted">No calls completed on this date.</p>
                  ) : (
                    <div className="divide-y divide-border-light text-xs">
                      {historyData?.calls?.map((call: any) => (
                        <div key={call.id} className="p-3">
                          <p className="font-bold text-text-primary">{call.companies?.company_name || 'Unknown Company'}</p>
                          <p className="text-[10px] text-text-secondary mt-0.5">Outcome: <span className="font-semibold">{call.outcome}</span> · Duration: {call.duration_seconds}s</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CRM Activity Timeline */}
              <Card className="border-border bg-white shadow-sm">
                <CardHeader className="border-b border-border/60 pb-3">
                  <CardTitle className="text-base font-bold text-text-primary">CRM Timeline Activity Logs</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {historyData?.activities?.length === 0 ? (
                    <p className="p-6 text-center text-xs text-text-muted">No CRM logs created on this date.</p>
                  ) : (
                    <div className="divide-y divide-border-light text-xs max-h-[300px] overflow-y-auto pr-2">
                      {historyData?.activities?.map((act: any) => (
                        <div key={act.id} className="p-3">
                          <p className="font-bold text-text-primary">{act.title}</p>
                          <p className="text-[10px] text-text-secondary mt-0.5">{act.description} · {act.companies?.company_name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
