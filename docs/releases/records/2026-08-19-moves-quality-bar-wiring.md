# 2026-08-19-moves-quality-bar-wiring — The canonical quality contract reaches the Moves runtime

## Release ID

`2026-08-19-moves-quality-bar-wiring`

## Status

`candidate`

## Plain-English Summary

The per-artifact quality contract — depth bands, ceilings, narrative-spine
requirements, reconciled across two pipelines in July — had never executed once.
The Moves request builder hardcoded a generic bar and never called
`resolveQualityBar`; the only production caller was the generic builder, which
the Moves routes do not use.

The enforced bar was therefore **5 sections / 600 words with no ceiling**, for
every Moves artifact type, while the registry specified 9 sections and a real
band for the business case, a different band for the charter, and a
deliberately unbounded one for target-state architecture.

This wires the registry in. Each artifact type now gets its own contract at
runtime, and the three narrative-spine flags — central tension, options
considered, evidence gaps noted — reach the prompt for the first time.

Sequencing note: this deliberately shipped **after** the P4 band was reconciled
to 3,000-5,000 prose words. Wiring first would have activated the stale
5,000-9,500 contract.

## Layer Impact

Release lane: `global-control-lane` (shared quality contract wiring; no tenant
data, no schema change).

- **Layer 4 (Products) — Moves.** Changes which quality bar the orchestrated
  path enforces. No UI, no route, no persistence change.
- **Layer 3 (Canonical Model) — untouched.**

## Client Applicability

- All clients: no change unless the tenant is on
  `moves_orchestrated_deliverables` (today: `skyharbor`, `lakeshore`). The
  deterministic renderer — every other tenant's path — is untouched.
- **Behaviour change for those two tenants:** artifacts are now held to their
  real contract. A thin business case that passed at 600 words now blocks below
  3,000 prose words or 9 sections. This is the intended outcome; the route
  already falls back to the deterministic deck when the gate blocks.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added; rides the existing flag.

## Changes Included

- Modified: `src/lib/programs/deliverables/orchestrated/build-request.ts` —
  removes the hardcoded `QUALITY_BAR` const; calls
  `resolveQualityBar("moves", deliverableType)`, keeping
  `requiresSourceRegister: true` as a deliberate, documented override.
- New: `src/lib/programs/deliverables/orchestrated/__tests__/quality-bar-wiring.test.ts`

## QA / Validation

- `npx tsc --noEmit --pretty false` — 0 errors, full project.
- `npx eslint src/lib/programs/deliverables/orchestrated/` — 0 errors, 2 warnings
  (pre-existing unused imports in a file this change does not touch).
- 6 new tests. The strongest asserts the runtime bar equals
  `resolveQualityBar(...)` field-for-field across five artifact types (minus the
  documented source-register override) — so the runtime cannot drift from the
  contract without failing. Others assert the reconciled P4 numbers, the three
  spine flags, that the bar is no longer the 5/600 floor, and that artifact
  types genuinely differ (charter tighter than business case; architecture
  larger and never blocking on length).
- Regression sweep across `src/lib/deliverables` + `src/lib/programs`: 4,074
  tests, 15 failing. Stashed-baseline comparison: 4,068 tests, the **same 15**
  failing. Net: 6 added, all passing, zero new failures.
- No live generation was run — see Known Gaps.

## Rollout Plan

Merge to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys as
usual. Tenants on the orchestrated flag get the real contract on their next
generation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
  (existing, unmodified).
- Shared runtime mutators: none.
- Approved image digest: n/a — standard deploy workflow builds and pins.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Live signed-in proof required: yes, deferred — see Known Gaps.

## Rollback Plan

Revert the commit and merge to `main`. The bar is computed per request with no
persisted state, so the next generation after a revert uses the prior floor.

## Rollback Plan Caveat

Reverting restores a _weaker_ gate, which is safe operationally but means thin
artifacts pass again. Prefer fixing forward.

## Audit Evidence

- Local typecheck/lint/test output including the stashed-baseline comparison,
  captured in this session's transcript.
- Motivating audit: `docs/design/strategic-moves/SOLUTION_PRICING_ENGINE_AUDIT.md`
  §5.2, which identified the hardcoded bar and the dead registry override.

## Deployment Outcome (verified)

- Merged to `main` in PR #6536; `main` at `36f1da7b1`.
- `aca-main-deploy` run for `36f1da7b` completed **success**.
- ACA runtime invariant **verified**: Container App template image and the
  100%-traffic revision image are the same digest
  (`acrabarvalab001.azurecr.io/abarva/web@sha256:6a65a33d2dd2...`), revision
  `ca-abarva-web-lab-eastus--m36f1da7b` reports `Healthy` / `Running`, and
  `https://app.abarva.ai/` returns HTTP 200.
- Live signed-in generation proof is still outstanding — see Known Gaps.

## Known Gaps

- **Expected to increase gate blocks on the two orchestrated tenants**, both from
  this and from the unsupported-figure fix shipped alongside. The real block
  rate is unknown until live generations run. If legitimate artifacts are being
  blocked for length, the correct response is tuning the section budgets that
  should be hitting the band — not lowering the band.
- **No live generation has exercised this.** The tests prove the contract
  reaches the request; they cannot prove real generations satisfy it.
- **`minSections: 9` is enforced but the outline is not fixed.** The business
  case brief still has no `fixedStructure`, so the architect chooses the final
  outline. Section COUNT is now gated; section IDENTITY is not.
- **The golden-bar pipeline is still not applied to Moves artifacts.** This
  wires the orchestrator's bar only. Applying `meetsGoldenBar` to both Moves
  paths remains open.
