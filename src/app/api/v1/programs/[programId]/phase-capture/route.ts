// POST /api/v1/programs/:programId/phase-capture
// Phase-generic SAVE THE RECORD step (generalized from the proven P1
// charter-capture route). Persists the captured phase inputs deterministically
// (no flaky chat→tool round-trip) so the capture tracker reflects what is
// actually SAVED, and creates/updates the signable gate deliverable for THAT
// phase so the record can then be approved and, once approved, rendered into the
// board-grade artifact. Order is enforced by the UI: capture all → save (here)
// → approve → generate artifact.
//
// Mirrors charter-capture exactly: merge non-empty items into engagements.charter
// (the tracker's source of truth, read for all phases via sectionCapturedContent),
// then draftModuleDeliverable for the phase's primary gate deliverable and
// publishDeliverable to in_review.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { getProgramById } from "@/lib/programs/queries";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import { publishDeliverable } from "@/lib/programs/mutations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Per-phase config. The `sectionKeys` are exactly the snake_case section ids the
// workspace tracker probes (sectionCharterKeys, hyphens→underscores), so a saved
// value round-trips to a ✓ on reload. `deliverableTypeKey` MUST be the type the
// phase gate checks signed_off against (verified against governance.ts):
//   P1 charter_signed_off          → findDeliverable('charter')
//   P2 discovery_report_signed_off → findDeliverable('discovery_report', …)
//   P3 design_approved             → findDeliverable('solution_design', …)
//   P4 business_case_approved      → findDeliverable('business_case', …)
//   P5 tower_handoff_plan_accepted → findDeliverable('tower_handoff_plan', …)
interface PhaseCaptureConfig {
  moduleKey: string;
  deliverableTypeKey: string;
  title: string;
  recordHeading: string;
  // Ordered snake_case section keys for this phase + reviewer-facing label.
  fields: Array<{ key: string; label: string }>;
}

const PHASE_CAPTURE: Record<number, PhaseCaptureConfig> = {
  1: {
    moduleKey: "p1",
    deliverableTypeKey: "charter",
    title: "Program Charter",
    recordHeading: "Program Charter (record)",
    fields: [
      { key: "sponsor", label: "Sponsor commitment & decision rights" },
      { key: "stakeholders", label: "Stakeholders & decision-rights map" },
      { key: "success_metrics", label: "Success metrics" },
      { key: "value_range", label: "Value range (preliminary)" },
      { key: "scope", label: "Charter scope" },
    ],
  },
  2: {
    moduleKey: "p2",
    deliverableTypeKey: "discovery_report",
    title: "Discovery & Diagnostic Report",
    recordHeading: "Discovery & Diagnostic Report (record)",
    fields: [
      { key: "baseline", label: "Current-state baseline" },
      { key: "rootcause", label: "Root cause analysis" },
      { key: "datareadiness", label: "Data & readiness assessment" },
      { key: "decision", label: "P2 continue / discontinue decision" },
    ],
  },
  3: {
    moduleKey: "p3",
    deliverableTypeKey: "solution_design",
    title: "Future-State Design",
    recordHeading: "Future-State Design (record)",
    fields: [
      { key: "design", label: "Target state design" },
      { key: "operatingmodel", label: "Operating model shift" },
      { key: "rootcause_trace", label: "Root cause → design trace" },
      { key: "risks", label: "Risks & tradeoffs" },
    ],
  },
  4: {
    moduleKey: "p4",
    deliverableTypeKey: "business_case",
    title: "Roadmap & Business Case",
    recordHeading: "Roadmap & Business Case (record)",
    fields: [
      { key: "roadmap", label: "Execution roadmap" },
      { key: "businesscase", label: "Business case" },
      { key: "valueplan", label: "Value plan" },
      { key: "towermetric", label: "Tower monitoring plan" },
    ],
  },
  5: {
    moduleKey: "p5",
    deliverableTypeKey: "tower_handoff_plan",
    title: "Tower Handoff Plan",
    recordHeading: "Tower Handoff Plan (record)",
    fields: [
      { key: "raci", label: "Delivery RACI" },
      { key: "handoffpack", label: "Tower handoff package" },
      { key: "tower_acceptance", label: "Tower acceptance" },
    ],
  },
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  try {
    const { programId } = await params;
    const ctx = await requireTenancy();
    const { supabase } = await getProgramsRouteSupabase("mutation");

    const program = await getProgramById(ctx, programId, { supabase });
    if (!program) return Response.json({ error: "not_found" }, { status: 404 });

    const body = (await req.json().catch(() => ({}))) as {
      phase?: number;
      items?: Record<string, string>;
    };
    const phase = Number(body.phase);
    const config = PHASE_CAPTURE[phase];
    if (!config) {
      return Response.json(
        {
          error: "unsupported_phase",
          detail: `No capture config for phase ${body.phase}`,
        },
        { status: 400 },
      );
    }
    const items = body.items ?? {};
    const fieldKeys = config.fields.map((f) => f.key);

    // Merge the provided non-empty values into engagements.charter (the tracker's
    // source of truth for all phases). Existing charter values are preserved.
    const currentCharter = (program.charter ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...currentCharter };
    const saved: string[] = [];
    for (const k of fieldKeys) {
      const v = items[k];
      if (typeof v === "string" && v.trim()) {
        merged[k] = v.trim();
        saved.push(k);
      }
    }

    const { error: chErr } = await supabase
      .from("engagements")
      .update({ charter: merged })
      .eq("id", programId);
    if (chErr) {
      return Response.json(
        { error: "charter_write_failed", detail: chErr.message },
        { status: 500 },
      );
    }

    // Build the signable record from the saved fields. Status stays in_review
    // until the sponsor approves (step 3). This is the record that is approved —
    // the polished artifact (step 4) is rendered from it afterward.
    const draftContent = [
      `# ${config.recordHeading} — ${program.name ?? programId}`,
      ...config.fields.flatMap((f) => {
        const v = merged[f.key];
        return typeof v === "string" && v.trim()
          ? [``, `## ${f.label}`, v.trim()]
          : [];
      }),
    ].join("\n");

    let deliverableId: string | null = null;
    try {
      const res = await draftModuleDeliverable(ctx, {
        programId,
        moduleKey: config.moduleKey,
        deliverableTypeKey: config.deliverableTypeKey,
        title: config.title,
        draftContent,
        structuredData: {
          capturedPhase: phase,
          captured: merged,
          savedFields: saved,
        },
      });
      deliverableId = res.deliverableId;
      // Move draft → in_review so the sponsor can sign it off (signOffDeliverable
      // only matches status='in_review'). Without this the record exists but
      // Approve returns not_found.
      await publishDeliverable(ctx, programId, deliverableId);
    } catch (e) {
      // Charter JSONB is already saved (tracker truthful); surface the record
      // failure honestly rather than pretending the deliverable exists.
      return Response.json(
        {
          ok: true,
          savedFields: saved,
          recordCreated: false,
          recordError: e instanceof Error ? e.message : "draft failed",
        },
        { status: 200 },
      );
    }

    const allSaved = fieldKeys.every(
      (k) => typeof merged[k] === "string" && (merged[k] as string).trim(),
    );

    return Response.json({
      ok: true,
      savedFields: saved,
      allSaved,
      recordCreated: true,
      deliverableId,
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
