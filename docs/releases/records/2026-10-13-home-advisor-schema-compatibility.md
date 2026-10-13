# Home Advisor Schema Compatibility

## Release ID

`2026-10-13-home-advisor-schema-compatibility`

## Status

`candidate`

## Plain-English Summary

Represent an optional chart type using explicit schema alternatives accepted by the provider. Record only status and elapsed time when a request fails, without exposing prompts, credentials or provider error text.

## Layer Impact

Layer 4, Products: Home advisor request schema and safe failure diagnostics. No change to intake, adapters, canonical objects, tenant rows or source versions. Release lane: `global-control-lane`.

## Client Applicability

- All clients: Existing authenticated Home advisor.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home controls are unchanged.

## Changes Included

- Nullable chart enums use `anyOf` with separate string and null alternatives.
- Provider failures log only numeric status and elapsed milliseconds.
- Focused request-shape and failure-diagnostic regression coverage.

## QA / Validation

- Pass: Provider token-count metadata endpoint reproduced the original rejection and accepted the corrected schema; no enterprise facts or answer generation were submitted.
- Pass: 841 affected Home preview, canvas, record-browser and export tests across 58 suites; Node 24 typecheck and focused ESLint.
- Fail, unchanged from base: Broader Home sweep has 26 failures across 11 suites on both candidate and clean base; no movement caused by this change.
- Not run: Protected CI, repo-owned ACA deploy, runtime invariant and signed-in answer acceptance. These remain required after publication.

## Rollout Plan

Open a PR, squash merge after protected checks pass and deploy using the repo-owned ACA main workflow. Validate runtime images and the signed-in advisor independently.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: That workflow only.
- Approved image digest: Resolve from the exact merge SHA and capture in deployment proof.
- ACA runtime invariant: Template and healthy 100% traffic revision must match the approved digest.
- Worker image invariant: All required jobs derived from the repo-owned script must match.
- Feature/env flag update path: No change.
- Live signed-in proof required: Concise cited answers, source identity and relevant follow-up questions.

## Rollback Plan

Revert through a PR and the same main workflow. No data rollback is needed.

## Audit Evidence

PR diff, regression results, provider metadata validation, protected checks, exact-SHA deployment and private browser proof.

## Known Gaps

Schema acceptance is not answer-quality proof. Live generation must still pass citation, semantic and presentation guards. The broader Home failures are reproduced on clean base and are not repaired here. Data refresh, other-module integration and charter binding repair remain outside this change.
