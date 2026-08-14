# 2026-08-14-layer2-code-only-alias-activation — Layer 2 Code-Only Alias Activation

## Release ID

`2026-08-14-layer2-code-only-alias-activation`

## Status

`candidate`

## Plain-English Summary

Layer 2 CSV mapping profiles now support explicitly declared mechanical source-field aliases and a
derived source-path lineage fallback. The first activation covers only the five candidates already
classified as code-only alias fixes: service name, use-case name, risk/control name, enterprise
entity name, and evidence source-file lineage.

Semantic identity aliases remain hard-gated and are not activated by this release.

## Layer Impact

- Affected release lane: `client-data-lane`.
- Layer 1 Client Intake: read-only; no intake files are changed.
- Layer 2 Source Adapters: CSV mapping rules can read declared aliases or derived source-path
  lineage when the canonical source field is absent.
- Layer 3 Canonical Enterprise Model: no canonical objects, facts, or relationships are written.
- Layer 4 Products: no product projection or runtime behavior change beyond merged code becoming
  available through the repo-owned deploy workflow.

## Client Applicability

- All clients: audit and adapter code paths can use the declared aliases when packets contain those
  legacy headers.
- Specific clients: none.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/contracts/mapping-registry.ts` adds optional `sourceAliases` to mapping
  rules.
- `src/lib/enterprise-data/source-adapters/csv-source-adapter.ts` resolves required and mapped fields
  through declared aliases and `__source_path`.
- `src/lib/enterprise-data/source-adapters/mapping-profiles.ts` declares only the five mechanical
  aliases surfaced by the dry-run classification.
- `scripts/audit/tenant-layer-refresh.mjs` evaluates dry-run field satisfaction with the same alias
  semantics.
- `src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts` covers legacy-header
  parse cases for the activated aliases.

## QA / Validation

- Pass: `npx jest src/lib/enterprise-data/source-adapters/__tests__/mapping-profiles.test.ts --runInBand`
- Pass: `node scripts/audit/__tests__/run-layer2-code-only-alias-impact-tests.mjs`
- Pass: `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out <tmp>/layer-reconciliation --no-package`
- Pass: `npm run release:check`

## Rollout Plan

Merge through a pull request. No tenant CSV mutation, registry activation, data-plane load, canonical
write, or product projection change is included.

## Deployment Authority

- Repo-owned deploy workflow: allowed by the session merge/deploy approval for merged code.
- Shared runtime mutators: none beyond the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned ACA main deploy if merged.
- ACA runtime invariant: required after repo-owned deploy if merged.
- Worker image invariant: required after repo-owned deploy if merged.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product surface behavior changes.

## Rollback Plan

Revert the pull request to remove alias resolution and restore the prior single-source-field
mapping behavior.

## Audit Evidence

- Focused adapter mapping-profile test output.
- Layer-refresh dry-run output showing mechanically safe alias failures cleared while semantic
  identity decisions remain hard-gated.
- `npm run release:check` output.

## Known Gaps

This release does not approve or activate semantic identity aliases, registry changes, graph
materialization, tenant-data mutation, or data-plane writes.
