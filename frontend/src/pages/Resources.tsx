import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Library } from "lucide-react";
import { api, type Source } from "@/lib/api";
import { Alert, EmptyState, SectionHeader, Spinner } from "@/components/ui";
import { SourceCard } from "@/components/SourceCard";
import { cn } from "@/lib/utils";

type Row = Source & { lesson_id: string; lesson_title: string; demo: boolean };

export default function Resources() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState("all");
  useEffect(() => { api.resources().then(setRows).catch((e) => setError(e.message)); }, []);
  const types = ["all", "standard", "documentation", "website", "encyclopedia", "book", "video"];
  const items = (rows ?? []).filter((r) => type === "all" || r.source_type === type);
  const byLesson = items.reduce<Record<string, Row[]>>((acc, r) => ((acc[r.lesson_id] ??= []).push(r), acc), {});
  return (
    <div className="space-y-6">
      <SectionHeader title="Learning resources" description="Every source researched for your lessons, with reliability and verification status." />
      {error && <Alert tone="bad">{error}</Alert>}
      {!rows ? <div className="grid h-40 place-items-center"><Spinner /></div> : rows.length === 0 ? (
        <EmptyState icon={<Library className="h-5 w-5" />} title="No resources yet" description="Sources appear here after a lesson's research step completes." />
      ) : (
        <>
          <div className="flex flex-wrap gap-1">
            {types.map((t) => (
              <button key={t} onClick={() => setType(t)} className={cn("rounded-lg px-3 py-1.5 text-xs font-medium capitalize", type === t ? "bg-ink-900 text-white" : "bg-white text-ink-600 ring-1 ring-ink-200")}>
                {t} ({t === "all" ? rows.length : rows.filter((r) => r.source_type === t).length})
              </button>
            ))}
          </div>
          {Object.entries(byLesson).map(([id, list]) => (
            <div key={id}>
              <Link to={`/app/lessons/${id}`} className="mb-3 inline-block font-display text-base font-semibold hover:text-brand-700">{list[0].lesson_title}{list[0].demo && <span className="ml-2 text-xs font-normal text-amber-600">demo sample</span>}</Link>
              <div className={cn("grid gap-3", type === "video" ? "sm:grid-cols-2 lg:grid-cols-3" : "lg:grid-cols-2")}>{list.map((s) => <SourceCard key={s.id} s={s} />)}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
