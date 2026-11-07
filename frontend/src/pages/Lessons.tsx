import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Plus, Search } from "lucide-react";
import { api, type LessonSummary } from "@/lib/api";
import { Alert, Button, Card, EmptyState, SectionHeader, Spinner } from "@/components/ui";
import { LessonRow } from "./Dashboard";
import { cn } from "@/lib/utils";

export default function Lessons() {
  const [lessons, setLessons] = useState<LessonSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "review" | "finalized" | "failed">("all");
  useEffect(() => { api.lessons().then(setLessons).catch((e) => setError(e.message)); }, []);
  const items = (lessons ?? []).filter((l) => (status === "all" || l.status === status) &&
    (`${l.title} ${l.objective}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-6">
      <SectionHeader title="My lessons" description="Every lesson is saved automatically with its research, QC reports and version history."
        action={<Link to="/app/create"><Button icon={<Plus className="h-4 w-4" />}>New lesson</Button></Link>} />
      {error && <Alert tone="bad">{error}</Alert>}
      {!lessons ? <div className="grid h-40 place-items-center"><Spinner /></div> : lessons.length === 0 ? (
        <EmptyState icon={<BookOpen className="h-5 w-5" />} title="No lessons yet" description="Create a lesson and it will be saved here."
          action={<Link to="/app/create"><Button>Create lesson</Button></Link>} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lessons…" className="field pl-9" />
            </div>
            <div className="flex gap-1">
              {(["all", "review", "finalized", "failed"] as const).map((s) => (
                <button key={s} onClick={() => setStatus(s)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium capitalize", status === s ? "bg-ink-900 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200")}>{s}</button>
              ))}
            </div>
          </div>
          <Card className="divide-y divide-ink-100 overflow-hidden">
            {items.map((l) => <LessonRow key={l.id} l={l} />)}
            {items.length === 0 && <div className="px-4 py-8 text-center text-sm text-ink-400">No lessons match.</div>}
          </Card>
          <p className="text-xs text-ink-400">* QC score from an earlier revision - the lesson was edited after that report.</p>
        </>
      )}
    </div>
  );
}
