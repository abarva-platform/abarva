const RAW_ID_REPLACE =
  /\b(?:APP|DP|CON|NODE|EDGE)-\d{3,}\b|\b[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

export const PUBLIC_ANSWER_FORBIDDEN_LANGUAGE_RE =
  /\b(cannot be characterized|cannot be identified|I found|source support|missing source support|Current-state read|current-state context|loaded context|source context|loaded source context|\bread\b|Evidence points|\bevidence points?\b|\bcontext dimensions?\b|\bdimensions loaded\b|\bloaded with \d[\d,]*\b|\btrust\s+\d{1,3}\b|\btrust\s+\d{1,3}%\b|\bevidence\s+refs?\b|\brows?\b|home_know|intelligence-v2|semantic packet|\bpacket\b|dossier|binder|fragment lookup|edge rows|source rows|no blocking gap|quality gate|answer boundary|curated semantic|semantic source|semantic evidence|\bsemantic\b|typed facts?|loaded facts?|\bfacts?\b|canonical entities|\bentities\b|relationship maps?|relationship paths?|debug|session memory|earlier turns|previous conversation|not loaded|\/Users\/|localhost)\b|^\s*(Read|Evidence):/i;

export const PUBLIC_ANSWER_INTERNAL_COUNT_RE =
  /\b\d[\d,]*\s+(?:canonical\s+)?(?:entities|facts|relationships|citations|rows|evidence points?|context dimensions?)\b/i;

export function publicAnswerLeakIssues(text: string): string[] {
  const issues: string[] = [];
  if (PUBLIC_ANSWER_FORBIDDEN_LANGUAGE_RE.test(text)) {
    issues.push("forbidden_public_language");
  }
  if (PUBLIC_ANSWER_INTERNAL_COUNT_RE.test(text)) {
    issues.push("internal_count_language");
  }
  return issues;
}

export function operationalEvidenceInsufficiencyLead(
  question: string,
): string | null {
  const q = question.toLowerCase();
  const asksAutomation =
    /\b(automation|automate|opportunity|evidence|support|enough|ready|case|candidate)\b/.test(
      q,
    );
  const asksContextOnlyFunction =
    /\b(finance close|financial close|treasury|kyriba|fp&a|fpa|legal|hr|human resources|payroll)\b/.test(
      q,
    );
  if (!asksAutomation || !asksContextOnlyFunction) return null;
  return "Lakeshore does not yet have enough operational-process material to make a finance close, Treasury, or Kyriba automation case. The operational depth is concentrated in Shared IT service-management work, so Home can show adjacent business material and the source gap, but it should not imply a finance close, Treasury, or Kyriba automation priority until function-specific work-item and process material is added.";
}

export function scrubPublicAvaAnswerText(value: string): string {
  const scrubbed = stripInternalEvidenceAppendix(value)
    .replace(
      /\n?\s*Next,\s+have the accountable owner review the listed sources and decide whether this belongs in Source, Tower, or Moves\.?/gi,
      "",
    )
    .replace(
      /\n?\s*Next move:\s*assign the accountable owner to validate the cited evidence and decide whether this should move into Source or Moves\.?/gi,
      "",
    )
    .replace(
      /^\s*aVa\s*·\s*(?:home|intelligence|moves|source|tower)\s*\n\s*(?:answered|partial|no_data|handoff|blocked)\s*\n\s*(?:high|medium|low)\s+confidence\s*\n?/gim,
      "",
    )
    .replace(/^\s*#{1,6}\s+.*(?:\r?\n|$)/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(^|\n)\s*(Read|Evidence|Implication|Next move):\s*/gi, "$1")
    .replace(/\bcurated semantic (?:evidence|source context)?\s*source\b/gi, "available business material")
    .replace(/\bsemantic (?:evidence|source context)?\s*source\b/gi, "available business material")
    .replace(/\bcurated semantic context\b/gi, "available business material")
    .replace(/\bsemantic(?:ally)?\b/gi, "business")
    .replace(/\bcontext dimensions?\b/gi, "business areas")
    .replace(/\bdimensions loaded\b/gi, "business areas represented")
    .replace(/\bloaded with \d[\d,]*\s*/gi, "supported by ")
    .replace(/\btrust\s+\d{1,3}%?\b/gi, "confidence noted")
    .replace(/\bevidence refs?\b/gi, "source references")
    .replace(/\bpackets?\b/gi, "answer material")
    .replace(/\bcurrent-state context\b/gi, "current picture")
    .replace(/\bloaded source context\b/gi, "available source material")
    .replace(/\bloaded context\b/gi, "available business material")
    .replace(/\bsource context\b/gi, "supporting material")
    .replace(/\btyped facts?\b/gi, "available details")
    .replace(/\bloaded facts?\b/gi, "available details")
    .replace(/\bfacts?\b/gi, "available details")
    .replace(/\bcanonical entities\b/gi, "business objects")
    .replace(/\bentities\b/gi, "business objects")
    .replace(/\bresolved relationship maps\b/gi, "source-supported connections")
    .replace(/\brelationship maps?\b/gi, "source-supported connections")
    .replace(/\brelationship paths?\b/gi, "source-supported connections")
    .replace(/\bcurrent-state read\b/gi, "current picture")
    .replace(/\bmissing source support\b/gi, "specific source gap")
    .replace(/\bsource support\b/gi, "supporting material")
    .replace(/\bmissing evidence path\b/gi, "missing source path")
    .replace(/\bevidence path\b/gi, "source path")
    .replace(/\bmissing evidence\b/gi, "specific source gap")
    .replace(/\bneeded evidence\b/gi, "needed material")
    .replace(/\bevidence points?\b/gi, "source signals")
    .replace(/\bevidence-backed\b/gi, "material-backed")
    .replace(/\bevidence-based\b/gi, "material-backed")
    .replace(/\bevidence\b/gi, "supporting material")
    .replace(/\bsource rows?\b/gi, "source records")
    .replace(/\bedge rows?\b/gi, "connection records")
    .replace(/\brows\b/gi, "records")
    .replace(/\brow\b/gi, "record")
    .replace(/\bread-models?\b/gi, "source views")
    .replace(/\breads\b/gi, "reviews")
    .replace(/\bread\b/gi, "review")
    .replace(/\bdossier\b/gi, "business file")
    .replace(/\bbinder\b/gi, "business file")
    .replace(/\bfragment lookup\b/gi, "narrow lookup")
    .replace(/\bno blocking gap\b/gi, "no specific source gap")
    .replace(/\bquality gate\b/gi, "answer check")
    .replace(/\bsafe answer boundary\b/gi, "supported scope")
    .replace(/\bsafe answer scope\b/gi, "supported scope")
    .replace(/\banswer boundary\b/gi, "supported scope")
    .replace(/\bsession memory\b/gi, "available business material")
    .replace(/\bearlier turns\b/gi, "available business material")
    .replace(/\bprevious conversation\b/gi, "available business material")
    .replace(/\bnot loaded\b/gi, "not yet available")
    .replace(/\bintelligence-v2\b/gi, "Intelligence")
    .replace(/\bThe supporting evidence is that\s+/gi, "")
    .replace(/\bThat means\s+The\b/g, "That means the")
    .replace(/\bThat means\s+/gi, "")
    .replace(/\bS\.\s*$/gm, "")
    .replace(/\s+-\s+(?=[A-Z0-9])/g, "\n\n- ")
    .replace(RAW_ID_REPLACE, "source reference")
    .replace(/\bsupporting material supports\b/gi, "supporting material shows")
    .replace(/\ba available\b/gi, "an available")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return enforcePublicAvaParagraphCap(scrubbed);
}

function stripInternalEvidenceAppendix(value: string): string {
  const lines = value.replace(/\r\n/g, "\n").split("\n");
  const kept: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? "";
    const nextWindow = lines
      .slice(index, index + 6)
      .map((item) => item.trim().toLowerCase())
      .join(" ");
    const previousWindow = lines
      .slice(Math.max(0, index - 2), index + 1)
      .map((item) => item.trim().toLowerCase())
      .join(" ");

    const startsEvidenceTable =
      /^tables?$/i.test(line) &&
      /\b(evidence|supporting material|source support)\b/.test(nextWindow) &&
      /\bsource\b/.test(nextWindow) &&
      /\bconfidence\b/.test(nextWindow);
    const startsEvidenceHeader =
      /^source\s+type\s+confidence\s+how\s+(?:it\s+)?supports\s+the\s+answer$/i.test(
        line.replace(/\s+/g, " "),
      ) &&
      /\b(evidence|tables?|supporting material)\b/.test(previousWindow);
    const startsSourcePanel =
      /^this panel lists the material used for the answer/i.test(line);

    if (startsEvidenceTable || startsEvidenceHeader || startsSourcePanel) {
      break;
    }

    kept.push(lines[index]);
  }

  return kept.join("\n");
}

export function enforcePublicAvaParagraphCap(
  value: string,
  maxSentences = 3,
): string {
  return value
    .split(/\n{2,}/)
    .flatMap((paragraph) => splitParagraphBySentenceCap(paragraph, maxSentences))
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitParagraphBySentenceCap(
  paragraph: string,
  maxSentences: number,
): string[] {
  const trimmed = paragraph.trim();
  if (!trimmed) return [];
  if (isTableBlock(trimmed)) return [trimmed];

  const sentences = trimmed
    .split(/(?<=[.!?])\s+(?=(?:["'(\[])?[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (sentences.length <= maxSentences) return [trimmed];

  const chunks: string[] = [];
  for (let index = 0; index < sentences.length; index += maxSentences) {
    chunks.push(sentences.slice(index, index + maxSentences).join(" "));
  }
  return chunks;
}

function isTableBlock(value: string): boolean {
  return /^\s*\|.+\|\s*$/m.test(value);
}
