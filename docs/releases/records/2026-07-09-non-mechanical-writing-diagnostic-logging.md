# 2026-07-09-non-mechanical-writing-diagnostic-logging — Temporary diagnostic logging for the residual non_mechanical_writing block

## Release ID

`2026-07-09-non-mechanical-writing-diagnostic-logging`

## Status

`candidate`

## Plain-English Summary

PR #4623 fixed a specific `non_mechanical_writing` false positive (`FIN-BASE-P2` colliding with the phase-label scanner), and the post-deploy live re-run confirmed that specific collision is gone. But both `execution_roadmap` and `business_case` still blocked on `non_mechanical_writing` for a *different* reason that could not be identified remotely — a blocked run's draft text is never persisted anywhere retrievable, so there was no way to see which term the scanner actually matched. This release adds temporary, narrowly-scoped diagnostic logging (matched term + a short surrounding snippet, never the full document) so the next occurrence can be root-caused from ACA logs instead of guessed at.

## Layer Impact

- `global-control-lane`: adds a `console.warn` line inside the existing quality-contract block in `persistDeliverable` (`src/lib/deliverables/orchestrator/persistence.ts`), gated to fire only when a `non_mechanical_writing` finding blocks. No behavior change — logging only.

## Client Applicability

- All clients: yes — this is a logging-only change in the shared persistence path.
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/orchestrator/persistence.ts`: for each blocking `non_mechanical_writing` finding, log the matched term and a ~120-character snippet of `narrativeText` around its first occurrence, plus `deliverableKey`/`clientId`/`sourceArtifactRef` for identification. Never logs the full document.

## QA / Validation

- `npx jest src/lib/deliverables/orchestrator/__tests__/persistence.test.ts` — 7/7 passed.
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p .` — 0 errors.
- `npx eslint src/lib/deliverables/orchestrator/persistence.ts` — 0 errors.

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant → re-trigger the same `execution_roadmap` + `business_case` deliverables against the real Lakeshore Move → read the ACA job logs for the new diagnostic line → use the identified term to write the actual narrow fix in a follow-up PR.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge.
- ACA runtime invariant: to be verified via `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: the deliverable worker (`job-abarva-deliv-worker`) ships the same web image; verified by the same check.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — re-trigger the same batch post-deploy to capture the diagnostic log.

## Rollback Plan

Revert the commit; pure logging removal, no data/migration/flag impact.

## Audit Evidence

- To be added once the PR is opened/merged/deployed and the diagnostic log is captured.

## Known Gaps

- This release does not fix the residual `non_mechanical_writing` block — it only adds the diagnostics needed to identify it. The actual fix follows in a subsequent PR once the matched term is known from live logs.
