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
  assigned_to: string | null;
  created_by: string | null;
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
