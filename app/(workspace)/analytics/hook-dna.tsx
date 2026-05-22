"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Microscope } from "lucide-react";
import { toast } from "sonner";

type PieceSnapshot = {
  id: string;
  caption: string;
  permalink: string;
  reach: number;
  share_rate: number;
  format: string;
};

type Classification = {
  pieceIndex: number;
  hook_type: string;
  pov: string;
  first_useful_info_at_word: number;
  tension_promised: string;
  strength: "forte" | "médio" | "fraco";
};

const HOOK_LABELS: Record<string, string> = {
  curiosity_gap: "Curiosity Gap",
  contrarian: "Contrarian",
  stake_reveal: "Stake Reveal",
  question_direct: "Pergunta direta",
  number_promise: "Number Promise",
  pattern_interrupt: "Pattern Interrupt",
  story_in_media_res: "In Medias Res",
  declaration: "Declaração",
  bater_no_inimigo: "Bater no inimigo",
  unknown: "Não classificado",
};

export function HookDna({ topPieces, bottomPieces }: { topPieces: PieceSnapshot[]; bottomPieces: PieceSnapshot[] }) {
  const [loading, setLoading] = useState(false);
  const [topClasses, setTopClasses] = useState<Classification[]>([]);
  const [bottomClasses, setBottomClasses] = useState<Classification[]>([]);

  async function analyze() {
    setLoading(true);
    try {
      const all = [...topPieces, ...bottomPieces];
      const res = await fetch("/api/analytics/hook-dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pieces: all }),
      });
      if (!res.ok) throw new Error("Erro");
      const data = await res.json();
      const allClasses = (data.classifications || []) as Classification[];
      setTopClasses(allClasses.filter((c) => c.pieceIndex < topPieces.length));
      setBottomClasses(
        allClasses
          .filter((c) => c.pieceIndex >= topPieces.length)
          .map((c) => ({ ...c, pieceIndex: c.pieceIndex - topPieces.length })),
      );
      toast.success("Hook DNA decomposto");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  const hasData = topClasses.length > 0 || bottomClasses.length > 0;

  // Distribuição de hook types no top vs bottom
  const distTop = countByType(topClasses);
  const distBot = countByType(bottomClasses);
  const allTypes = Array.from(new Set([...Object.keys(distTop), ...Object.keys(distBot)]));

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Microscope className="h-4 w-4" />
              Hook DNA — top vs bottom
            </CardTitle>
            <CardDescription>
              GPT-4o-mini classifica os hooks pra você descobrir o padrão das peças que viralizaram
            </CardDescription>
          </div>
          <Button size="sm" onClick={analyze} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Microscope className="h-4 w-4" />}
            {hasData ? "Re-analisar" : "Decompor hooks"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData && !loading && (
          <p className="text-sm text-muted-foreground">
            Clique pra rodar análise — vai classificar {topPieces.length} peças top + {bottomPieces.length} bottom.
          </p>
        )}

        {hasData && (
          <div className="space-y-6">
            {/* Distribuição agregada */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
                Distribuição de hook types
              </p>
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-1.5">Tipo</th>
                    <th className="text-right py-1.5">No TOP</th>
                    <th className="text-right py-1.5">No BOTTOM</th>
                    <th className="text-right py-1.5">Lift</th>
                  </tr>
                </thead>
                <tbody>
                  {allTypes
                    .map((t) => ({
                      type: t,
                      top: distTop[t] || 0,
                      bot: distBot[t] || 0,
                      lift: ((distTop[t] || 0) + 0.5) / ((distBot[t] || 0) + 0.5),
                    }))
                    .sort((a, b) => b.lift - a.lift)
                    .map(({ type, top, bot, lift }) => (
                      <tr key={type} className="border-b">
                        <td className="py-1.5 font-medium">{HOOK_LABELS[type] || type}</td>
                        <td className="py-1.5 text-right tabular-nums">{top}</td>
                        <td className="py-1.5 text-right tabular-nums">{bot}</td>
                        <td
                          className={`py-1.5 text-right tabular-nums font-medium ${
                            lift > 1.5 ? "text-green-600 dark:text-green-400" : lift < 0.7 ? "text-destructive" : ""
                          }`}
                        >
                          ×{lift.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <PieceColumn title="🚀 TOP" pieces={topPieces} classes={topClasses} positive />
              <PieceColumn title="❄️ BOTTOM" pieces={bottomPieces} classes={bottomClasses} positive={false} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function countByType(classes: Classification[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const c of classes) {
    map[c.hook_type] = (map[c.hook_type] || 0) + 1;
  }
  return map;
}

function PieceColumn({
  title,
  pieces,
  classes,
  positive,
}: {
  title: string;
  pieces: PieceSnapshot[];
  classes: Classification[];
  positive: boolean;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wide font-medium">{title}</p>
      {classes.map((c) => {
        const p = pieces[c.pieceIndex];
        if (!p) return null;
        const firstLine = (p.caption || "").split(/[.!?\n]/, 1)[0]?.slice(0, 200);
        return (
          <a
            key={p.id}
            href={p.permalink}
            target="_blank"
            rel="noreferrer"
            className="block border rounded p-2.5 hover:bg-accent/30 transition-colors"
          >
            <p className="text-sm font-medium leading-snug mb-2">{firstLine}</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={positive ? "default" : "destructive"} className="text-[10px]">
                {HOOK_LABELS[c.hook_type] || c.hook_type}
              </Badge>
              <Badge variant="outline" className="text-[10px]">POV: {c.pov}</Badge>
              <Badge variant="outline" className="text-[10px]">
                {c.strength}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                payoff @ palavra {c.first_useful_info_at_word}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Tensão: {c.tension_promised}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {p.format} · reach {p.reach} · share {(p.share_rate * 100).toFixed(2)}%
            </p>
          </a>
        );
      })}
    </div>
  );
}
