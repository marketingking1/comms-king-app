import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ViralToolbar } from "./toolbar";
import { ViralList } from "./viral-list";
import type { ViralVideo } from "./video-card";

export const dynamic = "force-dynamic";

export default async function ViralPage() {
  const supabase = await createSupabaseServerClient();

  // Janela 48h pra "vídeos virais DO DIA" (alguma tolerância pra latência do scraper).
  // Filtro de comments_count vai pro client (slider) — busca tudo até limit 500.
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  const { data: videos } = await supabase
    .from("viral_videos")
    .select("*")
    .gte("fetched_at", since)
    .order("views_count", { ascending: false, nullsFirst: false })
    .limit(500);

  const all: ViralVideo[] = videos || [];
  const lastFetched = all[0]?.fetched_at;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Engajamento orgânico"
        title="Virais do dia"
        description="Reels virais do Instagram pra comentar e gerar visitas no perfil · janela 48h"
        actions={<ViralToolbar lastFetched={lastFetched} />}
      />

      {!all.length ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground space-y-3">
            <p>Sem virais ainda. Clica em &quot;Atualizar&quot; pra buscar.</p>
            <p className="text-xs">
              Apify hashtag scraper · ~2min · ~$0.10 por refresh
            </p>
          </CardContent>
        </Card>
      ) : (
        <ViralList videos={all} />
      )}
    </div>
  );
}
