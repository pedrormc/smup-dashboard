# Deployment

Este projeto está deployado em Vercel — provedor recomendado para Next.js.
Funciona em qualquer host Node-compatível (Render, Fly.io, AWS Lambda + SST, etc),
mas as features de ISR/`revalidateTag` são otimizadas para Vercel.

## Setup inicial (1ª vez)

### 1. Criar projeto no Vercel

```bash
# instale o CLI uma vez
npm i -g vercel

# dentro da pasta do repo:
vercel link
# selecione team/account → criar novo projeto → smup-dashboard
```

### 2. Variáveis de ambiente

Configurar em **Vercel → Project Settings → Environment Variables**:

| Variável | Production | Preview | Development | Obrigatória |
|---|---|---|---|---|
| `SMUP_SHEET_ID` | `1CZ4tfnyTcR9iFJujZhHa2aNHFajZc8zHdB21DEXgwfk` | mesmo | mesmo | sim |
| `SMUP_GID_NEGOCIOS` | `0` | mesmo | mesmo | sim |
| `SMUP_GID_HISTORICO` | `1711054039` | mesmo | mesmo | sim |
| `SMUP_GID_TAXAS` | `41696639` | mesmo | mesmo | sim |
| `SMUP_REVALIDATE_SECONDS` | `300` | mesmo | mesmo | não |
| `REVALIDATE_TOKEN` | `<segredo>` | mesmo | mesmo | sim para o webhook |

Gerar o token com: `openssl rand -hex 32` ou no PowerShell:
```powershell
[guid]::NewGuid().ToString("N") + [guid]::NewGuid().ToString("N")
```

### 3. Deploy

```bash
vercel deploy --prod
```

ou conectar ao GitHub: cada push na branch `main` deploya em prod, qualquer outra
branch gera preview deploy.

## CI/CD

Recomendado:

1. Conectar o repo no Vercel UI (Settings → Git).
2. Branch `main` → Production.
3. Pull requests → Preview com URL único.
4. Habilitar "Comments on PRs" para o Vercel comentar o link de preview.

## Domínio custom (opcional)

Vercel → Project → Domains → Add. Configurar DNS no registrar:

```
smup-dashboard.singular.com.vc → CNAME cname.vercel-dns.com
```

ou A record `76.76.21.21`.

## Configurar webhook do Sheets (opcional)

Se quiser invalidar cache toda vez que a planilha for editada (em vez de esperar
5min):

1. Abra a planilha → **Extensions → Apps Script**.
2. Cole o código:

```js
function onEdit() {
  const url = 'https://smup-dashboard.vercel.app/api/revalidate';
  const token = 'COLE_O_REVALIDATE_TOKEN_AQUI';
  UrlFetchApp.fetch(url, {
    method: 'post',
    headers: { 'x-revalidate-token': token },
    muteHttpExceptions: true,
  });
}
```

3. **Triggers** → Add Trigger → Function `onEdit`, Event source `From spreadsheet`,
   Event type `On edit`. Salvar.

> ⚠️ O token fica visível para qualquer editor da planilha. Se a planilha tiver
> editores além do time confiável, **não** habilite essa integração — use só a
> revalidação automática de 5min.

## Rollback

```bash
vercel rollback
```

ou Vercel UI → Deployments → ⋮ no deployment anterior → "Promote to Production".

## Custos esperados

- **Vercel Hobby (free)**: cabe folgado. Bandwidth ~10GB/mês para um dashboard
  comercial é improvável de exceder.
- **Vercel Pro ($20/mês)**: necessário se quiser logs > 1h, password protection
  ou múltiplos times no projeto.

Sem custo extra de Google — export CSV é gratuito sem rate limit relevante.
