import "server-only";

import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/app/api/v1/programs/_auth";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { assembleEditionInputs, ReferenceMoveUnavailable } from "@/lib/deliverables/orchestrator/reference-deck-inputs";
import { VALIDATION_SEQUENCE, INVESTMENT_SEQUENCE, buildReferenceEdition } from "@/lib/deliverables/orchestrator/reference-deck-edition";
import { draftEditionWords, type UseCasePromptType } from "@/lib/deliverables/orchestrator/reference-deck-words";
import { validateReferenceDeck, type ReferenceEdition } from "@/lib/deliverables/orchestrator/reference-deck-model";
import { renderReferenceDeck } from "@/lib/deliverables/orchestrator/reference-deck-renderer";
import { inspectDeck } from "@/lib/deliverables/orchestrator/deck-inspection";
import { judgeRenderedDeck } from "@/lib/deliverables/orchestrator/deck-quality";
import { parseOperatingAdoption } from "@/lib/programs/operating-adoption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const previewHeaders = (score?: number) => ({
  "X-AbarVa-Preview": "not-persisted",
  "Cache-Control": "private, no-store, max-age=0",
  ...(score === undefined ? {} : { "X-AbarVa-Deck-Fidelity-Score": String(score) }),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; edition: string }> },
) {
  const { programId, edition: rawEdition } = await params;
  const edition = rawEdition === "validation" || rawEdition === "investment" ? rawEdition as ReferenceEdition : null;
  const format = req.nextUrl.searchParams.get("format");
  if (!edition || (format !== "pptx" && format !== "pdf")) {
    return Response.json({ error: "invalid_preview_request", detail: "Choose validation or investment and format=pptx or pdf." }, { status: 400, headers: previewHeaders() });
  }
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try { ctx = await requireTenancy(); } catch (error) { return tenancyErrorResponse(error); }
  if (isFeatureEnabled({ clientKey: ctx.clientKey, clientId: ctx.clientId }, "moves_reference_deck_v1") !== true || ctx.clientKey !== "meridian") {
    return Response.json({ error: "preview_not_enabled", detail: "Reference-deck preview is not enabled for this workspace." }, { status: 404, headers: previewHeaders() });
  }

  try {
    const inputs = await assembleEditionInputs(programId, edition);
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    const ownerReadback = inputs.capture[3].status === "ready"
      ? parseOperatingAdoption(inputs.capture[3].value.operating_adoption) : null;
    const words = await draftEditionWords({
      tenantId: ctx.clientKey, userId: ctx.userId, edition, archetypes: sequence,
      useCaseType: (inputs.move.archetype ?? "unclassified") as UseCasePromptType,
      available: {
        valueCase: inputs.valueCase.status === "ready" && inputs.valueCase.value.figuresRedacted !== true,
        register: inputs.register.status === "ready" && !inputs.register.value.figuresRedacted,
        rom: inputs.rom.status === "ready",
        publicSources: inputs.citations.status === "ready" && inputs.citations.value.length > 0,
        owners: Boolean(ownerReadback?.ownersAcceptedAt && ownerReadback.rows.some((row) => row.owner)),
      },
    });
    const spec = buildReferenceEdition(inputs, words);
    const figureHash = createHash("sha256").update(JSON.stringify(spec.figureLedger)).digest("hex");
    const blocked = validateReferenceDeck(spec).filter((finding) => finding.blocking);
    if (blocked.length) {
      return Response.json({ error: "figure_lineage_refusal", detail: "A deck figure or edition boundary failed validation.", findings: blocked }, { status: 422, headers: previewHeaders() });
    }
    const pptx = await renderReferenceDeck(spec);
    const inspected = await inspectDeck(pptx);
    const verdict = judgeRenderedDeck(inspected, { referenceDeck: spec });
    const score = verdict.fidelityScore ?? 0;
    if (format === "pptx") {
      return new Response(Uint8Array.from(pptx), {
        headers: {
          ...previewHeaders(score),
          "X-AbarVa-Deck-Figure-Hash": figureHash,
          "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="move-${edition}-preview.pptx"`,
        },
      });
    }
    const [{ pdf }, { buildReferenceDeckPdf }] = await Promise.all([
      import("@react-pdf/renderer"),
      import("@/lib/deliverables/orchestrator/reference-deck-pdf"),
    ]);
    const stream = await pdf(buildReferenceDeckPdf(spec)).toBuffer();
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer | string>) chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    return new Response(Uint8Array.from(Buffer.concat(chunks)), {
      headers: {
        ...previewHeaders(score), "Content-Type": "application/pdf",
        "X-AbarVa-Deck-Figure-Hash": figureHash,
        "Content-Disposition": `attachment; filename="move-${edition}-preview.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof ReferenceMoveUnavailable) {
      return Response.json({ error: "move_unavailable", detail: error.message }, { status: 404, headers: previewHeaders() });
    }
    if (error instanceof Error && error.message.startsWith("reference_deck_lineage_refusal")) {
      return Response.json({ error: "figure_lineage_refusal", detail: error.message }, { status: 422, headers: previewHeaders() });
    }
    console.error("[reference-deck-preview] render failed", error);
    return Response.json({ error: "preview_render_failed", detail: "The read-only preview could not be rendered." }, { status: 500, headers: previewHeaders() });
  }
}
