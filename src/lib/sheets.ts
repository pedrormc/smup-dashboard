/**
 * Camada de acesso aos dados da planilha Google Sheets.
 *
 * Estratégia: cada aba é exportada como CSV via `?format=csv&gid=N` (a planilha
 * está pública). O resultado é cacheado pelo runtime do Next.js via `fetch` com
 * `next.revalidate`, então o build pode ser estático e a primeira request após
 * a janela de revalidação refaz o fetch em background (ISR).
 *
 * Para invalidar manualmente, chame `POST /api/revalidate` com o token de env.
 *
 * @see docs/ARCHITECTURE.md
 */

import Papa from "papaparse";
import type {
  RawHistorico,
  RawNegocio,
  RawTaxaConversao,
} from "@/lib/types";

const SHEET_ID = process.env.SMUP_SHEET_ID ?? "1CZ4tfnyTcR9iFJujZhHa2aNHFajZc8zHdB21DEXgwfk";
const GID_NEGOCIOS = process.env.SMUP_GID_NEGOCIOS ?? "0";
const GID_HISTORICO = process.env.SMUP_GID_HISTORICO ?? "1711054039";
const GID_TAXAS = process.env.SMUP_GID_TAXAS ?? "41696639";
const REVALIDATE_SECONDS = Number(process.env.SMUP_REVALIDATE_SECONDS ?? "300");

const CACHE_TAG_NEGOCIOS = "smup:negocios";
const CACHE_TAG_HISTORICO = "smup:historico";
const CACHE_TAG_TAXAS = "smup:taxas";

export const CACHE_TAGS = {
  negocios: CACHE_TAG_NEGOCIOS,
  historico: CACHE_TAG_HISTORICO,
  taxas: CACHE_TAG_TAXAS,
} as const;

function csvUrl(gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
}

async function fetchCsv(gid: string, tag: string): Promise<string> {
  const url = csvUrl(gid);
  const res = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS, tags: [tag] },
  });
  if (!res.ok) {
    throw new Error(
      `Falha ao buscar planilha (gid=${gid}, status=${res.status}). ` +
        `Confirme que a planilha está pública (link com leitura para "qualquer pessoa").`,
    );
  }
  return res.text();
}

function parseCsv<T>(csv: string): T[] {
  const result = Papa.parse<T>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (result.errors.length > 0) {
    const sample = result.errors.slice(0, 3).map((e) => e.message).join("; ");
    console.warn(`[sheets] avisos no parse CSV: ${sample}`);
  }
  return result.data;
}

export async function fetchNegociosRaw(): Promise<RawNegocio[]> {
  const csv = await fetchCsv(GID_NEGOCIOS, CACHE_TAG_NEGOCIOS);
  return parseCsv<RawNegocio>(csv);
}

export async function fetchHistoricoRaw(): Promise<RawHistorico[]> {
  const csv = await fetchCsv(GID_HISTORICO, CACHE_TAG_HISTORICO);
  return parseCsv<RawHistorico>(csv);
}

export async function fetchTaxasRaw(): Promise<RawTaxaConversao[]> {
  const csv = await fetchCsv(GID_TAXAS, CACHE_TAG_TAXAS);
  return parseCsv<RawTaxaConversao>(csv);
}
