# Agent dock structured response rendering

## Release ID

`2026-09-19-agent-dock-structured-parts-rendering`

## Status

`candidate`

## Plain-English Summary

The shared agent dock now renders structured response parts instead of fallback
assistant prose. Tables, metrics, charts, citations, and next actions therefore
remain visible without duplicating a second answer when a caller supplies them
through the dock's documented message contract.

## Layer Impact

`global-control-lane`, product presentation layer only. No source data,
canonical objects, read models, schema, retrieval policy, or model prompting
changed.

## Client Applicability

- All clients using the shared agent dock.
- No client-specific behavior or data.

## Changes Included

- Render `ChatMessage.parts` through the existing shared
  `AgentResponseParts` component.
- Add behavior coverage for a structured table and the plain-message path.
- Run the focused behavior suite in the existing coverage workflow.

## QA / Validation

- Focused agent-dock structured-parts test: pass.
- Existing structured-parts behavior in the agent-dock suite: pass.
- TypeScript: pass.
- Focused ESLint: pass with one pre-existing hook-dependency warning in the
  shared dock; no errors.
- Release-control check: pass after this record is validated.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutation outside that workflow: prohibited.
- Runtime image: digest-pinned by the deploy workflow.
- Runtime invariant proof: required before calling the change deployed.
- Signed-in acceptance: required before calling the behavior live-proven.

## Rollout Plan

Squash-merge through the protected main branch. The repo-owned ACA main deploy
workflow performs the shared runtime rollout.

## Rollback Plan

Revert this PR through the protected main branch. No data rollback is needed.

## Audit Evidence

The PR checks, release record, exact merge SHA, and ACA runtime proof are the
release evidence. Signed-in acceptance remains separate from deployment proof.

## Known Gaps

This change renders the structured parts supplied by callers. It does not add
new response-part types or change how callers construct governed answers.
