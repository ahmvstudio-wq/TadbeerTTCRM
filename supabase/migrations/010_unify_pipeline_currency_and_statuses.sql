-- Migration 010: Unify Currency to OMR, Harmonize Pipeline Stages & Opportunities
-- Ensures strict OMR default, idempotent stage normalization, and performance indexes

-- 1. Standardize Opportunities currency default to OMR
ALTER TABLE IF EXISTS public.opportunities 
  ALTER COLUMN currency SET DEFAULT 'OMR';

UPDATE public.opportunities 
  SET currency = 'OMR' 
  WHERE currency IS NULL OR currency = 'SAR';

-- 2. Performance indexes for opportunities & pipeline lookup
CREATE INDEX IF NOT EXISTS idx_opportunities_company_stage 
  ON public.opportunities(company_id, stage);

CREATE INDEX IF NOT EXISTS idx_opportunities_currency 
  ON public.opportunities(currency);

-- 3. Normalize legacy pipeline_stage casing variations on companies table
UPDATE public.companies 
  SET pipeline_stage = 'Follow-Up Sent' 
  WHERE pipeline_stage = 'Follow-up Sent';

UPDATE public.companies 
  SET pipeline_stage = 'Opening Identified' 
  WHERE pipeline_stage = 'Opening';

UPDATE public.companies 
  SET pipeline_stage = 'Reply Received' 
  WHERE pipeline_stage = 'Replied';

UPDATE public.companies 
  SET pipeline_stage = 'New' 
  WHERE pipeline_stage = 'Pending' OR pipeline_stage = 'raw' OR pipeline_stage = 'prospect';

-- 4. Harmonize existing pipeline deals into opportunities table
-- This bridges existing proposal/negotiation/demo companies so executive dashboard and pipeline match 100%
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- For companies with active proposal or negotiation stage
  FOR rec IN 
    SELECT c.id, c.company_name, c.pipeline_stage, c.est_deal_value, c.created_at,
           (SELECT id FROM public.contacts WHERE company_id = c.id ORDER BY is_primary DESC LIMIT 1) as contact_id
    FROM public.companies c
    WHERE c.pipeline_stage IN ('Proposal Sent', 'Follow-up / Negotiation', 'Demo / Presentation')
      AND NOT EXISTS (SELECT 1 FROM public.opportunities WHERE company_id = c.id)
  LOOP
    INSERT INTO public.opportunities (
      company_id,
      contact_id,
      title,
      description,
      estimated_value,
      currency,
      stage,
      probability,
      created_at,
      updated_at
    ) VALUES (
      rec.id,
      rec.contact_id,
      rec.company_name || ' — Transformation Scope',
      'Harmonized from active pipeline stage: ' || rec.pipeline_stage,
      COALESCE(rec.est_deal_value, 0),
      'OMR',
      CASE 
        WHEN rec.pipeline_stage = 'Proposal Sent' THEN 'proposal_sent'
        WHEN rec.pipeline_stage = 'Follow-up / Negotiation' THEN 'negotiation'
        ELSE 'qualified'
      END,
      CASE 
        WHEN rec.pipeline_stage = 'Proposal Sent' THEN 30
        WHEN rec.pipeline_stage = 'Follow-up / Negotiation' THEN 50
        ELSE 20
      END,
      COALESCE(rec.created_at, now()),
      now()
    );
  END LOOP;
END $$;
