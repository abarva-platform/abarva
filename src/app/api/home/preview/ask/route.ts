import { NextRequest, NextResponse } from "next/server";

import { isFoundationPreviewOperatorSession } from "@/lib/auth/foundation-preview-session";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import { answerHomeAvaQuestion } from "@/lib/home/preview/ava-answer";
import { getHomeEclProjectionBundleOrReviewedSnapshotWithSource } from "@/lib/home/preview/ecl-projection-bundle";
import {
  getHomeReviewBundle,
  isHomePreviewTenantKey,
} from "@/lib/home/preview/golden-snapshot";
import type { HomeRecordRenderSource } from "@/lib/home/preview/types";
import {
  isEclProductProvider,
  resolveEclProductProvider,
} from "@/lib/ecl/product-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface AskBody {
  tenantKey?: string;
  question?: string;
  activeChapterId?: string;
  requestedProvider?: string;
  expectedRecordSource?: HomeRecordRenderSource;
}

function sameRecordSource(
  expected: HomeRecordRenderSource,
  actual: HomeRecordRenderSource,
): boolean {
  const left = expected.contextVersion;
  const right = actual.contextVersion;
  return (
    expected.kind === actual.kind &&
    expected.canonicalSnapshotHash === actual.canonicalSnapshotHash &&
    left?.assessmentId === right?.assessmentId &&
    left?.sourceSetHash === right?.sourceSetHash &&
    left?.projectionContentHash === right?.projectionContentHash &&
    left?.deterministicPacketHash === right?.deterministicPacketHash &&
    left?.narrativePacketHash === right?.narrativePacketHash &&
    left?.narrativeGeneratedAt === right?.narrativeGeneratedAt &&
    left?.dataAsOf === right?.dataAsOf &&
    left?.coherence === right?.coherence
  );
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

  const served = isEclProductProvider(
    resolveEclProductProvider(
      typeof body.requestedProvider === "string"
        ? body.requestedProvider
        : undefined,
    ),
  )
    ? await getHomeEclProjectionBundleOrReviewedSnapshotWithSource(tenantKey)
    : null;
  const bundle = served?.bundle ?? getHomeReviewBundle(tenantKey);
  if (!bundle) {
    return NextResponse.json(
      { error: "home_bundle_unavailable" },
      { status: 404 },
    );
  }
  const recordSource: HomeRecordRenderSource = served?.recordSource ?? {
    kind: "reviewed_snapshot",
    canonicalSnapshotHash: bundle.provenance.canonical_snapshot_hash,
  };
  if (!sameRecordSource(body.expectedRecordSource, recordSource)) {
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
  });

  return NextResponse.json({ answer, recordSource });
}
