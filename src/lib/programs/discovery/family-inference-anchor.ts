/**
 * Whether a keyword match is strong enough to PLACE an evidence file in a
 * discovery evidence family, or only weak enough to have won by default.
 *
 * Why this exists. The readiness map places an undeclared upload by scoring its
 * title and summary against each family's keyword list and taking the best
 * score above a floor. Two kinds of family compete in that scoring and they are
 * not comparable:
 *
 * - A family with an AUTHORED keyword list can score on a single word from it.
 *   Some of those words are generic — `owner`, `cost`, `value`, `data`, `rule`
 *   — and appear in nearly every enterprise evidence document.
 * - A family with NO authored list falls back to its own id-as-words and label,
 *   so it can only score on an exact phrase match of one of those two strings.
 *
 * Where a blueprint mixes the two — and most archetype blueprints do, because
 * the keyword table was authored for the earlier archetypes only — the authored
 * minority absorbs everything. One generic word is enough to win, because the
 * families the document is actually about cannot score at all unless the
 * document happens to repeat their full label. The placement that results is
 * not evidence about the file; it is the absence of competition.
 *
 * That failure is worse than placing nothing. A family listing a file it is not
 * about reads as COVERED, so the remediation never asks for it and the uploader
 * is never told; and the file's title is then quoted under that family by
 * everything downstream that reads the coverage. An unplaced file reads as
 * MISSING, which is remediable: the uploader declares the family and the
 * placement is exact.
 *
 * So inference must be ANCHORED. A match counts only when the text carries a
 * signal specific to that family:
 *
 * - `phrase` — the family's id-as-words or its label appears in the text. This
 *   is the only signal a family with no authored list can ever produce, so
 *   requiring it of the authored ones too is what makes the two comparable.
 * - `multi_word_keyword` — an authored keyword of more than one word matched
 *   (`model risk`, `business case`, `metric owner`). A phrase of the family's
 *   own vocabulary is specific in a way a single generic word is not.
 * - `corroborated_keywords` — two or more DISTINCT authored keywords matched.
 *   One generic word is an accident; two independent ones are a subject.
 *
 * A single single-word keyword hit, and an evidence-TYPE affinity on its own,
 * anchor nothing. The evidence type is a coarse category picked from a short
 * list and shared across many families: it can narrow a field of candidates, it
 * cannot identify one. Scoring is unchanged — this gates what a winning score
 * is allowed to mean.
 */

/** What matched, for one (item, family) pair. Produced by the scorer. */
export interface FamilyMatchSignal {
  /**
   * The authored keywords that matched, as authored. Empty when the family has
   * no authored list, since the derived id/label fallback is reported through
   * `phraseMatched` instead and must not read as keyword corroboration.
   */
  matchedAuthoredKeywords: readonly string[];
  /** The family's id-as-words or its label appears in the text. */
  phraseMatched: boolean;
}

export type FamilyMatchAnchor =
  | "phrase"
  | "multi_word_keyword"
  | "corroborated_keywords";

/**
 * The anchor a match rests on, or null when it rests on nothing specific to the
 * family and so must not place the file.
 */
export function familyMatchAnchor(
  signal: FamilyMatchSignal,
): FamilyMatchAnchor | null {
  if (signal.phraseMatched) return "phrase";
  const distinct = new Set(
    signal.matchedAuthoredKeywords.map((keyword) =>
      keyword.trim().toLowerCase(),
    ),
  );
  distinct.delete("");
  for (const keyword of distinct) {
    if (/\s/.test(keyword)) return "multi_word_keyword";
  }
  return distinct.size >= 2 ? "corroborated_keywords" : null;
}

/** Whether a scored match may place the file in the family. */
export function isAnchoredFamilyMatch(signal: FamilyMatchSignal): boolean {
  return familyMatchAnchor(signal) !== null;
}

export interface InferenceReachFamily {
  id: string;
  required: boolean;
}

export interface InferenceReachReport {
  /**
   * Required families inference can only ever reach by an exact phrase match,
   * because no keyword list was authored for them. They cannot compete with an
   * authored sibling on a generic word, so a surface that relies on inference
   * to cover them is relying on the uploader repeating the family's own label.
   */
  phraseOnlyRequiredFamilyIds: string[];
  /** Required families with an authored keyword list. */
  keywordedRequiredFamilyIds: string[];
  /**
   * True when the required families are a MIX of the two. A mix is the
   * condition under which the keyworded minority absorbs the rest; where every
   * required family is phrase-only, or every one is keyworded, they compete on
   * the same basis and no family is structurally favoured.
   */
  mixed: boolean;
}

/**
 * Which of a blueprint's required families inference can actually reach, and
 * whether the blueprint is the mixed shape that biases it.
 *
 * This names the condition that kept the absorption invisible: nothing reported
 * that most of a blueprint's families were unreachable by the mechanism being
 * relied on to cover them.
 */
export function inferenceReachReport(
  families: readonly InferenceReachFamily[],
  authoredKeywordFamilyIds: ReadonlySet<string>,
): InferenceReachReport {
  const phraseOnlyRequiredFamilyIds: string[] = [];
  const keywordedRequiredFamilyIds: string[] = [];
  for (const family of families) {
    if (!family.required) continue;
    if (authoredKeywordFamilyIds.has(family.id)) {
      keywordedRequiredFamilyIds.push(family.id);
    } else {
      phraseOnlyRequiredFamilyIds.push(family.id);
    }
  }
  return {
    phraseOnlyRequiredFamilyIds,
    keywordedRequiredFamilyIds,
    mixed:
      phraseOnlyRequiredFamilyIds.length > 0 &&
      keywordedRequiredFamilyIds.length > 0,
  };
}
