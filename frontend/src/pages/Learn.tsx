import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLesson } from "@/lib/useLesson";
import { LessonPreview } from "@/components/LessonPreview";
import { Logo } from "@/components/AppShell";
import { Alert, Spinner } from "@/components/ui";

/** Full-page, distraction-free student view. */
export default function Learn() {
  const { id } = useParams();
  const { lesson, error } = useLesson(id);
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Logo />
          {lesson && <Link to={`/app/lessons/${lesson.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800"><ArrowLeft className="h-3.5 w-3.5" />Back to editor</Link>}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        {error && <Alert tone="bad">{error}</Alert>}
        {!lesson && !error && <div className="grid h-64 place-items-center"><Spinner className="h-6 w-6" /></div>}
        {lesson && !lesson.content && <Alert tone="info">This lesson has not been generated yet.</Alert>}
        {lesson?.content && <LessonPreview content={lesson.content} demo={lesson.demo} />}
      </main>
    </div>
  );
}
