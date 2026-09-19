#!/usr/bin/env node
/**
 * The release-record tenant-narrative guard derives its term list from the
 * tenant registry: the full key, the key with separators as spaces, and every
 * key part that is not on a hand-maintained exemption list. A term on that list
 * is refused anywhere in release-record prose.
 *
 * The exemption list is the weak point. Add a tenant whose key contains an
 * ordinary English word nobody thought to exempt, and that word silently
 * becomes a refused term -- the guard starts rejecting ordinary sentences for a
 * reason no one chose. That already happened once, with `first`, derived from a
 * key whose two other parts were both already exempt.
 *
 * A dictionary check is the tempting fix and the wrong one: it would need to
 * decide what counts as an English word, and it would either miss coined names
 * or flag real identity tokens. This check makes no claim about English at all.
 * It only detects drift. The single-word terms the registry derives today are
 * committed in docs/architecture/tenant-narrative-single-word-terms.json; when
 * the registry changes and derives a different set, this fails and names the
 * difference, so exactly one human read happens per new tenant.
 *
 * The cost is that read, and it is the cost the backlog item asked to be
 * stated rather than absorbed.
 *
 * There is deliberately no --write mode. A script that rewrites the committed
 * set would let anyone silence this by running it, which is the same move the
 * CI gate registry now refuses for baseline writers. The file is small; when
 * the answer is that a new word really is an identity token, edit it by hand.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { loadTenantNarrativeTerms } from "./release-record-tenant-narrative-guard.mjs";

const COMMITTED_PATH = "docs/architecture/tenant-narrative-single-word-terms.json";

/** A term with no separator: one word, the kind that can collide with prose. */
export function singleWordTerms(terms) {
  return terms.filter((term) => !/[-_\s]/.test(term)).sort();
}

export function diffTerms(derived, committed) {
  const derivedSet = new Set(derived);
  const committedSet = new Set(committed);
  return {
    added: derived.filter((t) => !committedSet.has(t)),
    removed: committed.filter((t) => !derivedSet.has(t)),
  };
}

export function formatProblems({ added, removed }) {
  const problems = [];
  for (const term of added) {
    problems.push(
      `"${term}" is newly derived from the tenant registry and is now refused everywhere in ` +
        `release-record prose. Decide which it is. If blocking it would refuse ordinary prose ` +
        `while protecting nothing -- because the tenant's full key and full display name stay ` +
        `blocked either way -- add it to GENERIC_TENANT_WORDS in ` +
        `scripts/release-control/release-record-tenant-narrative-guard.mjs. If it is a real ` +
        `identity token, add it to ${COMMITTED_PATH} with a one-line reason.`,
    );
  }
  for (const term of removed) {
    problems.push(
      `"${term}" is listed in ${COMMITTED_PATH} but the registry no longer derives it. Remove ` +
        `the entry, so the file keeps describing what the guard actually blocks.`,
    );
  }
  return problems;
}

function main() {
  const repoRoot = process.cwd();
  const derived = singleWordTerms(loadTenantNarrativeTerms());

  const committedFile = JSON.parse(
    readFileSync(path.resolve(repoRoot, COMMITTED_PATH), "utf8"),
  );
  const committed = Object.keys(committedFile.terms ?? {}).sort();

  const diff = diffTerms(derived, committed);
  const problems = formatProblems(diff);

  if (problems.length > 0) {
    console.error("Tenant-narrative single-word terms drifted from the registry.\n");
    for (const problem of problems) console.error(`  - ${problem}\n`);
    console.error(
      `Derived today (${derived.length}): ${derived.join(", ")}\n` +
        `Committed (${committed.length}): ${committed.join(", ")}`,
    );
    process.exit(1);
  }

  console.log(
    `Tenant-narrative single-word terms match the registry (${derived.length}): ${derived.join(", ")}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
