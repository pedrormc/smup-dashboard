"use client";

/**
 * Gráfico de linha RETA (não suavizada) + área preenchida + dots por
 * ponto de dado. Tooltip com valor formatado em pt-BR.
 *
 * Usado em 2 visuais:
 *   ┌─────┬───────────────────────────────┬───────────────────────────────────────────────────────────────┐
 *   │ V5  │ Leads ao longo do tempo       │ COUNT(deal_id) GROUP BY mês de data_criacao                   │
 *   │ V6  │ Faturamento ao longo do tempo │ SUM(valor_contrato) GROUP BY mês de data_ultima_fase          │
 *   │     │                               │ WHERE fase_atual = "Fechado"                                  │
 *   └─────┴───────────────────────────────┴───────────────────────────────────────────────────────────────┘
 *
 * Origem do dado: colunas `data_criacao`, `data_ultima_fase`,
 * `valor_contrato`, `fase_atual` de TB_Negocios_Atual.
 *
 * Cálculo: `aggregateByMonth()` em src/lib/kpis.ts
 *   1. agrupa por `startOfMonth(dateOf(row))` (date-fns)
 *   2. acumula `valueOf(row)` (+1 pra count, +valorContrato pra currency)
 *   3. ordena por chave `yyyy-MM` ascendente
 *   4. retorna `[{ mes, label, valor }]` — label em pt-BR "MMM/yy"
 *
 * Props:
 *   - `data: SeriePonto[]` — `{ mes, label, valor }[]` já agregado
 *   - `type: "count" | "currency"` — controla formatter do Y e tooltip
 *   - `height?: number` — default 280
 *
 * Detalhes de UX (decisão de 2026-05-09):
 *   - Linha reta (`type="linear"`) — antes era `monotone` (curva suave)
 *   - Dots pequenos (r=3) da cor da linha em cada ponto de dado
 *   - activeDot maior (r=5) com stroke branco no hover
 */

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
