import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getSeedPlan } from "@/lib/deliverables/seed-route-resolver";
import {
  SeedGlobalPattern,
  SeedTenantPattern,
} from "@/components/deliverables/SeedRouteShell";
import {
  buildCanonicalRouteRecords,
  type CanonicalRouteRecord,
} from "@/lib/integrity/route-catalog";

const PIPELINE_COPY =
  "This pattern receives observations from completed Phase 5 programs. When Morrison reaches Phase 5 outcome attestation, observations will be anonymized, composite-tagged, and contributed back to this pattern.";
const ZERO_STATE_COPY =
  "0 observations contributed to date. Pipeline schema ready.";

describe("pattern observation pipeline", () => {
  const routes = buildCanonicalRouteRecords().filter(
    (route) =>
      route.surface === "global_pattern" || route.surface === "tenant_pattern",
  );
  const renderRoutes = sampleRoutesBySurface(routes, 25);

  it("renders the observations pipeline section on representative canonical pattern routes", () => {
    expect(routes.length).toBeGreaterThan(0);
    expect(renderRoutes.length).toBeGreaterThan(25);

    for (const route of renderRoutes) {
      const html = renderRoute(route);
      expect(html).toContain("Observations pipeline");
      expect(html).toContain(PIPELINE_COPY);
      expect(html).toContain(ZERO_STATE_COPY);
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

function renderRoute(route: CanonicalRouteRecord): string {
  const plan = getSeedPlan();
  const tenant = route.tenantSlug
    ? plan.tenants.find((entry) => entry.routeSlug === route.tenantSlug)
    : null;

  switch (route.surface) {
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
      throw new Error(`Unsupported route ${route.path}`);
  }
}
