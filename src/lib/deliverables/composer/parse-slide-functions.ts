/**
 * Parse per-slide Python functions out of a code-call response.
 *
 * NOT JSON. Asking for Python inside a JSON string doubles its token cost — every
 * newline becomes \n, every quote is escaped — and a 5-slide batch blew a 28,000
 * token ceiling purely on escaping. It also makes a single stray backslash
 * unparseable, which throws away an otherwise complete batch.
 *
 * Fenced blocks with an explicit slide marker cost what the code costs, and a
 * malformed block loses one slide instead of the batch.
 */

export interface ParsedSlideFunction {
  slideId: string;
  code: string;
}

export interface ParseResult {
  functions: ParsedSlideFunction[];
  /** Markers with no usable fenced block behind them. */
  unparsed: string[];
}

const MARKER = /^###\s*SLIDE\s+([A-Za-z0-9_-]+)\s*$/gm;

export function parseSlideFunctions(response: string): ParseResult {
  const functions: ParsedSlideFunction[] = [];
  const unparsed: string[] = [];

  const markers = [...response.matchAll(MARKER)];
  for (let i = 0; i < markers.length; i++) {
    const slideId = markers[i][1];
    const start = markers[i].index! + markers[i][0].length;
    const end = i + 1 < markers.length ? markers[i + 1].index! : response.length;
    const segment = response.slice(start, end);

    // Take the first fenced block in the segment. A trailing unterminated fence
    // is a truncated response, and half a function is worse than none: it would
    // assemble into a module that fails at import with a syntax error miles from
    // the actual cause.
    const fence = segment.match(/```(?:python)?\s*\n([\s\S]*?)\n```/);
    const code = fence?.[1];
    if (!code || !/^\s*def\s+\w+\s*\(/m.test(code)) {
      unparsed.push(slideId);
      continue;
    }
    functions.push({ slideId, code });
  }

  return { functions, unparsed };
}
