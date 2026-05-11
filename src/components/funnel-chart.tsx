import { COLORS } from "@/lib/constants";
import type { FaseContagem } from "@/lib/kpis";
import { formatInt } from "@/lib/format";

interface FunnelChartProps {
  data: FaseContagem[];
}

/**
 * Funil visual — V10. Renderiza 8 barras horizontais centradas com
 * largura decrescente do topo ao fundo, espelhando o visual da
 * planilha original do Looker Studio.
 *
 * Origem do dado: coluna `fase_atual` de TB_Negocios_Atual da planilha.
 *
 * Cálculo (em src/lib/kpis.ts → `contagemPorFase`):
 *   1. COUNT(deal_id) GROUP BY fase_atual sobre as linhas já filtradas
 *   2. Mapeia pra ordem canônica FUNNEL_STAGES (Lead → Fechado),
 *      preenchendo 0 onde não há negócio
 *   3. NÃO inclui "Perdido" (fase terminal, exibida em V9 separadamente)
 *
 * As larguras (%) das barras NÃO refletem o dado — vêm fixas de
 * STAGE_WIDTHS em src/lib/constants.ts (Lead=100%, Oportunidade=90%,
 * ..., Fechado=18%). Servem apenas pro efeito visual de funil.
 *
 * Renderização: só Tailwind + flex, sem dependência do Recharts.
 * Cada barra tem `min-height: 44px` (target de toque mobile).
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
