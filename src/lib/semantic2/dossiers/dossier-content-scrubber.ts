export type DossierContentIssueSeverity = "warning" | "blocker";

export interface DossierContentIssue {
  path: string;
  term: string;
  severity: DossierContentIssueSeverity;
  reason: string;
}

const BLOCKING_PATTERNS: Array<{
  term: string;
  pattern: RegExp;
  reason: string;
}> = [
  {
    term: "source reference",
    pattern: /\bsource reference\b/i,
    reason:
      "Generic source-reference placeholder leaked into business content.",
  },
  {
    term: "enterprise source material",
    pattern: /\benterprise source material\b/i,
    reason:
      "Generic enterprise source placeholder leaked into business content.",
  },
  {
    term: "evidence item",
    pattern: /\bevidence item\b/i,
    reason: "Generic evidence-item type leaked into business content.",
  },
  {
    term: "semantic2",
    pattern: /\bsemantic2\b/i,
    reason: "Internal Semantic2 implementation label leaked.",
  },
  {
    term: "value_json",
    pattern: /\bvalue_json\b/i,
    reason: "Internal value-json field leaked.",
  },
  {
    term: "subject_semantic_key",
    pattern: /\bsubject_semantic_key\b/i,
    reason: "Internal key name leaked.",
  },
  {
    term: "fragment lookup",
    pattern: /\bfragment lookup\b/i,
    reason: "Internal retrieval-mode language leaked.",
  },
  {
    term: "no blocking gap visible",
    pattern: /\bno blocking gap visible\b/i,
    reason: "Internal gap-state language leaked.",
  },
  {
    term: "raw facts",
    pattern: /\braw facts?\b/i,
    reason: "Internal fact-store language leaked.",
  },
  {
    term: "source rows",
    pattern: /\bsource rows?\b/i,
    reason: "Internal row-store language leaked.",
  },
  {
    term: "edge rows",
    pattern: /\bedge rows?\b/i,
    reason: "Internal graph-store language leaked.",
  },
  {
    term: "internal table",
    pattern:
      /\b(?:enterprise_context|semantic2|mv_home|ai_control|operational_evidence|source_artifact)[_a-z0-9]*\b/i,
    reason: "Internal table or view name leaked.",
  },
  {
    term: "uuid",
    pattern:
      /\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/i,
    reason: "Raw UUID leaked into business content.",
  },
];

const WARNING_PATTERNS: Array<{
  term: string;
  pattern: RegExp;
  reason: string;
}> = [
  {
    term: "loaded data says",
    pattern: /\bloaded data says\b/i,
    reason: "Mechanical answer phrasing should not be user-facing.",
  },
  {
    term: "facts count",
    pattern: /\b\d+\s+facts?\b/i,
    reason: "Fact-count language should stay in operator reports.",
  },
  {
    term: "entities count",
    pattern: /\b\d+\s+entities\b/i,
    reason: "Entity-count language should stay in operator reports.",
  },
  {
    term: "relationships count",
    pattern: /\b\d+\s+relationships\b/i,
    reason: "Relationship-count language should stay in operator reports.",
  },
  {
    term: "citations count",
    pattern: /\b\d+\s+citations?\b/i,
    reason: "Citation-count language should stay in operator reports.",
  },
];

const SCANNED_KEYS = new Set([
  "facts",
  "entities",
  "relationships",
  "gaps",
  "branch_options",
  "derived_insights",
  "citations",
  "artifacts",
  "supported_questions",
  "business_labels",
  "coverage",
]);

export function hasJsonShapedValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const text = value.trim();
  if (!text) return false;
  if (/^[{[]/.test(text)) return true;
  if (/\\"[a-z0-9_]+\\"\s*:/.test(text)) return true;
  if (/^\{?\s*"[a-z0-9_]+":\s*".+"\}?$/i.test(text)) return true;
  return false;
}

function scanValue(
  value: unknown,
  path: string,
  issues: DossierContentIssue[],
): void {
  if (typeof value === "string") {
    if (hasJsonShapedValue(value)) {
      issues.push({
        path,
        term: "json-shaped value",
        severity: "blocker",
        reason:
          "JSON-shaped payload must be parsed before it can become a surface-eligible dossier value.",
      });
    }
    for (const item of BLOCKING_PATTERNS) {
      if (item.pattern.test(value))
        issues.push({
          path,
          term: item.term,
          severity: "blocker",
          reason: item.reason,
        });
    }
    for (const item of WARNING_PATTERNS) {
      if (item.pattern.test(value))
        issues.push({
          path,
          term: item.term,
          severity: "warning",
          reason: item.reason,
        });
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      scanValue(item, `${path}[${index}]`, issues),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    scanValue(child, path ? `${path}.${key}` : key, issues);
  }
}

export function detectDossierContentIssues(
  dossier: unknown,
): DossierContentIssue[] {
  const packet =
    dossier && typeof dossier === "object"
      ? (dossier as Record<string, unknown>)
      : {};
  const issues: DossierContentIssue[] = [];
  const target: Record<string, unknown> = {};
  for (const key of SCANNED_KEYS) {
    if (key in packet) target[key] = packet[key];
  }
  scanValue(Object.keys(target).length ? target : packet, "", issues);
  return issues;
}

export function businessLanguageClean(dossier: unknown): boolean {
  return !detectDossierContentIssues(dossier).some(
    (issue) => issue.severity === "blocker",
  );
}
