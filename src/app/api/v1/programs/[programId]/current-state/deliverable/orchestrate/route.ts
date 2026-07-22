// GET /api/v1/programs/:programId/current-state/deliverable/orchestrate?key=program_charter&format=json|docx|html&download=1
// The Deliverable Intelligence Orchestrator: artifact brief + expert latitude +
// multi-pass (architect → draft → red-team rewrite), governed evidence only for
// client facts, quality-gated, rendered to DOCX/HTML. Higher quality than the
// single-pass board route; slower (3 Claude passes).

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
} from "@/lib/programs/current-state-readiness";
import { buildCurrentStateRecommendation } from "@/lib/programs/current-state-maturity";
import { buildCurrentStatePlan } from "@/lib/programs/current-state-plan";
import { generateDeliverable } from "@/lib/programs/deliverable-refinement";
import { PHASE_NUMBER } from "@/lib/programs/archetypes/types";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import { resolveMoveArchetypeForProgram } from "@/lib/programs/move-archetype-resolution";

// Map archetype deliverable keys → a REGISTERED deliverable_types.type_key (FK).
// Unregistered types fall back to the generic "markdown" type.
const PERSIST_TYPE_KEY: Record<string, string> = {
  program_charter: "charter",
  discovery_report: "discovery_report",
  ai_enabled_sdlc_architecture: "markdown",
  target_operating_model: "markdown",
  business_case: "business_case",
  execution_roadmap: "execution_roadmap",
  mobilization_packet: "mobilization_roadmap",
  handoff_package: "tower_handoff_plan",
};
import {
  orchestrateDeliverable,
  getCachedOrchestration,
  setCachedOrchestration,
  type OrchestratorResult,
} from "@/lib/programs/deliverables/orchestrator";
import { tenantDisplayName } from "@/lib/programs/deliverables/board-deliverable";
import {
  resolveDiagnoseIntake,
  resolveDesignIntake,
} from "@/lib/programs/deliverables/diagnose-intake";
import {
  renderDeliverableDocx,
  renderDeliverableHtml,
} from "@/lib/programs/deliverables/render";
import { saveMoveArtifact } from "@/lib/programs/deliverables/move-artifacts";
import { buildMoveContextBundleTrace } from "@/lib/programs/deliverables/move-context-bundle-trace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const key = req.nextUrl.searchParams.get("key") ?? "program_charter";
    const format = (
      req.nextUrl.searchParams.get("format") ?? "json"
    ).toLowerCase();
    const download = req.nextUrl.searchParams.get("download") === "1";

    // Resolve the Move row first (best-effort) so the archetype comes from the
    // Move's own data, not a hardcoded default.
    let moveName = tenantDisplayName(ctx.clientKey ?? "") + " initiative";
    try {
      const move = await getStrategicMoveById(ctx, programId);
      if (move?.name) moveName = move.name;
    } catch {
      /* moveName is best-effort */
    }
    const archetype = await resolveMoveArchetypeForProgram(ctx, programId);

    const spec =
      archetype.deliverablePack.find((d) => d.key === key) ??
      archetype.deliverablePack.find((d) => d.key === "program_charter") ??
      archetype.deliverablePack[0];
    if (!spec)
      return Response.json({ error: "unknown_deliverable" }, { status: 404 });

    const profile = await inferMoveProfile(ctx);
    const readiness = await resolveCurrentStateReadiness(
      ctx,
      archetype,
      profile,
      1,
      programId,
    );
    const recommendation = await buildCurrentStateRecommendation(ctx, profile);
    const plan = buildCurrentStatePlan(recommendation, { moveName });
    const base = generateDeliverable(spec, {
      tenant: ctx.clientKey ?? ctx.clientId,
      moveId: programId,
      readiness,
      recommendation,
      plan,
    });

    // Deliverable dependency chain: each later-phase deliverable is grounded in
    // the governed, attested intake captured upstream (never invented). Diagnose
    // intake (priorities, value levers, constraints, target state) feeds Design
    // and everything after; Design intake (architecture, build-vs-buy, guardrails,
    // workflow) feeds the Roadmap/Business-Case/Handoff that consume the approach.
    const DIAGNOSE_GROUNDED = new Set([
      "discovery_report",
      "ai_enabled_sdlc_architecture",
      "target_operating_model",
      "business_case",
      "execution_roadmap",
      "mobilization_packet",
      "handoff_package",
    ]);
    const DESIGN_GROUNDED = new Set([
      "ai_enabled_sdlc_architecture",
      "target_operating_model",
      "business_case",
      "execution_roadmap",
      "mobilization_packet",
      "handoff_package",
    ]);
    const injectIntake = (
      heading: string,
      intake: Record<string, string>,
      citation: string,
    ) => {
      const entries = Object.entries(intake).filter(([, a]) => a && a.trim());
      if (entries.length) {
        base.sections.push({
          heading,
          claims: entries.map(([qid, ans]) => ({
            text: `${qid.replace(/_/g, " ")}: ${ans}`,
            citation,
            missingEvidence: null,
          })),
        });
      }
    };
    if (DIAGNOSE_GROUNDED.has(spec.key)) {
      injectIntake(
        "Diagnose intake (attested)",
        await resolveDiagnoseIntake(ctx, programId),
        "diagnose_intake:attested",
      );
    }
    if (DESIGN_GROUNDED.has(spec.key)) {
      injectIntake(
        "Design intake (attested)",
        await resolveDesignIntake(ctx, programId),
        "design_intake:attested",
      );
    }

    // Render-from-cache: the json pass generates + caches the 3-pass result;
    // docx/html reuse it (fast render) instead of re-running passes past the
    // gateway timeout. `fresh=1` forces regeneration.
    const cacheKey = `${ctx.clientId}:${programId}:${spec.key}`;
    const fresh = req.nextUrl.searchParams.get("fresh") === "1";
    let orchestrated: OrchestratorResult | null = fresh
      ? null
      : getCachedOrchestration(cacheKey);
    if (!orchestrated) {
      orchestrated = await orchestrateDeliverable({
        base,
        archetypeId: archetype.id,
        deliverableType: spec.key,
        clientKey: ctx.clientKey ?? ctx.clientId,
        tenantId: ctx.clientId,
        moveId: programId,
        moveName,
        date: new Date().toISOString().slice(0, 10),
        userId: ctx.userId,
      });
      setCachedOrchestration(cacheKey, orchestrated);
      // Persist-on-generate: save the artifact to the move's deliverable store so
      // it appears in the Deliverables drawer with view/download. Best-effort —
      // never fail generation if persistence hiccups.
      try {
        const moduleKey = `p${PHASE_NUMBER[spec.phase] ?? 2}`;
        await draftModuleDeliverable(ctx, {
          programId,
          moduleKey,
          deliverableTypeKey: PERSIST_TYPE_KEY[spec.key] ?? "markdown",
          title: `${orchestrated.result.label} — ${orchestrated.result.moveName}`,
          draftContent: orchestrated.result.bodyMarkdown,
          structuredData: {
            sourceRegister: orchestrated.result.sourceRegister,
            openItems: orchestrated.result.openItems,
            quality: orchestrated.quality,
            generatedBy: orchestrated.model,
            passes: orchestrated.passes,
            grounded: true,
          },
        });
      } catch {
        /* best-effort persist */
      }
      // Durable Artifact Vault: render the board-grade DOCX, store to Azure Blob,
      // register in move_artifacts (versioned). This is the File Cabinet entry.
      try {
        const docxBuf = await renderDeliverableDocx(orchestrated.result);
        const safe =
          `${orchestrated.result.clientName}_${orchestrated.result.label}`.replace(
            /[^A-Za-z0-9]+/g,
            "_",
          );
        // PR-8: emit the MoveContextBundleTrace — the audit provenance for this
        // generation, attached to the artifact's vault metadata.
        const trace = buildMoveContextBundleTrace({
          tenantId: ctx.clientId,
          tenantKey: ctx.clientKey ?? ctx.clientId,
          moveId: programId,
          deliverableType: spec.key,
          moveName: orchestrated.result.moveName,
          model: orchestrated.model,
          passes: orchestrated.passes,
          sourceRegister: orchestrated.result.sourceRegister as Array<
            { marker?: string; label?: string } | string
          >,
          bodyMarkdown: orchestrated.result.bodyMarkdown,
          unsupportedClaims: orchestrated.result.unsupportedClaims,
          openItems: orchestrated.result.openItems,
          qualityScore: orchestrated.quality.qualityScore,
          qualityPass: orchestrated.quality.pass,
        });
        await saveMoveArtifact(ctx, {
          moveId: programId,
          phase: PHASE_NUMBER[spec.phase] ?? 2,
          archetype: archetype.id,
          artifactType: spec.key,
          artifactFamily: "generated_deliverable",
          title: `${orchestrated.result.label} — ${orchestrated.result.moveName}`,
          fileName: `${safe}.docx`,
          fileFormat: "docx",
          body: docxBuf,
          status: orchestrated.quality.pass ? "review_required" : "preliminary",
          qualityScore: orchestrated.quality.qualityScore,
          unsupportedClaimsCount: orchestrated.result.unsupportedClaims.length,
          citationReady: true,
          sourceBasis: "governed_evidence",
          confidence: "medium",
          generatedBy: orchestrated.model,
          metadata: {
            sourceRegister: orchestrated.result.sourceRegister,
            openItems: orchestrated.result.openItems,
            passes: orchestrated.passes,
            markdown: orchestrated.result.bodyMarkdown.slice(0, 40000),
            contextBundleTrace: trace,
          },
        });
      } catch {
        /* best-effort vault save */
      }
    }
    const {
      result,
      quality,
      plan: outline,
      critique,
      passes,
      model,
    } = orchestrated;

    const safeName = `${result.clientName}_${result.label}`.replace(
      /[^A-Za-z0-9]+/g,
      "_",
    );

    if (format === "docx") {
      if (!quality.pass) {
        return Response.json(
          { error: "quality_gate_failed", quality },
          { status: 422 },
        );
      }
      const buf = await renderDeliverableDocx(result);
      return new Response(new Uint8Array(buf), {
        status: 200,
        headers: {
          "content-type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "content-disposition": `${download ? "attachment" : "inline"}; filename="${safeName}.docx"`,
          "x-quality-pass": String(quality.pass),
          "x-quality-score": String(quality.qualityScore),
          "x-passes": String(passes),
        },
      });
    }
    if (format === "html") {
      return new Response(renderDeliverableHtml(result), {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          ...(download
            ? {
                "content-disposition": `attachment; filename="${safeName}.html"`,
              }
            : {}),
          "x-quality-pass": String(quality.pass),
        },
      });
    }

    return Response.json({
      ok: true,
      model,
      passes,
      clientName: result.clientName,
      moveName: result.moveName,
      quality,
      plan: outline,
      critique,
      markdown: result.bodyMarkdown,
      html: renderDeliverableHtml(result),
      sourceRegister: result.sourceRegister,
      openItems: result.openItems,
      unsupportedClaims: result.unsupportedClaims,
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
