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

// EXACT real clients from tadbeertt.com (No legacy placeholders!)
export const APPROVED_CLIENT_LOGOS: ApprovedClientLogo[] = [
  { id: 'logo-oman-air', clientName: 'Oman Air', industry: 'Aviation & Services', isApproved: true },
  { id: 'logo-vision-2040', clientName: 'Oman Vision 2040', industry: 'Government Strategy', isApproved: true },
  { id: 'logo-al-harrasi', clientName: 'Al Harrasi Rope Factory', industry: 'Manufacturing & Industrial', isApproved: true },
  { id: 'logo-makran', clientName: 'Makran Meat', industry: 'Food & Cold Chain FMCG', isApproved: true },
  { id: 'logo-gloria-jeans', clientName: "Gloria Jean's Coffees", industry: 'Retail & Hospitality', isApproved: true },
  { id: 'logo-qurum-perfumes', clientName: 'Al Qurum Perfumes', industry: 'Fragrance & Luxury Retail', isApproved: true },
  { id: 'logo-sultanate-marble', clientName: 'Sultanate of Marble', industry: 'Building Materials & Stone', isApproved: true },
  { id: 'logo-amec', clientName: 'AMEC Almusharfi', industry: 'Engineering & Construction', isApproved: true },
  { id: 'logo-oudh-kabir', clientName: 'Oudh Al Kabir', industry: 'Luxury Oud & Perfumes', isApproved: true },
  { id: 'logo-troxy', clientName: 'Troxy Oman', industry: 'Events & GCC Ticketing', isApproved: true },
  { id: 'logo-yalla-pass', clientName: 'Yalla Pass', industry: 'Digital Tourism Platforms', isApproved: true },
  { id: 'logo-tameer', clientName: 'Tameer Investments', industry: 'Real Estate & Assets', isApproved: true },
]

// EXACT real case studies from tadbeertt.com (Strictly from website, zero hallucination)
export const CASE_STUDIES_LIBRARY: CaseStudy[] = [
  {
    id: 'cs-al-harrasi-erp',
    title: 'Shop-Floor Production ERP & Fiber Batch Tracking',
    clientName: 'Al Harrasi Rope Factory',
    industry: 'MANUFACTURING & INDUSTRIAL',
    problemSummary: 'Tracking raw fiber batching, machine downtime, and daily production output on paper logs created inventory errors, shipment delays, and 12% material waste.',
    solutionSummary: 'Implemented shop-floor production ERP and automated raw fiber batch tracking to digitize daily output logs.',
    outcome: 'Cut raw material scrap waste by 42% and doubled order fulfillment velocity across regional export markets.',
    metrics: [
      { value: '42%', label: 'Material Waste Reduction' },
      { value: '2x', label: 'Faster GCC Dispatch' }
    ],
    tags: ['manufacturing', 'industrial', 'rope factory', 'erp', 'al harrasi', 'retail'],
    isApproved: true
  },
  {
    id: 'cs-makran-meat',
    title: 'Cold-Chain Delivery Logistics & Fleet Dispatching',
    clientName: 'Makran Meat',
    industry: 'FOOD & COLD CHAIN FMCG',
    problemSummary: 'Manual phone order intake and unmonitored driver dispatch caused delivery mix-ups and perishable food spoilage during hot summer months.',
    solutionSummary: 'Centralized order intake logistics and automated driver fleet dispatching with refrigerated monitoring.',
    outcome: 'Cut perishable meat spoilage by 60% and achieved 98% on-time delivery customer satisfaction.',
    metrics: [
      { value: '60%', label: 'Less Perishable Spoilage' },
      { value: '98%', label: 'On-Time Delivery Rate' }
    ],
    tags: ['food', 'cold chain', 'fmcg', 'makran', 'logistics', 'supermarket'],
    isApproved: true
  },
  {
    id: 'cs-oman-air-visitor',
    title: 'Visitor Management System',
    clientName: 'Oman Air',
    industry: 'AVIATION',
    problemSummary: 'Paper-based gate passes and manual security check-ins created delays and front-desk friction.',
    solutionSummary: 'A fully digitized digital check-in platform replacing paper gate passes.',
    outcome: 'Streamlined check-in speed to 45 seconds and reduced front-desk administrative load by 70%.',
    metrics: [
      { value: '45 sec', label: 'Check-In Time' },
      { value: '-70%', label: 'Front-Desk Load' }
    ],
    tags: ['aviation', 'visitor management', 'oman air', 'services'],
    isApproved: true
  },
  {
    id: 'cs-troxy-redesign',
    title: 'Business Establishment & IT Redesign',
    clientName: 'Troxy Oman',
    industry: 'RESTAURANT / FOOD SERVICE',
    problemSummary: 'Fragmented POS operations and manual HR scheduling created system downtime and slow customer ordering.',
    solutionSummary: 'End-to-end operational workflows, HR plans, and POS integration.',
    outcome: 'Achieved 99.9% POS network uptime and accelerated ordering speed by 35%.',
    metrics: [
      { value: '99.9%', label: 'POS Network Uptime' },
      { value: '+35%', label: 'Ordering Speed' }
    ],
    tags: ['restaurant', 'food service', 'troxy', 'pos', 'hospitality'],
    isApproved: true
  },
  {
    id: 'cs-al-harrasi-web',
    title: 'Digital Transformation & Web Development',
    clientName: 'Al Harrasi Rope Factory',
    industry: 'MANUFACTURING',
    problemSummary: 'Lack of an online B2B portal created manual supplier onboarding friction and missed export leads.',
    solutionSummary: 'Establishing a professional B2B presence, supplier portal, and lead tracking.',
    outcome: 'Delivered instant supplier onboarding and increased inbound B2B lead generation by 45%.',
    metrics: [
      { value: 'Instant', label: 'Supplier Onboard' },
      { value: '+45%', label: 'B2B Leads' }
    ],
    tags: ['manufacturing', 'web development', 'b2b', 'al harrasi'],
    isApproved: true
  },
  {
    id: 'cs-atur-marketplace',
    title: 'Strategy & Platform Development',
    clientName: 'Atur',
    industry: 'PERFUME MARKETPLACE',
    problemSummary: 'Traditional GCC fragrance retail was constrained to physical stores without scalable online sales infrastructure.',
    solutionSummary: 'Transforming traditional GCC fragrance retail into a scalable marketplace.',
    outcome: 'Successfully built and launched a scalable GCC fragrance retail e-commerce marketplace.',
    metrics: [
      { value: 'Scalable', label: 'Marketplace Platform' },
      { value: '100%', label: 'Inventory Sync' }
    ],
    tags: ['perfume', 'marketplace', 'atur', 'fragrance', 'retail'],
    isApproved: true
  },
  {
    id: 'cs-sultanate-marble-erp',
    title: 'ERP Consulting & Implementation',
    clientName: 'Sultanate of Marble',
    industry: 'MANUFACTURING',
    problemSummary: 'Manual disconnected operational workflows across stone processing workshops hindered team coordination.',
    solutionSummary: 'Workflows evaluation and ERPNext implementation for 200+ staff.',
    outcome: 'Fully onboarded 200+ staff onto integrated ERPNext across operations and finance.',
    metrics: [
      { value: '200+', label: 'Staff Onboarded' },
      { value: 'ERPNext', label: 'System Implementation' }
    ],
    tags: ['manufacturing', 'stone', 'marble', 'erpnext', 'sultanate of marble'],
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
