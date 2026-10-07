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
  canonical_stage: PipelineStageKey;
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
  stage: PipelineStageKey;
  count: number;
  totalValue: number;
}

export interface PipelineIntelligenceMetrics {
  totalLeads: number;
  overdueCount: number;
  todayCount: number;
  upcomingCount: number;
  waitingResponseCount: number;
  waitingDemoCount: number;
  waitingProposalCount: number;
  needsActionCount: number;
}
