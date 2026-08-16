// Behavior tests for the domain/subdomain expert QA matrix (PR-6).

import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import {
  buildExpertMatrix,
  buildMatrixForTenant,
  DOMAINS,
  QUESTION_ARCHETYPES,
} from "@/lib/agent-domain-matrix";

describe("expert matrix · structure", () => {
  const matrix = buildExpertMatrix();

  it("covers every canonical tenant (code-derived)", () => {
    const keys = new Set(matrix.map((q) => q.tenantKey));
    for (const key of CANONICAL_TENANT_KEYS) expect(keys.has(key)).toBe(true);
  });

  it("includes the current active canonical tenants", () => {
    const keys = new Set(matrix.map((q) => q.tenantKey));
    expect(keys.has("meridian-health")).toBe(true);
    expect(keys.has("skyharbor-air")).toBe(true);
  });

  it("emits all 10 archetypes for every (tenant, domain, subdomain)", () => {
    const skyharbor = buildMatrixForTenant({
      key: "skyharbor-air",
      name: "Airline Demo",
      industry: "airline",
    });
    const groups = new Map<string, Set<string>>();
    for (const q of skyharbor) {
      const k = `${q.domain}:${q.subdomain}`;
      if (!groups.has(k)) groups.set(k, new Set());
      groups.get(k)!.add(q.archetype);
    }
    for (const [, archetypes] of groups) {
      expect(archetypes.size).toBe(QUESTION_ARCHETYPES.length);
    }
  });

  it("gives at least 10 questions per subdomain selected for the tenant", () => {
    const skyharbor = buildMatrixForTenant({
      key: "skyharbor-air",
      name: "Airline Demo",
      industry: "airline",
    });
    const perSubdomain = new Map<string, number>();
    for (const q of skyharbor) {
      const k = `${q.domain}:${q.subdomain}`;
      perSubdomain.set(k, (perSubdomain.get(k) ?? 0) + 1);
    }
    for (const [, count] of perSubdomain)
      expect(count).toBeGreaterThanOrEqual(10);
  });

  it("has a missing-evidence negative test in every subdomain", () => {
    const skyharbor = buildMatrixForTenant({
      key: "skyharbor-air",
      name: "Airline Demo",
      industry: "airline",
    });
    const subdomains = new Set(
      skyharbor.map((q) => `${q.domain}:${q.subdomain}`),
    );
    for (const sd of subdomains) {
      const hasNegative = skyharbor.some(
        (q) => `${q.domain}:${q.subdomain}` === sd && q.negativeTest,
      );
      expect(hasNegative).toBe(true);
    }
  });

  it("applies industry filtering (supply_chain excluded for healthcare_provider)", () => {
    const meridian = buildMatrixForTenant({
      key: "meridian-health",
      name: "Meridian Health System",
      industry: "healthcare_provider",
    });
    expect(meridian.some((q) => q.domain === "supply_chain")).toBe(false);
    const skyharbor = buildMatrixForTenant({
      key: "skyharbor-air",
      name: "Airline Demo",
      industry: "airline",
    });
    expect(skyharbor.some((q) => q.domain === "supply_chain")).toBe(true);
  });

  it("uses unique tenant-scoped question ids", () => {
    const ids = matrix.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("defines 16 domains", () => {
    expect(DOMAINS.length).toBe(16);
  });
});
