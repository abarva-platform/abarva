// POST /api/v1/programs/:programId/rom/preview[?format=xlsx]
//
// Read-only ROM preview. The body is a ROM structure (use cases with
// component counts, caller-supplied unit hours with source and confidence,
// releases, a shared foundation, a pod, friction and productive share). The
// route prices it with `computeRom` over the committed cost foundation and
// returns the result as JSON, or as a live-formula workbook with
// `?format=xlsx`. It writes nothing: no estimate row, no deliverable, no
// capture value.
//
// Order of fences: tenancy, the `moves_rom_engine_v1` flag, the Move (the
// cause-blind unreadable-Move body), then the program access policy. Every
// refusal carries an authored `detail` sentence.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { getProgramById } from "@/lib/programs/queries";
import { moveUnreadableRefusalBody } from "@/lib/programs/move-unreadable-refusal";
import { loadUserProgramAccessPolicy } from "@/lib/auth/program-access-policy";
import {
  computeRom,
  type RomReferenceLoaders,
} from "@/lib/pricing/moves-workflow/rom-service";
import { createCommittedRomReferenceLoaders } from "@/lib/pricing/moves-workflow/rom-reference";
import {
  ROM_WORKBOOK_CONTENT_TYPE,
  romWorkbookBuffer,
} from "@/lib/pricing/moves-workflow/rom-workbook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROM_PREVIEW_DETAILS = {
  notEnabled: "ROM previews are not enabled for this workspace.",
  forbidden:
    "Your access to this Move does not include ROM previews. Ask a workspace admin to add you to the Move.",
  invalidBody: "The request body must be a JSON ROM structure.",
  invalidFormat: "The format must be json or xlsx.",
  referenceUnavailable:
    "The cost foundation reference data could not be read, so no ROM was priced. Try again; if it keeps failing, the reference pack is missing from this deployment.",
  internal:
    "The ROM preview failed unexpectedly. Nothing was saved. Try again.",
} as const;

let committedLoaders: RomReferenceLoaders | null = null;
function referenceLoaders(): RomReferenceLoaders {
  committedLoaders ??= createCommittedRomReferenceLoaders();
  return committedLoaders;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const ctx = await requireTenancy();
    const { programId } = await params;

    if (!isFeatureEnabled(ctx, "moves_rom_engine_v1")) {
      return Response.json(
        { error: "not_enabled", detail: ROM_PREVIEW_DETAILS.notEnabled },
        { status: 404 },
      );
    }

    const program = await getProgramById(ctx, programId);
    if (!program) {
      return Response.json(moveUnreadableRefusalBody(), { status: 404 });
    }

    const policy = await loadUserProgramAccessPolicy(ctx, { programId });
    if (
      policy.accessLevel === "no_program_access" ||
      (Array.isArray(policy.programIdsAllowed) &&
        !policy.programIdsAllowed.includes(programId))
    ) {
      return Response.json(
        { error: "forbidden", detail: ROM_PREVIEW_DETAILS.forbidden },
        { status: 403 },
      );
    }

    const format = req.nextUrl.searchParams.get("format") ?? "json";
    if (format !== "json" && format !== "xlsx") {
      return Response.json(
        { error: "invalid_format", detail: ROM_PREVIEW_DETAILS.invalidFormat },
        { status: 400 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { error: "invalid_body", detail: ROM_PREVIEW_DETAILS.invalidBody },
        { status: 400 },
      );
    }

    let loaders: RomReferenceLoaders;
    try {
      loaders = referenceLoaders();
      // Read eagerly so a missing pack is reported as such, not as a pricing defect.
      loaders.loadRateReference();
      loaders.loadPodLibrary();
      loaders.loadRangePolicies();
    } catch (err) {
      committedLoaders = null;
      console.error(
        "[POST /api/v1/programs/:programId/rom/preview] reference pack",
        err,
      );
      return Response.json(
        {
          error: "reference_unavailable",
          detail: ROM_PREVIEW_DETAILS.referenceUnavailable,
        },
        { status: 503 },
      );
    }

    const rom = computeRom(body, loaders);
    if (!rom.ok) {
      return Response.json(
        { error: rom.code, detail: rom.message },
        { status: 422 },
      );
    }

    if (format === "xlsx") {
      const bytes = await romWorkbookBuffer(rom);
      return new Response(new Uint8Array(bytes), {
        status: 200,
        headers: {
          "Content-Type": ROM_WORKBOOK_CONTENT_TYPE,
          "Content-Disposition": `attachment; filename="rom-preview-${programId.replace(/[^A-Za-z0-9_-]/g, "")}.xlsx"`,
          "Cache-Control": "no-store",
        },
      });
    }
    return Response.json({ ok: true, programId, writes: false, rom });
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      /* not a tenancy error */
    }
    console.error("[POST /api/v1/programs/:programId/rom/preview]", err);
    return Response.json(
      { error: "internal_error", detail: ROM_PREVIEW_DETAILS.internal },
      { status: 500 },
    );
  }
}
