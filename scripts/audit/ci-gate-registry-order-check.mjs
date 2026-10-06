#!/usr/bin/env node
/**
 * Keep `docs/architecture/ci-gate-registry.json` sorted by key.
 *
 * Nearly every change that adds a check appends to this file, so it is a
 * rebase hotspot. Its `entries` object was *nearly* sorted — 217 keys with
 * exactly one, `audit:render-snapshot`, out of place — and that single
 * misplacement is enough to make any tool that re-serialises with a sort
 * produce a diff that moves unrelated entries. That happened, was mistaken
 * for a real change, and was reverted by hand.
 *
 * The alternative was to declare the order to be insertion order and tell
 * people not to re-sort. That relies on every future author reading a note,
 * and nothing would catch the one who does not. Sorted order can be checked,
 * so it is the rule.
 *
 * Sorting also makes concurrent appends behave: two agents adding different
 * keys land in different places in the file, instead of both appending to the
 * same last line and conflicting every time.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "../..");
const REGISTRY = "docs/architecture/ci-gate-registry.json";

const raw = readFileSync(path.join(REPO, REGISTRY), "utf8");
const parsed = JSON.parse(raw);
const keys = Object.keys(parsed.entries ?? {});

if (keys.length === 0) {
  console.error(`${REGISTRY} has no entries — refusing to call an empty file sorted.`);
  process.exit(1);
}

// Report the keys that break ascending order, not the count of positions that
// differ from a full sort. One misplaced key shifts every position after it,
// so "30 positions differ" reads as thirty problems when it is one.
const offenders = keys.filter((key, i) => i > 0 && key < keys[i - 1]);

if (offenders.length > 0) {
  console.error(
    `${REGISTRY} is not sorted by key. ${offenders.length} key(s) appear after a key that sorts later:\n`,
  );
  for (const key of offenders) {
    const i = keys.indexOf(key);
    console.error(`  - "${key}" comes after "${keys[i - 1]}"`);
  }
  console.error(
    "\nSort the entries object by key. Sorted order is the rule because this file is\n" +
      "appended to by nearly every change that adds a check; an unsorted file makes any\n" +
      "tool that re-serialises it move unrelated entries.",
  );
  process.exit(1);
}

console.log(`${REGISTRY} is sorted by key (${keys.length} entries).`);
