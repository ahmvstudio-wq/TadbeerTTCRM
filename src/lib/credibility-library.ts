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

// EXACT case studies from tadbeertt.com
export const CASE_STUDIES_LIBRARY: CaseStudy[] = [
  {
    id: 'cs-oman-air',
    title: 'Aviation Flight Operations & Human Capital Handovers',
    clientName: 'Oman Air',
    industry: 'Aviation & Services',
    problemSummary: 'Paper-based handovers and delayed communications between flight operations and ground dispatch teams caused gate delays and high coordinator stress during flight turnarounds.',
    solutionSummary: 'Built a real-time digital flight operations handover system and mobile coordinator dashboard for instant team sync across Muscat Airport dispatch points.',
    outcome: 'Reduced flight dispatch handoff delays by 65% and saved OMR 1.2M annually in operational overhead.',
    metrics: [
      { value: '65%', label: 'Faster Handovers' },
      { value: 'OMR 1.2M', label: 'Annual Cost Savings' }
    ],
    tags: ['aviation', 'services', 'flight ops', 'handover', 'oman air'],
    isApproved: true
  },
  {
    id: 'cs-al-harrasi',
    title: 'Shop-Floor Production ERP & Fiber Batch Tracking',
    clientName: 'Al Harrasi Rope Factory',
    industry: 'Manufacturing & Industrial',
    problemSummary: 'Tracking raw fiber batching, machine downtime, and daily production output on paper logs created inventory errors, shipment delays, and 12% material waste.',
    solutionSummary: 'Implemented a simple tablet-based shop floor ERP system that tracks orders live from raw material batching through production to final GCC dispatch.',
    outcome: 'Cut raw material scrap waste by 42% and doubled order fulfillment velocity across regional export markets.',
    metrics: [
      { value: '42%', label: 'Material Waste Reduction' },
      { value: '2x', label: 'Faster GCC Dispatch' }
    ],
    tags: ['manufacturing', 'industrial', 'rope factory', 'erp', 'al harrasi'],
    isApproved: true
  },
  {
    id: 'cs-troxy',
    title: 'Automated GCC Event Ticketing & WhatsApp Entry Passes',
    clientName: 'Troxy Oman',
    industry: 'Events & GCC Ticketing',
    problemSummary: 'High-volume ticket buyers faced venue entry bottlenecks and long queues due to manual paper ticket verification at major regional shows.',
    solutionSummary: 'Launched instant WhatsApp QR ticket delivery with high-speed mobile gate scanners for seamless venue entry.',
    outcome: 'Eliminated venue entry queues by 85% and accelerated ticket booking velocity by 3.5x.',
    metrics: [
      { value: '85%', label: 'Shorter Queue Time' },
      { value: '3.5x', label: 'Booking Velocity' }
    ],
    tags: ['events', 'ticketing', 'troxy', 'whatsapp', 'qr passes'],
    isApproved: true
  },
  {
    id: 'cs-makran-meat',
    title: 'Cold-Chain Delivery Logistics & Fleet Dispatching',
    clientName: 'Makran Meat',
    industry: 'Food & Cold Chain FMCG',
    problemSummary: 'Manual phone order intake and unmonitored driver dispatch caused delivery mix-ups and perishable food spoilage during hot summer months.',
    solutionSummary: 'Designed a centralized order intake dashboard with automated driver route dispatch and refrigerated truck temperature monitoring.',
    outcome: 'Cut perishable meat spoilage by 60% and achieved 98% on-time delivery customer satisfaction.',
    metrics: [
      { value: '60%', label: 'Less Perishable Spoilage' },
      { value: '98%', label: 'On-Time Delivery Rate' }
    ],
    tags: ['food', 'fmcg', 'makran', 'cold chain', 'logistics'],
    isApproved: true
  },
  {
    id: 'cs-qurum-perfumes',
    title: 'VIP Scent Concierge & Automated WhatsApp Replenishment',
    clientName: 'Al Qurum Perfumes',
    industry: 'Fragrance & Luxury Retail',
    problemSummary: 'Boutique store staff lost contact with regular luxury buyers between seasonal fragrance launches, missing out on repeat orders.',
    solutionSummary: 'Created automated WhatsApp scent profiles that record customer fragrance notes and send personal re-order invites ahead of Eid & winter drops.',
    outcome: 'Increased repeat fragrance purchases by 3.5x and grew annual VIP customer revenue by 48%.',
    metrics: [
      { value: '3.5x', label: 'More Repeat Orders' },
      { value: '48%', label: 'VIP Sales Growth' }
    ],
    tags: ['perfumes', 'fragrance', 'retail', 'whatsapp', 'qurum perfumes'],
    isApproved: true
  },
  {
    id: 'cs-gloria-jeans',
    title: 'Multi-Outlet Customer Rewards & Inventory Sync',
    clientName: "Gloria Jean's Coffees Oman",
    industry: 'Retail & Hospitality',
    problemSummary: 'Siloed point-of-sale registers across coffee shop locations prevented multi-branch customer rewards and created monthly ingredient variance.',
    solutionSummary: 'Unified store POS terminals into a single customer loyalty engine with automated central ingredient stock alerts.',
    outcome: 'Increased repeat customer visits by 38% and reduced monthly inventory discrepancies by 75%.',
    metrics: [
      { value: '38%', label: 'More Repeat Visits' },
      { value: '75%', label: 'Less Stock Discrepancy' }
    ],
    tags: ['retail', 'hospitality', 'gloria jeans', 'pos', 'loyalty'],
    isApproved: true
  },
  {
    id: 'cs-sultanate-marble',
    title: 'Custom Stone Cutting Milestone Tracker',
    clientName: 'Sultanate of Marble',
    industry: 'Building Materials & Stone',
    problemSummary: 'Architects and commercial contractors faced delays due to lack of visibility into custom marble block cutting schedules and site delivery times.',
    solutionSummary: 'Built an automated milestone notification system that updates clients on WhatsApp from quarry cutting to final site delivery.',
    outcome: 'Reduced delivery delays by 55% and increased contractor repeat projects by 40%.',
    metrics: [
      { value: '55%', label: 'Shorter Delays' },
      { value: '40%', label: 'More Repeat Projects' }
    ],
    tags: ['building materials', 'stone', 'marble', 'construction', 'sultanate of marble'],
    isApproved: true
  },
  {
    id: 'cs-tameer',
    title: 'Tenant Portal & WhatsApp Rent Collection OS',
    clientName: 'Tameer Investments',
    industry: 'Real Estate & Assets',
    problemSummary: 'Manual rent follow-ups, paper receipts, and unorganized maintenance requests created administrative bottlenecks for property managers.',
    solutionSummary: 'Launched a simple WhatsApp tenant portal for digital rent reminders, instant receipts, and maintenance ticket tracking.',
    outcome: 'Improved on-time rent collection by 82% and resolved tenant maintenance tickets 3x faster.',
    metrics: [
      { value: '82%', label: 'On-Time Rent' },
      { value: '3x', label: 'Faster Tenant Support' }
    ],
    tags: ['real estate', 'investments', 'tameer', 'property management', 'whatsapp'],
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
