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

export function uniqueResponsaveis(rows: Negocio[]): string[] {
  const set = new Set<string>();
  for (const r of rows) set.add(r.responsavelNormalizado);
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function uniqueSegmentos(rows: Negocio[]): string[] {
  const set = new Set<string>();
  for (const r of rows) set.add(r.segmentoNormalizado);
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
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
