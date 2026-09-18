/** @jest-environment jsdom */

/**
 * The command palette must not offer a destination that is not there.
 *
 * Backlog item 30. `6ebe6d4a9` reverted the palette to a `Setup ·` vocabulary
 * the rail had already retired, and to `/admin/users` — a path with no page
 * route and no redirect, so the palette's own Users entry 404s.
 *
 * A test asserting the corrected shape already existed at
 * `src/components/shell/__tests__/admin-shell-vocabulary.test.ts` and has been
 * red since that revert. It is invoked by no npm script and no workflow, so
 * nobody saw it — the failure mode backlog item 26 exists for. This suite lives
 * in `src/__tests__/behaviors`, which runs in the `Behavior coverage floor` CI
 * job and inside `test:before-commit`, and it drives the real component rather
 * than reading its source text.
 *
 * The rule enforced here is that every destination the palette offers resolves
 * to a real page route under `src/app`. A path that exists only as a
 * `next.config.ts` redirect is deliberately NOT accepted: the user still
 * arrives somewhere, but somewhere other than the label promised, which is the
 * defect rather than the cure. That cost is real and is stated in the release
 * record.
 */

import fs from "node:fs";
import path from "node:path";

const pushed: string[] = [];

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: (destination: string) => {
      pushed.push(destination);
    },
  }),
}));

import { fireEvent, render, screen } from "@testing-library/react";
import {
  CommandPalette,
  COMMAND_PALETTE_ROUTES,
} from "@/components/shell/CommandPalette";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const APP_DIR = path.join(REPO_ROOT, "src", "app");

/**
 * Every page route under src/app, as a list of URL segment patterns.
 * Route groups — `(maestro)`, `(public)` — are organisational and contribute
 * no URL segment, so they are dropped.
 */
function collectPageRoutes(dir: string, segments: string[] = []): string[][] {
  const routes: string[][] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const isRouteGroup =
        entry.name.startsWith("(") && entry.name.endsWith(")");
      const isPrivate = entry.name.startsWith("_") || entry.name.startsWith("@");
      if (isPrivate) continue;
      routes.push(
        ...collectPageRoutes(
          path.join(dir, entry.name),
          isRouteGroup ? segments : [...segments, entry.name],
        ),
      );
    } else if (entry.name === "page.tsx" || entry.name === "page.ts") {
      routes.push(segments);
    }
  }
  return routes;
}

const PAGE_ROUTES = collectPageRoutes(APP_DIR);

function segmentMatches(pattern: string, actual: string): boolean {
  if (pattern.startsWith("[") && pattern.endsWith("]")) return true;
  return pattern === actual;
}

/** Does `urlPath` resolve to a page route, honouring dynamic segments? */
function resolvesToPageRoute(urlPath: string): boolean {
  const withoutQuery = urlPath.split("?")[0].split("#")[0];
  const actual = withoutQuery.split("/").filter(Boolean);

  return PAGE_ROUTES.some((pattern) => {
    const catchAllAt = pattern.findIndex((s) => s.includes("..."));
    if (catchAllAt >= 0) {
      // `[...slug]` needs at least one segment after the fixed prefix;
      // `[[...slug]]` accepts none.
      const optional = pattern[catchAllAt].startsWith("[[");
      const prefix = pattern.slice(0, catchAllAt);
      if (actual.length < prefix.length + (optional ? 0 : 1)) return false;
      return prefix.every((s, i) => segmentMatches(s, actual[i]));
    }
    if (pattern.length !== actual.length) return false;
    return pattern.every((s, i) => segmentMatches(s, actual[i]));
  });
}

function openPalette() {
  render(<CommandPalette />);
  fireEvent.keyDown(window, { key: "k", metaKey: true });
  return screen.getByPlaceholderText("Go to…");
}

function search(term: string) {
  const input = openPalette();
  fireEvent.change(input, { target: { value: term } });
}

beforeEach(() => {
  pushed.length = 0;
});

describe("command palette destinations", () => {
  it("resolves the repository's own page routes, so a dead destination is the palette's fault and not the resolver's", () => {
    // Guardrail. If these stop resolving, every other case in this file is
    // reporting the resolver's blind spots rather than the palette's defects.
    expect(resolvesToPageRoute("/admin")).toBe(true);
    expect(resolvesToPageRoute("/admin/policies")).toBe(true);
    expect(resolvesToPageRoute("/admin/users-access")).toBe(true);
    expect(resolvesToPageRoute("/tower")).toBe(true);
    // A dynamic segment: `/strategic-moves/[moveId]`.
    expect(resolvesToPageRoute("/strategic-moves/example-move-id")).toBe(true);
    // A query string is not part of the route.
    expect(resolvesToPageRoute("/admin?tab=tenant")).toBe(true);
    // And it must still be able to say no.
    expect(resolvesToPageRoute("/admin/users")).toBe(false);
    expect(resolvesToPageRoute("/there/is/no/such/surface")).toBe(false);
  });

  it("offers no destination without a page route behind it", () => {
    const dead = COMMAND_PALETTE_ROUTES.filter(
      (route) => !resolvesToPageRoute(route.path),
    ).map((route) => `${route.label} → ${route.path}`);

    expect(dead).toEqual([]);
  });

  it("offers only tenant-neutral Moves shortcuts in shared chrome", () => {
    const moves = COMMAND_PALETTE_ROUTES.filter(
      (route) => route.surface === "Moves",
    ).map(({ label, path }) => ({ label, path }));

    expect(moves).toEqual([
      { label: "Moves · Portfolio", path: "/strategic-moves" },
      { label: "New Move", path: "/strategic-moves/new" },
    ]);

    search("Moves");
    expect(screen.getByText("Moves · Portfolio")).toBeTruthy();
    expect(screen.getByText("New Move")).toBeTruthy();
    expect(screen.getAllByText("Moves")).toHaveLength(2);
  });

  it("navigates to exactly the path it offered, so the table above is the one the user travels", () => {
    // Without this, the case above is a check on a constant nothing reads.
    search("Policies");
    fireEvent.click(screen.getByText("Admin · Policies"));

    expect(pushed).toEqual(["/admin/policies"]);
  });

  it("sends Users to the access surface that exists, not to the one that 404s", () => {
    search("Users");
    fireEvent.click(screen.getByText("Admin · Users & Access"));

    expect(pushed).toEqual(["/admin/users-access"]);
  });

  it("offers the connectors entry the connectors route, not the admin overview", () => {
    search("Connectors");
    fireEvent.click(screen.getByText("Admin · Connectors"));

    expect(pushed).toEqual(["/admin/connectors"]);
  });

  it("offers distinct Tower views rather than four labels for one landing", () => {
    expect(
      COMMAND_PALETTE_ROUTES.filter((route) => route.surface === "Tower").map(
        ({ label, path }) => ({ label, path }),
      ),
    ).toEqual([
      { label: "Tower", path: "/tower" },
      { label: "Tower · Value", path: "/tower?tab=initiatives&view=proof" },
      { label: "Tower · Spend", path: "/tower?tab=budget&view=shape" },
      { label: "Tower · Actions", path: "/tower?tab=decisions&view=review" },
    ]);

    search("Tower");

    for (const label of ["Tower · Value", "Tower · Spend", "Tower · Actions"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    // One row label plus the four surface badges. A dropped row lowers this.
    expect(screen.getAllByText("Tower").length).toBe(5);
  });

  it.each([
    ["Tower · Value", "/tower?tab=initiatives&view=proof"],
    ["Tower · Spend", "/tower?tab=budget&view=shape"],
    ["Tower · Actions", "/tower?tab=decisions&view=review"],
  ])("navigates %s to its named view", (label, path) => {
    search(label);
    fireEvent.click(screen.getByText(label));
    expect(pushed).toEqual([path]);
  });

  it("does not revive the Setup vocabulary the rail retired", () => {
    search("Setup");

    expect(screen.getByText("No results")).toBeTruthy();
    expect(screen.queryByText(/Setup ·/)).toBeNull();
  });

  it("labels the admin surface the way the rail does", () => {
    const rail = fs.readFileSync(
      path.join(REPO_ROOT, "src/components/shell/AppRail.tsx"),
      "utf8",
    );
    // The rail is the authority on this word; the palette follows it.
    expect(rail).toContain("label: 'Admin'");

    search("Admin");

    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
    expect(screen.getByText("Admin · Overview")).toBeTruthy();
    expect(screen.getByText("Admin · Tenant profile")).toBeTruthy();
  });
});
