import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { ViralToolbar } from "./toolbar";
import { ViralVideoCard, type ViralVideo } from "./video-card";

export const dynamic = "force-dynamic";

export default async function ViralPage() {
  const supabase = await createSupabaseServerClient();

  // Janela 48h pra "vídeos virais DO DIA" (alguma tolerância pra latência do scraper)
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  const { data: videos } = await supabase
    .from("viral_videos")
    .select("*")
    .gte("fetched_at", since)
    .order("views_count", { ascending: false, nullsFirst: false })
    .limit(200);

  const all: ViralVideo[] = videos || [];
  const novos = all.filter((v) => v.status === "new");
  const comentados = all.filter((v) => v.status === "commented");
  const skipped = all.filter((v) => v.status === "skipped");

  const lastFetched = all[0]?.fetched_at;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Engajamento orgânico"
        title="Virais do dia"
        description="Reels virais do Instagram pra comentar e gerar visitas no perfil · refresh manual ou diário"
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
        <Tabs defaultValue="novos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="novos">Novos ({novos.length})</TabsTrigger>
            <TabsTrigger value="comentados">Comentei ({comentados.length})</TabsTrigger>
            <TabsTrigger value="skipped">Pulei ({skipped.length})</TabsTrigger>
            <TabsTrigger value="all">Tudo ({all.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="novos">
            <VideoGrid videos={novos} emptyMessage="Sem virais novos. Atualize ou bom trabalho — comentou em tudo." />
          </TabsContent>

          <TabsContent value="comentados">
            <VideoGrid videos={comentados} emptyMessage="Ainda não comentou em nenhum." />
          </TabsContent>

          <TabsContent value="skipped">
            <VideoGrid videos={skipped} emptyMessage="Nenhum pulado." />
          </TabsContent>

          <TabsContent value="all">
            <VideoGrid videos={all} emptyMessage="—" />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function VideoGrid({ videos, emptyMessage }: { videos: ViralVideo[]; emptyMessage: string }) {
  if (!videos.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          {emptyMessage}
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videos.map((v) => (
        <ViralVideoCard key={v.id} video={v} />
      ))}
    </div>
  );
}
