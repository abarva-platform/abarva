import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";

/**
 * UnderstandingProgress — the calm "I'm reading your data" moment.
 *
 * Shown between upload and the review table. It does NOT pretend each
 * truth-standard state collapses into one word: it lists the named
 * phases (Preserving → Reading → Mapping → Checking) as state pills,
 * with the active one earning the one accent (amber). Pure
 * presentational; the parent owns the real phase + counts.
 *
 * Locked design system: cream surface, serif display, hairline border.
 */

export type UnderstandingPhase =
  | "preserving"
  | "reading"
  | "mapping"
  | "checking"
  | "done";

export type UnderstandingPhaseStatus = "done" | "active" | "pending";

const PHASE_ORDER: Exclude<UnderstandingPhase, "done">[] = [
  "preserving",
  "reading",
  "mapping",
  "checking",
];

const PHASE_LABEL: Record<Exclude<UnderstandingPhase, "done">, string> = {
  preserving: "Preserving originals",
  reading: "Reading files",
  mapping: "Mapping to dimensions",
  checking: "Checking for issues",
};

export interface UnderstandingProgressProps {
  /** The phase currently in progress. When "done", every pill is complete. */
  phase: UnderstandingPhase;
  /** Files in this understanding batch (for the calm count line). */
  fileCount: number;
  /** Optional plain-language line under the title. */
  detail?: string;
  className?: string;
}

function statusForPhase(
  phase: UnderstandingPhase,
  target: Exclude<UnderstandingPhase, "done">,
): UnderstandingPhaseStatus {
  if (phase === "done") return "done";
  const current = PHASE_ORDER.indexOf(phase as Exclude<UnderstandingPhase, "done">);
  const idx = PHASE_ORDER.indexOf(target);
  if (idx < current) return "done";
  if (idx === current) return "active";
  return "pending";
}

function pillTone(status: UnderstandingPhaseStatus) {
  switch (status) {
    case "done":
      return { color: COLORS.mintInk, background: COLORS.mintSoft, dot: COLORS.mintInk };
    case "active":
      return { color: COLORS.amberInk, background: COLORS.amberSoft, dot: COLORS.amberInk };
    case "pending":
    default:
      return { color: `${COLORS.ink}66`, background: COLORS.white, dot: `${COLORS.ink}33` };
  }
}

export function UnderstandingProgress({
  phase,
  fileCount,
  detail,
  className,
}: UnderstandingProgressProps) {
  const allDone = phase === "done";
  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      style={{
        border: `1px solid ${COLORS.ink}1A`,
        borderRadius: RADIUS.lg,
        background: COLORS.cream,
        padding: "24px 24px 20px",
        fontFamily: TYPOGRAPHY.sans,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          color: COLORS.ink,
          marginBottom: 4,
        }}
      >
        {allDone ? "Here's what I found" : "Understanding your data"}
      </div>
      <div style={{ fontSize: 13, color: `${COLORS.ink}99`, marginBottom: 18 }}>
        {detail ??
          `${fileCount} ${fileCount === 1 ? "file" : "files"} — ${
            allDone ? "ready for your review." : "this takes a moment."
          }`}
      </div>

      <div
        role="list"
        aria-label="Understanding phases"
        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
      >
        {PHASE_ORDER.map((target) => {
          const status = statusForPhase(phase, target);
          const tone = pillTone(status);
          return (
            <span
              key={target}
              role="listitem"
              aria-current={status === "active" ? "step" : undefined}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 12px",
                borderRadius: RADIUS.pill,
                border: `1px solid ${tone.color}33`,
                background: tone.background,
                color: tone.color,
                fontSize: 12,
                fontWeight: status === "pending" ? 400 : 500,
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: RADIUS.pill,
                  background: tone.dot,
                }}
              />
              {PHASE_LABEL[target]}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default UnderstandingProgress;
