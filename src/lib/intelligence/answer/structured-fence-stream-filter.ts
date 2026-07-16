const STRUCTURED_FENCE_STARTS = [
  "```decision-table",
  "```chart",
  "```followups",
];

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
  let insideStructuredFence = false;

  return {
    push(chunk: string): string {
      buffer += chunk;
      let output = "";

      for (;;) {
        if (insideStructuredFence) {
          const closeIndex = buffer.indexOf("```");
          if (closeIndex < 0) {
            buffer = buffer.slice(-2);
            return output;
          }
          buffer = buffer.slice(closeIndex + 3);
          insideStructuredFence = false;
          continue;
        }

        const lower = buffer.toLowerCase();
        const starts = STRUCTURED_FENCE_STARTS.flatMap((start) => {
          const index = lower.indexOf(start);
          return index >= 0 ? [{ index, start }] : [];
        }).sort((a, b) => a.index - b.index);
        const firstStart = starts[0];
        if (firstStart) {
          output += buffer.slice(0, firstStart.index);
          buffer = buffer.slice(firstStart.index + firstStart.start.length);
          insideStructuredFence = true;
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
      if (insideStructuredFence) {
        buffer = "";
        insideStructuredFence = false;
        return "";
      }
      const output = buffer;
      buffer = "";
      return output;
    },
  };
}
