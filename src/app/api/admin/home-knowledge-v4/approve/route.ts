import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import {
  approveHomeKnowledgeV4Candidate,
  HomeKnowledgeV4ApprovalError,
} from "@/lib/home/home-knowledge-v4-review";

export const dynamic = "force-dynamic";

// Approve (or, with a written reason, override-approve) the latest V4 book
// candidate for one tenant. Platform-admin only -- same gate as
// the retired V4 review surface, reused via isPlatformAdminSession() rather than
// re-implemented here (see that function's comment for why: hand-copied
// auth checks are exactly what caused the earlier cross-tenant exposure on
// this same page).
export async function POST(request: Request) {
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const tenantKey =
    typeof body?.tenantKey === "string" ? body.tenantKey.trim() : "";
  const overrideReason =
    typeof body?.overrideReason === "string" ? body.overrideReason.trim() : "";
  if (!tenantKey) {
    return NextResponse.json(
      { error: "tenantKey is required." },
      { status: 400 },
    );
  }

  const user = await currentUser().catch(() => null);
  const approvedBy =
    user?.primaryEmailAddress?.emailAddress ?? user?.id ?? "unknown-reviewer";

  try {
    const result = await approveHomeKnowledgeV4Candidate({
      tenantKey,
      approvedBy,
      overrideReason: overrideReason || null,
    });
    return NextResponse.json({
      ok: true,
      id: result.id,
      tenantKey: result.tenantKey,
      packVersion: result.packVersion,
      overridden: result.overridden,
      approvedBy,
    });
  } catch (error) {
    const message =
      error instanceof HomeKnowledgeV4ApprovalError
        ? error.message
        : "Approval failed. See server logs for detail.";
    if (!(error instanceof HomeKnowledgeV4ApprovalError)) {
      console.error("[home-knowledge-v4-approve]", error);
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
