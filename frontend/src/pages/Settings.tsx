import { Bot, BookOpen, Globe, PlayCircle, ShieldCheck } from "lucide-react";
import { useStatus } from "@/components/AppShell";
import { Badge, Card, SectionHeader, Spinner } from "@/components/ui";

export default function Settings() {
  const status = useStatus();
  if (!status) return <div className="grid h-40 place-items-center"><Spinner /></div>;
  const rows = [
    { icon: Bot, label: "AI model", value: status.demo_only ? "Demo mode (no provider)" : `${status.llm_provider} · ${status.llm_model}`, live: !status.demo_only },
    { icon: Globe, label: "Web search", value: status.web_search ?? "Not available in demo mode", live: !!status.web_search },
    { icon: BookOpen, label: "Book catalog", value: status.books, live: true },
    { icon: PlayCircle, label: "YouTube videos", value: status.videos, live: true },
  ];
  return (
    <div className="space-y-6">
      <SectionHeader title="Settings" description="Providers are configured on the server through environment variables - API keys are never sent to the browser." />
      <Card className="divide-y divide-ink-100">
        {rows.map(({ icon: Icon, label, value, live }) => (
          <div key={label} className="flex items-center gap-4 px-5 py-4">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-4 w-4" /></div>
            <div className="flex-1"><div className="text-sm font-medium text-ink-900">{label}</div><div className="text-xs text-ink-500">{value}</div></div>
            <Badge tone={live ? "good" : "warn"}>{live ? "active" : "inactive"}</Badge>
          </div>
        ))}
      </Card>
      <Card className="p-5">
        <h2 className="font-display text-base font-semibold">Configuring providers</h2>
        <p className="mt-1 text-sm text-ink-500">Copy <code className="rounded bg-ink-100 px-1">.env.example</code> to <code className="rounded bg-ink-100 px-1">.env</code> in the project root and restart the backend.</p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-ink-900 p-4 font-mono text-[12.5px] leading-relaxed text-ink-100">{`LLM_PROVIDER=auto            # auto | anthropic | claude_cli | demo
ANTHROPIC_API_KEY=sk-ant-...  # enables Claude API (+ Claude web search)
ANTHROPIC_MODEL=claude-opus-5-5
TAVILY_API_KEY=               # optional: preferred web search
YOUTUBE_API_KEY=              # optional: YouTube Data API v3
GOOGLE_BOOKS_API_KEY=         # optional: Google Books (else Open Library)`}</pre>
      </Card>
      <Card className="p-5">
        <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-600" /><h2 className="font-display text-base font-semibold">Demo samples</h2></div>
        <p className="mt-1 text-sm text-ink-500">Recorded outputs from real live runs, replayed in demo mode and always labelled as samples.</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {status.demo_samples.map((s) => <li key={s.slug} className="text-ink-700">• {s.title} <span className="text-xs text-ink-400">recorded {s.recorded_at}</span></li>)}
          {status.demo_samples.length === 0 && <li className="text-ink-400">No recorded samples found.</li>}
        </ul>
      </Card>
    </div>
  );
}
