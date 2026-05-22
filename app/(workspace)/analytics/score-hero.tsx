"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import type { ScoreBreakdown } from "@/lib/instagram/analytics-advanced";

type Props = {
  username: string;
  followers: number;
  score: ScoreBreakdown;
  reach: number;
  reachDelta: number;
  avgEng: number;
  pieces: number;
  dominantFormat: string;
  profileCTR: number;
};

export function ScoreHero(props: Props) {
  const [narrative, setNarrative] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/score-narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: props.score.total,
        delta: props.score.delta,
        reach: props.reach,
        reachDelta: props.reachDelta,
        avgEng: props.avgEng,
        pieces: props.pieces,
        dominantFormat: props.dominantFormat,
        profileCTR: props.profileCTR,
      }),
    })
      .then((r) => r.json())
      .then((d) => setNarrative(d.narrative || ""))
      .catch(() => setNarrative("Falha ao gerar narrativa."))
      .finally(() => setLoading(false));
  }, [props]);

  const isUp = props.score.delta >= 0;
  const ArrowIcon = isUp ? TrendingUp : TrendingDown;

  // Score color: < 40 vermelho, 40-65 amarelo, 65+ verde
  let scoreColor = "text-green-600 dark:text-green-400";
  if (props.score.total < 40) scoreColor = "text-destructive";
  else if (props.score.total < 65) scoreColor = "text-amber-600 dark:text-amber-400";

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-6 pb-6">
        <div className="flex flex-col md:flex-row gap-6 md:items-center">
          {/* Score */}
          <div className="flex-shrink-0 text-center md:text-left">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Score semanal
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-6xl font-bold tabular-nums ${scoreColor}`}>
                {props.score.total}
              </span>
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
            <p className={`text-sm flex items-center gap-1 mt-1 ${isUp ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
              <ArrowIcon className="h-3 w-3" />
              {props.score.delta > 0 ? "+" : ""}
              {props.score.delta}% vs semana anterior
            </p>
          </div>

          {/* Componentes */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            <Component label="Reach Growth" value={props.score.components.reachGrowth} max={25} />
            <Component label="Engagement" value={props.score.components.engagementQuality} max={25} />
            <Component label="Profile→Site" value={props.score.components.profileConversion} max={20} />
            <Component label="Followers" value={props.score.components.followerVelocity} max={15} />
            <Component label="Consistência" value={props.score.components.contentConsistency} max={15} />
          </div>
        </div>

        {/* Narrative agente */}
        <div className="mt-5 pt-5 border-t border-l-2 border-l-primary/50 pl-3 flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary" />
          <div className="text-sm italic text-foreground/85 leading-relaxed">
            {loading ? (
              <span className="text-muted-foreground">analyst-io interpretando...</span>
            ) : (
              narrative
            )}
            <span className="block mt-1 text-[10px] text-muted-foreground not-italic">
              comms-analyst-io · AI-generated
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Component({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-muted-foreground text-[10px] uppercase tracking-wide">{label}</span>
        <span className="font-mono text-xs">
          {value}<span className="text-muted-foreground">/{max}</span>
        </span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
