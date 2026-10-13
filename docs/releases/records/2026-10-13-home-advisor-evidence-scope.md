# Home Advisor Evidence Scope

## Release ID

`2026-10-13-home-advisor-evidence-scope`

## Status

`candidate`

## Plain-English Summary

Keep advisor answers within the evidence supplied by Home. Missing records do not establish enterprise absence, portfolio validation does not become enterprise-wide validation, and vendor allocation does not establish loss of internal control. Preserve legitimate evidence gaps without replacing them with unrelated supplier warnings.

## Layer Impact

Layer 4, Products: Home answer qualification, bounded presentation repair and shared narrative sanitization. Release lane: `global-control-lane`. No intake, adapter, canonical data, tenant rows or source-version changes.

## Client Applicability

- All clients: Authenticated Home advisor and existing Home narrative sanitization.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing controls remain unchanged.

## Changes Included

- Prompt and semantic guards require record-scoped absence statements and preserve financial population scope.
- Existing single repair stays within its original deadline; unsafe second answers are withheld while admitted citations remain available.
- Blanket contract-evidence absence is distinguished from partial coverage, unrelated approval gaps and unsupported causality.
- A contract-evidence correction does not claim a supplier-pair concentration conflict.

## QA / Validation

- Pass: Affected Home and narrative-integrity suites, Node 24 typecheck, focused ESLint and all 11 release checks.
- Pass: Independent bounded review; all four reproduced edge cases corrected with regressions.
- Fail, unchanged from clean base: The broader Home sweep has the same 26 failures across 11 suites, with 1,127 passing tests on this candidate; those suites are not repaired here.
- Not run: Protected checks, exact-SHA ACA deployment, runtime invariant and signed-in answer acceptance remain required after merge.

## Rollout Plan

PR-only squash merge after protected checks pass, then deployment through the repo-owned ACA main workflow. Verify the signed-in advisor independently; deployment success is not answer-quality proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: That workflow only.
- Approved image digest: Resolve from the exact merge SHA and save in private deployment proof.
- ACA runtime invariant: Template and healthy 100% traffic revision must match the approved digest.
- Worker image invariant: All jobs required by the repository invariant must match.
- Feature/env flag update path: No change.
- Live signed-in proof required: Concise cited answers, bounded evidence gaps, source identity and follow-up questions.

## Rollback Plan

Revert through a PR and deploy through the same main workflow. No data rollback is required.

## Audit Evidence

PR diff, focused regression results, protected checks, exact-SHA deployment, private runtime invariant and signed-in smoke evidence.

## Known Gaps

This is answer-quality correction, not canonical data refresh, complete enterprise coverage, cross-module integration, full visual PDF parity or charter-binding repair. Missing evidence and unverified provenance remain visible.
