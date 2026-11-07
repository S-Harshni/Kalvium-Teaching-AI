import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Check, CheckCircle2, Clock, FileDown, Globe, GraduationCap, Landmark, Loader2, PenLine, PlayCircle, Search, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Logo } from "@/components/AppShell";
import { Button } from "@/components/ui";

const fade = { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.5 } };

function ProductPreview() {
  const steps = ["Understanding learning objective", "Researching trusted resources", "Analyzing research materials", "Generating lesson content", "Running factual accuracy QC", "Running instructional quality QC"];
  return (
    <div className="relative">
      <div className="absolute -inset-6 rounded-[32px] bg-gradient-to-br from-brand-200/50 via-white to-sky-100/50 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-lift">
        <div className="flex items-center gap-1.5 border-b border-ink-100 bg-ink-50/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ink-200" /><span className="h-2.5 w-2.5 rounded-full bg-ink-200" /><span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
          <span className="ml-3 text-[11px] text-ink-400">Lesson studio · illustration</span>
        </div>
        <div className="grid gap-0 sm:grid-cols-[1.1fr_1fr]">
          <div className="border-b border-ink-100 p-5 sm:border-b-0 sm:border-r">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Workflow</div>
            <div className="mt-1 text-sm font-semibold text-ink-900">HTTP Requests and Responses</div>
            <ol className="mt-4 space-y-2.5">
              {steps.map((s, i) => (
                <motion.li key={s} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.15 }} className="flex items-center gap-2.5 text-[12.5px]">
                  {i < 5 ? <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white"><Check className="h-3 w-3" strokeWidth={3} /></span>
                    : <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-50 text-brand-600"><Loader2 className="h-3 w-3 animate-spin" /></span>}
                  <span className={i < 5 ? "text-ink-700" : "font-medium text-ink-900"}>{s}</span>
                </motion.li>
              ))}
            </ol>
          </div>
          <div className="space-y-3 p-5">
            <div className="rounded-xl border border-ink-100 p-3">
              <div className="flex items-center justify-between text-[11px] text-ink-400"><span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" />QC 1 · Factual</span><span className="rounded-full bg-emerald-50 px-1.5 py-px font-medium text-emerald-700">Passed</span></div>
              <div className="mt-1 text-xs text-ink-600">Claims checked against RFC 9110 and MDN evidence</div>
              <div className="mt-2 h-1.5 rounded-full bg-ink-100"><div className="h-full w-[92%] rounded-full bg-emerald-500" /></div>
            </div>
            <div className="rounded-xl border border-ink-100 p-3">
              <div className="flex items-center justify-between text-[11px] text-ink-400"><span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />QC 2 · Instructional</span><span className="rounded-full bg-brand-50 px-1.5 py-px font-medium text-brand-700">Running</span></div>
              <div className="mt-1 text-xs text-ink-600">Objective alignment, examples, assessment, timing</div>
              <div className="mt-2 h-1.5 rounded-full bg-ink-100"><div className="h-full w-[40%] animate-pulse rounded-full bg-brand-400" /></div>
            </div>
            <div className="rounded-xl bg-ink-950 p-3 font-mono text-[11px] leading-relaxed text-ink-200">
              <span className="text-brand-300">GET</span> /orders/42 → <span className="text-emerald-300">200 OK</span><br />
              <span className="text-brand-300">POST</span> /orders → <span className="text-emerald-300">201 Created</span><br />
              <span className="text-brand-300">GET</span> /orders/999 → <span className="text-amber-300">404 Not Found</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-ink-100/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm text-ink-500 md:flex">
            <a href="#how" className="hover:text-ink-900">How it works</a><a href="#qc" className="hover:text-ink-900">Quality control</a><a href="#research" className="hover:text-ink-900">Research</a>
          </nav>
          <Link to="/app"><Button size="sm">Open app</Button></Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-16 lg:grid-cols-2 lg:pt-24">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <Sparkles className="h-3.5 w-3.5" /> Learn Smarter. Teach Better. Create with Intelligence.
            </div>
            <h1 className="mt-6 text-[44px] font-semibold leading-[1.05] tracking-tight text-ink-950 sm:text-[54px]">
              Turn any topic into a <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">research-backed</span> lesson.
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-500">
              Create engaging, structured, and quality-checked lessons with AI-powered research and intelligent instructional design.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/app/create"><Button size="lg" icon={<Sparkles className="h-4 w-4" />}>Create Your First Lesson</Button></Link>
              <a href="#how"><Button size="lg" variant="secondary">Explore How It Works <ArrowRight className="h-4 w-4" /></Button></a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-ink-500">
              {["Verified sources only", "Two independent QC audits", "45 minutes or less"].map((t) => <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-brand-500" />{t}</span>)}
            </div>
          </motion.div>
          <ProductPreview />
        </div>
      </section>

      <section className="border-y border-ink-100 bg-ink-50/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fade} className="max-w-2xl">
            <div className="eyebrow">Features</div>
            <h2 className="mt-2 text-3xl font-semibold text-ink-950">Everything an instructor needs, from research to export.</h2>
          </motion.div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Search, t: "Real research", d: "Searches the web, library catalogs and YouTube, then fetches every page to confirm it exists and says what it claims." },
              { icon: PenLine, t: "Structured lessons", d: "Objectives, prerequisites, explanations, worked examples, an activity, knowledge checks and a summary - with inline citations." },
              { icon: ShieldCheck, t: "Factual QC", d: "Each factual claim is matched against retrieved evidence passages. Unsupported or misleading statements are flagged with fixes." },
              { icon: GraduationCap, t: "Instructional QC", d: "An independent review checks objective coverage, clarity, examples, assessments and realistic timing." },
              { icon: Check, t: "Review & apply", d: "Accept or reject each recommendation. Fixes replace only the exact passage, so your own edits are never overwritten." },
              { icon: FileDown, t: "Export anywhere", d: "PDF, Markdown and JSON for the lesson, the reference list and both QC reports - or one complete report." },
            ].map(({ icon: Icon, t, d }) => (
              <motion.div key={t} {...fade} className="card p-6">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-600 shadow-card ring-1 ring-ink-200/70"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 text-[15px] font-semibold text-ink-900">{t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fade} className="max-w-2xl"><div className="eyebrow">How it works</div>
            <h2 className="mt-2 text-3xl font-semibold text-ink-950">Seven transparent steps. Every one saved and retryable.</h2></motion.div>
          <div className="mt-10 grid gap-3 md:grid-cols-7">
            {[["Understand", "Split the objective into assessable parts"], ["Research", "Search docs, standards, books, videos"], ["Analyze", "Fetch, verify and score sources"], ["Generate", "Write a cited 45-minute lesson"], ["Fact-check", "QC 1 against retrieved evidence"], ["Teach-check", "QC 2 on instructional design"], ["Review", "Edit, apply fixes, export"]].map(([t, d], i) => (
              <motion.div key={t} {...fade} transition={{ duration: 0.4, delay: i * 0.05 }} className="rounded-2xl border border-ink-200/70 p-4">
                <div className="font-mono text-xs text-brand-500">0{i + 1}</div>
                <div className="mt-2 text-sm font-semibold text-ink-900">{t}</div>
                <div className="mt-1 text-xs leading-relaxed text-ink-500">{d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="research" className="bg-ink-950 py-20 text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2">
          <motion.div {...fade}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-300">Research-backed learning</div>
            <h2 className="mt-2 text-3xl font-semibold">Sources you can check. Nothing invented.</h2>
            <p className="mt-4 leading-relaxed text-ink-300">Every source shown comes from a search provider or library API and is fetched before it is trusted. Reliability is rated by transparent publisher rules, not by the model, and anything that could not be verified is labelled as such.</p>
          </motion.div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[{ icon: Landmark, t: "Standards & specs", d: "RFCs, W3C, language specifications" }, { icon: Globe, t: "Official documentation", d: "MDN, docs.python.org, vendor docs" }, { icon: BookOpen, t: "Books", d: "Library catalog records as further reading" }, { icon: PlayCircle, t: "YouTube", d: "Verified explainer videos with duration" }].map(({ icon: Icon, t, d }) => (
              <motion.div key={t} {...fade} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <Icon className="h-5 w-5 text-brand-300" /><div className="mt-3 text-sm font-semibold">{t}</div><div className="mt-1 text-xs text-ink-400">{d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="qc" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fade} className="max-w-2xl"><div className="eyebrow">Dual quality control</div>
            <h2 className="mt-2 text-3xl font-semibold text-ink-950">Correct <span className="text-ink-400">and</span> effective - checked separately.</h2>
            <p className="mt-3 text-ink-500">Two independent reviewers with separate prompts, inputs and scores. One asks “is it true?”, the other asks “does it teach?”.</p></motion.div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              { icon: ShieldCheck, t: "Layer 1 · Research & factual accuracy", items: ["Claims verified against retrieved evidence", "Unsupported & misleading statements", "Source reliability and relevance", "Citation validity and coverage", "Research gaps and outdated information"] },
              { icon: GraduationCap, t: "Layer 2 · Instructional quality", items: ["Learning objective alignment", "Clarity, sequence and completeness", "Example and activity quality", "Knowledge-check relevance", "45-minute time compliance"] },
            ].map(({ icon: Icon, t, items }) => (
              <motion.div key={t} {...fade} className="card p-7">
                <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></div><h3 className="text-base font-semibold">{t}</h3></div>
                <ul className="mt-5 space-y-2.5">{items.map((x) => <li key={x} className="flex items-center gap-2.5 text-sm text-ink-600"><CheckCircle2 className="h-4 w-4 text-brand-400" />{x}</li>)}</ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-ink-100 bg-ink-50/50 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div {...fade} className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_1.2fr]">
            <div>
              <div className="eyebrow">The 45-minute promise</div>
              <h2 className="mt-2 text-3xl font-semibold text-ink-950">One focused session. Enforced in code.</h2>
              <p className="mt-3 text-ink-500">Every lesson is budgeted to 45 minutes or less, including activities and knowledge checks. The limit is checked deterministically after generation and on every edit.</p>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-1.5 font-medium"><Clock className="h-4 w-4 text-brand-500" />Typical allocation</span><span className="text-ink-400">45 min</span></div>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full">
                {[[4, "#322c7f"], [3, "#3a2fa1"], [15, "#5345e3"], [8, "#6461f0"], [7, "#8080f8"], [5, "#a3a8fd"], [3, "#c6cbff"]].map(([m, c], i) => <div key={i} style={{ width: `${((m as number) / 45) * 100}%`, background: c as string }} />)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-ink-500 sm:grid-cols-4">
                {[["Intro", 4], ["Prerequisites", 3], ["Core concepts", 15], ["Worked examples", 8], ["Activity", 7], ["Knowledge check", 5], ["Summary", 3]].map(([t, m]) => <span key={t as string}>{t} · {m}m</span>)}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <motion.div {...fade} className="mx-auto max-w-3xl px-6 text-center">
          <Target className="mx-auto h-8 w-8 text-brand-500" />
          <h2 className="mt-4 text-3xl font-semibold text-ink-950">Ready to build your next lesson?</h2>
          <p className="mt-3 text-ink-500">Start with a sample topic or bring your own objective.</p>
          <Link to="/app/create"><Button size="lg" className="mt-7" icon={<Sparkles className="h-4 w-4" />}>Create Your First Lesson</Button></Link>
        </motion.div>
      </section>

      <footer className="border-t border-ink-100 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-ink-400">
          <Logo />
          <p>Built for the Kalvium technical evaluation - not an official Kalvium product · Research via public search, Open Library and YouTube · AI by Anthropic Claude</p>
        </div>
      </footer>
    </div>
  );
}
