# 2026-09-24-u404-walkthrough-export-tenancy-fence — Home walkthrough export: behavioral tenancy proof, and a fail-closed tenant resolution

## Release ID

`2026-09-24-u404-walkthrough-export-tenancy-fence`

## Status

`candidate`

## Plain-English Summary

The Home walkthrough export endpoint (`GET /api/home/walkthrough-export`) had one
test. That test replaced the authorization check with a stub, so it could only
show that the route *called* the check — not that the check *decided* anything.
Three separate ways of breaking the endpoint left it green.

This release proves the endpoint's tenancy behavior instead of asserting it, by
running the real authorization path and mocking only the layer beneath it: who is
signed in, and which tenants that user may read. Nine behavioral cases now cover
a foreign-tenant request being refused, the refusal happening before any document
is produced (HTML and PDF), the permitted request succeeding, and the exported
document naming the tenant that was *requested* rather than the tenant the
request was made from.

Writing those cases found a real defect, which this release also fixes. When
neither the requested tenant nor the signed-in tenant had a Home preview bundle,
the route fell back to a hard-coded default tenant and returned **200 with that
other tenant's walkthrough**, carrying that other tenant's label. Asking for
one's own tenant by name produced the same document. The route now fails closed:
a tenant it cannot resolve to a Home bundle receives a `404 missing_home_bundle`
naming only what the caller supplied or already owns, and never another tenant's
document.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior on a route every client
reaches, not feature-gated.

- **Layer 4 — Products (Home).** One export route's tenant resolution changes
  from "fall back to a default tenant" to "refuse". No product surface changes:
  the only UI caller (`HomeV4App`) always passes an explicit tenant that is a
  Home preview tenant, so the path that changes is the one that previously
  disclosed.
- **Layers 1–3 — unchanged.** No intake, adapter, canonical-model, schema,
  migration or dataset change. No tenant data is read differently; one read is
  no longer performed on behalf of the wrong tenant.

## Client Applicability

- All clients: yes — the refusal applies to any authenticated caller whose tenant
  has no Home preview bundle. Previously such a caller received a different
  tenant's export.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The fence is unconditional by design; a flag on a tenancy
  refusal is a way to turn it off.

## Changes Included

- `src/app/api/home/walkthrough-export/route.ts` — tenant resolution fails closed
  instead of defaulting to the first preview tenant; unused
  `HOME_PREVIEW_TENANT_KEYS` import removed.
- `src/app/api/home/walkthrough-export/__tests__/tenancy-fence.test.ts` — new,
  nine behavioral cases running the real `requireTenancy`.
- `docs/releases/records/2026-09-24-u404-walkthrough-export-tenancy-fence.md` —
  this record.

No migration, no script, no dataset, no deploy-workflow change.

## QA / Validation

**Baseline, same command and same scope both sides** —
`npx jest src/app/api/home src/lib/home`:

| | suites | tests passing | tests failing |
|---|---|---|---|
| before (`origin/main` `d03e4f2c5`) | 33 | 255 | 22 |
| after | 34 | 264 | 22 |

The 22 failures are identical before and after and all eight failing suites live
under `src/lib/home/**` — none under `src/app/api/home`, none touched here. They
are pre-existing and are not claimed as caused or fixed by this change.

**Red first, on the defect.** The two cases covering the unresolvable tenant were
written before the fix and failed against `origin/main`: `2 failed, 7 passed`.
The endpoint answered `200` and rendered the default tenant's walkthrough. After
the fix: `9 passed`.

**Five mutations, five caught — and three of the five leave the pre-existing
suite entirely green,** which is the vacuity this item exists to close.
Each mutation was applied to the fixed tree, both suites run, then the file
restored from a saved copy and byte-compared.

| # | mutation | new suite | pre-existing `route.test.ts` |
|---|---|---|---|
| M1 | `requireTenancy()` called with no requested tenant key | **4 failed** / 5 passed | **1 failed** |
| M2 | fence called, its refusal discarded (`catch { void err }`) | **3 failed** / 6 passed | 1 passed — **green** |
| M3 | fence moved to after the bundle load | **2 failed** / 7 passed | 1 passed — **green** |
| M4 | fence always refuses (wrong tenant key hard-coded) | **5 failed** / 4 passed | **1 failed** |
| M5 | the default-tenant fallback restored | **2 failed** / 7 passed | 1 passed — **green** |

M4 is the positive direction: a suite of negative cases alone passes an inverted
fence, so the permitted request is asserted too.

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit 0**, 0 diagnostics. The exit code is judged, not grepped for.
- `npx eslint src/app/api/home/walkthrough-export` — exit 0.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see Audit
  Evidence.

## Rollout Plan

Merge to `main` by squash. The repo-owned `aca-main-deploy` workflow builds the
image and shifts Lab/Product traffic. No migration to apply, no flag to set, no
worker job to run, no manual runbook step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to
  `main`. No other path is used.
- Shared runtime mutators: none. This change issues no `az` command and mutates
  no Container App template, revision weight, env var, secret or scale rule.
- Approved image digest: produced by the merge deploy; recorded against the merge
  SHA in the execution pulse.
- ACA runtime invariant: to be proven after the deploy run keyed at or after the
  merge SHA — Container App template image digest must equal the image digest of
  the sole 100%-traffic revision, and that revision must be healthy.
- Worker image invariant: not applicable; no worker job image changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes, and it is owed, not claimed.** This
  release carries item `U-404` acceptance (1), (2) and (3) to behavioral proof.
  Acceptance (4) — the signed-in surface checks for the Home record-source label,
  rail counts, export links and relationship-backed synthesis — is a signed-in
  check that an unattended run cannot perform. `U-404` stays open at
  `signed-in acceptance owed`; nothing here is described as `live-proven`.

## Rollback Plan

Revert the single commit and re-deploy through the same workflow. There is no
migration, no data write and no stored state, so revert is complete and
immediate. Reverting restores the previous behavior, which includes restoring the
cross-tenant fallback — so a revert should be paired with a decision about that
path rather than treated as neutral.

## Audit Evidence

- PR URL and CI run: recorded on the PR.
- `node scripts/release-check.mjs --base origin/main --head HEAD` output.
- The before/after baseline table and the mutation table above, each reproducible
  by the command named beside it.
- Deploy run id, merge SHA and the two image digests: appended to
  `EXECUTION_PULSE_20260918.md` after the deploy completes.
- No screenshots: this change has no rendered surface. The rendered-surface
  evidence belongs to `U-404` acceptance (4), which is owed.

## Known Gaps

- **`U-404` acceptance (4) is not met and is not claimed.** The signed-in surface
  checks remain owed against the deployed SHA.
- The fail-closed refusal is proven by behavior at the route boundary with the
  identity layer stubbed. It has not been exercised against a live signed-in
  session; that is part of the owed acceptance above.
- The eight pre-existing failing suites under `src/lib/home/**` are untouched and
  unexplained by this release.
- The new defect this release fixes is filed as item `U-505` so the fix is
  traceable to an id rather than only to this record.
