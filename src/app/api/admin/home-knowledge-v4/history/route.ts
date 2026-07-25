import { NextResponse } from "next/server";

import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import { listHomeKnowledgeV4PackHistoryForTenant } from "@/lib/home/home-knowledge-v4-review";

export const dynamic = "force-dynamic";

// Full version history for one tenant -- read-only, feeds the rollback
// picker in the review queue UI. Platform-admin only, same gate as the
// mutating actions (this exposes every prior pack's review notes, which are
// not tenant-facing content).
export async function GET(request: Request) {
  if (!(await isPlatformAdminSession())) {
    return NextResponse.json({ error: "Not authorized." }, { status: 404 });
  }

  const tenantKey = new URL(request.url).searchParams.get("tenantKey")?.trim();
  if (!tenantKey) {
    return NextResponse.json({ error: "tenantKey query param is required." }, { status: 400 });
  }

  const history = await listHomeKnowledgeV4PackHistoryForTenant(tenantKey);
  return NextResponse.json({ ok: true, history });
}
