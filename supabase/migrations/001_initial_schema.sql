-- Tadbeer CRM - Complete Database Schema
-- Production-ready schema with RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT CHECK (role IN ('admin','bd_rep','closer')) DEFAULT 'bd_rep',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- COMPANIES TABLE
-- ============================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  linkedin_url TEXT,
  phone TEXT,
  email TEXT,
  country TEXT,
  city TEXT,
  employee_count INTEGER,
  notes TEXT,
  status TEXT CHECK (status IN ('prospect','contacted','in_call_queue','meeting_booked','opportunity','won','lost')) DEFAULT 'prospect',
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CONTACTS TABLE
-- ============================================================
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  linkedin_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SERVICE LINES TABLE
-- ============================================================
CREATE TABLE service_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0
);

-- ============================================================
-- OUTREACH PREPARATIONS TABLE
-- ============================================================
CREATE TABLE outreach_preparations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  prepared_by UUID REFERENCES users(id),
  service_line_id UUID REFERENCES service_lines(id),
  use_case_summary TEXT NOT NULL,
  personalization TEXT,
  outreach_channel TEXT CHECK (outreach_channel IN ('whatsapp','linkedin','email')) NOT NULL,
  message_body TEXT,
  status TEXT CHECK (status IN ('draft','ready','sent')) DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_outreach_preparations_updated_at BEFORE UPDATE ON outreach_preparations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- DAILY OUTREACH SESSIONS TABLE
-- ============================================================
CREATE TABLE daily_outreach_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_count INTEGER DEFAULT 10,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DAILY OUTREACH ITEMS TABLE
-- ============================================================
CREATE TABLE daily_outreach_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES daily_outreach_sessions(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  preparation_id UUID REFERENCES outreach_preparations(id),
  position INTEGER,
  status TEXT CHECK (status IN ('pending','prepared','sent','skipped')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, company_id)
);

-- ============================================================
-- CALL QUEUE TABLE
-- ============================================================
CREATE TABLE call_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  preparation_id UUID REFERENCES outreach_preparations(id),
  assigned_to UUID REFERENCES users(id),
  priority INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('pending','in_progress','completed','expired')) DEFAULT 'pending',
  queued_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_call_queue_updated_at BEFORE UPDATE ON call_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- CALLS TABLE
-- ============================================================
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_queue_id UUID REFERENCES call_queue(id),
  company_id UUID REFERENCES companies(id),
  contact_id UUID REFERENCES contacts(id),
  caller_id UUID REFERENCES users(id),
  outcome TEXT CHECK (outcome IN ('no_answer','left_voicemail','connected','wrong_number','callback_requested','do_not_call')) NOT NULL,
  duration_seconds INTEGER,
  notes TEXT,
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FOLLOW-UPS TABLE
-- ============================================================
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  call_id UUID REFERENCES calls(id),
  assigned_to UUID REFERENCES users(id),
  due_date DATE NOT NULL,
  due_time TIME,
  subject TEXT NOT NULL,
  description TEXT,
  channel TEXT CHECK (channel IN ('call','email','whatsapp','linkedin','meeting')) DEFAULT 'call',
  status TEXT CHECK (status IN ('pending','completed','overdue','cancelled')) DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_follow_ups_updated_at BEFORE UPDATE ON follow_ups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- OPPORTUNITIES TABLE
-- ============================================================
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  owner_id UUID REFERENCES users(id),
  service_line_id UUID REFERENCES service_lines(id),
  title TEXT NOT NULL,
  description TEXT,
  estimated_value DECIMAL(12,2),
  currency TEXT DEFAULT 'SAR',
  stage TEXT CHECK (stage IN ('qualified','proposal_sent','negotiation','verbal_commit','won','lost')) DEFAULT 'qualified',
  probability INTEGER DEFAULT 10,
  expected_close_date DATE,
  lost_reason TEXT,
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- MEETINGS TABLE
-- ============================================================
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  opportunity_id UUID REFERENCES opportunities(id),
  booked_by UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  meeting_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  location TEXT,
  meeting_type TEXT DEFAULT 'in_person',
  notes TEXT,
  status TEXT CHECK (status IN ('scheduled','completed','cancelled','no_show')) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ACTIVITIES TABLE (unified timeline)
-- ============================================================
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id),
  user_id UUID REFERENCES users(id),
  activity_type TEXT CHECK (activity_type IN (
    'note','whatsapp_sent','linkedin_sent','email_sent',
    'call_made','call_received','meeting_booked','meeting_completed',
    'status_changed','opportunity_created','opportunity_stage_changed',
    'follow_up_scheduled','follow_up_completed','follow_up_overdue',
    'company_created','call_completed','outreach_sent','follow_up_created'
  )) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_assigned_to ON companies(assigned_to);
CREATE INDEX idx_companies_company_name ON companies(company_name);
CREATE INDEX idx_contacts_company_id ON contacts(company_id);
CREATE INDEX idx_outreach_preparations_company_id ON outreach_preparations(company_id);
CREATE INDEX idx_outreach_preparations_status ON outreach_preparations(status);
CREATE INDEX idx_daily_outreach_items_session_id ON daily_outreach_items(session_id);
CREATE INDEX idx_call_queue_status ON call_queue(status);
CREATE INDEX idx_call_queue_assigned_to ON call_queue(assigned_to);
CREATE INDEX idx_calls_company_id ON calls(company_id);
CREATE INDEX idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX idx_follow_ups_due_date ON follow_ups(due_date);
CREATE INDEX idx_follow_ups_status ON follow_ups(status);
CREATE INDEX idx_follow_ups_assigned_to ON follow_ups(assigned_to);
CREATE INDEX idx_meetings_meeting_date ON meetings(meeting_date);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_owner_id ON opportunities(owner_id);
CREATE INDEX idx_activities_company_id ON activities(company_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_outreach_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_outreach_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Users: can read all, update own profile
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Companies: authenticated users can do everything
CREATE POLICY "Authenticated users can view companies" ON companies FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create companies" ON companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update companies" ON companies FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete companies" ON companies FOR DELETE USING (auth.role() = 'authenticated');

-- Contacts: authenticated users can do everything
CREATE POLICY "Authenticated users can view contacts" ON contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create contacts" ON contacts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update contacts" ON contacts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete contacts" ON contacts FOR DELETE USING (auth.role() = 'authenticated');

-- Service lines: everyone can read, authenticated can manage
CREATE POLICY "Anyone can view service lines" ON service_lines FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage service lines" ON service_lines FOR ALL USING (auth.role() = 'authenticated');

-- Outreach preparations
CREATE POLICY "Authenticated users can view preparations" ON outreach_preparations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create preparations" ON outreach_preparations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update preparations" ON outreach_preparations FOR UPDATE USING (auth.role() = 'authenticated');

-- Daily outreach sessions
CREATE POLICY "Authenticated users can manage sessions" ON daily_outreach_sessions FOR ALL USING (auth.role() = 'authenticated');

-- Daily outreach items
CREATE POLICY "Authenticated users can manage items" ON daily_outreach_items FOR ALL USING (auth.role() = 'authenticated');

-- Call queue
CREATE POLICY "Authenticated users can manage call queue" ON call_queue FOR ALL USING (auth.role() = 'authenticated');

-- Calls
CREATE POLICY "Authenticated users can manage calls" ON calls FOR ALL USING (auth.role() = 'authenticated');

-- Follow-ups
CREATE POLICY "Authenticated users can manage follow-ups" ON follow_ups FOR ALL USING (auth.role() = 'authenticated');

-- Opportunities
CREATE POLICY "Authenticated users can manage opportunities" ON opportunities FOR ALL USING (auth.role() = 'authenticated');

-- Meetings
CREATE POLICY "Authenticated users can manage meetings" ON meetings FOR ALL USING (auth.role() = 'authenticated');

-- Activities
CREATE POLICY "Authenticated users can view activities" ON activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can create activities" ON activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- SEED DATA
-- ============================================================

-- Insert default service lines
INSERT INTO service_lines (name, description, display_order) VALUES
  ('Software Solutions', 'Custom software development and integration', 1),
  ('AI Technology', 'AI and machine learning solutions', 2),
  ('Digital Marketing', 'Digital marketing strategy and execution', 3),
  ('Human Capital', 'HR consulting and talent management', 4);

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'bd_rep'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- HELPER VIEWS
-- ============================================================

-- Dashboard stats view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM companies WHERE status NOT IN ('won','lost')) as active_companies,
  (SELECT COUNT(*) FROM companies WHERE status = 'prospect') as prospects,
  (SELECT COUNT(*) FROM companies WHERE status = 'contacted') as contacted,
  (SELECT COUNT(*) FROM companies WHERE status = 'in_call_queue') as in_call_queue,
  (SELECT COUNT(*) FROM companies WHERE status = 'meeting_booked') as meeting_booked,
  (SELECT COUNT(*) FROM companies WHERE status = 'opportunity') as opportunities,
  (SELECT COUNT(*) FROM companies WHERE status = 'won') as won,
  (SELECT COUNT(*) FROM companies WHERE status = 'lost') as lost,
  (SELECT COUNT(*) FROM follow_ups WHERE status = 'pending' AND due_date < CURRENT_DATE) as overdue_follow_ups,
  (SELECT COUNT(*) FROM follow_ups WHERE status = 'pending' AND due_date = CURRENT_DATE) as due_today_follow_ups,
  (SELECT COUNT(*) FROM meetings WHERE status = 'scheduled' AND meeting_date >= now()) as upcoming_meetings,
  (SELECT COALESCE(SUM(estimated_value), 0) FROM opportunities WHERE stage NOT IN ('lost')) as pipeline_value;
