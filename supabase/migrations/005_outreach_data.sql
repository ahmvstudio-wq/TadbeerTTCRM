-- Outreach Data Tables

-- Outreach Touches
CREATE TABLE IF NOT EXISTS outreach_touches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  channel TEXT CHECK (channel IN ('whatsapp','linkedin','email','call','meeting')) NOT NULL,
  step_number INTEGER DEFAULT 1,
  message TEXT,
  status TEXT DEFAULT 'sent',
  response TEXT,
  follow_up_date DATE,
  campaign_id TEXT,
  is_call BOOLEAN DEFAULT false,
  call_duration INTEGER,
  call_outcome TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Outreach Campaigns
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  lead_ids UUID[] DEFAULT '{}',
  status TEXT CHECK (status IN ('active','completed','paused')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Outreach Reached
CREATE TABLE IF NOT EXISTS outreach_reached (
  lead_id UUID PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  reached_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_outreach_touches_lead ON outreach_touches(lead_id);
CREATE INDEX IF NOT EXISTS idx_outreach_touches_campaign ON outreach_touches(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_touches_sent ON outreach_touches(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_touches_followup ON outreach_touches(follow_up_date);

-- RLS
ALTER TABLE outreach_touches ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_reached ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage outreach touches" ON outreach_touches FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage campaigns" ON outreach_campaigns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage reached" ON outreach_reached FOR ALL USING (auth.role() = 'authenticated');
