-- Categories table
CREATE TABLE categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'Folder',
  display_order INT NOT NULL DEFAULT 0
);

-- Enums
CREATE TYPE listing_category AS ENUM (
  'document_processing', 'case_management', 'client_communication',
  'legal_research', 'billing_time', 'compliance', 'general'
);
CREATE TYPE pricing_model AS ENUM ('free', 'freemium', 'paid', 'contact');
CREATE TYPE listing_source AS ENUM ('curated', 'submitted', 'partner');
CREATE TYPE listing_status AS ENUM ('published', 'pending_review', 'rejected');

-- Listings table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category listing_category NOT NULL DEFAULT 'general',
  mcp_repo_url TEXT,
  mcp_install_command TEXT,
  external_url TEXT,
  pricing_model pricing_model NOT NULL DEFAULT 'free',
  pricing_details TEXT,
  tags TEXT[] DEFAULT '{}',
  logo_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  source listing_source NOT NULL DEFAULT 'curated',
  status listing_status NOT NULL DEFAULT 'published',
  creator_name TEXT,
  creator_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_slug ON listings(slug);
CREATE INDEX idx_listings_featured ON listings(featured) WHERE featured = TRUE;

-- Submissions table
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_data JSONB NOT NULL,
  submitter_email TEXT NOT NULL,
  submitter_name TEXT NOT NULL DEFAULT '',
  status submission_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed categories
INSERT INTO categories (slug, name, description, icon, display_order) VALUES
  ('document-processing', 'Document Processing', 'AI tools for contract analysis, document review, PDF parsing, and legal document generation.', 'FileText', 1),
  ('case-management', 'Case Management', 'AI integrations for docket search, case tracking, matter management, and legal workflow automation.', 'Briefcase', 2),
  ('client-communication', 'Client Communication', 'AI-powered client intake, follow-up automation, chatbots, and communication management for law firms.', 'MessageSquare', 3),
  ('legal-research', 'Legal Research', 'AI tools for case law search, statute lookup, legal analysis, and research automation.', 'Search', 4),
  ('billing-time', 'Billing & Time', 'AI integrations for time tracking, invoice generation, billing automation, and financial management.', 'Clock', 5),
  ('compliance', 'Compliance', 'AI tools for regulatory compliance monitoring, risk assessment, and compliance reporting.', 'Shield', 6),
  ('general', 'General', 'General-purpose AI integrations useful across legal practice areas.', 'Sparkles', 7);

-- RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published listings" ON listings FOR SELECT USING (status = 'published');
CREATE POLICY "Public can read categories" ON categories FOR SELECT USING (TRUE);
CREATE POLICY "Public can submit" ON submissions FOR INSERT WITH CHECK (TRUE);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
