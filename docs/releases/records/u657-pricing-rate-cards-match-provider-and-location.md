# u657 — Pricing rate cards match provider class and location; internal staff priced only from the client card

## Release ID

`2026-10-16-pricing-provider-aware-rate-cards`

## Status

`candidate`

## Plain-English Summary

A client rate card can already store several rates for one role: one per provider class (for example a global system integrator, an engineering boutique or an offshore provider) and per delivery location. The database, the CSV import and the duplicate check all carry `provider_ref` and `location_ref` on every line. The rate resolver ignored both, so a card holding several rates for one role at one level priced every pod member from whichever of those lines came first.

This change makes the resolver use those dimensions:

- **Most specific line wins.** A line is used only when every dimension it names fits the pod member's level, provider class and location. Provider outranks location, which outranks level.
- **Ambiguity is a gap, not a guess.** If the member's provider is unknown and the card has competing provider-specific lines (with no generic line), the rate is a stated gap naming the competing providers. It does not fall back to a lower scope, which would silently ignore the client's card.
- **No borrowing across levels.** A line at another level is no longer used for a member whose level is known. Previously it was, which priced a junior role at a senior rate or the reverse. Such a member now falls through to the global card or the band default as normal.
- **`INTERNAL` provider class for the client's own staff.** It is priced only from a client card line marked `INTERNAL`, and never from a supplier band rebased by a supplier tier. With no such line, the member is refused with `internal_rate_missing`.
- **Import validates the new dimensions.** A misspelt `provider_ref` or `location_ref` is now a row error naming the valid codes. Before, it was a line that silently never matched. `INTERNAL` is accepted. The check is skipped when the reference tables are not loaded.

The pricing explanation now says which provider or location a card line was set for, replacing the old "the resolver does not match location/provider" caveat.

## Layer Impact

Release lane: `global-control-lane`. Shared pricing-engine behaviour for every client, with no flag.

- **Layer 4, products (Moves pricing engine):** pure resolver and adapter logic plus the governed CSV import's validation. No schema, migration, data or route change.

## Client Applicability

- **All clients:** yes, wherever a client rate card is loaded and the bill-rate path prices a pod or an estimate.
- **Specific clients:** none.
- **Internal only:** no.
- **Public/demo only:** no.
- **Feature flag:** none.

The Moves ROM preview and the P3 estimate step price from the committed reference pack and do not read client cards yet, so their numbers do not change in this release. Wiring the tenant's approved card into the Moves ROM is a separate follow-up.

## Changes Included

- `src/lib/pricing/effort-engine/rate-card-resolver.ts`: dimension-aware line matching, ambiguity gap, no cross-level borrowing, `INTERNAL` gap.
- `src/lib/pricing/effort-engine/types.ts`: `INTERNAL_PROVIDER_CLASS`; `ResolvedRate.matchedProviderRef` / `matchedLocationRef`.
- `src/lib/pricing/effort-engine/pod-rate-adapter.ts`: passes the member's provider and location; `INTERNAL` handling; accurate not-applied reasons.
- `src/lib/pricing/governed-load/semantic-validation.ts`, `reference-lookup.ts`: provider/location validation on import.
- Tests: `rate-card-resolver.test.ts` (+8), `pod-rate-adapter.test.ts` (+3, one pinned caveat string updated), `semantic-validation.test.ts` (+3). The two PR7 fixture harnesses stub the two new reference reads.

## QA / Validation

- `npx jest src/lib/pricing`: 701 passed, 701 total. That is 687 on main plus 14 new cases.
- Mutation check: 11 hand mutants of the new logic, covering the ambiguity check, the level rule, the guess penalty, provider-over-location ranking, the `INTERNAL` gap, ambiguity falling through scope, the adapter dropping dimensions, the refusal code, and the provider/`INTERNAL`/location import checks. All 11 were killed; 2 survived the first round and were closed with new cases.
- `npx eslint` on changed files: clean. `tsc --noEmit`: no errors in `src/lib/pricing`.

## Rollout Plan

Merge to main and ship in the next repo-owned ACA main deploy. No migration and no flag. The new behaviour applies to the next rate resolution after deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: set by the main deploy.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: no. This is a pure pricing change; there are no client cards in the Moves path yet.

## Rollback Plan

Revert the squash commit and redeploy through the main deploy workflow. Nothing to undo in data: no rows are written or rewritten.

## Known Gaps

- **The Moves ROM does not read client rate cards yet.** The P3 estimate step, the ROM preview and the P4 deck workbook still price from the committed reference pack. The follow-up is to load the tenant's approved card and pin its version into the approved estimate, so a later card change cannot move an approved number.
- **No screen exists for loading a card.** Import and approval are API-only (`/api/admin/pricing/rate-cards`). A tenant setup screen is a follow-up.
- **No reference fallback for `INTERNAL`.** It has no reference provider-class row by design; internal rates must come from the client card.

## Audit Evidence

- PR URL and CI run (pricing suites, release check).
- The 11-mutant table in the PR description.
