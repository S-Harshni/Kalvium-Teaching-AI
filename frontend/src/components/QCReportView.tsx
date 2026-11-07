import { useState } from "react";
import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, ChevronDown, CircleSlash, Info, RefreshCw, RotateCcw, ShieldCheck, GraduationCap, AlertTriangle } from "lucide-react";
import type { FactualReport, InstructionalReport, Lesson, QCIssue, Severity } from "@/lib/api";
import { Alert, Badge, Button, Card, EmptyState, ScoreRing, DemoBadge } from "./ui";
import { Markdown } from "./Markdown";
import { cn, timeAgo, VERDICT_LABEL, VERDICT_TONE } from "@/lib/utils";

const SEV_TONE: Record<Severity, "bad" | "warn" | "info" | "neutral"> = { critical: "bad", high: "bad", medium: "warn", low: "neutral" };

function IssueCard({ issue, onAction, busy }: { issue: QCIssue; onAction: (a: "apply" | "reject" | "reopen") => void; busy: boolean }) {
  const [open, setOpen] = useState(issue.status === "open");
  const closed = issue.status === "applied" || issue.status === "rejected";
  return (
    <div className={cn("card overflow-hidden", closed && "opacity-75")}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-start gap-3 px-4 py-3.5 text-left">
        <Badge tone={SEV_TONE[issue.severity]} className="mt-0.5 uppercase">{issue.severity}</Badge>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-ink-900">{issue.problem}</div>
          <div className="mt-0.5 text-xs text-ink-400">{issue.id} · {issue.category.replace(/_/g, " ")} · {issue.location || issue.section_id || "Lesson"}</div>
        </div>
        {issue.status !== "open" && (
          <Badge tone={issue.status === "applied" ? "good" : issue.status === "conflict" ? "warn" : "neutral"}>{issue.status}</Badge>
        )}
        <ChevronDown className={cn("mt-0.5 h-4 w-4 shrink-0 text-ink-400 transition", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-ink-100 px-4 pb-4 pt-3 text-[13px]">
          {issue.why && <p className="text-ink-600"><span className="font-medium text-ink-800">Why it matters: </span>{issue.why}</p>}
          {issue.evidence && (
            <p className="text-ink-600"><span className="font-medium text-ink-800">Evidence: </span>{issue.evidence}
              {issue.source_ids.length > 0 && <span className="ml-1 text-brand-700">[{issue.source_ids.join(", ")}]</span>}</p>
          )}
          {(issue.original_text || issue.suggested_text) && (
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                <div className="eyebrow mb-1.5 text-rose-500">Original</div>
                {issue.original_text ? <div className="whitespace-pre-wrap text-ink-700 line-through decoration-rose-300">{issue.original_text}</div>
                  : <div className="italic text-ink-400">Addition - appended to the end of the section</div>}
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                <div className="eyebrow mb-1.5 text-emerald-600">Suggested</div>
                <Markdown className="prose-sm">{issue.suggested_text || "_No replacement text provided_"}</Markdown>
              </div>
            </div>
          )}
          {issue.status_note && <p className="text-xs text-ink-500"><Info className="mr-1 inline h-3 w-3" />{issue.status_note}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            {issue.status === "open" || issue.status === "conflict" ? (
              <>
                {issue.suggested_text && (
                  <Button size="sm" icon={<Check className="h-3.5 w-3.5" />} loading={busy} onClick={() => onAction("apply")}>Accept & apply</Button>
                )}
                <Button size="sm" variant="secondary" icon={<CircleSlash className="h-3.5 w-3.5" />} disabled={busy} onClick={() => onAction("reject")}>Reject</Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />} disabled={busy || issue.status === "applied"} onClick={() => onAction("reopen")}>
                {issue.status === "applied" ? "Applied (undo via version history)" : "Reopen"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IssueList({ issues, onAction, busyId }: { issues: QCIssue[]; onAction: (id: string, a: "apply" | "reject" | "reopen") => void; busyId: string | null }) {
  const order: Severity[] = ["critical", "high", "medium", "low"];
  const sorted = [...issues].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
  const open = issues.filter((i) => i.status === "open" || i.status === "conflict").length;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Issues & recommendations</h3>
        <span className="text-xs text-ink-500">{open} open · {issues.length - open} resolved</span>
      </div>
      {issues.length === 0 ? (
        <Alert tone="good" title="No issues identified">This layer found nothing that needs changing.</Alert>
      ) : (
        <div className="space-y-2.5">{sorted.map((i) => <IssueCard key={i.id} issue={i} busy={busyId === i.id} onAction={(a) => onAction(i.id, a)} />)}</div>
      )}
    </div>
  );
}

function ReportHeader({ icon, title, score, verdict, summary, meta, stale, onRerun, rerunning, demo }: {
  icon: React.ReactNode; title: string; score: number; verdict: keyof typeof VERDICT_LABEL; summary: string; meta: string;
  stale: boolean; onRerun: () => void; rerunning: boolean; demo: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start gap-5">
        <ScoreRing score={score} label="/ 100" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-brand-600">{icon}</span>
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            <Badge tone={VERDICT_TONE[verdict]}>{VERDICT_LABEL[verdict]}</Badge>
            {demo && <DemoBadge />}
          </div>
          <p className="mt-1.5 text-sm text-ink-600">{summary}</p>
          <p className="mt-2 text-[11.5px] text-ink-400">{meta}</p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} loading={rerunning} onClick={onRerun}>Re-run this layer</Button>
      </div>
      {stale && (
        <div className="mt-4"><Alert tone="warn" title="The lesson changed after this report was generated">Re-run this layer to audit the current version. Your edits are never modified by QC.</Alert></div>
      )}
    </Card>
  );
}

function Methodology({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-ink-200/70 bg-white px-4 py-3">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-left text-[13px] font-medium text-ink-700">
        Scoring methodology <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>
      {open && <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">{text}</p>}
    </div>
  );
}

type Props = { lesson: Lesson; onAction: (layer: "factual" | "instructional", id: string, a: "apply" | "reject" | "reopen") => Promise<void>; onRerun: (key: string) => void; rerunning: string | null; };

export function FactualReportView({ lesson, onAction, onRerun, rerunning }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "supported" | "partially_supported" | "unsupported" | "contradicted">("all");
  const r = lesson.qc_factual as FactualReport | null | undefined;
  const step = lesson.pipeline.steps.find((s) => s.key === "qc_factual");
  if (!r) {
    return <EmptyState icon={<ShieldCheck className="h-5 w-5" />} title={step?.status === "running" ? "Factual QC is running…" : "No factual report yet"}
      description={step?.error || "QC Layer 1 checks every factual claim against evidence retrieved from verified sources."}
      action={step?.status !== "running" && lesson.content ? <Button onClick={() => onRerun("qc_factual")} loading={rerunning === "qc_factual"}>Run factual QC</Button> : undefined} />;
  }
  const claims = r.claims.filter((c) => filter === "all" || c.verdict === filter);
  const counts = (v: string) => r.claims.filter((c) => c.verdict === v).length;
  const act = async (id: string, a: "apply" | "reject" | "reopen") => { setBusy(id); try { await onAction("factual", id, a); } finally { setBusy(null); } };
  return (
    <div className="space-y-5">
      {step?.status === "failed" && <Alert tone="bad" title="The last factual QC run failed — showing the previous report">{step.error}</Alert>}
      <ReportHeader icon={<ShieldCheck className="h-4 w-4" />} title="Research & Factual Accuracy" score={r.score} verdict={r.verdict}
        summary={r.summary} demo={r.demo} meta={`QC Layer 1 · lesson revision ${r.lesson_revision} · ${timeAgo(r.generated_at)} · ${r.provider}`}
        stale={lesson.revision > r.lesson_revision} onRerun={() => onRerun("qc_factual")} rerunning={rerunning === "qc_factual" || step?.status === "running"} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {r.score_breakdown.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-xs text-ink-500">{s.label}{s.weight ? ` · ${s.weight * 100}%` : ""}</div>
            <div className={cn("mt-1 font-display text-2xl font-semibold", s.value < 0 ? "text-rose-600" : "text-ink-900")}>{s.value}</div>
            <div className="mt-1 text-[11.5px] text-ink-400">{s.detail}</div>
          </Card>
        ))}
      </div>
      <Methodology text={r.methodology} />
      <IssueList issues={r.issues} onAction={act} busyId={busy} />
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-semibold">Claim verification ({r.claims.length})</h3>
          <div className="flex flex-wrap gap-1">
            {(["all", "supported", "partially_supported", "unsupported", "contradicted"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={cn("rounded-lg px-2.5 py-1 text-xs font-medium", filter === f ? "bg-ink-900 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50")}>
                {f.replace("_", " ")}{f !== "all" && ` (${counts(f)})`}
              </button>
            ))}
          </div>
        </div>
        <Card className="divide-y divide-ink-100">
          {claims.map((c) => (
            <div key={c.id} className="flex gap-3 px-4 py-3 text-[13px]">
              <Badge tone={c.verdict === "supported" ? "good" : c.verdict === "partially_supported" ? "warn" : "bad"} className="mt-0.5 h-fit">{c.verdict.replace("_", " ")}</Badge>
              <div className="min-w-0 flex-1">
                <div className="text-ink-800">{c.claim}</div>
                {c.evidence_quote && <div className="mt-1 border-l-2 border-brand-200 pl-2 text-xs italic text-ink-500">“{c.evidence_quote}” {c.source_ids.length > 0 && <span className="not-italic text-brand-700">[{c.source_ids.join(", ")}]</span>}</div>}
                {c.note && <div className="mt-1 text-xs text-ink-400">{c.note}</div>}
              </div>
            </div>
          ))}
          {claims.length === 0 && <div className="px-4 py-6 text-center text-sm text-ink-400">No claims in this category.</div>}
        </Card>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-display text-base font-semibold">Source quality assessment</h3>
          <Card className="divide-y divide-ink-100">
            {r.source_assessment.map((s) => (
              <div key={s.source_id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                <span className="w-8 shrink-0 text-xs font-semibold text-ink-500">{s.source_id}</span>
                <span className="min-w-0 flex-1 truncate text-ink-800">{s.title}</span>
                <Badge tone={s.reliability === "high" ? "good" : s.reliability === "medium" ? "warn" : "bad"}>{s.reliability}</Badge>
                {s.cited_in_lesson ? <Badge tone="brand">cited</Badge> : <Badge>not cited</Badge>}
              </div>
            ))}
          </Card>
        </div>
        <div>
          <h3 className="mb-3 font-display text-base font-semibold">Research gaps</h3>
          <Card className="p-4">
            {r.research_gaps.length ? <ul className="list-disc space-y-1.5 pl-5 text-[13px] text-ink-700">{r.research_gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
              : <p className="text-sm text-ink-500">No research gaps identified.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}

export function InstructionalReportView({ lesson, onAction, onRerun, rerunning }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const r = lesson.qc_instructional as InstructionalReport | null | undefined;
  const step = lesson.pipeline.steps.find((s) => s.key === "qc_instructional");
  if (!r) {
    return <EmptyState icon={<GraduationCap className="h-5 w-5" />} title={step?.status === "running" ? "Instructional QC is running…" : "No instructional report yet"}
      description={step?.error || "QC Layer 2 independently checks objective alignment, clarity, examples, assessment and timing."}
      action={step?.status !== "running" && lesson.content ? <Button onClick={() => onRerun("qc_instructional")} loading={rerunning === "qc_instructional"}>Run instructional QC</Button> : undefined} />;
  }
  const act = async (id: string, a: "apply" | "reject" | "reopen") => { setBusy(id); try { await onAction("instructional", id, a); } finally { setBusy(null); } };
  const timing = r.timing.per_section.map((s) => ({ name: s.label.length > 18 ? s.label.slice(0, 17) + "…" : s.label, minutes: s.value }));
  return (
    <div className="space-y-5">
      {step?.status === "failed" && <Alert tone="bad" title="The last instructional QC run failed — showing the previous report">{step.error}</Alert>}
      <ReportHeader icon={<GraduationCap className="h-4 w-4" />} title="Instructional Quality" score={r.score} verdict={r.verdict}
        summary={r.summary} demo={r.demo} meta={`QC Layer 2 · lesson revision ${r.lesson_revision} · ${timeAgo(r.generated_at)} · ${r.provider}`}
        stale={lesson.revision > r.lesson_revision} onRerun={() => onRerun("qc_instructional")} rerunning={rerunning === "qc_instructional" || step?.status === "running"} />
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <h3 className="mb-3 font-display text-base font-semibold">Rubric</h3>
          <div className="space-y-2.5">
            {r.rubric.map((x) => (
              <div key={x.criterion} className="group">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-ink-700">{x.criterion}</span>
                  <span className="font-medium tabular-nums text-ink-900">{x.score}/10</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                  <div className={cn("h-full rounded-full", x.score >= 8 ? "bg-emerald-500" : x.score >= 6 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${x.score * 10}%` }} />
                </div>
                <p className="mt-1 text-[11.5px] text-ink-400">{x.note}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold">Timing</h3>
            <Badge tone={r.timing.compliant ? "good" : "bad"}>{r.timing.total_minutes} / {r.timing.limit_minutes} min</Badge>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timing} layout="vertical" margin={{ left: 0, right: 12, top: 8 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={118} tick={{ fontSize: 11, fill: "#646a88" }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f6f7fb" }} contentStyle={{ borderRadius: 12, border: "1px solid #d9dcea", fontSize: 12 }} formatter={(v) => [`${v} min`, "Time"]} />
                <ReferenceLine x={0} stroke="#d9dcea" />
                <Bar dataKey="minutes" radius={[0, 6, 6, 0]} barSize={14}>
                  {timing.map((_, i) => <Cell key={i} fill={i % 2 ? "#a3a8fd" : "#6461f0"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11.5px] text-ink-400">{r.timing.note}</p>
        </Card>
      </div>
      <div>
        <h3 className="mb-3 font-display text-base font-semibold">Objective coverage</h3>
        <Card className="divide-y divide-ink-100">
          {r.objective_coverage.map((c, i) => (
            <div key={i} className="flex gap-3 px-4 py-3 text-[13px]">
              <Badge tone={c.coverage === "full" ? "good" : c.coverage === "partial" ? "warn" : "bad"} className="mt-0.5 h-fit">{c.coverage}</Badge>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-ink-800">{c.objective_part}</div>
                <div className="mt-0.5 text-xs text-ink-500">{c.where}{c.note && ` — ${c.note}`}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {[["Clarity", r.clarity], ["Examples", r.example_quality], ["Practical activity", r.activity_quality], ["Assessment", r.assessment_quality]].map(([k, v]) => (
          <Card key={k} className="p-4"><div className="eyebrow mb-1.5">{k}</div><p className="text-[13px] text-ink-700">{v || "—"}</p></Card>
        ))}
      </div>
      {(r.missing_concepts.length > 0 || r.restructuring.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          <Card className="p-4"><div className="eyebrow mb-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Missing concepts</div>
            {r.missing_concepts.length ? <ul className="list-disc space-y-1 pl-5 text-[13px] text-ink-700">{r.missing_concepts.map((m, i) => <li key={i}>{m}</li>)}</ul> : <p className="text-sm text-ink-500">None.</p>}</Card>
          <Card className="p-4"><div className="eyebrow mb-2">Suggested restructuring</div>
            {r.restructuring.length ? <ul className="list-disc space-y-1 pl-5 text-[13px] text-ink-700">{r.restructuring.map((m, i) => <li key={i}>{m}</li>)}</ul> : <p className="text-sm text-ink-500">None.</p>}</Card>
        </div>
      )}
      <Methodology text={r.methodology} />
      <IssueList issues={r.issues} onAction={act} busyId={busy} />
    </div>
  );
}
