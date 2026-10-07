// phase-build-settlement.ts
//
// Decide, once a phase's "Approve & Build" batch has settled, whether the phase
// gate approval may be submitted — and what has to be said about the documents
// that did not build.
//
// Why this is its own module rather than a condition in the phase workspace:
// the workspace used to refuse gate submission whenever ANY document in the
// batch reached a terminal failure. A phase's build set is not all gate
// evidence, though. Every phase declares working documents beside its gate
// artifacts (`gateArtifact: false` in `deliverable-registry.ts`) — P1's
// discovery plan, P2's root-cause worksheet and design workshop guide, P3's
// solution design, operating model and planning guide, P4's financial model and
// mobilization workshop guide, P5's execution kickoff guide — and NO gate check
// in `governance.ts` reads any of them. The design checks resolve an
// ALTERNATIVES list that the phase's own gate artifact already satisfies.
//
// So a working document that failed or was held below its quality bar (a
// workshop guide over-running its length ceiling is the case seen live) made the
// client strictly stricter than the governed gate: it refused to even submit an
// approval the server would have granted, and told the reader to "fix the
// underlying issue and re-run" a document the gate never asked for. That is a
// dead end on the one forward control the phase has.
//
// The split here is NOT "ignore the failure". A gate artifact that failed still
// refuses the submission. A working document that failed is named — in the
// reader's status line and in the rationale that goes into the approval record —
// so the failure is stated rather than silently skipped, which is the property
// the build-settled contract has always been explicit about wanting.

export type SettledDeliverable = {
  deliverableTypeKey: string;
  /** From the deliverable registry: does a phase gate check read this document? */
  gateArtifact: boolean;
};

export type PhaseBuildSettlement = {
  /** Terminal-failure keys the phase gate actually reads. */
  failedGateArtifacts: string[];
  /** Terminal-failure keys no gate check reads. */
  failedWorkingDocuments: string[];
  /**
   * Non-null ⇒ do not submit the gate approval; the sentence states why and
   * what to do. Null ⇒ submit it and let the governed gate decide.
   */
  refusal: string | null;
  /**
   * Non-null ⇒ the submission proceeds, and this sentence must be shown to the
   * reader and carried into the approval rationale.
   */
  workingDocumentCaveat: string | null;
};

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

export function classifyPhaseBuildSettlement(args: {
  phase: number;
  succeeded: readonly SettledDeliverable[];
  failed: readonly SettledDeliverable[];
}): PhaseBuildSettlement {
  const failedGateArtifacts = args.failed
    .filter((entry) => entry.gateArtifact)
    .map((entry) => entry.deliverableTypeKey);
  const failedWorkingDocuments = args.failed
    .filter((entry) => !entry.gateArtifact)
    .map((entry) => entry.deliverableTypeKey);

  const workingDocumentCaveat =
    failedWorkingDocuments.length > 0
      ? `${failedWorkingDocuments.length} working ${plural(
          failedWorkingDocuments.length,
          "document",
          "documents",
        )} did not build (${failedWorkingDocuments.join(", ")}). ` +
        `No P${args.phase} gate check reads ${plural(
          failedWorkingDocuments.length,
          "it",
          "them",
        )}, so the gate approval was still submitted — but ${plural(
          failedWorkingDocuments.length,
          "this document is",
          "these documents are",
        )} missing from the phase record and will need a re-run.`
      : null;

  if (failedGateArtifacts.length > 0) {
    return {
      failedGateArtifacts,
      failedWorkingDocuments,
      refusal:
        `${failedGateArtifacts.length} gate ${plural(
          failedGateArtifacts.length,
          "document",
          "documents",
        )} failed to generate or ${plural(
          failedGateArtifacts.length,
          "was",
          "were",
        )} held below gate (${failedGateArtifacts.join(", ")}). ` +
        `The P${args.phase} gate reads ${plural(
          failedGateArtifacts.length,
          "this document",
          "these documents",
        )}, so fix the underlying issue and re-run Approve & Build before ` +
        `requesting gate approval.`,
      workingDocumentCaveat,
    };
  }

  if (args.succeeded.length === 0) {
    return {
      failedGateArtifacts,
      failedWorkingDocuments,
      refusal: `No required deliverables completed generation for P${args.phase}.`,
      workingDocumentCaveat,
    };
  }

  return {
    failedGateArtifacts,
    failedWorkingDocuments,
    refusal: null,
    workingDocumentCaveat,
  };
}

// ─── Submitting a phase gate approval without rebuilding ────────────────────
//
// The second decision in this module, and the defect it exists for: a phase gate
// approval could only ever be submitted as the tail of a fresh "Approve & Build"
// batch, because `onBuildSettled` was its one trigger. Two HARD gate checks read
// a human sign-off that can only be recorded AFTER that batch finishes, on a
// document the batch itself wrote as a draft — the P1 charter approval and the
// P2 discovery-report sign-off. So the first submission always fails them, and
// the refusal tells the reader to approve the draft and then re-run Approve &
// Build. Following that instruction destroys the sign-off it just asked for:
// regeneration writes a new version through `completeDeliverable` with
// `signOff: false`, which sets `deliverables_v2.status` back to `draft`, and the
// gate's own `isSignedOff` refuses anything whose status is not `signed_off`.
// The loop has no exit, so the phase cannot be left at all.
//
// This is NOT a gate bypass and it loosens nothing. The same
// `POST /api/v1/programs/:id/phase-gate-approval` runs, `evaluateGate` stays the
// only authority on pass/fail, and `classifyPhaseBuildSettlement` above still
// screens the documents first. All this decides is whether the documents a gate
// check reads are already on the record — so that submitting is a real request
// rather than a guaranteed refusal — and what to say when they are not.

/** One document in the phase's build set, as the registry declares it. */
export type PhaseGateDocument = {
  deliverableTypeKey: string;
  documentTitle: string;
  /** From the deliverable registry: does a phase gate check read this document? */
  gateArtifact: boolean;
};

/** What the workspace currently knows about one of those documents. */
export type PhaseGateDocumentState = {
  deliverableTypeKey: string;
  /** The workspace's own row status — "succeeded" once the document is built. */
  status: string;
  /**
   * The stored artifact's governed status, for a row seeded from the server
   * rather than from a run this session watched. A held artifact still renders
   * as built in the status list, so without this a quarantined gate document
   * would count as on the record.
   */
  artifactStatus?: string | null;
};

/**
 * Artifact statuses that are present but NOT a usable build: a document in one
 * of these states must not be reported as a succeeded gate artifact.
 */
const HELD_ARTIFACT_STATUSES = new Set(["quarantined", "blocked", "superseded"]);

export type PhaseGateSubmitPlan =
  | {
      submittable: true;
      /** The documents already on the record, in `onBuildSettled` shape. */
      settled: SettledDeliverable[];
      total: number;
      actionLabel: string;
      /** Pre-commit summary: states what is submitted and what is not rebuilt. */
      summary: string;
    }
  | {
      submittable: false;
      reason:
        | "build_in_flight"
        | "phase_builds_no_gate_document"
        | "gate_documents_not_built";
      /** Titles of the gate documents that are not on the record. */
      unbuiltGateDocuments: string[];
      explanation: string;
    };

export function planPhaseGateSubmitWithoutBuild(args: {
  phase: number;
  phaseLabel: string;
  documents: readonly PhaseGateDocument[];
  states: readonly PhaseGateDocumentState[];
  buildInFlight: boolean;
}): PhaseGateSubmitPlan {
  if (args.buildInFlight) {
    return {
      submittable: false,
      reason: "build_in_flight",
      unbuiltGateDocuments: [],
      explanation:
        `A ${args.phaseLabel} build is still running. The gate approval is ` +
        `submitted on its own once every document in the batch settles.`,
    };
  }

  const stateByKey = new Map(
    args.states.map((state) => [state.deliverableTypeKey, state]),
  );
  const onRecord = (document: PhaseGateDocument): boolean => {
    const state = stateByKey.get(document.deliverableTypeKey);
    if (!state || state.status !== "succeeded") return false;
    const artifactStatus = state.artifactStatus?.trim().toLowerCase() ?? "";
    return !HELD_ARTIFACT_STATUSES.has(artifactStatus);
  };

  const gateDocuments = args.documents.filter(
    (document) => document.gateArtifact,
  );
  if (gateDocuments.length === 0) {
    return {
      submittable: false,
      reason: "phase_builds_no_gate_document",
      unbuiltGateDocuments: [],
      explanation:
        `No ${args.phaseLabel} document in this build set is read by a phase ` +
        `gate check, so there is nothing to submit from the build record.`,
    };
  }

  const unbuilt = gateDocuments.filter((document) => !onRecord(document));
  if (unbuilt.length > 0) {
    const titles = unbuilt.map((document) => document.documentTitle);
    return {
      submittable: false,
      reason: "gate_documents_not_built",
      unbuiltGateDocuments: titles,
      explanation:
        `${titles.length} ${plural(titles.length, "document", "documents")} the ` +
        `P${args.phase} gate reads ${plural(
          titles.length,
          "is",
          "are",
        )} not on the record yet (${titles.join(", ")}). ` +
        `Run Approve & Build first.`,
    };
  }

  const available = args.documents.filter(onRecord);
  return {
    submittable: true,
    settled: available.map((document) => ({
      deliverableTypeKey: document.deliverableTypeKey,
      gateArtifact: document.gateArtifact,
    })),
    total: available.length,
    actionLabel: `Submit ${args.phaseLabel} gate approval →`,
    summary:
      `This submits the ${args.phaseLabel} ${plural(
        available.length,
        "document",
        "documents",
      )} already on the record for gate approval, without rebuilding ` +
      `${plural(available.length, "it", "them")}. Use this after approving a ` +
      `draft in Files & Evidence: re-running Approve & Build would replace ` +
      `that document with a new unapproved draft and clear the sign-off the ` +
      `gate is waiting for. The governed gate still decides — anything it ` +
      `finds open is reported back unchanged.`,
  };
}
