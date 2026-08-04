const STRUCTURED_ARTIFACT_LABELS = [
  "abarva-canvas",
  "decision-table",
  "chart",
  "followups",
] as const;

const STRUCTURED_FENCE_STARTS = STRUCTURED_ARTIFACT_LABELS.flatMap((label) => [
  `\`\`\`${label}`,
  `\`\`${label}`,
  `\`${label}`,
  label,
]);
const RAW_STRUCTURED_JSON_KEY_RE =
  /"(?:initiative|valueScore|complexityScore|readinessScore|evidenceBasis|nextAction|directional|canvasType|xKey|yKey|sourceNote|records|rows|data)"\s*:/i;
const RAW_STRUCTURED_JSON_PARTIAL_KEY_RE =
  /"(?:init(?:iative)?|value(?:Score)?|complex(?:ityScore)?|readiness(?:Score)?|evidence(?:Basis)?|next(?:Action)?|directional|canvas(?:Type)?|xKey|yKey|source(?:Note)?|records?|rows?|data)?$/i;

function longestStructuredFencePrefixSuffix(value: string): number {
  const lower = value.toLowerCase();
  const max = Math.min(
    lower.length,
    Math.max(...STRUCTURED_FENCE_STARTS.map((start) => start.length - 1)),
  );
  for (let length = max; length > 0; length -= 1) {
    const suffix = lower.slice(lower.length - length);
    if (STRUCTURED_FENCE_STARTS.some((start) => start.startsWith(suffix))) {
      return length;
    }
  }
  return 0;
}

function trailingStructuredMarkerSuffix(value: string): number {
  const match = value.match(
    /(?:^|[\s.;:!?)]|`)(`{0,3}\s*(?:abarva-canvas|decision-table|chart|followups)\s*)$/i,
  );
  return match?.[1]?.length ?? 0;
}

/**
 * Removes governed structured exhibit fences from live deltas before they
 * reach the visible chat rail. The full raw model output is still accumulated
 * server-side for parser/packet creation; this filter only protects the live
 * stream where fence markers may be split across chunk boundaries.
 */
export function createStructuredFenceStreamFilter(): {
  push: (chunk: string) => string;
  flush: () => string;
} {
  let buffer = "";
  let insideStructuredPayload = false;
  let payloadStarted = false;
  let payloadDepth = 0;
  let payloadClose: "}" | "]" | null = null;
  let insideString = false;
  let escaping = false;
  let suppressPostPayloadFenceTicks = false;
  let suppressPostPayloadSeparators = false;
  let payloadIsRawGovernedJson = false;
  let lastOutputEndedWithWhitespace = false;

  const resetPayloadState = () => {
    insideStructuredPayload = false;
    payloadStarted = false;
    payloadDepth = 0;
    payloadClose = null;
    insideString = false;
    escaping = false;
    payloadIsRawGovernedJson = false;
  };

  const consumePayload = (): boolean => {
    let cursor = 0;

    while (cursor < buffer.length) {
      const char = buffer[cursor] ?? "";

      if (!payloadStarted) {
        if (char === "{" || char === "[") {
          payloadStarted = true;
          payloadDepth = 1;
          payloadClose = char === "{" ? "}" : "]";
          cursor += 1;
          continue;
        }
        // Valid fences and malformed near-fences may carry whitespace,
        // newlines, and stray ticks between the marker and JSON payload.
        if (/[\s`]/.test(char)) {
          cursor += 1;
          continue;
        }
        // If the model emitted only a marker but no JSON payload, drop the
        // marker and resume normal rendering from this character.
        buffer = buffer.slice(cursor);
        resetPayloadState();
        return true;
      }

      if (insideString) {
        if (escaping) {
          escaping = false;
        } else if (char === "\\") {
          escaping = true;
        } else if (char === '"') {
          insideString = false;
        }
        cursor += 1;
        continue;
      }

      if (char === '"') {
        insideString = true;
        cursor += 1;
        continue;
      }

      if (char === "{" || char === "[") {
        payloadDepth += 1;
        cursor += 1;
        continue;
      }

      if (char === payloadClose || char === "}" || char === "]") {
        payloadDepth -= 1;
        cursor += 1;
        if (payloadDepth <= 0) {
          while (cursor < buffer.length && /[\s`]/.test(buffer[cursor] ?? "")) {
            cursor += 1;
          }
          const wasRawGovernedJson = payloadIsRawGovernedJson;
          buffer = buffer.slice(cursor);
          resetPayloadState();
          suppressPostPayloadFenceTicks = true;
          suppressPostPayloadSeparators = wasRawGovernedJson;
          return true;
        }
        continue;
      }

      cursor += 1;
    }

    buffer = "";
    return false;
  };

  const findStructuredArtifactStart = (): {
    index: number;
    startLength: number;
  } | null => {
    const lower = buffer.toLowerCase();
    let best: { index: number; startLength: number } | null = null;

    for (const label of STRUCTURED_ARTIFACT_LABELS) {
      const pattern = new RegExp(`(?:\`{1,3}\\s*)?${label}\\b\\s*`, "gi");
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(lower))) {
        const raw = match[0] ?? "";
        const previous = lower[match.index - 1] ?? "";
        const hasFenceTick = raw.includes("`");
        const after = lower.slice(match.index + raw.length);
        const followedByPayload = /^\s*[\[{]/.test(after);
        const isBareArtifact =
          !hasFenceTick &&
          (!previous || /\s|[.;:!?)]/.test(previous)) &&
          followedByPayload &&
          (label === "chart" || label === "followups");
        const isFencedStructuredArtifact = hasFenceTick;
        if (!isFencedStructuredArtifact && !isBareArtifact) continue;
        const candidate = {
          index: match.index,
          startLength: raw.length,
        };
        if (!best || candidate.index < best.index) best = candidate;
      }
    }

    return best;
  };

  const findRawGovernedJsonStart = (): {
    index: number;
  } | null => {
    for (let index = 0; index < buffer.length; index += 1) {
      const char = buffer[index] ?? "";
      if (char !== "{" && char !== "[") continue;
      const previous = buffer[index - 1] ?? "";
      if (previous && !/[\s,.;:!?([{]/.test(previous)) continue;

      const tail = buffer.slice(index, index + 1600);
      if (RAW_STRUCTURED_JSON_KEY_RE.test(tail)) return { index };
    }
    return null;
  };

  const rawGovernedJsonHoldBack = (): number => {
    const start = Math.max(buffer.lastIndexOf("{"), buffer.lastIndexOf("["));
    if (start < 0) return 0;
    const previous = buffer[start - 1] ?? "";
    if (previous && !/[\s,.;:!?([{]/.test(previous)) return 0;
    const suffix = buffer.slice(start);
    if (suffix.length > 240) return 0;
    if (
      /^(?:\{|\[)\s*(?:"?|\{\s*"?|\[\s*\{\s*"?)$/i.test(suffix) ||
      RAW_STRUCTURED_JSON_PARTIAL_KEY_RE.test(suffix)
    ) {
      return suffix.length;
    }
    return 0;
  };

  const finishOutput = (value: string): string => {
    const output = lastOutputEndedWithWhitespace
      ? value.replace(/^\s+/, "")
      : value;
    if (output.length > 0) lastOutputEndedWithWhitespace = /\s$/.test(output);
    return output;
  };

  return {
    push(chunk: string): string {
      buffer += chunk;
      let output = "";

      for (;;) {
        if (insideStructuredPayload) {
          if (!consumePayload()) return finishOutput(output);
          continue;
        }

        if (suppressPostPayloadFenceTicks) {
          if (buffer.length === 0) return finishOutput(output);
          const originalLength = buffer.length;
          buffer = buffer.replace(/^\s*`+/, "");
          if (buffer.length === originalLength) {
            suppressPostPayloadFenceTicks = false;
          }
          if (buffer.length === 0) return finishOutput(output);
        }

        if (suppressPostPayloadSeparators) {
          if (buffer.length === 0) return finishOutput(output);
          const originalLength = buffer.length;
          buffer = buffer.replace(/^\s*(?:[,;]\s*)+/, "");
          if (/\s$/.test(output)) {
            buffer = buffer.replace(/^\s+/, "");
          }
          if (buffer.length === originalLength) {
            suppressPostPayloadSeparators = false;
          }
          if (buffer.length === 0) return finishOutput(output);
        }

        const firstStart = findStructuredArtifactStart();
        if (firstStart) {
          output += buffer.slice(0, firstStart.index);
          buffer = buffer.slice(firstStart.index + firstStart.startLength);
          insideStructuredPayload = true;
          continue;
        }

        const rawJsonStart = findRawGovernedJsonStart();
        if (rawJsonStart) {
          output += buffer.slice(0, rawJsonStart.index);
          buffer = buffer.slice(rawJsonStart.index);
          insideStructuredPayload = true;
          payloadIsRawGovernedJson = true;
          continue;
        }

        const holdBack = Math.max(
          longestStructuredFencePrefixSuffix(buffer),
          trailingStructuredMarkerSuffix(buffer),
          rawGovernedJsonHoldBack(),
        );
        if (/\s$/.test(output)) {
          buffer = buffer.replace(/^\s+/, "");
        }
        const safeEnd = buffer.length - holdBack;
        if (safeEnd <= 0) return finishOutput(output);
        output += buffer.slice(0, safeEnd);
        buffer = buffer.slice(safeEnd);
        return finishOutput(output);
      }
    },
    flush(): string {
      if (insideStructuredPayload) {
        buffer = "";
        resetPayloadState();
        return "";
      }
      const output = buffer;
      buffer = "";
      return output;
    },
  };
}

export function stripGovernedArtifactPayloadsFromText(text: string): string {
  if (!text) return text;
  const filter = createStructuredFenceStreamFilter();
  return `${filter.push(text)}${filter.flush()}`
    .replace(
      /(^|[\n\r])\s*(?:abarva-canvas|chart|decision-table|table|graph|followups)\s*[\n\r]+\s*(?:\{[\s\S]{0,4000}?\}|\[[\s\S]{0,4000}?\])\s*`*/gi,
      "$1",
    )
    .replace(
      /\b(?:abarva-canvas|chart|decision-table|table|graph|followups)\s*\{\s*"[^"]+"\s*:\s*[\s\S]{0,2400}?\}\s*`*/gi,
      "",
    )
    .replace(
      /\b(?:abarva-canvas|chart|decision-table|table|graph|followups)\s*\[\s*\{[\s\S]{0,2400}?\}\s*\]\s*`*/gi,
      "",
    )
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
