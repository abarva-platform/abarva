import { NextRequest, NextResponse } from "next/server";

import { isFoundationPreviewOperatorSession } from "@/lib/auth/foundation-preview-session";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import { answerHomeAvaQuestion } from "@/lib/home/preview/ava-answer";
import { isHomePreviewTenantKey } from "@/lib/home/preview/golden-snapshot";
import { resolveHomeRecord } from "@/lib/home/preview/resolve-home-record";
import { homeRecordSourceToken } from "@/lib/home/preview/record-source-token";
import type { HomeRecordRenderSource } from "@/lib/home/preview/types";
import {
  formatHomeAdvisorAnswer,
  homeConversationSchema,
  homeFollowUpQuestions,
  type HomeConversationTurn,
} from "@/lib/home/preview/conversation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface AskBody {
  tenantKey?: string;
  question?: string;
  activeChapterId?: string;
  requestedProvider?: string;
  expectedRecordSource?: HomeRecordRenderSource;
  conversation?: HomeConversationTurn[];
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
  const conversation = homeConversationSchema.safeParse(
    body.conversation ?? [],
  );
  if (!conversation.success) {
    return NextResponse.json(
      { error: "invalid_conversation" },
      { status: 400 },
    );
  }
  if (
    !body.expectedRecordSource ||
    typeof body.expectedRecordSource.kind !== "string" ||
    typeof body.expectedRecordSource.canonicalSnapshotHash !== "string"
  ) {
    return NextResponse.json(
      { error: "record_source_required" },
      { status: 400 },
    );
  }

  const record = await resolveHomeRecord(
    tenantKey,
    typeof body.requestedProvider === "string"
      ? body.requestedProvider
      : undefined,
  );
  if (!record) {
    return NextResponse.json(
      { error: "home_bundle_unavailable" },
      { status: 404 },
    );
  }
  const { bundle, recordSource, recordToken } = record;
  if (
    homeRecordSourceToken(tenantKey, body.expectedRecordSource) !== recordToken
  ) {
    return NextResponse.json(
      { error: "home_context_changed" },
      { status: 409 },
    );
  }

  const answer = await answerHomeAvaQuestion({
    bundle,
    tenantKey,
    question,
    activeChapterId: body.activeChapterId,
    recordSource,
    conversation: conversation.data,
  });

  return NextResponse.json({
    answer: formatHomeAdvisorAnswer(answer, recordSource),
    followUpQuestions: homeFollowUpQuestions(answer),
    recordSource,
  });
}
