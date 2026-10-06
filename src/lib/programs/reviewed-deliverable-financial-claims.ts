const EXPLICIT_CURRENCY_AMOUNT =
  /(\b(?:USD|EUR|GBP|CAD|AUD)\b|[$€£¥])\s*([\d][\d,]*(?:\.\d+)?)\s*(K|M|B|THOUSAND|MILLION|BILLION)?\b/gi;

const CURRENCY_CODES: Record<string, string> = {
  "$": "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
};

const SCALE: Record<string, number> = {
  K: 1_000,
  THOUSAND: 1_000,
  M: 1_000_000,
  MILLION: 1_000_000,
  B: 1_000_000_000,
  BILLION: 1_000_000_000,
};

interface FinancialAmount {
  key: string;
  display: string;
  affirmed: boolean;
}

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function isAffirmedFinancialClaim(sentence: string): boolean {
  const domain =
    /\b(finance|financial|savings?|benefits?|roi|returns?|value|costs?|revenue|margin)\b/i.test(
      sentence,
    );
  const affirmed =
    /\b(confirmed|validated|realized|realised|approved|actual|guaranteed)\b/i.test(
      sentence,
    );
  const qualified =
    /\b(no|not|never|unvalidated|unconfirmed|unapproved|unrealized|unrealised|hypothesis|hypothesized|assumption|pending)\b/i.test(
      sentence,
    );
  return domain && affirmed && !qualified;
}

function financialAmounts(text: string): FinancialAmount[] {
  const results: FinancialAmount[] = [];
  for (const sentence of sentences(text)) {
    EXPLICIT_CURRENCY_AMOUNT.lastIndex = 0;
    for (const match of sentence.matchAll(EXPLICIT_CURRENCY_AMOUNT)) {
      const currency = CURRENCY_CODES[match[1]!] ?? match[1]!.toUpperCase();
      const amount = Number(match[2]!.replaceAll(",", ""));
      const scale = SCALE[(match[3] ?? "").toUpperCase()] ?? 1;
      if (!Number.isFinite(amount)) continue;
      results.push({
        key: `${currency}:${(amount * scale).toFixed(2)}`,
        display: match[0].trim(),
        affirmed: isAffirmedFinancialClaim(sentence),
      });
    }
  }
  return results;
}

/**
 * Finds explicit currency figures or strengthened financial assertions that
 * were not present in the generated source. Human approval of a deliverable
 * does not itself validate a new financial fact.
 */
export function findUnsupportedFinancialClaimDeltas(
  generatedSource: string,
  reviewedContent: string,
): string[] {
  const sourceClaims = financialAmounts(generatedSource);
  const sourceAmounts = new Set(sourceClaims.map((claim) => claim.key));
  const sourceAffirmedAmounts = new Set(
    sourceClaims.filter((claim) => claim.affirmed).map((claim) => claim.key),
  );
  const unsupported: string[] = [];

  for (const claim of financialAmounts(reviewedContent)) {
    if (
      !sourceAmounts.has(claim.key) ||
      (claim.affirmed && !sourceAffirmedAmounts.has(claim.key))
    ) {
      unsupported.push(claim.display);
    }
  }

  return [...new Set(unsupported)];
}
