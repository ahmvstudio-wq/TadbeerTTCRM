-- Migration 006: Enhanced LinkedIn Prospects & Daily Activity Logs
-- Created on 23 July 2026

-- 1. Create or update linkedin_prospects table
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

-- Ensure columns exist if table was previously created
ALTER TABLE public.linkedin_prospects ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
ALTER TABLE public.linkedin_prospects ADD COLUMN IF NOT EXISTS lead_type TEXT;
ALTER TABLE public.linkedin_prospects ADD COLUMN IF NOT EXISTS activities JSONB DEFAULT '[]'::jsonb;

-- 2. Create linkedin_daily_logs table
CREATE TABLE IF NOT EXISTS public.linkedin_daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  channel TEXT DEFAULT 'LinkedIn',
  summary TEXT,
  tasks_completed JSONB DEFAULT '{}'::jsonb,
  published_article JSONB DEFAULT '{}'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.linkedin_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_daily_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.linkedin_prospects;
CREATE POLICY "Allow all for authenticated" ON public.linkedin_prospects FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON public.linkedin_daily_logs;
CREATE POLICY "Allow all for authenticated" ON public.linkedin_daily_logs FOR ALL USING (true) WITH CHECK (true);
