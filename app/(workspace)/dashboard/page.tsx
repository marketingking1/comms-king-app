import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FileText, Lightbulb, Wand2 } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const [briefsRes, ideasRes, scriptsRes] = await Promise.all([
    supabase.from("briefs").select("id", { count: "exact", head: true }),
    supabase.from("big_ideas").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("scripts").select("id", { count: "exact", head: true }).eq("status", "approved"),
  ]);

  const stats = [
    { label: "Briefs", value: briefsRes.count ?? 0, icon: FileText, href: "/briefs" },
    { label: "Big Ideas aprovadas", value: ideasRes.count ?? 0, icon: Lightbulb, href: "/ideas" },
    { label: "Roteiros aprovados", value: scriptsRes.count ?? 0, icon: Wand2, href: "/scripts" },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Squad de social media — King of Languages
          </p>
        </div>
        <Button asChild>
          <Link href="/briefs/new">
            <Plus className="h-4 w-4" />
            Novo brief
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{stat.value}</div>
                <Link
                  href={stat.href}
                  className="text-xs text-muted-foreground hover:text-foreground mt-2 inline-block"
                >
                  Ver todos →
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos passos</CardTitle>
          <CardDescription>
            Como usar o squad pra produzir conteúdo de marca
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              Criar <Link href="/briefs/new" className="text-foreground underline">brief estratégico</Link> com o
              {" "}<code className="bg-muted px-1 rounded">comms-head</code>
            </li>
            <li>
              Gerar 3 Big Ideas com o <code className="bg-muted px-1 rounded">comms-million-strategist</code>
            </li>
            <li>
              Aprovar uma Big Idea e gerar conceito narrativo com o <code className="bg-muted px-1 rounded">comms-storyteller-viral</code>
            </li>
            <li>
              Decidir formato/plataforma com o <code className="bg-muted px-1 rounded">comms-funnel-curator</code>
            </li>
            <li>
              Roteiro publicável com o <code className="bg-muted px-1 rounded">comms-scriptwriter</code>
            </li>
            <li>
              Brief de edição com o <code className="bg-muted px-1 rounded">comms-edit-director</code>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
