/**
 * Página 1 — Visão Executiva.
 *
 * 4 KPIs (V1-V4) + ranking responsável (V7) com espaço pleno +
 * 2 séries temporais (V5-V6) lado a lado.
 *
 * Snapshot do funil foi removido daqui — vive só no /funil pra evitar duplicação.
 */

import { FilterBar } from "@/components/filter-bar";
import { HorizontalBarChart } from "@/components/horizontal-bar-chart";
import { KpiCard } from "@/components/kpi-card";
import { Panel } from "@/components/panel";
import { RefreshIndicator } from "@/components/refresh-indicator";
import { TimeSeriesChart } from "@/components/time-series-chart";
import { applyFilters, parseFiltersFromSearchParams, uniqueResponsaveis, uniqueSegmentos } from "@/lib/filters";
import { formatCurrency, formatDecimal, formatInt } from "@/lib/format";
import {
  faturamentoAoLongoDoTempo,
  faturamentoGerado,
  faturamentoPorResponsavel,
  leadTimeMedio,
  leadsAoLongoDoTempo,
  negociosEmAberto,
  ticketMedio,
} from "@/lib/kpis";
import { loadDataset } from "@/lib/transforms";

export const revalidate = 300;

export default async function VisaoExecutivaPage({
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Visão Executiva</h1>
        <p className="text-sm text-gray-600">
          Indicadores de resultado comercial: faturamento, ticket médio, volume e velocidade.
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
          label="Faturamento gerado"
          value={formatCurrency(faturamentoGerado(filtered), true)}
          subtitle="Soma · negócios fechados"
        />
        <KpiCard
          label="Ticket médio"
          value={formatCurrency(ticketMedio(filtered), true)}
          subtitle="Média · negócios fechados"
        />
        <KpiCard
          label="Negócios em aberto"
          value={formatInt(negociosEmAberto(filtered))}
          subtitle="status_aberto = TRUE"
        />
        <KpiCard
          label="Lead time médio"
          value={`${formatDecimal(leadTimeMedio(filtered))} dias`}
          subtitle="criação → fechamento"
        />
      </section>

      <section className="grid grid-cols-1">
        <Panel
          title="Faturamento por responsável"
          subtitle="Soma do valor de contratos fechados"
        >
          <HorizontalBarChart
            data={faturamentoPorResponsavel(filtered)}
            format="currency"
            height={360}
          />
        </Panel>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Leads ao longo do tempo" subtitle="Negócios criados por mês">
          <TimeSeriesChart data={leadsAoLongoDoTempo(filtered)} type="count" />
        </Panel>
        <Panel title="Faturamento ao longo do tempo" subtitle="Soma por mês de fechamento">
          <TimeSeriesChart data={faturamentoAoLongoDoTempo(filtered)} type="currency" />
        </Panel>
      </section>
    </div>
  );
}
