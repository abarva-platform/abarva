# 2026-10-07-move-evidence-tenant-read-scope — Approved evidence is found under either key the same tenant is stored under

## Release ID

`2026-10-07-move-evidence-tenant-read-scope`

## Status

`candidate`

## Plain-English Summary

A Strategic Move's evidence rows carry a tenant key, and one tenant can have
more than one. The product writes the app client key when a user uploads a file.
A data-plane load job writes the canonical substrate key. For several tenants
those are different strings, and both correctly name the same tenant.

Two parts of the product read those same rows, joined on the same column, with
different scopes. The discovery-evidence reader matches any key belonging to the
tenant. The current-state readiness reader — the one whose hard gaps the
discovery phase counts — matched exactly one key. So an approved evidence family
whose rows were written by a load job was invisible to the reader that gates the
phase, and the phase reported it as missing evidence. Missing is
indistinguishable, on screen and in the gate count, from nothing having been
uploaded at all. The uploader is then asked to supply a family that has already
been supplied and approved, which no amount of re-uploading can fix, because the
reader is looking under the wrong name rather than failing to find the file.

This has already cost one manual intervention: a load wrote one Move's rows
under the canonical key, and clearing it needed a one-off authorised rekey of
those rows rather than a reader that could see both. That repair fixed one Move.
Any later load for any Move would hit the same wall.

This release gives both readers the same scope: every key the requesting
tenant's own alias profile declares, and nothing else. The P0 minimum-evidence
read, which backs a hard gate criterion of its own and had the identical narrow
scope, is corrected the same way. Writes are untouched — new rows still carry
the single app client key — so this changes only what a read can find, never
what a row says.

Widening a tenant scope is the kind of change that must not be taken on trust,
so the precondition it rests on is now a test rather than an assumption: no two
tenant profiles may claim the same key. The alias lookup is a map, so a key
claimed by two tenants would resolve to whichever was registered last and would
quietly point one tenant's read at another's rows with no error anywhere. The
check reads every tenant from code, and the detection itself is proven against
colliding pairs — a check that can only ever answer "fine" is worth no more than
a constant that says so.

This cannot clear a gate by itself. Evidence still counts only once a human has
approved it; what changes is that an approval is seen.

## Layer Impact

Release lane: `global-control-lane` — shared application read behaviour for all
clients. No client-scoped schema, seed, ingestion, or private data-plane change.

- **Layer 1–2 (intake, adapters):** no change.
- **Layer 3 (canonical model):** no change. No schema, no migration, no new
  column, and no backfill. The tenant key stored on a row is not rewritten by
  anything here.
- **Layer 4 (products — Moves):** two server-side reads widen their tenant
  fence from one key to that tenant's declared key set. The readiness
  computation, the gate evaluator, the evidence packets, the approval ladder and
  the generation prompts are untouched; they continue to read exactly the
  predicates they read today, over rows they can now see.

## Client Applicability

- All clients: yes — control-plane read behaviour on the Moves evidence path.
- Specific clients: none. The change is driven by the requesting tenant's own
  alias profile, so a tenant whose app key and canonical key are the same string
  reads exactly as before.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. A read whose tenant has a single key produces a one-element
  key set, which is the behaviour it had before.

## Changes Included

- `src/lib/programs/evidence-readiness/tenant-read-scope.ts` — new leaf module.
  `moveEvidenceReadTenantKeys` is the single declaration of which tenant keys a
  move-scoped evidence READ may match, and answers no keys at all without a
  tenant. `evidenceTenantScopeReport` names, for observed stored keys, which ones
  a client-key-only read would miss and which belong to another tenant, reported
  apart rather than folded in. `tenantAliasProfilesAreDisjoint` is the safety
  precondition, parameterised so the detection is provable. 
  `storedTenantKeyNamesSameTenant` attributes an already-read row's key.
- `src/lib/programs/current-state-doc-ingest.ts` — `resolveDocFamilyReviews`,
  the reader behind the discovery phase's hard evidence gaps, scopes both its
  review read and its evidence-item read to the key set. The no-tenant guard is
  unchanged, so a request without a tenant still reads nothing.
- `src/lib/programs/p0-source-evidence.ts` — `loadP0MinimumEvidenceStatus`
  scopes its three reads (reviews, evidence items, move artifacts) the same way.
  All three were widened together on purpose: widening the review read alone
  would find the review and lose its artifact, which fails in the same place.
- Tests: `src/lib/programs/evidence-readiness/__tests__/tenant-read-scope.test.ts`
  (new, 24 cases) and
  `src/lib/programs/__tests__/current-state-doc-family-review-scope.test.ts`
  (new, 6 cases), plus two cases added to the P0 suite. Tenant keys in the new
  cases are derived from the alias table in code, never hand-typed, and one case
  proves the derivation found a tenant whose two keys actually differ — without
  it the others could compare a key against itself and pass for the wrong reason.
- `src/lib/programs/__tests__/p0-source-evidence.test.ts` — the suite's DB mock
  resolved its query on a COUNT of `in` calls, so widening a fence to use `in`
  made it resolve one filter early. It now resolves on the query's last filter,
  named by column.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/lib/programs src/lib/tenant src/app/api/v1/programs` —
  358 suites, 4829 tests.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0.
- **PASS** `npx eslint` over the changed paths — exit 0.
- **PASS** `node scripts/audit/moves-gate-consistency.mjs`.
- **PASS** `node scripts/audit/moves-evidence-lifecycle.mjs`.
- **PASS** `npm run audit:tenancy-fence-coverage:check` — no fence-census drift;
  the changed files are not route handlers.
- **PASS** mutation testing, 13 mutations, 12 killed. Killed: restoring the
  single-key fence at each of the four widened query sites, each of which fails
  its own canonical-key case; making the scope resolver return only the key it
  was given; folding an out-of-scope key in with the missed ones; making the
  disjointness check answer true unconditionally; reporting a tenant as
  colliding with itself; dropping key normalisation before comparing claims;
  attributing a stored key by exact string instead of by tenant; dropping the
  dedup of missed keys.
- **SURVIVED, diagnosed, not papered over:** removing the explicit no-tenant
  early return changes nothing, because the alias helper it delegates to already
  answers an empty set for a falsy key. The branch is kept so "no tenant reads
  nothing" is stated by this module rather than inherited, and the diagnosis is
  recorded at the branch so it is not re-litigated as a coverage gap.
- **NOT RUN** live signed-in walk. Whether the discovery phase's evidence count
  actually falls for a Move whose rows were written by a load job needs loaded,
  approved evidence and a signed-in session. That is outside the code lane.
- **NOT RUN** any data-plane job. No rows were read, written, or rekeyed.

## Rollout Plan

Merge to `main` by squash. Active for all clients on the next repo-owned ACA main
deploy. No migration, no environment variable, no feature flag, no data-plane
build, and no backfill.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow; not pinned here.
- ACA runtime invariant: to be proven by that workflow after merge, not claimed
  by this record.
- Worker image invariant: unaffected — no worker job changes.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, before any claim that this is live-proven.
  Not performed here, and out of scope for the code lane.

## Rollback Plan

Revert the squash commit. Nothing persists that depends on the widened scope: no
row is written, moved, or rekeyed, and the readers return to matching a single
key. A Move whose evidence sits under the canonical key returns to reporting
that evidence as missing, which is the behaviour before this change.

## Audit Evidence

- The PR and its CI run.
- The per-tenant key set is derived from the declared alias profiles in code, so
  the scope of any read is inspectable from the profile alone.
- The disjointness invariant is asserted on every run of the new suite, against
  every tenant declared in code.

## Known Gaps

- **Nothing reports a scope miss to anyone.** `evidenceTenantScopeReport` can
  name the stored keys a narrow read would have missed, but no surface and no
  operator report calls it yet. Today the condition is corrected silently; a
  reviewer cannot see that it ever applied. Wiring that reading into an operator
  view is a separate change.
- **The sweep is scoped to the two readers that gate a phase.** Other readers of
  the same tables still match a single key — the deliverable evidence assembler
  and the approved-evidence snapshot among them. They were left alone because
  widening a read that feeds generated content is a different risk from widening
  one that feeds a gate count, and should be argued on its own evidence rather
  than carried along. They remain a latent instance of the same shape.
- **Writes still pick one key.** A row's tenant key is still whichever producer
  wrote it, so the two-name condition persists in the data; this change makes
  readers tolerant of it rather than removing it. Deciding on one stored key for
  move-scoped evidence, and migrating to it, is a data-lane question.
- The disjointness check guards the profiles declared in code. It cannot guard a
  tenant key that reaches a read without passing through a profile at all; such a
  key resolves to itself and is widened to nothing, which is the safe direction
  but is not the same as being validated.
