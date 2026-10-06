import { type PreStagedSequence, type SectorCategory, type OutreachChannel } from '@/lib/types/outreach'

export interface CategoryPlaybook {
  category: SectorCategory
  label: string
  target_persona: string
  pain_points: string
  tone_notes: string
  gate_opener_template: string
  touch_2_template: string
  audit_offer_template: string
  touch_3_template: string
  cold_call_framework: {
    opener: string
    bridge: string
    close_coffee: string
  }
}

// ─── Undeniable Cadence Delays ────────────────────────────────────────────────
// Stage 1 (Greeting) -> Stage 2 (Check-in): Exactly +2 days
// Stage 2 (Check-in) -> Stage 3 (Audit Offer): Exactly +3 days
// Stage 3 (Audit Offer) -> Stage 4 (Coffee/Call Proposal): Exactly +5 days
export const CADENCE_DELAYS = {
  GREETING_TO_FOLLOWUP_1: 2,
  FOLLOWUP_1_TO_AUDIT_OFFER: 3,
  AUDIT_OFFER_TO_COFFEE_CALL: 5,
} as const

export function calculateNextDueDate(days: number, fromDate: Date = new Date()): string {
  const d = new Date(fromDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// ─── 5 Researched Oman Category Playbooks ─────────────────────────────────────
export const TTT_CATEGORY_PLAYBOOKS: Record<SectorCategory, CategoryPlaybook> = {
  aesthetic_clinics: {
    category: 'aesthetic_clinics',
    label: 'Aesthetic & Derma Clinics',
    target_persona: 'Owner-Doctor (Dermatologist / Cosmetic MD)',
    pain_points: 'Inquiry leakage in Instagram DMs, receptionist overwhelmed by price messages, consultation no-shows, competing with new clinics on price.',
    tone_notes: 'Warm, respectful, compliment-first on specific clinical work. Peer-to-peer B2B tone. Zero hard service pitch.',
    gate_opener_template: 'Dr [Name], your work on [specific observation] is really impressive — the results speak for themselves. Quick question: do most of your new patients find you through Instagram or through Google search? I work in healthcare marketing in Muscat and I am always curious what is actually working best for clinics here.',
    touch_2_template: 'Dr [Name], hope your week is going well. I was looking into how leading clinics in Muscat handle high-volume DM price inquiries without adding front-desk staff, and thought of [Company]. Happy to share what we observed if useful.',
    audit_offer_template: 'Dr [Name], hope you are having a wonderful week. We actually took some time to look into [Company]’s patient acquisition channels and prepared a brief outside-in audit of your inquiry flow and patient journey in Muscat. Would you be open to taking a look at it?',
    touch_3_template: 'Dr [Name], would love to drop by for a quick 10-minute coffee in Muscat or do a brief call this week to share the audit findings and hear your thoughts. Let me know what suits your schedule.',
    cold_call_framework: {
      opener: 'Hi Dr [Name], this is with Tadbeer Transformations in Madinat Qaboos. The reason for my call is simple — I was reviewing [specific observation] at [Company]. Caught you with 30 seconds?',
      bridge: 'We work with leading aesthetic clinics in Muscat helping ensure every inquiry actually converts into booked appointments without reception overload.',
      close_coffee: 'Can I buy you a quick coffee sometime this Thursday to share a 10-minute briefing on what we are seeing work across Muscat?'
    }
  },
  dental_clinics: {
    category: 'dental_clinics',
    label: 'Dental Clinics',
    target_persona: 'Owner-Dentist',
    pain_points: 'Unanswered front-desk calls during busy clinic hours, lower Google visibility compared to nearby competitors, empty chair hours from last-minute cancellations.',
    tone_notes: 'Factual, verifiable, respectful. Concrete comparisons. Phone and WhatsApp friendly.',
    gate_opener_template: 'Ahlan Dr [Name], quick question — I was looking into dental practices in [Area] on Google and noticed [Company] has great patient feedback on [specific observation]. I work with local healthcare practices on local search visibility and was curious whether most of your cosmetic patients come through Google or word-of-mouth?',
    touch_2_template: 'Ahlan Dr [Name], I put together a quick 1-page visual of how dental search traffic in [Area] compares across clinics. No sales pitch, just thought you’d find the patient search patterns interesting. Happy to send it over.',
    audit_offer_template: 'Ahlan Dr [Name], hope you are doing well. We spent some time reviewing [Company]’s local search ranking and appointment booking workflows against Muscat peers and compiled an audit for you. Would you be open to reviewing it?',
    touch_3_template: 'Ahlan Dr [Name], would you have 10 minutes for a quick coffee this week in Muscat, or a direct call, so we can walk you through the key findings from the audit?',
    cold_call_framework: {
      opener: 'Ahlan Dr [Name], my name is from Tadbeer. I noticed [Company] has stellar patient reviews for [specific observation] but seems to be missing from top local search results compared to a few competitors nearby.',
      bridge: 'We help dental practices in Muscat capture prospective patient inquiries during peak hours without missing calls.',
      close_coffee: 'Would you be open to a 10-minute coffee this week in Muscat to look at your area’s search breakdown?'
    }
  },
  social_commerce_dtc: {
    category: 'social_commerce_dtc',
    label: 'Social-Commerce & DTC Brands',
    target_persona: 'Founder / Brand Owner',
    pain_points: 'Founder overwhelmed answering repetitive WhatsApp DMs every evening, manual bank transfer verification friction, seasonal drop chaos.',
    tone_notes: 'Encouraging, stylish, empathetic to founder hustle. Evening friendly. Focus on revenue and smoother ordering.',
    gate_opener_template: 'Assalamu Alaikum [Name], your work on [specific observation] with [Company] is stunning — genuinely stands out. Quick question: when you launch new drops and get flooded with DMs, how do you manage all the sizing and ordering conversations? I imagine it gets intense.',
    touch_2_template: 'Assalamu Alaikum [Name], hope you are having a productive week. We recently reviewed how top Omani DTC brands streamline their WhatsApp ordering flow to turn followers into instant repeat buyers. Thought you might find the breakdown useful for [Company].',
    audit_offer_template: 'Assalamu Alaikum [Name], we took a deep look into [Company]’s digital storefront and WhatsApp checkout friction, and prepared an audit on how to automate direct orders. Would you be open to checking it out?',
    touch_3_template: 'Assalamu Alaikum [Name], based on the audit, I’d love to buy you a quick coffee in Muscat or hop on a brief call to share 2 simple changes that could immediately boost your order conversion. What day works best for you?',
    cold_call_framework: {
      opener: 'Assalamu Alaikum [Name], this is from Tadbeer in Muscat. I saw your latest work with [specific observation] at [Company]. Have 30 seconds?',
      bridge: 'We help Omani brands turn Instagram attention into automated direct orders without the founder spending all night on WhatsApp.',
      close_coffee: 'Would love to buy you a coffee in Muscat and share what is working for other local brands.'
    }
  },
  training_education: {
    category: 'training_education',
    label: 'Training & Education',
    target_persona: 'Institute Director / Head of BD',
    pain_points: 'Last-minute scramble to fill course batch seats, slow admissions response to ad leads, missing out on the 1.2% national training levy.',
    tone_notes: 'Professional, consultative, insider perspective. Speaks the language of intake cycles and enrollment pipelines.',
    gate_opener_template: 'Ahlan [Name], I noticed [Company]’s announcement regarding [specific observation]. How is enrollment tracking so far? I work with training providers in Oman on student acquisition and I’m curious whether the pipeline is looking healthy or if it’s the usual last-week scramble to fill seats.',
    touch_2_template: 'Ahlan [Name], hope you’re doing well. With the 1.2% training levy driving corporate upskilling in Oman, we’ve been seeing some interesting ways institutes are accelerating corporate batch bookings. Glad to share a brief note if relevant.',
    audit_offer_template: 'Ahlan [Name], we put together a focused audit on [Company]’s enrollment funnel and corporate outreach positioning for Oman’s training levy market. Would you be open to reviewing the audit?',
    touch_3_template: 'Ahlan [Name], can we sit down for a 15-minute coffee this week or do a brief call to review the audit insights together? Let me know what time works best for you.',
    cold_call_framework: {
      opener: 'Ahlan [Name], this is with Tadbeer in Madinat Qaboos. I was looking at [Company]’s programs around [specific observation]. Caught you with 30 seconds?',
      bridge: 'We help training institutes in Oman capture and convert corporate and student inquiries before they book with competing institutes.',
      close_coffee: 'Can we sit down for a 15-minute coffee this week to discuss what we are seeing across the training sector?'
    }
  },
  hospitality_fnb: {
    category: 'hospitality_fnb',
    label: 'Hospitality & Premium F&B',
    target_persona: 'General Manager / Owner / Executive Chef',
    pain_points: 'High 15-25% OTA commission fees to Booking.com/Talabat, midweek dining slump, weekend table no-shows.',
    tone_notes: 'Hospitable, appreciative guest perspective, commercially sharp. Relationship-driven.',
    gate_opener_template: 'Ahlan [Name], I was admiring [Company]’s experience around [specific observation] — genuinely excellent. Quick question: are you seeing most of your guests book directly through your own channels or are you still relying heavily on third-party platforms? I’ve been looking into direct guest acquisition in Oman and the patterns are fascinating.',
    touch_2_template: 'Ahlan [Name], hope you’re having a great week. We’ve been reviewing how boutique hospitality venues in Oman are retaining 15-25% more margin through direct WhatsApp reservation flows. Happy to share our notes if you’d find it valuable.',
    audit_offer_template: 'Ahlan [Name], we looked closely into [Company]’s booking and reservation channels and prepared an audit on direct guest retention vs OTA fees in Muscat. Would you be open to seeing it?',
    touch_3_template: 'Ahlan [Name], I’d love to stop by for a quick coffee this week to share the audit breakdown and hear your thoughts on the upcoming season. Which day suits you?',
    cold_call_framework: {
      opener: 'Ahlan [Name], this is from Tadbeer. I recently looked into [Company] and loved [specific observation]. Got 30 seconds?',
      bridge: 'We work with independent hospitality and dining brands in Oman to drive direct customer bookings and cut third-party commissions.',
      close_coffee: 'Would love to stop by for a quick coffee this week and hear how your current season is progressing.'
    }
  },
  general: {
    category: 'general',
    label: 'General SME',
    target_persona: 'Business Owner',
    pain_points: 'Customer acquisition bottlenecks, manual WhatsApp follow-up friction, lack of marketing visibility.',
    tone_notes: 'Warm, helpful, zero jargon.',
    gate_opener_template: 'Assalamu Alaikum [Name], I came across [Company] while looking into businesses in Oman and was impressed by [specific observation]. Quick question: do most of your new customers reach out via WhatsApp or find you online? I work with local businesses on customer acquisition and I’m always curious what is working best.',
    touch_2_template: 'Assalamu Alaikum [Name], sharing a quick thought on how businesses in Muscat are streamlining their inquiry flow. Happy to pass it across if useful for [Company].',
    audit_offer_template: 'Assalamu Alaikum [Name], we actually looked into [Company]’s business and prepared an outside-in growth and inquiry audit for you. Would you be open to taking a look at it?',
    touch_3_template: 'Assalamu Alaikum [Name], based on the audit, I would love to buy you a quick coffee this week in Muscat or hop on a brief call to share our findings. Would you be open to that?',
    cold_call_framework: {
      opener: 'Assalamu Alaikum [Name], this is from Tadbeer Transformations in Muscat. Noticed [specific observation] at [Company]. Have 30 seconds?',
      bridge: 'We help local Omani businesses get more customers through better marketing and smoother inquiry workflows.',
      close_coffee: 'Can I buy you a quick coffee this week in Muscat to share what we’ve seen working?'
    }
  }
}

export function getCategoryPlaybook(categoryKey: string): CategoryPlaybook {
  return TTT_CATEGORY_PLAYBOOKS[categoryKey as SectorCategory] || TTT_CATEGORY_PLAYBOOKS.general
}

export function normalizeCategorySync(catStr?: string | null, companyName?: string | null): SectorCategory {
  const combined = `${catStr || ''} ${companyName || ''}`.toLowerCase().trim()
  if (!combined || combined === 'null' || combined === 'undefined') return 'general'

  // Exact matching for enum keys
  if (combined.includes('aesthetic_clinics') || combined.includes('aesthetic') || combined.includes('derma') || combined.includes('cosmetic') || combined.includes('skin') || combined.includes('laser') || combined.includes('plastic surg')) return 'aesthetic_clinics'
  if (combined.includes('dental_clinics') || combined.includes('dental') || combined.includes('teeth') || combined.includes('dentist') || combined.includes('orthodont')) return 'dental_clinics'
  if (combined.includes('social_commerce_dtc') || combined.includes('perfume') || combined.includes('oud') || combined.includes('fragrance') || combined.includes('scent') || combined.includes('boutique') || combined.includes('fashion') || combined.includes('clothing') || combined.includes('apparel') || combined.includes('abaya') || combined.includes('retail') || combined.includes('dtc') || combined.includes('e-commerce') || combined.includes('ecommerce') || combined.includes('jewelry') || combined.includes('jewellery') || combined.includes('shop') || combined.includes('store')) return 'social_commerce_dtc'
  if (combined.includes('training_education') || combined.includes('training') || combined.includes('education') || combined.includes('institute') || combined.includes('academy') || combined.includes('course') || combined.includes('school') || combined.includes('college') || combined.includes('university') || combined.includes('tutor') || combined.includes('learning')) return 'training_education'
  if (combined.includes('hospitality_fnb') || combined.includes('hotel') || combined.includes('resort') || combined.includes('restaurant') || combined.includes('hospitality') || combined.includes('dining') || combined.includes('cafe') || combined.includes('café') || combined.includes('coffee') || combined.includes('roastery') || combined.includes('bistro') || combined.includes('bakery') || combined.includes('f&b')) return 'hospitality_fnb'

  return 'general'
}

export async function normalizeCategory(catStr?: string | null): Promise<SectorCategory> {
  return normalizeCategorySync(catStr)
}

export function buildDeterministicSequence(
  companyName: string,
  contactName: string,
  category: SectorCategory,
  observation: string,
  channel: OutreachChannel = 'whatsapp',
  area: string = 'Muscat'
): PreStagedSequence {
  const playbook = TTT_CATEGORY_PLAYBOOKS[category] || TTT_CATEGORY_PLAYBOOKS.general
  const name = contactName && contactName.trim() ? contactName.trim() : 'there'
  const obs = observation && observation.trim() ? observation.trim() : 'your business presence'

  const fill = (str: string) =>
    str
      .replace(/\[Name\]/g, name)
      .replace(/\[Company\]/g, companyName)
      .replace(/\[specific observation\]/g, obs)
      .replace(/\[Area\]/g, area)

  return {
    touch_1: {
      channel,
      message: fill(playbook.gate_opener_template),
      specific_observation: obs,
      target_name: name,
    },
    touch_2: {
      channel,
      message: fill(playbook.touch_2_template),
      day_delay: CADENCE_DELAYS.GREETING_TO_FOLLOWUP_1, // 2 days
      value_asset: 'Sector Observation Note',
    },
    touch_3: {
      channel,
      message: fill(playbook.audit_offer_template),
      day_delay: CADENCE_DELAYS.FOLLOWUP_1_TO_AUDIT_OFFER, // 3 days
      is_final_touch: false,
    },
    touch_4: {
      channel,
      message: fill(playbook.cold_call_framework.close_coffee),
      day_delay: CADENCE_DELAYS.AUDIT_OFFER_TO_COFFEE_CALL, // 5 days
      is_final_touch: true,
    },
    cold_call_script: {
      opener: fill(playbook.cold_call_framework.opener),
      context_bridge: fill(playbook.cold_call_framework.bridge),
      close_for_coffee: fill(playbook.cold_call_framework.close_coffee),
    },
    objection_pack: {
      has_agency: 'That’s great — having someone handling your marketing is important. I’m not suggesting replacing anyone. I’m more curious about whether you are seeing actual booked customers come through or just social activity. If there are gaps, happy to share a few thoughts.',
      how_much: 'It depends on what makes sense for your business — some work with us on a monthly retainer, others on a specific project. I’d rather understand your setup properly before throwing out a number. Can we sit down for 15 minutes and figure out what would actually move the needle for you?',
      send_profile: 'Happy to send it across. To make sure I share what is actually relevant, do you currently get more inquiries through Instagram or Google?',
      busy_now: 'Completely understand. When is usually a quieter time of day for you — earlier morning or after 4 PM?'
    }
  }
}
