# 2026-06-28-moves-p3-future-state-blueprint-draft — Moves P3 Future-State Blueprint Draft

## Release ID

`2026-06-28-moves-p3-future-state-blueprint-draft`

## Status

`candidate`

## Plain-English Summary

Moves can now generate a P3 Future-State Blueprint draft after a P2 diagnostic is approved for P3 draft shaping. The draft stays honest: it carries forward P2 caveats, does not mark P2 or P3 final, compares future-state options when no final option has been selected, and positions client/delivery teams as the owners of detailed implementation.

## Layer Impact

- `global-control-lane`: Updates shared Moves artifact generation, prompt binding, visual contract, quality gate, and async generation routing for all tenants.
- `client-data-lane`: No schema or tenant data changes. Live proof will use existing tenant-scoped Move data and artifact persistence.

## Client Applicability

- All clients: Yes, for Moves P3 `target_state_architecture` draft generation.
- Specific clients: None hardcoded.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- P3 `target_state_architecture` draft requests now queue through the premium Moves artifact worker path.
- P3 draft architecture generation can proceed without a final `chosenOption`, but final architecture still requires an approved option.
- The P3 prompt now requires the Future-State Blueprint draft boundary, P2 caveat carry-forward, human + AI role model, control model, workflow options, implementation work packages, open decisions, and P4 readiness checklist.
- The visual artifact contract and golden-bar completion safety net require the P3 blueprint exhibits.
- P2 evidence specificity is promoted into P3 context so P3 can use the approved diagnostic metrics and caveats.

## QA / Validation

- PASS: Focused Jest for generation, prompt/visual contract, route queueing, worker processing, and solution-context assembly.
- PASS: Focused ESLint on touched files.
- PASS: `npm run release:check` after this release record update.
- NOT-RUN: Live signed-in proof on the Lakeshore Move; this is required after merge and ACA deploy.

## Rollout Plan

Merge to `main`, build a digest-pinned Azure Container Apps image, deploy to `ca-abarva-web-lab-eastus`, assign 100% traffic to the healthy revision, then prove the P3 draft with the private operator job lane and signed-in browser/API checks.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main lane.
- Shared runtime mutators: Moves artifact generation route, prompt factory, generation keystone, private worker.
- Approved image digest: To be recorded after deployment.
- ACA runtime invariant: `app.abarva.ai` runs through ACA, not Vercel.
- Worker image invariant: Private operator job must use the deployed image for heavy P3 generation.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this release and redeploy the prior ACA image. No destructive migration or tenant data changes are included.

## Audit Evidence

To be added after validation: PR URL, commit SHA, ACA revision, image digest, focused test output, release-check output, P3 run ID, artifact IDs, DOCX/HTML proof, golden-bar result, and wrong-tenant negative proof.

## Known Gaps

Live P3 generation and browser proof are pending until the candidate is merged and deployed.
