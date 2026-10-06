# 2026-09-26-t484-behaviour-over-byte-matching-cases — Four byte-matching test cases replaced with assertions over behaviour

## Release ID

`2026-09-26-t484-behaviour-over-byte-matching-cases`

## Status

`candidate`

## Plain-English Summary

Four test cases claimed to protect product behaviour but actually checked that
particular text appeared in a source file. A test like that passes when the text
is present in a comment, and fails when a correct refactor spells the same thing
differently — so it reports assurance it does not have, in both directions.
This change replaces all four with cases that run the real code and assert what
it does.

Three of the four now read what the product produces:

- The Tower synthesis route: instead of matching `temperature: ...` and
  `new AbortController()` in the route file, the case calls the real request
  handler with the model client stubbed and asserts the temperature the model
  **received**, that a cancellation signal was actually handed over, and that a
  stalled upstream comes back as the route's honest timeout notice with the
  upstream aborted.
- The Tower page's diagnostic panel: instead of matching one guard written one
  way next to a call, the case renders the real page with that read genuinely
  failing and asks the rendered output whether the page survived and the panel
  degraded — plus the other direction, that a successful read still renders the
  panel.
- Home's copy contract: instead of reading the source of four components, the
  case sweeps the **visible text** of the Home surface the route actually
  renders, over every governed tenant bundle and every view a reader can reach.

The fourth point is a finding rather than a fix, and it changed the shape of the
work. Re-verifying on `main` first — as the working rules require — showed that
the four components the Home cases read are reachable from **no route at all**.
Every reference to them outside their own files and outside tests is a comment, a
type name, or a QA inventory string; there are zero import statements; and a
sibling suite independently asserts that the Home route must not mention them,
because Home serves a different canvas. So those cases were not merely reading
bytes — they were reading the bytes of copy no reader can see. Pointing a
render-based replacement at the same files would have produced a *behavioural*
test of dead code: green, plausible, and proving nothing. The property was
therefore retargeted at the live surface, and the unreachable components are
filed separately as `U-530`, because mounting or deleting them is a product
decision and not this change's call.

No product code changed. Every edit is in a test, or in the triage record that
tracks these four cases.

## Layer Impact

Release lane: `global-control-lane` — shared validation tooling that every branch
and every client's pipeline runs. Nothing is client-scoped and nothing is
feature-gated.

- **Layer 4 (products):** no behaviour change. Two Tower surfaces and one Home
  surface are now *observed* by tests that drive them; none of them was modified.
- **Test and validation tooling:** four byte-matching cases removed, seven
  behavioural cases added, and one new control added to the triage-record guard
  so the record cannot keep quoting case titles that no suite has any more.
- **Security assurance artifact:** the tenancy-fence census is regenerated and
  one of its three executed mutation samples is re-measured. No fence, route or
  auth path is modified; what changes is what the census can honestly claim.

## Client Applicability

- All clients: no runtime change reaches any client.
- Specific clients: none.
- Internal only: yes — test and validation assurance only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/tower/synthesis/route-fix-c.test.ts` — the source-text case
  replaced by two cases that drive the exported `POST` handler, plus a third that
  closes the fence-coverage gap those two would otherwise have opened in the
  security census (see the CI-gate note under QA).
- `docs/security/tenancy-fence-coverage.json` — regenerated, and that route's
  mutation sample re-measured and re-recorded with why it moved.
- `src/lib/tower/__tests__/ecl-projection-preview-degrades.test.ts` — the
  call-site regex case replaced by two cases that render the real page through
  its exported renderer, with the real projection read failing.
- `src/app/(maestro)/home/__tests__/no-readmin-reexports.test.ts` — the two
  component-source copy cases replaced by two sweeps of the rendered Home
  surface; the suite's five filesystem cases are untouched.
- `docs/architecture/t479-stale-suite-triage.json` — each of the three rows now
  declares `partialSourceTextCasesReplacedBy`: what replaced it, why, and what
  was measured. The originally recorded case names are left exactly as measured;
  the record is history and is not rewritten.
- `src/__tests__/behaviors/t479-stale-suite-triage-record.test.ts` — a new
  control requiring every such declaration to hold in **both** directions
  against the live suite: the titles it says are gone must be gone, and the
  titles it says replaced them must be present.

No product source file, CI baseline, workflow or ratchet script is changed by
this release.

## QA / Validation

**Baseline measured in a separate worktree at the same commit, never a stash.**
Before-numbers come from a detached checkout of `822df5ea22d5e3305e8d5fd286a09fc47feaebc7`
with a clean `git status`.

| scope | before | after |
|---|---|---|
| the four changed suites | 43 passed, 0 failed (4 suites) | 47 passed, 0 failed (4 suites) |
| tower ratchet scope, baseline paths verbatim | 8 failed / 1796 passed / 1804 total, 6 failing suites | 8 failed / 1799 passed / 1807 total, 6 failing suites |
| home ratchet scope | 28 failed / 733 passed / 761 total, 12 failing suites | 28 failed / 733 passed / 761 total, 12 failing suites |
| `src/__tests__/behaviors` `--runInBand` | 1353 passed, 0 failed (139 suites) | 1354 passed, 0 failed (139 suites) |
| `node --test scripts/quality/tenancy-fence-coverage.test.mjs` | 15 passed, 0 failed | 15 passed, 0 failed |

The tower and home failures are the ones already declared in
`docs/ci/tower-test-baseline.json` and `docs/ci/home-test-baseline.json`; the same
six and the same twelve suites fail on both sides, and no baselined suite
improved, so the ratchet's re-record rule is not engaged. Tower total moves by
exactly the two cases added there, and stays far above its floor of 1700.

**Ten mutations, each applied to a subject file and restored, and each run
against BOTH the old case and its replacement.** That pairing is the point: the
question is not only "can the new case fail" but "was the old one blind", and
four of the ten answer it.

| mutation | subject | old case | new case |
|---|---|---|---|
| M1 spread a `temperature: 1` override in after the literal | synthesis route | **PASSED** (all four substrings intact) | failed |
| M2 bind the abort signal to a local and call the SDK without it | synthesis route | **PASSED** | failed (2 cases) |
| M3 bind the same temperature through a local — no behaviour change | synthesis route | **FAILED** (false positive) | passed |
| M4 replace the honest timeout body with `"Error"`, constant still referenced | synthesis route | **PASSED** | failed |
| D1 comment the guard out in place, bytes left at the call site | tower page | **PASSED** | failed |
| D2 rewrite the identical guard as `try`/`catch` | tower page | **FAILED** (false positive) | passed |
| D3 drop the read entirely so the panel can never render | tower page | failed | failed (the success half) |
| H1 render a runtime-assembled `Cross-tenant` on the live surface | Home v4 app | **PASSED** (2/2) | failed |
| H2 render a runtime-assembled retired setup-era label on the live surface | Home v4 app | **PASSED** (2/2) | failed |
| H3 put the banned words in a **comment** of the old subject file | old subject | **FAILED** (false positive) | passed |

A control on the control, because a clean sweep over a surface that failed to
render is indistinguishable from a clean sweep over a surface that is clean:
blinding the Home sweep so it reads nothing turns **both** replacement cases red
on their non-vacuity assertion rather than leaving them green. The sweep also
checks its own scanner against a planted phrase inside the same case.

Three more on the new triage-record control, one per direction it has to hold:
removing one row's declaration, putting a replaced case title back into a live
suite, and naming a replacement the suite does not have — each fails it, and the
record guard is 29/29 with all three reverted.

### A CI gate caught a false improvement, and it was right

`Fence coverage matches the committed census` failed on the first push, and not
on a formality. `docs/security/tenancy-fence-coverage.json` classifies an API
route as `behavioral` as soon as some suite loads it and calls an HTTP-method
handler. The replacement cases do exactly that, so the Tower synthesis route
moved out of the census's `byteScannerOnly` bucket (7 -> 6) and into `behavioral`
(66 -> 67) — **while those cases stub `requireTenancy`**. In a security census
that reads as fence assurance that had not been gained.

It was measured before anything was recorded. Re-running the census's own
recorded mutation for that row — the fence deleted, tenancy hard-coded to a
foreign tenant and the refusal arm returning 200 — left both covering suites
GREEN at 10 passed / 4 skipped / 0 failed, byte-identical to the clean baseline.
So the improvement was real in the classifier and empty in fact.

The gap is closed rather than caveated. The suite now also asserts the part a
stubbed fence can still prove honestly: the route consults the fence before any
tenant-scoped read, and hands a refusal to the fence's own mapper instead of
composing a status itself — no portfolio load, no egress preflight, no model
call. The same mutation now turns the covering suites **RED**: 14 total, 0 failed
clean -> 1 failed with the fence deleted.

The census artifact records that history rather than overwriting it: the row's
sample carries `whyItMoved`, its `result` flips from `green` to `red`, and the
`mutationProof` note now states the direction that proves each kind of row —
green for a `byte-scanner` or `none` row, red for a `behavioral` one — plus the
sentence that was missing and that this episode is the case for: **a
`behavioral` row with no sample is a structural classification only, because a
suite that stubs the fence also loads the route and calls a handler.** The
sampled-of-how-many counts are updated in both buckets.

Typecheck: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
with `tsconfig.tsbuildinfo` deleted first, **exit 0**, judged by status. One real
error was found and fixed this way during the work, not read past.
ESLint over the four changed files: exit 0, no errors and no warnings.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
nothing under `src/**` that the application serves is modified, so the deployed
image's behaviour is unchanged. The change takes effect for CI on merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  by this release.
- Shared runtime mutators: none. This release contains no Azure command, no image
  reference, no flag and no environment variable.
- Approved image digest: not applicable — no runtime image change is requested.
- ACA runtime invariant: unaffected; no template, revision or traffic change.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and the reason is stated rather than
  assumed — every changed file is a test or a record, so no code path a signed-in
  reader can reach differs before and after. The behaviour these tests now assert
  is worth proving signed in, but that proof belongs to whoever changes that
  behaviour, not to a change that only starts observing it.

## Rollback Plan

Revert the pull request. There is no migration, no data change and no deployed
artefact to roll back; reverting restores the four byte-matching cases and the
record rows as they stood.

## Audit Evidence

- The pull request and its CI run.
- `docs/architecture/t479-stale-suite-triage.json` — the three rows now carry
  `partialSourceTextCasesReplacedBy` with the reason and the measurement, and the
  record guard fails if any of it drifts from the live suites.
- The before/after tables above, each reproducible with the commands named.

## Known Gaps

- **`U-530` is filed and not fixed by this release.** Four Home components —
  roughly 3,500 lines — are reachable from no route. This change stops testing
  them; it does not mount or delete them, which is a product decision.
- **A second finding, filed as `U-531`.** Sweeping the live Home surface for one
  governed tenant raised 13 React duplicate-key warnings on the
  infrastructure-estate view: 14 rows in that tenant's bundle share one row
  identifier, and the view keys its rendered rows on it, so React may omit or
  duplicate rows a reader is looking at. The warnings are left visible in the
  test output rather than suppressed — suppressing them would hide the finding —
  and fixing either the identifier or the key is out of this item's scope.
- The positive halves of the two old Home cases are deliberately not carried
  over; the copy they named exists on no live surface. This is stated in the
  suite and in the record rather than left to be noticed.
- One case in the Home suite's own sibling record (`T-481`'s rows) and the other
  triage draws' byte scanners are untouched; this item owns only the four cases
  `T-479` named.
