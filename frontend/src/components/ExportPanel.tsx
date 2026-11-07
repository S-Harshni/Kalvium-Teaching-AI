import { useState } from "react";
import { Braces, Download, FileText, FileType2, Package } from "lucide-react";
import { api, type Lesson } from "@/lib/api";
import { Alert, Button, Card } from "./ui";

type Fmt = "md" | "pdf" | "json";

const ITEMS: { kind: string; title: string; description: string; formats: Fmt[]; needs?: "qc_factual" | "qc_instructional"; icon: typeof FileText }[] = [
  { kind: "project", title: "Complete project report", description: "Lesson, references and both QC reports in one document.", formats: ["pdf", "md"], icon: Package },
  { kind: "lesson", title: "Lesson", description: "The finalized lesson with videos and references.", formats: ["pdf", "md"], icon: FileText },
  { kind: "data", title: "Lesson data", description: "Everything as structured JSON (content, sources, QC reports).", formats: ["json"], icon: Braces },
  { kind: "references", title: "Research reference list", description: "All sources with reliability and verification notes.", formats: ["pdf", "md"], icon: FileType2 },
  { kind: "qc-factual", title: "Research & factual accuracy report", description: "QC Layer 1 audit with claims, sources and issues.", formats: ["pdf", "md"], needs: "qc_factual", icon: FileType2 },
  { kind: "qc-instructional", title: "Instructional quality report", description: "QC Layer 2 audit with rubric, coverage and timing.", formats: ["pdf", "md"], needs: "qc_instructional", icon: FileType2 },
];

/** Downloads are fetched first so a server-side failure shows a message instead of a broken file. */
export function ExportPanel({ lesson }: { lesson: Lesson }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const total = lesson.content?.sections.reduce((a, s) => a + s.minutes, 0) ?? 0;

  const run = async (kind: string, fmt: Fmt) => {
    setBusy(`${kind}-${fmt}`);
    setError(null);
    try {
      const res = await fetch(api.exportUrl(lesson.id, kind, fmt));
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.detail === "string" ? body.detail : `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const name = res.headers.get("content-disposition")?.match(/filename="(.+?)"/)?.[1] ?? `lesson.${fmt}`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      setError(e instanceof TypeError ? "Cannot reach the server - check that the backend is running." : (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      {lesson.demo && <Alert tone="warn" title="Demo lesson">Exports are labelled as recorded sample output.</Alert>}
      {total > 45 && <Alert tone="bad" title="Over the 45-minute limit">This lesson is {total} minutes. You can still export, but fix timings before using it.</Alert>}
      {error && <Alert tone="bad" title="Export failed">{error}</Alert>}
      <div className="grid gap-3 md:grid-cols-2">
        {ITEMS.map((it) => {
          const missing = it.needs && !lesson[it.needs];
          const Icon = it.icon;
          return (
            <Card key={it.kind} className="flex items-start gap-3.5 p-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-4.5 w-4.5" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink-900">{it.title}</div>
                <div className="mt-0.5 text-xs text-ink-500">{missing ? "Run this QC layer first." : it.description}</div>
                <div className="mt-3 flex gap-2">
                  {it.formats.map((f) => (
                    <Button key={f} size="sm" variant={f === "pdf" || f === "json" ? "primary" : "secondary"} disabled={!!missing}
                      loading={busy === `${it.kind}-${f}`} icon={<Download className="h-3.5 w-3.5" />} onClick={() => run(it.kind, f)}>
                      {f.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
