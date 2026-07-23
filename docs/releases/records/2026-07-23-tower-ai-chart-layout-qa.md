# 2026-07-23 Tower AI Chart Layout QA

## Release ID

`2026-07-23-tower-ai-chart-layout-qa`

## Status

`candidate`

## Plain-English Summary

Live signed-in visual proof showed the Tower AI Portfolio matrix could render with a chart area taller than the viewport, even after the AI points were visible and separated. That made the page technically correct but visually poor: users saw a huge sparse plot instead of a compact executive matrix.

This release constrains the shared chart frame with a responsive height range so Recharts charts fit into the first viewport instead of inheriting an accidental oversized flex height.

## Layer Impact

- Tower UI layout: constrains chart frame height in the Command Center CSS module.
- Runtime data model: no change.
- Data plane: no mutation.

## Client Applicability

- All clients: yes, for tenants using Tower Command Center charts.
- Specific clients: observed on Healthcare Demo AI Portfolio.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; `/tower` currently serves the Command Center.

## Changes Included

- `src/components/tower/command-center/TowerCommandCenter.module.css`
  - Adds a bounded responsive height to `.chartwrap`.

## QA / Validation

- Pre-fix visual proof: pass for detecting the defect. The prior deployed build captured a `1549px` chart frame inside a `1280px` viewport, proving the remaining layout issue.
- Local Jest validation: pass.
- Local TypeScript validation: pass.
- Local whitespace validation: pass.
- CSS lint: not-run by ESLint because CSS files are ignored by the repo config.
- Post-deploy signed-in visual proof: blocked until merge/deploy; must confirm the matrix chart frame is bounded.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main workflow, verify ACA runtime invariant, and capture signed-in visual proof for Healthcare Demo AI Portfolio.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by ACA main deploy after merge.
- ACA runtime invariant: required after deployment.
- Worker image invariant: verify with the same invariant check.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert this PR and deploy through ACA main. No data rollback is required.

## Audit Evidence

- Pre-fix visual proof: `reports/tower-ai-matrix-visual-qa/live-meridian/visual-proof.json`.
- Post-deploy visual proof to be captured after ACA deploy.

## Known Gaps

- Portfolio-only AI spend remains portfolio-only; this release only fixes chart sizing.
