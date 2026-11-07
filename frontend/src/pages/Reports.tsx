import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FileCheck2, GraduationCap, ShieldCheck } from "lucide-react";
import { api, type LessonSummary } from "@/lib/api";
import { Alert, Badge, Card, EmptyState, SectionHeader, Spinner } from "@/components/ui";
import { VERDICT_LABEL, VERDICT_TONE } from "@/lib/utils";

export default function Reports() {
  const [lessons, setLessons] = useState<LessonSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api.lessons().then(setLessons).catch((e) => setError(e.message)); }, []);
  const withQc = (lessons ?? []).filter((l) => l.qc_factual || l.qc_instructional);
  const chart = withQc.map((l) => ({ name: l.title.length > 22 ? l.title.slice(0, 21) + "…" : l.title, Factual: l.qc_factual?.score ?? 0, Instructional: l.qc_instructional?.score ?? 0 }));
  return (
    <div className="space-y-6">
      <SectionHeader title="Quality reports" description="Two independent audits per lesson: research & factual accuracy (QC 1) and instructional quality (QC 2). Scores are never combined." />
      {error && <Alert tone="bad">{error}</Alert>}
      {!lessons ? <div className="grid h-40 place-items-center"><Spinner /></div> : withQc.length === 0 ? (
        <EmptyState icon={<FileCheck2 className="h-5 w-5" />} title="No reports yet" description="QC reports are generated automatically after each lesson." />
      ) : (
        <>
          <Card className="p-5">
            <h2 className="font-display text-base font-semibold">Scores by lesson</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} margin={{ left: -20 }}>
                  <CartesianGrid vertical={false} stroke="#eceef6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#646a88" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#8b91ad" }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "#f6f7fb" }} contentStyle={{ borderRadius: 12, border: "1px solid #d9dcea", fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Factual" fill="#5345e3" radius={[6, 6, 0, 0]} barSize={22} />
                  <Bar dataKey="Instructional" fill="#a3a8fd" radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="divide-y divide-ink-100 overflow-hidden">
            {withQc.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1"><Link to={`/app/lessons/${l.id}`} className="text-sm font-medium text-ink-900 hover:text-brand-700">{l.title}</Link>
                  {l.demo && <span className="ml-2 text-xs text-amber-600">demo</span>}</div>
                {l.qc_factual && <Badge tone={VERDICT_TONE[l.qc_factual.verdict]} icon={<ShieldCheck className="h-3 w-3" />}>QC1 {l.qc_factual.score} · {VERDICT_LABEL[l.qc_factual.verdict]}</Badge>}
                {l.qc_instructional && <Badge tone={VERDICT_TONE[l.qc_instructional.verdict]} icon={<GraduationCap className="h-3 w-3" />}>QC2 {l.qc_instructional.score} · {VERDICT_LABEL[l.qc_instructional.verdict]}</Badge>}
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
}
