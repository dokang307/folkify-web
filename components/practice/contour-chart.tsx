"use client";

import { CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { NoteDeviation, PerformanceMetrics } from "@/lib/api/types";
import { midiToNoteName } from "@/lib/format";

/** Đường cao độ của bạn so với mục tiêu (bản mẫu hoặc bậc ngũ cung gần nhất); vùng đỏ = nốt lệch. */
export function ContourChart({
  chart,
  deviations,
  targetLabel,
}: {
  chart: NonNullable<PerformanceMetrics["chart"]>;
  deviations: NoteDeviation[];
  targetLabel: string;
}) {
  const data = chart.times.map((t, i) => ({ t, target: chart.target[i], user: chart.user[i] }));
  if (data.length === 0) return null;
  const values = data.flatMap((d) => [d.target, d.user]).filter((v) => Number.isFinite(v));
  const min = Math.floor(Math.min(...values)) - 1;
  const max = Math.ceil(Math.max(...values)) + 1;

  return (
    <figure className="space-y-2">
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="2 4" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="t"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => `${v.toFixed(0)}s`}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              stroke="var(--border)"
            />
            <YAxis
              domain={[min, max]}
              allowDecimals={false}
              tickFormatter={(v: number) => midiToNoteName(v)}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              width={44}
              stroke="var(--border)"
            />
            {deviations.map((d) => (
              <ReferenceArea key={`${d.start}-${d.end}`} x1={d.start} x2={d.end} fill="var(--lacquer)" fillOpacity={0.12} ifOverflow="hidden" />
            ))}
            <Tooltip
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }}
              labelFormatter={(v) => `Giây ${Number(v).toFixed(1)}`}
              formatter={(value, name) => [midiToNoteName(Number(value)), name === "user" ? "Bạn" : targetLabel]}
            />
            <Line type="monotone" dataKey="target" stroke="var(--muted-foreground)" strokeDasharray="5 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="user" stroke="var(--inst)" strokeWidth={2.25} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-[color:var(--inst)]" aria-hidden /> Bạn</span>
        <span className="flex items-center gap-1.5"><span className="h-0 w-5 border-t-2 border-dashed border-muted-foreground" aria-hidden /> {targetLabel}</span>
        {deviations.length > 0 && <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-lacquer/20" aria-hidden /> Đoạn lệch cao độ</span>}
      </figcaption>
    </figure>
  );
}
