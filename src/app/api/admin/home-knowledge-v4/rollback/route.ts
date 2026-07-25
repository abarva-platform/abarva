import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import { rollbackHomeKnowledgeV4Pack, HomeKnowledgeV4ApprovalError } from "@/lib/home/home-knowledge-v4-review";

export const dynamic = "force-dynamic";

// Reactivate a specific earlier pack (retired or rejected) for a tenant,
// displacing whatever is currently active. Platform-admin only.
export async function POST(request: Request) {
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const tenantKey = typeof body?.tenantKey === "string" ? body.tenantKey.trim() : "";
  const targetPackId = typeof body?.targetPackId === "string" ? body.targetPackId.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!tenantKey || !targetPackId) {
    return NextResponse.json({ error: "tenantKey and targetPackId are required." }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ error: "A rollback reason is required." }, { status: 400 });
  }

  const user = await currentUser().catch(() => null);
  const rolledBackBy = user?.primaryEmailAddress?.emailAddress ?? user?.id ?? "unknown-reviewer";

  try {
    const result = await rollbackHomeKnowledgeV4Pack({ tenantKey, targetPackId, rolledBackBy, reason });
    return NextResponse.json({ ok: true, ...result, rolledBackBy });
  } catch (error) {
    const message = error instanceof HomeKnowledgeV4ApprovalError
      ? error.message
      : "Rollback failed. See server logs for detail.";
    if (!(error instanceof HomeKnowledgeV4ApprovalError)) {
      console.error("[home-knowledge-v4-rollback]", error);
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
