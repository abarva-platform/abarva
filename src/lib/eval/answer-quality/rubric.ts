export const ANSWER_QUALITY_PASS_THRESHOLD = 75;

export const ANSWER_QUALITY_DIMENSIONS = [
  "clarity",
  "actionability",
  "noRawIds",
  "noUnexplainedJargon",
  "noFakePrecision",
  "realNextMove",
] as const;

export type AnswerQualityDimension = (typeof ANSWER_QUALITY_DIMENSIONS)[number];

export interface AnswerQualityViolation {
  dimension: AnswerQualityDimension;
  excerpt: string;
  remediation: string;
}

export interface AnswerQualityScore {
  overall: number;
  dimensions: Record<AnswerQualityDimension, number>;
  violations: AnswerQualityViolation[];
  gatePassed: boolean;
}

export interface AnswerQualityContext {
  questionId: string;
  tenantKey: string;
  surface: string;
}

export const EXECUTIVE_LEXICON = new Set([
  "AI",
  "API",
  "BAA",
  "BAFO",
  "CFO",
  "CHRO",
  "CISO",
  "CMIO",
  "COO",
  "CXO",
  "KPI",
  "NPS",
  "ROI",
  "SLA",
  "SOW",
  "ACO",
  "AIX",
  "AR",
  "BPA",
  "CARC",
  "CDI",
  "CMS",
  "CO",
  "DAX",
  "DNFB",
  "ED",
  "EDI",
  "EHR",
  "HCC",
  "ID",
  "MHK",
  "MSSP",
  "OPA",
  "PCP",
  "PHI",
  "PII",
  "PMPM",
  "QNXT",
  "RAF",
  "RARC",
  "RCM",
  "REACH",
  "TCOC",
  "VBC",
  "VP",
]);

export const RAW_ID_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "signal id", re: /\bsignal:[a-z0-9:_-]{8,}\b/i },
  {
    name: "uuid",
    re: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
  },
  {
    name: "database field id",
    re: /\b(?:client_id|tenant_id|user_id|engagement_id|initiative_id|source_event_id)\b/i,
  },
  { name: "internal stress code", re: /\bSTRESS-P\d+-\d+\b/i },
  { name: "internal corpus token", re: /\bworldview:W\d+:\d{3}\b/i },
  { name: "internal slug token", re: /\b(?:sub|usr|evt|prg)_[a-z0-9]{8,}\b/i },
];

export const ACTION_PATTERNS = [
  /\bnext (?:step|move)\b/i,
  /\brecommend(?:ation)?\b/i,
  /\bassign\b/i,
  /\bapprove\b/i,
  /\bescalate\b/i,
  /\bdecide\b/i,
  /\bvalidate\b/i,
  /\bopen\b/i,
  /\bowner\b/i,
];

export const VAGUE_ACTION_PATTERNS = [
  /\bconsider (?:exploring|looking|reviewing)\b/i,
  /\bkeep an eye\b/i,
  /\bmonitor (?:this|it)\b/i,
  /\bcircle back\b/i,
  /\breview as needed\b/i,
];

export const FAKE_PRECISION_PATTERN =
  /(?:\b\d+(?:\.\d+)?%|\$[0-9][0-9,]*(?:\.\d+)?(?:M|K|B)?\b|\b\d+(?:\.\d+)?x\b)/i;

export const SOURCE_CUE_PATTERN =
  /\b(?:source|cited|basis|because|from|as of|loaded|evidence|ledger|substrate|according to)\b/i;
