import type { StepNextAction } from "@/lib/programs/step-page-model";

/**
 * The gate step page (template v1.3, "Check the gate and sign off"): what the
 * gate's checks, the gate documents and the approval rationale say the
 * consultant should do next.
 *
 * True to the governed functions it sits on:
 * - The gate's checks come from `evaluateGate` (via `buildGateCriteria`); this
 *   module never decides one. A criterion the evaluator could not read makes
 *   the whole step Blocked: nothing reads as met or unmet.
 * - Approval IS submission (`phase-gate-approval`): one action, approver only,
 *   records the human rationale and advances the phase. It is offered when
 *   every required check is met and the rationale is written.
 * - A sign-off is bound to one version and has no undo; a newer version
 *   supersedes it.
 * - A build rebuilds the phase's whole document set, so rebuilding supersedes
 *   every signature on it.
 */

export interface GateCriterionView {
  id: string;
  label: string;
  severity: "hard" | "soft";
  completed: boolean;
  verified: boolean;
  reason?: string;
}

export type GateDocumentBuildState =
  | "none"
  | "queued"
  | "building"
  | "built"
  | "failed";

export interface GateDocumentView {
  key: string;
  title: string;
  build: GateDocumentBuildState;
  /** Why a failed build failed, as the build reported it. */
  failureReason?: string;
  /** The deliverable's current version; null when no sign-off record exists. */
  currentVersion: number | null;
  signedOffVersion: number | null;
  deliverableId: string | null;
}

export type GateDocumentSignState =
  | "not_built"
  | "building"
  | "failed"
  | "unsigned"
  | "signed"
  | "superseded"
  /** Built, but no sign-off record exists or the record could not be read. */
  | "unknown";

/** Gate criteria a document sign-off settles, so an unmet one links to the documents row. */
export const DOCUMENT_BACKED_GATE_CRITERIA: ReadonlySet<string> = new Set([
  "design_approved",
  "requirements_design_outcome_trace",
  "discovery_report_signed_off",
  "charter_signed_off",
  "business_case_approved",
  "readiness_and_change_plan_signed_off",
  "handoff_package_signed_off",
  "value_measurement_contract_signed_off",
]);

export const GATE_DOCUMENTS_ROW_ID = "DOCS";

/**
 * Display labels for gate checks whose evaluator label reads as something the
 * page does not offer (template v1.5, the check display-label rule). "Design
 * approved" is met by signing the design documents, not by approving, so a
 * consultant reading it beside a held submit button would see a deadlock.
 * The evaluator's own label stays in the check's note.
 */
export const GATE_CHECK_DISPLAY_LABELS: Readonly<Record<string, string>> = {
  design_approved: "Design documents signed off",
};
export const GATE_RATIONALE_ROW_ID = "APPROVE";

export function gateDocumentSignState(
  doc: GateDocumentView,
  signOffReadable: boolean,
): GateDocumentSignState {
  if (doc.build === "none") return "not_built";
  if (doc.build === "queued" || doc.build === "building") return "building";
  if (doc.build === "failed") return "failed";
  if (!signOffReadable || !doc.deliverableId || doc.currentVersion == null) {
    return "unknown";
  }
  if (doc.signedOffVersion == null) return "unsigned";
  if (doc.signedOffVersion === doc.currentVersion) return "signed";
  return "superseded";
}

export interface GateCheckView {
  id: string;
  level: "hard" | "soft";
  text: string;
  met: boolean;
  /** The evaluator could not read this check: neither met nor unmet. */
  unknown: boolean;
  note?: string;
  targetRowId?: string;
}

export function gateChecks(
  criteria: readonly GateCriterionView[],
): GateCheckView[] {
  const unreadable = criteria.some((c) => !c.verified);
  return criteria.map((c) => {
    const display = GATE_CHECK_DISPLAY_LABELS[c.id];
    const reason = unreadable
      ? "not evaluated"
      : c.completed
        ? undefined
        : c.reason;
    return {
      id: c.id,
      level: c.severity,
      text: display ?? c.label,
      met: !unreadable && c.completed,
      unknown: unreadable,
      note: display
        ? [`gate rule: ${c.label}`, reason].filter(Boolean).join(" · ")
        : reason,
      targetRowId:
        !unreadable && !c.completed && DOCUMENT_BACKED_GATE_CRITERIA.has(c.id)
          ? GATE_DOCUMENTS_ROW_ID
          : undefined,
    };
  });
}

const capitalize = (text: string) =>
  `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

export interface GateStepInput {
  criteria: readonly GateCriterionView[];
  documents: readonly GateDocumentView[];
  signOffReadable: boolean;
  canApprove: boolean;
  /**
   * Who approves this gate, written for the middle of a sentence: a person's
   * name, or the role ("a gate approver") when no name can be resolved.
   */
  approverName: string;
  rationaleWritten: boolean;
  /** "Design", "Discover": the phase the submit button names. */
  phaseName: string;
  /** The phase that opens after submission: "P4 Roadmap". */
  nextPhaseLabel: string;
  submittedOn?: string | null;
}

function join(clauses: string[]): string {
  if (clauses.length === 0) return "";
  const body =
    clauses.length === 1
      ? clauses[0]
      : clauses.length === 2
        ? `${clauses[0]} and ${clauses[1]}`
        : `${clauses.slice(0, -1).join(", ")}, and ${clauses[clauses.length - 1]}`;
  return `${body.charAt(0).toUpperCase()}${body.slice(1)}.`;
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/** The documents' own clause, or null when they need nothing from this viewer. */
export function gateDocumentsClause(
  documents: readonly GateDocumentView[],
  signOffReadable: boolean,
  forApprover: boolean,
): string | null {
  if (documents.length === 0) return null;
  const states = documents.map((d) =>
    gateDocumentSignState(d, signOffReadable),
  );
  if (states.every((s) => s === "not_built")) {
    return documents.length === 1
      ? "build the gate document"
      : `build the ${plural(documents.length, "gate document")}`;
  }
  if (states.some((s) => s === "building")) {
    return "wait while the gate documents build";
  }
  const failed = documents.filter((_, i) => states[i] === "failed");
  if (failed.length > 0) {
    return failed.length === 1
      ? `build the ${failed[0].title} again`
      : `build the ${plural(failed.length, "failed gate document")} again`;
  }
  if (!forApprover) return null;
  const toSign = states.filter(
    (s) => s === "unsigned" || s === "superseded",
  ).length;
  if (toSign === 0) return null;
  if (toSign === 1 && documents.length === 1)
    return "sign off the gate document";
  return toSign === documents.length
    ? `sign off the ${plural(toSign, "gate document")}`
    : `sign off ${plural(toSign, "gate document")}`;
}

export interface GateStepModel {
  checks: GateCheckView[];
  countLabel: string;
  nextAction: StepNextAction;
  /** Every required check met and, for an approver, the rationale written. */
  canSubmit: boolean;
  /** The footer's own line when it carries no button. */
  footerNote: string | null;
}

export function resolveGateStep(input: GateStepInput): GateStepModel {
  const checks = gateChecks(input.criteria);
  const hard = checks.filter((c) => c.level === "hard");
  const hardMet = hard.filter((c) => c.met).length;
  const unreadable = checks.some((c) => c.unknown);
  const docs = input.documents;
  const docStates = docs.map((d) =>
    gateDocumentSignState(d, input.signOffReadable),
  );
  const docsSettled = docs.length > 0 && docStates.every((s) => s === "signed");
  const total = 2;
  const settled = (docsSettled ? 1 : 0) + (input.rationaleWritten ? 1 : 0);

  if (input.submittedOn) {
    return {
      checks,
      countLabel: `${hardMet} of ${hard.length} required checks met`,
      nextAction: {
        state: "done",
        eyebrow: `✓ Submitted · ${input.submittedOn}`,
        sentence: `${input.phaseName} is approved and submitted. ${input.nextPhaseLabel} is open.`,
        settled,
        total,
        continueEnabled: false,
      },
      canSubmit: false,
      footerNote: `Submitted ${input.submittedOn}`,
    };
  }

  if (unreadable) {
    return {
      checks,
      countLabel: "Not evaluated · gate state could not be read",
      nextAction: {
        state: "blocked",
        eyebrow: "Blocked",
        sentence:
          "The gate state could not be read, so no check is shown as met or unmet. Nothing on this page has changed.",
        settled,
        total,
        continueEnabled: false,
      },
      canSubmit: false,
      footerNote: input.canApprove
        ? null
        : `Only ${input.approverName} can approve this gate.`,
    };
  }

  const allHardMet = hard.length > 0 && hardMet === hard.length;
  const canSubmit = input.canApprove && allHardMet && input.rationaleWritten;
  const countLabel = `${hardMet} of ${hard.length} required checks met`;
  // Unmet required checks no row on this page settles: their remedy is in an
  // earlier step, so the sentence points to the list rather than guessing one.
  const elsewhere = hard.filter((c) => !c.met && !c.targetRowId).length;

  const docsClause = gateDocumentsClause(
    docs,
    input.signOffReadable,
    input.canApprove,
  );
  const clauses = [
    docsClause,
    input.canApprove && !input.rationaleWritten
      ? "write the approval rationale"
      : null,
    elsewhere > 0
      ? `close the ${plural(elsewhere, "open required check")} in the checks list`
      : null,
  ].filter((c): c is string => Boolean(c));

  if (canSubmit) {
    return {
      checks,
      countLabel,
      nextAction: {
        state: "ready",
        eyebrow: "✓ Ready",
        sentence: `Every required check passes and the rationale is written. Approve and submit ${input.phaseName}.`,
        settled,
        total,
        continueEnabled: true,
      },
      canSubmit,
      footerNote: null,
    };
  }

  if (!input.canApprove) {
    const approverLine = `${capitalize(input.approverName)} signs the gate documents and approves this gate.`;
    const sentence =
      clauses.length > 0
        ? `${join(clauses)} ${approverLine}`
        : allHardMet
          ? `Every required check passes. ${capitalize(input.approverName)} can approve and submit ${input.phaseName}.`
          : `Nothing here needs you. ${approverLine}`;
    return {
      checks,
      countLabel,
      nextAction: {
        state: allHardMet ? "ready" : "in_progress",
        eyebrow: allHardMet ? "✓ Ready" : "Next",
        sentence,
        settled,
        total,
        continueEnabled: false,
      },
      canSubmit: false,
      footerNote: `Only ${input.approverName} can approve this gate.`,
    };
  }

  return {
    checks,
    countLabel,
    nextAction: {
      state: "in_progress",
      eyebrow: "Next",
      sentence:
        join(clauses) ||
        `Close the ${plural(hard.length - hardMet, "open required check")} in the checks list.`,
      settled,
      total,
      continueEnabled: false,
    },
    canSubmit: false,
    footerNote: null,
  };
}
