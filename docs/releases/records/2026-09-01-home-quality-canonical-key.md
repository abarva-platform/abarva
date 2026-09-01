# 2026-09-01-home-quality-canonical-key — A read model that normalised to an alias

## Release ID

`2026-09-01-home-quality-canonical-key`

## Status

`candidate`

## Plain-English Summary

I said this one was a question for a person, because rewriting a test to match the
code on a matter of tenant identity is the wrong move. It was a question with a
declared answer, and the answer says the code was wrong.

`normalizeHomeQualityTenantKey` exists to turn any spelling of a tenant into one
canonical key. For one tenant it returned a string the tenant alias table declares
as an **alias**, not as that tenant's canonical key. Every other branch of the same
function already returned a canonical key.

That had a consequence beyond tidiness. One line compared the normalised key
against a canonical key written out beside it, and could therefore never be true.
The diagnostic block behind it had been silently absent for every request for that
tenant since the two drifted apart.

## How it was decided, rather than guessed

Four independent signals, all pointing the same way, none of them a preference:

1. `src/lib/tenant/aliases.ts` declares the canonical key for that tenant, and
   lists the value the function returned among its aliases.
2. `CANONICAL_TENANT_KEYS` contains the declared canonical key and not the alias.
3. Every other branch of the function returns a canonical key.
4. The function opens by replacing `_` with `-`, so returning a value
   containing `_` contradicts its own normalisation.

Identity is declared, never inferred — including when the thing to be resolved is
which of two spellings the product itself should use.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged. No intake, adapter, canonical-model or schema change.
- **Layer 4 / products:** the Home data-quality read model's internal join key,
  and one branch that had gone dead.

## Client Applicability

- Both active tenants. Nothing client-visible changes: the repaired branch fills a
  diagnostic field, and the join key is compared only against itself.
- Feature flag: none.

## Changes Included

- `home-data-quality.ts` — the normaliser returns the canonical key; the dead
  branch compares against the normaliser's own output rather than a key written
  out beside it. A literal on one side of a comparison whose other side is
  computed is a branch waiting to go dead.
- `home-data-quality.test.ts` — two derived cases: every output of the normaliser
  is a member of `CANONICAL_TENANT_KEYS`, and normalising twice does not move the
  key.
- `docs/ci/home-test-baseline.json` — re-recorded, 15 failing suites to 13.

## QA / Validation

- PASS the read model's own suite 6/6, up from 2 of 4
- PASS Home surface 560/589 across 68 suites, up from 555/587
- PASS `tsc --noEmit` clean, `eslint` 0 errors
- **Mutation-tested twice:** restoring the alias as the output fails two cases,
  one of them the derived one — so the drift is caught even by someone who
  "fixes" the literal assertion by changing what it expects. Writing the key out
  as a literal again fails the case that covers the branch.

## Rollout Plan

Merge to `main`. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: no — the repaired field reaches no surface

## Rollback Plan

Revert, and re-record the baseline.

## Audit Evidence

- The four declared signals above, each readable in the repository.
- The two mutation-test results.
- Before and after counts from the ratchet, which reads a Jest report.

## Known Gaps

- **The repaired field is rendered nowhere.** The diagnostic behind the dead
  branch is computed and no surface reads it. It now contains what it always should have; whether it
  should exist at all is a separate question, and deleting a diagnostic on the day
  it starts working is the wrong order.
- Thirteen suites remain baselined on the Home surface.
- The same drift pattern — a computed value compared against a hand-written
  literal — is not searched for elsewhere here.
