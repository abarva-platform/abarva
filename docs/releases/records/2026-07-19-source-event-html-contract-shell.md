# 2026-07-19-source-event-html-contract-shell — Source Event HTML Contract Shell

## Release ID

`2026-07-19-source-event-html-contract-shell`

## Status

`candidate`

## Plain-English Summary

Source event pages now default to the attached Source Event Shell design contract instead of the old always-open aVa side-advisor composition. The event journey/workspace rail becomes the left rail, the stage body uses the contract's stage tabs and focused work panel, and aVa starts as a compact bottom-right launcher rather than occupying the first viewport.

This corrects the visible mismatch where the live Source page still looked like an old shell even after earlier cleanup slices removed stale subnav and approval wording.

## Layer Impact

- `global-control-lane`: Source event shell composition and aVa launcher behavior.
- `client-data-lane`: no schema, data, query, tenant, or persistence changes.

## Client Applicability

- All clients: yes, for Source event detail pages.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- Removes the old default dark aVa side-advisor rail from Source event first paint.
- Keeps aVa reachable through a compact `Ask aVa` launcher; the real composer mounts only after the user opens it.
- Makes the event journey/workspace rail the left column, matching the supplied HTML contract.
- Adds the stage tabs (`Steps`, `Files`, `Intelligence`) and focused two-pane work surface from the HTML contract.
- Updates behavior tests to guard the contract shell and prevent the old dock/launcher model from returning.

## QA / Validation

- Focused Jest: passed (`SourceAnalyticsCanvas.chat`, old Source subnav guard, old Source Approvals copy guard; 13/13).
- ESLint: passed for touched Source shell component and test.
- TypeScript: passed (`npx tsc --noEmit --pretty false --incremental false`).
- Diff hygiene: passed (`git diff --check`).
- Release check: passed (`npm run release:check`).
- Pending in this candidate: signed-in production browser proof after deploy.

## Rollout Plan

Open a PR, merge to `main`, let the repo-owned Azure Container Apps workflow deploy the digest-pinned main image, verify the ACA runtime invariant, then run signed-in browser proof on the FS Demo Source event. The proof must show the Source event shell matching the supplied HTML contract structure: no old dark side-advisor rail, left event journey/workspace rail, stage tabs, focused work panel, and compact `Ask aVa` launcher.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before calling this live-proven.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. This is a UI composition change only and has no data rollback requirement.

## Audit Evidence

- Attached design contract: `/Users/anand/Downloads/AbarVa Nexus - Source Event Shell.html`
- Local reference render: `/tmp/source-proof/source-event-html-contract.png`
- Candidate PR diff and validation output.
- Post-deploy signed-in screenshot/crawl of the FS Demo Source event.

## Known Gaps

- This release aligns the event shell composition. Source home/portfolio IA redesign and deeper per-stage intelligence content quality remain separate backlog items.
