# 2026-09-21-governed-tower-answer-contract-suite — Governed Tower answer contract suite repaired and made required

## Release ID

`2026-09-21-governed-tower-answer-contract-suite`

## Status

`candidate`

## Plain-English Summary

One automated check exists to prove that when a user asks the assistant a factual
question about Tower numbers — "the top 10 IT programs", "the total budget" — the
answer comes from the governed Tower answer contract rather than from free-form
model composition. That check had been failing, and it ran in no CI workflow, so
nothing reported it.

Investigating it first, before changing anything, produced a better answer than the
obvious one. **The routing control has not regressed.** The application still routes
those questions through the governed contract exactly as intended. The check was
failing because it intercepted the wrong module: it replaced a data boundary the
application stopped using some time ago, so the replacement caught nothing and the
*real* answer contract ran underneath it and attempted to open a live database
connection. It failed on this machine only because no database URL is configured.

That is the finding worth recording: had this check been switched on in any
environment that does have a database URL, it would have performed real tenant
reads as a side effect of running the test suite. It was not safe to enable as
written. The suite now intercepts the boundary the application actually uses, no
database access is reachable from it, and it is switched on as a required check.

## Layer Impact

**Release lane: `global-control-lane`** — shared control-plane tooling that applies to
all clients and is not feature-gated. It is the control plane rather than the product
surface: the change is to what CI proves about the shared answer path, not to the
answer path itself. No client-data-lane, internal-admin, public-demo or experimental
surface is touched.

- **Layer 4 (Products) — Intelligence/Tower answer path:** no runtime behaviour
  changed. No application source file was modified. The governed routing path was
  read and measured, not edited.
- **Test, validator and CI tooling:** one test file repaired against the correct
  module boundary; one workflow step added that runs it by exact file path; the
  committed CI coverage census refreshed to match.

## Client Applicability

- All clients: no behaviour change. Nothing ships to a client surface.
- Specific clients: none.
- Internal only: yes — CI and test tooling only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts` — repaired. Replaced
  the stale `@/lib/cio-tower/answer` and `@/lib/cio-tower/metric-packet` module
  replacements with `@/lib/tower/current-layer-answer`, which
  `src/lib/atlas/orchestrator.ts:44` imports and `:289` calls. Added a negative
  control and a cover-name canonicalization case.
- `.github/workflows/unit-suites.yml` — one step added, naming the single file by
  exact path, with the measurement and the boundary review recorded inline.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.

No application source file is in this change.

## QA / Validation

Measured on `origin/main` at `7d19b27ef01ef1d289adb5a6def1f4ec0a15db53`, same scope
both sides.

**Before, same file:** 2 collected, **2 failed**. Both failures were
`azure_read_adapter_no_connection: set ABARVA_AZURE_DATABASE_URL or DATABASE_URL`,
thrown at `src/lib/data-plane/read-adapters/azureSession.ts:131` and reached via
`orchestrator.ts:591 → runGovernedCioTowerTurn (:289) → answerCurrentTowerQuestion →
readTowerCommandCenter → withSession`.

**That stack is itself the evidence for the refusal question this item demanded be
answered first:** it shows the governed routing working — the orchestrator does reach
`runGovernedCioTowerTurn`. The contract is not regressed; the suite was stale, and
stale in a way that made it unsafe to enable.

**After, same file:** 4 collected, **4 passed**, with no database access reachable.

**Whole-directory baseline before any edit** (`src/lib/atlas/__tests__` plus
`src/lib/atlas/llm-determinism.test.ts`, 9 files): 9 suites / 36 tests, **2 suites and
4 tests failing**. The second failing suite is a different defect and is NOT repaired
here — see Known Gaps.

**Mutation proof — the control can fail, including against a comment decoy.** Each
mutation applied to `src/lib/atlas/orchestrator.ts`, measured, then reverted; the file
is byte-identical to `origin/main` in this change.

| Mutation | Result |
|---|---|
| Governed branch never taken (`if (false)`, predicate name left in a comment) | **3 of 4 fail** |
| Every question routed to the governed contract (`if (true)`) | **1 of 4 fails** — the negative control |
| `answer_current_tower_question` removed from `toolsUsed`, name left in a COMMENT | **2 of 4 fail** |
| Tenant canonicalization bypassed, legacy label passed through | **3 of 4 fail** |
| Reverted to pristine | 4 of 4 pass |

The third row is the one that matters against the gate shape this backlog exists to
repair: a gate that proved the control by finding its name in the file would have
passed that mutation.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit
  code 0**, 0 diagnostics. Exit code judged, not grep output.
- `npm run audit:test-ci-coverage:check` — exit 0, census matches.
- The workflow step's exact command was executed as written: 1 suite / 4 tests, green.

## Rollout Plan

Merge to `main`. CI-only; the repo-owned ACA deploy workflow will build and deploy the
merge commit as it does for any merge, but this change alters no runtime code, so
there is no runtime behaviour to roll out.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is part of this change.
- Approved image digest: not applicable — no runtime code changed.
- ACA runtime invariant: to be recorded from the deploy run for the merge SHA.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** No client-visible surface changes.

## Rollback Plan

Revert the PR. It touches one test file, one workflow step and one generated census
file; reverting restores the previous state with no data or migration consequence.

## Audit Evidence

- The pull request and its CI run.
- The `Run the governed Tower answer contract suite` step in the
  `unit-suites` job runner log — proof the step executes rather than merely exists.
- The before/after and mutation table above, reproducible at
  `7d19b27ef01ef1d289adb5a6def1f4ec0a15db53`.

## Known Gaps

- **`src/lib/atlas/__tests__/tower-grounding-client-name.test.ts` is still red and
  still dark**, and is a distinct defect: it declares `mockLoadV7TowerProjection` at
  line 38 and never passes it to `jest.mock`, so the assertion
  `expect(mockLoadV7TowerProjection).toHaveBeenCalledWith(...)` asserts against a
  replacement that was never installed and can never pass. Filed as a backlog item
  rather than repaired inside an unrelated change.
- **Seven further files in this directory remain outside every workflow.** They
  measured green, but two of them — `scripted-cxo-language.test.ts` and
  `llm-determinism.test.ts` — assert by reading source as text. A green text-matcher
  is worse than a red one, because nothing will ever make it fail, so none of the
  seven is wired on the strength of its colour alone. Filed with that screening
  measurement.
