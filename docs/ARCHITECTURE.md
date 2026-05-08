# Arquitetura

Visão geral das decisões técnicas do SMUP Dashboard.

## Princípios

1. **Stateless** — nenhum banco de dados próprio. A planilha Google Sheets é a
   fonte única de verdade. Tudo o que aparece na UI é derivado dela.
2. **Stale-while-revalidate** — usuário nunca espera o fetch da planilha. ISR do
   Next serve cache instantâneo e refaz o fetch em background.
3. **Funções puras na lib** — `transforms.ts`, `kpis.ts`, `filters.ts` não
   dependem de React e podem ser testadas isoladamente.
4. **URL-state-first** — filtros vivem em `?responsavel=...&from=...`, não em
   estado de cliente. Links são compartilháveis e o servidor sabe os filtros
   antes de renderizar.

## Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | Next.js 15 App Router | ISR de 1ª classe, deploy zero-config no Vercel, server components reduzem JS no cliente |
| Linguagem | TypeScript estrito | Pega bugs de schema antes de virar 500 em produção |
| Estilo | Tailwind v4 | Sem config — usa `@theme` no CSS direto, classes utilitárias rápidas |
| Charts | Recharts | API declarativa, ~50KB gzip, suporta SSR |
| CSV | papaparse | Lida com aspas, BOM, vírgula trailing — robusto |
| Datas | date-fns | Locale-aware, tree-shakeable |

## Fluxo de uma requisição

```
[Browser] -> GET /funil
              |
              v
        [Vercel Edge / Node runtime]
              |
              v
    [page.tsx server component]
              |
        loadDataset()
              |
              +-- fetchNegociosRaw()  <-- next.revalidate=300, tag=smup:negocios
              +-- fetchHistoricoRaw() <-- mesmo
              +-- fetchTaxasRaw()     <-- mesmo
              |
              v
        [transformNegocio/Historico/Taxa]  (puro)
              |
              v
        [applyFilters(rows, qs)]            (puro)
              |
              v
        [kpis.faturamentoGerado, ...]       (puro)
              |
              v
        renderiza React SSR
              |
              v
        HTML estático + chunk JS dos charts
              |
              v
        [Browser hidrata charts via Recharts]
```

Note que o dataset é fetched **uma vez por request**, não uma vez por componente.
O Next deduplica o `fetch()` por URL dentro do mesmo render tree.

## Cache: dois níveis

1. **`fetch.next.revalidate=300`** — cache do data fetch da planilha. 5 minutos
   de TTL. Compartilhado entre todas as rotas que chamam `loadDataset()`.
2. **`page.revalidate=300`** — cache do HTML renderizado por URL única (incluindo
   querystring). 5 minutos.

Os 2 caches têm o mesmo TTL por design — não faz sentido invalidar um sem o
outro. `POST /api/revalidate` chama `revalidateTag('smup:negocios' | 'smup:historico' | 'smup:taxas')`,
que automaticamente também marca as páginas como stale.

## Por que CSV em vez de Google Sheets API?

- API requer Service Account ou OAuth → mais peças móveis.
- A planilha já está pública para o time SMUP/Singular.
- Export CSV é estável há +15 anos no Google, sem rate limit relevante para nosso volume.
- Trade-off aceito: dados ficam expostos a qualquer um que descobrir o ID da
  planilha. **Não colocar dados sensíveis pessoais nessa planilha.**

## Por que Tailwind v4 sem `tailwind.config.ts`?

A v4 quebrou compatibilidade com a config JS — agora tudo é `@theme` no CSS.
Não usamos design tokens dinâmicos, então a v4 zero-config é ideal. Mantemos os
hex-codes das cores em `lib/constants.ts` para compartilhar com Recharts (que
não vê CSS).

## Limites conhecidos

- **Filtros multi-select**: não temos. Cada filtro tem 1 valor selecionado.
- **Drill-down**: clicar num gráfico não navega. Pode ser adicionado.
- **Dados históricos > 1 ano**: a planilha cresce sem rotação. Quando passar de
  ~10k linhas em `TB_Negocios_Atual`, considerar paginação ou pré-agregação.
- **Edge runtime**: páginas usam Node runtime (default) porque `papaparse` não roda
  em Edge. Latência de cold start é ~500ms (Vercel São Paulo).
