# 2026-07-14-moves-context-extract-evidence-alignment — Moves Context Extract Evidence Alignment

## Release ID

`2026-07-14-moves-context-extract-evidence-alignment`

## Status

`live-proven`

## Plain-English Summary

Approve & Build already created a Move Context Extract, but live Meridian proof showed the extract did not list the uploaded Move evidence rows that readiness and generation were using. This release aligns the extract with Move-scoped uploaded evidence so the File Cabinet artifact shows attached evidence instead of `None` when eligible evidence is already present.

## Layer Impact

- `global-control-lane`: shared Moves Approve & Build behavior for all clients.
- Moves evidence layer: reads current Move-scoped `program_evidence_items` for the active tenant and attaches eligible uploaded evidence into the Move Context Extract.
- Moves generation guardrail: generation skips the context-extract summary row so deliverables do not self-cite the extract as a new source.
- File Cabinet artifact: markdown now shows attached evidence count, evidence family coverage, lineage, and source references.
- Runtime repair: the File Cabinet artifact now uses the live schema's `review_required` status value, and the phase route surfaces plain Postgres-compatible error objects instead of collapsing them to `unknown error`.

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
- `src/app/api/v1/deliverables/generate-phase/route.ts`
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

Post-deploy live proof:

- Pass: ACA main deploy run `29333716552` completed for merge SHA `879fa5117e43a487652929547eb8ac2a23fd498b`.
- Pass: runtime invariant on revision `ca-abarva-web-lab-eastus--m879fa511`; digest `sha256:77bc3367ee29d914cb0361a5afa903cf6385a00c8e6aa8e245b9aad856bf9128`; traffic 100%; health OK.
- Pass: signed-in Meridian disposable Move smoke created Move `238da83e-667f-470f-9d27-72ed07d75e69`.
- Pass: Move Context Extract created with artifact `26a34fff-db6c-4cb9-9238-7c2cb047296c` and evidence row `55661f1b-ea4c-4a76-8e10-a96c012f0805`.
- Pass: `attachedEvidenceItems` length 4, each with a populated evidence ID matching eligible uploaded Move evidence.
- Pass: File Cabinet artifact visible and downloadable; markdown has attached, suggested, excluded, and gaps sections.
- Pass: generated P1 charter run `e802a818-ac7a-4f40-8282-782baa48a56e` succeeded and retrieved 4 evidence items.
- Pass: candidate preview remained excluded by default; second run skipped existing extract instead of silently overwriting it.
- Note: first post-PR #4786 smoke found a runtime schema mismatch before PR #4787: `move_artifacts.status` accepted `review_required`, while the context extract attempted `needs_review`. Deliverable queueing still worked, but the context extract artifact was not written. PR #4787 fixed that mismatch and the post-fix smoke passed.

## Rollout Plan

Merge to `main`, allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the exact merged SHA, then run a signed-in disposable Move smoke to prove the extract attaches uploaded evidence and preserves candidate exclusion.

## Deployment Authority

- Repo-owned deploy workflow: required for shared `app.abarva.ai` runtime.
- Shared runtime mutators: none in this PR.
- Approved image digest: `sha256:77bc3367ee29d914cb0361a5afa903cf6385a00c8e6aa8e245b9aad856bf9128`.
- ACA runtime invariant: Pass, revision `ca-abarva-web-lab-eastus--m879fa511` at 100% traffic.
- Worker image invariant: Pass, worker jobs updated to the same digest-pinned image.
- Feature/env flag update path: none.
- Live signed-in proof required: completed.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No migrations or data backfills are included.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4786
- Runtime repair PR URL: https://github.com/abarva-platform/abarva/pull/4787
- Runtime repair merge SHA: `879fa5117e43a487652929547eb8ac2a23fd498b`
- ACA deploy run: https://github.com/abarva-platform/abarva/actions/runs/29333716552
- ACA deploy proof bundle: `/Users/anand/Projects/nexus-moves-ctx-fix/proof/aca-main-deploy-879fa511`
- Pre-fix proof: PR #4784, Meridian disposable Move `44f6f4d4-ab88-4fdf-88e8-45c26f27838c`.
- Failed post-PR #4786 deployed proof: `/Users/anand/Projects/nexus-moves-ctx-fix/proof/moves-ctx-proof-live-2026-07-14T12-27-16-555Z`; disposable Meridian Move `1e0d34aa-7f03-4c96-ad8d-91405efe5dfa`; readiness had four evidence rows, but no `move_context_extract_p1` artifact persisted because of the status schema mismatch.
- Post-fix live proof: `/Users/anand/Projects/nexus-moves-ctx-fix/proof/moves-ctx-proof-live-2026-07-14T12-51-53-625Z`; disposable Meridian Move `238da83e-667f-470f-9d27-72ed07d75e69`.

## Known Gaps

- Does not promote candidate data.
- Does not update Active Tenant Access.
- Does not change Home/module-context serving.
- Does not claim realized value or Tower outcomes.
