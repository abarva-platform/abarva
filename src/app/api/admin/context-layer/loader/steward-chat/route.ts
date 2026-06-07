import { NextRequest, NextResponse } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import {
  auditedStewardChatModel,
  makeStewardChat,
  type StewardChatTurn,
} from "@/lib/context-ingestion/loader/steward-chat";
import type {
  MappingProposal,
  StewardFinding,
} from "@/lib/context-ingestion/loader/contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface StewardChatBody {
  proposal?: MappingProposal;
  findings?: StewardFinding[];
  history?: StewardChatTurn[];
  question?: string;
  clientId?: string;
}

function asHistory(value: unknown): StewardChatTurn[] {
  if (!Array.isArray(value)) return [];
  const turns: StewardChatTurn[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const author =
      item.author === "steward"
        ? "steward"
        : item.author === "operator"
          ? "operator"
          : null;
    if (!author) continue;
    if (typeof item.body !== "string" || item.body.trim() === "") continue;
    turns.push({ author, body: item.body });
  }
  return turns;
}

/**
 * Admin Loader — "Ask Steward" scoped chat. The operator asks a plain-language
 * question about how ONE preserved file was mapped/interpreted. Claude answers
 * via the audited egress path with the file's proposal + findings as context.
 * Read-only reasoning: NOTHING is committed here.
 */
export async function POST(request: NextRequest) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error) as NextResponse;
  }
  if (!tenancy.clientKey) {
    return NextResponse.json({ error: "tenant_key_required" }, { status: 403 });
  }

  let body: StewardChatBody;
  try {
    body = (await request.json()) as StewardChatBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "loader_steward_chat_invalid_json" },
      { status: 400 },
    );
  }

  const clientId =
    typeof body.clientId === "string" ? body.clientId.trim() : "";
  if (clientId && clientId !== tenancy.clientId) {
    return NextResponse.json(
      { error: "forbidden_cross_tenant" },
      { status: 403 },
    );
  }

  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  if (!question) {
    return NextResponse.json(
      { ok: false, error: "loader_steward_chat_question_required" },
      { status: 400 },
    );
  }

  const proposal = body.proposal;
  if (!proposal || typeof proposal !== "object") {
    return NextResponse.json(
      { ok: false, error: "loader_steward_chat_proposal_required" },
      { status: 400 },
    );
  }

  const findings = Array.isArray(body.findings) ? body.findings : [];
  const history = asHistory(body.history);

  // canonicalTenantKey is referenced to keep the tenant-scope import consistent
  // with the sibling loader routes; the proposal already carries the tenantKey.
  void canonicalTenantKey(tenancy.clientKey);

  try {
    const chat = makeStewardChat(
      auditedStewardChatModel({
        tenantId: tenancy.clientId,
        ...(tenancy.userId !== undefined ? { userId: tenancy.userId } : {}),
      }),
    );
    const reply = await chat({ proposal, findings, history, question });
    return NextResponse.json({ ok: true, reply }, { status: 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, error: "loader_steward_chat_failed", detail },
      { status: 500 },
    );
  }
}
