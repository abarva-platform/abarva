import "server-only";

import { createHash, randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { assembleEditionInputs, ReferenceMoveUnavailable } from "@/lib/deliverables/orchestrator/reference-deck-inputs";
import { VALIDATION_SEQUENCE, INVESTMENT_SEQUENCE, buildReferenceEdition } from "@/lib/deliverables/orchestrator/reference-deck-edition";
import { draftEditionWords, unavailableEditionWords, type DraftEditionWordsResult, type PhasePromptStage, type UseCasePromptType } from "@/lib/deliverables/orchestrator/reference-deck-words";
import { buildReferenceSlotTable } from "@/lib/deliverables/orchestrator/reference-deck-slots";
import { validateReferenceDeck, ReferenceDeckLineageRefusal, type ReferenceEdition } from "@/lib/deliverables/orchestrator/reference-deck-model";
import { renderReferenceDeck } from "@/lib/deliverables/orchestrator/reference-deck-renderer";
import { inspectDeck } from "@/lib/deliverables/orchestrator/deck-inspection";
import { judgeRenderedDeck, type DeckFinding } from "@/lib/deliverables/orchestrator/deck-quality";
import { inspectReferenceDeckPdf } from "@/lib/deliverables/orchestrator/reference-deck-pdf-inspection";
import { parseOperatingAdoption } from "@/lib/programs/operating-adoption";
import { tenancyOrNamedErrorResponse } from "@/lib/programs/tenancy-catch-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_FINDING_CODES = 40;

/** Every judge finding behind the score, by code only: "4:reference_gap,-:slide_count". */
function findingCodes(findings: readonly DeckFinding[]): string {
  if (!findings.length) return "none";
  const codes = findings.map((finding) => `${"slide" in finding ? finding.slide : "-"}:${finding.kind}${
    "detailCode" in finding && finding.detailCode ? `/${finding.detailCode}` : ""}`);
  return codes.length > MAX_FINDING_CODES
    ? [...codes.slice(0, MAX_FINDING_CODES), `+${codes.length - MAX_FINDING_CODES}`].join(",") : codes.join(",");
}

const previewHeaders = (score?: number, words?: DraftEditionWordsResult, requestId?: string, titleFigureCount?: number, findings?: readonly DeckFinding[]) => ({
  "X-AbarVa-Preview": "not-persisted",
  "Cache-Control": "private, no-store, max-age=0",
  ...(score === undefined ? {} : { "X-AbarVa-Deck-Fidelity-Score": String(score) }),
  // The score is 100 less 5 per finding; this names each one, so a low score can be read.
  ...(findings === undefined ? {} : { "X-AbarVa-Deck-Fidelity-Findings": findingCodes(findings) }),
  ...(titleFigureCount === undefined ? {} : { "X-AbarVa-Deck-Title-Figure-Count": String(titleFigureCount) }),
  ...(requestId === undefined ? {} : { "X-AbarVa-Deck-Request-Id": requestId }),
  ...(words === undefined ? {} : { "X-AbarVa-Deck-Words-Status": words.status }),
  ...(words?.status !== "unavailable" ? {} : {
    "X-AbarVa-Deck-Words-Reason": words.reason,
    ...(words.rule ? { "X-AbarVa-Deck-Words-Rule": words.rule } : {}),
    ...(words.slide ? { "X-AbarVa-Deck-Words-Slide": String(words.slide) } : {}),
    // Every fallback slide and why, by name only: "2:title_format,9:parse_failed".
    ...(words.fallbackCauses.length ? { "X-AbarVa-Deck-Fallback-Causes": words.fallbackCauses.map(({ slide, cause }) => `${slide}:${cause}`).join(",") } : {}),
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

  let wordsResult: DraftEditionWordsResult | undefined;
  try {
    const inputs = await assembleEditionInputs(programId, edition);
    const sequence = edition === "validation" ? VALIDATION_SEQUENCE : INVESTMENT_SEQUENCE;
    const ownerReadback = inputs.capture[3].status === "ready"
      ? parseOperatingAdoption(inputs.capture[3].value.operating_adoption) : null;
    const phaseStage: PhasePromptStage = inputs.move.currentPhase == null ? "unclassified"
      : inputs.move.currentPhase <= 2 ? "need_validation"
        : inputs.move.currentPhase === 3 ? "design_review" : "delivery_review";
    const slots = buildReferenceSlotTable(inputs);
    // Exhibits depend on inputs alone, so placeholder words show which slides will
    // be only a confirmation panel; their words must speak to that panel, not to
    // rows that will not render. If the probe fails, drafting proceeds unmarked.
    const confirmationPanels: Record<number, string> = {};
    try {
      buildReferenceEdition(inputs, unavailableEditionWords(edition, sequence), slots).slides.forEach((slide, index) => {
        const [first] = slide.blocks;
        if (first?.kind === "gap" && slide.blocks.every((block) => block.kind === "gap")) confirmationPanels[index + 1] = first.title;
      });
    } catch { /* drafting proceeds without panel marks; the edition still validates every slide */ }
    wordsResult = await draftEditionWords({
      tenantId: ctx.clientKey, userId: ctx.userId, requestId, edition, archetypes: sequence,
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
      confirmationPanels,
    });
    if (wordsResult.status === "unavailable") {
      console.warn("[reference-deck-words]", { requestId, edition, reason: wordsResult.reason, rule: wordsResult.rule, slide: wordsResult.slide });
    }
    const spec = buildReferenceEdition(inputs, wordsResult.words, slots);
    const figureHash = createHash("sha256").update(JSON.stringify(spec.figureLedger)).digest("hex");
    const blocked = validateReferenceDeck(spec).filter((finding) => finding.blocking);
    if (blocked.length) {
      return Response.json({ error: "figure_lineage_refusal", detail: "A deck figure or edition boundary failed validation.", findings: new ReferenceDeckLineageRefusal(blocked).findings }, { status: 422, headers: previewHeaders(undefined, wordsResult, requestId) });
    }
    const pptx = await renderReferenceDeck(spec);
    const inspected = await inspectDeck(pptx);
    const verdict = judgeRenderedDeck(inspected, { referenceDeck: spec, fallbackWordSlides: wordsResult.fallbackSlides });
    const score = verdict.fidelityScore ?? 0;
    const titleFigureCount = spec.slides.filter((slide) => slide.narrativeFigures?.some((figure) => slide.actionTitle.includes(figure.display))).length;
    const hardRenderFindings = verdict.findings.filter((finding) => [
      "canvas", "slide_count", "off_canvas", "empty_canvas",
      "reference_source", "reference_edition", "reference_editability", "reference_client_copy",
      "reference_layout",
    ].includes(finding.kind));
    if (hardRenderFindings.length) {
      return Response.json({
        error: "deck_render_refusal",
        detail: "The rendered deck failed a physical, source, edition or editability check.",
        findings: hardRenderFindings.map((finding) => ({
          kind: finding.kind,
          ...("slide" in finding ? { slide: finding.slide } : {}),
          ...("detailCode" in finding && finding.detailCode ? { detailCode: finding.detailCode } : {}),
        })),
      }, { status: 422, headers: previewHeaders(score, wordsResult, requestId, titleFigureCount, verdict.findings) });
    }
    if (format === "pptx") {
      return new Response(Uint8Array.from(pptx), {
        headers: {
          ...previewHeaders(score, wordsResult, requestId, titleFigureCount, verdict.findings),
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
    const pdfBytes = Buffer.concat(chunks);
    const pdfFindings = await inspectReferenceDeckPdf(pdfBytes, spec);
    if (pdfFindings.length) {
      return Response.json({
        error: "deck_render_refusal", detail: "The rendered PDF failed a page, source or client-text check.",
        findings: pdfFindings.map((finding) => ({
          kind: finding.kind,
          ...("slide" in finding ? { slide: finding.slide } : {}),
          ...("detailCode" in finding && finding.detailCode ? { detailCode: finding.detailCode } : {}),
        })),
      }, { status: 422, headers: previewHeaders(0, wordsResult, requestId, titleFigureCount) });
    }
    return new Response(Uint8Array.from(pdfBytes), {
      headers: {
        ...previewHeaders(score, wordsResult, requestId, titleFigureCount, verdict.findings), "Content-Type": "application/pdf",
        "X-AbarVa-Deck-Figure-Hash": figureHash,
        "Content-Disposition": `attachment; filename="move-${edition}-preview.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof ReferenceMoveUnavailable) {
      return Response.json({ error: "move_unavailable", detail: error.message }, { status: 404, headers: previewHeaders() });
    }
    if (error instanceof ReferenceDeckLineageRefusal || (error instanceof Error && error.message.startsWith("reference_deck_lineage_refusal"))) {
      return Response.json({ error: "figure_lineage_refusal", detail: "A deck figure or edition boundary failed validation.",
        findings: error instanceof ReferenceDeckLineageRefusal ? error.findings : [],
      }, { status: 422, headers: previewHeaders(undefined, wordsResult, requestId) });
    }
    console.error("[reference-deck-preview] render failed", error);
    return Response.json({ error: "preview_render_failed", detail: "The read-only preview could not be rendered." }, { status: 500, headers: previewHeaders() });
  }
}
