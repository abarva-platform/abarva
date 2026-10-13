import { splitNarrativeSentences } from "./narrative-sentences";

const PEOPLE =
  "(?:leaders?|leadership|executives?|interviewees?|members?|participants?|respondents?|customers?|employees?|staff)";
const POPULATION =
  "(?:\\d[\\d,]*(?:\\s*(?:of|/)\\s*\\d[\\d,]*)?|\\d+(?:\\.\\d+)?\\s*%|all|most|many|few|no|none of the)";
const LEADER_POPULATION = `${POPULATION}\\s+(?:of\\s+(?:the\\s+)?)?(?:leaders?|executives?|interviewees?)`;
const UNSUPPORTED_TRUST = new RegExp(
  `\\btrusted by\\s+${LEADER_POPULATION}\\b|\\b${LEADER_POPULATION}\\s+trust\\b`,
  "i",
);
const LEADER_COUNT = new RegExp(`\\b${LEADER_POPULATION}\\b`, "gi");
const PEOPLE_ASSERTION = new RegExp(
  `\\b${PEOPLE}\\b(?:\\s+(?!(?:interviews?|transcripts?|testimony|evidence)\\b)[\\w'-]+){0,6}\\s+(?:raised|said|reported|flagged|agreed|expressed|confirmed|verified|stated|told|described|identified|noted|(?:did not|didn't)\\s+(?:raise|say|report|flag|agree|express|confirm|verify|state|tell|describe|identify|note))\\b`,
  "i",
);
const ATTRIBUTED_TESTIMONY =
  /\b(?:leadership|leader|executive|interviewee|member|participant|customer)[- ](?:reported|confirmed|verified|stated|attested)\b/i;
const INTERVIEW_ASSERTION =
  /\b(?:interviews?|testimony|interview\s+(?:transcripts?|responses?|findings|evidence))\s+(?:[\w'-]+\s+){0,4}(?:shows?|showed|says?|said|reveals?|revealed|confirms?|confirmed|establishes?|established|indicates?|indicated|reports?|reported|describes?|described|documents?|documented)\b/i;
const CONDUCTED_INTERVIEWS = new RegExp(
  `\\b(?:interviewed|surveyed)\\s+(?:[\\w'-]+\\s+){0,3}${PEOPLE}\\b|\\b(?:${PEOPLE}|interviews?)\\s+(?:was|were|have been|has been|had been)\\s+(?:not\\s+)?(?:(?:already|previously|ever)\\s+)?(?:interviewed|surveyed|conducted|completed|held)\\b`,
  "i",
);
const EVIDENCE_GAP =
  /\b(?:interviews?|testimony|transcripts?|interview evidence)\b(?:(?!\b(?:raised|said|reported|flagged|agreed|expressed|confirmed|verified|stated|told|described|identified|noted|conducted|completed|held)\b)[^.!?;]){0,80}\b(?:missing|unavailable|unverified|not\s+(?:yet\s+)?(?:verified|available|loaded|confirmed|inspected))\b/gi;
const EVIDENCE_NOT_ESTABLISHED =
  /^(?:(?:the|this|current|available|supplied|home|original|verified)\s+)*(?:record|evidence|sources?|interview\s+(?:evidence|transcripts?|testimony))\s+(?:does|do|can)\s+not\s+(?:establish|show|prove|confirm|verify|document)\s+(?:that|whether)\s+|^no\s+(?:verified\s+)?(?:evidence|interview\s+(?:evidence|testimony))\s+(?:establishes|shows|proves|confirms|verifies|documents)\s+(?:that|whether)\s+/i;
const FUTURE_INTERVIEW =
  /\b(?:should|will|must|could|may|plan to|plans to|need to|needs to|intend to|intends to)\s+(?:[\w'-]+\s+){0,2}interview\s+$|^interview\s+$/i;
const BASIS =
  /\b(?:modelled|modeled|synthetic|simulated)(?:\s+(?:responses?|reference|interviews?|testimony|findings|examples?|evidence|scenario|leaders?|executives?|interviewees?)\b|(?=\s*(?::|\)|$)))/gi;

function clauses(passage: string): string[] {
  return splitNarrativeSentences(passage).flatMap((sentence) =>
    sentence
      .split(/\n|;|,?\s+\b(?:and|but|whereas|while|yet)\b\s+/i)
      .map((clause) =>
        clause
          .replace(/^\s*[-*]\s+/, "")
          .replace(/^\s*\*\*[^*]+:\*\*\s*/, (label) =>
            /\b(?:modelled|modeled|synthetic|simulated)\b/i.test(label)
              ? label
              : "",
          )
          .replace(/\*\*/g, "")
          .replace(/\s+/g, " ")
          .trim(),
      ),
  );
}

function hasLocalReferenceBasis(clause: string): boolean {
  return Array.from(clause.matchAll(BASIS)).some(
    (match) =>
      !/\b(?:not|no|never|without)\s+(?:(?:a|an|the|currently|explicitly)\s+){0,3}$/i.test(
        clause.slice(0, match.index),
      ),
  );
}

/** Bounded local wording guard for declared synthetic references, not an entailment check. */
export function hasUnqualifiedReferenceTestimony(
  passages: readonly string[],
  declaredSyntheticDemo: boolean | undefined,
): boolean {
  if (declaredSyntheticDemo !== true) return false;
  return passages.flatMap(clauses).some((clause) => {
    if (UNSUPPORTED_TRUST.test(clause)) return true;
    if (EVIDENCE_NOT_ESTABLISHED.test(clause)) return false;
    // Remove only bounded evidence-gap spans, keeping any neighboring assertion intact.
    const assertionText = clause.replace(EVIDENCE_GAP, "");
    const asserted =
      PEOPLE_ASSERTION.test(assertionText) ||
      ATTRIBUTED_TESTIMONY.test(assertionText) ||
      INTERVIEW_ASSERTION.test(assertionText) ||
      CONDUCTED_INTERVIEWS.test(assertionText);
    const counted = Array.from(assertionText.matchAll(LEADER_COUNT)).some(
      (match) =>
        !FUTURE_INTERVIEW.test(assertionText.slice(0, match.index)) &&
        !/^\s+(?:will|should|must|could|may)\s+be\s+interviewed\b/i.test(
          assertionText.slice(match.index! + match[0].length),
        ),
    );
    return (asserted || counted) && !hasLocalReferenceBasis(assertionText);
  });
}
