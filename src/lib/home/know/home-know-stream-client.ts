import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";

export type HomeKnowStatusEvent = {
  type: "status";
  phase?: string;
  label?: string;
  elapsedMs?: number;
};

type HomeKnowAnswerEvent = {
  type: "home-answer";
  status?: number;
  response?: unknown;
  elapsedMs?: number;
};

type HomeKnowErrorEvent = {
  type: "error";
  status?: number;
  error?: unknown;
  detail?: string;
};

type HomeKnowDoneEvent = {
  type: "done";
  status?: number;
  answerStatus?: string;
  elapsedMs?: number;
};

type HomeKnowStreamEvent =
  | HomeKnowStatusEvent
  | HomeKnowAnswerEvent
  | HomeKnowErrorEvent
  | HomeKnowDoneEvent;

export function isHomeKnowResponse(value: unknown): value is HomeKnowResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return record.mode === "KNOW" && typeof record.intent === "string";
}

export function extractHomeKnowStreamError(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return typeof value === "string" ? value : null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  if (typeof record.error === "string") return record.error;
  if (record.error && typeof record.error === "object") {
    return extractHomeKnowStreamError(record.error);
  }
  return null;
}

function parseHomeKnowLine(line: string): HomeKnowStreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as HomeKnowStreamEvent;
  } catch {
    return {
      type: "error",
      error: "home_know_stream_parse_failed",
      detail: trimmed.slice(0, 160),
    };
  }
}

export async function readHomeKnowStream(
  response: Response,
  onStatus?: (event: HomeKnowStatusEvent) => void,
): Promise<HomeKnowResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.body || !contentType.includes("application/x-ndjson")) {
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok || !isHomeKnowResponse(payload)) {
      throw new Error(
        extractHomeKnowStreamError(payload) ??
          "aVa could not use the loaded Home context yet.",
      );
    }
    return payload;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResponse: HomeKnowResponse | null = null;
  let failure: string | null = null;

  const handleLine = (line: string) => {
    const event = parseHomeKnowLine(line);
    if (!event) return;
    if (event.type === "status") {
      onStatus?.(event);
      return;
    }
    if (event.type === "home-answer") {
      if (isHomeKnowResponse(event.response)) {
        finalResponse = event.response;
      } else {
        failure = "Home KNOW returned an invalid streaming response.";
      }
      return;
    }
    if (event.type === "error") {
      failure =
        extractHomeKnowStreamError(event.error) ??
        event.detail ??
        "aVa could not use the loaded Home context yet.";
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) handleLine(line);
  }
  buffer += decoder.decode();
  if (buffer.trim()) handleLine(buffer);

  if (failure) throw new Error(failure);
  const completedResponse = finalResponse as HomeKnowResponse | null;
  if (!completedResponse) {
    throw new Error("Home KNOW stream ended before an answer was received.");
  }
  if (!response.ok && completedResponse.answerStatus === "blocked") {
    throw new Error(completedResponse.prose);
  }
  return completedResponse;
}
