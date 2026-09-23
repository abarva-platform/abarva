#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { isDirectInvocation } from "../exec/cli-entry.mjs";

const INTEGRATION_ROOT = "src/__tests__/integration";

function normalize(value) {
  return value.replaceAll("\\", "/").replace(/\s+/g, " ").trim();
}

/**
 * Whitespace only, for a caller that needs the command's escapes intact.
 *
 * `normalize` rewrites `\` to `/` so a Windows-style path in a command matches
 * a repo-relative one. That is right for a path and wrong for a regular
 * expression: a `--testPathIgnorePatterns foo\.test\.ts$` argument comes back
 * as `foo/.test/.ts$`, which matches nothing. Callers that read such an
 * argument pass `{ preserveEscapes: true }`; every existing caller is unchanged
 * and still gets the path-normalised form.
 */
function collapseWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function parseChangedIntegrationTests(nameStatus) {
  const changed = [];
  for (const line of nameStatus.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const columns = line.split("\t");
    const status = columns[0] ?? "";
    if (status.startsWith("D")) continue;
    const candidate = normalize(columns.at(-1) ?? "");
    if (
      candidate.startsWith(`${INTEGRATION_ROOT}/`) &&
      /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(candidate)
    ) {
      changed.push(candidate);
    }
  }
  return [...new Set(changed)].sort();
}

export function extractWorkflowRunCommands(source, { preserveEscapes = false } = {}) {
  const lines = source.split(/\r?\n/);
  const commands = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = line.match(/^(\s*)(?:-\s+)?run:\s*(.*)$/);
    if (!match) continue;
    const indent = match[1].length;
    const inline = match[2].trim();

    if (inline && !/^[>|][-+]?\s*$/.test(inline)) {
      commands.push(inline);
      continue;
    }

    const block = [];
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const next = lines[cursor];
      if (!next.trim()) {
        block.push("");
        continue;
      }
      const nextIndent = next.match(/^\s*/)?.[0].length ?? 0;
      if (nextIndent <= indent) break;
      if (!next.trimStart().startsWith("#")) block.push(next.trim());
      index = cursor;
    }
    commands.push(block.join(" "));
  }

  const shape = preserveEscapes ? collapseWhitespace : normalize;
  return commands.map(shape).filter(Boolean);
}

function npmScriptsInvoked(command) {
  const names = [];
  for (const match of command.matchAll(/\bnpm\s+run\s+([\w:-]+)/g)) {
    names.push(match[1]);
  }
  if (/\bnpm\s+test\b/.test(command)) names.push("test");
  return names;
}

export function expandWorkflowCommands(
  workflowCommands,
  packageScripts,
  { preserveEscapes = false } = {},
) {
  const shape = preserveEscapes ? collapseWhitespace : normalize;
  const expanded = [...workflowCommands];
  const queue = workflowCommands.flatMap(npmScriptsInvoked);
  const visited = new Set();

  while (queue.length > 0) {
    const name = queue.shift();
    if (!name || visited.has(name)) continue;
    visited.add(name);
    const command = packageScripts[name];
    if (typeof command !== "string") continue;
    expanded.push(shape(command));
    queue.push(...npmScriptsInvoked(command));
  }

  return expanded;
}

function candidateRegistrationPaths(testPath) {
  const candidates = [testPath];
  let directory = path.posix.dirname(testPath);
  while (directory.startsWith(INTEGRATION_ROOT)) {
    candidates.push(directory);
    if (directory === INTEGRATION_ROOT) break;
    directory = path.posix.dirname(directory);
  }
  return candidates;
}

function commandNamesPath(command, candidate) {
  const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[\\s\"'\\x60=])${escaped}(?=$|[\\s\"'\\x60])`).test(
    command,
  );
}

export function isIntegrationTestRegistered(testPath, commands) {
  return commands.some((rawCommand) => {
    const command = normalize(rawCommand);
    if (!/\b(?:npx\s+)?(?:jest|vitest|playwright)\b/.test(command)) {
      return false;
    }
    return candidateRegistrationPaths(testPath).some((candidate) =>
      commandNamesPath(command, candidate),
    );
  });
}

function readWorkflowCommands(root) {
  const workflowDir = path.join(root, ".github", "workflows");
  return readdirSync(workflowDir)
    .filter((name) => /\.ya?ml$/.test(name))
    .flatMap((name) =>
      extractWorkflowRunCommands(
        readFileSync(path.join(workflowDir, name), "utf8"),
      ),
    );
}

function changedFiles(root, base) {
  return execFileSync(
    "git",
    ["diff", "--name-status", "-M", `${base}...HEAD`],
    {
      cwd: root,
      encoding: "utf8",
    },
  );
}

function readBaseArg(argv) {
  const index = argv.indexOf("--base");
  return index >= 0
    ? argv[index + 1]
    : process.env.INTEGRATION_CI_BASE || "origin/main";
}

export function evaluateVisibility({
  changed,
  workflowCommands,
  packageScripts,
}) {
  const tests = parseChangedIntegrationTests(changed);
  const commands = expandWorkflowCommands(workflowCommands, packageScripts);
  return {
    tests,
    missing: tests.filter(
      (testPath) => !isIntegrationTestRegistered(testPath, commands),
    ),
  };
}

function main() {
  const root = process.cwd();
  const base = readBaseArg(process.argv.slice(2));
  if (!base) throw new Error("--base requires a git revision");
  const packageJson = JSON.parse(
    readFileSync(path.join(root, "package.json"), "utf8"),
  );
  const result = evaluateVisibility({
    changed: changedFiles(root, base),
    workflowCommands: readWorkflowCommands(root),
    packageScripts: packageJson.scripts ?? {},
  });

  if (result.tests.length === 0) {
    console.log(
      "integration-test-ci-visibility: no changed integration suites",
    );
    return;
  }
  if (result.missing.length > 0) {
    console.error(
      "Integration suites changed without executable CI registration:",
    );
    for (const file of result.missing) console.error(`- ${file}`);
    console.error(
      "Add the exact suite or a containing integration directory to a test-runner command invoked by a GitHub workflow. Comments and local-only npm scripts do not count.",
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    `integration-test-ci-visibility: ${result.tests.length} changed suite(s) registered in CI`,
  );
}

if (isDirectInvocation(import.meta.url)) main();
