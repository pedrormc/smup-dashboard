/**
 * GET /api/data
 *
 * Endpoint de debug — retorna o dataset normalizado em JSON.
 * Útil pra inspecionar a transformação sem renderizar a UI ou plugar dashboards
 * externos. Respeita o mesmo cache ISR das páginas.
 */

import { NextResponse } from "next/server";
import { loadDataset } from "@/lib/transforms";

export const revalidate = 300;

export async function GET() {
  try {
    const dataset = await loadDataset();
    return NextResponse.json(
      {
        fetchedAt: dataset.fetchedAt,
        counts: {
          negocios: dataset.negocios.length,
          historico: dataset.historico.length,
          taxas: dataset.taxas.length,
        },
        taxas: dataset.taxas,
        negocios: dataset.negocios.slice(0, 50),
      },
      { headers: { "Cache-Control": "public, max-age=60" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
