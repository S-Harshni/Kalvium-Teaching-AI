import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Verdict } from "./api";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  passed: "Passed",
  passed_with_recommendations: "Passed with recommendations",
  needs_revision: "Needs revision",
};

export const VERDICT_TONE: Record<Verdict, "good" | "warn" | "bad"> = {
  passed: "good", passed_with_recommendations: "warn", needs_revision: "bad",
};

export function download(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}
