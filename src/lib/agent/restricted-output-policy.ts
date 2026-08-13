export interface RestrictedOutputPolicyLike {
  outputPolicy: {
    exactFinancialValues: boolean;
    restrictedSourceIds?: boolean;
  };
}

// The magnitude alternation is ordered longest-first, and the space before it is
// only consumed when a unit actually follows. Both matter:
//   - with `m` ahead of `million`, "$5 million" matched only "$5 m" and left
//     "illion" behind — a corrupted line that still disclosed the magnitude;
//   - with the space outside the optional group, "$8 of value" matched "$8 "
//     and produced "[restricted financial value]of value".
const MONEY_PATTERN =
  /\$\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:million|billion|mm|bn|k|m|b))?/gi;
const FINANCIAL_NUMERIC_PATTERN =
  /\b\d+(?:\.\d+)?\s?(?:%|bps|bp|x)(?=(?:[^.\n]{0,80})\b(?:budget|spend|spent|cost|costs|saving|savings|revenue|margin|roi|irr|npv|payback|business case|financial|mlr|denial rate|days in ar|loss ratio|premium|collections?)\b)/gi;
const FINANCIAL_KEYWORD_PATTERN =
  /\b(?:budget|spend|spent|cost take-?out|run[- ]rate|savings?|revenue|margin|roi|irr|npv|payback|business case|capex|opex|financial model|days in ar|denial rate|mlr|medical loss ratio)\b/i;
const RESTRICTED_SOURCE_ID_PATTERN =
  /\b(?:fin|financial|budget|spend|business-case|kpi|restricted)[_:.-][a-z0-9_:.-]+\b/gi;
const MONEY_TEST_PATTERN =
  /\$\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:million|billion|mm|bn|k|m|b))?/i;
const FINANCIAL_NUMERIC_TEST_PATTERN =
  /\b\d+(?:\.\d+)?\s?(?:%|bps|bp|x)(?=(?:[^.\n]{0,80})\b(?:budget|spend|spent|cost|costs|saving|savings|revenue|margin|roi|irr|npv|payback|business case|financial|mlr|denial rate|days in ar|loss ratio|premium|collections?)\b)/i;

export function sanitizeRestrictedFinancialText(text: string, policy: RestrictedOutputPolicyLike | null | undefined): string {
  if (!text || policy?.outputPolicy.exactFinancialValues) return text;

  return text
    .replace(MONEY_PATTERN, '[restricted financial value]')
    .replace(FINANCIAL_NUMERIC_PATTERN, '[restricted financial metric]')
    .replace(RESTRICTED_SOURCE_ID_PATTERN, '[restricted source]');
}

/**
 * A money token that may still be mid-emission at the end of a streamed chunk —
 * `$`, then any digits/separators, then up to three trailing letters (`k`, `mm`,
 * `bn`, the start of `million`). Anchored to the end of the buffer.
 */
const PARTIAL_MONEY_TAIL_PATTERN = /\$\s?[\d,]*\.?\d*\s?[a-z]{0,3}$/i;

/** Never hold back more than this, so a stray `$` cannot stall the stream. */
const MAX_HELD_TAIL_CHARS = 48;

export interface RestrictedFinancialTextStreamer {
  /** Sanitize what is safe to emit now, holding back any partial money token. */
  push(text: string): string;
  /** Sanitize and return whatever was still held back. Call once at stream end. */
  flush(): string;
}

/**
 * Redaction that survives streaming.
 *
 * `sanitizeRestrictedFinancialText` is correct on a complete string, but the
 * agent route applies it to each streamed delta independently. Claude emits a
 * money value across several deltas, so `$22.1K` can arrive as `$22` then `.1K`:
 * the first delta is redacted, the second has no `$` to match and streams
 * through untouched. Live-observed output: `[restricted financial value].1K` —
 * digits of a restricted value reaching a user not entitled to see them.
 *
 * This streamer closes that boundary. It holds back a trailing fragment that
 * could still grow into a money token and re-tests it once the next delta
 * arrives, so redaction always sees the whole token. The hold-back is capped so
 * a lone `$` in prose can never stall output, and `flush()` must be called when
 * the stream ends so a value at the very end is not lost.
 */
export function createRestrictedFinancialTextStreamer(
  policy: RestrictedOutputPolicyLike | null | undefined,
): RestrictedFinancialTextStreamer {
  // Nothing is redacted for entitled users, so stream through untouched.
  if (policy?.outputPolicy.exactFinancialValues) {
    return { push: (text) => text, flush: () => "" };
  }

  let held = "";

  return {
    push(text: string): string {
      const combined = held + text;
      const match = PARTIAL_MONEY_TAIL_PATTERN.exec(combined);
      const holdFrom =
        match && combined.length - match.index <= MAX_HELD_TAIL_CHARS
          ? match.index
          : combined.length;

      held = combined.slice(holdFrom);
      const emit = combined.slice(0, holdFrom);
      return emit ? sanitizeRestrictedFinancialText(emit, policy) : "";
    },
    flush(): string {
      if (!held) return "";
      const remaining = sanitizeRestrictedFinancialText(held, policy);
      held = "";
      return remaining;
    },
  };
}

export function summarizeFinancialValueForPrompt(
  label: string,
  value: string | number | null | undefined,
  policy: RestrictedOutputPolicyLike | null | undefined,
): string {
  if (value === null || value === undefined || value === '') return '';
  if (policy?.outputPolicy.exactFinancialValues) return `${label}: ${value}`;
  return `${label}: restricted financial value available for risk/readiness reasoning only`;
}

export function shouldSuppressFinancialLine(
  line: string,
  policy: RestrictedOutputPolicyLike | null | undefined,
): boolean {
  if (policy?.outputPolicy.exactFinancialValues) return false;
  return FINANCIAL_KEYWORD_PATTERN.test(line) && (MONEY_TEST_PATTERN.test(line) || FINANCIAL_NUMERIC_TEST_PATTERN.test(line));
}

export function formatRestrictedOutputPolicyForPrompt(policy: RestrictedOutputPolicyLike | null | undefined): string {
  if (!policy || policy.outputPolicy.exactFinancialValues) return '';
  return [
    'RESTRICTED OUTPUT FIREWALL:',
    '- The user is not entitled to exact restricted financial values.',
    '- You may use financial-sensitive context only to form qualitative judgments such as small/material/high-exposure, ahead/behind, or CFO-grade evidence required.',
    '- Do not reveal budgets, spend, revenue, margins, ROI, NPV, IRR, payback, business-case dollars, sensitive KPI values, or restricted financial source IDs.',
    '- If asked directly for financial values, refuse the exact value and offer a non-numeric risk/readiness summary instead.',
    '- Apply the same restriction to generated charters, business cases, meeting notes, gate summaries, exports, and deliverables.',
  ].join('\n');
}
