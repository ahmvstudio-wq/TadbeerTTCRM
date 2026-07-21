'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, X, ChevronLeft, ChevronRight, Layers, Presentation, Trash2, CheckCircle2, Building2, Sparkles, Phone, Mail, Globe, ExternalLink, ShieldCheck, ArrowRight } from 'lucide-react'
import { CaseStudy, ApprovedClientLogo, CASE_STUDIES_LIBRARY, APPROVED_CLIENT_LOGOS, getRecommendedCaseStudies, getRecommendedClientLogos } from '@/lib/credibility-library'

// ── Extended Proposal Data Model ──────────────────────────────────────────
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
  // Cover Personalization
  coverTitleFormat?: string // e.g. "Tadbeer × {company}"
  tagline: string
  subtitle: string
  prospectLogoUrl?: string
  preparedDate?: string

  // Executive Summary & Contextual Metrics
  executiveSummaryText?: string
  heroStats: HeroStat[] // Legacy compatibility
  contextualMetrics?: ContextualMetric[]

  // About Tadbeer Context
  aboutTadbeerContext?: string

  // Credibility & Case Studies
  selectedCaseStudies?: CaseStudy[]
  selectedClientLogos?: ApprovedClientLogo[]

  // Diagnosis
  diagnosisIntro: string
  leaks: DiagnosisCard[]

  // Solution
  solutionIntro: string
  phases: PhaseCard[]
  solutionScreenshots?: SolutionScreenshot[]

  // CTA
  ctaHeading?: string
  ctaSubtext?: string
  ctaUrl?: string
  ctaPhone?: string
  ctaEmail?: string
  proposalValidUntil: string

  // Extras / Legacy
  additionalSections: AdditionalSection[]
}

interface ProposalPreviewProps {
  company: {
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

// ── Default factory ─────────────────────────────────────────────────────────
export function createDefaultProposalData(companyName: string, industry: string, contactName: string): ProposalData {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 30)
  const preparedStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const validStr = futureDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const recommendedStudies = getRecommendedCaseStudies(industry, 2)
  const recommendedLogos = getRecommendedClientLogos(industry, 6)

  return {
    coverTitleFormat: `Tadbeer × ${companyName}`,
    tagline: `Operational Transformation & Deterministic Growth Map for ${companyName}`,
    subtitle: `A precision operational assessment built specifically for ${companyName}. We identified critical workflow leaks and bottlenecks holding your team back from next-tier velocity.`,
    preparedDate: preparedStr,
    
    aboutTadbeerContext: `Based on the operational complexity across ${companyName}'s environment, Tadbeer's capabilities in process engineering, AI-driven automation, and CRM standardization provide a practical path toward seamless execution velocity.`,
    
    selectedCaseStudies: recommendedStudies,
    selectedClientLogos: recommendedLogos,

    executiveSummaryText: `During our preliminary audit of ${companyName}'s operations, we observed significant administrative friction and communication disconnects between departments. By shifting from reactive manual coordination to automated systems, ${companyName} can unlock immediate capacity and improve customer responsiveness.`,

    contextualMetrics: [
      { value: '25-35%', label: 'Operational Efficiency', context: 'Reduction in manual processing and repetitive coordinator overhead.', source: 'Workflow Audit' },
      { value: '3.2x', label: 'Response Velocity', context: 'Faster lead-to-first-touch acceleration via WhatsApp & automated routing.', source: 'Benchmark Model' },
      { value: '100%', label: 'System Compliance', context: 'Centralized tracking replacing isolated spreadsheets and chat logs.', source: 'Internal Risk Mapping' },
    ],

    heroStats: [
      { value: '25%', unit: 'increase', label: 'Operational Efficiency' },
      { value: '30%', unit: 'reduction', label: 'Manual Processing Time' },
      { value: '20%', unit: 'improvement', label: 'Revenue Visibility' },
      { value: '15%', unit: 'savings', label: 'Cost Optimization' },
    ],

    diagnosisIntro: `Our forensic assessment revealed 3 core operational vulnerabilities impacting ${companyName}'s growth and resource efficiency.`,
    leaks: [
      {
        type: 'LEAK',
        title: 'Manual Workflow Dependencies',
        description: `${companyName} currently relies on manual hand-offs for critical processes, leading to delayed response times and fragmented team collaboration.`,
        impact: 'High Impact · RO 180K/yr',
        visualType: 'card'
      },
      {
        type: 'RISK',
        title: 'Dispersed Information & Limited Visibility',
        description: `Critical prospect and operational data is scattered across spreadsheets, chat logs, and emails—creating risks of lost leads and limited auditability.`,
        impact: 'Medium Exposure · 15% Leakage',
        visualType: 'card'
      },
      {
        type: 'GAP',
        title: 'Absence of Automated Follow-Up Infrastructure',
        description: `${companyName} lacks automated nurturing and SLA tracking, resulting in slow follow-ups during key customer decision cycles.`,
        impact: 'Structural Gap · 35% Dropped Touchpoints',
        visualType: 'card'
      },
    ],

    solutionIntro: `We implement deterministic systems that replace manual coordination with automated workflows and real-time management dashboards.`,
    phases: [
      {
        phaseNum: 1,
        title: 'Phase 1: Operational Audit & Architecture',
        description: `Deep-dive workflow audit and technical blueprinting for ${companyName}'s specific operational environment within 14 days.`,
        intervention: 'Workflow Mapping & Schema Design',
        futureState: 'Complete architectural clarity & eliminated manual data silos.',
        timeline: '14 Days',
      },
      {
        phaseNum: 2,
        title: 'Phase 2: Core Automation & System Integration',
        description: `Deploy customized CRM, automated coordinator assignment, and multi-channel messaging integrations.`,
        intervention: 'CRM & Automated Coordinator Routing',
        futureState: 'Instant lead routing and zero lost prospects in email queues.',
        timeline: '30 Days',
      },
      {
        phaseNum: 3,
        title: 'Phase 3: Optimization & Continuous Intelligence',
        description: `Deploy executive dashboards, automated SLA alerts, and staff training to ensure long-term adoption.`,
        intervention: 'Executive Analytics & AI Alerts',
        futureState: 'Real-time revenue visibility and automated performance governance.',
        timeline: '45 Days',
      },
    ],

    solutionScreenshots: [],

    ctaHeading: 'Initiate Strategic Transformation Session',
    ctaSubtext: 'Schedule a 45-minute deep-dive session to review the findings and examine the live system prototype.',
    ctaUrl: 'https://www.tadbeertt.com',
    ctaPhone: '+968 7630 7656',
    ctaEmail: 'operation@tadbeertt.com',
    proposalValidUntil: validStr,

    additionalSections: [],
  }
}

// ── Legacy content migration ────────────────────────────────────────────────
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

  // Raw text migration
  defaults.additionalSections.push({
    title: 'Additional Strategic Context',
    content: rawText.split('\n').filter(l => l.trim()),
  })
  return defaults
}

const DIAG_COLORS: Record<string, { border: string; bg: string; text: string; badge: string; severity: string; score: string }> = {
  LEAK: { border: '#EF4444', bg: '#FEF2F2', text: '#991B1B', badge: '#EF4444', severity: 'Critical Leak', score: '88%' },
  RISK: { border: '#F59E0B', bg: '#FFFBEB', text: '#92400E', badge: '#F59E0B', severity: 'High Risk', score: '74%' },
  GAP:  { border: '#3B82F6', bg: '#EFF6FF', text: '#1E40AF', badge: '#3B82F6', severity: 'Structural Gap', score: '65%' },
}

export function ProposalPdfPreview({ company, contact, proposalData, onClose }: ProposalPreviewProps) {
  const d = proposalData
  const [activeSlide, setActiveSlide] = useState(0)
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

  const coverTitle = (d.coverTitleFormat || `Tadbeer × ${company.company_name}`).replace('{company}', company.company_name)

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const caseStudiesHtml = (d.selectedCaseStudies || getRecommendedCaseStudies(company.industry, 2)).map(cs => `
      <div class="cs-card">
        <div class="cs-badge">${cs.industry.toUpperCase()}</div>
        <h3 class="cs-title">${cs.title}</h3>
        <p class="cs-desc"><strong>Client:</strong> ${cs.clientName}</p>
        <p class="cs-desc"><strong>Problem:</strong> ${cs.problemSummary}</p>
        <p class="cs-desc"><strong>Solution:</strong> ${cs.solutionSummary}</p>
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

    const clientLogosHtml = (d.selectedClientLogos || getRecommendedClientLogos(company.industry, 6)).map(l => `
      <div class="client-logo-box">
        <span class="client-name">${l.clientName}</span>
      </div>
    `).join('')

    const metricsHtml = (d.contextualMetrics || []).map(m => `
      <div class="context-metric-card">
        <div class="cm-val">${m.value}</div>
        <div class="cm-lbl">${m.label}</div>
        <div class="cm-ctx">${m.context}</div>
        ${m.source ? `<div class="cm-src">Source: ${m.source}</div>` : ''}
      </div>
    `).join('')

    const diagCardsHtml = d.leaks.map((l, i) => {
      const c = DIAG_COLORS[l.type] || DIAG_COLORS.LEAK
      return `
        <div class="diag-card" style="border-left: 4px solid ${c.border}; background: ${c.bg};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <span class="diag-badge" style="background: ${c.badge};">${l.type}</span>
            <span style="font-size: 9px; font-weight: 800; color: ${c.text}; text-transform: uppercase;">${l.impact || c.severity}</span>
          </div>
          <h3 class="diag-title" style="color: ${c.text};">${l.title}</h3>
          <p class="diag-desc">${l.description}</p>
          <div class="infographic-meter-wrapper">
            <div style="display: flex; justify-content: space-between; font-size: 8px; font-weight: 700; color: #4B5563; margin-bottom: 4px;">
              <span>SEVERITY / IMPACT SCORE</span>
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
      <div class="phase-card">
        <div class="phase-card-header">
          <span class="phase-num">PHASE ${String(p.phaseNum).padStart(2, '0')}</span>
          ${p.timeline ? `<span class="phase-timeline-badge">${p.timeline}</span>` : ''}
        </div>
        <h3 class="phase-title">${p.title}</h3>
        <p class="phase-desc">${p.description}</p>
        ${p.intervention ? `<div class="phase-detail"><strong>Intervention:</strong> ${p.intervention}</div>` : ''}
        ${p.futureState ? `<div class="phase-detail"><strong>Target State:</strong> ${p.futureState}</div>` : ''}
      </div>
    `).join('')

    const additionalPagesHtml = d.additionalSections
      .filter(sec => sec.title !== 'WhatsApp Message')
      .map((sec, idx) => `
      <div class="slide">
        <div class="top-bar-teal"></div>
        <div class="top-bar-gold"></div>
        
        <div class="slide-header-bar">
          <span class="slide-header-title">STRATEGIC OPERATIONAL INTELLIGENCE</span>
          <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
        </div>

        <div class="content-body">
          <div class="section-number">${String(idx + 7).padStart(2, '0')} // ${sec.title.toUpperCase()}</div>
          <h1 class="section-heading">${sec.title}</h1>
          <div class="additional-content">
            ${sec.content.map(c => `<p class="slide-text">${c}</p>`).join('')}
          </div>
        </div>
        <div class="slide-footer">
          <span>Tadbeer Transformations</span>
          <span>Confidential // Proprietary Strategic Report</span>
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
    padding: 18mm 22mm 14mm;
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
    top: 6mm; left: 6mm; right: 6mm; bottom: 6mm;
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
    padding-bottom: 6px; margin-bottom: 8mm;
    position: relative; z-index: 10;
  }
  .slide-header-title {
    font-size: 8px; font-weight: 900; letter-spacing: 3px;
    color: #0D4F4F; text-transform: uppercase;
  }
  .slide-header-logo { height: 20px; object-fit: contain; }

  /* ── COVER ── */
  .cover-brands {
    display: flex; justify-content: center; align-items: center; gap: 24px;
    margin-bottom: 12mm;
  }
  .cover-brand-logo { height: 38px; object-fit: contain; }
  .cover-divider { font-size: 24px; font-weight: 900; color: #C8A951; }
  .cover-prospect-badge {
    background: white; border: 1px solid rgba(13,79,79,0.15);
    padding: 8px 18px; border-radius: 30px;
    font-size: 14px; font-weight: 800; color: #0D4F4F;
    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  }
  .cover-title {
    font-family: 'Playfair Display', serif;
    font-size: 34px; font-weight: 900; color: #0D4F4F;
    text-align: center; margin-bottom: 12px; line-height: 1.25;
  }
  .cover-sub {
    font-size: 12.5px; color: #555; max-width: 650px;
    margin: 0 auto 20px; text-align: center; line-height: 1.6;
  }
  .cover-meta {
    display: flex; justify-content: center; gap: 32px;
    font-size: 9px; font-weight: 800; color: #0D4F4F;
    text-transform: uppercase; letter-spacing: 1.5px;
  }

  /* ── CONTENT BODY ── */
  .content-body { flex: 1; position: relative; z-index: 10; }
  .section-number {
    font-size: 9.5px; font-weight: 850; letter-spacing: 2.5px; color: #C8A951;
    text-transform: uppercase; margin-bottom: 4px;
  }
  .section-heading {
    font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 900;
    color: #0D4F4F; margin-bottom: 6px; border-bottom: 2px solid #C8A951;
    display: inline-block; padding-bottom: 2px;
  }
  .section-sub { font-size: 11.5px; color: #555; line-height: 1.5; margin-bottom: 18px; }

  /* Case Studies Layout */
  .cs-grid { display: flex; gap: 16px; margin-bottom: 18px; }
  .cs-card {
    flex: 1; background: white; border: 1px solid #E6E1D8;
    border-top: 4px solid #0D4F4F; border-radius: 12px; padding: 16px;
  }
  .cs-badge { font-size: 8px; font-weight: 850; color: #C8A951; letter-spacing: 1.5px; margin-bottom: 4px; }
  .cs-title { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 800; color: #0D4F4F; margin-bottom: 6px; }
  .cs-desc { font-size: 9.5px; color: #555; margin-bottom: 4px; line-height: 1.5; }
  .cs-outcome { font-size: 9.5px; font-weight: 700; color: #0D4F4F; background: #FAF9F6; padding: 6px; border-radius: 6px; margin-top: 8px; }
  .cs-metrics-row { display: flex; gap: 12px; margin-top: 10px; }
  .cs-metric { flex: 1; background: #0D4F4F; color: white; border-radius: 6px; padding: 8px; text-align: center; }
  .cs-val { font-size: 16px; font-weight: 900; color: #C8A951; display: block; }
  .cs-lbl { font-size: 7.5px; font-weight: 700; text-transform: uppercase; color: rgba(255,255,255,0.8); }

  /* Client Logos Strip */
  .logos-strip {
    display: flex; gap: 12px; align-items: center; justify-content: space-around;
    background: white; border: 1px solid #E6E1D8; border-radius: 10px; padding: 12px;
  }
  .client-logo-box {
    padding: 6px 12px; background: #FAF9F6; border-radius: 6px;
    font-size: 9.5px; font-weight: 800; color: #0D4F4F; text-transform: uppercase; letter-spacing: 0.5px;
  }

  /* Executive Metrics */
  .metrics-grid { display: flex; gap: 16px; margin-top: 14px; }
  .context-metric-card {
    flex: 1; background: white; border: 1px solid #E6E1D8; border-top: 4px solid #C8A951;
    border-radius: 12px; padding: 16px; text-align: center;
  }
  .cm-val { font-size: 28px; font-weight: 900; color: #0D4F4F; }
  .cm-lbl { font-size: 10px; font-weight: 800; color: #C8A951; text-transform: uppercase; margin: 4px 0; }
  .cm-ctx { font-size: 9.5px; color: #555; line-height: 1.4; }
  .cm-src { font-size: 8px; color: #9CA3AF; margin-top: 6px; font-style: italic; }

  /* Diagnosis Cards */
  .diag-cards { display: flex; gap: 14px; }
  .diag-card { flex: 1; border-radius: 12px; padding: 18px; background: white; border: 1px solid rgba(0,0,0,0.05); }
  .diag-badge { padding: 2px 8px; border-radius: 4px; font-size: 8px; font-weight: 900; color: white; }
  .diag-title { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 850; margin: 8px 0 4px; }
  .diag-desc { font-size: 9.5px; color: #555; line-height: 1.5; }
  .infographic-meter-wrapper { margin-top: 10px; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 8px; }
  .infographic-meter-track { width: 100%; height: 5px; background: rgba(0,0,0,0.06); border-radius: 3px; overflow: hidden; }
  .infographic-meter-fill { height: 100%; border-radius: 3px; }

  /* Phases */
  .phase-cards { display: flex; gap: 14px; }
  .phase-card { flex: 1; background: white; border: 1px solid #E6E1D8; border-top: 4px solid #0D4F4F; border-radius: 12px; padding: 16px; }
  .phase-card-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .phase-num { font-size: 8.5px; font-weight: 800; color: #C8A951; letter-spacing: 1.5px; }
  .phase-timeline-badge { background: rgba(200, 169, 81, 0.15); color: #8c6e1c; font-size: 8.5px; font-weight: 800; padding: 1px 6px; border-radius: 4px; }
  .phase-title { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 850; color: #0D4F4F; margin-bottom: 4px; }
  .phase-desc { font-size: 9.5px; color: #555; line-height: 1.5; }
  .phase-detail { font-size: 8.5px; color: #0D4F4F; margin-top: 6px; background: #FAF9F6; padding: 4px 6px; border-radius: 4px; }

  /* CTA */
  .cta-box {
    text-align: center; flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center;
  }
  .cta-title { font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 900; color: #0D4F4F; margin-bottom: 8px; }
  .cta-sub { font-size: 12px; color: #555; max-width: 500px; margin-bottom: 20px; line-height: 1.5; }
  .cta-btn {
    background: #0D4F4F; color: white; padding: 12px 28px; border-radius: 30px;
    font-size: 12px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 1px;
    display: inline-block; box-shadow: 0 4px 12px rgba(13, 79, 79, 0.25);
  }
  .cta-contact-row { display: flex; gap: 24px; margin-top: 24px; font-size: 10px; font-weight: 700; color: #0D4F4F; }

  /* Footer */
  .slide-footer {
    border-top: 1px solid #E6E1D8; padding-top: 8px;
    display: flex; justify-content: space-between; font-size: 8px; color: #9CA3AF;
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
      <div></div>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" style="height: 30px;" alt="Tadbeer Logo" />
    </div>

    <div class="content-body" style="display:flex;flex-direction:column;justify-content:center;">
      <div class="cover-brands">
        <img src="/logo/tadbeer-logo.png" class="cover-brand-logo" alt="Tadbeer Logo" />
        <span class="cover-divider">×</span>
        <div class="cover-prospect-badge">${company.company_name}</div>
      </div>
      <h1 class="cover-title">${coverTitle}</h1>
      <p class="cover-sub">${d.subtitle}</p>
      <div class="cover-meta">
        <div>PREPARED FOR: <span>${contact.full_name} (${contact.title || 'Executive'})</span></div>
        <div>PREPARED DATE: <span>${d.preparedDate || 'July 2026'}</span></div>
        <div>CONFIDENTIALITY: <span>STRICTLY CONFIDENTIAL</span></div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer Transformations</span>
      <span>PROPRIETARY STRATEGIC COLLABORATION REPORT</span>
    </div>
  </div>

  <!-- SLIDE 2: ABOUT TADBEER / CONTEXT -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar">
      <span class="slide-header-title">STRATEGIC OPERATIONAL INTELLIGENCE</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
    </div>

    <div class="content-body">
      <div class="section-number">02 // ABOUT TADBEER & PURPOSE OF CONVERSATION</div>
      <h1 class="section-heading">Why We Reached Out to ${company.company_name}</h1>
      <p class="section-sub">${d.aboutTadbeerContext}</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px;">
        <div style="background: white; border: 1px solid #E6E1D8; border-left: 4px solid #0D4F4F; border-radius: 12px; padding: 20px;">
          <h4 style="font-size: 12px; font-weight: 900; color: #0D4F4F; text-transform: uppercase; margin-bottom: 8px;">Deterministic Transformation</h4>
          <p style="font-size: 10px; color: #555; line-height: 1.6;">We replace ad-hoc manual execution, unorganized spreadsheets, and email dependencies with deterministic software systems, automated coordinator routing, and real-time oversight dashboards.</p>
        </div>
        <div style="background: white; border: 1px solid #E6E1D8; border-left: 4px solid #C8A951; border-radius: 12px; padding: 20px;">
          <h4 style="font-size: 12px; font-weight: 900; color: #0D4F4F; text-transform: uppercase; margin-bottom: 8px;">Relevance Before Relationship</h4>
          <p style="font-size: 10px; color: #555; line-height: 1.6;">Rather than pitching generic software packages, we conduct pre-contact operational analysis to identify the exact friction points and revenue leaks unique to your industry model.</p>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer Transformations</span>
      <span>PROPRIETARY OPERATIONAL INTELLIGENCE</span>
    </div>
  </div>

  <!-- SLIDE 3: RELEVANT CASE STUDIES & CREDIBILITY -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar">
      <span class="slide-header-title">STRATEGIC OPERATIONAL INTELLIGENCE</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
    </div>

    <div class="content-body">
      <div class="section-number">03 // RELEVANT CASE STUDIES & CREDIBILITY</div>
      <h1 class="section-heading">Proven Impact in ${company.industry || 'Your Sector'}</h1>
      <p class="section-sub">Verified transformation outcomes across peer organizations facing similar operational complexity.</p>
      
      <div class="cs-grid">${caseStudiesHtml}</div>
      
      <div style="margin-top: 10px;">
        <span style="font-size: 8.5px; font-weight: 850; color: #C8A951; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">Selected Approved Enterprise Partners</span>
        <div class="logos-strip">${clientLogosHtml}</div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer Transformations</span>
      <span>VERIFIED CLIENT CREDIBILITY</span>
    </div>
  </div>

  <!-- SLIDE 4: EXECUTIVE SUMMARY & METRICS -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar">
      <span class="slide-header-title">STRATEGIC OPERATIONAL INTELLIGENCE</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
    </div>

    <div class="content-body">
      <div class="section-number">04 // EXECUTIVE SUMMARY</div>
      <h1 class="section-heading">Executive Context & Impact Opportunities</h1>
      <p class="section-sub">${d.executiveSummaryText}</p>
      
      <div class="metrics-grid">${metricsHtml}</div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer Transformations</span>
      <span>EXECUTIVE CONTEXT</span>
    </div>
  </div>

  <!-- SLIDE 5: FORENSIC DIAGNOSIS -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar">
      <span class="slide-header-title">STRATEGIC OPERATIONAL INTELLIGENCE</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
    </div>

    <div class="content-body">
      <div class="section-number">05 // FORENSIC DIAGNOSIS</div>
      <h1 class="section-heading">Where ${company.company_name} is Bleeding</h1>
      <p class="section-sub">${d.diagnosisIntro}</p>
      <div class="diag-cards">${diagCardsHtml}</div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer Transformations</span>
      <span>FORENSIC DIAGNOSIS</span>
    </div>
  </div>

  <!-- SLIDE 6: SOLUTION ARCHITECTURE -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar">
      <span class="slide-header-title">STRATEGIC OPERATIONAL INTELLIGENCE</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
    </div>

    <div class="content-body">
      <div class="section-number">06 // TAILORED SOLUTION ARCHITECTURE</div>
      <h1 class="section-heading">90-Day Implementation Blueprint</h1>
      <p class="section-sub">${d.solutionIntro}</p>

      <div class="phase-cards">${phaseCardsHtml}</div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer Transformations</span>
      <span>SOLUTION BLUEPRINT</span>
    </div>
  </div>

  ${additionalPagesHtml}

  <!-- FINAL SLIDE: CTA -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="cta-box">
      <img src="/logo/tadbeer-logo.png" style="height: 40px; margin-bottom: 14px;" alt="Tadbeer Logo" />
      <div class="section-number">NEXT STEPS</div>
      <h1 class="cta-title">${d.ctaHeading || 'Initiate Strategic Transformation Session'}</h1>
      <p class="cta-sub">${d.ctaSubtext || 'Let us walk through the complete diagnostic data set and implementation timeline.'}</p>
      
      <a href="${d.ctaUrl || 'https://www.tadbeertt.com'}" target="_blank" class="cta-btn">
        Explore Strategic Assessment
      </a>

      <div class="cta-contact-row">
        <div>PHONE: <span>${d.ctaPhone || '+968 7630 7656'}</span></div>
        <div>EMAIL: <span>${d.ctaEmail || 'operation@tadbeertt.com'}</span></div>
        <div>WEB: <span>${d.ctaUrl || 'www.tadbeertt.com'}</span></div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer Transformations</span>
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

  const selectedStudies = d.selectedCaseStudies && d.selectedCaseStudies.length > 0 ? d.selectedCaseStudies : getRecommendedCaseStudies(company.industry, 2)
  const selectedLogos = d.selectedClientLogos && d.selectedClientLogos.length > 0 ? d.selectedClientLogos : getRecommendedClientLogos(company.industry, 6)
  const metricsList = d.contextualMetrics && d.contextualMetrics.length > 0 ? d.contextualMetrics : [
    { value: '25%', label: 'Operational Efficiency', context: 'Reduction in manual processing and coordinator overhead.' },
    { value: '3.2x', label: 'Response Velocity', context: 'Faster lead-to-first-touch acceleration via WhatsApp.' },
    { value: '100%', label: 'System Auditability', context: 'Centralized tracking replacing isolated spreadsheets.' }
  ]

  const slides = [
    // Slide 1: Personalized Cover
    {
      title: 'Cover Page',
      subtitle: 'Personalized Collaboration',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[45px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">STRATEGIC COLLABORATION REPORT</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col items-center justify-center text-center my-4 z-20">
            <div className="flex items-center justify-center gap-4 mb-5">
              <img src="/logo/tadbeer-logo.png" className="h-9 object-contain" alt="Tadbeer Logo" />
              <span className="text-xl font-bold text-[#C8A951]">×</span>
              <div className="bg-white border border-[#0D4F4F]/15 px-4 py-1.5 rounded-full text-xs font-black text-[#0D4F4F] shadow-sm flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-brand-teal" />
                {company.company_name}
              </div>
            </div>

            <h1 className="text-3xl font-extrabold text-[#0D4F4F] leading-tight max-w-[760px] mx-auto mb-3 font-serif">
              {coverTitle}
            </h1>
            <p className="text-[12px] text-slate-500 max-w-[620px] mx-auto leading-relaxed">
              {d.subtitle}
            </p>
          </div>

          <div className="border-t border-[#E6E1D8] pt-3 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>PREPARED FOR: <strong className="text-[#0D4F4F]">{contact.full_name}</strong> ({contact.title || 'Executive'})</span>
            <span>DATE: {d.preparedDate || 'July 2026'}</span>
            <span>TADBEER TRANSFORMATIONS</span>
          </div>
        </div>
      )
    },
    // Slide 2: About Tadbeer Context
    {
      title: 'About Tadbeer',
      subtitle: 'Why This Conversation',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[45px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">ABOUT TADBEER TRANSFORMATIONS</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-center my-3 z-20">
            <p className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-1">02 // ABOUT TADBEER & PURPOSE OF CONVERSATION</p>
            <h2 className="text-2xl font-extrabold text-[#0D4F4F] mb-2 font-serif border-b border-[#C8A951] inline-block pb-1">Why We Reached Out to {company.company_name}</h2>
            <p className="text-[11.5px] text-slate-600 leading-relaxed max-w-[720px] mb-4">{d.aboutTadbeerContext}</p>

            <div className="grid grid-cols-2 gap-5">
              <div className="bg-white border border-[#E6E1D8] border-l-4 border-l-[#0D4F4F] rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="h-4 w-4 text-brand-teal" />
                  <h4 className="text-[11px] font-extrabold text-[#0D4F4F] uppercase tracking-wider">Deterministic Systems</h4>
                </div>
                <p className="text-[9.5px] text-slate-500 leading-relaxed">We replace manual dependencies, unorganized spreadsheets, and email loops with structured workflow software, automated coordinator routing, and real-time management dashboards.</p>
              </div>

              <div className="bg-white border border-[#E6E1D8] border-l-4 border-l-[#C8A951] rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="h-4 w-4 text-[#C8A951]" />
                  <h4 className="text-[11px] font-extrabold text-[#0D4F4F] uppercase tracking-wider">Relevance Before Pitch</h4>
                </div>
                <p className="text-[9.5px] text-slate-500 leading-relaxed">Rather than presenting generic brochures, we conduct pre-contact operational analysis to identify the exact friction points and revenue leaks specific to {company.company_name}'s market position.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-3 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>PROPRIETARY OPERATIONAL INTELLIGENCE</span>
          </div>
        </div>
      )
    },
    // Slide 3: Case Studies & Credibility
    {
      title: 'Client Credibility',
      subtitle: 'Relevant Case Studies',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[45px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">PROVEN INDUSTRY CREDIBILITY</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-center my-3 z-20">
            <p className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-1">03 // RELEVANT CASE STUDIES & CLIENT CREDIBILITY</p>
            <h2 className="text-2xl font-extrabold text-[#0D4F4F] mb-1 font-serif border-b border-[#C8A951] inline-block pb-1">Proven Transformation in {company.industry || 'Your Sector'}</h2>
            <p className="text-[11px] text-slate-500 mb-3">Verified outcomes across peer GCC organizations facing similar operational complexity.</p>

            <div className="grid grid-cols-2 gap-4 mb-3">
              {selectedStudies.map((cs, i) => (
                <div key={i} className="bg-white border border-[#E6E1D8] border-t-4 border-t-[#0D4F4F] rounded-xl p-3.5 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-black text-[#C8A951] uppercase tracking-wider">{cs.industry}</span>
                    <Badge variant="outline" className="text-[8px] border-emerald-300 text-emerald-700 bg-emerald-50 font-bold">Verified Result</Badge>
                  </div>
                  <h4 className="text-[12px] font-extrabold font-serif text-[#0D4F4F] mb-1">{cs.title}</h4>
                  <p className="text-[9px] text-slate-600 mb-1 leading-snug"><strong>Client:</strong> {cs.clientName}</p>
                  <p className="text-[9px] text-slate-500 mb-2 leading-snug line-clamp-2">{cs.problemSummary}</p>
                  <div className="bg-[#FAF9F6] p-1.5 rounded text-[8.5px] font-bold text-[#0D4F4F] border border-black/5 mb-2">
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
              ))}
            </div>

            <div>
              <span className="text-[8px] font-extrabold text-[#C8A951] uppercase tracking-widest block mb-1">Selected Approved Enterprise Partners</span>
              <div className="flex gap-2 items-center justify-between bg-white border border-[#E6E1D8] rounded-lg p-2">
                {selectedLogos.map((l, li) => (
                  <div key={li} className="bg-[#FAF9F6] px-2.5 py-1 rounded text-[8.5px] font-extrabold text-[#0D4F4F] uppercase tracking-wider border border-black/5 truncate max-w-[130px]">
                    {l.clientName}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-2.5 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>VERIFIED CLIENT CREDIBILITY</span>
          </div>
        </div>
      )
    },
    // Slide 4: Executive Summary & Context Metrics
    {
      title: 'Executive Summary',
      subtitle: 'Context & Impact Metrics',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[45px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">EXECUTIVE SUMMARY</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-center my-3 z-20">
            <p className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-1">04 // EXECUTIVE SUMMARY & CONTEXT METRICS</p>
            <h2 className="text-2xl font-extrabold text-[#0D4F4F] mb-2 font-serif border-b border-[#C8A951] inline-block pb-1">Executive Assessment for {company.company_name}</h2>
            <p className="text-[11.5px] text-slate-600 leading-relaxed max-w-[720px] mb-4">{d.executiveSummaryText}</p>

            <div className="grid grid-cols-3 gap-4">
              {metricsList.map((m, i) => (
                <div key={i} className="bg-white border border-[#E6E1D8] border-t-4 border-t-[#C8A951] rounded-xl p-4 text-center shadow-sm">
                  <div className="text-2xl font-black text-[#0D4F4F] leading-none mb-1">{m.value}</div>
                  <h4 className="text-[10px] font-extrabold text-[#C8A951] uppercase tracking-wider mb-1.5">{m.label}</h4>
                  <p className="text-[9px] text-slate-500 leading-relaxed">{m.context}</p>
                  {m.source && <span className="text-[7.5px] text-slate-400 italic block mt-2">Source: {m.source}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-3 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>EXECUTIVE CONTEXT</span>
          </div>
        </div>
      )
    },
    // Slide 5: Forensic Diagnosis
    {
      title: 'Forensic Diagnosis',
      subtitle: 'Where You Bleed',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[45px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">STRATEGIC DIAGNOSIS</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-center my-3 z-20">
            <p className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-1">05 // FORENSIC DIAGNOSIS</p>
            <h2 className="text-2xl font-extrabold text-[#0D4F4F] mb-2 font-serif border-b border-[#C8A951] inline-block pb-1">Where {company.company_name} is Bleeding</h2>
            <p className="text-[11.5px] text-slate-500 leading-relaxed max-w-[680px] mb-4">{d.diagnosisIntro}</p>

            <div className="flex gap-4">
              {d.leaks.map((l, i) => {
                const c = DIAG_COLORS[l.type] || DIAG_COLORS.LEAK
                return (
                  <div key={i} className="flex-1 rounded-xl p-4 flex flex-col justify-between min-h-[180px] border border-black/5 bg-white shadow-sm" style={{ borderLeft: `4px solid ${c.border}` }}>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="inline-block px-2.5 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-wider" style={{ background: c.badge }}>
                          {l.type}
                        </span>
                        <span className="text-[8.5px] font-bold uppercase tracking-wider" style={{ color: c.text }}>{l.impact || c.severity}</span>
                      </div>
                      <h4 className="text-[12px] font-extrabold font-serif mb-1" style={{ color: c.text }}>{l.title}</h4>
                      <p className="text-[9.5px] text-slate-500 leading-relaxed">{l.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-black/5">
                      <div className="flex justify-between text-[8px] font-bold text-slate-500 mb-1">
                        <span>IMPACT LEVEL</span>
                        <span>{c.score}</span>
                      </div>
                      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: c.score, background: c.border }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-3 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>PROPRIETARY FORENSIC DIAGNOSIS</span>
          </div>
        </div>
      )
    },
    // Slide 6: Solution Architecture
    {
      title: 'Solution Roadmap',
      subtitle: '90-Day Overhaul',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[45px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">TAILORED SOLUTION ARCHITECTURE</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-center my-3 z-20">
            <p className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-1">06 // THE SOLUTION</p>
            <h2 className="text-2xl font-extrabold text-[#0D4F4F] mb-2 font-serif border-b border-[#C8A951] inline-block pb-1">90-Day Operational Overhaul</h2>
            <p className="text-[11.5px] text-slate-500 leading-relaxed max-w-[680px] mb-3">{d.solutionIntro}</p>

            <div className="flex gap-4">
              {d.phases.map((p, i) => (
                <div key={i} className="flex-1 bg-white border border-[#E6E1D8] border-t-4 border-t-brand-teal rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[8px] font-extrabold text-[#C8A951] tracking-widest uppercase">PHASE 0{p.phaseNum}</p>
                    {p.timeline && <span className="bg-brand-gold/12 text-[#8c6e1c] text-[8px] font-extrabold px-1.5 py-0.5 rounded">{p.timeline}</span>}
                  </div>
                  <h4 className="text-[12px] font-extrabold font-serif text-[#0D4F4F] mb-1 truncate">{p.title}</h4>
                  <p className="text-[9.5px] text-slate-500 leading-relaxed mb-2">{p.description}</p>
                  {p.intervention && (
                    <div className="text-[8.5px] bg-[#FAF9F6] p-1.5 rounded border border-black/5 text-[#0D4F4F] font-semibold mb-1">
                      <strong>Intervention:</strong> {p.intervention}
                    </div>
                  )}
                  {p.futureState && (
                    <div className="text-[8.5px] bg-emerald-50/60 p-1.5 rounded border border-emerald-200/50 text-emerald-800 font-semibold">
                      <strong>Target Outcome:</strong> {p.futureState}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-3 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>SOLUTION BLUEPRINT</span>
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
        <div className="flex-1 flex flex-col justify-between p-[45px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">STRATEGIC OPERATIONAL INTELLIGENCE</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-center my-3 z-20">
            <p className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-1">{String(idx + 7).padStart(2, '0')} // {sec.title.toUpperCase()}</p>
            <h2 className="text-2xl font-extrabold text-[#0D4F4F] mb-3 font-serif border-b-2 border-[#C8A951] inline-block pb-1">{sec.title}</h2>
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 mt-2">
              {sec.content.map((c, ci) => (
                <p key={ci} className="text-[11px] text-slate-600 leading-relaxed border-l-2 border-[#C8A951]/40 pl-3 italic">{c}</p>
              ))}
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-3 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>PROPRIETARY INTELLIGENCE</span>
          </div>
        </div>
      )
    })),
    // Slide Last: CTA
    {
      title: 'Initiate Session',
      subtitle: 'Next Steps & Contact',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[45px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal uppercase">NEXT STEPS & ACTION PLAN</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col items-center justify-center text-center my-3 z-20">
            <img src="/logo/tadbeer-logo.png" className="h-10 object-contain mb-3" alt="Tadbeer Logo" />
            <p className="text-[9.5px] font-black tracking-[3px] text-[#C8A951] uppercase mb-1">NEXT STEP</p>
            <h1 className="text-2xl font-extrabold text-[#0D4F4F] mb-2 font-serif">{d.ctaHeading || 'Initiate Strategic Transformation Session'}</h1>
            <p className="text-[11.5px] text-slate-500 mb-4 max-w-[520px]">{d.ctaSubtext || 'Schedule a 45-minute deep-dive session to review the complete diagnostic data set and implementation timeline.'}</p>
            
            <a
              href={d.ctaUrl || 'https://www.tadbeertt.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0D4F4F] hover:bg-[#0a3e3e] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-md transition-all hover-lift flex items-center gap-2 mb-4"
            >
              <Globe className="h-3.5 w-3.5 text-[#C8A951]" />
              Explore Tadbeer Strategic Assessment
              <ExternalLink className="h-3 w-3" />
            </a>

            <div className="flex gap-6 text-[10px] font-bold text-[#0D4F4F] bg-white border border-[#0D4F4F]/10 px-5 py-2 rounded-full shadow-sm">
              <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-[#C8A951]" /> {d.ctaPhone || '+968 7630 7656'}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-[#C8A951]" /> {d.ctaEmail || 'operation@tadbeertt.com'}</span>
              <span className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-[#C8A951]" /> www.tadbeertt.com</span>
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-2.5 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>PROPOSAL VALID UNTIL: <strong className="text-[#C8A951]">{d.proposalValidUntil}</strong></span>
          </div>
        </div>
      )
    }
  ]

  const handlePrev = () => {
    setActiveSlide(prev => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setActiveSlide(prev => Math.min(slides.length - 1, prev + 1))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-sm">
      <Card className="w-full max-w-[1240px] h-[90vh] overflow-hidden flex flex-col shadow-2xl bg-[#FAF9F6] border-0 animate-scale-in rounded-2xl">
        
        {/* Header bar */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Presentation className="h-5 w-5 text-brand-teal" />
            <div>
              <h3 className="font-bold text-brand-teal text-xs uppercase tracking-wider">Tadbeer Personalized Sales Proposal Engine</h3>
              <p className="text-[11px] text-text-secondary">{company.company_name} · {slides.length} Interactive Slides Available</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0D4F4F] hover:bg-[#0a3e3e] text-white shadow-sm transition-all press-effect"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-border bg-white hover:bg-slate-50 text-text-secondary transition-all press-effect"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sidebar + Presenter split panel */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-100">
          
          {/* Left Sidebar: Slide Nav Thumbnails */}
          <div className="w-[260px] border-r border-slate-200 bg-white flex flex-col overflow-y-auto p-4 gap-2 flex-shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Proposal Storyline</span>
            {slides.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                  activeSlide === idx
                    ? 'border-brand-teal bg-brand-teal/5 text-brand-teal font-extrabold shadow-sm'
                    : 'border-slate-100 bg-slate-50 hover:bg-slate-100/70 text-slate-600 font-semibold'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[9px] uppercase tracking-wider text-[#C8A951]">Slide 0{idx + 1}</span>
                  <Layers className={`h-3 w-3 ${activeSlide === idx ? 'text-brand-teal' : 'text-slate-300'}`} />
                </div>
                <div className="truncate text-slate-800">{s.title}</div>
                <div className="truncate text-[9.5px] text-slate-400 font-normal">{s.subtitle}</div>
              </button>
            ))}
          </div>

          {/* Right Main Presenter Area */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-100/80 justify-between items-center p-6 relative">
            
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
            <div className="w-full max-w-[960px] flex items-center justify-between mt-4 bg-white border border-slate-200/80 px-4 py-2.5 rounded-xl shadow-sm flex-shrink-0">
              <button
                onClick={handlePrev}
                disabled={activeSlide === 0}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 disabled:text-slate-300 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Prev Slide
              </button>

              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
                SLIDE 0{activeSlide + 1} OF 0{slides.length}
              </span>

              <button
                onClick={handleNext}
                disabled={activeSlide === slides.length - 1}
                className="flex items-center gap-1 text-xs font-bold text-slate-600 disabled:text-slate-300 transition-colors"
              >
                Next Slide <ChevronRight className="h-4 w-4" />
              </button>
            </div>

          </div>

        </div>
      </Card>
    </div>
  )
}
