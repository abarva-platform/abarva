import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { assembleEditionInputs, ReferenceMoveUnavailable } from "@/lib/deliverables/orchestrator/reference-deck-inputs";
import { VALIDATION_SEQUENCE, INVESTMENT_SEQUENCE, buildReferenceEdition } from "@/lib/deliverables/orchestrator/reference-deck-edition";
import { draftEditionWords, type DraftEditionWordsResult, type PhasePromptStage, type UseCasePromptType } from "@/lib/deliverables/orchestrator/reference-deck-words";
import { buildReferenceSlotTable } from "@/lib/deliverables/orchestrator/reference-deck-slots";
import { validateReferenceDeck, type ReferenceEdition } from "@/lib/deliverables/orchestrator/reference-deck-model";
import { renderReferenceDeck } from "@/lib/deliverables/orchestrator/reference-deck-renderer";
import { inspectDeck } from "@/lib/deliverables/orchestrator/deck-inspection";
import { judgeRenderedDeck } from "@/lib/deliverables/orchestrator/deck-quality";
import { parseOperatingAdoption } from "@/lib/programs/operating-adoption";
import { tenancyOrNamedErrorResponse } from "@/lib/programs/tenancy-catch-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const previewHeaders = (score?: number, words?: DraftEditionWordsResult, requestId?: string, titleFigureCount?: number) => ({
  "X-AbarVa-Preview": "not-persisted",
  "Cache-Control": "private, no-store, max-age=0",
  ...(score === undefined ? {} : { "X-AbarVa-Deck-Fidelity-Score": String(score) }),
  ...(titleFigureCount === undefined ? {} : { "X-AbarVa-Deck-Title-Figure-Count": String(titleFigureCount) }),
  ...(requestId === undefined ? {} : { "X-AbarVa-Deck-Request-Id": requestId }),
  ...(words === undefined ? {} : { "X-AbarVa-Deck-Words-Status": words.status }),
  ...(words?.status !== "unavailable" ? {} : {
    "X-AbarVa-Deck-Words-Reason": words.reason,
    ...(words.rule ? { "X-AbarVa-Deck-Words-Rule": words.rule } : {}),
    ...(words.slide ? { "X-AbarVa-Deck-Words-Slide": String(words.slide) } : {}),
  }),
  ...(words === undefined ? {} : { "X-AbarVa-Deck-Fallback-Count": String(words.fallbackSlides.length) }),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; edition: string }> },
) {
  const { programId, edition: rawEdition } = await params;
  const requestId = randomUUID();
  const edition = rawEdition === "validation" || rawEdition === "investment" ? rawEdition as ReferenceEdition : null;
  const format = req.nextUrl.searchParams.get("format");
  if (!edition || (format !== "pptx" && format !== "pdf")) {
    return Response.json({ error: "invalid_preview_request", detail: "Choose validation or investment and format=pptx or pdf." }, { status: 400, headers: previewHeaders() });
  }
  let ctx: Awaited<ReturnType<typeof requireTenancy>>;
  try { ctx = await requireTenancy(); } catch (error) {
    return tenancyOrNamedErrorResponse(error, tenancyErrorResponse, {
      code: "preview_auth_failed", detail: "The preview could not verify workspace access.",
    });
  }
  if (isFeatureEnabled({ clientKey: ctx.clientKey, clientId: ctx.clientId }, "moves_reference_deck_v1") !== true || ctx.clientKey !== "meridian") {
    return Response.json({ error: "preview_not_enabled", detail: "Reference-deck preview is not enabled for this workspace." }, { status: 404, headers: previewHeaders() });
  }

  try {
    const inputs = await assembleEditionInputs(programId, edition);
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    const ownerReadback = inputs.capture[3].status === "ready"
      ? parseOperatingAdoption(inputs.capture[3].value.operating_adoption) : null;
    const phaseStage: PhasePromptStage = inputs.move.currentPhase == null ? "unclassified"
      : inputs.move.currentPhase <= 2 ? "need_validation"
        : inputs.move.currentPhase === 3 ? "design_review" : "delivery_review";
    const slots = buildReferenceSlotTable(inputs);
    const wordsResult = await draftEditionWords({
      tenantId: ctx.clientKey, userId: ctx.userId, edition, archetypes: sequence,
      slots,
      useCaseType: (inputs.move.archetype ?? "unclassified") as UseCasePromptType,
      phaseStage,
      available: {
        valueCase: inputs.valueCase.status === "ready" && inputs.valueCase.value.figuresRedacted !== true,
        register: inputs.register.status === "ready" && !inputs.register.value.figuresRedacted,
        rom: inputs.rom.status === "ready",
        publicSources: inputs.citations.status === "ready" && inputs.citations.value.length > 0,
        owners: Boolean(ownerReadback?.ownersAcceptedAt && ownerReadback.rows.some((row) => row.owner)),
      },
    });
    if (wordsResult.status === "unavailable") {
      console.warn("[reference-deck-words]", { requestId, edition, reason: wordsResult.reason, rule: wordsResult.rule, slide: wordsResult.slide });
    }
    const spec = buildReferenceEdition(inputs, wordsResult.words, slots);
    const figureHash = createHash("sha256").update(JSON.stringify(spec.figureLedger)).digest("hex");
    const blocked = validateReferenceDeck(spec).filter((finding) => finding.blocking);
    if (blocked.length) {
      return Response.json({ error: "figure_lineage_refusal", detail: "A deck figure or edition boundary failed validation.", findings: blocked }, { status: 422, headers: previewHeaders() });
    }
    const pptx = await renderReferenceDeck(spec);
    const inspected = await inspectDeck(pptx);
    const verdict = judgeRenderedDeck(inspected, { referenceDeck: spec, fallbackWordSlides: wordsResult.fallbackSlides });
    const score = verdict.fidelityScore ?? 0;
    const titleFigureCount = spec.slides.filter((slide) => slide.narrativeFigures?.some((figure) => slide.actionTitle.includes(figure.display))).length;
    if (format === "pptx") {
      return new Response(Uint8Array.from(pptx), {
        headers: {
          ...previewHeaders(score, wordsResult, requestId, titleFigureCount),
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
        ...previewHeaders(score, wordsResult, requestId, titleFigureCount), "Content-Type": "application/pdf",
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
