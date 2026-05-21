import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export async function CostPanel() {
  const admin = createSupabaseAdminClient();

  // últimos 30 dias
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const { data: runs } = await admin
    .from("agent_runs")
    .select("agent_name, provider, model, cost_usd, input_tokens, output_tokens, status, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);

  const totalCost = runs?.reduce((s, r) => s + (Number(r.cost_usd) || 0), 0) || 0;
  const totalRuns = runs?.length || 0;
  const errored = runs?.filter((r) => r.status === "failed").length || 0;

  // Agrupar por agente
  const byAgent = new Map<string, { count: number; cost: number; tokens_in: number; tokens_out: number }>();
  for (const r of runs || []) {
    const cur = byAgent.get(r.agent_name) ?? { count: 0, cost: 0, tokens_in: 0, tokens_out: 0 };
    cur.count += 1;
    cur.cost += Number(r.cost_usd) || 0;
    cur.tokens_in += r.input_tokens || 0;
    cur.tokens_out += r.output_tokens || 0;
    byAgent.set(r.agent_name, cur);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Custos LLM (últimos 30 dias)</CardTitle>
        <CardDescription>
          Soma de chamadas Claude + GPT
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Total gasto</p>
            <p className="text-2xl font-semibold">US$ {totalCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Chamadas</p>
            <p className="text-2xl font-semibold">{totalRuns}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Erros</p>
            <p className="text-2xl font-semibold">{errored}</p>
          </div>
        </div>

        {byAgent.size > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Por agente</p>
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="text-left py-2 pr-2">Agente</th>
                  <th className="text-right py-2 pr-2">Chamadas</th>
                  <th className="text-right py-2 pr-2">Tokens in</th>
                  <th className="text-right py-2 pr-2">Tokens out</th>
                  <th className="text-right py-2">Custo</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(byAgent.entries())
                  .sort((a, b) => b[1].cost - a[1].cost)
                  .map(([name, s]) => (
                    <tr key={name} className="border-b">
                      <td className="py-2 pr-2 font-medium">{name}</td>
                      <td className="py-2 pr-2 text-right">{s.count}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {s.tokens_in.toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">
                        {s.tokens_out.toLocaleString("pt-BR")}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        US$ {s.cost.toFixed(3)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {totalRuns === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma chamada nos últimos 30 dias.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
