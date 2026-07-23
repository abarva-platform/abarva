# 2026-07-23-source-early-mid-artifact-prompts — Source Early/Mid Artifact Prompts

## Release ID

`2026-07-23-source-early-mid-artifact-prompts`

## Status

`candidate`

## Plain-English Summary

Source now has dedicated prompt/workflow contracts for the remaining early/mid artifact gaps in item #9: Exclusion Log (`d06`), Scope Risk Pre-mortem (`d08`), RFI Summary (`d10`), and Vendor Shortlist (`d12`). These prompts bind the scope/RFP evidence chain and block unsupported jumps, so Source cannot make up exclusions, workshop decisions, vendor market signals, shortlisted vendors, approvals, disqualifications, or invitation status.

## Layer Impact

- `global-control-lane`: generation registry and lifecycle/standards projection behavior changes for all Source tenants.
- `client-data-lane`: no schema, migration, seed, ingestion, or production data mutation is included.

## Client Applicability

- All clients: receive the prompt registry and lifecycle matrix projection.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`: adds d06/d08/d10/d12 prompt templates, field contracts, upstream blocking, and evidence binding.
- `src/lib/source/agent-generation/__tests__/prompt-registry.test.ts`: adds coverage for availability, upstream blocking, evidence binding, and no invented exclusions/workshop decisions/vendor signals/shortlist approvals.
- `src/lib/source/artifact-lifecycle-matrix.ts`: adds guideline labels for d06/d10/d12; d08 already had a guideline and now becomes prompt-backed.
- `src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts`: asserts d06/d08/d10/d12 render as prompt-backed with Claude model/token labels in the standards CSV.
- `docs/backlog/source-product-backlog.md`: records Decision/Selection d25-d28 as merged/proven and marks the early/mid d06/d08/d10/d12 slice as active.

## QA / Validation

- Pass: `npm test -- --runInBand --runTestsByPath src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts` — 2 suites, 55 tests.
- Pending: focused ESLint.
- Pending: `npm run release:check`.
- Pending: PR checks.
- Pending after merge: ACA main deploy or superseding main deploy that contains the merge SHA, independent ACA runtime invariant, and signed-in `app.abarva.ai` proof.

## Rollout Plan

Open a PR from this branch, merge through GitHub rules, let the repo-owned ACA main deploy workflow build and deploy the exact merge SHA or a superseding main SHA that contains it, then verify the live Source Files matrix and CSV for a signed-in Apex event.

## Deployment Authority

- Repo-owned deploy workflow: required after merge (`aca-main-deploy.yml`).
- Shared runtime mutators: none from this PR.
- Approved image digest: pending ACA main deploy.
- ACA runtime invariant: pending after ACA main deploy.
- Worker image invariant: pending after ACA main deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Files matrix / CSV export for d06/d08/d10/d12 prompt-backed labels.

## Rollback Plan

Revert the PR and redeploy the previous healthy ACA image through the repo-owned main deploy workflow. No data rollback is required because this release changes prompt configuration, tests, docs, and lifecycle projection only.

## Audit Evidence

- PR: pending.
- Local focused tests: `npm test -- --runInBand --runTestsByPath src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts`.
- ACA deploy proof: pending.
- Signed-in live proof: pending.

## Known Gaps

This release does not generate or mutate any production artifacts. It does not address separate artifact-quality, guidebook, analytics/chat, or ingestion/data-layer backlog items.
