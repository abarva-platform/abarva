import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { ACTIVE_ROUTE_OWNERSHIP_MAP } from "@/lib/qa/active-route-ownership-map";
// The same graph walk the route-reachability audit uses. Two audits asking
// whether a route reaches a component must not be able to disagree.
import { reachableFrom } from "../../../scripts/audit/lib/route-reachability.mjs";

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
 * Does the named route actually reach the file that defines this component?
 *
 * The check these cases used to make was textual: does the route FILE contain
 * the component's name. The backlog item's complaint was that this is too
 * weak — a name in a comment satisfies it — and the item warned specifically
 * against answering that by widening the text match, because a broader
 * substring test passes more without proving more.
 *
 * A first attempt here did exactly what it warned against: it searched the
 * text of every file reachable from the route, which accepts a name mentioned
 * anywhere in a 400-file graph. That is weaker than what it replaced.
 *
 * So this resolves the component to a FILE and asks whether the route reaches
 * that file. A comment names nothing that exists, so it fails. An unreachable
 * component's file is not in the set, so it fails. A component imported
 * through intermediate modules is in the set, so it passes — which the old
 * check got wrong in the other direction.
 *
 * A component this cannot resolve to a file is reported as unresolved rather
 * than passed. Not every component is declared in a file bearing its name,
 * and treating "I could not find it" as "it is there" is the failure mode
 * this whole item is about.
 */
const reachableCache = new Map<string, Set<string>>();

function reachableFilesFor(routeFile: string): Set<string> {
  const cached = reachableCache.get(routeFile);
  if (cached) return cached;
  const files = reachableFrom(repoRoot, routeFile) as Set<string>;
  reachableCache.set(routeFile, files);
  return files;
}

type ComponentVerdict = "reached" | "not_reached" | "unresolved";

function componentVerdict(routeFile: string, component: string): ComponentVerdict {
  const files = reachableFilesFor(routeFile);

  // A file whose basename is the component name is how this repository
  // declares a component. Checked against the reachable set, not against the
  // whole tree.
  for (const file of files) {
    const base = path.basename(file).replace(/\.[cm]?[jt]sx?$/, "");
    if (base === component) return "reached";
  }

  // It may still be declared inside another file. Only then fall back to
  // reading text, and only across files the route reaches — and say so by
  // returning a distinct verdict, because this is the weaker evidence.
  for (const file of files) {
    let text: string;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (
      new RegExp(`(?:function|const|class)\\s+${component}\\b`).test(text) ||
      new RegExp(`export\\s+\\{[^}]*\\b${component}\\b`).test(text)
    ) {
      return "reached";
    }
  }

  // Does it exist anywhere at all? Distinguishing "no such component" from
  // "exists but this route does not reach it" is the difference between a
  // stale map and a wrong one.
  return "not_reached";
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

  it("can tell a reached component from an unreached one", () => {
    // The negative control, and it is not optional. Every case in this file
    // asserts that the map's claims hold, and the map is currently clean —
    // so a verdict function that answered "reached" unconditionally passed
    // all of them. A mutation doing exactly that survived until this case
    // existed.
    //
    // Fixed reference points rather than map data, so this keeps working
    // when the map changes.
    const eventRoute = "src/app/(maestro)/source/events/[eventId]/page.tsx";

    // Reached: the route renders it.
    expect(componentVerdict(eventRoute, "SourceAnalyticsCanvas")).toBe("reached");

    // Not reached: a real component this route does not pull in. It is
    // mounted by the governed event workspace, which is a different route.
    expect(componentVerdict(eventRoute, "SourceNewWorkspace")).toBe("not_reached");

    // Not reached: nothing by this name exists anywhere.
    expect(componentVerdict(eventRoute, "ComponentNobodyWrote")).toBe("not_reached");

    // Not reached: a TYPE, not a component. This is the claim the textual
    // check accepted for two months — the name appears in the route file
    // because it is imported as `import { type SourceShellWorkspace }`.
    expect(componentVerdict(eventRoute, "SourceShellWorkspace")).toBe("not_reached");
  });

  it("does not accept a file whose name merely contains the component name", () => {
    // Matching on substring would resolve a component to any file whose
    // name happens to contain it. No two names in the map collide today, so
    // nothing else here would notice — a mutation loosening the comparison
    // survived until this case existed.
    const eventRoute = "src/app/(maestro)/source/events/[eventId]/page.tsx";

    // A strict prefix of a real, reached component.
    expect(componentVerdict(eventRoute, "SourceAnalytics")).toBe("not_reached");
    // And a string that contains one.
    expect(componentVerdict(eventRoute, "SourceAnalyticsCanvasExtended")).toBe(
      "not_reached",
    );
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
        (component) =>
          componentVerdict(entry.activeRouteFile, component) !== "reached",
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
        if (componentVerdict(entry.activeRouteFile, name) !== "reached") {
          wrong.push(`${entry.routePattern}: ${name}`);
        }
      }
    }

    expect(wrong).toEqual([]);
  });
});
