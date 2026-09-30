// ─────────────────────────────────────────────────────────────────────────────
// Hydrate a stage's task checklist done-state from ALREADY-PERSISTED evidence.
//
// The redesigned canvas checklist (`TaskChecklist`) tracks a task's "done" flag in
// client `useState`, which starts empty on every mount. A successful upload flips
// it in-session, but on a page reload / tab switch the persisted evidence is not
// read back, so an upload task that HAS landed facts/artifacts renders "not done"
// and the "N of M complete" counter resets — even though the ✦ Intelligence insight
// (fact-derived, server-rendered) stays live. This is the read-back seam that fixes
// that: given the facts already read for the stage (`readEventFacts`) and the
// artifacts already listed for the event (`listSourceArtifactsForSourceEventId`), it
// stamps each task's `evidenceComplete` from real persisted evidence.
//
// HONESTY RULE (load-bearing): `evidenceComplete` is true ONLY because the task's
// evidence reached a usable, PERSISTED state —
//   • a ticket-history task needs its validated fact-derived evidence receipt;
//     other template tasks use committed column facts; and
//   • a `provide` task with no template needs an exact governed evidence binding;
//     an arbitrary artifact registered for the stage cannot prove its content
//     or signature; and
//   • a `confirm` / `decide` task is complete only when it has an explicit task →
//     evidence-requirement mapping and that governed evidence row meets the
//     requirement's minimum readiness state.
// It is NEVER a fabricated "done" without evidence. Tasks with no derivable
// evidence are left untouched (undefined). This is purely additive +
// deterministic — it derives done-state from persisted evidence and renders it;
// it writes nothing.
// ─────────────────────────────────────────────────────────────────────────────

import type { StageTaskView } from "@/components/source/canvas/analytics/view-model";
import type {
  SourceEventEvidence,
  SourceEventEvidenceCurrentState,
} from "@/lib/source/canvas-substrate";
import { evidenceById } from "@/lib/source/canonical-specs/evidence-requirements";
import { evidenceMeetsRequirement, type EvidenceAssessment } from "@/lib/source/evidence-authority";
import type { EvaluatorInputs } from "@/lib/source/facts/evaluators/types";
import { templateFactMapByCode } from "@/lib/source/facts/template-fact-map";
import {
  evidenceRequirementIdForTask,
  factTemplateCodeForTask,
} from "@/lib/source/facts/task-evidence-requirements";
import {
  parseScopeMatrixDecision,
  scopeMatrixDecisionMatchesSources,
  SCOPE_MATRIX_DECISION_ID,
} from "@/lib/source/facts/scope-matrix-decision";

/** The minimal artifact shape this hydrator needs (from the registry record). */
export interface HydrationArtifact {
  /** The canonical stage the artifact was uploaded under. */
  stageKey: string;
  /** Registry kind and filename let intake uploads bind to their later task. */
  artifactKind?: string;
  originalName?: string;
  sourceFormat?: string;
  sizeBytes?: number;
}

export interface HydrateTaskEvidenceInput {
  /** The stage tasks to stamp (returned unchanged in count/order). */
  tasks: readonly StageTaskView[];
  /**
   * factKey → numeric value for the event, from `readEventFacts`. Non-ticket
   * template tasks use the presence of a bound column fact key.
   */
  factInputs: EvaluatorInputs;
  /** The event's registered artifacts (from `listSourceArtifactsForSourceEventId`). */
  artifacts?: readonly HydrationArtifact[];
  /**
   * Effective evidence states for this event (persisted evidence plus
   * fact-backed evidence), from `listEffectiveEvidenceStatesForEvent`.
   * Used for ticket-history and non-upload confirm/decide readback.
   */
  evidenceStates?: readonly (EvidenceAssessment & Partial<Pick<SourceEventEvidence, "id" | "notes">>)[];
  /** The canonical stage key being rendered; retained for the caller contract. */
  stageKey?: string;
  /** Verified, current-artifact delegate receipt plus confirmed sponsor notice. */
  verifiedDelegatedSponsorAcknowledgement?: boolean;
}

/**
 * True when ANY of the template's column fact keys is present in the read facts.
 * The template's columns each bind to a canonical fact key; a single populated
 * column proves the template's file was ingested for this event.
 */
export function templateFactsPresent(
  factTemplateCode: string,
  factInputs: EvaluatorInputs,
): boolean {
  const map = templateFactMapByCode(factTemplateCode);
  if (!map) return false;
  return map.columns.some((column) => {
    const value = factInputs[column.factKey];
    return typeof value === "number" && Number.isFinite(value);
  });
}

/**
 * Return the tasks with `evidenceComplete` stamped from persisted evidence.
 * Same length + order as the input; a task is only stamped `true` when its
 * evidence is genuinely persisted (see the honesty rule at the top). Tasks with
 * no derivable evidence are returned untouched.
 */
export function hydrateTaskEvidenceState(
  input: HydrateTaskEvidenceInput,
): StageTaskView[] {
  const {
    tasks,
    factInputs,
    artifacts = [],
    evidenceStates = [],
    verifiedDelegatedSponsorAcknowledgement = false,
  } = input;

  const evidenceStateByRequirementId = new Map<
    string,
    SourceEventEvidenceCurrentState
  >();
  for (const evidence of evidenceStates) {
    if (evidence.requirementId) {
      evidenceStateByRequirementId.set(
        evidence.requirementId,
        evidence.currentState,
      );
    }
  }

  return tasks.map((task) => {
    if (task.id === "scope.sponsor" && verifiedDelegatedSponsorAcknowledgement) {
      return { ...task, evidenceComplete: true };
    }
    if (task.type !== "provide") {
      const requirementId = evidenceRequirementIdForTask(task);
      if (!requirementId) return task;
      if (requirementId === SCOPE_MATRIX_DECISION_ID) {
        const receipt = evidenceStates.find((row) => row.requirementId === requirementId);
        const workforce = evidenceStates.find((row) => row.requirementId === "EVID-SRC-SCOPE-WORKFORCE");
        const sla = evidenceStates.find((row) => row.requirementId === "EVID-SRC-SCOPE-SLA-BASELINE");
        const decision = parseScopeMatrixDecision(receipt?.notes);
        const receiptRequirement = evidenceById(requirementId);
        const workforceRequirement = evidenceById("EVID-SRC-SCOPE-WORKFORCE");
        const slaRequirement = evidenceById("EVID-SRC-SCOPE-SLA-BASELINE");
        return receiptRequirement && workforceRequirement && slaRequirement &&
          evidenceMeetsRequirement(receiptRequirement, receipt) &&
          evidenceMeetsRequirement(workforceRequirement, workforce) &&
          evidenceMeetsRequirement(slaRequirement, sla) &&
          scopeMatrixDecisionMatchesSources(decision, workforce, sla)
          ? { ...task, evidenceComplete: true }
          : task;
      }
      const requirement = evidenceById(requirementId);
      const currentState = evidenceStateByRequirementId.get(requirementId);
      if (
        requirement &&
        currentState &&
        evidenceStateMeetsMinimum(currentState, requirement.minimumState)
      ) {
        return { ...task, evidenceComplete: true };
      }
      return task;
    }

    if (task.id === "scope.app-inventory") {
      const reviewedInventory = evidenceStates.find((evidence) =>
        evidence.requirementId === "EVID-SRC-SCOPE-APP-INV" &&
        evidence.currentState === "Usable Evidence" &&
        Boolean(evidence.id && !evidence.id.startsWith("fact-derived:")) &&
        Boolean(evidence.sourceArtifactId),
      );
      if (reviewedInventory) return { ...task, evidenceComplete: true };
      return task;
    }

    if (task.id === "scope.prior-baseline") {
      const requirement = evidenceById("EVID-SRC-SCOPE-FY-CONTRACT");
      const evidence = evidenceStates.find((row) => row.requirementId === requirement?.requirementId);
      return requirement && evidenceMeetsRequirement(requirement, evidence)
        ? { ...task, evidenceComplete: true }
        : task;
    }

    const taskFactTemplateCode = factTemplateCodeForTask(task);
    if (taskFactTemplateCode) {
      if (taskFactTemplateCode === "TICKET_HISTORY_V1") {
        const requirementId = evidenceRequirementIdForTask(task);
        const requirement = requirementId ? evidenceById(requirementId) : null;
        const factReceipt = evidenceStates.find((evidence) =>
          evidence.requirementId === requirementId &&
          evidence.id?.startsWith("fact-derived:") &&
          (evidence.sourceEventFactIds?.length ?? 0) > 0 &&
          requirement &&
          evidenceStateMeetsMinimum(evidence.currentState, requirement.minimumState),
        );
        if (factReceipt) return { ...task, evidenceComplete: true };
      } else if (templateFactsPresent(taskFactTemplateCode, factInputs)) {
        return { ...task, evidenceComplete: true };
      }
      const storedArtifact = artifacts.find((artifact) =>
        artifactMatchesTemplate(artifact, taskFactTemplateCode),
      );
      if (storedArtifact?.originalName) {
        return {
          ...task,
          file: task.file ?? {
            format: (storedArtifact.sourceFormat ?? "file").toUpperCase(),
            name: storedArtifact.originalName,
            meta: `${formatArtifactSize(storedArtifact.sizeBytes)} · uploaded · awaiting extraction`,
          },
        };
      }
      return task;
    }

    // Without an exact task/evidence binding, neither a stage match nor a
    // filename can establish that a document was reviewed or signed.
    return task;
  });
}

function artifactMatchesTemplate(
  artifact: HydrationArtifact,
  templateCode: string,
): boolean {
  const templateToken = templateCode.toUpperCase();
  return [artifact.artifactKind, artifact.originalName].some((value) =>
    value?.toUpperCase().includes(templateToken),
  );
}

function formatArtifactSize(sizeBytes: number | undefined): string {
  if (!Number.isFinite(sizeBytes) || (sizeBytes ?? 0) <= 0) return "Stored file";
  if ((sizeBytes ?? 0) < 1024) return `${sizeBytes} B`;
  if ((sizeBytes ?? 0) < 1024 * 1024) {
    return `${Math.round((sizeBytes ?? 0) / 1024)} KB`;
  }
  return `${((sizeBytes ?? 0) / (1024 * 1024)).toFixed(1)} MB`;
}

const READINESS_RANK: Record<SourceEventEvidenceCurrentState, number> = {
  "Not Requested": 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  "Usable Evidence": 4,
  Stale: -1,
  "Low Confidence": -1,
};

function evidenceStateMeetsMinimum(
  currentState: SourceEventEvidenceCurrentState,
  minimumState: SourceEventEvidenceCurrentState,
): boolean {
  return (
    (READINESS_RANK[currentState] ?? -1) >= (READINESS_RANK[minimumState] ?? 99)
  );
}
