/**
 * Aplicação dos filtros globais (responsável / período / segmento) sobre os
 * dados normalizados.
 *
 * Os filtros vêm sempre via querystring nas páginas (compartilhamento por URL).
 * Esta camada é pura — entrada `Negocio[]` + filtros, saída `Negocio[]`.
 */

import type { DashboardFilters, Negocio } from "@/lib/types";

export function applyFilters(rows: Negocio[], filters: DashboardFilters): Negocio[] {
  const { responsavel, segmento, dateFrom, dateTo } = filters;
  const from = dateFrom ? new Date(dateFrom).getTime() : null;
  const to = dateTo ? new Date(dateTo).getTime() : null;

  return rows.filter((n) => {
    if (responsavel && n.responsavelNormalizado !== responsavel) return false;
    if (segmento && n.segmentoNormalizado !== segmento) return false;
    if (from != null) {
      if (!n.dataCriacao || n.dataCriacao.getTime() < from) return false;
    }
    if (to != null) {
      if (!n.dataCriacao || n.dataCriacao.getTime() > to) return false;
    }
    return true;
  });
}

export interface FilterOption {
  value: string;
  count: number;
}

/**
 * Lista de responsáveis com contagem de negócios.
 * Ordenado por contagem desc, "Sem responsável" sempre no fim. Apenas
 * responsáveis com >= 1 negócio aparecem (efetivamente sempre todos os
 * que vêm normalizados).
 */
export function uniqueResponsaveis(rows: Negocio[]): FilterOption[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.responsavelNormalizado, (map.get(r.responsavelNormalizado) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      if (a.value === "Sem responsável") return 1;
      if (b.value === "Sem responsável") return -1;
      if (b.count !== a.count) return b.count - a.count;
      return a.value.localeCompare(b.value, "pt-BR");
    });
}

export function uniqueSegmentos(rows: Negocio[]): FilterOption[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.segmentoNormalizado, (map.get(r.segmentoNormalizado) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      if (a.value === "Não informado") return 1;
      if (b.value === "Não informado") return -1;
      if (b.count !== a.count) return b.count - a.count;
      return a.value.localeCompare(b.value, "pt-BR");
    });
}

export function parseFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): DashboardFilters {
  const get = (k: string): string | undefined => {
    const v = searchParams[k];
    if (Array.isArray(v)) return v[0];
    return v;
  };
  return {
    responsavel: get("responsavel") || undefined,
    segmento: get("segmento") || undefined,
    dateFrom: get("from") || undefined,
    dateTo: get("to") || undefined,
  };
}
