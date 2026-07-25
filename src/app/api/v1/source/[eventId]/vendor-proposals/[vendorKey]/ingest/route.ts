// POST /api/v1/source/:eventId/vendor-proposals/:vendorKey/ingest
//
// Governed vendor-proposal ingestion (PR 3 of
// ADR-0013-source-modernization-baseline.md). Uploads one vendor proposal
// document, registers it in the existing source_artifacts registry (so
// storage/audit/lineage is identical to a normal Source upload), extracts
// text via the existing extractSourceUploadText, then runs the NEW
// extractVendorProposalFacts extractor to produce candidate
// VendorProposalFacts — never the legacy free-text parseSourceTextArtifact
// pipeline, which the modernization audit found has no review gate.
//
// Every candidate lands with review status implicitly "candidate" (no row
// in source_vendor_proposal_fact_reviews yet) — nothing here is
// authoritative until a human accepts it via the accept route. If a new
// candidate shares the same (vendorKey, factKey) as an already-ACCEPTED
// fact for this event, it is stamped with supersedesFactId pointing at that
// accepted fact — accepting the new candidate later will atomically mark
// the old one superseded (see acceptVendorProposalFact). The old fact's own
// row and its accepted review are never touched here.
//
// Auth: requireTenancy + canUploadSourceArtifacts — the same permission the
// primary artifact-upload route uses; ingesting a proposal document is an
// upload, not an acceptance.

import { createHash, randomUUID } from "node:crypto";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import {
  buildSourceArtifactBlobPath,
  isAllowedSourceArtifactMimeType,
  isWithinSourceArtifactSizeLimit,
  MAX_SOURCE_ARTIFACT_SIZE_BYTES,
  registerSourceArtifactUpload,
} from "@/lib/source/artifact-registry";
import { sourceArtifactFormatFromMime } from "@/lib/source/artifact-registry/upload-contract";
import { extractSourceUploadText } from "@/lib/source/artifact-registry/upload-text-extraction";
import { extractVendorProposalFacts } from "@/lib/source/vendor-proposals/extract-vendor-proposal-facts";
import {
  getAuthoritativeVendorProposalFacts,
  insertVendorProposalFacts,
} from "@/lib/source/vendor-proposals/vendor-proposal-facts";
import type { VendorProposalFactExtractionMethod } from "@/lib/source/vendor-proposals/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STORAGE_BUCKET = "source-artifacts";

type RouteCtx = {
  params: Promise<{ eventId: string; vendorKey: string }>;
};

function jsonError(status: number, code: string, detail?: string): Response {
  return Response.json(
    { ok: false, error: code, ...(detail ? { detail } : {}) },
    { status },
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isCanonicalClientAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

function extractionMethodForMime(
  mimeType: string,
): VendorProposalFactExtractionMethod {
  return mimeType.includes("spreadsheet") || mimeType.includes("excel")
    ? "parsed_xlsx_cell"
    : "parsed_text";
}

export async function POST(request: Request, { params }: RouteCtx) {
  let tenancy: Awaited<ReturnType<typeof requireTenancy>> | undefined;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  try {
    const { eventId, vendorKey } = await params;
    if (!vendorKey?.trim()) return jsonError(400, "missing_vendor_key");

    const [activeClient, currentUser] = await Promise.all([
      getActiveClientRow().catch(() => null),
      getCurrentUser().catch(() => null),
    ]);

    const supabase = getAzureReadFluentClient();
    const { data: persistedEvent, error: fetchError } = isUuid(eventId)
      ? await supabase
          .from("source_events")
          .select("id, client_key")
          .eq("id", eventId)
          .maybeSingle()
      : { data: null, error: null };
    if (fetchError) {
      return jsonError(500, "lookup_failed", fetchError.message);
    }
    if (!persistedEvent) {
      return jsonError(404, "not_found", `No source event with id ${eventId}`);
    }

    const fallbackClientKey =
      (isClientKey(currentUser?.metadataClientKey)
        ? currentUser.metadataClientKey
        : null) ?? inferClientKeyFromEmail(currentUser?.email);
    const effectiveClientKey = activeClient?.key ?? fallbackClientKey;
    if (!effectiveClientKey) {
      if (tenancyError) return tenancyErrorResponse(tenancyError);
      return jsonError(
        403,
        "no_client",
        "No active client for Source ingestion",
      );
    }
    if (persistedEvent.client_key !== effectiveClientKey) {
      return jsonError(404, "not_found", `No source event with id ${eventId}`);
    }

    const accessPolicy =
      tenancy && activeClient
        ? await loadUserSourceAccessPolicy(tenancy, {
            activeClientKey: activeClient.key,
            sourceEventId: persistedEvent.id,
          }).catch(() => null)
        : null;
    const canonicalAdminFallbackAllowed =
      !activeClient &&
      isCanonicalClientAdminEmail(currentUser?.email) &&
      persistedEvent.client_key === effectiveClientKey;
    const canMutate = Boolean(
      accessPolicy?.canUploadSourceArtifacts || canonicalAdminFallbackAllowed,
    );
    if (!canMutate) {
      return jsonError(
        403,
        "forbidden",
        "Upload rights are required to ingest a vendor proposal.",
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return jsonError(400, "invalid_multipart");
    }
    const fileEntry = formData.get("file");
    if (!fileEntry || typeof fileEntry === "string") {
      return jsonError(400, "missing_file");
    }
    const file = fileEntry as File;
    const filename =
      file.name && file.name.trim().length > 0 ? file.name : "proposal";
    const mimeType = file.type || "application/octet-stream";

    if (!isAllowedSourceArtifactMimeType(mimeType)) {
      return jsonError(
        415,
        "unsupported_mime",
        `mime "${mimeType}" is not in the allowlist`,
      );
    }
    if (!isWithinSourceArtifactSizeLimit(file.size)) {
      return jsonError(
        413,
        "oversize",
        `size ${file.size} exceeds limit ${MAX_SOURCE_ARTIFACT_SIZE_BYTES}`,
      );
    }

    const artifactId = randomUUID();
    let blobUri: string;
    try {
      blobUri = buildSourceArtifactBlobPath({
        tenantKey: effectiveClientKey,
        sourceEventId: persistedEvent.id,
        artifactId,
        filename,
      });
    } catch (error) {
      return jsonError(
        400,
        "invalid_filename",
        error instanceof Error ? error.message : "invalid filename",
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const storage = getObjectStorageAdapter();

    try {
      await storage.upload(STORAGE_BUCKET, blobUri, buffer, {
        contentType: mimeType,
        cacheControl: "private, max-age=0",
        upsert: false,
      });
    } catch (uploadError) {
      return jsonError(
        500,
        "storage_upload_failed",
        uploadError instanceof Error
          ? uploadError.message
          : "object storage upload failed",
      );
    }

    let artifact;
    try {
      artifact = await registerSourceArtifactUpload({
        artifactId,
        tenantKey: effectiveClientKey,
        sourceEventId: persistedEvent.id,
        sourceEventRowId: persistedEvent.id,
        stageKey: "responses",
        artifactFamily: "proposal",
        artifactKind: "vendor_proposal",
        sourceOrigin: "uploaded",
        sourceFormat: sourceArtifactFormatFromMime(mimeType),
        originalName: filename,
        blobUri,
        uploaderUserId: tenancy?.userId ?? "unknown",
        mimeType,
        sizeBytes: file.size,
        sha256,
        createdBy: tenancy?.userId ?? "unknown",
      });
    } catch (error) {
      await storage.remove(STORAGE_BUCKET, [blobUri]).catch(() => undefined);
      return jsonError(
        500,
        "metadata_insert_failed",
        error instanceof Error ? error.message : "failed to persist artifact",
      );
    }

    // Malformed/unsupported content is handled honestly: extraction never
    // throws (extractSourceUploadText is documented pure/never-throwing), and
    // an unsupported or empty result simply yields zero candidates below —
    // the artifact is still registered, just with nothing extracted from it.
    const extracted = await extractSourceUploadText({ buffer, mimeType });
    const rawCandidates = extractVendorProposalFacts(extracted.text, {
      extractionMethod: extractionMethodForMime(mimeType),
    });

    // Auto-detect supersession: a new candidate sharing (vendorKey, factKey)
    // with an already-ACCEPTED fact for this event is a revision, not a
    // duplicate — stamp supersedesFactId so accepting it later atomically
    // supersedes the old one (see acceptVendorProposalFact).
    const currentlyAccepted = await getAuthoritativeVendorProposalFacts({
      eventId: persistedEvent.id,
      clientKey: effectiveClientKey,
      vendorKey,
    });
    const acceptedByFactKey = new Map(
      currentlyAccepted.map((fact) => [fact.factKey, fact.id]),
    );

    const insertResult = await insertVendorProposalFacts(
      rawCandidates.map((candidate) => ({
        clientKey: effectiveClientKey,
        sourceEventId: persistedEvent.id,
        vendorKey,
        proposalArtifactId: artifact.id,
        factKey: candidate.factKey,
        sectionKey: candidate.sectionKey,
        pageOrLocation: candidate.pageOrLocation,
        valueNumeric: candidate.valueNumeric,
        valueText: candidate.valueText,
        unit: candidate.unit,
        currency: candidate.currency,
        sourceQuote: candidate.sourceQuote,
        confidence: candidate.confidence,
        extractionMethod: candidate.extractionMethod,
        supersedesFactId: acceptedByFactKey.get(candidate.factKey) ?? null,
        createdBy: tenancy?.userId ?? "unknown",
      })),
    );
    if (!insertResult.ok) {
      return jsonError(500, "fact_insert_failed", insertResult.error);
    }

    return Response.json({
      ok: true,
      artifact: { id: artifact.id, originalName: artifact.originalName },
      candidateFactsInserted: insertResult.records.length,
      candidates: insertResult.records,
      extractionWarnings: extracted.warnings,
    });
  } catch (err) {
    console.error(
      "[POST /api/v1/source/:eventId/vendor-proposals/:vendorKey/ingest]",
      err,
    );
    return jsonError(500, "internal_error");
  }
}
