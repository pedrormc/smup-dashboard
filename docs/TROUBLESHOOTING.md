# Troubleshooting

Erros comuns e como diagnosticar.

## "Falha ao buscar planilha (status=403)"

**Causa**: a planilha não está pública.

**Como confirmar**:
```bash
curl -I "https://docs.google.com/spreadsheets/d/$SMUP_SHEET_ID/export?format=csv&gid=0"
```
Se retornar 302 → redireciona para login → planilha privada.

**Fix**:
1. Abrir a planilha no navegador.
2. **Compartilhar → Geral → Qualquer pessoa com o link → Leitor**.
3. Salvar.

## "Falha ao buscar planilha (status=400)"

**Causa**: GID errado ou aba apagada/renomeada.

**Como confirmar**: rodar `mcp listSheets` ou abrir a planilha e clicar em cada
aba — o gid aparece na URL.

**Fix**: atualizar a env correspondente no Vercel:
- `SMUP_GID_NEGOCIOS`
- `SMUP_GID_HISTORICO`
- `SMUP_GID_TAXAS`

## Dashboard mostra valores antigos depois de editar a planilha

**Causa esperada**: ISR de 5min — comportamento normal.

**Soluções**:
- Esperar 5 minutos e dar reload.
- Disparar webhook manualmente:
  ```bash
  curl -X POST -H "x-revalidate-token: $REVALIDATE_TOKEN" \
    https://smup-dashboard.vercel.app/api/revalidate
  ```
- Configurar Apps Script `onEdit` (ver [DEPLOYMENT.md](DEPLOYMENT.md)).

## Build falha em "Module not found: papaparse"

**Causa**: `npm install` não rodou ou node_modules corrompido.

**Fix**:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Build no Vercel "Type error: Property X does not exist on type Y"

**Causa**: planilha mudou colunas e tipos não foram atualizados.

**Fix**: ajustar em **3 lugares** (ver [DATA-MODEL.md](DATA-MODEL.md) seção
"Mudando o schema"). Rodar `npm run typecheck` localmente para reproduzir.

## Charts aparecem em branco mas há dados

**Causa**: dataset filtrado vazio. Os filtros globais podem estar excluindo tudo.

**Como confirmar**:
- Abrir DevTools → Network → procurar a página → ver HTML da resposta.
- Verificar se há `Sem dados no período/filtro selecionado.`
- Rodar `GET /api/data` e checar que `counts.negocios > 0`.

**Fix**: clicar em "Limpar" no FilterBar. Se persistir, conferir se as datas no
filtro são válidas e estão dentro do range dos dados.

## "Lead time médio: —" no card

**Causa**: nenhum negócio fechado tem ambas as datas (`data_criacao` e
`data_ultima_fase`) preenchidas.

**Fix**: garantir que negócios fechados na planilha tenham as duas colunas
populadas. Se forem casos antigos sem `data_ultima_fase`, normal — só ignora.

## V11 (Taxa entre etapas) vazia

**Causa**: aba `TB_Taxas_Conversao` apagada ou suas fórmulas COUNTIFS quebradas
(ex: alguém renomeou "Confeccionar Proposta" para "Proposta Confeccionada" e a
fórmula ainda procura o nome antigo).

**Fix**:
1. Abrir a aba na planilha.
2. Conferir cada fórmula. Locale BR usa `;` como separador.
3. Reaplicar o template:
   ```
   =COUNTIFS(TB_Historico_Movimentacao!C:C; "Lead"; TB_Historico_Movimentacao!D:D; "Oportunidade") /
    COUNTIF(TB_Historico_Movimentacao!C:C; "Lead")
   ```

## Página retorna 500 em produção

**Como diagnosticar**: Vercel UI → Deployments → último deployment → Functions
tab → ver logs.

99% dos casos é um dos dois acima (planilha privada / GID errado / schema mudou).

## Recharts SSR warning sobre `width: 0`

**Causa**: chart renderiza antes do container ter dimensão.

**Fix**: já tratado — todos os charts usam `ResponsiveContainer` dentro de um
`div` com altura explícita. Se aparecer em algum chart novo, embrulhar no
mesmo padrão.
