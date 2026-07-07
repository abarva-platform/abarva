# 2026-07-07-tower-v4-closer-visual-alignment — Tower v4 Closer Visual Alignment

## Release ID

`2026-07-07-tower-v4-closer-visual-alignment`

## Status

`candidate`

## Plain-English Summary

This release tightens the Tower CXO dashboard so it more faithfully matches the supplied Tower v4 standalone HTML design. The page now uses a cleaner executive masthead, a single-line subheading, tabs directly under the heading, a closer/wider value bridge chart, and a benchmark view led by a 2x2 comparison instead of a blocky peer-card spread.

## Layer Impact

Lane: `global-control-lane`

- Frontend: Updates Tower CXO dashboard layout and chart presentation.
- Data: No data model, schema, ingestion, or metric source changes.
- AI/model: No prompt, model, or answer-generation changes.
- Runtime: Requires normal ACA web redeploy after merge.

## Client Applicability

- All clients: Yes, where the governed Tower CXO dashboard is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`: revises masthead, removes extra pre-tab narrative block, tightens tab placement, and switches Benchmark to the 2x2 lead visual.
- `src/components/tower/charts/TowerCxoCharts.tsx`: corrects value bridge chart construction and adds the benchmark peer 2x2 component.
- `docs/releases/records/2026-07-07-tower-v4-closer-visual-alignment.md`: release record for this candidate.

## QA / Validation

Pass: `git diff --check -- src/components/tower/TowerIndexPage.tsx src/components/tower/charts/TowerCxoCharts.tsx docs/releases/records/2026-07-07-tower-v4-closer-visual-alignment.md`

Pass: `npm run release:check`

Pass: focused ESLint on Tower TSX files from the dependency-installed workspace. Existing unused-code warnings remain in `TowerIndexPage.tsx`; no ESLint errors were introduced.

Not run: full TypeScript build in the clean release worktree because that worktree does not have `node_modules` installed.

Blocked: live signed-in screenshot proof until merge and ACA main deploy complete.

## Rollout Plan

1. Open PR from `codex/tower-v4-closer-visual-align`.
2. Merge through protected PR path.
3. Use the repo-owned ACA main deploy workflow to build and deploy the digest-pinned image.
4. Verify ACA revision, image digest, 100% traffic, health endpoint, and signed-in `/tower` screenshots for Value and Benchmark.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: To be filled after ACA deploy.
- ACA runtime invariant: Must verify template image and 100% traffic revision after deploy.
- Worker image invariant: No worker changes expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Tower `/tower` Value and Benchmark screenshots.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. This is presentation-only and does not require data or schema rollback.

## Audit Evidence

To be filled after live proof:

- PR:
- Commit:
- ACA revision:
- Image digest:
- Proof directory:
- Screenshots:

## Known Gaps

Not pixel-diffed against the standalone HTML. The live proof must be screenshot-reviewed by the product owner before calling the visual match accepted.
