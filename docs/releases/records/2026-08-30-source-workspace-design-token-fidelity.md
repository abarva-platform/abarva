# 2026-08-30-source-workspace-design-token-fidelity — Source Workspace Design Token Fidelity

## Release ID

`2026-08-30-source-workspace-design-token-fidelity`

## Status

`candidate`

## Plain-English Summary

The Source workspace now uses the supplied Source 360 design contract palette instead of the colder blue-gray dashboard palette. The update keeps the existing information architecture and changes only the visual theme tokens used by the Source workspace shell, panels, tabs, tables, graph lanes, and vendor summary.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: updates Source workspace CSS presentation only. No source adapters, canonical facts, cubes, tenant rows, retrieval corpus, or data-build jobs change.

## Client Applicability

- All clients: Source workspace users receive the warmer Source 360 visual treatment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing route/provider behavior is unchanged.

## Changes Included

- Aligns workspace background, rail, text, borders, cards, tables, hover states, active tabs, graph lanes, and vendor summary with the Source 360 design contract color family.
- Uses warm off-white page surfaces, white panels, stone borders, charcoal/black primary text and selected controls, green readiness accents, and amber caution/opportunity accents.
- Removes the cold blue shell, bright-blue selected states, and blue-gray borders from the Source workspace v2 surface.

## QA / Validation

- Pass: CSS token scan confirms prior cold-blue Source workspace tokens are no longer present in `workspace.css`.
- Pass: `npm test -- --runInBand --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'`
- Pass: `git diff --check`
- Pass: `npm run release:check`
- Not-run: signed-in Source workspace proof after deployment.

## Rollout Plan

Open a PR, merge through the protected repository workflow, and let the repo-owned Azure Container Apps main deploy workflow build and deploy the resulting main SHA.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Resolved by the deploy workflow.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for the Source workspace visual token surface.

## Rollback Plan

Revert the PR and redeploy main through the repo-owned Azure Container Apps workflow. No data rollback is required.

## Audit Evidence

PR, CI checks, ACA deploy run, CSS token scan, and signed-in Source workspace proof after deployment.

## Known Gaps

This release aligns the Source workspace palette and surface treatment. It does not claim pixel-perfect layout fidelity for every card until screenshot-based visual comparison is available.
