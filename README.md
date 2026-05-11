# SMUP Dashboard

Dashboard comercial da SMUP — pipeline de vendas em tempo real, com dados ao vivo
de uma planilha Google Sheets. Substituiu a versão Looker Studio para dar mais
controle sobre identidade visual, regras de negócio e performance.

> **Stack:** Next.js 15 (App Router) · React 19 · TypeScript estrito · Tailwind v4 ·
> Recharts · papaparse · date-fns. Hospedado em Vercel.
>
> **Mantido por:** Singular Group · Pedro Roberto Miranda de Carvalho.

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
pública e os IDs estão hard-coded como default em `src/lib/sheets.ts`. Para
trocar de planilha ou subir um clone do dashboard, configure as variáveis
descritas abaixo.

---

## Variáveis de ambiente

Todas as variáveis vivem em `.env.local` (dev) ou no painel do Vercel (prod).
Copie o template como ponto de partida:

```bash
cp .env.example .env.local
```

Conteúdo completo de `.env.example`:

```bash
# === SMUP Dashboard · variáveis de ambiente ===

# ID da planilha Google Sheets. Extraído da URL:
# https://docs.google.com/spreadsheets/d/<ESTE_ID>/edit
SMUP_SHEET_ID=1CZ4tfnyTcR9iFJujZhHa2aNHFajZc8zHdB21DEXgwfk

# GIDs (IDs numéricos) de cada aba. Pra descobrir, abra a planilha e clique
# em cada aba — o número após "#gid=" na URL é o GID daquela aba.
SMUP_GID_NEGOCIOS=0
SMUP_GID_HISTORICO=1711054039
SMUP_GID_TAXAS=41696639

# Tempo de cache em segundos (ISR). Padrão 300 = 5min.
# Setar 0 desativa cache — não recomendado em prod, estoura cota do Sheets.
SMUP_REVALIDATE_SECONDS=300

# Token (string aleatória) que protege o endpoint POST /api/revalidate.
# Gerar com: openssl rand -hex 32
# No PowerShell: [guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
REVALIDATE_TOKEN=changeme

# URL pública do site. Em prod, o Vercel preenche automaticamente.
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Como obter cada credencial

| Variável | Onde encontrar | Obrigatória |
|---|---|---|
| `SMUP_SHEET_ID` | Na URL da planilha — copie o trecho entre `/d/` e `/edit`. Ex: `docs.google.com/spreadsheets/d/`**`1CZ4tfnyTcR9iFJujZhHa2aNHFajZc8zHdB21DEXgwfk`**`/edit` | sim |
| `SMUP_GID_NEGOCIOS` | Clique na aba `TB_Negocios_Atual` na planilha → a URL muda pra `...#gid=0`. O número após `#gid=` é o GID. | sim |
| `SMUP_GID_HISTORICO` | Clique em `TB_Historico_Movimentacao` → copie o `gid` da URL. | sim |
| `SMUP_GID_TAXAS` | Clique em `TB_Taxas_Conversao` → copie o `gid` da URL. | sim |
| `SMUP_REVALIDATE_SECONDS` | Sem credencial — apenas um número (segundos). Padrão `300` (5min). | não |
| `REVALIDATE_TOKEN` | Você gera. Cole o **mesmo valor** no Vercel e no Apps Script (se usar webhook do Sheets). | sim, se for usar webhook |
| `NEXT_PUBLIC_SITE_URL` | Localmente `http://localhost:3000`; em prod o Vercel injeta `https://<projeto>.vercel.app`. | não |

### Pré-requisitos da planilha

A planilha **precisa estar pública** em modo "Qualquer pessoa com o link pode
ver". Caminho: na planilha → **Compartilhar** → "Acesso geral" → "Qualquer
pessoa com o link" → permissão "Visualizador".

Sem isso, o fetch CSV retorna 401/403 e o build quebra com o erro descrito em
[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

### Configurar no Vercel

Painel **Project Settings → Environment Variables** → cole as 7 variáveis
acima nas 3 environments (Production, Preview, Development). Detalhes
adicionais em [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

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
│   ├── components/
│   │   └── README.md .................... o que cada componente faz, dados que consome
│   └── lib/
│       ├── sheets.ts .................... fetch + cache CSV
│       ├── transforms.ts ................ normalização (regex responsável etc.)
│       ├── kpis.ts ...................... cálculos puros das 14 métricas
│       ├── filters.ts ................... aplicação dos filtros globais
│       ├── format.ts .................... helpers locale BR
│       ├── constants.ts ................. paleta e ordem do funil
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
| Entender o que cada componente da UI faz | [src/components/README.md](src/components/README.md) |
| Subir uma cópia em outro Vercel | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Adicionar um novo gráfico | [docs/ADDING-VISUALS.md](docs/ADDING-VISUALS.md) |
| Resolver um erro 500 / build quebrado | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |

---

## Licença

MIT — código aberto. Os **dados** da planilha SMUP, no entanto, são propriedade
da SMUP e da Singular Group. Não copie a planilha sem autorização.
