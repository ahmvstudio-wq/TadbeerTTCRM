'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { FileText, Download, X, ChevronLeft, ChevronRight, Layers, Presentation, Trash2 } from 'lucide-react'

// ── Structured Proposal Data Model ──────────────────────────────────────────
export interface HeroStat {
  value: string
  unit: string
  label: string
}

export interface DiagnosisCard {
  type: 'LEAK' | 'RISK' | 'GAP'
  title: string
  description: string
}

export interface PhaseCard {
  phaseNum: number
  title: string
  description: string
  timeline?: string
}

export interface AdditionalSection {
  title: string
  content: string[]
}

export interface ProposalData {
  // Cover
  heroStats: HeroStat[]
  tagline: string
  subtitle: string
  // Diagnosis
  diagnosisIntro: string
  leaks: DiagnosisCard[]
  // Solution
  solutionIntro: string
  phases: PhaseCard[]
  // CTA
  proposalValidUntil: string
  // Extras
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
  return {
    heroStats: [
      { value: '25', unit: '% increase', label: 'Operational Efficiency' },
      { value: '30', unit: '% reduction', label: 'Manual Processing Time' },
      { value: '20', unit: '% improvement', label: 'Revenue Visibility' },
      { value: '15', unit: '% savings', label: 'Cost Optimization' },
    ],
    tagline: `The Reverse-Engineered Path to Dominance for ${companyName}`,
    subtitle: `A precision growth map built from the top down. We identified the exact operational leaks and revenue bottlenecks holding ${companyName} back from the next tier of scale.`,
    diagnosisIntro: `Our deep-scrape and market analysis revealed 3 critical gaps in ${companyName}'s current operational infrastructure.`,
    leaks: [
      {
        type: 'LEAK',
        title: 'Manual Workflow Dependencies',
        description: `${companyName} is currently managing key business processes manually, resulting in wasted hours, duplicated work, and inconsistent output quality across departments.`,
      },
      {
        type: 'RISK',
        title: 'Limited Operational Visibility',
        description: `Critical business information is distributed between spreadsheets, WhatsApp conversations, email threads, and individual employees — creating a growing risk of delays and limited management oversight.`,
      },
      {
        type: 'GAP',
        title: 'Absence of Scalable Systems',
        description: `${companyName}'s current infrastructure lacks the systematic foundations needed to support continued growth — no centralized CRM, no automated reporting, no standardized client journey.`,
      },
    ],
    solutionIntro: `We don't just build software. We implement the systems that replace manual labor with deterministic growth.`,
    phases: [
      {
        phaseNum: 1,
        title: `Phase 1: Operational Audit & System Design`,
        description: `Conduct a thorough audit of ${companyName}'s current operational workflows and design a centralized system architecture within 14 days.`,
        timeline: '14 days',
      },
      {
        phaseNum: 2,
        title: `Phase 2: Core System Implementation`,
        description: `Build and deploy the core CRM, workflow automation, and reporting dashboards. Migrate existing data and train the team within 30 days.`,
        timeline: '30 days',
      },
      {
        phaseNum: 3,
        title: `Phase 3: Optimization & Ongoing Support`,
        description: `Fine-tune automations, add advanced analytics, and provide ongoing strategic support to ensure continued growth and operational excellence.`,
        timeline: '45 days',
      },
    ],
    proposalValidUntil: futureDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' }),
    additionalSections: [],
  }
}

// ── Legacy content migration ────────────────────────────────────────────────
export function migrateFromLegacy(rawText: string, companyName: string, industry: string, contactName: string): ProposalData {
  if (rawText.trim().startsWith('{')) {
    try {
      return JSON.parse(rawText) as ProposalData
    } catch {
      // fall through
    }
  }
  const data = createDefaultProposalData(companyName, industry, contactName)
  if (rawText.trim()) {
    data.additionalSections.push({
      title: 'Additional Context',
      content: rawText.split('\n').filter(l => l.trim()),
    })
  }
  return data
}

const DIAG_COLORS: Record<string, { border: string; bg: string; text: string; badge: string; severity: string; score: string }> = {
  LEAK: { border: '#EF4444', bg: '#FEF2F2', text: '#991B1B', badge: '#EF4444', severity: 'Critical Risk', score: '88%' },
  RISK: { border: '#F59E0B', bg: '#FFFBEB', text: '#92400E', badge: '#F59E0B', severity: 'High Exposure', score: '74%' },
  GAP:  { border: '#3B82F6', bg: '#EFF6FF', text: '#1E40AF', badge: '#3B82F6', severity: 'Structural Gap', score: '65%' },
}

export function ProposalPdfPreview({ company, contact, proposalData, onClose }: ProposalPreviewProps) {
  const d = proposalData

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const heroCardsHtml = d.heroStats.map(s => `
      <div class="hero-stat">
        <div class="hero-value">${s.value}<span class="hero-unit">${s.unit}</span></div>
        <div class="hero-label">${s.label}</div>
      </div>
    `).join('')

    const diagCardsHtml = d.leaks.map((l, i) => {
      const c = DIAG_COLORS[l.type] || DIAG_COLORS.LEAK
      return `
        <div class="diag-card" style="border-left: 4px solid ${c.border}; background: ${c.bg};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span class="diag-badge" style="background: ${c.badge};">${l.type}</span>
            <span style="font-size: 10px; font-weight: 700; color: ${c.text}; text-transform: uppercase;">${c.severity}</span>
          </div>
          <h3 class="diag-title" style="color: ${c.text};">${l.title}</h3>
          <p class="diag-desc">${l.description}</p>
          
          <!-- Infographic / Visual Leak Meter -->
          <div class="infographic-meter-wrapper">
            <div style="display: flex; justify-content: space-between; font-size: 8px; font-weight: 700; color: #4B5563; margin-bottom: 4px;">
              <span>POTENTIAL IMPACT</span>
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
      </div>
    `).join('')

    const additionalPagesHtml = d.additionalSections.map((sec, idx) => `
      <div class="slide">
        <div class="top-bar-teal"></div>
        <div class="top-bar-gold"></div>
        
        <div class="slide-header-bar">
          <span class="slide-header-title">STRATEGIC OPERATIONAL INTELLIGENCE</span>
          <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
        </div>

        <div class="content-body">
          <div class="section-number">${String(idx + 3).padStart(2, '0')} // ${sec.title.toUpperCase()}</div>
          <h1 class="section-heading">${sec.title}</h1>
          <div class="additional-content">
            ${sec.content.map(c => `<p class="slide-text">${c}</p>`).join('')}
          </div>
        </div>
        <div class="slide-footer">
          <span>Tadbeer TT</span>
          <span>Confidential // Proprietary Intelligence</span>
        </div>
      </div>
    `).join('')

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
<title>Proposal – ${company.company_name}</title>
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

  /* Slide layout frame */
  .slide {
    width: 297mm;
    height: 210mm;
    padding: 20mm 24mm 15mm;
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

  /* Luxury gold outline frame inside each slide */
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
    position: absolute; top: 0; left: 0;
    z-index: 10;
  }
  .top-bar-gold {
    height: 3px; background: #C8A951; width: 100%;
    position: absolute; top: 6px; left: 0;
    z-index: 10;
  }

  .slide-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1.5px solid rgba(13, 79, 79, 0.15);
    padding-bottom: 6px;
    margin-bottom: 12mm;
    position: relative;
    z-index: 10;
  }
  .slide-header-title {
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 3px;
    color: #0D4F4F;
    text-transform: uppercase;
  }
  .slide-header-logo {
    height: 20px;
    object-fit: contain;
  }

  /* ── COVER SLIDE ── */
  .cover-intel-header {
    text-align: center;
    font-size: 8.5px; font-weight: 850;
    letter-spacing: 4px; text-transform: uppercase;
    color: #C8A951;
    margin-bottom: 8mm;
  }

  .hero-stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 10mm;
    position: relative;
    z-index: 10;
  }
  .hero-stat {
    background: #0D4F4F;
    border-radius: 12px;
    padding: 18px 14px;
    text-align: center;
    color: white;
    border-bottom: 4px solid #C8A951;
    box-shadow: 0 10px 25px rgba(13, 79, 79, 0.12);
  }
  .hero-value {
    font-size: 34px; font-weight: 900;
    line-height: 1; color: #ffffff;
    font-family: 'Outfit', sans-serif;
  }
  .hero-unit {
    font-size: 11px; font-weight: 700;
    color: #C8A951; text-transform: uppercase;
    letter-spacing: 0.5px;
    display: block; margin-top: 4px;
  }
  .hero-label {
    font-size: 7.5px; font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: rgba(255, 255, 255, 0.65);
    margin-top: 8px;
  }

  .cover-tagline {
    font-family: 'Playfair Display', serif;
    font-size: 34px; font-weight: 900;
    color: #0D4F4F; line-height: 1.2;
    max-width: 820px; margin: 0 auto 10px;
    text-align: center;
  }
  .cover-subtitle {
    font-size: 12px; font-weight: 400;
    color: #555; max-width: 600px;
    margin: 0 auto 20px; text-align: center;
    line-height: 1.6;
  }
  .cover-meta-row {
    display: flex; justify-content: center;
    gap: 36px; font-size: 9px;
    font-weight: 800; color: #0D4F4F;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
  .cover-meta-item span {
    color: #C8A951;
  }

  /* ── CONTENT SLIDES ── */
  .content-body {
    flex: 1;
    position: relative;
    z-index: 10;
  }

  .section-number {
    font-size: 10px; font-weight: 850;
    letter-spacing: 2.5px; color: #C8A951;
    text-transform: uppercase;
    margin-bottom: 6px;
    font-family: 'Outfit', sans-serif;
  }
  .section-heading {
    font-family: 'Playfair Display', serif;
    font-size: 28px; font-weight: 900;
    color: #0D4F4F; margin-bottom: 8px;
    border-bottom: 2px solid #C8A951;
    display: inline-block;
    padding-bottom: 4px;
    line-height: 1.2;
  }
  .section-sub {
    font-size: 12px; color: #555;
    line-height: 1.6; max-width: 720px;
    margin-bottom: 22px;
  }

  /* Diagnosis cards */
  .diag-cards { display: flex; gap: 16px; }
  .diag-card {
    flex: 1; border-radius: 14px;
    padding: 22px; position: relative;
    border: 1px solid rgba(0,0,0,0.04);
    display: flex; flex-direction: column;
    justify-content: space-between;
    min-height: 220px;
    background: #FFFFFF;
    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
  }
  .diag-badge {
    display: inline-block;
    padding: 2.5px 10px; border-radius: 6px;
    font-size: 8px; font-weight: 900;
    color: white; letter-spacing: 1px;
    text-transform: uppercase;
  }
  .diag-title {
    font-family: 'Playfair Display', serif;
    font-size: 15px; font-weight: 850;
    margin-bottom: 6px;
  }
  .diag-desc {
    font-size: 10.5px; line-height: 1.6;
    color: #555;
    flex-grow: 1;
  }

  .infographic-meter-wrapper {
    margin-top: 14px;
    border-top: 1px solid rgba(0,0,0,0.05);
    padding-top: 10px;
  }
  .infographic-meter-track {
    width: 100%; height: 5px; background: rgba(0,0,0,0.06);
    border-radius: 3px; overflow: hidden;
  }
  .infographic-meter-fill {
    height: 100%; border-radius: 3px;
  }

  /* Solution / Phase cards */
  .connector-timeline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    margin-bottom: 25px;
    padding: 0 30px;
  }
  .connector-timeline-line {
    position: absolute;
    top: 50%; left: 0; right: 0;
    height: 2px; background: #E6E1D8;
    z-index: 1; transform: translateY(-50%);
  }
  .connector-timeline-step {
    width: 26px; height: 26px;
    border-radius: 50%;
    background: #FFFFFF;
    border: 3px solid #0D4F4F;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 900; color: #0D4F4F;
    position: relative; z-index: 2;
    box-shadow: 0 4px 8px rgba(0,0,0,0.04);
  }
  .connector-timeline-step.active {
    background: #C8A951;
    border-color: #C8A951;
    color: white;
  }

  .phase-cards { display: flex; gap: 16px; }
  .phase-card {
    flex: 1;
    background: #ffffff;
    border: 1px solid #E6E1D8;
    border-top: 4.5px solid #0D4F4F;
    border-radius: 14px;
    padding: 18px 20px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.02);
  }
  .phase-card-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 8px;
  }
  .phase-num {
    font-size: 9px; font-weight: 800;
    color: #C8A951; letter-spacing: 2px;
    text-transform: uppercase;
  }
  .phase-timeline-badge {
    background: rgba(200, 169, 81, 0.12);
    color: #8c6e1c; font-size: 9px; font-weight: 800;
    padding: 1.5px 8px; border-radius: 4px;
  }
  .phase-title {
    font-family: 'Playfair Display', serif;
    font-size: 13.5px; font-weight: 850;
    color: #0D4F4F; margin-bottom: 6px;
  }
  .phase-desc {
    font-size: 10px; line-height: 1.6;
    color: #555;
  }

  /* Business Case Cards */
  .roi-cards { display: flex; gap: 18px; }
  .roi-card {
    flex: 1;
    background: #ffffff;
    border: 1px solid #E6E1D8;
    border-top: 4.5px solid #C8A951;
    border-radius: 14px;
    padding: 22px 18px;
    text-align: center;
    box-shadow: 0 8px 25px rgba(0,0,0,0.02);
  }
  .roi-value {
    font-size: 28px; font-weight: 900; color: #0D4F4F;
    font-family: 'Outfit', sans-serif;
  }
  .roi-value span {
    font-size: 12px; font-weight: 700; color: #C8A951;
    text-transform: uppercase;
  }
  .roi-card-title {
    font-size: 11px; font-weight: 800; color: #0D4F4F;
    text-transform: uppercase; letter-spacing: 0.5px;
    margin: 10px 0 6px;
  }
  .roi-card-desc {
    font-size: 9.5px; line-height: 1.5; color: #555;
  }

  /* Executive Summary Asymmetric Split */
  .exec-split {
    display: grid;
    grid-template-columns: 1.15fr 1.25fr;
    gap: 32px;
    margin-top: 15px;
  }
  .exec-quote-card {
    background: rgba(13, 79, 79, 0.03);
    border-left: 4px solid #C8A951;
    padding: 24px;
    border-radius: 4px 12px 12px 4px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .exec-quote-text {
    font-family: 'Playfair Display', serif;
    font-size: 15.5px;
    font-style: italic;
    line-height: 1.6;
    color: #0D4F4F;
    font-weight: 700;
  }
  .exec-quote-author {
    font-size: 8.5px;
    font-weight: 850;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #C8A951;
    margin-top: 12px;
  }
  .exec-detail-col {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .exec-detail-block {
    background: #FFFFFF;
    border: 1px solid rgba(230, 225, 216, 0.6);
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.01);
  }
  .exec-block-title {
    font-size: 11px;
    font-weight: 950;
    color: #0D4F4F;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }
  .exec-block-desc {
    font-size: 10px;
    line-height: 1.6;
    color: #555;
  }

  .slide-text {
    font-size: 12px; line-height: 1.6;
    color: #555; margin-bottom: 12px;
  }

  /* CTA slide */
  .cta-center {
    flex: 1; display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .cta-logo {
    height: 44px; object-fit: contain; margin-bottom: 18px;
  }
  .cta-label {
    font-size: 9.5px; font-weight: 850;
    letter-spacing: 3px; color: #C8A951;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
  .cta-heading {
    font-family: 'Playfair Display', serif;
    font-size: 32px; font-weight: 900;
    color: #0D4F4F; margin-bottom: 10px;
  }
  .cta-sub {
    font-size: 13px; color: #6B7280;
    margin-bottom: 22px;
  }
  .cta-valid {
    font-size: 10.5px; font-weight: 700;
    color: #0D4F4F;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: white;
    border: 1px solid rgba(13, 79, 79, 0.12);
    padding: 6px 18px; border-radius: 30px;
  }
  .cta-valid span { color: #C8A951; }

  /* Footer */
  .slide-footer {
    border-top: 1px solid #E6E1D8;
    padding-top: 10px;
    display: flex; justify-content: space-between;
    font-size: 8.5px; color: #9CA3AF;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    position: relative;
    z-index: 10;
  }

  @media print {
    body { background: none; }
    .slide { margin: 0; box-shadow: none; }
  }
</style>
</head>
<body>

  <!-- SLIDE 1: COVER -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar" style="border: none; margin-bottom: 0;">
      <div></div>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" style="height: 32px;" alt="Tadbeer Logo" />
    </div>

    <div class="content-body" style="display:flex;flex-direction:column;justify-content:center;">
      <div class="cover-intel-header">STRATEGIC INTELLIGENCE REPORT</div>
      <div class="hero-stats-row">${heroCardsHtml}</div>
      <h1 class="cover-tagline">${d.tagline}</h1>
      <p class="cover-subtitle">${d.subtitle}</p>
      <div class="cover-meta-row">
        <div class="cover-meta-item"><span>SERVICES MAPPED</span></div>
        <div class="cover-meta-item"><span>WEEKLY LEAK HOURS</span></div>
        <div class="cover-meta-item"><span>RESPONSE TARGET</span></div>
        <div class="cover-meta-item"><span>TARGET GROWTH</span></div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer TT</span>
      <span>PROPRIETARY OPERATIONAL INTELLIGENCE · ${new Date().getFullYear()}</span>
    </div>
  </div>

  <!-- SLIDE 2: EXECUTIVE SUMMARY -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar">
      <span class="slide-header-title">STRATEGIC OPERATIONAL INTELLIGENCE</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
    </div>

    <div class="content-body">
      <div class="section-number">02 // EXECUTIVE SUMMARY</div>
      <h1 class="section-heading">The Case for Operational Transformation</h1>
      <p class="section-sub">A strategic audit of alignment between people, tools, and execution path.</p>
      
      <div class="exec-split">
        <div class="exec-quote-card">
          <p class="exec-quote-text">"Complexity scales quadratically. Administrative overhead accumulates. We build the deterministic systems that bridge the gap, restoring clarity and execution velocity."</p>
          <span class="exec-quote-author">— Ismail Al-Balushi, Tadbeer Transformations</span>
        </div>
        <div class="exec-detail-col">
          <div class="exec-detail-block">
            <h4 class="exec-block-title">The Scale Challenge</h4>
            <p class="exec-block-desc">As operations expand, administrative friction compounds. Relevance before relationship, diagnosis before proposal. We target workflow leaks and system bottlenecks to clear the path for growth.</p>
          </div>
          <div class="exec-detail-block">
            <h4 class="exec-block-title">Systematic Alignment</h4>
            <p class="exec-block-desc">We replace manual dependencies (isolated spreadsheets, emails, and disconnected chats) with structured workflows, unified tracking dashboards, and automated coordinator routing.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer TT</span>
      <span>PROPRIETARY OPERATIONAL INTELLIGENCE</span>
    </div>
  </div>

  <!-- SLIDE 3: FORENSIC DIAGNOSIS -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar">
      <span class="slide-header-title">STRATEGIC OPERATIONAL INTELLIGENCE</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
    </div>

    <div class="content-body">
      <div class="section-number">03 // FORENSIC DIAGNOSIS</div>
      <h1 class="section-heading">Where ${company.company_name} is Bleeding</h1>
      <p class="section-sub">${d.diagnosisIntro}</p>
      <div class="diag-cards">${diagCardsHtml}</div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer TT</span>
      <span>PROPRIETARY OPERATIONAL INTELLIGENCE</span>
    </div>
  </div>

  <!-- SLIDE 4: SOLUTION -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="slide-header-bar">
      <span class="slide-header-title">STRATEGIC OPERATIONAL INTELLIGENCE</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
    </div>

    <div class="content-body">
      <div class="section-number">04 // THE SOLUTION</div>
      <h1 class="section-heading">90-Day Operational Overhaul</h1>
      <p class="section-sub">${d.solutionIntro}</p>
      
      <!-- Visual Connector Timeline Infographic -->
      <div class="connector-timeline" style="margin-bottom: 25px;">
        <div class="connector-timeline-line"></div>
        ${d.phases.map((p, i) => `
          <div class="connector-timeline-step ${i === 0 ? 'active' : ''}">0${p.phaseNum}</div>
        `).join('')}
      </div>

      <div class="phase-cards">${phaseCardsHtml}</div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer TT</span>
      <span>PROPRIETARY OPERATIONAL INTELLIGENCE</span>
    </div>
  </div>

  <!-- SLIDE 5: BUSINESS CASE & ROI -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>
 
    <div class="slide-header-bar">
      <span class="slide-header-title">STRATEGIC OPERATIONAL INTELLIGENCE</span>
      <img src="/logo/tadbeer-logo.png" class="slide-header-logo" alt="Tadbeer Logo" />
    </div>
 
    <div class="content-body">
      <div class="section-number">05 // BUSINESS CASE & ROI</div>
      <h1 class="section-heading">Operational Efficiency & Value Recovery</h1>
      <p class="section-sub">Estimated impact models based on automation and system standardization.</p>
      
      <div class="roi-cards">
        <div class="roi-card">
          <div class="roi-value">12+ <span>Hours</span></div>
          <h4 class="roi-card-title">Leaked Hours Recovery</h4>
          <p class="roi-card-desc">Replacing manual spreadsheets and back-and-forth status updates with automated dashboard logging saves significant overhead each week.</p>
        </div>
        <div class="roi-card">
          <div class="roi-value">28% <span>Boost</span></div>
          <h4 class="roi-card-title">Sales Velocity Sync</h4>
          <p class="roi-card-desc">Routing high-intent leads to sales coordinators immediately reduces response latency from hours to seconds, maximizing conversions.</p>
        </div>
        <div class="roi-card">
          <div class="roi-value">100% <span>Audit</span></div>
          <h4 class="roi-card-title">System Auditability</h4>
          <p class="roi-card-desc">Consolidating logs and tasks prevents double-entry, eliminates spreadsheet tracking loss, and provides managers with total compliance views.</p>
        </div>
      </div>
    </div>
 
    <div class="slide-footer">
      <span>Tadbeer TT</span>
      <span>PROPRIETARY OPERATIONAL INTELLIGENCE</span>
    </div>
  </div>

  ${additionalPagesHtml}

  <!-- FINAL SLIDE: CTA -->
  <div class="slide">
    <div class="top-bar-teal"></div>
    <div class="top-bar-gold"></div>

    <div class="cta-center">
      <img src="/logo/tadbeer-logo.png" class="cta-logo" alt="Tadbeer Logo" />
      <div class="cta-label">NEXT STEP</div>
      <h1 class="cta-heading">Initiate Forensic Audit Call</h1>
      <p class="cta-sub">Let's walk through the full data set and implementation timeline.</p>
      <div class="cta-valid">PROPOSAL VALID UNTIL: <span>${d.proposalValidUntil}</span></div>
    </div>

    <div class="slide-footer">
      <span>Tadbeer TT</span>
      <span>PROPRIETARY OPERATIONAL INTELLIGENCE · ${new Date().getFullYear()}</span>
      <span>CONTACT: Ismail Al-Balushi // Tadbeer TT</span>
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

  const [activeSlide, setActiveSlide] = useState(0)
  const [scale, setScale] = useState(1)
  const containerRef = useRef<HTMLDivElement>(null)

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
    // Tiny timeout to let the container mount and calculate dimensions correctly
    const timer = setTimeout(handleResize, 100)
    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [activeSlide])

  const slides = [
    // Slide 1: Cover
    {
      title: 'Cover Page',
      subtitle: 'Strategic Intelligence',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[50px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal">STRATEGIC OPERATIONAL INTELLIGENCE</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-center my-4 z-20">
            <div className="grid grid-cols-4 gap-4 mb-6">
              {d.heroStats.map((s, i) => (
                <div key={i} className="bg-[#0D4F4F] border-b-4 border-[#C8A951] rounded-xl p-3 text-center shadow-md">
                  <div className="text-2xl font-black text-white leading-none">{s.value}</div>
                  <div className="text-[10px] font-semibold text-[#C8A951] mt-1">{s.unit}</div>
                  <div className="text-[8px] font-bold uppercase tracking-wider text-white/70 mt-1.5">{s.label}</div>
                </div>
              ))}
            </div>

            <h1 className="text-center text-3xl font-extrabold text-[#0D4F4F] leading-tight max-w-[800px] mx-auto mb-3 font-serif">
              {d.tagline}
            </h1>
            <p className="text-center text-[12px] text-slate-500 max-w-[620px] mx-auto leading-relaxed">
              {d.subtitle}
            </p>
          </div>

          <div className="border-t border-[#E6E1D8] pt-3 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>PROPRIETARY OPERATIONAL INTELLIGENCE · {new Date().getFullYear()}</span>
          </div>
        </div>
      )
    },
    // Slide 2: Executive Summary
    {
      title: 'Executive Summary',
      subtitle: 'The Strategic Case',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[50px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal">STRATEGIC OPERATIONAL INTELLIGENCE</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-center my-4 z-20">
            <p className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-1">02 // EXECUTIVE SUMMARY</p>
            <h2 className="text-2xl font-extrabold text-[#0D4F4F] mb-2 font-serif border-b border-[#C8A951] inline-block pb-1">The Case for Operational Transformation</h2>
            <p className="text-[11.5px] text-slate-500 leading-relaxed max-w-[680px] mb-4">A strategic audit of alignment between people, tools, and execution path.</p>

            <div className="grid grid-cols-[1.1fr_1.25fr] gap-6">
              <div className="bg-[#0D4F4F]/3 border-l-4 border-[#C8A951] rounded-r-xl p-5 flex flex-col justify-center">
                <p className="font-serif text-[13px] italic font-semibold text-[#0D4F4F] leading-relaxed">
                  "Complexity scales quadratically. Administrative overhead accumulates. We build the deterministic systems that bridge the gap, restoring clarity and execution velocity."
                </p>
                <span className="text-[8.5px] font-bold tracking-wider text-[#C8A951] uppercase mt-2.5">— Ismail Al-Balushi, Tadbeer Transformations</span>
              </div>
              <div className="flex flex-col gap-3">
                <div className="bg-white border border-[#E6E1D8]/60 rounded-xl p-3.5 shadow-sm">
                  <h4 className="text-[10.5px] font-extrabold text-[#0D4F4F] uppercase tracking-wider mb-1">The Scale Challenge</h4>
                  <p className="text-[9.5px] text-slate-600 leading-relaxed">As operations expand, administrative friction compounds. Relevance before relationship, diagnosis before proposal. We target workflow leaks and system bottlenecks to clear the path for growth.</p>
                </div>
                <div className="bg-white border border-[#E6E1D8]/60 rounded-xl p-3.5 shadow-sm">
                  <h4 className="text-[10.5px] font-extrabold text-[#0D4F4F] uppercase tracking-wider mb-1">Systematic Alignment</h4>
                  <p className="text-[9.5px] text-slate-600 leading-relaxed">We replace manual dependencies (isolated spreadsheets, emails, and disconnected chats) with structured workflows, unified tracking dashboards, and automated coordinator routing.</p>
                </div>
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
    // Slide 3: Forensic Diagnosis
    {
      title: 'Forensic Diagnosis',
      subtitle: 'Where We Bleed',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[50px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal">STRATEGIC OPERATIONAL INTELLIGENCE</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-center my-4 z-20">
            <p className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-1">03 // FORENSIC DIAGNOSIS</p>
            <h2 className="text-2xl font-extrabold text-[#0D4F4F] mb-2 font-serif border-b border-[#C8A951] inline-block pb-1">Where {company.company_name} is Bleeding</h2>
            <p className="text-[11.5px] text-slate-500 leading-relaxed max-w-[680px] mb-4">{d.diagnosisIntro}</p>

            <div className="flex gap-4">
              {d.leaks.map((l, i) => {
                const c = DIAG_COLORS[l.type] || DIAG_COLORS.LEAK
                return (
                  <div key={i} className="flex-1 rounded-xl p-5 flex flex-col justify-between min-h-[190px] border border-black/5 bg-white shadow-sm" style={{ borderLeft: `4px solid ${c.border}` }}>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="inline-block px-2.5 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-wider animate-pulse" style={{ background: c.badge }}>
                          {l.type}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: c.text }}>{c.severity}</span>
                      </div>
                      <h4 className="text-[12.5px] font-extrabold font-serif mb-1" style={{ color: c.text }}>{l.title}</h4>
                      <p className="text-[9.5px] text-slate-500 leading-relaxed">{l.description}</p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-black/5">
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
            <span>PROPRIETARY OPERATIONAL INTELLIGENCE</span>
          </div>
        </div>
      )
    },
    // Slide 4: Solution Roadmap
    {
      title: '90-Day Overhaul',
      subtitle: 'Implementation Plan',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[50px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal">STRATEGIC OPERATIONAL INTELLIGENCE</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-center my-4 z-20">
            <p className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-1">04 // THE SOLUTION</p>
            <h2 className="text-2xl font-extrabold text-[#0D4F4F] mb-2 font-serif border-b border-[#C8A951] inline-block pb-1">90-Day Operational Overhaul</h2>
            <p className="text-[11.5px] text-slate-500 leading-relaxed max-w-[680px] mb-3">{d.solutionIntro}</p>

            <div className="flex justify-between items-center relative mb-4 px-8">
              <div className="absolute left-0 right-0 h-[2px] bg-slate-200 z-0" />
              {d.phases.map((p, i) => (
                <div key={i} className="flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-brand-teal z-10 text-[9px] font-bold text-brand-teal shadow-md transition-all hover:scale-110">
                  0{p.phaseNum}
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              {d.phases.map((p, i) => (
                <div key={i} className="flex-1 bg-white border border-[#E6E1D8] border-t-4 border-t-brand-teal rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[8px] font-extrabold text-[#C8A951] tracking-widest uppercase">PHASE 0{p.phaseNum}</p>
                    {p.timeline && <span className="bg-brand-gold/12 text-[#8c6e1c] text-[8px] font-extrabold px-1.5 py-0.5 rounded">{p.timeline}</span>}
                  </div>
                  <h4 className="text-[12px] font-extrabold font-serif text-[#0D4F4F] mb-1 truncate">{p.title}</h4>
                  <p className="text-[9.5px] text-slate-500 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-3 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>PROPRIETARY OPERATIONAL INTELLIGENCE</span>
          </div>
        </div>
      )
    },
    // Slide 5: Business Case & ROI
    {
      title: 'Business Case & ROI',
      subtitle: 'Value Recovery',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[50px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal">STRATEGIC OPERATIONAL INTELLIGENCE</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-center my-4 z-20">
            <p className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-1">05 // BUSINESS CASE & ROI</p>
            <h2 className="text-2xl font-extrabold text-[#0D4F4F] mb-2 font-serif border-b border-[#C8A951] inline-block pb-1">Operational Efficiency & Value Recovery</h2>
            <p className="text-[11.5px] text-slate-500 leading-relaxed max-w-[680px] mb-4">Estimated impact models based on automation and system standardization.</p>

            <div className="grid grid-cols-3 gap-5">
              <div className="bg-white border border-[#E6E1D8] border-t-4 border-t-[#C8A951] rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[150px]">
                <div>
                  <div className="text-2xl font-black text-[#0D4F4F]">12+ <span className="text-xs font-bold text-[#C8A951]">Hours</span></div>
                  <h4 className="text-[10px] font-extrabold text-[#0D4F4F] uppercase tracking-wide my-1.5">Leaked Hours Recovery</h4>
                  <p className="text-[9.5px] text-slate-500 leading-relaxed">Replacing manual spreadsheets and back-and-forth status updates with automated logging.</p>
                </div>
              </div>
              <div className="bg-white border border-[#E6E1D8] border-t-4 border-t-[#C8A951] rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[150px]">
                <div>
                  <div className="text-2xl font-black text-[#0D4F4F]">28% <span className="text-xs font-bold text-[#C8A951]">Boost</span></div>
                  <h4 className="text-[10px] font-extrabold text-[#0D4F4F] uppercase tracking-wide my-1.5">Sales Velocity Sync</h4>
                  <p className="text-[9.5px] text-slate-500 leading-relaxed">Routing high-intent leads to sales coordinators immediately reduces response latency.</p>
                </div>
              </div>
              <div className="bg-white border border-[#E6E1D8] border-t-4 border-t-[#C8A951] rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[150px]">
                <div>
                  <div className="text-2xl font-black text-[#0D4F4F]">100% <span className="text-xs font-bold text-[#C8A951]">Audit</span></div>
                  <h4 className="text-[10px] font-extrabold text-[#0D4F4F] uppercase tracking-wide my-1.5">System Auditability</h4>
                  <p className="text-[9.5px] text-slate-500 leading-relaxed">Consolidating logs prevents double-entry, and provides managers with compliance views.</p>
                </div>
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
    // Additional Section Slides
    ...d.additionalSections.map((sec, idx) => ({
      title: sec.title,
      subtitle: `Extra Page ${idx + 1}`,
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[50px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal">STRATEGIC OPERATIONAL INTELLIGENCE</span>
            <img src="/logo/tadbeer-logo.png" className="h-7 object-contain" alt="Tadbeer Logo" />
          </div>

          <div className="flex-grow flex flex-col justify-center my-4 z-20">
            <p className="text-[10px] font-extrabold tracking-[2px] uppercase text-[#C8A951] mb-1">{String(idx + 6).padStart(2, '0')} // {sec.title.toUpperCase()}</p>
            <h2 className="text-2xl font-extrabold text-[#0D4F4F] mb-3 font-serif border-b-2 border-[#C8A951] inline-block pb-1">{sec.title}</h2>
            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-2 mt-2">
              {sec.content.map((c, ci) => (
                <p key={ci} className="text-[11px] text-slate-600 leading-relaxed border-l-2 border-[#C8A951]/40 pl-3 italic">{c}</p>
              ))}
            </div>
          </div>

          <div className="border-t border-[#E6E1D8] pt-3 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>PROPRIETARY OPERATIONAL INTELLIGENCE</span>
          </div>
        </div>
      )
    })),
    // Slide Last: CTA
    {
      title: 'Initiate Audit Call',
      subtitle: 'Next Steps & CTA',
      render: () => (
        <div className="flex-1 flex flex-col justify-between p-[50px] relative h-full">
          <div className="absolute inset-4 border border-[#C8A951]/20 rounded-lg pointer-events-none z-10" />
          <div className="flex justify-between items-center z-20">
            <span className="text-[10px] font-black tracking-[3px] text-brand-teal">STRATEGIC OPERATIONAL INTELLIGENCE</span>
            <div></div>
          </div>

          <div className="flex-grow flex flex-col items-center justify-center text-center my-4 z-20">
            <img src="/logo/tadbeer-logo.png" className="h-11 object-contain mb-4" alt="Tadbeer Logo" />
            <p className="text-[9.5px] font-black tracking-[3px] text-[#C8A951] uppercase mb-1">NEXT STEP</p>
            <h1 className="text-2xl font-extrabold text-[#0D4F4F] mb-2 font-serif">Initiate Forensic Audit Call</h1>
            <p className="text-[11.5px] text-slate-500 mb-5 max-w-[500px]">Let's walk through the full data set and implementation timeline.</p>
            <p className="text-[9.5px] font-bold text-[#0D4F4F] uppercase tracking-wider bg-white border border-brand-teal/15 px-5 py-2 rounded-full shadow-sm">
              PROPOSAL VALID UNTIL: <span className="text-[#C8A951]">{d.proposalValidUntil}</span>
            </p>
          </div>

          <div className="border-t border-[#E6E1D8] pt-3 flex justify-between text-[8.5px] text-slate-400 uppercase tracking-widest font-semibold z-20">
            <span>Tadbeer Transformations</span>
            <span>CONTACT: Ismail Al-Balushi // Tadbeer Transformations</span>
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
              <h3 className="font-bold text-brand-teal text-xs uppercase tracking-wider">SIQR Strategic Proposal Presentation</h3>
              <p className="text-[11px] text-text-secondary">{company.company_name} · {slides.length} Slides Available</p>
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
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Slides Outline</span>
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
            
            {/* Aspect Ratio Canvas Container with Dynamic Scale scaling */}
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
