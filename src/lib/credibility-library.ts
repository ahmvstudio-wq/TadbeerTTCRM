export interface CaseStudy {
  id: string
  title: string
  clientName: string
  industry: string
  problemSummary: string
  solutionSummary: string
  outcome: string
  metrics: { value: string; label: string }[]
  tags: string[]
  logoUrl?: string
  isApproved: boolean
}

export interface ApprovedClientLogo {
  id: string
  clientName: string
  industry: string
  logoUrl?: string
  isApproved: boolean
}

export const APPROVED_CLIENT_LOGOS: ApprovedClientLogo[] = [
  { id: 'logo-ofm', clientName: 'Oman Flour Mills SAOG', industry: 'Manufacturing', logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=120&auto=format&fit=crop&q=80', isApproved: true },
  { id: 'logo-mni', clientName: 'Muna Noor International LLC', industry: 'Construction/Engineering', logoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?w=120&auto=format&fit=crop&q=80', isApproved: true },
  { id: 'logo-aljassar', clientName: 'Al Jassar Group LLC', industry: 'Trading/Distribution', logoUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=120&auto=format&fit=crop&q=80', isApproved: true },
  { id: 'logo-vertex', clientName: 'Vertex+ Interior Design', industry: 'Interior Design', logoUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=120&auto=format&fit=crop&q=80', isApproved: true },
  { id: 'logo-stay', clientName: 'Stay Development', industry: 'Real Estate', logoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=120&auto=format&fit=crop&q=80', isApproved: true },
  { id: 'logo-arak', clientName: 'Arak Medical Clinics', industry: 'Healthcare', logoUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=120&auto=format&fit=crop&q=80', isApproved: true },
  { id: 'logo-nationalfin', clientName: 'National Finance', industry: 'Finance/Microfinance', logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=120&auto=format&fit=crop&q=80', isApproved: true },
  { id: 'logo-mwasalat', clientName: 'Mwasalat', industry: 'Public Transportation', logoUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=120&auto=format&fit=crop&q=80', isApproved: true },
  { id: 'logo-pm-vw', clientName: 'Premium Motors Volkswagen Oman', industry: 'Automotive', logoUrl: 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=120&auto=format&fit=crop&q=80', isApproved: true },
  { id: 'logo-kenz', clientName: 'Kenz Hypermarket', industry: 'Retail/Hypermarket', logoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=120&auto=format&fit=crop&q=80', isApproved: true },
]

export const CASE_STUDIES_LIBRARY: CaseStudy[] = [
  {
    id: 'cs-manufacturing-ofm',
    title: 'IoT Predictive Maintenance & Real-time Batch Quality Control',
    clientName: 'Oman Food Processing & Milling Leader',
    industry: 'Manufacturing',
    problemSummary: 'Unplanned downtime in milling lines and late defect detection created 8-12% scrap rate and delayed delivery schedules.',
    solutionSummary: 'Deployed IoT vibration/temperature sensors on 45+ milling assets combined with SCADA computer vision quality prediction.',
    outcome: '70% reduction in unplanned equipment downtime and 81% improvement in batch defect detection speed.',
    metrics: [
      { value: '70%', label: 'Downtime Reduction' },
      { value: '$4.5M', label: 'Annual Savings Potential' }
    ],
    tags: ['manufacturing', 'food processing', 'iot', 'predictive maintenance', 'quality control', 'oee'],
    isApproved: true
  },
  {
    id: 'cs-construction-muna',
    title: 'Multi-Site Constraint Scheduling & Resource Optimization',
    clientName: 'GCC Engineering & Construction Group',
    industry: 'Construction/Engineering',
    problemSummary: 'Project slippage and 25-35% machinery idle time across 20+ concurrent sites created cost overruns.',
    solutionSummary: 'Implemented constraint-based Primavera AI scheduler with real-time GPS asset allocation across distributed sites.',
    outcome: '35% improvement in heavy equipment utilization and 25% reduction in contracted schedule overruns.',
    metrics: [
      { value: '35%', label: 'Resource Utilization' },
      { value: '$3.2M', label: 'Cost Avoidance' }
    ],
    tags: ['construction', 'engineering', 'scheduling', 'resource allocation', 'bim'],
    isApproved: true
  },
  {
    id: 'cs-trading-aljassar',
    title: 'SKU Demand Forecasting & Multi-Objective Inventory Balancing',
    clientName: 'Regional Industrial & Construction Trading Giant',
    industry: 'Trading/Distribution',
    problemSummary: 'Overstock tied RO 4.2M in capital while 15% chronic stockouts resulted in lost sales to competing suppliers.',
    solutionSummary: 'Deployed Gated Recurrent Unit (GRU) time-series forecasting engine with automated reorder thresholding across 1,000+ SKUs.',
    outcome: '77% reduction in stock-out events and RO 2.8M in working capital released back to operating cash flow.',
    metrics: [
      { value: '77%', label: 'Stockout Reduction' },
      { value: 'RO 2.8M', label: 'Working Capital Released' }
    ],
    tags: ['trading', 'distribution', 'supply chain', 'inventory optimization', 'demand forecasting'],
    isApproved: true
  },
  {
    id: 'cs-realestate-stay',
    title: '24/7 AI Lead Qualification & Property Recommendation Engine',
    clientName: 'Luxury Residential Property Developer',
    industry: 'Real Estate',
    problemSummary: 'Slow response times (8-12 hours) caused 45% buyer inquiry abandonment during 3-6 month decision cycles.',
    solutionSummary: 'Integrated WhatsApp conversational AI chatbot with dynamic floorplan matching and automated CRM buyer scoring.',
    outcome: '45% increase in inquiry-to-tour conversion rate and 3.2x faster first-contact response velocity.',
    metrics: [
      { value: '45%', label: 'Tour Conversion Boost' },
      { value: '3.2x', label: 'Faster Response Time' }
    ],
    tags: ['real estate', 'crm', 'lead qualification', 'whatsapp automation', 'property matching'],
    isApproved: true
  },
  {
    id: 'cs-healthcare-arak',
    title: 'Multi-Specialty Appointment Scheduling & Care Nurture Engine',
    clientName: 'Multi-Location Ambulatory Clinic Group',
    industry: 'Healthcare',
    problemSummary: '25-30% patient no-show rate and phone-booking bottlenecks created RO 450K annual revenue leakage.',
    solutionSummary: 'Implemented multi-channel automated reminders (WhatsApp, SMS) with 24/7 self-service scheduling and clinical follow-ups.',
    outcome: '50% reduction in appointment no-shows and 75% decrease in administrative call center volume.',
    metrics: [
      { value: '50%', label: 'No-Show Reduction' },
      { value: 'RO 380K', label: 'Revenue Recovered' }
    ],
    tags: ['healthcare', 'patient engagement', 'no-show reduction', 'scheduling', 'clinic operations'],
    isApproved: true
  },
  {
    id: 'cs-finance-national',
    title: 'Alternative Data Credit Scoring & Automated Underwriting',
    clientName: 'Leading Non-Banking Financial Institution',
    industry: 'Finance/Microfinance',
    problemSummary: 'Manual underwriting created 2-5 day decision cycles and rejected 60% of viable thin-file applicants.',
    solutionSummary: 'Deployed explainable ML risk assessment models analyzing alternative payment data alongside credit bureau history.',
    outcome: '77% of retail loan applications auto-decisioned in under 4 hours with a 30% increase in approval rates without added risk.',
    metrics: [
      { value: '77%', label: 'Automated Decisions' },
      { value: '30%', label: 'Higher Approval Rate' }
    ],
    tags: ['finance', 'credit scoring', 'underwriting', 'risk intelligence', 'automation'],
    isApproved: true
  },
  {
    id: 'cs-automotive-premium',
    title: 'Predictive Service Retention & Sales Urgency Scoring',
    clientName: 'Multi-Brand Luxury Automotive Dealership',
    industry: 'Automotive',
    problemSummary: '45-60% lead leakage in sales and 40% customer churn after warranty expiration eroded service revenue.',
    solutionSummary: 'Deployed behavioral engagement tracking with vehicle mileage predictive service alerts via WhatsApp.',
    outcome: '45% increase in lead-to-sale conversion and 32% growth in post-warranty service retention revenue.',
    metrics: [
      { value: '45%', label: 'Lead Conversion Boost' },
      { value: '32%', label: 'Service Growth' }
    ],
    tags: ['automotive', 'dealership', 'service retention', 'sales intelligence', 'crm'],
    isApproved: true
  }
]

export function getRecommendedCaseStudies(industry?: string, limit = 2): CaseStudy[] {
  if (!industry) return CASE_STUDIES_LIBRARY.slice(0, limit)
  const normalized = industry.toLowerCase()
  
  const matches = CASE_STUDIES_LIBRARY.filter(cs => {
    return (
      cs.industry.toLowerCase().includes(normalized) ||
      cs.tags.some(t => normalized.includes(t) || t.includes(normalized))
    )
  })

  if (matches.length >= limit) {
    return matches.slice(0, limit)
  }

  // Fallback to fill up to limit
  const otherStudies = CASE_STUDIES_LIBRARY.filter(cs => !matches.includes(cs))
  return [...matches, ...otherStudies].slice(0, limit)
}

export function getRecommendedClientLogos(industry?: string, limit = 6): ApprovedClientLogo[] {
  if (!industry) return APPROVED_CLIENT_LOGOS.slice(0, limit)
  const normalized = industry.toLowerCase()

  const matches = APPROVED_CLIENT_LOGOS.filter(l => l.industry.toLowerCase().includes(normalized))
  if (matches.length >= limit) return matches.slice(0, limit)

  const remaining = APPROVED_CLIENT_LOGOS.filter(l => !matches.includes(l))
  return [...matches, ...remaining].slice(0, limit)
}
