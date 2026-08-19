# 2026-08-18-enterprise-thesis-verifier-tokens — Fix the same empty-response bug in the verifier

## Release ID

`2026-08-18-enterprise-thesis-verifier-tokens`

## Status

`candidate`

## Plain-English Summary

The prior fix's diagnostic logging proved itself immediately: on the second live run, the main
EnterpriseThesis generation succeeded (16000 tokens was enough — a real thesis parsed, structural
validation ran, 19 and 20 high-stakes claims were sent to the verifier). But the verifier itself
then hit the identical failure — `stop_reason=max_tokens`, `blocks=[thinking]`, zero output
tokens spent on visible text — on 4 of 19 verifier calls for one tenant and 5 of 20 for the other.
Same root cause as the main call: 200 tokens wasn't enough headroom for the model's internal
reasoning before it could write a one-sentence verdict.

Each of those empty responses was already falling back to a safe default (`UNSUPPORTED`, reason
`"verifier call failed"`, distinguishable in the stored results from a genuine verdict) — so no
claim was wrongly *approved*, but a meaningful fraction were dropped for the wrong reason, which
understates how much of the thesis actually holds up.

Fixed with the same approach as the main call: `max_tokens` raised from 200 to 3072 for the
verifier specifically — enough headroom for reasoning plus a short classification response,
without approaching the main call's much larger budget.

## Layer Impact

Lane: `global-control-lane`. Generator logic only.

## Client Applicability

All clients — tenant-agnostic.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts` — verifier call `max_tokens` 200 → 2048.

## QA / Validation

- `NODE_OPTIONS="--max-old-space-size=6144" npx tsc --noEmit` — PASS, 0 errors, genuine clean exit.
- `npx eslint` — PASS, 0 errors.
- 10 existing tests — PASS, unaffected (no tested function's behavior changed).

**NOT YET RUN:** whether this closes out the empty-response failure class entirely is unproven
until the next live run.

## Rollout Plan

Merge to `main`. ACA main-deploy. Rerun `data-build:enterprise-thesis:plan` against both tenants.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Live signed-in proof required: not for this PR.

## Rollback Plan

Revert the commit. No data written by this change.

## Audit Evidence

Second run captured at `./reports/enterprise-thesis/plan-2/04-logs.txt` — shows the main thesis
generation succeeding for the first time (structural check ran, real claim counts), and the
verifier's empty-text failures with full diagnostic detail from the prior PR's logging addition.

## Known Gaps

None specific to this change. The broader open item remains: whether the generated thesis content
itself clears the three acceptance tests agreed for this layer is still unproven until reviewed on
a run where the verifier also completes cleanly.
