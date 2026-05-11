# Componentes da UI

8 componentes React, todos puros: **nenhum** faz fetch, nenhum calcula
métrica. Eles apenas recebem dados já agregados em `src/lib/kpis.ts` e
renderizam usando a paleta SMUP definida em `src/lib/constants.ts`.

> Esse documento explica, pra cada componente: o que ele faz, quais dados
> consome, de onde os dados vêm na planilha e qual a conta usada pra chegar
> no valor exibido.

---

## Fluxo de dados (visão de alto nível)

```
┌─────────────────────────────────────────────────────────────────┐
│  Google Sheets (3 abas públicas, exportadas como CSV)           │
│  ─ TB_Negocios_Atual                                            │
│  ─ TB_Historico_Movimentacao                                    │
│  ─ TB_Taxas_Conversao                                           │
└──────────────────┬──────────────────────────────────────────────┘
                   │ fetch CSV (ISR, 5min)
                   ▼
        src/lib/sheets.ts  ── parse Papaparse ─▶ Raw* types
                   │
                   ▼
        src/lib/transforms.ts  ── normaliza (datas, números,
                   │             responsável, segmento, lead_time)
                   ▼
                Dataset {negocios, historico, taxas, fetchedAt}
                   │
                   ▼
        src/lib/filters.ts  ── aplica querystring (?responsavel=, etc)
                   │
                   ▼
        src/lib/kpis.ts  ── 14 funções puras: faturamentoGerado, ticketMedio,
                   │       contagemPorFase, tempoMedioPorEtapa, ...
                   ▼
        src/components/*  ── recebe props já calculadas, renderiza
```

Resumo: **componente nunca lê CSV nem soma nada**. Toda a matemática vive
em `lib/kpis.ts` (cálculos) e `lib/format.ts` (formatação pt-BR).

---

## Índice

| Arquivo | Função | Onde aparece | Dado consumido |
|---|---|---|---|
| [`nav-bar.tsx`](#nav-bartsx) | Header sticky com logo + tabs | global | nenhum |
| [`filter-bar.tsx`](#filter-bartsx) | 4 selects globais (resp/seg/de/até) | global | `FilterOption[]` (responsáveis + segmentos com contagem) |
| [`refresh-indicator.tsx`](#refresh-indicatortsx) | "Última sincronização" + totais | topo de cada página | `fetchedAt` ISO + totais |
| [`panel.tsx`](#paneltsx) | Wrapper visual com título/subtítulo | em todo gráfico | apenas children |
| [`kpi-card.tsx`](#kpi-cardtsx) | Cartão grande com 1 número | V1-V4, V8, V9 | string já formatada |
| [`time-series-chart.tsx`](#time-series-charttsx) | Linha + área para séries mensais | V5, V6 | `SeriePonto[]` |
| [`horizontal-bar-chart.tsx`](#horizontal-bar-charttsx) | Barras horizontais ordenadas | V7, V11, V12, V13, V14 | `{label, valor}[]` |
| [`funnel-chart.tsx`](#funnel-charttsx) | Funil em barras decrescentes | V10 | `FaseContagem[]` |

---

## Detalhes por componente

### `nav-bar.tsx`

**O que faz.** Header sticky com logo "S" da SMUP + nome do dashboard + 3
tabs de navegação (Visão Executiva / Funil Comercial / Abordagem & Velocidade).
Destaca a tab ativa com fundo azul SMUP (`COLORS.primary` = `#1A5276`).

**Origem do dado.** Nenhum. As tabs vêm de `NAV_LINKS` em `lib/constants.ts`.

**Cálculo.** Nenhum. Só compara `pathname` (do `usePathname()`) com o `href`
de cada link pra decidir o destaque.

---

### `filter-bar.tsx`

**O que faz.** 4 controles que filtram **todas** as métricas da página:
- `Responsável` (select) — só responsáveis com >= 1 negócio aparecem
- `Segmento` (select) — idem
- `De` / `Até` (date pickers) — filtra por `data_criacao` do negócio

Estado vive na **querystring** (`?responsavel=Charles&segmento=Hospital`),
então a URL é compartilhável. Mudou um filtro? `router.push` → o React
Server Component re-renderiza tudo. Não há estado interno.

**Origem do dado.**
- `responsaveis: FilterOption[]` — derivado de `uniqueResponsaveis(negocios)`
  em `lib/filters.ts`. `value` = nome normalizado, `count` = nº de negócios
  daquele responsável.
- `segmentos: FilterOption[]` — idem, via `uniqueSegmentos`.

**Cálculo (do filtro em si).** Realizado em `applyFilters()` (lib/filters.ts):
```ts
if (responsavel && n.responsavelNormalizado !== responsavel) return false;
if (segmento && n.segmentoNormalizado !== segmento) return false;
if (from && n.dataCriacao < from) return false;
if (to && n.dataCriacao > to) return false;
```

**Detalhes de UX.**
- Lista de responsáveis vem ordenada por **contagem desc** ("quem tem mais
  deals primeiro"). "Sem responsável" sempre no fim.
- Contagem aparece entre parênteses no label: `Charles (3)` — assim o
  usuário entende por que os KPIs zeram quando filtra alguém com poucos
  negócios fechados.
- Botão "Limpar" aparece só quando algum filtro está ativo. Cor vermelha
  (`COLORS.danger`).

---

### `refresh-indicator.tsx`

**O que faz.** Linha discreta no topo de cada página com 4 informações:
1. **Última sincronização** — quando o servidor terminou de buscar os CSVs.
   Timestamp formatado em **timezone de Brasília** (`America/Sao_Paulo`)
   via `formatDateTime()` em `lib/format.ts`. Sufixo `(BRT)` deixa explícito.
2. **Negócios** — total de linhas válidas em `TB_Negocios_Atual`.
3. **Movimentações** — total de linhas em `TB_Historico_Movimentacao`.
4. **"cache ISR · revalida automaticamente a cada 5 min"** — lembrete.

**Origem do dado.**
- `fetchedAt: string` — `new Date().toISOString()` capturado no fim do
  `loadDataset()` em `lib/transforms.ts`.
- `totalNegocios: number` — `dataset.negocios.length` (após filtrar IDs vazios).
- `totalHistorico: number` — `dataset.historico.length`.

**Cálculo.** Nenhum. Apenas formatação.

---

### `panel.tsx`

**O que faz.** Card branco com borda, sombra suave, padding e título +
subtítulo. Todo gráfico vai dentro de um `<Panel>` pra ficar consistente.

**Origem do dado.** Nenhum. Recebe `title`, `subtitle?` e `children`.

**Cálculo.** Nenhum.

---

### `kpi-card.tsx`

**O que faz.** Cartão grande com 1 número e label. Usado nos 6 KPIs:

| KPI | Visual | Função em kpis.ts | Conta |
|---|---|---|---|
| V1 | Faturamento gerado | `faturamentoGerado` | `SUM(valor_contrato) WHERE fase_atual = "Fechado"` |
| V2 | Ticket médio | `ticketMedio` | `AVG(valor_contrato) WHERE fase_atual = "Fechado"` |
| V3 | Negócios em aberto | `negociosEmAberto` | `COUNT(deal_id) WHERE status_aberto = TRUE` |
| V4 | Lead time médio | `leadTimeMedio` | `AVG(data_ultima_fase - data_criacao) WHERE fase_atual = "Fechado"`, em dias |
| V8 | Taxa de conversão geral | `taxaConversaoGeral` | `fechados / (em aberto + fechados)` |
| V9 | Negociações perdidas | `negociacoesPerdidas` | `COUNT(deal_id) WHERE fase_atual = "Perdido"` |

**Origem do dado.** Coluna `valor_contrato`, `data_criacao`, `data_ultima_fase`,
`status_aberto`, `fase_atual` de `TB_Negocios_Atual`.

**Cálculo.** Realizado nas funções acima em `lib/kpis.ts`. O cartão recebe
o `value` já formatado (string em pt-BR vinda de `lib/format.ts`).

**Tons disponíveis.**
- `primary` (default) — azul SMUP, branco
- `danger` — vermelho (`COLORS.danger`), branco — usado em V9
- `neutral` — fundo branco com borda — para métricas informativas

---

### `time-series-chart.tsx`

**O que faz.** Gráfico de linha **reta** (não suavizada) com área
preenchida abaixo, dots pequenos em cada ponto e tooltip com valor formatado.

Usado em 2 visuais:

| Visual | Função | Conta | Eixo Y |
|---|---|---|---|
| V5 | Leads ao longo do tempo | `leadsAoLongoDoTempo` | `COUNT(deal_id) GROUP BY mês de data_criacao` | quantidade |
| V6 | Faturamento ao longo do tempo | `faturamentoAoLongoDoTempo` | `SUM(valor_contrato) GROUP BY mês de data_ultima_fase WHERE fase_atual = "Fechado"` | R$ |

**Origem do dado.** Colunas `data_criacao`, `data_ultima_fase`, `valor_contrato`,
`fase_atual` de `TB_Negocios_Atual`.

**Cálculo.** Função `aggregateByMonth(rows, dateOf, valueOf)` em `lib/kpis.ts`:
1. Itera negócios e agrupa por `startOfMonth(dateOf(row))` (date-fns).
2. Para cada bucket, acumula `valueOf(row)` — `+1` no caso de count, ou
   `+ row.valorContrato` no caso de currency.
3. Ordena por chave `yyyy-MM` ascendente e formata label `MMM/yy`.

**Props.**
- `data: SeriePonto[]` — `{ mes, label, valor }[]`
- `type: "count" | "currency"` — decide o formatter do eixo Y e tooltip
- `height?: number` — default 280

**Detalhes de UX.**
- `type="linear"` no Recharts — linhas retas com bolinha em cada ponto.
- `dot={{ r: 3, fill: secondary }}` — bola pequena na cor da linha.
- `activeDot={{ r: 5 }}` — bola maior quando faz hover.

---

### `horizontal-bar-chart.tsx`

**O que faz.** Gráfico genérico de barras horizontais ordenadas por valor
desc. Suporta 4 formatos de número e **scroll interno** quando a lista é longa.

Usado em **5 visuais**:

| Visual | Função em kpis.ts | Conta | Formato |
|---|---|---|---|
| V7 | `faturamentoPorResponsavel` | `SUM(valor_contrato) GROUP BY responsavel_normalizado WHERE fase_atual = "Fechado"` | currency |
| V11 | `dataset.taxas` (direto da planilha) | leitura da aba `TB_Taxas_Conversao` (pré-agregada) | percent |
| V12 | `oportunidadesPorSegmento` | `COUNT(deal_id) GROUP BY segmento_normalizado` | int |
| V13 | `faturamentoPorSegmento` | `SUM(valor_contrato) GROUP BY segmento_normalizado WHERE fase_atual = "Fechado"` | currency |
| V14 | `tempoMedioPorEtapa` | `AVG(tempo_na_fase) GROUP BY fase_anterior` (de `TB_Historico_Movimentacao`) | decimal (dias) |

**Origem do dado.**
- V7, V12, V13: colunas `responsavel`, `segmento`, `valor_contrato`, `fase_atual`
  de `TB_Negocios_Atual`.
- V11: aba `TB_Taxas_Conversao` na íntegra — colunas `transicao` e `taxa`.
  **Não responde aos filtros**, é uma métrica global da planilha.
- V14: coluna `tempo_na_fase` de `TB_Historico_Movimentacao`, filtrada pelos
  `deal_id` que sobreviveram aos filtros.

**Cálculo.** Veja cada função em `lib/kpis.ts` para detalhes. Todas seguem
o padrão `Map<string, number>` → ordenado por valor desc.

**Props.**
- `data: { label, valor }[]` — já agregado e ordenado
- `format: "currency" | "int" | "decimal" | "percent"` — controla o eixo X
  e o label da barra (usa `lib/format.ts`)
- `color?: string` — default `COLORS.primary`
- `height?: number` — altura mínima do canvas (default 320)
- `maxContainerHeight?: number` — quando definido, o container vira
  scrollable se a altura calculada (`data.length * 36 + 40`) excede esse
  valor. Mantém todas as barras com altura legível e adiciona scroll
  vertical. Usado em V12 e V13 (longa lista de tipos de clínica).

---

### `funnel-chart.tsx`

**O que faz.** Funil visual em **8 barras horizontais decrescentes**
representando as 8 fases ativas do pipeline comercial. Cada barra mostra
o nome da fase + a contagem de negócios atualmente naquela fase. Largura
relativa cai do topo (Lead, 100%) ao fundo (Fechado, 18%) pra criar o
efeito visual de funil.

**Origem do dado.** Coluna `fase_atual` de `TB_Negocios_Atual`, agrupada
em `contagemPorFase(rows, STAGE_LABELS, STAGE_WIDTHS)`.

**Cálculo.**
1. `COUNT(deal_id) GROUP BY fase_atual` sobre as linhas já filtradas.
2. Mapeia pra ordem canônica de `FUNNEL_STAGES` (Lead → Fechado), em
   `lib/constants.ts`.
3. **Não inclui "Perdido"** — é fase terminal mostrada separadamente em V9.
4. Largura de cada barra (%) vem de `STAGE_WIDTHS` — valores fixos, não
   refletem o dado (é só estética).

**Props.**
- `data: FaseContagem[]` — `{ fase, label, count, width }[]` já ordenado.

**Detalhes de UX.**
- Renderiza apenas com Tailwind + flex — sem dependência de Recharts.
- Cada barra usa `COLORS.primary` com texto branco; `min-height: 44px`
  pra todas serem clicáveis em mobile (futuro: drill-down).

---

## Onde mexer em quê

| Quero mudar | Arquivo |
|---|---|
| Paleta de cores | `src/lib/constants.ts` → `COLORS` |
| Ordem ou label das fases do funil | `src/lib/constants.ts` → `FUNNEL_STAGES`, `STAGE_LABELS`, `STAGE_WIDTHS` |
| Conta de uma métrica (ex.: ticket médio considerar perdidos?) | `src/lib/kpis.ts` |
| Como um responsável é normalizado | `src/lib/transforms.ts` → `normalizeResponsavel` |
| Como um segmento é normalizado | `src/lib/transforms.ts` → `normalizeSegmento` |
| Adicionar um filtro novo | `src/lib/types.ts` (campo `DashboardFilters`) + `src/lib/filters.ts` (parse + apply) + `src/components/filter-bar.tsx` (UI) |
| Trocar layout de uma página | `src/app/<rota>/page.tsx` |
| Adicionar um 15º visual | siga [docs/ADDING-VISUALS.md](../../docs/ADDING-VISUALS.md) |

---

## Convenções

- **Componente puro.** Nada de `fetch`, nada de `useEffect` com side effect,
  nada de cálculo. Se precisar agregar dados, agregue em `lib/kpis.ts`.
- **Server Components por padrão.** Apenas componentes que precisam de
  `useState`/`useRouter`/`useTransition` levam o `"use client"`:
  `filter-bar`, `time-series-chart`, `horizontal-bar-chart`, `nav-bar`.
- **Estilo.** Tailwind v4 + style inline pros valores que vêm de
  `COLORS`. Nenhum CSS module.
- **Formatação.** Sempre via `lib/format.ts` (locale pt-BR). Nunca chame
  `toLocaleString` direto no componente.
