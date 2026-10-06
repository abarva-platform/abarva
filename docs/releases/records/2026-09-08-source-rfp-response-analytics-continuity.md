# 2026-09-08-source-rfp-response-analytics-continuity — Preserve RFP-to-decision traceability

## Release ID

`2026-09-08-source-rfp-response-analytics-continuity`

## Status

`candidate`

## Plain-English Summary

Source-generated RFPs and vendor response instructions now require stable requirement identifiers, normalized response categories, evidence and commercial linkages, and evaluation criterion identifiers. Downstream completeness and scorecard prompts must preserve those identifiers so an operator can trace a score, exception, price impact, or negotiation question back to the requirement issued to the vendor.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source: strengthens generated artifact instructions for the RFP, vendor response workbook, response-completeness report, and evaluation scorecard.
- No Layer 1, Layer 2, or Layer 3 data shape changes. No schema or migration changes.

## Client Applicability

- All clients: yes, for newly generated Source artifacts after deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`
- `src/lib/source/agent-generation/__tests__/prompt-registry.test.ts`

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/prompt-registry.test.ts --runInBand` — PASS, 47 tests.
- `npx eslint src/lib/source/agent-generation/prompt-registry.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — PASS.
- `git diff --check` — PASS.

## Rollout Plan

Merge by pull request, then use the repo-owned ACA main deploy workflow. Newly generated artifacts use the revised prompt versions; existing persisted artifacts are not rewritten automatically.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: the repo-owned main deploy workflow only.
- Approved image digest: captured by the deploy workflow after merge.
- ACA runtime invariant: required before declaring deployed.
- Worker image invariant: both delivery workers must match the approved web digest.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: generate and inspect the RFP and response-control artifacts on an approved synthetic event.

## Rollback Plan

Revert the prompt-registry commit through a pull request and redeploy the resulting main SHA. Existing artifact versions remain auditable and are not mutated by code rollback.

## Audit Evidence

- Pull request and merge SHA.
- Focused Jest, ESLint, TypeScript, and release-check output.
- ACA deploy artifact with digest, revision, traffic, health, and worker-image proof.
- Signed-in generated-artifact inspection on an approved synthetic event.

## Known Gaps

The prompt contract cannot prove vendor submissions are structurally complete until response files are uploaded and parsed. Downstream artifacts must continue to fail closed when those inputs are absent.
