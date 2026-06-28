const RAW_RECORD_ID_RE =
  /\b(?:SHA|APP|APX|FC|LSH|MER|DORA|INIT|CAP|BF|MOD|VEND|SYS|DP)-[A-Z0-9]{2,24}(?:-\d{1,8})?\b/g;
const SYNTHETIC_BUSINESS_CODE_RE =
  /\b([A-Z][A-Za-z0-9]+(?:-[A-Z][A-Za-z0-9]+){1,})-\d{3,8}\b/g;
const UUID_RE =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const RAW_FILE_RE = /\b[\w.-]+\.(?:csv|jsonl|json|yaml|yml|xlsx|pdf|docx)\b/gi;
const ROW_LABEL_RE = /\bRow\s*:\s*\d+\b/gi;
type RawFieldReplacement = string | ((match: string, field: string) => string);

const RAW_FIELD_LABELS: Array<[RegExp, RawFieldReplacement]> = [
  [/\bai_maturity\s*:\s*1\b/gi, "AI maturity is early-stage"],
  [/\bai_maturity\s*:\s*2\b/gi, "AI maturity is emerging"],
  [/\bai_maturity\s*:\s*3\b/gi, "AI maturity is scaling"],
  [/\bai_maturity\s*:\s*4\b/gi, "AI maturity is mature"],
  [/\bai_maturity\s*:\s*5\b/gi, "AI maturity is advanced"],
  [/\bapp[ _-]?id\s*:\s*/gi, "application: "],
  [/\bcapability[ _-]?id\s*:\s*/gi, "capability: "],
  [/\bbusiness[ _-]?function[ _-]?id\s*:\s*/gi, "business function: "],
  [/\bsource[ _-]?record[ _-]?id\s*:\s*/gi, "source record: "],
  [/\b([a-z][a-z0-9]+(?:_[a-z0-9]+)+)\s*:/g, (_match, field: string) => `${field.replace(/_/g, " ")}:`],
];

export function cleanIntelligenceModelInputText(value: string): string {
  let text = value.replace(/\r\n/g, "\n");
  for (const [pattern, replacement] of RAW_FIELD_LABELS) {
    text = text.replace(pattern, replacement as string);
  }
  return text
    .replace(RAW_RECORD_ID_RE, "")
    .replace(SYNTHETIC_BUSINESS_CODE_RE, (_match, label: string) =>
      label.replace(/-/g, " "),
    )
    .replace(UUID_RE, "")
    .replace(RAW_FILE_RE, "source file")
    .replace(ROW_LABEL_RE, "")
    .replace(/\s+\)/g, ")")
    .replace(/\(\s+\)/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function cleanIntelligenceModelInput<T>(value: T): T {
  if (typeof value === "string") {
    return cleanIntelligenceModelInputText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => cleanIntelligenceModelInput(item)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        cleanIntelligenceModelInput(entry),
      ]),
    ) as T;
  }
  return value;
}

export function findRawModelInputLeaks(value: string): string[] {
  const leaks: string[] = [];
  if (RAW_RECORD_ID_RE.test(value)) leaks.push("raw_record_id");
  RAW_RECORD_ID_RE.lastIndex = 0;
  if (SYNTHETIC_BUSINESS_CODE_RE.test(value))
    leaks.push("synthetic_business_code");
  SYNTHETIC_BUSINESS_CODE_RE.lastIndex = 0;
  if (UUID_RE.test(value)) leaks.push("uuid");
  UUID_RE.lastIndex = 0;
  if (RAW_FILE_RE.test(value)) leaks.push("raw_file_name");
  RAW_FILE_RE.lastIndex = 0;
  if (ROW_LABEL_RE.test(value)) leaks.push("row_label");
  ROW_LABEL_RE.lastIndex = 0;
  if (/\bai_maturity\s*:/i.test(value)) leaks.push("raw_ai_maturity_field");
  return leaks;
}
