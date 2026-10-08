# 2026-10-08 Architecture Export Identity Gate

## Release ID

`2026-10-08-architecture-export-identity-gate`

## Status

`candidate`

## Plain-English Summary

Architecture decks now identify each embedded diagram by its governed exhibit key and fail export when an expected diagram or its decision interpretation is missing. Flow visuals identify the recorded flow items they display and refuse to truncate a larger flow set silently.

## Layer Impact

`global-control-lane`. Layer 4, Products: shared deliverable presentation and export quality checks. The canonical model and exhibit data contract are unchanged.

## Client Applicability

- All clients: Architecture decks generated through the shared renderer.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

Architecture image names and accessible descriptions, exported-key inspection, interpretation checks, visible-flow identity markers, and overflow refusal. No schema, loader, or tenant data changes.

## QA / Validation

- Pass: architecture PPTX and composition suites; architecture HTML renderer suite.
- Pass: `npm run typecheck`, ESLint, Prettier, and coverage census.
- Pass: `npm run release:check` after this record's validation fields are complete.
- Not run: signed-in export and runtime invariant; those follow deployment.

## Rollout Plan

Squash merge the controlled PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned image. Verify the runtime invariant and a signed-in synthetic architecture export before marking the release live-proven.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: The workflow only.
- Approved image digest: To be recorded after deployment.
- ACA runtime invariant: Template, 100% traffic revision, and required workers must match the approved digest.
- Worker image invariant: To be verified after deployment.
- Feature/env flag update path: No flag or environment update.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and deploy the resulting `main` SHA through the approved workflow. Do not hand-shift shared traffic.

## Audit Evidence

PR and CI links, local test output, the rendered PPTX identity inspection, deploy run, runtime digest readback, and signed-in export review will be attached as each state is reached.

## Known Gaps

Flow visuals currently fit at most eight recorded flows; a larger set fails export until a reviewed multi-page composition is available. A local export is not signed-in product proof.
