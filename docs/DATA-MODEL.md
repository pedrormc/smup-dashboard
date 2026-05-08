# Modelo de dados

A planilha SMUP é o schema canônico. Toda tabela aqui descrita está em
`https://docs.google.com/spreadsheets/d/1CZ4tfnyTcR9iFJujZhHa2aNHFajZc8zHdB21DEXgwfk/edit`.

## Aba 1 — `TB_Negocios_Atual`

Estado atual de cada negócio no CRM (HubSpot).

| Coluna | Tipo na planilha | Tipo no domínio | Obs |
|---|---|---|---|
| `deal_id` | string | `string` | Chave primária. Trim aplicado |
| `nome_negocio` | string | `string` | |
| `valor_contrato` | número | `number \| null` | Aceita "0" como null se vazio |
| `data_criacao` | ISO `YYYY-MM-DD` | `Date \| null` | parseado por `date-fns/parseISO` |
| `fase_atual` | string | `string` | Espera-se um dos valores canônicos abaixo; planilha limpa em 2026-05-08 |
| `data_ultima_fase` | ISO `YYYY-MM-DD` | `Date \| null` | |
| `proprietario` | string | — | Não usado no dashboard |
| `responsavel` | string | `string` + `responsavelNormalizado` | Ver regra abaixo |
| `n_pontos` | número | `number \| null` | |
| `cnpj` | string | — | Não usado |
| `segmento` | string | `string` + `segmentoNormalizado` | Ver regra abaixo |
| `dor_relatada` | string | — | Não usado |
| `status_aberto` | string `"TRUE"`/`"FALSE"` | `boolean` | Parse permissivo (TRUE/1/SIM/YES) |
| `link_hubspot` | string URL | `string` | |

### Valores válidos de `fase_atual`

| Valor | Posição |
|---|---|
| `Lead` | 1 |
| `Oportunidade` | 2 |
| `Diagnóstico Agendado` | 3 |
| `Confeccionar Proposta` | 4 (MQL) |
| `Proposta Agendada` | 5 (SQL) |
| `Proposta Apresentada` | 6 |
| `Em Negociação` | 7 |
| `Fechado` | 8 (ganho) |
| `Perdido` | terminal |

A ordem canônica vive em `src/lib/constants.ts → FUNNEL_STAGES`. **Mudar a ordem
ou adicionar fases requer atualizar essa constante.**

## Aba 2 — `TB_Historico_Movimentacao`

Log de cada mudança de fase.

| Coluna | Tipo | Obs |
|---|---|---|
| `log_id` | string | Chave primária |
| `deal_id` | string | FK → `TB_Negocios_Atual.deal_id` |
| `fase_anterior` | string | Pode ser `INICIO` (criação do negócio) — V14 filtra |
| `fase_nova` | string | |
| `data_movimentacao` | ISO `YYYY-MM-DD` | |
| `tempo_na_fase` | número | dias na `fase_anterior` |

> Há uma 7ª coluna sem nome no CSV (vírgula trailing no header). Ignorada pelo
> parser.

## Aba 3 — `TB_Taxas_Conversao`

Taxas pré-agregadas para o V11. Calculada via `COUNTIFS` no próprio Sheets.

| Coluna | Tipo |
|---|---|
| `ordem` | número (1..7) |
| `transicao` | string ex: `"Lead → Oportunidade"` |
| `taxa` | número decimal — **locale BR** (vírgula) |
| `total_saidas` | número |

### Por que taxas são pré-agregadas?

Calcular dentro do dashboard exigiria juntar `TB_Historico_Movimentacao` com
filtros de fase específicos para cada uma das 7 transições. A planilha já faz
isso de forma transparente para o time comercial — preserva a auditoria humana.

Se quiser recalcular as taxas no dashboard, criar uma função em `kpis.ts`:

```ts
export function taxaPorTransicao(historico: Historico[]) {
  // total saídas de cada fase
  const saidas = new Map<string, number>();
  // saídas que foram para fase específica
  const transicoes = new Map<string, number>();
  // ...
}
```

## Regras de qualidade aplicadas

| Regra | Onde está | Por quê |
|---|---|---|
| Normalizar `responsavel` via regex | `transforms.ts → normalizeResponsavel` | 8 variações de "Neidison" + typos + casos como "Clis/Neidison" |
| Normalizar `segmento` (vazio → "Não informado") | `transforms.ts → normalizeSegmento` | ~80% das linhas têm segmento vazio |
| Parse de número aceitando vírgula decimal BR | `transforms.ts → parseNumber` | `TB_Taxas_Conversao.taxa` está em locale BR |
| Datas ISO obrigatórias | `transforms.ts → parseDate` | A planilha já está em ISO |

## Mudando o schema

1. Sempre atualize **3 lugares**:
   - O tipo `Raw*` (vem direto do CSV) em `lib/types.ts`.
   - O tipo de domínio (campos camelCase) em `lib/types.ts`.
   - A função `transform*()` em `lib/transforms.ts` — onde a normalização acontece.
2. Se a coluna participa de algum KPI, atualizar `lib/kpis.ts` também.
3. Rodar `npm run typecheck` antes de commitar — TypeScript pega 80% dos erros
   de schema imediatamente.
