import "server-only";

import { isFoundationPreviewOperatorSession } from "@/lib/auth/foundation-preview-session";
import { isPlatformAdminSession } from "@/lib/auth/platform-admin-session";
import { isHomePreviewTenantKey } from "@/lib/home/preview/golden-snapshot";
import { homeRecordSourceLabel } from "@/lib/home/preview/record-source";
import { resolveHomeRecord } from "@/lib/home/preview/resolve-home-record";
import type {
  HomeIntelligenceRequest,
  HomeIntelligenceState,
} from "@/lib/home/preview/intelligence-handoff";
import {
  buildHomeRecordSources,
  type BoundHomeRecordContext,
} from "./ask/home-record-context";

export async function resolveIntelligenceHomeHandoff(
  request: HomeIntelligenceRequest,
  authorizedTenantKey: string | null | undefined,
): Promise<{ state: HomeIntelligenceState; context?: BoundHomeRecordContext }> {
  const state: HomeIntelligenceState = { request, status: "not_authorized" };
  if (
    authorizedTenantKey !== request.tenantKey ||
    !isHomePreviewTenantKey(request.tenantKey)
  )
    return { state };
  const authorized =
    (await isPlatformAdminSession()) ||
    (await isFoundationPreviewOperatorSession());
  if (!authorized) return { state };
  const resolved = await resolveHomeRecord(
    request.tenantKey,
    request.requestedProvider,
  );
  if (!resolved) return { state: { ...state, status: "unavailable" } };
  if (resolved.recordToken !== request.recordToken)
    return { state: { ...state, status: "changed" } };
  return {
    state: {
      ...state,
      status: "ready",
      sourceLabel: homeRecordSourceLabel(resolved.recordSource),
      chapterTitle: resolved.bundle.chapters.find(
        (chapter) => chapter.chapterId === request.chapterId,
      )?.title,
    },
    context: {
      tenantKey: request.tenantKey,
      recordToken: request.recordToken,
      sources: buildHomeRecordSources(
        resolved.bundle,
        resolved.recordSource,
        resolved.recordToken,
      ),
    },
  };
}
