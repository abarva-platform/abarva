import { splitNarrativeSentences } from "./narrative-sentences";

type RevenueBasis = "plan" | "enterprise" | "unspecified";
type ConcentrationKind = "concentration" | "dominance" | "primary";

interface RevenueAssertion {
  basis: RevenueBasis;
  kind: ConcentrationKind;
  conditionalOrNegative: boolean;
}

const MA = String.raw`(?:medicare\s+advantage|ma)`;
const FFS = String.raw`medicare\s+(?:ffs|fee[- ]for[- ]service)`;
const JOIN = String.raw`(?:and|plus|\+|/)`;
const COMBINED = String.raw`(?:${MA}\s*${JOIN}\s*${FFS}|${FFS}\s*${JOIN}\s*${MA})`;
const MA_ONLY = String.raw`${MA}\b(?!\s*${JOIN}\s*${FFS}\b)`;
const REVENUE = String.raw`(?:(?:the|total|annual)\s+)*(?:(?:health[- ]plan|plan|enterprise|company|overall)\s+)?revenue\b(?!\s+growth\b)`;
const FRAME = String.raw`(?<frame>(?:(?:is|are|remains|could|may|might|be|not|never|only|potentially|possibly|heavily|largely|highly)\s+){0,4})`;
const SHARE = String.raw`(?<share>\d+(?:\.\d+)?)\s*(?:%|percent\b)`;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/^\s*[-*]\s+/, "")
    .replace(/\*\*[^*]+:\*\*\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function clauses(text: string): string[] {
  return splitNarrativeSentences(text).flatMap((sentence) =>
    sentence
      .split(/\n|;|,|\s+(?:but|whereas|while|yet|where)\s+/i)
      .map(normalize),
  );
}

function revenueBasis(text: string): RevenueBasis {
  if (/\b(?:health[- ]plan|plan)\b/.test(text)) return "plan";
  if (/\b(?:enterprise|company|overall)\b/.test(text)) return "enterprise";
  return "unspecified";
}

function isBoundedFrame(frame: string): boolean {
  return /\b(?:could|may|might|potentially|possibly|not|never)\b/.test(
    frame.replace(/\bnot\s+only\b/g, ""),
  );
}

function isNegativeConclusion(prefix: string): boolean {
  return /\b(?:(?:does|do)\s+not\s+(?:establish|show|prove|confirm)\s+(?:that\s+)?|no\s+evidence\s+(?:establishes|shows|proves|confirms)\s+(?:that\s+)?|not\s+(?:established|shown|proven|confirmed)\s+(?:that|whether)\s+)$/.test(
    prefix,
  );
}

function isReverseCombinedSubject(prefix: string): boolean {
  return new RegExp(String.raw`\b${FFS}\s*${JOIN}\s*$`).test(prefix);
}

function hasUnrecognizedRevenueModifier(
  match: RegExpMatchArray,
  prefix: string,
): boolean {
  const basis = match.groups?.basis;
  if (!basis || !match[0].startsWith(basis)) return false;
  return (
    /\b[a-z'-]+\s+$/.test(prefix) &&
    !/\b(?:with|and|that|whether|because|therefore|however|of|its|our|their)\s+$/.test(
      prefix,
    )
  );
}

function compositionPatterns(label: string): RegExp[] {
  return [
    new RegExp(
      String.raw`\b${label}(?:\s+(?:alone|together|jointly|combined))?\s+${FRAME}(?:accounts?\s+for|represents?|makes?\s+up|comprises?|generates?|provides?)\s+${SHARE}\s+of\s+(?<basis>${REVENUE})\b`,
      "g",
    ),
    new RegExp(
      String.raw`\b(?<basis>${REVENUE})\s+${FRAME}(?:splits?\s+)?${SHARE}\s+(?:(?:from|in|toward)\s+)?${label}\b`,
      "g",
    ),
  ];
}

function compositions(text: string, label: string) {
  return compositionPatterns(label).flatMap((pattern) =>
    Array.from(text.matchAll(pattern)).flatMap((match) => {
      const prefix = text.slice(0, match.index);
      if (
        isReverseCombinedSubject(prefix) ||
        hasUnrecognizedRevenueModifier(match, prefix)
      )
        return [];
      return [
        {
          basis: revenueBasis(match.groups!.basis),
          share: Number(match.groups!.share),
          conditionalOrNegative:
            isBoundedFrame(match.groups!.frame) || isNegativeConclusion(prefix),
        },
      ];
    }),
  );
}

function hasCombinedRevenueComposition(statement: string): boolean {
  if (
    clauses(statement).some((clause) =>
      compositions(clause, COMBINED).some(
        (composition) => !composition.conditionalOrNegative,
      ),
    )
  )
    return true;
  // This explicit revenue-split linkage also covers a plan share without repeating "revenue".
  const linkedPlanShare = new RegExp(
    String.raw`\brevenue\s+(?:is\s+)?split\b[^;.!?]{0,120}\bwith\s+(?:the\s+)?health[- ]plan\s+(?:itself\s+)?${SHARE}\s+${COMBINED}\b`,
  );
  return splitNarrativeSentences(statement)
    .map(normalize)
    .some((sentence) => {
      const match = sentence.match(linkedPlanShare);
      return Boolean(
        match && !isNegativeConclusion(sentence.slice(0, match.index)),
      );
    });
}

function concentrationAssertions(clause: string): RevenueAssertion[] {
  const patterns = [
    new RegExp(
      String.raw`\b(?<basis>${REVENUE})(?:\s+(?:model|mix))?\s+${FRAME}(?<kind>concentrated|dominated)\s+(?:in|on|by)\s+${MA_ONLY}`,
      "g",
    ),
    new RegExp(
      String.raw`\b${MA_ONLY}\s+${FRAME}(?<kind>dominates?)\s+(?<basis>${REVENUE})\b`,
      "g",
    ),
    new RegExp(
      String.raw`\b${MA_ONLY}\s+${FRAME}(?:the\s+)?(?<kind>dominant|primary|main)\s+(?:source\s+of\s+(?<basisBefore>${REVENUE})|(?<basisAfter>${REVENUE})\s+source)\b`,
      "g",
    ),
  ];
  return patterns.flatMap((pattern) =>
    Array.from(clause.matchAll(pattern)).flatMap((match) => {
      const prefix = clause.slice(0, match.index);
      if (
        isReverseCombinedSubject(prefix) ||
        hasUnrecognizedRevenueModifier(match, prefix)
      )
        return [];
      const kind: ConcentrationKind = match.groups!.kind.startsWith("dominat")
        ? "dominance"
        : match.groups!.kind === "concentrated"
          ? "concentration"
          : "primary";
      return [
        {
          basis: revenueBasis(
            match.groups!.basis ??
              match.groups!.basisBefore ??
              match.groups!.basisAfter,
          ),
          kind,
          conditionalOrNegative:
            isBoundedFrame(match.groups!.frame) ||
            isNegativeConclusion(prefix) ||
            /^\s+(?:is|remains)\s+not\s+(?:established|shown|proven|confirmed)\b/.test(
              clause.slice(match.index! + match[0].length),
            ),
        },
      ];
    }),
  );
}

/**
 * Checks explicit Medicare Advantage-only revenue concentration against a cited combined
 * Medicare Advantage + Medicare FFS composition. Only the fixed labels and financial forms
 * above are recognized. Strategy, Star goals, arbitrary share claims and aliases are outside
 * coverage. Independent support must name the same plan/enterprise/unqualified revenue basis
 * and concentration form, or explicitly state an MA-only majority share on that basis;
 * no subgroup share or enterprise share is calculated from the combined composition.
 */
export function hasUnsupportedMaOnlyRevenueConcentration(
  passages: string[],
  citedStatements: string[],
): boolean {
  if (!citedStatements.some(hasCombinedRevenueComposition)) return false;
  const sourceClauses = citedStatements.flatMap(clauses);
  const supportedAssertions = new Set(
    sourceClauses.flatMap((clause) => [
      ...concentrationAssertions(clause)
        .filter((assertion) => !assertion.conditionalOrNegative)
        .map((assertion) => `${assertion.basis}:${assertion.kind}`),
      ...compositions(clause, MA_ONLY)
        .filter(
          (composition) =>
            !composition.conditionalOrNegative &&
            composition.share > 50 &&
            composition.share <= 100,
        )
        .flatMap((composition) =>
          ["concentration", "dominance", "primary"].map(
            (kind) => `${composition.basis}:${kind}`,
          ),
        ),
    ]),
  );
  return passages
    .flatMap(clauses)
    .some((clause) =>
      concentrationAssertions(clause).some(
        (assertion) =>
          !assertion.conditionalOrNegative &&
          !supportedAssertions.has(`${assertion.basis}:${assertion.kind}`),
      ),
    );
}
