# 2026-07-22-tower-cxo-ux-lanes-evidence — Decision Lanes and Evidence read as executive views

## Release ID

`2026-07-22-tower-cxo-ux-lanes-evidence`

## Status

`candidate`

## Plain-English Summary

Final slices of the Tower CXO UX work, both presentation-only over data the mart already carries.

**Decision Lanes — the main executive view.** Each program card showed only name, approved funding, owner, promised and validated value. A CXO could see the money but not whether the bet was proven, whether anyone was using it, or what to do next. Cards now carry all five: spend, owner, **proof status** (partly validated vs the actual claim status), **usage signal** (metric, actual, adoption %), and **next action**. Next action prefers the first open required gate — a concrete, assignable ask like "Load promised value or mark as no-value spend" — and falls back to the lane rationale. When the mart carries neither, the card says no next action is recorded rather than inventing one; that absence is itself the signal.

Honesty detail: usage reads "usage not loaded" when telemetry was never ingested, rather than showing zero. Zero adoption and un-ingested telemetry are different facts and must not look alike.

**Evidence — reframed from a raw table to four answers.** The section opened with a lineage table, so the reader had to derive the important things themselves. It now leads with the four questions an executive actually has — _what evidence exists / what is missing / who must provide it / what stays blocked_ — each counted from the mart (`evidenceLineage` + `requiredFieldGaps`), with the trace table retained beneath as the audit backing. Gaps with no named owner are surfaced as "Unassigned", because unassigned evidence never arrives.

No new mart reads, no query changes, no fabricated values. Sections with nothing to show say so plainly.

## Layer Impact

- `global-control-lane`: `src/components/tower/TowerIndexPage.tsx` — presentation only.

## Client Applicability

- All clients: yes (Tower surface presentation).
- Feature flag: none.

## Changes Included

- `TowerIndexPage.tsx` — `towerLaneNextAction()` helper; Decision Lane cards gain proof-status and usage-signal badges plus a next-action line; new `TowerMartEvidencePosture` component rendered above the evidence trace table.

## QA / Validation

- Pass: `tsc --noEmit` — zero errors in `TowerIndexPage.tsx`.
- Pass: `jest src/components/tower src/lib/cio-tower` — 112/112 across 12 suites.
- Live signed-in visual verification pending this PR's deploy.

## Rollout Plan

Merge via squash to `main`; aca-main-deploy builds and deploys. Presentation-only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none.
- ACA runtime invariant: unaffected.
- Live signed-in proof required: yes — confirm lane cards show proof status, usage signal and next action, and the Evidence tab leads with the four-panel posture.

## Rollback Plan

Revert the PR. Presentation-only; no data dependency.

## Audit Evidence

- Before: lane cards carried spend/owner/promised/validated only; Evidence opened on a raw lineage table.
- PR URL: pending.

## Known Gaps

- Real `tower_*` telemetry is still un-ingested, so most lane cards will read "usage not loaded" — correct and deliberate, not a rendering fault.
