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
