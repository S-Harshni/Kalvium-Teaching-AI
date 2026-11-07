import { useCallback, useEffect, useRef, useState } from "react";
import { api, type Lesson } from "./api";

/** Loads a lesson and polls while any backend step is running (progress = persisted step state). */
export function useLesson(id: string | undefined) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number>();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const l = await api.lesson(id);
      setLesson(l);
      setError(null);
      return l;
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const l = await load();
      if (!alive) return;
      const busy = l && (l.running || l.pipeline.steps.some((s) => s.status === "running"));
      timer.current = window.setTimeout(tick, busy ? 1500 : l ? 15000 : 4000);
    };
    tick();
    return () => { alive = false; window.clearTimeout(timer.current); };
  }, [load]);

  // Restart fast polling right after the user triggers an action.
  const refresh = useCallback(async () => {
    window.clearTimeout(timer.current);
    const l = await load();
    const busy = l && (l.running || l.pipeline.steps.some((s) => s.status === "running"));
    if (busy) {
      const tick = async () => {
        const x = await load();
        const b = x && (x.running || x.pipeline.steps.some((s) => s.status === "running"));
        timer.current = window.setTimeout(tick, b ? 1500 : 15000);
      };
      timer.current = window.setTimeout(tick, 1500);
    }
    return l;
  }, [load]);

  return { lesson, setLesson, error, refresh };
}
