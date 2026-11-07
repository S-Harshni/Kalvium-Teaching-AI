import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FlaskConical, Info, Sparkles, Wand2 } from "lucide-react";
import { api, ApiError, type LessonSettings } from "@/lib/api";
import { useStatus } from "@/components/AppShell";
import { Alert, Button, Card, SectionHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

const SAMPLES = [
  { title: "HTTP Requests and Responses", objective: "Explain GET and POST methods and distinguish between 2xx, 4xx, and 5xx response status categories.", audience: "Beginner web developers" },
  { title: "Python Functions and Parameters", objective: "Explain how to define and call Python functions, distinguish parameters from arguments, and demonstrate positional and keyword arguments.", audience: "Beginner Python programmers" },
];

export default function Create() {
  const nav = useNavigate();
  const status = useStatus();
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [settings, setSettings] = useState<LessonSettings>({ audience: "Beginner learners", difficulty: "beginner", teaching_style: "balanced", lesson_format: "self-paced" });
  const [demo, setDemo] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const demoOnly = status?.demo_only;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Lesson title is required.";
    if (!objective.trim()) errs.objective = "Learning objective is required.";
    else if (objective.trim().split(/\s+/).length < 4) errs.objective = "Describe what learners should be able to do (a few words at least).";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    setError(null);
    try {
      const lesson = await api.create({ title: title.trim(), objective: objective.trim(), settings, demo: demo || !!demoOnly });
      nav(`/app/lessons/${lesson.id}`);
    } catch (err) {
      const e2 = err as ApiError;
      if (e2.fields) setErrors(e2.fields);
      setError(e2.message);
      setSubmitting(false);
    }
  };

  const set = <K extends keyof LessonSettings>(k: K, v: LessonSettings[K]) => setSettings({ ...settings, [k]: v });

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Lesson creation studio" title="Create a research-backed lesson"
        description="Give a title and a learning objective. Learnora researches trusted sources, writes a 45-minute lesson, and audits it with two independent quality checks." />
      {demoOnly && (
        <Alert tone="warn" title="Demo mode - no AI provider configured">
          Lessons will replay recorded sample output for the two sample topics (other topics get a placeholder outline). See Settings to enable live generation.
        </Alert>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <motion.form initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="card space-y-5 p-6" noValidate>
          <div>
            <label className="label" htmlFor="title">Lesson title</label>
            <input id="title" value={title} onChange={(e) => { setTitle(e.target.value); setErrors({ ...errors, title: "" }); }}
              placeholder="e.g. HTTP Requests and Responses" maxLength={200}
              className={cn("field mt-1.5 text-[15px]", errors.title && "border-rose-300 focus:border-rose-400 focus:ring-rose-100")} />
            {errors.title && <p className="mt-1.5 text-xs text-rose-600">{errors.title}</p>}
          </div>
          <div>
            <label className="label" htmlFor="objective">Learning objective</label>
            <textarea id="objective" value={objective} onChange={(e) => { setObjective(e.target.value); setErrors({ ...errors, objective: "" }); }}
              placeholder="What should learners be able to do after the lesson? Start with a measurable verb (explain, compare, build…)." rows={3} maxLength={1000}
              className={cn("field mt-1.5 resize-none text-[15px]", errors.objective && "border-rose-300 focus:border-rose-400 focus:ring-rose-100")} />
            {errors.objective && <p className="mt-1.5 text-xs text-rose-600">{errors.objective}</p>}
          </div>
          <div className="rounded-2xl border border-ink-200/70 bg-ink-50/50 p-4">
            <div className="eyebrow mb-3">Optional settings</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="label">Target audience</label><input value={settings.audience} onChange={(e) => set("audience", e.target.value)} className="field mt-1.5" /></div>
              <div><label className="label">Difficulty</label>
                <select value={settings.difficulty} onChange={(e) => set("difficulty", e.target.value as LessonSettings["difficulty"])} className="field mt-1.5">
                  <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
              <div><label className="label">Teaching style</label>
                <select value={settings.teaching_style} onChange={(e) => set("teaching_style", e.target.value as LessonSettings["teaching_style"])} className="field mt-1.5">
                  <option value="balanced">Balanced</option><option value="conversational">Conversational</option><option value="socratic">Socratic</option><option value="hands-on">Hands-on</option></select></div>
              <div><label className="label">Lesson format</label>
                <select value={settings.lesson_format} onChange={(e) => set("lesson_format", e.target.value as LessonSettings["lesson_format"])} className="field mt-1.5">
                  <option value="self-paced">Self-paced</option><option value="instructor-led">Instructor-led</option></select></div>
            </div>
          </div>
          {!demoOnly && (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-600">
              <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} className="h-4 w-4 rounded border-ink-300 accent-brand-600" />
              <FlaskConical className="h-4 w-4 text-ink-400" /> Use demo mode (replay recorded sample output, no live calls)
            </label>
          )}
          {error && <Alert tone="bad">{error}</Alert>}
          <div className="flex items-center justify-between gap-3 border-t border-ink-100 pt-5">
            <p className="flex items-center gap-1.5 text-xs text-ink-400"><Info className="h-3.5 w-3.5" />Live generation takes about 4-8 minutes.</p>
            <Button type="submit" size="lg" loading={submitting} icon={<Sparkles className="h-4 w-4" />}>Generate AI Lesson</Button>
          </div>
        </motion.form>
        <div className="space-y-4">
          <Card className="p-5">
            <div className="eyebrow mb-3">Try a sample</div>
            <div className="space-y-2">
              {SAMPLES.map((s) => (
                <button key={s.title} type="button" onClick={() => { setTitle(s.title); setObjective(s.objective); set("audience", s.audience); setErrors({}); }}
                  className="w-full rounded-xl border border-ink-200/70 p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40">
                  <div className="flex items-center gap-2 text-sm font-medium text-ink-900"><Wand2 className="h-3.5 w-3.5 text-brand-500" />{s.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-ink-500">{s.objective}</div>
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-5 text-[13px] text-ink-600">
            <div className="eyebrow mb-3">What happens next</div>
            <ol className="space-y-2">
              {["Analyse the objective and plan research", "Search the web, book catalogs and YouTube", "Fetch and verify every source", "Write a cited 45-minute lesson", "QC 1 - fact-check claims against evidence", "QC 2 - audit teaching quality", "Save for your review and edits"].map((t, i) => (
                <li key={t} className="flex gap-2.5"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink-100 text-[10px] font-semibold text-ink-500">{i + 1}</span>{t}</li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  );
}
