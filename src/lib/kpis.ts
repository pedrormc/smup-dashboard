/**
 * Funções puras de cálculo das métricas exibidas. Cada função recebe os dados
 * já filtrados e retorna o número/série usado pelo componente da UI.
 *
 * Manter este arquivo livre de React — só matemática e agregação.
 *
 * Mapeamento direto pros 14 visuais:
 *   V1  → faturamentoGerado
 *   V2  → ticketMedio
 *   V3  → negociosEmAberto
 *   V4  → leadTimeMedio
 *   V5  → leadsAoLongoDoTempo
 *   V6  → faturamentoAoLongoDoTempo
 *   V7  → faturamentoPorResponsavel
 *   V8  → taxaConversaoGeral
 *   V9  → negociacoesPerdidas
 *   V10 → contagemPorFase (8 fases ativas)
 *   V11 → vem direto de TB_Taxas_Conversao (já agregado na planilha)
 *   V12 → oportunidadesPorSegmento
 *   V13 → faturamentoPorSegmento
 *   V14 → tempoMedioPorEtapa
 */

import { format, startOfMonth } from "date-fns";
import { FUNNEL_STAGES, type FunnelStage } from "@/lib/constants";
import type { Historico, Negocio } from "@/lib/types";

const FECHADO = "Fechado";
const PERDIDO = "Perdido";

const fechado = (n: Negocio) => n.faseAtual === FECHADO;
const perdido = (n: Negocio) => n.faseAtual === PERDIDO;

function sum(nums: Array<number | null>): number {
  let total = 0;
  for (const n of nums) if (n != null) total += n;
  return total;
}

function avg(nums: Array<number | null>): number | null {
  let total = 0;
  let count = 0;
  for (const n of nums) {
    if (n == null) continue;
    total += n;
    count += 1;
  }
  return count === 0 ? null : total / count;
}

// V1
export function faturamentoGerado(rows: Negocio[]): number {
  return sum(rows.filter(fechado).map((n) => n.valorContrato));
}

// V2
export function ticketMedio(rows: Negocio[]): number | null {
  return avg(rows.filter(fechado).map((n) => n.valorContrato));
}

// V3
export function negociosEmAberto(rows: Negocio[]): number {
  return rows.filter((n) => n.statusAberto).length;
}

// V4
export function leadTimeMedio(rows: Negocio[]): number | null {
  return avg(rows.filter(fechado).map((n) => n.leadTimeDias));
}

export interface SeriePonto {
  mes: string;
  label: string;
  valor: number;
}

function aggregateByMonth(
  rows: Negocio[],
  dateOf: (n: Negocio) => Date | null,
  valueOf: (n: Negocio) => number,
): SeriePonto[] {
  const buckets = new Map<string, number>();
  for (const r of rows) {
    const d = dateOf(r);
    if (!d) continue;
    const key = format(startOfMonth(d), "yyyy-MM");
    buckets.set(key, (buckets.get(key) ?? 0) + valueOf(r));
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, valor]) => {
      const [y, m] = key.split("-").map(Number);
      const label = format(new Date(y, m - 1, 1), "MMM/yy");
      return { mes: key, label, valor };
    });
}

// V5
export function leadsAoLongoDoTempo(rows: Negocio[]): SeriePonto[] {
  return aggregateByMonth(rows, (n) => n.dataCriacao, () => 1);
}

// V6
export function faturamentoAoLongoDoTempo(rows: Negocio[]): SeriePonto[] {
  return aggregateByMonth(
    rows.filter(fechado),
    (n) => n.dataUltimaFase,
    (n) => n.valorContrato ?? 0,
  );
}

export interface RankItem {
  label: string;
  valor: number;
}

// V7
export function faturamentoPorResponsavel(rows: Negocio[]): RankItem[] {
  const map = new Map<string, number>();
  for (const n of rows.filter(fechado)) {
    const key = n.responsavelNormalizado;
    map.set(key, (map.get(key) ?? 0) + (n.valorContrato ?? 0));
  }
  return Array.from(map.entries())
    .map(([label, valor]) => ({ label, valor }))
    .sort((a, b) => b.valor - a.valor);
}

// V8
export function taxaConversaoGeral(rows: Negocio[]): number | null {
  const fechados = rows.filter(fechado).length;
  const denom = rows.filter((n) => n.statusAberto || fechado(n)).length;
  if (denom === 0) return null;
  return fechados / denom;
}

// V9
export function negociacoesPerdidas(rows: Negocio[]): number {
  return rows.filter(perdido).length;
}

export interface FaseContagem {
  fase: FunnelStage;
  label: string;
  count: number;
  width: number;
}

// V10
export function contagemPorFase(
  rows: Negocio[],
  labels: Record<FunnelStage, string>,
  widths: Record<FunnelStage, number>,
): FaseContagem[] {
  const map = new Map<string, number>();
  for (const n of rows) map.set(n.faseAtual, (map.get(n.faseAtual) ?? 0) + 1);
  return FUNNEL_STAGES.map((fase) => ({
    fase,
    label: labels[fase],
    count: map.get(fase) ?? 0,
    width: widths[fase],
  }));
}

// V12
export function oportunidadesPorSegmento(rows: Negocio[]): RankItem[] {
  const map = new Map<string, number>();
  for (const n of rows) {
    map.set(n.segmentoNormalizado, (map.get(n.segmentoNormalizado) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([label, valor]) => ({ label, valor }))
    .sort((a, b) => b.valor - a.valor);
}

// V13
export function faturamentoPorSegmento(rows: Negocio[]): RankItem[] {
  const map = new Map<string, number>();
  for (const n of rows.filter(fechado)) {
    map.set(
      n.segmentoNormalizado,
      (map.get(n.segmentoNormalizado) ?? 0) + (n.valorContrato ?? 0),
    );
  }
  return Array.from(map.entries())
    .map(([label, valor]) => ({ label, valor }))
    .filter((r) => r.valor > 0)
    .sort((a, b) => b.valor - a.valor);
}

export interface TempoEtapa {
  fase: FunnelStage;
  label: string;
  diasMedios: number;
}

// V14
export function tempoMedioPorEtapa(
  historico: Historico[],
  validDealIds: Set<string>,
  labels: Record<FunnelStage, string>,
): TempoEtapa[] {
  const map = new Map<string, number[]>();
  for (const h of historico) {
    if (!validDealIds.has(h.dealId)) continue;
    if (h.tempoNaFase == null) continue;
    if (!(FUNNEL_STAGES as readonly string[]).includes(h.faseAnterior)) continue;
    const arr = map.get(h.faseAnterior) ?? [];
    arr.push(h.tempoNaFase);
    map.set(h.faseAnterior, arr);
  }
  return FUNNEL_STAGES.filter((f) => f !== "Fechado")
    .map((fase): TempoEtapa | null => {
      const arr = map.get(fase);
      if (!arr || arr.length === 0) return null;
      const m = arr.reduce((a, b) => a + b, 0) / arr.length;
      return { fase, label: labels[fase], diasMedios: m };
    })
    .filter((x): x is TempoEtapa => x !== null);
}
