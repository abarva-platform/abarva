# 2026-08-29-tower-layer4-purge-mode — Let Layer 4 release its references so Layer 3 can reload

## Release ID

`2026-08-29-tower-layer4-purge-mode`

## Status

`candidate`

## Plain-English Summary

A Layer 3 canonical reload fails once Layer 4 has been built:

```
ERROR: update or delete on table "measure" violates foreign key constraint
       "tower_value_chain_measure_fk" on table "tower_value_chain"
```

`ecl_projection.tower_value_chain` — a Layer 4 table — holds a foreign key onto
`ecl_context.measure`, a Layer 3 one. Layer 3 cannot replace its measures while those references
exist. This is structural rather than incidental: it will happen on *any* Layer 3 reload, for any
reason, and it has gone unnoticed only because nobody has re-run Layer 3 since Layer 4 first
landed.

Layer 4's loader already deletes every projection row it owns at the top of its own load, scoped to
tenant and assessment, with no version filter. The machinery to release the references existed; it
just could not be invoked on its own. This adds `--purge-only`, which runs that delete block and
stops, so the operator sequence is explicit:

```
layer4 --purge-only  ->  layer3 load  ->  layer4 load
```

The teardown stays on the Layer 4 side of the boundary. The alternative — having the canonical
loader delete projection rows — would put Layer 3 in the business of mutating a layer it does not
own, and would hide the dependency instead of naming it.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4 loader:** the delete statements move into a shared `projectionDeletes()` used by both
  the load and the new purge, so the two can never drift. Adds `--purge-only` /
  `TOWER_LAYER4_PURGE_ONLY`, gated on the same `TOWER_LAYER4_AZURE_WRITE_APPROVED` a write requires.
- **Layer 3:** unchanged. It stays the sole owner of canonical rows.
- **App:** unchanged.

## Client Applicability

- All clients: this changes an operator tool, not a runtime path. No product behaviour changes.
- Feature flag: none.

## Changes Included

- `scripts/tower/load-healthcare-demo-layer4-products.mjs` — extract `projectionDeletes()`, add
  `writePurgeSql()` and the `--purge-only` branch.
- `scripts/tower/__tests__/run-layer4-purge-mode-tests.mjs` — new contract tests.
- `package.json` — `tower:healthcare-demo-layer4-products:purge-job`, `test:layer4-purge-mode`.
- `docs/ops/aca-data-build-job-rule.md` — the three-job reload order, and two operational traps.

## QA / Validation

- `npm run test:layer4-purge-mode` → 7/7. The checks that matter: the purge clears
  `tower_value_chain`; it touches **only** `ecl_projection.*` plus `ecl_context.snapshot`, and
  explicitly never `ecl_context.object`, `.measure`, `.relationship` or `.metric_definition`; every
  delete is scoped to one tenant and one assessment; it refuses without the write approval.
- `node --check` on the loader → clean.
- `eslint` on both changed scripts → clean.
- Ran `--purge-only` locally without `DATABASE_URL` and confirmed it refuses rather than doing
  anything partial.
- `node scripts/release-check.mjs --base origin/main --head HEAD` → passes with this record.

## Rollout Plan

Merge to `main` by squash; the deploy workflow builds the image that carries the new script. The
purge itself is an operator action, run deliberately, never automatically.

## Deployment Authority

- Repo-owned deploy workflow: unchanged.
- Shared runtime mutators: none in this release.
- Data-plane jobs: the three-job sequence above, digest-pinned, each with
  `--secret-env DATABASE_URL=azure-postgres-control-database-url`.
- Live signed-in proof required: after the sequence, a capture showing a real `gating_constraint`
  on a case.

## Rollback Plan

Revert the squash commit. The purge is opt-in and does nothing unless invoked, so reverting removes
a capability rather than changing behaviour. Any purge already run is undone by re-running the
Layer 4 load, which rebuilds every row it deleted from Layer 3.

## Audit Evidence

- The five-file diff.
- `test:layer4-purge-mode` output.
- The original failure: execution `job-abarva-private-operator-eus-deyzz30`, full error in that
  run's `04-logs.txt`.

## Known Gaps

- Not yet run against Azure; `candidate`.
- **Layer 4 is empty between the purge and the reload.** Tower surfaces read no projection during
  that window. This is intended and stated in the runbook, but it means the sequence should not be
  run while anyone is looking at Tower.
- Only the healthcare-demo Layer 4 loader gains a purge. Other loaders with the same shape will hit
  the same constraint and need the same treatment.
- The foreign key itself is unchanged. A cascade would remove the need for an ordered teardown, but
  it would also let a canonical reload silently delete projection rows — worse, not better.
