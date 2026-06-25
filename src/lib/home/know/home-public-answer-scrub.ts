const RAW_ID_REPLACE =
  /\b(?:APP|DP|CON|NODE|EDGE)-\d{3,}\b|\b[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

export const HOME_PUBLIC_FORBIDDEN_LANGUAGE_RE =
  /\b(cannot be characterized|cannot be identified|I found|missing source support|Current-state read|\bread\b|Evidence points|\bevidence points?\b|\bevidence\b|\brows?\b|home_know|semantic packet|\bpacket\b|dossier|binder|fragment lookup|edge rows|source rows|no blocking gap|quality gate|answer boundary|curated semantic|semantic source|semantic evidence|\bsemantic\b|typed facts?|loaded facts?|\bfacts?\b|canonical entities|\bentities\b|relationship maps?|relationship paths?|debug|session memory|earlier turns|previous conversation|not loaded|\/Users\/|localhost)\b|^\s*(Read|Evidence):/i;

export const HOME_PUBLIC_INTERNAL_COUNT_RE =
  /\b\d[\d,]*\s+(?:canonical\s+)?(?:entities|facts|relationships|citations|rows|evidence points?)\b/i;

export function homePublicAnswerLeakIssues(text: string): string[] {
  const issues: string[] = [];
  if (HOME_PUBLIC_FORBIDDEN_LANGUAGE_RE.test(text)) {
    issues.push("forbidden_public_language");
  }
  if (HOME_PUBLIC_INTERNAL_COUNT_RE.test(text)) {
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
  return "The loaded Lakeshore context does not yet support an operational-process automation case for this finance/Treasury area. The operational depth is concentrated in Shared IT service-management work, so Home can show adjacent context and the source gap, but it should not imply a finance close, Treasury, or Kyriba automation priority until function-specific work-item and process evidence is added.";
}

export function scrubHomePublicAnswerText(value: string): string {
  return value
    .replace(/^\s*#{1,6}\s+.*(?:\r?\n|$)/gm, "")
    .replace(/\*\*/g, "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(^|\n)\s*(Read|Evidence|Implication|Next move):\s*/gi, "$1")
    .replace(/\bcurated semantic (?:evidence|source context)?\s*source\b/gi, "loaded context")
    .replace(/\bsemantic (?:evidence|source context)?\s*source\b/gi, "loaded context")
    .replace(/\bcurated semantic context\b/gi, "loaded context")
    .replace(/\bsemantic(?:ally)?\b/gi, "source-backed")
    .replace(/\btyped facts?\b/gi, "source support")
    .replace(/\bloaded facts?\b/gi, "loaded context")
    .replace(/\bfacts?\b/gi, "source support")
    .replace(/\bcanonical entities\b/gi, "business objects")
    .replace(/\bentities\b/gi, "business objects")
    .replace(/\bresolved relationship maps\b/gi, "source-supported connections")
    .replace(/\brelationship maps?\b/gi, "source-supported connections")
    .replace(/\brelationship paths?\b/gi, "source-supported connections")
    .replace(/\bcurrent-state read\b/gi, "current-state context")
    .replace(/\bmissing source support\b/gi, "specific source gap")
    .replace(/\bmissing evidence path\b/gi, "missing source path")
    .replace(/\bevidence path\b/gi, "source path")
    .replace(/\bmissing evidence\b/gi, "missing source context")
    .replace(/\bneeded evidence\b/gi, "needed source context")
    .replace(/\bevidence points?\b/gi, "source signals")
    .replace(/\bevidence-backed\b/gi, "source-backed")
    .replace(/\bevidence-based\b/gi, "source-backed")
    .replace(/\bevidence\b/gi, "source context")
    .replace(/\bsource rows?\b/gi, "source records")
    .replace(/\bedge rows?\b/gi, "connection records")
    .replace(/\brows\b/gi, "records")
    .replace(/\brow\b/gi, "record")
    .replace(/\bread-models?\b/gi, "source views")
    .replace(/\breads\b/gi, "reviews")
    .replace(/\bread\b/gi, "review")
    .replace(/\bdossier\b/gi, "source context")
    .replace(/\bbinder\b/gi, "source context")
    .replace(/\bfragment lookup\b/gi, "narrow lookup")
    .replace(/\bno blocking gap\b/gi, "no specific source gap")
    .replace(/\bquality gate\b/gi, "answer check")
    .replace(/\bsafe answer boundary\b/gi, "safe answer scope")
    .replace(/\banswer boundary\b/gi, "safe answer scope")
    .replace(/\bsession memory\b/gi, "loaded context")
    .replace(/\bearlier turns\b/gi, "loaded context")
    .replace(/\bprevious conversation\b/gi, "loaded context")
    .replace(/\bnot loaded\b/gi, "not yet available in the loaded context")
    .replace(RAW_ID_REPLACE, "source reference")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

