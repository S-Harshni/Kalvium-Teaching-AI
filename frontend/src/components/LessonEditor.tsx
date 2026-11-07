import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, Check, Clock, Eye, History, Loader2, Pencil, Plus, Save, Trash2, CloudOff } from "lucide-react";
import { api, ApiError, type KnowledgeCheck, type Lesson, type LessonContent, type ResourceLink, type Section } from "@/lib/api";
import { Alert, Badge, Button, Card } from "./ui";
import { Markdown } from "./Markdown";
import { cn, timeAgo } from "@/lib/utils";

type SaveState = "saved" | "dirty" | "saving" | "error" | "conflict";
const MAX = 45;
const draftKey = (id: string) => `kta-draft-${id}`;

function AutoTextarea({ value, onChange, className, placeholder, mono, autoFocus, onBlur }: {
  value: string; onChange: (v: string) => void; className?: string; placeholder?: string; mono?: boolean;
  autoFocus?: boolean; onBlur?: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = "auto"; el.style.height = `${el.scrollHeight + 2}px`; }
  }, [value]);
  return <textarea ref={ref} value={value} placeholder={placeholder} autoFocus={autoFocus} onBlur={onBlur}
    onChange={(e) => onChange(e.target.value)}
    className={cn("field resize-none leading-relaxed", mono && "font-mono text-[13px]", className)} rows={2} />;
}

function SectionEditor({ s, onChange, onMove, onDelete, first, last }: {
  s: Section; onChange: (s: Section) => void; onMove: (d: -1 | 1) => void; onDelete: () => void; first: boolean; last: boolean;
}) {
  // Sections show formatted Markdown; clicking the text (or the pencil) opens the raw source for
  // editing, and leaving the box shows the formatted version again.
  const [preview, setPreview] = useState(true);
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <input value={s.title} onChange={(e) => onChange({ ...s, title: e.target.value })} className="field flex-1 font-medium" />
        <div className="flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-2.5">
          <Clock className="h-3.5 w-3.5 text-ink-400" />
          <input type="number" min={0} max={45} value={s.minutes} onChange={(e) => onChange({ ...s, minutes: Math.max(0, Math.min(45, Number(e.target.value) || 0)) })}
            className="w-10 bg-transparent py-2 text-sm outline-none" aria-label="Minutes" />
          <span className="text-xs text-ink-400">min</span>
        </div>
        <Badge>{s.kind.replace("_", " ")}</Badge>
        <div className="flex items-center">
          <button className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700" onClick={() => setPreview(!preview)} title={preview ? "Edit" : "Preview"}>
            {preview ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button disabled={first} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-30" onClick={() => onMove(-1)} title="Move up"><ArrowUp className="h-4 w-4" /></button>
          <button disabled={last} className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700 disabled:opacity-30" onClick={() => onMove(1)} title="Move down"><ArrowDown className="h-4 w-4" /></button>
          <button className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600" onClick={onDelete} title="Remove section"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="mt-3">
        {preview ? (
          <div role="button" tabIndex={0} title="Click to edit" onClick={() => setPreview(false)}
            onKeyDown={(e) => { if (e.key === "Enter") setPreview(false); }}
            className="group relative cursor-text rounded-xl border border-ink-100 bg-ink-50/40 p-4 transition hover:border-brand-200 hover:bg-white">
            <span className="pointer-events-none absolute right-3 top-2 hidden items-center gap-1 text-[11px] text-ink-400 group-hover:flex"><Pencil className="h-3 w-3" />Click to edit</span>
            {s.content.trim() ? <Markdown>{s.content}</Markdown> : <p className="text-sm italic text-ink-400">Empty section - click to add content</p>}
          </div>
        ) : (
          <div>
            <AutoTextarea value={s.content} onChange={(v) => onChange({ ...s, content: v })} mono autoFocus onBlur={() => setPreview(true)}
              placeholder="Write in Markdown: **bold**, ### heading, - list, `code`" />
            <p className="mt-1.5 text-[11px] text-ink-400">Markdown: **bold**, *italic*, ### heading, - list, `code`, [S1] citation. Click outside the box to see it formatted.</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function QuestionEditor({ q, onChange, onDelete, n }: { q: KnowledgeCheck; onChange: (q: KnowledgeCheck) => void; onDelete: () => void; n: number }) {
  return (
    <Card className="space-y-2.5 p-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-ink-400">Q{n}</span>
        <select value={q.type} onChange={(e) => onChange({ ...q, type: e.target.value as KnowledgeCheck["type"] })} className="field w-auto py-1.5 text-xs">
          <option value="mcq">Multiple choice</option><option value="true_false">True / false</option><option value="short_answer">Short answer</option>
        </select>
        <input value={q.objective_part} onChange={(e) => onChange({ ...q, objective_part: e.target.value })} placeholder="Objective part assessed" className="field flex-1 py-1.5 text-xs" />
        <button className="rounded-lg p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600" onClick={onDelete}><Trash2 className="h-4 w-4" /></button>
      </div>
      <AutoTextarea value={q.question} onChange={(v) => onChange({ ...q, question: v })} placeholder="Question" />
      {q.type !== "short_answer" && (
        <div className="space-y-1.5">
          {q.options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input value={o} onChange={(e) => onChange({ ...q, options: q.options.map((x, j) => (j === i ? e.target.value : x)) })} className="field py-1.5 text-[13px]" />
              <button className="rounded-lg px-2 text-ink-400 hover:text-rose-600" onClick={() => onChange({ ...q, options: q.options.filter((_, j) => j !== i) })}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => onChange({ ...q, options: [...q.options, ""] })}>+ Add option</button>
        </div>
      )}
      <div className="grid gap-2 md:grid-cols-2">
        <input value={q.answer} onChange={(e) => onChange({ ...q, answer: e.target.value })} placeholder="Correct answer" className="field py-1.5 text-[13px]" />
        <input value={q.explanation} onChange={(e) => onChange({ ...q, explanation: e.target.value })} placeholder="Explanation" className="field py-1.5 text-[13px]" />
      </div>
    </Card>
  );
}

function LinkListEditor({ items, onChange, label }: { items: ResourceLink[]; onChange: (v: ResourceLink[]) => void; label: string }) {
  return (
    <div className="space-y-2">
      {items.map((r, i) => (
        <div key={i} className="grid gap-2 rounded-xl border border-ink-200/70 bg-white p-3 md:grid-cols-[minmax(0,1fr)_1fr_auto]">
          <input value={r.title} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder="Title" className="field py-1.5 text-[13px]" />
          <input value={r.url} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder="https://" className="field py-1.5 text-[13px]" />
          <button className="rounded-lg px-2 text-ink-400 hover:text-rose-600" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
          <input value={r.note} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} placeholder="Note" className="field py-1.5 text-[13px] md:col-span-2" />
        </div>
      ))}
      <Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => onChange([...items, { title: "", url: "", note: "" }])}>Add {label}</Button>
    </div>
  );
}

export function SaveIndicator({ state, at }: { state: SaveState; at: string | null }) {
  const map = {
    saved: { icon: <Check className="h-3.5 w-3.5" />, text: at ? `Saved ${timeAgo(at)}` : "All changes saved", cls: "text-emerald-600" },
    dirty: { icon: <Pencil className="h-3.5 w-3.5" />, text: "Unsaved changes", cls: "text-ink-500" },
    saving: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, text: "Saving…", cls: "text-ink-500" },
    error: { icon: <CloudOff className="h-3.5 w-3.5" />, text: "Not saved — kept locally, retrying", cls: "text-rose-600" },
    conflict: { icon: <AlertTriangle className="h-3.5 w-3.5" />, text: "Changed elsewhere", cls: "text-amber-600" },
  }[state];
  return <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", map.cls)}>{map.icon}{map.text}</span>;
}

export function LessonEditor({ lesson, onSaved, onReload }: { lesson: Lesson; onSaved: (revision: number, content: LessonContent) => void; onReload: () => void }) {
  const [content, setContent] = useState<LessonContent>(lesson.content!);
  const [state, setState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<string | null>(lesson.updated_at);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<{ id: number; revision: number; reason: string; created_at: string }[] | null>(null);
  const base = useRef(lesson.revision);
  const dirty = useRef(false);
  const timer = useRef<number>();
  const [draft, setDraft] = useState<LessonContent | null>(null);

  // Offer to restore a locally kept draft that never reached the server (e.g. server was down).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey(lesson.id));
      if (raw) {
        const d = JSON.parse(raw);
        if (d.revision === lesson.revision) setDraft(d.content); else localStorage.removeItem(draftKey(lesson.id));
      }
    } catch { /* storage unavailable */ }
  }, [lesson.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pick up server-side changes (e.g. an applied QC fix) when there is nothing unsaved locally.
  useEffect(() => {
    if (lesson.revision !== base.current && !dirty.current && lesson.content) {
      base.current = lesson.revision;
      setContent(lesson.content);
      setState("saved");
    }
  }, [lesson.revision, lesson.content]);

  const save = useCallback(async (c: LessonContent) => {
    setState("saving");
    try {
      const res = await api.saveContent(lesson.id, c, base.current);
      base.current = res.revision;
      dirty.current = false;
      setSavedAt(res.updated_at);
      setState("saved");
      setError(null);
      try { localStorage.removeItem(draftKey(lesson.id)); } catch { /* ignore */ }
      onSaved(res.revision, c);
    } catch (e) {
      const err = e as ApiError;
      try { localStorage.setItem(draftKey(lesson.id), JSON.stringify({ revision: base.current, content: c })); } catch { /* ignore */ }
      if (err.status === 409) { setState("conflict"); setError(err.message); }
      else if (err.status === 422) { setState("error"); setError(err.message); }
      else { setState("error"); setError(err.message); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => save(c), 5000); }
    }
  }, [lesson.id, onSaved]);

  const update = (c: LessonContent) => {
    setContent(c);
    dirty.current = true;
    setState("dirty");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => save(c), 1200); // autosave after a short pause in typing
  };

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => { window.removeEventListener("beforeunload", warn); window.clearTimeout(timer.current); };
  }, []);

  const total = content.sections.reduce((a, s) => a + (s.minutes || 0), 0);
  const setSection = (i: number, s: Section) => update({ ...content, sections: content.sections.map((x, j) => (j === i ? s : x)) });
  const move = (i: number, d: -1 | 1) => {
    const arr = [...content.sections];
    [arr[i], arr[i + d]] = [arr[i + d], arr[i]];
    update({ ...content, sections: arr });
  };
  const loadVersions = async () => setVersions(await api.versions(lesson.id));

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-20 -mx-1 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-200/70 bg-white/90 px-4 py-2.5 shadow-card backdrop-blur">
        <div className="flex items-center gap-4">
          <SaveIndicator state={state} at={savedAt} />
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium", total > MAX ? "text-rose-600" : "text-ink-500")}>
            <Clock className="h-3.5 w-3.5" />{total} / {MAX} min
          </span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" icon={<History className="h-3.5 w-3.5" />} onClick={loadVersions}>History</Button>
          <Button size="sm" variant="secondary" icon={<Save className="h-3.5 w-3.5" />} onClick={async () => { await save(content); await api.saveVersion(lesson.id, "Manual save"); }}>Save version</Button>
        </div>
      </div>
      {draft && (
        <Alert tone="warn" title="Unsaved draft found" action={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => { update(draft); setDraft(null); }}>Restore draft</Button>
            <Button size="sm" variant="ghost" onClick={() => { localStorage.removeItem(draftKey(lesson.id)); setDraft(null); }}>Discard</Button>
          </div>}>Edits from an earlier session never reached the server.</Alert>
      )}
      {error && <Alert tone={state === "conflict" ? "warn" : "bad"} title={state === "conflict" ? "This lesson changed elsewhere" : "Save problem"}
        action={state === "conflict" ? <Button size="sm" variant="secondary" onClick={() => { dirty.current = false; setError(null); onReload(); }}>Load latest (your text is kept as a local draft)</Button> : undefined}>{error}</Alert>}
      {total > MAX && <Alert tone="bad" title={`Lesson is ${total - MAX} minutes over the 45-minute limit`}>Reduce section timings - QC Layer 2 will flag this as a critical issue.</Alert>}
      {versions && (
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between"><h3 className="font-display text-sm font-semibold">Version history</h3><button className="text-xs text-ink-400 hover:text-ink-700" onClick={() => setVersions(null)}>Close</button></div>
          {versions.length === 0 ? <p className="text-sm text-ink-500">No saved versions yet.</p> : (
            <div className="max-h-60 divide-y divide-ink-100 overflow-auto">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between py-2 text-[13px]">
                  <div><span className="font-medium text-ink-800">{v.reason}</span><span className="ml-2 text-xs text-ink-400">rev {v.revision} · {timeAgo(v.created_at)}</span></div>
                  <Button size="sm" variant="ghost" onClick={async () => { if (confirm("Restore this version? The current content is saved as a version first.")) { await api.restoreVersion(lesson.id, v.id); dirty.current = false; onReload(); setVersions(null); } }}>Restore</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <Card className="space-y-3 p-5">
        <div><label className="label">Lesson title</label><input value={content.title} onChange={(e) => update({ ...content, title: e.target.value })} className="field mt-1.5 text-base font-semibold" /></div>
        <div><label className="label">Overview</label><AutoTextarea value={content.overview} onChange={(v) => update({ ...content, overview: v })} className="mt-1.5" /></div>
        <div>
          <label className="label">Learning objectives</label>
          <div className="mt-1.5 space-y-1.5">
            {content.learning_objectives.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input value={o} onChange={(e) => update({ ...content, learning_objectives: content.learning_objectives.map((x, j) => (j === i ? e.target.value : x)) })} className="field py-2 text-[13px]" />
                <button className="px-2 text-ink-400 hover:text-rose-600" onClick={() => update({ ...content, learning_objectives: content.learning_objectives.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => update({ ...content, learning_objectives: [...content.learning_objectives, ""] })}>+ Add objective</button>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-display text-base font-semibold">Sections</h3>
          <Button size="sm" variant="subtle" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => update({ ...content, sections: [...content.sections, { id: `custom-${Date.now().toString(36)}`, kind: "custom", title: "New section", minutes: 0, content: "" }] })}>Add section</Button>
        </div>
        {content.sections.map((s, i) => (
          <SectionEditor key={s.id} s={s} first={i === 0} last={i === content.sections.length - 1}
            onChange={(x) => setSection(i, x)} onMove={(d) => move(i, d)}
            onDelete={() => { if (confirm(`Remove section "${s.title}"?`)) update({ ...content, sections: content.sections.filter((_, j) => j !== i) }); }} />
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between"><h3 className="font-display text-base font-semibold">Knowledge check questions</h3>
          <Button size="sm" variant="subtle" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => update({ ...content, knowledge_checks: [...content.knowledge_checks, { id: `q${Date.now().toString(36)}`, question: "", type: "mcq", options: ["", ""], answer: "", explanation: "", objective_part: "" }] })}>Add question</Button>
        </div>
        {content.knowledge_checks.map((q, i) => (
          <QuestionEditor key={q.id} q={q} n={i + 1} onChange={(x) => update({ ...content, knowledge_checks: content.knowledge_checks.map((y, j) => (j === i ? x : y)) })}
            onDelete={() => update({ ...content, knowledge_checks: content.knowledge_checks.filter((_, j) => j !== i) })} />
        ))}
      </div>

      <Card className="space-y-3 p-5">
        <h3 className="font-display text-base font-semibold">Supplementary YouTube videos</h3>
        <LinkListEditor items={content.videos} onChange={(v) => update({ ...content, videos: v })} label="video" />
        {(lesson.research?.sources ?? []).filter((s) => s.source_type === "video" && !content.videos.some((v) => v.url === s.url)).length > 0 && (
          <div className="border-t border-ink-100 pt-3">
            <div className="eyebrow mb-2">Other verified videos from research</div>
            <div className="flex flex-wrap gap-2">
              {(lesson.research?.sources ?? []).filter((s) => s.source_type === "video" && !content.videos.some((v) => v.url === s.url)).map((s) => (
                <button key={s.id} onClick={() => update({ ...content, videos: [...content.videos, { title: s.title, url: s.url, note: s.channel ? `by ${s.channel}` : "", source_id: s.id }] })}
                  className="rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-left text-xs text-ink-700 hover:border-brand-300 hover:bg-brand-50">+ {s.title.slice(0, 60)} <span className="text-ink-400">({s.duration})</span></button>
              ))}
            </div>
          </div>
        )}
      </Card>
      <Card className="space-y-3 p-5">
        <h3 className="font-display text-base font-semibold">References</h3>
        <LinkListEditor items={content.references} onChange={(v) => update({ ...content, references: v })} label="reference" />
      </Card>
    </div>
  );
}
