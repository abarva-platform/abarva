import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const REPO_ROOT = path.resolve(__dirname, "../../..");
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

    expect(report.questionCount).toBe(50);
    expect(report.questionBank.status).toBe("PASS");
    expect(report.questionBank.issues).toEqual([]);
    expect(report.summary.notRun).toBe(50);
    expect(report.coverage).toMatchObject({
      optimize: 16,
      contract360: 12,
      event: 16,
      portfolio: 6,
    });
    expect(report.coverageDetail.outputContracts).toEqual({
      table: 15,
      chart: 8,
    });
    for (const focus of report.questionBank.requiredFocusAreas) {
      expect(report.coverageDetail.focusAreas[focus]).toBeGreaterThan(0);
    }
    expect(new Set(report.questions.map((question) => question.id)).size).toBe(50);
    expect(report.questions.every((question) => question.expected.length > 0)).toBe(
      true,
    );
    expect(
      report.questions.filter((question) =>
        question.focusAreas.includes("vendor_response_claims"),
      ),
    ).toHaveLength(5);
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

    expect(result?.status).toBe("FAIL");
    expect(result?.issues).toEqual([
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

    expect(result?.status).toBe("FAIL");
    expect(result?.issues).toContain(
      "Source number quoted without data-plane or counting-basis note.",
    );
    expect(result?.dataPlaneEvidence).toMatchObject({
      quotesSourceNumber: true,
      hasPlaneOrCountingBasis: false,
    });
    expect(result?.dataPlaneEvidence.quotedSourceNumbers).toContain("$755K");
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

    expect(result?.status).toBe("PASS");
    expect(result?.issues).toEqual([]);
    expect(result?.dataPlaneEvidence).toMatchObject({
      quotesSourceNumber: true,
      hasPlaneOrCountingBasis: true,
    });
  });
});
