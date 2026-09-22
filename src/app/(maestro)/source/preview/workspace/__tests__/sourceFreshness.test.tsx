/**
 * Freshness is read, not inferred.
 *
 * The control used to pattern-match a date out of every row's load run id. An
 * identifier may carry the dataset version's stamp, the run's, both or
 * neither, and nothing distinguishes them — so a package's version date was
 * reported as the portfolio's refresh date, on the surface a reader checks to
 * know whether the numbers are today's.
 *
 * Both package loaders stamp `completed_at` on a terminal status. That column
 * existed for days before anything read it.
 *
 * ---
 *
 * These cases used to read the three source files with `fs.readFileSync` and
 * assert substrings of them. Every one was green, and every one would have
 * stayed green against a file whose only mention of the matched string was a
 * comment — including the comment above this line. They now run the code.
 *
 * Where a contract lives in SQL that no unit test can execute (a `status`
 * filter is applied by Postgres, not by us), the assertion is made against the
 * statement the adapter *issued at runtime*, captured from the session it
 * opened. That is still a string, but it is a string the function produced
 * while running — a comment in the file cannot satisfy it.
 */

jest.mock("server-only", () => ({}));

jest.mock("@/lib/data-plane/azureRead", () => ({
  azureRead: {
    withSession: jest.fn(),
    query: jest.fn(async () => []),
  },
}));

import { azureRead } from "@/lib/data-plane/azureRead";
import { listSourceLoadRunCompletions } from "@/lib/source/data-model/read-adapter";

import { loadSourceWorkspacePortfolio } from "../live/portfolioAdapter";
import { sourceDateControl } from "../WorkspaceExecutiveShell";

import type { SourceWorkspacePortfolioData } from "../live/portfolioAdapter";

const mockWithSession = azureRead.withSession as jest.MockedFunction<
  typeof azureRead.withSession
>;

const LOAD_RUN_TABLES = [
  "source.cloud_consumption_package_load_run",
  "source.contract_depth_package_load_run",
] as const;

type Statement = { readonly sql: string; readonly params: readonly unknown[] };

type SessionLog = {
  /** One entry per `withSession` call — the fallback helper opens a second. */
  readonly sessions: number;
  readonly statements: readonly Statement[];
};

/**
 * Drive the adapter against a recording session and hand back what it did.
 *
 * `rowsForLoadRunQuery` is deliberately typed loosely: one case feeds it a
 * non-array to prove the portfolio's guard, which is the whole point of that
 * guard existing.
 */
function recordSession(rowsForLoadRunQuery: unknown = []) {
  const statements: Statement[] = [];
  const log = { sessions: 0, statements };
  mockWithSession.mockImplementation((async (fn: unknown) => {
    log.sessions += 1;
    const run = async (sql: string, params: readonly unknown[] = []) => {
      statements.push({ sql, params });
      if (sql.includes("package_load_run")) return rowsForLoadRunQuery;
      return [];
    };
    return (fn as (r: typeof run) => unknown)(run);
  }) as unknown as typeof azureRead.withSession);
  return log as SessionLog;
}

function loadRunStatements(log: SessionLog): readonly Statement[] {
  return log.statements.filter((statement) =>
    statement.sql.includes("package_load_run"),
  );
}

/** The two halves of the `UNION ALL`, so a filter on one cannot cover both. */
function unionBranches(sql: string): readonly string[] {
  return sql.split(/\bUNION ALL\b/);
}

function completionRow(overrides: Record<string, unknown>) {
  return {
    tenant_key: "meridian-health",
    dataset_version: "2026-09-01",
    load_run_id: "run-2019-01-01-not-a-refresh-date",
    source_table: LOAD_RUN_TABLES[0],
    completed_at: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

const ORIGINAL_PROVIDER = process.env.SOURCE_WORKSPACE_PROVIDER;

beforeEach(() => {
  mockWithSession.mockReset();
  process.env.SOURCE_WORKSPACE_PROVIDER = "legacy";
});

afterEach(() => {
  if (ORIGINAL_PROVIDER === undefined) {
    delete process.env.SOURCE_WORKSPACE_PROVIDER;
  } else {
    process.env.SOURCE_WORKSPACE_PROVIDER = ORIGINAL_PROVIDER;
  }
});

/**
 * A portfolio carrying only what the date control reads, plus a load run id
 * whose text contains a date that is *not* the refresh date. If the control
 * ever goes back to parsing an identifier, it will report 2019 and these cases
 * will say so.
 */
function portfolioWith(
  fields: Partial<{
    lastCompletedLoadAtIso: string | null;
    asOfDateIso: string;
  }>,
): SourceWorkspacePortfolioData {
  return {
    asOfDateIso: fields.asOfDateIso ?? "2026-06-30",
    workspaceDiagnostics: {
      activeLoadRunId: "run-2019-01-01-not-a-refresh-date",
      lastCompletedLoadAtIso: fields.lastCompletedLoadAtIso ?? null,
    },
  } as unknown as SourceWorkspacePortfolioData;
}

describe("the freshness control", () => {
  it("reports the recorded completion, not a date carried in the load run id", () => {
    const control = sourceDateControl(
      portfolioWith({ lastCompletedLoadAtIso: "2026-09-15T04:00:00.000Z" }),
    );

    expect(control).toEqual({
      ariaLabel: "Source freshness",
      label: "Refreshed",
      value: "15 Sept 2026",
    });
    // The identifier in the fixture says 2019. Nothing the control produced
    // may come from it.
    expect(JSON.stringify(control)).not.toContain("2019");
  });

  it("says what it does know when no completed run is recorded", () => {
    // Not a guess, and not a blank: each branch reads a real field and is
    // labelled as itself.
    expect(sourceDateControl(portfolioWith({ asOfDateIso: "2027-06-30" }))).toEqual(
      {
        ariaLabel: "Source scenario date",
        label: "Scenario date",
        value: "30 Jun 2027",
      },
    );
    expect(sourceDateControl(portfolioWith({ asOfDateIso: "2026-06-30" }))).toEqual(
      {
        ariaLabel: "Data as of",
        label: "As of",
        value: "30 Jun 2026",
      },
    );
  });
});

describe("the load-run completion read", () => {
  it("filters to completed runs with a completion stamp, on both halves of the union", async () => {
    // A failed run also carries a timestamp. Reporting it as a refresh would
    // state that data landed when it did not. The filter runs in Postgres, so
    // the assertion is on the statement the adapter actually issued.
    const log = recordSession();
    await listSourceLoadRunCompletions("meridian-health");

    const issued = loadRunStatements(log);
    expect(issued).toHaveLength(1);

    const branches = unionBranches(issued[0].sql);
    expect(branches).toHaveLength(2);
    for (const branch of branches) {
      expect(branch).toContain("status = 'completed'");
      expect(branch).toContain("completed_at IS NOT NULL");
    }
  });

  it("covers both package loaders and returns what each one reports", async () => {
    const log = recordSession([
      completionRow({
        source_table: LOAD_RUN_TABLES[0],
        completed_at: "2026-06-01T00:00:00.000Z",
      }),
      completionRow({
        source_table: LOAD_RUN_TABLES[1],
        completed_at: "2026-09-15T00:00:00.000Z",
      }),
    ]);

    const rows = await listSourceLoadRunCompletions("meridian-health");

    const [statement] = loadRunStatements(log);
    for (const table of LOAD_RUN_TABLES) {
      expect(statement.sql).toContain(`FROM ${table}`);
    }
    expect(rows.map((row) => row.source_table)).toEqual([...LOAD_RUN_TABLES]);
  });

  it("stays canonical and does not widen tenant scope to reach a date", async () => {
    // The fallback helper retries under the legacy tenant alias when the
    // canonical read comes back empty. The ECL path must never scope to it,
    // and a freshness read is not worth the exception — so this case makes the
    // canonical read return nothing, which is exactly when a fallback would
    // fire, and then proves none did.
    const log = recordSession([]);
    const rows = await listSourceLoadRunCompletions("meridian-health");

    expect(rows).toEqual([]);
    // A fallback opens a second session; a canonical-only read opens one.
    expect(log.sessions).toBe(1);
    expect(loadRunStatements(log)).toHaveLength(1);

    const everyParam = JSON.stringify(
      log.statements.map((statement) => statement.params),
    );
    // The widened alias set and the legacy RLS key both carry this key, and
    // the canonical read carries neither.
    expect(everyParam).not.toContain("meridian_health_global");
    expect(loadRunStatements(log)[0].params).toEqual([["meridian-health"]]);
  });
});

describe("the newest-completion helper", () => {
  it("takes the newest rather than trusting the query's ordering", async () => {
    // Fed to the portfolio out of order, with one unparseable stamp among
    // them. The newest valid completion is the answer.
    recordSession([
      completionRow({ completed_at: "2026-06-01T00:00:00.000Z" }),
      completionRow({ completed_at: "2026-09-15T00:00:00.000Z" }),
      completionRow({ completed_at: "not-a-timestamp" }),
      completionRow({ completed_at: "2026-07-01T00:00:00.000Z" }),
    ]);

    const portfolio = await loadSourceWorkspacePortfolio(
      "meridian-health",
      "2026-06-30",
    );

    expect(portfolio.workspaceDiagnostics.lastCompletedLoadAtIso).toBe(
      "2026-09-15T00:00:00.000Z",
    );
  });

  it("reports no known completion rather than crashing when the read returns nothing", async () => {
    // A freshness date is not worth a crash. A provider returning something
    // that is not a row set means no completed run is known, which the control
    // already reports as "As of".
    recordSession(null);

    const portfolio = await loadSourceWorkspacePortfolio(
      "meridian-health",
      "2026-06-30",
    );

    expect(portfolio.workspaceDiagnostics.lastCompletedLoadAtIso).toBeNull();
    expect(sourceDateControl(portfolio).label).toBe("As of");
  });
});
