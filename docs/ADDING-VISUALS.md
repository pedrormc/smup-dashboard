# Adicionando um novo visual

Tutorial passo-a-passo para adicionar um 15º visual ao dashboard.

## Exemplo: "Faturamento por mês × responsável (heatmap)"

### 1. Definir o cálculo (puro)

Em `src/lib/kpis.ts`:

```ts
export interface HeatmapCelula {
  responsavel: string;
  mes: string;
  valor: number;
}

export function faturamentoMensalPorResponsavel(rows: Negocio[]): HeatmapCelula[] {
  const map = new Map<string, number>();
  for (const n of rows.filter(fechado)) {
    if (!n.dataUltimaFase) continue;
    const mes = format(startOfMonth(n.dataUltimaFase), "yyyy-MM");
    const key = `${n.responsavelNormalizado}|${mes}`;
    map.set(key, (map.get(key) ?? 0) + (n.valorContrato ?? 0));
  }
  return Array.from(map.entries()).map(([key, valor]) => {
    const [responsavel, mes] = key.split("|");
    return { responsavel, mes, valor };
  });
}
```

### 2. Criar o componente (UI)

`src/components/heatmap-chart.tsx`:

```tsx
"use client";

import type { HeatmapCelula } from "@/lib/kpis";

export function HeatmapChart({ data }: { data: HeatmapCelula[] }) {
  // implementação Recharts ou tabela CSS-grid
  return <div>{/* ... */}</div>;
}
```

Boas práticas:
- Componentes interativos (com `useState` ou hooks Recharts) precisam de `"use client"`.
- Componentes puros podem ser server components — preferir, é menos JS no cliente.
- Usar cores de `lib/constants.ts → COLORS`, não inventar hex novos.

### 3. Adicionar à página

Em `src/app/page.tsx` (ou na página apropriada):

```tsx
import { HeatmapChart } from "@/components/heatmap-chart";
import { faturamentoMensalPorResponsavel } from "@/lib/kpis";

// dentro do componente:
<Panel title="Faturamento mensal × responsável">
  <HeatmapChart data={faturamentoMensalPorResponsavel(filtered)} />
</Panel>
```

### 4. Documentar

- Adicionar linha no README.md "Os 14 visuais" (vira "15 visuais").
- Se o visual usa um campo novo da planilha, atualizar `docs/DATA-MODEL.md`.
- Se introduz uma dependência nova, justificar em `docs/ARCHITECTURE.md`.

### 5. Validar

```bash
npm run typecheck
npm run build
npm run start
```

Abrir o navegador, conferir o visual em todos os filtros possíveis (sem filtro,
filtrado por responsável, filtrado por período).

## Convenções

- **Nome do arquivo**: `kebab-case.tsx`, ex: `heatmap-chart.tsx`.
- **Nome da função no kpis.ts**: camelCase descritivo, ex: `faturamentoMensalPorResponsavel`.
- **Tipo de retorno do KPI**: sempre interface explícita exportada, nunca tipo
  anônimo. Facilita reuso.
- **Filtros**: nunca chame `loadDataset()` num componente — passe `filtered`
  como prop. Senão a memoization de cache do Next quebra.
- **i18n**: tudo em pt-BR informal. Padrão do produto.

## Checklist antes de fazer PR

- [ ] `npm run typecheck` passa
- [ ] `npm run build` passa
- [ ] Visual renderiza sem dados (estado vazio elegante)
- [ ] Visual respeita os filtros globais
- [ ] Visual usa cores de `COLORS`, não literais novos
- [ ] Linha adicionada na tabela do README
