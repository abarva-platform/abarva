import { splitNarrativeSentences } from "./narrative-sentences";

const ENTERPRISE_SCOPE =
  /\b(?:enterprise[- ]wide|entire enterprise|whole enterprise)\b/i;
const VALUE_VALIDATION =
  /\b(?:finance[- ]validated|financial(?:ly)?[- ]validat\w*|benefit\w*|value)\b/i;
const FINANCE_VALIDATION =
  /\b(?:finance[- ]validated|financial(?:ly)?[- ]validat\w*)\b/i;
const ABSENCE =
  /\bno\b[^.!?]{0,180}\b(?:programs?|programmes?|initiatives?|Moves?|baselines?|evidence)\b[^.!?]{0,100}\b(?:exist\w*|available|loaded|tracked)\b|\b(?:programs?|programmes?|initiatives?|Moves?|baselines?|evidence)\b[^.!?]{0,80}\b(?:does not exist|do not exist|absent|nonexistent|not tracked)\b/i;
const BOUNDED_ABSENCE =
  /\b(?:in|within|from)\s+(?:(?:this|the|current|supplied|available|selected)\s+)+(?:Home\s+)?(?:record|evidence|context|bundle)\b|\bin Home\b|\ball\s+\d+\s+declared\s+(?:vendor\s+)?contracts?\b/i;
const ENTERPRISE_ABSENCE =
  /\b(?:anywhere|across|throughout|in)\s+(?:the\s+)?(?:entire\s+|whole\s+)?enterprise\b|\b(?:exist\w*|available|loaded|tracked|absent|nonexistent)\b[^;]*\benterprise[- ]wide\b/i;
const INTERNAL_CONTROL =
  /\b(?:outside|beyond)\s+(?:our\s+|the\s+)?internal control\b/i;
const NEGATED_INTERNAL_CONTROL =
  /\bnot\s+(?:outside|beyond)\s+(?:our\s+|the\s+)?internal control\b/i;

const FINITE_PREDICATE = String.raw`(?:is|are|was|were|remains?|has|have|had|does|do|did|can|cannot|can't|doesn't|don't|didn't|exists?|establishes|proves|shows|confirms|supports|demonstrates|describes|implies|sits?|flows?)`;
const ASSERTION_START = String.raw`(?:(?!(?:and|or|nor|but|yet|because)\b)[a-z0-9%.'-]+\s+)*?${FINITE_PREDICATE}\b`;
const COORDINATED_ASSERTION = new RegExp(
  String.raw`(?:,\s*|\s+(?:and|or|nor|yet)\s+)(?=${ASSERTION_START})`,
  "gi",
);
const EARLIER_PREDICATE = new RegExp(String.raw`\b${FINITE_PREDICATE}\b`, "i");
const NEGATED_INFERENCE =
  /\b(?:(?:does|do|did)\s+not|doesn't|don't|didn't|cannot|can\s+not|can't)\s+(?:yet\s+)?(?:establish|prove|show|demonstrate|confirm|support|imply)\b/i;
const NEGATED_VALIDATION =
  /\b(?:is|are|was|were|remains?)\s+not\s+(?:(?:yet|independently|necessarily)\s+)*(?:established|proven|proved|shown|demonstrated|confirmed|supported|validated|finance[- ]validated|financial(?:ly)?[- ]validated|enterprise[- ]wide|(?:the\s+)?(?:entire|whole)\s+enterprise)\b/i;

function coordinatedClauses(clause: string): string[] {
  const clauses: string[] = [];
  let start = 0;
  for (const boundary of clause.matchAll(COORDINATED_ASSERTION)) {
    const preceding = clause.slice(start, boundary.index);
    // A noun list before its first predicate still shares that predicate and its polarity.
    if (!EARLIER_PREDICATE.test(preceding)) continue;
    clauses.push(preceding);
    start = boundary.index! + boundary[0].length;
  }
  clauses.push(clause.slice(start));
  return clauses;
}

function assertionClauses(passage: string): string[] {
  return splitNarrativeSentences(passage).flatMap((sentence) =>
    sentence
      .replace(/^\s*[-*]\s+/, "")
      .replace(/\*\*[^*]+:\*\*/g, "")
      .replace(/\*\*/g, "")
      .split(/\n|;|,?\s+(?:but|whereas|while|however|therefore|so|because)\s+/i)
      .flatMap(coordinatedClauses)
      .map((clause) => clause.replace(/\s+/g, " ").trim())
      .filter(Boolean),
  );
}

function hasNegatedEvidenceConclusion(clause: string): boolean {
  const predicate = clause.match(NEGATED_INFERENCE);
  if (predicate && !EARLIER_PREDICATE.test(clause.slice(0, predicate.index)))
    return true;
  return /^no\s+(?:[\w-]+\s+)*?evidence\s+(?:establishes|proves|shows|demonstrates|confirms|supports|implies)\b/i.test(
    clause,
  );
}

function hasNegatedValidation(clause: string): boolean {
  if (hasNegatedEvidenceConclusion(clause)) return true;
  const predicate = clause.match(NEGATED_VALIDATION);
  if (predicate && !EARLIER_PREDICATE.test(clause.slice(0, predicate.index)))
    return true;
  return /\b(?:rather than|instead of)\s+(?:the\s+)?(?:enterprise[- ]wide|entire enterprise|whole enterprise)\b/i.test(
    clause,
  );
}

function shares(text: string): string[] {
  return Array.from(
    text.matchAll(/\b\d+(?:\.\d+)?\s*(?:%|percent\b)/gi),
    (match) =>
      match[0]
        .toLowerCase()
        .replace(/\s/g, "")
        .replace(/percent$/, "%"),
  );
}

function validationPopulation(text: string): string | undefined {
  return text
    .match(/\b(?:AI|programs?|technology|IT|digital|vendors?)\b/i)?.[0]
    .toLowerCase()
    .replace(/s$/, "");
}

export function hasUnsupportedHomeEvidenceScope(
  passages: string[],
  citedStatements: string[],
): boolean {
  const sourceClauses = citedStatements.flatMap(assertionClauses);
  const portfolioValidation = citedStatements.some(
    (statement) =>
      /\bportfolio\b/i.test(statement) && VALUE_VALIDATION.test(statement),
  );
  return passages.some((passage) =>
    splitNarrativeSentences(passage).some((sentence) => {
      const vendorSpend =
        /\b(?:vendor|supplier|third[- ]party)\b/i.test(sentence) &&
        /\b(?:spend\w*|budget|cost\w*)\b/i.test(sentence);
      return assertionClauses(sentence).some((clause) => {
        const negativeConclusion = hasNegatedEvidenceConclusion(clause);
        if (
          ABSENCE.test(clause) &&
          !negativeConclusion &&
          (!BOUNDED_ABSENCE.test(clause) || ENTERPRISE_ABSENCE.test(clause))
        )
          return true;
        // A shared vendor/spend subject still applies to a coordinated control assertion.
        if (
          vendorSpend &&
          INTERNAL_CONTROL.test(clause) &&
          !NEGATED_INTERNAL_CONTROL.test(clause) &&
          !negativeConclusion
        )
          return true;
        return (
          portfolioValidation &&
          ENTERPRISE_SCOPE.test(clause) &&
          !hasNegatedValidation(clause) &&
          VALUE_VALIDATION.test(clause) &&
          !sourceClauses.some(
            (source) =>
              ENTERPRISE_SCOPE.test(source) &&
              !hasNegatedValidation(source) &&
              FINANCE_VALIDATION.test(source) &&
              validationPopulation(clause) !== undefined &&
              validationPopulation(source) === validationPopulation(clause) &&
              shares(clause).length > 0 &&
              shares(clause).every((share) => shares(source).includes(share)),
          )
        );
      });
    }),
  );
}
