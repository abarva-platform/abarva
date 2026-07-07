# 2026-06-16-source-section-heading-normalization — Source Section Heading Normalization

## Release ID

`2026-06-16-source-section-heading-normalization`

## Status

`candidate`

## Plain-English Summary

Source generated documents now normalize exact required section labels into proper markdown headings before section verification, rendering, persistence, and download. This prevents a valid executive summary or scope section from being marked incomplete only because the model wrote the section label as plain text instead of `## Executive summary`.

## Layer Impact

- `global-control-lane`: Source artifact generation and verification behavior changes for all clients using generated Source documents.
- Client-facing artifact quality: Generated drafts keep the same section-quality gate, but the gate now accepts business-readable section labels that match the required section names.

## Client Applicability

- All clients: Yes, for Source generated artifacts that use section verification.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `normalizeRequiredSectionHeadings` to the Source section-conformance helper.
- Calls the normalizer before `verifyArtifactSections` in the Source artifact generation route.
- Adds regression tests for plain-text required section labels and non-duplication of existing markdown headings.

## QA / Validation

- Pass: `npx jest src/lib/source/agent-generation/__tests__/section-conformance.test.ts src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts --runInBand`
- Pass: `npx eslint src/app/api/v1/source/ src/lib/source/agent-generation/section-conformance.ts src/lib/source/agent-generation/__tests__/section-conformance.test.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run test:behaviors`
- Pass: `node scripts/release-check.mjs --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to main, allow the Azure Container Apps main image workflow to build and deploy, then regenerate fresh Source D01/D05 artifacts in a disposable SkyHarbor event and verify DOCX download plus section-verification metadata.

## Rollback Plan

Revert this small route/helper commit. Existing generated artifacts remain intact because the change only affects future generation-time normalization and verification.

## Audit Evidence

- PR link once opened.
- CI/release-check output.
- Live ACA revision after deployment.
- Download-to-disk proof for regenerated D01/D05 DOCX files.

## Known Gaps

This remains deterministic AQ2 verification. AQ3 async quality generation through the orchestrator is still a follow-on phase and is not started by this change.
