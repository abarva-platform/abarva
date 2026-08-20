import { NextRequest, NextResponse } from "next/server";

import { isFoundationPreviewOperatorSession } from "@/lib/auth/foundation-preview-session";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import { answerHomeAvaQuestion } from "@/lib/home/preview/ava-answer";
import { getHomeReviewBundle, isHomePreviewTenantKey } from "@/lib/home/preview/golden-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface AskBody {
  tenantKey?: string;
  question?: string;
  activeChapterId?: string;
}

/** Ask aVa, scoped to the Home preview surface: answers are grounded ONLY in the requested
 * tenant's already-verified golden-snapshot HomeReviewBundle -- no live DB query, no external
 * retrieval. Gated behind the same access check as the preview page itself (see
 * src/app/(maestro)/home/preview/page.tsx) since this route can only ever see preview data, not
 * production tenant data. */
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

  const bundle = getHomeReviewBundle(tenantKey);
  if (!bundle) {
    return NextResponse.json({ error: "missing_golden_snapshot" }, { status: 500 });
  }

  const answer = await answerHomeAvaQuestion({
    bundle,
    tenantKey,
    question,
    activeChapterId: body.activeChapterId,
  });

  return NextResponse.json({ answer });
}
