#!/usr/bin/env node
/**
 * Print the `--testPathIgnorePatterns` arguments for the Admin integration
 * directory, derived from admin-integration-quarantine.json.
 *
 * The workflow runs jest directly and names the directory literally:
 *
 *   npx jest ... src/__tests__/integration/admin ... $(node scripts/quality/admin-integration-ignore-args.mjs)
 *
 * That shape is deliberate, and it is the same one source-integration.yml and
 * the Intelligence step already use. The "Changed integration suites have a CI
 * owner" gate counts a suite as registered only when a workflow command
 * mentions a test runner AND names the suite or a containing directory. Moving
 * the run behind a wrapper script satisfies neither, so wrapping it would leave
 * every new Admin integration suite failing that gate while the workflow
 * appeared to work. Only the flags come from here; the runner and the path stay
 * in the command where the gate can see them.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const { quarantined } = JSON.parse(
  readFileSync(path.join(HERE, "admin-integration-quarantine.json"), "utf8"),
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// `quarantined` holds objects whose `suite` is a bare filename inside the suite
// directory. There is no `alsoIgnored` list here: the one loose root file the
// directory pattern sweeps in from outside — admin-context-uploads-tabs.test.tsx
// — is green and is already registered by exact path in this workflow's own
// green command, which is the second of the two states the enumeration case in
// integration-directory-ci-coverage.test.ts allows. It therefore needs no
// exclusion, and adding one would hide a file that is genuinely covered.
const patterns = quarantined.map(
  ({ suite }) => `integration/admin/${escapeRegExp(suite)}$`,
);

process.stdout.write(["--testPathIgnorePatterns", ...patterns].join(" "));
