# HOME-DQ1 — Home Data Quality, Coverage, and Answerability

## Release ID

`2026-07-13-home-data-quality-answerability`

## Status

`candidate`

## Plain-English Summary

Home now shows a business-facing data-quality posture before users send work to Intelligence, Moves, Source, or Tower. It separates active Home context, source coverage, candidate coverage, evidence strength, relationship coverage, known gaps, and answerability so Home does not imply that uploaded or candidate data is active truth.

## Layer Impact

- Lane: `global-control-lane`
- Home UI: Adds read-only data-quality, coverage, answerability, caveat, and context badge displays.
- Home read model: Converts existing all-tenant data-quality audit artifacts and setup-control state into Home-facing language.
- QA / reporting: Adds focused proof artifacts under `reports/home-data-quality/latest/`.

## Client Applicability

- All clients: Yes, wherever Home has a context browser and all-tenant data-quality audit artifacts.
- Specific clients: SkyHarbor regression posture is explicitly covered.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/home/home-data-quality.ts`
- `src/app/(maestro)/home/page.tsx`
- `src/components/home/HomeSurface.tsx`
- `scripts/audit/home-data-quality.ts`
- `scripts/qa/home-data-quality-ava.ts`
- Focused Home data-quality tests.

## QA / Validation

- Pass: `npm run audit:home-data-quality`
- Pass: `npm run qa:home-data-quality-ava`
- Pass: `npm run test:home-data-quality`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npx eslint` on changed Home files and scripts
- Pass: `npm run release:check`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `git diff --check`

## Rollout Plan

Merge through the protected PR lane. The repo-owned Azure Container Apps main deploy workflow is the only approved path for shared Product/Lab runtime deployment. After deploy, run signed-in Home proof for `/home` default active mode and explicit candidate preview mode if available.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime deployment.
- Shared runtime mutators: Not used by this PR.
- Approved image digest: Not available until ACA deploy.
- ACA runtime invariant: Must be verified after deploy.
- Worker image invariant: No worker runtime change in this PR.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before calling this live-proven.

## Rollback Plan

Revert the PR or roll back to the prior ACA revision through the approved ACA lane. No data migration, production write, candidate promotion, active access update, or module runtime behavior change is introduced by this PR.

## Audit Evidence

- `reports/home-data-quality/latest/summary.md`
- `reports/home-data-quality/latest/home-quality-surface.json`
- `reports/home-data-quality/latest/context-quality-badges.json`
- `reports/home-data-quality/latest/source-coverage-view.json`
- `reports/home-data-quality/latest/evidence-quality-view.json`
- `reports/home-data-quality/latest/relationship-coverage-view.json`
- `reports/home-data-quality/latest/answerability-view.json`
- `reports/home-data-quality/latest/gaps-view.json`
- `reports/home-data-quality/latest/candidate-preview-quality.json`
- `reports/home-data-quality/latest/ava-quality.json`
- `reports/home-data-quality/latest/guardrails.json`

## Known Gaps

- Browser proof is pending deployment.
- Candidate preview remains explicitly inactive unless a preview state is requested.
- This PR does not upload files, create candidates, promote candidates, update the Active Tenant Access layer, or change module runtime behavior.
