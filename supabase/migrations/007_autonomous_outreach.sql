-- Migration 007: Autonomous Research-Grounded Outreach Framework & Playbooks

-- 1. Add schema columns to companies table for research & AI generated drafts
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS research_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS gatekeeper_type TEXT DEFAULT 'owner'; -- 'owner' | 'manager'
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS draft_message TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS draft_angle_reasoning TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS draft_status TEXT DEFAULT 'pending'; -- 'pending' | 'ready_to_send' | 'sent'
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;

-- 2. Create category_playbooks table
CREATE TABLE IF NOT EXISTS public.category_playbooks (
  category TEXT PRIMARY KEY,
  pain_points TEXT NOT NULL,
  tone_notes TEXT NOT NULL,
  angle_examples TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for category_playbooks
ALTER TABLE public.category_playbooks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for category_playbooks" ON public.category_playbooks;
CREATE POLICY "Allow all for category_playbooks" ON public.category_playbooks FOR ALL USING (true) WITH CHECK (true);

-- Seed initial category playbooks for researched Oman SME categories
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
