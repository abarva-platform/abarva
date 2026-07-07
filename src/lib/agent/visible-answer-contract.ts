export const VISIBLE_MODEL_OUTPUT_CONTRACT_PROMPT = [
  "VISIBLE ANSWER CONTRACT",
  "",
  "Write only the answer the user should see. Do not emit renderer instructions, debug labels, raw JSON, HTML, control markers, or internal routing syntax.",
  "",
  "If a surface supports companion tabs or canvases, describe the decision content in business language. The renderer may place structured content, but it must not need to rewrite your prose.",
  "",
  "Never output raw protocol markers such as <<<TAB:, grounding:, >>>, internal IDs without business labels, or placeholder syntax. If evidence is missing, say so plainly in executive language.",
].join("\n");

// tower-w7-visible-answer-contract: the senior-advisor voice contract. Claude owns
// the answer itself; AbarVa owns context, safety, routing, artifacts, and rendering
// around it. This prompt is the system-side half of that split — it tells the model
// what NOT to leak into visible prose. assertVisibleAnswerContract below is the
// runtime enforcement half, checked against actual model output.
export const VISIBLE_ANSWER_CONTRACT_PROMPT = [
  "You are a senior CXO advisor for AbarVa. Claude owns the answer: the judgment, the recommendation, the plain-English reasoning a CIO or CFO would expect from a trusted advisor.",
  "AbarVa owns context, safety, routing, artifacts, and rendering. Never narrate that machinery — the user should only ever see the advisor voice.",
  "",
  'No visible scaffolding labels. Do not prefix sentences with "Read:", "Evidence:", "Next:", or "Next move:" — write connected advisor prose instead.',
  "No raw record IDs, source keys, tenant evidence rows, semantic packets, read-models, or other implementation vocabulary. Translate every internal reference into the business fact it represents.",
  'No session-history phrases. Never say the answer is "the same as last time," reference how many turns have passed, or claim the answer "hasn\'t moved this session" — answer fresh, on the merits, every time.',
  'No stock generic closings that just list "inspect / compare / benchmark / challenge / shape" as an offer without a real point of view.',
  'No legacy internal agent branding (e.g. "Atlas") in the visible answer — the user-facing identity is aVa.',
].join("\n");

export interface VisibleAnswerContractViolation {
  id: string;
  detail: string;
}

export interface VisibleAnswerContractResult {
  passed: boolean;
  version: string;
  violations: VisibleAnswerContractViolation[];
}

export const VISIBLE_ANSWER_CONTRACT_VERSION =
  "tower-w7-visible-answer-contract";

const PROTOCOL_MARKER_RE = /<<<\s*TAB\s*:|>>>|(?:^|\n)\s*grounding\s*:/i;
const HTML_TAG_RE = /<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^<>]*)?>/;
const RAW_JSON_BLOB_RE = /^\s*[{[][\s\S]*[}\]]\s*$/;
const PLACEHOLDER_SYNTAX_RE = /\{\{[^}]+\}\}|\[(?:TODO|PLACEHOLDER|FIXME)\]/i;

const RAW_RECORD_ID_RE = /\b[A-Z]{2,8}-[A-Z0-9]{2,12}-\d{2,}\b/;
const SOURCE_KEY_RE = /\b[A-Z]\d{1,3}_[a-z0-9]+(?:_[a-z0-9]+)+\b/;
const LABEL_READ_RE = /(?:^|\n)\s*Read:/;
const LABEL_EVIDENCE_RE = /(?:^|\n)\s*Evidence:/;
const LABEL_NEXT_MOVE_RE = /(?:^|\n)\s*Next move:/i;
const LABEL_NEXT_RE = /(?:^|\n)\s*Next:/i;
const TENANT_EVIDENCE_RE = /\btenant evidence\b/i;
const SEMANTIC_PACKET_RE = /\bsemantic packet\b/i;
const IMPLEMENTATION_ROWS_RE = /\brows\b/i;
const STOCK_GENERIC_CLOSING_RE =
  /\binspect\b[\s\S]*?\b(?:compare|benchmark|challenge)\b[\s\S]*?\bor\b[\s\S]*?\bshape\b/i;
const INTERNAL_DOSSIER_TERMS_RE = /\bread[- ]model\b/i;
const SESSION_HISTORY_RE =
  /\b(?:same answer as the last \w+ turns?|all session\b|has\s?n'?t moved\b.{0,20}session)/i;
const ATLAS_BRANDING_RE = /\bAtlas\b/;

// Runtime enforcement of VISIBLE_ANSWER_CONTRACT_PROMPT: catches model output that
// leaked scaffolding labels, internal IDs/jargon, stock closings, session-history
// references, or legacy agent branding instead of plain senior-advisor prose.
export function assertVisibleAnswerContract(
  text: string,
): VisibleAnswerContractResult {
  const trimmed = text.trim();
  const violations: VisibleAnswerContractViolation[] = [];

  const check = (re: RegExp, id: string, detail: string) => {
    if (re.test(trimmed)) violations.push({ id, detail });
  };

  check(
    RAW_RECORD_ID_RE,
    "raw_record_id",
    "Output contains a raw record ID instead of its business name.",
  );
  check(
    SOURCE_KEY_RE,
    "source_key",
    "Output contains a raw source file/key reference.",
  );
  check(
    LABEL_READ_RE,
    "scaffolding_label_read",
    'Output uses a "Read:" scaffolding label instead of prose.',
  );
  check(
    LABEL_EVIDENCE_RE,
    "scaffolding_label_evidence",
    'Output uses an "Evidence:" scaffolding label instead of prose.',
  );
  check(
    LABEL_NEXT_MOVE_RE,
    "scaffolding_label_next_move",
    'Output uses a "Next move:" scaffolding label instead of prose.',
  );
  check(
    LABEL_NEXT_RE,
    "scaffolding_label_next",
    'Output uses a "Next:" scaffolding label instead of prose.',
  );
  check(
    TENANT_EVIDENCE_RE,
    "implementation_tenant_evidence",
    'Output references "tenant evidence" as implementation jargon.',
  );
  check(
    SEMANTIC_PACKET_RE,
    "implementation_semantic_packet",
    'Output references a "semantic packet" as implementation jargon.',
  );
  check(
    IMPLEMENTATION_ROWS_RE,
    "implementation_rows",
    'Output references data "rows" as implementation jargon.',
  );
  check(
    STOCK_GENERIC_CLOSING_RE,
    "stock_generic_closing",
    "Output ends with a stock inspect/compare/shape menu instead of a real recommendation.",
  );
  check(
    INTERNAL_DOSSIER_TERMS_RE,
    "internal_dossier_terms",
    "Output references internal read-model/dossier vocabulary.",
  );
  check(
    SESSION_HISTORY_RE,
    "session_history_language",
    "Output references prior turns or session history instead of answering fresh.",
  );
  check(
    ATLAS_BRANDING_RE,
    "atlas_branding",
    'Output uses legacy internal agent branding ("Atlas") instead of the aVa identity.',
  );
  check(
    PROTOCOL_MARKER_RE,
    "raw_protocol_marker",
    "Output contains a raw renderer/routing marker (e.g. <<<TAB:, grounding:, >>>) instead of business language.",
  );
  check(
    HTML_TAG_RE,
    "raw_html",
    "Output contains raw HTML markup instead of plain prose.",
  );
  if (trimmed.length > 0 && RAW_JSON_BLOB_RE.test(trimmed)) {
    violations.push({
      id: "raw_json",
      detail:
        "Output is a raw JSON blob instead of an executive-readable answer.",
    });
  }
  check(
    PLACEHOLDER_SYNTAX_RE,
    "placeholder_syntax",
    "Output contains unresolved placeholder syntax (e.g. {{...}}, [TODO]).",
  );

  return {
    passed: violations.length === 0,
    version: VISIBLE_ANSWER_CONTRACT_VERSION,
    violations,
  };
}
