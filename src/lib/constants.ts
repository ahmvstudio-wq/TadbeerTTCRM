export const COMPANY_STATUSES = {
  prospect: { label: "Prospect", color: "bg-slate-100 text-slate-700" },
  contacted: { label: "Contacted", color: "bg-blue-100 text-blue-700" },
  in_call_queue: { label: "In Call Queue", color: "bg-amber-100 text-amber-700" },
  meeting_booked: { label: "Meeting Booked", color: "bg-purple-100 text-purple-700" },
  opportunity: { label: "Opportunity", color: "bg-teal-100 text-teal-700" },
  won: { label: "Won", color: "bg-emerald-100 text-emerald-700" },
  lost: { label: "Lost", color: "bg-red-100 text-red-700" },
  dormant: { label: "Dormant", color: "bg-neutral-100 text-neutral-600" },
} as const;

export type CompanyStatus = keyof typeof COMPANY_STATUSES;

export const OUTREACH_CHANNELS = {
  whatsapp: { label: "WhatsApp", color: "bg-green-100 text-green-700" },
  linkedin: { label: "LinkedIn", color: "bg-blue-100 text-blue-700" },
  email: { label: "Email", color: "bg-slate-100 text-slate-700" },
} as const;

export type OutreachChannel = keyof typeof OUTREACH_CHANNELS;

export const PREPARATION_STATUSES = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-700" },
  ready: { label: "Ready", color: "bg-amber-100 text-amber-700" },
  sent: { label: "Sent", color: "bg-green-100 text-green-700" },
} as const;

export const CALL_OUTCOMES = {
  no_answer: { label: "No Answer", color: "bg-slate-100 text-slate-700" },
  left_voicemail: { label: "Left Voicemail", color: "bg-blue-100 text-blue-700" },
  connected: { label: "Connected", color: "bg-green-100 text-green-700" },
  wrong_number: { label: "Wrong Number", color: "bg-red-100 text-red-700" },
  callback_requested: { label: "Callback Requested", color: "bg-amber-100 text-amber-700" },
  do_not_call: { label: "Do Not Call", color: "bg-red-100 text-red-700" },
} as const;

export type CallOutcome = keyof typeof CALL_OUTCOMES;

export const OPPORTUNITY_STAGES = {
  qualified: { label: "Qualified", color: "bg-blue-100 text-blue-700", order: 1 },
  proposal_sent: { label: "Proposal Sent", color: "bg-amber-100 text-amber-700", order: 2 },
  negotiation: { label: "Negotiation", color: "bg-purple-100 text-purple-700", order: 3 },
  verbal_commit: { label: "Verbal Commit", color: "bg-teal-100 text-teal-700", order: 4 },
  won: { label: "Won", color: "bg-emerald-100 text-emerald-700", order: 5 },
  lost: { label: "Lost", color: "bg-red-100 text-red-700", order: 6 },
} as const;

export type OpportunityStage = keyof typeof OPPORTUNITY_STAGES;

export const FOLLOW_UP_CHANNELS = {
  call: { label: "Call", icon: "Phone" },
  email: { label: "Email", icon: "Mail" },
  whatsapp: { label: "WhatsApp", icon: "MessageCircle" },
  linkedin: { label: "LinkedIn", icon: "ExternalLink" },
  meeting: { label: "Meeting", icon: "Calendar" },
} as const;

export const ACTIVITY_TYPES = {
  note: { label: "Note", icon: "FileText", color: "text-slate-500" },
  whatsapp_sent: { label: "WhatsApp Sent", icon: "MessageCircle", color: "text-green-600" },
  linkedin_sent: { label: "LinkedIn Sent", icon: "ExternalLink", color: "text-blue-600" },
  email_sent: { label: "Email Sent", icon: "Mail", color: "text-slate-600" },
  call_made: { label: "Call Made", icon: "Phone", color: "text-amber-600" },
  call_received: { label: "Call Received", icon: "PhoneIncoming", color: "text-green-600" },
  meeting_booked: { label: "Meeting Booked", icon: "Calendar", color: "text-purple-600" },
  meeting_completed: { label: "Meeting Completed", icon: "CalendarCheck", color: "text-emerald-600" },
  status_changed: { label: "Status Changed", icon: "ArrowRightLeft", color: "text-slate-500" },
  opportunity_created: { label: "Opportunity Created", icon: "TrendingUp", color: "text-teal-600" },
  opportunity_stage_changed: { label: "Stage Changed", icon: "ArrowRightLeft", color: "text-purple-600" },
  follow_up_scheduled: { label: "Follow-up Scheduled", icon: "Clock", color: "text-blue-600" },
  follow_up_completed: { label: "Follow-up Completed", icon: "CheckCircle", color: "text-emerald-600" },
  follow_up_overdue: { label: "Follow-up Overdue", icon: "AlertTriangle", color: "text-red-600" },
} as const;

export const SERVICE_LINES = [
  "Software Solutions",
  "AI Technology",
  "Digital Marketing",
  "Human Capital",
] as const;

export type UserRole = "admin" | "bd_rep" | "closer";

export const USER_ROLES: Record<UserRole, { label: string }> = {
  admin: { label: "Admin" },
  bd_rep: { label: "BD Rep" },
  closer: { label: "Closer" },
};

export const DAILY_OUTREACH_TARGET = 10;
