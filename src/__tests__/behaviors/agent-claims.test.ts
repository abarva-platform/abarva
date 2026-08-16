// Behavior tests for claim & citation validation (PR-4).

import type { TraceRetrievedObject } from "@/lib/agent-trace/types";
import {
  detectClaims,
  detectTenantLeakage,
  validateClaimsAndCitations,
  validatePatternNamespaces,
} from "@/lib/agent-claims";
import type { PatternCatalog, ValidateInput } from "@/lib/agent-claims/types";

function trace(
  overrides: Partial<ValidateInput["trace"]> = {},
): ValidateInput["trace"] {
  return {
    tenant_key: "skyharbor-air",
    retrieved_tenant_context: [],
    retrieved_corpus_patterns: [],
    retrieved_artifacts: [],
    citation_objects_emitted: [],
    ...overrides,
  };
}

const fact = (id: string): TraceRetrievedObject => ({
  id,
  kind: "structured_fact",
  confidence: 0.8,
});
const pattern = (id: string, namespace: string): TraceRetrievedObject => ({
  id,
  kind: "corpus_pattern",
  namespace,
  confidence: 0.8,
});

describe("detectClaims", () => {
  it("classifies value, KPI, and risk claims", () => {
    const claims = detectClaims(
      "The tenant can save $40M annually. We can reduce AHT by 30%. The main risk is poor intent coverage.",
    );
    const types = claims.map((c) => c.type);
    expect(types).toContain("value_claim");
    expect(types).toContain("kpi_outcome_claim");
    expect(types).toContain("risk_failure_mode_claim");
  });
});

describe("validateClaimsAndCitations · evidence mapping", () => {
  it("marks a value claim supported when tenant evidence exists", () => {
    const result = validateClaimsAndCitations({
      trace: trace({ retrieved_tenant_context: [fact("f1")] }),
      answerText:
        "The tenant can save $40M annually by automating the contact center.",
    });
    expect(result.unsupportedClaims).toHaveLength(0);
    expect(result.claimValidationStatus).toBe("pass");
  });

  it("flags an unsupported critical value claim when no evidence exists", () => {
    const result = validateClaimsAndCitations({
      trace: trace(),
      answerText: "The tenant can save $40M annually.",
    });
    expect(result.unsupportedClaims).toHaveLength(1);
    expect(result.unsupportedClaims[0].critical).toBe(true);
    expect(result.claimValidationStatus).toBe("fail");
    expect(result.unsupportedClaims[0].recommendedFixLane).toBeTruthy();
  });

  it("accepts a numeric claim that carries an explicit assumption caveat", () => {
    const result = validateClaimsAndCitations({
      trace: trace(),
      answerText:
        "Roughly, a $40M order-of-magnitude value pool is plausible, but I do not have the loaded baseline to confirm.",
    });
    expect(result.claimValidationStatus).toBe("pass");
    const valueVerdict = result.claims.find(
      (c) => c.claim.type === "value_claim",
    );
    expect(valueVerdict?.supportBasis).toBe("stated_assumption");
  });

  it("treats risk / next-action as advisory (no citation required)", () => {
    const result = validateClaimsAndCitations({
      trace: trace(),
      answerText:
        "The main risk is intent coverage; mitigate with a human-in-the-loop fallback.",
    });
    expect(result.unsupportedClaims).toHaveLength(0);
  });
});

describe("validatePatternNamespaces", () => {
  const catalog: PatternCatalog = {
    lookup(id) {
      const db: Record<string, { id: string; namespaces: string[] }> = {
        "retail-contact-center": {
          id: "retail-contact-center",
          namespaces: ["retail"],
        },
        "airline-irops": { id: "airline-irops", namespaces: ["airline"] },
      };
      return db[id.toLowerCase()] ?? null;
    },
  };

  it("flags a phantom pattern id (exists nowhere)", () => {
    const findings = validatePatternNamespaces({
      tenantKey: "apex-retail",
      citedPatternIds: ["totally-made-up-pattern"],
      tracePatterns: [],
      patternCatalog: catalog,
    });
    expect(findings).toHaveLength(1);
    expect(findings[0].kind).toBe("phantom");
  });

  it("flags a cross-namespace citation (retail pattern for an airline tenant)", () => {
    const findings = validatePatternNamespaces({
      tenantKey: "skyharbor-air",
      citedPatternIds: ["retail-contact-center"],
      tracePatterns: [],
      patternCatalog: catalog,
    });
    expect(findings).toHaveLength(1);
    expect(findings[0].kind).toBe("cross_namespace");
  });

  it("does NOT flag an in-namespace pattern", () => {
    const findings = validatePatternNamespaces({
      tenantKey: "skyharbor-air",
      citedPatternIds: ["airline-irops"],
      tracePatterns: [],
      patternCatalog: catalog,
    });
    expect(findings).toHaveLength(0);
  });

  it("case-insensitive: a real lowercase slug cited in upper-case is not phantom", () => {
    const findings = validatePatternNamespaces({
      tenantKey: "skyharbor-air",
      citedPatternIds: ["AIRLINE-IROPS"],
      tracePatterns: [],
      patternCatalog: catalog,
    });
    expect(findings).toHaveLength(0);
  });

  it("uses trace pattern namespace when no catalog is injected", () => {
    const findings = validatePatternNamespaces({
      tenantKey: "skyharbor-air",
      citedPatternIds: ["retail-contact-center"],
      tracePatterns: [pattern("retail-contact-center", "retail")],
    });
    expect(findings[0]?.kind).toBe("cross_namespace");
  });
});

describe("detectTenantLeakage", () => {
  it("detects a reference to another tenant", () => {
    const findings = detectTenantLeakage(
      "Like Meridian Health did in their EHR rollout, SkyHarbor should pilot.",
      "skyharbor-air",
    );
    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].offendingTenantKey).toBe("meridian-health");
  });

  it("does not flag the answer for naming its own tenant", () => {
    const findings = detectTenantLeakage(
      "SkyHarbor should pilot contact-center AI on the highest-volume queue.",
      "skyharbor-air",
    );
    expect(findings).toHaveLength(0);
  });

  it('does NOT false-positive on common words like "first" (First Capital first word)', () => {
    const findings = detectTenantLeakage(
      "In the first quarter, SkyHarbor should prioritise the first-half KPI baseline.",
      "skyharbor-air",
    );
    expect(findings).toHaveLength(0);
  });

  it("does NOT flag retired-tenant cover names without an explicit roster", () => {
    const findings = detectTenantLeakage(
      "SkyHarbor should benchmark against Apex Retail.",
      "skyharbor-air",
    );
    expect(findings).toHaveLength(0);
  });

  it("still flags a retired full cover name when an explicit roster is supplied", () => {
    const findings = detectTenantLeakage(
      "SkyHarbor should benchmark against Apex Retail.",
      "skyharbor-air",
      [{ key: "apex-retail", name: "Apex Retail" }],
    );
    expect(findings.some((f) => f.offendingTenantKey === "apex-retail")).toBe(
      true,
    );
  });

  it("still flags another retired full cover name when an explicit roster is supplied", () => {
    const findings = detectTenantLeakage(
      "SkyHarbor should copy what First Capital did.",
      "skyharbor-air",
      [{ key: "first-capital", name: "First Capital" }],
    );
    expect(findings.some((f) => f.offendingTenantKey === "first-capital")).toBe(
      true,
    );
  });

  it("still flags distinctive tenant first-words (Meridian)", () => {
    const findings = detectTenantLeakage(
      "Like Meridian did, SkyHarbor should...",
      "skyharbor-air",
    );
    expect(
      findings.some((f) => f.offendingTenantKey === "meridian-health"),
    ).toBe(true);
  });

  it("full pipeline: leakage sets tenant_isolation_status to fail", () => {
    const result = validateClaimsAndCitations({
      trace: trace(),
      answerText:
        "Meridian Health solved this with clinical workflow automation.",
    });
    expect(result.tenantIsolationStatus).toBe("fail");
  });
});
