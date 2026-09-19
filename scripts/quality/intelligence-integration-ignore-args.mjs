#!/usr/bin/env node
/**
 * Print the `--testPathIgnorePatterns` arguments for the Intelligence
 * integration directory, derived from intelligence-integration-quarantine.json.
 *
 * The workflow runs jest directly and names the directory literally:
 *
 *   npx jest ... src/__tests__/integration/intelligence ... $(node scripts/quality/intelligence-integration-ignore-args.mjs)
 *
 * That shape is deliberate, and it is the same one source-integration.yml uses.
 * The "Changed integration suites have a CI owner" gate counts a suite as
 * registered only when a workflow command mentions a test runner AND names the
 * suite or a containing directory. Moving the run behind a wrapper script
 * satisfies neither, so wrapping it would leave every new Intelligence
 * integration suite failing that gate while the workflow appeared to work.
 * Only the flags come from here; the runner and the path stay in the command
 * where the gate can see them.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { quarantined, alsoIgnored = [] } = JSON.parse(
  readFileSync(path.join(HERE, "intelligence-integration-quarantine.json"), "utf8"),
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// `quarantined` holds objects whose `suite` is a bare filename inside the suite
// directory. `alsoIgnored` holds full path fragments for red files the
// command's pattern sweeps in from outside it — jest treats the directory
// argument as a regex, so a sibling at the integration root whose name starts
// with "intelligence" matches too, and a trailing slash cannot be used to stop
// that because it would make the CI-visibility gate stop recognising the path.
const patterns = [
  ...quarantined.map(({ suite }) => `integration/intelligence/${escapeRegExp(suite)}$`),
  ...alsoIgnored.map((fragment) => `${escapeRegExp(fragment)}$`),
];

process.stdout.write(["--testPathIgnorePatterns", ...patterns].join(" "));
