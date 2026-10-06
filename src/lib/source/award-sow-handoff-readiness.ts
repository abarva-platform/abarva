import { SOURCE_STAGE_ORDER, normalizeSourceStageKey } from "./constants";
import type {
  SourceAwardSowArtifactInput,
  SourceCanonicalContractProjectionPlan,
  SourceContract360PublicationPlanner,
  SourceContractFormationComponent,
  SourceContractFormationPackageReadiness,
  SourceContractFormationState,
  SourceOptimizePathPlan,
  SourceAwardSowHandoffCheckpoint,
  SourceAwardSowHandoffReadiness,
  SourceAwardSowHandoffReadinessInput,
  SourceAwardSowHandoffReadinessStatus,
  SourceAwardSowStageInput,
} from "./award-sow-handoff-readiness-types";
import type { SourceArtifactStatus, SourceStageKey } from "./types";

const DEFAULT_GENERATED_AT = "2026-04-26T00:00:00.000Z";

const SOURCE_MODULES_USED = [
  "event-stage-gate-status",
  "artifact-status-strip",
  "award-sow-publication-planner",
  "canonical-contract-projection-planner",
  "source-optimize-path-planner",
] as const;

const CONTRACT360_PUBLICATION_REVIEW_STEPS = [
  "Map accepted executed evidence to the existing canonical contract identity.",
  "Review clause, SOW, pricing, SLA, exit, and change-control provenance before publication.",
  "Require a human-approved canonical writer or data-build job before any Contract 360 row is created.",
] as const;

const CANONICAL_CONTRACT_IDENTITY_REVIEW_STEPS = [
  "Human reviewer confirms the candidate canonical contract identity against executed evidence.",
  "Approved canonical writer or data-build job creates the contract identity and Contract 360 projection.",
  "Optimize intake may prefill only after the canonical contract identity exists.",
] as const;

const OPTIMIZE_PATH_REVIEW_STEPS = [
  "Open Contract 360 review against the human-approved canonical contract identity.",
  "Confirm Optimize is using the canonical contract id, not the Source event id or artifact filename.",
  "Launch Optimize only after the governed contract projection exists.",
] as const;

const EXECUTED_AGREEMENT_OR_FINAL_SOW_PATTERNS = [
  /\bsigned (?:contract|agreement|statement of work|sow)\b/,
  /\bexecuted (?:contract|agreement|statement of work|sow)\b/,
  /\bexecuted agreement\b/,
] as const;

const NON_EXECUTED_AGREEMENT_PATTERNS = [
  /\bawaiting signature\b/,
  /\bblocked\b/,
  /\bcontract-ready pending signature\b/,
  /\bfinal (?:statement of work|sow) missing\b/,
  /\bgap log\b/,
  /\bmissing final (?:statement of work|sow)\b/,
  /\bnot signed\b/,
  /\bpending (?:e-?signature|signature)\b/,
  /\bsigned contract (?:has )?not (?:been )?uploaded\b/,
  /\bunsigned\b/,
] as const;

const CONTRACT_FORMATION_COMPONENTS = [
  "reviewed_selection_memo",
  "approved_pricing",
  "governed_clause_library",
  "sow_scope",
  "sla_service_level_provenance",
  "exit_rights_provenance",
  "change_control_provenance",
  "named_approval_authority",
  "evidence_lineage",
] as const satisfies readonly SourceContractFormationComponent[];

const CONTRACT_FORMATION_BLOCKERS = {
  reviewed_selection_memo:
    "Reviewed selection memo is missing from the governed contract-formation package.",
  approved_pricing:
    "Approved pricing is missing from the governed contract-formation package.",
  governed_clause_library:
    "Governed clause/library references are missing from the contract-formation package.",
  sow_scope:
    "SOW scope is missing from the governed contract-formation package.",
  sla_service_level_provenance:
    "SLA/service-level provenance is missing from the contract-formation package.",
  exit_rights_provenance:
    "Exit-rights provenance is missing from the contract-formation package.",
  change_control_provenance:
    "Change-control provenance is missing from the contract-formation package.",
  named_approval_authority:
    "Named approval authority is missing from the contract-formation package.",
  evidence_lineage:
    "Evidence lineage is missing from the contract-formation package.",
  executed_signature_authority:
    "Executed agreement or SOW evidence with named signature authority is not approved/locked in the event artifact record.",
} as const satisfies Record<SourceContractFormationComponent, string>;

const REVIEWED_SELECTION_MEMO_PATTERNS = [
  /\bd27_selection_memo\b/,
  /\bselection memo\b/,
  /\bselection\b/,
] as const;

const APPROVED_PRICING_PATTERNS = [
  /\bapproved pricing\b/,
  /\bpricing workbook\b/,
  /\bpricing schedule\b/,
  /\bpricing exhibit\b/,
] as const;

const GOVERNED_CLAUSE_PATTERNS = [
  /\bgoverned clause\b/,
  /\bclause library\b/,
  /\blibrary references\b/,
  /\bapproved clause\b/,
] as const;

const SOW_SCOPE_PATTERNS = [
  /\bsow scope\b/,
  /\bscope boundary\b/,
  /\bservice boundary\b/,
  /\bstatement of work scope\b/,
] as const;

const SLA_SERVICE_LEVEL_PROVENANCE_PATTERNS = [
  /\bsla\b/,
  /\bservice level\b/,
  /\bservice-credit\b/,
  /\bservice credit\b/,
] as const;

const EXIT_RIGHTS_PROVENANCE_PATTERNS = [
  /\bdata return\b/,
  /\bexit\b/,
  /\btermination\b/,
  /\btermination for convenience\b/,
  /\brenewal notice\b/,
] as const;

const CHANGE_CONTROL_PROVENANCE_PATTERNS = [
  /\bchange-control\b/,
  /\bchange control\b/,
  /\bchange order\b/,
  /\bscope-change\b/,
  /\bscope change\b/,
] as const;

const NAMED_APPROVAL_AUTHORITY_PATTERNS = [
  /\bnamed approval authority\b/,
  /\bapproval authority\b/,
  /\bapproved by named\b/,
] as const;

const EVIDENCE_LINEAGE_PATTERNS = [
  /\bevidence lineage\b/,
  /\blineage\b/,
  /\bevidence-backed\b/,
] as const;

const PENDING_SIGNATURE_PATTERNS = [
  /\bawaiting signature\b/,
  /\bcontract-ready pending signature\b/,
  /\bpending (?:e-?signature|signature)\b/,
  /\bsignature packet\b/,
] as const;

const SIGNATURE_AUTHORITY_PATTERNS = [
  /\bnamed signature authority\b/,
  /\bsigned by named\b/,
  /\bsignature authority\b/,
] as const;

const MISSING_SIGNATURE_AUTHORITY_PATTERNS = [
  /\bsignature authority (?:is )?not (?:yet )?recorded\b/,
  /\bsigner authority is not named\b/,
  /\bauthority is not named\b/,
] as const;

function sortUnique(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  ).sort();
}

function identityKeyPart(value: string): string {
  return value.trim().replace(/\s+/g, "-").replace(/[^A-Za-z0-9:_-]/g, "_");
}

function artifactIsFinal(status: SourceArtifactStatus): boolean {
  return status === "approved" || status === "locked";
}

function artifactText(artifact: SourceAwardSowArtifactInput): string {
  return [artifact.id, artifact.title, artifact.summary ?? ""]
    .join(" ")
    .toLowerCase();
}

function artifactMatches(
  artifact: SourceAwardSowArtifactInput,
  patterns: readonly RegExp[],
): boolean {
  const text = artifactText(artifact);
  return patterns.some((pattern) => pattern.test(text));
}

function finalArtifactsMatching(
  artifacts: readonly SourceAwardSowArtifactInput[],
  patterns: readonly RegExp[],
): SourceAwardSowArtifactInput[] {
  return artifacts.filter(
    (artifact) =>
      artifactIsFinal(artifact.status) && artifactMatches(artifact, patterns),
  );
}

function evidenceLinesFor(
  component: SourceContractFormationComponent,
  artifacts: readonly SourceAwardSowArtifactInput[],
): string[] {
  return artifacts.map(
    (artifact) =>
      `${component.replaceAll("_", " ")}: ${artifact.title} is ${artifact.status}.`,
  );
}

function hasFinalArtifactMatching(
  artifacts: readonly SourceAwardSowArtifactInput[],
  patterns: readonly RegExp[],
): boolean {
  return finalArtifactsMatching(artifacts, patterns).length > 0;
}

function finalExecutedAgreementOrSowArtifactsWithSignatureAuthority(
  artifacts: readonly SourceAwardSowArtifactInput[],
): SourceAwardSowArtifactInput[] {
  return finalExecutedAgreementOrSowArtifacts(artifacts).filter((artifact) => {
    const text = artifactText(artifact);
    if (
      MISSING_SIGNATURE_AUTHORITY_PATTERNS.some((pattern) =>
        pattern.test(text),
      )
    ) {
      return false;
    }

    return SIGNATURE_AUTHORITY_PATTERNS.some((pattern) => pattern.test(text));
  });
}

function buildContractFormationPackageReadiness(
  artifacts: readonly SourceAwardSowArtifactInput[],
): SourceContractFormationPackageReadiness {
  const selectedEvidence: Partial<
    Record<SourceContractFormationComponent, SourceAwardSowArtifactInput[]>
  > = {};

  selectedEvidence.reviewed_selection_memo = finalArtifactsMatching(
    artifacts,
    REVIEWED_SELECTION_MEMO_PATTERNS,
  );
  selectedEvidence.approved_pricing = finalArtifactsMatching(
    artifacts,
    APPROVED_PRICING_PATTERNS,
  );
  selectedEvidence.governed_clause_library = finalArtifactsMatching(
    artifacts,
    GOVERNED_CLAUSE_PATTERNS,
  );
  selectedEvidence.sow_scope = finalArtifactsMatching(
    artifacts,
    SOW_SCOPE_PATTERNS,
  );
  selectedEvidence.sla_service_level_provenance = finalArtifactsMatching(
    artifacts,
    SLA_SERVICE_LEVEL_PROVENANCE_PATTERNS,
  );
  selectedEvidence.exit_rights_provenance = finalArtifactsMatching(
    artifacts,
    EXIT_RIGHTS_PROVENANCE_PATTERNS,
  );
  selectedEvidence.change_control_provenance = finalArtifactsMatching(
    artifacts,
    CHANGE_CONTROL_PROVENANCE_PATTERNS,
  );
  selectedEvidence.named_approval_authority = finalArtifactsMatching(
    artifacts,
    NAMED_APPROVAL_AUTHORITY_PATTERNS,
  );
  selectedEvidence.evidence_lineage = finalArtifactsMatching(
    artifacts,
    EVIDENCE_LINEAGE_PATTERNS,
  );
  selectedEvidence.executed_signature_authority =
    finalExecutedAgreementOrSowArtifactsWithSignatureAuthority(artifacts);

  const includedComponents = CONTRACT_FORMATION_COMPONENTS.filter(
    (component) => (selectedEvidence[component]?.length ?? 0) > 0,
  );
  const missingComponents = CONTRACT_FORMATION_COMPONENTS.filter(
    (component) => !includedComponents.includes(component),
  );
  const executedSignatureAuthority =
    selectedEvidence.executed_signature_authority ?? [];
  const packageReady = missingComponents.length === 0;
  const pendingSignature =
    packageReady && hasFinalArtifactMatching(artifacts, PENDING_SIGNATURE_PATTERNS);
  const state: SourceContractFormationState = !packageReady
    ? "draft"
    : executedSignatureAuthority.length > 0
      ? "executed"
      : pendingSignature
        ? "pending_signature"
        : "contract_ready";

  const evidence = checkpointEvidence(
    ([
      ...includedComponents,
      ...(executedSignatureAuthority.length > 0
        ? (["executed_signature_authority"] as const)
        : []),
    ] as SourceContractFormationComponent[]).flatMap((component) =>
      evidenceLinesFor(component, selectedEvidence[component] ?? []),
    ),
  );

  return {
    state,
    includedComponents:
      state === "executed"
        ? [...includedComponents, "executed_signature_authority"]
        : includedComponents,
    missingComponents,
    evidence,
  };
}

function finalArtifacts(
  artifacts: readonly SourceAwardSowArtifactInput[],
  patterns: readonly RegExp[],
): SourceAwardSowArtifactInput[] {
  return artifacts.filter(
    (artifact) =>
      artifactIsFinal(artifact.status) && artifactMatches(artifact, patterns),
  );
}

function finalExecutedAgreementOrSowArtifacts(
  artifacts: readonly SourceAwardSowArtifactInput[],
): SourceAwardSowArtifactInput[] {
  return artifacts.filter((artifact) => {
    if (!artifactIsFinal(artifact.status)) return false;

    const text = artifactText(artifact);
    if (NON_EXECUTED_AGREEMENT_PATTERNS.some((pattern) => pattern.test(text))) {
      return false;
    }

    return EXECUTED_AGREEMENT_OR_FINAL_SOW_PATTERNS.some((pattern) =>
      pattern.test(text),
    );
  });
}

function stageByKey(
  stages: readonly SourceAwardSowStageInput[],
  keys: readonly SourceStageKey[],
): SourceAwardSowStageInput | undefined {
  return stages.find((stage) => {
    const canonical = normalizeSourceStageKey(stage.key);
    return canonical ? keys.includes(canonical) : keys.includes(stage.key);
  });
}

function stageIsComplete(stage: SourceAwardSowStageInput | undefined): boolean {
  return stage?.status === "complete" || stage?.gate?.status === "approved";
}

function stageIsOpen(
  currentStage: SourceStageKey,
  target: SourceStageKey,
): boolean {
  const current = normalizeSourceStageKey(currentStage) ?? currentStage;
  const currentIndex = SOURCE_STAGE_ORDER.indexOf(current);
  const targetIndex = SOURCE_STAGE_ORDER.indexOf(target);
  return currentIndex >= 0 && targetIndex >= 0 && currentIndex >= targetIndex;
}

function firstBlocker(
  checkpoints: SourceAwardSowHandoffCheckpoint[],
): SourceAwardSowHandoffCheckpoint | undefined {
  return checkpoints.find((checkpoint) => checkpoint.blockers.length > 0);
}

function statusFromBlockedCheckpoint(
  checkpoint: SourceAwardSowHandoffCheckpoint | undefined,
): SourceAwardSowHandoffReadinessStatus {
  switch (checkpoint?.key) {
    case "candidate_selection":
      return "blocked_candidate_selection";
    case "approval_readiness":
      return "blocked_approval_readiness";
    case "contract_formation_package":
      return "blocked_contract_formation_package";
    case "executed_agreement_sow":
      return "blocked_executed_agreement_sow";
    case "contract360_handoff":
      return "blocked_contract360_handoff";
    default:
      return "ready_for_contract360_handoff";
  }
}

function checkpointEvidence(items: string[]): string[] {
  return sortUnique(items);
}

function nextActionFor(
  status: SourceAwardSowHandoffReadinessStatus,
  blockers: readonly string[],
): string {
  if (status === "ready_for_contract360_handoff") {
    return "Open Contract 360 handoff review and confirm the canonical contract record mapping.";
  }

  return (
    blockers[0] ?? "Resolve the first blocked Stage 08 readiness checkpoint."
  );
}

function buildContract360PublicationPlanner({
  contractFormationPackage,
  currentStageKey,
  acceptedExecutedEvidence,
}: {
  contractFormationPackage: SourceContractFormationPackageReadiness;
  currentStageKey: SourceStageKey;
  acceptedExecutedEvidence: readonly SourceAwardSowArtifactInput[];
}): SourceContract360PublicationPlanner {
  const stageOpen = stageIsOpen(currentStageKey, "transition");
  const acceptedEvidence = acceptedExecutedEvidence.map(
    (artifact) => `${artifact.title} (${artifact.status})`,
  );

  let state: SourceContract360PublicationPlanner["state"] =
    "ready_for_publication_review";
  const blockers: string[] = [];

  if (contractFormationPackage.missingComponents.length > 0) {
    state = "blocked_contract_formation_package";
    blockers.push(
      "Contract formation provenance is incomplete; canonical publication review is blocked.",
    );
  } else if (acceptedExecutedEvidence.length === 0) {
    state = "blocked_no_accepted_executed_evidence";
    blockers.push(
      "No accepted executed agreement or SOW evidence with named signature authority is present.",
    );
  } else if (!stageOpen) {
    state = "blocked_stage_not_transition";
    blockers.push(
      "Event has not reached Transition, so Contract 360 publication review is not open.",
    );
  }

  return {
    state,
    target: "canonical_contract_and_contract360",
    publicationAllowed: false,
    acceptedExecutedEvidence: checkpointEvidence(acceptedEvidence),
    plannedReviewSteps: [...CONTRACT360_PUBLICATION_REVIEW_STEPS],
    blockedWrites: [
      "canonical_contract_row",
      "contract360_projection_row",
      "supplier_notification",
    ],
    blockers: checkpointEvidence(blockers),
  };
}

function buildCanonicalContractProjectionPlan({
  event,
  contractFormationPackage,
  acceptedExecutedEvidence,
}: {
  event: SourceAwardSowHandoffReadinessInput["event"];
  contractFormationPackage: SourceContractFormationPackageReadiness;
  acceptedExecutedEvidence: readonly SourceAwardSowArtifactInput[];
}): SourceCanonicalContractProjectionPlan {
  const stageOpen = stageIsOpen(event.currentStageKey, "transition");
  const blockers: string[] = [];
  let state: SourceCanonicalContractProjectionPlan["state"] =
    "ready_for_identity_review";

  if (contractFormationPackage.missingComponents.length > 0) {
    state = "blocked_contract_formation_package";
    blockers.push(
      "Canonical contract identity review is blocked until the governed contract-formation package is complete.",
    );
  } else if (acceptedExecutedEvidence.length === 0) {
    state = "blocked_no_accepted_executed_evidence";
    blockers.push(
      "Canonical contract identity review requires accepted executed agreement or SOW evidence with named signature authority.",
    );
  } else if (!stageOpen) {
    state = "blocked_stage_not_transition";
    blockers.push(
      "Canonical contract identity review is blocked until the event reaches Transition.",
    );
  }

  const executedEvidence = acceptedExecutedEvidence[0] ?? null;
  const candidateIdentityKey =
    state === "ready_for_identity_review" && executedEvidence
      ? `pending_canonical_contract:${identityKeyPart(event.id)}:${identityKeyPart(executedEvidence.id)}`
      : null;
  const executedEvidenceLine = executedEvidence
    ? `${executedEvidence.title} (${executedEvidence.status})`
    : "";

  return {
    state,
    candidateIdentityKey,
    identityBasis: checkpointEvidence([
      `source_event:${event.id}`,
      executedEvidence ? `executed_evidence:${executedEvidence.id}` : "",
      ...contractFormationPackage.includedComponents.map(
        (component) => `formation_component:${component}`,
      ),
    ]),
    evidence: checkpointEvidence([
      executedEvidenceLine,
      ...contractFormationPackage.evidence,
    ]),
    reviewSteps: [...CANONICAL_CONTRACT_IDENTITY_REVIEW_STEPS],
    writeAllowed: false,
    blockedWrites: [
      "canonical_contract_identity",
      "contract360_projection_row",
      "optimize_case",
    ],
    blockers: checkpointEvidence(blockers),
  };
}

function buildOptimizePathPlan(
  canonicalContractProjection: SourceCanonicalContractProjectionPlan,
): SourceOptimizePathPlan {
  const ready =
    canonicalContractProjection.state === "ready_for_identity_review" &&
    canonicalContractProjection.candidateIdentityKey !== null;
  const launchBlocker =
    "Optimize cannot be launched from Stage 08 until a human-approved canonical contract identity exists.";

  return {
    state: ready
      ? "ready_for_optimize_review"
      : "blocked_canonical_contract_identity",
    route: "/source/optimize",
    prefillContractId: null,
    launchAllowed: false,
    evidence: checkpointEvidence([
      canonicalContractProjection.candidateIdentityKey
        ? `Candidate identity awaiting review: ${canonicalContractProjection.candidateIdentityKey}`
        : "",
      ...canonicalContractProjection.evidence,
    ]),
    reviewSteps: [...OPTIMIZE_PATH_REVIEW_STEPS],
    blockers: checkpointEvidence([
      ...canonicalContractProjection.blockers,
      launchBlocker,
    ]),
  };
}

export function buildSourceAwardSowHandoffReadiness(
  input: SourceAwardSowHandoffReadinessInput,
): SourceAwardSowHandoffReadiness {
  const event = input.event;
  const generatedAt = input.generatedAt ?? DEFAULT_GENERATED_AT;
  const selectionReadiness = input.selectionReadiness;

  const selectionStage = stageByKey(event.stages, ["selection"]);
  const executiveStage = stageByKey(event.stages, ["executive_decision"]);
  const transitionStage = stageByKey(event.stages, ["transition"]);
  const selectionArtifacts = finalArtifacts(event.artifacts, [
    /\bd27_selection_memo\b/,
    /\bselection\b/,
    /\baward\b/,
  ]);
  const approvalArtifacts = finalArtifacts(event.artifacts, [
    /\bd24_decision_brief\b/,
    /\bapproval\b/,
    /\bdecision\b/,
    /\bsteward signoff\b/,
  ]);
  const agreementArtifacts = finalExecutedAgreementOrSowArtifacts(
    event.artifacts,
  );
  const acceptedExecutedEvidence =
    finalExecutedAgreementOrSowArtifactsWithSignatureAuthority(event.artifacts);
  const handoffArtifacts = finalArtifacts(event.artifacts, [
    /\bd28_contract_record\b/,
    /\bd29_transition_plan\b/,
    /\bcontract 360\b/,
    /\bhandoff\b/,
    /\btransition plan\b/,
  ]);
  const selectionBlockers = sortUnique([
    ...(selectionReadiness?.unresolvedGateIssues ?? []),
    ...(selectionReadiness?.unresolvedCommercialIssues ?? []),
    ...(selectionReadiness?.unresolvedEvidenceIssues ?? []),
    selectionStage?.gate?.blocker ?? "",
  ]);

  const candidateSelectionBlockers =
    selectionReadiness?.selectionReviewReady ||
    stageIsComplete(selectionStage) ||
    selectionArtifacts.length > 0
      ? []
      : [
          selectionBlockers[0] ??
            "Candidate selection is not ready for award/SOW handoff.",
        ];
  const approvalBlockers =
    stageIsComplete(executiveStage) ||
    stageIsComplete(selectionStage) ||
    approvalArtifacts.length > 0
      ? []
      : [
          selectionStage?.gate?.blocker ??
            executiveStage?.gate?.blocker ??
            "Approval readiness is not proven by an approved executive decision, selection gate, or decision artifact.",
        ];
  const contractFormationPackage = buildContractFormationPackageReadiness(
    event.artifacts,
  );
  const publicationPlanner = buildContract360PublicationPlanner({
    contractFormationPackage,
    currentStageKey: event.currentStageKey,
    acceptedExecutedEvidence,
  });
  const canonicalContractProjection = buildCanonicalContractProjectionPlan({
    event,
    contractFormationPackage,
    acceptedExecutedEvidence,
  });
  const optimizePath = buildOptimizePathPlan(canonicalContractProjection);
  const contractFormationBlockers =
    contractFormationPackage.missingComponents.map(
      (component) => CONTRACT_FORMATION_BLOCKERS[component],
    );
  const agreementBlockers =
    contractFormationPackage.state === "executed"
      ? []
      : [CONTRACT_FORMATION_BLOCKERS.executed_signature_authority];
  const handoffBlockers =
    contractFormationBlockers.length === 0 &&
    agreementBlockers.length === 0 &&
    (stageIsOpen(event.currentStageKey, "transition") ||
      handoffArtifacts.length > 0)
      ? []
      : [
          contractFormationBlockers[0] ??
          agreementBlockers[0] ??
            transitionStage?.gate?.blocker ??
            "Contract 360 handoff is not ready until executed agreement/SOW evidence is present and the event has reached Transition.",
        ];

  const checkpoints: SourceAwardSowHandoffCheckpoint[] = [
    {
      key: "candidate_selection",
      label: "Candidate selection",
      status: candidateSelectionBlockers.length === 0 ? "completed" : "blocked",
      completedEvidence: checkpointEvidence([
        selectionReadiness?.selectionReviewReady
          ? "Vendor selection readiness is clear."
          : "",
        stageIsComplete(selectionStage)
          ? "Selection stage or gate is complete."
          : "",
        ...selectionArtifacts.map(
          (artifact) => `${artifact.title} is ${artifact.status}.`,
        ),
      ]),
      blockers: checkpointEvidence(candidateSelectionBlockers),
    },
    {
      key: "approval_readiness",
      label: "Approval readiness",
      status: approvalBlockers.length === 0 ? "completed" : "blocked",
      completedEvidence: checkpointEvidence([
        stageIsComplete(executiveStage)
          ? "Executive decision stage or gate is approved."
          : "",
        stageIsComplete(selectionStage) ? "Selection gate is approved." : "",
        ...approvalArtifacts.map(
          (artifact) => `${artifact.title} is ${artifact.status}.`,
        ),
      ]),
      blockers: checkpointEvidence(approvalBlockers),
    },
    {
      key: "contract_formation_package",
      label: "Contract formation package",
      status:
        contractFormationBlockers.length === 0 ? "completed" : "blocked",
      completedEvidence: checkpointEvidence(contractFormationPackage.evidence),
      blockers: checkpointEvidence(contractFormationBlockers),
    },
    {
      key: "executed_agreement_sow",
      label: "Executed agreement / SOW",
      status: agreementBlockers.length === 0 ? "completed" : "blocked",
      completedEvidence:
        contractFormationPackage.state === "executed"
          ? checkpointEvidence(
              agreementArtifacts.map(
                (artifact) => `${artifact.title} is ${artifact.status}.`,
              ),
            )
          : [],
      blockers: checkpointEvidence(agreementBlockers),
    },
    {
      key: "contract360_handoff",
      label: "Contract 360 handoff",
      status: handoffBlockers.length === 0 ? "ready" : "not_open",
      completedEvidence: checkpointEvidence([
        agreementArtifacts.length > 0
          ? "Executed agreement/SOW evidence is present for canonical mapping."
          : "",
        stageIsOpen(event.currentStageKey, "transition")
          ? "Event is at or beyond Transition."
          : "",
        ...handoffArtifacts.map(
          (artifact) => `${artifact.title} is ${artifact.status}.`,
        ),
      ]),
      blockers: checkpointEvidence(handoffBlockers),
    },
  ];

  const blockerCheckpoint = firstBlocker(checkpoints);
  const readinessStatus = statusFromBlockedCheckpoint(blockerCheckpoint);
  const blockers = checkpointEvidence(
    checkpoints.flatMap((checkpoint) => checkpoint.blockers),
  );
  const completedEvidence = checkpointEvidence(
    checkpoints.flatMap((checkpoint) => checkpoint.completedEvidence),
  );

  return {
    eventId: event.id,
    eventName: event.name,
    generatedAt,
    readinessStatus,
    contractFormationState: contractFormationPackage.state,
    contractFormationPackage,
    publicationPlanner,
    canonicalContractProjection,
    optimizePath,
    readyForContract360Handoff:
      readinessStatus === "ready_for_contract360_handoff",
    checkpoints,
    completedEvidence,
    blockers,
    recommendedNextAction: nextActionFor(readinessStatus, blockers),
    authority: "source-award-sow-handoff-readiness",
    sourceModulesUsed: [...SOURCE_MODULES_USED],
    rationale: `Stage 08 Award & SOW handoff readiness is derived from vendor selection readiness, stage gates, and event artifact status for ${event.id}; it does not create awards, approvals, contracts, or Contract 360 records.`,
  };
}

export function formatSourceAwardSowHandoffReadinessAsMarkdown(
  readiness: SourceAwardSowHandoffReadiness,
): string {
  return [
    "# Source Stage 08 Award & SOW Handoff Readiness",
    "",
    `- Event: ${readiness.eventName} (${readiness.eventId})`,
    `- Generated: ${readiness.generatedAt}`,
    `- Authority: ${readiness.authority}`,
    `- Readiness status: ${readiness.readinessStatus}`,
    `- Contract formation state: ${readiness.contractFormationState}`,
    `- Contract 360 handoff ready: ${readiness.readyForContract360Handoff ? "Yes" : "No"}`,
    "",
    "## Checkpoints",
    ...readiness.checkpoints.flatMap((checkpoint) => [
      `- ${checkpoint.label}: ${checkpoint.status}`,
      `  - Completed evidence: ${checkpoint.completedEvidence.join("; ") || "none"}`,
      `  - Blockers: ${checkpoint.blockers.join("; ") || "none"}`,
    ]),
    "",
    "## Contract 360 Publication Planner",
    `- State: ${readiness.publicationPlanner.state}`,
    `- Target: ${readiness.publicationPlanner.target}`,
    `- Publication writes allowed: ${readiness.publicationPlanner.publicationAllowed ? "Yes" : "No"}`,
    `- Accepted executed evidence: ${readiness.publicationPlanner.acceptedExecutedEvidence.join("; ") || "none"}`,
    `- Blocked writes: ${readiness.publicationPlanner.blockedWrites.join("; ")}`,
    `- Planner blockers: ${readiness.publicationPlanner.blockers.join("; ") || "none"}`,
    "",
    "## Canonical Contract Projection",
    `- State: ${readiness.canonicalContractProjection.state}`,
    `- Candidate identity: ${readiness.canonicalContractProjection.candidateIdentityKey ?? "none"}`,
    `- Identity writes allowed: ${readiness.canonicalContractProjection.writeAllowed ? "Yes" : "No"}`,
    `- Blocked writes: ${readiness.canonicalContractProjection.blockedWrites.join("; ")}`,
    `- Projection blockers: ${readiness.canonicalContractProjection.blockers.join("; ") || "none"}`,
    "",
    "## Optimize Path",
    `- State: ${readiness.optimizePath.state}`,
    `- Route: ${readiness.optimizePath.route}`,
    `- Launch allowed: ${readiness.optimizePath.launchAllowed ? "Yes" : "No"}`,
    `- Prefill contract id: ${readiness.optimizePath.prefillContractId ?? "none"}`,
    `- Optimize blockers: ${readiness.optimizePath.blockers.join("; ") || "none"}`,
    "",
    `- Recommended next action: ${readiness.recommendedNextAction}`,
    `- Source modules used: ${readiness.sourceModulesUsed.join(", ")}`,
  ].join("\n");
}
