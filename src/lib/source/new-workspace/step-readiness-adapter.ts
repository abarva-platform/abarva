import { assessStepReadiness, type StepReadiness } from "./step-readiness";
import { awaitsIntakeReview } from "./phase-state";

/**
 * The slice of event data the Source New page already loads, reshaped into the
 * inputs `assessStepReadiness` expects.
 *
 * `step-readiness.ts` has modelled one status and one next action per step since
 * September, and until now nothing in the product called it: the workspace
 * rendered several parallel readiness panels and three separate counters
 * instead. This adapter is the single place that turns a loaded event into that
 * model, so the UI can show one status line and one control.
 *
 * It covers the request step only. Later steps need data the page does not load
 * yet (supplier selections with their NDA scope, the strategy version's named
 * approvals); each is its own slice. Anything it cannot model returns `null`
 * rather than a guess, and the caller keeps its existing rendering.
 */
export type RequestVersionApprovalLike =
  | { status: "accepted"; acceptedBy: string }
  | { status: "pending"; missing?: readonly string[] }
  | { status: "changes_requested"; blockers?: readonly string[] };

export type EventReadinessInput = {
  currentStage: string;
  lifecycle: string;
  requestAuthorityVersionId: string | null;
  requesterId: string | null;
  decisionOwner: string | null;
  trigger: string | null;
  category: string | null;
  asOfDate: string;
  requestVersionApproval: RequestVersionApprovalLike | null;
};

const text = (value: string | null | undefined): string => value?.trim() ?? "";

export function readinessForEvent(input: EventReadinessInput): StepReadiness | null {
  if (!isRequestStep(input)) return null;

  const approval = input.requestVersionApproval;
  const versionId = text(input.requestAuthorityVersionId);

  // "changes_requested" is a hold, not a missing field. Surfacing it as a
  // requirement would tell the operator to fill something in when the real
  // instruction is to answer the reviewer.
  const holdReasons =
    approval?.status === "changes_requested"
      ? (approval.blockers ?? []).filter((reason) => text(reason).length > 0)
      : [];

  // Acceptance is bound to the current version. `evaluateRequestVersionApproval`
  // already resolved the approvals against it upstream, so an "accepted" state
  // here refers to this version and no other.
  const accepted =
    approval?.status === "accepted" && text(approval.acceptedBy) && versionId
      ? { versionId, actorId: text(approval.acceptedBy) }
      : undefined;

  return assessStepReadiness({
    step: "request",
    versionId,
    requesterId: text(input.requesterId),
    businessOwnerId: text(input.decisionOwner),
    need: text(input.trigger),
    category: text(input.category),
    decisionDate: text(input.asOfDate),
    ...(accepted ? { accepted } : {}),
    ...(holdReasons.length ? { holdReasons } : {}),
  });
}

function isRequestStep(input: EventReadinessInput): boolean {
  if (awaitsIntakeReview(input.lifecycle)) return true;
  return text(input.currentStage).toLowerCase() === "intake";
}
