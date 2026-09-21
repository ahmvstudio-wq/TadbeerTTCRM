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
    label: "Contacted (Opener Sent)",
    shortLabel: "Sent",
    category: "outreach",
    categoryLabel: "Outreach & Cold",
    badgeClass: "bg-blue-100 text-blue-950 border-blue-400 font-bold",
    dotColor: "bg-blue-600",
    description: "First touch sent. Active 3-day follow-up clock begins.",
    defaultFollowUpDays: 3,
  },
  {
    id: "no_reply",
    label: "No Reply (Follow-Up Due)",
    shortLabel: "No Reply",
    category: "outreach",
    categoryLabel: "Outreach & Cold",
    badgeClass: "bg-rose-100 text-rose-950 border-rose-300 font-bold",
    dotColor: "bg-rose-500",
    description: "No answer on initial touch. Next value-add touch is due.",
    defaultFollowUpDays: 3,
  },
  {
    id: "follow_up_sent",
    label: "Follow-Up Sent",
    shortLabel: "Follow-Up",
    category: "outreach",
    categoryLabel: "Outreach & Cold",
    badgeClass: "bg-teal-100 text-teal-950 border-teal-400 font-bold",
    dotColor: "bg-teal-600",
    description: "Second or third observation touch dispatched.",
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

// Alias mapping for backwards compatibility
export const STATUS_ALIAS_MAP: Record<string, string> = {
  gate_opener_staged: "prospect",
  new: "prospect",
  gate_opener_sent: "contacted",
  sent: "contacted",
  replied: "reply_received",
  replied_interested: "opening_identified",
  interested: "opening_identified",
  replied_objection: "objection",
  in_call_queue: "ready_for_call",
  call_ready: "ready_for_call",
  not_now_snoozed: "dormant",
  proposal_sent: "proposal",
  snoozed: "dormant",
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
    case "reply_received":
    case "warm_up":
    case "opening_identified":
    case "objection":
    case "agency_existing":
    case "called":
      return "contacted";
    case "ready_for_call":
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
    case "no_reply":
    case "follow_up_sent":
    case "called":
      return "Contacted";
    case "reply_received":
    case "warm_up":
    case "opening_identified":
    case "objection":
    case "agency_existing":
      return "Replied";
    case "ready_for_call":
    case "coffee_invited":
      return "Call Ready";
    case "meeting_booked":
      return "Meeting Booked";
    case "opportunity":
      return "Opportunity";
    case "proposal_requested":
    case "proposal":
      return "Proposal Sent";
    case "won":
      return "Won";
    case "lost":
      return "Lost";
    case "dormant":
      return "Lost";
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
    case "called":
    case "ready_for_call":
      return "Contacted";
    case "reply_received":
    case "warm_up":
    case "opening_identified":
    case "objection":
    case "agency_existing":
      return "Qualified";
    case "opportunity":
      return "Qualified";
    case "coffee_invited":
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
    case "reply_received":
      return "reply_received";
    case "warm_up":
      return "warm_up";
    case "opening_identified":
      return "opening_identified";
    case "objection":
      return "replied_objection";
    case "agency_existing":
      return "agency_existing";
    case "ready_for_call":
      return "ready_for_call";
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
