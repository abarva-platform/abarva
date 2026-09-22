import type { SourceShellArtifactLike } from "./source-event-shell-v2";
import type { SourceEventEvidenceCurrentState } from "./canvas-substrate";

const VENDOR_RESPONSE_ARTIFACT_PREFIX = "vendor_response_pack:";

export interface VendorResponseIntakeSupplier {
  vendorId: string;
  vendorName: string;
}

export interface VendorResponseIntakeRow {
  vendorId: string;
  vendorName: string;
  artifact: SourceShellArtifactLike | null;
  uploadLabel: string;
  parseLabel: string;
  availabilityLabel: string;
  formalApprovalLabel: string;
  nextAction: string;
}

export function buildVendorResponseArtifactKind(vendorId: string): string {
  const normalized = vendorId.trim();
  if (!normalized) throw new Error("A supplier ID is required.");
  return `${VENDOR_RESPONSE_ARTIFACT_PREFIX}${encodeURIComponent(normalized)}`;
}

export function vendorIdFromResponseArtifactKind(
  artifactKind: string,
): string | null {
  if (!artifactKind.startsWith(VENDOR_RESPONSE_ARTIFACT_PREFIX)) return null;
  const encoded = artifactKind.slice(VENDOR_RESPONSE_ARTIFACT_PREFIX.length);
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

function formalApprovalLabel(artifact: SourceShellArtifactLike): string {
  switch (artifact.approvalState) {
    case "in_review":
      return "Formal approval in review";
    case "approved":
      return "Formal approval approved";
    case "rejected":
      return "Formal approval changes requested";
    case "locked":
      return "Formal approval locked";
    case "not_required":
      return "Formal approval not required";
    default:
      return "Formal approval not recorded";
  }
}

function availabilityLabel(
  state: SourceEventEvidenceCurrentState | null,
): string {
  return state
    ? `Stage availability ${state}`
    : "Availability review not recorded";
}

function availabilityReady(
  state: SourceEventEvidenceCurrentState | null,
): boolean {
  return state === "Available" || state === "Usable Evidence";
}

function nextAction(
  artifact: SourceShellArtifactLike | null,
  availabilityState: SourceEventEvidenceCurrentState | null,
): string {
  if (!artifact) return "Upload the supplier response workbook.";
  switch (artifact.parseStatus) {
    case "pending":
    case "parsing":
      return "Wait for parsing to finish before response review.";
    case "failed":
      return "Correct or re-upload the response so parsing can complete.";
    case "needs_review":
      return "Review parser exceptions before response evaluation.";
    case "parsed":
      if (!availabilityReady(availabilityState)) {
        return "Complete the proposal availability review before governed response review.";
      }
      return "Continue governed response review; evaluation and formal approval remain separate.";
    default:
      return "Confirm parser state before response review.";
  }
}

export function buildVendorResponseIntakeRows(args: {
  suppliers: readonly VendorResponseIntakeSupplier[];
  artifacts: readonly SourceShellArtifactLike[];
  availabilityState: SourceEventEvidenceCurrentState | null;
}): VendorResponseIntakeRow[] {
  const latestByVendor = new Map<string, SourceShellArtifactLike>();
  for (const artifact of args.artifacts) {
    if (artifact.artifactFamily !== "proposal") continue;
    const vendorId = artifact.artifactKind
      ? vendorIdFromResponseArtifactKind(artifact.artifactKind)
      : null;
    if (!vendorId || latestByVendor.has(vendorId)) continue;
    latestByVendor.set(vendorId, artifact);
  }

  return args.suppliers.map((supplier) => {
    const artifact = latestByVendor.get(supplier.vendorId) ?? null;
    const originalName = artifact?.originalName ?? artifact?.fileName;
    const parseStatus = artifact?.parseStatus?.replaceAll("_", " ");
    return {
      ...supplier,
      artifact,
      uploadLabel: artifact
        ? `Uploaded ${originalName ?? "response file"}`
        : "No response uploaded",
      parseLabel: artifact
        ? `Parser ${parseStatus ?? "state not recorded"}`
        : "Parser not started",
      availabilityLabel: availabilityLabel(args.availabilityState),
      formalApprovalLabel: artifact
        ? formalApprovalLabel(artifact)
        : "Formal approval not started",
      nextAction: nextAction(artifact, args.availabilityState),
    };
  });
}
