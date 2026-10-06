#!/usr/bin/env node
/**
 * C-508 · The tenancy-fence coverage census, proven against real known
 * positives rather than against fixtures alone.
 *
 * C-507 proved two governed route tenant fences behaviorally after item 26
 * draw 7 happened to triage the six suite directories the coverage census
 * structurally cannot rank. Both fences were found by accident. This census
 * exists so the next one is derived: it enumerates the routes that fence on
 * tenancy from the import graph and from call syntax, classifies each covering
 * suite as behavioral, byte-scanner or none, and ranks what is unproven.
 *
 * WHY EVERY CLASSIFICATION QUESTION IS ASKED OF THE PARSER. A text scan cannot
 * answer a syntax question: `requireTenancy` appears in a route that imports it
 * and never calls it, in a comment explaining why a route does not fence, and
 * inside a string in a suite that asserts the route's bytes. Those three are
 * different verdicts and a grep gives them the same one — which is the exact
 * confusion the defect class this census measures lives in.
 *
 * WHY THE FIXTURE CASES ARE NOT THE PROOF. A detector can pass every fixture
 * written by the person who wrote the detector and still miss the one real
 * instance, so the cases below that matter most are the ones pinned to real
 * files in this repository:
 *
 *   src/app/api/chat/step/route.ts               a real fenced route whose
 *                                                proof C-507 added: must
 *                                                classify `behavioral`
 *   src/app/api/chat/step/__tests__/route-boundary.test.ts
 *                                                a real byte-scanner suite:
 *                                                must be recognised as one
 *
 * If the census is rewired so that either of those changes verdict, this suite
 * goes red before the artifact does.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildTenancyFenceCensus,
  classifySuiteForRoute,
  describeCensusDrift,
  fenceCallsInRoute,
  fenceProviderSymbols,
} from "./tenancy-fence-coverage.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = fs.realpathSync(path.resolve(here, "../.."));

/** A throwaway tree, so a fixture cannot be mistaken for repository code. */
function scratchRepo(files) {
  // `fs.realpathSync` on the way in: /tmp is a symlink on macOS and is not one
  // on a Linux runner, and the census reports repository-relative paths.
  const root = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), "fence-census-"));
  for (const [relative, body] of Object.entries(files)) {
    const absolute = path.join(root, relative);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, body);
  }
  return root;
}

const TENANCY_MODULE = `
export class TenancyError extends Error {}
export async function requireTenancy() { return { clientId: "c", clientKey: "k" }; }
export function tenancyErrorResponse() { return new Response(null, { status: 403 }); }
`;

// ---------------------------------------------------------------------------
// Does the route fence? A call, not a mention.
// ---------------------------------------------------------------------------

test("a route that calls requireTenancy fences directly", () => {
  const source = `
    import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
    export async function POST(request: Request) {
      try {
        const tenancy = await requireTenancy();
        return Response.json({ ok: tenancy.clientId });
      } catch (err) {
        return tenancyErrorResponse(err);
      }
    }
  `;
  const calls = fenceCallsInRoute(source, "src/app/api/x/route.ts", {
    "src/lib/auth/tenancy.ts": new Set(["requireTenancy", "tenancyErrorResponse"]),
  }, (spec) => (spec === "@/lib/auth/tenancy" ? "src/lib/auth/tenancy.ts" : null));
  assert.deepEqual(
    calls.map((call) => call.symbol).sort(),
    ["requireTenancy", "tenancyErrorResponse"],
  );
});

test("a route that imports a fence and never calls it does NOT fence", () => {
  // This is the case a grep gets wrong, and it is not hypothetical: a route can
  // import the error mapper for a type position and fence on nothing.
  const source = `
    import { requireTenancy } from "@/lib/auth/tenancy";
    type Unused = typeof requireTenancy;
    export async function GET() { return Response.json({ ok: true }); }
  `;
  const calls = fenceCallsInRoute(source, "src/app/api/x/route.ts", {
    "src/lib/auth/tenancy.ts": new Set(["requireTenancy"]),
  }, () => "src/lib/auth/tenancy.ts");
  assert.deepEqual(calls, []);
});

test("a fence named only inside a comment or a string does NOT fence", () => {
  const source = `
    // requireTenancy() is deliberately not called here; this route is public.
    const note = "requireTenancy(request)";
    export async function GET() { return Response.json({ note }); }
  `;
  const calls = fenceCallsInRoute(source, "src/app/api/x/route.ts", {
    "src/lib/auth/tenancy.ts": new Set(["requireTenancy"]),
  }, () => "src/lib/auth/tenancy.ts");
  assert.deepEqual(calls, []);
});

test("a wrapper module that calls the fence makes its own export a fence", () => {
  const root = scratchRepo({
    "src/lib/auth/tenancy.ts": TENANCY_MODULE,
    "src/app/api/v1/_auth.ts": `
      import { requireTenancy } from "@/lib/auth/tenancy";
      export async function requireProgramTenancy() { return requireTenancy(); }
    `,
    "src/app/api/v1/thing/route.ts": `
      import { requireProgramTenancy } from "../_auth";
      export async function GET() {
        const tenancy = await requireProgramTenancy();
        return Response.json({ ok: tenancy.clientId });
      }
    `,
  });
  const providers = fenceProviderSymbols(root, ["src/app/api/v1/thing/route.ts"]);
  assert.ok(
    providers["src/app/api/v1/_auth.ts"]?.has("requireProgramTenancy"),
    "the wrapper's export should be a fence symbol",
  );
  const census = buildTenancyFenceCensus(root);
  const row = census.routes.find((r) => r.route === "src/app/api/v1/thing/route.ts");
  assert.equal(row.fence, "indirect");
  assert.deepEqual(row.fenceVia, ["src/app/api/v1/_auth.ts"]);
});

test("a route that reaches the fence module but calls nothing is reported apart", () => {
  const root = scratchRepo({
    "src/lib/auth/tenancy.ts": TENANCY_MODULE,
    "src/lib/util.ts": `
      import { TenancyError } from "@/lib/auth/tenancy";
      export function describe(e: unknown) { return e instanceof TenancyError ? "t" : "o"; }
    `,
    "src/app/api/open/route.ts": `
      import { describe } from "@/lib/util";
      export async function GET() { return Response.json({ d: describe(null) }); }
    `,
  });
  const census = buildTenancyFenceCensus(root);
  const row = census.routes.find((r) => r.route === "src/app/api/open/route.ts");
  assert.equal(row.fence, "none");
  assert.equal(
    row.reachesFenceModule,
    true,
    "the import graph reaches tenancy even though no fence is called — that split is the point",
  );
});

// ---------------------------------------------------------------------------
// How is the route covered? behavioral, byte-scanner, or none.
// ---------------------------------------------------------------------------

test("a suite that imports the route and calls its handler is behavioral", () => {
  const suite = `
    import { POST } from "@/app/api/x/route";
    it("refuses a foreign tenant", async () => {
      const response = await POST(new Request("http://x", { method: "POST" }));
      expect(response.status).toBe(403);
    });
  `;
  const verdict = classifySuiteForRoute(
    suite,
    "src/app/api/x/__tests__/route.test.ts",
    "src/app/api/x/route.ts",
    (spec) => (spec === "@/app/api/x/route" ? "src/app/api/x/route.ts" : null),
  );
  assert.equal(verdict, "behavioral");
});

test("a suite that reads the route's bytes and asserts substrings is a byte-scanner", () => {
  const suite = `
    import { readFileSync } from "node:fs";
    const source = readFileSync("src/app/api/x/route.ts", "utf8");
    it("enforces active-tenant matching", () => {
      expect(source).toContain("requireTenancy");
      expect(source.indexOf("requireTenancy")).toBeLessThan(source.indexOf("buildContext"));
    });
  `;
  const verdict = classifySuiteForRoute(
    suite,
    "src/app/api/x/__tests__/route-boundary.test.ts",
    "src/app/api/x/route.ts",
    () => null,
  );
  assert.equal(verdict, "byte-scanner");
});

test("a suite that both imports the handler and scans bytes counts as behavioral", () => {
  // The strongest proof present decides the row: a byte assertion beside a real
  // response assertion is not what this census is hunting.
  const suite = `
    import { readFileSync } from "node:fs";
    import { POST } from "@/app/api/x/route";
    const source = readFileSync("src/app/api/x/route.ts", "utf8");
    it("t", async () => {
      expect(source).toContain("requireTenancy");
      expect((await POST(new Request("http://x"))).status).toBe(403);
    });
  `;
  const verdict = classifySuiteForRoute(
    suite,
    "src/app/api/x/__tests__/route.test.ts",
    "src/app/api/x/route.ts",
    (spec) => (spec === "@/app/api/x/route" ? "src/app/api/x/route.ts" : null),
  );
  assert.equal(verdict, "behavioral");
});

test("a suite that names the route in no form does not cover it", () => {
  const suite = `
    import { helper } from "@/lib/helper";
    it("t", () => { expect(helper()).toBe(1); });
  `;
  assert.equal(
    classifySuiteForRoute(suite, "src/__tests__/x.test.ts", "src/app/api/x/route.ts", () => null),
    "none",
  );
});

// ---------------------------------------------------------------------------
// Real known positives. These are the cases that make the fixtures above
// evidence rather than decoration.
// ---------------------------------------------------------------------------

test("REAL: /api/chat/step fences directly and is classified behavioral", () => {
  const census = buildTenancyFenceCensus(repo);
  const row = census.routes.find((r) => r.route === "src/app/api/chat/step/route.ts");
  assert.ok(row, "the route C-507 proved must be in the census");
  assert.equal(row.fence, "direct");
  assert.equal(
    row.coverage,
    "behavioral",
    "C-507 added src/__tests__/behaviors/c507-route-tenant-fence-behavior.test.ts; " +
      "if this reads byte-scanner the census is not finding real behavioral proof",
  );
  assert.ok(
    row.suites.behavioral.includes(
      "src/__tests__/behaviors/c507-route-tenant-fence-behavior.test.ts",
    ),
    "and it must be that suite, not some other file",
  );
});

test("REAL: the byte-scanner suite beside that route is still recognised as one", () => {
  const census = buildTenancyFenceCensus(repo);
  const row = census.routes.find((r) => r.route === "src/app/api/chat/step/route.ts");
  assert.ok(
    row.suites.byteScanner.includes(
      "src/app/api/chat/step/__tests__/route-boundary.test.ts",
    ),
    "the byte-scanner suite C-507 deliberately left in place must still be seen",
  );
});

test("REAL: the census finds a non-trivial population in both directions", () => {
  const census = buildTenancyFenceCensus(repo);
  // Not a pinned count — a pinned count is a second artifact to regenerate. The
  // assertion is that neither side of the split is empty, because an empty one
  // is what a broken reader produces and it would otherwise read as good news.
  assert.ok(census.counts.fenced > 20, `fenced routes: ${census.counts.fenced}`);
  assert.ok(
    census.counts.unfenced > 0,
    "a census where every route fences has stopped discriminating",
  );
  assert.ok(
    census.counts.byteScannerOnly + census.counts.none > 0,
    "the whole item exists because unproven fences exist; zero means the reader broke",
  );
  assert.equal(
    census.counts.fenced,
    census.counts.behavioral + census.counts.byteScannerOnly + census.counts.none,
    "every fenced route lands in exactly one coverage class",
  );
});

// ---------------------------------------------------------------------------
// The committed artifact, and the drift check that keeps it honest.
// ---------------------------------------------------------------------------

test("drift is reported per route, in both directions", () => {
  const measured = {
    counts: { fenced: 2, behavioral: 1, byteScannerOnly: 1, none: 0, unfenced: 0 },
    routes: [
      { route: "a/route.ts", fence: "direct", coverage: "behavioral" },
      { route: "b/route.ts", fence: "direct", coverage: "byte-scanner" },
    ],
  };

  const unchanged = describeCensusDrift(measured, measured);
  assert.deepEqual(unchanged, [], "identical inputs must report no drift");

  // A row that got WORSE must fail.
  const regressed = structuredClone(measured);
  regressed.routes[0].coverage = "none";
  const worse = describeCensusDrift(regressed, measured);
  assert.equal(worse.length, 1);
  assert.match(worse[0], /a\/route\.ts/);
  assert.match(worse[0], /behavioral/);
  assert.match(worse[0], /none/);

  // A row that got BETTER must fail too. A check that only notices regressions
  // lets the artifact drift out of date every time somebody fixes something,
  // and the artifact is what ranks the next draw.
  const improved = structuredClone(measured);
  improved.routes[1].coverage = "behavioral";
  const better = describeCensusDrift(improved, measured);
  assert.equal(better.length, 1, "an improvement is drift and must be regenerated");
  assert.match(better[0], /b\/route\.ts/);

  // An added row and a removed row are each named.
  const added = structuredClone(measured);
  added.routes.push({ route: "c/route.ts", fence: "direct", coverage: "none" });
  assert.match(describeCensusDrift(added, measured).join("\n"), /c\/route\.ts/);
  const removed = structuredClone(measured);
  removed.routes.pop();
  assert.match(describeCensusDrift(removed, measured).join("\n"), /b\/route\.ts/);
});

test("the committed artifact matches the tree it describes", () => {
  const committed = JSON.parse(
    fs.readFileSync(path.join(repo, "docs/security/tenancy-fence-coverage.json"), "utf8"),
  );
  const measured = buildTenancyFenceCensus(repo);
  assert.deepEqual(
    describeCensusDrift(measured, committed),
    [],
    "regenerate with: node scripts/quality/tenancy-fence-coverage.mjs --write",
  );
});

test("every recorded mutation sample still names a route that exists and still classifies as recorded", () => {
  // An exemption that outlives its defect is worse than no exemption: it reads
  // as evidence. Each sampled row asserts its own subject is still there.
  const committed = JSON.parse(
    fs.readFileSync(path.join(repo, "docs/security/tenancy-fence-coverage.json"), "utf8"),
  );
  const measured = buildTenancyFenceCensus(repo);
  const byRoute = new Map(measured.routes.map((row) => [row.route, row]));
  assert.ok(
    committed.mutationProof.sampled.length > 0,
    "a classification proved by nothing is the claim this item was filed against",
  );
  for (const sample of committed.mutationProof.sampled) {
    const row = byRoute.get(sample.route);
    assert.ok(row, `sampled route no longer exists: ${sample.route}`);
    assert.equal(
      row.coverage,
      sample.coverageWhenSampled,
      `${sample.route} was sampled as ${sample.coverageWhenSampled} and now reads ${row.coverage}; ` +
        "re-run the mutation or drop the sample",
    );
  }
});
