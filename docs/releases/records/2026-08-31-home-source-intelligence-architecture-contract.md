# 2026-08-31-home-source-intelligence-architecture-contract — Home Source Intelligence Architecture Contract

## Release ID

`2026-08-31-home-source-intelligence-architecture-contract`

## Status

`candidate`

## Plain-English Summary

Promotes the Home source-intelligence execution directive and the customer-private data-plane boundary into repository-owned architecture documents. This prevents local handoff files from acting as the only source of truth for how Home content should be generated and how customer source data must be processed.

## Layer Impact

- `global-control-lane`: updates shared engineering instructions and architecture documentation.
- Layer 1 Client Intake: clarifies that repo-baked files are a synthetic-demo shortcut, not the client architecture.
- Layer 2 Source Adapters: requires source-intelligence digests to read complete source files with hash, schema fingerprint, provenance, and verifier output.
- Layer 4 Products: establishes that Home pages must consume source-intelligence outputs through governed ECL/projection paths rather than shallow page summaries.

## Client Applicability

- All clients: yes, as an architecture and agent-execution rule.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `AGENTS.md`: adds the client data-plane boundary to the startup instructions.
- `docs/architecture/CLIENT_DATA_PLANE_ARCHITECTURE.md`: records the demo path versus the required customer-private data-plane path.
- `docs/architecture/HOME_SOURCE_INTELLIGENCE_EXECUTION_DIRECTIVE_2026_08_31.md`: records the Home source-intelligence execution directive.

## QA / Validation

- PASS: public-repo hygiene scan over the new architecture docs for private design URLs and personal approval wording.
- PASS: `npm run release:check` before commit.

## Rollout Plan

Squash merge through a pull request to `main`. No runtime deployment, data migration, data load, route change, or traffic shift is required for this documentation/control change.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no.

## Rollback Plan

Revert the pull request if the architecture directive conflicts with an approved successor document.

## Audit Evidence

- Pull request URL and CI/release-control output.
- Diff for the two architecture docs and `AGENTS.md`.

## Known Gaps

This release records the contract only. It does not yet build the per-source-file digest generator, verifier, page sufficiency gate, or refreshed Home page outputs.
