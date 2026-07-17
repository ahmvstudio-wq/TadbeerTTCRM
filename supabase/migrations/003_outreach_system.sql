-- Tadbeer CRM - Advanced Outreach System Migration

-- 1. LEADS DATABASE (Enhanced companies table)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lead_id TEXT UNIQUE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS date_added DATE DEFAULT CURRENT_DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lead_source TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS assigned_bdm TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS icp_match TEXT CHECK (icp_match IN ('High','Medium','Low'));
ALTER TABLE companies ADD COLUMN IF NOT EXISTS fawtara_flag TEXT DEFAULT 'Pending' CHECK (fawtara_flag IN ('Compliant','Non-Compliant','Pending','N/A'));
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'New' CHECK (lead_status IN ('New','Contacted','Qualified','Meeting Booked','Proposal Sent','Negotiation','Won','Lost','Archived'));
ALTER TABLE companies ADD COLUMN IF NOT EXISTS pipeline_stage TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS est_deal_value DECIMAL(12,2) DEFAULT 0;

-- 2. ACTIVITY LOG
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id TEXT UNIQUE,
  date DATE DEFAULT CURRENT_DATE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_name TEXT,
  channel TEXT CHECK (channel IN ('WhatsApp','LinkedIn','Email','Call','Meeting')),
  touch_number INTEGER DEFAULT 1,
  message_type TEXT,
  message_sent BOOLEAN DEFAULT false,
  response_received BOOLEAN DEFAULT false,
  response_type TEXT,
  callback_reminder_date DATE,
  post_meeting_outcome TEXT,
  outcome_notes TEXT,
  next_action TEXT,
  next_action_date DATE,
  bdm TEXT,
  time_spent_minutes INTEGER DEFAULT 0,
  script_used TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PIPELINE TRACKER (Enhanced opportunities)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS service_pillar TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS meeting_date DATE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS meeting_status TEXT CHECK (meeting_status IN ('Scheduled','Completed','Cancelled','No Show'));
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS post_meeting_branch TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS proposal_sent_date DATE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS proposal_response TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS expected_close_date DATE;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS days_in_stage INTEGER DEFAULT 0;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS last_activity TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS objection TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS objection_rebuttal TEXT;

-- 4. WHATSAPP TRACKER
CREATE TABLE IF NOT EXISTS whatsapp_tracker (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wa_id TEXT UNIQUE,
  date DATE DEFAULT CURRENT_DATE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_name TEXT,
  wa_number TEXT,
  wa_step INTEGER DEFAULT 1,
  message_sent BOOLEAN DEFAULT false,
  date_sent DATE,
  response_received BOOLEAN DEFAULT false,
  response_type TEXT,
  interest_level TEXT CHECK (interest_level IN ('Hot','Warm','Cold','No Response')),
  compliance_checklist_sent BOOLEAN DEFAULT false,
  discovery_booking_offered BOOLEAN DEFAULT false,
  meeting_booked BOOLEAN DEFAULT false,
  next_wa_action TEXT,
  next_wa_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. LINKEDIN SEQUENCE
CREATE TABLE IF NOT EXISTS linkedin_sequence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  t1_status TEXT DEFAULT 'Pending', t1_date DATE, t1_response TEXT,
  t2_status TEXT DEFAULT 'Pending', t2_date DATE, t2_response TEXT,
  t3_status TEXT DEFAULT 'Pending', t3_date DATE, t3_response TEXT,
  t4_status TEXT DEFAULT 'Pending', t4_date DATE, t4_response TEXT,
  t5_status TEXT DEFAULT 'Pending', t5_date DATE, t5_response TEXT,
  t6_status TEXT DEFAULT 'Pending', t6_date DATE, t6_response TEXT,
  t7_status TEXT DEFAULT 'Pending', t7_date DATE, t7_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. PILLAR TARGETS
CREATE TABLE IF NOT EXISTS pillar_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_name TEXT NOT NULL,
  target_revenue_omr DECIMAL(12,2) DEFAULT 0,
  target_deals INTEGER DEFAULT 0,
  target_leads INTEGER DEFAULT 0,
  actual_revenue_omr DECIMAL(12,2) DEFAULT 0,
  actual_deals INTEGER DEFAULT 0,
  actual_leads INTEGER DEFAULT 0,
  period TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. A/B TESTING LOG
CREATE TABLE IF NOT EXISTS ab_testing_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id TEXT UNIQUE,
  week_number INTEGER,
  week_start_date DATE,
  test_type TEXT,
  channel TEXT,
  variant_a_description TEXT,
  variant_a_sends INTEGER DEFAULT 0,
  variant_a_replies INTEGER DEFAULT 0,
  variant_a_reply_rate DECIMAL(5,2) DEFAULT 0,
  variant_b_description TEXT,
  variant_b_sends INTEGER DEFAULT 0,
  variant_b_replies INTEGER DEFAULT 0,
  variant_b_reply_rate DECIMAL(5,2) DEFAULT 0,
  statistical_winner TEXT,
  winner_reply_rate DECIMAL(5,2) DEFAULT 0,
  action_taken TEXT,
  next_test_focus TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. WEEKLY REPORTING
CREATE TABLE IF NOT EXISTS weekly_reporting (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_number INTEGER,
  week_start DATE,
  leads_added INTEGER DEFAULT 0,
  total_touches INTEGER DEFAULT 0,
  li_touches INTEGER DEFAULT 0,
  wa_touches INTEGER DEFAULT 0,
  email_touches INTEGER DEFAULT 0,
  calls_made INTEGER DEFAULT 0,
  total_responses INTEGER DEFAULT 0,
  li_reply_rate DECIMAL(5,2) DEFAULT 0,
  wa_reply_rate DECIMAL(5,2) DEFAULT 0,
  email_reply_rate DECIMAL(5,2) DEFAULT 0,
  avg_close_rate DECIMAL(5,2) DEFAULT 0,
  meetings_booked INTEGER DEFAULT 0,
  meetings_completed INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  proposals_sent INTEGER DEFAULT 0,
  deals_won INTEGER DEFAULT 0,
  revenue_closed_omr DECIMAL(12,2) DEFAULT 0,
  pipeline_value_omr DECIMAL(12,2) DEFAULT 0,
  key_observation TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_activity_log_company ON activity_log(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(date DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_tracker_company ON whatsapp_tracker(company_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_sequence_company ON linkedin_sequence(company_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reporting_week ON weekly_reporting(week_number DESC);

-- SEED PILLAR TARGETS
INSERT INTO pillar_targets (pillar_name, target_revenue_omr, target_deals, target_leads, period) VALUES
  ('Software Solutions', 25000, 12, 60, 'H1 2026'),
  ('AI Technology', 18000, 8, 45, 'H1 2026'),
  ('Digital Marketing', 12000, 6, 30, 'H1 2026'),
  ('Human Capital', 8000, 4, 16, 'H1 2026');
