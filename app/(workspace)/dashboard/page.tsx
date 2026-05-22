import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FileText, Lightbulb, Wand2, ArrowUpRight, Film, Sparkles, Flame, CalendarDays } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const [briefsRes, ideasRes, scriptsRes, conceptsRes] = await Promise.all([
    supabase.from("briefs").select("id", { count: "exact", head: true }),
    supabase.from("big_ideas").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("scripts").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("concepts").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Briefs",
      value: briefsRes.count ?? 0,
      icon: FileText,
      href: "/briefs",
      accent: "from-brand-blue/15 to-transparent",
    },
    {
      label: "Big Ideas aprovadas",
      value: ideasRes.count ?? 0,
      icon: Lightbulb,
      href: "/ideas",
      accent: "from-brand-coral/15 to-transparent",
    },
    {
      label: "Conceitos",
      value: conceptsRes.count ?? 0,
      icon: Film,
      href: "/concepts",
      accent: "from-brand-cyan/15 to-transparent",
    },
    {
      label: "Roteiros aprovados",
      value: scriptsRes.count ?? 0,
      icon: Wand2,
      href: "/scripts",
      accent: "from-chart-5/15 to-transparent",
    },
  ];

  const pipeline = [
    { n: "01", agent: "comms-head", role: "Diagnóstico", desc: "Brief estratégico do mês", icon: FileText, href: "/briefs/new" },
    { n: "02", agent: "comms-million-strategist", role: "Big Ideas $1M", desc: "Fissura + Vilão + Herói", icon: Lightbulb, href: "/ideas" },
    { n: "03", agent: "comms-storyteller-viral", role: "Conceito narrativo", desc: "Arco + Hero Brand + STEPPS", icon: Film, href: "/concepts" },
    { n: "04", agent: "comms-funnel-curator", role: "Formato + plataforma", desc: "Topo/meio/fundo + 70/20/10", icon: Sparkles, href: "/concepts" },
    { n: "05", agent: "comms-scriptwriter", role: "Roteiro publicável", desc: "Linha-a-linha + caption", icon: Wand2, href: "/scripts" },
    { n: "06", agent: "comms-editorial-producer", role: "Calendário", desc: "Pauta + scheduling", icon: CalendarDays, href: "/calendar" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* HERO HEADER */}
      <div className="relative overflow-hidden rounded-3xl bg-sidebar text-sidebar-foreground p-8 lg:p-10">
        <div className="absolute inset-0 bg-brand-mesh opacity-50 pointer-events-none" />
        <div className="absolute -top-24 -right-12 h-72 w-72 rounded-full bg-brand-coral/20 blur-3xl" />
        <div className="relative z-10 flex items-start justify-between gap-6 flex-wrap">
          <div className="space-y-3 max-w-2xl stagger">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-[11px] font-medium">
              <Flame className="h-3.5 w-3.5 text-brand-coral" />
              Squad de social media · King of Languages
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.05]">
              Bem-vinda(o) ao<br />
              <span className="text-brand-coral">Comms King</span>
            </h1>
            <p className="text-sidebar-foreground/70 text-base lg:text-lg max-w-lg">
              Brief estratégico, Big Ideas, conceito narrativo, roteiro e calendário —
              tudo em um lugar.
            </p>
          </div>
          <Link
            href="/briefs/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-brand-coral text-white font-semibold text-sm shadow-[0_8px_24px_-6px_oklch(0.7_0.18_28_/_60%)] hover:shadow-[0_12px_32px_-6px_oklch(0.7_0.18_28_/_80%)] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Novo brief estratégico
          </Link>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="group">
              <Card className={`relative overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer bg-gradient-to-br ${stat.accent}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-background flex items-center justify-center shadow-sm">
                      <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
                  </div>
                  <div className="font-display text-4xl font-semibold tabular-nums leading-none">
                    {stat.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                    {stat.label}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* PIPELINE */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <CardTitle className="font-display text-2xl">Pipeline de produção</CardTitle>
              <CardDescription className="mt-1">
                Do diagnóstico ao agendamento — 6 estágios, 10 agentes
              </CardDescription>
            </div>
            <Link href="/briefs/new" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Começar pipeline
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ol className="divide-y stagger">
            {pipeline.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.n}>
                  <Link
                    href={p.href}
                    className="group flex items-center gap-4 p-5 hover:bg-accent/40 transition-colors cursor-pointer"
                  >
                    <div className="font-display text-3xl font-semibold text-muted-foreground/40 w-12 tabular-nums">
                      {p.n}
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-brand-blue/8 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-brand-blue" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{p.role}</p>
                      <p className="text-xs text-muted-foreground">{p.desc}</p>
                    </div>
                    <code className="hidden md:inline-block text-[10px] px-2 py-1 rounded-md bg-muted font-mono text-muted-foreground">
                      {p.agent}
                    </code>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
