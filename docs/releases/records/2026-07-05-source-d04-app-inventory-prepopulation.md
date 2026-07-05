# 2026-07-05-source-d04-app-inventory-prepopulation — Scope app inventory pre-populates from enterprise context

## Release ID

`2026-07-05-source-d04-app-inventory-prepopulation`

## Status

`candidate`

## Plain-English Summary

Friction-audit item #2, the highest-impact "you already have this" fix. The Source
Scope stage used to make a user hand-author the Application Inventory (`d04_app_inv`)
from a blank stub — even though the platform already stores the tenant's
application/systems inventory. This wires that existing inventory into d04
generation so the application table pre-fills from real systems instead of a blank
page.

Now, when a user drafts `d04_app_inv`, the model receives the tenant's loaded
application inventory and pre-fills the §2 table verbatim (App ID, Name, Tier,
Owner, Vendor, Criticality) — one row per system, no invented applications. When a
tenant has no inventory loaded, it degrades gracefully to the blank framework and
flags the gap rather than fabricating.

## Layer Impact

- `global-control-lane`: shared Source generation behavior for all clients — `d04_app_inv`
  becomes AI-generatable (`listSupportedGenerationCodes` 5 → 6) and every generation's
  bound context now includes the tenant's application inventory. It reads client-scoped
  inventory (`data_inventory_records`) only through the existing tenant-key-scoped broker
  seam (`setup-data-broker`), honouring the knowledge-layer broker boundary and per-tenant
  RLS. No new schema, seed, or migration.

## Client Applicability

- All clients: yes (behavior applies to every tenant's Source events)
- Specific clients: n/a — tenants with a loaded inventory get pre-fill; tenants without
  get the graceful blank-framework fallback
- Internal only: no
- Public/demo only: no
- Feature flag: none (not flag-gated)

## Changes Included

- `src/lib/admin/setup-data-broker.ts` — new `listAppInventoryRecords(brokerTenantKey)`
  + `AppInventoryRecord` type: reads the `it_landscape` / `application_portfolio`
  segments from `data_inventory_records`, preserving the structured payload fields
  (`tier`/`owner`/`vendor`/`criticality`) that `getSegmentRecordPage` drops. Sanctioned
  broker seam — app-tier callers import this, never `data_inventory_records` directly.
- `src/lib/source/agent-generation/types.ts` — new `SourceAppInventoryEntry`; optional
  `enterpriseAppInventory` on `SourceGenerationContext`.
- `src/lib/source/agent-generation/context-binder.ts` — translates the active client key
  via `clientKeyToInventorySubstrateKey`, reads the inventory through the broker seam
  (`.catch(() => [])` graceful), and attaches it to the generation context.
- `src/lib/source/agent-generation/app-inventory.ts` (new) — pure
  `buildAppInventoryPromptBlock`: records → markdown table (or a "not loaded" note),
  with pipe/newline escaping.
- `src/lib/source/agent-generation/prompt-registry.ts` — new `d04_app_inv` generation
  template consuming the inventory block.
- `src/lib/source/agent-generation/__tests__/app-inventory.test.ts` (new) — 6 unit tests.

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/app-inventory.test.ts` → **6/6 pass**.
- `listSupportedGenerationCodes()` runtime check → returns 6 codes (adds `d04_app_inv`).
- `npx tsc -p tsconfig.json --noEmit` → no errors in any changed file.
- `npx eslint` on all changed files (incl. the Source→broker import) → clean; no
  import-boundary rule tripped.
- Source unit sweep → no regressions from this change; 4 pre-existing failing suites
  (`create-sourcing-event-scaffold`, `exports/markdown-to-docx`, `exports/narrative-html`,
  `exports/markdown-to-html`) fail identically on clean HEAD (verified by stash).
- Not yet live-proven: pre-fill quality against a real tenant inventory needs an ACA
  deploy (localhost cannot reach the private DB).

## Rollout Plan

Merge to `main` via PR + squash. Deploy through the Azure Container Apps runbook. No
migration, no feature flag. Record the ACA revision/image when deployed.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. No schema or data migration to
unwind. `listAppInventoryRecords` is a pure read; removing it and the `d04_app_inv`
template returns d04 to hand-authoring with no data effect.

## Audit Evidence

- PR URL (to be added on open).
- CI: `release:check`, jest, eslint, tsc.
- `body_generation_metadata` on generated `d04_app_inv` artifacts records the prompt
  template id/version; the inventory read is tenant-scoped by `tenant_key` in the query.

## Known Gaps

- Payload field extraction is best-effort across common key names
  (`tier`/`app_tier`/`criticality_tier`, etc.); tenants whose inventory uses other payload
  keys will pre-fill Name/ID but leave Tier/Owner blank (surfaced as §4 coverage gaps, not
  fabricated).
- Grounding the d05 scope memo in the now-real d04 is automatic (d04 is already d05's
  optional upstream) but ordering (draft d04 before d05) is not yet enforced.
- Auto-draft-on-load currently covers only the strategy stage; extending it to auto-draft
  d04 on entering Scope is a follow-up.
