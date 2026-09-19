import {
  evaluateNdaCoverage,
  type NdaCoverageInput,
  type NdaWaiverRecord,
} from "@/lib/source/nda/nda-scope-authority";

export interface SourceNewNdaArtifact {
  id: string;
  artifactType: string;
  title: string;
  status: string;
  lifecycleState: string;
  approvalState: string | null;
  approvedAt: string | null;
  blobSha256: string | null;
  coveredSupplierLegalEntity?: string | null;
  coveredScopeId?: string | null;
  effectiveFrom?: string | null;
  expiresOn?: string | null;
}

export interface SourceNewNdaReadiness {
  posture: "ready" | "blocked";
  /**
   * Set only when a waiver is what cleared coverage, never when an executed
   * NDA did. The decision requires a waiver to be displayed separately from
   * an NDA, and a surface cannot do that if the two arrive indistinguishable.
   */
  waiver?: {
    waiverId: string;
    approvedByLegalName: string;
    expiresAt: string;
    reason: string;
  };
  asOfDate: string;
  coveredSupplierLegalEntity: string | null;
  coveredScopeId: string | null;
  effectiveFrom: string | null;
  expiresOn: string | null;
  completeItems: string[];
  blockers: string[];
  nextAction: {
    label: string;
    detail: string;
  };
  artifactTitle: string | null;
}

function hasText(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function isNdaArtifact(artifact: SourceNewNdaArtifact): boolean {
  return artifact.artifactType.toLowerCase().includes("nda");
}

function isApprovalRecorded(artifact: SourceNewNdaArtifact): boolean {
  const state = artifact.approvalState?.toLowerCase() ?? "";
  return (
    state === "approved" ||
    artifact.status === "approved" ||
    artifact.status === "client_final" ||
    hasText(artifact.approvedAt)
  );
}

function parseDate(value: string | null): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Mount point for the stage 05 scope and waiver authority.
 *
 * The artifact checks below establish that a document is filed, hashed,
 * reviewed and in date. They cannot establish the two things the owner
 * decision added, because neither is a property of the file: whether Legal
 * published the template version it cites, and whether a waiver standing in
 * for an NDA meets all four of its requirements. `evaluateNdaCoverage` owns
 * both.
 *
 * The parameter is optional so the one existing caller keeps working while
 * the inputs are threaded through. **That optionality is a real gap, not a
 * design**: where coverage is not supplied, the policy is not enforced, and
 * the caller is the place to close it.
 */
export function buildSourceNewNdaReadiness(
  artifacts: readonly SourceNewNdaArtifact[],
  asOfDate: string,
  coverage?: NdaCoverageInput,
): SourceNewNdaReadiness {
  const coverageResult = coverage ? evaluateNdaCoverage(coverage) : null;
  const coverageWaiver: NdaWaiverRecord | undefined = coverageResult?.waiver;
  const currentNdas = artifacts.filter(
    (artifact) => artifact.lifecycleState === "current" && isNdaArtifact(artifact),
  );
  const authority = currentNdas.find((artifact) =>
    hasText(artifact.coveredSupplierLegalEntity),
  );
  const reviewed = currentNdas.find(isApprovalRecorded);
  const hashed = currentNdas.find((artifact) => hasText(artifact.blobSha256));
  const coveredSupplierLegalEntity =
    authority?.coveredSupplierLegalEntity?.trim() ?? null;
  const coveredScopeId = authority?.coveredScopeId?.trim() ?? null;
  const effectiveFrom = authority?.effectiveFrom?.trim() ?? null;
  const expiresOn = authority?.expiresOn?.trim() ?? null;
  const effectiveTime = parseDate(effectiveFrom);
  const expiresTime = parseDate(expiresOn);
  const asOfTime = parseDate(asOfDate);
  const validityRecorded = effectiveTime !== null && expiresTime !== null;
  const validityOrdered =
    !validityRecorded || expiresTime === null || effectiveTime === null
      ? true
      : expiresTime >= effectiveTime;
  const effectiveAsOf =
    validityRecorded &&
    validityOrdered &&
    asOfTime !== null &&
    effectiveTime !== null &&
    expiresTime !== null &&
    effectiveTime <= asOfTime &&
    expiresTime >= asOfTime;

  const completeItems = [
    currentNdas.length > 0 ? "Current NDA artifact filed" : null,
    coveredSupplierLegalEntity
      ? `Supplier legal entity recorded: ${coveredSupplierLegalEntity}`
      : null,
    coveredScopeId ? `NDA scope recorded: ${coveredScopeId}` : null,
    effectiveAsOf
      ? `NDA effective as of ${asOfDate}: ${effectiveFrom} to ${expiresOn}`
      : null,
    reviewed ? "NDA review or approval state recorded" : null,
    hashed ? "Artifact hash recorded" : null,
    coverageResult?.state === "covered_by_nda"
      ? "Executed NDA covers this event on a published template version"
      : null,
    coverageWaiver
      ? `Covered by WAIVER ${coverageWaiver.waiverId}, not by an NDA — approved by ` +
        `${coverageWaiver.approvedByLegalName}, expires ${coverageWaiver.expiresAt}`
      : null,
  ].filter((item): item is string => Boolean(item));

  const blockers = [
    currentNdas.length === 0 ? "No current NDA artifact is filed." : null,
    !coveredSupplierLegalEntity
      ? "No governed supplier legal entity is tied to the NDA artifact."
      : null,
    !coveredScopeId ? "No governed NDA scope is tied to the artifact." : null,
    !validityRecorded
      ? "No NDA effective and expiration dates are recorded."
      : null,
    validityRecorded && !validityOrdered
      ? "The NDA expiration date is before its effective date."
      : null,
    asOfTime === null
      ? "No governed NDA readiness as-of date is recorded."
      : null,
    validityRecorded &&
    validityOrdered &&
    asOfTime !== null &&
    effectiveTime !== null &&
    effectiveTime > asOfTime
      ? `The NDA is not effective as of ${asOfDate}.`
      : null,
    validityRecorded &&
    validityOrdered &&
    asOfTime !== null &&
    expiresTime !== null &&
    expiresTime < asOfTime
      ? `The NDA expired before ${asOfDate}.`
      : null,
    !reviewed ? "No NDA review or approval state is recorded." : null,
    // A registry outage reads as blocked, not clear: the contract returns
    // not_covered with its reason, and that reason is shown rather than
    // collapsed into a generic failure.
    coverageResult?.state === "not_covered" ? coverageResult.reason : null,
  ].filter((item): item is string => Boolean(item));

  const nextAction =
    currentNdas.length === 0
      ? {
          label: "Open event files",
          detail: "File the executed NDA in the governed event cabinet.",
        }
      : !coveredSupplierLegalEntity
        ? {
            label: "Record legal entity",
            detail:
              "Tie the NDA artifact to the supplier legal entity in the governed event record.",
          }
        : !coveredScopeId
          ? {
              label: "Record NDA scope",
              detail: "Tie the NDA artifact to the event scope it actually covers.",
            }
          : !validityRecorded || !validityOrdered || !effectiveAsOf
            ? {
                label: "Record NDA validity",
                detail:
                  "Capture a validity window that covers the governed readiness date before supplier work proceeds.",
              }
            : !reviewed
              ? {
                  label: "Open NDA review",
                  detail:
                    "Capture the legal or procurement review state before supplier work proceeds.",
                }
              : {
                  label: "Open market package gate",
                  detail:
                    "Continue the governed event flow without sending supplier communications from this view.",
                };

  return {
    posture: blockers.length === 0 ? "ready" : "blocked",
    ...(coverageWaiver
      ? {
          waiver: {
            waiverId: coverageWaiver.waiverId,
            approvedByLegalName: coverageWaiver.approvedByLegalName,
            expiresAt: coverageWaiver.expiresAt,
            reason: coverageWaiver.reason,
          },
        }
      : {}),
    asOfDate,
    coveredSupplierLegalEntity,
    coveredScopeId,
    effectiveFrom,
    expiresOn,
    completeItems,
    blockers,
    nextAction,
    artifactTitle: authority?.title ?? currentNdas[0]?.title ?? null,
  };
}
