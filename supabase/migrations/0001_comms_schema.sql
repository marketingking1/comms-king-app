-- comms-king-app · F0 schema
-- Schema isolado pro squad de comunicação orgânica
-- Não conflita com king.* (squad growth) nem queen.* (Teacher Queen) nem public.* (kommo, ads, etc.)

CREATE SCHEMA IF NOT EXISTS comms;

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner','head','strategist','creator','editor','analyst','viewer')),
  display_name text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- BRIEFS (mensais — comms-head)
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','archived')),
  pillars jsonb DEFAULT '[]'::jsonb,
  obsession_metric text,
  positioning jsonb DEFAULT '{}'::jsonb,
  restrictions jsonb DEFAULT '{}'::jsonb,
  raw_markdown text,
  created_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_briefs_month ON comms.briefs(month);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON comms.briefs(status);

-- ============================================================
-- BIG IDEAS (million-strategist)
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.big_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id uuid REFERENCES comms.briefs(id) ON DELETE CASCADE,
  title text NOT NULL,
  thesis text,
  manifesto text,
  anatomy jsonb DEFAULT '{}'::jsonb,
  why_million text,
  execution_signals jsonb DEFAULT '{}'::jsonb,
  restrictions jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','rejected','archived')),
  rejection_reason text,
  raw_markdown text,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_big_ideas_brief ON comms.big_ideas(brief_id);
CREATE INDEX IF NOT EXISTS idx_big_ideas_status ON comms.big_ideas(status);

-- ============================================================
-- ZEITGEIST (zeitgeist-hunter)
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.zeitgeist_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id uuid REFERENCES comms.briefs(id),
  topic text NOT NULL,
  source text,
  window_type text CHECK (window_type IN ('le48h','1-2sem','2-4sem','30+')),
  expires_at timestamptz,
  obvious_angle text,
  king_angle text,
  king_connection jsonb DEFAULT '{}'::jsonb,
  risks jsonb DEFAULT '{}'::jsonb,
  execution_recommendation jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_pipeline','used','expired','rejected')),
  used_in_piece_id uuid,
  raw_markdown text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_zeitgeist_status ON comms.zeitgeist_pieces(status);
CREATE INDEX IF NOT EXISTS idx_zeitgeist_expires ON comms.zeitgeist_pieces(expires_at);

-- ============================================================
-- CONCEPTS (storyteller-viral)
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  big_idea_id uuid REFERENCES comms.big_ideas(id) ON DELETE CASCADE,
  zeitgeist_id uuid REFERENCES comms.zeitgeist_pieces(id) ON DELETE SET NULL,
  narrative_model text,
  hook_verbal text,
  hook_visual text,
  arc_beats jsonb DEFAULT '[]'::jsonb,
  turning_point jsonb DEFAULT '{}'::jsonb,
  stepps_dominant text,
  hero_brand_checklist jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','rejected')),
  raw_markdown text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_concepts_big_idea ON comms.concepts(big_idea_id);

-- ============================================================
-- FUNNEL DECISIONS (funnel-curator)
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.funnel_decisions (
  concept_id uuid PRIMARY KEY REFERENCES comms.concepts(id) ON DELETE CASCADE,
  funnel_stage text CHECK (funnel_stage IN ('topo','meio','fundo')),
  format text,
  duration_sec int,
  platform_primary text DEFAULT 'instagram',
  platforms_adapted jsonb DEFAULT '[]'::jsonb,
  behavior_objective text,
  slot_702010 text CHECK (slot_702010 IN ('validado','teste','melhoria')),
  justification text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- SCRIPTS (scriptwriter) — editor inline
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id uuid REFERENCES comms.concepts(id) ON DELETE CASCADE,
  format text,
  duration_sec int,
  platform text,
  beats jsonb DEFAULT '[]'::jsonb,
  caption text,
  hashtags text[] DEFAULT '{}',
  audio_recommendation jsonb DEFAULT '{}'::jsonb,
  variations jsonb DEFAULT '{}'::jsonb,
  rich_content jsonb,
  raw_markdown text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','reviewing','approved','published')),
  edited_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scripts_concept ON comms.scripts(concept_id);
CREATE INDEX IF NOT EXISTS idx_scripts_status ON comms.scripts(status);

-- ============================================================
-- EDIT BRIEFS (edit-director → editora humana)
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.edit_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid REFERENCES comms.scripts(id) ON DELETE CASCADE,
  tech_spec jsonb DEFAULT '{}'::jsonb,
  style jsonb DEFAULT '{}'::jsonb,
  cut_table jsonb DEFAULT '[]'::jsonb,
  sound_design jsonb DEFAULT '{}'::jsonb,
  legends jsonb DEFAULT '{}'::jsonb,
  thumb_brief jsonb DEFAULT '{}'::jsonb,
  references_links text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','in_edit','ready','published')),
  assigned_to uuid REFERENCES auth.users(id),
  raw_markdown text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_edit_briefs_status ON comms.edit_briefs(status);

-- ============================================================
-- PIECES (publicadas)
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid REFERENCES comms.scripts(id),
  ig_media_id text,
  platform text NOT NULL,
  published_at timestamptz NOT NULL,
  permalink text,
  published_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pieces_ig_media ON comms.pieces(ig_media_id) WHERE ig_media_id IS NOT NULL;

-- ============================================================
-- IG INSIGHTS (analyst-io)
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.ig_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id uuid REFERENCES comms.pieces(id) ON DELETE CASCADE,
  measured_at timestamptz NOT NULL,
  measurement_window text CHECK (measurement_window IN ('d1','d7','d14','monthly')),
  reach int,
  views int,
  saved int,
  shares int,
  comments int,
  likes int,
  total_interactions int,
  avg_watch_time_sec numeric,
  watch_through_pct numeric,
  raw_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ig_insights_piece ON comms.ig_insights(piece_id);
CREATE INDEX IF NOT EXISTS idx_ig_insights_window ON comms.ig_insights(measurement_window);

-- ============================================================
-- CALENDAR (editorial-producer)
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid REFERENCES comms.scripts(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  platform text NOT NULL,
  status text NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_production','ready','published','missed')),
  pillar text,
  funnel_stage text CHECK (funnel_stage IN ('topo','meio','fundo')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_calendar_scheduled ON comms.calendar(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_calendar_status ON comms.calendar(status);

-- ============================================================
-- COMMUNITY SIGNALS (community-manager)
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.community_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_of date,
  sentiment_summary jsonb DEFAULT '{}'::jsonb,
  top_objections jsonb DEFAULT '[]'::jsonb,
  fresh_language text[] DEFAULT '{}',
  emerging_zeitgeist jsonb DEFAULT '[]'::jsonb,
  ugc_candidates jsonb DEFAULT '[]'::jsonb,
  raw_export_path text,
  raw_markdown text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_week ON comms.community_signals(week_of);

-- ============================================================
-- LEARNINGS (analyst-io — inteligência documentada)
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id uuid REFERENCES comms.pieces(id) ON DELETE CASCADE,
  learning_text text NOT NULL,
  hypothesis text,
  affected_agents text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- AGENT RUNS (logs de execução)
-- ============================================================
CREATE TABLE IF NOT EXISTS comms.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL,
  provider text NOT NULL CHECK (provider IN ('anthropic','openai')),
  model text NOT NULL,
  input_tokens int,
  output_tokens int,
  cost_usd numeric(10,6),
  duration_ms int,
  status text NOT NULL CHECK (status IN ('success','failed','aborted')),
  error_message text,
  triggered_by uuid REFERENCES auth.users(id),
  related_entity_type text,
  related_entity_id uuid,
  raw_output text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent ON comms.agent_runs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON comms.agent_runs(status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created ON comms.agent_runs(created_at);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE comms.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.big_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.zeitgeist_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.funnel_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.edit_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.ig_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.community_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.learnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms.agent_runs ENABLE ROW LEVEL SECURITY;

-- Função helper pra checar role
CREATE OR REPLACE FUNCTION comms.user_has_role(target_user_id uuid, required_roles text[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM comms.user_roles
    WHERE user_id = target_user_id AND role = ANY(required_roles)
  );
$$;

-- Policies: authenticated users com role veem tudo (F0 simples)
-- F3 vai diferenciar permissões granulares

DROP POLICY IF EXISTS "authenticated_read" ON comms.user_roles;
CREATE POLICY "authenticated_read" ON comms.user_roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "team_full_access" ON comms.briefs;
CREATE POLICY "team_full_access" ON comms.briefs TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

DROP POLICY IF EXISTS "team_full_access" ON comms.big_ideas;
CREATE POLICY "team_full_access" ON comms.big_ideas TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

DROP POLICY IF EXISTS "team_full_access" ON comms.zeitgeist_pieces;
CREATE POLICY "team_full_access" ON comms.zeitgeist_pieces TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

DROP POLICY IF EXISTS "team_full_access" ON comms.concepts;
CREATE POLICY "team_full_access" ON comms.concepts TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

DROP POLICY IF EXISTS "team_full_access" ON comms.funnel_decisions;
CREATE POLICY "team_full_access" ON comms.funnel_decisions TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

DROP POLICY IF EXISTS "team_full_access" ON comms.scripts;
CREATE POLICY "team_full_access" ON comms.scripts TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

DROP POLICY IF EXISTS "team_full_access" ON comms.edit_briefs;
CREATE POLICY "team_full_access" ON comms.edit_briefs TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

DROP POLICY IF EXISTS "team_full_access" ON comms.pieces;
CREATE POLICY "team_full_access" ON comms.pieces TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

DROP POLICY IF EXISTS "team_full_access" ON comms.ig_insights;
CREATE POLICY "team_full_access" ON comms.ig_insights TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

DROP POLICY IF EXISTS "team_full_access" ON comms.calendar;
CREATE POLICY "team_full_access" ON comms.calendar TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

DROP POLICY IF EXISTS "team_full_access" ON comms.community_signals;
CREATE POLICY "team_full_access" ON comms.community_signals TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

DROP POLICY IF EXISTS "team_full_access" ON comms.learnings;
CREATE POLICY "team_full_access" ON comms.learnings TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

DROP POLICY IF EXISTS "team_full_access" ON comms.agent_runs;
CREATE POLICY "team_full_access" ON comms.agent_runs TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

-- Grants pra schema
GRANT USAGE ON SCHEMA comms TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA comms TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA comms TO authenticated;
GRANT EXECUTE ON FUNCTION comms.user_has_role(uuid, text[]) TO authenticated;
