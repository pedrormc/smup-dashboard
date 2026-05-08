import { COLORS } from "@/lib/constants";
import type { FaseContagem } from "@/lib/kpis";
import { formatInt } from "@/lib/format";

interface FunnelChartProps {
  data: FaseContagem[];
}

/**
 * Funil simulado em 8 barras horizontais centradas com largura decrescente,
 * espelhando a planilha original. Cada barra mostra rótulo + contagem.
 */
export function FunnelChart({ data }: FunnelChartProps) {
  return (
    <div className="flex flex-col gap-2 items-center w-full">
      {data.map((row) => (
        <div key={row.fase} className="w-full flex items-center justify-center">
          <div
            className="rounded-md flex items-center justify-between px-4 py-3 transition-all"
            style={{
              backgroundColor: COLORS.primary,
              color: COLORS.textOnPrimary,
              width: `${row.width}%`,
              minHeight: "44px",
            }}
          >
            <span className="text-sm font-medium truncate pr-2">{row.label}</span>
            <span className="text-base font-semibold tabular-nums">{formatInt(row.count)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
