import { NextRequest, NextResponse } from "next/server";

import { isFoundationPreviewOperatorSession } from "@/lib/auth/foundation-preview-session";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import { answerHomeAvaQuestion } from "@/lib/home/preview/ava-answer";
import { getHomeEclProjectionBundleOrReviewedSnapshotWithSource } from "@/lib/home/preview/ecl-projection-bundle";
import { isHomePreviewTenantKey } from "@/lib/home/preview/golden-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface AskBody {
  tenantKey?: string;
  question?: string;
  activeChapterId?: string;
}

/** Ask aVa, scoped to the Home preview surface: answers are grounded in the same served bundle
 * resolver that renders /home. When the governed projection is unavailable, the resolver keeps the
 * reviewed-snapshot fallback but returns that record source explicitly so the fallback is never
 * silent. Gated behind the same access check as the preview page itself (see
 * src/app/(maestro)/home/page.tsx). */
export async function POST(req: NextRequest) {
  const hasPlatformAdmin = await isPlatformAdminSession();
  const hasFoundationOperator = await isFoundationPreviewOperatorSession();
  if (!hasPlatformAdmin && !hasFoundationOperator) {
    return NextResponse.json({ error: "not_authorized" }, { status: 404 });
  }

  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return NextResponse.json({ error: "invalid_json_body" }, { status: 400 });
  }

  const tenantKey = body.tenantKey;
  const question = body.question?.trim();
  if (!tenantKey || !isHomePreviewTenantKey(tenantKey)) {
    return NextResponse.json({ error: "unknown_tenant_key" }, { status: 400 });
  }
  if (!question) {
    return NextResponse.json({ error: "question_required" }, { status: 400 });
  }

  const { bundle, recordSource } =
    await getHomeEclProjectionBundleOrReviewedSnapshotWithSource(tenantKey);

  const answer = await answerHomeAvaQuestion({
    bundle,
    tenantKey,
    question,
    activeChapterId: body.activeChapterId,
  });

  return NextResponse.json({ answer, recordSource });
}
