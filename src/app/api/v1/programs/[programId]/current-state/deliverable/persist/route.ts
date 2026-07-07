// POST /api/v1/programs/:programId/current-state/deliverable/persist  { key? }
// Generates the grounded deliverable and PERSISTS it to Azure (deliverables_v2 +
// deliverable_versions) via the governed draftModuleDeliverable seam — so the
// board-grade, citation-tagged draft becomes a saved artifact. The persisted
// content carries each claim's citation or [MISSING EVIDENCE] flag verbatim;
// nothing is fabricated. Returns the deliverableId. Tenant-scoped.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../../../_auth";
import {
  inferMoveProfile,
  resolveCurrentStateReadiness,
} from "@/lib/programs/current-state-readiness";
import { buildCurrentStateRecommendation } from "@/lib/programs/current-state-maturity";
import { buildCurrentStatePlan } from "@/lib/programs/current-state-plan";
import {
  generateDeliverable,
  type GeneratedDeliverable,
} from "@/lib/programs/deliverable-refinement";
import { resolveProgramArchetype } from "@/lib/programs/archetypes/registry";
import { getStrategicMoveById } from "@/lib/programs/queries";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import {
  resolveSourceLabel,
  scrubInternalSourceTags,
} from "@/lib/programs/deliverables/source-labels";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// deliverables_v2.deliverable_type_key has an FK to deliverable_types — map the
// archetype's deliverable key to the registered DB type key.
const DB_TYPE_KEY: Record<string, string> = {
  program_charter: "charter",
  discovery_report: "discovery_report",
  business_case: "business_case",
  execution_roadmap: "execution_roadmap",
  handoff_package: "handoff_package",
};

function renderMarkdown(doc: GeneratedDeliverable): string {
  const e = doc.envelope;
  const lines: string[] = [
    `# ${doc.label}`,
    `Tenant: ${e.tenantResolved} · Archetype: ${e.archetypeResolved} · Confidence: ${e.confidence} · ${e.citations.length} cited · ${e.missingEvidence.length} missing · ${e.unsupportedClaims.length} unsupported`,
    "",
    "_Grounded draft — every claim is cited to its evidence or flagged [MISSING EVIDENCE]. Refinement cannot add a fact not in the evidence._",
    "",
  ];
  for (const s of doc.sections) {
    lines.push(`## ${s.heading}`);
    for (const c of s.claims) {
      lines.push(
        c.missingEvidence
          ? `- **[MISSING EVIDENCE: ${resolveSourceLabel(c.missingEvidence).title}]** ${c.text}`
          : `- ${c.text} _(source: ${resolveSourceLabel(c.citation ?? "").title})_`,
      );
    }
    lines.push("");
  }
  return scrubInternalSourceTags(lines.join("\n"));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const body = (await req.json().catch(() => ({}))) as { key?: string };
    const key = body.key ?? "program_charter";

    // Archetype resolved from the Move's own row (best-effort) — never a
    // hardcoded default for a Move we can read.
    let moveName = programId;
    let archetype = resolveProgramArchetype({});
    try {
      const move = await getStrategicMoveById(ctx, programId);
      if (move?.name) moveName = move.name;
      if (move) {
        archetype = resolveProgramArchetype({
          archetype: move.archetype,
          classification: (move.charter as { classification?: string } | null)
            ?.classification,
          name: move.name,
        });
      }
    } catch {
      /* best-effort */
    }
    const spec = archetype.deliverablePack.find((d) => d.key === key);
    if (!spec) {
      return Response.json({ error: "unknown_deliverable" }, { status: 404 });
    }

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
    const doc = generateDeliverable(spec, {
      tenant: ctx.clientKey ?? ctx.clientId,
      moveId: programId,
      readiness,
      recommendation,
      plan,
    });

    const { deliverableId, versionId } = await draftModuleDeliverable(ctx, {
      programId,
      moduleKey: "p1",
      deliverableTypeKey: DB_TYPE_KEY[key] ?? key,
      title: doc.label,
      draftContent: renderMarkdown(doc),
      structuredData: {
        envelope: doc.envelope,
        version: doc.version,
        sections: doc.sections,
        grounded: true,
      },
    });

    return Response.json({
      ok: true,
      deliverableId,
      versionId,
      persisted: "deliverables_v2",
      envelope: doc.envelope,
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
