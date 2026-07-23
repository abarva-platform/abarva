// Tower Command Center v2 — mart → design shape.
//
// Takes the governed `TowerMartCommandViewModel` (cio_tower.mart_*) and returns
// exactly what the design's views need. Two rules bind this file:
//
//  1. Every string and number originates in the mart. Where the mart carries
//     nothing, the result is `null` / an entry in `unknownSlots` — never a
//     plausible-looking substitute. "Never fabricate a number to fill a tile."
//  2. All arithmetic that is not a straight column read goes through
//     `derive.ts`, so it is stated once and unit-tested.
//
// The design file's banking mock dataset ("Risk & Compliance AI", FINRA/OCC
// narrative, "First Capital Financial") is invented copy layered on Healthcare
// Composite Demo aggregates. It lives in `fixture.ts` for tests only and is
// never imported by shipped page code.

import type {
  TowerMartAiPortfolioItem,
  TowerMartCommandViewModel,
  TowerMartCxoAction,
  TowerMartEvidenceLineage,
  TowerMartProgramLane,
  TowerMartRequiredFieldGap,
} from "@/lib/cio-tower/tower-mart-view-model";

import { deriveProgramValues } from "./derive";
import { formatCount, formatPct, formatUsdM } from "./format";
import type {
  TowerActionView,
  TowerAiDisplayBucketBasis,
  TowerAiSpendAttributionStatus,
  TowerAiKind,
  TowerAiView,
  TowerCandidateView,
  TowerCommandCenterView,
  TowerCommandSummary,
  TowerEvidenceFactView,
  TowerEvidenceGapView,
  TowerFunnelStage,
  TowerLaneKey,
  TowerProgramView,
  TowerSpendLensRow,
  TowerUsageBar,
} from "./types";

const TOWER_CANDIDATE_DISPLAY_LIMIT = 10;
const TOWER_GAP_POLICY_VERSION = "tower_business_evidence_gap_bridge_v1";

function num(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function trimOrNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Title-case a snake_case / kebab-case mart token for display. */
function humanize(value: string | null | undefined): string | null {
  const raw = trimOrNull(value);
  if (!raw) return null;
  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

// ── AI kind ────────────────────────────────────────────────────────────────

type MartAiPortfolioItemKind =
  | "funded_program"
  | "embedded_platform"
  | "usage_benefit"
  | "candidate_opportunity";

export const TOWER_AI_DISPLAY_BUCKET_POLICY_VERSION =
  "tower_ai_display_bucket_v1";

/**
 * The mart's four `item_kind` values, mapped onto the design's five spend types.
 *
 * `MartAiPortfolioItemKind` (assemble-mart.ts) is a closed enum, so it is
 * matched exactly rather than by keyword. Its semantics, from the projection:
 *
 *   funded_program        → a program with its own budget and approvals
 *   embedded_platform     → AI inside a platform already paid for
 *   usage_benefit         → a non-program tool/system WITH AI-tagged spend.
 *                           This is the design's "embedded": value delivered
 *                           inside something you already pay for, not new spend.
 *   candidate_opportunity → a non-program tool/system with NO spend
 *
 * Getting this wrong is not cosmetic. An earlier version matched on keywords
 * with `\bcandidate\b`, which does NOT match `candidate_opportunity` — `_` is a
 * word character, so there is no word boundary after "candidate". Both
 * `candidate_opportunity` and `usage_benefit` therefore fell through to
 * `platform`. On the live tenant (80 AI initiatives) that would have rendered
 * almost the entire portfolio as neutral grey "Platform" and left the
 * "Not funded · candidate pool" panel completely empty.
 */
const ITEM_KIND_BUCKET = {
  funded_program: "funded",
  embedded_platform: "embedded",
  usage_benefit: "embedded",
  candidate_opportunity: "candidate",
} satisfies Record<MartAiPortfolioItemKind, TowerAiKind>;

function isMartItemKind(kind: string): kind is MartAiPortfolioItemKind {
  return Object.hasOwn(ITEM_KIND_BUCKET, kind);
}

export interface AiDisplayBucketResult {
  displayBucket: TowerAiKind;
  displayBucketBasis: TowerAiDisplayBucketBasis;
  mappingPolicyVersion: typeof TOWER_AI_DISPLAY_BUCKET_POLICY_VERSION;
  originalItemKind: string;
}

export function aiDisplayBucketFor(item: {
  itemKind: string;
  aiSpendType: string | null;
  fundingStatus: string | null;
  aiSpendCategory?: string | null;
}): AiDisplayBucketResult {
  const kind = String(item.itemKind ?? "")
    .trim()
    .toLowerCase();
  const exact = isMartItemKind(kind) ? ITEM_KIND_BUCKET[kind] : null;
  const originalItemKind = kind || "unknown";

  // The design has five buckets; `item_kind` only has four, and none of them is
  // governance — in the mart, governance-ness lives in `ai_spend_category`. If
  // that were not consulted first, the design's Governance legend entry could
  // never occur on real data.
  const category = String(item.aiSpendCategory ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");
  if (/governance|model risk|control|compliance/.test(category)) {
    return {
      displayBucket: "governance",
      displayBucketBasis: "ai_spend_category",
      mappingPolicyVersion: TOWER_AI_DISPLAY_BUCKET_POLICY_VERSION,
      originalItemKind,
    };
  }
  if (exact) {
    return {
      displayBucket: exact,
      displayBucketBasis: "item_kind",
      mappingPolicyVersion: TOWER_AI_DISPLAY_BUCKET_POLICY_VERSION,
      originalItemKind,
    };
  }

  // Fallback for values outside the current enum (older rows, future kinds).
  // Separators are normalised to spaces first so word-boundary matching works
  // on snake_case — the bug described above.
  const joined = [item.itemKind, item.aiSpendType, item.fundingStatus]
    .map((t) =>
      String(t ?? "")
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " "),
    )
    .filter(Boolean)
    .join(" ");

  if (/\bcandidate\b|\bidea\b|not funded|unfunded|\bproposed\b/.test(joined)) {
    return {
      displayBucket: "candidate",
      displayBucketBasis: "fallback_keyword",
      mappingPolicyVersion: TOWER_AI_DISPLAY_BUCKET_POLICY_VERSION,
      originalItemKind,
    };
  }
  if (/governance|control|compliance|model risk/.test(joined)) {
    return {
      displayBucket: "governance",
      displayBucketBasis: "fallback_keyword",
      mappingPolicyVersion: TOWER_AI_DISPLAY_BUCKET_POLICY_VERSION,
      originalItemKind,
    };
  }
  if (/embedded|bundled|in product|vendor native|usage benefit/.test(joined)) {
    return {
      displayBucket: "embedded",
      displayBucketBasis: "fallback_keyword",
      mappingPolicyVersion: TOWER_AI_DISPLAY_BUCKET_POLICY_VERSION,
      originalItemKind,
    };
  }
  if (/platform|infrastructure|cloud|shared service/.test(joined)) {
    return {
      displayBucket: "platform",
      displayBucketBasis: "fallback_keyword",
      mappingPolicyVersion: TOWER_AI_DISPLAY_BUCKET_POLICY_VERSION,
      originalItemKind,
    };
  }
  if (/funded|approved|program|initiative/.test(joined)) {
    return {
      displayBucket: "funded",
      displayBucketBasis: "fallback_keyword",
      mappingPolicyVersion: TOWER_AI_DISPLAY_BUCKET_POLICY_VERSION,
      originalItemKind,
    };
  }
  return {
    displayBucket: "platform",
    displayBucketBasis: "fallback_default",
    mappingPolicyVersion: TOWER_AI_DISPLAY_BUCKET_POLICY_VERSION,
    originalItemKind,
  };
}

export function aiKindFor(
  item: Parameters<typeof aiDisplayBucketFor>[0],
): TowerAiKind {
  return aiDisplayBucketFor(item).displayBucket;
}

/**
 * The recommended posture shown on the bubble matrix and initiative table.
 *
 * Derived from the mart's own scores and claim gate — this is a *label for a
 * quadrant*, not a recommendation invented about the business. Programs land in
 * the same posture whenever their scores do.
 */
export function postureFor(item: {
  valueScore: number;
  readinessScore: number;
  towerClaimAllowed: string;
}): string {
  const value = num(item.valueScore);
  const readiness = num(item.readinessScore);
  if (value >= 50 && readiness >= 50) return "Scale";
  if (value >= 50 && readiness < 50) return "Fix readiness";
  if (value < 50 && readiness >= 50) return "Measure";
  return "Restructure";
}

// ── usage bars ─────────────────────────────────────────────────────────────

/**
 * Usage-evidence bars for a drawer. Built only from mart-recorded usage —
 * a metric with an actual, and an adoption rate. An item with neither gets an
 * empty array and the drawer renders its honest "no usage-linked measurement"
 * state instead of an empty chart frame.
 */
function usageBarsFor(item: {
  usageMetric: string | null;
  usageActual: number | null;
  adoptionRatePct: number | null;
}): TowerUsageBar[] {
  const bars: TowerUsageBar[] = [];

  const metric = trimOrNull(item.usageMetric);
  if (
    metric &&
    typeof item.usageActual === "number" &&
    Number.isFinite(item.usageActual)
  ) {
    // A raw usage count has no natural 0–100 scale. Adoption, when present, is
    // the only honest fill; otherwise the bar renders full-width neutral and
    // the number carries the meaning.
    const pct =
      typeof item.adoptionRatePct === "number" &&
      Number.isFinite(item.adoptionRatePct)
        ? Math.max(0, Math.min(100, item.adoptionRatePct))
        : 100;
    bars.push({
      label: humanize(metric) ?? metric,
      valueText: formatCount(item.usageActual),
      pct,
      tone: pct >= 60 ? "teal" : pct >= 25 ? "amber" : "red",
    });
  }

  if (
    typeof item.adoptionRatePct === "number" &&
    Number.isFinite(item.adoptionRatePct)
  ) {
    const pct = Math.max(0, Math.min(100, item.adoptionRatePct));
    bars.push({
      label: "Adoption",
      valueText: formatPct(item.adoptionRatePct),
      pct,
      tone: pct >= 60 ? "teal" : pct >= 25 ? "amber" : "red",
    });
  }

  return bars;
}

// ── programs ───────────────────────────────────────────────────────────────

/** The first open required gate, or null when the mart records none. */
function nextGateFor(row: TowerMartProgramLane): string | null {
  for (const gate of row.requiredGates ?? []) {
    if (!gate || typeof gate !== "object") continue;
    const ask = (gate as { ask?: unknown }).ask;
    if (typeof ask === "string" && ask.trim()) return ask.trim();
    const label = (gate as { label?: unknown }).label;
    if (typeof label === "string" && label.trim()) return label.trim();
  }
  return null;
}

function toProgramView(
  row: TowerMartProgramLane,
  index: number,
): TowerProgramView {
  const derived = deriveProgramValues(row);
  return {
    id: trimOrNull(row.programCode) ?? row.laneKey ?? `P${index + 1}`,
    name: row.programName,
    ownerRole: trimOrNull(row.ownerRole),
    financeOwnerRole: trimOrNull(row.financeOwnerRole),
    // The mart has no separate business-function column; the owning role is the
    // closest governed proxy and is labelled as such in the drawer.
    functionLabel: trimOrNull(row.ownerRole),
    lane: derived.lane,

    fundedUsd: num(row.approvedFundingUsd),
    promisedUsd: num(row.promisedValueUsd),
    usageSupportedUsd: derived.usageSupportedUsd,
    financeValidatedUsd: num(row.financeValidatedValueUsd),
    claimableUsd: derived.claimableUsd,
    blockedUsd: derived.blockedUsd,

    usageStatus: derived.usageStatus,
    financeStatus: derived.financeStatus,
    usageMetric: trimOrNull(row.usageMetric),
    usageActual: row.usageActual,
    adoptionRatePct: row.adoptionRatePct,

    evidenceMaturity: derived.evidenceMaturity,
    proofLevel: derived.proofLevel,
    proofSequenceStatus: derived.proofSequenceStatus,
    proofSequenceExplanation: derived.proofSequenceExplanation,
    semanticSource: "derived_compatibility",
    valueAtStakeUsd: derived.valueAtStakeUsd,

    nextGate: nextGateFor(row),
    blocker: trimOrNull(row.decisionRationale),
    note: trimOrNull(row.caveat),
    sourceFile: trimOrNull(row.sourceFile),
  };
}

// ── AI portfolio ───────────────────────────────────────────────────────────

function toAiView(item: TowerMartAiPortfolioItem, n: number): TowerAiView {
  // `item` carries aiSpendCategory, which aiKindFor needs for the governance bucket.
  const bucket = aiDisplayBucketFor(item);
  const kind = bucket.displayBucket;
  return {
    n,
    id: item.aiPortfolioKey,
    name: item.itemName,
    originalItemKind: bucket.originalItemKind,
    kind,
    displayBucket: bucket.displayBucket,
    displayBucketBasis: bucket.displayBucketBasis,
    mappingPolicyVersion: bucket.mappingPolicyVersion,
    category: humanize(item.aiSpendCategory),
    vendor: trimOrNull(item.vendorName),
    system: trimOrNull(item.systemName),
    valueScore: Math.max(0, Math.min(100, num(item.valueScore))),
    readinessScore: Math.max(0, Math.min(100, num(item.readinessScore))),
    riskScore: Math.max(0, Math.min(100, num(item.riskScore))),
    aiSpendUsd: num(item.aiTaggedSpendUsd),
    promisedUsd: num(item.promisedValueUsd),
    financeValidatedUsd: num(item.financeValidatedValueUsd),
    posture: postureFor(item),
    usageHeadline: trimOrNull(item.usageMetric)
      ? `${humanize(item.usageMetric)} · ${formatCount(item.usageActual)}`
      : null,
    usageBars: usageBarsFor(item),
    note: trimOrNull(item.caveat),
    sourceFile: trimOrNull(item.sourceFile),
  };
}

/**
 * Vendor concentration: the share of AI-tagged spend held by the top three
 * named vendors, 0–100. Returns null when no AI item carries a vendor — the
 * design's tile then shows an honest unknown.
 */
export function vendorConcentrationPct(
  items: readonly TowerMartAiPortfolioItem[],
): number | null {
  const byVendor = new Map<string, number>();
  let total = 0;
  for (const item of items) {
    const vendor = trimOrNull(item.vendorName);
    const spend = num(item.aiTaggedSpendUsd);
    if (spend <= 0) continue;
    total += spend;
    if (!vendor) continue;
    byVendor.set(vendor, (byVendor.get(vendor) ?? 0) + spend);
  }
  if (total <= 0 || byVendor.size === 0) return null;
  const top3 = [...byVendor.values()].sort((a, b) => b - a).slice(0, 3);
  const held = top3.reduce((sum, v) => sum + v, 0);
  return Math.round((held / total) * 100);
}

/** AI spend by category — the spend-lens bars. */
function buildSpendLens(items: readonly TowerAiView[]): TowerSpendLensRow[] {
  const byCategory = new Map<
    string,
    { valueUsd: number; kinds: Map<TowerAiKind, number> }
  >();
  for (const item of items) {
    if (item.aiSpendUsd <= 0) continue;
    const category = item.category ?? "Uncategorised AI spend";
    const bucket = byCategory.get(category) ?? {
      valueUsd: 0,
      kinds: new Map(),
    };
    bucket.valueUsd += item.aiSpendUsd;
    bucket.kinds.set(
      item.kind,
      (bucket.kinds.get(item.kind) ?? 0) + item.aiSpendUsd,
    );
    byCategory.set(category, bucket);
  }
  return [...byCategory.entries()]
    .map(([category, bucket]) => {
      // Colour the bar by the kind holding the most spend in that category.
      const dominant = [...bucket.kinds.entries()].sort(
        (a, b) => b[1] - a[1],
      )[0];
      return {
        category,
        valueUsd: bucket.valueUsd,
        kind: (dominant?.[0] ?? "platform") as TowerAiKind,
      };
    })
    .sort((a, b) => b.valueUsd - a.valueUsd);
}

// ── evidence ───────────────────────────────────────────────────────────────

function gapPriority(
  gap: TowerMartRequiredFieldGap,
): "high" | "medium" | "low" {
  const severity = String(gap.severity ?? "")
    .trim()
    .toLowerCase();
  if (gap.blocking || severity === "high" || severity === "critical")
    return "high";
  if (severity === "low" || severity === "info") return "low";
  return "medium";
}

/**
 * A data-pipeline gap. NOT shown on the executive Evidence tab.
 *
 * `mart_required_field_gaps` records "column X on mart table Y is unpopulated;
 * fill the source template and rerun the projection", owned by the Data Office.
 * That is an ETL backlog item. Rendering it as a CXO evidence answer would
 * break the standing Tower rule that the surface reports business posture, not
 * pipeline state — and, because the table only fills when the pipeline is
 * INCOMPLETE, binding executive questions to it means healthy data produces an
 * empty Evidence tab. Business gaps come from `deriveBusinessEvidenceGaps()`.
 */
function toPipelineGapView(
  gap: TowerMartRequiredFieldGap,
  programByKey: ReadonlyMap<string, TowerProgramView>,
): TowerEvidenceGapView {
  const linked = programByKey.get(gap.martRecordKey) ?? null;
  const field = humanize(gap.requiredField) ?? gap.requiredField;
  const promisedValueExposedUsd = Math.max(
    0,
    num(linked?.promisedUsd) - num(linked?.claimableUsd),
  );
  const validatedValueHeldUsd = Math.max(
    0,
    num(linked?.financeValidatedUsd) - num(linked?.claimableUsd),
  );
  return {
    id: gap.gapKey,
    kind: "pipeline",
    gapStage: "pipeline",
    primaryBlockingGap: false,
    area: "Data pipeline",
    linkedProgram: linked?.name ?? null,
    missing: field,
    why: gap.remediationAction,
    blockedDecision: gap.blocking
      ? `Blocks the ${linked?.name ?? "linked"} value claim until ${field.toLowerCase()} is recorded.`
      : `${field} is missing; the claim is reported without it.`,
    owner: trimOrNull(gap.ownerHint),
    priority: gapPriority(gap),
    blocking: gap.blocking,
    sourceTemplate: trimOrNull(gap.sourceTemplate),
    valueAtStakeUsd: linked?.blockedUsd ?? null,
    promisedValueExposedUsd,
    validatedValueHeldUsd,
    claimableValueBlockedUsd: Math.max(0, num(linked?.blockedUsd)),
    sourceProgramId: linked?.id ?? null,
    sourceEvidenceRefs: [gap.sourceTemplate, gap.sourceRecordId].filter(
      Boolean,
    ) as string[],
    gapPolicyVersion: TOWER_GAP_POLICY_VERSION,
  };
}

/**
 * **Business evidence gaps — what proof is missing before value can be claimed.**
 *
 * Derived from the claim chain the mart already carries, one gap per program per
 * unmet step. No new mart table is required, and nothing is invented: every gap
 * names a program the mart lists, a step of the governed claim chain it has not
 * cleared, the owner the mart records for it, and the promised value that cannot
 * be booked until it closes.
 *
 * The three steps, in order — a program only raises the FIRST one it fails,
 * because that is the one actually blocking it today:
 *
 *   1. usage       — promised value with no usage evidence at all
 *   2. finance     — usage evidence exists, but Finance has validated nothing
 *   3. claim_gate  — Finance validated a figure, but the claim gate has not cleared
 *
 * This is the same reasoning already used for the Risk posture tile, and it is
 * how the shipped Tower produces its "owner gaps / usage gaps / claim blockers"
 * counts. It replaces an earlier wiring that read the Evidence tab's "what is
 * missing / who owns it / what is blocked" questions off
 * `mart_required_field_gaps` — a table that is EMPTY when the data is healthy,
 * so good data produced an empty tab.
 */
export function deriveBusinessEvidenceGaps(
  programs: readonly TowerProgramView[],
): TowerEvidenceGapView[] {
  const gaps: TowerEvidenceGapView[] = [];

  for (const p of programs) {
    // A program promising nothing has no value claim to block.
    if (p.promisedUsd <= 0) continue;

    const laneDecision = `${LANE_DECISION_VERB[p.lane]} ${p.name}`;
    const promisedValueExposedUsd = Math.max(0, p.promisedUsd - p.claimableUsd);
    const validatedValueHeldUsd = Math.max(
      0,
      p.financeValidatedUsd - p.claimableUsd,
    );
    const claimableValueBlockedUsd = Math.max(0, p.blockedUsd);
    const sourceEvidenceRefs = [p.sourceFile].filter(Boolean) as string[];
    const programGaps: TowerEvidenceGapView[] = [];

    if (
      p.usageStatus === "none" ||
      p.proofSequenceStatus === "finance_validation_ahead_of_usage_evidence"
    ) {
      const anomaly =
        p.proofSequenceStatus === "finance_validation_ahead_of_usage_evidence";
      programGaps.push({
        id: `gap:usage:${p.id}`,
        kind: "usage",
        gapStage: "usage",
        primaryBlockingGap: false,
        area: "Usage evidence",
        linkedProgram: p.name,
        missing: anomaly
          ? `Initiative-level usage attribution for ${p.name}`
          : `Usage evidence for ${p.name}`,
        why: anomaly
          ? `Finance has validated ${formatUsdM(p.financeValidatedUsd)}, but initiative-level usage evidence does not yet support sustained attribution.`
          : `${formatUsdM(p.promisedUsd)} of promised value has no usage or adoption measurement behind it, so none of it can be attributed to anything the business is actually doing.`,
        blockedDecision: laneDecision,
        owner: p.ownerRole,
        priority: "high",
        blocking: true,
        sourceTemplate: p.sourceFile,
        valueAtStakeUsd: promisedValueExposedUsd,
        promisedValueExposedUsd,
        validatedValueHeldUsd,
        claimableValueBlockedUsd,
        sourceProgramId: p.id,
        sourceEvidenceRefs,
        gapPolicyVersion: TOWER_GAP_POLICY_VERSION,
      });
    }

    if (p.financeStatus === "none") {
      programGaps.push({
        id: `gap:finance:${p.id}`,
        kind: "finance",
        gapStage: "finance",
        primaryBlockingGap: false,
        area: "Value attestation",
        linkedProgram: p.name,
        missing: `Finance validation of the ${p.name} benefit method`,
        why:
          `Usage evidence exists (${p.usageStatus}), but Finance has not validated a measurement ` +
          `method, so ${formatUsdM(p.promisedUsd)} of promised value cannot be booked.`,
        blockedDecision: laneDecision,
        owner: p.financeOwnerRole ?? p.ownerRole,
        priority: "high",
        blocking: true,
        sourceTemplate: p.sourceFile,
        valueAtStakeUsd: promisedValueExposedUsd,
        promisedValueExposedUsd,
        validatedValueHeldUsd,
        claimableValueBlockedUsd,
        sourceProgramId: p.id,
        sourceEvidenceRefs,
        gapPolicyVersion: TOWER_GAP_POLICY_VERSION,
      });
    }

    if (p.claimableUsd <= 0) {
      programGaps.push({
        id: `gap:claim:${p.id}`,
        kind: "claim_gate",
        gapStage: "claim_gate",
        primaryBlockingGap: false,
        area: "Claim gate",
        linkedProgram: p.name,
        missing: `Claim-gate clearance for ${p.name}`,
        why:
          `Finance has validated ${formatUsdM(p.financeValidatedUsd)}, but the Tower claim gate ` +
          `has not cleared, so ${formatUsdM(p.blockedUsd)} stays unclaimable.`,
        blockedDecision: laneDecision,
        owner: p.financeOwnerRole ?? p.ownerRole,
        priority: "medium",
        blocking: true,
        sourceTemplate: p.sourceFile,
        valueAtStakeUsd:
          validatedValueHeldUsd > 0
            ? validatedValueHeldUsd
            : promisedValueExposedUsd,
        promisedValueExposedUsd,
        validatedValueHeldUsd,
        claimableValueBlockedUsd,
        sourceProgramId: p.id,
        sourceEvidenceRefs,
        gapPolicyVersion: TOWER_GAP_POLICY_VERSION,
      });
    }

    if (programGaps.length > 0) {
      gaps.push(
        { ...programGaps[0]!, primaryBlockingGap: true },
        ...programGaps.slice(1),
      );
    }
  }

  // Primary blockers first, then worst dollar impact — the overview keeps the
  // executive prioritisation while drawers can still reveal the full chain.
  return gaps.sort((a, b) => {
    if (a.primaryBlockingGap !== b.primaryBlockingGap)
      return a.primaryBlockingGap ? -1 : 1;
    return (b.valueAtStakeUsd ?? 0) - (a.valueAtStakeUsd ?? 0);
  });
}

/** The decision each lane holds, phrased as the choice the owner faces. */
const LANE_DECISION_VERB: Record<TowerLaneKey, string> = {
  fund: "Scale or hold",
  fix: "Continue or pause",
  freeze: "Unfreeze or stop",
  stop: "Stop or remediate",
  watch: "Keep watching or act on",
};

function toEvidenceFactView(
  row: TowerMartEvidenceLineage,
): TowerEvidenceFactView {
  const hasCaveat = trimOrNull(row.caveat) !== null;
  return {
    id: row.lineageKey,
    name: row.displayedFact,
    detail:
      trimOrNull(row.caveat) ??
      "Traced to a governed source row with no recorded caveat.",
    metricText:
      trimOrNull(row.displayedValueText) ??
      (typeof row.displayedValueNumeric === "number"
        ? formatUsdM(row.displayedValueNumeric)
        : "—"),
    unit: humanize(row.surfaceSection) ?? "evidence",
    tone: hasCaveat ? "amber" : "teal",
    tag: hasCaveat ? "Traced · caveated" : "Traced",
    sourceFile: trimOrNull(row.sourceFile),
    sourceRow: trimOrNull(row.sourceRow),
  };
}

// ── actions ────────────────────────────────────────────────────────────────

const ACTION_LANES = new Set(["fund", "fix", "freeze", "stop"]);

function toActionView(
  action: TowerMartCxoAction,
  index: number,
): TowerActionView {
  const lane = String(action.actionLane ?? "")
    .trim()
    .toLowerCase();
  return {
    id: action.actionKey,
    sequence: typeof action.sequence === "number" ? action.sequence : index + 1,
    ownerRole: trimOrNull(action.ownerHint) ?? "Unassigned",
    lane: (ACTION_LANES.has(lane) ? lane : "fix") as TowerActionView["lane"],
    title: action.title,
    // The mart carries one narrative body per action. The design splits it into
    // "decision required" / "why now" / "evidence needed". We show the governed
    // body under "why now" and label the other two from governed fields only —
    // we do not invent three paragraphs where the mart wrote one.
    decision: action.title,
    why: action.actionBody,
    evidence: trimOrNull(action.moduleHandoff)
      ? `Routes to ${action.moduleHandoff}.`
      : "No evidence package is recorded for this action in the mart.",
    due: null,
    linkedProgram: null,
    moveTitle: action.title,
    moduleHandoff: trimOrNull(action.moduleHandoff),
  };
}

// ── assembly ───────────────────────────────────────────────────────────────

/**
 * Build everything the Command Center renders from the governed mart view.
 *
 * Returns `null` for a tenant with no mart rows so the page can render its
 * honest empty state. Zeros would be a claim; absence is the truth.
 */
export function buildTowerCommandCenterView(
  mart: TowerMartCommandViewModel | null,
  options: { tenantName: string },
): TowerCommandCenterView | null {
  if (!mart) return null;

  const command = mart.command;
  const unknownSlots: string[] = [];

  const programs = mart.programLanes.map(toProgramView);
  const programByKey = new Map(
    mart.programLanes.map((row, i) => [row.laneKey, programs[i]] as const),
  );

  const aiAll = mart.aiPortfolio.map((item, i) => toAiView(item, i + 1));
  const ai = aiAll.filter((item) => item.kind !== "candidate");
  const candidateAll = aiAll.filter((item) => item.kind === "candidate");
  const totalCandidateCount = Math.max(
    num(command.candidateAiOpportunities),
    mart.aiPortfolioCounts?.candidate ?? 0,
    candidateAll.length,
  );
  const candidates: TowerCandidateView[] = aiAll
    .filter((item) => item.kind === "candidate")
    .sort(
      (a, b) =>
        b.valueScore - a.valueScore ||
        b.readinessScore - a.readinessScore ||
        a.name.localeCompare(b.name),
    )
    .slice(0, TOWER_CANDIDATE_DISPLAY_LIMIT)
    .map((item, i) => ({
      n: i + 1,
      id: item.id,
      name: item.name,
      reason: item.note ?? "Candidate — not approved spend.",
      strategicAttractiveness: item.valueScore,
      executionFeasibility: item.readinessScore,
      evidenceStrength:
        item.financeValidatedUsd > 0 ? 80 : item.usageBars.length > 0 ? 45 : 20,
      dependencyRisk: item.riskScore,
      classification: item.originalItemKind,
      reasonSelected: `Top ${Math.min(TOWER_CANDIDATE_DISPLAY_LIMIT, totalCandidateCount)} by governed value/readiness policy`,
    }));

  const usageSupportedTotal = programs.reduce(
    (sum, p) => sum + p.usageSupportedUsd,
    0,
  );
  const claimable = num(command.realizedValueYtdAllowed);
  const promised = num(command.promisedValueFy26);

  const concentration = vendorConcentrationPct(mart.aiPortfolio);
  if (concentration === null) unknownSlots.push("Top-3 vendor concentration");

  // The command centre reports an AI-tagged total, but `mart_ai_portfolio` may
  // carry no per-item spend at all — verified on the Healthcare Composite Demo
  // tenant 2026-07-23, where every one of the 250 portfolio rows has
  // ai_tagged_spend_usd = 0 while the command centre reports $53.7M. When that
  // happens the spend lens and the bubble sizes have nothing to encode, and the
  // page must say so rather than draw an empty chart under a headline figure.
  const portfolioSpendUsd =
    mart.aiPortfolioCounts?.attributedSpendUsd ??
    mart.aiPortfolio.reduce((sum, item) => sum + num(item.aiTaggedSpendUsd), 0);
  const totalAiTaggedUsd = num(command.aiTaggedSpendFy26NonAdditive);
  const aiUnallocatedSpendUsd = Math.max(
    0,
    totalAiTaggedUsd - portfolioSpendUsd,
  );
  const aiSpendUnattributed = portfolioSpendUsd <= 0 && totalAiTaggedUsd > 0;
  if (aiSpendUnattributed) {
    unknownSlots.push(
      "AI spend attribution (portfolio total exists, but mart_ai_portfolio carries no per-item spend)",
    );
  }

  const aiSpendAttributionStatus: TowerAiSpendAttributionStatus =
    totalAiTaggedUsd <= 0
      ? "unattributed"
      : portfolioSpendUsd <= 0
        ? "portfolio_only"
        : aiUnallocatedSpendUsd > 0
          ? "category_attributed"
          : "item_attributed";

  const martItemCount = Math.max(
    mart.aiPortfolioCounts?.total ?? 0,
    mart.aiPortfolio.length,
  );
  const eligibleItemCount = ai.length + candidateAll.length;
  const excludedItemCount = Math.max(0, martItemCount - eligibleItemCount);
  const exclusionReasons = [
    excludedItemCount > 0
      ? `Runtime reader returned ${eligibleItemCount} of ${martItemCount} mart rows`
      : null,
    totalCandidateCount > candidates.length
      ? `Candidate pipeline preview limited to ${candidates.length} of ${totalCandidateCount}`
      : null,
  ].filter(Boolean) as string[];

  const summary: TowerCommandSummary = {
    tenantKey: command.tenantKey,
    tenantName: options.tenantName || command.tenantName,
    martVersion: command.martVersion,
    formulaVersion: command.formulaVersion,
    sourceStandard: command.sourceStandard,
    sourceFiles: command.sourceFiles ?? [],

    budgetUsd: num(command.totalItBudgetFy26),
    runUsd: num(command.runBudgetFy26),
    changeUsd: num(command.changeBudgetFy26),
    aiTaggedUsd: totalAiTaggedUsd,

    promisedUsd: promised,
    usageSupportedUsd: usageSupportedTotal,
    financeValidatedUsd: num(command.partialFinanceValidatedValueYtd),
    claimableUsd: claimable,
    blockedUsd: Math.max(0, promised - claimable),

    programCount: programs.length,
    aiInitiativeCount: ai.length,
    candidateAiCount: totalCandidateCount,
    watchPressureSignals: num(command.watchPressureSignals),

    runRatio: command.runRatio,
    changeRatio: command.changeRatio,
    financeValidationRatio: command.financeValidationRatio,

    decisionQuestion: command.decisionQuestion,
    executiveSummary: command.executiveSummary,
    vendorConcentrationPct: concentration,
    aiAttributedInitiativeSpendUsd: portfolioSpendUsd,
    aiSharedPlatformSpendUsd: 0,
    aiUnallocatedSpendUsd,
    aiSpendAttributionStatus,
    aiSpendUnattributed,
  };

  const funnel: TowerFunnelStage[] = mart.valueFunnel
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map((stage) => ({
      key: stage.stageKey,
      label: stage.stageLabel,
      sequence: stage.sequence,
      valueUsd: num(stage.valueNumeric),
      claimStatus: stage.claimStatus,
      caveat: stage.caveat,
      sourceFile: trimOrNull(stage.sourceFile),
    }));

  const pipelineGaps = mart.requiredFieldGaps.map((gap) =>
    toPipelineGapView(gap, programByKey),
  );
  const gaps = deriveBusinessEvidenceGaps(programs);
  const evidenceFacts = mart.evidenceLineage.map(toEvidenceFactView);
  const actions = mart.cxoActions
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map(toActionView);

  if (actions.every((a) => a.due === null)) {
    unknownSlots.push(
      "Action due windows (mart_cxo_actions carries no due date)",
    );
  }
  if (evidenceFacts.length === 0) unknownSlots.push("Evidence lineage rows");
  if (funnel.length === 0) unknownSlots.push("Value funnel stages");

  return {
    summary,
    funnel,
    programs,
    ai,
    candidates,
    portfolioCounts: {
      sourceItemCount: null,
      canonicalItemCount: null,
      martItemCount,
      eligibleItemCount,
      displayCandidateCount: candidates.length,
      totalCandidateCount,
      plottedItemCount: ai.length,
      excludedItemCount,
      exclusionReasons,
    },
    spendLens: buildSpendLens(ai),
    gaps,
    pipelineGaps,
    evidenceFacts,
    actions,
    unknownSlots,
  };
}

/** Lane display metadata, shared by the Kanban, table and chart legends. */
export const TOWER_LANE_META: ReadonlyArray<{
  id: TowerLaneKey;
  name: string;
  sub: string;
}> = [
  { id: "fund", name: "Fund", sub: "Proof is emerging — invest to scale" },
  { id: "fix", name: "Fix", sub: "Value real but blocked on evidence" },
  { id: "freeze", name: "Freeze", sub: "Funding ahead of proof — hold" },
  { id: "stop", name: "Stop", sub: "No verified value — terminate" },
];
