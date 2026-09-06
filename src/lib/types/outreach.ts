export type OutreachChannel =
  | 'instagram_dm'
  | 'linkedin'
  | 'whatsapp'
  | 'cold_call'
  | 'referral'
  | 'email'
  | 'event'
  | 'walk_in'

export type OutreachStage =
  | 'gate_opener_staged'
  | 'gate_opener_sent'      // Stage 1: Sent (3-day clock active)
  | 'warm_up'               // Stage 2: Prospect replied, building rapport (no pitch)
  | 'opening_identified'    // Stage 3: Pain / bottleneck revealed
  | 'coffee_invited'        // Stage 4: Casual Muscat coffee invited
  | 'meeting_booked'        // Stage 5: In-person meeting scheduled
  | 'follow_up_sent'        // Stage 6: High-value observation follow-up
  | 'proposal_requested'    // Stage 7: Transformation proposal requested
  | 'not_now_snoozed'       // 60-Day Snooze (Rule of 3 touches)
  | 'agency_existing'       // Working with existing agency (evaluating results)

// Legacy alias for backwards compatibility
export type OutreachStatus = OutreachStage | 'sent' | 'no_reply' | 'reply_received' | 'replied_interested' | 'replied_objection' | 'ready_for_call' | 'called'

export type SectorCategory =
  | 'aesthetic_clinics'
  | 'dental_clinics'
  | 'social_commerce_dtc'
  | 'training_education'
  | 'hospitality_fnb'
  | 'general'

export type OutreachTemplate =
  | 'growth_offer'
  | 'free_website'
  | 'digital_audit'
  | 'referral'
  | 'event_followup'
  | 'custom'
  | 'approach_a'
  | 'approach_b'
  | 'approach_c'
  | 'approach_d'
  | 'gate_opener'

export const SECTOR_CONFIG: Record<SectorCategory, { label: string; emoji: string; targetPersona: string; primaryProblem: string }> = {
  aesthetic_clinics:   { label: 'Aesthetic & Derma Clinics', emoji: '', targetPersona: 'Owner-Doctor (Cosmetic MD)',   primaryProblem: 'DM inquiry drop-off & no-shows' },
  dental_clinics:      { label: 'Dental Clinics',            emoji: '', targetPersona: 'Owner-Dentist',                 primaryProblem: 'Unanswered calls & Google visibility' },
  social_commerce_dtc: { label: 'Social-Commerce & DTC',     emoji: '', targetPersona: 'Founder / Brand Owner',        primaryProblem: 'WhatsApp order chaos & manual payments' },
  training_education:  { label: 'Training & Education',      emoji: '', targetPersona: 'Institute Director / BD Head',  primaryProblem: 'Batch enrollment scramble & 1.2% levy' },
  hospitality_fnb:     { label: 'Hospitality & Premium F&B', emoji: '', targetPersona: 'General Manager / Owner',       primaryProblem: '15-25% OTA commissions & weekday slump' },
  general:             { label: 'General SME',               emoji: '', targetPersona: 'Business Owner',               primaryProblem: 'Customer acquisition & systems' },
}

export const CHANNEL_CONFIG: Record<OutreachChannel, { label: string; emoji: string; placeholder: string; handleLabel: string; actionLabel: string }> = {
  instagram_dm: { label: 'Instagram DM',  emoji: '', placeholder: '@username',        handleLabel: 'Instagram Handle', actionLabel: 'Open IG & Copy' },
  whatsapp:     { label: 'WhatsApp',       emoji: '', placeholder: '+968 …',            handleLabel: 'WhatsApp Number',  actionLabel: 'Launch WhatsApp' },
  linkedin:     { label: 'LinkedIn',       emoji: '', placeholder: 'linkedin.com/in/…', handleLabel: 'LinkedIn Profile', actionLabel: 'Open LinkedIn & Copy' },
  cold_call:    { label: 'Cold Call',      emoji: '', placeholder: '+968 …',            handleLabel: 'Phone Number',     actionLabel: 'Call + Script' },
  email:        { label: 'Email',          emoji: '', placeholder: 'email@company.com', handleLabel: 'Email Address',    actionLabel: 'Open Mail & Copy' },
  referral:     { label: 'Referral',       emoji: '', placeholder: 'Referred by…',     handleLabel: 'Referred By',      actionLabel: 'Log Referral' },
  event:        { label: 'Event / Expo',   emoji: '', placeholder: 'Event name',        handleLabel: 'Event Name',       actionLabel: 'Log Touch' },
  walk_in:      { label: 'Walk-in',        emoji: '', placeholder: 'Location / branch', handleLabel: 'Location',         actionLabel: 'Log Visit' },
}

export const STAGE_CONFIG: Record<OutreachStage, { label: string; shortLabel: string; color: string; stepNumber: number; badgeColor: string; description: string }> = {
  gate_opener_staged: { label: '1. Opener Staged',      shortLabel: 'Staged',   color: 'slate',   stepNumber: 1, badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',   description: 'Researched & ready for initial dispatch' },
  gate_opener_sent:   { label: '1. Gate-Opener Sent',   shortLabel: 'Sent',     color: 'blue',    stepNumber: 1, badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',       description: 'Initial touch sent. 3-day follow-up clock active.' },
  warm_up:            { label: '2. Warm-Up In Progress', shortLabel: 'Warm-Up', color: 'indigo',  stepNumber: 2, badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200', description: 'Prospect replied. Building rapport with no pitch.' },
  opening_identified: { label: '3. Opening Identified',  shortLabel: 'Opening',  color: 'amber',   stepNumber: 3, badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',   description: 'Bottleneck or frustration revealed. Ready for coffee invite.' },
  coffee_invited:     { label: '4. Coffee Invited',     shortLabel: 'Coffee Inv', color: 'orange', stepNumber: 4, badgeColor: 'bg-orange-100 text-orange-800 border-orange-200', description: 'Casual Muscat coffee/sit-down invitation sent.' },
  meeting_booked:     { label: '5. Meeting Scheduled',  shortLabel: 'Meeting',  color: 'emerald', stepNumber: 5, badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200', description: 'In-person meeting or coffee booked.' },
  follow_up_sent:     { label: '6. Post-Meeting Value', shortLabel: 'Follow-Up', color: 'teal',    stepNumber: 6, badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',       description: 'Useful insight/observation sent following meeting.' },
  proposal_requested: { label: '7. Proposal Requested', shortLabel: 'Proposal', color: 'purple',  stepNumber: 7, badgeColor: 'bg-purple-100 text-purple-800 border-purple-200', description: 'Transformation proposal requested.' },
  not_now_snoozed:    { label: '60-Day Snooze',         shortLabel: 'Snoozed',  color: 'zinc',    stepNumber: 0, badgeColor: 'bg-zinc-100 text-zinc-600 border-zinc-200',       description: '3 touches reached or requested pause. Revisit in 60 days.' },
  agency_existing:    { label: 'Has Existing Agency',   shortLabel: 'Agency',   color: 'cyan',    stepNumber: 0, badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',       description: 'Working with agency; evaluating commercial ROI.' },
}

// Backwards compatibility map
export const STATUS_CONFIG: Record<string, { label: string; color: string; next?: string }> = {
  gate_opener_staged: { label: 'Opener Staged', color: 'slate', next: 'gate_opener_sent' },
  gate_opener_sent:   { label: 'Gate-Opener Sent', color: 'blue', next: 'warm_up' },
  warm_up:            { label: 'Warm-Up', color: 'indigo', next: 'opening_identified' },
  opening_identified: { label: 'Opening Identified', color: 'amber', next: 'coffee_invited' },
  coffee_invited:     { label: 'Coffee Invited', color: 'orange', next: 'meeting_booked' },
  meeting_booked:     { label: 'Meeting Booked', color: 'emerald', next: 'proposal_requested' },
  follow_up_sent:     { label: 'Follow-Up Sent', color: 'teal' },
  proposal_requested: { label: 'Proposal Requested', color: 'purple' },
  not_now_snoozed:    { label: '60d Snooze', color: 'zinc' },
  agency_existing:    { label: 'Has Agency', color: 'cyan' },
  sent:               { label: 'Gate-Opener Sent', color: 'blue', next: 'warm_up' },
  no_reply:           { label: 'No Reply (Touch 2 Due)', color: 'slate', next: 'gate_opener_sent' },
  reply_received:     { label: 'Warm-Up (Replied)', color: 'indigo', next: 'opening_identified' },
  replied_interested: { label: 'Opening Identified', color: 'amber', next: 'coffee_invited' },
  replied_objection:  { label: 'Objection Received', color: 'amber', next: 'coffee_invited' },
  ready_for_call:     { label: 'Ready for Call', color: 'teal', next: 'called' },
  called:             { label: 'Called', color: 'violet', next: 'meeting_booked' },
}

export const TEMPLATE_LABELS: Record<OutreachTemplate, string> = {
  gate_opener:    'TTT Warm Gate-Opener',
  approach_a:     'Approach A (Relationship)',
  approach_b:     'Approach B (Insight)',
  approach_c:     'Approach C (Trigger)',
  approach_d:     'Approach D (Value)',
  growth_offer:   'Growth Offer',
  free_website:   'Free Website Audit',
  digital_audit:  'Digital Audit',
  referral:       'Referral Mention',
  event_followup: 'Event Follow-up',
  custom:         'Custom Message',
}

export interface PreStagedSequence {
  touch_1: {
    channel: OutreachChannel
    message: string
    specific_observation: string
    target_name: string
  }
  touch_2?: {
    channel: OutreachChannel
    message: string
    day_delay: number
    value_asset: string
  }
  touch_3?: {
    channel: OutreachChannel
    message: string
    day_delay: number
    is_final_touch: boolean
  }
  cold_call_script?: {
    opener: string
    context_bridge: string
    close_for_coffee: string
  }
  objection_pack?: {
    has_agency: string
    how_much: string
    what_do_you_do: string
    not_right_now: string
  }
}

export interface OutreachLead {
  id: string
  company_id: string
  company_name: string
  contact_name?: string
  contact_title?: string
  industry: string
  sector?: SectorCategory
  phone: string | null
  instagram_handle?: string | null
  linkedin_url?: string | null
  email?: string | null
  channel: OutreachChannel
  handle: string
  template_used: OutreachTemplate
  status: OutreachStatus
  stage?: OutreachStage
  touch_count?: number
  specific_observation?: string
  prospect_reply: string
  pain_point: string
  call_opening_line: string
  notes: string
  staged_sequence?: PreStagedSequence
  sent_at: string
  updated_at: string
}
