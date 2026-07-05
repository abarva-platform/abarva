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
   * place ("Draft with aVa") instead of navigating away.
   */
  draftArtifactCode?: string;
  /**
   * aVa orientation message shown once when the user first opens this stage
   * with an empty chat thread. Explains what to do and why.
   */
  stageOrientation?: string;
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
  // Shown by aVa once when the user first opens a fresh stage (empty chat thread).
  stageOrientation?: string;
};

const STAGE_DRAFT_CONFIG: Partial<Record<SourceStageKey, StageDraftConfig>> = {
  strategy: {
    artifactCodes: ["d01_strategy_memo"],
    draftTitle: "Draft your Sourcing Strategy Memo",
    draftBody:
      "I'll draft the memo from your intake facts — trigger, scope, value target, archetype, and rigor level. Takes about 60 seconds. You review before anything leaves this workspace.",
    draftPrimary: "Draft with aVa",
    draftedGateTitle: "Clear gates: sponsor sign-off, value target, archetype",
    stageOrientation:
      "You're at **Strategy** — the stage that establishes why this event exists, what it covers, and how it will be run before any vendor sees it.\n\n**What to do here:**\n\n1. **Click 'Draft with aVa' above.** I'll build the Sourcing Strategy Memo from your intake facts in about 60 seconds. You review and refine before it goes anywhere.\n\n2. **Review the draft in the Document tab.** Request edits on anything that doesn't match your intent — scope boundary, value target, decision authority.\n\n3. **Clear 3 gate criteria in the left sidebar:**\n   - *Sourcing strategy memo signed by sponsor* — the decision owner (CIO in this case) has reviewed and approved\n   - *Value target set with range and confidence band* — the savings or outcome target is documented with a range\n   - *Archetype confirmed* — the sourcing type and rigor level are locked\n\n4. **Advance to Scope** unlocks when all 3 are green.\n\nStart with **Draft with aVa** — the memo is the anchor for everything that follows.",
  },
  scope: {
    artifactCodes: ["d04_app_inv", "d05_scope_memo"],
    draftTitle: "Build the application inventory",
    draftBody:
      "Lock exactly what's in and what's out — apps, towers, services, carve-outs — with named evidence sources. The Scope Memo becomes the RFP's foundation; vendors can only respond to what you define here.",
    draftPrimary: "Open scope documents",
    draftedGateTitle: "Clear scope gates before RFP drafting",
    evidenceTitle: "Request the missing scope evidence",
    evidencePrimary: "Open evidence",
    stageOrientation:
      "You're at **Scope** — this stage draws the hard boundary that the RFP will be built on. Vendors respond only to what's defined here, so vagueness now becomes ambiguity in proposals.\n\n**What to do here:**\n\n1. **Open Scope Documents** (button above). Start with the Application Inventory — list every app, assign in/out, and name the baseline source (ticket data, CMDB, asset register).\n\n2. **Draft the Scope Memo.** Once the inventory is shaped, the memo locks the boundary in writing: what services are in scope, what's carved out, and why.\n\n3. **Upload baseline evidence** if you have it — current ticket volumes, SLA history, cloud spend breakdowns. These fill gaps in the memo and feed the RFP.\n\n4. **Clear scope gate criteria** in the left sidebar — scope boundary approved, app inventory signed off — then advance to RFP.\n\nThe most common mistake at this stage: leaving the application inventory vague. If a vendor can't tell whether something is in scope, they'll assume it is and price accordingly.",
  },
  rfp: {
    artifactCodes: ["d09_rfp_pack", "d11_response_checklist"],
    draftTitle: "Draft the RFP and response-control pack",
    draftBody:
      "I'll build the vendor-facing requirements and the structured response pack vendors must complete — so proposals arrive comparable, evidence-backed, and ready for scoring.",
    draftPrimary: "Draft with aVa",
    draftedGateTitle: "Sponsor/procurement sign-off required before release",
    stageOrientation:
      "You're at **RFP** — the stage that puts your sourcing event in front of vendors. What you send defines what comes back.\n\n**What to do here:**\n\n1. **Click 'Draft with aVa' above.** I'll build the RFP and response-control pack from your Strategy and Scope outputs. The response-control pack tells vendors exactly how to structure their proposals so you can compare apples to apples.\n\n2. **Review both documents.** Check that requirements are precise — vague requirements invite vague responses. SLA terms, pricing structure, transition obligations, and liability caps should all be explicit.\n\n3. **Get sponsor and procurement sign-off** (gate criteria) before the RFP goes to vendors. Once it's out, changes are difficult.\n\n4. **Release to vendors** — the procurement lead owns vendor communications from this point.\n\nThe RFP's quality determines how much leverage you have in evaluation. An RFP that requires structured pricing and specific SLA evidence gives you far more to work with than an open-ended one.",
  },
  responses: {
    artifactCodes: ["d11_response_checklist"],
    draftTitle: "Review response-control completeness",
    draftBody:
      "Track each vendor against the response-control pack, then flag missing claim, pricing, SLA, assumption, transition, and exception fields before evaluation scoring starts.",
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
    draftPrimary: "Draft with aVa",
    draftedGateTitle: "Clear BAFO gates before executive decision",
  },
  executive_decision: {
    artifactCodes: ["d24_decision_brief"],
    draftTitle: "Draft the decision brief",
    draftBody:
      "Lead with the recommendation, savings, trade-off, and dissent before routing to executive approvers.",
    draftPrimary: "Draft with aVa",
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
        config.draftPrimary === "Draft with aVa"
          ? "Author manually"
          : "Open document workspace",
      secondaryTarget: "document",
      gates,
      gateSummary: buildGateSummary(gates),
      nextStage,
      draftArtifactCode: config.artifactCodes[0],
      stageOrientation: config.stageOrientation,
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
