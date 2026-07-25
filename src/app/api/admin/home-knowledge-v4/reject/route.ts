import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import { rejectHomeKnowledgeV4Candidate, HomeKnowledgeV4ApprovalError } from "@/lib/home/home-knowledge-v4-review";

export const dynamic = "force-dynamic";

// Reject a candidate outright -- reviewed and explicitly declined, never
// approved. Platform-admin only, same gate as approve/retire/rollback.
export async function POST(request: Request) {
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const packId = typeof body?.packId === "string" ? body.packId.trim() : "";
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  if (!packId) {
    return NextResponse.json({ error: "packId is required." }, { status: 400 });
  }
  if (!reason) {
    return NextResponse.json({ error: "A reject reason is required." }, { status: 400 });
  }

  const user = await currentUser().catch(() => null);
  const rejectedBy = user?.primaryEmailAddress?.emailAddress ?? user?.id ?? "unknown-reviewer";

  try {
    const result = await rejectHomeKnowledgeV4Candidate({ packId, rejectedBy, reason });
    return NextResponse.json({ ok: true, ...result, rejectedBy });
  } catch (error) {
    const message = error instanceof HomeKnowledgeV4ApprovalError
      ? error.message
      : "Rejection failed. See server logs for detail.";
    if (!(error instanceof HomeKnowledgeV4ApprovalError)) {
      console.error("[home-knowledge-v4-reject]", error);
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
