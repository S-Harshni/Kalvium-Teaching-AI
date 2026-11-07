import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

/** Renders lesson Markdown; inline citations like [S3] become small superscript badges. */
export function Markdown({ children, className }: { children: string; className?: string }) {
  const text = (children || "").replace(/\[(S\d+(?:\s*[,;]\s*S\d+)*)\]/g, (_m, ids: string) => ` \`cite:${ids.replace(/\s/g, "")}\``);
  return (
    <div className={cn("prose-lesson", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ children, className: cls, ...props }) {
            const value = String(children);
            if (!cls && value.startsWith("cite:")) {
              return (
                <sup className="ml-0.5 rounded bg-brand-50 px-1 py-px font-sans text-[10px] font-semibold text-brand-700 ring-1 ring-brand-100">
                  {value.slice(5).replace(/[,;]/g, ", ")}
                </sup>
              );
            }
            return <code className={cls} {...props}>{children}</code>;
          },
          a: ({ children, ...props }) => <a {...props} target="_blank" rel="noreferrer">{children}</a>,
          table: ({ children }) => <div className="overflow-x-auto"><table>{children}</table></div>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
