# 2026-07-01-tower-value-pack-contract-gate — Tower Portfolio Value Pack Contract Gate

## Release ID

`2026-07-01-tower-value-pack-contract-gate`

## Status

`candidate`

## Plain-English Summary

This follow-up fixes the live Tower chat binding for the Portfolio Value Pack questions. The dashboard slice shipped, but the live trace showed three new questions were not consistently entering the governed Tower answer path because the shared factual-spine gate did not recognize value-gap, weak-evidence, or inspect-this-week phrasing, and the Tower standardized loader had not seeded those three question contracts.

## Layer Impact

- `global-control-lane`: Updates the shared Tower/Atlas routing gate so Portfolio Value Pack questions use the governed CIO Tower answer path instead of the generic LLM lane.
- `client-data-lane`: Updates the Tower standardized loader so `cio_tower.question_contracts` includes the three Portfolio Value Pack contracts for all tenants.

## Client Applicability

- All clients: Yes. The Tower question-contract seed and routing gate are tenant-agnostic.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/atlas/tower-factual-spine.ts`: recognizes value-gap, weak-value-evidence, and inspect-this-week prompts as governed Tower factual-spine candidates.
- `scripts/tower/load-cio-tower-standardized-v1.mjs`: seeds `tower_portfolio_value_gap`, `tower_weak_value_evidence`, and `tower_inspect_this_week` into `cio_tower.question_contracts`.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/answer.test.ts src/lib/atlas/__tests__/tower-factual-spine.test.ts --runInBand` passed.
- `npx eslint src/lib/atlas/tower-factual-spine.ts scripts/tower/load-cio-tower-standardized-v1.mjs src/lib/cio-tower/answer.ts` passed.
- `node scripts/tower/load-cio-tower-standardized-v1.mjs --dry-run` reported 9 question contracts and 40 measure results across 5 tenants.
- Triggering evidence: live deployed trace after PR #4272 showed existing deterministic Tower questions passing, but `largest-value-gap`, `weak-value-evidence`, and `inspect-this-week` did not yet pass the deployed prompt/raw/render trace.

## Rollout Plan

Merge to `main`, let the repo-owned ACA main deploy build and deploy the digest-pinned image, then run the Tower standardized loader inside the private ACA/VNet operator path so the new question contracts are present in Azure/Postgres. Rerun the deployed Tower prompt/raw/render trace afterward.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy only.
- Shared runtime mutators: No local/manual shared ACA mutation.
- Approved image digest: Produced by ACA main deploy after merge.
- ACA runtime invariant: Required.
- Worker image invariant: Delivery workers should align to the deployed digest through the main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun the Tower trace against `https://app.abarva.ai`.

## Rollback Plan

Revert the PR if the route gate causes regressions. The loader change is additive/upsert-only; the new question contracts can be deactivated by setting `active=false` for the three contract keys if needed.

## Audit Evidence

- PR URL: pending.
- Live failed trace that motivated this fix: `/Users/anand/Downloads/tower-prompt-raw-render-trace-2026-07-01T17-09-37-403Z/report.html`.

## Known Gaps

The loader must be executed inside the private VNet after deploy; laptop-side Postgres access is blocked by private DNS.
