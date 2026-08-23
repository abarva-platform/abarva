#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

import {
  resolveAdaptiveDepth,
  shouldGenerateArtifact,
  type AdaptiveDepthDecision,
} from "../../src/lib/deliverables/adaptive-depth";

type Assertion = {
  name: string;
  pass: boolean;
  detail: string;
};

type Scenario = {
  key: string;
  title: string;
  text: string;
  artifactKeys: string[];
  decision: AdaptiveDepthDecision;
  assertions: Assertion[];
};

type TestRun = {
  command: string;
  status: "passed" | "failed" | "skipped";
  outputFile: string;
};

const repoRoot = process.cwd();
const generatedAt = new Date().toISOString();
const stamp = generatedAt.replace(/[:.]/g, "-");
const defaultOutDir = path.join(
  process.env.HOME ?? "/Users/anand",
  "Downloads",
  `moves-adaptive-depth-proof-${stamp}`,
);

function argValue(name: string): string | null {
  const prefix = `${name}=`;
  const hit = process.argv.find((arg) => arg.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

const outDir = path.resolve(argValue("--out-dir") ?? defaultOutDir);
const skipTests = process.argv.includes("--skip-tests");

const p3Artifacts = [
  "target_state_architecture",
  "solution_design",
  "operating_model_design",
  "requirements_traceability",
  "sourcing_strategy",
];

function assert(name: string, pass: boolean, detail: string): Assertion {
  return { name, pass, detail };
}

function readSha(): string {
  try {
    return execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

function makeScenario(
  key: string,
  title: string,
  text: string,
  artifactKeys = p3Artifacts,
  checks: (decision: AdaptiveDepthDecision) => Assertion[],
): Scenario {
  const decision = resolveAdaptiveDepth({ text, artifactKeys });
  return {
    key,
    title,
    text,
    artifactKeys,
    decision,
    assertions: checks(decision),
  };
}

const scenarios = [
  makeScenario(
    "straightforward-dashboard",
    "Straightforward dashboard pattern",
    [
      "Straightforward reusable dashboard and scorecard pattern.",
      "One mature certified data source, one business process, no vendor decision.",
      "No AI agent, no model risk, no real-time mechanism, and deployment topology is not yet established.",
      "The move confirms an approved reporting view pattern and needs an architecture-on-a-page, concise design, compact traceability, deterministic estimate, risks, and next decision.",
    ].join("\n"),
    p3Artifacts,
    (d) => [
      assert(
        "tier is straightforward",
        d.complexityTier === "straightforward",
        `resolved ${d.complexityTier}`,
      ),
      assert(
        "sourcing strategy omitted",
        d.artifactApplicability.sourcing_strategy?.applicability ===
          "not_applicable",
        d.artifactApplicability.sourcing_strategy?.reason ?? "missing",
      ),
      assert(
        "operating model merged into solution design",
        d.artifactApplicability.operating_model_design?.applicability ===
          "merge_into_parent" &&
          d.artifactApplicability.operating_model_design?.mergeInto ===
            "solution_design",
        d.artifactApplicability.operating_model_design?.reason ?? "missing",
      ),
      assert(
        "target architecture is lightweight",
        d.artifactApplicability.target_state_architecture?.applicability ===
          "lightweight",
        d.artifactApplicability.target_state_architecture?.reason ?? "missing",
      ),
      assert(
        "AI orchestration omitted",
        d.storyBeatApplicability.ai_orchestration?.applicability ===
          "not_applicable",
        d.storyBeatApplicability.ai_orchestration?.reason ?? "missing",
      ),
      assert(
        "physical architecture omitted when topology is immature",
        d.storyBeatApplicability.physical_architecture?.applicability ===
          "not_applicable",
        d.storyBeatApplicability.physical_architecture?.reason ?? "missing",
      ),
      assert(
        "guidance forbids artificial option padding",
        d.guidance.some((line) => /Do not invent three options/i.test(line)),
        d.guidance.join(" "),
      ),
      assert(
        "route generation set is compact",
        p3Artifacts.filter((key) => shouldGenerateArtifact(d, key)).length ===
          3,
        `generated=${p3Artifacts
          .filter((key) => shouldGenerateArtifact(d, key))
          .join(",")}`,
      ),
    ],
  ),
  makeScenario(
    "complex-regulated-ai",
    "Complex regulated AI workflow",
    [
      "Complex clinical regulated AI agent workflow touching PHI and HIPAA controls.",
      "Multiple data sources, identity resolution, model risk, real-time latency requirement, vendor sourcing decision, partner selection, and API integrations.",
      "Deployment topology includes private endpoint, VNet, regional boundary, RBAC, model endpoint, and human-in-the-loop approval for regulated actions.",
      "Operating model, decision rights, evidence gaps, and security boundaries are material.",
    ].join("\n"),
    p3Artifacts,
    (d) => [
      assert(
        "tier is complex",
        d.complexityTier === "complex",
        `resolved ${d.complexityTier}; score=${d.score}`,
      ),
      assert(
        "sourcing strategy required",
        d.artifactApplicability.sourcing_strategy?.applicability === "required",
        d.artifactApplicability.sourcing_strategy?.reason ?? "missing",
      ),
      assert(
        "AI orchestration triggered",
        d.storyBeatApplicability.ai_orchestration?.applicability ===
          "triggered",
        d.storyBeatApplicability.ai_orchestration?.reason ?? "missing",
      ),
      assert(
        "human-in-the-loop triggered",
        d.storyBeatApplicability.human_in_loop_design?.applicability ===
          "triggered",
        d.storyBeatApplicability.human_in_loop_design?.reason ?? "missing",
      ),
      assert(
        "real-time flow triggered",
        d.storyBeatApplicability.real_time_flow?.applicability === "triggered",
        d.storyBeatApplicability.real_time_flow?.reason ?? "missing",
      ),
      assert(
        "physical architecture triggered",
        d.storyBeatApplicability.physical_architecture?.applicability ===
          "triggered",
        d.storyBeatApplicability.physical_architecture?.reason ?? "missing",
      ),
    ],
  ),
  {
    key: "missing-required-physical",
    title: "Missing required physical architecture evidence",
    text: "Straightforward dashboard, but the governance checklist explicitly requires physical_architecture and the deployment evidence is missing.",
    artifactKeys: ["target_state_architecture"],
    decision: resolveAdaptiveDepth({
      text: "Straightforward dashboard. Insufficient evidence for required deployment decision.",
      signals: {
        declaredStraightforward: true,
        missingRequiredDimensions: ["physical_architecture"],
      },
      artifactKeys: ["target_state_architecture"],
    }),
    assertions: [],
  } satisfies Scenario,
];

scenarios[2].assertions = [
  assert(
    "required missing dimension renders Insufficient Evidence",
    scenarios[2].decision.storyBeatApplicability.physical_architecture
      ?.applicability === "required" &&
      scenarios[2].decision.storyBeatApplicability.physical_architecture
        ?.evidenceState === "insufficient_evidence",
    scenarios[2].decision.storyBeatApplicability.physical_architecture
      ?.reason ?? "missing",
  ),
];

function csvEscape(value: unknown): string {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function writeCsv(
  file: string,
  headers: string[],
  rows: Array<Record<string, unknown>>,
): void {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(",")),
  ];
  fs.writeFileSync(file, `${lines.join("\n")}\n`);
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function runTest(command: string, outputFile: string): TestRun {
  if (skipTests) {
    fs.writeFileSync(outputFile, "skipped by --skip-tests\n");
    return { command, status: "skipped", outputFile };
  }
  try {
    const output = execFileSync("zsh", ["-lc", command], {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 1024 * 1024 * 20,
    });
    fs.writeFileSync(outputFile, output);
    return { command, status: "passed", outputFile };
  } catch (error) {
    const err = error as {
      stdout?: Buffer | string;
      stderr?: Buffer | string;
      status?: number;
    };
    fs.writeFileSync(
      outputFile,
      [
        `exit_status=${err.status ?? "unknown"}`,
        String(err.stdout ?? ""),
        String(err.stderr ?? ""),
      ].join("\n"),
    );
    return { command, status: "failed", outputFile };
  }
}

function formatEvidence(): Record<string, unknown>[] {
  const file = fs.readFileSync(
    path.join(repoRoot, "src/lib/programs/orchestrated-deliverable-map.ts"),
    "utf8",
  );
  return [
    {
      rule: "architecture and solution-design final format",
      expected: "pptx",
      passed:
        /PPTX_FINAL_DELIVERABLES[\s\S]*target_state_architecture/.test(file) &&
        /PPTX_FINAL_DELIVERABLES[\s\S]*solution_design/.test(file),
      evidence:
        "PPTX_FINAL_DELIVERABLES contains target_state_architecture and solution_design",
    },
    {
      rule: "financial model final format",
      expected: "xlsx",
      passed: /format === "excel" \? "xlsx" : "docx"/.test(file),
      evidence: "registry excel recommendation maps to xlsx",
    },
    {
      rule: "narrative final format",
      expected: "docx",
      passed: /default: Word\/DOCX/i.test(file) || /return "docx";/.test(file),
      evidence: "default prescribed format is docx",
    },
  ];
}

function writeHtml(args: {
  sha: string;
  scenarios: Scenario[];
  tests: TestRun[];
  formatChecks: Record<string, unknown>[];
  assertions: Assertion[];
}): void {
  const rows = args.scenarios
    .map(
      (s) =>
        `<tr><td>${escapeHtml(s.key)}</td><td>${escapeHtml(
          s.decision.complexityTier,
        )}</td><td>${escapeHtml(s.decision.score)}</td><td>${escapeHtml(
          s.decision.reasons.join("; "),
        )}</td></tr>`,
    )
    .join("\n");
  const assertionRows = args.assertions
    .map(
      (a) =>
        `<tr class="${a.pass ? "pass" : "fail"}"><td>${
          a.pass ? "PASS" : "FAIL"
        }</td><td>${escapeHtml(a.name)}</td><td>${escapeHtml(
          a.detail,
        )}</td></tr>`,
    )
    .join("\n");
  const testRows = args.tests
    .map(
      (t) =>
        `<tr class="${t.status}"><td>${escapeHtml(
          t.status,
        )}</td><td><code>${escapeHtml(t.command)}</code></td><td>${escapeHtml(
          path.basename(t.outputFile),
        )}</td></tr>`,
    )
    .join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Moves Adaptive Depth Proof</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 40px; color: #1b1a17; background: #f8f7f4; }
    h1 { font-family: Georgia, serif; font-weight: 400; margin-bottom: 4px; }
    h2 { margin-top: 28px; border-bottom: 1px solid #d8d3c8; padding-bottom: 6px; }
    .meta { color: #706a60; font-size: 13px; }
    table { border-collapse: collapse; width: 100%; background: #fff; margin: 12px 0 24px; }
    th, td { border-bottom: 1px solid #eee8dd; padding: 9px 10px; text-align: left; vertical-align: top; }
    th { color: #5f625f; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    .pass td:first-child, .passed td:first-child { color: #0f6b3f; font-weight: 700; }
    .fail td:first-child, .failed td:first-child { color: #9b1c1c; font-weight: 700; }
    code { font-size: 12px; }
  </style>
</head>
<body>
  <h1>Moves Adaptive Depth Proof</h1>
  <div class="meta">Generated ${escapeHtml(generatedAt)} from ${escapeHtml(
    args.sha,
  )}. Report-only. No tenant data, registry, or runtime state was mutated.</div>
  <h2>Scenario Resolution</h2>
  <table><thead><tr><th>Scenario</th><th>Tier</th><th>Score</th><th>Reasons</th></tr></thead><tbody>${rows}</tbody></table>
  <h2>Assertions</h2>
  <table><thead><tr><th>Status</th><th>Assertion</th><th>Detail</th></tr></thead><tbody>${assertionRows}</tbody></table>
  <h2>Focused Validation</h2>
  <table><thead><tr><th>Status</th><th>Command</th><th>Output</th></tr></thead><tbody>${testRows}</tbody></table>
  <h2>Boundary</h2>
  <p>This proof validates deterministic applicability, route enqueue behavior, worker reconstruction, and native binary rendering support. It does not create a live Move or call Claude because this shell has no runtime Clerk, database, or Anthropic credentials.</p>
</body>
</html>
`;
  fs.writeFileSync(path.join(outDir, "qa-summary.html"), html);
}

function main(): void {
  fs.mkdirSync(outDir, { recursive: true });
  const sha = readSha();
  const assertionRows = scenarios.flatMap((s) =>
    s.assertions.map((a) => ({ scenario: s.key, ...a })),
  );
  const allAssertions = scenarios.flatMap((s) => s.assertions);
  const formatChecks = formatEvidence();
  for (const check of formatChecks) {
    allAssertions.push(
      assert(
        String(check.rule),
        check.passed === true,
        `${check.expected}: ${check.evidence}`,
      ),
    );
  }

  writeCsv(
    path.join(outDir, "artifact-applicability.csv"),
    ["scenario", "artifact", "applicability", "merge_into", "reason"],
    scenarios.flatMap((s) =>
      Object.entries(s.decision.artifactApplicability).map(([artifact, d]) => ({
        scenario: s.key,
        artifact,
        applicability: d.applicability,
        merge_into: d.mergeInto ?? "",
        reason: d.reason,
      })),
    ),
  );
  writeCsv(
    path.join(outDir, "story-beat-applicability.csv"),
    ["scenario", "story_beat", "applicability", "evidence_state", "reason"],
    scenarios.flatMap((s) =>
      Object.entries(s.decision.storyBeatApplicability).map(
        ([storyBeat, d]) => ({
          scenario: s.key,
          story_beat: storyBeat,
          applicability: d.applicability,
          evidence_state: d.evidenceState ?? "",
          reason: d.reason,
        }),
      ),
    ),
  );
  writeCsv(
    path.join(outDir, "assertions.csv"),
    ["scenario", "name", "pass", "detail"],
    assertionRows,
  );
  writeCsv(
    path.join(outDir, "final-format-checks.csv"),
    ["rule", "expected", "passed", "evidence"],
    formatChecks,
  );

  const tests: TestRun[] = [
    runTest(
      "npx jest src/lib/deliverables/__tests__/adaptive-depth.test.ts src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts src/scripts/__tests__/process-deliverable-queue.test.ts --runInBand",
      path.join(outDir, "jest-adaptive-route-worker.txt"),
    ),
    runTest(
      "npx jest --runTestsByPath 'src/app/api/v1/artifacts/[artifactId]/__tests__/route.test.ts' --runInBand",
      path.join(outDir, "jest-artifact-download-route.txt"),
    ),
    runTest(
      "npx jest src/lib/deliverables/orchestrator/__tests__/renderers.test.ts --runInBand",
      path.join(outDir, "jest-native-renderers.txt"),
    ),
  ];
  for (const t of tests) {
    allAssertions.push(
      assert(
        `validation command: ${t.command}`,
        t.status === "passed",
        t.status,
      ),
    );
  }

  const summary = {
    generatedAt,
    sha,
    repoRoot,
    outDir,
    mutationBoundary:
      "Report-only. No tenant data, registry, data-plane, or runtime state was mutated.",
    scenarios,
    formatChecks,
    tests,
    overallPass: allAssertions.every((a) => a.pass),
  };
  fs.writeFileSync(
    path.join(outDir, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(outDir, "validation-commands.txt"),
    `${tests.map((t) => `${t.status}\t${t.command}`).join("\n")}\n`,
  );
  writeHtml({ sha, scenarios, tests, formatChecks, assertions: allAssertions });

  if (!summary.overallPass) {
    console.error(`Moves adaptive-depth proof failed. See ${outDir}`);
    process.exit(1);
  }
  console.log(`Moves adaptive-depth proof passed: ${outDir}`);
}

main();
