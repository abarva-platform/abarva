# 2026-06-19-intelligence-v2-chips-and-name — Intelligence v2 suggested-question layout + hero name

## Release ID

`2026-06-19-intelligence-v2-chips-and-name`

## Status

`candidate`

## Plain-English Summary

UI polish for the live Intelligence v2 surface: the suggested-question chips now flow multiple-per-line and stay within ~2 lines (compact chips, long questions truncate with an ellipsis and show the full text on hover) instead of stacking one-per-line; and the hero headline now uses the session-resolved tenant name so it matches the top-nav (no more "Lakeshore Industries" in the hero vs "Lakeshore Holdings" in the nav).

## Layer Impact

- **global-control-lane**: presentational changes to the shared Intelligence v2 surface (`IntelligenceV2Surface`) and the `/intelligence` page (passes `tenantName` to the surface). No schema, data-plane, or read-model change.

## Client Applicability

- Specific clients: the five demo tenants that render the v2 surface. No other tenants affected (explorer fallback unchanged).

## Changes Included

- `src/components/intelligence-v2/IntelligenceV2Surface.tsx` — MODIFIED: chips flow multi-per-line (inline-flex, nowrap, max-width + ellipsis via `.chiptext`, wider container) to cap at ~2 lines; hero uses `tenantName` prop when provided; full question text preserved as a `title` tooltip.
- `src/app/(maestro)/intelligence/page.tsx` — MODIFIED: pass `tenantName` to `IntelligenceV2Surface`.
- `docs/releases/records/2026-06-19-intelligence-v2-chips-and-name.md` — CREATED: this record.

## QA / Validation

Status: PASS (static) / NOT-RUN (live signed-in — verify chips ≤2 lines and hero name post-deploy)

- PASS: `npx eslint` on both touched files — exit 0.
- PASS: `npx tsc --noEmit` — no errors in touched files (pre-existing project errors unchanged).

## Rollout Plan

Squash-merge to `main`; `aca-main-deploy` builds + deploys. Post-deploy: confirm on app.abarva.ai/intelligence that suggested questions render in ≤2 lines (multiple per line) and the hero name matches the nav.

## Rollback Plan

Presentational-only. `git revert` the squash commit; the same workflow redeploys the prior revision.

## Audit Evidence

- Follows `2026-06-19-intelligence-v2-surface.md` (the surface this polishes).

## Known Gaps

- Ask bar + chips remain presentational (grounded answers are a separate follow-on).
