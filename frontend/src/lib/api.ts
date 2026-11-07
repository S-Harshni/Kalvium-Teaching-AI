// Typed client for the FastAPI backend. All requests go through /api (proxied by Vite in dev).

export type Severity = "critical" | "high" | "medium" | "low";
export type Verdict = "passed" | "passed_with_recommendations" | "needs_revision";

export interface LessonSettings {
  audience: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  teaching_style: "balanced" | "conversational" | "socratic" | "hands-on";
  lesson_format: "self-paced" | "instructor-led";
}

export interface Source {
  id: string; title: string; url: string;
  source_type: "standard" | "documentation" | "website" | "encyclopedia" | "book" | "video" | "academic";
  author?: string | null; publisher?: string | null; published?: string | null; description: string;
  relevance: number; relevance_note: string; reliability: "high" | "medium" | "low"; reliability_note: string;
  status: "verified" | "unverified" | "failed"; verification_note: string; provider: string;
  video_id?: string | null; channel?: string | null; duration?: string | null; thumbnail?: string | null; isbn?: string | null;
}

export interface Section { id: string; kind: string; title: string; minutes: number; content: string }
export interface KnowledgeCheck {
  id: string; question: string; type: "mcq" | "true_false" | "short_answer"; options: string[];
  answer: string; explanation: string; objective_part: string;
}
export interface ResourceLink { title: string; url: string; note: string; source_id?: string | null }
export interface LessonContent {
  title: string; objective: string; overview: string; learning_objectives: string[];
  audience: string; difficulty: string; sections: Section[]; knowledge_checks: KnowledgeCheck[];
  videos: ResourceLink[]; references: ResourceLink[];
}

export interface QCIssue {
  id: string; severity: Severity; category: string; section_id?: string | null; location: string;
  problem: string; why: string; evidence: string; source_ids: string[]; original_text: string;
  suggested_text: string; status: "open" | "applied" | "rejected" | "conflict"; status_note: string;
}
export interface ScoreLine { label: string; value: number; weight?: number | null; detail: string }
export interface ClaimCheck {
  id: string; claim: string; section_id?: string | null;
  verdict: "supported" | "partially_supported" | "unsupported" | "contradicted";
  evidence_quote: string; source_ids: string[]; note: string;
}
export interface FactualReport {
  layer: "factual"; score: number; verdict: Verdict; summary: string; methodology: string;
  score_breakdown: ScoreLine[]; claims: ClaimCheck[];
  source_assessment: { source_id: string; title: string; reliability: string; relevance: number; status: string; cited_in_lesson: boolean; note: string }[];
  issues: QCIssue[]; research_gaps: string[]; generated_at: string; lesson_revision: number; provider: string; demo: boolean;
}
export interface InstructionalReport {
  layer: "instructional"; score: number; verdict: Verdict; summary: string; methodology: string;
  rubric: { criterion: string; score: number; note: string }[];
  objective_coverage: { objective_part: string; coverage: "full" | "partial" | "missing"; where: string; note: string }[];
  clarity: string; example_quality: string; activity_quality: string; assessment_quality: string;
  missing_concepts: string[]; restructuring: string[];
  timing: { total_minutes: number; limit_minutes: number; compliant: boolean; per_section: ScoreLine[]; note: string };
  issues: QCIssue[]; generated_at: string; lesson_revision: number; provider: string; demo: boolean;
}

export interface PipelineStep {
  key: string; label: string; status: "pending" | "running" | "done" | "failed" | "skipped";
  started_at?: string | null; finished_at?: string | null; detail: string; error: string;
}

export interface Lesson {
  id: string; title: string; objective: string; settings: LessonSettings;
  status: "generating" | "failed" | "review" | "finalized"; demo: boolean; revision: number;
  edited_by_instructor: boolean; created_at: string; updated_at: string; running: boolean;
  analysis?: { key_concepts: string[]; objective_parts: string[]; expected_facts: string[]; topic_summary: string } | null;
  research?: { queries: string[]; sources: Source[]; notes: string[]; evidence_count: number; demo?: boolean } | null;
  content?: LessonContent | null;
  qc_factual?: FactualReport | null;
  qc_instructional?: InstructionalReport | null;
  pipeline: { status: "idle" | "running" | "done" | "failed"; steps: PipelineStep[] };
}

export interface LessonSummary {
  id: string; title: string; objective: string; status: Lesson["status"]; demo: boolean; revision: number;
  created_at: string; updated_at: string; edited_by_instructor: boolean; total_minutes: number | null;
  pipeline_status: string | null; source_count: number; running: boolean;
  qc_factual: { score: number; verdict: Verdict; lesson_revision: number } | null;
  qc_instructional: { score: number; verdict: Verdict; lesson_revision: number } | null;
}

export interface Status {
  llm_provider: string; llm_model: string | null; web_search: string | null; books: string; videos: string;
  demo_only: boolean; demo_samples: { slug: string; title: string; objective: string; recorded_at: string }[];
  max_lesson_minutes: number;
}

export class ApiError extends Error {
  constructor(message: string, public status: number, public fields?: Record<string, string>) { super(message); }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, { headers: { "Content-Type": "application/json" }, ...init });
  } catch {
    throw new ApiError("Cannot reach the Kalvium Teaching AI server. Check that the backend is running, then try again.", 0);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const d = body?.detail;
    const msg = typeof d === "string" ? d : d?.message ?? `Request failed (${res.status})`;
    throw new ApiError(msg, res.status, typeof d === "object" ? d?.fields : undefined);
  }
  return body as T;
}

export const api = {
  status: () => req<Status>("/status"),
  lessons: () => req<LessonSummary[]>("/lessons"),
  lesson: (id: string) => req<Lesson>(`/lessons/${id}`),
  create: (data: { title: string; objective: string; settings: LessonSettings; demo: boolean }) =>
    req<Lesson>("/lessons", { method: "POST", body: JSON.stringify(data) }),
  patch: (id: string, data: { status?: string; title?: string }) =>
    req<Lesson>(`/lessons/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => req<void>(`/lessons/${id}`, { method: "DELETE" }),
  saveContent: (id: string, content: LessonContent, base_revision: number) =>
    req<{ revision: number; updated_at: string; total_minutes: number }>(`/lessons/${id}/content`, {
      method: "PUT", body: JSON.stringify({ content, base_revision }),
    }),
  retry: (id: string) => req<Lesson>(`/lessons/${id}/retry`, { method: "POST" }),
  runStep: (id: string, key: string) => req<Lesson>(`/lessons/${id}/steps/${key}/run`, { method: "POST" }),
  issue: (id: string, layer: "factual" | "instructional", issueId: string, action: "apply" | "reject" | "reopen") =>
    req<{ issue: QCIssue; lesson: Lesson }>(`/lessons/${id}/qc/${layer}/issues/${issueId}/${action}`, { method: "POST", body: "{}" }),
  versions: (id: string) => req<{ id: number; revision: number; reason: string; created_at: string }[]>(`/lessons/${id}/versions`),
  saveVersion: (id: string, reason: string) => req(`/lessons/${id}/versions`, { method: "POST", body: JSON.stringify({ reason }) }),
  restoreVersion: (id: string, vid: number) => req<Lesson>(`/lessons/${id}/versions/${vid}/restore`, { method: "POST" }),
  events: (id: string) => req<{ step: string; level: string; message: string; created_at: string }[]>(`/lessons/${id}/events`),
  resources: () => req<(Source & { lesson_id: string; lesson_title: string; demo: boolean })[]>("/resources"),
  exportUrl: (id: string, kind: string, format: "md" | "pdf" | "json") => `/api/lessons/${id}/export/${kind}?format=${format}`,
};
