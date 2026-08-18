import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

import { type PreStagedSequence, type SectorCategory, type OutreachChannel } from '@/lib/types/outreach'

export interface CategoryPlaybook {
  category: SectorCategory
  label: string
  target_persona: string
  pain_points: string
  tone_notes: string
  gate_opener_template: string
  touch_2_template: string
  touch_3_template: string
  cold_call_framework: {
    opener: string
    bridge: string
    close_coffee: string
  }
}

export interface OutreachDraftResult {
  prospectId: string
  companyName: string
  draftMessage?: string
  angleReasoning?: string
  stagedSequence?: PreStagedSequence
  status: 'ready_to_send' | 'pending' | 'skipped' | 'error'
  reason?: string
}

// ─── 5 Researched Oman Category Playbooks (TTT Operating System V3) ───────────
export const TTT_CATEGORY_PLAYBOOKS: Record<SectorCategory, CategoryPlaybook> = {
  aesthetic_clinics: {
    category: 'aesthetic_clinics',
    label: 'Aesthetic & Derma Clinics',
    target_persona: 'Owner-Doctor (Dermatologist / Cosmetic MD)',
    pain_points: 'Inquiry leakage in Instagram DMs, receptionist overwhelmed by price messages, consultation no-shows, competing with new clinics on price.',
    tone_notes: 'Warm, respectful, compliment-first on specific clinical work. Peer-to-peer B2B tone. Zero hard service pitch. No AI/tech buzzwords.',
    gate_opener_template: 'Dr [Name], your work on [specific observation] is really impressive — the results speak for themselves. Quick question: do most of your new patients find you through Instagram or through Google search? I work in healthcare marketing in Muscat and I am always curious what is actually working best for clinics here.',
    touch_2_template: 'Dr [Name], hope your week is going well. I was looking into how leading clinics in Muscat handle high-volume DM price inquiries without adding front-desk staff, and thought of [Company]. Happy to share what we observed if useful.',
    touch_3_template: 'Dr [Name], I will leave it here for now so I don’t clutter your inbox. Wishing you and the clinic team continued success — always happy to stay connected.',
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
    touch_3_template: 'Ahlan Dr [Name], will keep it brief and leave it here. If local visibility or patient booking flows ever become a priority for [Company], feel free to reach out anytime.',
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
    touch_3_template: 'Assalamu Alaikum [Name], leaving this here so I don’t take up your evening. Wishing [Company] continued growth with the upcoming drops!',
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
    touch_3_template: 'Ahlan [Name], I’ll leave it here for now. Wishing [Company] a full and successful upcoming intake batch.',
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
    touch_3_template: 'Ahlan [Name], I’ll leave it here so I don’t crowd your schedule. Wishing [Company] a packed and profitable season ahead.',
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
    touch_3_template: 'Assalamu Alaikum [Name], will leave it here. Wishing [Company] all the best with continued growth.',
    cold_call_framework: {
      opener: 'Assalamu Alaikum [Name], this is from Tadbeer Transformations in Muscat. Noticed [specific observation] at [Company]. Have 30 seconds?',
      bridge: 'We help local Omani businesses get more customers through better marketing and smoother inquiry workflows.',
      close_coffee: 'Can I buy you a quick coffee this week in Muscat to share what we’ve seen working?'
    }
  }
}

/**
 * Fetches category playbook by category key
 */
export function getCategoryPlaybook(categoryKey: string) {
  return TTT_CATEGORY_PLAYBOOKS[categoryKey as SectorCategory] || TTT_CATEGORY_PLAYBOOKS.general
}

/**
 * Normalizes input industry/category string to one of the 5 valid TTT playbook keys
 */
export async function normalizeCategory(catStr?: string | null): Promise<SectorCategory> {
  if (!catStr || typeof catStr !== 'string') return 'general'
  const cleaned = catStr.toLowerCase().trim()
  if (!cleaned || cleaned === 'null' || cleaned === 'undefined') return 'general'

  if (cleaned.includes('dental') || cleaned.includes('teeth') || cleaned.includes('dentist')) return 'dental_clinics'
  if (cleaned.includes('aesthetic') || cleaned.includes('derma') || cleaned.includes('cosmetic') || cleaned.includes('clinic') || cleaned.includes('skin')) return 'aesthetic_clinics'
  if (cleaned.includes('perfume') || cleaned.includes('oud') || cleaned.includes('fragrance') || cleaned.includes('boutique') || cleaned.includes('fashion') || cleaned.includes('clothing') || cleaned.includes('retail') || cleaned.includes('dtc') || cleaned.includes('coffee') || cleaned.includes('cafe')) return 'social_commerce_dtc'
  if (cleaned.includes('training') || cleaned.includes('education') || cleaned.includes('institute') || cleaned.includes('academy') || cleaned.includes('course') || cleaned.includes('school')) return 'training_education'
  if (cleaned.includes('hotel') || cleaned.includes('resort') || cleaned.includes('restaurant') || cleaned.includes('hospitality') || cleaned.includes('dining') || cleaned.includes('cafe') || cleaned.includes('f&b')) return 'hospitality_fnb'

  return 'general'
}

/**
 * Deterministically constructs full pre-staged sequence for a prospect
 */
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
  const obs = observation && observation.trim() ? observation.trim() : 'your recent business growth'

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
      day_delay: 3,
      value_asset: 'Sector Observation Note',
    },
    touch_3: {
      channel,
      message: fill(playbook.touch_3_template),
      day_delay: 5,
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
      what_do_you_do: `We help ${playbook.label} in Oman get more customers through better marketing and smoother inquiry systems — ensuring inquiries turn into paying customers without operational chaos.`,
      not_right_now: 'Completely understood! If anything changes or if you ever want a second opinion in the future, I am always around. Wishing you and the team continued success.',
    },
  }
}

/**
 * Calls LLM API (Gemini 1.5 Flash / Groq / OpenAI) to generate or polish sequence
 */
async function callOutreachLLM(systemPrompt: string, userPrompt: string): Promise<string | null> {
  try {
    const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
    if (geminiKey) {
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google')
      const { generateText } = await import('ai')
      const google = createGoogleGenerativeAI({ apiKey: geminiKey })
      try {
        const result = await generateText({
          model: google('gemini-3.6-flash'),
          system: systemPrompt,
          prompt: userPrompt,
          temperature: 0.7,
        })
        return result.text
      } catch (gemErr) {
        console.warn('Gemini 3.6 flash fallback attempt:', gemErr)
        const result = await generateText({
          model: google('gemini-flash-latest'),
          system: systemPrompt,
          prompt: userPrompt,
          temperature: 0.7,
        })
        return result.text
      }
    }

    if (process.env.GROQ_API_KEY) {
      const { groq } = await import('@ai-sdk/groq')
      const { generateText } = await import('ai')
      const result = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
      })
      return result.text
    }

    if (process.env.OPENAI_API_KEY) {
      const { createOpenAI } = await import('@ai-sdk/openai')
      const { generateText } = await import('ai')
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const result = await generateText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
      })
      return result.text
    }

    return null
  } catch (err) {
    console.error('LLM Call Error in outreach generator:', err)
    return null
  }
}

/**
 * Generates an autonomous, research-grounded outreach draft for a single prospect
 */
export async function generateOutreachMessage(prospectId: string): Promise<OutreachDraftResult> {
  try {
    // 1. Fetch prospect details
    const { data: prospect, error } = await supabase
      .from('companies')
      .select('*, contacts(*)')
      .eq('id', prospectId)
      .single()

    if (error || !prospect) {
      return { prospectId, companyName: 'Unknown', status: 'error', reason: `Prospect ${prospectId} not found` }
    }

    const companyName = prospect.company_name
    const contact = prospect.contacts?.[0]
    const contactName = contact?.full_name || 'Partner'
    const contactTitle = contact?.title || 'Owner/Manager'

    // Extract research data
    let researchData: any = null
    if (prospect.research_json && typeof prospect.research_json === 'object' && Object.keys(prospect.research_json).length > 0) {
      researchData = prospect.research_json
    } else if (prospect.notes) {
      try {
        if (prospect.notes.startsWith('{') || prospect.notes.startsWith('[')) {
          researchData = JSON.parse(prospect.notes)
        }
      } catch (e) {
        // Not JSON
      }
    }

    const researchText = prospect.research_notes ||
      (researchData && (researchData.specific_observation || researchData.original_notes || JSON.stringify(researchData))) ||
      prospect.notes || ""

    // Step 3 Requirement: If research is missing, skip prospect, log why, leave at draft_status: 'pending'
    if (!researchText || researchText.trim().length < 15) {
      console.log(`[SKIP] Prospect "${companyName}" (${prospectId}) skipped: Missing research data. Status left as 'pending'.`)
      return { prospectId, companyName, status: 'skipped', reason: 'Missing research data' }
    }

    // Determine category
    const categoryKey = await normalizeCategory(prospect.category || prospect.industry)
    if (!categoryKey) {
      console.log(`[SKIP] Prospect "${companyName}" (${prospectId}) skipped: Category "${prospect.category || prospect.industry}" does not have a matching playbook row. Status left as 'pending'.`)
      return { prospectId, companyName, status: 'skipped', reason: `No playbook row for category '${prospect.category || prospect.industry}'` }
    }

    // 2. Fetch category playbook
    const playbook = await getCategoryPlaybook(categoryKey)
    if (!playbook) {
      console.log(`[SKIP] Prospect "${companyName}" (${prospectId}) skipped: No playbook found for category '${categoryKey}'. Status left as 'pending'.`)
      return { prospectId, companyName, status: 'skipped', reason: `No playbook row found for category '${categoryKey}'` }
    }

    // Determine gatekeeper type ('owner' vs 'manager')
    const titleLower = contactTitle.toLowerCase()
    const isOwner = titleLower.includes('owner') || titleLower.includes('founder') || titleLower.includes('ceo') || titleLower.includes('director') || titleLower.includes('partner') || titleLower.includes('proprietor')
    const gatekeeperType: 'owner' | 'manager' = isOwner ? 'owner' : (prospect.gatekeeper_type as any || 'owner')

    // 3. Build Framework Prompt
    const systemPrompt = `You are an expert Omani B2B outreach advisor. Your task is to generate a 100% personalized, warm, first-touch outreach message for a business in Oman based STRICTLY on real research details.

### CRITICAL OUTREACH FRAMEWORK RULES:
1. **NEVER SALES-FORWARD**: The opening message MUST be warm, relationship-led, and COMPLIMENT-FIRST, grounded in something specific and real from the research (not generic flattery).
2. **NO SERVICE PITCH**: Absolutely ZERO service pitch, ZERO mention of Tadbeer's offerings, AI, automation, or software in this first message. The ONLY goal of this message is to earn a friendly reply.
3. **GATEKEEPER-AWARE FRAMING**:
   - Gatekeeper: ${gatekeeperType.toUpperCase()}
   - If OWNER: Write business-to-business, direct, peer-to-peer, warm, suited for WhatsApp/DM.
   - If MANAGER: Offer a standalone value observation first (e.g. an audit-style compliment or observation), not an owner-to-owner pitch.
4. **OMANI/GULF CULTURAL FIT**: Direct pitches land poorly in Oman. Maintain a respectful, warm, honorable tone suitable for the Gulf market.
5. **CONSTRAINTS**:
   - Length: Exactly 2 to 4 sentences.
   - NO mention of AI, automation, research scripts, or sales tools.
   - ONLY goal is to start a warm conversation and earn a reply.

### STRICT JSON OUTPUT FORMAT:
You MUST respond with valid, parseable JSON matching this schema:
{
  "draft_message": "The exact 2-4 sentence personalized message text",
  "angle_reasoning": "Short 1-2 sentence note for the human reviewer explaining why this angle was chosen based on the research"
}`

    const userPrompt = `### UNTRUSTED PROSPECT REFERENCE DATA:
<prospect_record>
  <company_name>${companyName}</company_name>
  <contact_person>${contactName} (${contactTitle})</contact_person>
  <category>${categoryKey}</category>
  <gatekeeper_framing>${gatekeeperType}</gatekeeper_framing>
  <research_data>${String(researchText).substring(0, 3000)}</research_data>
</prospect_record>

Category Playbook Context:
- Category Pain Points: ${playbook.pain_points}
- Tone Guidance: ${playbook.tone_notes}

Generate the strict JSON response now:`

    // Call LLM or deterministic fallback
    let draft_message = ''
    let angle_reasoning = 'Researched angle tailored to Oman market'
    
    const rawText = await callOutreachLLM(systemPrompt, userPrompt)
    if (rawText) {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.draft_message) draft_message = parsed.draft_message.trim()
          if (parsed.angle_reasoning) angle_reasoning = parsed.angle_reasoning.trim()
        } catch (e) {
          // fallback
        }
      }
    }

    // Deterministic pre-staged sequence fallback / enrichment
    const deterministicSeq = buildDeterministicSequence(
      companyName,
      contactName,
      categoryKey,
      researchText.substring(0, 80),
      'whatsapp',
      prospect.city || 'Muscat'
    )

    if (!draft_message) {
      draft_message = deterministicSeq.touch_1.message
    } else {
      deterministicSeq.touch_1.message = draft_message
    }

    const generatedAt = new Date().toISOString()

    // 4. Save back to Supabase prospect row in notes JSON
    const mergedNotes = JSON.stringify({
      ...(typeof researchData === 'object' ? researchData : {}),
      staged_sequence: deterministicSeq,
      specific_observation: deterministicSeq.touch_1.specific_observation,
      category: categoryKey,
      gatekeeper_type: gatekeeperType,
      draft_message,
      draft_angle_reasoning: angle_reasoning,
    })

    const updatePayload: Record<string, any> = {
      notes: mergedNotes,
      industry: categoryKey,
      updated_at: generatedAt
    }

    await supabase
      .from('companies')
      .update(updatePayload)
      .eq('id', prospectId)

    return {
      prospectId,
      companyName,
      draftMessage: draft_message,
      angleReasoning: angle_reasoning,
      stagedSequence: deterministicSeq,
      status: 'ready_to_send'
    }
  } catch (err) {
    console.error(`Error generating outreach message for prospect ${prospectId}:`, err)
    return { prospectId, companyName: 'Unknown', status: 'error', reason: err instanceof Error ? err.message : 'Generation failed' }
  }
}

/**
 * Batch entry point: Finds all prospects with notes present and generates drafts
 */
export async function generateForNewProspects(): Promise<OutreachDraftResult[]> {
  try {
    const { data: prospects, error } = await supabase
      .from('companies')
      .select('id, company_name, notes, industry, status')

    if (error || !prospects) {
      console.warn("Prospects query note:", error?.message)
      return []
    }

    // Filter prospects that have research notes
    const eligibleProspects = prospects.filter(p => {
      return Boolean(p.notes && p.notes.length > 10)
    })

    const results: OutreachDraftResult[] = []
    for (const p of eligibleProspects.slice(0, 20)) {
      const result = await generateOutreachMessage(p.id)
      results.push(result)
    }

    return results
  } catch (err) {
    console.error("Error in generateForNewProspects batch execution:", err)
    return []
  }
}
