import { detectDossierContentIssues } from "./dossier-content-scrubber";
import { thresholdForDimension } from "./dossier-quality-thresholds";
import { classifyTenantScope } from "./tenant-scope-policy";

export type DossierEligibilityLevel =
  | "ready"
  | "partial"
  | "operator_only"
  | "blocked";

export interface DossierSurfaceEligibilityMetrics {
  coverage: number;
  confidence: number;
  facts: number;
  entities: number;
  relationships: number;
  evidenceRefs: number;
  citations: number;
  usableCitations: number;
  blockerLeaks: number;
  warningLeaks: number;
}

export interface DossierSurfaceEligibilityResult {
  dossierId: string;
  tenantKey: string;
  canonicalTenantKey: string;
  dimension: string;
  surfaceEligible: boolean;
  eligibilityLevel: DossierEligibilityLevel;
  reasons: string[];
  warnings: string[];
  requiredFixes: string[];
  metrics: DossierSurfaceEligibilityMetrics;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function relationshipsContain(
  dossier: Record<string, unknown>,
  alternatives: string[],
): boolean {
  const relationships = asArray(dossier.relationships).map((relationship) => {
    const item = asRecord(relationship);
    return `${text(item.relationship)} ${text(item.relationship_type)} ${text(item.relationship_label)}`.toLowerCase();
  });
  return alternatives.some((candidate) =>
    relationships.some((relationship) =>
      relationship.includes(candidate.toLowerCase()),
    ),
  );
}

function factsContain(
  dossier: Record<string, unknown>,
  hints: string[],
): boolean {
  if (!hints.length) return true;
  const facts = asArray(dossier.facts)
    .map((fact) => {
      const item = asRecord(fact);
      return `${text(item.label)} ${text(item.value)} ${text(item.unit)}`.toLowerCase();
    })
    .join(" ");
  return hints.every((hint) => facts.includes(hint.toLowerCase()));
}

function isUsableCitation(value: unknown): boolean {
  const citation = asRecord(value);
  const label = text(citation.label ?? citation.citation_label);
  const area = text(
    citation.source_area ?? citation.sourceTable ?? citation.source_table,
  );
  const confidence = asNumber(citation.confidence, 0);
  if (!label || !area || confidence <= 0) return false;
  if (
    /generic|source support|source reference|evidence item/i.test(label) &&
    !/admin upload|operational|ai|budget|vendor|risk|application|enterprise|business/i.test(
      area,
    )
  )
    return false;
  return true;
}

export function evaluateDossierSurfaceEligibility(args: {
  dossier: unknown;
  dossierId?: string;
  tenantKey?: string;
  dimensionKey?: string;
}): DossierSurfaceEligibilityResult {
  const dossier = asRecord(args.dossier);
  const tenantKey =
    args.tenantKey ?? text(dossier.tenantKey ?? dossier.tenant_key);
  const dimension =
    args.dimensionKey ?? text(dossier.dimensionKey ?? dossier.dimension_key);
  const scope = classifyTenantScope(tenantKey);
  const coverage = asRecord(dossier.coverage);
  const threshold = thresholdForDimension(dimension);
  const facts = asArray(dossier.facts);
  const entities = asArray(dossier.entities);
  const relationships = asArray(dossier.relationships);
  const citations = asArray(dossier.citations);
  const usableCitations = citations.filter(isUsableCitation);
  const issues = detectDossierContentIssues(dossier);
  const blockerLeaks = issues.filter((issue) => issue.severity === "blocker");
  const warningLeaks = issues.filter((issue) => issue.severity === "warning");
  const reasons: string[] = [];
  const warnings: string[] = warningLeaks.map(
    (issue) => `${issue.path}: ${issue.term}`,
  );
  const requiredFixes: string[] = [];

  if (!scope.surfaceEligible) {
    reasons.push(scope.reason);
    requiredFixes.push(
      "Map this scope to an approved runtime tenant or keep it operator-only.",
    );
  }
  if (blockerLeaks.length) {
    reasons.push(
      `Business-language detector found ${blockerLeaks.length} blocker leak(s).`,
    );
    requiredFixes.push(
      "Re-derive the deterministic skeleton so internal placeholders and JSON values do not enter business fields.",
    );
  }

  const metrics: DossierSurfaceEligibilityMetrics = {
    coverage: asNumber(coverage.score ?? dossier.coverage_score),
    confidence: asNumber(coverage.confidence ?? dossier.confidence),
    facts: facts.length,
    entities: entities.length,
    relationships: relationships.length,
    evidenceRefs: citations.length,
    citations: citations.length,
    usableCitations: usableCitations.length,
    blockerLeaks: blockerLeaks.length,
    warningLeaks: warningLeaks.length,
  };

  if (metrics.coverage < threshold.minCoverage) {
    reasons.push(
      `Coverage ${metrics.coverage.toFixed(2)} is below ${threshold.minCoverage.toFixed(2)}.`,
    );
    requiredFixes.push(
      "Load or map the missing source areas for this dimension.",
    );
  }
  if (metrics.confidence < threshold.minConfidence) {
    reasons.push(
      `Confidence ${metrics.confidence.toFixed(2)} is below ${threshold.minConfidence.toFixed(2)}.`,
    );
    requiredFixes.push("Improve source confidence, freshness, or attestation.");
  }
  if (metrics.facts < threshold.minFacts) {
    reasons.push(`Facts ${metrics.facts} is below ${threshold.minFacts}.`);
    requiredFixes.push(
      "Extract real typed facts from source rows, not source-contract placeholders.",
    );
  }
  if (metrics.entities < threshold.minEntities) {
    reasons.push(
      `Entities ${metrics.entities} is below ${threshold.minEntities}.`,
    );
    requiredFixes.push(
      "Resolve business entities for this tenant and dimension.",
    );
  }
  if (metrics.relationships < threshold.minRelationships) {
    reasons.push(
      `Relationships ${metrics.relationships} is below ${threshold.minRelationships}.`,
    );
    requiredFixes.push(
      "Create source-backed relationship edges for this dimension.",
    );
  }
  if (metrics.usableCitations < threshold.minUsableCitations) {
    reasons.push(
      `Usable citations ${metrics.usableCitations} is below ${threshold.minUsableCitations}.`,
    );
    requiredFixes.push(
      "Attach human-readable citation labels and source references to claims.",
    );
  }
  for (const group of threshold.requiredRelationshipGroups ?? []) {
    if (!relationshipsContain(dossier, group)) {
      reasons.push(
        `Required relationship group missing: ${group.join(" OR ")}.`,
      );
      requiredFixes.push(
        "Derive or load the required relationship type from source-backed evidence.",
      );
    }
  }
  if (!factsContain(dossier, threshold.requiredFactHints ?? [])) {
    reasons.push(
      `Required fact hints missing: ${(threshold.requiredFactHints ?? []).join(", ")}.`,
    );
    requiredFixes.push(
      "Extract finance/metric-specific fields with period, amount type, currency, classification, and confidence.",
    );
  }

  let eligibilityLevel: DossierEligibilityLevel = "ready";
  if (!scope.surfaceEligible || blockerLeaks.length)
    eligibilityLevel = "blocked";
  else if (reasons.length)
    eligibilityLevel =
      metrics.facts > 0 || metrics.entities > 0 ? "partial" : "operator_only";

  return {
    dossierId: args.dossierId ?? text(dossier.dossierId ?? dossier.id),
    tenantKey,
    canonicalTenantKey: scope.canonicalTenantKey,
    dimension,
    surfaceEligible: eligibilityLevel === "ready",
    eligibilityLevel,
    reasons,
    warnings,
    requiredFixes: [...new Set(requiredFixes)],
    metrics,
  };
}
