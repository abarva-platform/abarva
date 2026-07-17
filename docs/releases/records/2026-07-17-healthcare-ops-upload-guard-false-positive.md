# 2026-07-17-healthcare-ops-upload-guard-false-positive — Healthcare Ops Upload Guard False Positive

## Release ID

`2026-07-17-healthcare-ops-upload-guard-false-positive`

## Status

`candidate`

## Plain-English Summary

Fixes a live Moves proof blocker where de-identified healthcare operations evidence for Agent Assist was quarantined as PHI because the MRN detector treated ordinary phrases like "member service" as a member identifier. The guard still quarantines actual patient/member identifier labels such as "Patient ID: MH123456" or "Member ID: ABC12345"; it no longer blocks business-process evidence just because it uses healthcare operations vocabulary.

## Layer Impact

- `global-control-lane`: updates shared pre-ingest sensitive upload scanning behavior used by product upload routes. No schema, tenant data, candidate promotion, or evidence lifecycle behavior is changed.

## Client Applicability

- All clients: yes, for upload guard behavior.
- Specific clients: Meridian Health Agent Assist proof exposed the false positive.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/security/preingest-sensitive-scanner.ts`
- `src/lib/security/__tests__/preingest-sensitive-scanner.test.ts`
- `src/lib/security/__tests__/sensitive-upload-guard.test.ts`

## QA / Validation

- Pass: focused sensitive scanner and upload guard tests.
- Pass: eslint on changed files.
- Pass: TypeScript check.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.
- Not-run: signed-in Meridian upload retry after deploy.

## Rollout Plan

Merge through PR to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the image, then retry the signed-in Meridian P1 evidence upload smoke on the disposable Move.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by ACA main deploy after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: no worker image change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR. The old conservative MRN detector returns, with the known risk that de-identified healthcare operations uploads are falsely quarantined.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4924
- Deploy proof: pending.
- Browser proof: pending.

## Known Gaps

- This does not weaken declared regulated PHI/PII handling and does not change upload approval, evidence readiness, generation, or Tower handoff behavior.
