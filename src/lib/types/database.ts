export interface User {
  id: string;
  full_name: string;
  email: string;
  role: "admin" | "bd_rep" | "closer";
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  company_name: string;
  industry: string | null;
  website: string | null;
  linkedin_url: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  city: string | null;
  employee_count: number | null;
  notes: string | null;
  status: string;
  pipeline_stage?: string | null;
  lead_status?: string | null;
  assigned_to: string | null;
  assigned_bdm?: string | null;
  created_by: string | null;
  lead_id?: string | null;
  date_added?: string | null;
  lead_source?: string | null;
  icp_match?: "High" | "Medium" | "Low" | null;
  fawtara_flag?: "Compliant" | "Non-Compliant" | "Pending" | "N/A" | null;
  est_deal_value?: number | null;
  lead_type?: string | null;
  lead_folder?: string | null;
  research_json?: Record<string, any> | null;
  category?: string | null;
  gatekeeper_type?: "owner" | "manager" | null;
  draft_message?: string | null;
  draft_angle_reasoning?: string | null;
  draft_status?: "pending" | "ready_to_send" | "sent" | null;
  generated_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  company_id: string;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedin_url: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface ServiceLine {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

export interface OutreachPreparation {
  id: string;
  company_id: string;
  contact_id: string | null;
  prepared_by: string | null;
  service_line_id: string | null;
  use_case_summary: string;
  personalization: string | null;
  outreach_channel: "whatsapp" | "linkedin" | "email";
  message_body: string | null;
  status: "draft" | "ready" | "sent";
  sent_at: string | null;
  sent_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyOutreachSession {
  id: string;
  user_id: string;
  session_date: string;
  target_count: number;
  notes: string | null;
  created_at: string;
}

export interface DailyOutreachItem {
  id: string;
  session_id: string;
  company_id: string;
  preparation_id: string | null;
  position: number;
  status: "pending" | "prepared" | "sent" | "skipped";
  created_at: string;
}

export interface CallQueue {
  id: string;
  company_id: string;
  contact_id: string | null;
  preparation_id: string | null;
  assigned_to: string | null;
  priority: number;
  status: "pending" | "in_progress" | "completed" | "expired";
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface Call {
  id: string;
  call_queue_id: string | null;
  company_id: string;
  contact_id: string | null;
  caller_id: string | null;
  outcome: string;
  duration_seconds: number | null;
  notes: string | null;
  follow_up_needed: boolean;
  created_at: string;
}

export interface FollowUp {
  id: string;
  company_id: string;
  contact_id: string | null;
  call_id: string | null;
  assigned_to: string | null;
  due_date: string;
  due_time: string | null;
  subject: string;
  description: string | null;
  channel: string;
  status: "pending" | "completed" | "overdue" | "cancelled";
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
}

export interface Meeting {
  id: string;
  company_id: string;
  contact_id: string | null;
  opportunity_id: string | null;
  booked_by: string | null;
  title: string;
  description: string | null;
  meeting_date: string;
  duration_minutes: number;
  location: string | null;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  created_at: string;
}

export interface Opportunity {
  id: string;
  company_id: string;
  contact_id: string | null;
  owner_id: string | null;
  service_line_id: string | null;
  title: string;
  description: string | null;
  estimated_value: number | null;
  currency: string;
  stage: string;
  probability: number;
  lost_reason: string | null;
  won_at: string | null;
  lost_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  company_id: string;
  contact_id: string | null;
  user_id: string | null;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CompanyWithContacts extends Company {
  contacts: Contact[];
}

export interface CompanyWithDetails extends Company {
  contacts: Contact[];
  activities: Activity[];
  preparations: OutreachPreparation[];
  follow_ups: FollowUp[];
  meetings: Meeting[];
  opportunities: Opportunity[];
}

export interface OutreachItemWithCompany extends DailyOutreachItem {
  company: Company;
  preparation: OutreachPreparation | null;
  contact: Contact | null;
}

export interface CallQueueWithCompany extends CallQueue {
  company: Company;
  contact: Contact | null;
  preparation: OutreachPreparation | null;
}

export interface FollowUpWithCompany extends FollowUp {
  company: Company;
  contact: Contact | null;
}

export interface MeetingWithCompany extends Meeting {
  company: Company;
  contact: Contact | null;
}

export interface OpportunityWithCompany extends Opportunity {
  company: Company;
  contact: Contact | null;
  service_line: ServiceLine | null;
}

export interface ActivityWithUser extends Activity {
  user: Pick<User, "full_name" | "avatar_url"> | null;
}

export interface DashboardStats {
  todayOutreachCount: number;
  todayOutreachTarget: number;
  prospectsNeedingPreparation: number;
  messagesReadyToSend: number;
  pendingCalls: number;
  dueTodayFollowUps: number;
  overdueFollowUps: number;
  upcomingMeetings: number;
  activeOpportunities: number;
  totalPipelineValue: number;
}

export interface ActivityLog {
  id: string;
  log_id?: string | null;
  date: string;
  company_id: string;
  contact_name?: string | null;
  channel: "WhatsApp" | "LinkedIn" | "Email" | "Call" | "Meeting" | "whatsapp" | "linkedin" | "email" | "call" | "meeting";
  touch_number: number;
  message_type?: string | null;
  message_sent: boolean;
  response_received: boolean;
  response_type?: string | null;
  callback_reminder_date?: string | null;
  post_meeting_outcome?: string | null;
  outcome_notes?: string | null;
  next_action?: string | null;
  next_action_date?: string | null;
  bdm?: string | null;
  time_spent_minutes?: number;
  script_used?: string | null;
  created_at: string;
}

export interface WhatsappTracker {
  id: string;
  wa_id?: string | null;
  date: string;
  company_id: string;
  contact_name?: string | null;
  wa_number?: string | null;
  wa_step: number;
  message_sent: boolean;
  date_sent?: string | null;
  response_received: boolean;
  response_type?: string | null;
  interest_level?: "Hot" | "Warm" | "Cold" | "No Response" | null;
  compliance_checklist_sent: boolean;
  discovery_booking_offered: boolean;
  meeting_booked: boolean;
  next_wa_action?: string | null;
  next_wa_date?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface LinkedinSequence {
  id: string;
  company_id: string;
  t1_status?: string | null;
  t1_date?: string | null;
  t1_response?: string | null;
  t2_status?: string | null;
  t2_date?: string | null;
  t2_response?: string | null;
  t3_status?: string | null;
  t3_date?: string | null;
  t3_response?: string | null;
  t4_status?: string | null;
  t4_date?: string | null;
  t4_response?: string | null;
  t5_status?: string | null;
  t5_date?: string | null;
  t5_response?: string | null;
  t6_status?: string | null;
  t6_date?: string | null;
  t6_response?: string | null;
  t7_status?: string | null;
  t7_date?: string | null;
  t7_response?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PillarTarget {
  id: string;
  pillar_name: string;
  target_revenue_omr: number;
  target_deals: number;
  target_leads: number;
  actual_revenue_omr: number;
  actual_deals: number;
  actual_leads: number;
  period?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AbTestingLog {
  id: string;
  test_id?: string | null;
  week_number?: number | null;
  week_start_date?: string | null;
  test_type?: string | null;
  channel?: string | null;
  variant_a_description?: string | null;
  variant_a_sends: number;
  variant_a_replies: number;
  variant_a_reply_rate: number;
  variant_b_description?: string | null;
  variant_b_sends: number;
  variant_b_replies: number;
  variant_b_reply_rate: number;
  statistical_winner?: string | null;
  winner_reply_rate: number;
  action_taken?: string | null;
  next_test_focus?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface WeeklyReporting {
  id: string;
  week_number?: number | null;
  week_start?: string | null;
  leads_added: number;
  total_touches: number;
  li_touches: number;
  wa_touches: number;
  email_touches: number;
  calls_made: number;
  total_responses: number;
  li_reply_rate: number;
  wa_reply_rate: number;
  email_reply_rate: number;
  avg_close_rate: number;
  meetings_booked: number;
  meetings_completed: number;
  no_shows: number;
  proposals_sent: number;
  deals_won: number;
  revenue_closed_omr: number;
  pipeline_value_omr: number;
  key_observation?: string | null;
  created_at: string;
}

export interface LeadCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  parent_id?: string | null;
  sort_order: number;
  created_at: string;
}

export interface OutreachCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string | null;
  sort_order: number;
  created_at: string;
}

export interface OutreachTouch {
  id: string;
  lead_id: string;
  channel: string;
  step_number: number;
  message?: string | null;
  status: string;
  response?: string | null;
  follow_up_date?: string | null;
  campaign_id?: string | null;
  is_call: boolean;
  call_duration?: number | null;
  call_outcome?: string | null;
  sent_at: string;
  created_at: string;
}

export interface CategoryPlaybook {
  category: string;
  pain_points: string;
  tone_notes: string;
  angle_examples: string;
  created_at: string;
  updated_at: string;
}
