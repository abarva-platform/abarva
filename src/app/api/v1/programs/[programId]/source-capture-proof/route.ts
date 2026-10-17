import { NextRequest } from "next/server";
import { z } from "zod";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { azureRead } from "@/lib/data-plane/azureRead";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import { proveReviewedSourceCitation } from "@/lib/knowledge/context-broker";
import {
  CAPTURE_DATASET_ID,
  PhaseCaptureCohortSchema,
  readPhaseCaptureSnapshot,
  preparePhaseCapturePlan,
} from "@/lib/programs/evidence-readiness/phase-capture-preparation";
import { isDeclaredSyntheticSourceTenant } from "@/lib/programs/evidence-readiness/exact-source-preparation";
import type { ExactSourceQuery } from "@/lib/programs/evidence-readiness/exact-source-reader";
import type { DatasetManifest } from "@/lib/governance/dataset-manifest";
import manifest from "@/../docs/governance/dataset-manifests/moves-phase-capture-preparation-v1.json";
import registry from "@/../datasets/tenant-inputs/tenant-input-registry.json";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const db: ExactSourceQuery = {
  query: async (sql, values) => ({
    rows: await azureRead.query(sql, values, { missingTable: "throw" }),
  }),
};
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ]!,
  );

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const input = z
      .object({
        programId: z.string().uuid(),
        moduleId: z.string().uuid(),
        revision: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .safeParse({
        ...(await params),
        moduleId: req.nextUrl.searchParams.get("moduleId"),
        revision: req.nextUrl.searchParams.get("revision"),
      });
    if (!input.success)
      return Response.json(
        { error: "source_proof_input_invalid" },
        { status: 400 },
      );
    const ctx = await requireTenancy(),
      clientKey = canonicalTenantKey(ctx.clientKey);
    if (
      !clientKey ||
      !ctx.clerkUserId ||
      !isDeclaredSyntheticSourceTenant(registry, clientKey)
    )
      return Response.json(
        { error: "source_proof_tenant_not_released" },
        { status: 403 },
      );
    const access = await loadUserProgramAccessPolicy(ctx, {
      programId: input.data.programId,
    });
    if (
      !access.canApproveGates ||
      !access.canViewFinancialData ||
      (access.programIdsAllowed &&
        !access.programIdsAllowed.includes(input.data.programId))
    )
      return Response.json({ error: "forbidden" }, { status: 403 });
    const { rows } = await db.query(
      "SELECT e.current_phase,m.phase_number FROM public.engagements e JOIN public.program_modules m ON m.engagement_id=e.id WHERE e.id=$1::uuid AND e.client_id=$2::uuid AND m.id=$3::uuid AND e.deleted_at IS NULL AND e.archived_at IS NULL",
      [input.data.programId, ctx.clientId, input.data.moduleId],
    );
    if (rows.length !== 1)
      return Response.json({ error: "not_found" }, { status: 404 });
    const cohort = PhaseCaptureCohortSchema.parse({
      version: 1,
      datasetId: CAPTURE_DATASET_ID,
      clientKey,
      nativeTenantKey: ctx.clientKey,
      clientId: ctx.clientId,
      moveId: input.data.programId,
      expectedCurrentPhase: rows[0].current_phase,
      operatorPersonId: ctx.userId,
      operatorClerkId: ctx.clerkUserId,
      sources: [
        {
          moduleId: input.data.moduleId,
          phase: rows[0].phase_number,
          sourceRevision: input.data.revision,
        },
      ],
    });
    const read = async () =>
      preparePhaseCapturePlan(
        cohort,
        await readPhaseCaptureSnapshot(
          db,
          cohort,
          async (person) => person.id === ctx.userId,
        ),
        manifest as DatasetManifest,
        true,
      );
    const plan = await read(),
      source = plan.sources[0];
    if (req.nextUrl.searchParams.get("download") === "1")
      return new Response(source.originalBytes, {
        headers: {
          "content-type": "application/json",
          "content-disposition": `inline; filename="phase-${cohort.sources[0].phase}-source-${input.data.moduleId}.json"`,
          "cache-control": "private, no-store",
        },
      });
    const proof = await proveReviewedSourceCitation(source);
    if ((await read()).sourceSetHash !== plan.sourceSetHash)
      return Response.json(
        { error: "source_capture_revision_changed" },
        { status: 409 },
      );
    if (req.headers.get("accept")?.includes("application/json"))
      return Response.json(
        {
          proof,
          sourceSetHash: plan.sourceSetHash,
          modelReadinessGranted: false,
        },
        { headers: { "cache-control": "private, no-store" } },
      );
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Saved answer source verification</title></head><body><main data-source-proof="non-model" data-source-revision="${escape(input.data.revision)}" data-index-document="${escape(source.citationDocumentId)}"><h1>Saved answer source verification</h1><p>Saved synthetic planning context. No independent client or Finance attestation.</p><h2>${escape(source.locator)}</h2><blockquote data-retrieved-quote>${escape(source.quote)}</blockquote><p>${escape(source.locator)}</p><a data-original-source href="${escape(source.downloadPath)}">Open exact saved source</a><p>This proof does not approve a phase or grant model readiness.</p></main></body></html>`;
    return new Response(html, {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "private, no-store",
        "content-security-policy":
          "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "source_proof_unavailable";
    if (message.startsWith("source_"))
      return Response.json(
        { error: message },
        { status: 503, headers: { "cache-control": "private, no-store" } },
      );
    return tenancyErrorResponse(error);
  }
}
