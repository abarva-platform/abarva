import type { AskSource, AskSurfaceContext } from "./types";

export interface RetiredFactFinding {
  tenantKey: string;
  factId: string;
  label: string;
  match: string;
  location: string;
  sourceId?: string | null;
  sourceName?: string;
}

interface RetiredFactPattern {
  factId: string;
  label: string;
  re: RegExp;
}

const LAKESHORE_KEYS = new Set([
  "lakeshore",
  "lakeshoreholdings",
  "lakeshore-holdings",
  "lakeshoreindustries",
  "lakeshore-industries",
]);

const LAKESHORE_RETIRED_FACTS: RetiredFactPattern[] = [
  {
    factId: "old_revenue_54_2b",
    label: "Retired Lakeshore revenue $54.2B",
    re: /\$?\s*54\.2\s*(?:B|billion)\b/i,
  },
  {
    factId: "old_employee_count_72000",
    label: "Retired Lakeshore employee count 72,000",
    re: /\b72,?000\s+(?:FTEs?|employees|people|headcount)\b/i,
  },
  {
    factId: "old_plant_count_89",
    label: "Retired Lakeshore plant count 89 manufacturing plants",
    re: /\b89\s+manufacturing\s+plants\b/i,
  },
  {
    factId: "old_tech_budget_1_8b",
    label: "Retired Lakeshore technology budget $1.8B",
    re: /\$?\s*1\.8\s*(?:B|billion)\s+(?:annual\s+)?technology\s+budget\b/i,
  },
  {
    factId: "old_ai_budget_54m",
    label: "Retired Lakeshore AI/data budget $54M",
    re: /\$?\s*54\s*(?:M|million)\s+(?:AI|AI\/data|data)\s+budget\b/i,
  },
  {
    factId: "old_alias_lakeshore_industries",
    label: "Retired Lakeshore Industries alias",
    re: /\bLakeshore\s+(?:Holdings\s+)?Industries\b/i,
  },
  {
    factId: "old_opco_harborpoint",
    label: "Retired Lakeshore HarborPoint portfolio company",
    re: /\bHarborPoint(?:\s+Packaging\s+Group)?\b/i,
  },
  {
    factId: "old_opco_riverton",
    label: "Retired Lakeshore Riverton portfolio company",
    re: /\bRiverton(?:\s+Components\s+&\s+Field\s+Services)?\b/i,
  },
  {
    factId: "old_opco_keystone",
    label: "Retired Lakeshore Keystone portfolio company",
    re: /\bKeystone\s+Industrial\s+Services\b/i,
  },
];

export function scanRetiredFacts(input: {
  tenantKey?: string | null;
  tenantName?: string | null;
  surfaceContext?: AskSurfaceContext | null;
  sources?: AskSource[];
  textBlocks?: Array<{ location: string; text: string | null | undefined }>;
}): RetiredFactFinding[] {
  const tenantKey = normalizeTenantKey(input.tenantKey ?? input.tenantName);
  if (!isLakeshore(tenantKey)) return [];

  const findings: RetiredFactFinding[] = [];
  const scan = (
    location: string,
    text: string | null | undefined,
    source?: AskSource,
  ) => {
    if (!text) return;
    for (const pattern of LAKESHORE_RETIRED_FACTS) {
      const match = pattern.re.exec(text);
      if (!match) continue;
      findings.push({
        tenantKey: "lakeshore-holdings",
        factId: pattern.factId,
        label: pattern.label,
        match: match[0],
        location,
        sourceId: source?.id,
        sourceName: source?.name,
      });
    }
  };

  if (input.surfaceContext) {
    scan("surfaceContext", JSON.stringify(input.surfaceContext));
  }
  for (const source of input.sources ?? []) {
    scan(`source:${source.id ?? source.name}:name`, source.name, source);
    scan(`source:${source.id ?? source.name}:detail`, source.detail, source);
    if (source.structured) {
      scan(
        `source:${source.id ?? source.name}:structured`,
        JSON.stringify(source.structured),
        source,
      );
    }
  }
  for (const block of input.textBlocks ?? []) {
    scan(block.location, block.text);
  }

  return dedupeFindings(findings);
}

export function buildRetiredFactError(findings: RetiredFactFinding[]): string {
  const sample = findings
    .slice(0, 5)
    .map((finding) =>
      [
        finding.factId,
        finding.location,
        finding.sourceId ?? finding.sourceName ?? null,
      ]
        .filter(Boolean)
        .join("@"),
    )
    .join("; ");
  return `retired_fact_violation: ${sample}`;
}

function normalizeTenantKey(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

function isLakeshore(key: string): boolean {
  const compact = key.replace(/-/g, "");
  return LAKESHORE_KEYS.has(key) || LAKESHORE_KEYS.has(compact);
}

function dedupeFindings(findings: RetiredFactFinding[]): RetiredFactFinding[] {
  const seen = new Set<string>();
  return findings.filter((finding) => {
    const key = [
      finding.factId,
      finding.location,
      finding.sourceId,
      finding.match.toLowerCase(),
    ].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
