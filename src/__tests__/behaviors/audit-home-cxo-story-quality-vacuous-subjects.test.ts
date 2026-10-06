import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * A check whose named subject is missing is not a passing check.
 *
 * `src/components/home/HomeKnowledgeDesignContractSurface.tsx` was deleted. Seven
 * criteria in this audit name it as their subject, and the committed proof bundle
 * recorded all seven as score 1 with `status: "passed"` — a clean bill of health
 * about a file that does not exist. Six of them matched because the missing file
 * was concatenated with `HomeSurface.tsx` and the combined text was scored; the
 * seventh is a negated regex, which the empty string satisfies by construction.
 *
 * The invariant these tests pin is general, not a snapshot: for every criterion
 * that declares a subject file, a missing subject must report VACUOUS and score 0,
 * and the audit must exit non-zero while any criterion is vacuous.
 */

const repoRoot = path.resolve(__dirname, "../../..");
const scriptPath = path.join(
  repoRoot,
  "scripts/knowledge/audit-home-cxo-story-quality.ts",
);

type VisualRow = {
  visual: string;
  criterion: string;
  subject: string;
  status: string;
  score: string;
  evidence: string;
};

type Summary = {
  status: string;
  visualScore: number;
  requiredVisualScore: number;
  failures: string[];
  vacuous?: { criterion: string; subject: string }[];
};

let outDir = "";
let exitCode = 0;
let visualRows: VisualRow[] = [];
let summary: Summary;

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') inQuotes = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") cell += char;
  }
  row.push(cell);
  if (row.length > 1 || row[0] !== "") rows.push(row);
  const [header, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])),
  );
}

beforeAll(() => {
  outDir = mkdtempSync(path.join(tmpdir(), "home-cxo-story-quality-"));
  try {
    execFileSync("npx", ["tsx", scriptPath], {
      cwd: repoRoot,
      env: { ...process.env, HOME_CXO_STORY_QUALITY_OUT_DIR: outDir },
      stdio: "pipe",
    });
    exitCode = 0;
  } catch (error) {
    exitCode = (error as { status?: number }).status ?? -1;
  }
  visualRows = parseCsv(
    readFileSync(path.join(outDir, "visual-quality-score.csv"), "utf8"),
  ) as VisualRow[];
  summary = JSON.parse(
    readFileSync(path.join(outDir, "summary.json"), "utf8"),
  ) as Summary;
}, 120_000);

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

describe("home CXO story quality audit — a missing subject is never a pass", () => {
  it("records the subject file each visual criterion is asserting about", () => {
    expect(visualRows.length).toBeGreaterThan(0);
    for (const row of visualRows) {
      expect(typeof row.subject).toBe("string");
      expect(row.subject.length).toBeGreaterThan(0);
    }
  });

  it("scores 0 and reports VACUOUS for every criterion whose subject file is absent", () => {
    const withAbsentSubject = visualRows.filter(
      (row) => !existsSync(path.join(repoRoot, row.subject)),
    );
    expect(withAbsentSubject.length).toBeGreaterThan(0);
    for (const row of withAbsentSubject) {
      expect(row.status).toBe("VACUOUS");
      expect(row.score).toBe("0");
      expect(row.evidence).toMatch(/NOT PROVEN/);
    }
  });

  it("never scores a criterion 1 while the file it names does not exist", () => {
    const falsePasses = visualRows.filter(
      (row) => row.score === "1" && !existsSync(path.join(repoRoot, row.subject)),
    );
    expect(falsePasses.map((row) => row.criterion)).toEqual([]);
  });

  it("fails the run while any criterion has no live subject", () => {
    expect(summary.vacuous ?? []).not.toHaveLength(0);
    expect(exitCode).not.toBe(0);
    expect(summary.status).toBe("failed");
  });

  it("names the deleted design-contract surface as the missing subject", () => {
    const subjects = new Set((summary.vacuous ?? []).map((entry) => entry.subject));
    expect(subjects).toContain(
      "src/components/home/HomeKnowledgeDesignContractSurface.tsx",
    );
  });

  // M2: relabelling a design-contract criterion with a subject that still exists
  // would restore the false pass while satisfying the generic invariant above.
  it("makes every design-contract criterion declare the design-contract file", () => {
    const designContractRows = visualRows.filter((row) =>
      /design contract/i.test(row.criterion),
    );
    expect(designContractRows.length).toBeGreaterThan(0);
    for (const row of designContractRows) {
      expect(row.subject).toBe(
        "src/components/home/HomeKnowledgeDesignContractSurface.tsx",
      );
    }
  });

  // M3: the run already fails for unrelated reasons, so a non-zero exit is no
  // evidence that vacuity was what failed it. The reason has to be stated.
  it("states the missing subject in the run's own failure list", () => {
    const subjects = [...new Set((summary.vacuous ?? []).map((entry) => entry.subject))];
    expect(subjects.length).toBeGreaterThan(0);
    for (const subject of subjects) {
      expect(summary.failures.some((failure) => failure.includes(subject))).toBe(true);
    }
  });

  it("does not let the negated debug-vocabulary check pass on an empty string", () => {
    const row = visualRows.find(
      (candidate) => candidate.visual === "No primary technical diagnostics",
    );
    expect(row).toBeDefined();
    expect(row?.score).not.toBe("1");
  });
});
