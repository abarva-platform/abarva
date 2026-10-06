import {
  requireTenancy,
  tenancyErrorResponse,
  TenancyError,
} from "@/lib/auth/tenancy";
import { suggestDiscoveryArchetypes } from "@/lib/deliverables/orchestrator/briefs/discovery-blueprint";

export const dynamic = "force-dynamic";

const MAX_TEXT_LENGTH = 5000;

export async function POST(request: Request) {
  try {
    await requireTenancy();
  } catch (error) {
    if (error instanceof TenancyError) return tenancyErrorResponse(error);
    throw error;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    typeof (body as { text?: unknown }).text !== "string"
  ) {
    return Response.json({ error: "text_required" }, { status: 400 });
  }

  const text = (body as { text: string }).text.trim();
  if (text.length > MAX_TEXT_LENGTH) {
    return Response.json({ error: "text_too_long" }, { status: 413 });
  }

  return Response.json({
    suggestions: suggestDiscoveryArchetypes(text, 3),
  });
}
