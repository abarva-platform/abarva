# 2026-09-21-pin-the-v6-demo-pack-roots — configuration that points at nothing

## Release ID

`2026-09-21-pin-the-v6-demo-pack-roots`

## Status

`candidate`

## Plain-English Summary

`TENANT_DATASET_BY_KEY` maps a demo tenant to a directory under `datasets/`.
Every entry is a claim that the directory exists. **Both entries point at
directories that are not in the repository.**

When a root is missing the V6 builders return `null`, callers degrade silently,
and nothing reports it. The Moves synthesis route answers "No V6 Moves program
is loaded for the active tenant", which reads as correct behaviour rather than
as absent configuration — and its `v6Instance` branch is unreachable as a
result.

| | before | after |
|---|---|---|
| Anything reporting a dataset root that does not exist | **nothing** | this suite |
| `TENANT_DATASET_BY_KEY` | private | exported, so a guard can read it |
| Behaviour change | — | **none** |

## Written as an invariant, not as a snapshot of the outage

The suite asserts that a tenant resolves a pack **exactly when** its dataset
directory is present. It passes whether a pack is there or absent, and fails
only when the two disagree:

- directory present, builders return `null` → fails. That is the worse state:
  the table looks satisfied while the pack is unreadable.
- directory absent, builders return `null` → passes, and the missing entries
  are named in the CI output.

So restoring a dataset keeps it green, and deleting a stale entry keeps it
green. It never needs editing, and it does not encode today's outage as the
expected state.

**It deliberately does not assert that zero entries are missing.** Whether the
packs should be restored under the canonical tenant input standard or the
entries removed is a product decision, and a gate that failed on arrival would
red every pull request to force it.

## How the condition was found, and what it cost

Both roots were removed by `4a7ebcd85` ("Establish canonical tenant input
standard"). Nothing noticed. It surfaced only while investigating two route
suites that were red for an unrelated reason, and the 404 those suites now
receive is honest — which is exactly why it was invisible.

## The positive arm was checked, because it is unreachable today

With both datasets absent, the `present` branch of the invariant never
executes, so it could have been broken without anything showing. Measured by
adding an entry pointing at a directory that exists but holds no V6 CSVs: the
case fails, as it should.

## Layer Impact

- `global-control-lane`. One export added to a library module, one new suite,
  one workflow step, and the regenerated census. **No behaviour change**: the
  export adds no logic and no caller reads it outside the new test.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/lib/module-v6/demo-tenant-packs.ts` — `TENANT_DATASET_BY_KEY` exported.
- `src/lib/module-v6/__tests__/demo-tenant-pack-roots.test.ts` — new, 4 cases.
- `.github/workflows/unit-suites.yml` — one step; the directory was dark.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

| What | Result |
|---|---|
| New suite | **4 passed** |
| Module and the synthesis route suite | 2 suites, **8 passed** |
| Mutation: entry pointing at a present-but-empty directory | **1 case fails** |
| Vacuity floor (empty table would pass everything) | asserted |
| Census `--check` | exit **0** |
| `tsc` (exit code) | 0 |
| `eslint` | clean |
| `release-check` | passed |

The suite was written into a directory no workflow ran, found with
`--explain` before it could become another unrun file, and wired by exact path.

## Rollout Plan

Merge to `main`. Green on arrival. No image build, migration, flag, or runtime
change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. Configuration pointing at nothing goes back to being reported by
nothing.

## Audit Evidence

- The two declared dataset roots against the contents of `datasets/`.
- `4a7ebcd85` as the commit that removed them.
- The mutation result for the otherwise-unreachable positive arm.

## Known Gaps

- **The decision is not taken.** Restoring the packs or removing the entries is
  still open, and this change deliberately does not force it.
- **The dead `v6Instance` branch is not removed.** It remains unreachable while
  both roots are absent.
- **This checks that a directory exists, not that its contents are right.** A
  root present but holding the wrong CSVs passes the `present` arm as long as
  the builders return something.
