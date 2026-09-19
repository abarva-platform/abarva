#!/usr/bin/env node
/**
 * Print the `--testPathIgnorePatterns` arguments for the Source integration
 * workflow, derived from source-integration-quarantine.json.
 *
 * The workflow runs jest directly and names the suite directory literally:
 *
 *   npx jest src/__tests__/integration/source ... $(node scripts/quality/source-integration-ignore-args.mjs)
 *
 * That shape is deliberate. The "Changed integration suites have a CI owner"
 * gate counts a suite as registered only when a workflow command mentions a
 * test runner AND names the suite or a containing directory. Moving the run
 * behind a wrapper script satisfies neither, so wrapping it would have left
 * every new Source integration suite failing that gate while the workflow
 * appeared to work. Only the flags come from here; the runner and the path
 * stay in the command where the gate can see them.
 *
 * Keeping the list in JSON rather than as a 24-line literal in the YAML means
 * it has one home, and the sibling checker can refuse it when it goes stale.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { quarantined, alsoIgnored = [] } = JSON.parse(
  readFileSync(path.join(HERE, "source-integration-quarantine.json"), "utf8"),
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// `quarantined` holds objects whose `suite` is a bare filename inside the
// suite directory. `alsoIgnored` holds entries whose `path` is the repo-relative
// path of a red file the command's pattern sweeps in from outside it — jest
// treats the directory argument as a pattern, so a sibling at the integration
// root whose name starts with "source" matches too, and a trailing slash cannot
// be used to stop that because it would make the CI-visibility gate stop
// recognising the path.
const patterns = [
  ...quarantined.map(({ suite }) => `integration/source/${escapeRegExp(suite)}$`),
  ...alsoIgnored.map(({ path: fragment }) => `${escapeRegExp(fragment)}$`),
];

// One flag with all patterns after it: jest accepts the rest as a list, and a
// single flag keeps the expanded command readable in the workflow log.
process.stdout.write(["--testPathIgnorePatterns", ...patterns].join(" "));
