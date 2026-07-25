import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import { retireHomeKnowledgeV4ActivePack, HomeKnowledgeV4ApprovalError } from "@/lib/home/home-knowledge-v4-review";

export const dynamic = "force-dynamic";

// Pull a tenant's currently-active V4 pack down WITHOUT promoting a
// replacement -- the deliberate standalone action that falls a tenant back
// to the V2 renderer on purpose. Platform-admin only.
export async function POST(request: Request) {
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const tenantKey = typeof body?.tenantKey === "string" ? body.tenantKey.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!tenantKey) {
    return NextResponse.json({ error: "tenantKey is required." }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ error: "A retire reason is required." }, { status: 400 });
  }

  const user = await currentUser().catch(() => null);
  const retiredBy = user?.primaryEmailAddress?.emailAddress ?? user?.id ?? "unknown-reviewer";

  try {
    const result = await retireHomeKnowledgeV4ActivePack({ tenantKey, retiredBy, reason });
    return NextResponse.json({ ok: true, ...result, retiredBy });
  } catch (error) {
    const message = error instanceof HomeKnowledgeV4ApprovalError
      ? error.message
      : "Retire failed. See server logs for detail.";
    if (!(error instanceof HomeKnowledgeV4ApprovalError)) {
      console.error("[home-knowledge-v4-retire]", error);
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
