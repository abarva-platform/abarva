import type { AskSource, AskSurfaceContext } from "./types";
import {
  resolveTenantSafetyPolicy,
  tenantSafetyBlockingPatterns,
} from "./tenant-safety-policy";

export interface RetiredFactFinding {
  tenantKey: string;
  factId: string;
  label: string;
  match: string;
  location: string;
  sourceId?: string | null;
  sourceName?: string;
}

export function scanRetiredFacts(input: {
  tenantKey?: string | null;
  tenantName?: string | null;
  surfaceContext?: AskSurfaceContext | null;
  sources?: AskSource[];
  textBlocks?: Array<{ location: string; text: string | null | undefined }>;
}): RetiredFactFinding[] {
  const policy = resolveTenantSafetyPolicy(input.tenantKey, input.tenantName);
  if (!policy) return [];

  const findings: RetiredFactFinding[] = [];
  const patterns = tenantSafetyBlockingPatterns(policy);
  const scan = (
    location: string,
    text: string | null | undefined,
    source?: AskSource,
  ) => {
    if (!text) return;
    for (const pattern of patterns) {
      const match = pattern.re.exec(text);
      if (!match) continue;
      findings.push({
        tenantKey: policy.tenantKey,
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
