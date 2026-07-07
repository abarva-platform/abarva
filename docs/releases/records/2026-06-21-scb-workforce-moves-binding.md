# 2026-06-21-scb-workforce-moves-binding — Workforce economics in the Moves business case (WE-3, flag-gated)

## Release ID

`2026-06-21-scb-workforce-moves-binding`

## Status

`candidate`

## Plain-English Summary

Wires the Workforce Economics engine (`src/lib/workforce-economics/`, shipped #3791) into the Moves board-grade Costed Business-Case Pack (the WE-3 step). Behind the default-OFF `moves_workforce_economics` flag: when on for a tenant, the business case derives a workforce estimate from the Move's kernel skeleton (reconstructing effort-hours and back-deriving the blended rate so the TRADITIONAL total reconciles to the kernel investment exactly — no second rate basis invented), computes the estimate-twice economics (traditional vs AI-native + delta/savings), and attaches it as an optional field that flows into the existing exhibits. **Flag OFF (every tenant today) = byte-identical** to the current deterministic business case.

## Layer Impact

- **global-control-lane (flag-gated, dormant):** a new pure binding module + an OPTIONAL `workforceEconomics` field on `MoveCostedBusinessCasePack`; the field is populated only when the flag is on and the engine returns non-null. The flag is evaluated at the route call site; the pack model stays pure. One new flag.

## Client Applicability

- All clients: No runtime change — flag off → no engine call, no field, identical output.
- Specific clients: None enrolled (per-tenant flip later with its own proof).
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_workforce_economics` (default OFF; env `ABARVA_FEATURE_MOVES_WORKFORCE_ECONOMICS_TENANTS`).

## Changes Included

- `src/lib/programs/expert-kernel/exports/board-grade/move-workforce-economics-binding.ts` (new) — `deriveWorkforceEstimateInput` + `buildMoveWorkforceEconomics`.
- `move-pack-model.ts` — optional `workforceEconomics?: WorkforceEstimateTwice` + optional `opts.workforceEconomicsEnabled` on `buildMoveCostedBusinessCasePack`.
- `move-html-renderer.ts` + `index.ts` — thread the optional opts.
- `src/app/api/v1/moves/board-grade-business-case/route.ts` — evaluate the flag, pass `workforceEconomicsEnabled`, fold into the render cache key.
- `src/lib/features/registry.ts` — `moves_workforce_economics`.
- test — flag ON carries estimate-twice (traditional present, AI-native lower, delta consistent, reconciles to kernel investment within $1); flag OFF is deep-equal to baseline.

## QA / Validation

Validation: Pass. `tsc --noEmit` clean. Affected board-grade business-case/estimate suites + the new binding suite pass 35/35 (3 suites); workforce engine still 13/13. Flag-OFF safety proven: the default pack and an explicit `{workforceEconomicsEnabled:false}` pack are deep-equal, and stripping the field from the ON pack leaves it identical to OFF (purely additive). Conservative scope→input mapping documented (effort-hours via headcount×duration×173; blended rate back-derived from the kernel total; skips when scope is too thin or there's no agent story). Runtime/end-to-end proof (flag on, real Move at P1) deferred to env/rollout.

## Rollout Plan

Merge to `main` (dormant). Activation: flip `moves_workforce_economics` for a tenant + generate a board-grade business case on a real Move + verify the estimate-twice economics render. No flag flip in THIS release.

## Deployment Authority

Not applicable to this merge — flag off everywhere, no runtime change.

- Repo-owned deploy workflow: `aca-main-deploy` ships the code; engine uncalled with flag off.
- Shared runtime mutators: none.
- Approved image digest: built by the deploy workflow.
- ACA runtime invariant: business case identical with flag off.
- Worker image invariant: n/a.
- Feature/env flag update path: `moves_workforce_economics` (later).
- Live signed-in proof required: Yes — at flag-flip on a real Move, not this merge.

## Rollback Plan

Revert the PR — removes the binding + flag + optional field. No data/migration.

## Known Gaps

- First binding slice: rates reconstructed from the kernel total (real rate-card substrate port is WE-1); no dedicated UI exhibit yet (flows into existing economic exhibits).
- Not runtime-proven; the AI-native worked-example point still needs reconciliation with the brief narrative (carried from #3791).

## Audit Evidence

- PR URL: (filled on creation) `claude/scb-workforce-moves-bind` → `main`.
- CI: `npm run release:check`, tsc clean, business-case + binding 35/35 + flag-off deep-equal proof.
