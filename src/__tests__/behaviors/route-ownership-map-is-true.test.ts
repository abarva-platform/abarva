import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { ACTIVE_ROUTE_OWNERSHIP_MAP } from "@/lib/qa/active-route-ownership-map";

/**
 * The route-ownership map is a QA reference for what is actually mounted: which
 * file serves each route, which page component it renders, and which shell or
 * nav it pulls in. Other audits read it, and people read it to decide whether a
 * surface is live.
 *
 * Nothing checked that any of it was true. On 2026-09-19 **eleven** of its
 * import claims were false across six of its eight routes. The one that cost
 * time: it named `SentinelEngagementCanvas` as the current primary visible
 * component of `/source/events/[eventId]`, and that route imports
 * `SourceAnalyticsCanvas` instead — `SentinelEngagementCanvas` is referenced by
 * no file under `src/app` at all.
 *
 * That mattered beyond tidiness. Twenty-four Source integration suites were
 * quarantined around components reached only from that canvas, and the largest
 * failure cluster was those components throwing on a null event. The map made
 * them look like live product. They are an unmounted tree, and the live route
 * never produces a null event anyway — it calls `notFound()` first. Repairing
 * those suites either way would have polished dead code and moved the
 * quarantine number without proving anything about the product.
 *
 * A stale map is worse than no map, because it is consulted. These cases hold
 * it to what the files say.
 */

const repoRoot = path.resolve(__dirname, "../../..");

function readRouteFile(relativePath: string): string | null {
  const absolute = path.join(repoRoot, relativePath);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : null;
}

/**
 * A retired route whose whole job is to send the caller somewhere else.
 *
 * Testing for `redirect(` alone is not enough and the first draft of this file
 * got it wrong: `/platform/admin/build-progress` calls `redirect('/sign-in')`
 * as an **auth guard** and then renders `BuildProgressDashboard`. Treating that
 * as a shim would have flagged a route that is doing exactly what the map says.
 *
 * A shim renders nothing, so the distinction is whether the file returns any
 * JSX at all.
 */
function isRedirectShim(body: string): boolean {
  const redirects = /\bredirect\s*\(/.test(body);
  const rendersJsx = /<[A-Za-z][^>]*>/.test(body);
  return redirects && !rendersJsx;
}

describe("route ownership map describes the routes that exist", () => {
  it("has entries to check, so a map emptied by accident cannot pass", () => {
    expect(ACTIVE_ROUTE_OWNERSHIP_MAP.length).toBeGreaterThan(0);
  });

  it.each(ACTIVE_ROUTE_OWNERSHIP_MAP.map((e) => [e.routePattern, e] as const))(
    "%s names a route file that exists",
    (_pattern, entry) => {
      expect(readRouteFile(entry.activeRouteFile)).not.toBeNull();
    },
  );

  it.each(ACTIVE_ROUTE_OWNERSHIP_MAP.map((e) => [e.routePattern, e] as const))(
    "%s imports every component it claims to import",
    (_pattern, entry) => {
      const body = readRouteFile(entry.activeRouteFile);
      expect(body).not.toBeNull();

      const absent = entry.importedShellOrNav.filter(
        (component) => !body!.includes(component),
      );

      // Named rather than counted: the failure should say which claim is
      // false, because the fix is per component.
      expect({ route: entry.routePattern, absent }).toEqual({
        route: entry.routePattern,
        absent: [],
      });
    },
  );

  it.each(ACTIVE_ROUTE_OWNERSHIP_MAP.map((e) => [e.routePattern, e] as const))(
    "%s renders the page component it names",
    (_pattern, entry) => {
      const body = readRouteFile(entry.activeRouteFile);
      expect(body).not.toBeNull();
      expect(body).toContain(entry.activePageComponent);
    },
  );

  it("says so when a route is only a redirect, so claims cannot be emptied to pass", () => {
    // Without this, the cheapest way to satisfy every case above is to delete
    // the claims — which would turn a stale map into an empty one and lose the
    // same information. Five of the eight routes are redirect shims left from
    // the /admin and /programs consolidations; each must admit it.
    const silent: string[] = [];
    for (const entry of ACTIVE_ROUTE_OWNERSHIP_MAP) {
      const body = readRouteFile(entry.activeRouteFile);
      if (body === null) continue;
      if (!isRedirectShim(body)) continue;
      const admitsIt = /redirect/i.test(entry.currentPrimaryVisibleComponent);
      if (!admitsIt) silent.push(entry.routePattern);
    }

    expect(silent).toEqual([]);
  });

  it("does not claim a component for a route that renders none", () => {
    // The mirror of the case above: a redirect shim must not carry component
    // claims either, or the map re-acquires the fiction it just shed.
    const overclaimed: string[] = [];
    for (const entry of ACTIVE_ROUTE_OWNERSHIP_MAP) {
      const body = readRouteFile(entry.activeRouteFile);
      if (body === null) continue;
      if (!isRedirectShim(body)) continue;
      if (entry.importedShellOrNav.length > 0) overclaimed.push(entry.routePattern);
    }

    expect(overclaimed).toEqual([]);
  });

  it("does not name a primary visible component the route file never mentions", () => {
    // `currentPrimaryVisibleComponent` is prose and may combine names with
    // ` + `, so each part is checked rather than the whole string. This is the
    // field that was wrong for /source/events/[eventId].
    const wrong: string[] = [];
    for (const entry of ACTIVE_ROUTE_OWNERSHIP_MAP) {
      const body = readRouteFile(entry.activeRouteFile);
      if (body === null) continue;
      for (const part of entry.currentPrimaryVisibleComponent.split("+")) {
        const name = part.trim();
        // Only check things shaped like a component identifier; the field also
        // carries phrases such as "none" or a short description.
        if (!/^[A-Z][A-Za-z0-9]+$/.test(name)) continue;
        if (!body.includes(name)) wrong.push(`${entry.routePattern}: ${name}`);
      }
    }

    expect(wrong).toEqual([]);
  });
});
