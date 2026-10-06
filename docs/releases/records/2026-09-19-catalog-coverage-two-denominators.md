# 2026-09-19-catalog-coverage-two-denominators — one figure was hiding which problem it described

## Release ID

`2026-09-19-catalog-coverage-two-denominators`

## Status

`candidate`

## Plain-English Summary

The AI surface control catalog reported:

```
Behavioral coverage: 29 of 37 controls run a test that exercises them in CI.
Not on any screen: 8 of 37 controls sit on surfaces no route reaches, and are
excluded from the coverage count above.
```

Read as written, that says 78% of controls are tested and 8 lack tests. **The
truth is the opposite in character.** `29 + 8 = 37`: every control a user can
actually reach is tested, and the entire gap is unreachability.

One figure was carrying two problems with different owners — *reachable but
untested*, and *nobody can open this* — and hiding which one it was about. A
reader quoting "29 of 37" as a test-coverage number would be wrong about what
the remaining eight need.

### The incentive that had to be stated next to the number

A control on an unmounted surface can never be counted as covered. So mounting
one moves it into the reachable population and **lowers covered-of-reachable**
until it has a test. Meanwhile covered-of-declared cannot fall at all — its
numerator only rises.

The same action therefore looks good or bad depending on which figure someone
quotes, and the action in question is the one the backlog most wants taken.
That belongs printed beside the number, not discovered later by whoever has to
explain the dip.

### What it prints now

```
Behavioral coverage of reachable controls: 29 of 29 (100%).
Reachable share of declared controls: 29 of 37 (78.4%).
Not on any screen: 8 of 37 controls sit on surfaces no route reaches. They can
never be counted as covered, so they are outside the first figure and inside
the second.
  Mounting one lowers the first figure until it has a test — 29 of 30 (96.7%)
  for the next one mounted. That is the arithmetic working, not a regression.
```

**This is a reporting change only.** No control's classification moved, no
exclusion rule changed, and the exit code is untouched. The item was explicit
that counting unreachable surfaces as covered would be the wrong fix — the
exclusion is right — and that is not done here.

### A correction to the item's own description

The item said the eight are "excluded from the denominator, so mounting an
orphaned surface makes the coverage percentage fall". Read against the code,
they were **in** the denominator of `29 of 37`, which is why that figure could
not fall. The falling figure is covered-of-**reachable**, which the catalog did
not print at all. The item's conclusion was right and its mechanism was not,
and printing both denominators is what makes the distinction visible rather
than requiring someone to re-derive it.

## Layer Impact

Release lane: `global-control-lane`.

- **Repository CI reporting** — `ai-surface-control-catalog.mjs` prints two
  figures where it printed one. Same checks, same failures, same exit code.
- **Repository CI** — one new behaviour suite in the existing behaviours job.
- No product code, no schema, no migration, no workflow change.

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
| `scripts/audit/ai-surface-control-catalog.mjs` | prints covered-of-reachable and reachable-of-declared separately, with the incentive note on the figure it applies to |
| `src/__tests__/behaviors/catalog-coverage-two-denominators.test.ts` | new — 5 cases |

## QA / Validation

**Status: pass.**

| check | result |
|---|---|
| `catalog-coverage-two-denominators.test.ts` | **pass** — 5/5 |
| `node scripts/audit/ai-surface-control-catalog.mjs` | **pass** — exit 0, both figures printed |
| `npx jest src/__tests__/behaviors` | **pass** — 42 suites / 418 tests |
| `npx tsc --noEmit` | **pass** — exit 0 |
| `npx eslint` on both changed files | **pass** — exit 0 |
| `node scripts/release-check.mjs --base origin/main --head HEAD` | recorded on the PR |

### Mutation results

| mutation | expected | observed |
|---|---|---|
| collapse back to one figure against declared | caught | 2 of 5 red |
| drop the reachable-share figure | caught | 3 of 5 red |
| drop the incentive note | caught | 1 of 5 red |
| count unreachable controls as covered — the fix the item refused | caught | 1 of 5 red |
| make the two figures describe different populations | caught | 2 of 5 red |

**The fourth initially passed, and the mutation is what exposed why.** The
negative control asserted only that coverage cannot exceed what is reachable —
trivially true, and it stayed green when the reachability branch was disabled
outright, because disabling it also zeroed the unreachable count and made the
two figures self-consistent at 37 of 37. It now reads ground truth from
`docs/security/ai-surface-control-catalog.json`: three surfaces declare
`routeReachable: false`, so a run that reports no exclusions is contradicting
the catalog rather than describing it. **A control that takes its ground truth
from the thing under test cannot fail.**

## Rollout Plan

Squash merge to `main`. The new output appears on the next catalog run. No
image build, no deploy, no migration.

## Deployment Authority

Not applicable — no Azure Container Apps, workflow, image, flag, worker,
traffic or DNS is affected.

- Repo-owned deploy workflow: not involved
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: no

## Rollback Plan

Revert the commit. The catalog returns to the single figure.

## Audit Evidence

- The reporting block at the end of `scripts/audit/ai-surface-control-catalog.mjs`
- The guard: `src/__tests__/behaviors/catalog-coverage-two-denominators.test.ts`
- Ground truth for the negative control: `routeReachable: false` entries in
  `docs/security/ai-surface-control-catalog.json`
- PR URL and CI run: recorded on the PR

## Known Gaps

- **The eight unreachable controls are unchanged.** This makes the gap legible;
  it does not close it. Mounting or removing those surfaces is separate work,
  and the new output tells whoever does it what to expect from the figure.
- **The projected figure assumes one mount at a time.** `29 of 30` is the next
  single mount; mounting several at once moves it further, and the line does
  not model that.
- **The percentages are rounded to one decimal.** Two runs either side of a
  single control can print the same percentage, so the counts are the number to
  read, not the percentage.
