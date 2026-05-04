// Value parsing + legacy extraction helpers for Strategic Moves value-at-stake.

export interface ParsedUsdRange {
  low: number;
  high: number;
}

function parseUsdToken(token: string): number | null {
  const normalized = token.replace(/,/g, '').trim();
  const match = normalized.match(/\$?\s*(-?\d+(?:\.\d+)?)\s*([kmb])?/i);
  if (!match) return null;
  const base = Number(match[1]);
  if (!Number.isFinite(base)) return null;
  const suffix = (match[2] ?? '').toLowerCase();
  const multiplier =
    suffix === 'b' ? 1_000_000_000
    : suffix === 'm' ? 1_000_000
    : suffix === 'k' ? 1_000
    : 1;
  return base * multiplier;
}

export function parseUsdRangeFromText(text: string | null | undefined): ParsedUsdRange | null {
  if (typeof text !== 'string' || text.trim().length === 0) return null;
  const rangeMatch = text.match(
    /\$?\s*(-?\d+(?:\.\d+)?)\s*([kmb])?\s*(?:-|to|–|—)\s*\$?\s*(-?\d+(?:\.\d+)?)\s*([kmb])?/i,
  );
  if (rangeMatch) {
    const left = parseUsdToken(`${rangeMatch[1]}${rangeMatch[2] ?? ''}`);
    const right = parseUsdToken(`${rangeMatch[3]}${rangeMatch[4] ?? ''}`);
    if (left !== null && right !== null) {
      const low = Math.min(left, right);
      const high = Math.max(left, right);
      return { low, high };
    }
  }

  const tokens = text.match(/\$?\s*-?\d+(?:,\d{3})*(?:\.\d+)?\s*[kmb]?/gi) ?? [];
  const values = tokens
    .map((token) => parseUsdToken(token))
    .filter((value): value is number => value !== null && value > 0);

  if (values.length === 0) return null;
  if (values.length === 1) {
    return { low: values[0], high: values[0] };
  }

  const low = Math.min(...values);
  const high = Math.max(...values);
  return { low, high };
}

export function extractProjectedValueFromLegacyBaseline(
  baselineMetrics: Record<string, unknown> | null | undefined,
): ParsedUsdRange | null {
  if (!baselineMetrics) return null;

  const directSavings = baselineMetrics.savings_usd;
  if (typeof directSavings === 'number' && Number.isFinite(directSavings) && directSavings > 0) {
    return { low: directSavings, high: directSavings };
  }

  const items = Array.isArray(baselineMetrics.items)
    ? (baselineMetrics.items as Array<Record<string, unknown>>)
    : [];
  for (const item of items) {
    const candidates = [item.savings_usd, item.baseline_value, item.actual_value];
    for (const candidate of candidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate > 0) {
        return { low: candidate, high: candidate };
      }
      if (typeof candidate === 'string') {
        const parsed = parseUsdRangeFromText(candidate);
        if (parsed) return parsed;
      }
    }
  }

  return null;
}

