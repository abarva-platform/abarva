import type { SourceNewFileRow } from "@/components/source/new-workspace/SourceNewFiles";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";
import type { NormalizedVendorResponsePackage } from "@/lib/source/vendor-response-matrix";
import { tenantAliasesFor } from "@/lib/tenant/aliases";
import { extractAcceptedResponseQuestions } from "@/lib/source/vendor-response-extraction-contract";
import type { SourceNewStage04VendorPanel } from "./stage04-vendor-panel";

export type SourceNewResponseIntakeState =
  | "available"
  | "empty"
  | "blocked";

export type SourceNewResponseUploadState = "not_uploaded" | "uploaded";
export type SourceNewResponseParseState =
  | "not_parsed"
  | "pending"
  | "parsed"
  | "failed";
export type SourceNewResponseAvailabilityReviewState =
  | "not_reviewed"
  | "available"
  | "changes_requested";

export type SourceNewResponseIntakeRow = {
  supplierId: string;
  authorityId: string;
  legalName: string;
  supplierGroup: "eligible_candidate" | "existing_contract_vendor";
  acceptedByName: string;
  acceptedAt: string;
  evidenceReference: string;
  uploadState: SourceNewResponseUploadState;
  parseState: SourceNewResponseParseState;
  availabilityReviewState: SourceNewResponseAvailabilityReviewState;
  workbookName: string | null;
  artifactId: string | null;
  artifactVersion: number | null;
  parsedRequirementCount: number;
  uploadedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
};

export type SourceNewResponseIntake = {
  status: SourceNewResponseIntakeState;
  blockers: readonly string[];
  asOf: string;
  uploadActionHref: string;
  rows: readonly SourceNewResponseIntakeRow[];
  nextAction: {
    label: string;
    detail: string;
  };
};

export type BuildSourceNewResponseIntakeInput = {
  eventId: string;
  tenantKey: string;
  asOf: string;
  uploadActionHref: string;
  vendorPanel: SourceNewStage04VendorPanel;
  files: readonly SourceNewFileRow[];
  responseArtifacts: readonly SourceArtifactRegistryRecord[] | null;
  normalizedPackages: readonly NormalizedVendorResponsePackage[] | null;
  readBlockers?: readonly string[];
};

const RESPONSE_NAME_PATTERN = /\b(response|proposal|submission)\b/i;

export function buildSourceNewResponseIntake(
  input: BuildSourceNewResponseIntakeInput,
): SourceNewResponseIntake {
  const readBlockers = [...(input.readBlockers ?? [])];
  if (input.vendorPanel.status === "blocked") {
    return blockedIntake(input, [
      ...input.vendorPanel.blockers,
      ...readBlockers,
    ]);
  }
  if (input.responseArtifacts === null || input.normalizedPackages === null) {
    return blockedIntake(input, [
      "The response artifact registry could not be read.",
      ...readBlockers,
    ]);
  }

  const tenantKeys = new Set(tenantAliasesFor(input.tenantKey));
  const eventArtifacts = input.responseArtifacts.filter(
    (artifact) =>
      artifact.sourceEventId === input.eventId &&
      tenantKeys.has(artifact.tenantKey) &&
      artifact.deletedAt === null,
  );
  const eventArtifactIds = new Set(eventArtifacts.map((artifact) => artifact.id));
  const eventPackages = input.normalizedPackages.filter((pkg) =>
    eventArtifactIds.has(pkg.artifactId),
  );

  const suppliers = input.vendorPanel.rows.filter(
    (row) => row.group !== "selected_respondent",
  );
  if (suppliers.length === 0) {
    return {
      status: "empty",
      blockers: ["No accepted suppliers are recorded for response intake."],
      asOf: input.asOf,
      uploadActionHref: input.uploadActionHref,
      rows: [],
      nextAction: {
        label: "Accept one supplier candidate",
        detail:
          "Response intake stays closed until a named reviewer accepts a fictional supplier into the governed candidate panel.",
      },
    };
  }

  const rows = suppliers.map((supplier) => {
    const normalizedPackage = matchNormalizedPackage(
      supplier,
      eventPackages,
    );
    const artifact = matchResponseArtifact(
      supplier,
      normalizedPackage,
      eventArtifacts,
    );
    const questionExtraction = extractAcceptedResponseQuestions({
      eventId: input.eventId,
      tenantKey: input.tenantKey,
      supplierId: supplier.legalEntityId,
      roundId: null,
      parserConfidence: null,
      artifact,
      responsePackage: normalizedPackage,
    });
    const file = matchFileCabinetRow(supplier, artifact, input.files);
    return {
      supplierId: supplier.legalEntityId,
      authorityId: supplier.authorityId,
      legalName: supplier.legalName,
      supplierGroup:
        supplier.group === "existing_contract_vendor"
          ? "existing_contract_vendor"
          : "eligible_candidate",
      acceptedByName: supplier.acceptedByName,
      acceptedAt: supplier.acceptedAt,
      evidenceReference: supplier.evidenceReference,
      uploadState: artifact || file ? "uploaded" : "not_uploaded",
      parseState: parseState(artifact, normalizedPackage),
      availabilityReviewState: availabilityReviewState(file),
      workbookName:
        normalizedPackage?.originalName ??
        artifact?.originalName ??
        file?.fileName ??
        null,
      artifactId: artifact?.id ?? file?.sourceRegisterId ?? file?.id ?? null,
      artifactVersion: artifact?.version ?? file?.version ?? null,
      parsedRequirementCount: questionExtraction.rows.length,
      uploadedAt: artifact?.createdAt ?? file?.createdAt ?? null,
      reviewedBy: file?.approvedBy ?? null,
      reviewedAt: file?.approvedAt ?? null,
    } satisfies SourceNewResponseIntakeRow;
  });

  return {
    status: "available",
    blockers: rowBlockers(rows),
    asOf: input.asOf,
    uploadActionHref: input.uploadActionHref,
    rows,
    nextAction: nextAction(rows),
  };
}

function blockedIntake(
  input: Pick<BuildSourceNewResponseIntakeInput, "asOf" | "uploadActionHref">,
  blockers: readonly string[],
): SourceNewResponseIntake {
  return {
    status: "blocked",
    blockers,
    asOf: input.asOf,
    uploadActionHref: input.uploadActionHref,
    rows: [],
    nextAction: {
      label: "Restore response intake readback",
      detail:
        "Source cannot show supplier response intake until the governed supplier and artifact registries are readable.",
    },
  };
}

function normalize(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ") ?? "";
}

function matchesSupplierName(
  supplier: SourceNewStage04VendorPanel["rows"][number],
  value: string | null | undefined,
): boolean {
  const supplierName = normalize(supplier.legalName);
  const candidate = normalize(value);
  return (
    supplierName.length > 0 &&
    candidate.length > 0 &&
    (candidate.includes(supplierName) || supplierName.includes(candidate))
  );
}

function matchNormalizedPackage(
  supplier: SourceNewStage04VendorPanel["rows"][number],
  packages: readonly NormalizedVendorResponsePackage[],
): NormalizedVendorResponsePackage | null {
  return (
    packages.find(
      (pkg) =>
        pkg.vendorId === supplier.legalEntityId ||
        pkg.vendorId === supplier.authorityId ||
        matchesSupplierName(supplier, pkg.vendorName),
    ) ?? null
  );
}

function matchResponseArtifact(
  supplier: SourceNewStage04VendorPanel["rows"][number],
  normalizedPackage: NormalizedVendorResponsePackage | null,
  artifacts: readonly SourceArtifactRegistryRecord[],
): SourceArtifactRegistryRecord | null {
  const exact = normalizedPackage
    ? artifacts.find((artifact) => artifact.id === normalizedPackage.artifactId)
    : null;
  if (exact) return exact;
  return (
    artifacts.find(
      (artifact) =>
        isResponseArtifact(artifact) &&
        matchesSupplierName(supplier, artifact.originalName),
    ) ?? null
  );
}

function isResponseArtifact(artifact: SourceArtifactRegistryRecord): boolean {
  return (
    artifact.stageKey === "responses" &&
    (artifact.artifactFamily === "proposal" ||
      RESPONSE_NAME_PATTERN.test(artifact.artifactKind) ||
      RESPONSE_NAME_PATTERN.test(artifact.originalName))
  );
}

function matchFileCabinetRow(
  supplier: SourceNewStage04VendorPanel["rows"][number],
  artifact: SourceArtifactRegistryRecord | null,
  files: readonly SourceNewFileRow[],
): SourceNewFileRow | null {
  return (
    files.find(
      (file) =>
        (artifact &&
          (file.id === artifact.id || file.sourceRegisterId === artifact.id)) ||
        (isResponseFile(file) &&
          (matchesSupplierName(supplier, file.fileName) ||
            matchesSupplierName(supplier, file.title))),
    ) ?? null
  );
}

function isResponseFile(file: SourceNewFileRow): boolean {
  return (
    file.phase === "other" &&
    (file.artifactFamily === "proposal" ||
      RESPONSE_NAME_PATTERN.test(file.artifactType) ||
      RESPONSE_NAME_PATTERN.test(file.fileName) ||
      RESPONSE_NAME_PATTERN.test(file.title))
  );
}

function parseState(
  artifact: SourceArtifactRegistryRecord | null,
  normalizedPackage: NormalizedVendorResponsePackage | null,
): SourceNewResponseParseState {
  if (normalizedPackage) return "parsed";
  if (!artifact) return "not_parsed";
  if (artifact.parseStatus === "parsed") return "parsed";
  if (artifact.parseStatus === "failed") return "failed";
  return "pending";
}

function availabilityReviewState(
  file: SourceNewFileRow | null,
): SourceNewResponseAvailabilityReviewState {
  if (!file) return "not_reviewed";
  const state = file.approvalState?.toLowerCase() ?? "";
  if (state === "approved" && file.approvedBy?.trim()) return "available";
  if (state === "rejected" || state === "changes_requested") {
    return "changes_requested";
  }
  return "not_reviewed";
}

function rowBlockers(
  rows: readonly SourceNewResponseIntakeRow[],
): readonly string[] {
  const blockers = [
    rows.some((row) => row.uploadState === "not_uploaded")
      ? "At least one accepted supplier is missing a response workbook upload."
      : null,
    rows.some((row) => row.parseState !== "parsed")
      ? "At least one uploaded workbook has no parsed normalized response output."
      : null,
    rows.some(
      (row) => row.parseState === "parsed" && row.parsedRequirementCount === 0,
    )
      ? "At least one parsed workbook cannot be bound to an accepted supplier identity."
      : null,
    rows.some((row) => row.availabilityReviewState !== "available")
      ? "At least one parsed workbook still needs availability-only review."
      : null,
  ].filter((item): item is string => Boolean(item));
  return blockers;
}

function nextAction(rows: readonly SourceNewResponseIntakeRow[]) {
  if (rows.some((row) => row.uploadState === "not_uploaded")) {
    return {
      label: "Upload synthetic response workbook",
      detail:
        "Select one accepted fictional supplier and upload its governed response workbook through the existing Source artifact upload path.",
    };
  }
  if (rows.some((row) => row.parseState !== "parsed")) {
    return {
      label: "Confirm workbook parser output",
      detail:
        "The uploaded workbook must produce normalized response rows before evaluation can inspect it.",
    };
  }
  if (
    rows.some(
      (row) => row.parseState === "parsed" && row.parsedRequirementCount === 0,
    )
  ) {
    return {
      label: "Resolve response identity",
      detail:
        "Bind the parsed response to an accepted supplier and its source artifact before using question-level facts.",
    };
  }
  if (rows.some((row) => row.availabilityReviewState !== "available")) {
    return {
      label: "Record availability-only review",
      detail:
        "A named reviewer must mark the parsed workbook available for workflow use; this is not legal, security, finance, or client-final approval.",
    };
  }
  return {
    label: "Review normalized response availability",
    detail:
      "Availability review is recorded; evaluation remains blocked until governed scoring evidence exists.",
  };
}
