# 2026-10-17-decision-request-strict-readiness - Strict Reasoning Context

## Release ID

`2026-10-17-decision-request-strict-readiness`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Require fully agent-ready context when constructing a decision-reasoning request. The general bundle builder still supports existing diagnostic and provisional-review contracts. The reasoning-request helper has no runtime consumers in the current direct-call inventory, so this closes a latent adoption hazard without wiring a new reader.

## Layer Impact

Release lane: `global-control-lane`.

- Governance: strict readiness is explicit at the reasoning-envelope boundary.
- Canonical model and source adapters: no schema, dictionary, data, approval or manifest changes.
- Products: no routes, reader selection, prompts or serving paths change.

## Client Applicability

- All clients: shared reasoning helper contract; no current runtime consumer found.
- Specific clients: none selected for data admission or activation.
- Internal only: diagnostic defaults remain unchanged.
- Public/demo only: no visual change.
- Feature flag: none added or changed.

## Changes Included

`buildDecisionReasoningRequest` sets `requireAgentReady: true`. Regression coverage verifies provisional refusal, incomplete-readiness refusal, ready positive controls, citation filtering and diagnostic compatibility across canonical tenants. The direct-call inventory and readiness audit reflect the stricter helper.

## QA / Validation

- Pass: regression tests first reproduced provisional admission in the previous helper.
- Pass: two focused governance suites, 121 tests; prior helper reproduced nine regression failures before the fix.
- Pass: full typecheck and scoped ESLint on Node 24.
- Pass: full context/corpus validation, including manifests; existing approval warnings remain unchanged.
- Pass: Home ratchet, no movement (1602/1630 tests; 12 existing failing suites remain baselined).
- Pass: independent read-only review, no actionable findings; reviewer closed.
- Pass: release check, all 11 gates ran and passed.
- Pending: exact-head PR checks before merge.
- Not run: database mutation, data load, model calls, indexing, product/browser acceptance. These are not required to prove a dormant pure helper and are not claimed.

## Rollout Plan

Squash the reviewed PR to main after validation. Package only through the repo-owned ACA main workflow. No database migration, manifest admission, readiness grant or reader adoption runs on merge. A future consumer requires its own reviewed wiring and product acceptance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none added or changed.
- Approved image digest: resolved by the exact-main workflow; verify before claiming deployment.
- ACA runtime invariant: template and 100%-traffic revision must match the approved digest.
- Worker image invariant: all workers derived from the deploy script must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: for future product adoption; no such adoption is included.

## Rollback Plan

Revert this PR through the protected-main PR path and redeploy with the approved main workflow. There is no database or tenant-state rollback.

## Audit Evidence

Focused test logs, direct-call AST inventory, readiness audit, PR checks and exact-main deployment/runtime proof. Data-quality and private source evidence remain outside the public repository.

## Known Gaps

The general diagnostic bundle remains non-strict by default. Other provisional callers and diagnostic serializers are not certified by this helper change. Source-owner authority, access review, private dataset approval, predicate admission, indexing/retrieval and product adoption remain separate gates. A policy pass verifies declared metadata, not independent authenticity of the declared index or citation proof.
