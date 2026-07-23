# 2026-07-23-source-decision-selection-artifact-prompts — Source Decision/Selection Artifact Prompts

## Release ID

`2026-07-23-source-decision-selection-artifact-prompts`

## Status

`candidate`

## Plain-English Summary

Source now has dedicated prompt/workflow contracts for the Decision and Selection artifacts that sit between the Decision Brief and Transition: Risk Attestation (`d25`), Governance Sign-off Record (`d26`), Selection Memo (`d27`), and Contract Record (`d28`). These prompts bind the prior event evidence chain and block unsupported jumps, so Source cannot make up accepted risks, approvals, selected vendors, final pricing, signed contracts, legal terms, effective dates, or transition obligations.

This also corrects the Transition prompt's optional upstream reference from the stale `d26_signoff_packet` alias to the canonical `d26_steward_signoff` artifact code.

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

- `src/lib/source/agent-generation/prompt-registry.ts`: adds d25-d28 prompt templates, field contracts, upstream blocking, evidence binding, and the canonical d26 Transition binding.
- `src/lib/source/agent-generation/__tests__/prompt-registry.test.ts`: adds coverage for Decision/Selection availability, upstream blocking, evidence binding, no invented approvals/contracts, and the d26 Transition binding.
- `src/lib/source/artifact-lifecycle-matrix.ts`: adds Decision/Selection guideline labels.
- `src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts`: asserts d25-d28 render as prompt-backed with Claude model/token labels in the standards CSV.
- `docs/backlog/source-product-backlog.md`: records BAFO as merged/proven and marks Decision/Selection d25-d28 as the active item #9 slice.

## QA / Validation

- Pass: `npm test -- --runInBand --runTestsByPath src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts` — 2 suites, 49 tests.
- Pending: focused ESLint.
- Pending: `npm run release:check`.
- Pending: PR checks.
- Pending after merge: ACA main deploy, independent ACA runtime invariant, and signed-in `app.abarva.ai` proof.

## Rollout Plan

Open a PR from this branch, merge through GitHub rules, let the repo-owned ACA main deploy workflow build and deploy the exact merge SHA, then verify the live Source Files matrix for a signed-in Apex event.

## Deployment Authority

- Repo-owned deploy workflow: required after merge (`aca-main-deploy.yml`).
- Shared runtime mutators: none from this PR.
- Approved image digest: pending ACA main deploy.
- ACA runtime invariant: pending after ACA main deploy.
- Worker image invariant: pending after ACA main deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Files matrix / CSV export for Decision/Selection prompt-backed labels.

## Rollback Plan

Revert the PR and redeploy the previous healthy ACA image through the repo-owned main deploy workflow. No data rollback is required because this release changes prompt configuration, tests, docs, and lifecycle projection only.

## Audit Evidence

- PR: pending.
- Local focused tests: `npm test -- --runInBand --runTestsByPath src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts`.
- ACA deploy proof: pending.
- Signed-in live proof: pending.

## Known Gaps

Earlier ungrafted prompt families remain open after this slice, including `d06`, `d08`, `d10`, and `d12`. This release does not generate or mutate any production artifacts.
