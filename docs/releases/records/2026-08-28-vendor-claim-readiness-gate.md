# Release Record — Vendor Claim Readiness Gate

## Release ID

`2026-08-28-vendor-claim-readiness-gate`

## Status

Candidate.

## Plain-English Summary

Client-facing deliverables may mention named vendor platforms, but a platform
capability claim must also say what evidence state it is in. The readiness
scanner now blocks a named-vendor capability claim when the surrounding text
does not label it as vendor-published context, contract-confirmed,
implementation-confirmed, client-observed, or another client-evidence state.

This keeps public vendor intelligence separate from client truth when a
deliverable is signed off.

## Layer Impact

Layer 4 (Products — Moves deliverable sign-off readiness scanner). The change
extends the existing client-readiness scanner and therefore applies to HTML,
DOCX, and PPTX text that reaches the sign-off gate. No Layer 1, Layer 2,
Layer 3, tenant data, registry activation, or data-plane write is included.

## Client Applicability

- All clients: yes, through the shared Moves sign-off scanner.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/shared/client-readiness-scan.ts` adds a blocker for
  named-vendor capability claims that lack an evidence-state label.
- `src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts` adds
  positive and negative tests for the new rule.

## QA / Validation

Focused validation:

- `npm test -- --runInBand src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts src/lib/deliverables/shared/__tests__/client-readiness-gate.test.ts 'src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/__tests__/route.test.ts'` — pass, 67/67.
- `npx eslint src/lib/deliverables/shared/client-readiness-scan.ts src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts` — pass.

Full validation is required before merge.

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
- Live signed-in proof required: not required; this is a sign-off gate behavior
  covered by route/unit tests unless a release owner asks for browser proof.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow redeploy. No
migration or tenant data rollback is required.

## Audit Evidence

Audit evidence is the PR diff, focused test output, release check, CI, and the
post-merge ACA deployment record.

## Known Gaps

- The scanner only evaluates text that reaches the sign-off readiness path.
  It does not prevent a draft from being generated.
- The rule is intentionally narrow: ordinary vendor mentions without platform
  capability claims are not blocked.
- The vendor intelligence registry remains scaffold-only until separately
  wired into generation.
