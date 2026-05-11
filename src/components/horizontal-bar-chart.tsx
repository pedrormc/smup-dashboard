"use client";

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
