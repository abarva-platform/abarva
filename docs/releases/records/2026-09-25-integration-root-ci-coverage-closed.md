# 2026-09-25-integration-root-ci-coverage-closed — the integration root carve-out reaches zero

## Release ID

`2026-09-25-integration-root-ci-coverage-closed`

## Status

`candidate`

## Plain-English Summary

Three test files sat in the repository's highest-risk test directory and no CI job ran
them. They were the last three in that directory's carve-out list. All three are repaired
and wired into a pull-request job, the carve-out list is now empty, and every test file in
that directory runs on every pull request.

None of the three was finding a product defect. Each had gone stale the same way: a
deliberate product change updated its sibling tests and not it, because nothing ran it to
notice. The oldest had been wrong for four months.

- One asserted that an advisory answer is rendered with labelled `Evidence:` and `Next:`
  lines. That was correct the day it was written and stopped being correct the next day,
  when the labelled template was deliberately removed from advisory surfaces as an
  over-formalising of natural prose.
- One asserted a grouped public-site navigation menu that was deliberately retired for a
  narrow launch, leaving a single call-to-action.
- One expected a legacy invite-code password field on first paint; that form has since
  gained its own mode toggle, so the field appears one click later.

Two of the repairs were **measured and then thrown away**, which is the part worth
recording. The obvious repair to the first suite is to invert it — assert the labelled
template must *not* appear. Two separate attempts to break that assertion showed it can
never fail: the route already refuses to display a labelled answer and returns an error
first, so the inverted assertion states something true and guards nothing. What replaced it
is the refusal itself, asserted directly, which had no coverage at this level at all.

## Layer Impact

Release lane: `global-control-lane` — shared CI and test-control behaviour for all clients,
with no feature gate. No client data, schema or tenant scope is touched.

- **Layer 4 (products)** — no product behaviour changes. No production source file is
  modified by this release.
- **Test and CI control plane** — three test files repaired, three exact paths added to an
  existing pull-request job, one carve-out list emptied with its ratchet lowered to zero,
  one stale entry cleared from a directory-coverage guard, and the committed coverage
  census refreshed.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — CI coverage and test-suite correctness only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/__tests__/integration/atlas-ask-route.test.ts` — stale rendering-template
  assertions replaced with the substance they stood for, plus a new case asserting the
  route refuses an answer carrying scaffolding labels.
- `src/__tests__/integration/marketing-nav-dropdowns.test.tsx` — rewritten from describing
  a retired grouped navigation to guarding the narrow-launch decision; 9 stale cases
  became 10 that fail if the grouped nav returns by default.
- `src/__tests__/integration/sign-in-shell.test.tsx` — the legacy-mode case now asserts
  both gates in order: no password field on first paint, then the fields after the toggle.
- `.github/workflows/integration-suites.yml` — the three exact paths added to the
  pull-request jest command, with a dated paragraph recording the triage and the two
  assertions that were measured and not kept.
- `scripts/quality/integration-root-quarantine.json` — the three entries removed; the list
  is empty and its note explains why the file is kept.
- `scripts/quality/check-integration-root-quarantine.mjs` — `CEILING` 3 → 0, lowered in
  the same change, with the reason that an empty list does not retire the control.
- `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` — the integration
  root's own entry cleared from the known-dark set, now that the root is fully covered.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.

## QA / Validation

**Baseline measured in a separate clean worktree of `origin/main` `9fdf99ccc`, not by
stashing, and not from the committed census — which was itself stale by `+3/+3` before this
change, from test files that landed on main with nobody refreshing it. Quoting the
committed numbers as a baseline would have credited this change with three files it did
not wire.**

Suites, same scope before and after:

| suite | before | after |
|---|---|---|
| `atlas-ask-route.test.ts` | 1 failed of 1 | 2 passed of 2 |
| `marketing-nav-dropdowns.test.tsx` | 9 failed of 11 | 10 passed of 10 |
| `sign-in-shell.test.tsx` | 1 failed of 4 | 4 passed of 4 |
| **total** | **11 failing of 16** | **0 failing of 16** |

All three **collect** — they parse, execute and report when run directly. `collected: false`
in the census is its own word for "reached by no enumerated CI command", not for a parse
failure, so this was not the shape where a file Jest cannot read hides as one red file.

Census, clean baseline → this change:

| count | baseline | after | delta |
|---|---|---|---|
| `testFiles` | 2435 | 2435 | 0 |
| `coveredTestFiles` | 1986 | 1989 | **+3** |
| `pullRequestCoveredTestFiles` | 1983 | 1986 | **+3** |
| `uncoveredTestFiles` | 449 | 446 | −3 |
| `untriagedUnrunTestFiles` | 400 | 397 | −3 |
| `directoriesWithUntriagedUnrunTestFiles` | 190 | 189 | −1 |
| `criticalGovernedRiskDirectories` | 1 | **0** | −1 |

Mutation proofs — each repair broken deliberately, and in each case the named assertion is
the one that failed:

| mutation | result |
|---|---|
| re-add `tower` to `shouldCompactSurface` | case fails at `status 200` — **does not reach** the inverted assertion |
| append labelled `Evidence:`/`Next:` lines in the renderer | case fails at `status 200` — **does not reach** it either |
| remove the `visibleContract.passed` block from the route | the new refusal case fails `422 → 200`; the other case still passes |
| truncate the shaped answer to its first sentence | case fails on the named evidence sentence |
| remove the renderer's brand scrub | **nothing fails** — the shared shaper already did it upstream |
| remove both brand scrubs | route answers 422; fails at the status line, not on any brand assertion |
| repopulate `MARKETING_NAV_GROUPS` | the group-declaration case fails, alone |
| flip `showMenuItems` default to `true` | 4 cases fail |
| flip `DemoCodeSignIn` initial mode to `demo` | the first-paint assertion fails on its own line |
| remove the three added paths from the jest command | `pullRequestCoveredTestFiles` 1986 → 1983 (**exactly −3**); the directory returns to the critical band at rank 1 |
| replace the whole step with `echo skipped` | covered 1989 → 1838 (−151, the step's full load); critical directories 0 → 4 |
| unwire one root path, quarantine list still empty | `check:integration-root-quarantine` exits 1 and names the file |
| unwire one root path | `integration-directory-ci-coverage` fails on the root being newly dark |

Gates:

- `npm run check:integration-root-quarantine` — exit 0; "0 root-level suites excluded; every
  other root-level file is run by a workflow".
- `node scripts/quality/check-integration-ci-visibility.mjs --base origin/main` — exit 0;
  "3 changed suite(s) registered in CI".
- `npm run audit:test-ci-coverage:check` — exit 0; committed census matches the run.
- `npx jest --runTestsByPath src/__tests__/behaviors/integration-directory-ci-coverage.test.ts`
  — 16 of 16, after clearing the one entry the two-directional check named.
- Census behaviour suites (`census-drift-is-reported`, `t760-census-drift-ci-gate`,
  `test-ci-coverage-census`, `t471-stale-suite-triage-ci-coverage`,
  `auth-directory-ci-coverage`) — 73 of 73.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**,
  judged by exit code rather than by grepping for diagnostics.
- `npx eslint` over the four changed test files — exit 0.

## Rollout Plan

Merge to `main`. No runtime rollout: no production source file changes, no migration, no
image build, no flag. The three suites begin running on the next pull request.

## Deployment Authority

- Repo-owned deploy workflow: not exercised; this release changes no runtime artifact.
- Shared runtime mutators: none.
- Approved image digest: not applicable — no image is built or deployed.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — nothing user-visible changes, and no product
  surface is touched.

## Rollback Plan

Revert the commit. It removes three paths from one jest command, restores three test files,
restores three quarantine entries and raises `CEILING` back to 3. No data, schema or
runtime state is involved, so the revert is complete and immediate.

## Audit Evidence

- The pull request for this change, with the before/after and mutation tables above.
- `docs/architecture/test-ci-coverage-census.json` at this commit, and the clean-baseline
  comparison recorded in the PR body.
- `scripts/quality/integration-root-quarantine.json` — empty, with the note explaining why
  the file and its checker are kept.
- CI run for `Integration suites`, showing the three new paths in the jest command.

## Known Gaps

1. **The coverage blind spot this item's premise rested on is not fixed here.** The census's
   `declaredQuarantine` signal recognises a quarantine expressed as an ignore pattern on a
   naming command, and not one expressed by enumeration. Emptying the enumeration list
   removes today's instance and leaves the mechanism, so the next enumeration carve-out will
   be reported `untriaged` in the same way. Filed separately; see the residual below.
2. **42 of the directory's 45 files are not re-examined by this change.** They were already
   `covered: true` before it, and the census now reports 0 untriaged for the directory, but
   "covered" means a pull-request command reaches them — it is not a statement that any of
   them passes. The census executes no test and publishes `green: "unknown"` for every row
   without exception, so nothing here should be read as 45 green suites.
3. **`DemoCodeSignIn`'s two-step invite flow is asserted under jsdom, not in a browser.**
   The repaired case clicks the mode toggle and reads the fields that appear; it does not
   prove the invite flow authenticates. That was not in scope and no signed-in proof is
   claimed.
4. **The two discarded assertions are recorded in comments, not in a control.** The reason
   "inverting this is vacuous because the route answers 422 first" lives in a code comment in
   the repaired suite. If the route's refusal is ever removed, the new refusal case fails —
   but nothing stops a future agent from re-adding the vacuous inversion alongside it.

## Residual — stated rather than closed

Three findings this triage surfaced are recorded and **not** repaired here, each filed as
its own backlog item:

1. **A coverage blind spot, and it is why this item's premise was wrong.** All three files
   were already triaged two days before this run, with a failing case, a reason, an owner
   and a verdict, in a repo-owned list with a checker. The census still reported them
   `untriaged`, because its `declaredQuarantine` signal only recognises a quarantine
   expressed as an ignore pattern on a naming command. A carve-out expressed by
   *enumeration* — where the default is excluded and nothing names the file at all — is
   invisible to it. That mislabelling is what put this directory at rank 1 of the critical
   band. Emptying this one list removes today's instance and leaves the blind spot, which
   will misreport the next enumeration carve-out the same way.
2. **A dead island in the public nav.** `Dropdown` and `MobileSection` in
   `MarketingNav.tsx` still implement hover, keyboard, Escape and outside-click behaviour,
   but the groups array is empty at module level and no prop can supply groups, so none of
   it is reachable. Mounting those components directly to keep the old cases green would
   manufacture coverage of an affordance no reader can open, so it was not done.
3. **A redundant brand scrub.** The Atlas renderer rewrites the internal agent name a
   second time after the shared shaper has already done it; removing the second one changes
   no observable output.

The 3 files are this draw. The directory's other 42 were already covered, and the census
now reports 0 untriaged for it — which is stated because the refreshed census says so, not
because the draw is finished.
