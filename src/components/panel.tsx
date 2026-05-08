import type { ReactNode } from "react";
import { COLORS } from "@/lib/constants";

interface PanelProps {
  title: string;
  children: ReactNode;
  subtitle?: string;
  className?: string;
}

export function Panel({ title, children, subtitle, className = "" }: PanelProps) {
  return (
    <section
      className={`rounded-xl bg-white border shadow-sm p-5 ${className}`}
      style={{ borderColor: COLORS.border }}
    >
      <header className="mb-4">
        <h3 className="text-base font-semibold" style={{ color: "#111827" }}>
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: COLORS.muted }}>
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </section>
  );
}
