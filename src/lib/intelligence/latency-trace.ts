export type IntelligenceLatencyMetadataValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export interface IntelligenceLatencyTiming {
  requestId: string;
  stage: string;
  at: string;
  elapsedMs: number;
  durationMs?: number;
  metadata?: Record<string, Exclude<IntelligenceLatencyMetadataValue, undefined>>;
}

export interface IntelligenceLatencyTrace {
  readonly requestId: string;
  readonly startedAt: number;
  mark: (
    stage: string,
    metadata?: Record<string, IntelligenceLatencyMetadataValue>,
  ) => IntelligenceLatencyTiming;
  measure: <T>(
    stage: string,
    work: () => Promise<T> | T,
    metadata?: Record<string, IntelligenceLatencyMetadataValue>,
  ) => Promise<{ value: T; timing: IntelligenceLatencyTiming }>;
  finish: (
    stage: string,
    start: number,
    metadata?: Record<string, IntelligenceLatencyMetadataValue>,
  ) => IntelligenceLatencyTiming;
}

export function createIntelligenceLatencyTrace(input?: {
  requestId?: string | null;
  startedAt?: number;
}): IntelligenceLatencyTrace {
  const startedAt = input?.startedAt ?? Date.now();
  const requestId =
    input?.requestId?.trim() ??
    `intel-${startedAt.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  function buildTiming(
    stage: string,
    metadata?: Record<string, IntelligenceLatencyMetadataValue>,
    durationMs?: number,
  ): IntelligenceLatencyTiming {
    const cleanMetadata = compactLatencyMetadata(metadata);
    return {
      requestId,
      stage,
      at: new Date().toISOString(),
      elapsedMs: Math.max(0, Date.now() - startedAt),
      ...(typeof durationMs === "number"
        ? { durationMs: Math.max(0, durationMs) }
        : {}),
      ...(Object.keys(cleanMetadata).length > 0
        ? { metadata: cleanMetadata }
        : {}),
    };
  }

  return {
    requestId,
    startedAt,
    mark: (stage, metadata) => buildTiming(stage, metadata),
    measure: async (stage, work, metadata) => {
      const stepStartedAt = Date.now();
      const value = await work();
      return {
        value,
        timing: buildTiming(stage, metadata, Date.now() - stepStartedAt),
      };
    },
    finish: (stage, start, metadata) =>
      buildTiming(stage, metadata, Date.now() - start),
  };
}

export function summarizeTextPayload(text: string): {
  charCount: number;
  approxTokens: number;
  lineCount: number;
} {
  const charCount = text.length;
  return {
    charCount,
    approxTokens: Math.ceil(charCount / 4),
    lineCount: text.length === 0 ? 0 : text.split(/\r?\n/).length,
  };
}

function compactLatencyMetadata(
  metadata?: Record<string, IntelligenceLatencyMetadataValue>,
): Record<string, Exclude<IntelligenceLatencyMetadataValue, undefined>> {
  if (!metadata) return {};
  const clean: Record<
    string,
    Exclude<IntelligenceLatencyMetadataValue, undefined>
  > = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined) continue;
    clean[key] = value;
  }
  return clean;
}
