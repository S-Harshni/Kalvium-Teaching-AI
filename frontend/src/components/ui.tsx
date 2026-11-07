// Small design-system primitives (shadcn/ui-style API, hand-written on Tailwind).
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-ink-900 text-white hover:bg-ink-800 shadow-sm",
  secondary: "bg-white text-ink-800 border border-ink-200 hover:border-ink-300 hover:bg-ink-50 shadow-sm",
  ghost: "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
  danger: "bg-white text-rose-600 border border-rose-200 hover:bg-rose-50",
  subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant; size?: "sm" | "md" | "lg"; loading?: boolean; icon?: ReactNode;
}>(({ className, variant = "primary", size = "md", loading, icon, children, disabled, ...props }, ref) => (
  <button
    ref={ref}
    disabled={disabled || loading}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all active:scale-[.98]",
      "disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100",
      size === "sm" && "h-8 px-3 text-[13px]", size === "md" && "h-10 px-4 text-sm", size === "lg" && "h-12 px-6 text-[15px]",
      VARIANTS[variant], className)}
    {...props}
  >
    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
    {children}
  </button>
));

type Tone = "neutral" | "brand" | "good" | "warn" | "bad" | "info";
const TONES: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-600 ring-ink-200",
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warn: "bg-amber-50 text-amber-700 ring-amber-200",
  bad: "bg-rose-50 text-rose-700 ring-rose-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
};
export function Badge({ tone = "neutral", className, children, icon }: { tone?: Tone; className?: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset", TONES[tone], className)}>
      {icon}{children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function SectionHeader({ title, description, action, eyebrow }: { title: ReactNode; description?: ReactNode; action?: ReactNode; eyebrow?: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">{icon}</div>
      <h3 className="font-display text-base font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin text-ink-400", className)} />;
}

export function ScoreRing({ score, size = 76, label }: { score: number; size?: number; label?: string }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= 85 ? "#059669" : score >= 70 ? "#d97706" : "#e11d48";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#eceef6" strokeWidth={7} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={7} fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * Math.max(0, Math.min(100, score))) / 100} style={{ transition: "stroke-dashoffset .8s ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        <div>
          <div className="font-display text-xl font-semibold text-ink-900">{score}</div>
          {label && <div className="mt-0.5 text-[10px] text-ink-400">{label}</div>}
        </div>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: {
  tabs: { value: T; label: string; icon?: ReactNode; badge?: ReactNode }[]; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-ink-100/70 p-1">
      {tabs.map((t) => (
        <button key={t.value} onClick={() => onChange(t.value)}
          className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
            value === t.value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800")}>
          {t.icon}{t.label}{t.badge}
        </button>
      ))}
    </div>
  );
}

export function Alert({ tone = "info", title, children, action }: { tone?: "info" | "warn" | "bad" | "good"; title?: string; children?: ReactNode; action?: ReactNode }) {
  const styles = {
    info: "border-sky-200 bg-sky-50/70 text-sky-900", warn: "border-amber-200 bg-amber-50/70 text-amber-900",
    bad: "border-rose-200 bg-rose-50/70 text-rose-900", good: "border-emerald-200 bg-emerald-50/70 text-emerald-900",
  }[tone];
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm", styles)}>
      <div className="min-w-0 flex-1">
        {title && <div className="font-medium">{title}</div>}
        {children && <div className={cn("opacity-90", title && "mt-0.5")}>{children}</div>}
      </div>
      {action}
    </div>
  );
}

export function DemoBadge() {
  return <Badge tone="warn">Demo · sample output</Badge>;
}
