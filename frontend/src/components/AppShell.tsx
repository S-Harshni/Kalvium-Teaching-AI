import { useEffect, useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { BookOpen, FileCheck2, LayoutDashboard, Library, Menu, Plus, Settings, Sparkles, X } from "lucide-react";
import { api, type Status } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/create", label: "Create Lesson", icon: Sparkles },
  { to: "/app/lessons", label: "My Lessons", icon: BookOpen },
  { to: "/app/resources", label: "Learning Resources", icon: Library },
  { to: "/app/reports", label: "Quality Reports", icon: FileCheck2 },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="h-8 w-8">
        <rect width="32" height="32" rx="9" fill={dark ? "#ffffff" : "#1e1a4a"} />
        <path d="M10 8v16h12" stroke={dark ? "#4637c8" : "#a3a8fd"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="21" cy="11" r="3" fill="#8080f8" />
      </svg>
      <span className={cn("font-display text-[17px] font-semibold tracking-tight", dark ? "text-white" : "text-ink-900")}>
        Learnora<span className="text-brand-500"> AI</span>
      </span>
    </Link>
  );
}

export function useStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  useEffect(() => {
    // Retry until the backend answers (it may still be starting, or restarting).
    let timer: number;
    let alive = true;
    const load = () => api.status().then((s) => alive && setStatus(s)).catch(() => { if (alive) timer = window.setTimeout(load, 4000); });
    load();
    return () => { alive = false; window.clearTimeout(timer); };
  }, []);
  return status;
}

export function ProviderPill({ status }: { status: Status | null }) {
  if (!status) return <div className="text-[11px] text-ink-400">Connecting to server…</div>;
  const live = !status.demo_only;
  return (
    <div className="rounded-xl border border-ink-200/70 bg-ink-50 px-3 py-2.5 text-[11px] leading-relaxed text-ink-500">
      <div className="flex items-center gap-1.5 font-medium text-ink-700">
        <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-emerald-500" : "bg-amber-500")} />
        {live ? "Live AI & research" : "Demo mode"}
      </div>
      <div className="mt-0.5 truncate">
        {live ? `${status.llm_provider} · ${status.llm_model}` : "No AI provider configured"}
      </div>
    </div>
  );
}

export function AppShell() {
  const status = useStatus();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
          className={({ isActive }) => cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition",
            isActive ? "bg-white text-ink-900 shadow-sm ring-1 ring-ink-200/70" : "text-ink-500 hover:bg-white/60 hover:text-ink-800")}>
          <Icon className="h-4 w-4" strokeWidth={1.8} />{label}
        </NavLink>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-ink-200/70 bg-ink-50/80 px-3 py-5 backdrop-blur lg:flex">
        <div className="px-2"><Logo /></div>
        <Link to="/app/create" className="mx-1 mt-6 mb-4 flex items-center justify-center gap-2 rounded-xl bg-ink-900 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-ink-800">
          <Plus className="h-4 w-4" /> New lesson
        </Link>
        {nav}
        <ProviderPill status={status} />
      </aside>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200/70 bg-white/80 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button onClick={() => setOpen(!open)} className="rounded-lg p-2 hover:bg-ink-100" aria-label="Menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {open && <div className="border-b border-ink-200 bg-ink-50 p-3 lg:hidden">{nav}</div>}
      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
