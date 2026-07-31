import type { ReactNode } from "react";

interface GovernedStatePanelProps {
  readonly title: string;
  readonly body: string;
  readonly eyebrow?: string;
  readonly detail?: string;
  readonly compact?: boolean;
  readonly children?: ReactNode;
  readonly "data-testid"?: string;
}

export function GovernedStatePanel({
  title,
  body,
  eyebrow = "Governed state",
  detail,
  compact = false,
  children,
  "data-testid": testId,
}: GovernedStatePanelProps) {
  return (
    <section
      role="status"
      data-testid={testId ?? "knowledge-governed-state-panel"}
      data-knowledge-state-tone="governed"
      className={`rounded-md border border-[rgba(32,93,141,0.22)] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(244,249,252,0.82))] shadow-[0_16px_40px_rgba(12,26,58,0.06)] ${
        compact ? "px-4 py-3" : "px-5 py-4"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#205d8d]"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#607286]">
            {eyebrow}
          </p>
          <p className="mt-1 text-sm font-semibold text-[#10243d]">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-[#4f5e6c]">{body}</p>
          {detail ? (
            <p className="mt-2 border-l-2 border-[rgba(32,93,141,0.25)] pl-3 text-sm leading-relaxed text-[#607286]">
              {detail}
            </p>
          ) : null}
          {children ? <div className="mt-3">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
