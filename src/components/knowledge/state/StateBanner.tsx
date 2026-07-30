/**
 * One visual language for every "this cannot be shown as fact yet" moment in
 * the Knowledge UI -- blocked / restricted / stale / not-loaded / conflicting
 * / withheld / not-measured / not-assessed all render through this component
 * so a user learns the pattern once. Per AGENTS.md: missing is never zero,
 * uncertified is never clean, restricted evidence is never exposed.
 */
import type { GateDecision, GateTone } from "./gate-utils";

const TONE_STYLES: Record<
  GateTone,
  { border: string; bg: string; dot: string; text: string }
> = {
  blocked: {
    border: "border-[rgba(163,45,45,0.28)]",
    bg: "bg-[rgba(163,45,45,0.06)]",
    dot: "bg-[#a32d2d]",
    text: "text-[#a32d2d]",
  },
  restricted: {
    border: "border-[rgba(163,45,45,0.28)]",
    bg: "bg-[rgba(163,45,45,0.06)]",
    dot: "bg-[#a32d2d]",
    text: "text-[#a32d2d]",
  },
  stale: {
    border: "border-[rgba(186,117,23,0.3)]",
    bg: "bg-[rgba(186,117,23,0.1)]",
    dot: "bg-[#ba7517]",
    text: "text-[#ba7517]",
  },
  gap: {
    border: "border-[rgba(163,45,45,0.28)]",
    bg: "bg-[rgba(163,45,45,0.06)]",
    dot: "bg-[#a32d2d]",
    text: "text-[#a32d2d]",
  },
  candidate: {
    border: "border-[rgba(186,117,23,0.3)]",
    bg: "bg-[rgba(186,117,23,0.1)]",
    dot: "bg-[#ba7517]",
    text: "text-[#ba7517]",
  },
  neutral: {
    border: "border-[rgba(10,10,11,0.14)]",
    bg: "bg-[rgba(10,10,11,0.04)]",
    dot: "bg-[#888780]",
    text: "text-[#5f5e5a]",
  },
};

export interface StateBannerProps {
  readonly decision: Pick<GateDecision, "tone" | "title" | "body">;
  /** What is missing, named specifically -- e.g. the failing gap/owner/due date,
   * rendered as a secondary line under `body`. Optional. */
  readonly detail?: string;
  readonly compact?: boolean;
  readonly action?: { readonly label: string; readonly onClick: () => void };
  readonly "data-testid"?: string;
}

export function StateBanner({
  decision,
  detail,
  compact = false,
  action,
  "data-testid": testId,
}: StateBannerProps) {
  const style = TONE_STYLES[decision.tone];
  return (
    <div
      role="status"
      data-testid={testId ?? "knowledge-state-banner"}
      data-knowledge-state-tone={decision.tone}
      className={`flex items-start gap-2.5 rounded-md border ${style.border} ${style.bg} ${
        compact ? "px-3 py-2" : "px-4 py-3"
      }`}
    >
      <span
        className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${style.dot}`}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${style.text}`}>{decision.title}</p>
        {decision.body ? (
          <p className="mt-0.5 text-sm leading-snug text-[#5f5e5a]">
            {decision.body}
          </p>
        ) : null}
        {detail ? (
          <p className="mt-0.5 text-sm leading-snug text-[#5f5e5a]">{detail}</p>
        ) : null}
        {action ? (
          <button
            type="button"
            onClick={action.onClick}
            className="mt-1.5 text-sm font-medium text-[#0066CC] underline decoration-[rgba(0,102,204,0.4)] underline-offset-2 hover:decoration-[#0066CC]"
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** A small inline badge form for use next to a value that IS rendering but is
 * marked stale/candidate -- distinct from the full StateBanner used when
 * nothing renders at all. Keeps "stale data is visibly marked, not silently
 * shown fresh" cheap to add anywhere a value is drawn. */
export function StateBadge({
  tone,
  label,
}: {
  readonly tone: GateTone;
  readonly label: string;
}) {
  const style = TONE_STYLES[tone];
  return (
    <span
      data-knowledge-state-tone={tone}
      className={`inline-flex items-center gap-1 rounded-full border ${style.border} ${style.bg} px-2 py-0.5 text-xs font-medium ${style.text}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
