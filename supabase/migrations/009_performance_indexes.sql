-- Migration 009: Enterprise Performance Indexes & Query Acceleration
-- Reduces join latency on activities, follow_ups, contacts, and companies

CREATE INDEX IF NOT EXISTS idx_activities_company_id ON public.activities(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_follow_ups_company_id ON public.follow_ups(company_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due_status ON public.follow_ups(status, due_date);

CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);

CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_pipeline_stage ON public.companies(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_companies_lead_type ON public.companies(lead_type);

CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON public.opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_meetings_company_id ON public.meetings(company_id);
