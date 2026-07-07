# 2026-06-09-move-card-tenant-name-leak — Fix cross-tenant name on Move cards

## Release ID

`2026-06-09-move-card-tenant-name-leak`

## Status

`candidate`

## Plain-English Summary

Every Strategic Move card/detail row displayed **"APEX RETAIL GROUP"** as the
tenant name regardless of the active tenant — e.g. SkyHarbor Air's Moves (and a
freshly-originated SkyHarbor Move) all read "· Apex Retail Group". Found live
while originating a real SkyHarbor Move. Root cause: `ProgramSummary.clientName`
was a stale 4-value closed union (Meridian / First Capital / Apex / Lakeshore)
and `canonicalProgramClientName` ran a matching if-cascade with a hardcoded
`return "Apex Retail Group"` catch-all. Any tenant not in that list (SkyHarbor,
Northstar) fell through to the Apex default. The canonical resolver
(`canonicalClientDisplayName`, `src/lib/client-config.ts`) already knew every
tenant — the transformer just wasn't trusting it.

Fix: widen `clientName` to `string` and make `canonicalProgramClientName`
delegate to `canonicalClientDisplayName` with a safe fallback to the raw name
(then a neutral dash) — never a specific tenant. So each Move now shows its own
tenant name, and a new tenant can never silently render as another tenant's name.

## Layer Impact

**global-control-lane**: shared Move view-model transformer + a UI type. Display
only — no schema, no data, no access change. Affects every tenant's Move
cards/detail.

## Client Applicability

- All clients: Move cards/detail now show the correct tenant name.
- Feature flag: none.

## Changes Included

- `src/lib/programs/transformers.ts` — `canonicalProgramClientName` delegates to
  `canonicalClientDisplayName` (raw-name → "—" fallback); removed the stale
  `KNOWN_CLIENT_NAMES` map + hardcoded Apex default.
- `src/lib/programs/types.ui.ts` — `clientName` union → `string` (both view-models).
- `src/lib/programs/__tests__/clientname-tenant-resolution.test.ts` — regression
  guard: each tenant resolves to itself; non-Apex tenants never collapse to Apex.

## QA / Validation

- `jest clientname-tenant-resolution + strategic-moves-transformers + transformers-azure-read` — **10/10 passed**.
- `tsc --noEmit` — **0 errors repo-wide**.
- `eslint` (changed files) — **passed**.
- Live repro confirmed pre-fix (SkyHarbor portfolio cards all read "· Apex Retail Group");
  post-merge verify after deploy: SkyHarbor Move cards read "· SkyHarbor Air".

## Rollout Plan

Merge to `main`, build + deploy the ACA web image, re-check `/strategic-moves` on
the SkyHarbor session — cards should read "· SkyHarbor Air".

## Rollback Plan

Revert this PR. Display-only; no schema/data/access touched.

## Audit Evidence

- PR URL + CI. Live screenshot pre-fix (Apex on SkyHarbor cards). Follows the
  #3346/#3347 Moves access fixes.

## Known Gaps

Separate latent default: `getClientOption` (client-config) falls back to
`DEFAULT_CLIENT_KEY` (apex) for an unknown id, so `canonicalClientDisplayName`
with an unknown key **and no name** still returns Apex. The Move-card path always
passes a name so this fix is unaffected, but the `getClientOption` apex-default is
worth a follow-up (return null/neutral for truly-unknown ids).
