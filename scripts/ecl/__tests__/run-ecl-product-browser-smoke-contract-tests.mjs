#!/usr/bin/env node
/**
 * Contract and reporting suite for the product browser smoke. No browser and no
 * network: the smoke's own route and assertion tables are executed, its CLI is
 * run as a process, and its per-route flow is driven with a scripted page.
 *
 * The smoke itself only runs after a deploy, from the deployed image. Two things
 * about it can be decided before that, and this suite decides them:
 *
 *   1. Every finding check is evaluated on a URL that can mount the diagnostics
 *      findings panel. A finding check matches rows only that panel renders, so
 *      a check bound to any other URL fails on every run whatever the product
 *      does. The route table differs by route mode, so both modes are checked.
 *   2. A finding that is not found, a route that is unhealthy, and a findings
 *      surface that does not load are three different reports. None of them is
 *      folded into another, and each one fails the run.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fs.realpathSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.."));
const SMOKE = "scripts/ecl/run_product_ecl_browser_smoke.mjs";
const COMPACT_WRITER = "scripts/ecl/write_ecl_product_live_proof_compact_summary.mjs";
const HOME = "home_preview_ecl";
// The findings whose checks are attached to the Home route. Stated here rather
// than read from the table under test, so a planted failure has to name them.
const HOME_FINDING_IDS = ["F4", "F5", "F6", "F7", "F10"];
const NOT_ON_PANEL_SURFACE = (id) => `finding_${id}_${HOME}_not_evaluated_on_findings_panel_surface`;
// What the smoke reads from its environment when it is imported or run.
const PINNED_ENV = [
  "BASE_URL",
  "E2E_ACTIVE_CLIENT",
  "E2E_EXPECTED_TENANT_NAME",
  "ECL_PRODUCT_BROWSER_BASE_URL",
  "ECL_PRODUCT_BROWSER_FINDINGS_SPEC_PATH",
  "ECL_PRODUCT_BROWSER_PROOF_DIR",
];

// The smoke resolves its findings specification against the working directory.
process.chdir(ROOT);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ecl-product-browser-smoke-contract-"));
test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

/**
 * The smoke fixes its route mode from argv, and its tenant, host and output
 * directory from the environment, at import. Each mode therefore gets its own
 * module instance, imported with both pinned and restored afterwards.
 */
async function loadSmoke(routeMode) {
  const argv = process.argv;
  const saved = Object.fromEntries(PINNED_ENV.map((name) => [name, process.env[name]]));
  try {
    process.argv = routeMode === "default_routes"
      ? [...argv, "--default-routes"]
      : argv.filter((arg) => arg !== "--default-routes");
    for (const name of PINNED_ENV) delete process.env[name];
    process.env.BASE_URL = "https://proof.invalid";
    process.env.ECL_PRODUCT_BROWSER_PROOF_DIR = path.join(tmp, `proof-${routeMode}`);
    const smoke = await import(`${pathToFileURL(path.join(ROOT, SMOKE)).href}?route_mode=${routeMode}`);
    assert.equal(smoke.ROUTE_MODE, routeMode, "the smoke was not imported in the requested route mode");
    return smoke;
  } finally {
    process.argv = argv;
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

const smokeDefault = await loadSmoke("default_routes");
const smokeOptIn = await loadSmoke("provider_opt_in");

function runContractCli(modeArgs, script = path.join(ROOT, SMOKE)) {
  const env = { ...process.env };
  for (const name of PINNED_ENV) delete env[name];
  const result = spawnSync(process.execPath, [script, ...modeArgs, "--validate-demo-findings-contract"], {
    cwd: ROOT,
    encoding: "utf8",
    env,
  });
  assert.notEqual(
    result.stdout.trim(),
    "",
    `the smoke printed nothing, so its CLI body did not run (exit ${result.status})\nSTDERR:\n${result.stderr}`,
  );
  const report = JSON.parse(result.stdout);
  delete report.checked_at;
  return { status: result.status, report };
}

function surfaceFor(report, routeKey) {
  const surface = report.demo_finding_contract.finding_surface_bindings.find((entry) => entry.route_key === routeKey);
  assert.ok(surface, `the contract reported no finding surface for ${routeKey}`);
  return surface;
}

function parsePath(routePath) {
  return new URL(routePath, "https://proof.invalid");
}

function splitTopLevelAlternatives(source) {
  const alternatives = [];
  let depth = 0;
  let current = "";
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === "\\") {
      current += char + (source[index + 1] ?? "");
      index += 1;
    } else if (char === "|" && depth === 0) {
      alternatives.push(current);
      current = "";
    } else {
      if (char === "(") depth += 1;
      if (char === ")") depth -= 1;
      current += char;
    }
  }
  alternatives.push(current);
  return alternatives;
}

/**
 * A string the pattern accepts, derived from the pattern so the fixture pages
 * follow the smoke's own tables instead of restating them. The result is tested
 * against the pattern before it is used, so a pattern this cannot read fails
 * here rather than producing a page that silently lacks it.
 */
function sampleFor(pattern) {
  for (const alternative of splitTopLevelAlternatives(pattern.source)) {
    const sample = alternative
      .replace(/\(\?:([^()|]*)(?:\|[^()]*)?\)/g, "$1")
      .replace(/\\s\+/g, " ")
      .replace(/\\b/g, "")
      .replace(/\\(.)/g, "$1");
    if (pattern.test(sample)) return sample;
  }
  return assert.fail(`no fixture text could be derived for ${pattern}`);
}

function padded(lines) {
  let text = lines.join("\n");
  while (text.trim().length < 240) text += "\nFixture filler so the page is long enough to count as loaded.";
  return text;
}

function findingChecksFor(smoke, routeKey) {
  return smoke.DEMO_FINDING_ASSERTIONS.flatMap((finding) =>
    finding.routeChecks
      .filter((routeCheck) => routeCheck.routeKey === routeKey)
      .map((routeCheck) => ({ id: finding.id, requiredText: routeCheck.requiredText })));
}

function findingRows(smoke, routeKey) {
  return findingChecksFor(smoke, routeKey).flatMap((check) => check.requiredText.map(sampleFor));
}

function routePageText(smoke, route, { withFindingRows }) {
  return padded([
    ...route.requiredText.map(sampleFor),
    ...smoke.SURFACE_BROWSER_ASSERTIONS
      .filter((surface) => surface.routeKey === route.key)
      .flatMap((surface) => surface.requiredText.map(sampleFor)),
    ...(withFindingRows ? findingRows(smoke, route.key) : []),
  ]);
}

function urlFor(smoke, routePath) {
  return new URL(routePath, smoke.BASE_URL).toString();
}

/**
 * A site on which every check passes. A route with a separate findings surface
 * serves its finding rows only there, as the product does, so a passing run
 * proves which page the finding checks were read from.
 */
function healthySite(smoke) {
  const site = new Map();
  for (const route of smoke.ROUTES) {
    site.set(urlFor(smoke, route.path), {
      text: routePageText(smoke, route, { withFindingRows: !route.findingsPath }),
    });
    if (route.findingsPath) {
      site.set(urlFor(smoke, route.findingsPath), { text: padded(findingRows(smoke, route.key)) });
    }
  }
  return site;
}

function homeRoute(smoke) {
  const route = smoke.ROUTES.find((entry) => entry.key === HOME);
  assert.ok(route, "the smoke has no Home route");
  return route;
}

/** The slice of a browser page the smoke's per-route flow uses. */
function scriptedPage(site) {
  let listeners = [];
  let current = { url: "about:blank", text: "" };
  const page = {
    visited: [],
    unserved: [],
    removeAllListeners() {
      listeners = [];
    },
    on(event, listener) {
      if (event === "pageerror") listeners.push(listener);
    },
    async goto(url) {
      page.visited.push(url);
      const entry = site.get(url);
      if (!entry) {
        page.unserved.push(url);
        throw new Error(`fixture site does not serve ${url}`);
      }
      if (entry.loadError) throw new Error(entry.loadError);
      current = { url: entry.finalUrl ?? url, text: entry.text };
      for (const message of entry.pageErrors ?? []) {
        for (const listener of listeners) listener(new Error(message));
      }
      return { status: () => entry.status ?? 200 };
    },
    async title() {
      return "fixture";
    },
    locator() {
      return { innerText: async () => current.text };
    },
    url() {
      return current.url;
    },
    async screenshot({ path: file }) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, "fixture screenshot");
    },
  };
  return page;
}

async function runSmoke(smoke, site) {
  const page = scriptedPage(site);
  const results = [];
  for (const route of smoke.ROUTES) results.push(await smoke.smokeRoute(page, route));
  assert.deepEqual(page.unserved, [], "the smoke requested a URL the fixture site does not serve");
  const summary = smoke.buildSmokeSummary({
    results,
    authProof: { authMethod: "fixture", email: null, attempts: [] },
    contractValidation: smoke.validateDemoFindingContract(),
    surfaceContractValidation: smoke.validateSurfaceAssertionContract(),
  });
  return { page, summary, home: summary.routes.find((route) => route.key === HOME) };
}

function unacceptedFindingIds(summary) {
  return summary.findings_demonstrable_on_real_surface.findings
    .filter((finding) => !finding.accepted)
    .map((finding) => finding.id);
}

function findingMissIssues(summary) {
  return summary.issues.filter((issue) => issue.includes("missing_demo_finding_"));
}

function findingSurfaceIssues(summary) {
  return summary.issues.filter((issue) => issue.includes("finding_surface_"));
}

/**
 * Runs the real compact summary writer over the event the smoke prints, after
 * the JSON round trip the operator log puts it through. The writer and the
 * status step behind it are the readers of that event.
 */
function writeCompactSummary(smoke, summary, name) {
  const dir = path.join(tmp, `compact-${name}`);
  fs.mkdirSync(dir, { recursive: true });
  const browserEvents = path.join(dir, "browser-events.json");
  const evalEvents = path.join(dir, "eval-events.json");
  const out = path.join(dir, "compact-summary.json");
  fs.writeFileSync(browserEvents, JSON.stringify([smoke.structuredSummaryEvent(summary)]));
  fs.writeFileSync(evalEvents, JSON.stringify([{
    event: "ecl_ava_consultant_eval_compact_summary",
    accepted: true,
    answers_accepted: 1,
    answers_evaluated: 1,
    ablation_answers_accepted: 0,
    ablation_answers_evaluated: 1,
    ablation_demo_findings_accepted: 0,
    ablation_accepted: true,
  }]));
  const result = spawnSync(process.execPath, [
    path.join(ROOT, COMPACT_WRITER),
    "--browser-events", browserEvents,
    "--eval-events", evalEvents,
    "--out", out,
    "--base-url", smoke.BASE_URL,
    "--tenant-key", "tenant-under-proof",
  ], { cwd: ROOT, encoding: "utf8" });
  return { status: result.status, compact: JSON.parse(fs.readFileSync(out, "utf8")) };
}

test("the contract passes in provider opt-in mode, where each route is its own findings surface", () => {
  const { status, report } = runContractCli([]);
  assert.equal(report.route_mode, "provider_opt_in");
  assert.deepEqual(report.demo_finding_contract.issues, []);
  assert.equal(report.accepted, true);
  assert.equal(status, 0);
  for (const surface of report.demo_finding_contract.finding_surface_bindings) {
    assert.equal(surface.mounts_findings_panel, true, `${surface.route_key} cannot mount the findings panel`);
    assert.equal(surface.separate_from_route, false, `${surface.route_key} should read findings from its own page`);
  }
});

test("the contract passes in default-route mode, with Home's findings read from its diagnostics surface", () => {
  const { status, report } = runContractCli(["--default-routes"]);
  assert.equal(report.route_mode, "default_routes", "the contract was not validated in the mode the live proof runs");
  assert.deepEqual(report.demo_finding_contract.issues, []);
  assert.equal(report.accepted, true);
  assert.equal(status, 0);
  for (const surface of report.demo_finding_contract.finding_surface_bindings) {
    assert.equal(surface.mounts_findings_panel, true, `${surface.route_key} cannot mount the findings panel`);
  }

  const home = surfaceFor(report, HOME);
  const route = parsePath(home.route_path);
  const findings = parsePath(home.findings_path);
  // Route health, named surfaces and counts stay on the default Home route.
  assert.equal(route.pathname, "/home");
  assert.equal(route.searchParams.get("diagnostics"), null);
  // The finding checks are read from the Home diagnostics surface, same tenant.
  assert.equal(home.separate_from_route, true);
  assert.equal(findings.pathname, "/home/preview");
  assert.equal(findings.searchParams.get("diagnostics"), "ecl");
  assert.equal(findings.searchParams.get("tenant"), route.searchParams.get("tenant"));
  assert.ok(route.searchParams.get("tenant"), "the Home route names no tenant");
  assert.deepEqual(home.finding_ids, HOME_FINDING_IDS);
  // Nothing else needs a separate surface: the other routes request the diagnostics lane themselves.
  assert.deepEqual(
    report.demo_finding_contract.finding_surface_bindings.filter((surface) => surface.separate_from_route).map((surface) => surface.route_key),
    [HOME],
  );
});

test("the contract refuses the earlier shape: Home's finding checks bound to the default Home route", () => {
  assert.equal(smokeDefault.validateDemoFindingContract().accepted, true, "the unplanted table must pass first");
  const planted = smokeDefault.ROUTES.map((route) => ({ ...route, findingsPath: null }));
  assert.equal(parsePath(homeRoute({ ROUTES: planted }).path).pathname, "/home", "the planted table is not the earlier shape");

  const result = smokeDefault.validateDemoFindingContract({ routes: planted });
  assert.equal(result.accepted, false);
  assert.deepEqual(result.issues, HOME_FINDING_IDS.map(NOT_ON_PANEL_SURFACE));
  const home = result.finding_surface_bindings.find((surface) => surface.route_key === HOME);
  assert.equal(home.mounts_findings_panel, false);
  assert.equal(home.separate_from_route, false);

  // The same planting changes nothing in opt-in mode, which is why a contract
  // checked only in that mode could not see it.
  const optInPlanted = smokeOptIn.ROUTES.map((route) => ({ ...route, findingsPath: null }));
  assert.equal(smokeOptIn.validateDemoFindingContract({ routes: optInPlanted }).accepted, true);
});

test("only a mounting pathname with the diagnostics lane requested can show the findings panel", async (t) => {
  const cases = [
    ["/home/preview?tenant=t&diagnostics=ecl", true],
    ["/home/preview?tenant=t&provider=ecl_projection_db&diagnostics=ecl", true],
    ["/source/preview/workspace?diagnostics=ecl", true],
    ["/tower?diagnostics=ecl", true],
    ["/intelligence?diagnostics=ecl", true],
    ["/home?tenant=t", false],
    // The flag alone is not enough: this route ignores it.
    ["/home?tenant=t&diagnostics=ecl", false],
    // The route alone is not enough: the panel is behind the flag.
    ["/home/preview?tenant=t", false],
    ["/home/preview?tenant=t&diagnostics=other", false],
    ["/home/previews?tenant=t&diagnostics=ecl", false],
    ["/tower", false],
  ];
  for (const [findingsPath, expected] of cases) {
    await t.test(`${findingsPath} -> ${expected}`, () => {
      assert.equal(smokeDefault.canMountFindingsPanel(findingsPath), expected);
      if (!findingsPath.startsWith("/home")) return;
      // The contract reaches the same verdict when Home's findings are bound there.
      const planted = smokeDefault.ROUTES.map((route) => (route.key === HOME ? { ...route, findingsPath } : route));
      const result = smokeDefault.validateDemoFindingContract({ routes: planted });
      assert.deepEqual(result.issues, expected ? [] : HOME_FINDING_IDS.map(NOT_ON_PANEL_SURFACE));
    });
  }
});

test("the CLI body runs, with the same verdict, when the checkout is reached through a symlink", () => {
  const link = path.join(tmp, "checkout-link");
  fs.symlinkSync(ROOT, link, "dir");
  const linkedScript = path.join(link, SMOKE);
  assert.notEqual(fs.realpathSync(linkedScript), linkedScript, "the linked path is not a symlinked path");
  for (const modeArgs of [[], ["--default-routes"]]) {
    assert.deepEqual(runContractCli(modeArgs, linkedScript), runContractCli(modeArgs));
  }
});

test("a healthy default-route run is accepted, and Home's findings are read from the findings surface", async () => {
  const smoke = smokeDefault;
  const route = homeRoute(smoke);
  const routeUrl = urlFor(smoke, route.path);
  const findingsUrl = urlFor(smoke, route.findingsPath);
  const site = healthySite(smoke);
  // As in the product, the default Home route shows none of the finding rows.
  for (const check of findingChecksFor(smoke, HOME)) {
    for (const pattern of check.requiredText) {
      assert.equal(pattern.test(site.get(routeUrl).text), false, `the Home route fixture already contains ${pattern}`);
    }
  }

  const { page, summary, home } = await runSmoke(smoke, site);
  assert.deepEqual(summary.issues, []);
  assert.equal(summary.accepted, true);
  assert.equal(summary.route_count, 4);
  assert.equal(summary.findings_demonstrable_on_real_surface.numerator, 10);
  assert.equal(summary.named_surfaces_browser_proven.numerator, 40);

  assert.deepEqual(page.visited.slice(0, 2), [routeUrl, findingsUrl]);
  assert.equal(page.visited.length, smoke.ROUTES.length + 1);
  assert.equal(home.url, routeUrl);
  assert.equal(home.accepted, true);
  assert.equal(home.finding_surface.url, findingsUrl);
  assert.equal(home.finding_surface.accepted, true);
  assert.deepEqual(home.demo_finding_checks.map((check) => check.id), HOME_FINDING_IDS);
  for (const check of home.demo_finding_checks) assert.equal(check.evaluated_url, findingsUrl);
  for (const result of summary.routes.filter((entry) => entry.key !== HOME)) {
    assert.equal(result.finding_surface, null);
    for (const check of result.demo_finding_checks) assert.equal(check.evaluated_url, result.url);
  }

  const { status, compact } = writeCompactSummary(smoke, summary, "healthy");
  assert.equal(status, 0);
  assert.equal(compact.accepted, true);
  assert.deepEqual(compact.default_entry_routes, { numerator: 4, denominator: 4, accepted: true });
});

test("a finding that is not found fails the run as a finding miss, not as a Home route failure", async () => {
  const smoke = smokeDefault;
  const route = homeRoute(smoke);
  const site = healthySite(smoke);
  // The findings surface loads, but the panel rows are not on it.
  site.set(urlFor(smoke, route.findingsPath), { text: padded(["Findings surface without the panel."]) });

  const { summary, home } = await runSmoke(smoke, site);
  assert.equal(summary.accepted, false);

  // Route health is untouched: all four routes are accepted and Home lists no issue.
  assert.deepEqual(home.issues, []);
  assert.equal(home.accepted, true);
  assert.equal(summary.routes.filter((entry) => entry.accepted).length, 4);
  // The findings surface loaded, so it is not reported as failed either.
  assert.equal(home.finding_surface.accepted, true);
  assert.deepEqual(findingSurfaceIssues(summary), []);

  // The misses are reported against the findings, and only the Home ones.
  const findings = summary.findings_demonstrable_on_real_surface;
  assert.equal(findings.accepted, false);
  assert.equal(findings.numerator, 5);
  assert.deepEqual(unacceptedFindingIds(summary), HOME_FINDING_IDS);
  const expectedMisses = findingChecksFor(smoke, HOME).flatMap((check) =>
    check.requiredText.map((pattern) => `${HOME}: missing_demo_finding_${check.id}_${pattern}`));
  assert.deepEqual(summary.issues, expectedMisses);
  assert.equal(summary.issue_count, expectedMisses.length);

  const { status, compact } = writeCompactSummary(smoke, summary, "finding-miss");
  assert.equal(status, 1);
  assert.equal(compact.accepted, false);
  assert.equal(compact.default_entry_routes.numerator, 4);
  assert.equal(compact.default_entry_routes.denominator, 4);
  assert.equal(compact.findings_demonstrable_on_real_surface.numerator, 5);
  assert.equal(compact.findings_demonstrable_on_real_surface.accepted, false);
  assert.equal(compact.named_surfaces_browser_proven.accepted, true);
});

test("an unhealthy Home route fails the run as a route failure, and leaves the findings verdict alone", async () => {
  const smoke = smokeDefault;
  const route = homeRoute(smoke);
  const site = healthySite(smoke);
  site.set(urlFor(smoke, route.path), { ...site.get(urlFor(smoke, route.path)), status: 500 });

  const { summary, home } = await runSmoke(smoke, site);
  assert.equal(summary.accepted, false);
  assert.deepEqual(home.issues, ["http_status_500"]);
  assert.equal(home.accepted, false);
  assert.deepEqual(summary.issues, [`${HOME}: http_status_500`]);
  assert.equal(summary.findings_demonstrable_on_real_surface.accepted, true);
  assert.equal(summary.findings_demonstrable_on_real_surface.numerator, 10);
  assert.equal(home.finding_surface.accepted, true);

  const { status, compact } = writeCompactSummary(smoke, summary, "route-failure");
  assert.equal(status, 1);
  assert.equal(compact.default_entry_routes.numerator, 3);
  assert.equal(compact.findings_demonstrable_on_real_surface.accepted, true);
});

test("a findings surface that does not load is reported as that, not as a Home route failure", async (t) => {
  const smoke = smokeDefault;
  const route = homeRoute(smoke);
  const findingsUrl = urlFor(smoke, route.findingsPath);
  const variants = [
    ["an error status", { text: "Not found", status: 404 }, ["http_status_404", "body_text_too_short"]],
    ["a navigation that throws", { loadError: "navigation timed out" }, ["load_error_navigation timed out"]],
    ["a redirect to sign-in", { text: padded(["Sign in"]), finalUrl: urlFor(smoke, "/sign-in") }, ["redirected_to_sign_in"]],
    ["a page error", { text: padded(findingRows(smoke, HOME)), pageErrors: ["panel crashed"] }, ["pageerror_panel crashed"]],
  ];
  for (const [index, [name, entry, expectedIssues]] of variants.entries()) {
    await t.test(name, async () => {
      const site = healthySite(smoke);
      site.set(findingsUrl, entry);
      const { summary, home } = await runSmoke(smoke, site);
      assert.equal(summary.accepted, false);

      // Home itself is healthy and stays accepted.
      assert.deepEqual(home.issues, []);
      assert.equal(home.accepted, true);
      assert.equal(summary.routes.filter((result) => result.accepted).length, 4);

      // The surface carries its own verdict, and the run lists it under its own name.
      assert.equal(home.finding_surface.url, findingsUrl);
      assert.deepEqual(home.finding_surface.issues, expectedIssues);
      assert.equal(home.finding_surface.accepted, false);
      assert.deepEqual(
        findingSurfaceIssues(summary),
        expectedIssues.map((issue) => `${HOME}: finding_surface_${issue}`),
      );
      assert.deepEqual(summary.issues.slice(0, expectedIssues.length), findingSurfaceIssues(summary));

      const findings = summary.findings_demonstrable_on_real_surface;
      assert.equal(findings.accepted, false);
      assert.deepEqual(findings.finding_surfaces.map((surface) => [surface.route_key, surface.accepted]), [[HOME, false]]);
      assert.deepEqual(findings.finding_surfaces[0].issues, expectedIssues);

      // The compact summary carries the failed surface next to the findings it explains.
      const { status, compact } = writeCompactSummary(smoke, summary, `surface-${index}`);
      assert.equal(status, 1);
      assert.equal(compact.default_entry_routes.numerator, 4);
      assert.deepEqual(compact.findings_demonstrable_on_real_surface.finding_surfaces[0].issues, expectedIssues);
    });
  }
});

test("a findings surface that failed to load is not rescued by the text it returned", async () => {
  const smoke = smokeDefault;
  const route = homeRoute(smoke);
  const site = healthySite(smoke);
  const findingsUrl = urlFor(smoke, route.findingsPath);
  site.set(findingsUrl, { ...site.get(findingsUrl), status: 500 });

  const { summary, home } = await runSmoke(smoke, site);
  // Every row matched, so no finding is listed as missed ...
  assert.deepEqual(findingMissIssues(summary), []);
  assert.equal(summary.findings_demonstrable_on_real_surface.numerator, 10);
  // ... and the run is still refused, on the surface alone.
  assert.deepEqual(summary.issues, [`${HOME}: finding_surface_http_status_500`]);
  assert.equal(summary.findings_demonstrable_on_real_surface.accepted, false);
  assert.equal(summary.accepted, false);
  assert.equal(home.accepted, true);
});

test("finding rows on the default Home route do not stand in for the findings surface", async () => {
  const smoke = smokeDefault;
  const route = homeRoute(smoke);
  const site = healthySite(smoke);
  site.set(urlFor(smoke, route.path), { text: routePageText(smoke, route, { withFindingRows: true }) });
  site.set(urlFor(smoke, route.findingsPath), { text: padded(["Findings surface without the panel."]) });

  const { summary, home } = await runSmoke(smoke, site);
  assert.equal(home.accepted, true);
  assert.deepEqual(unacceptedFindingIds(summary), HOME_FINDING_IDS);
  assert.equal(summary.accepted, false);
});

test("provider opt-in mode reads every finding from its route page and loads no separate surface", async () => {
  const smoke = smokeOptIn;
  assert.ok(!homeRoute(smoke).findingsPath, "opt-in mode should have no separate Home findings surface");
  const { page, summary, home } = await runSmoke(smoke, healthySite(smoke));
  assert.deepEqual(summary.issues, []);
  assert.equal(summary.accepted, true);
  assert.deepEqual(page.visited, smoke.ROUTES.map((route) => urlFor(smoke, route.path)));
  assert.equal(home.finding_surface, null);
  assert.deepEqual(summary.findings_demonstrable_on_real_surface.finding_surfaces, []);

  // Here a missing Home finding row is still a finding miss and still not a route issue.
  const site = healthySite(smoke);
  const route = homeRoute(smoke);
  site.set(urlFor(smoke, route.path), { text: routePageText(smoke, route, { withFindingRows: false }) });
  const missed = await runSmoke(smoke, site);
  assert.equal(missed.home.accepted, true);
  assert.deepEqual(unacceptedFindingIds(missed.summary), HOME_FINDING_IDS);
  assert.equal(findingMissIssues(missed.summary).length, missed.summary.issues.length);
  assert.equal(missed.summary.accepted, false);
});
