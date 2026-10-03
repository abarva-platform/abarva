# 2026-09-28-c567-ask-route-answer-mode-wiring — Ask route answer-mode wiring, proved by execution

## Release ID

`2026-09-28-c567-ask-route-answer-mode-wiring`

## Status

`candidate`

## Plain-English Summary

The Ask API decides, from the reader's own question, which answer shape the
response should take, and for two of those shapes it adds a deterministic block
of structure when the model did not produce one. Some call sites in that route
deliberately opt out of the addition and keep the model's words untouched.

None of that was covered by any test. Three suites sit beside the route and all
three replace the whole Intelligence module they call, so not one of them
reached the route's own classification or its fallback application. A previous
change closed the equivalent gap inside the module; this is the route, which is
a different code path rather than a copy of it — it classifies a different
field, it applies the fallback behind an opt-out, and it applies it a third time
to a refusal message on an error path that no module-level suite touches.

This change adds one behavioral suite that drives the real exported `POST` and
asserts each of those behaviours in both directions, and wires that suite into
CI. No product code changed.

## Layer Impact

**Release lane: `global-control-lane`.** The suite and its workflow are shared
control-plane test tooling: they apply to the Ask route for every tenant, behind
no feature gate. No client-scoped schema, seed, ingestion, retrieval or
private-data-plane behaviour is involved, so this is not `client-data-lane`.

- **Products (layer 4)** — test and CI coverage only for the Intelligence Ask
  route. No behaviour, response, prompt, or rendering changed; `route.ts` is
  byte-identical to `main`.
- Layers 1–3 (client intake, source adapters, canonical model) are untouched.

## Client Applicability

- All clients: no change in behaviour.
- Specific clients: none.
- Internal only: yes — a test suite and a workflow.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/intelligence/ask/__tests__/c567-ask-route-answer-mode-wiring.test.ts`
  — new. Nine cases driving the real exported `POST`.
- `.github/workflows/intelligence-ask-route-suites.yml` — new. Runs that suite
  by exact file path.
- This record.

No runtime source file is modified.

## QA / Validation

**What was re-verified before any code was written**, on `origin/main`
`dec4da306a`, by reading the route rather than trusting the filing:

- All three suites in `src/app/api/intelligence/ask/__tests__` call
  `jest.mock("@/lib/intelligence/ask", …)`.
- The guard classifies `context?.query ?? ""` at `route.ts:1862`.
- `applyProductTruthToAvaAnswer` has exactly 8 call sites; 3 apply the fallback
  (419, 785, 874) and 5 opt out with `preserveModelOutput: true` (550, 668,
  1079, 1417, 1581).
- The error path applies the fallback directly at `route.ts:335`.

**Baseline over the same scope**, taken by running the directory with and
without the new file: **3 suites / 36 tests / 0 failing before, 4 / 45 / 0
after.** Not an absolute repository count.

**The suite can fail. Eight mutations, six caught and two survivors that are
themselves the finding.** Every mutation was confirmed with `git diff --numstat`
to have changed `route.ts` before its run, because a no-op mutation reads
exactly like a caught one, and all six were re-measured after the suite was
amended rather than assumed to still hold. `route.ts` is byte-identical to
`main` afterwards, verified the same way.

| # | Mutation | Result |
|---|---|---|
| M1 | site 419 (tenant fence) gains an opt-out it does not have | CAUGHT — the not-opted-out case and the surface-context case |
| M2 | site 874 (Home KNOW) gains an opt-out it does not have | CAUGHT — the second-surface case |
| M3 | site 1417 loses its opt-out | CAUGHT — the opts-out case |
| M4 | site 335 stops applying the fallback to the refusal | CAUGHT — the error-path case |
| M5 | the guard classifies a hard-coded mode instead of the question | CAUGHT — the ordinary-question case |
| M6 | the guard classifies the empty string instead of the question | CAUGHT — three cases |
| M7 | site 1079 (Sentinel) loses its opt-out | SURVIVED — unreached |
| M8 | site 1581 (exhibits) loses its opt-out | SURVIVED — unreached |

M7 and M8 are recorded rather than hidden: a surviving mutation here is not a
blind assertion, it is a call site no case reaches. M8 also corrected a wrong
assumption made while writing the suite — the ordinary synthesis request was
assumed to run through site 1581 and in fact runs through 1417, which was found
by mutation and not by reading.

**The wiring took effect, proved independently rather than grepped from YAML.**
With the test file present and the workflow removed, the coverage census reports
`coveredTestFiles` 2185 and one more uncovered file; with the workflow, it
reports 2186 and no uncovered delta. A YAML line that did not resolve to this
file would have moved `testFiles` and left `coveredTestFiles` behind.

**Gates:**

- `npx tsc --noEmit --pretty false` — **exit 0**, zero diagnostics, judged on
  the exit code. One real type error was found and fixed this way: reaching into
  the registry literal for `general.deterministicFallback` does not typecheck,
  because that entry is narrowed to an object without the key — which is a
  stronger statement of the same fact, and the assertion now goes through the
  typed accessor.
- `npx eslint <the new suite>` — exit 0.
- `node scripts/quality/check-named-suite-requiredness.mjs` — exit 0.
- `node scripts/release-control/check-deploy-authority-policy.mjs` — exit 0.

**Not run, and why.** `docs/ci/test-ci-coverage-census.json` is NOT regenerated
here. It is held by two live operator claims, and it was **already stale by +1
file on `main` before this change**, from work that is not mine; this change
adds the second +1. The census gate compares shape rather than counts, so the
committed file staying stale does not mask anything this change did. Refreshing
it is owed to whoever holds it.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing here is imported by the
application, no route behaviour changes, and no image content changes other than
a test file and a workflow. The repo-owned ACA deploy workflow will run on merge
as it does for every commit.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change issues no Azure command.
- Approved image digest: unchanged by this release; whatever digest the main
  deploy workflow builds from the merge SHA.
- ACA runtime invariant: to be read from the deploy run keyed at or after the
  merge SHA, not asserted here.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing here renders on a product
  surface or is reachable from a product route, so no signed-in acceptance is
  owed and none is implied.

## Rollback Plan

Revert the squash. The two new files are additive and nothing imports them, so
removing them restores the previous state exactly. No migration, no data, no
flag.

## Audit Evidence

- The pull request this record ships in, and its CI checks.
- The `Intelligence Ask route suites` job log, which must print
  `PASS src/app/api/intelligence/ask/__tests__/c567-ask-route-answer-mode-wiring.test.ts`
  and close at 1 suite / 9 tests. That job is **not** a required status check
  and must not be quoted as a merge gate.
- The mutation table above, reproducible from `route.ts` at the merge SHA.

## Known Gaps

- **Five of the eight `applyProductTruthToAvaAnswer` call sites are still
  unreached** — 550 and 668 (Source contract export and visual answers), 785
  (Home KNOW tenant fence), 1079 (Sentinel) and 1581 (exhibits). Three sites are
  driven, one on each side of the opt-out plus a second applying site on another
  surface, which is what proves the opt-out is the reason the fallback is absent
  rather than an assumption. The remaining five route the same helper and differ
  only in the flag they pass; 1079 and 1581 are measured as unreached by M7 and
  M8 above. This is per-unit residual on item C-567 and is filed as such, not
  closed.
- The suite stands in a workflow of its own because `unit-suites.yml` was held
  by another agent's live claim when it was written. Neither file is a required
  check, so the gating power is identical; folding the step back into
  `unit-suites.yml` is tidy-up, not repair.
- `docs/ci/test-ci-coverage-census.json` stays stale, as recorded above.
