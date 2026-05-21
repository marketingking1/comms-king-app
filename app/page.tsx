import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            King of Languages
          </p>
          <h1 className="text-5xl font-semibold tracking-tight">
            Comms King
          </h1>
          <p className="text-lg text-muted-foreground">
            Squad multi-agente de social media orgânico.
            <br />
            10 agentes especializados rodando em Claude + GPT.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-4">
          <Button asChild size="lg">
            <Link href="/login">Entrar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
