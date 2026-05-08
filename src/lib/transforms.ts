/**
 * Normalização das linhas brutas da planilha para os tipos de domínio.
 *
 * Toda regra de qualidade de dados vive aqui:
 *   - exclusão dos IDs corrompidos em fase_atual (1330117664, 1330117663)
 *   - normalização do campo `responsavel` (variações de Neidison, Clistones etc.)
 *   - normalização do campo `segmento` (vazios → "Não informado")
 *   - parse de datas em ISO (YYYY-MM-DD) e números em locale BR (vírgula decimal)
 *   - cálculo do `lead_time_dias` = data_ultima_fase - data_criacao
 *
 * Ver `docs/DATA-MODEL.md` para o porquê de cada regra.
 */

import { differenceInDays, parseISO } from "date-fns";
import { CORRUPTED_PHASE_VALUES } from "@/lib/constants";
import type {
  Historico,
  Negocio,
  RawHistorico,
  RawNegocio,
  RawTaxaConversao,
  SmupDataset,
  TaxaConversao,
} from "@/lib/types";
import {
  fetchHistoricoRaw,
  fetchNegociosRaw,
  fetchTaxasRaw,
} from "@/lib/sheets";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const d = parseISO(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Parse número aceitando tanto o padrão americano (`1234.56`) quanto o BR
 * (`1.234,56` / `0,1234`). Retorna `null` para vazios ou inválidos.
 */
function parseNumber(value: string | null | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  let normalized = trimmed.replace(/\s/g, "");
  if (normalized.includes(",") && !normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function parseBool(value: string | null | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toUpperCase();
  return v === "TRUE" || v === "1" || v === "SIM" || v === "YES";
}

/**
 * Mapeia a coluna fragmentada `responsavel` para um nome canônico.
 *
 * Casos cobertos (encontrados na inspeção de 2026-05-07):
 *   - "Neidison", "Neidison Paiva", "NEIDISON PAIVA", "Neidisan Paiva"
 *     (typo), "Clis/Neidison" → "Neidison Paiva"
 *   - "Clistones", "Clistones " (espaço) → "Clistones"
 *   - "Pedro Roberto", "Robertin" → "Pedro Roberto"
 *   - vazio / null → "Sem responsável"
 *   - resto → trim() literal
 */
export function normalizeResponsavel(raw: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "Sem responsável";
  const upper = trimmed.toUpperCase();
  if (/NEIDIS.N/.test(upper)) return "Neidison Paiva";
  if (/CLIS/.test(upper)) return "Clistones";
  if (upper === "PEDRO ROBERTO" || upper === "ROBERTIN") return "Pedro Roberto";
  return trimmed;
}

/**
 * Normaliza segmento: trim + capitalização inicial. Vazio vira "Não informado".
 * Usa Title Case simples (cada palavra com inicial maiúscula).
 */
export function normalizeSegmento(raw: string): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "Não informado";
  return trimmed
    .toLocaleLowerCase("pt-BR")
    .split(/\s+/)
    .map((w) => (w ? w[0].toLocaleUpperCase("pt-BR") + w.slice(1) : w))
    .join(" ");
}

function isCorruptedPhase(value: string): boolean {
  return (CORRUPTED_PHASE_VALUES as readonly string[]).includes(value.trim());
}

export function transformNegocio(row: RawNegocio): Negocio | null {
  const dealId = (row.deal_id ?? "").trim();
  if (!dealId) return null;
  const faseAtual = (row.fase_atual ?? "").trim();
  if (isCorruptedPhase(faseAtual)) return null;

  const dataCriacao = parseDate(row.data_criacao);
  const dataUltimaFase = parseDate(row.data_ultima_fase);
  const leadTimeDias =
    dataCriacao && dataUltimaFase
      ? differenceInDays(dataUltimaFase, dataCriacao)
      : null;

  const responsavel = (row.responsavel ?? "").trim();
  const segmento = (row.segmento ?? "").trim();

  return {
    dealId,
    nomeNegocio: (row.nome_negocio ?? "").trim(),
    valorContrato: parseNumber(row.valor_contrato),
    dataCriacao,
    faseAtual,
    dataUltimaFase,
    responsavel,
    responsavelNormalizado: normalizeResponsavel(responsavel),
    segmento,
    segmentoNormalizado: normalizeSegmento(segmento),
    nPontos: parseNumber(row.n_pontos),
    statusAberto: parseBool(row.status_aberto),
    leadTimeDias,
    linkHubspot: (row.link_hubspot ?? "").trim(),
  };
}

export function transformHistorico(row: RawHistorico): Historico | null {
  const logId = (row.log_id ?? "").trim();
  const dealId = (row.deal_id ?? "").trim();
  if (!logId || !dealId) return null;
  return {
    logId,
    dealId,
    faseAnterior: (row.fase_anterior ?? "").trim(),
    faseNova: (row.fase_nova ?? "").trim(),
    dataMovimentacao: parseDate(row.data_movimentacao),
    tempoNaFase: parseNumber(row.tempo_na_fase),
  };
}

export function transformTaxa(row: RawTaxaConversao): TaxaConversao | null {
  const transicao = (row.transicao ?? "").trim();
  if (!transicao) return null;
  const taxa = parseNumber(row.taxa);
  const ordem = parseNumber(row.ordem);
  const totalSaidas = parseNumber(row.total_saidas);
  if (taxa == null || ordem == null) return null;
  return {
    ordem,
    transicao,
    taxa,
    totalSaidas: totalSaidas ?? 0,
  };
}

/**
 * Carrega e normaliza todas as 3 abas em paralelo. Esta é a função principal
 * que as páginas devem usar.
 */
export async function loadDataset(): Promise<SmupDataset> {
  const [rawNegocios, rawHistorico, rawTaxas] = await Promise.all([
    fetchNegociosRaw(),
    fetchHistoricoRaw(),
    fetchTaxasRaw(),
  ]);

  const negocios = rawNegocios
    .map(transformNegocio)
    .filter((n): n is Negocio => n !== null);

  const historico = rawHistorico
    .map(transformHistorico)
    .filter((h): h is Historico => h !== null);

  const taxas = rawTaxas
    .map(transformTaxa)
    .filter((t): t is TaxaConversao => t !== null)
    .sort((a, b) => a.ordem - b.ordem);

  return {
    negocios,
    historico,
    taxas,
    fetchedAt: new Date().toISOString(),
  };
}
