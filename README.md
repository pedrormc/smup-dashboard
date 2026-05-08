# SMUP Dashboard

Dashboard comercial da SMUP — pipeline de vendas em tempo real, com dados ao vivo
de uma planilha Google Sheets. Substituiu a versão Looker Studio para dar mais
controle sobre identidade visual, regras de negócio e performance.

> **Stack:** Next.js 15 (App Router) · React 19 · TypeScript estrito · Tailwind v4 ·
> Recharts · papaparse · date-fns. Hospedado em Vercel.
>
> **Mantido por:** Singular Group · Pedro Roberto Miranda de Carvalho (CTO).

---

## Visão de 30 segundos

- 3 páginas (Visão Executiva · Funil Comercial · Abordagem & Velocidade) com 14
  visuais cobrindo todo o funil comercial.
- Fonte única: [planilha SMUP](https://docs.google.com/spreadsheets/d/1CZ4tfnyTcR9iFJujZhHa2aNHFajZc8zHdB21DEXgwfk/edit)
  — abas `TB_Negocios_Atual`, `TB_Historico_Movimentacao`, `TB_Taxas_Conversao`.
- Acesso: planilha pública em modo "qualquer pessoa com o link". O dashboard
  consome via export CSV. Sem credenciais Google, sem service account.
- Cache: ISR (Incremental Static Regeneration) — todo dado é cacheado por 5min.
  Endpoint `POST /api/revalidate` força refetch imediato.
- Filtros globais: responsável, segmento e intervalo de datas. Estado vive na
  URL (`?responsavel=...`), então links são compartilháveis.

---

## Quick start

```bash
git clone https://github.com/pedrormc/smup-dashboard
cd smup-dashboard
cp .env.example .env.local
npm install
npm run dev
```

Abrir <http://localhost:3000>. Sem nenhuma configuração extra: a planilha já está
pública e os IDs estão hard-coded como default em `src/lib/sheets.ts`.

Para mexer em outra planilha, ajustar `SMUP_SHEET_ID` e os 3 GIDs no `.env.local`.

---

## Estrutura

```
smup-dashboard/
├── README.md ............................ este arquivo
├── docs/
│   ├── ARCHITECTURE.md .................. visão geral, decisões, fluxo de dados
│   ├── DATA-MODEL.md .................... schema das abas + regras de qualidade
│   ├── DEPLOYMENT.md .................... deploy no Vercel + variáveis
│   ├── MAINTENANCE.md ................... rotinas mensais, monitoramento
│   ├── TROUBLESHOOTING.md ............... checklist de erros comuns
│   └── ADDING-VISUALS.md ................ como criar um 15º visual
├── src/
│   ├── app/ ............................. App Router (3 páginas + 2 APIs)
│   ├── components/ ...................... charts, KPIs, filtros
│   └── lib/
│       ├── sheets.ts .................... fetch + cache CSV
│       ├── transforms.ts ................ normalização (regex responsável etc.)
│       ├── kpis.ts ...................... cálculos puros das 14 métricas
│       ├── filters.ts ................... aplicação dos filtros globais
│       ├── format.ts .................... helpers locale BR
│       ├── constants.ts ................. paleta, ordem do funil, IDs corrompidos
│       └── types.ts
├── .env.example ......................... template das envs
├── package.json
└── vercel.json
```

---

## Os 14 visuais

| # | Visual | Página | Cálculo |
|---|---|---|---|
| V1 | Faturamento gerado | Visão | `SUM(valor_contrato) where fase = "Fechado"` |
| V2 | Ticket médio | Visão | `AVG(valor_contrato) where fase = "Fechado"` |
| V3 | Negócios em aberto | Visão | `COUNT(deal_id) where status_aberto = TRUE` |
| V4 | Lead time médio (dias) | Visão | `AVG(data_ultima_fase - data_criacao) where fase = "Fechado"` |
| V5 | Leads ao longo do tempo | Visão | `COUNT(deal_id) por mês de data_criacao` |
| V6 | Faturamento ao longo do tempo | Visão | `SUM(valor_contrato) por mês de data_ultima_fase, fase = "Fechado"` |
| V7 | Faturamento por responsável | Visão | `SUM(valor_contrato) por responsavel_normalizado, fase = "Fechado"` |
| V8 | Taxa de conversão geral | Funil | `fechados ÷ (em aberto + fechados)` |
| V9 | Negociações perdidas | Funil | `COUNT(deal_id) where fase = "Perdido"` |
| V10 | Funil 8 fases | Funil | `COUNT(deal_id) por fase` |
| V11 | Taxa entre etapas | Funil | leitura direta de `TB_Taxas_Conversao` |
| V12 | Oportunidades por segmento | Abordagem | `COUNT(deal_id) por segmento_normalizado` |
| V13 | Faturamento por segmento | Abordagem | `SUM(valor_contrato) por segmento_normalizado, fase = "Fechado"` |
| V14 | Tempo médio por etapa | Abordagem | `AVG(tempo_na_fase) por fase_anterior` (etapas ativas) |

---

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de dev em `:3000` com hot reload |
| `npm run build` | Build de produção (estático + ISR) |
| `npm run start` | Servir o build (depois de `build`) |
| `npm run typecheck` | `tsc --noEmit` — checagem de tipos completa |
| `npm run lint` | ESLint via config Next |

---

## Atualização dos dados

Há **três formas** dos dados serem atualizados em produção:

1. **Automática (ISR)** — toda página tem `revalidate = 300`, então a primeira
   request após 5min refaz o fetch da planilha em background.
2. **Manual (webhook)** — `POST https://<url>/api/revalidate` com header
   `x-revalidate-token: $REVALIDATE_TOKEN` invalida o cache imediatamente.
3. **Apps Script onEdit (opcional)** — script no Sheets que dispara o webhook
   acima toda vez que a planilha muda. Ver [docs/MAINTENANCE.md](docs/MAINTENANCE.md).

---

## Ler antes de mexer

| Você quer… | Leia |
|---|---|
| Entender as decisões arquiteturais | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Mexer no schema dos dados | [docs/DATA-MODEL.md](docs/DATA-MODEL.md) |
| Subir uma cópia em outro Vercel | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Adicionar um novo gráfico | [docs/ADDING-VISUALS.md](docs/ADDING-VISUALS.md) |
| Resolver um erro 500 / build quebrado | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |

---

## Licença

MIT — código aberto. Os **dados** da planilha SMUP, no entanto, são propriedade
da SMUP e da Singular Group. Não copie a planilha sem autorização.
