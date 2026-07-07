import { NextRequest, NextResponse } from "next/server";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import { getGeneratedArtifactById } from "@/lib/artifacts/repository";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getMoveArtifactForTenant } from "@/lib/programs/deliverables/move-artifacts";
import { getSourceArtifactRegistryRecord } from "@/lib/source/artifact-registry";
import { workspaceDataClassFor } from "@/lib/workspace-explorer/tenant-vault-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VaultScope = "source" | "move" | "generated";

function isVaultScope(value: string): value is VaultScope {
  return value === "source" || value === "move" || value === "generated";
}

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.url));
}

function generatedMoveId(sourceArtifactRef: string): string | null {
  const match = /^move:([^:]+):/.exec(sourceArtifactRef);
  return match?.[1] ?? null;
}

function metadataClassification(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  if (typeof metadata?.classification === "string") {
    return metadata.classification;
  }
  if (typeof metadata?.dataClassification === "string") {
    return metadata.dataClassification;
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ scope: string; artifactId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { scope, artifactId } = await params;
    if (!isVaultScope(scope) || !artifactId?.trim()) {
      return Response.json(
        { error: "bad_request", detail: "Unknown vault artifact scope." },
        { status: 400 },
      );
    }

    if (scope === "source") {
      const record = await getSourceArtifactRegistryRecord(artifactId);
      const tenantKey = ctx.clientKey
        ? clientKeyToInventorySubstrateKey(ctx.clientKey)
        : "";
      if (!record || record.deletedAt || record.tenantKey !== tenantKey) {
        return Response.json({ error: "not_found" }, { status: 404 });
      }
      const policy = await loadUserSourceAccessPolicy(ctx, {
        activeClientKey: ctx.clientKey ?? "",
        sourceEventId: record.sourceEventId,
      });
      const inScope =
        policy.sourceEventIdsAllowed === null ||
        policy.sourceEventIdsAllowed.includes(record.sourceEventId);
      const classAllowed = policy.allowedDataClasses.includes(
        workspaceDataClassFor(record.dataClassification),
      );
      if (!inScope || !classAllowed) {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
      return redirectTo(
        request,
        `/api/v1/source/artifacts/${encodeURIComponent(record.id)}/download`,
      );
    }

    if (scope === "move") {
      const row = await getMoveArtifactForTenant(ctx, artifactId);
      if (!row) return Response.json({ error: "not_found" }, { status: 404 });
      const policy = await loadUserProgramAccessPolicy(ctx, {
        programId: row.move_id,
      });
      const inScope =
        policy.programIdsAllowed === null ||
        policy.programIdsAllowed.includes(row.move_id);
      const classAllowed = policy.allowedDataClasses.includes(
        workspaceDataClassFor(metadataClassification(row.metadata)),
      );
      if (!inScope || !classAllowed) {
        return Response.json({ error: "forbidden" }, { status: 403 });
      }
      return redirectTo(
        request,
        `/api/v1/programs/${encodeURIComponent(
          row.move_id,
        )}/artifacts/${encodeURIComponent(row.artifact_id)}/download`,
      );
    }

    const record = await getGeneratedArtifactById(artifactId, {
      clientId: ctx.clientId,
    });
    if (!record) return Response.json({ error: "not_found" }, { status: 404 });
    const moveId = generatedMoveId(record.sourceArtifactRef);
    const policy = await loadUserProgramAccessPolicy(ctx, {
      programId: moveId,
    });
    const inScope =
      !moveId ||
      policy.programIdsAllowed === null ||
      policy.programIdsAllowed.includes(moveId);
    const classAllowed = policy.allowedDataClasses.includes(
      workspaceDataClassFor(metadataClassification(record.metadata)),
    );
    if (!inScope || !classAllowed) {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
    return redirectTo(
      request,
      `/api/v1/artifacts/${encodeURIComponent(record.id)}`,
    );
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      throw err;
    }
  }
}
