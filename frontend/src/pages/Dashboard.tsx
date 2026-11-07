import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, BookOpen, CheckCircle2, Clock, FileEdit, Loader2, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { api, type LessonSummary } from "@/lib/api";
import { Alert, Badge, Button, Card, EmptyState, Spinner } from "@/components/ui";
import { useStatus } from "@/components/AppShell";
import { cn, timeAgo, VERDICT_TONE } from "@/lib/utils";

export function LessonRow({ l }: { l: LessonSummary }) {
  const stale = (r: LessonSummary["qc_factual"]) => r && r.lesson_revision < l.revision;
  return (
    <Link to={`/app/lessons/${l.id}`} className="group flex items-center gap-4 px-4 py-3.5 transition hover:bg-ink-50/70">
      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl",
        l.status === "finalized" ? "bg-emerald-50 text-emerald-600" : l.status === "failed" ? "bg-rose-50 text-rose-600" : "bg-brand-50 text-brand-600")}>
        {l.running ? <Loader2 className="h-4 w-4 animate-spin" /> : l.status === "finalized" ? <CheckCircle2 className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-ink-900">{l.title}</span>
          {l.demo && <Badge tone="warn">demo</Badge>}
        </div>
        <div className="mt-0.5 truncate text-xs text-ink-500">{l.objective}</div>
      </div>
      <div className="hidden items-center gap-2 md:flex">
        {l.qc_factual && <Badge tone={VERDICT_TONE[l.qc_factual.verdict]}>QC1 {l.qc_factual.score}{stale(l.qc_factual) ? "*" : ""}</Badge>}
        {l.qc_instructional && <Badge tone={VERDICT_TONE[l.qc_instructional.verdict]}>QC2 {l.qc_instructional.score}{stale(l.qc_instructional) ? "*" : ""}</Badge>}
        {l.total_minutes != null && <span className="inline-flex w-14 items-center gap-1 text-xs text-ink-400"><Clock className="h-3 w-3" />{l.total_minutes}m</span>}
      </div>
      <span className="hidden w-20 text-right text-xs text-ink-400 sm:block">{timeAgo(l.updated_at)}</span>
      <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-ink-500" />
    </Link>
  );
}

export default function Dashboard() {
  const status = useStatus();
  const [lessons, setLessons] = useState<LessonSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.lessons().then(setLessons).catch((e) => setError(e.message)); }, []);

  const stats = useMemo(() => {
    const l = lessons ?? [];
    const scored = (k: "qc_factual" | "qc_instructional") => l.filter((x) => x[k]).map((x) => x[k]!.score);
    const avg = (a: number[]) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null);
    return {
      total: l.length,
      drafts: l.filter((x) => x.status === "review" || x.status === "generating").length,
      finalized: l.filter((x) => x.status === "finalized").length,
      avgF: avg(scored("qc_factual")), avgI: avg(scored("qc_instructional")),
    };
  }, [lessons]);

  // Real activity only: lessons created per day over the last 14 days.
  const activity = useMemo(() => {
    const days = [...Array(14)].map((_, i) => {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (13 - i));
      return { key: d.toDateString(), label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), lessons: 0 };
    });
    (lessons ?? []).forEach((l) => { const k = new Date(l.created_at).toDateString(); const d = days.find((x) => x.key === k); if (d) d.lessons++; });
    return days;
  }, [lessons]);

  if (error) return <Alert tone="bad" title="Could not load your lessons">{error}</Alert>;
  if (!lessons) return <div className="grid h-64 place-items-center"><Spinner className="h-6 w-6" /></div>;

  const drafts = lessons.filter((l) => l.status !== "finalized");
  const finals = lessons.filter((l) => l.status === "finalized");

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-ink-950 px-7 py-8 text-white">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-300">Welcome back</div>
            <h1 className="mt-2 text-[26px] font-semibold">What will you teach today?</h1>
            <p className="mt-1.5 max-w-lg text-sm text-ink-300">Turn a title and an objective into a researched, quality-checked 45-minute lesson.</p>
          </div>
          <Link to="/app/create"><Button size="lg" className="bg-white text-ink-900 hover:bg-ink-100" icon={<Plus className="h-4 w-4" />}>Create new lesson</Button></Link>
        </div>
      </div>

      {status?.demo_only && <Alert tone="warn" title="Demo mode">No AI provider is configured. Lessons replay recorded sample output - see Settings to enable live generation.</Alert>}

      {lessons.length === 0 ? (
        <EmptyState icon={<Sparkles className="h-5 w-5" />} title="No lessons yet"
          description="Your lessons, their research and quality reports will appear here. Start with one of the sample topics or your own."
          action={<Link to="/app/create"><Button icon={<Plus className="h-4 w-4" />}>Create your first lesson</Button></Link>} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Lessons", value: stats.total, icon: BookOpen },
              { label: "In review", value: stats.drafts, icon: FileEdit },
              { label: "Finalized", value: stats.finalized, icon: CheckCircle2 },
              { label: "Avg. QC score (factual / instructional)", value: stats.avgF != null ? `${stats.avgF} / ${stats.avgI ?? "–"}` : "–", icon: ShieldCheck },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label} className="p-4">
                <div className="flex items-center justify-between text-xs text-ink-500">{label}<Icon className="h-4 w-4 text-ink-300" /></div>
                <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0 space-y-6">
              <div>
                <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-base font-semibold">Recent lessons</h2><Link to="/app/lessons" className="text-xs font-medium text-brand-600 hover:underline">View all</Link></div>
                <Card className="divide-y divide-ink-100 overflow-hidden">{drafts.slice(0, 6).map((l) => <LessonRow key={l.id} l={l} />)}
                  {drafts.length === 0 && <div className="px-4 py-6 text-center text-sm text-ink-400">No lessons in progress.</div>}</Card>
              </div>
              <div>
                <h2 className="mb-3 font-display text-base font-semibold">Completed lessons</h2>
                <Card className="divide-y divide-ink-100 overflow-hidden">{finals.slice(0, 6).map((l) => <LessonRow key={l.id} l={l} />)}
                  {finals.length === 0 && <div className="px-4 py-6 text-center text-sm text-ink-400">Mark a lesson as final after review and it will appear here.</div>}</Card>
              </div>
            </div>
            <Card className="h-fit p-5">
              <h2 className="font-display text-base font-semibold">Lesson generation activity</h2>
              <p className="text-xs text-ink-400">Lessons created per day, last 14 days</p>
              <div className="mt-4 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activity} margin={{ left: -28, right: 4, top: 4 }}>
                    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6461f0" stopOpacity={0.3} /><stop offset="100%" stopColor="#6461f0" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#8b91ad" }} axisLine={false} tickLine={false} interval={3} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#8b91ad" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #d9dcea", fontSize: 12 }} />
                    <Area type="monotone" dataKey="lessons" stroke="#5345e3" strokeWidth={2} fill="url(#g)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 border-t border-ink-100 pt-4">
                <div className="eyebrow mb-2">Review progress</div>
                <div className="flex h-2 overflow-hidden rounded-full bg-ink-100">
                  <div className="bg-emerald-500" style={{ width: `${(stats.finalized / stats.total) * 100}%` }} />
                  <div className="bg-brand-400" style={{ width: `${(stats.drafts / stats.total) * 100}%` }} />
                </div>
                <div className="mt-2 flex gap-4 text-xs text-ink-500">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />{stats.finalized} finalized</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-400" />{stats.drafts} in review</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
