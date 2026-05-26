-- comms-king-app · 0002 brief_types
-- Habilita comms.briefs a representar 5 tipos de briefing (não só 'mensal').
-- mensal continua exigindo month; demais tipos não.
-- source_trend_id é uma referência LOOSE (sem FK) — pode apontar pra public.trends
-- (cross-schema, evitamos FK) ou comms.zeitgeist_pieces conforme o caminho de entrada.

ALTER TABLE comms.briefs
  ADD COLUMN IF NOT EXISTS briefing_type text NOT NULL DEFAULT 'mensal'
    CHECK (briefing_type IN ('mensal','isolado','carrossel','post','trend'));

ALTER TABLE comms.briefs
  ALTER COLUMN month DROP NOT NULL;

ALTER TABLE comms.briefs
  ADD COLUMN IF NOT EXISTS source_trend_id uuid;

-- Garante que mensal sempre tem month (preserva invariante histórica)
ALTER TABLE comms.briefs
  DROP CONSTRAINT IF EXISTS briefs_mensal_requires_month;
ALTER TABLE comms.briefs
  ADD CONSTRAINT briefs_mensal_requires_month
    CHECK (briefing_type <> 'mensal' OR month IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_briefs_type ON comms.briefs(briefing_type);
