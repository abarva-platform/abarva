/**
 * Guard for the zero-product-source triage record (item 26, the P3 stale-suite
 * triage; record at docs/architecture/t758-zero-product-source-triage.json).
 *
 * This draw is not the ranked pool the six sibling records were drawn from. It
 * is the population the ranking cannot reach: the coverage census scores a
 * directory from the product sources its suites import, and these six import
 * none, because all six read their subject with readFileSync and assert with
 * toContain. So the directories the governed-risk ranking is blind to and the
 * suites that prove their subject by its bytes are the same six.
 *
 * The controls below are the sibling records' controls where they still apply,
 * with three that this draw forced:
 *
 *  1. THE RECORD'S CENTRAL CLAIM IS RECHECKED AGAINST THE LIVE FILES, not
 *     accepted from the record. Every row asserts `sourceTextScanner: true`,
 *     and a row saying so about a suite that no longer reads its subject's
 *     bytes is a record that has gone stale quietly. Each claim is recomputed.
 *
 *  2. A VACUOUS CONTROL MAY NEVER BE WIRED. Three of the six are proven in the
 *     record to survive their own subject being broken. The sibling records
 *     forbade wiring a source-text scanner; here every row is one, so the rule
 *     that carries weight is the narrower one — a suite recorded as proving
 *     nothing about the control it names must appear in no workflow. That is
 *     recomputed from .github/workflows rather than declared.
 *
 *  3. THE REPAIRS ARE PINNED BY SHAPE, NOT BY NARRATION. Two suites were red
 *     because they matched one spelling of a property. A future edit that puts
 *     the quote-sensitive form back would make the record's `repair` verdict
 *     false while leaving every count in it correct, so the repaired shape is
 *     asserted in the file itself.
 *
 * None of these is a shape assertion over the record's own text. Each was
 * broken against a scratch copy to confirm it fails.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const RECORD_PATH = "docs/architecture/t758-zero-product-source-triage.json";

const PRIOR_RECORD_PATHS = [
  "docs/architecture/t472-stale-suite-triage.json",
  "docs/architecture/t475-stale-suite-triage.json",
  "docs/architecture/t509-stale-suite-triage.json",
  "docs/architecture/t550-stale-suite-triage.json",
  "docs/architecture/t556-stale-suite-triage.json",
  "docs/architecture/t742-stale-suite-triage.json",
];

type SuiteRow = {
  path: string;
  verdict: string;
  reason: string;
  sourceTextScanner: boolean;
  coveredByWorkflow: boolean;
  supersededBy?: string;
  baseResult: { passed: number; failed: number };
  afterResult: { passed: number; failed: number };
};

const read = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8");
const record = JSON.parse(read(RECORD_PATH)) as {
  verdictVocabulary: string[];
  counts: Record<string, number>;
  editedInThisChange: { testFilesEdited: string[]; productFilesEdited: string[] };
  wiringDeclaration: { wired: number };
  suites: SuiteRow[];
};

const rows = record.suites;

/** Every path named by any workflow file, as one blob. */
function workflowText(): string {
  const dir = path.join(process.cwd(), ".github/workflows");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .map((f) => readFileSync(path.join(dir, f), "utf8"))
    .join("\n");
}

describe("zero-product-source suite triage record", () => {
  it("draws six suites and names each one only once", () => {
    expect(rows).toHaveLength(6);
    expect(new Set(rows.map((r) => r.path)).size).toBe(6);
  });

  it("names files that exist", () => {
    for (const row of rows) {
      expect(existsSync(path.join(process.cwd(), row.path))).toBe(true);
    }
  });

  it("judges no file an earlier triage record already judged", () => {
    const prior = new Set<string>();
    for (const file of PRIOR_RECORD_PATHS) {
      if (!existsSync(path.join(process.cwd(), file))) continue;
      const body = read(file);
      for (const row of rows) {
        if (body.includes(row.path)) prior.add(row.path);
      }
    }
    expect([...prior]).toEqual([]);
  });

  it("uses only the declared verdicts", () => {
    for (const row of rows) {
      expect(record.verdictVocabulary).toContain(row.verdict);
    }
  });

  it("recomputes every claim that a suite proves its subject by that subject's bytes", () => {
    // The record's central claim. A row may not assert it about a suite that
    // has since been rewritten to import what it tests.
    for (const row of rows) {
      const body = read(row.path);
      const readsBytes = /readFileSync|execFileSync|existsSync/.test(body);
      expect({ path: row.path, readsBytes }).toEqual({
        path: row.path,
        readsBytes: row.sourceTextScanner,
      });
    }
  });

  it("wires no suite it recorded as proving nothing about the control it names", () => {
    const workflows = workflowText();
    const wired = rows
      .filter((row) => row.verdict === "vacuous_control_proof")
      .filter((row) => workflows.includes(row.path));
    expect(wired.map((row) => row.path)).toEqual([]);
    expect(record.wiringDeclaration.wired).toBe(0);
  });

  it("gives a vacuous_control_proof verdict only where the record names the mutation that survived", () => {
    for (const row of rows.filter((r) => r.verdict === "vacuous_control_proof")) {
      const raw = JSON.stringify(row);
      expect(raw).toMatch(/"mutation"/);
      expect(raw).toMatch(/restoredSha256":\s*"[0-9a-f]{64}"/);
    }
  });

  it("makes an update_with_reason_recorded verdict cite the change that superseded it, in the file as well as the record", () => {
    const updated = rows.filter((r) => r.verdict === "update_with_reason_recorded");
    expect(updated.length).toBeGreaterThan(0);
    for (const row of updated) {
      expect(row.supersededBy).toMatch(/^[0-9a-f]{40}$/);
      // The reason has to reach whoever opens the test, not only whoever opens
      // the record — the abbreviated commit must appear in the suite's header.
      expect(read(row.path)).toContain((row.supersededBy as string).slice(0, 9));
    }
  });

  it("keeps a repaired suite matching the property rather than one spelling of it", () => {
    const repaired = rows.filter((r) => r.verdict === "repair");
    expect(repaired.length).toBeGreaterThan(0);
    for (const row of repaired) {
      const body = read(row.path);
      // Assertions only. The header of a repaired suite quotes the form it
      // replaced, by design — a scan of the whole file would be matching the
      // explanation of the defect rather than the defect.
      const assertions = body
        .split("\n")
        .filter((line) => line.includes("expect("))
        .join("\n");
      // The pre-image form. Re-introducing it is what would make the `repair`
      // verdict false while leaving every count in the record correct.
      expect(assertions).not.toContain("toContain(\"minHeight: '100%'\")");
      expect(assertions).not.toContain("toContain(\"minHeight: '100vh'\")");
      expect(body).toMatch(/minHeight:\\s\*\["']100%\["']/);
    }
  });

  it("edited no product file it passed judgement on", () => {
    expect(record.editedInThisChange.productFilesEdited).toEqual([]);
    // And every file it did edit is one of the suites under judgement, not a
    // subject: a triage may repair a test, never the thing the test measures.
    for (const file of record.editedInThisChange.testFilesEdited) {
      expect(rows.map((r) => r.path)).toContain(file);
    }
  });

  it("keeps the published counts equal to the rows they summarise", () => {
    const tally = (verdict: string) => rows.filter((r) => r.verdict === verdict).length;
    expect(record.counts.suites).toBe(rows.length);
    expect(record.counts.sourceTextScanners).toBe(rows.filter((r) => r.sourceTextScanner).length);
    expect(record.counts.redAtBase).toBe(rows.filter((r) => r.baseResult.failed > 0).length);
    expect(record.counts.verdictReal).toBe(tally("real"));
    expect(record.counts.verdictRepair).toBe(tally("repair"));
    expect(record.counts.verdictUpdateWithReasonRecorded).toBe(
      tally("update_with_reason_recorded"),
    );
    expect(record.counts.verdictVacuousControlProof).toBe(tally("vacuous_control_proof"));
  });

  it("leaves no row green at base carrying a verdict that assumes it was red", () => {
    for (const row of rows) {
      if (row.baseResult.failed === 0) {
        expect(["repair", "update_with_reason_recorded"]).not.toContain(row.verdict);
      }
      if (row.baseResult.failed > 0) {
        expect(row.afterResult.failed).toBe(0);
      }
    }
  });
});
