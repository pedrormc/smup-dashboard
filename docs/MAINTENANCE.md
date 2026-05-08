# Manutenção

Rotinas de operação para manter o dashboard saudável.

## Mensal

- [ ] Verificar se algum responsável novo apareceu na planilha que não está
      coberto pela normalização. Rodar:
      ```bash
      curl -s https://smup-dashboard.vercel.app/api/data | jq '.negocios[].responsavel' | sort -u
      ```
      e comparar com `lib/transforms.ts → normalizeResponsavel`.
- [ ] Conferir se as taxas de `TB_Taxas_Conversao` estão atualizadas. Cada
      transição é um `COUNTIFS` na planilha — se alguém renomear uma fase, a
      fórmula quebra silenciosamente.
- [ ] Conferir se há novos valores corrompidos em `fase_atual` (similares aos
      `1330117664` / `1330117663`). Heurística: qualquer valor de fase
      inteiramente numérico é suspeito.

## Trimestral

- [ ] Rodar `npm outdated` e atualizar dependências patch/minor.
- [ ] Conferir Lighthouse score do dashboard em produção (target: ≥ 90 em
      Performance/Accessibility).
- [ ] Limpar deployments antigos no Vercel (mantém últimos 10).

## Quando mexer no código

| Cenário | O que fazer |
|---|---|
| Time SMUP renomeou uma fase | Atualizar `FUNNEL_STAGES` e `STAGE_LABELS` em `lib/constants.ts` |
| Apareceu um novo responsável | Adicionar nova `WHEN` em `normalizeResponsavel` (`lib/transforms.ts`) |
| Adicionar 15º visual | Seguir [docs/ADDING-VISUALS.md](ADDING-VISUALS.md) |
| Mudou ID da planilha | Atualizar env `SMUP_SHEET_ID` em todas as 3 environments do Vercel |
| Filtro novo (ex: por valor mínimo) | Adicionar campo em `DashboardFilters` (`lib/types.ts`) → `applyFilters` (`lib/filters.ts`) → UI em `filter-bar.tsx` |

## Webhook de revalidação

Se configurado (ver [DEPLOYMENT.md](DEPLOYMENT.md)), invalida cache em 1 segundo
após edição da planilha. Para testar manualmente:

```bash
curl -X POST -H "x-revalidate-token: $REVALIDATE_TOKEN" \
  https://smup-dashboard.vercel.app/api/revalidate
```

Resposta esperada:
```json
{
  "revalidated": true,
  "tags": ["smup:negocios", "smup:historico", "smup:taxas"],
  "at": "2026-05-08T01:30:00.000Z"
}
```

## Monitoramento

- **Vercel Analytics** (free tier) habilitado pelo `@vercel/analytics` — opcional,
  adicione se quiser métricas de tráfego.
- **Sentry** não configurado por default. Erros de runtime aparecem nos logs do
  Vercel em **Project → Deployments → Functions → Logs**.

## Backup

A planilha é a fonte de verdade. **Faça backup da planilha** mensalmente —
File → Make a copy → renomear com data. O dashboard é stateless e pode ser
recriado em ~5 minutos a partir do código.

## Quando a planilha estourar

A `TB_Negocios_Atual` vai crescer. Sintomas:

- CSV > 1MB → fetch lento (>2s).
- Build estoura timeout do Vercel (60s na free tier).

Mitigação:
1. Adicionar paginação na planilha (uma aba por trimestre).
2. Migrar para Google Sheets API com `range` específico em vez de export CSV
   inteiro.
3. Em último caso: replicar para Postgres (Supabase/Neon) e abandonar Sheets
   como fonte direta.
