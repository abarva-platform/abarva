// Companion Canvas — the structured right-hand "decision companion" that
// renders beside every Intelligence answer.
//
// Context: the synthesizer already forces every rich-text answer to author
// five right-canvas tabs (Decision · Industry Insights · Chart · Table ·
// Evidence) via `<<<TAB: label | grounding: X>>>` markers, and to include a
// governed `abarva-canvas` payload. Historically that structure streamed to
// the client as one prose blob and nothing rendered the native exhibit.
//
// This module defines the TYPED contract for the companion canvas so the
// server can emit it as a structured `canvas` event and the client can render
// it as a real five-tab panel with an honesty model (per-tile state +
// provenance), instead of flattening it into prose.
//
// The honesty model is the point: a tile may legally have NO value. Absence is
// a first-class, renderable state ("we are not instrumented here — load X"),
// never a fabricated number.

export type Provenance =
  | "enterprise-evidence"
  | "industry-context"
  | "inference";

export type SignalState =
  | "measured" // tenant evidence carries the value
  | "benchmark" // no tenant value; an industry range stands in
  | "expected_uncaptured" // metric governs the decision but isn't instrumented
  | "none"; // nothing relevant to show

export interface SignalTile {
  label: string;
  state: SignalState;
  /** OPTIONAL — omit when unmeasured. Never fabricate a tenant number. */
  value?: string;
  /** Trend / benchmark note / "no benchmark available". */
  context?: string;
  provenance: Provenance;
  /** REQUIRED even when `value` is absent — this is what keeps a gap useful. */
  whyItMatters: string;
  /** What to ingest to light this up → Source hook. */
  loadHint?: string;
}

/** Native exhibit vocabulary. The renderer switches on `canvasType`. */
export type CompanionExhibit =
  | {
      canvasType: "investmentSequencingMap";
      unverified?: boolean;
      items: Array<{
        label: string;
        band: "scale_now" | "certify_then_scale" | "fund_readiness" | "hold_discovery";
        value?: string;
        readiness?: string;
        provenance: Provenance;
      }>;
    }
  | {
      canvasType: "valueReadinessMatrix";
      unverified?: boolean;
      axes: { x: string; y: string };
      points: Array<{
        label: string;
        value: number; // 0-100
        readiness: number; // 0-100
        provenance: Provenance;
      }>;
    }
  | {
      canvasType: "gateToValueRoadmap";
      unverified?: boolean;
      gates: Array<{
        label: string;
        prerequisite: string;
        unlocks: string;
        provenance: Provenance;
      }>;
    }
  | {
      canvasType: "proofBoundary";
      unverified?: boolean;
      dimensions: Array<{
        label: string;
        status: "proven" | "partial" | "unproven" | "uncaptured";
        note: string;
        provenance: Provenance;
      }>;
    };

export const COMPANION_CANVAS_TYPES: ReadonlyArray<CompanionExhibit["canvasType"]> = [
  "investmentSequencingMap",
  "valueReadinessMatrix",
  "gateToValueRoadmap",
  "proofBoundary",
];

export interface CompanionDecisionView {
  judgment: string; // fund / hold / certify / stop / investigate / escalate
  tradeoff: string;
  owner?: string;
  consequenceOfWaiting: string;
}

export interface CompanionIndustryContext {
  note: string;
  /** Ranges, never fake decimals. */
  series?: Array<{ label: string; range: string }>;
}

export interface CompanionNextMove {
  action: string;
  owner?: string;
  unlocks: string;
  moveHref?: string;
}

/**
 * The five lenses, aligned to the synthesizer's existing tab taxonomy:
 *   Evidence         → `evidence` (the SignalTile honesty ladder)
 *   Decision         → `decision`
 *   Chart            → `visual` (the native exhibit / "the picture")
 *   Industry Insights→ `industryContext`
 *   Table/Next steps → `nextMoves`
 */
export interface CompanionCanvasTabs {
  evidence: SignalTile[];
  decision: CompanionDecisionView;
  visual: CompanionExhibit | null;
  industryContext: CompanionIndustryContext;
  nextMoves: CompanionNextMove[];
}

export type CompanionLensKey = keyof CompanionCanvasTabs;

export const COMPANION_LENS_ORDER_DEFAULT: ReadonlyArray<CompanionLensKey> = [
  "evidence",
  "decision",
  "visual",
  "industryContext",
  "nextMoves",
];

export interface CompanionCanvasPayload {
  /** Dynamic order — thin-tenant turns lead with industryContext + visual. */
  lensOrder: CompanionLensKey[];
  tabs: CompanionCanvasTabs;
  meta: {
    canvasType: CompanionExhibit["canvasType"] | null;
    /** True when the panel is majority inference → renderer shows a band. */
    unverified: boolean;
    /** True when tenant evidence is thin → Evidence reads as an agenda. */
    tenantThin: boolean;
    generatedAt?: string;
  };
}

/** Human labels + skeleton copy for each lens (client reuse). */
export const COMPANION_LENS_META: Record<
  CompanionLensKey,
  { label: string; skeleton: string }
> = {
  evidence: { label: "Signals", skeleton: "Sorting measured from missing…" },
  decision: { label: "Decision", skeleton: "Framing the executive call…" },
  visual: { label: "The picture", skeleton: "Choosing the clearest view…" },
  industryContext: { label: "Industry", skeleton: "Pulling field context…" },
  nextMoves: { label: "Next moves", skeleton: "Lining up adjacent moves…" },
};

/** Lens order given tenant-evidence density (guardrail from the pressure test). */
export function computeLensOrder(tenantThin: boolean): CompanionLensKey[] {
  if (tenantThin) {
    return ["industryContext", "visual", "evidence", "decision", "nextMoves"];
  }
  return [...COMPANION_LENS_ORDER_DEFAULT];
}

/** True when the Evidence lens is majority uncaptured/none → thin tenant. */
export function isTenantThin(tiles: SignalTile[]): boolean {
  if (tiles.length === 0) return true;
  const thin = tiles.filter(
    (t) => t.state === "expected_uncaptured" || t.state === "none",
  ).length;
  return thin / tiles.length >= 0.5;
}
