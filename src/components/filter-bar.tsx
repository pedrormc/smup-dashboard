"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";
import { COLORS } from "@/lib/constants";

interface FilterBarProps {
  responsaveis: string[];
  segmentos: string[];
}

const FIELD_KEYS = ["responsavel", "segmento", "from", "to"] as const;

export function FilterBar({ responsaveis, segmentos }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = useMemo(
    () => ({
      responsavel: searchParams.get("responsavel") ?? "",
      segmento: searchParams.get("segmento") ?? "",
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
    }),
    [searchParams],
  );

  const update = useCallback(
    (patch: Partial<Record<(typeof FIELD_KEYS)[number], string>>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (!v) next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router, searchParams],
  );

  const clearAll = useCallback(() => {
    startTransition(() => router.push(pathname));
  }, [pathname, router]);

  const activeCount = FIELD_KEYS.filter((k) => current[k]).length;

  return (
    <div
      className="flex flex-wrap items-end gap-3 rounded-xl p-3 bg-white border shadow-sm"
      style={{ borderColor: COLORS.border }}
    >
      <Field label="Responsável">
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          style={{ borderColor: COLORS.border }}
          value={current.responsavel}
          onChange={(e) => update({ responsavel: e.target.value })}
        >
          <option value="">Todos</option>
          {responsaveis.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Segmento">
        <select
          className="border rounded-md px-3 py-2 text-sm bg-white"
          style={{ borderColor: COLORS.border }}
          value={current.segmento}
          onChange={(e) => update({ segmento: e.target.value })}
        >
          <option value="">Todos</option>
          {segmentos.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="De">
        <input
          type="date"
          className="border rounded-md px-3 py-2 text-sm bg-white"
          style={{ borderColor: COLORS.border }}
          value={current.from}
          onChange={(e) => update({ from: e.target.value })}
        />
      </Field>
      <Field label="Até">
        <input
          type="date"
          className="border rounded-md px-3 py-2 text-sm bg-white"
          style={{ borderColor: COLORS.border }}
          value={current.to}
          onChange={(e) => update({ to: e.target.value })}
        />
      </Field>
      {activeCount > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="text-sm px-3 py-2 rounded-md border hover:bg-gray-50 transition"
          style={{ borderColor: COLORS.border, color: COLORS.primary }}
        >
          Limpar ({activeCount})
        </button>
      )}
      {isPending && <span className="text-xs text-gray-500">atualizando…</span>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium" style={{ color: COLORS.muted }}>
        {label}
      </span>
      {children}
    </label>
  );
}
