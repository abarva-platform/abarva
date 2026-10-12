import type { ChapterId } from "./types";

export interface HomeIntelligenceRequest {
  tenantKey: string;
  recordToken: string;
  requestedProvider?: string;
  chapterId?: ChapterId;
}

export interface HomeIntelligenceState {
  request: HomeIntelligenceRequest;
  status: "ready" | "changed" | "unavailable" | "not_authorized";
  sourceLabel?: string;
  chapterTitle?: string;
}

const CHAPTER_IDS = new Set<ChapterId>([
  "executive_brief",
  "our_business",
  "strategy_value_creation",
  "how_we_operate",
  "technology_data",
  "performance_value",
  "leadership_perspective",
  "what_needs_attention",
]);

export function parseHomeIntelligenceRequest(
  value: unknown,
): HomeIntelligenceRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  if (
    typeof item.tenantKey !== "string" ||
    !/^[a-z][a-z0-9-]{0,80}$/.test(item.tenantKey)
  )
    return null;
  if (
    typeof item.recordToken !== "string" ||
    !/^[a-f0-9]{64}$/.test(item.recordToken)
  )
    return null;
  if (
    item.requestedProvider !== undefined &&
    (typeof item.requestedProvider !== "string" ||
      !/^[a-z0-9_]{1,40}$/.test(item.requestedProvider))
  )
    return null;
  if (
    item.chapterId !== undefined &&
    !CHAPTER_IDS.has(item.chapterId as ChapterId)
  )
    return null;
  return {
    tenantKey: item.tenantKey,
    recordToken: item.recordToken,
    ...(item.requestedProvider
      ? { requestedProvider: item.requestedProvider as string }
      : {}),
    ...(item.chapterId ? { chapterId: item.chapterId as ChapterId } : {}),
  };
}

export function homeIntelligenceHref(request: HomeIntelligenceRequest): string {
  const params = new URLSearchParams({
    client: request.tenantKey,
    homeContext: request.recordToken,
  });
  if (request.chapterId) params.set("homeChapter", request.chapterId);
  if (request.requestedProvider)
    params.set("homeProvider", request.requestedProvider);
  return `/intelligence?${params}`;
}

export function homeQuestionStorageKey(
  request: HomeIntelligenceRequest,
): string {
  return `abarva.home-intelligence:${request.tenantKey}:${request.recordToken}`;
}

export function rememberHomeQuestion(
  request: HomeIntelligenceRequest,
  question: string,
): void {
  try {
    sessionStorage.setItem(
      homeQuestionStorageKey(request),
      question.trim().slice(0, 4000),
    );
  } catch {
    // Navigation remains usable when browser storage is disabled.
  }
}

export function takeHomeQuestion(
  request: HomeIntelligenceRequest,
): string | null {
  try {
    const key = homeQuestionStorageKey(request);
    const question = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return question?.trim().slice(0, 4000) || null;
  } catch {
    return null;
  }
}
