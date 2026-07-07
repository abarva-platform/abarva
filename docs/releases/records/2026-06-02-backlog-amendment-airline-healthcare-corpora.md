# 2026-06-02-backlog-amendment-airline-healthcare-corpora — Airline + Healthcare Corpus Backlog Amendment

## Release ID

`2026-06-02-backlog-amendment-airline-healthcare-corpora`

## Status

`candidate`

## Plain-English Summary

Adds a planning amendment to the Codex master backlog for Codex-authored airline and healthcare corpus expansion. The amendment defines scope, quality guardrails, provenance tagging expectations, validation gates, and future customer custom-pattern authoring as a revenue-capable product direction.

## Layer Impact

- `internal-admin`: Adds internal execution guidance and planning control for future corpus work.
- `client-data-lane`: No client data changes in this release; the amendment describes future corpus authoring and validation expectations only.

## Client Applicability

- All clients: No runtime change.
- Specific clients: Future planning references Apex Retail, Meridian Health, Northstar Clinical, First Capital, and SkyHarbor Air as validation boundaries.
- Internal only: The backlog amendment is an internal execution artifact.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `docs/build/CODEX_MASTER_BACKLOG_AMENDMENT_A_AIRLINE_HEALTHCARE_CORPORA.md`.
- Reconciles PR #2491 against current `main` by preserving newer canonical authority documents already on `main`.

## QA / Validation

- `git diff --check` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — required this release record; rerun after record addition.
- Manual conflict review preserved newer `main` versions of ADR-0001, Packet 31 amendments, and the Codex master backlog rather than reintroducing stale open-checkbox state.

## Rollout Plan

Merge to `main`. No migration, feature flag, deployment procedure, or runtime operator action is required.

## Rollback Plan

Revert the PR if the backlog amendment should be withdrawn. Because this is documentation only, rollback has no database or runtime dependency.

## Audit Evidence

- PR #2491.
- Release record and release-control check output.
- Post-merge main guardrails and post-deploy crawl, if merged.

## Known Gaps

The amendment is planning guidance only. It does not author or load the airline, healthcare-provider, or healthcare-medtech corpus content.
