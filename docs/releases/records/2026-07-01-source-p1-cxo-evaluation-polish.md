# 2026-07-01-source-p1-cxo-evaluation-polish — Source CXO Evaluation Polish

## Release ID

`2026-07-01-source-p1-cxo-evaluation-polish`

## Status

`candidate`

## Plain-English Summary

Source P1 now presents the vendor evaluation experience in cleaner CXO-facing language. The SkyHarbor demo sourcing event displays as SkyHarbor Air AMS Outsourcing RFP, the assistant label is standardized to aVa on the evaluation surface, governance sign-off replaces internal Steward language, and the evaluation scorecard exposes DOCX/PDF decision brief exports from the live artifact render route.

## Layer Impact

- `global-control-lane`: Source canvas labels, evaluation panel copy, export links, and artifact names are shared product behavior for Source events.
- `public-demo`: The SkyHarbor sourcing demo display name is normalized for controlled demo proof without changing the underlying event record.

## Client Applicability

- All clients: receive the shared Source evaluation copy and export controls.
- Specific clients: SkyHarbor demo event display naming is normalized when Source events identify as SkyHarbor demo records.
- Internal only: none.
- Public/demo only: the SkyHarbor display-name normalization is demo polish only.
- Feature flag: none.

## Changes Included

- Source canvas passes decision brief DOCX/PDF export links into the responses and evaluation stage panels.
- Vendor evaluation scorecard shows a defensible weighted score breakdown tied to the event display name and exposes decision brief export controls.
- Source evaluation-stage copy replaces internal Steward/Atlas/Sentinel-facing language with business-facing governance and decision brief labels.
- Focused Source scorecard test covers the export controls, weighted breakdown, and absence of old demo/internal labels.

## QA / Validation

- Passed: focused Jest for the Source evaluation scorecard.
- Passed: scoped ESLint for touched Source files.
- Passed: `git diff --check`.
- Not run yet: `npm run release:check` after this release-record formatting update.
- Blocked outside this change: repo-wide `npx tsc --noEmit --pretty false` still fails on pre-existing missing type dependencies for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.
- Not run yet: live signed-in Source browser proof after ACA deploy to verify the visible labels and export controls on the SkyHarbor AMS RFP event.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, wait for the new revision to receive 100% traffic, then run signed-in browser proof on the Source evaluation stage.

## Deployment Authority

- Repo-owned deploy workflow: `ACA main deploy`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: determined by the ACA main deploy workflow.
- ACA runtime invariant: verify `ca-abarva-web-lab-eastus` active revision, image digest, health, and 100% traffic after deploy.
- Worker image invariant: no worker changes.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source evaluation stage plus decision brief DOCX/PDF export checks.

## Rollback Plan

Revert the Source evaluation polish PR and redeploy through the ACA main deploy workflow. No data-plane migrations or destructive changes are included.

## Audit Evidence

- Pull request URL and CI run.
- Focused Jest, scoped ESLint, release check output.
- ACA deploy run, revision, image digest, and health evidence.
- Signed-in browser screenshot/proof bundle for the SkyHarbor Source evaluation stage and decision brief export links.

## Known Gaps

Live browser proof and export-route proof are pending until this candidate is merged and deployed.
