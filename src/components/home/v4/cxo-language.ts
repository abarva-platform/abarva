/**
 * The vocabulary gate for anything a CXO reads on Home.
 *
 * Two halves that have to stay together. `cxoText` launders builder words out of generated prose at
 * render time. `findBuilderLanguage` inspects the *raw* claims before that laundering,
 * because a renderer that quietly fixes its inputs hides an upstream generator that is still
 * producing them -- and the next term it invents will not have a replacement rule.
 *
 * Lifted out of the executive-story page when that page came off the landing path. The rule is not
 * the page's; it belongs to every surface a client reads.
 */
import type { ChapterView } from "@/lib/home/preview/types";

export const BUILDER_TERMS_FORBIDDEN_ON_CLIENT_SURFACES = [
  "ECL",
  "projection",
  "serving view",
  "loaded row",
  "loaded rows",
  "canonical entity",
  "canonical entities",
  "payload",
  "schema",
  "source room",
  "provider flag",
  "not enough verified evidence yet",
  "coverage gap in the build",
  "adapter",
  "upsert",
  "hydration step",
  "row type",
  "generator",
  "manifest",
] as const;

export function findBuilderLanguage(
  statements: string[],
): Array<{ term: string; statement: string }> {
  const findings: Array<{ term: string; statement: string }> = [];
  for (const statement of statements) {
    for (const identifier of statement.match(MACHINE_IDENTIFIER_RE) ?? []) {
      findings.push({ term: identifier, statement });
    }
    for (const term of BUILDER_TERMS_FORBIDDEN_ON_CLIENT_SURFACES) {
      const pattern = new RegExp(
        `\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`,
        "i",
      );
      if (pattern.test(statement)) {
        findings.push({ term, statement });
      }
    }
  }
  return findings;
}

export function collectChapterRawClaimStatements(
  chapters: ChapterView[],
): string[] {
  const statements = [
    ...chapters
      .flatMap((chapter) => [
        ...chapter.key_insights,
        ...chapter.tensions,
        ...chapter.what_to_watch,
      ])
      .map((claim) => claim.statement),
  ].filter((statement): statement is string => Boolean(statement));
  return Array.from(new Set(statements));
}

/**
 * A machine identifier printed where a person reads: `value_realisation`, `capability_gap`.
 *
 * Matched by shape rather than by name. A list of forbidden words can only catch the ones somebody
 * thought of; the next key the pipeline invents would pass. Two or more lowercase words joined by
 * underscores is not something a person writes in a sentence about their own company.
 */
export const MACHINE_IDENTIFIER_RE = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/g;

export function cxoText(text: string): string {
  return text
    .replace(MACHINE_IDENTIFIER_RE, (match) => match.replace(/_/g, " "))
    .replace(/\btier[_-](\d+)\b/gi, "tier $1")
    .replace(/\bThis packet contains\b/gi, "The current evidence shows")
    .replace(/\bevidence package\b/gi, "evidence set")
    .replace(/\bgoverned contract record\b/gi, "contract evidence")
    .replace(/\bgoverned contract set\b/gi, "contract set")
    .replace(/\bready contract value\b/gi, "reviewed contract value")
    .replace(/\bECL\b/g, "governed")
    .replace(/\bprojection\b/gi, "view")
    .replace(/\bserving view\b/gi, "readout")
    .replace(/\bloaded rows?\b/gi, "records")
    .replace(/\bcanonical entit(?:y|ies)\b/gi, "governed record")
    .replace(/\bECL payload\b/gi, "governed evidence packet")
    .replace(/\bprojection payload\b/gi, "view evidence packet")
    .replace(/\bserving payload\b/gi, "readout evidence packet")
    .replace(/\bECL schema\b/gi, "governed model")
    .replace(/\bprojection schema\b/gi, "view model")
    .replace(/\bserving schema\b/gi, "readout model")
    .replace(/\bsource room\b/gi, "source evidence")
    .replace(/\bchapter writer\b/gi, "chapter narrative process")
    .replace(/\bHome writer\b/gi, "Home narrative process")
    .replace(/\bprovider flag\b/gi, "configuration")
    .replace(
      /\bnot enough verified evidence yet\b/gi,
      "not yet supported by verified evidence",
    )
    .replace(/\bcoverage gap in the build\b/gi, "coverage gap in the evidence");
}

/**
 * Every string a chapter shows a reader, put through `cxoText` once.
 *
 * Applied at the chapter, not at each of the dozen places its text is drawn, so a new display site
 * cannot be added that quietly skips the gate. Estate rows are deliberately untouched: a column
 * value is data the reader asked to see, not prose written at them.
 */
export function launderChapter(chapter: ChapterView): ChapterView {
  const claims = (list: ChapterView["key_insights"]) =>
    list.map((claim) => ({ ...claim, statement: cxoText(claim.statement) }));
  return {
    ...chapter,
    headline: cxoText(chapter.headline),
    executive_synthesis: cxoText(chapter.executive_synthesis),
    key_insights: claims(chapter.key_insights),
    tensions: claims(chapter.tensions),
    what_to_watch: claims(chapter.what_to_watch),
    questions_to_ask: chapter.questions_to_ask.map(cxoText),
    limitations: chapter.limitations.map(cxoText),
  };
}

/**
 * A cell value shown to a reader, not the value used to filter on.
 *
 * `on_premise` and `legacy_stable` are how a column stores a state; "on premise" and "legacy
 * stable" are how a person says it. Applied at the cell, never at the row, so the filters and the
 * open-the-rows path keep matching the record's own values.
 *
 * A token carrying digits is left alone: `ctx_economics_006` is a reference someone may need to
 * quote back, and rewriting a reference is worse than showing one.
 */
export function cellText(value: string | number | boolean | null): string {
  if (value === null || typeof value !== "string") return String(value ?? "");
  return value.replace(/\b[a-z][a-z]*(?:_[a-z]+)+\b/g, (m) =>
    m.replace(/_/g, " "),
  );
}
