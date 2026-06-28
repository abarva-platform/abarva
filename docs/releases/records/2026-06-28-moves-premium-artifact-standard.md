# 2026-06-28 Moves Premium Artifact Standard

## Release ID

`2026-06-28-moves-premium-artifact-standard`

## Status

`candidate`

## Plain-English Summary

Strategic Moves artifact generation now has a durable product standard and a shared prompt contract for premium P1/P2 artifacts. The change upgrades Move Charter and Discovery Diagnostic generation from a compact visual prompt into a consulting-grade assignment with phase-specific sections, evidence-bound writing rules, draft/final caveats, target depth, and substance checks. Review/regenerate now asks for a complete revised artifact using the prior artifact body and feedback, rather than a short patch note.

## Layer Impact

- `global-control-lane`: shared Moves artifact prompt construction, quality gate behavior, and review/regenerate route behavior change for all clients using the Strategic Moves generation path.
- `runtime-app-lane`: Claude model calls receive artifact-specific token budgets and richer instructions for P1/P2 artifacts.

## Client Applicability

- All clients: yes, for Strategic Moves artifact generation.
- Specific clients: no tenant-specific code.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- New doctrine doc: `docs/design/strategic-moves/ARTIFACT_GENERATION_STANDARD.md`
- Prompt-quality audit: `docs/design/strategic-moves/ARTIFACT_PROMPT_QUALITY_AUDIT_20260628.md`
- New executable standard module: `src/lib/deliverables/strategic-moves-artifact-standard.ts`
- Prompt factory upgraded for Strategic Moves premium artifact brief.
- `generateArtifact` now passes artifact metadata and artifact-specific token budgets to the governed model call.
- Golden-bar can enforce minimum depth and forbidden internal language for P1/P2.
- Review/regenerate route now downloads the prior artifact body and calls Claude to produce a complete regenerated HTML artifact.
- Tests updated for prompt, depth, forbidden language, and complete regeneration.

## QA / Validation

- PASS: Focused Jest for deliverable prompt/golden-bar/generate-artifact/review-regenerate tests.
- PASS: Scoped ESLint on changed TypeScript files.
- PASS: `npm run release:check`.
- BLOCKED: Full `npx tsc --noEmit --pretty false` after rerun with larger heap reports pre-existing missing dependency declarations/packages (`js-yaml`, `@azure-rest/ai-document-intelligence`, `@axe-core/playwright`); no changed-file type errors remain.

## Rollout Plan

Merge to `main`, build the Azure Container Apps image from the merge SHA, deploy through the approved ACA main lane, then prove generation with a signed-in Moves P1/P2 draft run before treating this as live-quality complete.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy path.
- Shared runtime mutators: none beyond normal application deploy.
- Approved image digest: pending deploy.
- ACA runtime invariant: deploy to `ca-abarva-web-lab-eastus`, not Vercel.
- Worker image invariant: no worker image change.
- Feature/env flag update path: no new env flag.
- Live signed-in proof required: yes, for old/new P1/P2 comparison and review/regenerate proof.

## Rollback Plan

Revert this release commit or roll back the ACA revision to the prior image. No migration or data-plane destructive change is included.

## Audit Evidence

- This release record.
- Prompt standard and audit docs.
- Focused test output.
- PR and CI output once opened.
- Live proof bundle after deploy/generation.

## Known Gaps

- P3/P4/P5 phase-specific premium prompts are documented but not fully upgraded in this slice by design.
- Live P1/P2 artifact regeneration and File Cabinet proof still need to run after deployment.
