#!/usr/bin/env node
/**
 * A QA inventory must not name a component no route can reach.
 *
 * `src/lib/qa/*.ts` holds the route-ownership maps, smoke inventories and demo
 * checklists a person uses to decide what to open and verify. When one of them
 * names a component that no route mounts, the check it prescribes cannot be
 * performed — and the reader has no way to tell, because the file reads like
 * an authority.
 *
 * That is not hypothetical. `founder-demo-route-checklist.ts` names
 * `tower/ProgramPressureCards.tsx` as the component the Tower route renders,
 * with `validationStatus: "ready"` and `readinessCaveat: "None"`. The Tower
 * route renders `TowerCommandCenterAvaShell`; nothing imports the pressure
 * cards. A demo walk driven off that checklist verifies a surface that is not
 * on the page.
 *
 * Twenty-four such claims exist today across seven files. They are listed in
 * the exception file by name, with the claiming file, so each is visible and
 * has to be resolved deliberately. The gate fails on a NEW one.
 *
 * Usage:
 *   node scripts/audit/qa-inventory-claims-check.mjs
 *   node scripts/audit/qa-inventory-claims-check.mjs --update   # rewrite the exceptions
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const QA_DIR = path.join(REPO_ROOT, 'src', 'lib', 'qa');
const ORPHANS = path.join(REPO_ROOT, 'docs', 'architecture', 'unreachable-components.json');
const EXCEPTIONS = path.join(REPO_ROOT, 'docs', 'architecture', 'qa-inventory-stale-claims.json');

const COMPONENT_PATH = /(src\/components\/[^\s"`,)]+\.tsx?)/g;

function fail(message, details = []) {
  console.error(message);
  for (const d of details) console.error(`- ${d}`);
  process.exit(1);
}

function currentClaims() {
  if (!fs.existsSync(ORPHANS)) fail(`Orphan baseline missing: ${path.relative(REPO_ROOT, ORPHANS)}`);
  const orphans = new Set(JSON.parse(fs.readFileSync(ORPHANS, 'utf8')).orphans ?? []);
  if (!fs.existsSync(QA_DIR)) return [];

  const claims = [];
  for (const file of fs.readdirSync(QA_DIR).filter((f) => f.endsWith('.ts'))) {
    const text = fs.readFileSync(path.join(QA_DIR, file), 'utf8');
    const named = [...new Set([...text.matchAll(COMPONENT_PATH)].map((m) => m[1]))];
    for (const component of named) {
      if (orphans.has(component)) claims.push({ file: `src/lib/qa/${file}`, component });
    }
  }
  claims.sort((a, b) => a.file.localeCompare(b.file) || a.component.localeCompare(b.component));
  return claims;
}

const key = (c) => `${c.file}::${c.component}`;

function main() {
  const claims = currentClaims();

  if (process.argv.includes('--update')) {
    fs.writeFileSync(
      EXCEPTIONS,
      `${JSON.stringify(
        {
          note: 'QA inventories that name a component no route can reach. Each entry is a check a person cannot perform, in a file that reads like an authority. This is a burn-down list, not a permission slip: resolve an entry by correcting the inventory to the component the route actually renders, or by mounting or retiring the component. The gate fails on a NEW claim; it does not fail on these.',
          generatedBy: 'scripts/audit/qa-inventory-claims-check.mjs --update',
          claims,
        },
        null,
        2,
      )}\n`,
    );
    console.log(`Exceptions written: ${claims.length} stale claim(s).`);
    return;
  }

  let known = { claims: [] };
  if (fs.existsSync(EXCEPTIONS)) known = JSON.parse(fs.readFileSync(EXCEPTIONS, 'utf8'));
  const knownKeys = new Set((known.claims ?? []).map(key));
  const currentKeys = new Set(claims.map(key));

  const added = claims.filter((c) => !knownKeys.has(key(c)));
  const resolved = (known.claims ?? []).filter((c) => !currentKeys.has(key(c)));

  console.log(
    `QA inventory claims: ${claims.length} name an unreachable component (${knownKeys.size} known).`,
  );

  const problems = [];
  for (const c of added) {
    problems.push(
      `${c.file} names ${c.component}, which no route can reach — the check it prescribes cannot be performed`,
    );
  }
  for (const c of resolved) {
    problems.push(
      `${c.file} no longer names ${c.component}; refresh with --update so the list stays honest`,
    );
  }

  if (problems.length > 0) {
    fail('QA inventory claim check failed.', problems);
  }
  console.log(
    resolved.length === 0 && added.length === 0
      ? 'No new stale claims. The known list is a burn-down, not a baseline to grow.'
      : '',
  );
}

main();
