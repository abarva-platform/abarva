import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildSeedDeliverableRenderModel,
  findDeliverableByRoute,
  getSeedPlan,
  type SeedRouteContext,
} from "@/lib/deliverables/seed-route-resolver";
import { getEvidenceDetail } from "@/lib/deliverables/evidence-registry";
import { DeliverableTierRenderer } from "@/components/deliverables/DeliverableTierRenderer";
import {
  SeedGlobalPattern,
  SeedOperationsPortfolio,
  SeedPhaseOverview,
  SeedProgramOverview,
  SeedProgramsIndex,
  SeedTenantDashboard,
  SeedTenantPattern,
  SeedTenantTower,
  SeedTenantTowerSubsurface,
} from "@/components/deliverables/SeedRouteShell";
import {
  buildCanonicalRouteRecords,
  type CanonicalRouteRecord,
} from "@/lib/integrity/route-catalog";
import { getPatternManifestEntries } from "@/lib/intelligence/pattern-manifest";
import type { SpecPhaseNumber } from "@/lib/programs/enhancement-spec";

describe("canonical route integrity", () => {
  const routes = buildCanonicalRouteRecords().filter(
    (route) => route.surface !== "global_tower_surface",
  );
  const shellRenderRoutes = sampleRoutesBySurface(routes, 20);

  it("builds a canonical URL catalog for every seed-spec route surface", () => {
    const uniquePaths = new Set(routes.map((route) => route.path));

    expect(routes.length).toBeGreaterThan(25000);
    expect(uniquePaths.size).toBeGreaterThan(25000);
    expect(routes.every((route) => route.path.startsWith("/"))).toBe(true);
    expect(routes.some((route) => route.surface === "global_pattern")).toBe(
      true,
    );
    expect(routes.some((route) => route.surface === "tenant_pattern")).toBe(
      true,
    );
    expect(routes.some((route) => route.surface === "tenant_deliverable")).toBe(
      true,
    );
  });

  it("keeps route-visible pattern manifest text free of unresolved sentinel words", () => {
    const patternTextEntries = getPatternManifestEntries().flatMap((pattern) =>
      collectStringValues(pattern, pattern.slug),
    );
    const sentinelPattern = /(^|[>\s])(undefined|null)([<\s]|$)/i;
    const violations = patternTextEntries.filter((entry) =>
      sentinelPattern.test(entry.value),
    );

    expect(patternTextEntries.length).toBeGreaterThan(3000);
    if (violations.length > 0) {
      throw new Error(
        violations
          .slice(0, 10)
          .map((entry) => `${entry.path}: ${entry.value.slice(0, 160)}`)
          .join("\n"),
      );
    }
  });

  it("renders shell structure without unresolved tokens or leaked undefined/null strings", () => {
    expect(routes.length).toBeGreaterThan(600);
    expect(shellRenderRoutes.length).toBeGreaterThan(100);

    for (const route of shellRenderRoutes) {
      const html = renderRoute(route);
      expect(html).toContain("<main");
      expect(html).toMatch(/aria-label="(?:Route|Deliverable) breadcrumbs"/);
      expect(html).toContain("del-title");
      expect(html).toContain("del-footer");
      expect(html).not.toContain("{{");
      expect(html).not.toContain("}}");
      expect(html).not.toMatch(/(^|[>\s])undefined([<\s]|$)/i);
      expect(html).not.toMatch(/(^|[>\s])null([<\s]|$)/i);
    }
  });
});

function sampleRoutesBySurface(
  routes: CanonicalRouteRecord[],
  perSurface: number,
): CanonicalRouteRecord[] {
  const grouped = new Map<string, CanonicalRouteRecord[]>();
  for (const route of routes) {
    grouped.set(route.surface, [...(grouped.get(route.surface) ?? []), route]);
  }
  return [...grouped.values()].flatMap((surfaceRoutes) =>
    sampleRoutes(surfaceRoutes, perSurface),
  );
}

function sampleRoutes(
  routes: CanonicalRouteRecord[],
  targetCount: number,
): CanonicalRouteRecord[] {
  if (routes.length <= targetCount) return routes;
  const selected = new Map<string, CanonicalRouteRecord>();
  const stride = Math.max(1, Math.floor(routes.length / targetCount));
  for (let index = 0; index < routes.length; index += stride) {
    selected.set(routes[index].path, routes[index]);
  }
  selected.set(routes[0].path, routes[0]);
  selected.set(
    routes[Math.floor(routes.length / 2)].path,
    routes[Math.floor(routes.length / 2)],
  );
  selected.set(routes[routes.length - 1].path, routes[routes.length - 1]);
  return [...selected.values()].slice(0, targetCount);
}

function collectStringValues(
  value: unknown,
  path: string,
): Array<{ path: string; value: string }> {
  if (typeof value === "string") return [{ path, value }];
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectStringValues(entry, `${path}[${index}]`),
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, entry]) => collectStringValues(entry, `${path}.${key}`),
    );
  }
  return [];
}

function renderRoute(route: CanonicalRouteRecord): string {
  const plan = getSeedPlan();
  const tenant = route.tenantSlug
    ? plan.tenants.find((entry) => entry.routeSlug === route.tenantSlug)
    : null;

  switch (route.surface) {
    case "operations_portfolio":
      return renderToStaticMarkup(createElement(SeedOperationsPortfolio));
    case "tenant_dashboard":
      return renderToStaticMarkup(
        createElement(SeedTenantDashboard, { tenant: tenant! }),
      );
    case "tenant_programs":
      return renderToStaticMarkup(
        createElement(SeedProgramsIndex, { tenant: tenant! }),
      );
    case "tenant_program": {
      const program = tenant!.programs.find(
        (entry) => entry.programSlug === route.programSlug,
      )!;
      return renderToStaticMarkup(
        createElement(SeedProgramOverview, { tenant: tenant!, program }),
      );
    }
    case "tenant_program_phase": {
      const program = tenant!.programs.find(
        (entry) => entry.programSlug === route.programSlug,
      )!;
      return renderToStaticMarkup(
        createElement(SeedPhaseOverview, {
          tenant: tenant!,
          program,
          phase: phaseFromRoute(route),
        }),
      );
    }
    case "tenant_deliverable": {
      const context = deliverableContextForRoute(route)!;
      const model = buildSeedDeliverableRenderModel({
        tenant: context.tenant,
        program: context.program,
        deliverable: context.deliverable!,
      });
      return renderToStaticMarkup(
        createElement(DeliverableTierRenderer, { model }),
      );
    }
    case "tenant_evidence": {
      const detail = evidenceDetailForRoute(route.path);
      if (!detail) throw new Error(`No evidence detail for ${route.path}`);
      return renderToStaticMarkup(
        createElement(
          "main",
          null,
          createElement(
            "nav",
            { "aria-label": "Route breadcrumbs" },
            "Evidence",
          ),
          createElement("h1", { className: "del-title" }, detail.label),
          createElement("p", null, detail.reference),
          createElement(
            "footer",
            { className: "del-footer" },
            "Composite organization built from real-world data.",
          ),
        ),
      );
    }
    case "tenant_tower":
      return renderToStaticMarkup(
        createElement(SeedTenantTower, { tenant: tenant! }),
      );
    case "tenant_tower_subsurface":
      return renderToStaticMarkup(
        createElement(SeedTenantTowerSubsurface, {
          tenant: tenant!,
          surface: route.towerSurface!,
        }),
      );
    case "tenant_pattern":
      return renderToStaticMarkup(
        createElement(SeedTenantPattern, {
          tenant: tenant!,
          patternSlug: route.patternSlug!,
        }),
      );
    case "global_pattern":
      return renderToStaticMarkup(
        createElement(SeedGlobalPattern, { patternSlug: route.patternSlug! }),
      );
    default:
      throw new Error(`No canonical renderer for ${route.path}`);
  }
}

function deliverableContextForRoute(
  route: CanonicalRouteRecord,
): SeedRouteContext | null {
  const match = route.path.match(
    /^\/tenant\/([^/]+)\/programs\/([^/]+)\/deliverables\/([^/]+)$/,
  );
  if (!match) return null;
  return findDeliverableByRoute(match[1], match[2], match[3]);
}

function phaseFromRoute(route: CanonicalRouteRecord): SpecPhaseNumber {
  const match = route.path.match(/\/phase\/([1-5])$/);
  if (!match) throw new Error(`No phase segment found for ${route.path}`);
  return Number(match[1]) as SpecPhaseNumber;
}

function evidenceDetailForRoute(path: string) {
  const match = path.match(
    /^\/tenant\/([^/]+)\/programs\/([^/]+)\/evidence\/([^/]+)$/,
  );
  if (!match) return null;
  return getEvidenceDetail(match[1], match[2], decodeURIComponent(match[3]));
}
