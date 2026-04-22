'use client';

import { useCallback, useState } from 'react';
import type { ContradictionFlag, NexusFormat, NexusMode, NexusTurnData, NexusTurnPayload, Source } from '@/lib/intelligence/types';
import { applyVoiceFilter, filterPayload, liveStripInternalTags } from '@/lib/nexus/voiceFilter';

type ProgressEvent = {
  phase: string;
  status: string;
  latencyMs?: number;
};

type TurnCompletePayload = {
  threadId?: string;
  mode?: NexusMode;
  format?: NexusFormat;
};

function readConfidence(payload: NexusTurnPayload): NexusTurnData['confidence'] {
  const candidate = (payload as Record<string, unknown>).confidence;
  if (candidate === 'high' || candidate === 'medium' || candidate === 'low') {
    return candidate;
  }
  return null;
}

function readContradictionFlag(payload: NexusTurnPayload): ContradictionFlag | null {
  const candidate = (payload as Record<string, unknown>).contradiction_self_check ?? (payload as Record<string, unknown>).contradictionSelfCheck;
  if (!candidate || typeof candidate !== 'object') return null;

  const record = candidate as Record<string, unknown>;
  if (
    typeof record.prior_turn_id !== 'string' ||
    typeof record.prior_summary !== 'string' ||
    typeof record.current_departure !== 'string' ||
    !Array.isArray(record.reconciliation_paths) ||
    !record.reconciliation_paths.every((entry) => typeof entry === 'string')
  ) {
    return null;
  }

  return {
    prior_turn_id: record.prior_turn_id,
    prior_summary: record.prior_summary,
    current_departure: record.current_departure,
    reconciliation_paths: record.reconciliation_paths,
  };
}

function tryParseJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(withoutFence) as Record<string, unknown>;
  } catch {
    const match = withoutFence.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

export function parseTurnPayload(raw: string, fallback?: Partial<NexusTurnPayload>): NexusTurnPayload {
  const parsed = tryParseJson(raw);
  if (parsed) return parsed as NexusTurnPayload;
  const cleaned = applyVoiceFilter(raw.trim() || fallback?.answer || 'Nexus returned an unreadable payload.').cleaned;
  return {
    format: 'idk',
    answer: cleaned,
    why_dont_know: raw.trim() ? undefined : 'The streaming payload did not include a complete renderable body.',
    ...fallback,
  } as NexusTurnPayload;
}

interface SubmitQueryInput {
  query: string;
  threadId?: string | null;
}

interface UploadResponse {
  fileId: string;
  sessionId: string;
  storageExpiry: string;
}

export interface UploadedAttachment {
  fileId: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  sessionId: string;
  storageExpiry: string;
}

interface StreamState {
  turnId: string | null;
  mode: NexusMode | null;
  format: NexusFormat | null;
  raw: string;
  sources: Source[];
  clarification?: {
    question: string;
    options: Array<{ label: string; context?: string }>;
  } | null;
  progress: ProgressEvent[];
}

export function useNexusStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamState, setStreamState] = useState<StreamState>({
    turnId: null,
    mode: null,
    format: null,
    raw: '',
    sources: [],
    clarification: null,
    progress: [],
  });
  const [error, setError] = useState<string | null>(null);

  const resetStream = useCallback(() => {
    setStreamState({
      turnId: null,
      mode: null,
      format: null,
      raw: '',
      sources: [],
      clarification: null,
      progress: [],
    });
  }, []);

  const uploadFile = useCallback(async (file: File): Promise<UploadedAttachment> => {
    const form = new FormData();
    form.append('file', file);
    form.append('sessionId', `session-${Date.now()}`);
    const res = await fetch('/api/v1/nexus/upload', { method: 'POST', body: form });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
      throw new Error(body.detail ?? body.error ?? `Upload failed (${res.status})`);
    }
    const body = (await res.json()) as UploadResponse;
    return {
      fileId: body.fileId,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      sessionId: body.sessionId,
      storageExpiry: body.storageExpiry,
    };
  }, []);

  const submitQuery = useCallback(async (input: SubmitQueryInput): Promise<NexusTurnData | null> => {
    setIsStreaming(true);
    setError(null);
    resetStream();

    const res = await fetch('/api/v1/nexus/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: input.query, threadId: input.threadId ?? undefined }),
    });

    if (!res.ok || !res.body) {
      const body = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
      setError(body.detail ?? body.error ?? `Query failed (${res.status})`);
      setIsStreaming(false);
      return null;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    let turnId: string | null = null;
    let mode: NexusMode | null = null;
    let format: NexusFormat | null = null;
    let raw = '';
    let sources: Source[] = [];
    let clarification: StreamState['clarification'] = null;
    let completion: TurnCompletePayload = {};

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(line) as Record<string, unknown>;
          } catch {
            continue;
          }

          if (event.type === 'turn_started') {
            turnId = (event.turnId as string) ?? turnId;
            mode = (event.mode as NexusMode) ?? mode;
            format = (event.format as NexusFormat) ?? format;
            setStreamState((prev) => ({ ...prev, turnId, mode, format }));
          } else if (event.type === 'retrieval_progress') {
            const next = {
              phase: String(event.phase ?? 'phase'),
              status: String(event.status ?? 'start'),
              latencyMs: typeof event.latencyMs === 'number' ? event.latencyMs : undefined,
            };
            setStreamState((prev) => ({ ...prev, progress: [...prev.progress, next] }));
          } else if (event.type === 'content_delta') {
            raw += String(event.text ?? '');
            setStreamState((prev) => ({ ...prev, raw: liveStripInternalTags(raw) }));
          } else if (event.type === 'source_attached' && event.source) {
            sources = [...sources, event.source as Source];
            setStreamState((prev) => ({ ...prev, sources }));
          } else if (event.type === 'clarifying_question') {
            clarification = {
              question: String(event.question ?? 'Clarification needed'),
              options: Array.isArray(event.options)
                ? (event.options as Array<{ label: string; context?: string }>)
                : [],
            };
            setStreamState((prev) => ({ ...prev, clarification }));
          } else if (event.type === 'error') {
            setError(String(event.message ?? event.error ?? 'Nexus returned an error.'));
          } else if (event.type === 'turn_complete') {
            completion = (event.payload as TurnCompletePayload) ?? {};
          }
        }
      }
    } finally {
      setIsStreaming(false);
    }

    const payload = clarification && !raw
      ? ({
          format: 'clarification',
          question: clarification.question,
          options: clarification.options,
        } as NexusTurnPayload)
      : (() => {
          const parsed = parseTurnPayload(raw);
          return filterPayload(parsed as Record<string, any>).filtered as NexusTurnPayload;
        })();

    if (!completion.threadId) {
      return null;
    }

    const turn: NexusTurnData = {
      id: turnId ?? `turn-${Date.now()}`,
      threadId: completion.threadId,
      index: -1,
      role: 'nexus',
      mode: completion.mode ?? mode,
      format: completion.format ?? format,
      confidence: readConfidence(payload),
      payload,
      sources,
      capabilitiesActive: clarification ? ['clarifying'] : [],
      counterOfTurnId: null,
      contradictionSelfCheck: readContradictionFlag(payload),
      personaKey: null,
      latencyMs: null,
      firstTokenMs: null,
      createdAt: new Date().toISOString(),
    };
    resetStream();
    return turn;
  }, [resetStream]);

  const applyPersona = useCallback(async (turnId: string, personaKey: string): Promise<NexusTurnData | null> => {
    const res = await fetch('/api/v1/nexus/persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turnId, personaKey }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
      setError(body.detail ?? body.error ?? `Persona failed (${res.status})`);
      return null;
    }
    const data = (await res.json()) as { turn: NexusTurnData };
    return data.turn;
  }, []);

  const requestCounter = useCallback(async (turnId: string): Promise<NexusTurnData | null> => {
    const res = await fetch('/api/v1/nexus/counter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ turnId }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
      setError(body.detail ?? body.error ?? `Counter failed (${res.status})`);
      return null;
    }
    const data = (await res.json()) as { turn: NexusTurnData };
    return data.turn;
  }, []);

  return {
    isStreaming,
    streamState,
    error,
    resetStream,
    submitQuery,
    applyPersona,
    requestCounter,
    uploadFile,
  };
}
