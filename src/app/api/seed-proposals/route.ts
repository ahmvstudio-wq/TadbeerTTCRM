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
    tagline: 'AI-Powered Manufacturing Excellence for Oman Flour Mills',
    subtitle: 'Transforming Production Quality & Operational Efficiency Through Predictive Intelligence',
    heroStats: [
      { value: '60-75%', unit: 'Reduction', label: 'Unplanned Downtime' },
      { value: '81%', unit: 'Improvement', label: 'Defect Detection' },
      { value: '38%', unit: 'Increase', label: 'Production Volume' },
      { value: '$4.5M', unit: 'Potential', label: 'Annual Savings' },
    ],
    diagnosisIntro: 'Oman Flour Mills operates at 800 MT/day flour capacity and 1500 MT/day animal feed capacity. With 1,100+ employees and RO 68M+ turnover, reactive maintenance and manual quality checks create margin leakage estimated at 8-12% of production value annually.',
    leaks: [
      { type: 'LEAK', title: 'Quality Defects Detected at End-of-Line', description: 'Entire batch rejections result in 2-5% product scrap worth RO 1.2M+ annually. Late detection wastes raw materials, production time, and creates delivery delays. No predictive quality system analyzing production parameters in real-time.', impact: 'RO 1.2M Annual Scrap' },
      { type: 'RISK', title: 'Unplanned Equipment Downtime', description: 'Milling machinery failures cause 15-25% unplanned downtime worth RO 2.8M in lost production. Disrupts Dahabi and Barakat delivery schedules. Reactive maintenance strategy lacks predictive analytics on equipment health.', impact: 'RO 2.8M Lost Production' },
      { type: 'GAP', title: 'Inconsistent Production Parameters', description: 'Manual parameter adjustments cause batch-to-batch variations affecting brand consistency. Energy waste from non-optimized settings adds RO 450K annually. No AI optimization adjusting temperature, pressure, mixing ratios based on real-time ingredient quality.', impact: 'RO 450K Energy Waste' },
    ],
    solutionIntro: 'WOS deploys an integrated AI Manufacturing Intelligence Platform combining computer vision quality prediction, IoT-powered predictive maintenance, and self-optimizing production control—specifically calibrated for food processing environments with GMP compliance.',
    phases: [
      { phaseNum: 1, title: 'AI Quality Prediction & Real-Time Intervention', description: 'Deploy computer vision cameras and IoT sensors monitoring flour particle size, moisture content, temperature profiles, and packaging integrity. ML models predict quality defects up to 60 minutes before batch completion with 95% accuracy.', timeline: '4-8 weeks', intervention: 'Vision Quality Cameras & IoT Particle Sensors', futureState: '60% reduction in batch rejections, RO 1.2M annual savings.' },
      { phaseNum: 2, title: 'Predictive Maintenance Intelligence System', description: 'Install wireless IoT sensor network on 45+ critical assets. AI analyzes vibration signatures, temperature anomalies, current draw patterns to predict failures 7-14 days in advance. Automated work orders with CMMS integration.', timeline: '8-14 weeks', intervention: 'Wireless Vibration/Temperature Sensor Network', futureState: '70% reduction in unplanned downtime, RO 2.8M savings.' },
      { phaseNum: 3, title: 'Self-Optimizing Production Control AI', description: 'Implement reinforcement learning system continuously adjusting production parameters for maximum yield, minimum waste, and optimal energy consumption. Genetic algorithms optimize production scheduling across flour and feed lines.', timeline: '14-24 weeks', intervention: 'Reinforcement Learning Yield Optimizer', futureState: '12% OEE improvement and 38% production capacity gain.' },
    ],
    whatsappMessage: `Assalamu Alaikum Adil,\n\nI hope you're doing well. I've been looking into Oman Flour Mills SAOG's production operations and wanted to share a few specific observations around quality control and equipment maintenance that I think could be highly relevant given your scale (800 MT/day capacity).\n\nWe've prepared a tailored AI Transformation Proposal for Oman Flour Mills that addresses 3 critical operational leaks we identified — with a combined savings potential of $4.5M annually.\n\nI'm attaching the proposal for your review. Would you be open to a 30-minute discovery conversation this week?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Adil Nasser Al-Sabqi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Muna Noor International LLC': {
    industry: 'Construction/Engineering',
    tagline: 'AI-Driven Construction Intelligence for Muna Noor',
    subtitle: 'Eliminate Project Delays & Resource Waste Through Predictive Scheduling',
    heroStats: [
      { value: '20-30%', unit: 'Reduction', label: 'Project Delays' },
      { value: '35%', unit: 'Improvement', label: 'Resource Utilization' },
      { value: '58%', unit: 'Gain', label: 'Planning Efficiency' },
      { value: '$3.2M', unit: 'Savings', label: 'Annual Cost Savings' },
    ],
    diagnosisIntro: 'Muna Noor operates across construction, pipe manufacturing (40,000 MT capacity), engineering, and environmental solutions with projects spanning Muscat, Sohar, Nizwa, and Salalah. Managing concurrent projects, equipment deployment, and material logistics creates coordination gaps worth 15-20% of project value.',
    leaks: [
      { type: 'LEAK', title: 'Project Schedule Slippage & Penalty Exposure', description: '15-30% of projects exceed contracted timelines due to resource conflicts, dependency miscalculations, and weather disruptions. Penalties and reputation damage worth RO 1.8M annually. Manual scheduling cannot model complex dependencies across 20+ concurrent projects.', impact: 'RO 1.8M Penalty Exposure' },
      { type: 'RISK', title: 'Equipment & Labor Underutilization', description: 'Excavators, cranes, welding equipment, and specialized crews idle 25-35% of available hours waiting for materials, predecessor tasks, or permits. RO 2.4M in wasted capacity. No visibility into real-time equipment location and utilization across sites.', impact: 'RO 2.4M Idle Capacity' },
      { type: 'GAP', title: 'Manual Progress Tracking & Compliance Documentation', description: 'Site supervisors spend 30% of time on manual inspection reports and quality checklists. Incomplete records create payment disputes worth 5-10% of project value. No computer vision system auto-tracking progress against BIM models.', impact: '30% Supervisor Admin Burden' },
    ],
    solutionIntro: 'WOS deploys Construction AI Platform integrating predictive scheduling algorithms, real-time resource optimization, and automated progress monitoring—purpose-built for multi-site engineering and construction operations across Oman.',
    phases: [
      { phaseNum: 1, title: 'AI Schedule Optimization & Risk Prediction', description: 'Deploy constraint-based optimization engine analyzing project dependencies, resource constraints, and historical task duration data from 50+ years of Muna Noor projects. Monte Carlo simulation identifies schedule risks.', timeline: '4-8 weeks', intervention: 'Constraint-Based AI Scheduler Engine', futureState: '25% reduction in schedule overruns and RO 1.8M penalty avoidance.' },
      { phaseNum: 2, title: 'Dynamic Resource Allocation Intelligence', description: 'AI system continuously optimizing equipment, materials, and workforce allocation across Muscat, Sohar, Nizwa, and Salalah sites. GPS tracking integrated with resource allocation AI.', timeline: '8-14 weeks', intervention: 'GPS & Real-Time Resource Dispatcher', futureState: '35% improvement in equipment utilization, RO 2.4M capacity recovery.' },
      { phaseNum: 3, title: 'Computer Vision Progress Monitoring & Auto-Documentation', description: 'Drone-based and mobile camera computer vision automatically tracks construction progress against BIM models. AI detects completed work percentages, identifies quality deviations, flags safety hazards.', timeline: '14-24 weeks', intervention: 'BIM Computer Vision Progress Tracker', futureState: '70% reduction in documentation time, 99% audit compliance.' },
    ],
    whatsappMessage: `Assalamu Alaikum Athar,\n\nThank you for your time earlier. I wanted to follow up with the tailored AI Transformation Proposal for Muna Noor International LLC that I mentioned.\n\nWe've identified 3 critical operational challenges in project scheduling and resource coordination across your multi-site operations — with a combined $3.2M annual cost savings opportunity.\n\nI've attached the full proposal for your review. Would a brief 30-minute call this week work to walk through the key findings?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Athar Qureshi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Al Jassar Group LLC': {
    industry: 'Trading/Distribution',
    tagline: 'AI Supply Chain & Demand Intelligence for Al Jassar Group',
    subtitle: 'Optimize Inventory, Forecast Demand, Unlock Working Capital',
    heroStats: [
      { value: '77%', unit: 'Reduction', label: 'Stock-Out Events' },
      { value: '38%', unit: 'Improvement', label: 'Inventory Turnover' },
      { value: '31%', unit: 'Increase', label: 'Operating Profit' },
      { value: 'RO 2.8M', unit: 'Release', label: 'Working Capital' },
    ],
    diagnosisIntro: 'Al Jassar Group operates diversified trading across HVAC, MEP, construction materials, telecom, and specialty products with 1000+ SKUs and suppliers across 15+ countries. Managing inventory levels creates cash flow pressure estimated at RO 4-6M tied in excess stock.',
    leaks: [
      { type: 'LEAK', title: 'Inventory Imbalances: Overstock & Chronic Stockouts', description: '20-30% of SKUs overstocked (RO 4.2M tied capital earning zero return) while 15% stock out losing RO 1.8M in sales. Manual Excel-based demand forecasting cannot analyze seasonal patterns, construction project pipeline, government budget cycles.', impact: 'RO 4.2M Capital Tied' },
      { type: 'RISK', title: 'Suboptimal Purchase Timing & Supplier Selection', description: 'Reactive ordering misses bulk discounts worth 3-5%, unfavorable currency exchange timing adds 2%, and expedited freight erodes 4% margin. Total RO 2.1M annual leakage. No AI system optimizing purchase timing.', impact: 'RO 2.1M Annual Leakage' },
      { type: 'GAP', title: 'Missed Cross-Sell & Customer Insight Blindness', description: 'Cannot predict which contractors will need complementary products for their active projects. Lost upsell opportunities worth 10-15% of revenue (RO 3.5M). Customer purchase history sits in separate systems.', impact: 'RO 3.5M Lost Cross-Sell' },
    ],
    solutionIntro: 'WOS implements AI Supply Chain Intelligence Platform combining time-series demand forecasting, multi-objective inventory optimization, and customer behavior analytics—calibrated for multi-category B2B trading operations in GCC construction sector.',
    phases: [
      { phaseNum: 1, title: 'AI Demand Forecasting & Market Intelligence', description: 'Deploy GRU neural networks analyzing 25+ years of sales history, construction project tender data, government infrastructure announcements, and seasonal patterns.', timeline: '4-8 weeks', intervention: 'GRU Neural Time-Series Demand Forecaster', futureState: '77% reduction in stockouts and RO 1.8M recovered sales.' },
      { phaseNum: 2, title: 'Inventory & Purchase Optimization Engine', description: 'Multi-objective optimization AI calculating optimal reorder points and timing for 1000+ SKUs. Automated purchase recommendations rank suppliers by total landed cost.', timeline: '8-14 weeks', intervention: 'Multi-SKU Inventory & Landed Cost Engine', futureState: '38% inventory turnover boost and RO 2.8M capital release.' },
      { phaseNum: 3, title: 'Customer Intelligence & Proactive Upsell System', description: 'Customer behavior AI segmenting contractors by project types, purchase frequency, and lifetime value. Automated alert system notifies account managers when high-value customers are due for reorders.', timeline: '14-24 weeks', intervention: 'Contractor Upsell Alert & Scoring AI', futureState: '15% increase in cross-sell revenue (RO 3.5M).' },
    ],
    whatsappMessage: `Assalamu Alaikum Suresh,\n\nI hope you're well. As discussed, I've prepared a tailored AI Transformation Proposal for Al Jassar Group LLC focused on supply chain intelligence and demand forecasting across your 1000+ SKU portfolio.\n\nKey opportunity: RO 2.8M in working capital release and 77% reduction in stock-out events through AI-driven inventory optimization.\n\nI've attached the full proposal. Would be great to walk you through the key findings — are you available for a brief call this week?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Suresh Kumar',
    proposalValidUntil: 'August 19, 2026',
  },

  'Vertex+ Interior Design & Fit-Out': {
    industry: 'Interior Design',
    tagline: 'AI Design Visualization & Project Intelligence for Vertex+',
    subtitle: 'Close More Deals, Deliver Faster, Eliminate Rework',
    heroStats: [
      { value: '40%', unit: 'Increase', label: 'Client Conversion Rate' },
      { value: '65%', unit: 'Reduction', label: 'Design Revision Cycles' },
      { value: '8-12 days', unit: 'Faster', label: 'Project Delivery' },
      { value: 'RO 450K', unit: 'Potential', label: 'Annual Revenue Growth' },
    ],
    diagnosisIntro: 'Vertex+ delivers ultra-modern interior design and fit-out for residential and commercial projects across Oman. Current manual rendering and project coordination methods limit scalability and create rework worth 15-20% of project budgets.',
    leaks: [
      { type: 'LEAK', title: 'Client Decision Delays from Poor Visualization', description: 'Clients struggle to visualize finished spaces from 2D drawings. Indecision extends sales cycles by 3-6 weeks, reducing annual project capacity by 25%. Manual 3D rendering takes 2-4 days per concept.', impact: '3-6 Wks Sales Lag' },
      { type: 'RISK', title: 'Design Revision Rework & Scope Creep', description: 'Mid-project design changes due to client misunderstanding original vision. Rework averages 15-20% of project labor costs and delays handover by 10-15 days. No AI generating photorealistic visualizations from sketches in minutes.', impact: '15-20% Labor Rework Cost' },
      { type: 'GAP', title: 'Project Coordination & Procurement Inefficiencies', description: 'Manual tracking of furniture orders, material deliveries, contractor schedules across 8-12 concurrent projects. Delays cost RO 85K annually in penalties and carrying costs. Spreadsheet-based management cannot predict delivery delays.', impact: 'RO 85K Delay Costs' },
    ],
    solutionIntro: 'WOS deploys Interior Design AI Suite combining instant photorealistic rendering, client collaboration tools, and intelligent project coordination—purpose-built for high-end residential and commercial interior firms.',
    phases: [
      { phaseNum: 1, title: 'AI Visualization Engine & Client Presentation Suite', description: 'AI rendering platform transforms sketches, mood boards, and text descriptions into photorealistic interior visualizations in under 2 minutes. Generate multiple design options during initial consultation.', timeline: '4-8 weeks', intervention: '2-Minute AI Photorealistic Renderer', futureState: '40% increase in client conversion, 8 new projects/yr.' },
      { phaseNum: 2, title: 'Smart Project Coordination & Delivery Tracking', description: 'AI project management system tracking design milestones, procurement orders, contractor schedules across all active projects. ML models predict task completion and flag risks 7-14 days in advance.', timeline: '8-14 weeks', intervention: 'Predictive Fit-Out Task Dispatcher', futureState: '30% faster project delivery, capacity for +25% projects.' },
      { phaseNum: 3, title: 'Client Collaboration Portal & Change Management AI', description: 'Cloud-based client portal where clients view visualizations, approve designs, and track progress in real-time. Change request impact analysis shows cost and timeline implications before approval.', timeline: '14-24 weeks', intervention: 'Client Approval & Scope Creep AI Guardrail', futureState: '65% reduction in revision cycles, zero scope creep disputes.' },
    ],
    whatsappMessage: `Assalamu Alaikum Abdullatif,\n\nI hope you're doing well. I've put together a tailored AI Transformation Proposal for Vertex+ Interior Design & Fit-Out that I believe will be highly relevant to your client acquisition and project delivery operations.\n\nKey focus: AI visualization tools that convert client consultations into closed deals 40% faster, and intelligent project coordination to eliminate the rework costing 15-20% of project budgets.\n\nI've attached the full proposal. Would love to get your thoughts — are you free for a brief call this week?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Abdullatif Moughrabi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Stay Development': {
    industry: 'Real Estate',
    tagline: 'AI Property Matching & Lead Intelligence for Stay Development',
    subtitle: 'Convert More Leads, Accelerate Sales Cycles, Maximize Unit Values',
    heroStats: [
      { value: '3.2x', unit: 'Faster', label: 'Lead Response Time' },
      { value: '45%', unit: 'Increase', label: 'Lead-to-Tour Conversion' },
      { value: '28%', unit: 'Reduction', label: 'Sales Cycle Length' },
      { value: 'RO 1.8M', unit: 'Acceleration', label: 'Annual Revenue' },
    ],
    diagnosisIntro: 'Stay Development creates luxury villas and sustainable living communities across Al Khoud, Madinat Sultan Qaboos, and Qurm. Current manual CRM and follow-up processes cause 40-60% lead leakage during 3-6 month decision cycles.',
    leaks: [
      { type: 'LEAK', title: 'Slow Lead Response & Inquiry Abandonment', description: '78% of buyers work with first agent who responds. Average 8-12 hour response time causes 45% inquiry abandonment. RO 2.4M in lost sales annually. No AI chatbot providing instant responses 24/7 with property recommendations.', impact: 'RO 2.4M Lost Sales' },
      { type: 'RISK', title: 'Poor Property-Buyer Matching & Generic Pitches', description: 'Sales team manually guesses which units match buyer preferences. Mismatched property tours waste time and reduce conversion by 30%. Lost opportunity cost: RO 1.6M. No ML system analyzing buyer profiles to recommend optimal units.', impact: 'RO 1.6M Opportunity Cost' },
      { type: 'GAP', title: 'Lead Nurturing Gaps & Follow-Up Inconsistency', description: 'High-intent prospects fall through cracks during 3-6 month consideration period. Only 30% of leads receive consistent follow-up. RO 3.2M pipeline leakage. No AI predicting when prospects are ready to buy.', impact: 'RO 3.2M Pipeline Leakage' },
    ],
    solutionIntro: 'WOS deploys Real Estate Sales AI Platform combining 24/7 conversational lead qualification, ML-powered property matching, and predictive lead nurturing—built for luxury residential developers in Oman.',
    phases: [
      { phaseNum: 1, title: '24/7 AI Lead Qualification & Conversational Engagement', description: 'Deploy conversational AI across website, WhatsApp, Instagram, Facebook providing instant responses to villa and townhouse inquiries. AI collects budget, timeline, family size, location preference, financing status.', timeline: '4-8 weeks', intervention: 'WhatsApp & Web 2.4/7 Buyer Chatbot', futureState: '3.2x faster response time, 45% increase in lead-to-tour conversion.' },
      { phaseNum: 2, title: 'ML Property Matching & Dynamic Pitch Deck Generation', description: 'ML matching engine analyzes buyer profile against available inventory across Stay projects. Automatically selects optimal units, generates personalized interactive pitch deck with floor plans, 3D views, payment schedules.', timeline: '8-14 weeks', intervention: 'Floorplan Matching & Dynamic Pitch Generator', futureState: '30% increase in tour-to-offer conversion rate.' },
      { phaseNum: 3, title: 'Predictive Lead Nurturing & Buying Intent Intelligence', description: 'AI nurture engine tracks buyer engagement (email opens, floorplan views, virtual tours) and scores buying intent in real-time. Sends personalized updates when price adjustments, payment plan offers, or construction milestones occur.', timeline: '14-24 weeks', intervention: 'Intent Scoring & Automated Buyer Nurture AI', futureState: '28% reduction in sales cycle length, RO 1.8M accelerated revenue.' },
    ],
    whatsappMessage: `Assalamu Alaikum Mohammed,\n\nI hope you're well. Following up on Stay Development's luxury residential projects, I've prepared a tailored AI Transformation Proposal focused on lead qualification, property matching, and buyer intent prediction.\n\nKey opportunity: 3.2x faster lead response, 45% increase in lead-to-tour conversion, and RO 1.8M in accelerated annual sales revenue.\n\nI've attached the full proposal for your review. Would you be open to a 30-minute meeting this week to discuss?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Mohammed Al Balushi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Arak Medical Clinics': {
    industry: 'Healthcare',
    tagline: 'AI Patient Engagement & Clinical Intelligence for Arak Clinics',
    subtitle: 'Reduce No-Shows, Automate Operations, Enhance Patient Experience',
    heroStats: [
      { value: '50%', unit: 'Reduction', label: 'Appointment No-Shows' },
      { value: '75%', unit: 'Decrease', label: 'Phone Call Volume' },
      { value: '24/7', unit: 'Automated', label: 'Patient Scheduling' },
      { value: 'RO 380K', unit: 'Recovery', label: 'Annual Revenue' },
    ],
    diagnosisIntro: 'Arak Medical Clinics operates multi-specialty facilities (dermatology, aesthetics, laser, dentistry) across Al Azaiba, Al Khoud, and Bousher with extended hours (7 AM - 10 PM). Managing appointment scheduling, patient reminders, follow-up care, and front-desk operations for 3 locations creates administrative burden consuming 40% of staff time and causing 25-30% no-show rates worth RO 450K annually in lost revenue.',
    leaks: [
      { type: 'LEAK', title: 'High Appointment No-Show Rate & Cancellations', description: '25-30% no-show rate across dermatology and dental services wastes physician capacity worth RO 450K annually. Cannot backfill slots with short notice. Manual SMS reminders sent day-before only.', impact: 'RO 450K Lost Capacity' },
      { type: 'RISK', title: 'Phone-Dependent Booking Creating Staff Bottlenecks', description: 'Patients must call during business hours to schedule. 40% of calls go to voicemail during peak times. Staff spend 35% of time on booking/rescheduling instead of patient care.', impact: '40% Call Loss Rate' },
      { type: 'GAP', title: 'Inconsistent Post-Treatment Follow-Up & Retention', description: 'Manual follow-up for dermatology treatments, dental procedures, and aesthetic services reaches only 30% of patients. Lost repeat revenue worth RO 285K annually. No automated care protocol reminders.', impact: 'RO 285K Lost Retention' },
    ],
    solutionIntro: 'WOS deploys Healthcare AI Engagement Platform combining automated appointment management, multi-channel patient communication, and intelligent follow-up orchestration—HIPAA-compliant and optimized for multi-specialty ambulatory clinics.',
    phases: [
      { phaseNum: 1, title: 'AI Appointment Scheduling & Automated Reminders', description: 'Deploy conversational AI on website, WhatsApp Business, and Facebook Messenger enabling 24/7 self-service appointment booking. Automated confirmation via patient preferred channel. Intelligent reminder system sends 1-week, 24-hr, and 2-hr reminders.', timeline: '4-8 weeks', intervention: '24/7 Patient WhatsApp Booking AI', futureState: '50% reduction in no-shows, RO 380K revenue recovery.' },
      { phaseNum: 2, title: 'Patient Communication AI & Multi-Channel Engagement', description: 'Implement AI system managing all patient communications: appointment confirmations, pre-visit instructions (fasting, medication holds), post-visit care protocols, and FAQ answering.', timeline: '8-14 weeks', intervention: 'Clinical FAQ & Pre-Visit Protocol Bot', futureState: '75% decrease in phone call volume, 40% satisfaction boost.' },
      { phaseNum: 3, title: 'Predictive Follow-Up & Patient Retention Intelligence', description: 'Deploy AI nurture engine automatically scheduling follow-up communications based on treatment protocols and patient behavior (skincare routine reminders, dental cleaning alerts, aesthetic check-ins).', timeline: '14-24 weeks', intervention: 'Protocol-Driven Care & Rebooking Engine', futureState: '45% increase in repeat visit rate, RO 285K retention revenue.' },
    ],
    whatsappMessage: `Assalamu Alaikum Yasser,\n\nI hope you're well. I've put together a tailored AI Transformation Proposal for Arak Medical Clinics focused on patient engagement and automated appointment scheduling across your 3 clinic locations.\n\nKey impact: 50% reduction in appointment no-shows, 75% decrease in front-desk call volume, and RO 380K in annual revenue recovery.\n\nI've attached the full proposal. Would love to schedule a brief 30-minute discovery call this week?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Yasser Abd Elkader Ali',
    proposalValidUntil: 'August 19, 2026',
  },

  'National Finance': {
    industry: 'Finance/Microfinance',
    tagline: 'AI Credit Scoring & Loan Origination Intelligence for National Finance',
    subtitle: 'Faster Loan Decisions, Lower Default Rates, Expanded Financial Inclusion',
    heroStats: [
      { value: '77%', unit: 'Faster', label: 'Loan Processing Time' },
      { value: '35%', unit: 'Reduction', label: 'Credit Default Risk' },
      { value: '4.2x', unit: 'Increase', label: 'Daily Loan Volume' },
      { value: 'RO 4.5M', unit: 'Growth', label: 'Portfolio Expansion' },
    ],
    diagnosisIntro: 'National Finance is Oman\'s leading finance company providing auto loans, personal finance, SME equipment financing, and microfinance across 20+ branches. Manual underwriting creates processing bottlenecks of 3-7 days per application.',
    leaks: [
      { type: 'LEAK', title: 'Slow Loan Processing & Applicant Abandonment', description: 'Manual document verification and credit scoring takes 3-7 days per application. 35% of approved applicants walk away to faster competitors. Lost loan volume: RO 6.2M annually.', impact: 'RO 6.2M Abandonment Loss' },
      { type: 'RISK', title: 'Inconsistent Risk Assessment & Default Exposure', description: 'Subjective underwriter decisions lead to inconsistent risk scoring. Non-performing loans (NPL) account for 4.2% of portfolio worth RO 8.5M. Traditional credit scoring misses alternative data points.', impact: 'RO 8.5M NPL Exposure' },
      { type: 'GAP', title: 'Manual Document Verification & Fraud Vulnerability', description: 'Loan officers spend 45% of time manually checking salary certificates, bank statements, commercial registrations. Human verification misses fraudulent documents, causing RO 1.4M annual fraud loss.', impact: '45% Officer Time Wasted' },
    ],
    solutionIntro: 'WOS deploys Financial AI Origination Engine combining automated document extraction, alternative data credit scoring, and predictive risk modeling—specifically designed for GCC financial institutions under CBO regulatory framework.',
    phases: [
      { phaseNum: 1, title: 'AI Document Intelligence & Instant Verification', description: 'Deploy computer vision OCR and NLP extracting data from Omani IDs, salary certificates, bank statements (30+ banks), and commercial registrations with 99.2% accuracy. Auto-verifies information against official databases.', timeline: '4-8 weeks', intervention: 'Oman Bank Statement & Document OCR AI', futureState: '90% reduction in verification time, zero human error.' },
      { phaseNum: 2, title: 'Alternative Credit Scoring & Machine Learning Risk Engine', description: 'Implement ML scoring models evaluating 150+ variables: traditional credit bureau data, bank statement transaction patterns, utility payment history, company performance metrics. Generates risk scores and interest rate recommendations.', timeline: '8-14 weeks', intervention: '150-Variable Alternative Credit Risk ML', futureState: '35% reduction in default rates, 77% faster loan decisions.' },
      { phaseNum: 3, title: 'Automated Loan Decisioning & Digital Disbursal Workflow', description: 'Build end-to-end automated loan origination system: 70% of low-risk applications auto-approved in under 15 minutes without human intervention. High-risk applications routed to senior underwriters with AI risk summaries.', timeline: '14-24 weeks', intervention: 'Instant Underwriting & Disbursal Engine', futureState: '4.2x increase in daily processing capacity, RO 4.5M portfolio growth.' },
    ],
    whatsappMessage: `Assalamu Alaikum Tariq,\n\nI hope you're doing well. I've prepared a comprehensive AI Transformation Proposal for National Finance focusing on automated credit scoring and instant loan origination.\n\nKey opportunity: 77% faster loan decisioning, 35% reduction in default risk, and 4.2x increase in daily loan processing capacity.\n\nI've attached the proposal for your review. Are you available for a brief meeting this week to discuss the findings?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Tariq Al Zadjali',
    proposalValidUntil: 'August 19, 2026',
  },

  'Mwasalat': {
    industry: 'Public Transportation',
    tagline: 'AI Fleet Operations & Predictive Transit Intelligence for Mwasalat',
    subtitle: 'Optimize Routes, Reduce Fuel Costs, Elevate Passenger Satisfaction',
    heroStats: [
      { value: '18-25%', unit: 'Reduction', label: 'Fuel & Operating Costs' },
      { value: '62%', unit: 'Improvement', label: 'On-Time Schedule Adherence' },
      { value: '40%', unit: 'Decrease', label: 'Unplanned Fleet Downtime' },
      { value: 'RO 2.2M', unit: 'Savings', label: 'Annual Cost Savings' },
    ],
    diagnosisIntro: 'Mwasalat (Oman National Transport Company) operates city buses, intercity routes, ferrying services, and taxi operations across Muscat, Salalah, Sohar, and regional hubs. Managing 500+ buses and vehicles creates operational complexity costing RO 12M+ annually in fuel and maintenance.',
    leaks: [
      { type: 'LEAK', title: 'Static Route Scheduling & Fuel Inefficiencies', description: 'Fixed bus schedules cannot adapt to real-time traffic conditions, passenger demand spikes, or weather disruptions. Buses run 30% empty during off-peak hours while peak routes experience severe crowding. Excess fuel cost: RO 1.4M annually.', impact: 'RO 1.4M Excess Fuel' },
      { type: 'RISK', title: 'Unplanned Vehicle Breakdown & Service Interruption', description: 'Bus breakdowns disrupt routes and inconvenience 15,000+ daily passengers. Reactive maintenance costs 45% more than predictive maintenance. Emergency repairs cost RO 950K annually.', impact: '15,000 Passengers Impacted' },
      { type: 'GAP', title: 'Passenger Demand Blindness & Capacity Allocation Gaps', description: 'No real-time passenger counting system. Route planners rely on historical farebox data that is 30-60 days old. Cannot optimize fleet allocation based on live demand patterns.', impact: '30-60 Day Data Lag' },
    ],
    solutionIntro: 'WOS deploys Smart Transit AI Platform combining dynamic route optimization, IoT predictive maintenance, and real-time passenger demand forecasting—purpose-built for public transit authorities in GCC region.',
    phases: [
      { phaseNum: 1, title: 'AI Dynamic Route Optimization & Dispatch Intelligence', description: 'Deploy reinforcement learning route optimization system analyzing real-time GPS traffic, weather data, historical demand, and road construction across Muscat and intercity networks. Dynamically adjusts schedules and dispatches backup buses.', timeline: '4-8 weeks', intervention: 'Real-Time Traffic & Demand AI Dispatcher', futureState: '62% improvement in on-time arrival, 18-25% fuel savings.' },
      { phaseNum: 2, title: 'IoT Predictive Fleet Maintenance & Telematics AI', description: 'Install IoT sensor modules across 500+ Mwasalat buses monitoring engine parameters, transmission health, brake wear, tire pressure, driver behavior (hard braking, idling). Predicts mechanical failures 7-10 days in advance.', timeline: '8-14 weeks', intervention: 'Bus Fleet IoT Telematics & Predictive CMMS', futureState: '40% reduction in vehicle breakdowns, RO 950K maintenance savings.' },
      { phaseNum: 3, title: 'Passenger Demand Analytics & Smart Mobility Platform', description: 'Deploy AI passenger counting system using existing security cameras and mobile app location signals. ML models forecast passenger demand by route, stop, time-of-day, and day-of-week with 94% accuracy.', timeline: '14-24 weeks', intervention: 'Camera Passenger Counter & Demand Forecaster', futureState: 'Optimal fleet utilization, 35% increase in passenger satisfaction.' },
    ],
    whatsappMessage: `Assalamu Alaikum Badar,\n\nI hope you're well. I've prepared a comprehensive AI Transformation Proposal for Mwasalat focusing on dynamic fleet route optimization and predictive vehicle maintenance.\n\nKey impact: 18-25% fuel cost reduction, 62% improvement in on-time schedule adherence, and RO 2.2M in annual cost savings across your bus operations.\n\nI've attached the proposal for your review. Would a 30-minute call this week be convenient to discuss?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Badar Al Nadabi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Premium Motors Volkswagen Oman': {
    industry: 'Automotive',
    tagline: 'AI Sales Intelligence & Service Retention for Premium Motors VW',
    subtitle: 'Convert More Showroom Leads, Automate Service Reminders, Maximize Lifetime Value',
    heroStats: [
      { value: '45%', unit: 'Increase', label: 'Showroom Lead Conversion' },
      { value: '32%', unit: 'Growth', label: 'After-Sales Retention' },
      { value: '4.5x', unit: 'Faster', label: 'Lead Response Velocity' },
      { value: 'RO 680K', unit: 'Potential', label: 'Annual Revenue Increase' },
    ],
    diagnosisIntro: 'Premium Motors is the official importer of Volkswagen in Oman, operating flagship showroom and service centers in Wattayah and Salalah. Managing test drive inquiries, vehicle sales, service scheduling, and customer retention creates communication gaps costing 30-40% in lost sales opportunities.',
    leaks: [
      { type: 'LEAK', title: 'Slow Digital Lead Response & Showroom Drop-off', description: 'Test drive inquiries from website, Instagram, WhatsApp sit unanswered for 6-18 hours. 50% of prospective car buyers purchase from competing brands who respond faster. Lost vehicle sales: RO 1.2M annually.', impact: 'RO 1.2M Lost Sales' },
      { type: 'RISK', title: 'Service Retention Decline Post-Warranty', description: '40% of Volkswagen owners stop servicing at dealership after 3-year warranty expires, switching to independent garages. Lost service and parts revenue: RO 850K annually. No AI system predicting service needs based on vehicle mileage.', impact: 'RO 850K Service Churn' },
      { type: 'GAP', title: 'Manual Trade-in Valuation & Finance Approval Bottlenecks', description: 'Evaluating trade-in vehicles and obtaining bank finance approvals takes 2-4 days. Buyers lose momentum and cancel orders. Trade-in valuation inconsistency creates margin loss of 5-8% per vehicle.', impact: '2-4 Day Approval Lag' },
    ],
    solutionIntro: 'WOS deploys Automotive AI Sales & Service Platform combining 24/7 digital showroom assistant, predictive service retention engine, and instant trade-in valuation AI—tailored for luxury car dealerships in Oman.',
    phases: [
      { phaseNum: 1, title: '24/7 Digital Showroom AI Assistant & Test Drive Booking', description: 'Deploy conversational AI across VW website, WhatsApp, Instagram providing instant responses to model specs, pricing, stock availability, financing options. AI schedules test drives directly into sales reps calendars with automated WhatsApp confirmations.', timeline: '4-8 weeks', intervention: '24/7 Digital Showroom Assistant', futureState: '4.5x faster lead response, 45% increase in showroom conversion.' },
      { phaseNum: 2, title: 'Predictive Service Retention & Automated Maintenance AI', description: 'AI engine analyzing vehicle service history, mileage accumulation rates, and driving patterns. Automatically sends personalized maintenance reminders, service package offers, and appointment booking links via WhatsApp 14 days before service is due.', timeline: '8-14 weeks', intervention: 'Predictive Mileage & Service AI Nurture', futureState: '32% growth in after-sales retention, RO 520K parts revenue.' },
      { phaseNum: 3, title: 'AI Trade-in Valuation & Finance Instant Approvals', description: 'Implement computer vision vehicle inspection AI assessing vehicle condition from smartphone photos. ML valuation engine calculates precise market value based on historical sales data. Automated integration with Omani banks for instant finance pre-approval.', timeline: '14-24 weeks', intervention: 'Instant Photo Valuation & Bank Pre-Approval AI', futureState: 'Same-day vehicle sales closing, 20% increase in trade-in volume.' },
    ],
    whatsappMessage: `Assalamu Alaikum Christian,\n\nI hope you're doing well. I've prepared a comprehensive AI Transformation Proposal for Premium Motors Volkswagen Oman focusing on digital showroom lead conversion and predictive service retention.\n\nKey impact: 45% increase in showroom lead conversion, 32% growth in after-sales service retention, and RO 680K in annual revenue expansion.\n\nI've attached the full proposal for your review. Would you be open to a 30-minute discovery call this week?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Christian Nehme',
    proposalValidUntil: 'August 19, 2026',
  },

  'Kenz Hypermarket': {
    industry: 'Retail/Hypermarket',
    tagline: 'AI Retail Merchandising & Loyalty Intelligence for Kenz Hypermarket',
    subtitle: 'Optimize Shelf Placement, Personalize Promotions, Reduce Food Waste',
    heroStats: [
      { value: '42%', unit: 'Reduction', label: 'Fresh Food Spoilage' },
      { value: '28%', unit: 'Increase', label: 'Basket Size Value' },
      { value: '65%', unit: 'Improvement', label: 'Loyalty Program Active Rate' },
      { value: 'RO 580K', unit: 'Gain', label: 'Annual Net Margin' },
    ],
    diagnosisIntro: 'Kenz Hypermarket operates large-format retail stores in Oman featuring fresh food, groceries, electronics, apparel, and household items. Managing 30,000+ SKUs across multiple departments creates merchandising and inventory challenges costing 3-5% of turnover in spoilage and markdown losses.',
    leaks: [
      { type: 'LEAK', title: 'Fresh Food Spoilage & Expiry Markdown Losses', description: 'Manual monitoring of perishable food (produce, dairy, bakery, meat) leads to 4-6% spoilage rate worth RO 720K annually. Markdown timing is reactive, selling near-expiry items at 70% discount instead of optimal 30% early markdown.', impact: 'RO 720K Spoilage Scrap' },
      { type: 'RISK', title: 'Suboptimal Shelf Merchandising & Missing High-Margin Items', description: 'Store managers place products intuitively rather than based on basket analysis. High-margin impulse items placed in low-traffic aisles reduce basket value by 15-20%. Out-of-stock on top 500 SKUs costs RO 480K annually.', impact: '15-20% Basket Penalty' },
      { type: 'GAP', title: 'Generic Mass Promotions & Low Loyalty Engagement', description: 'SMS promotions broadcast identical offers to all 50,000 loyalty members. 92% of members ignore generic messages. Lost opportunity to personalize offers based on individual purchase history.', impact: '92% Offer Ignore Rate' },
    ],
    solutionIntro: 'WOS deploys Hypermarket AI Merchandising & Loyalty Platform combining automated dynamic markdown pricing, computer vision shelf monitoring, and hyper-personalized WhatsApp loyalty marketing—designed for high-volume retail chains.',
    phases: [
      { phaseNum: 1, title: 'AI Dynamic Markdown & Food Waste Reduction Engine', description: 'Deploy ML dynamic pricing algorithms analyzing inventory batch dates, sales velocity, historical elasticity, and weather. Automatically calculates optimal daily markdown schedules for fresh food departments.', timeline: '4-8 weeks', intervention: 'Dynamic Perishable Pricing & Markdown AI', futureState: '42% reduction in food spoilage, RO 420K saved margin.' },
      { phaseNum: 2, title: 'Computer Vision Shelf Merchandising & Out-of-Stock AI', description: 'Install ceiling camera computer vision monitoring key aisle shelves every 15 minutes. Automatically alerts floor staff when top-selling SKUs are empty or incorrectly placed.', timeline: '8-14 weeks', intervention: 'Ceiling Camera Shelf Scanner & Restock Alert', futureState: '90% elimination of out-of-stock events on top SKUs, 12% revenue lift.' },
      { phaseNum: 3, title: 'Hyper-Personalized WhatsApp Loyalty Marketing Platform', description: 'Implement AI loyalty engine analyzing individual purchase history (items bought, shopping days, category preferences). Sends personalized WhatsApp offers to 50,000 members (e.g. favorite brand discounts, recipe bundle offers).', timeline: '14-24 weeks', intervention: 'Personalized WhatsApp Basket Offer AI', futureState: '65% active loyalty engagement, 28% increase in average basket size.' },
    ],
    whatsappMessage: `Assalamu Alaikum Shiraz,\n\nI hope you're well. I've prepared a comprehensive AI Transformation Proposal for Kenz Hypermarket focusing on fresh food waste reduction, dynamic markdown pricing, and personalized WhatsApp loyalty marketing.\n\nKey impact: 42% reduction in food spoilage, 28% increase in average basket size, and RO 580K in annual net margin expansion.\n\nI've attached the full proposal for your review. Would you be available for a brief call this week to walk through the strategy?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
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
      // Find company
      const { data: company } = await supabase
        .from('companies')
        .select('*, contacts(*)')
        .ilike('company_name', `%${rawName.replace(/\+/g, '')}%`)
        .maybeSingle()

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
        preparedDate: 'July 2026',
        
        aboutTadbeerContext: `Based on the operational complexity across ${company.company_name}'s environment, Tadbeer's capabilities in process engineering, AI automation, and system integration offer a deterministic path to operational excellence.`,
        
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
