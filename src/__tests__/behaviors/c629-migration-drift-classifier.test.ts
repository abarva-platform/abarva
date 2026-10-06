import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * C-629 — the nightly migration-drift classifier must keep a finding apart
 * from a failure to look.
 *
 * `Migration drift · nightly prod check` run `37121960240` failed
 * 2026-10-03T12:09:34Z with `DRIFT · 2 migration(s) committed but not
 * applied`. That verdict was CORRECT: the uploaded evidence artifact's
 * `dry/04-logs.txt` reads `Pending migrations (2):` and names
 * `20261002060000_home_active_assessment_tenant_fk.sql` and
 * `20261002172500_source_nda_esign_envelopes.sql`, with the operator job's
 * own `summary.json` recording `status: Succeeded`, `ok: true`. The
 * migrations directory and the live `schema_migrations` ledger really do
 * disagree, on exactly those two rows, and the repository side is the right
 * one — both are committed and unapplied. Applying them is a mutating
 * dispatch through `db-migration-lab.yml`, which is not what this change is.
 *
 * What this change is: the classifier that produced that correct verdict
 * reaches it, and three neighbouring verdicts, by reasoning that cannot
 * support them. Measured against `src/scripts/run-migrations.ts`, which is
 * the only producer of the text being classified:
 *
 *   1. `CHECKED, NO DRIFT` was inferred from a MISSING string, never a
 *      present one. The runner prints a positive clean marker — `No pending
 *      migrations.` — and the classifier never required it. So any run with
 *      exit code 0 and a non-empty log that happens not to carry the drift
 *      header was reported as "All migrations in the repository are recorded
 *      as applied": a truncated log stream, a lost inner stdout, a reworded
 *      runner. The workflow's own comment says not-checked must never be
 *      reported as clean; the clean branch was the one place it was.
 *
 *   2. A REAL ledger finding was reported as NOT CHECKED. `findMigrationDrift`
 *      prints `Migration drift detected — an already-applied migration file
 *      was modified` and exits 1. A non-zero exit landed in the first branch,
 *      which tells the operator the check could not run and to go and look at
 *      Azure login and the database secret — when in fact it ran and found
 *      the more serious of the two drift kinds. Same for the destructive-SQL
 *      refusal, which also exits 1 before the pending header is printed.
 *
 *   3. The DRIFT count was re-derived by a filename regex and never
 *      cross-checked against the runner's own authoritative header.
 *      `[0-9]{14}_[a-z0-9_]+\.sql` matches the timestamped names and nothing
 *      else; 42 of the 392 `.sql` files in `supabase/migrations` carry a
 *      three-digit prefix (`054_program_demo_users.sql`). Had any of those
 *      been pending the headline count would have under-reported, and had
 *      only those been pending the summary would have read "0 migration(s)
 *      committed but not applied" while still exiting 1 — a DRIFT verdict
 *      naming no migration at all.
 *
 * The four verdicts are asserted apart BY EXIT CODE, not only by wording,
 * because the run list is where an operator first reads this control and a
 * shared code is what let a configuration failure and a cross-tenant-shaped
 * finding look identical there. Case 10 pins the codes themselves.
 *
 * Every case drives the real CLI as a child process over a log file this test
 * writes, so nothing here depends on a database, on Azure, or on the private
 * network the nightly reaches through an operator job.
 */

const REPO_ROOT = path.resolve(__dirname, "../../..");
const CLI = path.join(REPO_ROOT, "scripts/ci/classify-migration-drift.mjs");
const WORKFLOW = path.join(
  REPO_ROOT,
  ".github/workflows/migration-drift-nightly.yml",
);

type Run = { code: number; stdout: string };

function classify(logBody: string | null, rc: string): Run {
  const dir = mkdtempSync(path.join(tmpdir(), "c629-"));
  const logPath = path.join(dir, "04-logs.txt");
  if (logBody !== null) writeFileSync(logPath, logBody, "utf8");
  const summaryPath = path.join(dir, "summary.md");

  try {
    const stdout = execFileSync(
      process.execPath,
      [CLI, "--rc", rc, "--log", logPath, "--summary", summaryPath],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
    return { code: 0, stdout: stdout + readFileSync(summaryPath, "utf8") };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    let summary = "";
    try {
      summary = readFileSync(summaryPath, "utf8");
    } catch {
      summary = "";
    }
    return {
      code: e.status ?? -1,
      stdout: (e.stdout ?? "") + (e.stderr ?? "") + summary,
    };
  }
}

/**
 * The pending-drift log as the live run actually produced it, copied from
 * `dry/04-logs.txt` in artifact 11273289968 of run 37121960240 — including
 * the ACA container's per-line `stdout F` prefixes, which are part of what
 * the classifier has to read and were never exercised by anything.
 */
const REAL_PENDING_LOG = [
  "2026-10-03T12:12:23.74278  Connecting to the container 'db-migrate'...",
  "2026-10-03T12:11:34.9881059Z stdout F > abarva@0.1.0 db:migrate:dry",
  "2026-10-03T12:11:34.9881497Z stdout F > npx tsx src/scripts/run-migrations.ts --dry",
  "2026-10-03T12:11:35.6807933Z stdout F ✓  Connected to Postgres",
  "2026-10-03T12:11:35.7082701Z stdout F Pending migrations (2):",
  "2026-10-03T12:11:35.7082843Z stdout F    - 20261002060000_home_active_assessment_tenant_fk.sql",
  "2026-10-03T12:11:35.7083395Z stdout F    - 20261002172500_source_nda_esign_envelopes.sql",
  "2026-10-03T12:11:35.7083441Z stdout F (--dry mode, no changes)",
].join("\n");

const REAL_CLEAN_LOG = [
  "2026-10-03T12:12:23.74278  Connecting to the container 'db-migrate'...",
  "2026-10-03T12:11:35.6807933Z stdout F ✓  Connected to Postgres",
  "2026-10-03T12:11:35.7082701Z stdout F ✓  No pending migrations.",
  "2026-10-03T12:11:35.7082843Z stdout F    Applied: 392 / 392",
].join("\n");

describe("C-629 · migration-drift classifier keeps a finding apart from a failure to look", () => {
  it("1. reads the live run's own log and reports DRIFT_PENDING naming both migrations", () => {
    const run = classify(REAL_PENDING_LOG, "0");

    expect(run.code).toBe(1);
    expect(run.stdout).toContain("DRIFT_PENDING");
    expect(run.stdout).toContain(
      "20261002060000_home_active_assessment_tenant_fk.sql",
    );
    expect(run.stdout).toContain(
      "20261002172500_source_nda_esign_envelopes.sql",
    );
    // The headline count comes from the runner's own header, not a re-count.
    expect(run.stdout).toMatch(/2 migration\(s\)/);
  });

  it("2. reports CLEAN only on the runner's positive clean marker", () => {
    const run = classify(REAL_CLEAN_LOG, "0");

    expect(run.code).toBe(0);
    expect(run.stdout).toContain("CLEAN");
    expect(run.stdout).not.toContain("NOT_CHECKED");
  });

  it("3. a truncated log with exit code 0 is NOT_CHECKED, never reported as clean", () => {
    // The defect: exit 0, a non-empty log, and no terminal marker — the ACA
    // log stream cut off after the connect line. The old classifier fell
    // through to "All migrations in the repository are recorded as applied".
    const truncated = [
      "2026-10-03T12:12:23.74278  Connecting to the container 'db-migrate'...",
      "2026-10-03T12:11:35.6807933Z stdout F ✓  Connected to Postgres",
    ].join("\n");

    const run = classify(truncated, "0");

    expect(run.code).toBe(2);
    expect(run.stdout).toContain("NOT_CHECKED");
    expect(run.stdout).not.toMatch(/recorded as applied/i);
    expect(run.stdout).not.toContain("CLEAN");
  });

  it("4. a ledger finding is DRIFT_LEDGER, not a message about Azure login", () => {
    const ledger = [
      "2026-10-03T12:11:35.6807933Z stdout F ✓  Connected to Postgres",
      "2026-10-03T12:11:35.7082701Z stderr F ✗  Migration drift detected — an already-applied migration file was modified.",
      "2026-10-03T12:11:35.7082843Z stderr F    20260516093000_clients_service_role_policy.sql",
      "2026-10-03T12:11:35.7083395Z stderr F      recorded: 8d1f0a",
      "2026-10-03T12:11:35.7083441Z stderr F      current:  4b77e2",
    ].join("\n");

    // Exit code 1 — this is how the runner leaves, and the old classifier
    // read that as "could not run".
    const run = classify(ledger, "1");

    expect(run.code).toBe(1);
    expect(run.stdout).toContain("DRIFT_LEDGER");
    expect(run.stdout).toContain(
      "20260516093000_clients_service_role_policy.sql",
    );
    expect(run.stdout).not.toContain("NOT_CHECKED");
    expect(run.stdout).not.toMatch(/Azure login/i);
  });

  it("5. a destructive-SQL refusal is DRIFT_BLOCKED, with its own remedy", () => {
    const blocked = [
      "2026-10-03T12:11:35.6807933Z stdout F ✓  Connected to Postgres",
      "2026-10-03T12:11:35.7082701Z stderr F ✗  Destructive migration patterns detected (auto-apply blocked).",
      "2026-10-03T12:11:35.7082843Z stderr F    20261002172500_source_nda_esign_envelopes.sql:14 — DROP COLUMN",
    ].join("\n");

    const run = classify(blocked, "1");

    expect(run.code).toBe(1);
    expect(run.stdout).toContain("DRIFT_BLOCKED");
    expect(run.stdout).not.toContain("NOT_CHECKED");
  });

  it("6. an empty log is NOT_CHECKED whatever the exit code says", () => {
    expect(classify("", "0").code).toBe(2);
    expect(classify(null, "0").code).toBe(2);
    expect(classify("", "0").stdout).toContain("NOT_CHECKED");
  });

  it("7. a missing database URL stays NOT_CHECKED — a real failure to look", () => {
    const noUrl = [
      "2026-10-03T12:11:35.5720861Z stderr F ✗  ABARVA_AZURE_DATABASE_URL, AZURE_DATABASE_URL, or DATABASE_URL required in environment",
    ].join("\n");

    const run = classify(noUrl, "1");

    expect(run.code).toBe(2);
    expect(run.stdout).toContain("NOT_CHECKED");
  });

  it("8. a three-digit migration name is named, not dropped by a timestamp regex", () => {
    // 42 of the 392 files in supabase/migrations look like this. The replaced
    // extractor's `[0-9]{14}_...` matched none of them, so this exact log
    // produced "0 migration(s) committed but not applied" and an empty list.
    const legacyName = [
      "2026-10-03T12:11:35.7082701Z stdout F Pending migrations (1):",
      "2026-10-03T12:11:35.7082843Z stdout F    - 054_program_demo_users.sql",
      "2026-10-03T12:11:35.7083441Z stdout F (--dry mode, no changes)",
    ].join("\n");

    const run = classify(legacyName, "0");

    expect(run.code).toBe(1);
    expect(run.stdout).toContain("DRIFT_PENDING");
    expect(run.stdout).toContain("054_program_demo_users.sql");
    expect(run.stdout).toMatch(/1 migration\(s\)/);
    expect(run.stdout).not.toMatch(/0 migration\(s\)/);
  });

  it("9. a header count the name list cannot account for keeps the finding and says so", () => {
    // The header is authoritative: three are pending. Downgrading to
    // NOT_CHECKED here would hide a real finding, which is the defect this
    // whole change is against — so the verdict stands and the shortfall is
    // reported alongside it.
    const lossy = [
      "2026-10-03T12:11:35.7082701Z stdout F Pending migrations (3):",
      "2026-10-03T12:11:35.7082843Z stdout F    - 20261002060000_home_active_assessment_tenant_fk.sql",
      "2026-10-03T12:11:35.7083395Z stdout F    - 20261002172500_source_nda_esign_envelopes.sql",
    ].join("\n");

    const run = classify(lossy, "0");

    expect(run.code).toBe(1);
    expect(run.stdout).toContain("DRIFT_PENDING");
    expect(run.stdout).toMatch(/3 migration\(s\)/);
    expect(run.stdout).toMatch(/2 of 3/);
  });

  it("10. the four verdicts are distinct in the exit code, not only in prose", () => {
    const clean = classify(REAL_CLEAN_LOG, "0").code;
    const pending = classify(REAL_PENDING_LOG, "0").code;
    const notChecked = classify("", "0").code;

    expect(clean).toBe(0);
    expect(pending).toBe(1);
    expect(notChecked).toBe(2);
    // The whole point: a run that could not look is not the same red as a run
    // that looked and found drift.
    expect(notChecked).not.toBe(pending);
  });

  it("11. the nightly workflow invokes this classifier and no longer re-implements it inline", () => {
    const workflow = readFileSync(WORKFLOW, "utf8");

    expect(workflow).toContain("scripts/ci/classify-migration-drift.mjs");
    // The replaced inline extractor, pinned so it cannot quietly come back.
    expect(workflow).not.toContain("[0-9]{14}_[a-z0-9_]+");
    expect(workflow).not.toContain('grep -A200 "Pending migrations"');
  });
});
