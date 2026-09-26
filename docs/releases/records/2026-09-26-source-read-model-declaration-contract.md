# 2026-09-26-source-read-model-declaration-contract — Source read-model declarations validated by value

## Release ID

`2026-09-26-source-read-model-declaration-contract`

## Status

`candidate`

## Plain-English Summary

The Source product plans thirteen read models — the tables a surface reads instead of recomputing
facts. None is built yet; each is `proposed`. Before any of them may be built, its declaration has
to answer thirteen questions, two of which are safety questions: what happens when the data is
older than the model's freshness promise, and what happens when one client's query reaches another
client's row.

The check that enforced this asked only whether each answer was *written down*, not whether the
answer was *acceptable*. So a declaration that said its stale behaviour was "serve stale silently",
its tenant fence was "none — any tenant may read any row", and its owner was "TBD" was reported as
having a complete build contract. That is a check a sentence can satisfy, which makes it not a check.

This change validates the safety-bearing answers instead of counting them:

- stale behaviour must be one of the two fail-closed behaviours — refuse to answer, or answer and
  label the answer stale;
- the tenant fence must name the tenant column it is applied to;
- the opposite-tenant query must state that a cross-client read returns nothing;
- the model's keys must include the tenant column, or the grain is not client-scoped at all;
- the freshness promise must state a duration something can exceed;
- the as-of basis must name the field it preserves;
- a placeholder (`TBD`, `n/a`, `none`, `-`, `?`) counts as no answer in any field.

It also replaces a test that would have gone red for the wrong reason. That test asserted one named
model was *incomplete*, so the day someone completed that model's declaration properly, the suite
would have failed and the fix would have looked like the defect. The replacement asserts the thing
that is actually always true: no model may be *half* declared, because a half-declared model reads
as documented and is not. That statement holds while every model declares nothing, holds once a
model declares everything validly, and fails only in between.

**What this does not do, stated plainly.** It governs declarations, not running queries. Every one
of the thirteen models is still `proposed`, so there is no deployed read model to interrogate: no
live query to starve of fresh rows, no cross-client key to push through a real fence. Contract tests
that drive a read model and prove it fails closed at runtime are still owed. They become writable
the first time a model leaves `proposed`, and this record does not claim them.

## Layer Impact

Release lane: **`internal-admin`**. This is an AbarVa-only build-governance control over Source
read-model declarations. It is not `global-control-lane`, because no shared app or control-plane
behaviour any client reaches changes, and not `client-data-lane`, because no schema, RLS policy,
seed, ingestion or retrieval path is touched.

- **Layer 3 — canonical model:** no change. No fact, projection, migration or row is touched.
- **Layer 4 build governance (Source read models):** the declaration gate that decides whether a
  proposed read model may be built now rejects declarations whose stated behaviour is not
  fail-closed. Nothing is built or unbuilt by this change.
- **Layer 1/2 (intake, adapters) and every product surface:** no change. No route, component or
  answer path imports the module changed here; its only consumers are one behaviours suite and one
  operator script.

## Client Applicability

- All clients: no behavioural change. Nothing client-visible reads this module.
- Specific clients: none.
- Internal only: yes — this is a build-governance control for the Source data plane.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/read-model-inventory.ts` — `assessSourceReadModelContract` validates the
  policy-bearing fields by value and returns a new `invalid: [{ field, reason }]` list alongside
  `missing`; `metadataComplete` is false when either is non-empty. Adds
  `classifySourceReadModelDeclaration` (`undeclared` / `partial` / `contracted`),
  `SOURCE_READ_MODEL_STALE_BEHAVIORS` and `SOURCE_READ_MODEL_TENANT_KEY`. The thirteen inventory rows
  and their `proposed` state are unchanged, byte for byte.
- `src/__tests__/behaviors/source-read-model-inventory.test.ts` — 3 cases to 13. One case replaced
  (see summary); the rest are net-new value rules plus the non-inverting live-inventory assertion.
- `scripts/source/check-read-model-inventory.ts` — prints the declaration state and each invalid
  field with its reason, not only missing fields.
- `docs/source/SOURCE_READ_MODEL_INVENTORY.md` — one sentence replaced, the one asserting the check
  measures completeness "only, not validity". Its proposed/Unverified table is untouched.

## QA / Validation

Measured on branch `exec/d-031-read-model-declaration-contract` from `origin/main` `1526110e7`.

**The defect, reproduced by execution before any fix** — a declaration supplying all thirteen fields
with `tenantFence: "none — any tenant may read any row"`,
`oppositeTenantQuery: "returns the other tenant's rows"`, `staleBehavior: "serve stale silently"`,
`owner: "TBD"`, `buildJob: "none"` returned exactly `{"metadataComplete":true,"missing":[]}` from the
pre-change control. That case is now `src/__tests__/behaviors/source-read-model-inventory.test.ts`
→ "certifies nothing when a declaration states the opposite of every invariant".

**Failing first, over one scope, one suite.** The new suite run against the pre-change module:
**12 failed / 1 passed of 13**. Against the change: **13 passed / 0 failed**. The one case that
passed both is the unchanged enumeration case. The pre-change suite had 3 cases, all passing, so
this is 3 cases to 13 rather than a repair of a red suite — no absolute failure count here is
attributable to this change.

**Mutation — ten mutations, ten caught, each by the case that names the property.** Every mutation
was applied to the shipped module and the suite rerun:

| # | mutation | suite result | case that went red |
|---|---|---|---|
| M1 | stale-behaviour enum check always true | 2 failed / 11 passed | rejects a stale behaviour that is not fail-closed |
| M2 | tenant-fence check always true | 2 failed / 11 passed | rejects a tenant fence that does not name the tenant key |
| M3 | opposite-tenant denial check always true | 2 failed / 11 passed | rejects an opposite-tenant query that does not state denial |
| M4 | as-of field-token check always true | 1 failed / 12 passed | rejects an as-of that names no field to preserve |
| M5 | freshness-duration check always true | 2 failed / 11 passed | rejects a freshness SLA that states no duration a read can exceed |
| M6 | keys tenant-scope check always true | 2 failed / 11 passed | rejects a grain whose keys are not tenant-scoped |
| M7 | placeholder set emptied | 2 failed / 11 passed | rejects a placeholder in any required field |
| M8 | `invalid` no longer blocks `metadataComplete` | 8 failed / 5 passed | all seven value cases plus the hostile-declaration case |
| M9 | `partial` state collapses into `undeclared` | 1 failed / 12 passed | holds no half-declared model |
| M10 | a real inventory row half-declared (`event_gate_v1` given two fields) | 1 failed / 12 passed | holds no half-declared model |

M4 is caught by exactly one case, which is the point of running them one at a time: in the
hostile-declaration case its `asOf: "-"` is *also* a placeholder, so the placeholder rule would have
absorbed M4 and the as-of rule would have looked proven when it was not. M10 exists because the live
inventory is clean today — all thirteen models declare nothing, so the live assertion passes
trivially, and a detector nobody has shown to fire is not a detector. Half-declaring a real row
turns it red.

**Suite and tree.**

- `npx jest --runTestsByPath src/__tests__/behaviors/source-read-model-inventory.test.ts` — 13/13 pass.
- `npm run test:behaviors` — 139 suites / 1370 tests, all pass, 0 failed.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, zero
  diagnostics. Judged on the exit code, not on a grep: a bare `npx tsc --noEmit` exits 134 on this
  operator host and emits nothing, which greps as clean.
- `npx eslint` over the four changed source/script files — exit 0.
- `npx tsx scripts/source/check-read-model-inventory.ts` — reports `13/13 models lack a complete
  contract (0 half-declared)`, which is the same population verdict as before the change, now with
  the state named.

## Rollout Plan

Merge to `main`. No runtime rollout: no migration, no data build, no ACA job, no flag, no env var,
no image behaviour change. The repo-owned `aca-main-deploy` workflow will deploy the merge commit as
it does every merge; this change alters no runtime code path, since the module's only consumers are
a test suite and an operator script.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: whatever digest the repo-owned workflow builds from the merge commit; this
  release pins none of its own.
- ACA runtime invariant: to be proven read-only after merge by comparing the Container App template
  image with the 100%-traffic revision image.
- Worker image invariant: unaffected; no worker job changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no.** No client-visible surface, route or answer path changes.
  Saying otherwise would owe a proof that could not be about this change.

## Rollback Plan

Revert the squash commit. No migration to unwind, no data written, no projection rebuilt, nothing
to re-run. The reverted state is the pre-change presence check, which is less strict — so a revert
cannot leave a declaration blocked that the older control would have passed.

## Audit Evidence

- PR URL and CI run for this branch.
- The before/after numbers in QA above, each reproducible from the commit: re-run the new suite
  against `git show origin/main:src/lib/source/data-model/read-model-inventory.ts` for the 12/1 split.
- The mutation table: each row is one edit to `read-model-inventory.ts` plus one suite run.
- `npx tsx scripts/source/check-read-model-inventory.ts` output.

## Known Gaps

- **The runtime half of the item is not done and is not claimed here.** Contract tests that drive a
  read model and prove it fails closed past its freshness SLA, denies an opposite-tenant key and
  preserves its as-of basis need a read model that exists. All thirteen are `proposed`; there is no
  subject. This is a gap in the declarations, not in the runner.
- **No model has been brought to `contracted`.** The gate is now strict enough to be worth passing;
  filling in a real model's thirteen fields from its actual Layer 3 rows is separate work, and the
  first candidate the doc names is `event_queue_v1`.
- `scripts/source/check-read-model-inventory.ts` is referenced by no `package.json` script, no
  workflow and no doc other than the inventory doc, so `--require-complete` runs nowhere. The control
  that actually runs in CI is the behaviours suite. Filed rather than fixed here, to keep this change
  to one reviewable subject.
- `owner` is checked for placeholders only. There is no honest way to validate that a name belongs
  to a real accountable person from inside a type check.
