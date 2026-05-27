-- comms-king-app · 0003 viral_videos
-- Tabela pro feed "Virais do dia" — vídeos virais raspados via Apify p/ comentar e gerar visitas no perfil.
-- Pattern espelhado em comms.trends (criada fora deste migration set, viva no banco prod).

CREATE TABLE IF NOT EXISTS comms.viral_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  platform text NOT NULL DEFAULT 'instagram'
    CHECK (platform IN ('instagram','tiktok','youtube')),
  external_id text NOT NULL,            -- shortCode (IG), aweme_id (TT), videoId (YT)
  url text NOT NULL,                    -- permalink direto pro post
  caption text,
  hashtag_source text,                  -- hashtag em que o post foi descoberto
  hashtags text[] DEFAULT '{}',         -- todas as hashtags do post

  -- autor
  author_username text,
  author_full_name text,
  author_profile_url text,
  author_id text,
  author_followers int,
  author_is_verified boolean DEFAULT false,

  -- mídia
  thumbnail_url text,
  video_url text,
  media_type text CHECK (media_type IN ('video','image','carousel')),
  duration_sec numeric,

  -- métricas (bigint p/ views grandes)
  views_count bigint,
  likes_count bigint,
  comments_count int,

  -- temporal
  posted_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),

  -- workflow (estado do comentário do squad)
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','commented','skipped')),
  commented_at timestamptz,
  commented_by uuid REFERENCES auth.users(id),

  -- raw payload pra debug / re-processamento
  metadata jsonb DEFAULT '{}'::jsonb,

  UNIQUE(platform, external_id)
);

-- Lookup principal: lista do feed = status='new' + ordenado por views desc
CREATE INDEX IF NOT EXISTS idx_viral_videos_status_fetched
  ON comms.viral_videos(status, fetched_at DESC);

CREATE INDEX IF NOT EXISTS idx_viral_videos_views
  ON comms.viral_videos(views_count DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_viral_videos_posted
  ON comms.viral_videos(posted_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_viral_videos_platform_status
  ON comms.viral_videos(platform, status);

-- RLS — mesmo pattern de comms.trends (acesso total p/ squad com role)
ALTER TABLE comms.viral_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_full_access" ON comms.viral_videos;
CREATE POLICY "team_full_access" ON comms.viral_videos TO authenticated
  USING (comms.user_has_role(auth.uid(), ARRAY['owner','head','strategist','creator','editor','analyst','viewer']));

GRANT ALL ON comms.viral_videos TO authenticated;
