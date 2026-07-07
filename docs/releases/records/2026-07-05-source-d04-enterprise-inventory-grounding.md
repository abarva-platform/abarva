# 2026-07-05-source-d04-enterprise-inventory-grounding — d04 app inventory grounds in the real systems estate

## Release ID

`2026-07-05-source-d04-enterprise-inventory-grounding`

## Status

`candidate`

## Plain-English Summary

The Application & System Inventory (`d04_app_inv`) drafts from upstream artifacts +
uploaded evidence — but never from the company's own loaded application inventory, even
though the platform already stores it. This grounds d04 in that real estate: generation
now receives the tenant's application/systems inventory and pre-fills the in-scope
application table directly from it (verbatim IDs, names, tier, owner, vendor,
criticality), one row per system, instead of guessing from prose.

When a company has no inventory loaded it degrades gracefully to the blank framework and
flags the gap rather than inventing applications. This is the first prerequisite for the
should-cost / value-lever work — you can't compute should-cost without the real
volumetrics.

## Layer Impact

- `global-control-lane`: shared Source generation behavior for all clients. Generation
  context now includes the company's application inventory, read client-scoped from
  `data_inventory_records` **only through the existing tenant-key-scoped broker seam**
  (`setup-data-broker.listAppInventoryRecords`) — honouring the knowledge-layer broker
  boundary and per-tenant RLS. The `d04_app_inv` template folds it in. No schema, seed, or
  migration.

## Client Applicability

- All clients: yes (companies with a loaded inventory get pre-fill; others get the blank-framework fallback)
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/admin/setup-data-broker.ts` — new `listAppInventoryRecords(brokerTenantKey)` +
  `AppInventoryRecord`: reads `it_landscape` / `application_portfolio` from
  `data_inventory_records`, preserving the payload fields (tier/owner/vendor/criticality)
  `getSegmentRecordPage` drops. Sanctioned broker seam.
- `src/lib/source/agent-generation/types.ts` — new `SourceAppInventoryEntry`; optional
  `enterpriseAppInventory` on `SourceGenerationContext`.
- `src/lib/source/agent-generation/context-binder.ts` — translates the active client key
  via `clientKeyToInventorySubstrateKey`, reads the inventory through the seam
  (`.catch(() => [])` graceful), attaches it to the context.
- `src/lib/source/agent-generation/app-inventory.ts` (new) — pure
  `buildAppInventoryPromptBlock`: records → markdown table (or a "not loaded" note), with
  pipe/newline escaping.
- `src/lib/source/agent-generation/prompt-registry.ts` — `d04_app_inv` folds the inventory
  block into its user message and instructs building the table from it verbatim.
- Tests: new `app-inventory.test.ts` (6); `context-binder.test.ts` mocks the new seam.

## QA / Validation

- `app-inventory.test.ts` → **6/6 pass**; full `agent-generation` suite → **48/48 pass**
  (context-binder + registry + section-conformance green). **pass.**
- `npx tsc -p tsconfig.json --noEmit` → no errors in changed files. **pass.**
- `npx eslint` on changed files → clean. **pass.**
- Full `src/lib/source` sweep → **no new regressions**: the 7 pre-existing failing suites
  (exports/*, artifact-binding-matrix, ava-intake-response-parts, nexus-api-live-context,
  stage-next-move) fail identically on clean `main` (stash-verified: 7 failed / 27 tests
  both with and without this change).
- Not live-proven: pre-fill quality against a real tenant inventory needs the ACA deploy
  this record accompanies. **verify on deploy.**

## Rollout Plan

Merge to `main` via PR + squash. Deploy through the Azure Container Apps runbook
(`az acr build` → `az containerapp update` on `ca-abarva-web-lab-eastus` → wait healthy →
100% traffic → verify `app.abarva.ai`). Record the ACA revision/image when deployed. No
migration, no feature flag.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps lab lane per
  `docs/runbooks/azure-container-apps-deploy.md` (auto-runs on merge to main via the ACA
  main deploy workflow).
- Shared runtime mutators: none — application-code only (a broker read + a template fold +
  a context field). No worker jobs, DNS, or env mutation.
- Approved image digest: recorded on deploy.
- ACA runtime invariant: new revision healthy before 100% traffic; single deploy authority.
- Worker image invariant: n/a.
- Feature/env flag update path: none (not flag-gated).
- Live signed-in proof required: yes — verify `d04_app_inv` pre-fills from the loaded
  inventory for a tenant that has one, on `app.abarva.ai`.

## Rollback Plan

Revert the PR and redeploy the prior ACA revision. `listAppInventoryRecords` is a pure
read; removing it, the context field, and the template fold returns d04 to its prior
(upstream + uploaded-evidence) grounding with no data effect. No schema/migration to unwind.

## Audit Evidence

- PR URL (added on open).
- CI: `release:check`, jest, tsc, eslint.
- `body_generation_metadata` on generated `d04_app_inv` records the prompt template
  id/version; the inventory read is tenant-scoped by `tenant_key` in the query.

## Known Gaps

- Payload field extraction is best-effort across common key names
  (`tier`/`app_tier`/`criticality_tier`, etc.); tenants whose inventory uses other payload
  keys pre-fill Name/ID but leave Tier/Owner blank (surfaced as gaps, not fabricated).
- Grounding d05/d09 further in this now-real d04 is automatic (d04 is already their
  optional upstream); no ordering enforcement added here.
- This is the estate baseline only — the should-cost / value-lever engine that turns it
  into a savings number is the next workstream.
