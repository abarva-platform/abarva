import type { GovernedEvidenceItem, RequiredEvidenceSignal } from "./types";

const SIGNAL_NUMBER_RE =
  /(?:\$\s?\d[\d,]*(?:\.\d+)?[kmb]?\b|\b\d{1,3}(?:,\d{3})+\b|\b\d+\s+of\s+\d+\b|\b\d+(?:\.\d+)?\s?%|\b\d+(?:\.\d+)?[- ]?(?:day|week|month|year|hour|minute)s?\b|\bzero\b)/i;
const SIGNAL_KEYWORD_RE =
  /\b(baseline|metric|rate|coverage|gap|gaps|volume|count|open|unversioned|unmonitored|risk|cost|value|lead[- ]?time|cycle[- ]?time|throughput|sla|availability|mttr|failure|retention|vacant|validated|unvalidated|owner|interfaces?|channels?)\b/i;
const SIGNAL_PRIORITY_RE =
  /\b(closure|care[- ]?gap|baseline|unversioned|unmonitored|shadow|zero|unvalidated|lead[- ]?time|vacant)\b/i;
const QUALITATIVE_SIGNAL_RE =
  /\b(scope|caveat|design[- ]?only|excluded|exception|owner|vacant|declined|retired|monitoring plan|shadow|unvalidated)\b/i;

const SIGNAL_THEMES: ReadonlyArray<{ key: string; pattern: RegExp }> = [
  { key: "closure_rate", pattern: /\b(closure\s+rate|care[- ]?gap\s+closure)\b/i },
  { key: "care_gap_volume", pattern: /\b(care[- ]?gap|open\s+gaps?|volume|backlog)\b/i },
  { key: "interface_unversioned", pattern: /\b(unversioned|not\s+under\s+source\s+control)\b/i },
  { key: "interface_unmonitored", pattern: /\b(unmonitored|monitoring\s+(?:coverage|gap)|without\s+monitoring)\b/i },
  { key: "shadow_ownership", pattern: /\bshadow\b/i },
  { key: "scope_caveat", pattern: /\b(scope|caveat|design[- ]?only|excluded|exception|weekly\s+feed)\b/i },
  { key: "prior_ai_governance", pattern: /\b(retired|declined|sepsis|readmission|monitoring\s+plan)\b/i },
  { key: "ownership_gap", pattern: /\b(vacant|owner|ownership|lead)\b/i },
  { key: "value_discipline", pattern: /\b(zero|unvalidated|value|benefit|finance|actuary)\b/i },
];

function normalizeSignalText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}%$.,]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function signalTokens(value: string): string[] {
  const tokens = normalizeSignalText(value).match(
    /[$]?\d[\d,]*(?:\.\d+)?%?|\b[a-z][a-z0-9-]{3,}\b|\bzero\b/g,
  );
  if (!tokens) return [];
  const stop = new Set([
    "from",
    "with",
    "this",
    "that",
    "into",
    "only",
    "must",
    "have",
    "been",
    "will",
    "should",
    "client",
    "evidence",
    "source",
  ]);
  return Array.from(new Set(tokens.filter((t) => !stop.has(t))));
}

export function carriesRequiredEvidenceSignal(
  body: string,
  label: string,
  statement: string,
): boolean {
  const normalizedBody = normalizeSignalText(body);
  const allTokens = signalTokens(`${label} ${statement}`);
  const numericTokens = allTokens.filter((t) => /[$]?\d|%|\bzero\b/i.test(t));
  if (
    numericTokens.length > 0 &&
    !numericTokens.every((t) =>
      normalizedBody.includes(normalizeSignalText(t)),
    )
  ) {
    return false;
  }
  const descriptiveTokens = allTokens.filter(
    (t) => !/[$]?\d|%|\bzero\b/i.test(t),
  );
  const matchedDescriptors = descriptiveTokens.filter((t) =>
    normalizedBody.includes(normalizeSignalText(t)),
  ).length;
  if (numericTokens.length > 0) {
    return (
      descriptiveTokens.length === 0 ||
      matchedDescriptors >= Math.min(2, descriptiveTokens.length)
    );
  }
  return (
    descriptiveTokens.length > 0 &&
    matchedDescriptors >= Math.min(3, descriptiveTokens.length)
  );
}

function signalScore(evidence: GovernedEvidenceItem): number {
  const haystack = `${evidence.label} ${evidence.statement}`;
  const hasNumber = SIGNAL_NUMBER_RE.test(haystack);
  const hasMetricSignal = hasNumber && SIGNAL_KEYWORD_RE.test(haystack);
  const hasQualitativeSignal = QUALITATIVE_SIGNAL_RE.test(haystack);
  if (!hasMetricSignal && !hasQualitativeSignal) {
    return 0;
  }
  let score = 1;
  if (/\b\d+(?:\.\d+)?\s?%/.test(haystack)) score += 4;
  if (/\b\d{1,3}(?:,\d{3})+\b/.test(haystack)) score += 3;
  if (/\$\s?\d/.test(haystack)) score += 2;
  if (SIGNAL_PRIORITY_RE.test(haystack)) score += 5;
  if (!hasNumber && hasQualitativeSignal) score += 4;
  if (evidence.confidence === "high") score += 2;
  else if (evidence.confidence === "medium") score += 1;
  return score;
}

function signalTheme(evidence: GovernedEvidenceItem): string | null {
  const haystack = `${evidence.label} ${evidence.statement}`;
  return SIGNAL_THEMES.find((theme) => theme.pattern.test(haystack))?.key ?? null;
}

export function selectRequiredEvidenceSignals(
  evidence: readonly GovernedEvidenceItem[],
  limit = 12,
): RequiredEvidenceSignal[] {
  const seen = new Set<string>();
  const candidates = evidence
    .map((item) => ({ item, score: signalScore(item) }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) => b.score - a.score || a.item.citationNumber - b.item.citationNumber,
    );
  const picked = new Set<GovernedEvidenceItem>();
  const themed = SIGNAL_THEMES.flatMap((theme) => {
    const match = candidates.find(({ item }) => !picked.has(item) && signalTheme(item) === theme.key);
    if (!match) return [];
    picked.add(match.item);
    return [match];
  });
  const remainder = candidates.filter(({ item }) => !picked.has(item));

  return [...themed, ...remainder]
    .map(({ item }) => {
      const key = normalizeSignalText(
        `${item.citationNumber} ${item.label} ${item.statement}`,
      )
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 96);
      return {
        key,
        statement: item.statement,
        citationNumber: item.citationNumber,
        label: item.label,
      };
    })
    .filter((signal) => {
      const key = normalizeSignalText(signal.statement);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}
