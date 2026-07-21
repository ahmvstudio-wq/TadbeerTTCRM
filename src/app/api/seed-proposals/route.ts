import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getRecommendedCaseStudies, getRecommendedClientLogos } from '@/lib/credibility-library'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Proposal data for each company (from public/proposal details in md/) ──────
const PROPOSALS: Record<string, {
  tagline: string
  subtitle: string
  heroStats: { value: string; unit: string; label: string }[]
  industry: string
  specificObservation?: string
  diagnosisIntro: string
  leaks: { type: 'LEAK' | 'RISK' | 'GAP'; title: string; description: string; impact?: string }[]
  solutionIntro: string
  phases: { phaseNum: number; title: string; description: string; timeline?: string; intervention?: string; futureState?: string }[]
  whatsappMessage: string
  contactName: string
  proposalValidUntil: string
}> = {
  'Oman Flour Mills SAOG': {
    industry: 'Manufacturing',
    specificObservation: 'your RO 128.82M revenue scale, 850 MT/day flour milling capacity, and 51% revenue contribution from feed milling operations',
    tagline: 'Tadbeer System & Scale Engine for Oman Flour Mills',
    subtitle: 'Process Automation, IoT Quality Prediction & Margin Leak Recovery for 850 MT/Day Operations',
    heroStats: [
      { value: 'RO 128.8M', unit: 'Revenue', label: 'Base Operational Scale' },
      { value: '87%', unit: 'Profit Growth', label: 'YoY FY23→FY24 Margin' },
      { value: '51%', unit: 'Volume Share', label: 'Feed Mill Revenue Share' },
      { value: 'RO 1.2M', unit: 'Recovery', label: 'Scrap & Downtime Savings' },
    ],
    diagnosisIntro: 'Oman Flour Mills operates at 850 MT/day flour milling capacity alongside a major animal feed unit contributing 51% of total RO 128.82M revenue. With an 87% net profit increase from 2023 to 2024 and expanding Salalah operations, reactive maintenance and end-of-line quality checks create an estimated 8-12% operational margin leak across feed and flour processing lines.',
    leaks: [
      { type: 'LEAK', title: 'Late Batch Quality Defect Detection in Salalah & Muscat Lines', description: 'End-of-line testing for particle size, moisture, and ash content leads to entire batch rejections, causing RO 1.2M in annual scrap across flour and feed operations.', impact: 'RO 1.2M Batch Scrap' },
      { type: 'RISK', title: 'Unplanned Equipment Downtime on 850 MT/Day Milling Assets', description: 'Reactive maintenance on high-capacity mill rollers and feed mixers causes 15-25% unplanned downtime, threatening Dahabi & Barakat retail delivery SLAs.', impact: 'RO 2.8M Production Lag' },
      { type: 'GAP', title: 'Manual Parameter Adjustment Across Feed vs. Flour Lines', description: 'Feed milling (51% revenue) requires distinct thermal and moisture parameters compared to wheat flour. Manual parameter setting wastes RO 450K in energy annually.', impact: 'RO 450K Energy Leak' },
    ],
    solutionIntro: 'Tadbeer Transformation deploys an Integrated System & Scale Framework for Oman Flour Mills: combining ERP Next/Odoo SCADA connectors, computer vision quality prediction, and predictive IoT asset monitoring rooted in our Muscat & Madinat Qaboos engineering standard.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer System Standardization & AI Quality Sensor Grid', description: 'Deploy computer vision sensors and IoT particle analyzers on main milling lines. Predictive ML models alert operators 60 minutes before quality deviation occurs.', timeline: '4-8 weeks', intervention: 'IoT Moisture & Particle Sensor Grid', futureState: '60% reduction in scrap, RO 1.2M margin recovery.' },
      { phaseNum: 2, title: 'Predictive CMMS & Telematics Equipment Health Engine', description: 'Install wireless vibration and thermal sensors on 45+ critical roller mills and feed pelletizers. Automated work orders trigger in ERP prior to component failure.', timeline: '8-14 weeks', intervention: 'Wireless CMMS & Vibration Telematics', futureState: '70% reduction in unplanned mill downtime.' },
      { phaseNum: 3, title: 'Self-Optimizing Production & Energy Control Integration', description: 'Implement reinforcement learning parameter control optimizing energy draw and throughput ratio between flour lines and the 51% revenue-share feed mill.', timeline: '14-24 weeks', intervention: 'Tadbeer Self-Optimizing Yield Controller', futureState: '12% OEE boost, RO 450K energy savings.' },
    ],
    whatsappMessage: `Assalamu Alaikum Adil,\n\nI hope you're doing well. I've been analyzing Oman Flour Mills' outstanding trajectory — particularly your RO 128.82M revenue milestone, 87% profit growth, and the 51% revenue contribution from feed operations.\n\nAt Tadbeer Transformation (Madinat Qaboos), we design custom System & Scale solutions for leading Omani industrial enterprises. We've prepared a tailored proposal addressing quality prediction and asset uptime across your 850 MT/day capacity.\n\nI've attached the proposal for your review. Would you be open to a 30-minute strategy session this week?\n\nBest regards,\nAhmed | Tadbeer Transformation\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Adil Nasser Al-Sabqi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Muna Noor International LLC': {
    industry: 'Construction/Engineering',
    specificObservation: 'your $100M+ project scale, 50+ year legacy, 6 manufacturing sites, and execution of the Al-Misfah waste transfer station alongside 5 concurrent Haya Water projects',
    tagline: 'Tadbeer Multi-Site System & Schedule Control for Muna Noor',
    subtitle: 'Predictive Project Scheduling & Resource Allocation for $100M+ Engineering Operations',
    heroStats: [
      { value: '$100M+', unit: 'Revenue', label: 'Engineering Project Scale' },
      { value: '50+ Yrs', unit: 'Legacy', label: 'Oman Heritage & Trust' },
      { value: '6 Sites', unit: 'Factories', label: 'Pipe & Fitting Facilities' },
      { value: '$3.2M', unit: 'Savings', label: 'Schedule & Resource Recovery' },
    ],
    diagnosisIntro: 'With a 50+ year legacy, $100M+ revenue, 300+ delivered projects, and 6 manufacturing sites, Muna Noor International is managing concurrent major infrastructure contracts including the Al-Misfah Waste Transfer Station and 5 concurrent Haya Water projects. Coordination across sites in Muscat, Sohar, Nizwa, and Salalah risks resource idling and timeline friction.',
    leaks: [
      { type: 'LEAK', title: 'Schedule Slippage Exposure Across Haya Water & Al-Misfah Sites', description: 'Managing 5 concurrent water pipeline projects alongside major waste transfer infrastructure creates dependency delays costing RO 1.8M in potential delay penalties.', impact: 'RO 1.8M Penalty Exposure' },
      { type: 'RISK', title: 'Heavy Machinery & Crew Idling Across 6 Manufacturing Hubs', description: 'Pipe manufacturing (40,000 MT capacity) and site excavation equipment experience 25-35% idle time waiting for predecessor sign-offs or material dispatch.', impact: 'RO 2.4M Idling Waste' },
      { type: 'GAP', title: 'Manual Site Documentation & Compliance Reporting Lags', description: 'Supervisors spend 30% of their working hours compiling paper/spreadsheet progress reports across 20+ active workfronts, delaying payment milestone invoicing.', impact: '30% Supervisor Admin Loss' },
    ],
    solutionIntro: 'Tadbeer Transformation deploys our Engineering System & Scale Architecture: connecting ERPNext/Primavera data to AI constraint scheduling, real-time GPS asset allocation, and automated mobile inspection apps.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer Predictive Schedule & Milestone Optimizer', description: 'Deploy constraint-based scheduling AI analyzing task dependencies across all 5 Haya Water sites and Al-Misfah station to eliminate critical path bottlenecks.', timeline: '4-8 weeks', intervention: 'Primavera AI Dependency Scheduler', futureState: '25% reduction in schedule overruns, zero delay penalties.' },
      { phaseNum: 2, title: 'GPS Heavy Asset & Pipe Manufacturing Dispatch', description: 'Integrate real-time GPS telematics across 6 manufacturing hubs and active job sites to dynamically reallocate cranes, excavators, and pipe logistics.', timeline: '8-14 weeks', intervention: 'Live GPS Asset Dispatch Controller', futureState: '35% improvement in equipment utilization, RO 2.4M capacity gain.' },
      { phaseNum: 3, title: 'Mobile Site Inspection & Automated Invoicing Engine', description: 'Implement mobile field capture apps enabling supervisors to verify milestone completion in real-time, cutting invoice approval cycles from 21 days to 48 hours.', timeline: '14-24 weeks', intervention: 'Tadbeer Mobile Field Inspection Suite', futureState: '70% reduction in reporting overhead, accelerated cash flow.' },
    ],
    whatsappMessage: `Assalamu Alaikum Athar,\n\nI hope you're doing well. Following up on Muna Noor's impressive 50-year milestone and current major projects like the Al-Misfah waste transfer station and Haya Water network expansions.\n\nAt Tadbeer Transformation, we help GCC engineering leaders unify multi-site operations and eliminate project delays. We've structured a tailored proposal addressing resource optimization across your 6 manufacturing sites and active project fronts.\n\nI've attached the full proposal. Would you be available for a brief 30-minute strategy call this week?\n\nBest regards,\nAhmed | Tadbeer Transformation\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Athar Qureshi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Al Jassar Group': {
    industry: 'Trading/Distribution',
    specificObservation: 'your 30-year market dominance, 1,000+ SKU line across HVAC, MEP, and waterproofing, and VTS Group membership since 2007',
    tagline: 'Tadbeer Supply Chain & Demand Intelligence for Al Jassar Group',
    subtitle: 'Automated Demand Forecasting & Working Capital Release for 30-Year Market Leader',
    heroStats: [
      { value: '30+ Yrs', unit: 'Dominance', label: 'Oman Trading Heritage' },
      { value: '1,000+', unit: 'SKUs', label: 'HVAC, MEP & Telecom Line' },
      { value: 'RO 2.8M', unit: 'Capital', label: 'Working Capital Release Target' },
      { value: '77%', unit: 'Reduction', label: 'Stock-Out Prevention Rate' },
    ],
    diagnosisIntro: 'Al Jassar Group has maintained 30+ years of market dominance across Oman construction and building sectors, backed by VTS Group membership since 2007. Holding multi-category inventory across HVAC, MEP, waterproofing, and telecom, managing over 1,000 SKUs creates inventory imbalances with RO 4.2M tied in overstock while chronic stockouts forfeit major project orders.',
    leaks: [
      { type: 'LEAK', title: 'Inventory Capital Tied in Slow-Moving SKUs', description: 'RO 4.2M in working capital is locked in overstocked MEP & waterproofing SKUs earning zero return while high-demand items stock out during peak construction cycles.', impact: 'RO 4.2M Tied Working Capital' },
      { type: 'RISK', title: 'Reactive Purchase Timing Across 15+ Supplier Nations', description: 'Manual reordering fails to factor in lead times from international VTS & MEP manufacturers, incurring expedited freight costs and missing bulk tier discounts.', impact: 'RO 2.1M Margin Leakage' },
      { type: 'GAP', title: 'Contractor Cross-Sell Blindness Across Divisions', description: 'HVAC buyers are not automatically cross-pitched MEP or waterproofing lines due to siloed sales tracking, missing an estimated 15% revenue expansion opportunity.', impact: 'RO 3.5M Lost Cross-Sell' },
    ],
    solutionIntro: 'Tadbeer Transformation implements our Supply Chain Intelligence & ERP Automation Architecture: deploying AI time-series demand forecasting, automated reorder thresholds, and cross-divisional CRM pipeline intelligence.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer Neural Demand Forecasting Engine', description: 'Deploy time-series ML models analyzing 30 years of sales history, local construction tenders, and seasonal cycles to generate precise 90-day SKU demand forecasts.', timeline: '4-8 weeks', intervention: 'GRU Neural Time-Series Forecaster', futureState: '77% reduction in stock-out events, RO 1.8M recovered sales.' },
      { phaseNum: 2, title: 'Automated Inventory & Landed Cost Reordering', description: 'Implement multi-objective inventory optimization calculating optimal reorder points and automated PO generation based on container freight economics.', timeline: '8-14 weeks', intervention: 'Multi-SKU Automated Reorder Engine', futureState: 'RO 2.8M working capital released, 38% inventory turnover boost.' },
      { phaseNum: 3, title: 'Cross-Divisional Contractor CRM & Upsell Engine', description: 'Build unified account scoring notifying sales managers when major contractors purchasing HVAC are bidding on projects requiring MEP or waterproofing supplies.', timeline: '14-24 weeks', intervention: 'Tadbeer Cross-Sell CRM Intelligence', futureState: '15% increase in multi-category customer spend (RO 3.5M).' },
    ],
    whatsappMessage: `Assalamu Alaikum Suresh,\n\nI hope you're well. Given Al Jassar Group's 30-year legacy and market dominance across HVAC, MEP, and building materials, optimizing supply chain liquidity is a game-changer.\n\nAt Tadbeer Transformation, we help leading Omani trading companies release tied-up working capital and eliminate stockouts. We've structured a custom AI Demand Forecasting Proposal for Al Jassar Group targeting RO 2.8M in cash flow release.\n\nI've attached the proposal for your review. Are you available for a brief strategy session this week?\n\nBest regards,\nAhmed | Tadbeer Transformation\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Suresh Kumar',
    proposalValidUntil: 'August 19, 2026',
  },

  'Vertex+ Interior Design': {
    industry: 'Interior Design',
    specificObservation: 'your luxury interior fit-out portfolio, direct owner leadership by Abdullatif, and strong design positioning across Muscat',
    tagline: 'Tadbeer AI Visualization & Operations Engine for Vertex+',
    subtitle: 'Accelerate Client Decisions, Eliminate Rework & Scale Luxury Fit-Out Operations',
    heroStats: [
      { value: '40%', unit: 'Increase', label: 'Client Deal Conversion' },
      { value: '65%', unit: 'Reduction', label: 'Design Revision Cycles' },
      { value: '2 Min', unit: 'Rendering', label: 'AI Photorealistic Generation' },
      { value: 'RO 450K', unit: 'Growth', label: 'Annual Revenue Expansion' },
    ],
    diagnosisIntro: 'Vertex+ has established a high-end ultra-modern positioning in luxury residential and commercial fit-out across Muscat. Operating under direct owner-leadership by Abdullatif, competing in a saturated market requires closing deals faster during initial consultations and eliminating design rework that erodes 15-20% of project budgets.',
    leaks: [
      { type: 'LEAK', title: 'Slow 2D/3D Render Turnaround Delaying Sales Closure', description: 'Clients take 3-6 weeks to commit because traditional 3D renders take days to update, causing prospect drop-off in a competitive Muscat market.', impact: '3-6 Wks Sales Lateness' },
      { type: 'RISK', title: 'Mid-Project Client Scope Changes & Labor Rework', description: 'Misunderstandings of spatial layouts lead to mid-construction modifications, consuming 15-20% of project labor budget and delaying handovers.', impact: '15-20% Labor Rework Cost' },
      { type: 'GAP', title: 'Manual Procurement & Subcontractor Tracking', description: 'Managing custom furniture imports, marble deliveries, and specialized trades across 8-12 active fit-out sites using manual tools creates delay penalties.', impact: 'RO 85K Delay Costs' },
    ],
    solutionIntro: 'Tadbeer Transformation deploys our Design Tech & Operations Engine: instant AI photorealistic rendering during client meetings, digital approval portals with change-impact tracking, and automated fit-out project coordination.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer AI Real-Time Design Render Engine', description: 'Equip sales and design teams with AI rendering tools that convert initial sketches and mood boards into photorealistic 3D interior views in under 2 minutes.', timeline: '4-8 weeks', intervention: '2-Minute AI Photorealistic Rendering Suite', futureState: '40% increase in initial consultation deal closures.' },
      { phaseNum: 2, title: 'Predictive Fit-Out Milestone & Logistics Scheduler', description: 'Deploy cloud project tracking connecting material delivery dates with site team readiness to prevent subcontractor idle time and project delays.', timeline: '8-14 weeks', intervention: 'Fit-Out Logistics & Milestone Dispatcher', futureState: '30% faster project completion, +25% client project capacity.' },
      { phaseNum: 3, title: 'Digital Client Sign-Off & Scope Guardrail Portal', description: 'Provide clients with a branded portal to approve designs and view real-time cost/timeline impacts before requesting changes.', timeline: '14-24 weeks', intervention: 'Tadbeer Client Portal & Scope Guardrail', futureState: '65% reduction in revision loops, zero scope disputes.' },
    ],
    whatsappMessage: `Assalamu Alaikum Abdullatif,\n\nI hope you're doing well. I've been following Vertex+'s sleek luxury interior projects and strong Instagram positioning across Muscat.\n\nAt Tadbeer Transformation, we help premium design-build firms win deals faster and streamline project execution. We've designed a specialized AI Visualization & Fit-Out Operations Proposal for Vertex+ that enables 2-minute photorealistic client rendering and eliminates project rework.\n\nI've attached the proposal for your review. Would you be open to a 30-minute demo call this week?\n\nBest regards,\nAhmed | Tadbeer Transformation\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Abdullatif Moughrabi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Stay Development': {
    industry: 'Real Estate',
    specificObservation: 'your master-planned coastal communities, luxury villa developments in Al Khoud, MSQ, and Qurm, and sustainable living projects',
    tagline: 'Tadbeer AI Property Matching & Lead Acceleration for Stay Development',
    subtitle: 'Instant Buyer Engagement & Automated Pipeline Nurturing for Coastal Master Communities',
    heroStats: [
      { value: '3.2x', unit: 'Faster', label: 'Lead Response Velocity' },
      { value: '45%', unit: 'Boost', label: 'Lead-to-Tour Conversion' },
      { value: '28%', unit: 'Shortening', label: 'Sales Cycle Duration' },
      { value: 'RO 1.8M', unit: 'Pipeline', label: 'Annual Revenue Acceleration' },
    ],
    diagnosisIntro: 'Founded in 2020, Stay Development has successfully scaled luxury coastal master-planned communities and sustainable living developments across Al Khoud, MSQ, and Qurm. With high buyer interest, manual lead processing causes an 8-12 hour delay in responding to inquiries, resulting in 45% lead leakage during 3-6 month buying decision cycles.',
    leaks: [
      { type: 'LEAK', title: 'Delayed Inquiry Response & Buyer Abandonment', description: 'Prospective luxury home buyers inquiring via website or social ads wait 8-12 hours for follow-up, causing 45% to book viewings with competing developers.', impact: 'RO 2.4M Lost Buyer Revenue' },
      { type: 'RISK', title: 'Generic Property Matching & Mismatched Site Visits', description: 'Sales agents manually send static PDF brochures without profiling buyer family size, financing readiness, or layout preferences, wasting high-value site tours.', impact: 'RO 1.6M Opportunity Loss' },
      { type: 'GAP', title: 'Pipeline Drop-Off During 3-6 Month Decision Windows', description: 'High-intent leads receive sporadic manual WhatsApp messages, causing 70% of potential buyers to go cold during long decision cycles.', impact: 'RO 3.2M Cold Pipeline Leak' },
    ],
    solutionIntro: 'Tadbeer Transformation deploys our Real Estate Growth Engine: 24/7 WhatsApp & Web conversational AI, automated floorplan matching algorithms, and predictive intent scoring integrated into enterprise CRM.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer 24/7 Conversational AI Buyer Qualifier', description: 'Deploy conversational AI across website, WhatsApp, and social channels responding to inquiries in under 30 seconds, qualifying budget, timeline, and layout needs.', timeline: '4-8 weeks', intervention: '24/7 Omnichannel WhatsApp Qualifier', futureState: '3.2x faster response speed, 45% increase in site tours.' },
      { phaseNum: 2, title: 'ML Property Matching & Interactive Pitch Deck Generator', description: 'Build intelligent inventory matching engine that auto-generates personalized digital pitch decks tailored to buyer criteria with 3D views and payment schedules.', timeline: '8-14 weeks', intervention: 'Dynamic Floorplan Pitch Generator', futureState: '30% increase in tour-to-booking conversion.' },
      { phaseNum: 3, title: 'Predictive Buyer Intent Scoring & Automated Nurture', description: 'Implement AI tracking buyer digital engagement (brochure re-opens, virtual tours) to alert senior sales advisors when high-value leads are ready to sign.', timeline: '14-24 weeks', intervention: 'Tadbeer Intent Scoring & Nurture AI', futureState: '28% shorter sales cycles, RO 1.8M revenue acceleration.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mohammed,\n\nI hope you're well. Following up on Stay Development's master-planned coastal communities and sustainable villa projects in Muscat.\n\nAt Tadbeer Transformation, we help luxury developers capture every high-intent buyer inquiry instantly. We've prepared a customized AI Property Matching Proposal for Stay Development targeting 3.2x faster lead response and RO 1.8M in accelerated revenue.\n\nI've attached the full proposal. Would you be available for a brief 30-minute strategy call this week?\n\nBest regards,\nAhmed | Tadbeer Transformation\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Mohammed Al Balushi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Arak Medical Clinics': {
    industry: 'Healthcare',
    specificObservation: 'your 3 Muscat clinic locations (Al Azaiba, Al Khoud, Bousher), 15-hour daily operating window (7 AM - 10 PM), and upcoming Sharjah expansion',
    tagline: 'Tadbeer AI Patient Engagement & Multi-Clinic Automation for Arak Clinics',
    subtitle: 'Zero No-Shows, 24/7 Scheduling & Automated Care Protocols Across 3 Muscat Branches',
    heroStats: [
      { value: '50%', unit: 'Cut', label: 'Appointment No-Show Rate' },
      { value: '75%', unit: 'Reduction', label: 'Front-Desk Call Load' },
      { value: '15 Hours', unit: 'Coverage', label: '7 AM - 10 PM Operational Window' },
      { value: 'RO 380K', unit: 'Recovery', label: 'Annual Revenue Recovery' },
    ],
    diagnosisIntro: 'Operating 3 Muscat locations (Al Azaiba, Al Khoud, Bousher) with extended 15-hour daily shifts (7 AM - 10 PM) and preparing for UAE expansion (Sharjah), Arak Medical Clinics delivers high-demand dermatology, aesthetics, and dental care. Managing booking calls across locations creates administrative bottlenecks, while a 25-30% patient no-show rate causes RO 450K in lost clinical capacity annually.',
    leaks: [
      { type: 'LEAK', title: 'High No-Show Rates in Dermatology & Dental Appointments', description: '25-30% of scheduled appointments result in no-shows or late cancellations, wasting premium doctor hours worth RO 450K annually across 3 clinics.', impact: 'RO 450K Lost Capacity' },
      { type: 'RISK', title: 'Call Center Bottlenecks During 15-Hour Operating Window', description: 'Front-desk receptionists spend 40% of their time handling routine booking calls, leaving 35% of incoming calls unassisted during peak hours.', impact: '35% Missed Patient Calls' },
      { type: 'GAP', title: 'Unstructured Post-Procedure Clinical Follow-Up', description: 'Dermatology and dental patients do not receive consistent post-care guidance or automated re-booking reminders, forfeiting RO 285K in repeat procedures.', impact: 'RO 285K Lost Retention' },
    ],
    solutionIntro: 'Tadbeer Transformation deploys our Healthcare Operational Framework: 24/7 multi-channel WhatsApp appointment scheduling, automated patient reminder workflows, and clinical follow-up engines integrated with clinic EMR/HIS systems.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer 24/7 WhatsApp Patient Booking & Reminder AI', description: 'Deploy conversational AI enabling patients to book, reschedule, or cancel appointments via WhatsApp 24/7, with multi-stage reminders (7-day, 24-hr, 2-hr).', timeline: '4-8 weeks', intervention: '24/7 WhatsApp HIS Booking Engine', futureState: '50% reduction in no-shows, RO 380K revenue recovery.' },
      { phaseNum: 2, title: 'Front-Desk Call Automation & NBO Partner Discount Bot', description: 'Automate routine inquiries (clinic locations, NBO card discounts, doctor availability), reducing call volume and allowing staff to focus on in-person patient care.', timeline: '8-14 weeks', intervention: 'Clinical FAQ & Partner Benefit AI Bot', futureState: '75% decrease in phone call volume.' },
      { phaseNum: 3, title: 'Automated Post-Treatment Care & Retention Engine', description: 'Implement protocol-driven WhatsApp nurture sending customized post-care instructions and routine check-up reminders based on treatment type.', timeline: '14-24 weeks', intervention: 'Tadbeer Clinical Care Nurture Engine', futureState: '45% increase in patient repeat visits.' },
    ],
    whatsappMessage: `Assalamu Alaikum Yasser,\n\nI hope you're doing well. I've been following Arak Medical Clinics' growth across your 3 Muscat locations and upcoming expansion into Sharjah.\n\nAt Tadbeer Transformation, we help healthcare groups streamline patient scheduling and eliminate no-shows. We've structured a customized Patient Engagement Proposal for Arak Clinics targeting a 50% reduction in no-shows and RO 380K in annual revenue recovery.\n\nI've attached the full proposal. Would you be open to a 30-minute call this week to discuss?\n\nBest regards,\nAhmed | Tadbeer Transformation\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Yasser Abd Elkader Ali',
    proposalValidUntil: 'August 19, 2026',
  },

  'National Finance': {
    industry: 'Finance/Microfinance',
    specificObservation: 'your 39-year legacy since 1987, pan-Oman network of 23 branches, and pioneering EV & solar green equipment financing',
    tagline: 'Tadbeer AI Loan Origination & Credit Scoring for National Finance',
    subtitle: 'Instant Underwriting & Alternative Credit Intelligence for 39-Year Lending Leader',
    heroStats: [
      { value: '39 Yrs', unit: 'Lending Data', label: 'Established 1987 Legacy' },
      { value: '23 Branches', unit: 'Network', label: 'Pan-Oman Distribution' },
      { value: '77%', unit: 'Faster', label: 'Loan Decision Velocity' },
      { value: 'RO 4.5M', unit: 'Portfolio', label: 'Annual Loan Portfolio Growth' },
    ],
    diagnosisIntro: 'Established in 1987, National Finance holds 39 years of deep lending data across 23 branches nationwide. Expanding into green energy (solar/EV financing) under strategic leadership, traditional manual underwriting creates 3-7 day processing delays per application, causing 35% applicant drop-off to faster competitors.',
    leaks: [
      { type: 'LEAK', title: 'Manual Underwriting Delays & Application Abandonment', description: 'Paper-heavy document verification takes 3-7 days, leading 35% of pre-approved auto and personal loan applicants to choose faster alternative lenders.', impact: 'RO 6.2M Abandonment Loss' },
      { type: 'RISK', title: 'Subjective Credit Risk & NPL Exposure', description: 'Traditional credit bureau checks miss alternative financial behavior data, resulting in a 4.2% Non-Performing Loan (NPL) ratio worth RO 8.5M across retail portfolios.', impact: 'RO 8.5M NPL Exposure' },
      { type: 'GAP', title: 'Manual Salary & Document Extraction Bottlenecks', description: 'Underwriters spend 45% of work hours re-keying data from Omani salary certificates and bank statements into core banking systems.', impact: '45% Officer Time Wasted' },
    ],
    solutionIntro: 'Tadbeer Transformation deploys our Financial Intelligence Framework: computer vision document OCR for Omani banking documents, alternative data ML risk scoring, and automated decision workflows compliant with CBO guidelines.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer Omani Document OCR & Instant Verification', description: 'Deploy computer vision OCR extracting data from Omani Civil IDs, bank statements (all major Omani banks), and commercial registrations with 99.2% accuracy.', timeline: '4-8 weeks', intervention: 'Oman Bank Statement & Civil ID OCR Engine', futureState: '90% reduction in verification time, zero human data entry.' },
      { phaseNum: 2, title: '150-Variable Alternative Credit Scoring ML Model', description: 'Implement explainable machine learning risk models evaluating traditional credit bureau data alongside utility payments and bank cash flow patterns.', timeline: '8-14 weeks', intervention: 'Alternative Data Credit Risk ML Model', futureState: '35% reduction in default risk, 77% faster credit decisions.' },
      { phaseNum: 3, title: 'Instant Auto-Decisioning & Disbursal Automation', description: 'Build end-to-end automated loan origination enabling low-risk retail applications (under RO 15,000) to be approved in under 15 minutes.', timeline: '14-24 weeks', intervention: 'Tadbeer Automated Loan Origination Suite', futureState: '4.2x daily loan processing volume, RO 4.5M portfolio growth.' },
    ],
    whatsappMessage: `Assalamu Alaikum Tariq,\n\nI hope you're doing well. I've been following National Finance's leadership in Omani retail lending and your sustainable EV/solar finance expansion.\n\nAt Tadbeer Transformation, we empower financial institutions to automate underwriting and accelerate loan disbursals. We've prepared an AI Credit Scoring & Origination Proposal for National Finance targeting 77% faster loan decisions and 4.2x processing capacity.\n\nI've attached the proposal for your review. Would you be available for a brief strategy call this week?\n\nBest regards,\nAhmed | Tadbeer Transformation\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Tariq Al Zadjali',
    proposalValidUntil: 'August 19, 2026',
  },

  'Mwasalat': {
    industry: 'Public Transportation',
    specificObservation: 'your 400+ bus fleet serving 9.2M annual passengers, your RO 22M fuel cost base (69% of operating expenses), and Intelligent Transport System (ITS) platform initiatives',
    tagline: 'Tadbeer AI Transit Optimization & Fleet Intelligence for Mwasalat',
    subtitle: 'Dynamic Dispatch, IoT Telematics & Fuel Reduction for 400+ Bus Fleet',
    heroStats: [
      { value: 'RO 22M', unit: 'Annual Fuel', label: '69% Operating Cost Share' },
      { value: '400+ Buses', unit: 'Fleet Scale', label: 'City & Intercity Transit' },
      { value: '18-25%', unit: 'Reduction', label: 'Fuel Consumption Cut' },
      { value: 'RO 2.2M', unit: 'Savings', label: 'Annual Cost Recovery' },
    ],
    diagnosisIntro: 'As Oman’s national public transport operator managing 400+ buses and serving up to 9.2M annual passengers, Mwasalat faces intense cost pressures with fuel accounting for 69% of operating expenses (RO 22M annually). Under government subsidy optimization mandates, static route schedules and emergency bus maintenance generate significant cost leaks.',
    leaks: [
      { type: 'LEAK', title: 'Static Route Scheduling & Excess Fuel Burn', description: 'Fixed bus timetables fail to adapt to live Muscat traffic and peak demand shifts, causing buses to run 30% empty off-peak and burning RO 1.4M in excess fuel.', impact: 'RO 1.4M Excess Fuel Loss' },
      { type: 'RISK', title: 'Unplanned Fleet Breakdown & Route Disruptions', description: 'Reactive maintenance on 400+ buses leads to emergency roadside repairs that cost 45% more than planned servicing and disrupt daily transit schedules.', impact: 'RO 950K Emergency Maintenance' },
      { type: 'GAP', title: '30-60 Day Data Lag in Passenger Capacity Planning', description: 'Route planners rely on delayed ticket sales reports rather than live passenger counts, missing opportunities to optimize bus deployments.', impact: '30-60 Day Planning Lag' },
    ],
    solutionIntro: 'Tadbeer Transformation deploys our Smart Transit Framework: reinforcement learning route dispatch optimization, IoT vehicle telematics, and real-time camera-based passenger analytics.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer AI Dynamic Route Optimization & Dispatch', description: 'Deploy dynamic route scheduling algorithms analyzing live Muscat traffic, weather, and passenger demand to continuously optimize vehicle dispatch intervals.', timeline: '4-8 weeks', intervention: 'Traffic & Demand AI Dispatch Controller', futureState: '18-25% fuel consumption reduction, 62% schedule accuracy boost.' },
      { phaseNum: 2, title: 'IoT Vehicle Telematics & Predictive Asset Maintenance', description: 'Install IoT telematics sensors across 400+ buses monitoring engine load, oil temperature, brake wear, and driver idling to predict failures 7 days ahead.', timeline: '8-14 weeks', intervention: 'Bus Fleet IoT Predictive CMMS', futureState: '40% cut in breakdowns, RO 950K maintenance savings.' },
      { phaseNum: 3, title: 'Real-Time Passenger Analytics & ITS Platform Integration', description: 'Integrate automated passenger counting sensors with Mwasalat’s mobile app platform to provide commuters live bus location and occupancy updates.', timeline: '14-24 weeks', intervention: 'Tadbeer Smart Mobility Analytics Suite', futureState: 'Optimal fleet utilization, 35% higher passenger satisfaction.' },
    ],
    whatsappMessage: `Assalamu Alaikum Badar,\n\nI hope you're well. Following up on Mwasalat's public transit operations and your upcoming Intelligent Transport System (ITS) platform initiatives.\n\nAt Tadbeer Transformation, we help transit authorities optimize fleet dispatch and reduce fuel consumption. We've prepared a Smart Fleet AI Proposal for Mwasalat targeting an 18-25% reduction in your RO 22M fuel cost base and RO 2.2M in net annual savings.\n\nI've attached the proposal for your review. Would a 30-minute strategy call this week be convenient?\n\nBest regards,\nAhmed | Tadbeer Transformation\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Badar Al Nadabi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Premium Motors Volkswagen Oman': {
    industry: 'Automotive',
    specificObservation: 'your flagship 10,000 sqm Wattayah facility launch, Alfardan Group subsidiary backing, and Sohar stockyard expansions',
    tagline: 'Tadbeer AI Showroom Conversion & After-Sales Engine for Premium Motors VW',
    subtitle: 'Instant Lead Conversion & Predictive Service Retention for 10,000 sqm Flagship Facility',
    heroStats: [
      { value: '10,000 sqm', unit: 'Facility', label: 'Wattayah Flagship Showroom' },
      { value: '4.5x', unit: 'Faster', label: 'Lead Response Speed' },
      { value: '45%', unit: 'Boost', label: 'Showroom Lead Conversion' },
      { value: 'RO 680K', unit: 'Growth', label: 'Annual Revenue Expansion' },
    ],
    diagnosisIntro: 'Operating as an Alfardan Group subsidiary since December 2020 out of a state-of-the-art 10,000 sqm Wattayah facility alongside Sohar stockyard expansions, Premium Motors represents Volkswagen in Oman. Managing high-value digital leads and retaining service customers past the 3-year warranty period are critical to protecting dealership margins.',
    leaks: [
      { type: 'LEAK', title: 'Slow Digital Lead Response & Test Drive Drop-off', description: 'Web and social test drive inquiries experience 6-18 hour response lags, causing 50% of prospective VW buyers to purchase from rival luxury auto brands.', impact: 'RO 1.2M Lost Car Sales' },
      { type: 'RISK', title: 'Post-Warranty Customer Churn to Third-Party Garages', description: '40% of VW owners stop servicing at the Wattayah dealership once their 3-year warranty ends, resulting in RO 850K in lost high-margin service and parts revenue.', impact: 'RO 850K Service Churn' },
      { type: 'GAP', title: 'Manual Trade-in Valuation & Banking Approval Delays', description: 'Evaluating trade-in vehicles takes 2-4 days using manual paper forms, dampening buyer enthusiasm and slowing overall vehicle turnover.', impact: '2-4 Day Valuation Lag' },
    ],
    solutionIntro: 'Tadbeer Transformation deploys our Automotive Sales & Service Framework: 24/7 conversational digital showroom assistants, predictive mileage service reminders via WhatsApp, and instant photo valuation algorithms.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer 24/7 Digital Showroom & Test Drive Assistant', description: 'Deploy conversational AI across VW website & WhatsApp answering vehicle spec, stock, and pricing queries instantly while scheduling test drives directly into sales calendars.', timeline: '4-8 weeks', intervention: '24/7 Digital Showroom Assistant', futureState: '4.5x faster lead response, 45% increase in lead conversion.' },
      { phaseNum: 2, title: 'Predictive Mileage & Service Retention WhatsApp Engine', description: 'Build predictive ML engine analyzing customer mileage history and sending automated, personalized WhatsApp service reminders 14 days before routine maintenance is due.', timeline: '8-14 weeks', intervention: 'Predictive Mileage Service Nurture Bot', futureState: '32% growth in after-sales retention, RO 520K parts revenue.' },
      { phaseNum: 3, title: 'Computer Vision Trade-In Valuation & Bank Pre-Approval', description: 'Implement mobile photo inspection AI for trade-ins, generating instant market valuations and triggering automated bank finance pre-approvals.', timeline: '14-24 weeks', intervention: 'Tadbeer Photo Valuation & Finance AI Engine', futureState: 'Same-day vehicle deal closing, +20% trade-in volume.' },
    ],
    whatsappMessage: `Assalamu Alaikum Christian,\n\nI hope you're doing well. Following up on Premium Motors Volkswagen's impressive presence at your 10,000 sqm Wattayah facility and regional expansions.\n\nAt Tadbeer Transformation, we help luxury automotive importers convert digital showroom leads faster and retain after-sales customers. We've prepared a customized AI Sales & Service Proposal for Volkswagen Oman targeting 4.5x faster lead response and RO 680K in annual revenue growth.\n\nI've attached the full proposal. Would you be open to a brief 30-minute discovery call this week?\n\nBest regards,\nAhmed | Tadbeer Transformation\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Christian Nehme',
    proposalValidUntil: 'August 19, 2026',
  },

  'Kenz Hypermarket': {
    industry: 'Retail/Hypermarket',
    specificObservation: 'your 24/7 hypermarket operations in Al Khoud and Ma’belah near Sultan Qaboos University (SQU), managing 15,000+ SKUs across high-density student hubs',
    tagline: 'Tadbeer AI Retail Merchandising & Fresh Food Waste Engine for Kenz Hypermarket',
    subtitle: 'Dynamic Markdown Pricing & WhatsApp Loyalty Personalization for 24/7 Retail Operations',
    heroStats: [
      { value: '15,000+', unit: 'SKUs', label: 'Multi-Department Inventory' },
      { value: '24/7 Hours', unit: 'Operations', label: 'Al Khoud & Ma’belah Hubs' },
      { value: '42%', unit: 'Reduction', label: 'Fresh Food Waste Cut' },
      { value: 'RO 580K', unit: 'Margin', label: 'Net Annual Margin Expansion' },
    ],
    diagnosisIntro: 'Operating 24/7 hypermarkets in high-density locations (Al Khoud & Ma’belah) near Sultan Qaboos University (SQU), Kenz Hypermarket manages 15,000+ SKUs under intense price competition from Lulu and Carrefour. Managing student demand surges and perishable food waste across round-the-clock operations creates significant margin erosion.',
    leaks: [
      { type: 'LEAK', title: 'Perishable Food Waste & Suboptimal Expiry Markdowns', description: 'Perishable departments (produce, dairy, bakery, meat) experience a 4-6% spoilage rate worth RO 720K annually due to late reactive price markdowns.', impact: 'RO 720K Spoilage Loss' },
      { type: 'RISK', title: 'Out-of-Stock Events on High-Velocity Student SKUs', description: 'SQU student demand spikes lead to stockouts on top 500 convenience & grocery SKUs during evening shifts, causing lost sales.', impact: 'RO 480K Out-of-Stock Loss' },
      { type: 'GAP', title: 'Generic Mass SMS Marketing with 92% Ignore Rate', description: 'Sending unsegmented SMS promotions to 50,000 loyalty members yields less than 8% engagement, missing personalized basket upsell opportunities.', impact: '92% Marketing Inefficiency' },
    ],
    solutionIntro: 'Tadbeer Transformation deploys our Retail Systems Framework: dynamic AI perishable pricing algorithms, computer vision out-of-stock shelf cameras, and hyper-personalized WhatsApp loyalty marketing.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer Dynamic Perishable Pricing & Waste Reduction', description: 'Deploy ML pricing algorithms analyzing batch expiration dates, live sales velocity, and weather to automatically set optimal daily dynamic markdowns.', timeline: '4-8 weeks', intervention: 'Dynamic Perishable Pricing Engine', futureState: '42% cut in fresh food waste, RO 420K saved margin.' },
      { phaseNum: 2, title: 'Computer Vision Shelf Scanner & Restock Alert System', description: 'Install overhead cameras monitoring high-velocity student aisles, alerting floor staff on WhatsApp when top SKUs run low.', timeline: '8-14 weeks', intervention: 'Vision Shelf Scanner & Restock Alert', futureState: '90% elimination of top SKU out-of-stock events.' },
      { phaseNum: 3, title: 'Hyper-Personalized WhatsApp Loyalty & Basket Upsell', description: 'Build AI loyalty engine segmenting members by shopping patterns (e.g. SQU student meal deals vs. family weekend grocery) to send targeted WhatsApp offers.', timeline: '14-24 weeks', intervention: 'Tadbeer WhatsApp Personalized Loyalty AI', futureState: '65% active loyalty engagement, 28% increase in average basket size.' },
    ],
    whatsappMessage: `Assalamu Alaikum Shiraz,\n\nI hope you're well. Following up on Kenz Hypermarket's 24/7 retail operations in Al Khoud and Ma’belah serving the vibrant SQU student community.\n\nAt Tadbeer Transformation, we help high-volume retail chains reduce fresh food waste and boost customer basket size. We've prepared an AI Retail Merchandising Proposal for Kenz Hypermarket targeting a 42% cut in perishable waste and RO 580K in annual net margin expansion.\n\nI've attached the full proposal. Would you be available for a brief strategy call this week?\n\nBest regards,\nAhmed | Tadbeer Transformation\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Shiraz Ahmad',
    proposalValidUntil: 'August 19, 2026',
  },
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const sessionDate = body.sessionDate || new Date().toISOString().split('T')[0]
    const userEmail = body.userEmail || 'w.taufiqq@gmail.com'
    const dryRun = body.dryRun === true

    // 1. Get or find target user
    let { data: targetUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .maybeSingle()

    if (!targetUser) {
      const { data: firstUser } = await supabase.from('users').select('*').limit(1).single()
      targetUser = firstUser
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'No user found in DB' }, { status: 400 })
    }

    // 2. Find or create today's daily cadence session
    let { data: session } = await supabase
      .from('daily_outreach_sessions')
      .select('*')
      .eq('user_id', targetUser.id)
      .eq('session_date', sessionDate)
      .maybeSingle()

    if (!session) {
      const { data: newSess, error: sErr } = await supabase
        .from('daily_outreach_sessions')
        .insert({
          user_id: targetUser.id,
          session_date: sessionDate,
          target_count: 10,
        })
        .select()
        .single()

      if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 })
      session = newSess
    }

    // 3. Process each proposal
    const results: any[] = []

    for (const [rawName, proposal] of Object.entries(PROPOSALS)) {
      // Find company with fallback search terms
      const searchKeyword = rawName.split(' ')[0] // first word e.g. "Al", "Vertex", "Oman", etc.
      const secondKeyword = rawName.split(' ')[1] || searchKeyword

      let { data: company } = await supabase
        .from('companies')
        .select('*, contacts(*)')
        .ilike('company_name', `%${rawName.replace(/\+/g, '')}%`)
        .maybeSingle()

      if (!company) {
        // Fallback search using primary brand word
        const { data: fallbackCompany } = await supabase
          .from('companies')
          .select('*, contacts(*)')
          .or(`company_name.ilike.%${searchKeyword}%,company_name.ilike.%${secondKeyword}%`)
          .limit(1)
          .maybeSingle()
        company = fallbackCompany
      }

      if (!company) {
        results.push({ company: rawName, status: 'skipped', reason: 'Company not found in DB' })
        continue
      }

      const primaryContact = company.contacts?.[0] || null

      const recommendedStudies = getRecommendedCaseStudies(proposal.industry, 2)
      const recommendedLogos = getRecommendedClientLogos(proposal.industry, 6)

      // Build the rich ProposalData JSON
      const proposalData = {
        coverTitleFormat: `Tadbeer × ${company.company_name}`,
        tagline: proposal.tagline,
        subtitle: proposal.subtitle,
        specificObservation: proposal.specificObservation,
        preparedDate: 'July 2026',
        
        aboutTadbeerContext: `Tadbeer Transformation (Tadbeer TT) is Oman's premier system architecture and operational scaling partner based in Madinat Qaboos, Muscat. We empower GCC enterprises to eliminate operational bottlenecks and scale seamlessly by deploying custom software solutions, AI technology & machine learning workflows, data-driven digital marketing, and human capital transformation frameworks. Based on our pre-contact audit of ${company.company_name}'s operational footprint, Tadbeer TT has structured a deterministic path to system excellence and revenue optimization.`,
        
        selectedCaseStudies: recommendedStudies,
        selectedClientLogos: recommendedLogos,

        executiveSummaryText: proposal.diagnosisIntro,
        contextualMetrics: proposal.heroStats.map(s => ({
          value: s.value,
          label: s.label,
          context: `${s.unit} achieved through automated system standardization and workflow optimization.`,
          source: 'Operational Intelligence Audit'
        })),

        heroStats: proposal.heroStats,
        diagnosisIntro: proposal.diagnosisIntro,
        leaks: proposal.leaks,
        solutionIntro: proposal.solutionIntro,
        phases: proposal.phases,
        
        ctaHeading: 'Initiate Strategic Transformation Session',
        ctaSubtext: 'Schedule a 45-minute deep-dive session to review the diagnostic findings and system architecture.',
        ctaUrl: 'https://www.tadbeertt.com',
        ctaPhone: '+968 7630 7656',
        ctaEmail: 'operation@tadbeertt.com',
        proposalValidUntil: proposal.proposalValidUntil,

        additionalSections: [
          {
            title: 'WhatsApp Message',
            content: proposal.whatsappMessage.split('\n').filter(l => l.trim()),
          },
        ] as Array<{ title: string; content: string[] }>,
      }

      const messageBodyJson = JSON.stringify(proposalData)

      if (dryRun) {
        results.push({ company: rawName, status: 'dry_run', proposal: proposalData })
        continue
      }

      // Upsert into outreach_preparations
      const { data: existingPrep } = await supabase
        .from('outreach_preparations')
        .select('*')
        .eq('company_id', company.id)
        .eq('use_case_summary', 'PROPOSAL')
        .maybeSingle()

      let prepRecord: any
      if (existingPrep) {
        const { data: updated } = await supabase
          .from('outreach_preparations')
          .update({
            contact_id: primaryContact?.id || existingPrep.contact_id,
            message_body: messageBodyJson,
            status: 'ready',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingPrep.id)
          .select()
          .single()
        prepRecord = updated
      } else {
        const { data: created } = await supabase
          .from('outreach_preparations')
          .insert({
            company_id: company.id,
            contact_id: primaryContact?.id || null,
            use_case_summary: 'PROPOSAL',
            outreach_channel: 'email',
            message_body: messageBodyJson,
            status: 'ready',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()
        prepRecord = created
      }

      // Ensure company is in today's daily outreach session
      const { data: existingItem } = await supabase
        .from('daily_outreach_items')
        .select('*')
        .eq('session_id', session.id)
        .eq('company_id', company.id)
        .maybeSingle()

      if (!existingItem) {
        const { data: maxPos } = await supabase
          .from('daily_outreach_items')
          .select('position')
          .eq('session_id', session.id)
          .order('position', { ascending: false })
          .limit(1)
          .maybeSingle()

        const nextPos = (maxPos?.position || 0) + 1

        await supabase.from('daily_outreach_items').insert({
          session_id: session.id,
          company_id: company.id,
          preparation_id: prepRecord?.id || null,
          position: nextPos,
          status: 'prepared',
        })
      }

      results.push({
        company: company.company_name,
        status: existingPrep ? 'updated' : 'created',
        contactId: primaryContact?.id,
      })
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      sessionDate,
      totalItems: results.length,
      results,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to seed proposals' },
      { status: 500 }
    )
  }
}
