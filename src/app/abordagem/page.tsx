/**
 * Página 3 — Abordagem & Velocidade.
 *
 * V12 (oportunidades por segmento) · V13 (faturamento por segmento) ·
 * V14 (tempo médio por etapa).
 */

import { FilterBar } from "@/components/filter-bar";
import { HorizontalBarChart } from "@/components/horizontal-bar-chart";
import { Panel } from "@/components/panel";
import { RefreshIndicator } from "@/components/refresh-indicator";
import { COLORS, STAGE_LABELS } from "@/lib/constants";
import { applyFilters, parseFiltersFromSearchParams, uniqueResponsaveis, uniqueSegmentos } from "@/lib/filters";
import {
  faturamentoPorSegmento,
  oportunidadesPorSegmento,
  tempoMedioPorEtapa,
} from "@/lib/kpis";
import { loadDataset } from "@/lib/transforms";

export const revalidate = 300;

export default async function AbordagemPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFiltersFromSearchParams(params);
  const dataset = await loadDataset();
  const filtered = applyFilters(dataset.negocios, filters);

  const responsaveis = uniqueResponsaveis(dataset.negocios);
  const segmentos = uniqueSegmentos(dataset.negocios);

  const validDealIds = new Set(filtered.map((n) => n.dealId));
  const tempoEtapas = tempoMedioPorEtapa(dataset.historico, validDealIds, STAGE_LABELS).map((t) => ({
    label: t.label,
    valor: t.diasMedios,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Abordagem & Velocidade</h1>
        <p className="text-sm text-gray-600">
          Distribuição por segmento e tempo médio de permanência por etapa.
        </p>
        <RefreshIndicator
          fetchedAt={dataset.fetchedAt}
          totalNegocios={dataset.negocios.length}
          totalHistorico={dataset.historico.length}
        />
      </div>

      <FilterBar responsaveis={responsaveis} segmentos={segmentos} />

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Oportunidades por segmento" subtitle="Contagem de negócios">
          <HorizontalBarChart
            data={oportunidadesPorSegmento(filtered)}
            format="int"
            color={COLORS.secondary}
          />
        </Panel>
        <Panel title="Faturamento por segmento" subtitle="Apenas negócios fechados">
          <HorizontalBarChart
            data={faturamentoPorSegmento(filtered)}
            format="currency"
            color={COLORS.secondary}
          />
        </Panel>
      </section>

      <section>
        <Panel
          title="Tempo médio por etapa (dias)"
          subtitle="Da fonte TB_Historico_Movimentacao — apenas etapas ativas"
        >
          <HorizontalBarChart data={tempoEtapas} format="decimal" color={COLORS.primary} />
        </Panel>
      </section>
    </div>
  );
}
