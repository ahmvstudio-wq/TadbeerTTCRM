import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Proposal data for each company (from public/proposal details in md/) ──────
const PROPOSALS: Record<string, {
  tagline: string
  subtitle: string
  heroStats: { value: string; unit: string; label: string }[]
  diagnosisIntro: string
  leaks: { type: 'LEAK' | 'RISK' | 'GAP'; title: string; description: string }[]
  solutionIntro: string
  phases: { phaseNum: number; title: string; description: string; timeline?: string }[]
  whatsappMessage: string
  contactName: string
  proposalValidUntil: string
}> = {
  'Oman Flour Mills SAOG': {
    tagline: 'AI-Powered Manufacturing Excellence',
    subtitle: 'Transforming Production Quality & Operational Efficiency Through Predictive Intelligence',
    heroStats: [
      { value: '60-75%', unit: 'Reduction', label: 'Unplanned Downtime' },
      { value: '81%', unit: 'Improvement', label: 'Defect Detection' },
      { value: '38%', unit: 'Increase', label: 'Production Volume' },
      { value: '$4.5M', unit: 'Potential', label: 'Annual Savings' },
    ],
    diagnosisIntro: 'Oman Flour Mills operates at 800 MT/day flour capacity and 1500 MT/day animal feed capacity. With 1,100+ employees and RO 68M+ turnover, reactive maintenance and manual quality checks create margin leakage estimated at 8-12% of production value annually.',
    leaks: [
      { type: 'LEAK', title: 'Quality Defects Detected at End-of-Line', description: 'Entire batch rejections result in 2-5% product scrap worth RO 1.2M+ annually. Late detection wastes raw materials, production time, and creates delivery delays. No predictive quality system analyzing production parameters in real-time.' },
      { type: 'RISK', title: 'Unplanned Equipment Downtime', description: 'Milling machinery failures cause 15-25% unplanned downtime worth RO 2.8M in lost production. Disrupts Dahabi and Barakat delivery schedules. Reactive maintenance strategy lacks predictive analytics on equipment health.' },
      { type: 'GAP', title: 'Inconsistent Production Parameters', description: 'Manual parameter adjustments cause batch-to-batch variations affecting brand consistency. Energy waste from non-optimized settings adds RO 450K annually. No AI optimization adjusting temperature, pressure, mixing ratios based on real-time ingredient quality.' },
    ],
    solutionIntro: 'WOS deploys an integrated AI Manufacturing Intelligence Platform combining computer vision quality prediction, IoT-powered predictive maintenance, and self-optimizing production control—specifically calibrated for food processing environments with GMP compliance.',
    phases: [
      { phaseNum: 1, title: 'AI Quality Prediction & Real-Time Intervention', description: 'Deploy computer vision cameras and IoT sensors monitoring flour particle size, moisture content, temperature profiles, and packaging integrity. ML models predict quality defects up to 60 minutes before batch completion with 95% accuracy. Expected outcome: 60% reduction in batch rejections, 81% improvement in defect detection, RO 1.2M annual savings.', timeline: '4-8 weeks' },
      { phaseNum: 2, title: 'Predictive Maintenance Intelligence System', description: 'Install wireless IoT sensor network on 45+ critical assets. AI analyzes vibration signatures, temperature anomalies, current draw patterns to predict failures 7-14 days in advance. Automated work orders with CMMS integration. Expected outcome: 70% reduction in unplanned downtime, RO 2.8M annual savings.', timeline: '8-14 weeks' },
      { phaseNum: 3, title: 'Self-Optimizing Production Control AI', description: 'Implement reinforcement learning system continuously adjusting production parameters for maximum yield, minimum waste, and optimal energy consumption. Genetic algorithms optimize production scheduling across flour and feed lines. Expected outcome: 12% OEE improvement, 8% energy savings, 38% increase in production capacity utilization.', timeline: '14-24 weeks' },
    ],
    whatsappMessage: `Assalamu Alaikum Adil,\n\nI hope you're doing well. I've been looking into Oman Flour Mills SAOG's production operations and wanted to share a few specific observations around quality control and equipment maintenance that I think could be highly relevant given your scale (800 MT/day capacity).\n\nWe've prepared a tailored AI Transformation Proposal for Oman Flour Mills that addresses 3 critical operational leaks we identified — with a combined savings potential of $4.5M annually.\n\nI'm attaching the proposal for your review. Would you be open to a 30-minute discovery conversation this week?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Adil Nasser Al-Sabqi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Muna Noor International LLC': {
    tagline: 'AI-Driven Construction Intelligence',
    subtitle: 'Eliminate Project Delays & Resource Waste Through Predictive Scheduling',
    heroStats: [
      { value: '20-30%', unit: 'Reduction', label: 'Project Delays' },
      { value: '35%', unit: 'Improvement', label: 'Resource Utilization' },
      { value: '58%', unit: 'Gain', label: 'Planning Efficiency' },
      { value: '$3.2M', unit: 'Savings', label: 'Annual Cost Savings' },
    ],
    diagnosisIntro: 'Muna Noor operates across construction, pipe manufacturing (40,000 MT capacity), engineering, and environmental solutions with projects spanning Muscat, Sohar, Nizwa, and Salalah. Managing concurrent projects, equipment deployment, and material logistics creates coordination gaps worth 15-20% of project value.',
    leaks: [
      { type: 'LEAK', title: 'Project Schedule Slippage & Penalty Exposure', description: '15-30% of projects exceed contracted timelines due to resource conflicts, dependency miscalculations, and weather disruptions. Penalties and reputation damage worth RO 1.8M annually. Manual scheduling cannot model complex dependencies across 20+ concurrent projects.' },
      { type: 'RISK', title: 'Equipment & Labor Underutilization', description: 'Excavators, cranes, welding equipment, and specialized crews idle 25-35% of available hours waiting for materials, predecessor tasks, or permits. RO 2.4M in wasted capacity. No visibility into real-time equipment location and utilization across sites.' },
      { type: 'GAP', title: 'Manual Progress Tracking & Compliance Documentation', description: 'Site supervisors spend 30% of time on manual inspection reports and quality checklists. Incomplete records create payment disputes worth 5-10% of project value. No computer vision system auto-tracking progress against BIM models.' },
    ],
    solutionIntro: 'WOS deploys Construction AI Platform integrating predictive scheduling algorithms, real-time resource optimization, and automated progress monitoring—purpose-built for multi-site engineering and construction operations across Oman.',
    phases: [
      { phaseNum: 1, title: 'AI Schedule Optimization & Risk Prediction', description: 'Deploy constraint-based optimization engine analyzing project dependencies, resource constraints, and historical task duration data from 50+ years of Muna Noor projects. Monte Carlo simulation identifies schedule risks. Expected outcome: 25% reduction in schedule overruns, 20% faster project delivery, RO 1.8M penalty avoidance.', timeline: '4-8 weeks' },
      { phaseNum: 2, title: 'Dynamic Resource Allocation Intelligence', description: 'AI system continuously optimizing equipment, materials, and workforce allocation across Muscat, Sohar, Nizwa, and Salalah sites. GPS tracking integrated with resource allocation AI. Expected outcome: 35% improvement in resource utilization, 40% reduction in equipment idle time, RO 2.4M capacity recovery.', timeline: '8-14 weeks' },
      { phaseNum: 3, title: 'Computer Vision Progress Monitoring & Auto-Documentation', description: 'Drone-based and mobile camera computer vision automatically tracks construction progress against BIM models. AI detects completed work percentages, identifies quality deviations, flags safety hazards. Expected outcome: 70% reduction in documentation time, 99% audit-ready compliance records.', timeline: '14-24 weeks' },
    ],
    whatsappMessage: `Assalamu Alaikum Athar,\n\nThank you for your time earlier. I wanted to follow up with the tailored AI Transformation Proposal for Muna Noor International LLC that I mentioned.\n\nWe've identified 3 critical operational challenges in project scheduling and resource coordination across your multi-site operations — with a combined $3.2M annual cost savings opportunity.\n\nI've attached the full proposal for your review. Would a brief 30-minute call this week work to walk through the key findings?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Athar Qureshi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Al Jassar Group LLC': {
    tagline: 'AI Supply Chain & Demand Intelligence',
    subtitle: 'Optimize Inventory, Forecast Demand, Unlock Working Capital',
    heroStats: [
      { value: '77%', unit: 'Reduction', label: 'Stock-Out Events' },
      { value: '38%', unit: 'Improvement', label: 'Inventory Turnover' },
      { value: '31%', unit: 'Increase', label: 'Operating Profit' },
      { value: 'RO 2.8M', unit: 'Release', label: 'Working Capital' },
    ],
    diagnosisIntro: 'Al Jassar Group operates diversified trading across HVAC, MEP, construction materials, telecom, and specialty products with 1000+ SKUs and suppliers across 15+ countries. Managing inventory levels creates cash flow pressure estimated at RO 4-6M tied in excess stock.',
    leaks: [
      { type: 'LEAK', title: 'Inventory Imbalances: Overstock & Chronic Stockouts', description: '20-30% of SKUs overstocked (RO 4.2M tied capital earning zero return) while 15% stock out losing RO 1.8M in sales. Manual Excel-based demand forecasting cannot analyze seasonal patterns, construction project pipeline, government budget cycles.' },
      { type: 'RISK', title: 'Suboptimal Purchase Timing & Supplier Selection', description: 'Reactive ordering misses bulk discounts worth 3-5%, unfavorable currency exchange timing adds 2%, and expedited freight erodes 4% margin. Total RO 2.1M annual leakage. No AI system optimizing purchase timing.' },
      { type: 'GAP', title: 'Missed Cross-Sell & Customer Insight Blindness', description: 'Cannot predict which contractors will need complementary products for their active projects. Lost upsell opportunities worth 10-15% of revenue (RO 3.5M). Customer purchase history sits in separate systems.' },
    ],
    solutionIntro: 'WOS implements AI Supply Chain Intelligence Platform combining time-series demand forecasting, multi-objective inventory optimization, and customer behavior analytics—calibrated for multi-category B2B trading operations in GCC construction sector.',
    phases: [
      { phaseNum: 1, title: 'AI Demand Forecasting & Market Intelligence', description: 'Deploy GRU neural networks analyzing 25+ years of sales history, construction project tender data, government infrastructure announcements, and seasonal patterns. Expected outcome: 29% improvement in forecast accuracy, 77% reduction in stockouts, RO 1.8M recovered lost sales.', timeline: '4-8 weeks' },
      { phaseNum: 2, title: 'Inventory & Purchase Optimization Engine', description: 'Multi-objective optimization AI calculating optimal reorder points and timing for 1000+ SKUs. Automated purchase recommendations rank suppliers by total landed cost. Expected outcome: 38% inventory turnover improvement, RO 2.8M working capital release, 20% reduction in expedited freight costs.', timeline: '8-14 weeks' },
      { phaseNum: 3, title: 'Customer Intelligence & Proactive Upsell System', description: 'Customer behavior AI segmenting contractors by project types, purchase frequency, and lifetime value. Automated alert system notifies account managers when high-value customers are due for reorders. Expected outcome: 15% increase in cross-sell revenue (RO 3.5M), 25% improvement in customer retention.', timeline: '14-24 weeks' },
    ],
    whatsappMessage: `Assalamu Alaikum Suresh,\n\nI hope you're well. As discussed, I've prepared a tailored AI Transformation Proposal for Al Jassar Group LLC focused on supply chain intelligence and demand forecasting across your 1000+ SKU portfolio.\n\nKey opportunity: RO 2.8M in working capital release and 77% reduction in stock-out events through AI-driven inventory optimization.\n\nI've attached the full proposal. Would be great to walk you through the key findings — are you available for a brief call this week?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Suresh Kumar',
    proposalValidUntil: 'August 19, 2026',
  },

  'Vertex+ Interior Design & Fit-Out': {
    tagline: 'AI-Powered Design Visualization & Project Intelligence',
    subtitle: 'Close More Deals, Deliver Faster, Eliminate Rework',
    heroStats: [
      { value: '40%', unit: 'Increase', label: 'Client Conversion Rate' },
      { value: '65%', unit: 'Reduction', label: 'Design Revision Cycles' },
      { value: '8-12 days', unit: 'Faster', label: 'Project Delivery' },
      { value: 'RO 450K', unit: 'Potential', label: 'Annual Revenue Growth' },
    ],
    diagnosisIntro: 'Vertex+ delivers ultra-modern interior design and fit-out for residential and commercial projects across Oman. Current manual rendering and project coordination methods limit scalability and create rework worth 15-20% of project budgets.',
    leaks: [
      { type: 'LEAK', title: 'Client Decision Delays from Poor Visualization', description: 'Clients struggle to visualize finished spaces from 2D drawings. Indecision extends sales cycles by 3-6 weeks, reducing annual project capacity by 25%. Manual 3D rendering takes 2-4 days per concept.' },
      { type: 'RISK', title: 'Design Revision Rework & Scope Creep', description: 'Mid-project design changes due to client misunderstanding original vision. Rework averages 15-20% of project labor costs and delays handover by 10-15 days. No AI generating photorealistic visualizations from sketches in minutes.' },
      { type: 'GAP', title: 'Project Coordination & Procurement Inefficiencies', description: 'Manual tracking of furniture orders, material deliveries, contractor schedules across 8-12 concurrent projects. Delays cost RO 85K annually in penalties and carrying costs. Spreadsheet-based management cannot predict delivery delays.' },
    ],
    solutionIntro: 'WOS deploys Interior Design AI Suite combining instant photorealistic rendering, client collaboration tools, and intelligent project coordination—purpose-built for high-end residential and commercial interior firms.',
    phases: [
      { phaseNum: 1, title: 'AI Visualization Engine & Client Presentation Suite', description: 'AI rendering platform transforms sketches, mood boards, and text descriptions into photorealistic interior visualizations in under 2 minutes. Generate multiple design options during initial consultation. Expected outcome: 40% increase in client conversion, 8 additional projects annually worth RO 320K revenue.', timeline: '4-8 weeks' },
      { phaseNum: 2, title: 'Smart Project Coordination & Delivery Tracking', description: 'AI project management system tracking design milestones, procurement orders, contractor schedules across all active projects. ML models predict task completion and flag risks 7-14 days in advance. Expected outcome: 30% improvement in on-time delivery, capacity to handle 25% more concurrent projects.', timeline: '8-14 weeks' },
      { phaseNum: 3, title: 'Client Collaboration Portal & Change Management AI', description: 'Cloud-based client portal where clients view visualizations, approve designs, and track progress in real-time. Change request impact analysis shows cost and timeline implications before approval. Expected outcome: 65% reduction in design revision cycles, 90% elimination of scope creep disputes.', timeline: '14-24 weeks' },
    ],
    whatsappMessage: `Assalamu Alaikum Abdullatif,\n\nI hope you're doing well. I've put together a tailored AI Transformation Proposal for Vertex+ Interior Design & Fit-Out that I believe will be highly relevant to your client acquisition and project delivery operations.\n\nKey focus: AI visualization tools that convert client consultations into closed deals 40% faster, and intelligent project coordination to eliminate the rework costing 15-20% of project budgets.\n\nI've attached the full proposal. Would love to get your thoughts — are you free for a brief call this week?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Abdullatif Moughrabi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Stay Development': {
    tagline: 'AI-Powered Property Matching & Lead Intelligence',
    subtitle: 'Convert More Leads, Accelerate Sales Cycles, Maximize Unit Values',
    heroStats: [
      { value: '3.2x', unit: 'Faster', label: 'Lead Response Time' },
      { value: '45%', unit: 'Increase', label: 'Lead-to-Tour Conversion' },
      { value: '28%', unit: 'Reduction', label: 'Sales Cycle Length' },
      { value: 'RO 1.8M', unit: 'Acceleration', label: 'Annual Revenue' },
    ],
    diagnosisIntro: 'Stay Development creates luxury villas and sustainable living communities across Al Khoud, Madinat Sultan Qaboos, and Qurm. Current manual CRM and follow-up processes cause 40-60% lead leakage during 3-6 month decision cycles.',
    leaks: [
      { type: 'LEAK', title: 'Slow Lead Response & Inquiry Abandonment', description: '78% of buyers work with first agent who responds. Average 8-12 hour response time causes 45% inquiry abandonment. RO 2.4M in lost sales annually. No AI chatbot providing instant responses 24/7 with property recommendations.' },
      { type: 'RISK', title: 'Poor Property-Buyer Matching & Generic Pitches', description: 'Sales team manually guesses which units match buyer preferences. Mismatched property tours waste time and reduce conversion by 30%. Lost opportunity cost: RO 1.6M. No ML system analyzing buyer profiles to recommend optimal units.' },
      { type: 'GAP', title: 'Lead Nurturing Gaps & Follow-Up Inconsistency', description: 'High-intent prospects fall through cracks during 3-6 month consideration period. Only 30% of leads receive consistent follow-up. RO 3.2M pipeline leakage. No AI predicting when prospects are ready to buy.' },
    ],
    solutionIntro: 'WOS implements Real Estate AI Platform combining instant lead engagement, intelligent property matching, and automated nurture orchestration—optimized for luxury residential developers in GCC markets.',
    phases: [
      { phaseNum: 1, title: 'AI Chatbot & Instant Lead Qualification System', description: 'Conversational AI on Stay Development website and WhatsApp providing instant responses to property inquiries 24/7. Schedules property tours directly into sales team calendars. Expected outcome: 90% of leads receive instant response, 45% improvement in inquiry-to-tour conversion, RO 1.2M recovered abandoned inquiries.', timeline: '4-8 weeks' },
      { phaseNum: 2, title: 'Intelligent Property Matching & Recommendation Engine', description: 'ML system analyzing buyer profiles and recommending optimal units with match probability scores. Dynamic pricing intelligence suggests optimal unit positioning based on inventory velocity. Expected outcome: 60% improvement in first-tour match quality, 35% increase in same-day offer rate, 28% reduction in sales cycle.', timeline: '8-14 weeks' },
      { phaseNum: 3, title: 'Predictive Lead Nurturing & Timing Optimization', description: 'AI nurture engine automatically sequences personalized follow-up based on prospect behavior signals. Predictive model identifies buying readiness and alerts sales team. Expected outcome: 70% improvement in follow-up consistency, 40% increase in pipeline conversion rate, RO 3.2M pipeline recovery.', timeline: '14-24 weeks' },
    ],
    whatsappMessage: `Assalamu Alaikum Ahmed,\n\nFollowing our conversation — I've prepared a tailored AI Transformation Proposal for Stay Development focused on converting more property inquiries into actual sales while reducing the 3-6 month decision cycle.\n\nHighlight: 45% increase in lead-to-tour conversion and RO 3.2M pipeline recovery through intelligent lead nurturing.\n\nI've attached the proposal for your review. Would you be available for a 30-minute call this week to walk through it together?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Ahmed Taha',
    proposalValidUntil: 'August 19, 2026',
  },

  'Arak Medical Clinics': {
    tagline: 'AI Patient Engagement & Clinical Intelligence',
    subtitle: 'Reduce No-Shows, Automate Operations, Enhance Patient Experience',
    heroStats: [
      { value: '50%', unit: 'Reduction', label: 'Appointment No-Shows' },
      { value: '75%', unit: 'Decrease', label: 'Phone Call Volume' },
      { value: '24/7', unit: 'Automated', label: 'Patient Scheduling' },
      { value: 'RO 380K', unit: 'Recovery', label: 'Annual Revenue' },
    ],
    diagnosisIntro: 'Arak Medical Clinics operates multi-specialty facilities (dermatology, aesthetics, laser, dentistry) across Al Azaiba, Al Khoud, and Bousher with extended hours (7 AM - 10 PM). Administrative burden consumes 40% of staff time and causes 25-30% no-show rates worth RO 450K annually.',
    leaks: [
      { type: 'LEAK', title: 'High Appointment No-Show Rate & Last-Minute Cancellations', description: '25-30% no-show rate across dermatology and dental services wastes physician capacity worth RO 450K annually. Manual SMS reminders sent day-before only. No AI system sending multi-channel reminders at optimal times based on patient behavior patterns.' },
      { type: 'RISK', title: 'Phone-Dependent Booking Creating Staff Bottlenecks', description: 'Patients must call during business hours to schedule. 40% of calls go to voicemail during peak times. Staff spend 35% of time on booking/rescheduling instead of patient care. No 24/7 AI chatbot for self-service appointment booking via website and WhatsApp.' },
      { type: 'GAP', title: 'Inconsistent Post-Treatment Follow-Up & Patient Retention', description: 'Manual follow-up for dermatology and aesthetic services reaches only 30% of patients. Lost repeat revenue worth RO 285K annually. No automated system sending post-visit care instructions and rebooking prompts based on treatment protocols.' },
    ],
    solutionIntro: 'WOS deploys Healthcare AI Engagement Platform combining automated appointment management, multi-channel patient communication, and intelligent follow-up orchestration—HIPAA-compliant and optimized for multi-specialty ambulatory clinics.',
    phases: [
      { phaseNum: 1, title: 'AI Appointment Scheduling & Automated Reminders', description: 'Conversational AI on Arak website, WhatsApp Business, and Facebook enabling 24/7 self-service appointment booking. Intelligent reminder system sends multi-channel reminders at optimal times. Expected outcome: 80% of appointments self-booked, 50% reduction in no-show rate, RO 380K revenue recovery.', timeline: '4-8 weeks' },
      { phaseNum: 2, title: 'Patient Communication AI & Multi-Channel Engagement', description: 'AI system managing all patient communications: appointment confirmations, pre-visit instructions, post-visit care protocols. Chatbot handles common FAQs reducing staff inquiry volume by 75%. Expected outcome: 90% of routine inquiries handled by AI, 40% improvement in patient satisfaction scores.', timeline: '8-14 weeks' },
      { phaseNum: 3, title: 'Predictive Follow-Up & Patient Retention Intelligence', description: 'AI nurture engine automatically schedules follow-up based on treatment protocols. Churn prediction identifies patients overdue for routine care and triggers win-back campaigns. Expected outcome: 60% improvement in follow-up consistency, 45% increase in repeat visit rate, RO 285K retention revenue.', timeline: '14-24 weeks' },
    ],
    whatsappMessage: `Assalamu Alaikum Yasser,\n\nHope you're well. I've been looking at how Arak Medical Clinics is managing patient scheduling and follow-up across your 3 locations and wanted to share some specific observations.\n\nKey insight: A 25-30% no-show rate is costing Arak RO 450K annually — something AI-powered appointment management can address directly.\n\nI've attached a tailored proposal for your review. Would you have 30 minutes this week for a quick call to walk through the implementation approach?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Yasser Abd Elkader Ali',
    proposalValidUntil: 'August 19, 2026',
  },

  'National Finance': {
    tagline: 'AI Credit Decisioning & Risk Intelligence',
    subtitle: 'Automate Approvals, Expand Access, Reduce Default Risk',
    heroStats: [
      { value: '70-80%', unit: 'Automated', label: 'Loan Decisions' },
      { value: '30%', unit: 'Increase', label: 'Approval Rates' },
      { value: '20%', unit: 'Reduction', label: 'Credit Defaults' },
      { value: 'RO 4.2M', unit: 'Savings', label: 'Annual Operational Savings' },
    ],
    diagnosisIntro: 'National Finance, established 1987, is Oman\'s leading non-banking finance company with 23+ branches. Processing 15,000+ loan applications monthly with manual underwriting creates 2-5 day decision cycles and leaves RO 8-12M in addressable lending capacity untapped.',
    leaks: [
      { type: 'LEAK', title: 'Slow Loan Decisioning & Customer Abandonment', description: 'Manual underwriting takes 2-5 days. 35% of applicants abandon process before decision. Lost loan origination worth RO 6.5M annually. Only 40% of applications auto-decisioned. No AI credit scoring analyzing alternative data for thin-file borrowers.' },
      { type: 'RISK', title: 'Conservative Approval Rates & Missed Good Borrowers', description: 'Traditional credit scoring rejects 60% of applicants including viable thin-file borrowers (young professionals, new-to-Oman expats). RO 8.2M addressable lending opportunity lost. FICO-only scoring misses creditworthy applicants without traditional credit history.' },
      { type: 'GAP', title: 'Inefficient Underwriter Utilization & Operational Costs', description: 'Underwriters spend 70% of time on routine low-risk applications that could be auto-decisioned. Labor costs RO 2.8M annually for work AI could handle. Manual processing prevents underwriters from focusing on complex SME lending.' },
    ],
    solutionIntro: 'WOS implements AI Lending Intelligence Platform combining alternative data credit scoring, automated decisioning, and explainable risk assessment—compliant with Central Bank of Oman regulations and optimized for personal and SME lending in GCC markets.',
    phases: [
      { phaseNum: 1, title: 'AI Credit Scoring & Alternative Data Integration', description: 'Deploy ensemble ML models trained on National Finance\'s 35+ years of actual loan performance data covering 200,000+ borrowers. Explainable AI (SHAP values) provides transparent reasoning meeting Central Bank audit requirements. Expected outcome: 30% higher approval rates, RO 8.2M incremental lending capacity.', timeline: '4-8 weeks' },
      { phaseNum: 2, title: 'Automated Decisioning Engine & Smart Routing', description: 'AI decisioning platform automatically approves 70-80% of applications meeting risk thresholds. Loans up to RO 15,000 retail and RO 75,000 SME fully automated. Expected outcome: 77% auto-decision rate, 90% reduction in decision time (5 days to 4 hours), RO 6.5M recovered lost applications.', timeline: '8-14 weeks' },
      { phaseNum: 3, title: 'Portfolio Risk Monitoring & Early Warning System', description: 'Continuous portfolio monitoring AI predicts default risk 60-90 days in advance. Automated payment reminder sequences via SMS and WhatsApp reduce involuntary defaults. Expected outcome: 20% reduction in default rates, 25% improvement in collection efficiency, RO 2.1M reduction in write-offs.', timeline: '14-24 weeks' },
    ],
    whatsappMessage: `Assalamu Alaikum Rakesh,\n\nThank you for connecting. I've prepared a tailored AI Transformation Proposal for National Finance focused on credit decisioning automation and alternative data credit scoring.\n\nKey opportunity: Reducing decision time from 5 days to 4 hours while unlocking RO 8.2M in additional lending capacity — without increasing credit risk.\n\nI've attached the proposal. Would you be available for a 30-minute discussion this week?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Rakesh Makkar',
    proposalValidUntil: 'August 19, 2026',
  },

  'Mwasalat': {
    tagline: 'AI Fleet Optimization & Passenger Intelligence',
    subtitle: 'Maximize Ridership, Optimize Routes, Reduce Operating Costs',
    heroStats: [
      { value: '15-20%', unit: 'Reduction', label: 'Fuel Costs' },
      { value: '35%', unit: 'Improvement', label: 'On-Time Performance' },
      { value: '28%', unit: 'Increase', label: 'Capacity Utilization' },
      { value: 'RO 3.8M', unit: 'Savings', label: 'Annual Operating Savings' },
    ],
    diagnosisIntro: 'Mwasalat operates 400+ buses across Muscat governorate routes, inter-city services, and school contracts carrying 1.1M+ passengers annually. Current static scheduling leaves 30-40% capacity underutilized while other routes overcrowded.',
    leaks: [
      { type: 'LEAK', title: 'Fuel Waste from Suboptimal Routing & Idling', description: 'Fuel represents 69% of fleet operating costs. Inefficient routes, traffic congestion, and excessive idling waste 15-20% of fuel budget (RO 4.2M annually). Static routes cannot adapt to real-time traffic conditions, road closures, weather, or events.' },
      { type: 'RISK', title: 'Unbalanced Capacity Utilization & Service Quality', description: 'Peak hour routes overcrowded (150%+ capacity) while off-peak services run 30-40% empty. Passenger complaints about overcrowding and unreliable schedules. Manual route planning cannot predict demand patterns by time, day, season, weather, and events.' },
      { type: 'GAP', title: 'Reactive Maintenance & Unplanned Vehicle Downtime', description: '15-20% of fleet unavailable due to unscheduled maintenance. Breakdowns disrupt service reliability. Maintenance costs RO 2.6M annually, 30% higher than predictive approach. No IoT sensors predicting component failures before breakdowns occur.' },
    ],
    solutionIntro: 'WOS deploys Public Transit AI Platform combining dynamic route optimization, predictive maintenance, and passenger demand forecasting—specifically calibrated for mixed-use fleets serving urban and inter-city routes in GCC conditions.',
    phases: [
      { phaseNum: 1, title: 'AI Route Optimization & Dynamic Scheduling', description: 'Real-time route optimization AI integrating GPS fleet tracking, traffic conditions, weather forecasts, and special events to dynamically adjust routes. Genetic algorithms optimize bus frequency and timing across 40+ routes. Expected outcome: 18% reduction in fuel costs (RO 3.2M savings), 35% improvement in on-time performance.', timeline: '4-8 weeks' },
      { phaseNum: 2, title: 'Passenger Demand Forecasting & Capacity Planning', description: 'AI analyzing 10+ years of ridership data, mobile ticketing patterns, seasonal trends, and academic calendars to forecast passenger demand. Dynamic capacity allocation recommends optimal bus size and frequency per route. Expected outcome: 28% improvement in capacity utilization, RO 1.8M subsidy efficiency gain.', timeline: '8-14 weeks' },
      { phaseNum: 3, title: 'Predictive Maintenance & Fleet Health Monitoring', description: 'IoT sensor network on 400+ buses monitoring engine performance, brake wear, tire pressure, and oil quality. AI predicts component failures 14-21 days in advance. Expected outcome: 60% reduction in unplanned downtime, 30% decrease in maintenance costs (RO 780K savings), 95% fleet availability rate.', timeline: '14-24 weeks' },
    ],
    whatsappMessage: `Assalamu Alaikum Sarah,\n\nHope you're having a productive day. I wanted to reach out regarding the AI Fleet Optimization Proposal I've prepared specifically for Mwasalat.\n\nWith 400+ buses and fuel representing 69% of operating costs, the opportunity to reduce costs by 15-20% (RO 3.2M) through dynamic route optimization is significant — and actionable quickly.\n\nI've attached the full proposal for your review. Would you be open to a brief 30-minute call this week?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Sarah Sultan Al Busaidi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Premium Motors Volkswagen Oman': {
    tagline: 'AI Customer Experience & Sales Intelligence',
    subtitle: 'Accelerate Sales Cycles, Maximize Lifetime Value, Predict Service Needs',
    heroStats: [
      { value: '45%', unit: 'Increase', label: 'Lead-to-Sale Conversion' },
      { value: '32%', unit: 'Growth', label: 'Service Revenue' },
      { value: '6-8 days', unit: 'Reduction', label: 'Sales Cycle' },
      { value: 'RO 2.4M', unit: 'Potential', label: 'Annual Revenue Growth' },
    ],
    diagnosisIntro: 'Premium Motors represents Volkswagen, Audi, Porsche, Bentley, and Ducati across Oman. Managing luxury car buyer journeys (typically 45-90 days), coordinating test drives, and maximizing service revenue requires sophisticated CRM. Current manual processes cause 45-60% lead leakage and miss 40% of service retention opportunities.',
    leaks: [
      { type: 'LEAK', title: 'Slow Lead Response & Generic Follow-Up', description: 'Average 6-12 hour response time for website inquiries. 55% of leads receive generic follow-up not tailored to model interest, budget, or purchase timeline. Lost sales worth RO 3.6M annually. No AI chatbot providing instant responses 24/7 with model comparisons and financing options.' },
      { type: 'RISK', title: 'Poor Lead Scoring & Sales Team Prioritization', description: 'Sales consultants cannot distinguish hot leads (ready to buy within 30 days) from researchers (6+ months out). Time wasted on low-intent prospects while high-value buyers wait. No ML model analyzing engagement signals to predict purchase probability.' },
      { type: 'GAP', title: 'Missed Service Revenue & Customer Churn', description: 'Only 60% of customers return for scheduled service after warranty expires. Service revenue per vehicle 40% below brand potential. RO 2.1M annual service revenue leakage. No predictive system analyzing vehicle age, mileage, and service history to proactively schedule appointments.' },
    ],
    solutionIntro: 'WOS deploys Automotive AI Platform combining instant lead engagement, predictive sales intelligence, and automated service retention—optimized for luxury and premium vehicle dealerships in GCC markets.',
    phases: [
      { phaseNum: 1, title: 'AI Sales Assistant & Instant Lead Engagement', description: 'Conversational AI on Premium Motors website, WhatsApp Business, and Facebook/Instagram DMs. AI handles model comparisons (Tiguan vs Touareg), financing options, trade-in estimates, test drive scheduling. Multilingual support (Arabic and English). Expected outcome: 45% improvement in inquiry-to-showroom conversion, RO 1.8M recovered abandoned inquiries.', timeline: '4-8 weeks' },
      { phaseNum: 2, title: 'Predictive Lead Scoring & Sales Intelligence', description: 'ML system analyzing lead behavior across all touchpoints to generate purchase probability scores and urgency signals. Sales team dashboard shows prioritized lead list with AI-recommended talking points. Expected outcome: 40% improvement in lead-to-sale conversion, 8-day reduction in sales cycle length, RO 2.4M incremental vehicle sales.', timeline: '8-14 weeks' },
      { phaseNum: 3, title: 'Predictive Service Intelligence & Retention Automation', description: 'AI analyzing vehicle data to predict service needs and proactively schedule appointments. Predictive maintenance alerts sent via SMS/WhatsApp for seasonal services and warranty expiration. Expected outcome: 32% increase in service visit frequency, 50% improvement in post-warranty retention, RO 2.1M incremental service revenue.', timeline: '14-24 weeks' },
    ],
    whatsappMessage: `Assalamu Alaikum Intisar,\n\nThank you for your time. Following our conversation, I've prepared a tailored AI Transformation Proposal for Premium Motors Volkswagen Oman focused on lead conversion and service revenue optimization.\n\nKey opportunity: 45% increase in lead-to-sale conversion and RO 2.1M in additional service revenue through predictive retention intelligence.\n\nI've attached the full proposal for your review. Would you be free for a 30-minute call this week to discuss?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Intisar Mahfoodh Al Nauimi',
    proposalValidUntil: 'August 19, 2026',
  },

  'Kenz Hypermarket': {
    tagline: 'AI Inventory Intelligence & Customer Analytics',
    subtitle: 'Optimize Stock Levels, Predict Demand, Personalize Promotions',
    heroStats: [
      { value: '40%', unit: 'Reduction', label: 'Stockouts' },
      { value: '25%', unit: 'Decrease', label: 'Excess Inventory' },
      { value: '18%', unit: 'Increase', label: 'Basket Size' },
      { value: 'RO 1.6M', unit: 'Improvement', label: 'Annual Margin' },
    ],
    diagnosisIntro: 'Kenz Hypermarket operates multi-category retail across Al Khoud and MBD locations with 15,000+ SKUs. Managing varying shelf lives, seasonal demand patterns, and supplier lead times creates inventory imbalances costing RO 2.8M annually in stockouts, spoilage, and excess stock markdowns.',
    leaks: [
      { type: 'LEAK', title: 'Chronic Stockouts Losing Sales & Customer Trust', description: 'High-demand items (milk, eggs, rice) stock out 12-18% of time during peak periods. Lost sales worth RO 1.8M annually plus customer frustration driving store switching. Manual ordering using basic historical averages cannot predict demand spikes from weather, events, or promotions.' },
      { type: 'RISK', title: 'Excess Inventory & Markdown Losses', description: 'Overstock of slow-moving items ties RO 2.4M in working capital. Fresh produce spoilage 8-12%, apparel seasonal excess marked down 30-50%, total markdown costs RO 1.4M. No AI forecasting demand at SKU-location level considering seasonality and cannibalization.' },
      { type: 'GAP', title: 'Generic Promotions & Missed Personalization Opportunities', description: 'Blanket promotions (10% off all categories) subsidize purchases customers would make anyway. Promotional ROI only 1.2x. Cannot target high-value customers or personalize offers based on shopping patterns. Customer purchase history sits unused.' },
    ],
    solutionIntro: 'WOS implements Retail AI Platform combining SKU-level demand forecasting, automated replenishment optimization, and customer behavior analytics—calibrated for multi-category hypermarket operations with fresh and packaged goods.',
    phases: [
      { phaseNum: 1, title: 'AI Demand Forecasting & Inventory Optimization', description: 'Time-series forecasting models at SKU-location-day granularity analyzing 5+ years of sales history, seasonal patterns, weather correlations, and promotional impact. Separate models for fresh produce, packaged goods, apparel, and electronics. Expected outcome: 40% reduction in stockouts (RO 1.8M sales recovery), 25% decrease in excess inventory.', timeline: '4-8 weeks' },
      { phaseNum: 2, title: 'Dynamic Pricing & Promotion Optimization', description: 'AI recommending optimal pricing and promotion strategies by category and SKU. Price elasticity models identify which products are price-sensitive vs brand-loyal. Markdown optimization for perishables suggests optimal discount timing and depth. Expected outcome: 22% improvement in promotional ROI, 8% increase in gross margin rate.', timeline: '8-14 weeks' },
      { phaseNum: 3, title: 'Customer Segmentation & Personalized Marketing', description: 'Customer behavior AI analyzing loyalty card transaction data to segment shoppers by lifetime value, basket composition, and shopping frequency. Recommendation engine generates personalized offers via SMS/WhatsApp. Expected outcome: 18% increase in average basket size, 30% improvement in promotional redemption rates, RO 920K incremental revenue.', timeline: '14-24 weeks' },
    ],
    whatsappMessage: `Assalamu Alaikum Rafi,\n\nHope you're doing well. I've been looking at Kenz Hypermarket's operations and wanted to share some specific observations around inventory management and customer analytics across your Al Khoud and MBD locations.\n\nKey finding: A 12-18% stockout rate on high-demand items is costing RO 1.8M in lost sales annually — something AI-driven demand forecasting can address in weeks.\n\nI've attached a tailored proposal for your review. Would you be available for a brief call this week?\n\nBest regards,\nAhmed | WOS WebOps Studio\nhello@wos.studio`,
    contactName: 'Rafi Valiyakath',
    proposalValidUntil: 'August 19, 2026',
  },
}

// Also handle alternate name variants
const COMPANY_NAME_MAP: Record<string, string> = {
  'Al Jassar Group L.L.C': 'Al Jassar Group LLC',
  'Al Jassar Group': 'Al Jassar Group LLC',
  'Vertex+ Interior Design': 'Vertex+ Interior Design & Fit-Out',
  'Vertex+': 'Vertex+ Interior Design & Fit-Out',
  'Premium Motors': 'Premium Motors Volkswagen Oman',
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { sessionDate = '2026-07-20', userEmail = 'w.taufiqq@gmail.com', dryRun = false } = body

    // 1. Find the user
    const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers()
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

    const user = users.find(u => u.email === userEmail)
    if (!user) return NextResponse.json({ error: `User ${userEmail} not found` }, { status: 404 })

    // 2. Find the July 20 session
    const { data: sessions } = await supabase
      .from('daily_outreach_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_date', sessionDate)
      .single()

    if (!sessions) {
      return NextResponse.json({ error: `No session found for ${sessionDate}` }, { status: 404 })
    }

    const sessionId = sessions.id

    // 3. Get all items in the session
    const { data: items } = await supabase
      .from('daily_outreach_items')
      .select(`*, companies(*)`)
      .eq('session_id', sessionId)
      .order('position', { ascending: true })

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items found in session' }, { status: 404 })
    }

    const results: any[] = []

    for (const item of items) {
      const company = item.companies
      if (!company) continue

      const rawName: string = company.company_name
      const lookupName = COMPANY_NAME_MAP[rawName] || rawName
      const proposal = PROPOSALS[lookupName]

      if (!proposal) {
        results.push({ company: rawName, status: 'skipped', reason: 'No proposal template found' })
        continue
      }

      // Build the ProposalData JSON
      const proposalData = {
        heroStats: proposal.heroStats,
        tagline: proposal.tagline,
        subtitle: proposal.subtitle,
        diagnosisIntro: proposal.diagnosisIntro,
        leaks: proposal.leaks,
        solutionIntro: proposal.solutionIntro,
        phases: proposal.phases,
        proposalValidUntil: proposal.proposalValidUntil,
        additionalSections: [],
      }

      // Also store the WhatsApp message as a separate section for easy access
      proposalData.additionalSections = [
        {
          title: 'WhatsApp Message',
          content: proposal.whatsappMessage.split('\n').filter(l => l.trim()),
        },
      ]

      const messageBodyJson = JSON.stringify(proposalData)

      if (dryRun) {
        results.push({ company: rawName, status: 'dry_run', proposal: proposalData })
        continue
      }

      // 4. Get primary contact
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('company_id', company.id)
        .limit(1)

      const contactId = contacts && contacts.length > 0 ? contacts[0].id : null

      // 5. Upsert into outreach_preparations
      const { data: existing } = await supabase
        .from('outreach_preparations')
        .select('id')
        .eq('company_id', company.id)
        .eq('use_case_summary', 'PROPOSAL')
        .maybeSingle()

      let upsertResult
      if (existing) {
        const { error } = await supabase
          .from('outreach_preparations')
          .update({
            message_body: messageBodyJson,
            status: 'ready',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
        upsertResult = error ? `error: ${error.message}` : 'updated'
      } else {
        const { error } = await supabase
          .from('outreach_preparations')
          .insert({
            company_id: company.id,
            contact_id: contactId,
            use_case_summary: 'PROPOSAL',
            outreach_channel: 'whatsapp',
            message_body: messageBodyJson,
            status: 'ready',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
        upsertResult = error ? `error: ${error.message}` : 'created'
      }

      results.push({
        company: rawName,
        status: upsertResult,
        contactId,
      })
    }

    return NextResponse.json({
      success: true,
      sessionId,
      sessionDate,
      totalItems: items.length,
      results,
    })
  } catch (err) {
    console.error('[seed-proposals] Error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    usage: 'POST with { sessionDate: "2026-07-20", userEmail: "w.taufiqq@gmail.com", dryRun: false }',
    proposals: Object.keys(PROPOSALS),
  })
}
