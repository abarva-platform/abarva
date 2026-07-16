const STRUCTURED_ARTIFACT_LABELS = [
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

  const resetPayloadState = () => {
    insideStructuredPayload = false;
    payloadStarted = false;
    payloadDepth = 0;
    payloadClose = null;
    insideString = false;
    escaping = false;
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
          buffer = buffer.slice(cursor);
          resetPayloadState();
          suppressPostPayloadFenceTicks = true;
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
        const isDecisionTable = label === "decision-table" && hasFenceTick;
        if (!hasFenceTick && !isBareArtifact && !isDecisionTable) continue;
        const candidate = {
          index: match.index,
          startLength: raw.length,
        };
        if (!best || candidate.index < best.index) best = candidate;
      }
    }

    return best;
  };

  return {
    push(chunk: string): string {
      buffer += chunk;
      let output = "";

      for (;;) {
        if (insideStructuredPayload) {
          if (!consumePayload()) return output;
          continue;
        }

        if (suppressPostPayloadFenceTicks) {
          if (buffer.length === 0) return output;
          const originalLength = buffer.length;
          buffer = buffer.replace(/^\s*`+/, "");
          if (buffer.length === originalLength) {
            suppressPostPayloadFenceTicks = false;
          }
          if (buffer.length === 0) return output;
        }

        const firstStart = findStructuredArtifactStart();
        if (firstStart) {
          output += buffer.slice(0, firstStart.index);
          buffer = buffer.slice(firstStart.index + firstStart.startLength);
          insideStructuredPayload = true;
          continue;
        }

        const holdBack = longestStructuredFencePrefixSuffix(buffer);
        const safeEnd = buffer.length - holdBack;
        if (safeEnd <= 0) return output;
        output += buffer.slice(0, safeEnd);
        buffer = buffer.slice(safeEnd);
        return output;
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
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
