'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface CategoryPlaybook {
  category: string
  pain_points: string
  tone_notes: string
  angle_examples: string
}

export interface OutreachDraftResult {
  prospectId: string
  companyName: string
  draftMessage?: string
  angleReasoning?: string
  status: 'ready_to_send' | 'pending' | 'skipped' | 'error'
  reason?: string
}

// Built-in Researched Oman Category Playbooks (Fallback & Seed)
const DEFAULT_CATEGORY_PLAYBOOKS: Record<string, CategoryPlaybook> = {
  dental_clinics: {
    category: 'dental_clinics',
    pain_points: 'High patient no-shows, peak hours reception overload, manual appointment reminders, missed WhatsApp inquiries from prospective patients after hours.',
    tone_notes: 'Warm, professional, compliment-first. Peer-to-peer B2B tone for clinic owner/lead dentist; value-offer observation for clinic manager. Zero hard service pitch.',
    angle_examples: '1) Compliment their clinical reputation / patient care quality in Oman.\n2) Share observation about how top dental practices handle after-hours WhatsApp inquiries.'
  },
  aesthetic_clinics: {
    category: 'aesthetic_clinics',
    pain_points: 'High consultation cancellation rate, slow response to Instagram DM price inquiries, managing VIP client privacy, difficulty re-engaging seasonal treatment clients.',
    tone_notes: 'Warm, premium, polished, compliment-first. Aesthetic B2B framing. Respectful and relationship-led.',
    angle_examples: '1) Admire their treatment portfolio / aesthetic branding.\n2) Note how leading aesthetic lounges streamline VIP booking inquiries on IG/WhatsApp.'
  },
  perfume_shops: {
    category: 'perfume_shops',
    pain_points: 'Inventory turnover speed, seasonal fragrance campaign spikes, customer retention for signature blends, converting Instagram followers into foot traffic.',
    tone_notes: 'Warm, culturally resonant (Omani heritage & fragrance pride), compliment-first. Peer-to-peer for luxury perfume house founders.',
    angle_examples: '1) Praising their blend craft or showroom presentation in Muscat/Salalah.\n2) Observing how boutique perfumers build repeat customer loyalty through instant WhatsApp concierge.'
  },
  boutiques_fashion: {
    category: 'boutiques_fashion',
    pain_points: 'Sourcing delay inquiries, managing custom order sizing via DM, impulse shopper abandonment, Eid / wedding season rush congestion.',
    tone_notes: 'Warm, stylish, encouraging, compliment-first. Conversational and relationship-focused.',
    angle_examples: '1) Complimenting their latest collection design or Instagram aesthetic.\n2) Noticing how top Oman fashion boutiques keep high-intent shoppers engaged over DM.'
  },
  womens_spas: {
    category: 'womens_spas',
    pain_points: 'Weekend booking bottlenecks, last-minute cancellation slot filling, therapist schedule balancing, re-engaging membership clients.',
    tone_notes: 'Warm, calming, hospitable, compliment-first. Respectful of privacy and service quality.',
    angle_examples: '1) Appreciating their serene atmosphere and high client satisfaction ratings.\n2) Observing how premier wellness spas fill last-minute appointment cancellations effortlessly.'
  }
}

/**
 * Normalizes input industry/category string to one of the valid playbook keys
 */
export async function normalizeCategory(catStr?: string | null): Promise<string | null> {
  if (!catStr || typeof catStr !== 'string') return null
  const cleaned = catStr.toLowerCase().trim()
  if (!cleaned || cleaned === 'null' || cleaned === 'undefined') return null

  if (cleaned.includes('dental') || cleaned.includes('teeth') || cleaned.includes('dentist')) return 'dental_clinics'
  if (cleaned.includes('aesthetic') || cleaned.includes('derma') || cleaned.includes('cosmetic')) return 'aesthetic_clinics'
  if (cleaned.includes('perfume') || cleaned.includes('oud') || cleaned.includes('fragrance')) return 'perfume_shops'
  if (cleaned.includes('boutique') || cleaned.includes('fashion') || cleaned.includes('clothing') || cleaned.includes('retail')) return 'boutiques_fashion'
  if (cleaned.includes('spa') || cleaned.includes('wellness') || cleaned.includes('salon') || cleaned.includes('beauty lounge')) return 'womens_spas'

  return null
}

/**
 * Fetches category playbook from database or default seed map
 */
export async function getCategoryPlaybook(category: string): Promise<CategoryPlaybook | null> {
  const norm = (await normalizeCategory(category)) || category
  try {
    const { data } = await supabase
      .from('category_playbooks')
      .select('*')
      .eq('category', norm)
      .maybeSingle()

    if (data) return data
  } catch (err) {
    // Ignore db missing table error and use fallback
  }

  return DEFAULT_CATEGORY_PLAYBOOKS[norm] || null
}

/**
 * Calls LLM API (Groq/Claude/OpenAI) to generate an autonomous outreach message
 */
async function callOutreachLLM(systemPrompt: string, userPrompt: string): Promise<{ draft_message: string; angle_reasoning: string } | null> {
  try {
    let rawText = ''

    if (process.env.GROQ_API_KEY) {
      const { groq } = await import('@ai-sdk/groq')
      const { generateText } = await import('ai')
      const result = await generateText({
        model: groq('llama-3.3-70b-versatile'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7
      })
      rawText = result.text
    } else if (process.env.OPENAI_API_KEY) {
      const { createOpenAI } = await import('@ai-sdk/openai')
      const { generateText } = await import('ai')
      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const result = await generateText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7
      })
      rawText = result.text
    } else {
      console.warn("No LLM API key configured for outreach generator.")
      return null
    }

    // Parse JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.draft_message && parsed.angle_reasoning) {
        return {
          draft_message: parsed.draft_message.trim(),
          angle_reasoning: parsed.angle_reasoning.trim()
        }
      }
    }
    return null
  } catch (err) {
    console.error("LLM Call Error in outreach generator:", err)
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
    let researchData: any = prospect.research_json || null
    if (!researchData && prospect.notes) {
      try {
        if (prospect.notes.startsWith('{') || prospect.notes.startsWith('[')) {
          researchData = JSON.parse(prospect.notes)
        }
      } catch (e) {
        // Not JSON
      }
    }
    const researchText = prospect.research_notes || (typeof researchData === 'object' ? JSON.stringify(researchData) : prospect.notes) || ""

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
- Worked Angle Examples: ${playbook.angle_examples}

Generate the strict JSON response now:`

    // Call LLM
    const llmResult = await callOutreachLLM(systemPrompt, userPrompt)
    if (!llmResult) {
      return { prospectId, companyName, status: 'error', reason: 'LLM failed to generate draft' }
    }

    const { draft_message, angle_reasoning } = llmResult
    const generatedAt = new Date().toISOString()

    // 4. Save back to Supabase prospect row
    // Write to columns if present, plus fallback in notes JSON
    const updatePayload: Record<string, any> = {
      draft_message,
      draft_angle_reasoning: angle_reasoning,
      draft_status: 'ready_to_send',
      generated_at: generatedAt,
      category: categoryKey,
      gatekeeper_type: gatekeeperType,
      updated_at: generatedAt
    }

    // Attempt Supabase update
    const { error: updateErr } = await supabase
      .from('companies')
      .update(updatePayload)
      .eq('id', prospectId)

    if (updateErr) {
      // Fallback: Embed draft in notes JSON if new columns are not yet active in Postgres cache
      const draftNoteTag = `\n\n[AUTONOMOUS DRAFT MESSAGE]\n${draft_message}\n\n[ANGLE REASONING]\n${angle_reasoning}`;
      await supabase
        .from('companies')
        .update({
          notes: (prospect.notes || '') + draftNoteTag,
          updated_at: generatedAt
        })
        .eq('id', prospectId)
    }

    return {
      prospectId,
      companyName,
      draftMessage: draft_message,
      angleReasoning: angle_reasoning,
      status: 'ready_to_send'
    }
  } catch (err) {
    console.error(`Error generating outreach message for prospect ${prospectId}:`, err)
    return { prospectId, companyName: 'Unknown', status: 'error', reason: err instanceof Error ? err.message : 'Generation failed' }
  }
}

/**
 * Batch entry point: Finds all prospects with draft_status = 'pending' (or null)
 * that have research_json/research notes present, and generates drafts for each.
 */
export async function generateForNewProspects(): Promise<OutreachDraftResult[]> {
  try {
    const { data: prospects, error } = await supabase
      .from('companies')
      .select('id, company_name, research_json, research_notes, notes, category, industry, draft_status')

    if (error || !prospects) {
      console.error("Failed to query prospects for batch generation:", error?.message)
      return []
    }

    // Filter prospects that have research data and are pending
    const eligibleProspects = prospects.filter(p => {
      const hasResearch = Boolean(p.research_json || p.research_notes || (p.notes && p.notes.length > 15))
      const isPending = !p.draft_status || p.draft_status === 'pending'
      return hasResearch && isPending
    })

    console.log(`[Batch Generation] Found ${eligibleProspects.length} eligible prospects with research data for draft generation.`)

    const results: OutreachDraftResult[] = []
    for (const p of eligibleProspects) {
      const result = await generateOutreachMessage(p.id)
      results.push(result)
    }

    return results
  } catch (err) {
    console.error("Error in generateForNewProspects batch execution:", err)
    return []
  }
}
