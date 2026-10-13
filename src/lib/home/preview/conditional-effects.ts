import { splitNarrativeSentences } from "./narrative-sentences";

interface EffectAssertion {
  subject: string;
  strength: string;
  effect: string;
  scope: string | null;
  conditional: boolean;
  negated: boolean;
}

const EFFECT_PATTERN =
  /\b(outsized|disproportionate|dominant)\s+(factor|influence|impact|effect|weight|role)\b(?:\s+(?:in|on|for|over)\s+((?:[a-z][a-z-]*\s+){0,4}?(?:economics|revenue|profitability|costs|performance|outcomes)\b))?/g;
const NEGATIVE_CONCLUSION_PREFIX =
  /^(?:(?:(?:the|this|supplied|available)\s+)?(?:record|evidence|sources?)\s+(?:does|do)\s+not\s+(?:establish|show|prove|confirm)\s+(?:that\s+)?|no\s+evidence\s+(?:establishes|shows|proves|confirms)\s+(?:that\s+)?|(?:it\s+is\s+)?not\s+(?:established|shown|proven|confirmed)\s+(?:that|whether)\s+)/;
const DIRECT_EFFECT_PREFIX =
  /^(.+?)\s+(?:(could|may|might)\s+)?(?:(?:does|do)\s+)?(not(?:\s+only)?\s+)?(?:be|is|are|was|were|remain|remains|carry|carries|have|has|play|plays|exert|exerts|hold|holds)\s+(?:(not(?:\s+only)?)\s+)?(?:(a|an|the|no)\s+)?(?:(potentially|possibly)\s+)?$/;
const MAKE_EFFECT_PREFIX =
  /\b(could|may|might)\s+(not\s+)?make\s+(.+?)\s+(?:(a|an|the|no)\s+)?(?:(potentially|possibly)\s+)?$/;

function normalizeSubject(subject: string): string {
  return subject.trim().replace(/^(?:the|a|an)\s+/, "");
}

function assertionPrefix(
  prefix: string,
): Pick<EffectAssertion, "subject" | "conditional" | "negated"> | null {
  const negatedConclusion = NEGATIVE_CONCLUSION_PREFIX.test(prefix);
  const local = prefix.replace(NEGATIVE_CONCLUSION_PREFIX, "");
  const make = local.match(MAKE_EFFECT_PREFIX);
  if (make) {
    return {
      subject: normalizeSubject(make[3]),
      conditional: negatedConclusion || Boolean(make[1] || make[5]),
      negated: negatedConclusion || Boolean(make[2]) || make[4] === "no",
    };
  }
  const direct = local.match(DIRECT_EFFECT_PREFIX);
  if (!direct) return null;
  return {
    subject: normalizeSubject(direct[1]),
    conditional: negatedConclusion || Boolean(direct[2] || direct[6]),
    negated:
      negatedConclusion ||
      [direct[3], direct[4]].some((word) => word?.trim() === "not") ||
      direct[5] === "no",
  };
}

function effectAssertions(passage: string): EffectAssertion[] {
  const clauses = splitNarrativeSentences(passage.toLowerCase())
    .flatMap((sentence) =>
      sentence.split(
        /\n|;|,|\s+(?:but|whereas|while|yet|where)\s+|\s*[\u2013\u2014]\s*/,
      ),
    )
    .map((clause) =>
      clause
        .replace(/^\s*[-*]\s+/, "")
        .replace(/^\s*\*\*[^*]+:\*\*\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/\s+/g, " ")
        .trim(),
    );
  const assertions: EffectAssertion[] = [];
  for (const clause of clauses) {
    let previousEnd = 0;
    let previous: EffectAssertion | null = null;
    for (const match of clause.matchAll(EFFECT_PATTERN)) {
      let prefix = clause.slice(previousEnd, match.index);
      const coordinated = /^\s*(?:and|also)\s+/.test(prefix);
      prefix = prefix.replace(/^\s*(?:and|also)\s+/, "");
      const sharesOperator =
        previous &&
        coordinated &&
        /^(?:be|carry|have|play|exert|hold)\b/.test(prefix);
      // Explicitly coordinated predicates reuse their written subject, never an alias.
      if (
        previous &&
        coordinated &&
        /^(?:could|may|might|does|do|is|are|was|were|remains?|carr(?:y|ies)|ha(?:s|ve)|plays?|exerts?|holds?)\b/.test(
          prefix,
        )
      ) {
        prefix = `${previous.subject} ${prefix}`;
      }
      const parsed = assertionPrefix(prefix.trimStart());
      if (parsed && sharesOperator && previous) {
        parsed.conditional ||= previous.conditional;
        parsed.negated ||= previous.negated;
      }
      previousEnd = match.index! + match[0].length;
      const unknownScope =
        !match[3] && /^\s+(?:in|on|for|over)\b/.test(clause.slice(previousEnd));
      previous = parsed
        ? {
            ...parsed,
            strength: match[1],
            effect: match[2],
            scope: unknownScope
              ? null
              : (match[3] ?? "").replace(/^the\s+/, ""),
          }
        : null;
      if (previous) assertions.push(previous);
    }
  }
  return assertions;
}

/**
 * Covers conditional make clauses and explicit strong-effect be/have/carry/play assertions
 * with explicit effect language. Categorical support must retain literal subjects.
 * Effect nouns may vary within this bounded family; categorical support must match the noun
 * and any explicitly parsed scope. Unknown explicit scopes and other unrecognized wording
 * are outside this check's coverage; no scope expansion or equivalence is inferred.
 */
export function hasOverstatedConditionalEffects(
  passages: string[],
  citedStatements: string[],
): boolean {
  const sources = citedStatements.flatMap(effectAssertions);
  const conditional = sources.filter(
    (source) => source.conditional && !source.negated && source.scope !== null,
  );
  if (conditional.length === 0) return false;
  return passages.flatMap(effectAssertions).some((assertion) => {
    if (assertion.conditional || assertion.scope === null) return false;
    const related = (source: EffectAssertion) =>
      source.strength === assertion.strength;
    return (
      conditional.some(related) &&
      !sources.some(
        (source) =>
          related(source) &&
          source.subject === assertion.subject &&
          !source.conditional &&
          source.negated === assertion.negated &&
          source.effect === assertion.effect &&
          source.scope === assertion.scope,
      )
    );
  });
}
