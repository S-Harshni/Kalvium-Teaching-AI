import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, ExternalLink, PlayCircle, Target, XCircle, BookMarked, ListChecks } from "lucide-react";
import type { KnowledgeCheck, LessonContent } from "@/lib/api";
import { Markdown } from "./Markdown";
import { Badge } from "./ui";
import { cn } from "@/lib/utils";

function ytId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function norm(s: string) { return s.trim().toLowerCase().replace(/^[a-d][).:]\s*/, ""); }

function Question({ q, n }: { q: KnowledgeCheck; n: number }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [shown, setShown] = useState(false);
  const correct = picked != null && (norm(picked) === norm(q.answer) || norm(q.answer).startsWith(norm(picked)) || norm(picked).startsWith(norm(q.answer)));
  const options = q.type === "true_false" && q.options.length === 0 ? ["True", "False"] : q.options;
  return (
    <div className="rounded-2xl border border-ink-200/70 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">{n}</span>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-ink-900"><Markdown className="prose-p:my-0">{q.question}</Markdown></div>
          {q.type !== "short_answer" ? (
            <div className="mt-3 grid gap-2">
              {options.map((o) => {
                const isPicked = picked === o;
                return (
                  <button key={o} disabled={picked != null} onClick={() => { setPicked(o); setShown(true); }}
                    className={cn("rounded-xl border px-3.5 py-2.5 text-left text-sm transition",
                      !isPicked && "border-ink-200 hover:border-brand-300 hover:bg-brand-50/50",
                      isPicked && correct && "border-emerald-300 bg-emerald-50 text-emerald-900",
                      isPicked && !correct && "border-rose-300 bg-rose-50 text-rose-900")}>
                    {o}
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea className="field mt-3" rows={2} placeholder="Write your answer, then reveal the model answer…" />
          )}
          {!shown && <button className="mt-3 text-xs font-medium text-brand-600 hover:underline" onClick={() => setShown(true)}>Reveal answer</button>}
          {shown && (
            <div className="mt-3 rounded-xl bg-ink-50 p-3.5 text-sm">
              {picked != null && (
                <div className={cn("mb-1 flex items-center gap-1.5 font-medium", correct ? "text-emerald-700" : "text-rose-700")}>
                  {correct ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{correct ? "Correct" : "Not quite"}
                </div>
              )}
              <div className="text-ink-700"><span className="font-medium">Answer:</span> {q.answer}</div>
              {q.explanation && <Markdown className="mt-1 text-ink-600 prose-p:my-0">{q.explanation}</Markdown>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Student-facing, distraction-free view of the lesson with section navigation and progress. */
export function LessonPreview({ content, demo }: { content: LessonContent; demo?: boolean }) {
  const total = content.sections.reduce((a, s) => a + s.minutes, 0);
  const navItems = useMemo(() => [
    ...content.sections.map((s) => ({ id: `sec-${s.id}`, label: s.title, minutes: s.minutes })),
    ...(content.videos.length ? [{ id: "sec-videos", label: "Videos", minutes: 0 }] : []),
    ...(content.references.length ? [{ id: "sec-refs", label: "References", minutes: 0 }] : []),
  ], [content]);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<string>(navItems[0]?.id);

  useEffect(() => {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setActive(e.target.id);
          setSeen((prev) => new Set(prev).add(e.target.id));
        }
      });
    }, { rootMargin: "-20% 0px -60% 0px" });
    navItems.forEach((n) => { const el = document.getElementById(n.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [navItems]);

  const pct = Math.round((seen.size / Math.max(navItems.length, 1)) * 100);
  const hasCheckSection = content.sections.some((s) => s.kind === "knowledge_check");

  return (
    <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <div className="sticky top-6">
          <div className="eyebrow mb-2">Progress · {pct}%</div>
          <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${pct}%` }} /></div>
          <nav className="space-y-0.5">
            {navItems.map((n) => (
              <a key={n.id} href={`#${n.id}`} className={cn("flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition",
                active === n.id ? "bg-white font-medium text-ink-900 shadow-sm ring-1 ring-ink-200/70" : "text-ink-500 hover:text-ink-800")}>
                <span className="flex items-center gap-2 truncate">
                  {seen.has(n.id) ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-500" /> : <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-ink-300" />}
                  <span className="truncate">{n.label}</span>
                </span>
                {n.minutes > 0 && <span className="shrink-0 text-[11px] text-ink-400">{n.minutes}m</span>}
              </a>
            ))}
          </nav>
        </div>
      </aside>
      <article className="min-w-0 max-w-3xl">
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand" icon={<Clock className="h-3 w-3" />}>{total} min</Badge>
            {content.difficulty && <Badge>{content.difficulty}</Badge>}
            {content.audience && <Badge>{content.audience}</Badge>}
            {demo && <Badge tone="warn">Demo · sample output</Badge>}
          </div>
          <h1 className="mt-4 text-[34px] font-semibold leading-tight text-ink-900">{content.title}</h1>
          <Markdown className="mt-3 text-[15.5px] leading-relaxed text-ink-600 prose-p:my-0">{content.overview}</Markdown>
          <div className="mt-6 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-800"><Target className="h-4 w-4" />By the end of this lesson you will be able to</div>
            <ul className="space-y-1.5 text-[14px] text-ink-700">
              {content.learning_objectives.map((o, i) => <li key={i} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" /><Markdown className="text-[14px] text-ink-700 prose-p:my-0">{o}</Markdown></li>)}
            </ul>
          </div>
        </header>
        <div className="space-y-12">
          {content.sections.map((s) => (
            <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-6">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-[22px] font-semibold text-ink-900">{s.title}</h2>
                {s.minutes > 0 && <span className="text-xs text-ink-400">{s.minutes} min</span>}
              </div>
              <Markdown className="text-[15px] leading-7">{s.content}</Markdown>
              {s.kind === "knowledge_check" && (
                <div className="mt-5 space-y-3">{content.knowledge_checks.map((q, i) => <Question key={q.id} q={q} n={i + 1} />)}</div>
              )}
            </section>
          ))}
          {!hasCheckSection && content.knowledge_checks.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-[22px] font-semibold"><ListChecks className="h-5 w-5" />Knowledge check</h2>
              {content.knowledge_checks.map((q, i) => <Question key={q.id} q={q} n={i + 1} />)}
            </section>
          )}
          {content.videos.length > 0 && (
            <section id="sec-videos" className="scroll-mt-6">
              <h2 className="mb-1 text-[22px] font-semibold">Supplementary videos</h2>
              <p className="mb-4 text-sm text-ink-500">Optional - watch after the lesson to reinforce key ideas.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {content.videos.map((v) => {
                  const id = ytId(v.url);
                  return (
                    <a key={v.url} href={v.url} target="_blank" rel="noreferrer" className="card group overflow-hidden transition hover:shadow-lift">
                      <div className="relative aspect-video bg-ink-100">
                        {id && <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" loading="lazy" />}
                        <PlayCircle className="absolute inset-0 m-auto h-12 w-12 text-white drop-shadow transition group-hover:scale-110" />
                      </div>
                      <div className="p-4"><div className="text-sm font-medium text-ink-900">{v.title}</div>{v.note && <div className="mt-1 text-xs text-ink-500">{v.note}</div>}</div>
                    </a>
                  );
                })}
              </div>
            </section>
          )}
          {content.references.length > 0 && (
            <section id="sec-refs" className="scroll-mt-6">
              <h2 className="mb-4 flex items-center gap-2 text-[22px] font-semibold"><BookMarked className="h-5 w-5" />References</h2>
              <ol className="space-y-2.5">
                {content.references.map((r, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="mt-0.5 shrink-0 rounded bg-ink-100 px-1.5 py-px text-[11px] font-semibold text-ink-600">{r.source_id || i + 1}</span>
                    <div><a href={r.url} target="_blank" rel="noreferrer" className="font-medium text-brand-700 hover:underline">{r.title}<ExternalLink className="ml-1 inline h-3 w-3" /></a>
                      {r.note && <div className="text-xs text-ink-500">{r.note}</div>}</div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
