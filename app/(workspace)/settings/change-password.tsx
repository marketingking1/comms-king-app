"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function ChangePasswordForm() {
  const supabase = createSupabaseBrowserClient();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pass.length < 6) {
      toast.error("Mínimo 6 caracteres");
      return;
    }
    if (pass !== confirm) {
      toast.error("Senhas não batem");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Senha atualizada");
      setPass("");
      setConfirm("");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="new-pass">Nova senha</Label>
        <Input
          id="new-pass"
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirmar</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          minLength={6}
        />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Salvando..." : "Atualizar senha"}
      </Button>
    </form>
  );
}
