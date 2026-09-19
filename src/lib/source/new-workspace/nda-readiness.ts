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
}

export interface SourceNewNdaReadiness {
  posture: "ready" | "blocked";
  coveredSupplierLegalEntity: string | null;
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

export function buildSourceNewNdaReadiness(
  artifacts: readonly SourceNewNdaArtifact[],
): SourceNewNdaReadiness {
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

  const completeItems = [
    currentNdas.length > 0 ? "Current NDA artifact filed" : null,
    coveredSupplierLegalEntity
      ? `Supplier legal entity recorded: ${coveredSupplierLegalEntity}`
      : null,
    reviewed ? "NDA review or approval state recorded" : null,
    hashed ? "Artifact hash recorded" : null,
  ].filter((item): item is string => Boolean(item));

  const blockers = [
    currentNdas.length === 0 ? "No current NDA artifact is filed." : null,
    !coveredSupplierLegalEntity
      ? "No governed supplier legal entity is tied to the NDA artifact."
      : null,
    !reviewed ? "No NDA review or approval state is recorded." : null,
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
    coveredSupplierLegalEntity,
    completeItems,
    blockers,
    nextAction,
    artifactTitle: authority?.title ?? currentNdas[0]?.title ?? null,
  };
}
