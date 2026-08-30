# Tower — carry the initiative detail the canonical layer already held

## Release ID

`2026-08-30-tower-initiative-detail-slice-a`

## Status

`candidate`

## Plain-English Summary

The approved design's initiative drill-down has twelve sections and roughly forty fields. The
shipped drawer had four sections and about twelve. This closes the part of that gap which needed no
new data at all.

Five fields were sitting in the canonical layer and were dropped when the Layer 4 payload was
built: `project_name` and `lifecycle_stage` and `finance_partner_role` from `canonical_projects`,
`success_metric` and `payback_months_target` from `canonical_ai_use_cases`. The monthly value
observations were in `canonical_monthly_value_observations` and reached the payload only as four
summed totals, so the drawer could say a claim had not been validated but not whether it was
moving.

The drawer gains three sections:

- **Where this sits** — project, lifecycle stage, what stopped it, the operating metric it is
  measured on, and the payback target.
- **Who answers for it** — sponsor and finance partner, which were two different roles the view
  could not previously distinguish.
- **What the claim did, month by month** — the last four observations with their validation state,
  and the count on file.

A case with no observations says so, in those words, rather than rendering an empty chart frame.

## Layer Impact

Lane: `global-control-lane` — shared behaviour for all clients, not feature-gated. Layer 4 loader
payload, Layer 3 reader, view model, and one drawer.

No canonical or Layer 1 change: every field already existed one layer below where it was needed.
The loader change affects new loads only, so this reaches a tenant at its next Layer 4 build.

## Client Applicability

**All clients**, per tenant at that tenant's next Layer 4 load. A tenant loaded before this ships
sees the drawer's existing sections unchanged and the three new ones reporting "Not recorded",
which is accurate: those fields are genuinely not in that tenant's stored payload yet.

## Changes Included

- `scripts/tower/load-healthcare-demo-layer4-products.mjs` — five fields plus the observation
  series on the case payload.
- `src/lib/tower/readTowerCommandCenter.ts` — `valueObservationMonths` helper and five mappings,
  each from its own key.
- `src/lib/tower/current-layer-view-model.ts`, `command-center/types.ts`,
  `command-center/view-model.ts` — carry them.
- `drawers/AiInitiativeDrawer.tsx` — three sections.
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — four guards.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 60/60, four new guards |
| Tower suites | PASS against baseline — 548 pass / 21 fail across 6 suites; failing set identical to `origin/main` |
| `tsc --noEmit` · `eslint` | PASS — clean |
| Generated SQL inspected | PASS — dry build against the real fixture; `project_name` present and the observation series carrying real months and `validation_state` |
| Live proof | NOT RUN — needs a Layer 4 reload first. See Known Gaps. |

## Rollout Plan

Merge. The fields reach a tenant at its next Layer 4 load, through the existing governed job path.
Nothing runs on merge, and nothing a client sees changes until that load.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`. The load itself runs through the
governed ACA Job wrapper with its existing approval gates.

## Rollback Plan

Revert. The payload fields become unread, the drawer sections disappear, and no stored value
changes. A tenant already reloaded keeps the extra payload keys harmlessly.

## Known Gaps

- **Not live until a reload.** The drawer will render "Not recorded" for all five fields against
  the currently stored payload, because that payload predates this change. That is honest and it
  is also not the intended end state.
- **The rest of the design needs data that stops at Layer 1.** The money row (spent to date,
  forecast variance), the operating metric's baseline, target and captured points, the dated
  finance trail, evidence-on-file with confidence, technology owner, go-live and realization lag
  all exist in `09_programs_initiatives`, `14_metrics_outcomes` and `13_evidence_sources` and are
  not carried into the canonical layer. Extending canonical is the next slice and a larger one.
- The drawer shows the last four observation months. A case with a longer series is truncated
  silently; a fuller view belongs in the drill-down page rather than the drawer.

## Audit Evidence

Column sets read directly from `datasets/tenant-inputs/generated/meridian-health/
tower-layer1-v2026-08-business-case/layer_3_canonical/`. The generated load SQL was inspected from
a dry build before merge: the observation series emitted real months beginning `2025-09` with
`validation_state` values such as `not_yet_measurable`.
