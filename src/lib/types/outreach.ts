export type OutreachChannel =
  | 'instagram_dm'
  | 'linkedin'
  | 'whatsapp'
  | 'cold_call'
  | 'referral'
  | 'email'
  | 'event'
  | 'walk_in'

export type OutreachStatus =
  | 'sent'
  | 'no_reply'
  | 'reply_received'
  | 'replied_interested'
  | 'replied_objection'
  | 'ready_for_call'
  | 'called'
  | 'meeting_booked'

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

export const CHANNEL_CONFIG: Record<OutreachChannel, { label: string; emoji: string; placeholder: string; handleLabel: string }> = {
  instagram_dm: { label: 'Instagram DM',  emoji: 'instagram', placeholder: '@username',        handleLabel: 'Instagram Handle' },
  linkedin:     { label: 'LinkedIn',       emoji: 'linkedin',  placeholder: 'linkedin.com/in/…', handleLabel: 'LinkedIn Profile' },
  whatsapp:     { label: 'WhatsApp',       emoji: 'whatsapp', placeholder: '+968 …',            handleLabel: 'WhatsApp Number'  },
  cold_call:    { label: 'Cold Call',      emoji: 'phone',    placeholder: '+968 …',            handleLabel: 'Phone Number'     },
  referral:     { label: 'Referral',       emoji: 'handshake',placeholder: 'Referred by…',     handleLabel: 'Referred By'      },
  email:        { label: 'Email',          emoji: 'email',    placeholder: 'email@company.com', handleLabel: 'Email Address'    },
  event:        { label: 'Event / Expo',   emoji: 'event',    placeholder: 'Event name',        handleLabel: 'Event Name'       },
  walk_in:      { label: 'Walk-in',        emoji: 'walkin',   placeholder: 'Location / branch', handleLabel: 'Location'         },
}

export const STATUS_CONFIG: Record<OutreachStatus, { label: string; color: string; next?: OutreachStatus }> = {
  sent:               { label: 'Reached Out',     color: 'blue',    next: 'reply_received'    },
  no_reply:           { label: 'No Reply',         color: 'slate',   next: 'sent'              },
  reply_received:     { label: 'Reply Received',   color: 'indigo',  next: 'replied_interested'},
  replied_interested: { label: 'Interested',       color: 'emerald', next: 'ready_for_call'    },
  replied_objection:  { label: 'Objection',        color: 'amber',   next: 'ready_for_call'    },
  ready_for_call:     { label: 'Ready for Call',   color: 'teal',    next: 'called'            },
  called:             { label: 'Called',           color: 'violet',  next: 'meeting_booked'    },
  meeting_booked:     { label: 'Meeting Booked',   color: 'pink'                               },
}

export const TEMPLATE_LABELS: Record<OutreachTemplate, string> = {
  growth_offer:   'Growth Offer',
  free_website:   'Free Website Audit',
  digital_audit:  'Digital Audit',
  referral:       'Referral Mention',
  event_followup: 'Event Follow-up',
  custom:         'Custom Message',
  approach_a:     'Approach A (Relationship)',
  approach_b:     'Approach B (Insight)',
  approach_c:     'Approach C (Trigger)',
  approach_d:     'Approach D (Value)',
}

export interface OutreachLead {
  id: string
  company_id: string
  company_name: string
  industry: string
  phone: string | null
  channel: OutreachChannel
  handle: string
  template_used: OutreachTemplate
  status: OutreachStatus
  prospect_reply: string
  pain_point: string
  call_opening_line: string
  notes: string
  sent_at: string
  updated_at: string
}
