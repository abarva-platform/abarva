# 2026-06-03-external-pen-test-readiness — External Pen Test Readiness Packet

## Release ID

`2026-06-03-external-pen-test-readiness`

## Status

`candidate`

## Plain-English Summary

Adds the internal readiness packet and operator runbook needed to schedule and
run AbarVa's first external penetration test in a controlled way. This change
does not complete the external penetration test and does not claim that a vendor
report exists.

## Layer Impact

- Release lane: `internal-admin`.
- `internal-admin`: gives AbarVa operators a controlled process for vendor
  selection, scope, rules of engagement, evidence handling, triage, closure, and
  customer-safe status wording.
- Security governance: documents the minimum test scope expected for auth,
  authorization, tenant isolation, upload handling, AI/agent surfaces, exports,
  Azure posture, secrets, and dependencies.

## Client Applicability

- All clients: no runtime behavior changes.
- Specific clients: none.
- Internal only: AbarVa security, founder, and operator workflows.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/security/EXTERNAL_PEN_TEST_READINESS_PACKET.md`
- `docs/runbooks/external-penetration-test.md`
- `scripts/security/verify-pen-test-readiness.mjs`
- `package.json` script: `security:pen-test-readiness:verify`

## QA / Validation

- PASS: `npm run security:pen-test-readiness:verify`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check origin/main...HEAD`

## Rollout Plan

Merge to `main` through the protected merge queue. No runtime rollout is
required because this is an internal-admin documentation and verification
change.

## Rollback Plan

Revert the PR to remove the readiness packet, runbook, verifier, package script,
and release record. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2951.
- CI: pending at PR open.
- Local QA: verifier, release check, and diff whitespace check before PR.

## Known Gaps

This release does not complete T031. T031 remains `In progress` until a vendor
is selected, rules of engagement are signed, testing is completed, a final
report is received, critical/high findings are fixed or accepted, and retest
evidence is recorded.
