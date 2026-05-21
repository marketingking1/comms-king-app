import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarView } from "./calendar-view";

export default async function CalendarPage() {
  const supabase = await createSupabaseServerClient();

  // Próximos 30 dias
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 30);

  const { data: events } = await supabase
    .from("calendar")
    .select("id, script_id, scheduled_at, platform, status, pillar, funnel_stage")
    .gte("scheduled_at", start.toISOString())
    .lte("scheduled_at", end.toISOString())
    .order("scheduled_at", { ascending: true });

  // Scripts disponíveis pra agendar
  const { data: availableScripts } = await supabase
    .from("scripts")
    .select("id, format, duration_sec, platform, status")
    .in("status", ["approved", "draft"]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Calendário editorial</h1>
        <p className="text-muted-foreground mt-1">
          Próximos 30 dias — comms-editorial-producer
        </p>
      </div>

      <CalendarView
        initialEvents={events || []}
        availableScripts={availableScripts || []}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas da grade</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Total agendado</p>
            <p className="text-2xl font-semibold">{events?.length || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Topo de funil</p>
            <p className="text-2xl font-semibold">
              {events?.filter((e) => e.funnel_stage === "topo").length || 0}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Meio de funil</p>
            <p className="text-2xl font-semibold">
              {events?.filter((e) => e.funnel_stage === "meio").length || 0}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Fundo de funil</p>
            <p className="text-2xl font-semibold">
              {events?.filter((e) => e.funnel_stage === "fundo").length || 0}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
