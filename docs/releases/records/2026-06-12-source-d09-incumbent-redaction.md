# 2026-06-12-source-d09-incumbent-redaction — Source D09 Incumbent Name Hygiene

## Release ID

`2026-06-12-source-d09-incumbent-redaction`

## Status

`candidate`

## Plain-English Summary

The SkyHarbor Source D09 RFP package now removes raw incumbent/provider names from the client-facing generated body before quality review and persistence. The RFP can still discuss incumbent exit risk and contract constraints, but it uses neutral labels such as `Incumbent Provider A` and `Incumbent Provider B` instead of exposing source names in the vendor-facing package.

## Layer Impact

- `client-data-lane`: updates the governed Source D09 artifact-generation path. It changes generated client-facing artifact text only; it does not change source evidence, database schema, migrations, or tenant routing.

## Client Applicability

- All clients: any client using the governed Source D09 RFP generation path receives the name-hygiene guard.
- Specific clients: live proof target remains SkyHarbor.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Updates `src/lib/source/agent-generation/d09-completion.ts` to sanitize D09 client-facing body text before completion appendices and quality review.
- Extends `src/lib/source/agent-generation/__tests__/d09-completion.test.ts` with incumbent-name redaction coverage.

## QA / Validation

- PASS: `npx jest src/lib/source/agent-generation/__tests__/d09-completion.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/agent-generation/__tests__/quality-review.test.ts src/lib/deliverables/quality/__tests__/consulting-grade-rubric.test.ts --runInBand`
- PASS: `npx eslint src/lib/source/agent-generation/d09-completion.ts src/lib/source/agent-generation/__tests__/d09-completion.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- NOT RUN YET: live SkyHarbor Source crawl after Azure deployment. Completion requires that crawl to pass.

## Rollout Plan

Merge to main, build a new Azure Container Apps image, shift traffic to the new revision after health checks pass, then rerun the SkyHarbor Source self-healing crawl against `https://app.abarva.ai`.

## Rollback Plan

Revert this release if the sanitizer removes required client-facing text. Fastest operational rollback is redeploying the prior healthy Azure Container Apps image.

## Audit Evidence

- PR and CI checks for this release candidate.
- Azure Container Apps image/revision smoke after deploy.
- SkyHarbor Source self-healing crawl report and HAR after deploy.

## Known Gaps

This is a narrow D09 name-hygiene guard. Broader Source label mapping and document-generation policy work remains a follow-up lane.
