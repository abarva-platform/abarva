import "server-only";

import {
  getAzureReadFluentClient,
  getAzureWriteFluentClient,
} from "@/lib/data-plane/postgresCompat";
import type { SourceArtifactRegistryRecord } from "./artifact-registry";
import type { ParsedNormalizedVendorResponse } from "./vendor-response-workbook";
import type { NormalizedVendorResponsePackage } from "./vendor-response-matrix";

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
    parser: "source_normalized_vendor_response_v1",
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
  const { data, error } = await getAzureReadFluentClient()
    .from("source_artifact_facts")
    .select("artifact_id, fact_type, fact_key, fact_value")
    .eq("source_event_id", args.eventId)
    .eq("tenant_key", args.tenantKey)
    .in("fact_type", [
      "normalized_requirement_response",
      "normalized_response_quality",
    ])
    .limit(2_000);
  if (error) throw error;

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
      };
    }
  >();
  for (const raw of data ?? []) {
    const row = raw as {
      artifact_id?: unknown;
      fact_type?: unknown;
      fact_value?: unknown;
    };
    const artifactId = String(row.artifact_id ?? "");
    if (!artifactId || !row.fact_value || typeof row.fact_value !== "object") {
      continue;
    }
    const group = byArtifact.get(artifactId) ?? { rows: [] };
    const value = row.fact_value as Record<string, unknown>;
    if (row.fact_type === "normalized_requirement_response") {
      group.rows.push(toNormalizedResponse(value));
    } else if (row.fact_type === "normalized_response_quality") {
      group.summary = {
        vendorId: String(value.vendor_id ?? ""),
        vendorName: String(value.vendor_name ?? "Vendor not identified"),
        receivedAt: String(value.received_at ?? ""),
        originalName: String(value.original_name ?? "Vendor Response Workbook.xlsx"),
        analytics: value.analytics as ParsedNormalizedVendorResponse["analytics"],
        parserWarnings: Array.isArray(value.parser_warnings)
          ? value.parser_warnings.map(String)
          : [],
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
      rows: group.rows.sort((a, b) =>
        a.requirementId.localeCompare(b.requirementId),
      ),
      analytics: group.summary.analytics,
      parserWarnings: group.summary.parserWarnings,
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
): ParsedNormalizedVendorResponse["rows"][number] {
  return {
    requirementId: String(value.requirementId ?? ""),
    category: value.category as ParsedNormalizedVendorResponse["rows"][number]["category"],
    section: String(value.section ?? ""),
    requirement: String(value.requirement ?? ""),
    requirementLevel:
      value.requirementLevel as ParsedNormalizedVendorResponse["rows"][number]["requirementLevel"],
    responseType:
      value.responseType as ParsedNormalizedVendorResponse["rows"][number]["responseType"],
    evidenceRequired: Boolean(value.evidenceRequired),
    evaluationCriterionId: stringOrNull(value.evaluationCriterionId),
    responseDisposition:
      (value.responseDisposition as ParsedNormalizedVendorResponse["rows"][number]["responseDisposition"]) ??
      null,
    responseNarrative: stringOrNull(value.responseNarrative),
    evidenceRefs: Array.isArray(value.evidenceRefs)
      ? value.evidenceRefs.map(String)
      : [],
    pricingRef: stringOrNull(value.pricingRef),
    slaRef: stringOrNull(value.slaRef),
    exceptionRef: stringOrNull(value.exceptionRef),
    vendorOwner: stringOrNull(value.vendorOwner),
  };
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
