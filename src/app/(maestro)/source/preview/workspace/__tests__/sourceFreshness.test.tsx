/** @jest-environment jsdom */

import fs from "node:fs";
import path from "node:path";

/**
 * Freshness is read, not inferred.
 *
 * The control used to pattern-match a date out of every row's load run id.
 * An identifier may carry the dataset version's stamp, the run's, both or
 * neither, and nothing distinguishes them — so a package's version date was
 * reported as the portfolio's refresh date, on the surface a reader checks to
 * know whether the numbers are today's.
 *
 * Both package loaders stamp `completed_at` on a terminal status. That column
 * existed for days before anything read it.
 */

const read = (relative: string) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

const shell = read(
  "src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx",
);
const adapter = read("src/lib/source/data-model/read-adapter.ts");
const portfolio = read(
  "src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts",
);

describe("the freshness control", () => {
  it("reads the recorded completion rather than an identifier", () => {
    expect(shell).toContain(
      "portfolio.workspaceDiagnostics.lastCompletedLoadAtIso",
    );
    expect(shell).not.toContain("loadDateFromRunId");
    expect(shell).not.toContain("parseDateStampFromText");
  });

  it("says what it does know when no completed run is recorded", () => {
    // Not a guess, and not a blank: the as-of and scenario branches read real
    // fields and are labelled as themselves.
    expect(shell).toContain('label: "Scenario date"');
    expect(shell).toContain('label: "As of"');
  });
});

describe("the load-run completion read", () => {
  it("returns completed runs only", () => {
    // A failed run also carries a timestamp. Reporting it as a refresh would
    // state that data landed when it did not.
    expect(adapter).toContain("AND status = 'completed'");
    expect(adapter).toContain("AND completed_at IS NOT NULL");
  });

  it("covers both package loaders", () => {
    expect(adapter).toContain("source.cloud_consumption_package_load_run");
    expect(adapter).toContain("source.contract_depth_package_load_run");
  });

  it("is canonical only, and does not widen tenant scope to reach a date", () => {
    // The fallback helper retries under the legacy tenant alias. The ECL path
    // must never scope to it, and a freshness read is not worth the exception.
    const start = adapter.indexOf("export async function listSourceLoadRunCompletions");
    const body = adapter.slice(start, adapter.indexOf("\n}", start));
    expect(body).toContain("safeCanonicalSourceQueryForTenant");
    expect(body).not.toContain("queryCanonicalSourceWithFallback");
  });
});

describe("the newest-completion helper", () => {
  it("does not assume its input is an array", () => {
    // A provider returning nothing means no completed run is known, which the
    // control already reports. It should not be a crash.
    expect(portfolio).toContain("if (!Array.isArray(rows)) return null;");
  });

  it("takes the newest rather than trusting the query's ordering", () => {
    const start = portfolio.indexOf("function latestCompletedLoadIso");
    const body = portfolio.slice(start, portfolio.indexOf("\n}", start));
    expect(body).toContain("time > newest");
    expect(body).toContain("Number.isNaN(time)");
  });
});
