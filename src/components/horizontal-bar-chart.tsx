"use client";

/**
 * Gráfico genérico de barras horizontais ordenadas por valor desc.
 * Suporta 4 formatos de número e scroll interno pra listas longas.
 *
 * Usado em 5 visuais distintos:
 *   ┌─────┬─────────────────────────────┬──────────────────────────────────────────────────────────────────┐
 *   │ V7  │ Faturamento por responsável │ SUM(valor_contrato) GROUP BY responsavel_normalizado             │
 *   │     │                             │ WHERE fase = "Fechado"                                           │
 *   │ V11 │ Taxa entre etapas           │ leitura direta da aba TB_Taxas_Conversao (pré-agregada)          │
 *   │     │                             │ NÃO responde aos filtros — é métrica global da planilha          │
 *   │ V12 │ Oportunidades por segmento  │ COUNT(deal_id) GROUP BY segmento_normalizado                     │
 *   │ V13 │ Faturamento por segmento    │ SUM(valor_contrato) GROUP BY segmento_normalizado                │
 *   │     │                             │ WHERE fase = "Fechado"                                           │
 *   │ V14 │ Tempo médio por etapa       │ AVG(tempo_na_fase) GROUP BY fase_anterior                        │
 *   │     │                             │ FROM TB_Historico_Movimentacao, filtrado pelos deal_id ativos    │
 *   └─────┴─────────────────────────────┴──────────────────────────────────────────────────────────────────┘
 *
 * Origem do dado:
 *   - V7, V12, V13: TB_Negocios_Atual (colunas responsavel, segmento,
 *     valor_contrato, fase_atual).
 *   - V11: TB_Taxas_Conversao (colunas transicao, taxa).
 *   - V14: TB_Historico_Movimentacao (coluna tempo_na_fase).
 *
 * Cada uma dessas agregações vive em src/lib/kpis.ts e retorna
 * `{ label, valor }[]` já ordenado. O componente só renderiza.
 *
 * Props:
 *   - `data: { label, valor }[]`        — agregado, ordenado
 *   - `format: "currency"|"int"|"decimal"|"percent"` — formato do número
 *   - `color?: string`                  — default COLORS.primary
 *   - `height?: number`                 — altura mínima do canvas, default 320
 *   - `maxContainerHeight?: number`     — quando definido, ativa SCROLL
 *     INTERNO se `data.length * 36 + 40` excede esse valor. Mantém todas
 *     as barras com 36px de altura legível. Usado em V12 e V13 (lista
 *     longa de tipos de clínica — > 30 segmentos).
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS } from "@/lib/constants";
import { formatCurrency, formatDecimal, formatInt, formatPercent } from "@/lib/format";

type Format = "currency" | "int" | "decimal" | "percent";

interface HorizontalBarChartProps {
  data: Array<{ label: string; valor: number }>;
  format: Format;
  color?: string;
  /** Altura mínima do canvas (default 320). Cresce com a quantidade de itens. */
  height?: number;
  showLabels?: boolean;
  /**
   * Altura máxima do CONTAINER visível. Quando definido e o canvas
   * computado exceder esse valor, o container vira scrollable e o
   * canvas mantém todas as barras com altura legível.
   */
  maxContainerHeight?: number;
}

function fmt(v: number, f: Format): string {
  switch (f) {
    case "currency":
      return formatCurrency(v, true);
    case "decimal":
      return formatDecimal(v);
    case "percent":
      return formatPercent(v);
    default:
      return formatInt(v);
  }
}

export function HorizontalBarChart({
  data,
  format,
  color = COLORS.primary,
  height = 320,
  showLabels = true,
  maxContainerHeight,
}: HorizontalBarChartProps) {
  if (data.length === 0) {
    return <div className="text-sm text-gray-500 py-8 text-center">Sem dados no período/filtro selecionado.</div>;
  }
  const dynamicHeight = Math.max(height, data.length * 36 + 40);
  const shouldScroll = maxContainerHeight != null && dynamicHeight > maxContainerHeight;

  const containerStyle: React.CSSProperties = shouldScroll
    ? { width: "100%", height: maxContainerHeight, overflowY: "auto", overflowX: "hidden" }
    : { width: "100%", height: dynamicHeight };

  const innerStyle: React.CSSProperties = shouldScroll
    ? { width: "100%", height: dynamicHeight }
    : { width: "100%", height: "100%" };

  return (
    <div style={containerStyle}>
      <div style={innerStyle}>
        <ResponsiveContainer>
          <BarChart layout="vertical" data={data} margin={{ top: 8, right: 64, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORS.border} />
            <XAxis type="number" tickFormatter={(v) => fmt(v, format)} tickLine={false} axisLine={{ stroke: COLORS.border }} />
            <YAxis
              type="category"
              dataKey="label"
              width={170}
              tickLine={false}
              axisLine={{ stroke: COLORS.border }}
            />
            <Tooltip formatter={(v: number) => fmt(v, format)} />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={color} />
              ))}
              {showLabels && (
                <LabelList
                  dataKey="valor"
                  position="right"
                  formatter={(v: number) => fmt(v, format)}
                  style={{ fontSize: 12, fill: "#374151" }}
                />
              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
