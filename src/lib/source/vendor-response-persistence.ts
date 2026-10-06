import "server-only";

import {
  getAzureReadFluentClient,
  getAzureWriteFluentClient,
} from "@/lib/data-plane/postgresCompat";
import type { SourceArtifactRegistryRecord } from "./artifact-registry";
import type { ParsedNormalizedVendorResponse } from "./vendor-response-workbook";
import type {
  NormalizedVendorResponsePackage,
  SourceNormalizedResponseCategory,
  SourceResponseDisposition,
} from "./vendor-response-matrix";
import { tenantAliasesFor } from "@/lib/tenant/aliases";

const RESPONSE_PARSER_ID = "source_normalized_vendor_response_v1" as const;
const DOWNSTREAM_EXCLUSION_REASON =
  "Normalized supplier-response extraction is upload-time parser output only. It is excluded from scoring, aVa, award recommendations, and benchmark comparisons until its source artifact is accepted as authoritative.";

export async function persistNormalizedVendorResponsePackage(args: {
  artifact: SourceArtifactRegistryRecord;
  parsed: ParsedNormalizedVendorResponse;
}): Promise<void> {
  const { artifact, parsed } = args;
  const provenance = {
    artifact_id: artifact.id,
    artifact_name: artifact.originalName,
    artifact_family: artifact.artifactFamily,
    source_origin: artifact.sourceOrigin,
    parser: RESPONSE_PARSER_ID,
  };
  const common = {
    artifact_id: artifact.id,
    tenant_key: artifact.tenantKey,
    source_event_id: artifact.sourceEventId,
    provenance,
    confidence: 0.96,
  };
  const facts = [
    ...parsed.rows.map((row) => ({
      ...common,
      fact_type: "normalized_requirement_response",
      fact_key: `${parsed.vendorId}::${row.requirementId}`,
      fact_value: {
        vendor_id: parsed.vendorId,
        vendor_name: parsed.vendorName,
        received_at: artifact.createdAt,
        question_id: buildSourceResponseQuestionId({
          tenantKey: artifact.tenantKey,
          eventId: artifact.sourceEventId,
          vendorId: parsed.vendorId,
          requirementId: row.requirementId,
        }),
        response_category: normalizeSourceResponseCategory(
          row.responseDisposition ?? null,
        ),
        review_state: "unreviewed",
        downstream_use_policy: "exclude_until_artifact_acceptance",
        downstream_exclusion_reason: DOWNSTREAM_EXCLUSION_REASON,
        ...row,
      },
    })),
    {
      ...common,
      fact_type: "normalized_response_quality",
      fact_key: parsed.vendorId,
      fact_value: {
        vendor_id: parsed.vendorId,
        vendor_name: parsed.vendorName,
        received_at: artifact.createdAt,
        original_name: artifact.originalName,
        analytics: parsed.analytics,
        parser_warnings: parsed.parserWarnings,
        synthetic_demo: parsed.syntheticDemo,
      },
    },
  ];
  const { error } = await getAzureWriteFluentClient()
    .from("source_artifact_facts")
    .insert(facts);
  if (error) throw error;
}

export async function readNormalizedVendorResponsePackages(args: {
  eventId: string;
  tenantKey: string;
}): Promise<NormalizedVendorResponsePackage[]> {
  const tenantKeys = tenantAliasesFor(args.tenantKey);
  const { data, error } = await getAzureReadFluentClient()
    .from("source_artifact_facts")
    .select("artifact_id, fact_type, fact_key, fact_value")
    .eq("source_event_id", args.eventId)
    .in("tenant_key", tenantKeys)
    .in("fact_type", [
      "normalized_requirement_response",
      "normalized_response_quality",
    ])
    .limit(2_000);
  if (error) throw error;

  const artifactIds = Array.from(
    new Set(
      ((data as Array<{ artifact_id?: unknown }> | null) ?? [])
        .map((row) => String(row.artifact_id ?? ""))
        .filter(Boolean),
    ),
  );
  const authorityByArtifact =
    await readAcceptedNormalizedResponseArtifactAuthority(artifactIds);

  const byArtifact = new Map<
    string,
    {
      rows: ParsedNormalizedVendorResponse["rows"];
      summary?: {
        vendorId: string;
        vendorName: string;
        receivedAt: string;
        originalName: string;
        analytics: ParsedNormalizedVendorResponse["analytics"];
        parserWarnings: string[];
        syntheticDemo: boolean;
      };
      authority: AcceptedNormalizedResponseArtifactAuthority;
    }
  >();
  for (const raw of data ?? []) {
    const row = raw as {
      artifact_id?: unknown;
      fact_type?: unknown;
      fact_key?: unknown;
      fact_value?: unknown;
    };
    const artifactId = String(row.artifact_id ?? "");
    if (!artifactId || !row.fact_value || typeof row.fact_value !== "object") {
      continue;
    }
    const authority = authorityByArtifact.get(artifactId);
    if (!authority) continue;
    const group = byArtifact.get(artifactId) ?? { rows: [], authority };
    const value = row.fact_value as Record<string, unknown>;
    if (row.fact_type === "normalized_requirement_response") {
      group.rows.push(
        toNormalizedResponse(value, {
          tenantKey: args.tenantKey,
          eventId: args.eventId,
          artifactId,
          artifactName: String(value.original_name ?? ""),
          receivedAt: String(value.received_at ?? ""),
          factKey: String(row.fact_key ?? ""),
        }),
      );
    } else if (row.fact_type === "normalized_response_quality") {
      group.summary = {
        vendorId: String(value.vendor_id ?? ""),
        vendorName: String(value.vendor_name ?? "Vendor not identified"),
        receivedAt: String(value.received_at ?? ""),
        originalName: String(
          value.original_name ?? "Vendor Response Workbook.xlsx",
        ),
        analytics:
          value.analytics as ParsedNormalizedVendorResponse["analytics"],
        parserWarnings: Array.isArray(value.parser_warnings)
          ? value.parser_warnings.map(String)
          : [],
        syntheticDemo: value.synthetic_demo === true,
      };
    }
    byArtifact.set(artifactId, group);
  }

  const latestByVendor = new Map<string, NormalizedVendorResponsePackage>();
  for (const [artifactId, group] of byArtifact) {
    if (!group.summary) continue;
    const candidate: NormalizedVendorResponsePackage = {
      artifactId,
      vendorId: group.summary.vendorId,
      vendorName: group.summary.vendorName,
      receivedAt: group.summary.receivedAt,
      originalName: group.summary.originalName,
      rows: group.rows
        .sort((a, b) => a.requirementId.localeCompare(b.requirementId))
        .map((row) =>
          row.provenance
            ? {
                ...row,
                provenance: {
                  ...row.provenance,
                  artifactName: group.summary!.originalName,
                  receivedAt: group.summary!.receivedAt,
                },
              }
            : row,
        ),
      analytics: group.summary.analytics,
      parserWarnings: group.summary.parserWarnings,
      syntheticDemo: group.summary.syntheticDemo,
      reviewState: "accepted",
      authority: {
        acceptedArtifactOnly: true,
        source: group.authority.source,
        acceptedAt: group.authority.acceptedAt,
        downstreamContextPolicy: "include",
      },
    };
    const prior = latestByVendor.get(candidate.vendorId);
    if (!prior || candidate.receivedAt > prior.receivedAt) {
      latestByVendor.set(candidate.vendorId, candidate);
    }
  }
  return [...latestByVendor.values()].sort((a, b) =>
    a.vendorName.localeCompare(b.vendorName),
  );
}

function toNormalizedResponse(
  value: Record<string, unknown>,
  context: {
    tenantKey: string;
    eventId: string;
    artifactId: string;
    artifactName: string;
    receivedAt: string;
    factKey: string;
  },
): ParsedNormalizedVendorResponse["rows"][number] {
  const vendorId = String(value.vendor_id ?? "");
  const requirementId = String(value.requirementId ?? "");
  const responseDisposition =
    (value.responseDisposition as SourceResponseDisposition | null) ?? null;
  return {
    questionId: buildSourceResponseQuestionId({
      tenantKey: context.tenantKey,
      eventId: context.eventId,
      vendorId,
      requirementId,
    }),
    requirementId,
    category:
      value.category as ParsedNormalizedVendorResponse["rows"][number]["category"],
    section: String(value.section ?? ""),
    requirement: String(value.requirement ?? ""),
    requirementLevel:
      value.requirementLevel as ParsedNormalizedVendorResponse["rows"][number]["requirementLevel"],
    responseType:
      value.responseType as ParsedNormalizedVendorResponse["rows"][number]["responseType"],
    evidenceRequired: Boolean(value.evidenceRequired),
    evaluationCriterionId: stringOrNull(value.evaluationCriterionId),
    responseDisposition,
    responseNarrative: stringOrNull(value.responseNarrative),
    evidenceRefs: Array.isArray(value.evidenceRefs)
      ? value.evidenceRefs.map(String)
      : [],
    pricingRef: stringOrNull(value.pricingRef),
    slaRef: stringOrNull(value.slaRef),
    exceptionRef: stringOrNull(value.exceptionRef),
    vendorOwner: stringOrNull(value.vendorOwner),
    responseCategory: normalizeSourceResponseCategory(responseDisposition),
    reviewState: "accepted",
    provenance: {
      artifactId: context.artifactId,
      artifactName:
        context.artifactName ||
        String(value.original_name ?? "Vendor Response Workbook.xlsx"),
      receivedAt: context.receivedAt,
      parser: RESPONSE_PARSER_ID,
      factKey: context.factKey,
    },
  };
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function buildSourceResponseQuestionId(args: {
  tenantKey: string;
  eventId: string;
  vendorId: string;
  requirementId: string;
}): string {
  return [
    "source-response-question",
    stableIdentityPart(args.tenantKey),
    stableIdentityPart(args.eventId),
    stableIdentityPart(args.vendorId),
    stableIdentityPart(args.requirementId),
  ].join(":");
}

export function normalizeSourceResponseCategory(
  disposition: SourceResponseDisposition | null,
): SourceNormalizedResponseCategory {
  switch (disposition) {
    case "Comply":
      return "comply";
    case "Partially Comply":
      return "partial";
    case "Exception":
      return "exception";
    case "Not Applicable":
      return "not_applicable";
    default:
      return "unanswered";
  }
}

function stableIdentityPart(value: string): string {
  return value.trim().replace(/\s+/g, "-") || "unknown";
}

interface AcceptedNormalizedResponseArtifactAuthority {
  source: "artifact_acceptance" | "client_final_artifact";
  acceptedAt: string;
}

interface SourceArtifactAuthorityRow {
  id: string;
  status: string | null;
  lifecycle_state: string | null;
  approval_state: string | null;
  is_client_final: boolean | null;
  is_current_authoritative: boolean | null;
  client_final_accepted_at: string | null;
}

interface ArtifactAcceptanceAuthorityRow {
  artifact_id: string;
  artifact_role: string | null;
  artifact_state: string | null;
  content_drift_status: string | null;
  gate_precondition_status: string | null;
  downstream_context_policy: string | null;
  accepted_at: string | null;
}

async function readAcceptedNormalizedResponseArtifactAuthority(
  artifactIds: readonly string[],
): Promise<Map<string, AcceptedNormalizedResponseArtifactAuthority>> {
  const result = new Map<string, AcceptedNormalizedResponseArtifactAuthority>();
  const uniqueArtifactIds = Array.from(new Set(artifactIds)).filter(Boolean);
  if (uniqueArtifactIds.length === 0) return result;

  const db = getAzureReadFluentClient();
  const [artifactResult, acceptanceResult] = await Promise.all([
    db
      .from("source_artifacts")
      .select(
        "id, status, lifecycle_state, approval_state, is_client_final, is_current_authoritative, client_final_accepted_at",
      )
      .in("id", uniqueArtifactIds)
      .limit(uniqueArtifactIds.length),
    db
      .from("source_artifact_acceptances")
      .select(
        "artifact_id, artifact_role, artifact_state, content_drift_status, gate_precondition_status, downstream_context_policy, accepted_at",
      )
      .in("artifact_id", uniqueArtifactIds)
      .order("accepted_at", { ascending: false })
      .limit(uniqueArtifactIds.length * 5),
  ]);

  if (!acceptanceResult.error && Array.isArray(acceptanceResult.data)) {
    for (const row of acceptanceResult.data as ArtifactAcceptanceAuthorityRow[]) {
      if (result.has(row.artifact_id)) continue;
      if (!artifactAcceptanceAllowsDownstreamUse(row)) continue;
      result.set(row.artifact_id, {
        source: "artifact_acceptance",
        acceptedAt: row.accepted_at ?? "",
      });
    }
  }

  if (!artifactResult.error && Array.isArray(artifactResult.data)) {
    for (const row of artifactResult.data as SourceArtifactAuthorityRow[]) {
      if (result.has(row.id)) continue;
      if (!clientFinalArtifactAllowsDownstreamUse(row)) continue;
      result.set(row.id, {
        source: "client_final_artifact",
        acceptedAt: row.client_final_accepted_at ?? "",
      });
    }
  }

  return result;
}

function artifactAcceptanceAllowsDownstreamUse(
  row: ArtifactAcceptanceAuthorityRow,
): boolean {
  return (
    Boolean(row.accepted_at) &&
    (row.artifact_role === "authoritative" ||
      row.artifact_role === "evidence") &&
    (row.artifact_state === "approved_for_external_use" ||
      row.artifact_state === "client_final") &&
    row.content_drift_status === "current" &&
    (row.gate_precondition_status === "ready" ||
      row.gate_precondition_status === "waived") &&
    row.downstream_context_policy === "include"
  );
}

function clientFinalArtifactAllowsDownstreamUse(
  row: SourceArtifactAuthorityRow,
): boolean {
  return (
    row.lifecycle_state === "current" &&
    (row.approval_state === "approved" || row.approval_state === "locked") &&
    row.is_client_final === true &&
    row.is_current_authoritative === true &&
    Boolean(row.client_final_accepted_at)
  );
}
