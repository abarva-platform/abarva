import "server-only";

import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/programs/_auth";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { assembleEditionInputs, ReferenceMoveUnavailable } from "@/lib/deliverables/orchestrator/reference-deck-inputs";
import { VALIDATION_SEQUENCE, INVESTMENT_SEQUENCE, buildReferenceEdition } from "@/lib/deliverables/orchestrator/reference-deck-edition";
import { unavailableEditionWords } from "@/lib/deliverables/orchestrator/reference-deck-words";
import { buildReferenceWorkbook } from "@/lib/deliverables/orchestrator/reference-deck-workbook";
import { ROM_WORKBOOK_CONTENT_TYPE } from "@/lib/pricing/moves-workflow/rom-workbook";
import type { ReferenceEdition } from "@/lib/deliverables/orchestrator/reference-deck-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Optional companion to the PPTX/PDF preview; no artifact or workbook is saved. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string; edition: string }> },
) {
  const { programId, edition: rawEdition } = await params;
  const edition = rawEdition === "validation" || rawEdition === "investment" ? rawEdition as ReferenceEdition : null;
  if (!edition) return Response.json({ error: "invalid_edition", detail: "Choose validation or investment." }, { status: 400 });
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try { ctx = await requireTenancy(); } catch (error) { return tenancyErrorResponse(error); }
  if (isFeatureEnabled({ clientKey: ctx.clientKey, clientId: ctx.clientId }, "moves_reference_deck_v1") !== true || ctx.clientKey !== "meridian") {
    return Response.json({ error: "preview_not_enabled", detail: "Reference-deck preview is not enabled for this workspace." }, { status: 404 });
  }
  try {
    const inputs = await assembleEditionInputs(programId, edition);
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    const spec = buildReferenceEdition(inputs, unavailableEditionWords(edition, sequence));
    const workbook = await buildReferenceWorkbook(inputs, spec);
    const figureHash = createHash("sha256").update(JSON.stringify(spec.figureLedger)).digest("hex");
    return new Response(Uint8Array.from(workbook), { headers: {
      "Content-Type": ROM_WORKBOOK_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="move-${edition}-preview-figures.xlsx"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-AbarVa-Preview": "not-persisted",
      "X-AbarVa-Deck-Figure-Hash": figureHash,
    } });
  } catch (error) {
    if (error instanceof ReferenceMoveUnavailable) return Response.json({ error: "move_unavailable", detail: error.message }, { status: 404 });
    if (error instanceof Error && error.message === "reference_rom_workbook_mismatch")
      return Response.json({ error: "rom_workbook_mismatch", detail: "The current ROM formula result does not match the approved snapshot." }, { status: 409 });
    console.error("[reference-deck-workbook] build failed", error);
    return Response.json({ error: "workbook_build_failed", detail: "The read-only companion workbook could not be rendered." }, { status: 500 });
  }
}
