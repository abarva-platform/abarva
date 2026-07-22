# 2026-07-22-tower-ai-portfolio-subtabs — AI Opportunity Portfolio told in chapters, plus executive copy fixes

## Release ID

`2026-07-22-tower-ai-portfolio-subtabs`

## Status

`candidate`

## Plain-English Summary

Two changes to the Tower page, both from live signed-in review of the current revision.

1. **The AI Opportunity Portfolio is now a story told in five chapters instead of one long scroll.** It previously stacked a quadrant, a full 255-item watchlist, and a tool table onto a single page, so a CXO had to scroll past everything to find anything. It now opens on **Position** and offers **Funded & embedded**, **Proof status**, **Candidate pipeline**, and **Active tools** as sub-tabs. Each chapter states its own question in one sentence before showing anything.

   A real correctness gain falls out of the split: the quadrant plots only the items carrying economics, and the list beside it now shows _those same items_, so the numbered points finally match the numbered list. Previously the quadrant numbered 11 plotted points while the list beside it numbered all 255 rows — the numbers did not correspond.

   Empty chapters state why they are empty (for example, no usage telemetry is loaded for this tenant) rather than rendering a blank card or a fabricated chart. No chapter invents a population it does not have.

2. **Executive-facing copy fixes**, same class as the technical-evidence-count leakage fixed in #5339/#5344, but hardcoded in the Tower page rather than in the agent renderer:
   - `"Rows with approved or embedded spend"` → `"Carrying approved or embedded spend"`
   - `"Rows with usage or finance validation"` → `"Carrying usage or finance validation"`
   - `"No current mart rows in this lane."` → `"No programs sit in this lane today."` (two sites)
   - `"Every displayed figure carries a lineage row back to N source files."` → `"Every displayed figure traces back to N source files."`
   - `"traces to a mart fact, a formula posture, and a source row"` → `"traces to a governed figure, a stated formula, and the source record it came from"`
   - Raw upper-snake enum values were being printed on Decision Lane cards — a CXO was shown literal `PROMISED_ONLY` and `FUNDED_NO_VALUE_CASE`. New `towerValueClaimLabel()` maps them to readable text and falls through to the generic humanizer for unknown members, so a new enum value surfaces as readable text rather than disappearing.
   - A pluralization bug in the quadrant scope caption ("1 further portfolio row … **are** listed below") is fixed, and the caption now names the chapter the excluded items live in instead of saying "below".

No data, query, or mart logic changed. Every figure still comes from `cio_tower.mart_*`.

## Layer Impact

- `global-control-lane`: `src/components/tower/TowerIndexPage.tsx` — presentation and copy only within the Tower surface. No data path, query, or schema change.

## Client Applicability

- All clients: yes (Tower surface presentation).
- Feature flag: none.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx` — new `TowerSubTabs` (reusable, so the same chapter pattern can be applied to the other Tower analyses), new `TowerAiItemList` (single row anatomy shared by every chapter instead of three drifting copies), new `towerValueClaimLabel`, `TowerMartAiPortfolioDesign` restructured into five chapters, executive copy fixes listed above.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` — tests updated to drive the new sub-tab navigation; assertions moved to the chapter that now owns each population.

## QA / Validation

- Pass: `tsc --noEmit` — zero errors.
- Pass: `eslint src/components/tower/TowerIndexPage.tsx` — 0 errors (29 pre-existing unused-symbol warnings, none introduced here).
- Pass: `jest src/components/tower/__tests__/` — 19/19, including the updated AI Portfolio navigation tests across all tenant fixtures.
- Live signed-in verification on Meridian Tower pending this PR's deploy.

## Rollout Plan

Squash-merge to `main`; `aca-main-deploy` builds the digest-pinned image and deploys. Presentation-only; no migration, no job, no data change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected by this change; will still be verified before claiming live-proven.
- Live signed-in proof required: yes — confirm the five sub-tabs render, the Position chapter's numbered points match its numbered list, and no raw enum or "Rows with…" copy remains on the page.

## Rollback Plan

Revert the PR. Presentation-only; nothing else depends on the new components.

## Audit Evidence

- Before: live signed-in capture of the current revision showing the single-scroll AI Portfolio, `PROMISED_ONLY` / `FUNDED_NO_VALUE_CASE` on lane cards, and "Rows with approved or embedded spend"; captured in-session.
- PR URL: pending.

## Known Gaps

- Only the AI Opportunity Portfolio has been restructured into chapters. Decision Lanes, Value Proof Funnel, and Evidence remain single-scroll pages and should adopt the same `TowerSubTabs` pattern in a following slice.
- Usage/adoption signal remains genuinely absent: `tower_*` operational telemetry is empty for every tenant because the ingest connectors have never run. The Proof status chapter reports that as a stated gap rather than substituting a figure.
