# 2026-06-15-source-strategy-at-p0 — Fold Strategy into P0; approve → Scope

## Release ID

`2026-06-15-source-strategy-at-p0`

## Status

`candidate`

## Release Lane

`client-data-lane`

## Plain-English Summary

Strategy was a separate stage page you landed on after approving P0 intake — but P0 already captures and
validates everything the strategy is made of (trigger, sponsor, scope, value, and the archetype you pick), and
the intake approval is sponsor-co-signed. So the Strategy page was duplicate work.

This **folds Strategy into the P0 origination gate**. On intake approval (when the flag is on), the event:

1. **Advances straight to Scope** (`current_stage_key = 'scope'`) — you never land on a Strategy to-do page.
2. **Waives the three `GATE-STRATEGY-*` criteria** with an audit reason ("Strategy set and endorsed at P0
   origination, sponsor co-signed; folded into the approval gate"). The rail shows Strategy **done**, not open.

The strategy is now decided and endorsed at the one place that already collects it — approval — and the first
net-new work is Scope. The change is **best-effort**: if the stage/gate writes fail, the event simply keeps the
standard Strategy stage (a safe fallback) and the approval itself never fails.

## Layer Impact

- `client-data-lane`: on approval the route now also writes `source_events.current_stage_key = 'scope'` and
  sets the per-event `source_event_gate_criterion_states` rows for `GATE-STRATEGY-01/02/03` to `waived` (with
  reviewer + audit note). Both go through the existing data-plane write adapter (`updateStage`,
  `updateGateCriterion`) — no new tables, no schema change. Gated by a new tenant flag.

## Client Applicability

- All clients: no change with the flag off — the standard Strategy stage is unchanged.
- Specific clients: SkyHarbor — enabled via env to validate "approve → land in Scope, Strategy done".
- Internal only: None.
- Public/demo only: None.
- Feature flag: `source_strategy_at_p0` (tenant policy, default off).

## Changes Included

- `features/registry.ts`: add `source_strategy_at_p0` flag (tenant, default off).
- `source/events/[eventId]/approve/route.ts`: on `approve` + flag on → `updateStage` to `scope` and `waive` the
  three Strategy gate criteria (audited), best-effort; response now reports `advancedToStage`.

## QA / Validation

- PASS: `npx eslint` clean on both files · `tsc --noEmit` clean (the `activeClient.id` flag scope, the criterion
  lookup query, and the adapter calls all type-check).
- Pending: live on ACA — create a fresh SkyHarbor event, approve intake, confirm you land on **Scope** and the
  rail shows Strategy done (gates waived with the audit note).

## Rollout Plan

Merge → CI → rebuild image → `containerapp update` → shift traffic → set
`ABARVA_FEATURE_SOURCE_STRATEGY_AT_P0_TENANTS=skyharbor` → create + approve a fresh event and confirm Scope
landing.

## Rollback Plan

Unset the env flag (instant, no redeploy) or revert the PR. With the flag off, approval behaves exactly as
before (lands on Strategy). Already-approved events under the flag keep their waived gates + scope stage; to
reverse one, reopen the gate criteria and set the stage back to `strategy`.

## Audit Evidence

PR diff (flag + approve-route stage advance + gate waivers + this record), CI checks, local eslint/tsc output,
the waiver note recorded on each `GATE-STRATEGY-*` row, the approval activity-log entry, and the post-deploy
capture of a fresh event landing in Scope with Strategy shown done.

## Known Gaps

- **Strategy memo as a record.** With Strategy skipped, the auto-draft (which fires on Strategy *entry*) no
  longer runs, so an approved event has no generated memo — the strategy substance lives in the captured intake
  facts. Generating the formal memo as an on-demand *record* (Workspace view, or a lightweight post-approval
  trigger) is the immediate follow-on.
- **Async approval-time generation** (so the memo is produced at approval, not lazily) still depends on the
  durable async-generation follow-on.
- The waiver is keyed on the canonical `GATE-STRATEGY-0{1,2,3}` ids; if the canonical strategy criteria change,
  this list must track them.
