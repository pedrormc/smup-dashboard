/**
 * Linha de metadados exibida no topo de cada página. 4 informações:
 *
 *   1. "Última sincronização: DD/MM/YYYY HH:mm (BRT)"
 *      → quando o servidor terminou de buscar os 3 CSVs da planilha.
 *      Vem de `dataset.fetchedAt`, gerado em `loadDataset()` no fim
 *      dos fetches paralelos (src/lib/transforms.ts).
 *      Timestamp é fixado em timezone "America/Sao_Paulo" via
 *      `formatDateTime()` (src/lib/format.ts).
 *
 *   2. "Negócios: N"
 *      → `dataset.negocios.length` — linhas válidas de TB_Negocios_Atual
 *      (após filtrar IDs vazios em `transformNegocio`).
 *
 *   3. "Movimentações: N"
 *      → `dataset.historico.length` — linhas válidas de
 *      TB_Historico_Movimentacao.
 *
 *   4. "cache ISR · revalida automaticamente a cada 5 min"
 *      → lembrete visual de que dados não são live (são cacheados).
 *      Pra forçar refresh imediato: POST /api/revalidate com o token.
 *
 * Nenhum cálculo é feito aqui — apenas formatação.
 */

import { COLORS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";

interface RefreshIndicatorProps {
  fetchedAt: string;
  totalNegocios: number;
  totalHistorico: number;
}

export function RefreshIndicator({ fetchedAt, totalNegocios, totalHistorico }: RefreshIndicatorProps) {
  return (
    <div
      className="text-xs flex flex-wrap items-center gap-x-4 gap-y-1"
      style={{ color: COLORS.muted }}
    >
      <span>
        <strong className="font-semibold">Última sincronização:</strong> {formatDateTime(fetchedAt)} (BRT)
      </span>
      <span>
        <strong className="font-semibold">Negócios:</strong> {totalNegocios.toLocaleString("pt-BR")}
      </span>
      <span>
        <strong className="font-semibold">Movimentações:</strong> {totalHistorico.toLocaleString("pt-BR")}
      </span>
      <span className="italic">cache ISR · revalida automaticamente a cada 5 min</span>
    </div>
  );
}
