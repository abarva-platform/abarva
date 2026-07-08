// Global aVa Product Truth + Scope Guard — third-party replacement guard.
//
// AbarVa augments expertise; it does not replace or certify against named
// research firms, Big Four/major consultancies, or named competitor
// platforms. Deterministic pattern scan, same shape as the voice-doctrine
// banned-pattern lists.

import type { ProductTruthViolation } from "./types";

const NAMED_THIRD_PARTIES: readonly RegExp[] = [
  /\bgartner\b/i,
  /\bforrester\b/i,
  /\bbig four\b/i,
  /\bmckinsey\b/i,
  /\bbain\b/i,
  /\bbcg\b|\bboston consulting group\b/i,
  /\bdeloitte\b/i,
  /\baccenture\b/i,
  /\bpwc\b|\bpricewaterhousecoopers\b/i,
  /\bey\b|\bernst\s*&?\s*young\b/i,
  /\bkpmg\b/i,
];

const REPLACEMENT_OR_CERTIFICATION_FRAMING: readonly RegExp[] = [
  /\breplaces?\b/i,
  /\bcertifies?( against| to)?\b/i,
  /\bequivalent to\b/i,
  /\boutperforms?\b/i,
  /\bno (longer )?need(s)? (a |your )?/i,
  /\bmakes? .*(obsolete|unnecessary)\b/i,
];

export function checkThirdPartyReplacementClaims(text: string): ProductTruthViolation[] {
  const violations: ProductTruthViolation[] = [];
  const namedMatch = NAMED_THIRD_PARTIES.map((pattern) => text.match(pattern)).find(
    (m): m is RegExpMatchArray => m !== null,
  );
  if (!namedMatch) return violations;

  const framingMatch = REPLACEMENT_OR_CERTIFICATION_FRAMING.map((pattern) =>
    text.match(pattern),
  ).find((m): m is RegExpMatchArray => m !== null);

  if (framingMatch) {
    violations.push({
      category: "third_party_replacement_claim",
      id: "third-party-replacement-1",
      matchedText: `${namedMatch[0]} … ${framingMatch[0]}`,
      detail:
        "Never claim AbarVa replaces, certifies against, or outperforms a named research firm or consultancy. Cite it as external context only, or omit the claim.",
    });
  }

  return violations;
}
