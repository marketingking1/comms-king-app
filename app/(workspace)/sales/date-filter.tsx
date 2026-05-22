"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

export function DateFilter({ initialFrom, initialTo }: { initialFrom: string; initialTo: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);

  function applyRange(newFrom: string, newTo: string) {
    const params = new URLSearchParams(searchParams);
    params.set("from", newFrom);
    params.set("to", newTo);
    router.push(`/sales?${params}`);
  }

  function preset(p: "today" | "7d" | "30d" | "mtd" | "lastmonth" | "ytd") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let f = new Date(today);
    let t = new Date(today);

    switch (p) {
      case "today":
        break;
      case "7d":
        f.setDate(f.getDate() - 6);
        break;
      case "30d":
        f.setDate(f.getDate() - 29);
        break;
      case "mtd":
        f = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "lastmonth": {
        f = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        t = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      }
      case "ytd":
        f = new Date(today.getFullYear(), 0, 1);
        break;
    }
    const fStr = f.toISOString().slice(0, 10);
    const tStr = t.toISOString().slice(0, 10);
    setFrom(fStr);
    setTo(tStr);
    applyRange(fStr, tStr);
  }

  function applyCustom(e: React.FormEvent) {
    e.preventDefault();
    applyRange(from, to);
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <form onSubmit={applyCustom} className="flex items-end gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="from" className="text-xs">De</Label>
              <Input
                id="from"
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="to" className="text-xs">Até</Label>
              <Input
                id="to"
                type="date"
                value={to}
                min={from}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setTo(e.target.value)}
                className="h-8"
              />
            </div>
            <Button type="submit" size="sm">Aplicar</Button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            <PresetBtn onClick={() => preset("today")}>Hoje</PresetBtn>
            <PresetBtn onClick={() => preset("7d")}>7d</PresetBtn>
            <PresetBtn onClick={() => preset("30d")}>30d</PresetBtn>
            <PresetBtn onClick={() => preset("mtd")} highlight>Mês atual</PresetBtn>
            <PresetBtn onClick={() => preset("lastmonth")}>Mês passado</PresetBtn>
            <PresetBtn onClick={() => preset("ytd")}>YTD</PresetBtn>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PresetBtn({
  children,
  onClick,
  highlight,
}: {
  children: React.ReactNode;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={highlight ? "secondary" : "ghost"}
      className="h-7 text-xs"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
