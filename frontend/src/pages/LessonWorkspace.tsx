import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Download, ExternalLink, Eye, GraduationCap, Library, ListChecks, Pencil, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { api, type Lesson } from "@/lib/api";
import { useLesson } from "@/lib/useLesson";
import { Alert, Badge, Button, Card, DemoBadge, EmptyState, Spinner, Tabs } from "@/components/ui";
import { PipelineProgress } from "@/components/PipelineProgress";
import { SourceCard } from "@/components/SourceCard";
import { FactualReportView, InstructionalReportView } from "@/components/QCReportView";
import { LessonEditor } from "@/components/LessonEditor";
import { LessonPreview } from "@/components/LessonPreview";
import { ExportPanel } from "@/components/ExportPanel";
import { cn, timeAgo, VERDICT_TONE } from "@/lib/utils";

type Tab = "progress" | "research" | "editor" | "factual" | "instructional" | "preview" | "export";

function ResearchWorkspace({ lesson }: { lesson: Lesson }) {
  const r = lesson.research;
  const [filter, setFilter] = useState("all");
  if (!r || !r.sources?.length) {
    const step = lesson.pipeline.steps.find((s) => s.key === "analyze_research");
    return <EmptyState icon={<Library className="h-5 w-5" />} title={step?.status === "running" || lesson.running ? "Research in progress…" : "No research yet"}
      description={step?.error || "Sources appear here once they have been fetched and verified."} />;
  }
  const groups = [
    { key: "all", label: "All" },
    { key: "docs", label: "Standards & docs", match: ["standard", "documentation"] },
    { key: "web", label: "Websites", match: ["website", "encyclopedia", "academic"] },
    { key: "book", label: "Books", match: ["book"] },
    { key: "video", label: "Videos", match: ["video"] },
  ];
  const g = groups.find((x) => x.key === filter);
  const items = r.sources.filter((s) => !g?.match || g.match.includes(s.source_type));
  const verified = r.sources.filter((s) => s.status === "verified").length;
  return (
    <div className="space-y-5">
      {r.demo && <Alert tone="warn" title="Demo mode">These sources are recorded sample research from an earlier live run - no live search was performed now.</Alert>}
      <div className="grid gap-3 sm:grid-cols-4">
        {[["Sources", r.sources.length], ["Verified", verified], ["High reliability", r.sources.filter((s) => s.reliability === "high").length], ["Evidence passages", r.evidence_count]].map(([k, v]) => (
          <Card key={k as string} className="p-4"><div className="text-xs text-ink-500">{k}</div><div className="mt-1 font-display text-2xl font-semibold">{v}</div></Card>
        ))}
      </div>
      <Card className="p-4 text-[12.5px] text-ink-500">
        <span className="font-medium text-ink-700">How sources are verified: </span>
        web pages are downloaded and only pages with readable content count as <i>verified</i> evidence; book entries are library-catalog records (content not read, listed as further reading);
        videos are confirmed to exist via YouTube oEmbed. Reliability is rule-based by publisher, not judged by the AI.
        {r.queries?.length > 0 && <div className="mt-2"><span className="font-medium text-ink-700">Queries: </span>{r.queries.join(" · ")}</div>}
      </Card>
      {r.notes?.length > 0 && <Alert tone="info" title="Research notes">{r.notes.map((n, i) => <div key={i}>• {n}</div>)}</Alert>}
      <div className="flex flex-wrap gap-1">
        {groups.map((x) => (
          <button key={x.key} onClick={() => setFilter(x.key)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium", filter === x.key ? "bg-ink-900 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50")}>
            {x.label} ({x.match ? r.sources.filter((s) => x.match!.includes(s.source_type)).length : r.sources.length})
          </button>
        ))}
      </div>
      <div className={cn("grid gap-3", filter === "video" ? "sm:grid-cols-2 lg:grid-cols-3" : "")}>
        {items.map((s) => <SourceCard key={s.id} s={s} />)}
      </div>
    </div>
  );
}

export default function LessonWorkspace() {
  const { id } = useParams();
  const nav = useNavigate();
  const { lesson, setLesson, error, refresh } = useLesson(id);
  const [tab, setTab] = useState<Tab | null>(null);
  const [rerunning, setRerunning] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  if (error && !lesson) return <Alert tone="bad" title="Could not load lesson" action={<Button size="sm" variant="secondary" onClick={refresh}>Retry</Button>}>{error}</Alert>;
  if (!lesson) return <div className="grid h-64 place-items-center"><Spinner className="h-6 w-6" /></div>;

  const busy = lesson.running || lesson.pipeline.steps.some((s) => s.status === "running");
  const hasContent = !!lesson.content;
  const current: Tab = tab ?? (hasContent ? "editor" : "progress");
  const total = lesson.content?.sections.reduce((a, s) => a + s.minutes, 0) ?? 0;
  const failed = lesson.pipeline.steps.filter((s) => s.status === "failed");

  const runStep = async (key: string) => {
    setRerunning(key); setActionError(null);
    try { setLesson(await api.runStep(lesson.id, key)); await refresh(); } catch (e) { setActionError((e as Error).message); } finally { setRerunning(null); }
  };
  const retry = async () => {
    setRetrying(true); setActionError(null);
    try { setLesson(await api.retry(lesson.id)); await refresh(); } catch (e) { setActionError((e as Error).message); } finally { setRetrying(false); }
  };
  const issueAction = async (layer: "factual" | "instructional", issueId: string, action: "apply" | "reject" | "reopen") => {
    setActionError(null);
    try { const res = await api.issue(lesson.id, layer, issueId, action); setLesson(res.lesson); if (res.issue.status === "conflict") setActionError(res.issue.status_note); }
    catch (e) { setActionError((e as Error).message); }
  };
  const scoreBadge = (r?: { score: number; verdict: keyof typeof VERDICT_TONE } | null) =>
    r ? <Badge tone={VERDICT_TONE[r.verdict]} className="ml-1">{r.score}</Badge> : null;

  const tabs = [
    { value: "progress" as Tab, label: "Workflow", icon: <ListChecks className="h-3.5 w-3.5" />, badge: busy ? <Spinner className="ml-1 h-3 w-3" /> : failed.length ? <Badge tone="bad" className="ml-1">{failed.length}</Badge> : null },
    { value: "research" as Tab, label: "Research", icon: <Library className="h-3.5 w-3.5" />, badge: lesson.research?.sources?.length ? <Badge className="ml-1">{lesson.research.sources.length}</Badge> : null },
    ...(hasContent ? [
      { value: "editor" as Tab, label: "Edit lesson", icon: <Pencil className="h-3.5 w-3.5" /> },
      { value: "factual" as Tab, label: "QC 1 · Factual", icon: <ShieldCheck className="h-3.5 w-3.5" />, badge: scoreBadge(lesson.qc_factual) },
      { value: "instructional" as Tab, label: "QC 2 · Instructional", icon: <GraduationCap className="h-3.5 w-3.5" />, badge: scoreBadge(lesson.qc_instructional) },
      { value: "preview" as Tab, label: "Preview", icon: <Eye className="h-3.5 w-3.5" /> },
      { value: "export" as Tab, label: "Export", icon: <Download className="h-3.5 w-3.5" /> },
    ] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/app/lessons" className="inline-flex items-center gap-1 text-xs font-medium text-ink-400 hover:text-ink-700"><ArrowLeft className="h-3.5 w-3.5" />My lessons</Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-ink-900">{lesson.content?.title ?? lesson.title}</h1>
              {lesson.demo && <DemoBadge />}
              {lesson.status === "finalized" && <Badge tone="good" icon={<CheckCircle2 className="h-3 w-3" />}>Finalized</Badge>}
            </div>
            <p className="mt-1 max-w-3xl text-sm text-ink-500">{lesson.objective}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-400">
              {hasContent && <span className={cn("inline-flex items-center gap-1", total > 45 && "font-medium text-rose-600")}><Clock className="h-3.5 w-3.5" />{total} min</span>}
              <span>Revision {lesson.revision}</span><span>Updated {timeAgo(lesson.updated_at)}</span>
              {lesson.edited_by_instructor && <span className="inline-flex items-center gap-1"><Pencil className="h-3 w-3" />Instructor-edited</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasContent && <Link to={`/learn/${lesson.id}`} target="_blank"><Button variant="secondary" size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />}>Student view</Button></Link>}
            {hasContent && lesson.status !== "finalized" && (
              <Button size="sm" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={async () => setLesson(await api.patch(lesson.id, { status: "finalized" }))}>Mark as final</Button>
            )}
            {lesson.status === "finalized" && <Button size="sm" variant="secondary" onClick={async () => setLesson(await api.patch(lesson.id, { status: "review" }))}>Reopen for review</Button>}
            <Button size="sm" variant="ghost" disabled={busy} icon={<Trash2 className="h-3.5 w-3.5" />} onClick={async () => {
              if (confirm("Delete this lesson and all its versions? This cannot be undone.")) { await api.remove(lesson.id); nav("/app/lessons"); }
            }} />
          </div>
        </div>
      </div>

      {failed.length > 0 && !busy && (
        <Alert tone="bad" title={`${failed.length} step${failed.length > 1 ? "s" : ""} failed`}
          action={<Button size="sm" variant="secondary" loading={retrying} icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={retry}>Retry failed steps</Button>}>
          {failed.map((f) => <div key={f.key}>{f.label}: {f.error}</div>)}
          {hasContent && <div className="mt-1 text-xs">Your lesson and edits are saved and unaffected.</div>}
        </Alert>
      )}
      {actionError && <Alert tone="warn">{actionError}</Alert>}

      <Tabs tabs={tabs} value={current} onChange={setTab} />

      {current === "progress" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <Card className="p-6"><PipelineProgress steps={lesson.pipeline.steps} onRetry={retry} retrying={retrying} /></Card>
          <div className="space-y-4">
            {lesson.analysis && (
              <Card className="p-5">
                <div className="eyebrow mb-2">Objective analysis</div>
                <p className="text-[13px] text-ink-600">{lesson.analysis.topic_summary}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">{lesson.analysis.key_concepts.map((k) => <Badge key={k} tone="brand">{k}</Badge>)}</div>
                {lesson.analysis.objective_parts?.length > 0 && (
                  <><div className="eyebrow mb-1.5 mt-4">Objective parts</div>
                    <ul className="list-disc space-y-1 pl-4 text-[13px] text-ink-600">{lesson.analysis.objective_parts.map((p) => <li key={p}>{p}</li>)}</ul></>
                )}
              </Card>
            )}
            {hasContent && (
              <Card className="p-5">
                <div className="eyebrow mb-3">Manual controls</div>
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => runStep("qc_factual")}>Re-run QC 1 (factual)</Button>
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => runStep("qc_instructional")}>Re-run QC 2 (instructional)</Button>
                  <Button variant="ghost" size="sm" disabled={busy} onClick={() => { if (confirm("Regenerate the lesson? The current version is saved to history first.")) runStep("generate"); }}>Regenerate lesson</Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
      {current === "research" && <ResearchWorkspace lesson={lesson} />}
      {current === "editor" && hasContent && <LessonEditor lesson={lesson} onSaved={(rev, content) => setLesson((l) => l && { ...l, revision: rev, content, edited_by_instructor: true })} onReload={refresh} />}
      {current === "factual" && <FactualReportView lesson={lesson} onAction={issueAction} onRerun={runStep} rerunning={rerunning} />}
      {current === "instructional" && <InstructionalReportView lesson={lesson} onAction={issueAction} onRerun={runStep} rerunning={rerunning} />}
      {current === "preview" && hasContent && <div className="card p-6 sm:p-10"><LessonPreview content={lesson.content!} demo={lesson.demo} /></div>}
      {current === "export" && hasContent && <ExportPanel lesson={lesson} />}
      {!hasContent && current === "progress" && busy && (
        <p className="flex items-center gap-2 text-xs text-ink-400"><BookOpen className="h-3.5 w-3.5" />You can leave this page - generation continues on the server and is saved step by step.</p>
      )}
    </div>
  );
}
