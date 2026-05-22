// POST /api/reasoning/feedback
// Body: { eventId: string; feedback: 'up' | 'down' }
// Attaches a thumbs-up/down signal to a previously recorded synthesis
// telemetry event.

// SECURITY (audit 2026-05-22, P0-1): requires an authenticated session.
import { recordFeedback } from "@/lib/reasoning/synthesis-telemetry";
import { guardReasoning } from "@/app/api/reasoning/_auth";

export async function POST(request: Request) {
  const guard = await guardReasoning();
  if (guard.response) return guard.response;

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

  const { eventId, feedback } = body as { eventId?: unknown; feedback?: unknown };

  if (typeof eventId !== "string" || eventId.length === 0) {
    return new Response(JSON.stringify({ error: "eventId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (feedback !== "up" && feedback !== "down") {
    return new Response(JSON.stringify({ error: "feedback must be 'up' or 'down'" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ok = recordFeedback(eventId, feedback);
  if (!ok) {
    return new Response(JSON.stringify({ error: "unknown eventId" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
