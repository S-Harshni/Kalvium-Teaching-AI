import { BookOpen, CheckCircle2, ExternalLink, FileText, Globe, GraduationCap, Landmark, PlayCircle, XCircle, HelpCircle } from "lucide-react";
import type { Source } from "@/lib/api";
import { Badge } from "./ui";

const TYPE_META: Record<Source["source_type"], { label: string; icon: typeof Globe }> = {
  standard: { label: "Standard / spec", icon: Landmark },
  documentation: { label: "Official documentation", icon: FileText },
  website: { label: "Website", icon: Globe },
  encyclopedia: { label: "Encyclopedia", icon: BookOpen },
  academic: { label: "Academic", icon: GraduationCap },
  book: { label: "Book", icon: BookOpen },
  video: { label: "YouTube video", icon: PlayCircle },
};

export function ReliabilityBadge({ value }: { value: Source["reliability"] }) {
  return <Badge tone={value === "high" ? "good" : value === "medium" ? "warn" : "bad"}>{value} reliability</Badge>;
}

export function StatusBadge({ s }: { s: Source }) {
  if (s.status === "verified") return <Badge tone="good" icon={<CheckCircle2 className="h-3 w-3" />}>verified</Badge>;
  if (s.status === "failed") return <Badge tone="bad" icon={<XCircle className="h-3 w-3" />}>not retrieved</Badge>;
  return <Badge icon={<HelpCircle className="h-3 w-3" />}>unverified metadata</Badge>;
}

export function SourceCard({ s }: { s: Source }) {
  const meta = TYPE_META[s.source_type] ?? TYPE_META.website;
  const Icon = meta.icon;
  if (s.source_type === "video") {
    return (
      <a href={s.url} target="_blank" rel="noreferrer" className="card group flex flex-col overflow-hidden transition hover:shadow-lift">
        <div className="relative aspect-video bg-ink-100">
          {s.thumbnail && <img src={s.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 grid place-items-center bg-ink-950/0 transition group-hover:bg-ink-950/20">
            <PlayCircle className="h-11 w-11 text-white opacity-90 drop-shadow" />
          </div>
          {s.duration && <span className="absolute bottom-2 right-2 rounded-md bg-ink-950/80 px-1.5 py-0.5 text-[11px] font-medium text-white">{s.duration}</span>}
          <span className="absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold text-ink-700">{s.id}</span>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="line-clamp-2 text-sm font-medium text-ink-900">{s.title}</div>
          <div className="text-xs text-ink-500">{s.channel}{s.published ? ` · ${s.published}` : ""}</div>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1"><StatusBadge s={s} /><ReliabilityBadge value={s.reliability} /></div>
        </div>
      </a>
    );
  }
  const metaLine = [s.author, s.publisher, s.published && (s.source_type === "book" ? `first published ${s.published}` : s.published?.slice(0, 10)), s.isbn && `ISBN ${s.isbn}`]
    .filter(Boolean).join(" · ");
  return (
    <div className="card p-4 transition hover:shadow-lift">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-4 w-4" /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <a href={s.url} target="_blank" rel="noreferrer" className="group text-sm font-medium text-ink-900 hover:text-brand-700">
              <span className="mr-1.5 rounded bg-ink-100 px-1 py-px text-[11px] font-semibold text-ink-600">{s.id}</span>
              {s.title}<ExternalLink className="ml-1 inline h-3 w-3 opacity-0 transition group-hover:opacity-100" />
            </a>
            <span className="shrink-0 text-[11px] text-ink-400">{meta.label}</span>
          </div>
          <div className="mt-0.5 truncate text-xs text-ink-400">{s.url}</div>
          {metaLine && <div className="mt-1 text-xs text-ink-500">{metaLine}</div>}
          {s.description && <p className="mt-2 line-clamp-2 text-[13px] text-ink-600">{s.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <StatusBadge s={s} /><ReliabilityBadge value={s.reliability} />
            <Badge tone="brand">{Math.round(s.relevance * 100)}% relevance</Badge>
          </div>
          <div className="mt-2 space-y-0.5 text-[11.5px] text-ink-400">
            <div><span className="font-medium text-ink-500">Reliability:</span> {s.reliability_note}</div>
            <div><span className="font-medium text-ink-500">Verification:</span> {s.verification_note}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
