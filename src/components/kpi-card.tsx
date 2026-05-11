/**
 * Cartão grande com 1 número (KPI) + label + subtítulo opcional.
 *
 * Usado nos 6 indicadores numéricos do dashboard:
 *   ┌─────┬───────────────────────────┬──────────────────────────────────────────────┐
 *   │ KPI │ função em lib/kpis.ts     │ conta                                        │
 *   ├─────┼───────────────────────────┼──────────────────────────────────────────────┤
 *   │ V1  │ faturamentoGerado         │ SUM(valor_contrato) WHERE fase = "Fechado"   │
 *   │ V2  │ ticketMedio               │ AVG(valor_contrato) WHERE fase = "Fechado"   │
 *   │ V3  │ negociosEmAberto          │ COUNT(deal_id) WHERE status_aberto = TRUE    │
 *   │ V4  │ leadTimeMedio             │ AVG(data_ultima_fase - data_criacao), dias   │
 *   │ V8  │ taxaConversaoGeral        │ fechados / (em aberto + fechados)            │
 *   │ V9  │ negociacoesPerdidas       │ COUNT(deal_id) WHERE fase = "Perdido"        │
 *   └─────┴───────────────────────────┴──────────────────────────────────────────────┘
 *
 * Todos os dados vêm da aba TB_Negocios_Atual da planilha.
 *
 * O componente NÃO calcula nada — recebe `value: string` já formatado
 * em pt-BR via `formatCurrency`, `formatInt`, `formatDecimal` ou
 * `formatPercent` (src/lib/format.ts).
 *
 * Tons disponíveis:
 *   - "primary" (default) → fundo COLORS.primary (azul), texto branco
 *   - "danger"            → fundo COLORS.danger (vermelho), texto branco
 *                           (usado em V9 — Negociações perdidas)
 *   - "neutral"           → fundo branco com borda — informativo
 */

import { COLORS } from "@/lib/constants";

type Tone = "primary" | "neutral" | "danger";

const toneStyles: Record<Tone, { bg: string; fg: string; subtle: string }> = {
  primary: { bg: COLORS.primary, fg: COLORS.textOnPrimary, subtle: "rgba(255,255,255,0.85)" },
  neutral: { bg: "#FFFFFF", fg: "#111827", subtle: "#6B7280" },
  danger: { bg: COLORS.danger, fg: "#FFFFFF", subtle: "rgba(255,255,255,0.85)" },
};

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  tone?: Tone;
}

export function KpiCard({ label, value, subtitle, tone = "primary" }: KpiCardProps) {
  const style = toneStyles[tone];
  return (
    <div
      className="rounded-xl px-5 py-4 shadow-sm border"
      style={{ backgroundColor: style.bg, borderColor: tone === "neutral" ? COLORS.border : "transparent" }}
    >
      <div className="text-xs uppercase tracking-wide font-medium" style={{ color: style.subtle }}>
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums" style={{ color: style.fg }}>
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-xs" style={{ color: style.subtle }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
