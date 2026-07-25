# 2026-07-25-home-v2-evidence-containment — stop presenting unrelated evidence as dimension-specific proof

## Release ID

`2026-07-25-home-v2-evidence-containment`

## Status

`candidate` — verified locally, not yet merged.

## Plain-English Summary

The `/home` route falls back to an older rendering component whenever no newer, human-approved
content pack exists for a tenant — which today is every tenant, since none has been approved yet.
That older component had three related defects that made its output look more evidenced than it
actually was:

1. When a specific section of the page (e.g. "Enterprise Thesis," "Leadership Agenda") had no
   evidence of its own, the page silently substituted the tenant's whole unrelated evidence list —
   making real citations meant for a different topic look like they specifically backed this one.
2. When a section had no real chart data, the page rendered a hardcoded single bar labeled
   "Directional" — identical regardless of which section was missing data, which reads as a real
   (if weak) signal rather than the absence of one.
3. When an evidence source didn't state what it supports, the page filled in a generic reassurance
   sentence instead of saying nothing was stated.

This patch replaces all three with honest empty/partial states: a section with no evidence of its
own now says so explicitly, a section with no chart data shows an empty-state message instead of a
fake bar, and a source with no stated relationship says that plainly instead of asserting one.
No new features were added — this is a containment fix for existing, already-visible behavior.

## Layer Impact

- `global-control-lane`: the affected component (`HomeEnterpriseBriefApp.tsx`) renders the live
  `/home` experience for any tenant without an approved newer content pack — today, every tenant.
  This is shared app-tier rendering logic, not a client-scoped schema or data-plane change. No
  canonical-model (layer 3) change — this only changes what the existing renderer does with data
  it already has (or doesn't have).

## Client Applicability

- All clients: yes — every tenant currently renders through this component, since no tenant has an
  approved newer pack yet. This is a correctness fix to the actual current production experience,
  not a new-tenant-only or flagged change.
- Feature flag: none — this path has no flag; it is the render fallback whenever a newer pack
  isn't approved for a tenant.

## Changes Included

- `src/components/home/HomeEnterpriseBriefApp.tsx`:
  - `evidenceFor()`: no longer falls back to the pack-wide global evidence list for a
    dimension-scoped lookup; returns only that dimension's own evidence bucket (empty if none).
  - `dimensionVisualChart()`: returns an empty array instead of a hardcoded single-bar stub when a
    dimension has no real chart rows.
  - `sourceRows()`: `supports` is `null` (not a generic filler sentence) when a source has no
    stated support/facts of its own.
  - `DimensionView`'s chart region: renders an honest empty-state message when the chart has no
    data, instead of an empty/fake bar chart.
  - `DimensionView`'s "Source proof" region: renders an honest empty-state message when a
    dimension has no evidence sources, and a plain "no explicit relationship stated" line per
    source when that source's own `supports` is null.
  - New `.heb-chart-empty` style, matching the existing `.heb-empty` empty-state treatment.
- `src/components/home/__tests__/HomeEnterpriseBriefApp.evidence-containment.test.tsx` (new): 10
  regression tests across the four dimensions this defect was directly observed on, covering
  evidence non-leakage, honest chart empty state, honest per-source null handling, and evidence
  bucket isolation between dimensions.

## QA / Validation

- `pass` — `npx eslint` on all changed files, zero findings.
- `pass` — full-project `tsc --noEmit` (expanded heap), zero errors.
- `pass` — full production `npm run build`, zero errors.
- `pass` — new test file: 10/10 tests passing.
- `pass` — `npx jest src/components/home`: 74/76 passing; the 2 pre-existing failures
  (`HomeOverviewV2.tenant-switcher.test.tsx`, `HomeKnowAnswerRenderer.test.tsx`) were confirmed to
  fail identically on unmodified `origin/main` via `git stash` — unrelated to this change.

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds and deploys automatically.
2. No migration, no flag, no persisted-data change — purely a rendering-logic fix in an existing
   component.
3. After deploy, live signed-in verification: confirm the four previously-affected sections no
   longer show unrelated evidence citations or the identical stub chart, and instead show honest
   empty states where no dimension-specific content exists yet.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none beyond the standard main-branch deploy.
- Approved image digest: the digest produced by this PR's `aca-main-deploy.yml` run.
- ACA runtime invariant: verify template image, 100%-traffic revision image, and worker job images
  all match the new digest after deploy.
- Feature/env flag update path: none — no flag involved.
- Live signed-in proof required: yes — this changes rendered content on every tenant's live
  `/home` page.

## Rollback Plan

Revert the PR. The component reverts to its prior behavior (global-evidence fallback, stub chart,
generic support filler) — no persisted data is affected either way, since this component reads
already-generated packs and does not write anything.

## Audit Evidence

- This PR's diff and CI run.
- `aca-main-deploy.yml` run for this merge, once available.
- Post-deploy live signed-in screenshots of the four named sections, once captured.

## Known Gaps

- This is a containment patch only, scoped to the exact defect observed. It does not restore any
  previously-deleted V2 functionality (e.g. the multi-facet application filter table or the
  relationship graph), and does not change navigation structure. Those are separate, later
  workstreams.
- The underlying reason every tenant still renders through this older component — no tenant has an
  approved newer content pack yet — is unchanged by this patch and is being addressed separately.
