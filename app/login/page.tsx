"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "sign_in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vinda(o) ao Comms King");
        router.push("/dashboard");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Conta criada. Verifique seu email.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 grid lg:grid-cols-2 min-h-screen">
      {/* PAINEL ESQUERDO — marca em dark navy */}
      <div className="hidden lg:flex relative bg-sidebar text-sidebar-foreground p-12 flex-col justify-between overflow-hidden">
        {/* Decorativo: gradient mesh + glow */}
        <div className="absolute inset-0 bg-brand-mesh opacity-60 pointer-events-none" />
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-brand-coral/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand-blue/30 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="relative h-12 w-12 drop-shadow-[0_0_24px_rgba(229,57,53,0.35)]">
            <Image src="/brand/lion-red.png" alt="King" fill sizes="48px" className="object-contain" priority />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-sidebar-foreground/60">King of Languages</p>
            <p className="font-display text-xl font-semibold -mt-0.5">Comms King</p>
          </div>
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5 text-brand-coral" />
            Squad multi-agente de comunicação orgânica
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight">
            Conteúdo que <span className="text-brand-coral">não é</span><br />conteúdo qualquer.
          </h1>
          <p className="text-sidebar-foreground/70 text-lg leading-relaxed">
            Brief estratégico, Big Ideas $1M, conceito narrativo, roteiro e calendário —
            tudo conectado, do diagnóstico ao agendamento.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8 text-xs text-sidebar-foreground/60">
          <div>
            <p className="font-display text-2xl text-sidebar-foreground font-semibold">10</p>
            <p>agentes especializados</p>
          </div>
          <div className="h-8 w-px bg-sidebar-border" />
          <div>
            <p className="font-display text-2xl text-sidebar-foreground font-semibold">+9 mil</p>
            <p>alunos King</p>
          </div>
          <div className="h-8 w-px bg-sidebar-border" />
          <div>
            <p className="font-display text-2xl text-sidebar-foreground font-semibold">4</p>
            <p>plataformas</p>
          </div>
        </div>
      </div>

      {/* PAINEL DIREITO — formulário */}
      <div className="flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="w-full max-w-sm space-y-8">
          {/* Brand mobile (sm only) */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <div className="relative h-10 w-10">
              <Image src="/brand/lion-blue.png" alt="King" fill sizes="40px" className="object-contain" priority />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">King of Languages</p>
              <p className="font-display text-lg font-semibold -mt-0.5">Comms King</p>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-4xl font-semibold tracking-tight">
              {mode === "sign_in" ? "Bem-vinda(o)" : "Criar conta"}
            </h2>
            <p className="text-muted-foreground">
              {mode === "sign_in"
                ? "Entre pra continuar de onde parou"
                : "Crie sua conta pra acessar o squad"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@kingoflanguages.com.br"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 cursor-pointer group" disabled={loading}>
              {loading ? "..." : (
                <>
                  {mode === "sign_in" ? "Entrar" : "Criar conta"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "sign_in" ? "sign_up" : "sign_in")}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            {mode === "sign_in"
              ? "Sem conta? Criar uma →"
              : "Já tem conta? Entrar →"}
          </button>
        </div>
      </div>
    </div>
  );
}
