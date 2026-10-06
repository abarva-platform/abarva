# 2026-09-21-t462-atlas-mode-log-behavioral — Atlas execution-mode log proved by running it

## Release ID

`2026-09-21-t462-atlas-mode-log-behavioral`

## Status

`candidate`

## Plain-English Summary

When the Atlas assistant cannot reach the language model, it answers from data alone and records
that it did so — a structured `atlas_model_mode` log line carrying the reason. That log is the only
signal that says an answer was not the model's, and it is what an operator or auditor reads to tell
a degraded answer from a normal one.

Until this change, the test that guarded it did not run the code. It opened the source file and
searched the text for the log's field names. A search of that kind passes just as happily on a file
that has deleted the log and left its name behind in a comment, which is precisely the gate shape
this backlog exists to remove.

Two things changed. The log's payload and its severity are now built by small pure functions in
their own module, so a test can call them and assert what they produce. And the assistant's answer
function is now driven for real on both of its degraded paths — no API key, and a model call that
fails — so the log is proved to fire rather than proved to be mentioned. The private logger was not
exported to make this possible; exporting internals to suit a test is the same fault in a different
direction.

No behaviour changes for any user. The log's contents, its severity and every answer are identical
before and after.

## Layer Impact

Release lane: **global-control-lane** — the Atlas answer path is shared app/control-plane behaviour
for every client and is not feature-gated. No client-scoped schema, seed, ingestion or private
data-plane object is touched, so this is not `client-data-lane`.

- **Layer 4 (Products — Intelligence):** no functional change. `logAtlasMode` in
  `src/lib/atlas/llm.ts` now composes its payload via `buildAtlasModeLogPayload` and chooses its
  severity via `atlasModeLogLevel` instead of inlining both. The emitted JSON is byte-identical.
- **Layer 3 (Canonical model):** untouched. No schema, no adapter, no projection, no tenant data.
- Test and control tooling only otherwise.

## Client Applicability

- All clients: the code path is shared, but no observable behaviour changes for any of them.
- Specific clients: none.
- Internal only: the strengthened control is internal.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/atlas/mode-log.ts` (new) — `ATLAS_MODE_LOG_EVENT`, `AtlasModeLogPayload`,
  `buildAtlasModeLogPayload`, `atlasModeLogLevel`. Pure; no logging inside.
- `src/lib/atlas/llm.ts` — `logAtlasMode` stays module-private and now delegates payload and
  severity to the above. No call site moved, no field changed.
- `src/app/api/v1/atlas/__tests__/mode-visibility.test.ts` — the source-text case is replaced by six
  behavioural cases and the boundary mocks that let `runAtlasLlm` run in-process.

No migration, no route, no script, no workflow file.

## QA / Validation

**The defect, measured before any fix was written.** On `origin/main` at `3dc32d8ee`, both controls
the old case guarded were deleted at once — `logAtlasMode` gutted to a no-op with
`event: "atlas_model_mode"` and `mode: "fallback"` left in a comment, and the final return forced to
`fallbackReason: null` on every fallback, which is the silent null the contract exists to prevent.
All three source patterns still matched (grep counts 1 / 4 / 1) and the suite reported
**7 passed / 7, exit 0**.

**Baseline and result, same file, same scope:** 7 passed / 7 before → **12 passed / 12 after**.

**Mutation testing — 5 applied, 5 caught.** Each applied alone and reverted:

| # | Mutation | Result |
|---|---|---|
| M1 | Log deleted; `atlas_model_mode` left in a comment — the decoy the old case passed | 2 of 12 failed |
| M2 | `buildAtlasModeLogPayload` drops the `reason` field | 4 of 12 failed |
| M3 | A fallback logged at `info` instead of `warn` | 2 of 12 failed |
| M4 | Final return reports `fallbackReason: null` on a fallback | 1 of 12 failed |
| M5 | The missing-key branch stops calling the logger | 1 of 12 failed |

M1 is the one that matters: it is the same mutation that left the previous suite at 7/7 green.

**Regression, over every suite that imports `@/lib/atlas/llm`:**

- `src/__tests__/behaviors` — 89 suites / 767 tests, all pass.
- The three CI-owned `src/app/api/v1/atlas/__tests__` suites — 22 of 22 pass.
- `atlas-invariants`, `atlas-tower-grounding-contract`, `orchestrator-enterprise-read-enrichment`,
  `llm-determinism` — pass.
- `src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts` — **2 failing before, 2 failing
  after**, measured by swapping in the `origin/main` copy of `llm.ts` and re-running. Pre-existing
  and unrelated; it runs in no workflow. Filed as a separate item rather than touched here.

**Static checks:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit
**0**, zero diagnostics (exit code judged, not grepped). `npx eslint` over the three files exit
**0**. `node scripts/quality/test-ci-coverage-census.mjs --check` exit **0**, no drift, shape
matches.

**CI ownership unchanged:** `mode-visibility.test.ts` is already named by exact path in
`.github/workflows/unit-suites.yml`. This release edits no workflow file.

## Rollout Plan

Merge to `main`. The repo-owned ACA deploy workflow builds and deploys from the merge SHA as usual.
No migration, no flag, no job, no manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: assigned by the deploy workflow from the merge SHA.
- ACA runtime invariant: asserted by the workflow; to be recorded against this merge in the
  execution register once the run completes.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: none.
- Live signed-in proof required: **no, and the reason is structural rather than a judgement call.**
  The only non-test change replaces an inline object literal and an inline `if` with two pure
  function calls that return the same values. The emitted log line, every answer, every header and
  every payload are identical before and after, so no signed-in session could observe a difference.

## Rollback Plan

Revert the merge commit. Three files, no migration, no data and no runtime state to unwind. The
previous `logAtlasMode` body is restored verbatim by the revert.

## Audit Evidence

- The PR for this record, its CI run, and the squash-merge SHA.
- The mutation table above; every row is reproducible by applying the named mutation and running
  `npx jest --runTestsByPath src/app/api/v1/atlas/__tests__/mode-visibility.test.ts`.
- The before-measurement (7/7 green on a module with both controls deleted) is the reason this
  change exists and is the single most important line for a reviewer to reproduce.

## Known Gaps

- The fourth case in the same suite still reads a migration file as text. That is left alone
  deliberately: its subject *is* a text file, and asserting its content is the only thing the
  assertion can mean.
- `src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts` is red on `main` and runs in no
  workflow. Out of scope here; filed as its own item so it is not repaired inside an unrelated
  change and is not left unrecorded either.
- The three suites in `src/lib/atlas/__tests__` and `src/lib/atlas/llm-determinism.test.ts` remain
  outside every workflow. Not addressed here.
