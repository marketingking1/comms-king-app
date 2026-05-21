"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Instagram, Music, Linkedin, Youtube, Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type Event = {
  id: string;
  script_id: string;
  scheduled_at: string;
  platform: string;
  status: string;
  pillar: string | null;
  funnel_stage: string | null;
};

type Script = {
  id: string;
  format: string | null;
  duration_sec: number | null;
  platform: string | null;
  status: string;
};

const PLATFORM_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  tiktok: Music,
  linkedin: Linkedin,
  youtube: Youtube,
};

export function CalendarView({
  initialEvents,
  availableScripts,
}: {
  initialEvents: Event[];
  availableScripts: Script[];
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [events, setEvents] = useState(initialEvents);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newScript, setNewScript] = useState("");
  const [newPlatform, setNewPlatform] = useState("instagram");
  const [newTime, setNewTime] = useState("11:00");
  const [newFunnel, setNewFunnel] = useState<"topo" | "meio" | "fundo">("topo");

  // Agrupa eventos por dia
  const days = generateDays(30);
  const byDay = new Map<string, Event[]>();
  for (const e of events) {
    const day = new Date(e.scheduled_at).toISOString().slice(0, 10);
    const arr = byDay.get(day) ?? [];
    arr.push(e);
    byDay.set(day, arr);
  }

  function openNew(date: Date) {
    setSelectedDate(date);
    setShowDialog(true);
  }

  async function schedule() {
    if (!selectedDate || !newScript) {
      toast.error("Selecione um roteiro");
      return;
    }
    const [h, m] = newTime.split(":").map(Number);
    const dt = new Date(selectedDate);
    dt.setHours(h, m, 0, 0);

    const { data, error } = await supabase
      .from("calendar")
      .insert({
        script_id: newScript,
        scheduled_at: dt.toISOString(),
        platform: newPlatform,
        funnel_stage: newFunnel,
        status: "planned",
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      return;
    }
    setEvents([...events, data]);
    setShowDialog(false);
    setNewScript("");
    toast.success("Agendado");
    router.refresh();
  }

  async function remove(eventId: string) {
    if (!confirm("Remover do calendário?")) return;
    const { error } = await supabase.from("calendar").delete().eq("id", eventId);
    if (error) toast.error(error.message);
    else {
      setEvents(events.filter((e) => e.id !== eventId));
      toast.success("Removido");
    }
  }

  return (
    <>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const dayKey = d.toISOString().slice(0, 10);
          const dayEvents = byDay.get(dayKey) || [];
          const isToday = d.toDateString() === new Date().toDateString();
          const isWeekend = [0, 6].includes(d.getDay());

          return (
            <Card
              key={dayKey}
              className={`min-h-32 ${isToday ? "border-primary" : ""} ${isWeekend ? "bg-muted/30" : ""}`}
            >
              <CardHeader className="p-2 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium">
                    {d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" })}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => openNew(d)}
                    className="h-5 w-5 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-2 pt-0 space-y-1">
                {dayEvents.map((e) => {
                  const Icon = PLATFORM_ICONS[e.platform] || Instagram;
                  return (
                    <div
                      key={e.id}
                      className="text-xs border rounded p-1.5 hover:bg-accent/50 group flex items-start justify-between gap-1"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          <span className="font-medium">
                            {new Date(e.scheduled_at).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {e.funnel_stage && (
                          <Badge variant="outline" className="text-[10px] mt-1 px-1 py-0">
                            {e.funnel_stage}
                          </Badge>
                        )}
                        <Link
                          href={`/scripts/${e.script_id}`}
                          className="block text-[10px] text-muted-foreground hover:text-foreground truncate"
                        >
                          ver roteiro
                        </Link>
                      </div>
                      <button
                        onClick={() => remove(e.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Agendar publicação · {selectedDate?.toLocaleDateString("pt-BR")}
            </DialogTitle>
            <DialogDescription>App não publica — gera lembrete pro time</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Roteiro</Label>
              <Select value={newScript} onValueChange={(v) => setNewScript(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolher roteiro..." />
                </SelectTrigger>
                <SelectContent>
                  {availableScripts.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhum roteiro disponível
                    </div>
                  )}
                  {availableScripts.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.format} · {s.duration_sec}s · {s.platform} ({s.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select value={newPlatform} onValueChange={(v) => setNewPlatform(v ?? "instagram")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Funil</Label>
                <Select
                  value={newFunnel}
                  onValueChange={(v) => setNewFunnel(v as typeof newFunnel)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="topo">Topo</SelectItem>
                    <SelectItem value="meio">Meio</SelectItem>
                    <SelectItem value="fundo">Fundo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={schedule} className="w-full">
              Agendar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function generateDays(count: number): Date[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}
