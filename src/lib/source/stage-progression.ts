// Source stage progression engine (Workspace Explorer · Slice A).
//
// The "ease of progression" spine: given the live state of a stage (gate
// criteria, evidence readiness, artifact drafts), compute the ordered list of
// concrete one-click actions a user needs to take to advance — and, when the
// stage is fully cleared, the single "Advance" action.
//
// This is a PURE function over the canonical specs + live substrate. It does
// not fetch, mutate, or render. The surface (Next-Move card / Workspace) maps
// each `StageNeed.kind` to a concrete control. Additive to `stage-next-move.ts`
// (which still drives the single-action card); nothing here changes existing
// behaviour.

import {
  specsForStage,
  specByCode,
  evidenceForStage,
  criterionById,
} from "./canonical-specs";
import { listSupportedGenerationCodes } from "./agent-generation/prompt-registry";
import { SOURCE_STAGE_LABELS, SOURCE_STAGE_ORDER } from "./constants";
import type {
  SourceEventArtifactState,
  SourceEventGateCriterion,
  SourceEventEvidence,
  SourceEventEvidenceCurrentState,
} from "./canvas-substrate";
import type { SourceStageKey } from "./types";

/** The kind of action a need resolves to — the surface maps this to a control. */
export type StageNeedKind =
  | "upload" // a required file/evidence is missing or stale → governed upload
  | "generate" // a deliverable is missing and IS AI-authorable → quality-gated generate
  | "prepare" // a deliverable is missing and is NOT yet auto-authorable → build/fill
  | "send" // a vendor communication is ready to issue to bidders
  | "approve" // a drafted deliverable awaits a named-human approval (clears a gate)
  | "advance"; // everything required is clear → move to the next stage

export interface StageNeed {
  /** Stable id (requirementId / artifactCode / criterionId / `advance:<stage>`). */
  id: string;
  kind: StageNeedKind;
  /** Plain-English action, e.g. "Upload the application inventory". */
  label: string;
  /** Why it matters / what it unlocks. */
  detail?: string;
  /** True when the action's wiring is not yet available (surface shows it disabled). */
  blocked?: boolean;
  blockedReason?: string;
  /** Soft need — surfaced but does not block advancing (e.g. recommended evidence). */
  optional?: boolean;
  artifactCode?: string;
  criterionId?: string;
  requirementId?: string;
}

export interface StageProgressionView {
  stage: SourceStageKey;
  nextStage?: SourceStageKey;
  /** Ordered: the first item is the single "next move". */
  needs: StageNeed[];
  /** Convenience alias for `needs[0]`. */
  primary?: StageNeed;
  clearedGates: number;
  totalGates: number;
  gateSummary: string;
  /** True when every required gate criterion is met/waived — ready to advance. */
  allClear: boolean;
}

export interface ComputeStageProgressionInput {
  stage: SourceStageKey;
  criteria: SourceEventGateCriterion[];
  evidence: SourceEventEvidence[];
  artifacts: SourceEventArtifactState[];
  /** Defaults to the live AI-authorable set; injectable for tests. */
  generatableCodes?: ReadonlyArray<string>;
}

// Readiness ramp ranks. Stale / Low Confidence are failure modes (below any
// minimum) — they require a refresh.
const READINESS_RANK: Record<SourceEventEvidenceCurrentState, number> = {
  "Not Requested": 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  "Usable Evidence": 4,
  Stale: -1,
  "Low Confidence": -1,
};

// Stage → the vendor communication that issues the same request to all bidders.
const STAGE_COMMS: Partial<
  Record<SourceStageKey, { artifactCode: string; label: string }>
> = {
  rfp: {
    artifactCode: "d09_rfp_pack",
    label: "Issue the RFP to all shortlisted vendors",
  },
  responses: {
    artifactCode: "d14_qa_log",
    label: "Publish the Q&A to all bidders",
  },
  bafo: {
    artifactCode: "d22_bafo_question_pack",
    label: "Send the BAFO questions to each finalist",
  },
};

const VENDOR_SEND_NOT_WIRED =
  "Vendor send is generated as a draft today; one-click issue-to-all is slice D.";
const AUTHORING_NOT_WIRED =
  "AI authoring template not wired for this artifact yet (slice C).";

export function computeStageProgression(
  input: ComputeStageProgressionInput,
): StageProgressionView {
  const { stage, criteria, evidence, artifacts } = input;
  const generatable = new Set(
    input.generatableCodes ?? listSupportedGenerationCodes(),
  );
  const nextStage = nextStageFor(stage);

  const totalGates = criteria.length;
  const clearedGates = criteria.filter((c) => gateIsClear(c.state)).length;
  const gateSummary =
    totalGates === 0
      ? "No gate criteria loaded"
      : `${clearedGates} of ${totalGates} cleared to advance`;

  const openRequiredGates = criteria.filter(
    (c) => !gateIsClear(c.state) && criterionIsRequired(c.criterionId),
  );
  const allClear = totalGates > 0 && openRequiredGates.length === 0;

  if (allClear) {
    const advance: StageNeed = {
      id: `advance:${stage}`,
      kind: "advance",
      label: nextStage
        ? `Advance to ${SOURCE_STAGE_LABELS[nextStage]}`
        : "Close the event",
      detail: nextStage
        ? `Every required criterion for ${SOURCE_STAGE_LABELS[stage]} is clear. Advance when the human owner is ready.`
        : "Every required value-stage criterion is clear. Close when the accountable owner accepts the final record.",
    };
    return {
      stage,
      nextStage,
      needs: [advance],
      primary: advance,
      clearedGates,
      totalGates,
      gateSummary,
      allClear,
    };
  }

  // Ordered: inputs → deliverables → approvals → vendor sends → soft inputs.
  const needs: StageNeed[] = [
    ...evidenceNeeds(stage, evidence),
    ...deliverableNeeds(stage, artifacts, criteria, generatable),
    ...approvalNeeds(criteria, artifacts),
    ...sendNeeds(stage, artifacts),
  ];

  // Required uploads first, recommended (optional) uploads last.
  needs.sort((a, b) => Number(Boolean(a.optional)) - Number(Boolean(b.optional)));

  return {
    stage,
    nextStage,
    needs,
    primary: needs[0],
    clearedGates,
    totalGates,
    gateSummary,
    allClear,
  };
}

// ── derivations ──────────────────────────────────────────────────────────────

function evidenceNeeds(
  stage: SourceStageKey,
  evidence: SourceEventEvidence[],
): StageNeed[] {
  const byId = new Map(evidence.map((e) => [e.requirementId, e]));
  const out: StageNeed[] = [];
  for (const req of evidenceForStage(stage)) {
    const live = byId.get(req.requirementId);
    const state: SourceEventEvidenceCurrentState =
      live?.currentState ?? "Not Requested";
    const isFailure = state === "Stale" || state === "Low Confidence";
    const satisfied =
      !isFailure && READINESS_RANK[state] >= READINESS_RANK[req.minimumState];
    if (satisfied) continue;
    out.push({
      id: req.requirementId,
      kind: "upload",
      label: `${isFailure ? "Refresh" : "Upload"} ${req.label}`,
      detail: `${req.sourceLabel} → needs ${req.minimumState}. Unlocks: ${req.unlocks}`,
      optional: req.level !== "required",
      requirementId: req.requirementId,
    });
  }
  return out;
}

function deliverableNeeds(
  stage: SourceStageKey,
  artifacts: SourceEventArtifactState[],
  criteria: SourceEventGateCriterion[],
  generatable: Set<string>,
): StageNeed[] {
  const byCode = new Map(artifacts.map((a) => [a.artifactCode, a]));

  // Codes we must produce = required/gate-defining specs for the stage, PLUS
  // any artifact linked to an open required gate criterion (so a required gate
  // never sits with no "produce it" action even if its spec is marked soft).
  const codes = new Set<string>();
  for (const spec of specsForStage(stage)) {
    if (spec.requirementLevel === "required" || spec.gateDefining) {
      codes.add(spec.code);
    }
  }
  for (const criterion of criteria) {
    if (gateIsClear(criterion.state)) continue;
    if (!criterionIsRequired(criterion.criterionId)) continue;
    const canonical = criterionById(criterion.criterionId);
    for (const code of canonical?.linkedArtifactCodes ?? []) codes.add(code);
  }

  const out: StageNeed[] = [];
  for (const code of codes) {
    const art = byCode.get(code);
    if (art && artifactIsDrafted(art)) continue; // already drafted
    const spec = specByCode(code);
    const canGenerate = generatable.has(code);
    out.push({
      id: code,
      kind: canGenerate ? "generate" : "prepare",
      label: `${canGenerate ? "Generate" : "Prepare"} ${spec?.name ?? code}`,
      detail: spec?.description,
      artifactCode: code,
      blocked: !canGenerate,
      blockedReason: canGenerate ? undefined : AUTHORING_NOT_WIRED,
    });
  }
  return out;
}

function approvalNeeds(
  criteria: SourceEventGateCriterion[],
  artifacts: SourceEventArtifactState[],
): StageNeed[] {
  const byCode = new Map(artifacts.map((a) => [a.artifactCode, a]));
  const seen = new Set<string>();
  const out: StageNeed[] = [];
  for (const criterion of criteria) {
    if (gateIsClear(criterion.state)) continue;
    const canonical = criterionById(criterion.criterionId);
    const linked = canonical?.linkedArtifactCodes ?? [];
    const drafted = linked.find((code) => {
      const art = byCode.get(code);
      return (
        art &&
        artifactIsDrafted(art) &&
        art.status !== "approved" &&
        art.status !== "locked"
      );
    });
    if (!drafted || seen.has(drafted)) continue;
    seen.add(drafted);
    const spec = specByCode(drafted);
    out.push({
      id: criterion.criterionId,
      kind: "approve",
      label: `Approve ${spec?.name ?? drafted}`,
      detail: `Clears: ${canonical?.title ?? criterion.criterionId}`,
      artifactCode: drafted,
      criterionId: criterion.criterionId,
    });
  }
  return out;
}

function sendNeeds(
  stage: SourceStageKey,
  artifacts: SourceEventArtifactState[],
): StageNeed[] {
  const comms = STAGE_COMMS[stage];
  if (!comms) return [];
  const art = artifacts.find((a) => a.artifactCode === comms.artifactCode);
  if (!art || !artifactIsDrafted(art)) return []; // nothing to send yet
  return [
    {
      id: `send:${comms.artifactCode}`,
      kind: "send",
      label: comms.label,
      detail:
        "Issue the identical request to every shortlisted vendor — consistent, isolated, audited.",
      blocked: true,
      blockedReason: VENDOR_SEND_NOT_WIRED,
      artifactCode: comms.artifactCode,
    },
  ];
}

// ── helpers (mirror stage-next-move.ts semantics) ────────────────────────────

function nextStageFor(stage: SourceStageKey): SourceStageKey | undefined {
  const index = SOURCE_STAGE_ORDER.indexOf(stage);
  if (index < 0) return undefined;
  return SOURCE_STAGE_ORDER[index + 1];
}

function gateIsClear(state: SourceEventGateCriterion["state"]): boolean {
  return state === "met" || state === "waived";
}

function criterionIsRequired(criterionId: string): boolean {
  const canonical = criterionById(criterionId);
  // Unknown criteria default to required (fail safe — don't let an unmapped
  // criterion silently unblock a stage).
  return canonical ? canonical.required : true;
}

function artifactIsDrafted(artifact: SourceEventArtifactState): boolean {
  if (artifact.body?.trim()) return true;
  return ["needs_review", "approved", "locked", "superseded"].includes(
    artifact.status,
  );
}
