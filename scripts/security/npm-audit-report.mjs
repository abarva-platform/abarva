#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const SEVERITIES = ["low", "moderate", "high", "critical"];

function parseArgs(argv) {
  const options = {
    failOn: "none",
    outputDir: "audit-artifacts/dependency-vulnerability",
  };

  for (const arg of argv) {
    if (arg.startsWith("--fail-on=")) {
      options.failOn = arg.slice("--fail-on=".length);
    } else if (arg.startsWith("--output-dir=")) {
      options.outputDir = arg.slice("--output-dir=".length);
    }
  }

  if (options.failOn !== "none" && !SEVERITIES.includes(options.failOn)) {
    throw new Error(
      `Invalid --fail-on value "${options.failOn}". Use none, low, moderate, high, or critical.`,
    );
  }

  return options;
}

function deriveCounts(audit) {
  const metadataCounts = audit?.metadata?.vulnerabilities;
  if (metadataCounts) {
    return Object.fromEntries(
      SEVERITIES.map((severity) => [severity, Number(metadataCounts[severity] ?? 0)]),
    );
  }

  const counts = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0]));
  for (const vulnerability of Object.values(audit?.vulnerabilities ?? {})) {
    if (counts[vulnerability?.severity] !== undefined) {
      counts[vulnerability.severity] += 1;
    }
  }

  return counts;
}

function shouldFail(counts, failOn) {
  if (failOn === "none") {
    return false;
  }

  const thresholdIndex = SEVERITIES.indexOf(failOn);
  return SEVERITIES.slice(thresholdIndex).some((severity) => counts[severity] > 0);
}

function markdownSummary(summary) {
  return `# npm Audit Dependency Vulnerability Report

Generated: ${summary.generatedAt}

Mode: ${summary.failOn === "none" ? "reporting only" : `fail on ${summary.failOn} or above`}

| Severity | Count |
| --- | ---: |
| Critical | ${summary.vulnerabilities.critical} |
| High | ${summary.vulnerabilities.high} |
| Moderate | ${summary.vulnerabilities.moderate} |
| Low | ${summary.vulnerabilities.low} |

Dependency totals reported by npm:

| Type | Count |
| --- | ---: |
| Production | ${summary.dependencies.prod} |
| Development | ${summary.dependencies.dev} |
| Optional | ${summary.dependencies.optional} |
| Peer | ${summary.dependencies.peer} |
| Total | ${summary.dependencies.total} |

Audit exit code: ${summary.auditExitCode}

Required-gate status: ${summary.requiredGateStatus}
`;
}

const options = parseArgs(process.argv.slice(2));
const result = spawnSync("npm", ["audit", "--json", "--package-lock-only"], {
  encoding: "utf8",
  maxBuffer: 1024 * 1024 * 16,
});

const rawAudit = result.stdout || result.stderr;
if (!rawAudit) {
  console.error("npm audit did not return JSON output.");
  process.exit(result.status || 1);
}

let audit;
try {
  audit = JSON.parse(rawAudit);
} catch (error) {
  console.error("Unable to parse npm audit JSON output.");
  console.error(error);
  process.exit(1);
}

const counts = deriveCounts(audit);
const dependencies = audit?.metadata?.dependencies ?? {};
const failedRequiredGate = shouldFail(counts, options.failOn);
const summary = {
  generatedAt: new Date().toISOString(),
  auditExitCode: result.status ?? 0,
  failOn: options.failOn,
  requiredGateStatus: failedRequiredGate ? "failed" : "passed",
  vulnerabilities: counts,
  dependencies: {
    prod: Number(dependencies.prod ?? 0),
    dev: Number(dependencies.dev ?? 0),
    optional: Number(dependencies.optional ?? 0),
    peer: Number(dependencies.peer ?? 0),
    total: Number(dependencies.total ?? 0),
  },
};

mkdirSync(options.outputDir, { recursive: true });
writeFileSync(join(options.outputDir, "npm-audit.raw.json"), `${JSON.stringify(audit, null, 2)}\n`);
writeFileSync(join(options.outputDir, "npm-audit-summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(join(options.outputDir, "npm-audit-summary.md"), markdownSummary(summary));

console.log(markdownSummary(summary));

if (failedRequiredGate) {
  process.exit(1);
}
