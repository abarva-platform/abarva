import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  demonstratesTheSweep,
  runFixtureDomainSignal,
} from "../../../scripts/quality/enum-reachability.mjs";

/**
 * Item 126 stayed invisible partly because of fixtures: every unit test
 * injected its own row source and asserted `promotion_state: "published"`
 * resolves — true about the function, false about the product. Excluding
 * test files from the enum sweep was the bounded choice and a stated limit.
 *
 * A limit nobody measures is indistinguishable from a limit that has started
 * costing something, so this measures it. Measured today: **zero** fixtures
 * outside the sweep's own suites assert a value their column cannot hold.
 * That is why there is no "deliberately invalid fixture" declaration here —
 * there is no population to design one for, and inventing a convention for a
 * hypothetical is how conventions arrive wrong.
 *
 * It reports and does not gate, and that is a decision rather than caution:
 * a fixture outside its column's domain is a real signal but not
 * automatically a defect, because a test may legitimately construct an
 * invalid row to prove it is rejected. Failing on that would make the honest
 * test the broken one.
 */

describe("the fixture domain signal", () => {
  it("is zero today, across the whole test tree", () => {
    const signal = runFixtureDomainSignal({
      migrationsDir: "supabase/migrations",
      srcDir: "src",
    });

    expect(signal.findings).toEqual([]);

    // The control. A signal of zero means nothing if it looked at nothing,
    // and this is the number that would quietly collapse if the test-file
    // set were ever computed wrongly.
    expect(signal.considered).toBeGreaterThan(1000);
  });

  it("skips the sweep's own demonstrations, and only those", () => {
    const signal = runFixtureDomainSignal({
      migrationsDir: "supabase/migrations",
      srcDir: "src",
    });

    // Three: the two suites that exercise the sweep, and this one, which
    // names the script's path in the case below. That this file excludes
    // itself is the predicate working rather than an accident — a suite
    // about the sweep is a suite whose fixtures are deliberate.
    //
    // If this grows, an ordinary test file has started naming the script's
    // path and is being skipped for it, which would hide a real fixture.
    expect(signal.selfDemonstrating).toBe(3);
  });

  it("recognises both ways a suite works on the sweep", () => {
    // The first version of this predicate looked for an import and missed
    // the suite that matters most, which does not import the sweep — it
    // spawns it by path. Both forms name the module path.
    expect(
      demonstratesTheSweep(
        'import { runEnumReachabilitySweep } from "../../scripts/quality/enum-reachability.mjs";',
      ),
    ).toBe(true);
    expect(
      demonstratesTheSweep(
        'const script = path.join(repoRoot, "scripts/quality/enum-reachability.mjs");',
      ),
    ).toBe(true);
    expect(demonstratesTheSweep('const x = ["published"] as const;')).toBe(false);
  });

  it("reports a test fixture that asserts an impossible value", () => {
    // The signal proven to fire, not merely to read zero. A scanner that
    // has never found anything has not been shown to look.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fixture-signal-"));
    fs.mkdirSync(path.join(dir, "__tests__"));
    fs.writeFileSync(
      path.join(dir, "__tests__", "invented.test.ts"),
      "const sql = `SELECT 1 FROM engagement_topics WHERE promotion_state IN ('published')`;\n" +
        "export default sql;\n",
      "utf8",
    );

    try {
      const signal = runFixtureDomainSignal({
        migrationsDir: "supabase/migrations",
        srcDir: dir,
      });

      expect(signal.findings).toHaveLength(1);
      expect(signal.findings[0].verdict).toBe("UNREACHABLE");
      expect(signal.findings[0].impossible).toEqual(["published"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("looks at test files only, and says nothing about production code", () => {
    // Without this the signal could be scanning the whole tree and still
    // read zero, because production code is already clean — so "0 test
    // fixtures" would be a claim about a set it never isolated. A mutation
    // that scanned everything survived every other case here.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fixture-signal-"));
    fs.writeFileSync(
      path.join(dir, "production.ts"),
      "const sql = `SELECT 1 FROM engagement_topics WHERE promotion_state IN ('published')`;\n" +
        "export default sql;\n",
      "utf8",
    );

    try {
      const signal = runFixtureDomainSignal({
        migrationsDir: "supabase/migrations",
        srcDir: dir,
      });

      // The same impossible value that fires from a test file above. Here
      // it is the main sweep's business, not this signal's.
      expect(signal.findings).toEqual([]);
      expect(signal.considered).toBe(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("reports a vocabulary constant in a test file, not only inline SQL", () => {
    // The signal folds in the annotated-constant scan. Nothing proved it:
    // no test file holds an annotated constant with a bad value, so
    // removing that source changed nothing and the mutation survived.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fixture-signal-"));
    fs.mkdirSync(path.join(dir, "__tests__"));
    fs.writeFileSync(
      path.join(dir, "__tests__", "vocabulary.test.ts"),
      "/**\n * @column engagement_topics.promotion_state\n */\n" +
        'export const FIXTURE_STATES = ["published"] as const;\n',
      "utf8",
    );

    try {
      const signal = runFixtureDomainSignal({
        migrationsDir: "supabase/migrations",
        srcDir: dir,
      });

      expect(signal.findings).toHaveLength(1);
      expect(signal.findings[0].verdict).toBe("UNREACHABLE");
      expect(signal.findings[0].form).toBe("const FIXTURE_STATES");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("does not report a fixture in a file that works on the sweep", () => {
    // The exclusion proven to apply, against the same fixture that fires
    // above. Otherwise "skips its own demonstrations" is an assertion about
    // a count rather than about behaviour.
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "fixture-signal-"));
    fs.mkdirSync(path.join(dir, "__tests__"));
    fs.writeFileSync(
      path.join(dir, "__tests__", "about-the-sweep.test.ts"),
      'const script = "scripts/quality/enum-reachability.mjs";\n' +
        "const sql = `SELECT 1 FROM engagement_topics WHERE promotion_state IN ('published')`;\n" +
        "export default [script, sql];\n",
      "utf8",
    );

    try {
      const signal = runFixtureDomainSignal({
        migrationsDir: "supabase/migrations",
        srcDir: dir,
      });

      expect(signal.findings).toEqual([]);
      expect(signal.selfDemonstrating).toBe(1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
