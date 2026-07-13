# HOME-DQ1 Hydration Date Fix — Deterministic Home Last-Checked Date

## Release ID

`2026-07-13-home-dq1-hydration-date-fix`

## Status

`candidate`

## Plain-English Summary

Home now renders the `Last checked` date with a deterministic UTC formatter.
This avoids a server-versus-browser text mismatch on the Home data-quality
surface while preserving the read-only HOME-DQ1 behavior.

## Layer Impact

- Lane: `global-control-lane`
- Home UI: Stabilizes the displayed last-checked date so hydration does not
  drift by browser timezone or locale.
- Data plane: No impact.
- Runtime behavior: No module behavior change beyond safer Home rendering.

## Client Applicability

- All clients: Yes, every tenant using the Home context browser receives the
  deterministic date render.
- Specific clients: SkyHarbor triggered the signed-in hydration warning during
  HOME-DQ1 proof.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/home/HomeSurface.tsx`
- Release record for the hydration/date render follow-up.

## QA / Validation

- Pass: `npx eslint src/components/home/HomeSurface.tsx`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending after deploy: signed-in browser proof for `/home` and
  `/home?candidatePreview=true` confirming no Home hydration console error.

## Rollout Plan

Merge through the protected PR lane. The repo-owned Azure Container Apps main
deploy workflow is the only approved path for shared Product/Lab runtime
deployment. After deploy, run signed-in Home proof for default active mode and
explicit candidate-preview mode.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime deployment.
- Shared runtime mutators: Not used by this PR.
- Approved image digest: Not available until ACA deploy.
- ACA runtime invariant: Must be verified after deploy.
- Worker image invariant: No worker runtime change in this PR.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR or roll back to the prior ACA revision through the approved ACA
lane. No data migration, production write, candidate promotion, active access
update, or module runtime behavior change is introduced by this PR.

## Audit Evidence

- Pre-fix signed-in Home proof under `reports/home-data-quality/latest/` found
  Home data-quality content visible but logged React hydration error #418 on
  SkyHarbor Home.
- Post-deploy signed-in proof must be captured under
  `reports/home-data-quality/latest/`.

## Known Gaps

- Browser proof is pending deployment.
- This PR does not upload files, create candidates, promote candidates, update
  Active Tenant Access, or change module runtime behavior.
