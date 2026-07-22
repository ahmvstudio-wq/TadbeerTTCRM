'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, X, ChevronLeft, ChevronRight, Layers, Presentation, ShieldCheck, Sparkles, Building2, Globe, Phone, Mail, ExternalLink, CheckCircle2, ArrowRight, Star, AlertCircle, Wrench, Trophy } from 'lucide-react'
import { CaseStudy, ApprovedClientLogo, CASE_STUDIES_LIBRARY, APPROVED_CLIENT_LOGOS, getRecommendedCaseStudies, getRecommendedClientLogos } from '@/lib/credibility-library'
import { cn } from '@/lib/utils'

// ── Proposal Data Model ──────────────────────────────────────────
export interface HeroStat {
  value: string
  unit: string
  label: string
}

export interface ContextualMetric {
  value: string
  label: string
  context: string
  source?: string
}

export interface DiagnosisCard {
  type: 'LEAK' | 'RISK' | 'GAP'
  title: string
  description: string
  impact?: string
  visualType?: 'card' | 'bottleneck' | 'matrix'
}

export interface PhaseCard {
  phaseNum: number
  title: string
  description: string
  timeline?: string
  intervention?: string
  futureState?: string
}

export interface SolutionScreenshot {
  url: string
  caption: string
}

export interface AdditionalSection {
  title: string
  content: string[]
}

export interface ProposalData {
  coverTitleFormat?: string
  tagline: string
  subtitle: string
  specificObservation?: string
  prospectLogoUrl?: string
  preparedDate?: string

  executiveSummaryText?: string
  heroStats: HeroStat[]
  contextualMetrics?: ContextualMetric[]

  aboutTadbeerContext?: string

  selectedCaseStudies?: CaseStudy[]
  selectedClientLogos?: ApprovedClientLogo[]

  diagnosisIntro: string
  leaks: DiagnosisCard[]

  solutionIntro: string
  phases: PhaseCard[]
  solutionScreenshots?: SolutionScreenshot[]

  ctaHeading?: string
  ctaSubtext?: string
  ctaUrl?: string
  ctaPhone?: string
  ctaEmail?: string
  proposalValidUntil: string

  additionalSections: AdditionalSection[]
}

interface ProposalPreviewProps {
  company: {
    id?: string
    company_name: string
    industry?: string
    city?: string
    country?: string
  }
  contact: {
    full_name: string
    title?: string
  }
  proposalData: ProposalData
  onClose?: () => void
}

// ── Simple Natural Default Factory ──────────────────────────────────────────
export function createDefaultProposalData(companyName: string, industry: string, contactName: string): ProposalData {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 30)
  const preparedStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const validStr = futureDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const recommendedStudies = getRecommendedCaseStudies(industry, 2)
  const recommendedLogos = getRecommendedClientLogos(industry, 6)

  return {
    coverTitleFormat: `Tadbeer × ${companyName}`,
    tagline: `A Simple Roadmap to Help ${companyName} Save Time & Grow Faster`,
    subtitle: `A practical operational plan built specifically for ${companyName}. We looked closely at your customer flow and daily operations to show how simple connected systems can remove bottlenecks and boost results.`,
    preparedDate: preparedStr,
    
    aboutTadbeerContext: `Tadbeer TT is an Omani consulting and technology partner based in Madinat Qaboos, Muscat. We help growing GCC businesses connect their daily operations, software, customer communications, and team workflows in simple, effective ways.`,
    
    selectedCaseStudies: recommendedStudies,
    selectedClientLogos: recommendedLogos,

    executiveSummaryText: `In reviewing ${companyName}'s current workflow, we saw great opportunities to make daily customer orders and internal handovers smoother. By connecting customer inquiries on WhatsApp, Instagram, and phone with a simple central dashboard, ${companyName} can respond faster and ensure no customer is left behind.`,

    contextualMetrics: [
      { value: '3x Faster', label: 'Response Speed', context: 'Faster answers to customer questions via automated WhatsApp helpers.', source: 'Growth Benchmark' },
      { value: 'Zero Lost', label: 'Customer Inquiries', context: 'Central tracking so every single lead and inquiry is handled on time.', source: 'Operational Audit' },
      { value: '100% Clear', label: 'Team Visibility', context: 'Real-time dashboard replacing manual chats and spreadsheets.', source: 'Internal Workflow' },
    ],

    heroStats: [
      { value: '3x', unit: 'Faster', label: 'Response Velocity' },
      { value: '35%', unit: 'Reduction', label: 'Manual Admin Time' },
      { value: '100%', unit: 'Visibility', label: 'Order & Lead Tracking' },
      { value: '25%', unit: 'Growth', label: 'Repeat Sales Capacity' },
    ],

    diagnosisIntro: `Here are 3 key areas where ${companyName} can save time, improve customer satisfaction, and prevent dropped orders:`,
    leaks: [
      {
        type: 'LEAK',
        title: 'Manual Task & Order Handovers',
        description: `Currently, tasks and customer orders rely on manual messages and phone calls, which cause delays during busy peak hours.`,
        impact: 'High Priority · Time Bottleneck',
        visualType: 'card'
      },
      {
        type: 'RISK',
        title: 'Scattered Customer Records',
        description: `Customer details and order history live across separate chats and notebooks, making it hard to track repeat buyers.`,
        impact: 'Key Focus · Scattered Data',
        visualType: 'card'
      },
      {
        type: 'GAP',
        title: 'Manual Customer Follow-ups',
        description: `Without automated reminders, follow-ups depend on staff memory during busy days, leading to missed sales opportunities.`,
        impact: 'Simple Fix · Missed Follow-ups',
        visualType: 'card'
      },
    ],

    solutionIntro: `Directly addressing the 3 problem areas above, here is our simple 3-step implementation plan designed for ${companyName}:`,
    phases: [
      {
        phaseNum: 1,
        title: 'Step 1: Discovery & Workflow Audit (Days 1 – 14)',
        description: `We review your team's exact daily routines, identify where manual order steps cause delays, and design a clean setup plan with zero disruption to daily work.`,
        intervention: 'Map your team workflow & create a clear setup blueprint.',
        futureState: 'Complete clarity on opportunities with zero downtime for your business.',
        timeline: 'Days 1 – 14',
      },
      {
        phaseNum: 2,
        title: 'Step 2: Connected Dashboard & Staff Training (Days 15 – 45)',
        description: `We set up your central operating dashboard, connect WhatsApp & Instagram inquiry channels, and conduct step-by-step hands-on training for your team.`,
        intervention: 'Connect WhatsApp, set up quick templates & train staff.',
        futureState: 'All customer chats organized in one place with staff trained to use it effortlessly.',
        timeline: 'Days 15 – 45',
      },
      {
        phaseNum: 3,
        title: 'Step 3: Live Launch & Local Muscat Support (Days 46 – 90)',
        description: `We launch the system live, activate automated customer re-order reminders (for seasonal collections & drops), and provide dedicated local support in Muscat.`,
        intervention: 'Go live, activate automated reminders & weekly monitoring.',
        futureState: 'Faster internal coordination, zero lost orders, and predictable repeat sales growth.',
        timeline: 'Days 46 – 90',
      },
    ],

    solutionScreenshots: [],

    ctaHeading: 'Let’s Review This Together in a 30-Minute Meeting',
    ctaSubtext: 'We can walk you through these simple suggestions, answer any questions, and show you a working demonstration.',
    ctaUrl: 'https://www.tadbeertt.com',
    ctaPhone: '+968 7630 7656',
    ctaEmail: 'operation@tadbeertt.com',
    proposalValidUntil: validStr,

    additionalSections: [],
  }
}

// ── Legacy content migration with clean natural language ────────────────────────────────
export function migrateFromLegacy(rawText: string, companyName: string, industry: string, contactName: string): ProposalData {
  const defaults = createDefaultProposalData(companyName, industry, contactName)
  if (!rawText || !rawText.trim()) return defaults

  if (rawText.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawText) as ProposalData
      return {
        ...defaults,
        ...parsed,
        coverTitleFormat: parsed.coverTitleFormat || `Tadbeer × ${companyName}`,
        selectedCaseStudies: parsed.selectedCaseStudies && parsed.selectedCaseStudies.length > 0 ? parsed.selectedCaseStudies : defaults.selectedCaseStudies,
        selectedClientLogos: parsed.selectedClientLogos && parsed.selectedClientLogos.length > 0 ? parsed.selectedClientLogos : defaults.selectedClientLogos,
        contextualMetrics: parsed.contextualMetrics && parsed.contextualMetrics.length > 0 ? parsed.contextualMetrics : defaults.contextualMetrics,
        aboutTadbeerContext: parsed.aboutTadbeerContext || defaults.aboutTadbeerContext,
        executiveSummaryText: parsed.executiveSummaryText || defaults.executiveSummaryText,
      }
    } catch {
      // fall through
    }
  }

  defaults.additionalSections.push({
    title: 'Additional Notes & Context',
    content: rawText.split('\n').filter(l => l.trim()),
  })
  return defaults
}

const DIAG_COLORS: Record<string, { border: string; bg: string; text: string; badge: string; severity: string; score: string }> = {
  LEAK: { border: '#EF4444', bg: '#FEF2F2', text: '#991B1B', badge: '#EF4444', severity: 'High Priority', score: '85%' },
  RISK: { border: '#F59E0B', bg: '#FFFBEB', text: '#92400E', badge: '#F59E0B', severity: 'Key Focus Area', score: '72%' },
  GAP:  { border: '#3B82F6', bg: '#EFF6FF', text: '#1E40AF', badge: '#3B82F6', severity: 'Simple Fix', score: '60%' },
}

// Helper to pick varying case studies dynamically from tadbeertt.com
function getVaryingCaseStudies(companyName: string, industry?: string): CaseStudy[] {
  const all = CASE_STUDIES_LIBRARY
  if (!all || all.length === 0) return []
  
  let hash = 0
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const idx1 = Math.abs(hash) % all.length
  const idx2 = (idx1 + 2) % all.length
  return [all[idx1], all[idx2]]
}

export function ProposalPdfPreview({ company, contact, proposalData, onClose }: ProposalPreviewProps) {
  const d = proposalData
  const [activeSlide, setActiveSlide] = useState(0)
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const coverTitle = (d.coverTitleFormat || `Tadbeer × ${company.company_name}`).replace('{company}', company.company_name)

  // Use varying case studies dynamically from tadbeertt.com
  const varyingCaseStudies = getVaryingCaseStudies(company.company_name, company.industry)
  const clientLogos = APPROVED_CLIENT_LOGOS

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const caseStudiesHtml = varyingCaseStudies.map(cs => `
      <div class="cs-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span class="cs-badge">${cs.industry.toUpperCase()}</span>
          <span style="font-size: 8px; font-weight: 800; color: #10B981; background: #ECFDF5; padding: 2px 6px; border-radius: 4px;">PROVEN OMAN RESULT</span>
        </div>
        <h3 class="cs-title">${cs.title}</h3>
        <p class="cs-desc"><strong>Client Partner:</strong> ${cs.clientName}</p>
        <p class="cs-desc"><strong>The Challenge:</strong> ${cs.problemSummary}</p>
        <p class="cs-desc"><strong>Our Solution:</strong> ${cs.solutionSummary}</p>
        <div class="cs-outcome"><strong>Outcome:</strong> ${cs.outcome}</div>
        <div class="cs-metrics-row">
          ${cs.metrics.map(m => `
            <div class="cs-metric">
              <span class="cs-val">${m.value}</span>
              <span class="cs-lbl">${m.label}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('')

    const clientLogosHtml = clientLogos.map(l => `
      <div class="client-logo-box">
        <span class="client-name">${l.clientName}</span>
      </div>
    `).join('')

    const metricsHtml = (d.heroStats && d.heroStats.length > 0 ? d.heroStats : [
      { value: '3x Faster', unit: 'Speed', label: 'Response Velocity' },
      { value: 'Zero Lost', unit: 'Leads', label: 'Follow-up Guarantee' },
      { value: '3 Steps', unit: 'Plan', label: 'Simple Transition' },
      { value: '1 System', unit: 'Unified', label: 'Clear Team Visibility' }
    ]).map(m => `
      <div class="context-metric-card">
        <div class="cm-val">${m.value}</div>
        <div class="cm-lbl">${m.label}</div>
        <div class="cm-ctx">${m.unit ? `${m.unit} focus to make daily work easier and faster for your team.` : 'System simplicity achieved.'}</div>
      </div>
    `).join('')

    const diagCardsHtml = d.leaks.map((l) => {
      const c = DIAG_COLORS[l.type] || DIAG_COLORS.LEAK
      return `
        <div class="diag-card" style="border-left: 4px solid ${c.border}; background: ${c.bg}; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="diag-badge" style="background: ${c.badge};">${l.type}</span>
              <span style="font-size: 8.5px; font-weight: 800; color: ${c.text}; text-transform: uppercase;">${l.impact || c.severity}</span>
            </div>
            <h3 class="diag-title" style="color: ${c.text};">${l.title}</h3>
            <p class="diag-desc">${l.description}</p>
          </div>

          <div class="infographic-meter-wrapper" style="margin-top: 12px; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 8px; font-weight: 700; color: #4B5563; margin-bottom: 4px;">
              <span>IMPACT & OPPORTUNITY SCORE</span>
              <span>${c.score}</span>
            </div>
            <div class="infographic-meter-track">
              <div class="infographic-meter-fill" style="width: ${c.score}; background: ${c.border};"></div>
            </div>
          </div>
        </div>
      `
    }).join('')

    const phaseCardsHtml = d.phases.map(p => `
      <div class="phase-card" style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; min-height: 240px; padding: 18px;">
        <div>
          <div class="phase-card-header" style="margin-bottom: 8px;">
            <span class="phase-num">STEP ${String(p.phaseNum).padStart(2, '0')}</span>
            ${p.timeline ? `<span class="phase-timeline-badge">${p.timeline}</span>` : ''}
          </div>
          <h3 class="phase-title" style="font-size: 15px; margin-bottom: 8px; line-height: 1.35;">${p.title}</h3>
          <p class="phase-desc" style="font-size: 10.5px; line-height: 1.6; margin-bottom: 12px;">${p.description}</p>
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${p.intervention ? `<div class="phase-detail" style="font-size: 9px; padding: 7px 10px;"><strong>What We Do:</strong> ${p.intervention}</div>` : ''}
          ${p.futureState ? `<div class="phase-detail" style="background:#ECFDF5; border-color:#A7F3D0; color:#065F46; font-size: 9px; padding: 7px 10px;"><strong>Result for Your Team:</strong> ${p.futureState}</div>` : ''}
        </div>
      </div>
    `).join('')

    const additionalPagesHtml = d.additionalSections
      .filter(sec => sec.title !== 'WhatsApp Message')
      .map((sec, idx) => `
      <div class="slide">
        <div class="top-bar-teal"></div>
        <div class="top-bar-gold"></div>
        
        <div class="slide-header-bar">
          <span class="slide-header-title">STRATEGIC PROPOSAL & PLAN</span>
          <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
        </div>

        <div class="content-body" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="section-number">${String(idx + 7).padStart(2, '0')} // ${sec.title.toUpperCase()}</div>
            <h1 class="section-heading">${sec.title}</h1>
          </div>

          <div class="additional-content-grid" style="margin: 12px 0;">
            ${sec.content.map(c => `
              <div style="background: white; border: 1px solid #E6E1D8; border-left: 4px solid #C8A951; padding: 12px 16px; border-radius: 8px; margin-bottom: 8px;">
                <p class="slide-text" style="font-size: 11px; color: #334155; line-height: 1.6;">${c}</p>
              </div>
            `).join('')}
          </div>

          <div style="background: #0D4F4F; color: white; padding: 10px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 9px; font-weight: 800; letter-spacing: 1px;">TADBEER TT OPERATIONAL ARCHITECTURE</span>
            <span style="font-size: 8.5px; color: #C8A951; font-weight: 700;">PREPARED FOR ${company.company_name.toUpperCase()}</span>
          </div>
        </div>

        <div class="slide-footer">
          <span>Tadbeer TT</span>
          <span>Confidential // Strategic Proposal</span>
        </div>
      </div>
    `).join('')

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<title>Strategic Proposal – ${company.company_name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
  
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  body {
    font-family: 'Outfit', -apple-system, sans-serif;
    color: #1A1A1A;
    background: #FAF9F6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  @page {
    size: landscape;
    margin: 0;
  }

  .slide {
    width: 297mm;
    height: 210mm;
    padding: 14mm 18mm 12mm;
    position: relative;
    page-break-after: always;
    page-break-inside: avoid;
    background: #FAF9F6;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    box-sizing: border-box;
  }

  .slide::before {
    content: '';
    position: absolute;
    top: 5mm; left: 5mm; right: 5mm; bottom: 5mm;
    border: 1px solid rgba(200, 169, 81, 0.25);
    pointer-events: none;
    border-radius: 6px;
    z-index: 1;
  }

  .top-bar-teal {
    height: 6px; background: #0D4F4F; width: 100%;
    position: absolute; top: 0; left: 0; z-index: 10;
  }
  .top-bar-gold {
    height: 3px; background: #C8A951; width: 100%;
    position: absolute; top: 6px; left: 0; z-index: 10;
  }

  .slide-header-bar {
    display: flex; justify-content: space-between; align-items: center;
    border-bottom: 1.5px solid rgba(13, 79, 79, 0.15);
    padding-bottom: 6px; margin-bottom: 6mm;
    position: relative; z-index: 10;
  }
  .slide-header-title {
    font-size: 8.5px; font-weight: 900; letter-spacing: 3px;
    color: #0D4F4F; text-transform: uppercase;
  }
  .slide-header-logo { height: 22px; object-fit: contain; }

  /* ── COVER ── */
  .cover-brands {
    display: flex; justify-content: center; align-items: center; gap: 20px;
    margin-bottom: 8mm;
  }
  .cover-brand-logo { height: 42px; object-fit: contain; }
  .cover-divider { font-size: 24px; font-weight: 900; color: #C8A951; }
  .cover-prospect-badge {
    background: white; border: 1.5px solid rgba(13,79,79,0.2);
    padding: 8px 22px; border-radius: 30px;
    font-size: 15px; font-weight: 900; color: #0D4F4F;
    box-shadow: 0 4px 14px rgba(0,0,0,0.04);
  }
  .cover-title {
    font-family: 'Playfair Display', serif;
    font-size: 34px; font-weight: 900; color: #0D4F4F;
    text-align: center; margin-bottom: 12px; line-height: 1.2;
  }
  .cover-sub {
    font-size: 13px; color: #475569; max-width: 720px;
    margin: 0 auto 16px; text-align: center; line-height: 1.6; font-weight: 400;
  }
  .cover-obs-box {
    background: white; border: 1px solid #E6E1D8; border-left: 4px solid #C8A951;
    border-radius: 10px; padding: 12px 20px; max-width: 750px; margin: 0 auto 16px;
    text-align: left;
  }
  .cover-meta {
    display: flex; justify-content: center; gap: 28px;
    font-size: 9px; font-weight: 850; color: #0D4F4F;
    text-transform: uppercase; letter-spacing: 1.5px; background: white;
    padding: 10px 20px; border-radius: 30px; border: 1px solid rgba(13,79,79,0.1);
    max-width: 800px; margin: 0 auto;
  }

  /* ── CONTENT BODY ── */
  .content-body { flex: 1; position: relative; z-index: 10; display: flex; flex-direction: column; justify-content: space-between; }
  .section-number {
    font-size: 9px; font-weight: 900; letter-spacing: 2.5px; color: #C8A951;
    text-transform: uppercase; margin-bottom: 2px;
  }
  .section-heading {
    font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 900;
    color: #0D4F4F; margin-bottom: 4px; border-bottom: 2px solid #C8A951;
    display: inline-block; padding-bottom: 2px;
  }
  .section-sub { font-size: 11px; color: #475569; line-height: 1.5; margin-bottom: 12px; }

  /* Case Studies Layout */
  .cs-grid { display: flex; gap: 14px; margin-bottom: 12px; }
  .cs-card {
    flex: 1; background: white; border: 1px solid #E6E1D8;
    border-top: 4px solid #0D4F4F; border-radius: 12px; padding: 14px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .cs-badge { font-size: 8px; font-weight: 900; color: #C8A951; letter-spacing: 1.5px; }
  .cs-title { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 850; color: #0D4F4F; margin: 4px 0; }
  .cs-desc { font-size: 9.5px; color: #475569; margin-bottom: 3px; line-height: 1.45; }
  .cs-outcome { font-size: 9px; font-weight: 700; color: #0D4F4F; background: #ECFDF5; padding: 6px 10px; border-radius: 6px; border: 1px solid #A7F3D0; margin-top: 6px; }
  .cs-metrics-row { display: flex; gap: 10px; margin-top: 8px; }
  .cs-metric { flex: 1; background: #0D4F4F; color: white; border-radius: 6px; padding: 6px 8px; text-align: center; }
  .cs-val { font-size: 15px; font-weight: 900; color: #C8A951; display: block; }
  .cs-lbl { font-size: 7.5px; font-weight: 700; text-transform: uppercase; color: rgba(255,255,255,0.85); }

  /* Client Logos Strip */
  .logos-strip {
    display: flex; gap: 8px; align-items: center; justify-content: space-around;
    background: white; border: 1px solid #E6E1D8; border-radius: 10px; padding: 8px 12px; flex-wrap: wrap;
  }
  .client-logo-box {
    padding: 5px 10px; background: #FAF9F6; border-radius: 6px;
    font-size: 8.5px; font-weight: 800; color: #0D4F4F; text-transform: uppercase; letter-spacing: 0.5px;
    border: 1px solid rgba(0,0,0,0.05);
  }

  /* Executive Metrics & Zero Whitespace Cards */
  .metrics-grid { display: flex; gap: 14px; margin-bottom: 12px; }
  .context-metric-card {
    flex: 1; background: white; border: 1px solid #E6E1D8; border-top: 4px solid #C8A951;
    border-radius: 12px; padding: 14px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  }
  .cm-val { font-size: 22px; font-weight: 900; color: #0D4F4F; line-height: 1.1; }
  .cm-lbl { font-size: 9.5px; font-weight: 900; color: #C8A951; text-transform: uppercase; margin: 4px 0 2px; }
  .cm-ctx { font-size: 9px; color: #64748B; line-height: 1.4; }

  /* Diagnosis Cards */
  .diag-cards { display: flex; gap: 14px; margin-bottom: 12px; flex: 1; }
  .diag-card { flex: 1; border-radius: 12px; padding: 16px; background: white; border: 1px solid rgba(0,0,0,0.05); display: flex; flex-direction: column; justify-content: space-between; }
  .diag-badge { padding: 2px 8px; border-radius: 4px; font-size: 8px; font-weight: 900; color: white; }
  .diag-title { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 850; margin: 6px 0 4px; }
  .diag-desc { font-size: 9.5px; color: #475569; line-height: 1.5; }
  .infographic-meter-wrapper { margin-top: 8px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 6px; }
  .infographic-meter-track { width: 100%; height: 5px; background: rgba(0,0,0,0.06); border-radius: 3px; overflow: hidden; }
  .infographic-meter-fill { height: 100%; border-radius: 3px; }

  /* Solution Phase Cards */
  .phase-cards { display: flex; gap: 14px; margin-bottom: 12px; flex: 1; }
  .phase-card { flex: 1; background: white; border: 1px solid #E6E1D8; border-top: 4px solid #0D4F4F; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; min-height: 240px; }
  .phase-card-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .phase-num { font-size: 8.5px; font-weight: 900; color: #C8A951; letter-spacing: 1.5px; }
  .phase-timeline-badge { background: rgba(200, 169, 81, 0.15); color: #8c6e1c; font-size: 8.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
  .phase-title { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 850; color: #0D4F4F; margin-bottom: 4px; }
  .phase-desc { font-size: 10px; color: #475569; line-height: 1.55; }
  .phase-detail { font-size: 8.5px; color: #0D4F4F; margin-top: 5px; background: #FAF9F6; padding: 6px 10px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.04); }

  /* Bottom Fillers */
  .slide-bottom-fill {
    background: white; border: 1px solid #E6E1D8; border-radius: 10px; padding: 12px 16px;
    display: flex; justify-content: space-between; align-items: center; margin-top: auto;
  }

  /* CTA */
  .cta-box {
    text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;
  }
  .cta-title { font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 900; color: #0D4F4F; margin-bottom: 8px; }
  .cta-sub { font-size: 12px; color: #475569; max-width: 540px; margin-bottom: 20px; line-height: 1.5; }
  .cta-btn {
    background: #0D4F4F; color: white; padding: 12px 30px; border-radius: 30px;
    font-size: 12px; font-weight: 900; text-decoration: none; text-transform: uppercase; letter-spacing: 1.5px;
    display: inline-block; box-shadow: 0 4px 14px rgba(13, 79, 79, 0.25);
  }
  .cta-contact-row { display: flex; gap: 24px; margin-top: 24px; font-size: 10px; font-weight: 800; color: #0D4F4F; background: white; padding: 10px 24px; border-radius: 30px; border: 1px solid #E6E1D8; }

  /* Footer */
  .slide-footer {
    border-top: 1px solid #E6E1D8; padding-top: 6px; margin-top: 6px;
    display: flex; justify-content: space-between; font-size: 8px; color: #94A3B8;
    text-transform: uppercase; letter-spacing: 1.5px; position: relative; z-index: 10;
  }

  @media print { body { background: none; } .slide { margin: 0; box-shadow: none; } }
</style>
</head>
<body>

  <!-- SLIDE 1: PERSONALIZED COVER -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar" style="border: none; margin-bottom: 0;">
      <span style="font-size: 8.5px; font-weight: 900; color: #0D4F4F; letter-spacing: 2px;">PERSONALIZED STRATEGIC PROPOSAL</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" style="height: 28px;" alt="Tadbeer Logo" />
    </div>

    <div class="content-body" style="display:flex;flex-direction:column;justify-content:center;padding: 10px 0;">
      <div class="cover-brands">
        <img src="/logo/tadbeer-logo.png" class="cover-brand-logo" alt="Tadbeer Logo" />
        <span class="cover-divider">×</span>
        <div class="cover-prospect-badge">${company.company_name}</div>
      </div>
      <h1 class="cover-title">${coverTitle}</h1>
      <p class="cover-sub">${d.subtitle}</p>
      
      ${d.specificObservation ? `
        <div class="cover-obs-box">
          <span style="font-size: 8.5px; font-weight: 900; color: #C8A951; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 4px;">Initial Review & Key Observation</span>
          <p style="font-size: 11px; color: #334155; line-height: 1.5; font-style: italic;">"${d.specificObservation}"</p>
        </div>
      ` : ''}

      <div class="cover-meta">
        <div>PREPARED FOR: <span style="color: #C8A951;">${contact.full_name} (${contact.title || 'Decision Maker'})</span></div>
        <div>DATE: <span>${d.preparedDate || 'July 2026'}</span></div>
        <div>CONFIDENTIALITY: <span>STRICTLY CONFIDENTIAL</span></div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer TT Transformations</span>
      <span>STRATEGIC PROPOSAL // OMAN</span>
    </div>
  </div>

  <!-- SLIDE 2: DETAILS AND EXECUTIVE OVERVIEW OF TADBEER TT -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar">
      <span class="slide-header-title">HOW TADBEER TT HELPS OMANI BUSINESSES SCALE</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer TT Logo" />
    </div>

    <div class="content-body">
      <div>
        <div class="section-number">02 // ABOUT TADBEER TT & WHAT WE DO</div>
        <h1 class="section-heading">Oman’s System & Scale Transformation Partner</h1>
        <p class="section-sub">${d.aboutTadbeerContext || `Tadbeer TT is an Omani consulting and technology partner based in Madinat Qaboos, Muscat. We help growing GCC businesses connect their daily operations, software, customer communications, and team workflows in simple, effective ways.`}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 12px 0; flex: 1;">
        <div style="background: white; border: 1px solid #E6E1D8; border-left: 4px solid #0D4F4F; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h4 style="font-size: 12px; font-weight: 900; color: #0D4F4F; text-transform: uppercase; margin-bottom: 4px;">Software Solutions</h4>
            <p style="font-size: 10px; color: #475569; line-height: 1.5;">Custom business applications, ERPNext & Odoo setups built specifically for Omani tax, regulatory, and daily workflow standards.</p>
          </div>
          <div style="font-size: 8.5px; font-weight: 800; color: #0D4F4F; margin-top: 8px; background: #FAF9F6; padding: 5px 10px; border-radius: 6px; display: inline-block;">Focus: Custom Apps, Automated Workflows & Omani Compliance</div>
        </div>
        <div style="background: white; border: 1px solid #E6E1D8; border-left: 4px solid #C8A951; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h4 style="font-size: 12px; font-weight: 900; color: #0D4F4F; text-transform: uppercase; margin-bottom: 4px;">Smart Technology & AI</h4>
            <p style="font-size: 10px; color: #475569; line-height: 1.5;">Smart document tools, pricing calculators, and WhatsApp helpers that answer customer questions 24/7.</p>
          </div>
          <div style="font-size: 8.5px; font-weight: 800; color: #C8A951; margin-top: 8px; background: #FFFBEB; padding: 5px 10px; border-radius: 6px; display: inline-block;">Focus: 24/7 WhatsApp Assistants & Smart Business Calculators</div>
        </div>
        <div style="background: white; border: 1px solid #E6E1D8; border-left: 4px solid #C8A951; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h4 style="font-size: 12px; font-weight: 900; color: #0D4F4F; text-transform: uppercase; margin-bottom: 4px;">Digital Growth</h4>
            <p style="font-size: 10px; color: #475569; line-height: 1.5;">Data-driven lead generation, automated WhatsApp nurturing campaigns, and customer retention systems across Oman & GCC.</p>
          </div>
          <div style="font-size: 8.5px; font-weight: 800; color: #C8A951; margin-top: 8px; background: #FFFBEB; padding: 5px 10px; border-radius: 6px; display: inline-block;">Focus: Lead Generation & Customer Repeat Orders</div>
        </div>
        <div style="background: white; border: 1px solid #E6E1D8; border-left: 4px solid #0D4F4F; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h4 style="font-size: 12px; font-weight: 900; color: #0D4F4F; text-transform: uppercase; margin-bottom: 4px;">People & Operations</h4>
            <p style="font-size: 10px; color: #475569; line-height: 1.5;">Clear standard procedures (SOPs), team training, change management, and practical Omanization programs.</p>
          </div>
          <div style="font-size: 8.5px; font-weight: 800; color: #0D4F4F; margin-top: 8px; background: #FAF9F6; padding: 5px 10px; border-radius: 6px; display: inline-block;">Focus: Team Productivity & Practical Operational Structure</div>
        </div>
      </div>

      <div class="slide-bottom-fill">
        <div>
          <span style="font-size: 8.5px; font-weight: 900; color: #0D4F4F; text-transform: uppercase; letter-spacing: 1px; display: block;">OUR OMAN HEADQUARTERS</span>
          <span style="font-size: 9.5px; color: #64748B;">Al Noor Plaza, Madinat Qaboos, Muscat, Sultanate of Oman</span>
        </div>
        <div style="display: flex; gap: 16px;">
          <div style="text-align: center;"><span style="font-size: 14px; font-weight: 900; color: #0D4F4F;">50+</span> <span style="font-size: 8px; font-weight: 700; color: #C8A951; text-transform: uppercase; display: block;">Projects Delivered</span></div>
          <div style="text-align: center;"><span style="font-size: 14px; font-weight: 900; color: #0D4F4F;">100%</span> <span style="font-size: 8px; font-weight: 700; color: #C8A951; text-transform: uppercase; display: block;">Omani Focus</span></div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer TT</span>
      <span>ORGANIZATIONAL OVERVIEW & CAPABILITIES</span>
    </div>
  </div>

  <!-- SLIDE 3: TADBEER TT WEBSITE CASE STUDIES & CLIENT LOGOS DIRECT FROM TADBEERTT.COM -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar">
      <span class="slide-header-title">PROVEN RESULTS WITH OMANI BRANDS</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer TT Logo" />
    </div>

    <div class="content-body">
      <div>
        <div class="section-number">03 // PROVEN RESULTS FROM TADBEERTT.COM</div>
        <h1 class="section-heading">Real Case Studies from Tadbeer TT</h1>
        <p class="section-sub">Actual transformation results delivered for leading organizations in Oman and across the GCC.</p>
      </div>
      
      <div class="cs-grid" style="flex: 1; margin: 12px 0;">${caseStudiesHtml}</div>
      
      <div>
        <span style="font-size: 8.5px; font-weight: 900; color: #C8A951; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Trusted by Leading Brands (tadbeertt.com)</span>
        <div class="logos-strip">${clientLogosHtml}</div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer TT</span>
      <span>PROVEN CLIENT CASE STUDIES</span>
    </div>
  </div>

  <!-- SLIDE 4: EXECUTIVE SUMMARY & METRICS -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar">
      <span class="slide-header-title">SUMMARY & KEY OPPORTUNITIES</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
    </div>

    <div class="content-body">
      <div>
        <div class="section-number">04 // SUMMARY & KEY OPPORTUNITIES</div>
        <h1 class="section-heading">What We Identified for ${company.company_name}</h1>
        <p class="section-sub">${d.executiveSummaryText}</p>
      </div>
      
      <div class="metrics-grid" style="margin: 12px 0;">${metricsHtml}</div>

      <div style="background: white; border: 1px solid #E6E1D8; border-radius: 12px; padding: 16px; display: grid; grid-template-columns: 1fr 1.2fr; gap: 16px; margin-top: 4px;">
        <div style="border-right: 1px solid #E6E1D8; padding-right: 14px;">
          <span style="font-size: 8.5px; font-weight: 900; color: #C8A951; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Main Focus for ${company.company_name}</span>
          <p style="font-size: 10.5px; color: #334155; line-height: 1.6;">Moving ${company.company_name} from separate manual messages and paperwork into one simple, clear operating system.</p>
        </div>
        <div>
          <span style="font-size: 8.5px; font-weight: 900; color: #0D4F4F; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Immediate Benefits</span>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 9.5px; color: #475569;">
            <div style="background:#FAF9F6; padding:6px 10px; border-radius:6px; border:1px solid rgba(0,0,0,0.04);">✔ Instant Customer Answers</div>
            <div style="background:#FAF9F6; padding:6px 10px; border-radius:6px; border:1px solid rgba(0,0,0,0.04);">✔ Zero Dropped Inquiries</div>
            <div style="background:#FAF9F6; padding:6px 10px; border-radius:6px; border:1px solid rgba(0,0,0,0.04);">✔ Automated Follow-ups</div>
            <div style="background:#FAF9F6; padding:6px 10px; border-radius:6px; border:1px solid rgba(0,0,0,0.04);">✔ Clear Management Overview</div>
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer TT</span>
      <span>SUMMARY & OPPORTUNITIES</span>
    </div>
  </div>

  <!-- SLIDE 5: PROBLEM SLIDE (FORENSIC DIAGNOSIS) -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar">
      <span class="slide-header-title">THE PROBLEM & AREAS FOR IMPROVEMENT</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
    </div>

    <div class="content-body">
      <div>
        <div class="section-number">05 // THE PROBLEM — WHERE TIME & MONEY ARE LOST</div>
        <h1 class="section-heading">Where ${company.company_name} Can Save Time & Prevent Drops</h1>
        <p class="section-sub">${d.diagnosisIntro}</p>
      </div>

      <div class="diag-cards" style="margin: 12px 0;">${diagCardsHtml}</div>

      <div class="slide-bottom-fill" style="background: #FEF2F2; border-color: #FCA5A5; padding: 12px 18px;">
        <div style="display: flex; items-center; gap: 8px;">
          <span style="font-size: 9.5px; font-weight: 900; color: #991B1B; text-transform: uppercase;">Why Fix This Now:</span>
          <span style="font-size: 9.5px; color: #7F1D1D;">Resolving these 3 operational bottlenecks frees up team hours, speeds up customer response, and stops lost sales.</span>
        </div>
        <span style="font-size: 8.5px; font-weight: 900; color: #991B1B; background: white; padding: 4px 10px; border-radius: 6px;">HIGH BENEFIT AREA</span>
      </div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer TT</span>
      <span>OPERATIONAL PROBLEM & DIAGNOSIS</span>
    </div>
  </div>

  <!-- SLIDE 6: SOLUTION SLIDE (DIRECTLY BELOW PROBLEM SLIDE WITH SPACED OUT RICH CONTENT) -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar">
      <span class="slide-header-title">THE SOLUTION — OUR SIMPLE 3-STEP PLAN</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
    </div>

    <div class="content-body">
      <div>
        <div class="section-number">06 // THE SOLUTION — DIRECTLY ADDRESSING THE PROBLEM</div>
        <h1 class="section-heading">How Tadbeer Solves These Gaps for ${company.company_name}</h1>
        <p class="section-sub">${d.solutionIntro}</p>
      </div>

      <div class="phase-cards" style="margin: 14px 0;">${phaseCardsHtml}</div>

      <div class="slide-bottom-fill" style="background: #F0FDF4; border-color: #86EFAC; padding: 12px 18px;">
        <div style="display: flex; items-center; gap: 12px;">
          <span style="font-size: 9.5px; font-weight: 900; color: #166534; text-transform: uppercase;">Implementation Promise:</span>
          <span style="font-size: 9.5px; color: #14532D;">Step 1 (Blueprint & Map) ➔ Step 2 (Connect & Train Staff) ➔ Step 3 (Go Live & Local Muscat Support)</span>
        </div>
        <span style="font-size: 8.5px; font-weight: 900; color: #166534; background: white; padding: 4px 10px; border-radius: 6px;">SIMPLE, CLEAR & EASY TO ADOPT</span>
      </div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer TT</span>
      <span>THE SOLUTION & IMPLEMENTATION PLAN</span>
    </div>
  </div>

  ${additionalPagesHtml}

  <!-- FINAL SLIDE: CTA -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="cta-box">
      <img src="/logo/tadbeer-logo.png" style="height: 48px; margin-bottom: 16px;" alt="Tadbeer Logo" />
      <div class="section-number">NEXT STEPS</div>
      <h1 class="cta-title">${d.ctaHeading || 'Let’s Review This Together in a 30-Minute Meeting'}</h1>
      <p class="cta-sub">${d.ctaSubtext || 'We can walk you through these simple suggestions, answer any questions, and show you a working demonstration.'}</p>
      
      <a href="${d.ctaUrl || 'https://www.tadbeertt.com'}" target="_blank" class="cta-btn" style="margin: 16px 0;">
        Visit Tadbeer TT Website
      </a>

      <div class="cta-contact-row">
        <div>PHONE: <span>${d.ctaPhone || '+968 7630 7656'}</span></div>
        <div>EMAIL: <span>${d.ctaEmail || 'operation@tadbeertt.com'}</span></div>
        <div>WEB: <span>${d.ctaUrl || 'www.tadbeertt.com'}</span></div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer TT</span>
      <span>PROPOSAL VALID UNTIL: ${d.proposalValidUntil}</span>
    </div>
  </div>

<script>
  window.onload = function() { setTimeout(function() { window.print(); }, 400); }
</script>
</body>
</html>`

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight
        const wScale = width / 960
        const hScale = height / 540
        setScale(Math.min(1, Math.min(wScale, hScale) * 0.95))
      }
    }
    const timer = setTimeout(handleResize, 100)
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [activeSlide])

  const metricsList = d.heroStats && d.heroStats.length > 0 ? d.heroStats : [
    { value: '3x Faster', unit: 'Speed', label: 'Response Velocity' },
    { value: 'Zero Lost', unit: 'Leads', label: 'Follow-up Guarantee' },
    { value: '3 Steps', unit: 'Plan', label: 'Simple Transition' },
    { value: '1 System', unit: 'Unified', label: 'Clear Team Visibility' }
  ]

  const slides = [
    // Slide 1: Personalized Cover
    {
      title: 'Cover Page',
      subtitle: 'Personalized Collaboration',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[36px] relative h-full">
          <div className="absolute inset-3 border border-[#C8A951]/25 rounded-lg pointer-events-none z-10" />
          
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">PERSONALIZED STRATEGIC PROPOSAL</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col items-center justify-center text-center my-3 z-20">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/logo/tadbeer-logo.png" className="h-10 object-contain" alt="Tadbeer Logo" />
              <span className="text-2xl font-bold text-[#C8A951]">×</span>
              <div className="bg-white border border-[#0D4F4F]/20 px-5 py-2 rounded-full text-sm font-black text-[#0D4F4F] shadow-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-teal" />
                {company.company_name}
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-[#0D4F4F] leading-tight max-w-[780px] mx-auto mb-3 font-serif">
              {coverTitle}
            </h1>
            <p className="text-[12px] text-slate-600 max-w-[680px] mx-auto leading-relaxed mb-4">
              {d.subtitle}
            </p>

            {d.specificObservation && (
              <div className="bg-white border border-[#E6E1D8] border-l-4 border-l-[#C8A951] rounded-xl p-3.5 max-w-[720px] mx-auto text-left shadow-sm mb-3">
                <span className="text-[8.5px] font-black text-[#C8A951] uppercase tracking-widest block mb-0.5">Initial Review & Key Observation</span>
                <p className="text-[10.5px] text-slate-700 italic leading-snug">"{d.specificObservation}"</p>
              </div>
            )}
          </div>

          <div className="bg-white border border-[#E6E1D8] rounded-full px-6 py-2.5 flex justify-between text-[9px] text-[#0D4F4F] uppercase tracking-widest font-black z-20 shadow-sm">
            <span>PREPARED FOR: <strong className="text-[#C8A951]">{contact.full_name}</strong> ({contact.title || 'Decision Maker'})</span>
            <span>DATE: {d.preparedDate || 'July 2026'}</span>
            <span>TADBEER TT TRANSFORMATIONS</span>
          </div>
        </div>
      )
    },
    // Slide 2: About Tadbeer TT & Executive Overview
    {
      title: 'About Tadbeer TT',
      subtitle: 'What We Do',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[36px] relative h-full">
          <div className="absolute inset-3 border border-[#C8A951]/25 rounded-lg pointer-events-none z-10" />
          
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">ABOUT TADBEER TT</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer TT Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-between my-2 z-20">
            <div>
              <p className="text-[9px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-0.5">02 // ABOUT TADBEER TT & WHAT WE DO</p>
              <h2 className="text-xl font-extrabold text-[#0D4F4F] mb-1 font-serif border-b border-[#C8A951] inline-block pb-0.5">Oman’s System & Scale Partner</h2>
              <p className="text-[11px] text-slate-600 leading-relaxed max-w-[780px]">{d.aboutTadbeerContext || `Tadbeer TT is an Omani consulting and technology partner based in Madinat Qaboos, Muscat. We help growing GCC businesses connect their daily operations, software, customer communications, and team workflows in simple, effective ways.`}</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5 my-3 flex-1">
              <div className="bg-white border border-[#E6E1D8] border-l-4 border-l-[#0D4F4F] rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="h-4 w-4 text-brand-teal" />
                    <h4 className="text-[11px] font-extrabold text-[#0D4F4F] uppercase tracking-wider">Software Solutions</h4>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-relaxed">Custom business applications, ERPNext & Odoo setups built specifically for Omani tax, regulatory, and daily workflow standards.</p>
                </div>
                <span className="text-[8px] font-bold text-[#0D4F4F] mt-2 bg-[#FAF9F6] px-2.5 py-1 rounded border border-black/5 self-start">Focus: Custom Apps, Automated Workflows & Omani Compliance</span>
              </div>

              <div className="bg-white border border-[#E6E1D8] border-l-4 border-l-[#C8A951] rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="h-4 w-4 text-[#C8A951]" />
                    <h4 className="text-[11px] font-extrabold text-[#0D4F4F] uppercase tracking-wider">Smart Technology & AI</h4>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-relaxed">Smart document tools, pricing calculators, and WhatsApp helpers that answer customer questions 24/7.</p>
                </div>
                <span className="text-[8px] font-bold text-[#C8A951] mt-2 bg-[#FFFBEB] px-2.5 py-1 rounded border border-amber-200/50 self-start">Focus: 24/7 WhatsApp Assistants & Smart Business Calculators</span>
              </div>

              <div className="bg-white border border-[#E6E1D8] border-l-4 border-l-[#C8A951] rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Globe className="h-4 w-4 text-[#C8A951]" />
                    <h4 className="text-[11px] font-extrabold text-[#0D4F4F] uppercase tracking-wider">Digital Growth</h4>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-relaxed">Data-driven lead generation, automated WhatsApp nurturing campaigns, and customer retention systems across Oman & GCC.</p>
                </div>
                <span className="text-[8px] font-bold text-[#C8A951] mt-2 bg-[#FFFBEB] px-2.5 py-1 rounded border border-amber-200/50 self-start">Focus: Lead Generation & Customer Repeat Orders</span>
              </div>

              <div className="bg-white border border-[#E6E1D8] border-l-4 border-l-[#0D4F4F] rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Building2 className="h-4 w-4 text-brand-teal" />
                    <h4 className="text-[11px] font-extrabold text-[#0D4F4F] uppercase tracking-wider">People & Operations</h4>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-relaxed">Clear standard procedures (SOPs), team training, change management, and practical Omanization programs.</p>
                </div>
                <span className="text-[8px] font-bold text-[#0D4F4F] mt-2 bg-[#FAF9F6] px-2.5 py-1 rounded border border-black/5 self-start">Focus: Team Productivity & Practical Operational Structure</span>
              </div>
            </div>

            <div className="bg-white border border-[#E6E1D8] rounded-xl p-3 flex justify-between items-center shadow-sm">
              <div>
                <span className="text-[8.5px] font-black text-[#0D4F4F] uppercase tracking-wider block">OUR OMAN HEADQUARTERS</span>
                <span className="text-[9.5px] text-slate-500">Al Noor Plaza, Madinat Qaboos, Muscat, Sultanate of Oman</span>
              </div>
              <div className="flex gap-4">
                <div className="text-center"><span className="text-xs font-black text-[#0D4F4F]">50+</span> <span className="text-[7.5px] font-bold text-[#C8A951] uppercase block">Projects Delivered</span></div>
                <div className="text-center"><span className="text-xs font-black text-[#0D4F4F]">100%</span> <span className="text-[7.5px] font-bold text-[#C8A951] uppercase block">Omani Focus</span></div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-2 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer TT</span>
            <span>ORGANIZATIONAL OVERVIEW & CAPABILITIES</span>
          </div>
        </div>
      )
    },
    // Slide 3: Varying Case Studies from Tadbeer TT (tadbeertt.com)
    {
      title: 'Tadbeer TT Case Studies',
      subtitle: 'Proven Results from tadbeertt.com',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[36px] relative h-full">
          <div className="absolute inset-3 border border-[#C8A951]/25 rounded-lg pointer-events-none z-10" />
          
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">PROVEN RESULTS FROM TADBEERTT.COM</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer TT Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-between my-2 z-20">
            <div>
              <p className="text-[9px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-0.5">03 // PROVEN RESULTS FROM TADBEERTT.COM</p>
              <h2 className="text-xl font-extrabold text-[#0D4F4F] mb-0.5 font-serif border-b border-[#C8A951] inline-block pb-0.5">Real Case Studies from Tadbeer TT</h2>
              <p className="text-[10.5px] text-slate-500">Actual transformation results delivered for leading organizations in Oman and across the GCC.</p>
            </div>

            <div className="grid grid-cols-2 gap-3.5 my-3 flex-1">
              {varyingCaseStudies.map((cs, i) => (
                <div key={i} className="bg-white border border-[#E6E1D8] border-t-4 border-t-[#0D4F4F] rounded-xl p-3.5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[8.5px] font-black text-[#C8A951] uppercase tracking-wider">{cs.industry}</span>
                      <Badge variant="outline" className="text-[7.5px] border-emerald-300 text-emerald-700 bg-emerald-50 font-bold px-1.5 py-0">Proven Oman Result</Badge>
                    </div>
                    <h4 className="text-[12px] font-extrabold font-serif text-[#0D4F4F] mb-1">{cs.title}</h4>
                    <p className="text-[9px] text-slate-600 mb-1 leading-snug"><strong>Client Partner:</strong> {cs.clientName}</p>
                    <p className="text-[9px] text-slate-500 mb-2 leading-relaxed">{cs.problemSummary}</p>
                  </div>
                  <div>
                    <div className="bg-[#FAF9F6] p-2 rounded text-[8.5px] font-bold text-[#0D4F4F] border border-black/5 mb-2">
                      {cs.outcome}
                    </div>
                    <div className="flex gap-2">
                      {cs.metrics.map((m, mi) => (
                        <div key={mi} className="flex-1 bg-[#0D4F4F] text-white p-1.5 rounded text-center">
                          <span className="text-xs font-black text-[#C8A951] block leading-none">{m.value}</span>
                          <span className="text-[7px] font-bold uppercase tracking-wider text-white/80">{m.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <span className="text-[8px] font-extrabold text-[#C8A951] uppercase tracking-widest block mb-1">Trusted by Leading Brands (tadbeertt.com)</span>
              <div className="flex gap-1.5 items-center justify-between bg-white border border-[#E6E1D8] rounded-lg p-2 shadow-sm flex-wrap">
                {clientLogos.map((l, li) => (
                  <div key={li} className="bg-[#FAF9F6] px-2.5 py-1 rounded text-[8px] font-extrabold text-[#0D4F4F] uppercase tracking-wider border border-black/5 truncate max-w-[130px]">
                    {l.clientName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-2 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer TT</span>
            <span>PROVEN CLIENT CASE STUDIES</span>
          </div>
        </div>
      )
    },
    // Slide 4: Executive Summary & Context Metrics (ZERO WHITESPACE)
    {
      title: 'Summary of Opportunities',
      subtitle: 'Key Results & Impact',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[36px] relative h-full">
          <div className="absolute inset-3 border border-[#C8A951]/25 rounded-lg pointer-events-none z-10" />
          
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">SUMMARY & KEY OPPORTUNITIES</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-between my-2 z-20">
            <div>
              <p className="text-[9px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-0.5">04 // SUMMARY & KEY OPPORTUNITIES</p>
              <h2 className="text-xl font-extrabold text-[#0D4F4F] mb-1 font-serif border-b border-[#C8A951] inline-block pb-0.5">What We Identified for {company.company_name}</h2>
              <p className="text-[11px] text-slate-600 leading-relaxed max-w-[780px]">{d.executiveSummaryText}</p>
            </div>

            {/* Hero Stat Cards */}
            <div className="grid grid-cols-4 gap-3.5 my-3">
              {metricsList.map((m, i) => (
                <div key={i} className="bg-white border border-[#E6E1D8] border-t-4 border-t-[#C8A951] rounded-xl p-3.5 text-center shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="text-2xl font-black text-[#0D4F4F] leading-none mb-1">{m.value}</div>
                    <h4 className="text-[9.5px] font-extrabold text-[#C8A951] uppercase tracking-wider mb-1">{m.label}</h4>
                  </div>
                  <p className="text-[9px] text-slate-500 leading-relaxed">{m.unit ? `${m.unit} focus to make daily work easier and faster for your team.` : 'System simplicity achieved.'}</p>
                </div>
              ))}
            </div>

            {/* Lower Strategic Focus Box filling the empty whitespace */}
            <div className="bg-white border border-[#E6E1D8] rounded-xl p-4 grid grid-cols-12 gap-4 shadow-sm">
              <div className="col-span-5 border-r border-[#E6E1D8] pr-4">
                <span className="text-[8.5px] font-black text-[#C8A951] uppercase tracking-wider block mb-1">Main Focus for {company.company_name}</span>
                <p className="text-[10px] text-slate-700 leading-relaxed">
                  Moving {company.company_name} from separate manual messages and paperwork into one simple, clear operating system.
                </p>
              </div>
              <div className="col-span-7 pl-1">
                <span className="text-[8.5px] font-black text-[#0D4F4F] uppercase tracking-wider block mb-1">Immediate Benefits</span>
                <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-700">
                  <div className="bg-[#FAF9F6] p-2 rounded-lg border border-black/5 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Instant Customer Answers</span>
                  </div>
                  <div className="bg-[#FAF9F6] p-2 rounded-lg border border-black/5 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Zero Dropped Inquiries</span>
                  </div>
                  <div className="bg-[#FAF9F6] p-2 rounded-lg border border-black/5 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Automated Follow-ups</span>
                  </div>
                  <div className="bg-[#FAF9F6] p-2 rounded-lg border border-black/5 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Clear Management Overview</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-2 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>SUMMARY & OPPORTUNITIES</span>
          </div>
        </div>
      )
    },
    // Slide 5: PROBLEM SLIDE
    {
      title: 'The Problem',
      subtitle: 'Where Time & Money Are Lost',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[36px] relative h-full">
          <div className="absolute inset-3 border border-[#C8A951]/25 rounded-lg pointer-events-none z-10" />
          
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">THE PROBLEM & AREAS FOR IMPROVEMENT</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-between my-2 z-20">
            <div>
              <p className="text-[9px] font-extrabold tracking-[2px] uppercase text-red-600 mb-0.5">05 // THE PROBLEM — WHERE TIME & MONEY ARE LOST</p>
              <h2 className="text-xl font-extrabold text-[#0D4F4F] mb-1 font-serif border-b border-red-500 inline-block pb-0.5">Where {company.company_name} Can Save Time & Prevent Loss</h2>
              <p className="text-[11px] text-slate-500 max-w-[760px]">{d.diagnosisIntro}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 my-3 flex-1">
              {d.leaks.map((l, i) => {
                const c = DIAG_COLORS[l.type] || DIAG_COLORS.LEAK
                return (
                  <div key={i} className="rounded-xl p-4 flex flex-col justify-between border border-black/5 bg-white shadow-sm flex-1" style={{ borderLeft: `4px solid ${c.border}` }}>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="px-2.5 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-wider" style={{ background: c.badge }}>
                          {l.type === 'LEAK' ? 'High Priority' : l.type === 'RISK' ? 'Key Focus' : 'Simple Fix'}
                        </span>
                        <span className="text-[8.5px] font-bold uppercase tracking-wider" style={{ color: c.text }}>{l.impact || c.severity}</span>
                      </div>
                      <h4 className="text-[13px] font-extrabold font-serif mb-1.5" style={{ color: c.text }}>{l.title}</h4>
                      <p className="text-[10px] text-slate-600 leading-relaxed">{l.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-black/5">
                      <div className="flex justify-between text-[8px] font-bold text-slate-500 mb-1">
                        <span>IMPACT & OPPORTUNITY SCORE</span>
                        <span>{c.score}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: c.score, background: c.border }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-red-50 border border-red-200/60 rounded-xl p-3 flex justify-between items-center text-[9.5px]">
              <div className="flex items-center gap-2">
                <span className="font-black text-red-800 uppercase tracking-wider">Why Fix This Now:</span>
                <span className="text-red-700">Resolving these 3 operational gaps frees up team hours, speeds up response velocity, and prevents dropped sales.</span>
              </div>
              <span className="font-extrabold text-red-800 bg-white px-2.5 py-1 rounded-md border border-red-200">HIGH BENEFIT AREA</span>
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-2 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>THE PROBLEM & OPERATIONAL DIAGNOSIS</span>
          </div>
        </div>
      )
    },
    // Slide 6: SOLUTION SLIDE (SPACED OUT VERTICALLY TO ELIMINATE EMPTY WHITE GAP)
    {
      title: 'The Solution',
      subtitle: 'Our Simple 3-Step Plan',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[36px] relative h-full">
          <div className="absolute inset-3 border border-[#C8A951]/25 rounded-lg pointer-events-none z-10" />
          
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">THE SOLUTION — OUR SIMPLE 3-STEP PLAN</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-between my-2 z-20">
            <div>
              <p className="text-[9px] font-extrabold tracking-[2px] uppercase text-emerald-600 mb-0.5">06 // THE SOLUTION — DIRECTLY FIXING THE PROBLEMS ABOVE</p>
              <h2 className="text-xl font-extrabold text-[#0D4F4F] mb-1 font-serif border-b border-emerald-500 inline-block pb-0.5">How Tadbeer Solves These Gaps for {company.company_name}</h2>
              <p className="text-[11px] text-slate-600 max-w-[780px]">{d.solutionIntro}</p>
            </div>

            {/* Vertically stretched Cards to fill canvas and eliminate white space */}
            <div className="grid grid-cols-3 gap-4 my-3 flex-1 items-stretch">
              {d.phases.map((p, i) => (
                <div key={i} className="bg-white border border-[#E6E1D8] border-t-4 border-t-emerald-600 rounded-xl p-4 shadow-sm flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[9px] font-black text-[#C8A951] tracking-widest uppercase">STEP 0{p.phaseNum}</p>
                      {p.timeline && <span className="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold px-2 py-0.5 rounded-full">{p.timeline}</span>}
                    </div>
                    <h4 className="text-[13px] font-extrabold font-serif text-[#0D4F4F] mb-2 leading-snug">{p.title}</h4>
                    <p className="text-[10px] text-slate-600 leading-relaxed mb-3">{p.description}</p>
                  </div>
                  <div className="space-y-2 mt-auto">
                    {p.intervention && (
                      <div className="text-[8.5px] bg-[#FAF9F6] p-2 rounded-lg border border-black/5 text-[#0D4F4F] font-semibold leading-relaxed">
                        <strong className="block text-[8px] uppercase text-[#C8A951] mb-0.5">What We Do:</strong> {p.intervention}
                      </div>
                    )}
                    {p.futureState && (
                      <div className="text-[8.5px] bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-emerald-800 font-semibold leading-relaxed">
                        <strong className="block text-[8px] uppercase text-emerald-700 mb-0.5">Result for Your Team:</strong> {p.futureState}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex justify-between items-center text-[9.5px]">
              <div className="flex items-center gap-2">
                <span className="font-black text-emerald-800 uppercase tracking-wider">Implementation Promise:</span>
                <span className="text-emerald-700">Step 1 (Blueprint & Map) ➔ Step 2 (Connect & Train Staff) ➔ Step 3 (Go Live & Local Muscat Support)</span>
              </div>
              <span className="font-extrabold text-emerald-800 bg-white px-2.5 py-1 rounded-md border border-emerald-200">SIMPLE, CLEAR & EASY TO ADOPT</span>
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-2 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>THE SOLUTION & IMPLEMENTATION PLAN</span>
          </div>
        </div>
      )
    },
    // Additional Section Slides
    ...d.additionalSections
      .filter(sec => sec.title !== 'WhatsApp Message')
      .map((sec, idx) => ({
      title: sec.title,
      subtitle: `Extra Section ${idx + 1}`,
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[36px] relative h-full">
          <div className="absolute inset-3 border border-[#C8A951]/25 rounded-lg pointer-events-none z-10" />
          
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">STRATEGIC PROPOSAL & PLAN</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-between my-2 z-20">
            <div>
              <p className="text-[9px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-0.5">{String(idx + 7).padStart(2, '0')} // {sec.title.toUpperCase()}</p>
              <h2 className="text-xl font-extrabold text-[#0D4F4F] mb-2 font-serif border-b-2 border-[#C8A951] inline-block pb-0.5">{sec.title}</h2>
            </div>

            <div className="space-y-2.5 my-2">
              {sec.content.map((c, ci) => (
                <div key={ci} className="bg-white border border-[#E6E1D8] border-l-4 border-l-[#C8A951] p-3.5 rounded-lg shadow-sm">
                  <p className="text-[11px] text-slate-700 leading-relaxed font-sans">{c}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#0D4F4F] text-white p-3 rounded-xl flex justify-between items-center text-[9.5px]">
              <span className="font-black tracking-wider uppercase">TADBEER TT OPERATIONAL ARCHITECTURE</span>
              <span className="text-[#C8A951] font-bold">PREPARED FOR {company.company_name.toUpperCase()}</span>
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-2 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>STRATEGIC PROPOSAL</span>
          </div>
        </div>
      )
    })),
    // Slide Last: CTA
    {
      title: 'Next Steps',
      subtitle: 'Let’s Review Together',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[36px] relative h-full">
          <div className="absolute inset-3 border border-[#C8A951]/25 rounded-lg pointer-events-none z-10" />
          
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">NEXT STEPS & GETTING STARTED</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col items-center justify-center text-center my-3 z-20">
            <img src="/logo/tadbeer-logo.png" className="h-12 object-contain mb-3" alt="Tadbeer Logo" />
            <p className="text-[9.5px] font-black tracking-[3px] text-[#C8A951] uppercase mb-1">NEXT STEP</p>
            <h1 className="text-2xl font-extrabold text-[#0D4F4F] mb-2 font-serif">{d.ctaHeading || 'Let’s Review This Together in a 30-Minute Meeting'}</h1>
            <p className="text-[11.5px] text-slate-600 mb-5 max-w-[560px] leading-relaxed">{d.ctaSubtext || 'We can walk you through these simple suggestions, answer any questions, and show you a working demonstration.'}</p>
            
            <a
              href={d.ctaUrl || 'https://www.tadbeertt.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0D4F4F] hover:bg-[#0a3e3e] text-white text-xs font-black px-8 py-3.5 rounded-full shadow-lg transition-all flex items-center gap-2 mb-5 hover:scale-105"
            >
              <Globe className="h-4 w-4 text-[#C8A951]" />
              Visit Tadbeer TT Website
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-[10.5px] font-black text-[#0D4F4F] bg-white border border-[#0D4F4F]/15 px-6 py-2.5 rounded-full shadow-sm">
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[#C8A951]" /> {d.ctaPhone || '+968 7630 7656'}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[#C8A951]" /> {d.ctaEmail || 'operation@tadbeertt.com'}</span>
              <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-[#C8A951]" /> www.tadbeertt.com</span>
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-2 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer TT</span>
            <span>PROPOSAL VALID UNTIL: <strong className="text-[#C8A951]">{d.proposalValidUntil}</strong></span>
          </div>
        </div>
      )
    }
  ]

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight
        const isMobile = window.innerWidth < 768
        const wScale = (width - (isMobile ? 12 : 32)) / 960
        const hScale = (height - (isMobile ? 12 : 32)) / 540
        setScale(Math.max(0.35, Math.min(1, Math.min(wScale, hScale))))
      }
    }
    const timer = setTimeout(handleResize, 100)
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [activeSlide])

  const handlePrev = () => {
    setActiveSlide(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setActiveSlide(prev => Math.min(slides.length - 1, prev + 1))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-0 md:p-4 animate-fade-in backdrop-blur-sm">
      <Card className="w-full max-w-[1240px] h-[100dvh] md:h-[92vh] overflow-hidden flex flex-col shadow-2xl bg-[#FAF9F6] border-0 rounded-none md:rounded-2xl">
        
        {/* Header bar */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-border flex items-center justify-between bg-white rounded-t-none md:rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <Presentation className="h-4 sm:h-5 w-4 sm:w-5 text-brand-teal" />
            <div>
              <h3 className="font-bold text-brand-teal text-[11px] sm:text-xs uppercase tracking-wider truncate max-w-[200px] sm:max-w-none">Executive Proposal Deck</h3>
              <p className="text-[10px] sm:text-[11px] text-text-secondary truncate max-w-[200px] sm:max-w-none">{company.company_name} · {slides.length} Interactive Slides</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-[#0D4F4F] hover:bg-[#0a3e3e] text-white shadow-sm transition-all press-effect"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl border border-border bg-white hover:bg-slate-50 text-text-secondary transition-all press-effect"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Slide Selector Strip */}
        <div className="md:hidden flex items-center gap-1.5 px-3 py-2 bg-white border-b border-border overflow-x-auto scrollbar-hide flex-shrink-0">
          {slides.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all",
                activeSlide === idx
                  ? "bg-brand-teal text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              )}
            >
              {idx + 1}. {s.title}
            </button>
          ))}
        </div>

        {/* Sidebar + Presenter split panel */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-100">
          
          {/* Left Sidebar: Slide Nav Thumbnails (Desktop) */}
          <div className="hidden md:flex w-[240px] border-r border-slate-200 bg-white flex-col overflow-y-auto p-3.5 gap-2 flex-shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Proposal Storyline</span>
            {slides.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-0.5 ${
                  activeSlide === idx
                    ? 'border-brand-teal bg-brand-teal/5 text-brand-teal font-extrabold shadow-sm'
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100/70 text-slate-600 font-semibold'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[8.5px] uppercase tracking-wider text-[#C8A951]">Slide 0{idx + 1}</span>
                  <Layers className={`h-3 w-3 ${activeSlide === idx ? 'text-brand-teal' : 'text-slate-300'}`} />
                </div>
                <div className="truncate text-slate-800 font-bold">{s.title}</div>
                <div className="truncate text-[9px] text-slate-400 font-normal">{s.subtitle}</div>
              </button>
            ))}
          </div>

          {/* Right Main Presenter Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/80 justify-between items-center p-2 sm:p-4 md:p-6 relative">
            
            {/* Aspect Ratio Canvas Container */}
            <div className="flex-1 w-full flex items-center justify-center min-h-0" ref={containerRef}>
              <div
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'center center',
                  width: '960px',
                  height: '540px'
                }}
                className="bg-[#FAF9F6] border border-slate-200 shadow-2xl relative box-border font-sans text-slate-800 flex-shrink-0 overflow-hidden flex flex-col rounded-xl transition-transform duration-100"
              >
                {/* Gold double header border bar */}
                <div className="absolute top-0 left-0 w-full h-[6px] bg-[#0D4F4F]" />
                <div className="absolute top-[6px] left-0 w-full h-[3px] bg-[#C8A951]" />

                {/* Main slide layout content */}
                {slides[activeSlide].render()}
              </div>
            </div>

            {/* Presenter bottom controls */}
            <div className="w-full max-w-[960px] flex items-center justify-between mt-2 sm:mt-4 bg-white border border-slate-200/80 px-3 sm:px-4 py-2 rounded-xl shadow-sm flex-shrink-0">
              <button
                onClick={handlePrev}
                disabled={activeSlide === 0}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 disabled:text-slate-300 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100"
              >
                <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Prev Slide</span>
              </button>

              <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                SLIDE 0{activeSlide + 1} OF 0{slides.length}
              </span>

              <button
                onClick={handleNext}
                disabled={activeSlide === slides.length - 1}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 disabled:text-slate-300 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100"
              >
                <span className="hidden sm:inline">Next Slide</span> <ChevronRight className="h-4 w-4" />
              </button>
            </div>

          </div>

        </div>
      </Card>
    </div>
  )
}
