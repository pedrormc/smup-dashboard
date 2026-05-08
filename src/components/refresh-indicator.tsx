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
        <strong className="font-semibold">Última sincronização:</strong> {formatDateTime(fetchedAt)}
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
