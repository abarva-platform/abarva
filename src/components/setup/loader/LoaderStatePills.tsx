import { COLORS, RADIUS, TYPOGRAPHY } from "@/lib/design/design-tokens";

/**
 * LoaderStatePills — the canonical lifecycle of one preserved upload:
 * Preserved → Parsed → Committed → Indexed → Answerable.
 *
 * Pure presentational. The truth standard forbids collapsing these
 * states into one word, so each is its own pill with its own status.
 * A pill is "done" (calm mint ink), "active" (amber, the one accent
 * that earns the eye), or "pending" (faint ink, not yet reached).
 *
 * Locked design system: cream surfaces, near-black ink, hairline
 * borders, status never a decorative filled chip.
 */

export type LoaderLifecycleStage =
  | "preserved"
  | "parsed"
  | "committed"
  | "indexed"
  | "answerable";

export type LoaderStageStatus = "done" | "active" | "pending";

export const LOADER_LIFECYCLE_STAGES: LoaderLifecycleStage[] = [
  "preserved",
  "parsed",
  "committed",
  "indexed",
  "answerable",
];

const STAGE_LABEL: Record<LoaderLifecycleStage, string> = {
  preserved: "Preserved",
  parsed: "Parsed",
  committed: "Committed",
  indexed: "Indexed",
  answerable: "Answerable",
};

export interface LoaderStatePillsProps {
  /** Status for each lifecycle stage. Omitted stages default to "pending". */
  stages: Partial<Record<LoaderLifecycleStage, LoaderStageStatus>>;
  /** Optional smaller scale for inline use inside table rows. */
  size?: "sm" | "md";
  className?: string;
}

function pillTone(status: LoaderStageStatus): {
  color: string;
  background: string;
  border: string;
  dot: string;
} {
  switch (status) {
    case "done":
      return {
        color: COLORS.mintInk,
        background: COLORS.mintSoft,
        border: `1px solid ${COLORS.mintInk}33`,
        dot: COLORS.mintInk,
      };
    case "active":
      return {
        color: COLORS.amberInk,
        background: COLORS.amberSoft,
        border: `1px solid ${COLORS.amberInk}33`,
        dot: COLORS.amberInk,
      };
    case "pending":
    default:
      return {
        color: `${COLORS.ink}66`,
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}1A`,
        dot: `${COLORS.ink}33`,
      };
  }
}

export function LoaderStatePills({
  stages,
  size = "md",
  className,
}: LoaderStatePillsProps) {
  const small = size === "sm";
  return (
    <div
      className={className}
      role="list"
      aria-label="Upload lifecycle"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: small ? 4 : 6,
        alignItems: "center",
      }}
    >
      {LOADER_LIFECYCLE_STAGES.map((stage) => {
        const status = stages[stage] ?? "pending";
        const tone = pillTone(status);
        return (
          <span
            key={stage}
            role="listitem"
            aria-current={status === "active" ? "step" : undefined}
            title={`${STAGE_LABEL[stage]}: ${status}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: small ? 4 : 6,
              padding: small ? "2px 8px" : "4px 10px",
              borderRadius: RADIUS.pill,
              border: tone.border,
              background: tone.background,
              color: tone.color,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: small ? 11 : 12,
              fontWeight: status === "pending" ? 400 : 500,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
            }}
          >
            <span
              aria-hidden
              style={{
                width: small ? 5 : 6,
                height: small ? 5 : 6,
                borderRadius: RADIUS.pill,
                background: tone.dot,
                flexShrink: 0,
              }}
            />
            {STAGE_LABEL[stage]}
          </span>
        );
      })}
    </div>
  );
}

export default LoaderStatePills;
