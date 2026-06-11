// POST /api/v1/programs/:programId/charter-capture
// Step 2 of the charter workflow: SAVE THE RECORD. Persists the five captured
// charter inputs deterministically (no flaky chat→tool round-trip) so the
// capture tracker reflects what is actually SAVED, and creates/updates a
// signable `charter` deliverable so the record can then be approved and, once
// approved, rendered into the board-grade artifact. Order is enforced by the
// UI: capture 5 → save (here) → approve → generate artifact.

import { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "../../_auth";
import { getProgramById } from "@/lib/programs/queries";
import { getProgramsRouteSupabase } from "@/lib/programs/programs-auth-mode-server";
import { draftModuleDeliverable } from "@/lib/programs/nexus";
import { publishDeliverable } from "@/lib/programs/mutations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Canonical charter JSONB keys. These are exactly the snake-case section ids the
// workspace tracker probes (sectionCharterKeys), so a saved value round-trips to
// a ✓ on reload. Order matches the five P1 capture slots.
const FIELD_KEYS = [
  "sponsor",
  "stakeholders",
  "success_metrics",
  "value_range",
  "scope",
] as const;
type FieldKey = (typeof FIELD_KEYS)[number];

const FIELD_LABEL: Record<FieldKey, string> = {
  sponsor: "Sponsor commitment & decision rights",
  stakeholders: "Stakeholders & decision-rights map",
  success_metrics: "Success metrics",
  value_range: "Value range (preliminary)",
  scope: "Charter scope",
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
      items?: Partial<Record<FieldKey, string>>;
    };
    const items = body.items ?? {};

    // Merge the provided non-empty values into engagements.charter (the tracker's
    // source of truth). Existing charter values are preserved.
    const currentCharter = (program.charter ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...currentCharter };
    const saved: FieldKey[] = [];
    for (const k of FIELD_KEYS) {
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

    // Build the signable charter record from the saved fields. Status stays
    // in_review until the sponsor approves (step 3). This is the record that is
    // approved — the polished artifact (step 4) is rendered from it afterward.
    const draftContent = [
      `# Program Charter (record) — ${program.name ?? programId}`,
      ...FIELD_KEYS.flatMap((k) => {
        const v = merged[k];
        return typeof v === "string" && v.trim()
          ? [``, `## ${FIELD_LABEL[k]}`, v.trim()]
          : [];
      }),
    ].join("\n");

    let deliverableId: string | null = null;
    try {
      const res = await draftModuleDeliverable(ctx, {
        programId,
        moduleKey: "p1",
        deliverableTypeKey: "charter",
        title: "Program Charter",
        draftContent,
        structuredData: { capturedCharter: merged, savedFields: saved },
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

    const allFiveSaved = FIELD_KEYS.every(
      (k) => typeof merged[k] === "string" && (merged[k] as string).trim(),
    );

    return Response.json({
      ok: true,
      savedFields: saved,
      allFiveSaved,
      recordCreated: true,
      deliverableId,
    });
  } catch (err) {
    return tenancyErrorResponse(err);
  }
}
