import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export async function TeamPanel() {
  const admin = createSupabaseAdminClient();
  const { data: members } = await admin
    .from("user_roles")
    .select("user_id, role, display_name, created_at");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Time</CardTitle>
        <CardDescription>
          Membros com role atribuída. Pra adicionar novo: signup pelo /login → roda SQL pra dar role.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!members?.length ? (
          <p className="text-sm text-muted-foreground">Só você por enquanto.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center justify-between border rounded p-3 text-sm"
              >
                <div>
                  <p className="font-medium">{m.display_name || "—"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{m.user_id}</p>
                </div>
                <Badge variant={m.role === "owner" ? "default" : "secondary"}>
                  {m.role}
                </Badge>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 p-3 bg-muted/40 rounded text-xs">
          <p className="font-medium mb-2">Adicionar novo membro</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Pessoa faz signup em /login com email próprio</li>
            <li>Owner roda SQL no Supabase Studio:
              <code className="block bg-background p-2 mt-1 rounded">
                INSERT INTO comms.user_roles (user_id, role, display_name)<br />
                VALUES (&apos;{`{user_id_aqui}`}&apos;, &apos;creator&apos;, &apos;Nome&apos;);
              </code>
            </li>
            <li>Roles disponíveis: owner · head · strategist · creator · editor · analyst · viewer</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
