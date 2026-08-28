# Release Record — Vendor Claim Readiness Tightening

## Release ID

`2026-08-28-vendor-claim-readiness-tightening`

## Status

Candidate.

## Plain-English Summary

The vendor-claim sign-off guard is tightened to reduce false positives while
preserving the client-truth boundary. A named-vendor capability claim can now
clear the guard when it carries inline source attribution with retrieval/source
context. Multi-word product-family names are matched case-sensitively, so
ordinary lowercase prose does not become a blocking product claim.

## Layer Impact

Layer 4 (Products — Moves deliverable sign-off readiness scanner). This only
changes scanner behavior at the existing sign-off gate. No tenant data,
canonical data, registry activation, data-plane write, or migration is included.

## Client Applicability

- All clients: yes, through the shared Moves sign-off scanner.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/shared/client-readiness-scan.ts` accepts inline vendor
  source attribution and uses case-aware product-term matching.
- `src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts` adds
  regression coverage for sourced claims, lowercase prose, and distinctive
  product-name matching.

## QA / Validation

Focused validation:

- `npm test -- --runInBand src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts src/lib/deliverables/shared/__tests__/client-readiness-gate.test.ts 'src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/__tests__/route.test.ts'` — pass, 70/70.
- `npx eslint src/lib/deliverables/shared/client-readiness-scan.ts src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` — pass.

Full release control is required before merge.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow rolls out
the updated scanner with the application image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live proof.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not required; this is scanner behavior covered
  by focused route/unit tests unless a release owner requests browser proof.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow redeploy. No
migration or tenant data rollback is required.

## Audit Evidence

Audit evidence is the PR diff, focused test output, release check, CI, and the
post-merge ACA deployment record.

## Known Gaps

- The rule remains intentionally narrow and profile-driven.
- Inline attribution satisfies the boundary only when the text includes a known
  source host plus source/retrieval language.
