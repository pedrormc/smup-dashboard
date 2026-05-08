"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COLORS, NAV_LINKS } from "@/lib/constants";

export function NavBar() {
  const pathname = usePathname();
  return (
    <header
      className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b"
      style={{ borderColor: COLORS.border }}
    >
      <div className="mx-auto max-w-[1400px] px-6 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="rounded-md w-9 h-9 flex items-center justify-center font-bold text-white text-sm"
            style={{ backgroundColor: COLORS.primary }}
            aria-hidden
          >
            S
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">SMUP · Dashboard Comercial</div>
            <div className="text-[11px]" style={{ color: COLORS.muted }}>
              Singular Group · dados em tempo real do Google Sheets
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                style={{
                  backgroundColor: active ? COLORS.primary : "transparent",
                  color: active ? "#FFF" : "#1F2937",
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
