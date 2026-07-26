import "server-only";

// PR8 — the roadmap CONTRACT EXTRACTOR.
//
// This is the keystone bridge for live-route wiring (GOV-7): the pure function
// that turns a generation's NORMALIZED structured roadmap payload into the
// shared RoadmapPresentationContract (PR4) that the PPTX (PR5), DOCX (PR6) and
// HTML preview (PR7) renderers all consume. Both pipelines are wired to emit the
// same normalized payload (GOV-10 pipeline parity), so one extractor serves
// both — there is exactly one place that decides what the contract says.
//
// Governance guarantees (the reason this is a dedicated, tested unit and not an
// inline map):
//   1. It NEVER fabricates certainty. An item with no explicit, recognized
//      evidence status becomes `evidence_required` — never `approved`. Absence
//      of proof is rendered as absence of proof.
//   2. It enforces the message-led title rule from EXECUTIVE_ROADMAP_REFERENCE
//      as a SURFACED issue, not a silent pass. A generic "Execution Roadmap"
//      title is reported in `issues`; the caller decides whether to block.
//   3. Horizons are outcome-first: each horizon leads with the state it
//      achieves (from horizonOutcomes / the payload's stated outcome), never an
//      activity list.
//   4. It invents nothing. Gates, milestones and dependencies come only from
//      the payload; it does not backfill the reference's canonical lists.

import {
  buildRoadmapPresentationContract,
  type RoadmapDecisionGate,
  type RoadmapDependency,
  type RoadmapEvidenceStatus,
  type RoadmapHorizon,
  type RoadmapLineage,
  type RoadmapPresentationContract,
  type RoadmapValueMilestone,
  type RoadmapWorkstreamItem,
} from "./roadmap-presentation-contract";
import type { RoadmapLifecycleState } from "./roadmap-lifecycle";
import { EXECUTIVE_ROADMAP_REFERENCE } from "./shared/reference-library/executive-roadmap-reference";

/** One workstream × horizon cell as a pipeline emits it. Mirrors the reference
 * contract's `requiredItemFields`. Every field except workstream/horizon/outcome
 * is optional so a partial cell degrades honestly rather than being dropped. */
export interface RoadmapCellInput {
  workstream: string;
  horizon: string;
  outcome: string;
  majorActivity?: string;
  dependency?: string;
  decisionOrGate?: string;
  ownerRole?: string;
  timing?: string;
  successMeasure?: string;
  /** Free-form status token from the generator; normalized, never trusted verbatim. */
  evidenceStatus?: string;
}

/** The normalized roadmap payload both pipelines emit (GOV-10). Renderer- and
 * pipeline-agnostic; the extractor is the ONLY consumer that turns it into a
 * contract. */
export interface RoadmapStructuredInput {
  /** The message-led executive conclusion (the sequencing thesis). */
  executiveConclusion: string;
  /** The specific decision the sponsor is asked to make. */
  sponsorDecision: string;
  /** Per-horizon achieved outcome. Missing entries fall back to the reference's
   * canonical horizonOutcomes so a horizon never renders outcome-less. */
  horizonOutcomes?: Partial<Record<string, string>>;
  cells: RoadmapCellInput[];
  decisionGates?: {
    name: string;
    betweenHorizons?: string;
    criteria?: string;
  }[];
  valueMilestones?: { name: string; horizon?: string }[];
  risks?: string[];
  caveats?: string[];
  /** Detailed supporting content destined for the DOCX appendix, not the deck. */
  appendix?: string[];
}

/** A governance issue the extractor surfaces to the caller. Non-fatal: the
 * extractor still returns a contract, but the caller (or the contradiction
 * validator) decides whether an issue blocks release. */
export interface RoadmapExtractionIssue {
  code:
    | "generic_title"
    | "missing_evidence_status"
    | "horizon_outcome_defaulted"
    | "no_decision_gates"
    | "no_value_milestones";
  detail: string;
}

export interface RoadmapExtractionResult {
  contract: RoadmapPresentationContract;
  issues: RoadmapExtractionIssue[];
}

const RECOGNIZED_EVIDENCE: ReadonlySet<RoadmapEvidenceStatus> = new Set([
  "approved",
  "recommended",
  "illustrative",
  "client_decision_required",
  "evidence_required",
]);

/** Map a free-form generator status token to a permitted evidence status.
 * ANYTHING unrecognized or absent becomes `evidence_required` — the extractor
 * never upgrades an unknown into a certainty. */
export function normalizeEvidenceStatus(raw: string | undefined): {
  status: RoadmapEvidenceStatus;
  defaulted: boolean;
} {
  if (!raw) return { status: "evidence_required", defaulted: true };
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (RECOGNIZED_EVIDENCE.has(key as RoadmapEvidenceStatus)) {
    return { status: key as RoadmapEvidenceStatus, defaulted: false };
  }
  // Common synonyms — still conservative, never resolves to "approved".
  if (key === "proposed" || key === "suggested") {
    return { status: "recommended", defaulted: false };
  }
  if (key === "example" || key === "indicative" || key === "draft") {
    return { status: "illustrative", defaulted: false };
  }
  // Anything else unrecognized (including provisional tokens) defaults
  // conservatively to evidence_required — never an unverified certainty.
  return { status: "evidence_required", defaulted: true };
}

function titleIsGeneric(title: string): boolean {
  const t = title.trim();
  const rule = EXECUTIVE_ROADMAP_REFERENCE.titleRule;
  if (rule.genericTitleForbiddenPatterns.some((re) => re.test(t))) return true;
  // Message-led titles state a conclusion; a bare label is short.
  return t.split(/\s+/).filter(Boolean).length < rule.minTitleWords;
}

/** Build the shared contract from a normalized structured payload. Pure; never
 * throws; never fabricates. Returns the contract plus surfaced governance issues. */
export function buildRoadmapContractFromStructured(args: {
  input: RoadmapStructuredInput;
  lineage: RoadmapLineage;
  lifecycleState: RoadmapLifecycleState;
  phase: number;
}): RoadmapExtractionResult {
  const { input, lineage, lifecycleState, phase } = args;
  const issues: RoadmapExtractionIssue[] = [];

  // ── Title / message-led check ──
  if (titleIsGeneric(input.executiveConclusion)) {
    issues.push({
      code: "generic_title",
      detail: `Executive conclusion "${input.executiveConclusion}" is a category label, not a message-led sequencing thesis (REF_EXECUTIVE_ROADMAP titleRule).`,
    });
  }

  // ── Horizons, outcome-first, in the reference's canonical order ──
  const presentHorizons = new Set(input.cells.map((c) => c.horizon));
  const canonicalOrder =
    EXECUTIVE_ROADMAP_REFERENCE.horizons as readonly string[];
  const orderedHorizonNames = [
    ...canonicalOrder.filter((h) => presentHorizons.has(h)),
    // Any non-canonical horizon names the generator emitted, kept in first-seen order.
    ...[...presentHorizons].filter((h) => !canonicalOrder.includes(h)),
  ];
  const horizons: RoadmapHorizon[] = orderedHorizonNames.map((name) => {
    const stated = input.horizonOutcomes?.[name]?.trim();
    const referenceOutcome = (
      EXECUTIVE_ROADMAP_REFERENCE.horizonOutcomes as Record<string, string>
    )[name];
    let outcome = stated;
    if (!outcome && referenceOutcome) {
      outcome = referenceOutcome;
      issues.push({
        code: "horizon_outcome_defaulted",
        detail: `Horizon "${name}" had no stated outcome; used the reference's canonical outcome. Confirm it reflects this Move.`,
      });
    }
    if (!outcome) outcome = "Outcome not yet stated — evidence required.";
    const activities = input.cells
      .filter((c) => c.horizon === name && c.majorActivity?.trim())
      .map((c) => c.majorActivity!.trim());
    return activities.length
      ? { name, outcome, activities }
      : { name, outcome };
  });

  // ── Workstream items (one per cell), evidence normalized, never fabricated ──
  const workstreamItems: RoadmapWorkstreamItem[] = input.cells.map((c) => {
    const { status, defaulted } = normalizeEvidenceStatus(c.evidenceStatus);
    if (defaulted) {
      issues.push({
        code: "missing_evidence_status",
        detail: `Cell ${c.workstream} × ${c.horizon} had no recognized evidence status; defaulted to "evidence_required".`,
      });
    }
    return {
      workstream: c.workstream,
      horizon: c.horizon,
      outcome: c.outcome,
      evidenceStatus: status,
    };
  });

  // ── Dependencies: pulled from cells that name one, evidence-normalized ──
  const dependencies: RoadmapDependency[] = input.cells
    .filter((c) => c.dependency?.trim())
    .map((c) => ({
      item: c.dependency!.trim(),
      evidenceStatus: normalizeEvidenceStatus(c.evidenceStatus).status,
      note: c.workstream ? `${c.workstream} · ${c.horizon}` : c.horizon,
    }));

  // ── Decision gates: from the payload only; never backfilled from the reference ──
  const decisionGates: RoadmapDecisionGate[] = (input.decisionGates ?? []).map(
    (g) => ({
      name: g.name,
      betweenHorizons: g.betweenHorizons,
      criteria: g.criteria,
    }),
  );
  // A cell may also carry a gate — surface those the explicit list didn't.
  for (const c of input.cells) {
    const g = c.decisionOrGate?.trim();
    if (g && !decisionGates.some((d) => d.name === g)) {
      decisionGates.push({ name: g, betweenHorizons: c.horizon });
    }
  }
  if (decisionGates.length === 0) {
    issues.push({
      code: "no_decision_gates",
      detail:
        "No decision gates found — an executive roadmap without gates reads as a Gantt chart (REF_EXECUTIVE_ROADMAP).",
    });
  }

  // ── Value milestones: from the payload only ──
  const valueMilestones: RoadmapValueMilestone[] = (
    input.valueMilestones ?? []
  ).map((m) => ({ name: m.name, horizon: m.horizon }));
  if (valueMilestones.length === 0) {
    issues.push({
      code: "no_value_milestones",
      detail:
        "No value milestones found — the roadmap should prove realized value, not just technical completion.",
    });
  }

  const contract = buildRoadmapPresentationContract({
    lifecycleState,
    phase,
    executiveConclusion: input.executiveConclusion,
    sponsorDecision: input.sponsorDecision,
    horizons,
    decisionGates,
    valueMilestones,
    dependencies,
    workstreamItems,
    risks: input.risks ?? [],
    caveats: input.caveats ?? [],
    lineage,
    appendix: input.appendix ?? [],
  });

  return { contract, issues };
}
