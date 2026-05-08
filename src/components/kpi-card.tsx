import { COLORS } from "@/lib/constants";

type Tone = "primary" | "neutral" | "danger";

const toneStyles: Record<Tone, { bg: string; fg: string; subtle: string }> = {
  primary: { bg: COLORS.primary, fg: COLORS.textOnPrimary, subtle: "rgba(255,255,255,0.85)" },
  neutral: { bg: "#FFFFFF", fg: "#111827", subtle: "#6B7280" },
  danger: { bg: COLORS.danger, fg: "#FFFFFF", subtle: "rgba(255,255,255,0.85)" },
};

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  tone?: Tone;
}

export function KpiCard({ label, value, subtitle, tone = "primary" }: KpiCardProps) {
  const style = toneStyles[tone];
  return (
    <div
      className="rounded-xl px-5 py-4 shadow-sm border"
      style={{ backgroundColor: style.bg, borderColor: tone === "neutral" ? COLORS.border : "transparent" }}
    >
      <div className="text-xs uppercase tracking-wide font-medium" style={{ color: style.subtle }}>
        {label}
      </div>
      <div className="mt-2 text-3xl font-semibold tabular-nums" style={{ color: style.fg }}>
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-xs" style={{ color: style.subtle }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
