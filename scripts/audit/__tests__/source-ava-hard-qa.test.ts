import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SCRIPT = path.join(REPO_ROOT, "scripts/audit/source-ava-hard-qa.mjs");

describe("source-ava-hard-qa audit harness", () => {
  it("emits a 50-question bank with the required Source aVa focus coverage", () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "source-ava-hard-qa-"));

    execFileSync(
      "node",
      [SCRIPT, "--out-dir", outDir, "--fail-on-question-bank"],
      {
        cwd: REPO_ROOT,
        stdio: "pipe",
      },
    );

    const report = JSON.parse(
      fs.readFileSync(path.join(outDir, "source-ava-hard-qa.json"), "utf8"),
    ) as {
      questionCount: number;
      questionBank: { status: string; issues: string[]; requiredFocusAreas: string[] };
      coverage: Record<string, number>;
      coverageDetail: {
        focusAreas: Record<string, number>;
        outputContracts: { table: number; chart: number };
      };
      questions: Array<{
        id: string;
        prompt: string;
        expected: string[];
        focusAreas: string[];
        requiresTable: boolean;
        requiresChart: boolean;
      }>;
      summary: { notRun: number };
    };

    assert.equal(report.questionCount, 50);
    assert.equal(report.questionBank.status, "PASS");
    assert.deepEqual(report.questionBank.issues, []);
    assert.equal(report.summary.notRun, 50);
    assert.deepEqual(report.coverage, {
      optimize: 16,
      contract360: 12,
      event: 16,
      portfolio: 6,
    });
    assert.deepEqual(report.coverageDetail.outputContracts, {
      table: 15,
      chart: 8,
    });
    for (const focus of report.questionBank.requiredFocusAreas) {
      assert.ok(
        report.coverageDetail.focusAreas[focus] > 0,
        `expected focus area ${focus} to be covered`,
      );
    }
    assert.equal(new Set(report.questions.map((question) => question.id)).size, 50);
    assert.equal(report.questions.every((question) => question.expected.length > 0), true);
    assert.equal(
      report.questions.filter((question) =>
        question.focusAreas.includes("vendor_response_claims"),
      ).length,
      5,
    );
  });

  it("scores ghost vendor leakage once per answer instead of inflating the issue count", () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "source-ava-hard-qa-"));
    const capturedFile = path.join(outDir, "captured.json");
    fs.writeFileSync(
      capturedFile,
      JSON.stringify(
        [
          {
            id: "RESP-001",
            answer:
              "| Vendor | Unsupported claim |\n| --- | --- |\n| Amadeus | Unsupported platform claim |\n| Vendor A | One issue |\n| Vendor B | One issue |\n| Vendor C | One issue |",
          },
        ],
        null,
        2,
      ),
    );

    execFileSync(
      "node",
      [
        SCRIPT,
        "--out-dir",
        outDir,
        "--response-file",
        capturedFile,
        "--forbidden-vendors",
        "Amadeus,Crestline,Infosys",
      ],
      {
        cwd: REPO_ROOT,
        stdio: "pipe",
      },
    );

    const report = JSON.parse(
      fs.readFileSync(path.join(outDir, "source-ava-hard-qa.json"), "utf8"),
    ) as {
      results: Array<{ id: string; status: string; issues: string[] }>;
    };
    const result = report.results.find((row) => row.id === "RESP-001");

    assert.equal(result?.status, "FAIL");
    assert.deepEqual(result?.issues, [
      "Configured non-participating vendor terms present: Amadeus",
    ]);
  });
});
