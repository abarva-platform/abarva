# Tower — read "was this recorded" from what Layer 4 asserted

## Release ID

`2026-08-30-tower-spend-loaded-from-assertion`

## Status

`candidate`

## Plain-English Summary

A previous change made the governed-rows table render absence instead of a coerced zero for Spend,
Readiness and Risk. Readiness and Risk worked. **Spend did not** — the thirteen tool rollouts still
rendered `$0` after deploy.

The flag was derived by asking the serving row whether it carried a cost. That question cannot be
answered from the row, because `payload_json` is `to_jsonb(p)` over the projection table: it
carries **every column of that table for every row**, whether or not the loader meant anything by
it. `tower_ai_portfolio` has a `monthly_cost_usd` column, so every rollout appeared to carry a
cost, the flag came back true, and the cell rendered the coerced `$0`.

`display_payload_json` carries only what the loader chose to write, and the two row types differ
there exactly as they should:

| Row type | Cost key in the display payload |
| --- | --- |
| Business case | `approved_funding_usd` |
| Tool rollout | **none** |

So the flag now reads the display payload only. This is correct whatever the column's storage
semantics turn out to be, which matters because they could not be established — see Known Gaps.

## Layer Impact

Lane: `global-control-lane`. Layer 3 (serving reader) only.

Adds `displayNullableNumberFrom`, a display-payload-only sibling of
`payloadNullableNumberFrom`. The existing reader is unchanged and still used everywhere else — the
distinction is deliberate: read a **value** through the row, read **whether it was recorded** from
the assertion. `aiTaggedSpendUsd` is untouched and still coerces to 0, so no total moves.

## Client Applicability

**All clients.** Every tenant reading the Tower AI portfolio table. Not flagged, not tenant-scoped.
A tenant whose rollouts genuinely record a cost in their display payload is unaffected.

## Changes Included

- `src/lib/tower/readTowerCommandCenter.ts` — `displayNullableNumberFrom`; `aiSpendLoaded` derived
  from it.
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — the guard now pins the assertion
  read, and a second guard keeps the display-only reader from acquiring a row-body fallback.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 33/33 |
| Tower suites | PASS against baseline — 521 pass / 21 fail across 6 suites; failing set diffed against `origin/main` and **identical** |
| `tsc --noEmit` | PASS — clean |
| `eslint` | PASS — clean |
| Guard mutation test | PASS — swapping the display reader back to the payload reader fails a guard; restored, 33/33 |
| Live signed-in proof | NOT RUN — pending deploy. |

## Rollout Plan

Ships with the next `main` deploy through the repo-owned ACA main deploy workflow. No flag, no env
change, no data build.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge to `main`, digest-pinned. No ad-hoc `az` command
and no shared-traffic mutation from this branch.

## Rollback Plan

Revert the commit. One derivation; no stored or summed value changed.

## Known Gaps

- **The stored value was never established.** Whether the deployed
  `ecl_projection.tower_ai_portfolio.monthly_cost_usd` holds NULL or `0` for a rollout is still
  unknown. This change makes the question stop mattering for the render, but it does not answer it.
- **`az containerapp exec` cannot answer it from an agent shell.** The CLI always opens an
  interactive session — `tty.setcbreak` on non-terminal stdin raises `termios.error (19)` — and it
  exits `0` with the traceback on stderr, so a piped invocation looks like it returned nothing.
  `AGENTS.md` names `exec` as the allowed read-only break-glass path; in practice a read-only probe
  needs the ACA Job pathway.
- **No migration in this repository creates any of the four `ecl_projection` tables Tower reads.**
  `tower_ai_portfolio`, `tower_command_center`, `tower_value_chain` and `tower_evidence_queue` each
  return zero results for a `create table` search across `supabase/migrations/`. The only DDL is a
  draft under `docs/architecture/sql-drafts/`, which says `monthly_cost_usd numeric` — nullable —
  while the sibling `tower_ai_tool_usage` migrations declare the same column
  `NOT NULL DEFAULT 0`. The deployed schema is therefore unversioned and not reproducible from the
  repo. That is a governance gap well beyond this defect and is filed separately.

## Audit Evidence

The `$0` persisted on the live page after the deploy carrying the previous fix succeeded
(`aca-main-deploy` for the prior change, 00:01:30), while Readiness and Risk from the same commit
and the same file rendered correctly — which located the fault in the derivation rather than in the
render or the deploy. The loader writes `approved_funding_usd` into the case display payload
(`scripts/tower/load-healthcare-demo-layer4-products.mjs:688`) and no cost key into the rollout
payload, and the serving function projects `to_jsonb(p)` as `payload_json`
(`supabase/migrations/20260829113000_tower_active_layer4_serving_views.sql:340`).
