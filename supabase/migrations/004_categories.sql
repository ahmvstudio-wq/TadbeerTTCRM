-- Categories & Folder System

-- Lead Categories (manual selection)
CREATE TABLE IF NOT EXISTS lead_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0D4F4F',
  icon TEXT DEFAULT 'folder',
  parent_id UUID REFERENCES lead_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Outreach Categories (manual selection)
CREATE TABLE IF NOT EXISTS outreach_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0D4F4F',
  icon TEXT DEFAULT 'send',
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link leads to categories (many-to-many)
CREATE TABLE IF NOT EXISTS lead_category_links (
  lead_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES lead_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (lead_id, category_id)
);

-- Link outreach entries to categories
CREATE TABLE IF NOT EXISTS outreach_category_links (
  outreach_id UUID,
  outreach_type TEXT,
  category_id UUID REFERENCES outreach_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (outreach_id, category_id)
);

-- Add category fields to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lead_type TEXT DEFAULT 'Cold';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS lead_folder TEXT DEFAULT 'Unsorted';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_categories_parent ON lead_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_companies_lead_type ON companies(lead_type);
CREATE INDEX IF NOT EXISTS idx_companies_lead_folder ON companies(lead_folder);

-- Seed default lead categories
INSERT INTO lead_categories (name, color, icon, sort_order) VALUES
  ('Hot Leads', '#ef4444', 'flame', 1),
  ('Warm Leads', '#f59e0b', 'sun', 2),
  ('Cold Leads', '#3b82f6', 'snowflake', 3),
  ('Referrals', '#10b981', 'users', 4),
  ('Inbound', '#8b5cf6', 'arrow-down-left', 5),
  ('Outbound', '#0d9488', 'arrow-up-right', 6),
  ('Event Leads', '#ec4899', 'calendar', 7),
  ('Website Leads', '#6366f1', 'globe', 8);

-- Seed default outreach categories
INSERT INTO outreach_categories (name, color, icon, description, sort_order) VALUES
  ('Cold Outreach', '#3b82f6', 'snowflake', 'First-time contact with no prior relationship', 1),
  ('Warm Follow-up', '#f59e0b', 'sun', 'Following up on previous interaction', 2),
  ('Re-engagement', '#8b5cf6', 'refresh-cw', 'Re-activating dormant leads', 3),
  ('Upsell/Cross-sell', '#10b981', 'trending-up', 'Existing clients — new services', 4),
  ('Referral Outreach', '#ec4899', 'users', 'Contacts from referrals', 5),
  ('Event Follow-up', '#0d9488', 'calendar', 'Post-event networking', 6),
  ('Demo/Presentation', '#6366f1', 'presentation', 'Product demo or pitch meetings', 7),
  ('Contract Negotiation', '#ef4444', 'file-text', 'Active deal discussions', 8);

-- Seed some lead type options for companies
COMMENT ON COLUMN companies.lead_type IS 'Manual selection: Cold, Warm, Hot, Referral, Inbound, VIP, Dormant';
COMMENT ON COLUMN companies.lead_folder IS 'Manual folder assignment for organization';
