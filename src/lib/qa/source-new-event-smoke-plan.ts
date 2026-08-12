import {
  SOURCE_STAGE_LABELS,
  SOURCE_STAGE_ORDER,
} from "@/lib/source/constants";
import {
  evidenceForStage,
  requiredEvidenceForStage,
} from "@/lib/source/canonical-specs/evidence-requirements";
import {
  gateDefiningSpecsForStage,
  requiredSpecsForStage,
} from "@/lib/source/canonical-specs/artifact-specs";
import type { SourceStageKey } from "@/lib/source/types";

export type SourceNewEventSmokeWorkspace =
  | "steps"
  | "files"
  | "intelligence"
  | "guidebook"
  | "approvals";

export interface SourceNewEventSmokeStage {
  index: number;
  stageKey: SourceStageKey;
  stageLabel: string;
  route: string;
  expectedWorkspaces: SourceNewEventSmokeWorkspace[];
  requiredEvidenceCount: number;
  optionalEvidenceCount: number;
  requiredEvidenceLabels: string[];
  requiredArtifactCodes: string[];
  gateDefiningArtifactCodes: string[];
  mustVerify: string[];
  primaryProofQuestion: string;
}

export interface SourceNewEventSmokePlan {
  planId: string;
  eventId: string;
  persona: "apex-vp-sourcing" | "skyharbor-vp-itops" | "meridian-cdao";
  stages: SourceNewEventSmokeStage[];
  totalStages: number;
  proofPackFields: string[];
  nonMutatingByDefault: boolean;
  deployRule: string;
}

const EXPECTED_WORKSPACES: SourceNewEventSmokeWorkspace[] = [
  "steps",
  "files",
  "intelligence",
  "guidebook",
  "approvals",
];

const PROOF_PACK_FIELDS = [
  "run_id",
  "environment",
  "commit_sha",
  "deploy_run_id",
  "event_id",
  "persona",
  "stage_key",
  "route",
  "screenshot_ref",
  "dom_assertions",
  "evidence_state",
  "intelligence_state",
  "guidebook_state",
  "approval_state",
  "next_action",
] as const;

const PRIMARY_PROOF_QUESTIONS: Record<
  (typeof SOURCE_STAGE_ORDER)[number],
  string
> = {
  strategy:
    "Does the user know the mandate, sponsor, value thesis, and next gate?",
  scope:
    "Does the user know what is in scope, out of scope, missing, and required before RFP?",
  rfp: "Does the user know which RFP package, response template, pricing template, and rubric are ready?",
  responses:
    "Does the user know which vendor responses are received, parse-ready, missing, or not scoreable?",
  evaluation:
    "Does the user know which scores are cited, held, overridden, or blocked?",
  pricing: "Does the user know why vendor pricing is or is not comparable?",
  bafo: "Does the user know which vendor asks create leverage and what remains unresolved?",
  executive_decision:
    "Does the user know the recommendation, value case, risk, and approval conditions?",
  selection:
    "Does the user know what was awarded, what value was committed, and what conditions carry forward?",
  transition:
    "Does the user know the go-live blockers, KT evidence, and obligation readiness?",
  value:
    "Does the user know what value is committed, realized, at risk, or unproven?",
};

export function buildSourceNewEventSmokePlan(input: {
  eventId: string;
  persona?: SourceNewEventSmokePlan["persona"];
}): SourceNewEventSmokePlan {
  const persona = input.persona ?? "apex-vp-sourcing";
  return {
    planId: "SRC57_SOURCE_NEW_EVENT_11_STAGE_SMOKE",
    eventId: input.eventId,
    persona,
    stages: SOURCE_STAGE_ORDER.map((stageKey, index) =>
      buildStageSmoke(stageKey, index + 1, input.eventId),
    ),
    totalStages: SOURCE_STAGE_ORDER.length,
    proofPackFields: [...PROOF_PACK_FIELDS],
    nonMutatingByDefault: true,
    deployRule:
      "Run before and after each runtime slice; ACA deploy proof is required only when merged code changes runtime behavior.",
  };
}

function buildStageSmoke(
  stageKey: (typeof SOURCE_STAGE_ORDER)[number],
  index: number,
  eventId: string,
): SourceNewEventSmokeStage {
  const evidence = evidenceForStage(stageKey);
  const requiredEvidence = requiredEvidenceForStage(stageKey);
  return {
    index,
    stageKey,
    stageLabel: SOURCE_STAGE_LABELS[stageKey],
    route: `/source/events/${encodeURIComponent(eventId)}?stage=${encodeURIComponent(stageKey)}`,
    expectedWorkspaces: EXPECTED_WORKSPACES,
    requiredEvidenceCount: requiredEvidence.length,
    optionalEvidenceCount: evidence.length - requiredEvidence.length,
    requiredEvidenceLabels: requiredEvidence.map((item) => item.label),
    requiredArtifactCodes: requiredSpecsForStage(stageKey).map(
      (item) => item.code,
    ),
    gateDefiningArtifactCodes: gateDefiningSpecsForStage(stageKey).map(
      (item) => item.code,
    ),
    mustVerify: [
      "left rail identifies current stage and prior/future state",
      "main canvas presents one active task area",
      "required evidence is distinguishable from optional evidence",
      "files workspace shows upload/parse/readiness/accepted state",
      "intelligence explains evidence used, missing evidence, caveats, and next action",
      "guidebook names the meeting, invitees, collection list, templates, and unlock output",
      "approval action is disabled until readiness or clearly routes to gap review",
      "next-stage unlock text is visible when the stage is ready",
    ],
    primaryProofQuestion: PRIMARY_PROOF_QUESTIONS[stageKey],
  };
}
