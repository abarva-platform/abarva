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
    assert.equal(report.coverageDetail.outputContracts.table, 15);
    assert.equal(report.coverageDetail.outputContracts.chart, 8);
    assert.equal(report.coverageDetail.outputContracts.selectedTable, 15);
    assert.equal(report.coverageDetail.outputContracts.selectedChart, 8);
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

  it("can execute a selected hard-QA slice while still validating the full bank", () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "source-ava-hard-qa-"));

    execFileSync(
      "node",
      [
        SCRIPT,
        "--out-dir",
        outDir,
        "--ids",
        "OPT-001,OPT-004",
        "--fail-on-question-bank",
      ],
      {
        cwd: REPO_ROOT,
        stdio: "pipe",
      },
    );

    const report = JSON.parse(
      fs.readFileSync(path.join(outDir, "source-ava-hard-qa.json"), "utf8"),
    ) as {
      questionCount: number;
      selectedQuestionCount: number;
      selectedQuestions: string[];
      questionBank: { status: string };
      summary: { notRun: number };
      coverageDetail: {
        outputContracts: { selectedTable: number; selectedChart: number };
      };
    };

    assert.equal(report.questionCount, 50);
    assert.equal(report.selectedQuestionCount, 2);
    assert.deepEqual(report.selectedQuestions, ["OPT-001", "OPT-004"]);
    assert.equal(report.questionBank.status, "PASS");
    assert.equal(report.summary.notRun, 2);
    assert.equal(report.coverageDetail.outputContracts.selectedTable, 0);
    assert.equal(report.coverageDetail.outputContracts.selectedChart, 1);
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

  it("flags Source numbers when the answer omits the data plane or counting basis", () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "source-ava-hard-qa-"));
    const capturedFile = path.join(outDir, "captured.json");
    fs.writeFileSync(
      capturedFile,
      JSON.stringify(
        [
          {
            id: "OPT-002",
            answer:
              "| Opportunity | Amount | Calculation |\n| --- | ---: | --- |\n| Recoverable leakage | $755K | run-1 |",
          },
        ],
        null,
        2,
      ),
    );

    execFileSync(
      "node",
      [SCRIPT, "--out-dir", outDir, "--response-file", capturedFile],
      {
        cwd: REPO_ROOT,
        stdio: "pipe",
      },
    );

    const report = JSON.parse(
      fs.readFileSync(path.join(outDir, "source-ava-hard-qa.json"), "utf8"),
    ) as {
      results: Array<{
        id: string;
        status: string;
        issues: string[];
        dataPlaneEvidence: {
          quotesSourceNumber: boolean;
          hasPlaneOrCountingBasis: boolean;
          quotedSourceNumbers: string[];
        };
      }>;
    };
    const result = report.results.find((row) => row.id === "OPT-002");

    assert.equal(result?.status, "FAIL");
    assert.ok(result?.issues.includes(
      "Source number quoted without data-plane or counting-basis note.",
    ));
    assert.equal(result?.dataPlaneEvidence.quotesSourceNumber, true);
    assert.equal(result?.dataPlaneEvidence.hasPlaneOrCountingBasis, false);
    assert.ok(result?.dataPlaneEvidence.quotedSourceNumbers.includes("$755K"));
  });

  it("accepts Source numbers when the answer states the live plane or counting basis", () => {
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "source-ava-hard-qa-"));
    const capturedFile = path.join(outDir, "captured.json");
    fs.writeFileSync(
      capturedFile,
      JSON.stringify(
        [
          {
            id: "OPT-002",
            answer:
              "Counting basis: live source.contract_360 and the current Source optimization read model rows for this contract.\n\n| Opportunity | Amount | Calculation |\n| --- | ---: | --- |\n| Recoverable leakage | $755K | run-1 |",
          },
        ],
        null,
        2,
      ),
    );

    execFileSync(
      "node",
      [SCRIPT, "--out-dir", outDir, "--response-file", capturedFile],
      {
        cwd: REPO_ROOT,
        stdio: "pipe",
      },
    );

    const report = JSON.parse(
      fs.readFileSync(path.join(outDir, "source-ava-hard-qa.json"), "utf8"),
    ) as {
      results: Array<{
        id: string;
        status: string;
        issues: string[];
        dataPlaneEvidence: {
          quotesSourceNumber: boolean;
          hasPlaneOrCountingBasis: boolean;
        };
      }>;
    };
    const result = report.results.find((row) => row.id === "OPT-002");

    assert.equal(result?.status, "PASS");
    assert.deepEqual(result?.issues, []);
    assert.equal(result?.dataPlaneEvidence.quotesSourceNumber, true);
    assert.equal(result?.dataPlaneEvidence.hasPlaneOrCountingBasis, true);
  });
});
