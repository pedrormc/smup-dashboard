/**
 * POST /api/revalidate
 *
 * Invalida o cache ISR das 3 abas e força refetch no próximo render.
 * Use quando precisar puxar dados imediatamente sem esperar a janela de 5min.
 *
 * Autenticação: header `x-revalidate-token` ou query `?token=` deve bater
 * com o env var `REVALIDATE_TOKEN`. Sem token configurado, o endpoint
 * recusa todas as chamadas.
 *
 * Exemplo:
 *   curl -X POST -H "x-revalidate-token: $REVALIDATE_TOKEN" \
 *        https://smup-dashboard.vercel.app/api/revalidate
 *
 * Pode ser disparado por uma fórmula `IMPORTDATA` ou um Apps Script "onEdit"
 * na planilha — ver `docs/MAINTENANCE.md`.
 */

import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { CACHE_TAGS } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const expected = process.env.REVALIDATE_TOKEN;
  if (!expected || expected === "changeme") {
    return NextResponse.json(
      { error: "REVALIDATE_TOKEN não configurado no servidor." },
      { status: 503 },
    );
  }

  const provided =
    req.headers.get("x-revalidate-token") ?? req.nextUrl.searchParams.get("token");

  if (provided !== expected) {
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  for (const tag of Object.values(CACHE_TAGS)) {
    revalidateTag(tag);
  }

  return NextResponse.json({
    revalidated: true,
    tags: Object.values(CACHE_TAGS),
    at: new Date().toISOString(),
  });
}

export async function GET() {
  return NextResponse.json(
    { hint: "Use POST com header x-revalidate-token." },
    { status: 405 },
  );
}
