import { createHash } from "node:crypto";
import type { SourceGenerationContext } from "@/lib/source/agent-generation/types";
import { getLatestArtifactAcceptance } from "@/lib/source/artifact-acceptances";
import { resolveArtifactAuthority } from "@/lib/source/contracts/artifact-authority";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { downloadArtifactBytes } from "@/lib/source/file-cabinet/blob-store";
import { artifactContentDisposition } from "@/lib/source/file-cabinet/content-disposition";
import { listSourceArtifacts } from "@/lib/source/file-cabinet/repository";
import { contentTypeFor, type ArtifactFileFormat } from "@/lib/source/file-cabinet/types";
import { assertNarrativeArtifactExportable } from "@/lib/source/exports/payloads/narrative-docx-payload";

interface RfpGovernanceRow {
  client_id: string;
  tenant_key: string;
  source_event_id: string;
  artifact_type: string;
  status: string | null;
  lifecycle_state: string | null;
  approval_state: string | null;
  approved_by: string | null;
}

export async function requireRfpArtifactExport(
  ctx: SourceGenerationContext,
  artifactCode: string,
  clientId: string | null,
  requestedFormat: ArtifactFileFormat = "docx",
): Promise<{ response: Response | null; linkedArtifactId: string | null }> {
  if (artifactCode !== "d09_rfp_pack") {
    return { response: null, linkedArtifactId: null };
  }

  const linkedArtifactId = ctx.artifactStates.find(
    (state) => state.artifactCode === artifactCode,
  )?.linkedArtifactId ?? null;
  if (!clientId || !linkedArtifactId) {
    return { response: blocked(), linkedArtifactId: null };
  }

  const { data: row, error } = await getAzureReadFluentClient()
    .from("source_artifacts")
    .select("client_id, tenant_key, source_event_id, artifact_type, status, lifecycle_state, approval_state, approved_by")
    .eq("id", linkedArtifactId)
    .maybeSingle<RfpGovernanceRow>();
  if (
    error || !row ||
    row.client_id !== clientId ||
    row.tenant_key !== ctx.tenantKey ||
    row.source_event_id !== ctx.event.id ||
    row.artifact_type !== artifactCode
  ) {
    return { response: blocked(), linkedArtifactId: null };
  }

  const acceptance = await getLatestArtifactAcceptance(linkedArtifactId);
  if (
    acceptance &&
    (
      acceptance.artifactId !== linkedArtifactId ||
      acceptance.eventId !== ctx.event.id ||
      acceptance.authoritativeVersionId !== linkedArtifactId ||
      acceptance.artifactRole !== "authoritative" ||
      acceptance.contentDriftStatus !== "current" ||
      acceptance.gatePreconditionStatus !== "ready" ||
      (acceptance.artifactState !== "approved_for_external_use" &&
        acceptance.artifactState !== "client_final")
    )
  ) {
    return { response: blocked(), linkedArtifactId: null };
  }
  const authority = resolveArtifactAuthority({
    code: artifactCode,
    status: row.status,
    lifecycleState: row.lifecycle_state,
    approvalState: row.approval_state,
    approvedBy: row.approved_by,
    hasActiveAcceptance: acceptance !== null,
    eventStageKey: ctx.event.currentStageKey,
  });
  if (!authority.isAuthoritative || !authority.isExportEligible) {
    return {
      response: Response.json(
        {
          error: "export_not_eligible",
          governanceStage: authority.governanceStage,
          blockers: authority.blockers,
        },
        { status: 409, headers: { "cache-control": "private, no-store" } },
      ),
      linkedArtifactId: null,
    };
  }
  const artifacts = await listSourceArtifacts(
    ctx.event.id,
    clientId,
    { includeHistory: false },
    getAzureReadFluentClient(),
  );
  const record = artifacts.find((artifact) => artifact.id === linkedArtifactId);
  if (
    !record ||
    record.clientId !== clientId ||
    record.tenantKey !== ctx.tenantKey ||
    record.sourceEventId !== ctx.event.id ||
    record.artifactType !== artifactCode ||
    record.lifecycleState !== "current"
  ) {
    return { response: blocked(), linkedArtifactId: null };
  }
  if (!record.isClientFinal) {
    try {
      assertNarrativeArtifactExportable(
        artifactCode,
        ctx.artifactStates.find((state) => state.artifactCode === artifactCode),
      );
    } catch {
      return { response: blocked(), linkedArtifactId: null };
    }
  }
  if (record.fileFormat !== requestedFormat) {
    return {
      response: Response.json(
        {
          error: record.isClientFinal
            ? "client_final_format_mismatch"
            : "linked_artifact_format_mismatch",
          artifactId: record.id,
          artifactCode,
          requestedArtifactCode: artifactCode,
          availableFormat: record.fileFormat,
          requestedFormat,
          fileName: record.fileName,
        },
        {
          status: 409,
          headers: {
            "cache-control": "private, no-store",
            "x-source-artifact-authoritative": record.isClientFinal
              ? "client-final-format-mismatch"
              : "linked-format-mismatch",
            "x-source-client-final-format": record.fileFormat,
            "x-source-requested-artifact-format": requestedFormat,
          },
        },
      ),
      linkedArtifactId: null,
    };
  }
  if (!record.blobSha256 || !/^[a-f0-9]{64}$/i.test(record.blobSha256)) {
    return { response: blocked(), linkedArtifactId: null };
  }
  const bytes = await downloadArtifactBytes({
    bucket: record.blobContainer,
    path: record.blobPath,
  });
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  if (actualHash !== record.blobSha256.toLowerCase()) {
    return { response: blocked(), linkedArtifactId: null };
  }
  return {
    response: new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "content-type": contentTypeFor(record.fileFormat),
        "content-disposition": artifactContentDisposition(
          record.fileFormat === "html" ? "inline" : "attachment",
          record.fileName,
        ),
        "content-length": String(bytes.length),
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        ...(record.fileFormat === "html"
          ? {
              "content-security-policy":
                "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com;",
            }
          : {}),
        "x-source-artifact-id": record.id,
        "x-source-artifact-code": artifactCode,
        "x-source-event-code": ctx.event.code,
        "x-source-artifact-version": String(record.version),
        "x-source-artifact-format": record.fileFormat,
        "x-source-artifact-authoritative": "accepted-linked",
        "x-source-artifact-sha256": actualHash,
      },
    }),
    linkedArtifactId,
  };
}

function blocked(): Response {
  return Response.json(
    { error: "export_not_eligible" },
    { status: 409, headers: { "cache-control": "private, no-store" } },
  );
}

export function allowsDegradedSourcePdf(
  artifactCode: string,
  isNarrative: boolean,
): boolean {
  return isNarrative && artifactCode !== "d09_rfp_pack";
}
