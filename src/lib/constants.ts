/**
 * Constantes compartilhadas do dashboard SMUP.
 *
 * Identidade visual e regras de negócio centralizadas aqui — qualquer mudança de
 * paleta, ordem das fases ou IDs corrompidos deve ser feita NESTE arquivo.
 */

export const COLORS = {
  primary: "#1A5276",
  secondary: "#2980B9",
  area: "#AED6F1",
  background: "#FFFFFF",
  border: "#D5D8DC",
  textOnPrimary: "#FFFFFF",
  muted: "#7B8794",
  danger: "#C0392B",
  success: "#1E8449",
} as const;

/**
 * Ordem canônica das fases ativas do funil (do topo ao fundo).
 * NÃO inclui "Perdido" (terminal) nem os IDs corrompidos.
 */
export const FUNNEL_STAGES = [
  "Lead",
  "Oportunidade",
  "Diagnóstico Agendado",
  "Confeccionar Proposta",
  "Proposta Agendada",
  "Proposta Apresentada",
  "Em Negociação",
  "Fechado",
] as const;

export type FunnelStage = (typeof FUNNEL_STAGES)[number];

/**
 * Rótulo exibido para cada fase. Adiciona MQL/SQL onde aplicável.
 */
export const STAGE_LABELS: Record<FunnelStage, string> = {
  Lead: "Leads",
  Oportunidade: "Oportunidades",
  "Diagnóstico Agendado": "Diagnóstico Agendado",
  "Confeccionar Proposta": "Confeccionar Proposta (MQL)",
  "Proposta Agendada": "Proposta Agendada (SQL)",
  "Proposta Apresentada": "Proposta Apresentada",
  "Em Negociação": "Em Negociação",
  Fechado: "Fechado",
};

/**
 * Larguras relativas (%) do funil simulado — degradação visual de topo a fundo.
 */
export const STAGE_WIDTHS: Record<FunnelStage, number> = {
  Lead: 100,
  Oportunidade: 90,
  "Diagnóstico Agendado": 78,
  "Confeccionar Proposta": 65,
  "Proposta Agendada": 52,
  "Proposta Apresentada": 40,
  "Em Negociação": 28,
  Fechado: 18,
};

/**
 * IDs corrompidos descobertos na inspeção de 2026-05-07 — devem ser excluídos
 * de TODOS os visuais. Ver `docs/DATA-MODEL.md`.
 */
export const CORRUPTED_PHASE_VALUES = ["1330117664", "1330117663"] as const;

export const NAV_LINKS = [
  { href: "/", label: "Visão Executiva" },
  { href: "/funil", label: "Funil Comercial" },
  { href: "/abordagem", label: "Abordagem & Velocidade" },
] as const;
