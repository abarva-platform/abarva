import type {
  ExcludedNumericClaim,
  GovernedEvidenceItem,
} from "./types";

const EXPLICIT_EXCLUSION_RE =
  /\b(?:unsupported\s+(?:[\w-]+\s+){0,3}hypothesis|unverified(?:\s+(?:and\s+)?excluded)?|not\s+(?:(?:finance|financial)\s*[- ]?)?validated|not\s+approved(?:\s+for\s+(?:use|planning|the\s+business\s+case))?|explicitly\s+excluded)\b/i;
const MONEY_RE = /(?:\$\s*|\bUSD\s*)?\d[\d,]*(?:\.\d+)?\s*(?:k|m|bn|b|thousand|million|billion)?\b/gi;
const PERCENT_RANGE_RE =
  /\b\d+(?:\.\d+)?\s*%?\s*(?:-|\u2013|\u2014|\bto\b)\s*\d+(?:\.\d+)?\s*(?:%|percent)(?![A-Za-z])/gi;
const PERCENT_RE = /\b\d+(?:\.\d+)?\s*(?:%|percent)(?![A-Za-z])/gi;
const DATE_RE = /\b\d{4}-\d{2}-\d{2}\b/g;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compactNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

function groupThousands(value: number): string {
  return Math.round(value).toLocaleString("en-US");
}

function numberWords(value: number): string | null {
  const small = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
    "seventeen", "eighteen", "nineteen",
  ];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  if (!Number.isInteger(value) || value < 0 || value >= 1000) return null;
  if (value < 20) return small[value] ?? null;
  if (value < 100) {
    const remainder = value % 10;
    return `${tens[Math.floor(value / 10)]}${remainder ? `-${small[remainder]}` : ""}`;
  }
  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  const remainderWords = remainder < 20
    ? small[remainder]
    : `${tens[Math.floor(remainder / 10)]}${remainder % 10 ? `-${small[remainder % 10]}` : ""}`;
  return `${small[hundreds]} hundred${remainder ? ` ${remainderWords}` : ""}`;
}

function parseMoneyValue(sourceValue: string): {
  amount: number;
  suffix: string;
} | null {
  const normalized = sourceValue
    .replace(/^\s*(?:\$|USD)\s*/i, "")
    .trim()
    .match(/^(\d[\d,]*(?:\.\d+)?)\s*(k|m|bn|b|thousand|million|billion)?$/i);
  if (!normalized) return null;
  const numeric = Number(normalized[1]?.replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return null;
  const suffix = (normalized[2] ?? "").toLowerCase();
  const multiplier = suffix === "k" || suffix === "thousand"
    ? 1_000
    : suffix === "m" || suffix === "million"
      ? 1_000_000
      : suffix === "b" || suffix === "bn" || suffix === "billion"
        ? 1_000_000_000
        : 1;
  return { amount: numeric * multiplier, suffix };
}

function moneyPatterns(sourceValue: string): string[] {
  const parsed = parseMoneyValue(sourceValue);
  if (!parsed) return [escapeRegExp(sourceValue)];
  const { amount, suffix } = parsed;
  const scale = suffix === "k" || suffix === "thousand"
    ? 1_000
    : suffix === "m" || suffix === "million"
      ? 1_000_000
      : suffix === "b" || suffix === "bn" || suffix === "billion"
        ? 1_000_000_000
        : 1;
  const scaled = compactNumber(amount / scale);
  const scaledWhole = Math.floor(amount / scale);
  const magnitude = suffix === "k" || suffix === "thousand"
    ? "(?:k|thousand)"
    : suffix === "m" || suffix === "million"
      ? "(?:m|million)"
      : suffix === "b" || suffix === "bn" || suffix === "billion"
        ? "(?:b|bn|billion)"
        : "";
  const scaledDigits = Number.isInteger(amount / scale)
    ? `${escapeRegExp(scaled)}(?:\\.0+)?`
    : escapeRegExp(scaled).replace(/\\\./g, "\\s*\\.?\\s*");
  const fullDigits = `${escapeRegExp(groupThousands(amount)).replace(/,/g, "[,\\s]?")}(?:\\.0+)?`;
  const compactForms = magnitude
    ? `${scaledDigits}\\s*${magnitude}`
    : escapeRegExp(compactNumber(amount));
  const fullForms = `${fullDigits}|${Math.round(amount)}`;
  const word = numberWords(scaledWhole);
  const wordForm = word && magnitude
    ? `${escapeRegExp(word).replace(/\\-/g, "[-\\s]*")}\\s*${magnitude}`
    : "";
  const forms = [compactForms, fullForms, wordForm].filter(Boolean).join("|");
  return [
    `(?:\\$\\s*(?:${forms})|\\b(?:USD\\s*)?(?:${forms})(?:\\s*(?:USD|dollars?))?\\b)`,
  ];
}

function percentRangePattern(sourceValue: string): string {
  const values = sourceValue.match(/\d+(?:\.\d+)?/g) ?? [];
  if (values.length < 2) return escapeRegExp(sourceValue);
  const [start, end] = values;
  const sep = "(?:-|\\u2013|\\u2014|\\bto\\b)";
  const startWords = numberWords(Number(start));
  const endWords = numberWords(Number(end));
  const numeric = `${escapeRegExp(start ?? "")}\\s*%?\\s*${sep}\\s*${escapeRegExp(end ?? "")}\\s*(?:%|percent)`;
  const reversedPercent = `${escapeRegExp(start ?? "")}\\s*%\\s*${sep}\\s*${escapeRegExp(end ?? "")}\\s*%`;
  const words = startWords && endWords
    ? `${escapeRegExp(startWords)}\\s*(?:-|\\u2013|\\u2014|\\bto\\b)\\s*${escapeRegExp(endWords)}\\s*percent`
    : "";
  return `(?:${[numeric, reversedPercent, words].filter(Boolean).join("|")})`;
}

function splitEvidenceClauses(statement: string): string[] {
  return statement.split(/;|\n+|(?<=[.!?])\s+(?=[A-Z$])/).map((part) => part.trim()).filter(Boolean);
}

function tokenHasNearestExclusion(
  clause: string,
  index: number,
  length: number,
): boolean {
  const start = Math.max(0, index - 80);
  const end = Math.min(clause.length, index + length + 80);
  const context = clause.slice(start, end);
  const tokenStart = index - start;
  const distanceToNearest = (pattern: RegExp): number => {
    let nearest = Number.POSITIVE_INFINITY;
    const globalPattern = new RegExp(
      pattern.source,
      pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`,
    );
    for (const match of context.matchAll(globalPattern)) {
      if (match.index === undefined) continue;
      const matchEnd = match.index + match[0].length;
      const distance = tokenStart < match.index
        ? match.index - tokenStart
        : tokenStart > matchEnd
          ? tokenStart - matchEnd
          : 0;
      nearest = Math.min(nearest, distance);
    }
    return nearest;
  };
  const excludedDistance = distanceToNearest(EXPLICIT_EXCLUSION_RE);
  const validatedDistance = distanceToNearest(
    /\b(?:(?:finance|financial)\s*[- ]\s*validated|validated\s+(?:value|benefit|savings?|baseline)|confirmed\s+(?:value|benefit|savings?|baseline))\b/gi,
  );
  return excludedDistance < validatedDistance;
}

function makeClaim(
  evidence: GovernedEvidenceItem,
  kind: ExcludedNumericClaim["kind"],
  sourceValue: string,
  matchPatterns: string[],
): ExcludedNumericClaim {
  return {
    citationNumber: evidence.citationNumber,
    sourceLabel: evidence.label,
    kind,
    matchPatterns: Array.from(new Set(matchPatterns)),
    sourceValue,
  };
}

/** Extract only numeric values in clauses that explicitly mark the claim excluded. */
export function extractExcludedNumericClaims(
  evidence: readonly GovernedEvidenceItem[],
): ExcludedNumericClaim[] {
  const claims: ExcludedNumericClaim[] = [];
  for (const item of evidence) {
    for (const clause of splitEvidenceClauses(item.statement)) {
      if (!EXPLICIT_EXCLUSION_RE.test(clause)) continue;
      const ranges: Array<{ start: number; end: number }> = [];
      for (const match of clause.matchAll(PERCENT_RANGE_RE)) {
        if (match.index === undefined) continue;
        if (!tokenHasNearestExclusion(clause, match.index, match[0].length)) continue;
        ranges.push({ start: match.index, end: match.index + match[0].length });
        claims.push(makeClaim(item, "percentage", match[0], [percentRangePattern(match[0])]));
      }
      for (const match of clause.matchAll(MONEY_RE)) {
        if (match.index === undefined || !match[0].trim()) continue;
        if (!tokenHasNearestExclusion(clause, match.index, match[0].length)) continue;
        const raw = match[0].trim();
        const hasCurrencyMarker = /^\s*(?:\$|USD\b)/i.test(raw);
        const hasScale = /(?:k|m|bn|b|thousand|million|billion)\s*$/i.test(raw);
        if (!hasCurrencyMarker && !(hasScale && /\b(?:value|benefit|savings?|cost|funding|investment|finance|ROI)\b/i.test(clause))) {
          continue;
        }
        claims.push(makeClaim(item, "currency", raw, moneyPatterns(raw)));
      }
      for (const match of clause.matchAll(PERCENT_RE)) {
        if (match.index === undefined) continue;
        if (!tokenHasNearestExclusion(clause, match.index, match[0].length)) continue;
        const end = match.index + match[0].length;
        if (ranges.some((range) => match.index! >= range.start && end <= range.end)) continue;
        claims.push(makeClaim(item, "percentage", match[0], [escapeRegExp(match[0])]));
      }
      for (const match of clause.matchAll(DATE_RE)) {
        if (match.index === undefined || !tokenHasNearestExclusion(clause, match.index, match[0].length)) continue;
        claims.push(makeClaim(item, "date", match[0], [escapeRegExp(match[0])]));
      }
    }
  }
  return claims;
}

function claimMatchIsRelevant(
  text: string,
  index: number,
  matchedText: string,
  claim: ExcludedNumericClaim,
): boolean {
  if (claim.kind !== "currency") return true;
  if (/\$|\bUSD\b|\bdollars?\b/i.test(matchedText)) return true;
  const leftBoundary = Math.max(
    text.lastIndexOf(";", index),
    text.lastIndexOf("\n", index),
    text.lastIndexOf(".", index),
    text.lastIndexOf("!", index),
    text.lastIndexOf("?", index),
  );
  const rightCandidates = [";", "\n", ".", "!", "?"]
    .map((delimiter) => text.indexOf(delimiter, index + matchedText.length))
    .filter((boundary) => boundary >= 0);
  const rightBoundary = rightCandidates.length
    ? Math.min(...rightCandidates)
    : text.length;
  const nearby = text.slice(leftBoundary + 1, rightBoundary);
  return /\b(?:annual\s+)?(?:value|benefit|savings?|cost|funding|investment|ROI|return|finance|hypothesis|business case)\b/i.test(nearby);
}

/** Return claims that appear in generated content, including cited/disclaimed claims. */
export function findExcludedNumericClaims(
  text: string,
  claims: readonly ExcludedNumericClaim[],
): ExcludedNumericClaim[] {
  const found = new Map<string, ExcludedNumericClaim>();
  for (const claim of claims) {
    for (const source of claim.matchPatterns) {
      const pattern = new RegExp(source, "gi");
      for (const match of text.matchAll(pattern)) {
        if (match.index === undefined) continue;
        if (claimMatchIsRelevant(text, match.index, match[0], claim)) {
          found.set(`${claim.citationNumber}:${claim.sourceValue}`, claim);
          break;
        }
      }
      if (found.has(`${claim.citationNumber}:${claim.sourceValue}`)) break;
    }
  }
  return Array.from(found.values());
}

/** Remove excluded values from model-facing evidence while retaining its citation and status. */
export function redactExcludedNumericClaims(
  text: string,
  claims: readonly ExcludedNumericClaim[],
): string {
  return claims.reduce((redacted, claim) => {
    const patterns = claim.matchPatterns.map((source) => new RegExp(source, "gi"));
    return patterns.reduce((value, pattern) =>
      value.replace(pattern, (match, offset: number, original: string) =>
        claimMatchIsRelevant(original, offset, match, claim)
          ? "[excluded numeric value omitted]"
          : match,
      ), redacted);
  }, text);
}
