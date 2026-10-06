#!/usr/bin/env node
/**
 * Print the `--testPathIgnorePatterns` arguments for the QA integration
 * directory, derived from qa-integration-quarantine.json.
 *
 * The workflow runs jest directly and names the directory literally:
 *
 *   npx jest src/__tests__/integration/qa --no-coverage --ci $(node scripts/quality/qa-integration-ignore-args.mjs)
 *
 * That shape is deliberate, and it matches the Admin, Source and Intelligence
 * steps. The "Changed integration suites have a CI owner" gate counts a suite
 * as registered only when a workflow command mentions a test runner AND names
 * the suite or a containing directory. Moving the run behind a wrapper script
 * satisfies neither, so wrapping it would leave every new QA integration suite
 * failing that gate while the workflow appeared to work. Only the flags come
 * from here; the runner and the path stay in the command where the gate can
 * see them.
 *
 * There is no `alsoIgnored` list: `src/__tests__/integration/qa` as a jest
 * path pattern has no sibling directory it can also select — unlike
 * `integration/agent`, which selects `integration/agents/` too. Checked, not
 * assumed.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { quarantined } = JSON.parse(
  readFileSync(path.join(HERE, "qa-integration-quarantine.json"), "utf8"),
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const patterns = quarantined.map(
  ({ suite }) => `integration/qa/${escapeRegExp(suite)}$`,
);

process.stdout.write(["--testPathIgnorePatterns", ...patterns].join(" "));
