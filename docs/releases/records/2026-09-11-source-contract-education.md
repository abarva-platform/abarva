# Source Contract 360 Education Tab

## Release ID

`2026-09-11-source-contract-education`

## Status

`candidate`

## Plain-English Summary

Contract 360 now includes an Education tab for every selected contract. The tab explains the contract archetype and gives the owner a practical operating loop: what to track, what evidence to load, and what to observe before the next commercial decision. The guide is deterministic and evidence-bounded; it does not create savings, benchmark, or service claims.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no new source facts are created. The guide reads the declared archetype and the existing governed evidence counts.
- Layer 4 product projection: adds an Education contract tab and a deterministic archetype guide with explicit loaded/next states.

## Client Applicability

- All clients using the Source Contract 360 surface.
- No tenant-specific exception or feature flag.

## Changes Included

- Adds the Education tab to Contract 360 navigation and tab state validation.
- Adds archetype-aware guides for cloud consumption, managed services, software subscriptions, and an honest unmapped fallback.
- Adds behavioral tests for cloud, managed-services, and unmapped contracts.

## QA / Validation

- `npm test -- --runInBand src/lib/source/contract-intelligence/__tests__/education.test.ts` — 3/3 passed.
- `npm test -- --runInBand --runTestsByPath src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx` — 53/53 passed.
- `npx tsc --noEmit` — passed.
- Targeted ESLint — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge through the protected main branch, build and deploy through the repo-owned Azure Container Apps workflow, prove the runtime image invariant, then run signed-in Contract 360 smoke checks on representative cloud-consumption and managed-services contracts.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this candidate.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: required before claiming live proof.
- Worker image invariant: required before claiming live proof.
- Live signed-in proof required: yes, including Education tab navigation and contract-specific loaded/next states.

## Rollback Plan

Revert the product commit through a protected PR and redeploy the prior approved digest. No data migration or source-data rollback is required.

## Audit Evidence

The PR, focused Jest output, TypeScript output, ESLint output, release record, ACA deployment run, runtime invariant check, and signed-in tab smoke evidence.

## Known Gaps

- This candidate does not add missing source files. Cloud-consumption contracts still show the honest evidence boundary when document-page or performance rows are absent.
- Moving archetype coaching content into a separately persisted Layer 4 education view can follow if the product requires independent review/versioning of the guide text; the current guide is deterministic code, not model-generated output.
