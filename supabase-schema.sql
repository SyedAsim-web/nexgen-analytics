-- ─── Enable UUID extension ─────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Projects (Websites) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  integrations JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Collaborators ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id),
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  accepted BOOLEAN DEFAULT FALSE,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, email)
);

-- ─── GSC Cache ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gsc_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(6,4) DEFAULT 0,
  position DECIMAL(8,2) DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, date)
);

CREATE TABLE IF NOT EXISTS gsc_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr DECIMAL(6,4) DEFAULT 0,
  position DECIMAL(8,2) DEFAULT 0,
  date_range TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GA4 Cache ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ga4_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  bounce_rate DECIMAL(6,4) DEFAULT 0,
  avg_session_duration DECIMAL(10,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, date)
);

-- ─── Row Level Security ─────────────────────────────────────────
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ga4_data ENABLE ROW LEVEL SECURITY;

-- Projects: owner can do everything, collaborators can read
CREATE POLICY "Owner full access" ON projects
  FOR ALL USING (auth.uid()::text = owner_id::text);

CREATE POLICY "Collaborator read access" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collaborators
      WHERE project_id = projects.id
        AND email = auth.jwt()->>'email'
        AND accepted = true
    )
  );

-- Collaborators: project owner manages
CREATE POLICY "Owner manages collaborators" ON collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = collaborators.project_id
        AND owner_id::text = auth.uid()::text
    )
  );

-- Data tables: accessible to project members
CREATE POLICY "Project members read gsc" ON gsc_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE id = gsc_data.project_id
        AND (
          owner_id::text = auth.uid()::text
          OR EXISTS (
            SELECT 1 FROM collaborators c
            WHERE c.project_id = gsc_data.project_id
              AND c.email = auth.jwt()->>'email'
              AND c.accepted = true
          )
        )
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
