# 2026-07-22-tower-cxo-ux-shell-language — Tower adopts the Home/Intelligence shell language

## Release ID

`2026-07-22-tower-cxo-ux-shell-language`

## Status

`candidate`

## Plain-English Summary

First slice of the Tower CXO UX work. Two changes, both aimed at making the Tower page read as a clean executive control surface instead of a beige legacy dashboard:

1. **Visual language.** Tower had its own cream/beige palette (`PAGE_BG #f7f4ee`, `GOLD #a96d16`, warm-black ink) while Home and Intelligence use the shared SHELL set (white paper, neutral gray rules, navy ink — `src/lib/shell/shell-tokens.ts`). The Tower `T` token object's **values** now map onto SHELL, with the **keys unchanged** — so every one of the thousands of references across the 12.8k-line component inherits the new language with no layout change and no risk of a missed call site. Semantic status colors (green/red/amber/purple for lanes and risk) are deliberately preserved: this is a visual-language change, not a re-encoding of what colors mean.

2. **Removed the ambiguous "REFERENCE" badge.** A hardcoded `<span>Reference</span>` sat next to the "AI Value Realization Control Tower" heading with no data behind it. It read as a warning that the figures were reference/demo data when they are in fact the governed `cio_tower.mart_*` — actively misleading now that the mart is written by the governed ACA job. Provenance is already stated truthfully by the "Tower mart · source-backed · every figure traces to a source" line directly above it.

No data, query, or layout logic changed. Every metric still comes from the mart view model.

## Layer Impact

- `global-control-lane`: `src/components/tower/TowerIndexPage.tsx` — presentation tokens + removal of one static badge. No data path change.

## Client Applicability

- All clients: yes (Tower surface presentation).
- Feature flag: none.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx` — `T` token values remapped to the SHELL palette (keys unchanged); ambiguous hardcoded "Reference" badge removed with an explanatory comment.

## QA / Validation

- Pass: `tsc --noEmit` — zero errors in `TowerIndexPage.tsx`.
- Verified by grep that the removed badge was the only hardcoded `Reference` label in the component.
- Live signed-in visual verification on Meridian Tower pending this PR's deploy.

## Rollout Plan

Merge via squash to `main`; aca-main-deploy builds and deploys. Presentation-only; no migration, no job, no data change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected.
- Live signed-in proof required: yes — confirm the Tower page renders in the white/navy shell language, the "REFERENCE" badge is gone, and the mart numbers are unchanged ($650.0M / $487.5M / $162.5M / $53.7M / $3.8M / $0).

## Rollback Plan

Revert the PR. Token values and one badge; nothing else depends on them.

## Audit Evidence

- Before: Tower rendered beige (`#f7f4ee`) with a "REFERENCE" badge; captured in-session.
- PR URL: pending.

## Known Gaps

- The AI Portfolio section currently renders 0 items because the unified projection's V3 adapter does not yet read `10_ai_automation_use_cases.csv` (which supplies candidate/embedded AI items — 251 rows for Meridian). That is a data-adapter gap tracked separately; this PR does not attempt to hide it with a fake visual.
- Remaining CXO UX slices (Command-Center-first ordering, funnel/lane hierarchy, AI Portfolio separation of funded vs embedded vs candidate with numbered points and a legend, Evidence/Gaps framing) follow in subsequent slices.
