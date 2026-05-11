/**
 * Página 2 — Funil Comercial.
 *
 * V8 (taxa conversão geral) · V9 (perdidas) · V10 (funil 8 fases) ·
 * V11 (taxa entre etapas — vem direto da aba TB_Taxas_Conversao).
 */

import { FilterBar } from "@/components/filter-bar";
import { FunnelChart } from "@/components/funnel-chart";
import { HorizontalBarChart } from "@/components/horizontal-bar-chart";
import { KpiCard } from "@/components/kpi-card";
import { Panel } from "@/components/panel";
import { RefreshIndicator } from "@/components/refresh-indicator";
import { COLORS, STAGE_LABELS, STAGE_WIDTHS } from "@/lib/constants";
import { applyFilters, parseFiltersFromSearchParams, uniqueResponsaveis, uniqueSegmentos } from "@/lib/filters";
import { formatInt, formatPercent } from "@/lib/format";
import {
  contagemPorFase,
  negociacoesPerdidas,
  taxaConversaoGeral,
} from "@/lib/kpis";
import { loadDataset } from "@/lib/transforms";

export const revalidate = 300;

export default async function FunilComercialPage({
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

  const taxaGeral = taxaConversaoGeral(filtered);
  const perdidas = negociacoesPerdidas(filtered);
  const fases = contagemPorFase(filtered, STAGE_LABELS, STAGE_WIDTHS);

  // V11 — taxas vêm direto da aba TB_Taxas_Conversao (pré-agregada na planilha)
  const taxasData = dataset.taxas.map((t) => ({
    label: t.transicao,
    valor: t.taxa,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Funil Comercial</h1>
        <p className="text-sm text-gray-600">
          Volume por etapa e taxas de conversão entre fases.
        </p>
        <RefreshIndicator
          fetchedAt={dataset.fetchedAt}
          totalNegocios={dataset.negocios.length}
          totalHistorico={dataset.historico.length}
        />
      </div>

      <FilterBar responsaveis={responsaveis} segmentos={segmentos} />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Taxa de conversão geral"
          value={formatPercent(taxaGeral)}
          subtitle="fechados ÷ (em aberto + fechados)"
        />
        <KpiCard
          label="Negociações perdidas"
          value={formatInt(perdidas)}
          subtitle='fase = "Perdido"'
          tone="danger"
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Funil de vendas" subtitle="Quantidade de negócios em cada fase">
          <FunnelChart data={fases} />
        </Panel>
        <Panel
          title="Taxa de conversão entre etapas"
          subtitle="Métricas globais da planilha (TB_Taxas_Conversao) — não respondem aos filtros"
        >
          <HorizontalBarChart
            data={taxasData}
            format="percent"
            color={COLORS.primary}
            height={360}
          />
        </Panel>
      </section>
    </div>
  );
}
