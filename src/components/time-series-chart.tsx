"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS } from "@/lib/constants";
import type { SeriePonto } from "@/lib/kpis";
import { formatCurrency, formatInt } from "@/lib/format";

interface TimeSeriesChartProps {
  data: SeriePonto[];
  type: "count" | "currency";
  height?: number;
}

export function TimeSeriesChart({ data, type, height = 280 }: TimeSeriesChartProps) {
  const fmt = type === "currency" ? (v: number) => formatCurrency(v, true) : formatInt;
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ts-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.area} stopOpacity={0.85} />
              <stop offset="95%" stopColor={COLORS.area} stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
          <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: COLORS.border }} />
          <YAxis tickFormatter={(v) => fmt(v)} tickLine={false} axisLine={{ stroke: COLORS.border }} width={70} />
          <Tooltip
            formatter={(v: number) => [fmt(v), type === "currency" ? "Faturamento" : "Leads"]}
            labelFormatter={(l) => `Mês: ${l}`}
          />
          <Area
            type="linear"
            dataKey="valor"
            stroke={COLORS.secondary}
            strokeWidth={2}
            fill="url(#ts-fill)"
            dot={{ r: 3, fill: COLORS.secondary, stroke: COLORS.secondary }}
            activeDot={{ r: 5, fill: COLORS.secondary, stroke: "#FFFFFF", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
