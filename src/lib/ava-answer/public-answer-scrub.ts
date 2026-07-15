const RAW_ID_REPLACE =
  /\b(?:APP|DP|CON|NODE|EDGE)-\d{3,}\b|\b[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}\b|\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;

export const PUBLIC_ANSWER_FORBIDDEN_LANGUAGE_RE =
  /\b(cannot be characterized|cannot be identified|I found|source support|missing source support|supporting material|evidence ledger|supporting material ledger|Current-state read|current-state context|loaded context|source context|loaded source context|loaded evidence|loaded sources|loaded tenant sources|tenant evidence|Evidence points|\bevidence points?\b|\bsource signals?\b|\bcontext dimensions?\b|\bdimensions loaded\b|\bloaded with \d[\d,]*\b|\btrust\s+\d{1,3}\b|\btrust\s+\d{1,3}%\b|\bevidence\s+refs?\b|\brows?\b|home_know|intelligence-v2|semantic packet|\bpacket\b|dossier|binder|fragment lookup|edge rows|source rows|no blocking gap|quality gate|answer boundary|curated semantic|semantic source|semantic evidence|\bsemantic\b|typed facts?|loaded facts?|canonical entities|relationship maps?|relationship paths?|debug|session memory|earlier turns|previous conversation|last\s+\w+\s+(?:turns?|times)|all session|same answer(?: as)?|answer is the same|answer hasn'?t (?:changed|moved)|substrate|not loaded|candidate_move|move_id|phase_id|artifact_id|evidence_id|source_record_id|program_evidence_items|move_artifacts|context_pack_id|tenant_id|client_id|\/Users\/|localhost)\b|\bV\d+(?:[_-][A-Za-z0-9./-]+|\s+(?:substrate|data\s+layer|context\s+layer))\b|^\s*(Read|Evidence):/i;

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

export function scrubInternalVisibleAvaTerms(value: string): string {
  return value
    .replace(/\bV\d+\s+substrate\b/gi, "active enterprise context")
    .replace(/\bV\d+\s+data\s+layer\b/gi, "active enterprise context")
    .replace(/\bV\d+\s+context\s+layer\b/gi, "active enterprise context")
    .replace(/\bIntelligence\s+V\d+\b/gi, "enterprise context")
    .replace(/\bV\d+[_-][A-Za-z0-9_.-]+\b/gi, "source file")
    .replace(/\bV\d+\b/gi, "enterprise context")
    .replace(/\bcandidate_move\b/gi, "candidate opportunity")
    .replace(/\bmove_id\b/gi, "Move reference")
    .replace(/\bphase_id\b/gi, "phase reference")
    .replace(/\bartifact_id\b/gi, "artifact reference")
    .replace(/\bevidence_id\b/gi, "evidence reference")
    .replace(/\bsource_record_id\b/gi, "source reference")
    .replace(/\bcontext_pack_id\b/gi, "context reference")
    .replace(/\bprogram_evidence_items\b/gi, "attached evidence")
    .replace(/\bmove_artifacts\b/gi, "Move artifacts")
    .replace(/\btenant_id\b/gi, "workspace reference")
    .replace(/\bclient_id\b/gi, "client reference");
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
  const scrubbed = scrubInternalVisibleAvaTerms(stripInternalEvidenceAppendix(value))
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
    .replace(/(^|\n)\s*["'“”]\s+(?=Here(?:'|’)s\b)/g, "$1")
    .replace(/(^|\n)\s*(Read|Evidence|Implication|Next move|Why):\s*/gi, "$1")
    .replace(
      /\bThe answer hasn'?t changed from the last\s+\w+\s+turns?,?\s+and\s+I\s+want\s+to\s+be\s+direct\s+about\s*/gi,
      "",
    )
    .replace(
      /\bThe answer hasn'?t changed(?:\s+across\s+this\s+session|\s+from\s+the\s+last\s+\w+\s+(?:turns?|times))?,?\s+and\s+(?:the\s+)?(?:tenant evidence|business context|available business material)\s+(?:keeps\s+)?(?:making it concrete|making the case cleanly|supporting it|pointing here):\s*/gi,
      "",
    )
    .replace(
      /\bThe answer hasn'?t (?:changed|moved)(?:\s+across\s+this\s+session|\s+from\s+the\s+last\s+\w+\s+(?:turns?|times))?,?\s+and\s+(?:the\s+)?(?:evidence|tenant evidence|business context|available business material)\s+(?:keeps\s+)?(?:making it cleanly|making it concrete|making the case cleanly|supporting it|pointing here):\s*/gi,
      "",
    )
    .replace(
      /\bThe answer hasn'?t (?:changed|moved)(?:\s+across\s+this\s+session|\s+from\s+the\s+last\s+\w+\s+(?:turns?|times))?,?\s+and\s+(?:the\s+)?(?:evidence|tenant evidence|business context|available business material)\s+(?:keeps\s+)?(?:making it airtight|making the case airtight):\s*/gi,
      "",
    )
    .replace(
      /\bThe answer is the same one I(?:'|’)ve given the last\s+\w+\s+times?\s+this\s+session,?\s+and\s+(?:the\s+)?(?:tenant evidence|business context|available business material)\s+(?:keeps\s+)?supporting\s+it:\s*/gi,
      "",
    )
    .replace(
      /\bThe answer is the same one\s+(?:the\s+)?(?:evidence|tenant evidence|business context|available business material)\s+(?:has\s+)?(?:supported|kept supporting|keeps supporting)\s+(?:it\s+)?all\s+session:\s*/gi,
      "",
    )
    .replace(
      /\bSame answer as the last\s+\w+\s+turns?,?\s+and\s+(?:the\s+)?(?:tenant evidence|business context|available business material)\s+(?:keeps\s+)?(?:making the case cleanly|supporting it|pointing here):\s*/gi,
      "",
    )
    .replace(
      /\bSame answer,?\s+and\s+(?:the\s+)?(?:tenant evidence|business context|available business material)\s+(?:keeps\s+)?(?:making it airtight|making it concrete|making the case cleanly|supporting it|pointing here):\s*/gi,
      "",
    )
    .replace(
      /\bHere(?:'|’)s why this keeps being the right answer\.?\s*/gi,
      "",
    )
    .replace(/\bHere(?:'|’)s why the evidence keeps pointing here\.?\s*/gi, "")
    .replace(/\bHere(?:'|’)s why the evidence is this clean\.?\s*/gi, "")
    .replace(/\bWhy:\s+(?=[a-z])/g, "")
    .replace(/\bHere(?:'|’)s the logic(?: in plain terms)?\.?\s*/gi, "")
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
    .replace(/\bThe loaded tenant sources show\b/gi, "The business context shows")
    .replace(/\bThe loaded sources show\b/gi, "The business context shows")
    .replace(/\bloaded tenant sources\b/gi, "business context")
    .replace(/\bloaded evidence\b/gi, "business context")
    .replace(/\bloaded sources\b/gi, "business context")
    .replace(/\bsource context\b/gi, "business context")
    .replace(/\btyped facts?\b/gi, "available details")
    .replace(/\bloaded facts?\b/gi, "available details")
    .replace(/\bcanonical entities\b/gi, "business objects")
    .replace(/\bresolved relationship maps\b/gi, "source-supported connections")
    .replace(/\brelationship maps?\b/gi, "source-supported connections")
    .replace(/\brelationship paths?\b/gi, "source-supported connections")
    .replace(/\bcurrent-state read\b/gi, "current picture")
    .replace(/\bmissing source support\b/gi, "specific business-context gap")
    .replace(/\bsource support\b/gi, "business context")
    .replace(/\bmissing evidence path\b/gi, "missing source path")
    .replace(/\bevidence path\b/gi, "source path")
    .replace(/\bmissing evidence\b/gi, "specific source gap")
    .replace(/\bneeded evidence\b/gi, "needed material")
    .replace(/\bloaded tenant evidence\b/gi, "business context")
    .replace(/\btenant evidence\b/gi, "business context")
    .replace(/\bevidence base gap\b/gi, "operational-data gap")
    .replace(/\bdata evidence base\b/gi, "operational-data base")
    .replace(/\bsubstrate gap\b/gi, "operational-data gap")
    .replace(/\bdata substrate\b/gi, "data foundation")
    .replace(/\bthe substrate\b/gi, "the operational-data foundation")
    .replace(/\bsubstrate\b/gi, "foundation")
    .replace(/\bevidence points?\b/gi, "business signals")
    .replace(/\bevidence-backed\b/gi, "business-context-backed")
    .replace(/\bevidence-based\b/gi, "business-context-backed")
    .replace(/\bsupporting material ledger\b/gi, "business context")
    .replace(/\bevidence ledger\b/gi, "business context")
    .replace(/\bsupporting material\b/gi, "business context")
    .replace(/\bsource rows?\b/gi, "source records")
    .replace(/\bedge rows?\b/gi, "connection records")
    .replace(/\brows?\b/gi, "records")
    .replace(/\bread-models?\b/gi, "source views")
    .replace(/\bdossier\b/gi, "business file")
    .replace(/\bbinder\b/gi, "business file")
    .replace(/\bfragment lookup\b/gi, "narrow lookup")
    .replace(/\bno blocking gap\b/gi, "no specific source gap")
    .replace(/\bquality gate\b/gi, "answer check")
    .replace(/\bsafe answer boundary\b/gi, "supported scope")
    .replace(/\bsafe answer scope\b/gi, "supported scope")
    .replace(/\banswer boundary\b/gi, "supported scope")
    .replace(/\bexplicit loaded constraint\b/gi, "explicit constraint")
    .replace(/\bloaded constraint\b/gi, "known constraint")
    .replace(/\bsession memory\b/gi, "available business material")
    .replace(/\bearlier turns\b/gi, "available business material")
    .replace(/\bprevious conversation\b/gi, "available business material")
    .replace(/\bnot loaded\b/gi, "not yet available")
    .replace(/\bintelligence-v2\b/gi, "Intelligence")
    .replace(/\bThe supporting evidence is that\s+/gi, "")
    .replace(/\bThat means\s+The\b/g, "That means the")
    .replace(/\bThat means\s+/gi, "")
    .replace(
      /\bThe priority table,?\s+for the investment committee:\s*/gi,
      "For the investment committee: ",
    )
    .replace(
      /\n?\s*If it(?:'|’)s the latter,?\s+that(?:'|’)s the single thing to (?:fix|change) before any other AI (?:investment )?conversation is worth (?:having|the meeting time)\.?\s*/gi,
      "",
    )
    .replace(
      /\n?\s*If it(?:'|’)s the latter,?\s+that single gap is the only thing worth fixing before any other AI conversation is worth the meeting time\.?\s*/gi,
      "",
    )
    .replace(
      /\n?\s*If it(?:'|’)s the latter,?\s+that(?:'|’)?s the only gap worth closing before any other AI (?:investment )?conversation earns meeting time\.?\s*/gi,
      "",
    )
    .replace(
      /\b(\d+(?:\.\d+)?[MK]?)\s+events\s+daily\s+and\s+is\s+flagged\s+for\s+migration\./gi,
      "The integration handles $1 daily events and is flagged for migration.",
    )
    .replace(/\s+\d+\s+vs\.(?=\s|$)/gi, ".")
    .replace(/\bS\.\s*$/gm, "")
    .replace(/\s+-\s+(?=[A-Z0-9])/g, "\n\n- ")
    .replace(RAW_ID_REPLACE, "source reference")
    .replace(/\bbusiness context supports\b/gi, "business context shows")
    .replace(/\ba available\b/gi, "an available")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return enforcePublicAvaParagraphCap(scrubbed);
}

export function scrubPublicAvaSourceText(value: string): string {
  const sourceReady = value
    .replace(/\bV\d+[_-]\d+\s*/gi, "")
    .replace(/\bV\d+\s+/gi, "")
    .replace(/\bIntelligence\s+V\d+\b/gi, "enterprise context")
    .replace(/\bintelligence_v\d+\b/gi, "enterprise context")
    .replace(/\bnot_loaded\b/gi, "not yet available")
    .replace(/\bsynthetic_demo_manifest_gated\b/gi, "demo validation gate")
    .replace(/\bsynthetic\s+demo\s+manifest\s+gated\b/gi, "demo validation gate");

  return scrubPublicAvaAnswerText(sourceReady)
    .replace(/\bdemo\s+manifest\s+gated\b/gi, "demo validation gate")
    .replace(/\bsynthetic demo\b/gi, "demo")
    .replace(
      /\b\d[\d,]*\s+(?:business records|field facts|graph nodes|relationship edges|retrieval chunks)\b/gi,
      "available source material",
    )
    .replace(/\bSelected for this question:\s*/gi, "")
    .replace(/\bsource file\s+(?=candidate opportunity\b)/gi, "")
    .replace(/\bUse these as business-language grounding\.\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
