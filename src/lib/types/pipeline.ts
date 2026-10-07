export type PipelineStageKey =
  | "outreach"
  | "meeting"
  | "demo"
  | "proposal"
  | "follow_up"
  | "won"
  | "lost";

export type DemoStatus = "none" | "required" | "in_progress" | "completed";
export type PresentationStatus = "none" | "required" | "sent" | "completed";
export type ProposalStatus = "none" | "drafting" | "sent" | "negotiating" | "approved" | "rejected";
export type PipelineFollowUpStatus = "none" | "required" | "scheduled" | "waiting_response";

export type IntelligenceFilterKey =
  | "all"
  | "overdue"
  | "today"
  | "upcoming"
  | "waiting_response"
  | "waiting_demo"
  | "waiting_proposal"
  | "needs_action";

export interface DemoUrlItem {
  title: string;
  url: string;
}

export interface PipelineStageConfig {
  key: PipelineStageKey;
  label: string;
  shortLabel: string;
  description: string;
  dotColor: string;
  badgeClass: string;
  headerBg: string;
}

export interface PipelineLead {
  id: string;
  company_name: string;
  industry: string | null;
  category: string | null;
  website: string | null;
  linkedin_url: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  pipeline_stage_raw: string | null;
  canonical_stage: PipelineStageKey | "uncontacted";
  lead_status: string | null;
  assigned_to: string | null;
  assigned_bdm: string | null;
  owner_name: string;
  primary_contact: {
    id?: string;
    full_name: string;
    title: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    linkedin_url: string | null;
  } | null;
  next_action: string | null;
  action_due_date: string | null;
  demo_status: DemoStatus;
  presentation_status: PresentationStatus;
  proposal_status: ProposalStatus;
  follow_up_status: PipelineFollowUpStatus;
  demo_urls: DemoUrlItem[];
  presentation_urls: DemoUrlItem[];
  last_activity: {
    type: string;
    title: string;
    description: string | null;
    created_at: string;
  } | null;
  next_follow_up: {
    id: string;
    due_date: string;
    due_time: string | null;
    subject: string;
    channel: string;
    status: string;
    is_overdue: boolean;
    is_today: boolean;
    days_diff: number;
  } | null;
  is_overdue: boolean;
  is_today: boolean;
  needs_action: boolean;
  notes: string | null;
  est_deal_value: number | null;
  created_at: string;
  updated_at: string;
  mgmt_highlight?: boolean;
}

export interface PipelineStageSummary {
  stage: PipelineStageKey | "uncontacted";
  count: number;
  totalValue: number;
}

export interface PipelineIntelligenceMetrics {
  totalActiveLeads: number;
  uncontactedDirectoryCount: number;
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;
  waitingResponseCount: number;
  waitingDemoCount: number;
  waitingProposalCount: number;
  needsActionCount: number;
}

// ─── CANONICAL STAGE RESOLUTION ───────────────────────────────────────────────
export function resolveCanonicalStage(
  company: any,
  hasActivity: boolean = false
): PipelineStageKey | "uncontacted" {
  const rJson = company.research_json || {};
  if (rJson.pipeline_stage) {
    const raw = String(rJson.pipeline_stage).toLowerCase().trim();
    if (
      raw === "outreach" ||
      raw === "meeting" ||
      raw === "demo" ||
      raw === "proposal" ||
      raw === "follow_up" ||
      raw === "won" ||
      raw === "lost"
    ) {
      return raw as PipelineStageKey;
    }
  }

  const pStage = String(company.pipeline_stage || "").toLowerCase();
  const dbStatus = String(company.status || "").toLowerCase();
  const leadStatus = String(company.lead_status || "").toLowerCase();

  // Won check
  if (dbStatus === "won" || leadStatus === "won" || pStage.includes("won")) {
    return "won";
  }

  // Lost / Dormant check
  if (
    dbStatus === "lost" ||
    leadStatus === "lost" ||
    leadStatus === "archived" ||
    dbStatus === "dormant" ||
    pStage.includes("lost") ||
    pStage.includes("dormant")
  ) {
    return "lost";
  }

  // Demo / Presentation check
  if (
    pStage.includes("demo") ||
    pStage.includes("presentation") ||
    rJson.demo_status === "in_progress" ||
    rJson.demo_status === "required" ||
    (rJson.demo_urls && rJson.demo_urls.length > 0)
  ) {
    return "demo";
  }

  // Proposal check
  if (
    pStage.includes("proposal") ||
    pStage.includes("quotation") ||
    pStage.includes("mou") ||
    leadStatus.includes("proposal") ||
    rJson.proposal_status === "sent" ||
    rJson.proposal_status === "drafting"
  ) {
    return "proposal";
  }

  // Follow-up / Negotiation check
  if (
    pStage.includes("negotiation") ||
    pStage.includes("follow-up") ||
    leadStatus.includes("negotiation") ||
    rJson.follow_up_status === "required" ||
    rJson.follow_up_status === "waiting_response"
  ) {
    return "follow_up";
  }

  // Meeting check
  if (
    dbStatus === "meeting_booked" ||
    leadStatus.includes("meeting") ||
    pStage.includes("meeting") ||
    pStage.includes("coffee")
  ) {
    return "meeting";
  }

  // Active Outreach check (Only leads with actual touches or outreach status)
  const isOutreach =
    hasActivity ||
    dbStatus === "contacted" ||
    dbStatus === "in_call_queue" ||
    pStage.includes("contacted") ||
    pStage.includes("follow-up") ||
    pStage.includes("audit") ||
    pStage.includes("warm-up") ||
    pStage.includes("no reply") ||
    pStage.includes("replied") ||
    pStage.includes("call ready") ||
    pStage.includes("opening");

  if (isOutreach) {
    return "outreach";
  }

  // Raw uncontacted directory lead
  return "uncontacted";
}

// ─── STAGE LABELS & DB MAPPING ────────────────────────────────────────────────
export function getDbMappingsForStage(stage: PipelineStageKey): {
  status: "prospect" | "contacted" | "in_call_queue" | "meeting_booked" | "opportunity" | "won" | "lost";
  pipeline_stage: string;
  lead_status: "New" | "Contacted" | "Qualified" | "Meeting Booked" | "Proposal Sent" | "Negotiation" | "Won" | "Lost";
} {
  switch (stage) {
    case "outreach":
      return {
        status: "contacted",
        pipeline_stage: "Contacted",
        lead_status: "Contacted",
      };
    case "meeting":
      return {
        status: "meeting_booked",
        pipeline_stage: "Meeting Booked",
        lead_status: "Meeting Booked",
      };
    case "demo":
      return {
        status: "meeting_booked",
        pipeline_stage: "Demo / Presentation",
        lead_status: "Qualified",
      };
    case "proposal":
      return {
        status: "opportunity",
        pipeline_stage: "Proposal Sent",
        lead_status: "Proposal Sent",
      };
    case "follow_up":
      return {
        status: "opportunity",
        pipeline_stage: "Follow-up / Negotiation",
        lead_status: "Negotiation",
      };
    case "won":
      return {
        status: "won",
        pipeline_stage: "Won",
        lead_status: "Won",
      };
    case "lost":
      return {
        status: "lost",
        pipeline_stage: "Lost",
        lead_status: "Lost",
      };
  }
}
