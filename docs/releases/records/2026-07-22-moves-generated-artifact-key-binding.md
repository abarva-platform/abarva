# 2026-07-22-moves-generated-artifact-key-binding — Moves Generated Artifact Approval Key Binding

## Release ID

`2026-07-22-moves-generated-artifact-key-binding`

## Status

`candidate`

## Plain-English Summary

Generated Moves artifacts now persist the canonical deliverable type key that produced them. When a human accepts an AI-prepared artifact as client-approved, Nexus no longer guesses the deliverable slot from the generated title. This prevents a Root Cause worksheet with a generic Discovery title from being approved into the Discovery Report slot.

## Layer Impact

- `global-control-lane`: Updates shared Moves artifact persistence and client-approval routing for all tenants using generated Move artifacts.
- `runtime-governance`: Improves the governed bridge from `generated_artifacts` AI drafts into authoritative `deliverables_v2` rows.

## Client Applicability

- All clients: yes, for Moves generated-artifact approval behavior.
- Specific clients: live proof will use the First Capital FS Demo sandbox Move only.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; this is a correctness fix for the existing approval contract.

## Changes Included

- Persist `deliverableTypeKey`, `deliverableType`, and `registryKey` metadata with generated artifacts.
- Persist the same key inside `metadata.renderableDoc` for download and approval consumers.
- Prefer canonical metadata in the client-approval route and make root-cause title fallback beat generic discovery fallback.
- Add regression coverage for metadata-based root-cause approval when the title contains Discovery language.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/deliverables/orchestrator/__tests__/persistence.test.ts 'src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/__tests__/route.test.ts' --runInBand` — 2 suites, 11 tests passed.
- Pass: `npx eslint src/lib/deliverables/orchestrator/persistence.ts 'src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/route.ts' src/lib/deliverables/orchestrator/__tests__/persistence.test.ts 'src/app/api/v1/programs/[programId]/artifacts/[artifactId]/client-approval/__tests__/route.test.ts' docs/releases/records/2026-07-22-moves-generated-artifact-key-binding.md` — code lint passed; release Markdown is intentionally ignored by ESLint.
- Pass: `npm run release:check`.
- Pass: `git diff --check`.

Post-deploy live proof will use the sandbox First Capital Move only and will verify separate client-approval responses for `discovery_report` and `root_cause_worksheet`.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image to `ca-abarva-web-lab-eastus`. After deploy, verify the ACA runtime invariant, then run signed-in browser/API proof on the sandbox Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not directly changed.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, sandbox Move client-approval proof.

## Rollback Plan

Revert the PR and redeploy the previous healthy ACA image through the repo-owned workflow. Existing generated artifacts remain readable; approval for newly generated artifacts reverts to the older title-inference behavior.

## Audit Evidence

- PR URL: pending.
- CI/checks: pending.
- ACA runtime invariant proof: pending.
- Live proof bundle: `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/70-artifact-key-binding-runtime` after deploy.

## Known Gaps

- Existing generated artifacts created before this release may lack canonical deliverable metadata and still depend on fallback inference. New generation after this release is the proof target.
