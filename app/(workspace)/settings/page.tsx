import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm } from "./change-password";
import { TeamPanel } from "./team-panel";
import { CostPanel } from "./cost-panel";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: role } = await supabase
    .from("user_roles")
    .select("role, display_name")
    .eq("user_id", user?.id || "")
    .single();

  const isOwner = role?.role === "owner";

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Perfil · senha · time · custos LLM
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sua conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-xs">Email</p>
              <p>{user?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Role</p>
              <p className="capitalize">{role?.role || "sem role"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Nome</p>
              <p>{role?.display_name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">User ID</p>
              <p className="font-mono text-xs">{user?.id}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trocar senha</CardTitle>
          <CardDescription>Mínimo 6 caracteres. Sessão atualizada após salvar.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      {isOwner && <TeamPanel />}

      {isOwner && <CostPanel />}
    </div>
  );
}
