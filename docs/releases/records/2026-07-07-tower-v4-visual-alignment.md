# 2026-07-07-tower-v4-visual-alignment — Tower v4 visual fidelity alignment

## Release ID

`2026-07-07-tower-v4-visual-alignment`

## Status

`candidate`

## Plain-English Summary

This release tightens the Tower CXO portfolio page so the live React surface follows the
approved standalone Tower v4 design more closely. It removes the dashboard-card
interpretation of the top value view and restores the design's editorial masthead, tab
spine, unboxed executive lede, and compact flagship value bridge chart.

## Layer Impact

- `global-control-lane`: Tower presentation code only. The shared Tower page layout and
  chart rendering are affected for tenants that can access Tower.
- Data layer: no change. This does not modify Tower facts, read models, metrics,
  formulas, ingestion, graph tables, or aVa answer generation.

## Client Applicability

- All clients: yes, for the Tower page visual shell when the CXO portfolio surface is
  rendered.
- Specific clients: no tenant-specific code path.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
  - Aligns the Tower masthead to the standalone v4 rhythm: Portfolio eyebrow, tenant
    display name, "Every number citable.", entity count, and FY26 budget envelope.
  - Replaces centered pill tabs with the thin editorial underline tab spine.
  - Removes the extra `Ask aVa` tab from the command-section tabs. aVa remains available
    through the normal Tower assistant/fab surface.
  - Removes the heavy boxed "Executive operating view" treatment from the top value
    section and adds a plain `CioPanel` mode for the flagship visual.
- `src/components/tower/charts/TowerCxoCharts.tsx`
  - Aligns the flagship value bridge chart dimensions, fonts, margins, bar sizing, and
    label styling to the standalone design.
  - Adds explicit SVG label renderers for value labels and the two-line "to prove"
    annotation so Recharts/browser newline behavior cannot distort the chart.

## QA / Validation

- Pass: `git diff --check -- src/components/tower/TowerIndexPage.tsx src/components/tower/charts/TowerCxoCharts.tsx`
- Pass: `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/charts/TowerCxoCharts.tsx`
  - Result: 0 errors.
  - Existing warnings remain in `TowerIndexPage.tsx` for pre-existing unused code paths.
- Not run to completion: full `npx tsc --noEmit --pretty false`; it ran for several
  minutes with no output and was stopped. The deploy workflow build remains the
  authoritative full build gate.
- Blocked locally: signed-in local browser screenshot. The local dev environment loops
  through Clerk auth on `/tower`, so the visual proof must be captured on the signed-in
  ACA runtime after deploy.

## Rollout Plan

Merge the PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the
digest-pinned web image to `ca-abarva-web-lab-eastus`. After deployment, verify the ACA
runtime invariant, route health, and the signed-in Tower page at `https://app.abarva.ai/tower`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none from this branch. Do not mutate ACA traffic manually.
- Approved image digest: set by the main deploy workflow at deploy time.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: unchanged by this presentation-only change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes. Capture Tower screenshots for Industrial Demo after
  the ACA deploy and compare masthead, tabs, subheader/lede, and flagship value bridge
  against the standalone design.

## Rollback Plan

Revert the squash commit or redeploy the previous good `main` SHA through the repo-owned
ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL: to be filled when opened.
- ACA revision/digest: to be filled after the main deploy workflow completes.
- Signed-in screenshot proof: to be captured after deploy.
- Local validation commands listed in QA / Validation.

## Known Gaps

- Browser-visible proof is pending until the change is deployed to the signed-in ACA
  runtime.
- This change improves the top Tower value view fidelity; it does not claim a complete
  pixel-perfect audit of every downstream Budget, Portfolio, Benchmark, and Evidence
  subview.
