import { criterionById } from "./canonical-specs";
import { SOURCE_STAGE_LABELS, SOURCE_STAGE_ORDER } from "./constants";
import type {
  SourceEventArtifactState,
  SourceEventGateCriterion,
} from "./canvas-substrate";
import type { SourceStageKey } from "./types";

export type StageNextMoveActionTarget =
  | "document"
  | "gate"
  | "evidence"
  | "advance";

export interface StageNextMoveGate {
  id: string;
  label: string;
  state: SourceEventGateCriterion["state"];
}

export interface StageNextMoveView {
  stage: SourceStageKey;
  eyebrow: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryTarget: StageNextMoveActionTarget;
  secondaryLabel?: string;
  secondaryTarget?: StageNextMoveActionTarget;
  gates: StageNextMoveGate[];
  gateSummary: string;
  nextStage?: SourceStageKey;
  /**
   * The artifact this stage's draft move produces (e.g. `d01_strategy_memo`).
   * Set only on the draft move so the canvas can run governed generation in
   * place ("Draft with Ava") instead of navigating away.
   */
  draftArtifactCode?: string;
}

export interface ResolveStageNextMoveInput {
  stage: SourceStageKey;
  artifacts: SourceEventArtifactState[];
  criteria: SourceEventGateCriterion[];
}

type StageDraftConfig = {
  artifactCodes: string[];
  draftTitle: string;
  draftBody: string;
  draftPrimary: string;
  draftedGateTitle?: string;
  evidenceTitle?: string;
  evidencePrimary?: string;
};

const STAGE_DRAFT_CONFIG: Partial<Record<SourceStageKey, StageDraftConfig>> = {
  strategy: {
    artifactCodes: ["d01_strategy_memo"],
    draftTitle: "Draft your Sourcing Strategy Memo",
    draftBody:
      "Ava drafts from the event facts: why now, scope, value target, archetype, and rigor. You review before anything external uses it.",
    draftPrimary: "Draft with Ava",
    draftedGateTitle: "Clear gates: sponsor sign-off, value target, archetype",
  },
  scope: {
    artifactCodes: ["d04_app_inv", "d05_scope_memo"],
    draftTitle: "Build the application inventory",
    draftBody:
      "Confirm what is in scope, what is out, and which baseline sources support the boundary before RFP work begins.",
    draftPrimary: "Open scope documents",
    draftedGateTitle: "Clear scope gates before RFP drafting",
    evidenceTitle: "Request the missing scope evidence",
    evidencePrimary: "Open evidence",
  },
  rfp: {
    artifactCodes: ["d09_rfp_pack"],
    draftTitle: "Draft the RFP package",
    draftBody:
      "Prepare the vendor-facing requirements, response format, scoring rubric, and sign-off trail from the locked scope.",
    draftPrimary: "Draft with Ava",
    draftedGateTitle: "Sponsor sign-off required before release",
  },
  responses: {
    artifactCodes: ["d11_response_checklist"],
    draftTitle: "Review response completeness",
    draftBody:
      "Track each vendor response, parse uploaded response packs, and flag gaps before evaluation scoring starts.",
    draftPrimary: "Open completeness matrix",
    draftedGateTitle: "Resolve response gaps before evaluation",
  },
  evaluation: {
    artifactCodes: ["d16_scorecard"],
    draftTitle: "Complete vendor scoring",
    draftBody:
      "Finish scoring against locked criteria, capture dissent, and document the rationale before pricing begins.",
    draftPrimary: "Continue scoring",
    draftedGateTitle: "Clear scoring gates before pricing",
  },
  pricing: {
    artifactCodes: ["d19_pricing_workbook"],
    draftTitle: "Normalize current pricing",
    draftBody:
      "Open the TCO workbook, normalize vendor pricing, and flag anomalies before BAFO questions are drafted.",
    draftPrimary: "Open TCO workbook",
    draftedGateTitle: "Clear pricing gates before BAFO",
  },
  bafo: {
    artifactCodes: ["d22_bafo_question_pack"],
    draftTitle: "Draft Round 2 questions for open P0 traps",
    draftBody:
      "Use the trap log and pricing variance to draft targeted BAFO questions for finalist vendors.",
    draftPrimary: "Draft with Ava",
    draftedGateTitle: "Clear BAFO gates before executive decision",
  },
  executive_decision: {
    artifactCodes: ["d24_decision_brief"],
    draftTitle: "Draft the decision brief",
    draftBody:
      "Lead with the recommendation, savings, trade-off, and dissent before routing to executive approvers.",
    draftPrimary: "Draft with Ava",
    draftedGateTitle: "Route decision brief for co-approval",
  },
  selection: {
    artifactCodes: ["d27_selection_memo", "d28_contract_record"],
    draftTitle: "Diff BAFO commitments vs contract draft",
    draftBody:
      "Confirm the selection memo and contract record align with the approved decision before transition starts.",
    draftPrimary: "Run alignment check",
    draftedGateTitle: "Clear selection gates before transition",
  },
  transition: {
    artifactCodes: ["d29_transition_plan"],
    draftTitle: "Build the KT plan with vendor PM",
    draftBody:
      "Create the milestone plan, checkpoint decisions, and knowledge-transfer evidence needed for go-live readiness.",
    draftPrimary: "Open transition plan",
    draftedGateTitle: "Schedule readiness review",
  },
  value: {
    artifactCodes: ["d32_value_ledger"],
    draftTitle: "Lock baseline with CFO attestation",
    draftBody:
      "Initialize the value ledger and assign measurement ownership before the event can close.",
    draftPrimary: "Request CFO attestation",
    draftedGateTitle: "Resolve value measurement gates",
  },
};

export function resolveStageNextMove({
  stage,
  artifacts,
  criteria,
}: ResolveStageNextMoveInput): StageNextMoveView {
  const nextStage = nextStageFor(stage);
  const gates = criteria.map(toNextMoveGate);
  const openGates = gates.filter((g) => !gateIsClear(g.state));
  const allGatesClear = gates.length > 0 && openGates.length === 0;
  const config = STAGE_DRAFT_CONFIG[stage] ?? {
    artifactCodes: [],
    draftTitle: `Work ${SOURCE_STAGE_LABELS[stage] ?? stage}`,
    draftBody:
      "Open the stage workspace, complete the required deliverables, then clear the required-to-advance checklist.",
    draftPrimary: "Open document workspace",
    draftedGateTitle: "Clear the required-to-advance checklist",
  };

  if (allGatesClear) {
    const title = nextStage
      ? `Advance to ${SOURCE_STAGE_LABELS[nextStage]}`
      : "Close the value loop";
    return {
      stage,
      eyebrow: "Next move",
      title,
      body: nextStage
        ? `All required criteria for ${SOURCE_STAGE_LABELS[stage]} are clear. Advance only when the human owner is ready to move the event forward.`
        : "All value-stage criteria are clear. Close only after the accountable owner accepts the final record.",
      primaryLabel: nextStage
        ? `Advance to ${SOURCE_STAGE_LABELS[nextStage]}`
        : "Close event",
      primaryTarget: "advance",
      secondaryLabel: "Review gate checklist",
      secondaryTarget: "gate",
      gates,
      gateSummary: buildGateSummary(gates),
      nextStage,
    };
  }

  if (config.evidenceTitle && hasMissingEvidenceSignal(criteria)) {
    return {
      stage,
      eyebrow: "Next move",
      title: config.evidenceTitle,
      body: "The stage is blocked by missing or incomplete evidence. Request the exact source, owner, and due date before drafting around assumptions.",
      primaryLabel: config.evidencePrimary ?? "Open evidence",
      primaryTarget: "evidence",
      secondaryLabel: "Open gate checklist",
      secondaryTarget: "gate",
      gates,
      gateSummary: buildGateSummary(gates),
      nextStage,
    };
  }

  if (stageNeedsDraft(config.artifactCodes, artifacts)) {
    return {
      stage,
      eyebrow: "Next move",
      title: config.draftTitle,
      body: config.draftBody,
      primaryLabel: config.draftPrimary,
      primaryTarget: "document",
      secondaryLabel:
        config.draftPrimary === "Draft with Ava"
          ? "Author manually"
          : "Open document workspace",
      secondaryTarget: "document",
      gates,
      gateSummary: buildGateSummary(gates),
      nextStage,
      draftArtifactCode: config.artifactCodes[0],
    };
  }

  return {
    stage,
    eyebrow: "Next move",
    title: config.draftedGateTitle ?? "Clear the required-to-advance checklist",
    body:
      openGates.length > 0
        ? `The stage deliverable exists. Clear ${openGates.length} remaining required item${openGates.length === 1 ? "" : "s"} before advancing.`
        : "Review the gate checklist, confirm the accountable owner, and advance only when the human decision is recorded.",
    primaryLabel: "Open gate checklist",
    primaryTarget: "gate",
    secondaryLabel: "Open document workspace",
    secondaryTarget: "document",
    gates,
    gateSummary: buildGateSummary(gates),
    nextStage,
  };
}

function nextStageFor(stage: SourceStageKey): SourceStageKey | undefined {
  const index = SOURCE_STAGE_ORDER.indexOf(stage);
  if (index < 0) return undefined;
  return SOURCE_STAGE_ORDER[index + 1];
}

function toNextMoveGate(
  criterion: SourceEventGateCriterion,
): StageNextMoveGate {
  const canonical = criterionById(criterion.criterionId);
  return {
    id: criterion.criterionId,
    label: simplifyGateLabel(canonical?.title ?? criterion.criterionId),
    state: criterion.state,
  };
}

function simplifyGateLabel(label: string): string {
  if (/sourcing strategy memo signed by sponsor/i.test(label)) {
    return "Sponsor sign-off";
  }
  if (/value target set/i.test(label)) {
    return "Value target set";
  }
  if (/archetype \+ rigor level chosen/i.test(label)) {
    return "Archetype confirmed";
  }

  return label
    .replace(/\bsigned by sponsor\b/i, "sign-off")
    .replace(/\bwith range and confidence band\b/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function gateIsClear(state: SourceEventGateCriterion["state"]): boolean {
  return state === "met" || state === "waived";
}

function stageNeedsDraft(
  artifactCodes: string[],
  artifacts: SourceEventArtifactState[],
): boolean {
  const candidates = artifactCodes.length
    ? artifacts.filter((artifact) =>
        artifactCodes.includes(artifact.artifactCode),
      )
    : artifacts.filter((artifact) => artifact.requirementLevel === "required");
  if (candidates.length === 0) return artifacts.length === 0;
  return candidates.some((artifact) => !artifactIsDrafted(artifact));
}

function artifactIsDrafted(artifact: SourceEventArtifactState): boolean {
  if (artifact.body?.trim()) return true;
  return ["needs_review", "approved", "locked", "superseded"].includes(
    artifact.status,
  );
}

function hasMissingEvidenceSignal(
  criteria: SourceEventGateCriterion[],
): boolean {
  return criteria.some(
    (criterion) =>
      criterion.state !== "met" &&
      criterion.state !== "waived" &&
      criterion.criterionId.toUpperCase().startsWith("EVID-"),
  );
}

function buildGateSummary(gates: StageNextMoveGate[]): string {
  if (gates.length === 0) return "No gate criteria loaded";
  const cleared = gates.filter((gate) => gateIsClear(gate.state)).length;
  return `${cleared} of ${gates.length} cleared to advance`;
}
