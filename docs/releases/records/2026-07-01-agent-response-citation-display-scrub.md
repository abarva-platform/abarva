# 2026-07-01-agent-response-citation-display-scrub — Agent Citation Display Scrub

## Release ID

`2026-07-01-agent-response-citation-display-scrub`

## Status

`candidate`

## Plain-English Summary

Agent answer citation cards now display business-facing source labels instead of
raw Source segment/table identifiers. This keeps the audit metadata available in
the API while preventing user-visible answer panels from showing labels like
`source_events` or internal segment prefixes.

## Layer Impact

- `global-control-lane`: Updates the shared agent response renderer used by
  Source and other agent surfaces that display structured citation cards.
- No data-plane migration.
- No model or retrieval behavior change.

## Client Applicability

- All clients: Shared agent citation renderer.
- Specific clients: SkyHarbor/Airline Demo Source BAFO proof is the live proof
  tenant for this candidate.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds display-only formatting for citation labels and source names in
  `src/components/agent/AgentResponseParts.tsx`.
- Adds a renderer regression proving Source BAFO citations render as
  business-facing evidence labels and do not expose raw `source_events` or
  `Sourcing Artifacts` text.

## QA / Validation

- `npx jest src/components/agent/__tests__/AgentResponseParts.test.tsx src/lib/source/__tests__/source-answer-engine.test.ts --runInBand`:
  `pass`.
- `npx eslint src/components/agent/AgentResponseParts.tsx src/components/agent/__tests__/AgentResponseParts.test.tsx src/lib/source/source-answer-engine.ts src/lib/source/__tests__/source-answer-engine.test.ts`:
  `pass`.
- `npm run release:check`: `pass`.
- PR CI: `not run` until PR creation.
- ACA main deploy: `not run` until merge to `main`.
- Signed-in Source browser/API proof: `not run` until ACA deploy completes.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy
workflow, wait for a healthy revision and 100% traffic, then rerun the signed-in
Source proof against the SkyHarbor/Airline Demo response stage.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy`
- Shared runtime mutators: Azure Container Apps main lane only
- Approved image digest: Captured after deploy
- ACA runtime invariant: Required
- Worker image invariant: Required by deploy workflow
- Feature/env flag update path: None
- Live signed-in proof required: Yes

## Rollback Plan

Revert this PR and redeploy through the ACA main lane. Since this is a
non-destructive renderer-only release with no migration, rollback does not
require data repair.

## Audit Evidence

- PR URL: to be filled after PR creation
- CI checks: to be filled after PR validation
- ACA deploy run: to be filled after deploy
- Signed-in proof package: to be saved under `/Users/anand/Downloads/`

## Known Gaps

This change formats visible citation labels only. It intentionally does not
remove raw metadata from the authenticated API payload, where it remains useful
for audit and debugging.
