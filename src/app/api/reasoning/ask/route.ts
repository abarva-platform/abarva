// POST /api/reasoning/ask
//
// Stub Q&A endpoint for the reasoning admin Ask Anything toolbar.
// In production this would dispatch the question to an LLM with
// reasoning-layer context (synthesis events, gate state, health checks).
// For now it echoes the question back so the UI wiring can be verified.

// SECURITY (audit 2026-05-22, P0-1): requires an authenticated session.
import { guardReasoning } from '@/app/api/reasoning/_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const guard = await guardReasoning();
  if (guard.response) return guard.response;

  const body = await req.json() as { question?: string };
  const q = body?.question ?? '';

  // Stub response — in production this would call an LLM
  const response = q.length > 0
    ? `This is a demo stub. Your question was: "${q.slice(0, 80)}". Connect an LLM provider to enable real reasoning Q&A.`
    : 'Please enter a question.';

  return Response.json({ response });
}
