# 2026-07-14-moves-context-extract-evidence-alignment — Moves Context Extract Evidence Alignment

## Release ID

`2026-07-14-moves-context-extract-evidence-alignment`

## Status

`candidate`

## Plain-English Summary

Approve & Build already created a Move Context Extract, but live Meridian proof showed the extract did not list the uploaded Move evidence rows that readiness and generation were using. This release aligns the extract with Move-scoped uploaded evidence so the File Cabinet artifact shows attached evidence instead of `None` when eligible evidence is already present.

## Layer Impact

- `global-control-lane`: shared Moves Approve & Build behavior for all clients.
- Moves evidence layer: reads current Move-scoped `program_evidence_items` for the active tenant and attaches eligible uploaded evidence into the Move Context Extract.
- Moves generation guardrail: generation skips the context-extract summary row so deliverables do not self-cite the extract as a new source.
- File Cabinet artifact: markdown now shows attached evidence count, evidence family coverage, lineage, and source references.

## Client Applicability

- All clients: yes, for Moves Approve & Build.
- Specific clients: verified target is Meridian Health smoke; logic is tenant-scoped and shared.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/move-context-extract.ts`
- `src/lib/programs/__tests__/move-context-extract.test.ts`
- `src/lib/deliverables/orchestrator/evidence-assembler.ts`
- `scripts/audit/moves-context-extract.mjs`

## QA / Validation

Completed before PR:

- Pass: `npm run test:moves-context-extract`
- Pass: `npm run audit:moves-context-extract`
- Pass: targeted ESLint for changed runtime/test files
- Pass: `npm run audit:active-candidate-separation`
- Pass: `npm run audit:tenant-isolation:moves`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `git diff --check`

Pending after deploy:

- Controlled signed-in Meridian or SkyHarbor workflow smoke.

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the exact merged SHA, then run a signed-in disposable Move smoke to prove the extract attaches uploaded evidence and preserves candidate exclusion.

## Deployment Authority

- Repo-owned deploy workflow: required for shared `app.abarva.ai` runtime.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending post-merge deploy.
- ACA runtime invariant: pending post-merge deploy.
- Worker image invariant: pending post-merge deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No migrations or data backfills are included.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4786
- Pre-fix proof: PR #4784, Meridian disposable Move `44f6f4d4-ab88-4fdf-88e8-45c26f27838c`.
- Post-fix proof: pending controlled signed-in smoke.

## Known Gaps

- Does not promote candidate data.
- Does not update Active Tenant Access.
- Does not change Home/module-context serving.
- Does not claim realized value or Tower outcomes.
