"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plug, Unplug } from "lucide-react";
import { toast } from "sonner";

export function SetupWizard() {
  return (
    <Button onClick={() => (window.location.href = "/api/ga4/auth")}>
      <Plug className="h-4 w-4" />
      Conectar com Google
    </Button>
  );
}

type Property = { name: string; displayName: string; account: string };

export function PropertySelector() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ga4/property")
      .then((r) => r.json())
      .then((d) => {
        if (d.properties) setProperties(d.properties);
        else if (d.error) toast.error(d.error);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!selected) return;
    const res = await fetch("/api/ga4/property", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: selected }),
    });
    if (res.ok) {
      toast.success("Property salva");
      router.refresh();
    } else {
      const d = await res.json();
      toast.error(d.error || "Erro");
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando properties...</p>;
  }

  if (properties.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma property GA4 acessível com essa conta. Confirme permissões.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <Select value={selected} onValueChange={(v) => setSelected(v ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder="Escolher property..." />
        </SelectTrigger>
        <SelectContent>
          {properties.map((p) => (
            <SelectItem key={p.name} value={p.name}>
              {p.displayName} <span className="text-muted-foreground text-xs">({p.account})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={save} disabled={!selected}>
        Salvar
      </Button>
    </div>
  );
}

export function DisconnectButton() {
  const router = useRouter();
  async function disconnect() {
    if (!confirm("Desconectar GA4?")) return;
    await fetch("/api/ga4/disconnect", { method: "POST" });
    toast.success("Desconectado");
    router.refresh();
  }
  return (
    <Button variant="outline" size="sm" onClick={disconnect}>
      <Unplug className="h-4 w-4" />
      Desconectar
    </Button>
  );
}
