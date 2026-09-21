import { getSupabaseAdminClient } from '@/lib/supabase/config'
import { NextResponse, type NextRequest } from 'next/server'
import { getRecommendedCaseStudies, getRecommendedClientLogos } from '@/lib/credibility-library'

const supabase = getSupabaseAdminClient()

// ── Internal-only seed route — protected by a server secret ──────────────────
// The middleware already enforces session auth on all /api routes.
// This extra check ensures the endpoint cannot be called even by authenticated
// users accidentally; it requires the explicit SEED_SECRET env var.
const SEED_SECRET = process.env.SEED_SECRET;

function checkSeedSecret(request: NextRequest): NextResponse | null {
  if (!SEED_SECRET) {
    return NextResponse.json({ error: "Seed endpoint disabled in this environment." }, { status: 403 });
  }
  const authHeader = request.headers.get("x-seed-secret");
  if (!authHeader || authHeader !== SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return null;
}


const PROPOSALS: Record<string, {
  tagline: string
  subtitle: string
  heroStats: { value: string; unit: string; label: string }[]
  industry: string
  specificObservation?: string
  researchNotes?: string
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
    solutionIntro: 'Tadbeer TT deploys an Integrated System & Scale Framework for Oman Flour Mills: combining ERP Next/Odoo SCADA connectors, computer vision quality prediction, and predictive IoT asset monitoring rooted in our Muscat & Madinat Qaboos engineering standard.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer System Standardization & AI Quality Sensor Grid', description: 'Deploy computer vision sensors and IoT particle analyzers on main milling lines. Predictive ML models alert operators 60 minutes before quality deviation occurs.', timeline: '4-8 weeks', intervention: 'IoT Moisture & Particle Sensor Grid', futureState: '60% reduction in scrap, RO 1.2M margin recovery.' },
      { phaseNum: 2, title: 'Predictive CMMS & Telematics Equipment Health Engine', description: 'Install wireless vibration and thermal sensors on 45+ critical roller mills and feed pelletizers. Automated work orders trigger in ERP prior to component failure.', timeline: '8-14 weeks', intervention: 'Wireless CMMS & Vibration Telematics', futureState: '70% reduction in unplanned mill downtime.' },
      { phaseNum: 3, title: 'Self-Optimizing Production & Energy Control Integration', description: 'Implement reinforcement learning parameter control optimizing energy draw and throughput ratio between flour lines and the 51% revenue-share feed mill.', timeline: '14-24 weeks', intervention: 'Tadbeer Self-Optimizing Yield Controller', futureState: '12% OEE boost, RO 450K energy savings.' },
    ],
    whatsappMessage: `Assalamu Alaikum Adil,\n\nI hope you're doing well. I've been analyzing Oman Flour Mills' outstanding trajectory — particularly your RO 128.82M revenue milestone, 87% profit growth, and the 51% revenue contribution from feed operations.\n\nAt Tadbeer TT (Madinat Qaboos), we design custom System & Scale solutions for leading Omani industrial enterprises. We've prepared a tailored proposal addressing quality prediction and asset uptime across your 850 MT/day capacity.\n\nI've attached the proposal for your review. Would you be open to a 30-minute strategy session this week?\n\nBest regards,\nIsmail Hassan | Tadbeer TT\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Adil Nasser Al-Sabqi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Muna Noor International LLC': {
    industry: 'Construction/Engineering',
    specificObservation: 'your $100M+ project scale, 50+ year legacy, 6 manufacturing sites, and execution of the Al-Misfah waste transfer station alongside 5 concurrent Haya Water projects',
    researchNotes: 'Muna Noor International LLC: $100M+ revenue engineering & pipe manufacturing powerhouse with 50+ years history and 300+ major projects delivered. Operates 6 manufacturing factories in Oman. Currently executing the landmark Al-Misfah waste transfer station alongside 5 concurrent Haya Water pipeline projects. Key Contact: Athar Qureshi.',
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
    whatsappMessage: `Assalamu Alaikum Athar,\n\nI hope you're doing well. Following up on Muna Noor's impressive 50-year milestone and current major projects like the Al-Misfah waste transfer station and Haya Water network expansions.\n\nAt Tadbeer TT, we help GCC engineering leaders unify multi-site operations and eliminate project delays. We've structured a tailored proposal addressing resource optimization across your 6 manufacturing sites and active project fronts.\n\nI've attached the full proposal. Would you be available for a brief 30-minute strategy call this week?\n\nBest regards,\nIsmail Hassan | Tadbeer TT\noperation@tadbeertt.com | +968 7630 7656`,
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
    whatsappMessage: `Assalamu Alaikum Suresh,\n\nI hope you're well. Given Al Jassar Group's 30-year legacy and market dominance across HVAC, MEP, and building materials, optimizing supply chain liquidity is a game-changer.\n\nAt Tadbeer TT, we help leading Omani trading companies release tied-up working capital and eliminate stockouts. We've structured a custom AI Demand Forecasting Proposal for Al Jassar Group targeting RO 2.8M in cash flow release.\n\nI've attached the proposal for your review. Are you available for a brief strategy session this week?\n\nBest regards,\nIsmail Hassan | Tadbeer TT\noperation@tadbeertt.com | +968 7630 7656`,
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
    whatsappMessage: `Assalamu Alaikum Mohammed,\n\nI hope you're well. Following up on Stay Development's master-planned coastal communities and sustainable villa projects in Muscat.\n\nAt Tadbeer TT, we help luxury developers capture every high-intent buyer inquiry instantly. We've prepared a customized AI Property Matching Proposal for Stay Development targeting 3.2x faster lead response and RO 1.8M in accelerated revenue.\n\nI've attached the full proposal. Would you be available for a brief 30-minute strategy call this week?\n\nBest regards,\nIsmail Hassan | Tadbeer TT\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Mohammed Al Balushi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Arak Medical Clinics': {
    industry: 'Healthcare',
    specificObservation: 'your 3 Muscat clinic locations (Al Azaiba, Al Khoud, Bousher), 15-hour daily operating window (7 AM - 10 PM), and upcoming Sharjah expansion',
    researchNotes: 'Arak Medical Clinics: Top healthcare provider with 3 prime Muscat branches (Al Azaiba, Al Khoud, Bousher). Operates extended 15-hour daily shifts (7 AM - 10 PM). Specializes in dermatology, laser, aesthetic medicine, and dentistry. Currently expanding into Sharjah, UAE. NBO card partner. Key Contact: Yasser Abd Elkader Ali.',
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
    solutionIntro: 'Tadbeer TT deploys our Healthcare Operational Framework: 24/7 multi-channel WhatsApp appointment scheduling, automated patient reminder workflows, and clinical follow-up engines integrated with clinic EMR/HIS systems.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer 24/7 WhatsApp Patient Booking & Reminder AI', description: 'Deploy conversational AI enabling patients to book, reschedule, or cancel appointments via WhatsApp 24/7, with multi-stage reminders (7-day, 24-hr, 2-hr).', timeline: '4-8 weeks', intervention: '24/7 WhatsApp HIS Booking Engine', futureState: '50% reduction in no-shows, RO 380K revenue recovery.' },
      { phaseNum: 2, title: 'Front-Desk Call Automation & NBO Partner Discount Bot', description: 'Automate routine inquiries (clinic locations, NBO card discounts, doctor availability), reducing call volume and allowing staff to focus on in-person patient care.', timeline: '8-14 weeks', intervention: 'Clinical FAQ & Partner Benefit AI Bot', futureState: '75% decrease in phone call volume.' },
      { phaseNum: 3, title: 'Automated Post-Treatment Care & Retention Engine', description: 'Implement protocol-driven WhatsApp nurture sending customized post-care instructions and routine check-up reminders based on treatment type.', timeline: '14-24 weeks', intervention: 'Tadbeer Clinical Care Nurture Engine', futureState: '45% increase in patient repeat visits.' },
    ],
    whatsappMessage: `Assalamu Alaikum Yasser,\n\nI hope you're doing well. I've been following Arak Medical Clinics' growth across your 3 Muscat locations and upcoming expansion into Sharjah.\n\nAt Tadbeer TT, we help healthcare groups streamline patient scheduling and eliminate no-shows. We've structured a customized Patient Engagement Proposal for Arak Clinics targeting a 50% reduction in no-shows and RO 380K in annual revenue recovery.\n\nI've attached the full proposal. Would you be open to a 30-minute call this week to discuss?\n\nBest regards,\nIsmail Hassan | Tadbeer TT\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Yasser Abd Elkader Ali',
    proposalValidUntil: 'August 19, 2026',
  },

  'National Finance': {
    industry: 'Finance/Microfinance',
    specificObservation: 'your 39-year legacy since 1987, pan-Oman network of 23 branches, and pioneering EV & solar green equipment financing',
    researchNotes: 'National Finance SAOG: Oman’s largest non-banking financial institution established in 1987 (39-year legacy). Pan-Oman footprint of 23 branches. Market leader in retail auto loans, SME equipment leasing, and microfinance. Pioneering green energy financing for solar and electric vehicles. Key Contact: Tariq Al Zadjali.',
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
    solutionIntro: 'Tadbeer TT deploys our Financial Intelligence Framework: computer vision document OCR for Omani banking documents, alternative data ML risk scoring, and automated decision workflows compliant with CBO guidelines.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer Omani Document OCR & Instant Verification', description: 'Deploy computer vision OCR extracting data from Omani Civil IDs, bank statements (all major Omani banks), and commercial registrations with 99.2% accuracy.', timeline: '4-8 weeks', intervention: 'Oman Bank Statement & Civil ID OCR Engine', futureState: '90% reduction in verification time, zero human data entry.' },
      { phaseNum: 2, title: '150-Variable Alternative Credit Scoring ML Model', description: 'Implement explainable machine learning risk models evaluating traditional credit bureau data alongside utility payments and bank cash flow patterns.', timeline: '8-14 weeks', intervention: 'Alternative Data Credit Risk ML Model', futureState: '35% reduction in default risk, 77% faster credit decisions.' },
      { phaseNum: 3, title: 'Instant Auto-Decisioning & Disbursal Automation', description: 'Build end-to-end automated loan origination enabling low-risk retail applications (under RO 15,000) to be approved in under 15 minutes.', timeline: '14-24 weeks', intervention: 'Tadbeer Automated Loan Origination Suite', futureState: '4.2x daily loan processing volume, RO 4.5M portfolio growth.' },
    ],
    whatsappMessage: `Assalamu Alaikum Tariq,\n\nI hope you're doing well. I've been following National Finance's leadership in Omani retail lending and your sustainable EV/solar finance expansion.\n\nAt Tadbeer TT, we empower financial institutions to automate underwriting and accelerate loan disbursals. We've prepared an AI Credit Scoring & Origination Proposal for National Finance targeting 77% faster loan decisions and 4.2x processing capacity.\n\nI've attached the proposal for your review. Would you be available for a brief strategy call this week?\n\nBest regards,\nIsmail Hassan | Tadbeer TT\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Tariq Al Zadjali',
    proposalValidUntil: 'August 19, 2026',
  },

  'Mwasalat': {
    industry: 'Public Transportation',
    specificObservation: 'your 400+ bus fleet serving 9.2M annual passengers, your RO 22M fuel cost base (69% of operating expenses), and Intelligent Transport System (ITS) platform initiatives',
    researchNotes: 'Mwasalat (Oman National Transport Company): National public transit operator managing 400+ buses and ferry networks. Serves 9.2M annual passengers. High fuel cost footprint (RO 22M annually, accounting for 69% of operating expenses). Rolling out Intelligent Transport System (ITS) smart mobility platforms. Key Contact: Badar Al Nadabi.',
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
    solutionIntro: 'Tadbeer TT deploys our Smart Transit Framework: reinforcement learning route dispatch optimization, IoT vehicle telematics, and real-time camera-based passenger analytics.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer AI Dynamic Route Optimization & Dispatch', description: 'Deploy dynamic route scheduling algorithms analyzing live Muscat traffic, weather, and passenger demand to continuously optimize vehicle dispatch intervals.', timeline: '4-8 weeks', intervention: 'Traffic & Demand AI Dispatch Controller', futureState: '18-25% fuel consumption reduction, 62% schedule accuracy boost.' },
      { phaseNum: 2, title: 'IoT Vehicle Telematics & Predictive Asset Maintenance', description: 'Install IoT telematics sensors across 400+ buses monitoring engine load, oil temperature, brake wear, and driver idling to predict failures 7 days ahead.', timeline: '8-14 weeks', intervention: 'Bus Fleet IoT Predictive CMMS', futureState: '40% cut in breakdowns, RO 950K maintenance savings.' },
      { phaseNum: 3, title: 'Real-Time Passenger Analytics & ITS Platform Integration', description: 'Integrate automated passenger counting sensors with Mwasalat’s mobile app platform to provide commuters live bus location and occupancy updates.', timeline: '14-24 weeks', intervention: 'Tadbeer Smart Mobility Analytics Suite', futureState: 'Optimal fleet utilization, 35% higher passenger satisfaction.' },
    ],
    whatsappMessage: `Assalamu Alaikum Badar,\n\nI hope you're well. Following up on Mwasalat's public transit operations and your upcoming Intelligent Transport System (ITS) platform initiatives.\n\nAt Tadbeer TT, we help transit authorities optimize fleet dispatch and reduce fuel consumption. We've prepared a Smart Fleet AI Proposal for Mwasalat targeting an 18-25% reduction in your RO 22M fuel cost base and RO 2.2M in net annual savings.\n\nI've attached the proposal for your review. Would a 30-minute strategy call this week be convenient?\n\nBest regards,\nIsmail Hassan | Tadbeer TT\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Badar Al Nadabi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Premium Motors Volkswagen Oman': {
    industry: 'Automotive',
    specificObservation: 'your flagship 10,000 sqm Wattayah facility launch, Alfardan Group subsidiary backing, and Sohar stockyard expansions',
    researchNotes: 'Premium Motors Volkswagen Oman: Official Volkswagen importer in Oman since December 2020, backed by Alfardan Group. Operates a flagship 10,000 sqm facility in Wattayah combining showroom, service center, and spare parts hub alongside Sohar stockyard expansion. Key Contact: Christian Nehme.',
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
    solutionIntro: 'Tadbeer TT deploys our Automotive Sales & Service Framework: 24/7 conversational digital showroom assistants, predictive mileage service reminders via WhatsApp, and instant photo valuation algorithms.',
    phases: [
      { phaseNum: 1, title: 'Tadbeer 24/7 Digital Showroom & Test Drive Assistant', description: 'Deploy conversational AI across VW website & WhatsApp answering vehicle spec, stock, and pricing queries instantly while scheduling test drives directly into sales calendars.', timeline: '4-8 weeks', intervention: '24/7 Digital Showroom Assistant', futureState: '4.5x faster lead response, 45% increase in lead conversion.' },
      { phaseNum: 2, title: 'Predictive Mileage & Service Retention WhatsApp Engine', description: 'Build predictive ML engine analyzing customer mileage history and sending automated, personalized WhatsApp service reminders 14 days before routine maintenance is due.', timeline: '8-14 weeks', intervention: 'Predictive Mileage Service Nurture Bot', futureState: '32% growth in after-sales retention, RO 520K parts revenue.' },
      { phaseNum: 3, title: 'Computer Vision Trade-In Valuation & Bank Pre-Approval', description: 'Implement mobile photo inspection AI for trade-ins, generating instant market valuations and triggering automated bank finance pre-approvals.', timeline: '14-24 weeks', intervention: 'Tadbeer Photo Valuation & Finance AI Engine', futureState: 'Same-day vehicle deal closing, +20% trade-in volume.' },
    ],
    whatsappMessage: `Assalamu Alaikum Christian,\n\nI hope you're doing well. Following up on Premium Motors Volkswagen's impressive presence at your 10,000 sqm Wattayah facility and regional expansions.\n\nAt Tadbeer TT, we help luxury automotive importers convert digital showroom leads faster and retain after-sales customers. We've prepared a customized AI Sales & Service Proposal for Volkswagen Oman targeting 4.5x faster lead response and RO 680K in annual revenue growth.\n\nI've attached the full proposal. Would you be open to a brief 30-minute discovery call this week?\n\nBest regards,\nIsmail Hassan | Tadbeer TT\noperation@tadbeertt.com | +968 7630 7656`,
    contactName: 'Christian Nehme',
    proposalValidUntil: 'August 19, 2026',
  },

  'Kenz Hypermarket': {
    industry: 'Retail/Hypermarket',
    specificObservation: 'your 24/7 hypermarket operations in Al Khoud and Ma’belah near Sultan Qaboos University (SQU), managing 15,000+ SKUs across high-density student hubs',
    researchNotes: 'Kenz Hypermarket: Major 24/7 retail operator with key hypermarket hubs in Al Khoud and Ma’belah, strategically located near Sultan Qaboos University (SQU). Manages 15,000+ SKUs across groceries, fresh produce, hot food, electronics, and household goods. Key Contact: Shiraz Ahmad.',
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

  '350 Youth Clothing': {
    industry: 'Retail/Fashion',
    specificObservation: 'online visibility and how customers browse and enquire',
    tagline: 'From invisible online to impossible to miss.',
    subtitle: 'Transforming a strong offline youth fashion presence into a discoverable, browsable, and repeatable digital sales channel.',
    heroStats: [
      { value: 'Zero', unit: 'Visibility', label: 'Verified Online Presence' },
      { value: 'Multi-Channel', unit: 'Discovery', label: 'Customer Discovery Potential' },
      { value: '3 Pillars', unit: 'Framework', label: 'Growth, Access, Retention' },
      { value: 'One System', unit: 'Storefront', label: 'Simple Digital Storefront' },
    ],
    diagnosisIntro: `Our research into 350 Youth Clothing's public digital footprint returned no verified website and no Google Business presence. This is not a judgment on the quality of the business itself, but it is a clear and measurable commercial gap. In retail, particularly youth fashion where trends move quickly and customers often browse before buying, invisibility online almost always means lost customers to competitors who show up first in a search or have an easy way to preview products. The following diagnosis focuses on what this absence likely means in practice, without assuming anything about internal operations we cannot verify.`,
    leaks: [
      { type: 'GAP', title: 'No Digital Discoverability', description: 'A customer searching for "youth clothing near me" or similar terms in the local area would currently have no way to find 350 Youth Clothing through search engines or Google Maps.', impact: 'Lost Local Search Foot Traffic' },
      { type: 'GAP', title: 'No Way to Browse Before Buying', description: 'Youth fashion customers, especially teens and young adults, are used to browsing collections, checking styles, and comparing prices online before deciding where to shop.', impact: 'Lower Early Intent Conversion' },
      { type: 'RISK', title: 'Dependence on Walk-In and Word of Mouth Only', description: 'If the business currently relies solely on foot traffic and word of mouth, growth is naturally capped by physical visibility and local reputation alone.', impact: 'Vulnerable to Online Competitors' },
    ],
    solutionIntro: 'The goal of this solution is deliberately simple: give 350 Youth Clothing a digital front door that customers can find, browse, and act on, without adding operational complexity to the business. This ties directly into making more money by capturing search-based demand, operating better by reducing repetitive manual questions, and improving customer experience by giving shoppers a clear way to see what\'s available before they visit.',
    phases: [
      { phaseNum: 1, title: 'Digital Foundation Setup', description: 'A simple, mobile-friendly website or landing page, plus a properly configured Google Business listing with location, hours, and contact details.', timeline: '2-4 weeks', intervention: 'Mobile Website & Google Business Listing', futureState: 'Increased local discoverability and credible first impression.' },
      { phaseNum: 2, title: 'Product Discovery & WhatsApp Commerce', description: 'A simple visual catalogue of current collections linked directly to a WhatsApp ordering or enquiry button.', timeline: '4-6 weeks', intervention: 'WhatsApp Visual Catalogue', futureState: 'Higher quality enquiries, faster conversion, less staff admin.' },
      { phaseNum: 3, title: 'Repeat Customer Follow-Up', description: 'A lightweight customer list and simple WhatsApp broadcast approach for new arrivals, restocks, or seasonal offers.', timeline: '6-8 weeks', intervention: 'Lightweight VIP Customer List', futureState: 'More repeat visits and stronger customer loyalty.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mr Abdul,

Hope you're doing well.

We looked into 350 Youth Clothing and noticed a few areas around online visibility and how customers browse and enquire that could help the business.

We put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.

We're also offering a free business audit if you'd like us to look deeper.

Ismail`,
    contactName: 'Abdul Aziz',
    proposalValidUntil: 'August 22, 2026',
  },

  'Lights And Fans Shop': {
    industry: 'Retail/Electrical',
    specificObservation: 'online visibility and how customers ask about products',
    tagline: 'Turning product questions into product sales.',
    subtitle: 'Building a simple digital bridge that helps customers discover, compare, and buy lighting and fan products with confidence.',
    heroStats: [
      { value: 'Zero', unit: 'Presence', label: 'Verified Online Presence' },
      { value: 'High Research', unit: 'Category', label: 'Product Comparison Behavior' },
      { value: '3 Pillars', unit: 'Focus', label: 'Visibility, Clarity, Speed' },
      { value: 'One System', unit: 'Enquiry', label: 'Connected Enquiry Flow' },
    ],
    diagnosisIntro: `Our research found no website and no Google Business listing for Lights And Fans Shop. In a product category where customers typically want to see options, understand specifications, and compare pricing before visiting a store, this absence represents a real and identifiable commercial gap. The following observations focus on what is publicly verifiable and what can be reasonably inferred from typical customer behavior in this retail category.`,
    leaks: [
      { type: 'GAP', title: 'Invisible to Local Product Searches', description: 'Customers searching for "lighting shop near me" or "fan shop [area]" currently have no way to discover this business through search engines or maps.', impact: 'Lost Local Buyer Traffic' },
      { type: 'GAP', title: 'No Way to Pre-Browse Products or Pricing', description: 'Buyers in this category often want to see product types, styles, and price ranges before deciding where to shop or request a quote.', impact: 'Missed High-Intent Buyers' },
      { type: 'RISK', title: 'Manual, Repetitive Sales Conversations', description: 'If customers currently need to call or visit just to ask basic questions about stock, size, or pricing, this likely consumes significant staff time on repetitive queries.', impact: 'Staff Time Loss on Basic Enquiries' },
    ],
    solutionIntro: 'This solution focuses on making Lights And Fans Shop easier to find, easier to understand, and faster to buy from. It supports making more money by capturing local search demand, operating better by reducing repetitive basic questions, and improving customer experience by giving buyers clarity before they commit to a purchase or quote request.',
    phases: [
      { phaseNum: 1, title: 'Local Digital Presence Setup', description: 'A simple website with location, contact details, and product categories, plus a properly set up Google Business listing.', timeline: '2-4 weeks', intervention: 'Local SEO Website & Google Business Setup', futureState: 'Improved local search visibility and inbound enquiries.' },
      { phaseNum: 2, title: 'Product Catalogue & WhatsApp Enquiry Flow', description: 'A simple visual catalogue organized by product category, linked to a direct WhatsApp enquiry button.', timeline: '4-6 weeks', intervention: 'WhatsApp Product Catalogue', futureState: 'Faster sales conversations and reduced repetitive queries.' },
      { phaseNum: 3, title: 'Quote & Repeat Business Tracking', description: 'A lightweight system to log quote requests and past customers for simple follow-up.', timeline: '6-8 weeks', intervention: 'Lightweight Quote & Follow-Up Tracker', futureState: 'Better quote conversion and stronger referral business.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mr Abdul,

Hope you're doing well.

We looked into Lights And Fans Shop and noticed a few areas around online visibility and how customers ask about products that could help the business.

We put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.

We're also offering a free business audit if you'd like us to look deeper.

Ismail`,
    contactName: 'Abdul Aziz',
    proposalValidUntil: 'August 22, 2026',
  },

  'Flower Story': {
    industry: 'Retail/Florist',
    specificObservation: 'turning your strong Instagram following into more orders and repeat customers',
    tagline: 'From likes to loyal customers.',
    subtitle: 'Converting Flower Story\'s strong social following into a smoother ordering journey and stronger repeat purchase engine.',
    heroStats: [
      { value: '73K', unit: 'Followers', label: 'Instagram Followers' },
      { value: 'High Engagement', unit: 'Discovery', label: 'Social Discovery Strength' },
      { value: '3 Pillars', unit: 'Strategy', label: 'Conversion, Efficiency, Loyalty' },
      { value: 'One System', unit: 'Orders', label: 'Order & Occasion Tracking' },
    ],
    diagnosisIntro: `Flower Story has clearly succeeded at building audience attention, with a substantial and active Instagram following. The diagnosis below focuses not on visibility, which is already strong, but on what typically happens after a follower becomes interested: the ordering process, service consistency, and repeat purchase behavior. These are common friction points for social-first florists and are the most likely areas where additional revenue and efficiency are currently being left on the table.`,
    leaks: [
      { type: 'GAP', title: 'Strong Attention, Uncertain Conversion Path', description: 'With 73K followers actively engaging with content, the volume of interest is significant, but there is no publicly visible structured path from "interested in a post" to "order placed."', impact: 'Interest Drop-off Before Order' },
      { type: 'GAP', title: 'Likely Manual, Conversation-by-Conversation Ordering', description: 'Florist businesses at this scale typically manage orders through individual WhatsApp or DM conversations, which work but can become inconsistent as volume grows.', impact: 'Slower Response During Peak Times' },
      { type: 'GAP', title: 'Occasion-Based Repeat Purchases Underused', description: 'Flowers are frequently purchased around recurring, predictable occasions such as birthdays, anniversaries, and gifting moments, which create natural repeat purchase opportunities.', impact: 'Missed Repeat Occasion Revenue' },
    ],
    solutionIntro: 'The approach here respects what Flower Story has already built. Rather than changing the creative brand or content strategy, the solution focuses on making the path from interest to order smoother, and on turning one-time buyers into repeat customers. This directly supports making more money through better conversion and repeat purchases, operating better through reduced manual back-and-forth, and improving customer experience through faster, clearer ordering.',
    phases: [
      { phaseNum: 1, title: 'Order Journey Audit & Flow Design', description: 'A review of the current enquiry-to-order process, followed by simple, standardized WhatsApp response templates and a clear ordering flow.', timeline: '2-4 weeks', intervention: 'Standardized WhatsApp Order Intake', futureState: 'Faster response times and higher conversion rate.' },
      { phaseNum: 2, title: 'Simple Catalogue & Ordering Support', description: 'A lightweight product and pricing overview linked directly to WhatsApp, reducing repetitive back-and-forth.', timeline: '4-6 weeks', intervention: 'Digital Bouquet & Price Guide', futureState: 'Shorter sales conversations and quicker confirmations.' },
      { phaseNum: 3, title: 'Occasion-Based Repeat Purchase System', description: 'A simple system to record customer occasions (birthdays, anniversaries) and send timely, respectful reminders.', timeline: '6-8 weeks', intervention: 'Occasion Reminder Engine', futureState: 'Increased repeat orders and stronger customer retention.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mr Abdul,

Hope you're doing well.

We looked into Flower Story and noticed a few areas around turning your strong Instagram following into more orders and repeat customers that could help the business.

We put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.

We're also offering a free business audit if you'd like us to look deeper.

Ismail`,
    contactName: 'Abdul Hameed',
    proposalValidUntil: 'August 22, 2026',
  },

  'Perfumes Icud': {
    industry: 'Retail/Fragrance',
    specificObservation: 'helping customers choose the right fragrance online and come back for repeat purchases',
    tagline: 'Making every scent story make sense to the right customer.',
    subtitle: 'Refining an existing online fragrance store to better serve and convert local customers, while improving guidance and repeat purchases.',
    heroStats: [
      { value: 'Existing', unit: 'Storefront', label: 'E-Commerce Storefront' },
      { value: 'Localization Gap', unit: 'Alignment', label: 'Market Alignment Opportunity' },
      { value: '3 Pillars', unit: 'Growth', label: 'Trust, Guidance, Repeat Sales' },
      { value: 'One System', unit: 'Journey', label: 'Localized Customer Journey' },
    ],
    diagnosisIntro: `Perfumes Icud's existing e-commerce presence at ioudstore.com is a real asset, but our review of the publicly visible storefront content raised a specific concern around market alignment, along with broader opportunities common to fragrance retail. The following diagnosis separates what we directly observed from what is a reasonable category-based hypothesis.`,
    leaks: [
      { type: 'RISK', title: 'Storefront May Be Misaligned With Oman Customers', description: 'Publicly visible content on the storefront references shipping and offers oriented toward Saudi Arabia, which may create confusion or reduce trust for Oman-based buyers landing on the same site.', impact: 'Local Checkout Abandonment' },
      { type: 'GAP', title: 'Limited Visible Guidance for Fragrance Selection', description: 'Fragrance buyers frequently want help understanding scent families, longevity, and occasion suitability before committing to a purchase, especially for gifting.', impact: 'Uncertain Buyer Drop-off' },
      { type: 'GAP', title: 'Repeat Purchase and Gifting Behavior Not Fully Activated', description: 'Fragrance is a category with strong natural repeat purchase potential, especially around gifting occasions, but this depends on tracking customer preferences over time.', impact: 'Unused Lifetime Value Potential' },
    ],
    solutionIntro: 'This solution is about sharpening an existing asset rather than building something new. It supports making more money by improving local conversion, operating better by reducing confusion at checkout, and improving customer experience through better guidance and more relevant repeat engagement.',
    phases: [
      { phaseNum: 1, title: 'Local Market Alignment Review', description: 'A focused review and correction of shipping information, currency, and messaging to clearly reflect Oman as a served market.', timeline: '2-4 weeks', intervention: 'Oman Storefront Localization', futureState: 'Increased trust and reduced checkout hesitation.' },
      { phaseNum: 2, title: 'Fragrance Guidance & Product Clarity', description: 'Simple, clear guidance content and WhatsApp support to help customers select the right fragrance.', timeline: '4-6 weeks', intervention: 'WhatsApp Fragrance Selector', futureState: 'Higher conversion rates and fewer uncertain purchases.' },
      { phaseNum: 3, title: 'Repeat Purchase & Preference Tracking', description: 'A simple system to record customer preferences and past purchases, enabling relevant follow-up.', timeline: '6-8 weeks', intervention: 'Scent Preference CRM', futureState: 'Increased repeat purchases and higher customer lifetime value.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mr Abdullah,

Hope you're doing well.

We looked into Perfumes Icud and noticed a few areas around helping customers choose the right fragrance online and come back for repeat purchases that could help the business.

We put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.

We're also offering a free business audit if you'd like us to look deeper.

Ismail`,
    contactName: 'Abdullah',
    proposalValidUntil: 'August 22, 2026',
  },

  'Obaidani Stores': {
    industry: 'Retail/Menswear',
    specificObservation: 'connecting your branches and digital presence into one smoother customer journey',
    tagline: 'Six decades of heritage, one connected customer journey.',
    subtitle: 'Unifying Al Obaidani\'s branch network, tailoring services, and digital presence into a single, seamless customer experience.',
    heroStats: [
      { value: '1964', unit: 'Heritage', label: 'Established Heritage Brand' },
      { value: '32', unit: 'Outlets', label: 'Retail Outlets Nationwide' },
      { value: '2', unit: 'Factories', label: 'Production Factories' },
      { value: 'One Journey', unit: 'Connected', label: 'Connected Online & Branch Experience' },
    ],
    diagnosisIntro: `Al Obaidani's public presence reflects genuine scale and heritage strength, including a wide branch network, established production capability, and an active website and social presence. The following diagnosis is focused not on whether the brand is strong, it clearly is, but on whether the individual strong pieces (branches, tailoring, digital channels) are working together as one connected customer journey, or operating somewhat independently.`,
    leaks: [
      { type: 'GAP', title: 'Branch Network Strength Not Fully Connected Digitally', description: 'With 32 outlets, customers benefit enormously from convenience and accessibility, but the digital experience may not be clearly guiding customers to the most relevant branch based on their location or need.', impact: 'Friction in Online-to-Store Journey' },
      { type: 'GAP', title: 'Custom Tailoring Journey May Rely on Manual Coordination', description: 'Custom-made dishdashas require measurements, fabric preferences, and repeat order history, which are typically valuable to track digitally for consistency and convenience.', impact: 'Inconsistent Cross-Branch Sizing Data' },
      { type: 'GAP', title: 'Seasonal and Repeat Customer Engagement Potential', description: 'Traditional menswear naturally has strong seasonal purchase patterns, particularly around Eid and other cultural occasions, which represent a significant repeat-engagement opportunity.', impact: 'Uncaptured Seasonal Repeat Revenue' },
    ],
    solutionIntro: 'Given Al Obaidani\'s scale, the solution here is about connection, not construction. It focuses on linking existing strengths together to support making more money through better seasonal engagement, operating better through more consistent tailoring data across branches, and improving customer experience through smoother digital-to-branch journeys.',
    phases: [
      { phaseNum: 1, title: 'Full Customer Journey Audit', description: 'A comprehensive review of the current website, branch information, and customer touchpoints from first discovery through to in-store service.', timeline: '2-4 weeks', intervention: 'Omnichannel Customer Journey Audit', futureState: 'Clear, prioritized view of biggest impact opportunities.' },
      { phaseNum: 2, title: 'Connected Tailoring & Branch System', description: 'A simple, centralized system to record customer measurements, preferences, and order history, accessible across branches.', timeline: '4-8 weeks', intervention: 'Centralized Measurement & Order OS', futureState: 'Consistent customer service across all 32 branches.' },
      { phaseNum: 3, title: 'Seasonal & Repeat Customer Engagement', description: 'A structured seasonal communication approach reaching past customers with relevant, well-timed updates.', timeline: '8-12 weeks', intervention: 'Automated Seasonal Eid Engine', futureState: 'Increased repeat purchases during peak seasonal periods.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mr Abbas,

Hope you're doing well.

We looked into Al Obaidani Stores and noticed a few areas around connecting your branches and digital presence into one smoother customer journey that could help the business.

We put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.

We're also offering a free business audit if you'd like us to look deeper.

Ismail`,
    contactName: 'Abbas',
    proposalValidUntil: 'August 22, 2026',
  },

  'Smart City': {
    industry: 'Retail/Electronics',
    specificObservation: 'how customers find the business and reach out with questions',
    tagline: 'Building the digital front door your customers are already looking for.',
    subtitle: 'Establishing a simple, practical online presence that helps customers find, understand, and buy from Smart City with confidence.',
    heroStats: [
      { value: 'Limited', unit: 'Visibility', label: 'Current Digital Visibility' },
      { value: 'Local Search', unit: 'Channel', label: 'Untapped Discovery Channel' },
      { value: '3 Pillars', unit: 'Approach', label: 'Visibility, Access, Growth' },
      { value: 'One System', unit: 'Front Door', label: 'Simple Digital Front Door' },
    ],
    diagnosisIntro: `Our research into Smart City's public digital footprint found very limited visibility. This section focuses on what that gap likely means in practical commercial terms, based on how retail customers typically behave when searching for and choosing where to shop.`,
    leaks: [
      { type: 'GAP', title: 'Limited Discoverability for Local Customers', description: 'Customers searching online for relevant products or services in the area currently have little to no way of finding Smart City through search or maps.', impact: 'Missed Nearby Search Intent' },
      { type: 'GAP', title: 'No Clear Way for Customers to Understand Offerings', description: 'Without a website or clear online information, potential customers have no way to understand what the business sells or offers before making direct contact.', impact: 'Buyer Hesitation & Friction' },
      { type: 'RISK', title: 'Reliance on Direct Contact for Basic Information', description: 'If customers must call or visit in person just to learn basic information, this creates unnecessary friction that may discourage first contact altogether.', impact: 'Lost Prospects to Competitors' },
    ],
    solutionIntro: 'This solution is intentionally simple and foundational. It focuses on making more money by capturing currently missed local search demand, operating better by reducing repetitive basic information requests, and improving customer experience by giving people an easy first step to learn about the business.',
    phases: [
      { phaseNum: 1, title: 'Basic Digital Presence Setup', description: 'A simple website with essential business information, plus a properly configured Google Business listing.', timeline: '2-4 weeks', intervention: 'Digital Presence & Google Setup', futureState: 'Improved local discoverability and first touchpoint.' },
      { phaseNum: 2, title: 'Customer Enquiry & Communication Layer', description: 'A simple WhatsApp-based enquiry channel connected to the new digital presence.', timeline: '4-6 weeks', intervention: 'WhatsApp Customer Enquiry Flow', futureState: 'Higher-quality enquiries and faster response times.' },
      { phaseNum: 3, title: 'Repeat Communication & Simple Customer Tracking', description: 'A lightweight customer list for simple, relevant follow-up communication.', timeline: '6-8 weeks', intervention: 'Customer Follow-Up List', futureState: 'Improved retention and customer relationship growth.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mr Abbas,

Hope you're doing well.

We looked into Smart City and noticed a few areas around how customers find the business and reach out with questions that could help the business.

We put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.

We're also offering a free business audit if you'd like us to look deeper.

Ismail`,
    contactName: 'Abbas',
    proposalValidUntil: 'August 22, 2026',
  },

  'Supermarket Comex': {
    industry: 'Retail/Supermarket',
    specificObservation: 'practical ways to improve customer convenience and communication',
    tagline: 'Building on trust, making everyday shopping easier.',
    subtitle: 'Using our existing relationship as a foundation to explore practical improvements in customer convenience and communication.',
    heroStats: [
      { value: 'Existing', unit: 'Relationship', label: 'Relationship Context' },
      { value: 'High Frequency', unit: 'Model', label: 'Repeat Visit Business Model' },
      { value: '3 Pillars', unit: 'Pillars', label: 'Convenience, Communication, Retention' },
      { value: 'One System', unit: 'Layer', label: 'Simple Customer Communication Layer' },
    ],
    diagnosisIntro: `Because this is grounded in an existing relationship rather than fresh public research, the following diagnosis focuses on general, well-established supermarket customer experience patterns rather than specific claims about Comex's internal systems. These are offered as reasonable starting points for a deeper conversation, not confirmed findings.`,
    leaks: [
      { type: 'GAP', title: 'Digital Communication Can Strengthen Repeat Visits', description: 'Supermarkets that proactively communicate offers, promotions, and updates to customers typically see stronger repeat visit patterns than those relying solely on in-store signage.', impact: 'Uncaptured Repeat Shopping Visits' },
      { type: 'GAP', title: 'Customer Journey May Be Primarily In-Store Only', description: 'If most customer interaction currently happens only during a physical visit, there may be limited touchpoints to re-engage customers between visits.', impact: 'No Touchpoints Between Visits' },
      { type: 'GAP', title: 'Basic Digital Support Can Reduce Simple In-Store Questions', description: 'Common customer questions around product availability, hours, or offers can often be addressed through a simple digital channel, freeing up staff time.', impact: 'In-Store Staff Time Overhead' },
    ],
    solutionIntro: 'Given the existing relationship, this solution is intentionally exploratory and low-pressure. It focuses on making more money through better repeat visit engagement, operating better through reduced basic in-store questions, and improving customer experience through simple, convenient communication.',
    phases: [
      { phaseNum: 1, title: 'Customer Convenience & Access Review', description: 'A short, collaborative review of current customer touchpoints and communication.', timeline: '2-4 weeks', intervention: 'Convenience & Touchpoint Audit', futureState: 'Clear list of practical, low-effort improvements.' },
      { phaseNum: 2, title: 'Simple Customer Communication Channel', description: 'A simple, opt-in WhatsApp channel for store updates and offers.', timeline: '4-6 weeks', intervention: 'Opt-In WhatsApp Store Update Channel', futureState: 'Increased repeat visit frequency and neighborhood engagement.' },
      { phaseNum: 3, title: 'Basic Inquiry & Feedback Support', description: 'A simple digital touchpoint for store hours, locations, and quick customer feedback.', timeline: '6-8 weeks', intervention: 'Digital Info & Feedback Touchpoint', futureState: 'Reduced basic in-store questions and better customer insights.' },
    ],
    whatsappMessage: "Assalamu Alaikum Mr Ahmed,\n\nHope you're doing well.\n\nFollowing up on our existing connection with Comex, we looked into a few practical ways to improve customer convenience and communication for Supermarket Comex.\n\nWe put together some observations just for you. This isn't a sales pitch, just something useful we wanted to share.",
    contactName: 'Ahmed Said Alhazi',
    proposalValidUntil: 'August 22, 2026',
  },
}

export async function runBulkProposalAndCadenceSeeding(userEmail: string = 'w.taufiqq@gmail.com', sessionDate?: string, dryRun: boolean = false) {
  const targetDate = sessionDate || new Date().toISOString().split('T')[0]

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
    return { error: 'No user found in DB' }
  }

  // 2. Find or create today's daily cadence session
  let { data: session } = await supabase
    .from('daily_outreach_sessions')
    .select('*')
    .eq('user_id', targetUser.id)
    .eq('session_date', targetDate)
    .maybeSingle()

  if (!session) {
    const { data: newSess, error: sErr } = await supabase
      .from('daily_outreach_sessions')
      .insert({
        user_id: targetUser.id,
        session_date: targetDate,
        target_count: 10,
      })
      .select()
      .single()

    if (sErr) return { error: sErr.message }
    session = newSess
  }

  // 3. Process each proposal
  const results: any[] = []

  for (const [rawName, proposal] of Object.entries(PROPOSALS)) {
    const searchKeyword = rawName.split(' ')[0]
    const secondKeyword = rawName.split(' ')[1] || searchKeyword
    const cleanName = rawName.replace(/\+/g, '')
    const searchPattern = '%' + cleanName + '%'

    let { data: company } = await supabase
      .from('companies')
      .select('*, contacts(*)')
      .ilike('company_name', searchPattern)
      .maybeSingle()

    if (!company) {
      const orFilter = 'company_name.ilike.%' + searchKeyword + '%,company_name.ilike.%' + secondKeyword + '%';
      const { data: fallbackCompany } = await supabase
        .from('companies')
        .select('*, contacts(*)')
        .or(orFilter)
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

    const proposalData = {
      coverTitleFormat: 'Tadbeer x ' + company.company_name,
      tagline: proposal.tagline,
      subtitle: proposal.subtitle,
      specificObservation: proposal.specificObservation,
      preparedDate: 'July 2026',
      aboutTadbeerContext: "Tadbeer Transformation (Tadbeer TT) is Oman's premier system architecture and operational scaling partner based in Madinat Qaboos, Muscat. We empower GCC enterprises to eliminate operational bottlenecks and scale seamlessly by deploying custom software solutions, AI technology & machine learning workflows, data-driven digital marketing, and human capital transformation frameworks. Based on our pre-contact audit of " + company.company_name + "'s operational footprint, Tadbeer TT has structured a deterministic path to system excellence and revenue optimization.",
      selectedCaseStudies: recommendedStudies,
      selectedClientLogos: recommendedLogos,
      executiveSummaryText: proposal.diagnosisIntro,
      contextualMetrics: proposal.heroStats.map(s => ({
        value: s.value,
        label: s.label,
        context: s.unit + ' achieved through automated system standardization and workflow optimization.',
        source: 'Operational Intelligence Audit'
      })),
      diagnosisCards: proposal.leaks,
      solutionIntro: proposal.solutionIntro,
      phaseCards: proposal.phases,
      whatsappMessage: proposal.whatsappMessage,
      proposalValidUntil: proposal.proposalValidUntil,
      contactName: proposal.contactName || primaryContact?.full_name || 'Hiring Manager',
      contactTitle: primaryContact?.title || 'Decision Maker',
      contactEmail: primaryContact?.email || company.email || 'contact@tadbeer.com',
      companyName: company.company_name,
      companyLocation: company.location || 'Muscat, Oman',
      pricing: { currency: 'SAR', amount: 150000, terms: 'Net 30 days upon milestone sign-off' },
      roiSummary: 'Estimated 3.4x ROI within 12 months through margin leak recovery and downtime reduction.'
    }

    const messageBodyJson = JSON.stringify(proposalData)

    if (dryRun) {
      results.push({ company: rawName, status: 'dry_run', proposal: proposalData })
      continue
    }

    if (proposal.researchNotes) {
      await supabase
        .from('companies')
        .update({ notes: proposal.researchNotes })
        .eq('id', company.id)
    }

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
          message_body: messageBodyJson,
          status: 'ready',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      prepRecord = created
    }

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

  return {
    success: true,
    sessionId: session.id,
    sessionDate: targetDate,
    totalItems: results.length,
    results,
  }
}

export async function GET(request: NextRequest) {
  const denied = checkSeedSecret(request);
  if (denied) return denied;
  return NextResponse.json({ message: 'Seed endpoint ready. Use POST to run seeding.' });
}

export async function POST(request: NextRequest) {
  const denied = checkSeedSecret(request);
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}))
    const sessionDate = body.sessionDate || new Date().toISOString().split('T')[0]
    const userEmail = body.userEmail || 'w.taufiqq@gmail.com'
    const dryRun = body.dryRun === true

    const result = await runBulkProposalAndCadenceSeeding(userEmail, sessionDate, dryRun)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to seed proposals' },
      { status: 500 }
    )
  }
}
