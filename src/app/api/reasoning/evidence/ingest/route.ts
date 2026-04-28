// POST /api/reasoning/evidence/ingest
//
// Body: { instanceId: string; item: object }
//
// Adds an evidence item to the in-memory ingestion store keyed by
// instanceId. Subsequent gate evaluations performed via
// `buildEvidenceMapWithIngestions` will see the new item and may flip
// criteria from pending → met. This is a demo-friendly path; nothing
// here is persisted across process restarts.
//
// Loose typing on `item` is intentional — both SourceEventInstance and
// ProgramInstance fixture shapes can flow through. We validate that
// `instanceId` is a non-empty string and `item` is an object.

import { addEvidence, getEvidenceFor } from "@/lib/reasoning/evidence-ingestion-store";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body || typeof body !== "object") {
    return new Response(JSON.stringify({ error: "body must be an object" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { instanceId, item } = body as { instanceId?: unknown; item?: unknown };

  if (typeof instanceId !== "string" || instanceId.length === 0) {
    return new Response(
      JSON.stringify({ error: "instanceId is required and must be a non-empty string" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return new Response(
      JSON.stringify({ error: "item is required and must be an object" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  addEvidence(instanceId, item as Record<string, unknown>);
  const totalAddedForInstance = getEvidenceFor(instanceId).length;

  return new Response(
    JSON.stringify({ ok: true, totalAddedForInstance }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
