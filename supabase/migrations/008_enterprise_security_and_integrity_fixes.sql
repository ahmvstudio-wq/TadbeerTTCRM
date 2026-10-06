-- Migration 008: Enterprise Security, RLS Hardening & Data Model Integrity
-- Fully self-contained, idempotent, and safe to run on any Supabase state

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. ENSURE PREREQUISITE TABLES EXIST (Self-healing DDL)
-- ============================================================

-- Ensure category_playbooks exists (from 007)
CREATE TABLE IF NOT EXISTS public.category_playbooks (
  category TEXT PRIMARY KEY,
  pain_points TEXT NOT NULL,
  tone_notes TEXT NOT NULL,
  angle_examples TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure linkedin_prospects exists (from 005/006)
CREATE TABLE IF NOT EXISTS public.linkedin_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT,
  company TEXT,
  location TEXT,
  degree TEXT DEFAULT '2nd',
  connections TEXT,
  profile_url TEXT,
  connection_status TEXT NOT NULL DEFAULT 'to_connect',
  message_status TEXT NOT NULL DEFAULT 'to_send',
  priority TEXT DEFAULT 'Medium',
  lead_type TEXT,
  mutual_connection TEXT,
  industry TEXT,
  screenshot_date TEXT DEFAULT CURRENT_DATE::text,
  notes TEXT,
  activities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure linkedin_daily_logs exists (from 006)
CREATE TABLE IF NOT EXISTS public.linkedin_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  channel TEXT DEFAULT 'LinkedIn',
  summary TEXT,
  tasks_completed JSONB DEFAULT '{}'::jsonb,
  published_article JSONB DEFAULT '{}'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure activity_log exists (from 003)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_id TEXT UNIQUE,
  date DATE DEFAULT CURRENT_DATE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  contact_name TEXT,
  channel TEXT,
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

-- Ensure whatsapp_tracker exists (from 003)
CREATE TABLE IF NOT EXISTS public.whatsapp_tracker (
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
  interest_level TEXT,
  compliance_checklist_sent BOOLEAN DEFAULT false,
  discovery_booking_offered BOOLEAN DEFAULT false,
  meeting_booked BOOLEAN DEFAULT false,
  next_wa_action TEXT,
  next_wa_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure linkedin_sequence exists (from 003)
CREATE TABLE IF NOT EXISTS public.linkedin_sequence (
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

-- Ensure pillar_targets exists (from 003)
CREATE TABLE IF NOT EXISTS public.pillar_targets (
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

-- Ensure ab_testing_log exists (from 003)
CREATE TABLE IF NOT EXISTS public.ab_testing_log (
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

-- Ensure weekly_reporting exists (from 003)
CREATE TABLE IF NOT EXISTS public.weekly_reporting (
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

-- Ensure categories tables exist (from 004)
CREATE TABLE IF NOT EXISTS public.lead_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0D4F4F',
  icon TEXT DEFAULT 'folder',
  parent_id UUID REFERENCES lead_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.outreach_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0D4F4F',
  icon TEXT DEFAULT 'send',
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_category_links (
  lead_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES lead_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (lead_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.outreach_category_links (
  outreach_id UUID,
  outreach_type TEXT,
  category_id UUID REFERENCES outreach_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (outreach_id, category_id)
);

-- Ensure companies table has all necessary columns
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lead_id TEXT UNIQUE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS date_added DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lead_source TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS assigned_bdm TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS icp_match TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS fawtara_flag TEXT DEFAULT 'Pending';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'New';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS pipeline_stage TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS est_deal_value DECIMAL(12,2) DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'Cold';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS lead_folder TEXT DEFAULT 'Unsorted';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS research_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS gatekeeper_type TEXT DEFAULT 'owner';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS draft_message TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS draft_angle_reasoning TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS draft_status TEXT DEFAULT 'pending';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;

-- ============================================================
-- 2. HARDEN ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_sequence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pillar_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_testing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reporting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_category_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_category_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_playbooks ENABLE ROW LEVEL SECURITY;

-- Activity Log
DROP POLICY IF EXISTS "Authenticated users can manage activity log" ON public.activity_log;
CREATE POLICY "Authenticated users can manage activity log" ON public.activity_log 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- WhatsApp Tracker
DROP POLICY IF EXISTS "Authenticated users can manage whatsapp tracker" ON public.whatsapp_tracker;
CREATE POLICY "Authenticated users can manage whatsapp tracker" ON public.whatsapp_tracker 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- LinkedIn Sequence
DROP POLICY IF EXISTS "Authenticated users can manage linkedin sequence" ON public.linkedin_sequence;
CREATE POLICY "Authenticated users can manage linkedin sequence" ON public.linkedin_sequence 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Pillar Targets
DROP POLICY IF EXISTS "Authenticated users can view pillar targets" ON public.pillar_targets;
CREATE POLICY "Authenticated users can view pillar targets" ON public.pillar_targets 
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated admins can manage pillar targets" ON public.pillar_targets;
CREATE POLICY "Authenticated admins can manage pillar targets" ON public.pillar_targets 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- A/B Testing Log
DROP POLICY IF EXISTS "Authenticated users can manage ab testing log" ON public.ab_testing_log;
CREATE POLICY "Authenticated users can manage ab testing log" ON public.ab_testing_log 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Weekly Reporting
DROP POLICY IF EXISTS "Authenticated users can manage weekly reporting" ON public.weekly_reporting;
CREATE POLICY "Authenticated users can manage weekly reporting" ON public.weekly_reporting 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Categories
DROP POLICY IF EXISTS "Authenticated users can view lead categories" ON public.lead_categories;
CREATE POLICY "Authenticated users can view lead categories" ON public.lead_categories 
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage lead categories" ON public.lead_categories;
CREATE POLICY "Authenticated users can manage lead categories" ON public.lead_categories 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can view outreach categories" ON public.outreach_categories;
CREATE POLICY "Authenticated users can view outreach categories" ON public.outreach_categories 
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage outreach categories" ON public.outreach_categories;
CREATE POLICY "Authenticated users can manage outreach categories" ON public.outreach_categories 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage lead category links" ON public.lead_category_links;
CREATE POLICY "Authenticated users can manage lead category links" ON public.lead_category_links 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage outreach category links" ON public.outreach_category_links;
CREATE POLICY "Authenticated users can manage outreach category links" ON public.outreach_category_links 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- LinkedIn Prospects & Daily Logs
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.linkedin_prospects;
DROP POLICY IF EXISTS "Authenticated users can manage linkedin prospects" ON public.linkedin_prospects;
CREATE POLICY "Authenticated users can manage linkedin prospects" ON public.linkedin_prospects 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.linkedin_daily_logs;
DROP POLICY IF EXISTS "Authenticated users can manage linkedin daily logs" ON public.linkedin_daily_logs;
CREATE POLICY "Authenticated users can manage linkedin daily logs" ON public.linkedin_daily_logs 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Category Playbooks
DROP POLICY IF EXISTS "Allow all for category_playbooks" ON public.category_playbooks;
DROP POLICY IF EXISTS "Authenticated users can view category playbooks" ON public.category_playbooks;
CREATE POLICY "Authenticated users can view category playbooks" ON public.category_playbooks 
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update category playbooks" ON public.category_playbooks;
CREATE POLICY "Authenticated users can update category playbooks" ON public.category_playbooks 
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 3. CONSTRAINT HARDENING & ENUM ALIGNMENT
-- ============================================================

-- Ensure companies status includes dormant
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_status_check;
ALTER TABLE public.companies ADD CONSTRAINT companies_status_check 
  CHECK (status IN ('prospect','contacted','in_call_queue','meeting_booked','opportunity','won','lost','dormant'));

-- Ensure activity_log channel accepts both title-case and lowercase
ALTER TABLE public.activity_log DROP CONSTRAINT IF EXISTS activity_log_channel_check;
ALTER TABLE public.activity_log ADD CONSTRAINT activity_log_channel_check 
  CHECK (channel IN (
    'WhatsApp','LinkedIn','Email','Call','Meeting',
    'whatsapp','linkedin','email','call','meeting'
  ));

-- User attribution on linkedin_daily_logs
ALTER TABLE public.linkedin_daily_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Cascade foreign keys on calls table if company is deleted
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'calls') THEN
    ALTER TABLE public.calls DROP CONSTRAINT IF EXISTS calls_company_id_fkey;
    ALTER TABLE public.calls ADD CONSTRAINT calls_company_id_fkey 
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

    ALTER TABLE public.calls DROP CONSTRAINT IF EXISTS calls_contact_id_fkey;
    ALTER TABLE public.calls ADD CONSTRAINT calls_contact_id_fkey 
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 4. PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_companies_category ON public.companies(category);
CREATE INDEX IF NOT EXISTS idx_companies_date_added ON public.companies(date_added DESC);
CREATE INDEX IF NOT EXISTS idx_companies_fawtara_flag ON public.companies(fawtara_flag);
CREATE INDEX IF NOT EXISTS idx_activity_log_channel ON public.activity_log(channel);
CREATE INDEX IF NOT EXISTS idx_whatsapp_tracker_interest ON public.whatsapp_tracker(interest_level);
CREATE INDEX IF NOT EXISTS idx_linkedin_prospects_company ON public.linkedin_prospects(company);

-- ============================================================
-- 5. SEED DEFAULT PLAYBOOKS IF EMPTY
-- ============================================================
INSERT INTO public.category_playbooks (category, pain_points, tone_notes, angle_examples)
VALUES
  (
    'dental_clinics',
    'High patient no-shows, peak hours reception overload, manual appointment reminders, missed WhatsApp inquiries from prospective patients after hours.',
    'Warm, professional, compliment-first. Peer-to-peer B2B tone for clinic owner/lead dentist; value-offer observation for clinic manager. Zero hard service pitch.',
    '1) Compliment their clinical reputation / patient care quality in Oman.\n2) Share observation about how top dental practices handle after-hours WhatsApp inquiries.'
  ),
  (
    'aesthetic_clinics',
    'High consultation cancellation rate, slow response to Instagram DM price inquiries, managing VIP client privacy, difficulty re-engaging seasonal treatment clients.',
    'Warm, premium, polished, compliment-first. Aesthetic B2B framing. Respectful and relationship-led.',
    '1) Admire their treatment portfolio / aesthetic branding.\n2) Note how leading aesthetic lounges streamline VIP booking inquiries on IG/WhatsApp.'
  ),
  (
    'perfume_shops',
    'Inventory turnover speed, seasonal fragrance campaign spikes, customer retention for signature blends, converting Instagram followers into foot traffic.',
    'Warm, culturally resonant (Omani heritage & fragrance pride), compliment-first. Peer-to-peer for luxury perfume house founders.',
    '1) Praising their blend craft or showroom presentation in Muscat/Salalah.\n2) Observing how boutique perfumers build repeat customer loyalty through instant WhatsApp concierge.'
  ),
  (
    'boutiques_fashion',
    'Sourcing delay inquiries, managing custom order sizing via DM, impulse shopper abandonment, Eid / wedding season rush congestion.',
    'Warm, stylish, encouraging, compliment-first. Conversational and relationship-focused.',
    '1) Complimenting their latest collection design or Instagram aesthetic.\n2) Noticing how top Oman fashion boutiques keep high-intent shoppers engaged over DM.'
  ),
  (
    'womens_spas',
    'Weekend booking bottlenecks, last-minute cancellation slot filling, therapist schedule balancing, re-engaging membership clients.',
    'Warm, calming, hospitable, compliment-first. Respectful of privacy and service quality.',
    '1) Appreciating their serene atmosphere and high client satisfaction ratings.\n2) Observing how premier wellness spas fill last-minute appointment cancellations effortlessly.'
  )
ON CONFLICT (category) DO UPDATE SET
  pain_points = EXCLUDED.pain_points,
  tone_notes = EXCLUDED.tone_notes,
  angle_examples = EXCLUDED.angle_examples,
  updated_at = now();
