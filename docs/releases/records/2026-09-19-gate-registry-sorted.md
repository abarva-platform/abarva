# 2026-09-19-gate-registry-sorted — one key out of place, and every tool that touched the file paid for it

## Release ID

`2026-09-19-gate-registry-sorted`

## Status

`candidate`

## Plain-English Summary

`docs/architecture/ci-gate-registry.json` is appended to by nearly every change
that adds a check, which makes it a rebase hotspot. Its `entries` object was
*nearly* sorted and not quite: **217 keys, exactly one of which —
`audit:render-snapshot` — sat after a key that sorts later.**

That single misplacement is enough to matter. Any tool that re-serialises the
file with a sort moves that key and everything after it, producing a diff that
touches unrelated entries. It happened earlier today, read as a real change,
and was reverted by hand.

The item offered two resolutions: commit to sorted order and normalise once, or
declare the order to be insertion order and tell people not to re-sort.

**Sorted, because it can be checked.** An insertion-order convention relies on
every future author reading a note in the file, and nothing catches the one who
does not. Sorted order is a property a script can assert, so it is the rule.

Sorting also helps the thing that made this an item in the first place — three
live claims named this file on one day. Two agents adding different keys now
land in different places in the file, instead of both appending to the same
last line and conflicting every time.

### What changed

- The `entries` object is sorted. **The diff is nine lines** — the one key
  moving, plus the note — not the churn the phrase "normalise the file"
  suggests.
- The file's own `note` states that entries are sorted and that a check
  enforces it.
- `audit:ci-gate-registry-order` asserts it, wired beside the registry check it
  protects.

The order check is deliberately **separate** from `audit:ci-gate-registry`
rather than folded into it. An unsorted file is a diff-hygiene problem; an
unclassified entry is a governance problem. One failure message answering both
questions makes each harder to act on.

### One detail in the failure message

It reports **keys that break ascending order**, not positions that differ from
a full sort. Those are very different numbers: one misplaced key shifts every
position after it, so this file read as "30 positions differ" when it had one
problem. Reporting the count of displaced positions would have described a
one-key fix as thirty.

## Layer Impact

Release lane: `global-control-lane`.

- **Repository CI control plane** — one new PR gate, one normalised data file,
  one new npm script, one workflow step.
- **No product code, no schema, no migration, no runtime change.** No entry's
  `kind` or `reason` was altered; only their order in the file.

## Client Applicability

No client receives this change.

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

| file | change |
|---|---|
| `docs/architecture/ci-gate-registry.json` | entries sorted by key; `note` states the rule; classifies the new gate |
| `scripts/audit/ci-gate-registry-order-check.mjs` | new — asserts sorted order |
| `package.json` | adds `audit:ci-gate-registry-order` |
| `.github/workflows/architecture-boundary.yml` | runs it beside the registry check |

## QA / Validation

**Status: pass.**

| check | result |
|---|---|
| `node scripts/audit/ci-gate-registry-order-check.mjs` | **pass** — sorted, 218 entries |
| `npm run audit:ci-gate-registry` | **pass** — exit 0, the new gate self-classified |
| `ci-gate-registry-invoked-predicate.test.ts` | **pass** — 16/16 |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on the new script | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | recorded on the PR |

### Mutation results

| mutation | expected | observed |
|---|---|---|
| one key moved out of order — the real defect | caught | exit 1, names the key and the key it follows |
| the check computes no offenders | **passes** | exit 0 — the control |
| the `entries` object emptied | caught | exit 1, refuses to call an empty file sorted |
| the workflow stops running it | caught | `audit:ci-gate-registry` fails: *classified pr-gate but no workflow invokes it* |

The second is the control: with offenders never computed, an out-of-order file
passes, which is what establishes the check is doing the catching. The fourth
is a cross-check — the registry gate added earlier today refuses a `pr-gate`
that no workflow runs, so this gate cannot be quietly unwired while keeping its
classification.

## Rollout Plan

Squash merge to `main`. The gate runs on the next PR. No image build, no
deploy, no migration.

## Deployment Authority

Not applicable — no Azure Container Apps, image, flag, worker, traffic or DNS
is affected.

- Repo-owned deploy workflow: not involved
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: no

## Rollback Plan

Revert the commit. The file keeps whatever order it has; only the gate and the
note go. No entry's classification is affected either way.

## Audit Evidence

- The check: `scripts/audit/ci-gate-registry-order-check.mjs`
- Its own classification and the stated rule: `docs/architecture/ci-gate-registry.json`
- Wiring: `.github/workflows/architecture-boundary.yml`
- PR URL and CI run: recorded on the PR

## Known Gaps

- **Sorting reduces conflicts; it does not remove them.** Two agents adding the
  same key, or adding adjacent keys, still conflict. The improvement is that
  unrelated appends no longer collide on a shared last line.
- **The check asserts order, not content.** A duplicated key, a malformed
  `reason`, or a wrong `kind` is the sibling gate's job, and this one is silent
  about all three by design.
- **Byte-level formatting is unenforced.** Indentation and trailing-newline
  conventions are not checked here, so a tool re-serialising with different
  formatting still produces a wide diff even with the order correct.
