// ─── CANONICAL UNIFIED CRM PIPELINE STATUSES ────────────────────────────────
// Unified source of truth for Lead Workspace, Prospects Directory, and Outreach Center

export type StatusCategory = "outreach" | "conversation" | "pipeline" | "closed";

export interface UnifiedStatusConfig {
  id: string;
  label: string;
  shortLabel: string;
  category: StatusCategory;
  categoryLabel: string;
  badgeClass: string;
  dotColor: string;
  description: string;
  defaultFollowUpDays?: number | null; // e.g. 2 for reply_received, 3 for contacted/no_reply
}

export const UNIFIED_STATUSES: UnifiedStatusConfig[] = [
  // ─── 1. Outreach & Initial Contact ───────────────────────────────────────────
  {
    id: "prospect",
    label: "Prospect (New)",
    shortLabel: "New",
    category: "outreach",
    categoryLabel: "Outreach & Cold",
    badgeClass: "bg-slate-200 text-slate-900 border-slate-400 font-bold",
    dotColor: "bg-slate-500",
    description: "New account in directory, ready for initial gate-opener research & outreach.",
    defaultFollowUpDays: null,
  },
  {
    id: "contacted",
    label: "Contacted (Greeting Sent)",
    shortLabel: "Greeting",
    category: "outreach",
    categoryLabel: "Outreach & Cold",
    badgeClass: "bg-blue-100 text-blue-950 border-blue-400 font-bold",
    dotColor: "bg-blue-600",
    description: "Stage 1: Greeting message sent. Strict 2-day follow-up clock begins.",
    defaultFollowUpDays: 2,
  },
  {
    id: "no_reply",
    label: "No Reply (Follow-Up Due)",
    shortLabel: "No Reply",
    category: "outreach",
    categoryLabel: "Outreach & Cold",
    badgeClass: "bg-rose-100 text-rose-950 border-rose-300 font-bold",
    dotColor: "bg-rose-500",
    description: "No answer on touch. Next stage follow-up is due.",
    defaultFollowUpDays: 2,
  },
  {
    id: "follow_up_sent",
    label: "Follow-Up 1 Sent (Value Check-in)",
    shortLabel: "Follow-Up 1",
    category: "outreach",
    categoryLabel: "Outreach & Cold",
    badgeClass: "bg-teal-100 text-teal-950 border-teal-400 font-bold",
    dotColor: "bg-teal-600",
    description: "Stage 2: Value check-in sent. Strict 3-day follow-up clock to audit offer begins.",
    defaultFollowUpDays: 3,
  },
  {
    id: "audit_offered",
    label: "Audit Offered (Stage 3)",
    shortLabel: "Audit Offered",
    category: "outreach",
    categoryLabel: "Outreach & Cold",
    badgeClass: "bg-amber-100 text-amber-950 border-amber-500 font-bold",
    dotColor: "bg-amber-600",
    description: "Stage 3: Outside-in audit offered. Strict 5-day follow-up clock to coffee/call begins.",
    defaultFollowUpDays: 5,
  },
  {
    id: "voice_note_sent",
    label: "Voice Note Sent",
    shortLabel: "Voice Note",
    category: "outreach",
    categoryLabel: "Outreach & Cold",
    badgeClass: "bg-purple-100 text-purple-950 border-purple-400 font-bold",
    dotColor: "bg-purple-600",
    description: "Personalized voice note audio touch dispatched.",
    defaultFollowUpDays: 3,
  },

  // ─── 2. Active Conversations & Replies ───────────────────────────────────────
  {
    id: "reply_received",
    label: "Reply Received",
    shortLabel: "Replied",
    category: "conversation",
    categoryLabel: "Conversations & Replies",
    badgeClass: "bg-indigo-100 text-indigo-950 border-indigo-400 font-bold",
    dotColor: "bg-indigo-600",
    description: "Prospect responded! Rapid response and follow-up recommended within 2 days.",
    defaultFollowUpDays: 2,
  },
  {
    id: "warm_up",
    label: "Warm-Up In Progress",
    shortLabel: "Warm-Up",
    category: "conversation",
    categoryLabel: "Conversations & Replies",
    badgeClass: "bg-indigo-100 text-indigo-950 border-indigo-400 font-bold",
    dotColor: "bg-indigo-500",
    description: "Active two-way rapport building without direct pitch.",
    defaultFollowUpDays: 2,
  },
  {
    id: "opening_identified",
    label: "Opening Identified",
    shortLabel: "Opening",
    category: "conversation",
    categoryLabel: "Conversations & Replies",
    badgeClass: "bg-amber-100 text-amber-950 border-amber-400 font-bold",
    dotColor: "bg-amber-600",
    description: "Bottleneck, frustration, or growth goal revealed. Ready for coffee / call invite.",
    defaultFollowUpDays: 2,
  },
  {
    id: "audit_requested",
    label: "Share Audit Request (Audit Requested)",
    shortLabel: "Audit Req",
    category: "conversation",
    categoryLabel: "Conversations & Replies",
    badgeClass: "bg-amber-100 text-amber-950 border-amber-400 font-bold",
    dotColor: "bg-amber-600",
    description: "Prospect requested or accepted a free business/digital audit.",
    defaultFollowUpDays: 2,
  },
  {
    id: "audit_sent",
    label: "Audit Sent / Shared",
    shortLabel: "Audit Sent",
    category: "conversation",
    categoryLabel: "Conversations & Replies",
    badgeClass: "bg-teal-100 text-teal-950 border-teal-400 font-bold",
    dotColor: "bg-teal-600",
    description: "Custom audit report delivered. Follow-up due within 2 days.",
    defaultFollowUpDays: 2,
  },
  {
    id: "booking_link_sent",
    label: "Booking Link Sent (Awaiting Confirmation)",
    shortLabel: "Link Sent",
    category: "conversation",
    categoryLabel: "Conversations & Replies",
    badgeClass: "bg-emerald-100 text-emerald-950 border-emerald-500 font-bold",
    dotColor: "bg-emerald-600",
    description: "Meeting booking link sent to prospect. Follow-up due in 3 days if unconfirmed.",
    defaultFollowUpDays: 3,
  },
  {
    id: "portfolio_shared",
    label: "Portfolio / Sample Shared",
    shortLabel: "Sample Sent",
    category: "conversation",
    categoryLabel: "Conversations & Replies",
    badgeClass: "bg-sky-100 text-sky-950 border-sky-400 font-bold",
    dotColor: "bg-sky-600",
    description: "Case study, relevant work sample, or portfolio shared.",
    defaultFollowUpDays: 2,
  },
  {
    id: "objection",
    label: "Objection Raised / Handled",
    shortLabel: "Objection",
    category: "conversation",
    categoryLabel: "Conversations & Replies",
    badgeClass: "bg-amber-100 text-amber-950 border-amber-400 font-bold",
    dotColor: "bg-amber-500",
    description: "Pricing, timing, or trust objection raised. Apply playbook objection response.",
    defaultFollowUpDays: 2,
  },
  {
    id: "agency_existing",
    label: "Existing Agency (Evaluating)",
    shortLabel: "Agency",
    category: "conversation",
    categoryLabel: "Conversations & Replies",
    badgeClass: "bg-cyan-100 text-cyan-950 border-cyan-400 font-bold",
    dotColor: "bg-cyan-600",
    description: "Currently working with another agency; evaluating commercial ROI.",
    defaultFollowUpDays: 7,
  },

  // ─── 3. Pipeline, Calls & Meetings ──────────────────────────────────────────
  {
    id: "ready_for_call",
    label: "Ready for Call (Call Queue)",
    shortLabel: "Call Ready",
    category: "pipeline",
    categoryLabel: "Pipeline, Calls & Deals",
    badgeClass: "bg-teal-100 text-teal-950 border-teal-500 font-bold",
    dotColor: "bg-teal-600",
    description: "Lead verified and placed in Daily Cadence outbound call queue.",
    defaultFollowUpDays: 1,
  },
  {
    id: "called",
    label: "Called (In Cadence)",
    shortLabel: "Called",
    category: "pipeline",
    categoryLabel: "Pipeline, Calls & Deals",
    badgeClass: "bg-violet-100 text-violet-950 border-violet-400 font-bold",
    dotColor: "bg-violet-600",
    description: "Outbound call completed. Awaiting callback or next touch in cadence.",
    defaultFollowUpDays: 2,
  },
  {
    id: "call_scheduled",
    label: "Follow-Up Call Scheduled",
    shortLabel: "Call Sched",
    category: "pipeline",
    categoryLabel: "Pipeline, Calls & Deals",
    badgeClass: "bg-blue-100 text-blue-950 border-blue-500 font-bold",
    dotColor: "bg-blue-600",
    description: "Call appointment confirmed on calendar.",
    defaultFollowUpDays: 1,
  },
  {
    id: "coffee_invited",
    label: "Coffee Invited",
    shortLabel: "Coffee Inv",
    category: "pipeline",
    categoryLabel: "Pipeline, Calls & Deals",
    badgeClass: "bg-orange-100 text-orange-950 border-orange-400 font-bold",
    dotColor: "bg-orange-500",
    description: "Casual Muscat coffee or in-person sit-down proposed.",
    defaultFollowUpDays: 2,
  },
  {
    id: "meeting_booked",
    label: "Meeting Booked",
    shortLabel: "Meeting",
    category: "pipeline",
    categoryLabel: "Pipeline, Calls & Deals",
    badgeClass: "bg-purple-100 text-purple-950 border-purple-500 font-bold",
    dotColor: "bg-purple-600",
    description: "Discovery session or in-person meeting confirmed on calendar.",
    defaultFollowUpDays: 1,
  },
  {
    id: "opportunity",
    label: "Qualified Opportunity",
    shortLabel: "Opportunity",
    category: "pipeline",
    categoryLabel: "Pipeline, Calls & Deals",
    badgeClass: "bg-emerald-100 text-emerald-950 border-emerald-500 font-bold",
    dotColor: "bg-emerald-600",
    description: "High intent, validated decision-maker with real business budget.",
    defaultFollowUpDays: 2,
  },
  {
    id: "proposal_requested",
    label: "Proposal Requested",
    shortLabel: "Proposal Req",
    category: "pipeline",
    categoryLabel: "Pipeline, Calls & Deals",
    badgeClass: "bg-purple-100 text-purple-950 border-purple-400 font-bold",
    dotColor: "bg-purple-600",
    description: "Client requested tailored commercial proposal or transformation scope.",
    defaultFollowUpDays: 2,
  },
  {
    id: "proposal",
    label: "Proposal Sent",
    shortLabel: "Proposal Sent",
    category: "pipeline",
    categoryLabel: "Pipeline, Calls & Deals",
    badgeClass: "bg-violet-100 text-violet-950 border-violet-400 font-bold",
    dotColor: "bg-violet-600",
    description: "Proposal delivered. In active review and commercial closing.",
    defaultFollowUpDays: 2,
  },

  // ─── 4. Outcomes & Lifecycle ────────────────────────────────────────────────
  {
    id: "won",
    label: "Won (Deal Closed)",
    shortLabel: "Won",
    category: "closed",
    categoryLabel: "Outcomes & Lifecycle",
    badgeClass: "bg-emerald-700 text-white border-emerald-800 font-bold",
    dotColor: "bg-emerald-700",
    description: "Agreement signed, initial payment cleared, onboarded.",
    defaultFollowUpDays: null,
  },
  {
    id: "lost",
    label: "Lost",
    shortLabel: "Lost",
    category: "closed",
    categoryLabel: "Outcomes & Lifecycle",
    badgeClass: "bg-slate-900 text-white border-slate-950 font-bold",
    dotColor: "bg-slate-900",
    description: "Closed as lost, declined or disqualified.",
    defaultFollowUpDays: null,
  },
  {
    id: "dormant",
    label: "Dormant (60d Snooze)",
    shortLabel: "Snoozed",
    category: "closed",
    categoryLabel: "Outcomes & Lifecycle",
    badgeClass: "bg-gray-200 text-gray-800 border-gray-400 font-bold",
    dotColor: "bg-gray-500",
    description: "Rule of 3 touches reached or pause requested. Auto-revisit in 60 days.",
    defaultFollowUpDays: 60,
  },
];

// Status Map for O(1) lookups
export const UNIFIED_STATUS_MAP = new Map<string, UnifiedStatusConfig>(
  UNIFIED_STATUSES.map(s => [s.id, s])
);

// Alias mapping for backwards compatibility and human labels
export const STATUS_ALIAS_MAP: Record<string, string> = {
  gate_opener_staged: "prospect",
  new: "prospect",
  "prospect (new)": "prospect",
  gate_opener_sent: "contacted",
  sent: "contacted",
  "contacted (opener sent)": "contacted",
  "no reply": "no_reply",
  "no reply (follow-up due)": "no_reply",
  "follow-up sent": "follow_up_sent",
  "follow up sent": "follow_up_sent",
  replied: "reply_received",
  "reply received": "reply_received",
  "warm-up in progress": "warm_up",
  "warm up in progress": "warm_up",
  "warm-up": "warm_up",
  "warm up": "warm_up",
  "opening identified": "opening_identified",
  replied_interested: "opening_identified",
  interested: "opening_identified",
  audit_requested: "audit_requested",
  "audit requested": "audit_requested",
  "share the audit request": "audit_requested",
  "share audit request": "audit_requested",
  "share audit request (audit requested)": "audit_requested",
  "audit req": "audit_requested",
  audit_sent: "audit_sent",
  "audit sent": "audit_sent",
  "audit sent / shared": "audit_sent",
  portfolio_shared: "portfolio_shared",
  "portfolio / sample shared": "portfolio_shared",
  "sample shared": "portfolio_shared",
  "portfolio shared": "portfolio_shared",
  voice_note_sent: "voice_note_sent",
  "voice note sent": "voice_note_sent",
  call_scheduled: "call_scheduled",
  "call scheduled": "call_scheduled",
  "follow-up call scheduled": "call_scheduled",
  "objection raised": "objection",
  "objection raised / handled": "objection",
  replied_objection: "objection",
  "existing agency": "agency_existing",
  "existing agency (evaluating)": "agency_existing",
  has_agency: "agency_existing",
  in_call_queue: "ready_for_call",
  call_ready: "ready_for_call",
  "ready for call": "ready_for_call",
  "ready for call (call queue)": "ready_for_call",
  called: "called",
  "called (in cadence)": "called",
  "coffee invited": "coffee_invited",
  "meeting booked": "meeting_booked",
  "meeting scheduled": "meeting_booked",
  opportunity: "opportunity",
  "qualified opportunity": "opportunity",
  "proposal requested": "proposal_requested",
  proposal_sent: "proposal",
  "proposal sent": "proposal",
  "won (deal closed)": "won",
  won: "won",
  lost: "lost",
  "dormant (60d snooze)": "dormant",
  not_now_snoozed: "dormant",
  snoozed: "dormant",
  dormant: "dormant",
};

/**
 * Resolves any raw status string to a canonical UnifiedStatusConfig
 */
export function getUnifiedStatus(rawStatus?: string | null): UnifiedStatusConfig {
  if (!rawStatus) return UNIFIED_STATUSES[0];
  const clean = rawStatus.toLowerCase().trim();
  
  if (UNIFIED_STATUS_MAP.has(clean)) {
    return UNIFIED_STATUS_MAP.get(clean)!;
  }
  
  const aliasKey = STATUS_ALIAS_MAP[clean];
  if (aliasKey && UNIFIED_STATUS_MAP.has(aliasKey)) {
    return UNIFIED_STATUS_MAP.get(aliasKey)!;
  }

  // Fallback heuristics
  if (clean.includes("reply") || clean.includes("replied")) {
    return UNIFIED_STATUS_MAP.get("reply_received")!;
  }
  if (clean.includes("meet")) {
    return UNIFIED_STATUS_MAP.get("meeting_booked")!;
  }
  if (clean.includes("call")) {
    return UNIFIED_STATUS_MAP.get("ready_for_call")!;
  }
  if (clean.includes("propos")) {
    return UNIFIED_STATUS_MAP.get("proposal")!;
  }
  if (clean.includes("contact") || clean.includes("sent")) {
    return UNIFIED_STATUS_MAP.get("contacted")!;
  }
  if (clean.includes("lost")) {
    return UNIFIED_STATUS_MAP.get("lost")!;
  }
  if (clean.includes("won")) {
    return UNIFIED_STATUS_MAP.get("won")!;
  }

  return UNIFIED_STATUSES[0];
}

/**
 * Maps a unified status to the database `companies.status` CHECK constraint:
 * ('prospect', 'contacted', 'in_call_queue', 'meeting_booked', 'opportunity', 'won', 'lost')
 */
export function mapToDbCompanyStatus(rawStatus?: string | null): string {
  const status = getUnifiedStatus(rawStatus).id;

  switch (status) {
    case "prospect":
      return "prospect";
    case "contacted":
    case "no_reply":
    case "follow_up_sent":
    case "voice_note_sent":
    case "reply_received":
    case "warm_up":
    case "opening_identified":
    case "audit_requested":
    case "audit_sent":
    case "portfolio_shared":
    case "objection":
    case "agency_existing":
    case "called":
      return "contacted";
    case "ready_for_call":
    case "call_scheduled":
    case "coffee_invited":
      return "in_call_queue";
    case "meeting_booked":
    case "proposal_requested":
    case "proposal":
      return "meeting_booked";
    case "opportunity":
      return "opportunity";
    case "won":
      return "won";
    case "lost":
    case "dormant":
      return "lost";
    default:
      return "contacted";
  }
}

/**
 * Maps a unified status to human-readable `companies.pipeline_stage`
 */
export function mapToDbPipelineStage(rawStatus?: string | null): string {
  const status = getUnifiedStatus(rawStatus).id;

  switch (status) {
    case "prospect":
      return "New";
    case "contacted":
      return "Contacted";
    case "no_reply":
      return "No Reply";
    case "follow_up_sent":
      return "Follow-Up Sent";
    case "audit_offered":
      return "Audit Offered";
    case "booking_link_sent":
      return "Booking Link Sent";
    case "reply_received":
      return "Reply Received";
    case "warm_up":
      return "Warm-Up In Progress";
    case "opening_identified":
      return "Opening Identified";
    case "audit_requested":
      return "Audit Requested";
    case "audit_sent":
      return "Audit Sent";
    case "portfolio_shared":
      return "Portfolio Shared";
    case "voice_note_sent":
      return "Voice Note Sent";
    case "call_scheduled":
      return "Call Scheduled";
    case "objection":
      return "Objection Raised";
    case "agency_existing":
      return "Existing Agency";
    case "ready_for_call":
      return "Call Ready";
    case "called":
      return "Called";
    case "coffee_invited":
      return "Coffee Invited";
    case "meeting_booked":
      return "Meeting Booked";
    case "opportunity":
      return "Opportunity";
    case "proposal_requested":
      return "Proposal Requested";
    case "proposal":
      return "Proposal Sent";
    case "won":
      return "Won";
    case "lost":
      return "Lost";
    case "dormant":
      return "Dormant";
    default:
      return "Contacted";
  }
}

/**
 * Maps a unified status to the database `companies.lead_status` CHECK constraint:
 * ('New', 'Contacted', 'Qualified', 'Meeting Booked', 'Proposal Sent', 'Negotiation', 'Won', 'Lost', 'Archived')
 */
export function mapToDbLeadStatus(rawStatus?: string | null): string {
  const status = getUnifiedStatus(rawStatus).id;

  switch (status) {
    case "prospect":
      return "New";
    case "contacted":
    case "no_reply":
    case "follow_up_sent":
    case "audit_offered":
    case "voice_note_sent":
    case "called":
    case "ready_for_call":
      return "Contacted";
    case "booking_link_sent":
    case "reply_received":
    case "warm_up":
    case "opening_identified":
    case "audit_requested":
    case "audit_sent":
    case "portfolio_shared":
    case "objection":
    case "agency_existing":
      return "Qualified";
    case "opportunity":
      return "Qualified";
    case "coffee_invited":
    case "call_scheduled":
    case "meeting_booked":
      return "Meeting Booked";
    case "proposal_requested":
    case "proposal":
      return "Proposal Sent";
    case "won":
      return "Won";
    case "lost":
      return "Lost";
    case "dormant":
      return "Archived";
    default:
      return "Contacted";
  }
}

/**
 * Maps a unified status to the Outreach status representation in `activities`
 */
export function mapToOutreachStatus(rawStatus?: string | null): string {
  const status = getUnifiedStatus(rawStatus).id;

  switch (status) {
    case "prospect":
      return "gate_opener_staged";
    case "contacted":
      return "gate_opener_sent";
    case "no_reply":
      return "no_reply";
    case "follow_up_sent":
      return "follow_up_sent";
    case "voice_note_sent":
      return "voice_note_sent";
    case "reply_received":
      return "reply_received";
    case "warm_up":
      return "warm_up";
    case "opening_identified":
      return "opening_identified";
    case "audit_requested":
      return "audit_requested";
    case "audit_offered":
    case "audit_sent":
      return "audit_sent";
    case "booking_link_sent":
      return "meeting_booked";
    case "portfolio_shared":
      return "portfolio_shared";
    case "objection":
      return "replied_objection";
    case "agency_existing":
      return "agency_existing";
    case "ready_for_call":
      return "ready_for_call";
    case "call_scheduled":
      return "call_scheduled";
    case "called":
      return "called";
    case "coffee_invited":
      return "coffee_invited";
    case "meeting_booked":
      return "meeting_booked";
    case "opportunity":
      return "opening_identified";
    case "proposal_requested":
    case "proposal":
      return "proposal_requested";
    case "won":
      return "meeting_booked";
    case "lost":
    case "dormant":
      return "not_now_snoozed";
    default:
      return "gate_opener_sent";
  }
}
