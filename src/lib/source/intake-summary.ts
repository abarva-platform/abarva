import type { IntakeFieldId } from "./intake-intent";

export interface SourceIntakeSummary {
  scopeBoundary?: string;
  valueTarget?: string;
  baselineOwner?: string;
  category?: string;
}

export type SourceIntakeTextPatch = Partial<Record<IntakeFieldId, string>>;

const SCOPE_LABEL = "Scope boundary";
const VALUE_LABEL = "Value target";
const BASELINE_LABEL = "Baseline owner";
const CATEGORY_LABEL = "Category";

const FIELD_LABELS: Array<{
  field: IntakeFieldId | keyof SourceIntakeSummary;
  pattern: RegExp;
}> = [
  {
    field: "trigger",
    pattern: /^(?:why now(?:\s*\/\s*trigger)?|trigger|sourcing trigger|business trigger|problem)\b/i,
  },
  {
    field: "decisionOwner",
    pattern: /^(?:decision owner|owner|sponsor|executive sponsor|approval owner)\b/i,
  },
  {
    field: "scopeBoundary",
    pattern: /^(?:scope boundary|scope|in scope|services in scope|work in scope)\b/i,
  },
  {
    field: "valueTarget",
    pattern: /^(?:value target|value basis|savings target|commercial outcome|expected deal size|deal size|value)\b/i,
  },
  {
    field: "baselineOwner",
    pattern: /^(?:baseline owner|minimum data(?:\s*\/\s*baseline owner)?|minimum evidence owner|data owner|evidence owner)\b/i,
  },
  {
    field: "category",
    pattern: /^(?:category|event category|sourcing category)\b/i,
  },
];

export function buildSourceScopeDescription(
  summary: SourceIntakeSummary,
): string | undefined {
  const lines = [
    summary.scopeBoundary?.trim()
      ? `${SCOPE_LABEL}: ${summary.scopeBoundary.trim()}`
      : null,
    summary.valueTarget?.trim()
      ? `${VALUE_LABEL}: ${summary.valueTarget.trim()}`
      : null,
    summary.baselineOwner?.trim()
      ? `${BASELINE_LABEL}: ${summary.baselineOwner.trim()}`
      : null,
    summary.category?.trim() ? `${CATEGORY_LABEL}: ${summary.category.trim()}` : null,
  ].filter((line): line is string => Boolean(line));
  return lines.length > 0 ? lines.join("\n") : undefined;
}

export function parseSourceScopeDescription(
  raw: string | null | undefined,
): SourceIntakeSummary {
  const parsed = parseLabeledSourceText(raw ?? "");
  const scopeBoundary =
    readField(parsed, "scopeBoundary") ??
    readField(parsed, "scope") ??
    rawPlainScope(raw);
  return {
    scopeBoundary,
    valueTarget: readField(parsed, "valueTarget"),
    baselineOwner: readField(parsed, "baselineOwner"),
    category: readField(parsed, "category"),
  };
}

export function parseSourceIntakeText(
  raw: string | null | undefined,
): SourceIntakeTextPatch {
  const parsed = parseLabeledSourceText(raw ?? "");
  const patch: SourceIntakeTextPatch = {};
  for (const id of [
    "trigger",
    "decisionOwner",
    "scopeBoundary",
    "valueTarget",
    "baselineOwner",
  ] as const) {
    const value = readField(parsed, id);
    if (value) patch[id] = value;
  }
  return patch;
}

function parseLabeledSourceText(raw: string): Map<string, string> {
  const result = new Map<string, string>();
  let currentKey: string | null = null;
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const labeled = splitLabelAndValue(line);
    if (labeled) {
      currentKey = labeled.key;
      appendField(result, currentKey, labeled.value);
      continue;
    }
    if (currentKey) appendField(result, currentKey, line);
  }
  return result;
}

function splitLabelAndValue(
  line: string,
): { key: string; value: string } | null {
  const match = line.match(/^([^:–—-]{2,72})\s*[:–—-]\s*(.+)$/);
  if (!match) return null;
  const label = match[1]?.trim() ?? "";
  const value = match[2]?.trim() ?? "";
  const field = FIELD_LABELS.find((candidate) =>
    candidate.pattern.test(label),
  )?.field;
  if (!field || !value) return null;
  return { key: field, value };
}

function appendField(result: Map<string, string>, key: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return;
  const current = result.get(key);
  result.set(key, current ? `${current}\n${trimmed}` : trimmed);
}

function readField(
  parsed: Map<string, string>,
  key: string,
): string | undefined {
  const value = parsed.get(key)?.trim();
  return value ? value : undefined;
}

function rawPlainScope(raw: string | null | undefined): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return FIELD_LABELS.some((field) => field.pattern.test(trimmed))
    ? undefined
    : trimmed;
}
