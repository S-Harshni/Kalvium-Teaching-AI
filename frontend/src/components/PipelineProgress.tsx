import { motion } from "framer-motion";
import { AlertTriangle, Check, Circle, Loader2, RotateCcw } from "lucide-react";
import type { PipelineStep } from "@/lib/api";
import { Button } from "./ui";
import { cn } from "@/lib/utils";

function elapsed(s: PipelineStep): string {
  if (!s.started_at) return "";
  const end = s.finished_at ? new Date(s.finished_at).getTime() : Date.now();
  const sec = Math.max(0, Math.round((end - new Date(s.started_at).getTime()) / 1000));
  return sec >= 60 ? `${Math.floor(sec / 60)}m ${sec % 60}s` : `${sec}s`;
}

/** Shows the persisted backend step states - a step is only "done" once its output is saved. */
export function PipelineProgress({ steps, onRetry, retrying, compact }: {
  steps: PipelineStep[]; onRetry?: () => void; retrying?: boolean; compact?: boolean;
}) {
  const done = steps.filter((s) => s.status === "done").length;
  const failed = steps.some((s) => s.status === "failed");
  return (
    <div>
      {!compact && (
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="text-sm text-ink-500"><span className="font-semibold text-ink-900">{done}</span> of {steps.length} steps complete</div>
          {failed && onRetry && (
            <Button size="sm" variant="secondary" icon={<RotateCcw className="h-3.5 w-3.5" />} loading={retrying} onClick={onRetry}>
              Retry failed steps
            </Button>
          )}
        </div>
      )}
      <ol className="relative space-y-1">
        {steps.map((s, i) => (
          <li key={s.key} className="relative flex gap-3.5 pb-4 last:pb-0">
            {i < steps.length - 1 && (
              <span className={cn("absolute left-[13px] top-7 h-[calc(100%-20px)] w-px", s.status === "done" ? "bg-brand-300" : "bg-ink-200")} />
            )}
            <span className={cn("relative z-10 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ring-4 ring-white",
              s.status === "done" && "bg-brand-600 text-white",
              s.status === "running" && "bg-brand-50 text-brand-600 ring-brand-50",
              s.status === "failed" && "bg-rose-100 text-rose-600",
              s.status === "pending" && "bg-ink-100 text-ink-400",
              s.status === "skipped" && "bg-ink-100 text-ink-400")}>
              {s.status === "done" ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> :
                s.status === "running" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                  s.status === "failed" ? <AlertTriangle className="h-3.5 w-3.5" /> : <Circle className="h-2 w-2 fill-current" />}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center justify-between gap-3">
                <span className={cn("text-sm font-medium", s.status === "pending" ? "text-ink-400" : "text-ink-900")}>
                  <span className="mr-1.5 text-ink-300">{i + 1}.</span>{s.label}
                </span>
                <span className="text-[11px] tabular-nums text-ink-400">{elapsed(s)}</span>
              </div>
              {s.detail && s.status !== "failed" && (
                <motion.p initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} className="mt-0.5 text-[12.5px] text-ink-500">
                  {s.detail}
                </motion.p>
              )}
              {s.error && <p className="mt-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[12.5px] text-rose-700">{s.error}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
