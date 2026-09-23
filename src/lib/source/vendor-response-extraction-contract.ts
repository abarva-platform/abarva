import type { SourceArtifactRegistryRecord } from "./artifact-registry/types";
import type { NormalizedVendorResponsePackage } from "./vendor-response-matrix";
import { tenantAliasesFor } from "@/lib/tenant/aliases";

export type AcceptedResponseQuestion = {
  tenantKey: string;
  eventId: string;
  supplierId: string;
  roundId: string | null;
  questionId: string;
  answer: string | null;
  pricingCell: string | null;
  exception: string | null;
  evidenceReferences: readonly string[];
  parserVersion: string;
  confidence: number | null;
  reviewState: "accepted" | "unreviewed";
  artifactId: string;
  factKey: string;
  downstreamEligible: boolean;
};

export type AcceptedResponseExtraction = {
  state: "available" | "review_required" | "blocked";
  blockers: readonly string[];
  rows: readonly AcceptedResponseQuestion[];
};

export function extractAcceptedResponseQuestions(input: {
  eventId: string;
  tenantKey: string;
  supplierId: string;
  roundId: string | null;
  parserConfidence: number | null;
  artifact: SourceArtifactRegistryRecord | null;
  responsePackage: NormalizedVendorResponsePackage | null;
}): AcceptedResponseExtraction {
  const artifact = input.artifact;
  const responsePackage = input.responsePackage;
  if (
    !artifact ||
    !responsePackage ||
    artifact.sourceEventId !== input.eventId ||
    !tenantAliasesFor(input.tenantKey).includes(artifact.tenantKey) ||
    artifact.stageKey !== "responses" ||
    artifact.deletedAt !== null ||
    responsePackage.artifactId !== artifact.id ||
    responsePackage.vendorId !== input.supplierId
  ) {
    return {
      state: "blocked",
      blockers: ["Response artifact identity is not verified for this event and supplier."],
      rows: [],
    };
  }

  if (
    responsePackage.reviewState !== "accepted" ||
    responsePackage.authority?.acceptedArtifactOnly !== true ||
    responsePackage.authority.downstreamContextPolicy !== "include" ||
    !responsePackage.authority.acceptedAt.trim()
  ) {
    return {
      state: "blocked",
      blockers: ["Response artifact has not been accepted for downstream use."],
      rows: [],
    };
  }

  const roundId = input.roundId?.trim() || null;
  const confidence =
    input.parserConfidence !== null &&
    Number.isFinite(input.parserConfidence) &&
    input.parserConfidence >= 0 &&
    input.parserConfidence <= 1
      ? input.parserConfidence
      : null;
  const blockers: string[] = [];
  if (!roundId) blockers.push("Response round is not recorded.");
  if (confidence === null) blockers.push("Parser confidence is not recorded.");

  const rows: AcceptedResponseQuestion[] = [];
  for (const row of responsePackage.rows) {
    const questionId = row.questionId?.trim();
    const factKey = row.provenance?.factKey.trim();
    if (
      !questionId ||
      !row.requirementId.trim() ||
      !factKey ||
      row.provenance?.artifactId !== artifact.id ||
      row.provenance.parser !== "source_normalized_vendor_response_v1"
    ) {
      blockers.push("A response question lacks stable identity or parser provenance.");
      continue;
    }
    const reviewed = row.reviewState === "accepted";
    if (!reviewed) blockers.push("A response question has not been reviewed.");
    rows.push({
      tenantKey: input.tenantKey,
      eventId: input.eventId,
      supplierId: input.supplierId,
      roundId,
      questionId,
      answer: row.responseNarrative?.trim() || null,
      pricingCell: row.pricingRef?.trim() || null,
      exception: row.exceptionRef?.trim() || null,
      evidenceReferences: row.evidenceRefs ?? [],
      parserVersion: row.provenance.parser,
      confidence,
      reviewState: reviewed ? "accepted" : "unreviewed",
      artifactId: artifact.id,
      factKey,
      downstreamEligible: reviewed && Boolean(roundId) && confidence !== null,
    });
  }
  if (rows.length === 0) blockers.push("No accepted response questions are available.");

  return {
    state: rows.length === 0 ? "blocked" : blockers.length ? "review_required" : "available",
    blockers: [...new Set(blockers)],
    rows,
  };
}
