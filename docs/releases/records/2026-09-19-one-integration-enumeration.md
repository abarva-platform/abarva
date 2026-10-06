# 2026-09-19-one-integration-enumeration — the collision guard covered one workflow's directories, not both

## Release ID

`2026-09-19-one-integration-enumeration`

## Status

`candidate`

## Plain-English Summary

Two workflows wire integration directories into CI. One runs a set of
directories with no exclusions; the other runs a directory with a quarantine
and lives in its own file. The behaviour suite tracked them as two separate
enumerations.

The case that refuses a **directory-prefix collision** — a wired name that
prefixes another directory, so the wired command sweeps it in — iterated only
the first enumeration. A directory colliding with a quarantine-wired name was
not checked for that hazard at all.

### It was caught anyway, and that is the part worth fixing

Measured, by creating a colliding directory under each:

| collider | cases that failed | prefix case among them |
|---|---|---|
| collides with a plainly-wired name | 3 | **yes** |
| collides with a quarantine-wired name | 2 | **no** |

The second was caught by the *enumeration* case instead — the one that checks
a quarantine-wired directory's exclusions are all named. So nothing shipped
broken. But the failure a reader saw said **"the enumeration is out of date"**,
which sends them to update a list.

The actual hazard is different and worse: **a stray directory silently adopts
every suite written in it afterwards.** A colliding root *file* runs once and
gets enumerated; a colliding *directory* keeps collecting. If the message
names the wrong problem, the next person fixes the symptom and leaves the
hazard.

### What changed

- One enumeration, `ALL_WIRED_DIRECTORY_NAMES`, built from both lists. The
  prefix case iterates it.
- The failure now states the hazard alongside the collision, so it cannot be
  read as a stale list.

Verified after the change: a collider under either kind of wired name fires the
prefix case, and the same three cases fail in both.

## Layer Impact

Release lane: `global-control-lane`.

- **Repository CI** — one behaviour suite changed. No workflow file, no script,
  no product code.
- No schema, no migration, no runtime change.

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
| `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` | adds `ALL_WIRED_DIRECTORY_NAMES` from both enumerations; the prefix case iterates it and names the hazard in its failure |

## QA / Validation

**Status: pass.**

| check | result |
|---|---|
| `integration-directory-ci-coverage.test.ts` | **pass** — 13/13 |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on the changed file | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | recorded on the PR |

### Mutation results

Each applied by creating a real colliding directory, then removing it.

| mutation | expected | observed |
|---|---|---|
| collider under a quarantine-wired name — the gap being closed | prefix case fires | 3 of 13 red, prefix case among them |
| collider under a plainly-wired name — must not regress | prefix case fires | 3 of 13 red, prefix case among them |
| revert the prefix case to the single enumeration | prefix case **misses** it | did not fire — reproduces the gap exactly |
| the combined list left empty | prefix case **misses** it | did not fire — the control |

The third is the one that establishes the fix: with the old shape restored, a
collider under a quarantine-wired name goes unnoticed by the prefix case, which
is precisely the state before this change.

## Rollout Plan

Squash merge to `main`. The suite runs in the existing behaviours job. No image
build, no deploy, no migration.

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

Revert the commit. The prefix case returns to covering one enumeration; the
other hazard stays caught by the enumeration case, with the less useful message.

## Audit Evidence

- The combined enumeration and the prefix case:
  `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts`
- PR URL and CI run: recorded on the PR

## Known Gaps

- **Two lists still exist**, now consumed as one where it matters. Fully
  unifying them means reconciling a quarantine-carrying entry with a bare
  string, which changes every case that iterates either; that is a bigger
  refactor than this hazard needs.
- **The check is name-prefix only.** A directory that a wired jest pattern
  selects for some other reason — a regex metacharacter in a name, say — is not
  covered. No current name contains one.
- **The enumerations are still hand-maintained.** This makes a missing entry
  fail loudly; it does not derive the list from the workflows themselves.
