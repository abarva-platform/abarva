# 2026-10-01-t799-tower-route-scope-behavior — Rewrite the T-799 Tower route-scope byte scan as behaviour and wire it

## Release ID

`2026-10-01-t799-tower-route-scope-behavior`

## Status

`candidate`

## Plain-English Summary

Item T-799 triaged twenty test files that no continuous-integration job ran
(`docs/architecture/t799-stale-suite-triage.json`, #8757). One row,
`src/app/(maestro)/tower/__tests__/tenant-tower-route-scope.test.ts`, had the
verdict `rewrite_as_behavior`. All four of its cases read the Tower routes'
source with `fs.readFileSync` and matched literals over the bytes. One case was
red because a formatter had put a three-line expression in
`src/app/(maestro)/tower/page.tsx` on one line. The behaviour was unchanged.
A byte scan like that fails on formatting and passes on a comment, so it was
held out of CI.

This change replaces the byte scan with six behavioural cases. Each one calls
the route with its collaborators mocked and observes which client key reaches
the active-client resolver and the Tower read:

- The tenant route resolves and reads only the key `assertTenantAccess`
  returned, even when the request carries a different `client` query. The Ava
  shell receives that same key.
- When access is refused, nothing is resolved or read.
- The tenant subsurface route is scoped to the authorized tenant, and it 404s
  an unknown surface before any read.
- Neither tenant route redirects.
- The generic `/tower` route passes the explicit `client` query to
  `getActiveClientRow`.
- The result of `readTowerCommandCenter` is what the command-center view model
  receives.

The suite is wired by named file in the existing T-799 by-file step. The
`(maestro)` route-group segment would be read as a capture group by a bare
Jest pattern, which is why it is named by file. The directory holds only this
file, so it leaves the dark-directory baseline.

No product file is edited.

## Layer Impact

**Release lane: `global-control-lane`.** Shared CI tooling and one test file.
It applies to every client's build equally and sits behind no feature gate.

- **Layer 4 (Products):** no product behaviour changes. No route, component,
  adapter, projection or canonical object is touched.
- **Platform tooling / CI:** one file is added to an existing job step. The
  coverage census, the dark-directory baseline, the T-799 triage record, its
  control and the AI-surface control catalog's `knownSuites` are updated to
  match what the repository now runs.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/app/(maestro)/tower/__tests__/tenant-tower-route-scope.test.ts`:
  rewritten from four byte-scan cases into six behavioural cases. It no longer
  reads any repository file.
- `.github/workflows/unit-suites.yml`: the file is added to the T-799 by-file
  step, which is renamed `Run the T-799 docs page, Source request-first and
  Tower route-scope suites by named file`. The step comment is updated.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`:
  `src/app/(maestro)/tower/__tests__` removed (90 → 89 entries).
- `docs/architecture/test-ci-coverage-census.json`: regenerated with the
  repo-owned `--write`. Files run by no workflow 218 → 217. Uncovered
  directories 92 → 91. Untriaged unrun files 166 → 165, as the generator
  reported it.
- `docs/architecture/t799-stale-suite-triage.json`: the row keeps its
  original verdict and red counts as the snapshot at its base. It gains a
  `rewritten` block with the re-execution base, 6/6 and what changed, plus
  `wiredInThisItem: true`. Its `readsRepositoryFileText` and
  `sourceTextScanner` now describe the file as it is (`false`), because the
  T-770 scanner-wiring refusal reads `sourceTextScanner` as the current
  classification. The draw-time values are kept as
  `rewritten.drawnReadsRepositoryFileText` and
  `rewritten.drawnSourceTextScanner`. `secondHalf.stillHeld` drops the row.
- `src/__tests__/behaviors/t799-stale-suite-triage-record.test.ts`: an
  applied rewrite now counts as a run row. An applied `formatting_reflow` row
  must meet all of the following:
  - it is classified now as neither reading text nor a scanner;
  - it is classified at draw time as both;
  - the old literal is gone from the test;
  - the test imports the three routes it calls;
  - the re-execution was green;
  - it is wired.

  A reflow row that is not marked applied still holds only while its defect
  exists.
- `docs/security/ai-surface-control-catalog.json`: the rewritten suite mocks
  `TowerCommandCenterAvaShell`, so the static catalog gate requires it to be
  named in `knownSuites` for the five Tower dock controls. The path is added
  to those five lists only. The existing reasons already say that the listed
  suites reference the shell module without asserting the control. No
  coverage is claimed, and no status changes.

## QA / Validation

**Re-verified on main first.** On `origin/main` `70e59be180`, the old suite
failed 1 of 4, on the three-line literal.

**Red first.** With the rewrite alone, the T-799 control failed 2 of 10: the
re-derived text classification, and the reflow hold whose literal had gone.
With the control amended but the suite not yet wired, it failed 1 of 10. The
first behaviours run after wiring found two more gates red:

- T-770 refused a wired declared scanner.
- The catalog gate wanted `knownSuites`.

Eight behaviours suites failed in total (22 tests), because the catalog
audits run in several suites. After the record classification and the
catalog paths were fixed, everything passed.

**Product mutations against the new suite.** Each was applied to `page.tsx`
or a tenant route, checked with `git diff --numstat`, run and restored.

| Mutation | Result |
|---|---|
| Generic route prefers the query over the trusted tenant key | 1/6 fails |
| Tenant route passes the slug instead of `access.clientKey` | 1/6 fails |
| Subsurface route drops the `notFound()` guard | 1/6 fails |
| Generic route ignores the `client` query | 2/6 fail |
| View model receives `null` instead of the Tower read | 1/6 fails |
| Ava shell receives the raw query key | 1/6 fails |
| Tenant route redirects before rendering | 2/6 fail (see note) |
| Tenant route swallows an `assertTenantAccess` refusal | 1/6 fails |

8 of 8 caught. Note on the redirect mutation: it added the call without
importing `redirect`, so part of what failed was a `ReferenceError`. That
makes it a weaker kill than the others.

**Control mutations** (T-799 control and T-770 together, 17 cases):

| Mutation | Result |
|---|---|
| Record re-execution set to 5/6 | 1 fails |
| Test re-imports `node:fs` | 2 fail |
| File removed from the T-799 step | 1 fails |
| `rewrittenInThisItem` set to false | 3 fail |
| A route import replaced by `jest.requireActual` | 1 fails |
| Row `sourceTextScanner` set back to true | 3 fail |
| `drawnSourceTextScanner` set to false | 1 fails |

7 of 7 caught. One edit is **not** caught: adding a string to
`secondHalf.stillHeld`. That field is prose. Neither this control nor the
previous one reads it, and no guard was added for it.

**Same-scope baseline, `src/__tests__/behaviors`:** 169 suites / 1783 tests /
0 failing on base `70e59be180`, measured in a clean detached worktree. On the
branch it is 169 / 1783 / 0. No behaviours case was added; one was amended.

**Other gates:**

- census `--check`: exit 0
- triage-record reconciliation: exit 0
- `scripts/audit/ai-surface-control-catalog.mjs`: exit 0
- `tsc --noEmit`: exit 0
- eslint on both changed tests: exit 0

The control imports no `src` module, so it does not move the behaviour
coverage floor. The floor was not re-measured locally.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change. The suite
runs from the next pull request.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic or DNS.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a (no runtime image change)
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no**, because no product surface changes

## Rollback Plan

Revert the pull request. That restores all of the following together:

- the test
- the step
- the baseline
- the census
- the record
- the control
- the catalog lists

They are consistent only as a set. There is nothing to unwind in a running
environment.

## Audit Evidence

- Local run counts and the mutation tables above.
- Runner proof from the pull request's unit-suites job log: the `PASS` line
  for `tenant-tower-route-scope.test.ts` in the T-799 by-file step. It is
  recorded in the backlog after the run rather than inferred from the YAML.

## Known Gaps

- The suite proves route scoping with the collaborators mocked. It does not
  prove `assertTenantAccess` itself, which is covered elsewhere, and it does
  not render the page.
- T-799 still holds one row: ProofPointFooter, under T-775.
