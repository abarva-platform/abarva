# 2026-06-08-lakeshore-intelligence-corpus-gate — Lakeshore Intelligence Corpus Gate

## Release ID

`2026-06-08-lakeshore-intelligence-corpus-gate`

## Status

`candidate`

## Plain-English Summary

Lakeshore had live enterprise context and published Lakeshore corpus patterns, but the Intelligence Brief/Map still showed “corpus not yet seeded.” The live loader was incorrectly returning `null` whenever `ai_initiatives` was empty, even if `corpus_patterns` and treasury patterns existed. This change lets Lakeshore render a truthful corpus-backed candidate view from the live corpus while clearly stating that funded initiative substrate is still pending.

## Layer Impact

- `client-data-lane`: Changes the Lakeshore Intelligence read model so published Lakeshore corpus rows can appear on the product surface without requiring `ai_initiatives` rows first.
- `global-control-lane`: No global behavior change for other tenants; the branch is Lakeshore-specific inside the Lakeshore live loader.

## Client Applicability

- All clients: No.
- Specific clients: Lakeshore Holdings.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None; active when deployed.

## Changes Included

- `src/lib/intelligence-v3/lakeshore-live.ts`
  - Allows the loader to return Brief/Map data when Lakeshore has published corpus patterns but no `ai_initiatives`.
  - Builds explicitly labeled corpus-backed candidate rows instead of pretending funded initiatives exist.
  - Sets Map candidates as candidates, not in-flight initiatives.
- `src/lib/intelligence-v3/__tests__/lakeshore-live.test.ts`
  - Adds a regression test for the exact failure mode: corpus rows exist, `ai_initiatives` is empty, loader must not return `null`.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/intelligence-v3/__tests__/lakeshore-live.test.ts --runInBand`
- PASS: `npx eslint src/lib/intelligence-v3/lakeshore-live.ts src/lib/intelligence-v3/__tests__/lakeshore-live.test.ts`

## Rollout Plan

Merge to main, build a new Azure Container Apps image from main, deploy by pinned ACR digest, shift 100% traffic only after the revision is `Provisioned` and `Running`, then browser-test `/intelligence?client=lakeshore`.

## Rollback Plan

Rollback Azure Container Apps traffic to the prior known-good revision. Code rollback is a single revert of this PR; no schema or data migration is involved.

## Audit Evidence

- Live diagnostic before fix showed:
  - `enterprise_context_records`: 179
  - `enterprise_context_chunks`: 1542
  - overview facts: 2949
  - corpus API returned published Lakeshore patterns with `searchDocId`
  - corpus search returned Kyriba/treasury/HoldCo governance hits
  - UI still showed “CORPUS NOT YET SEEDED”
- Diagnostic artifact: `reports/azure-main-20260608-bc73d655-postdeploy/browser/lakeshore-context-corpus-diagnostics.json`

## Known Gaps

- This does not load `ai_initiatives`; it only prevents the Intelligence corpus from being hidden when initiatives are absent.
- Home still shows no initiatives if `ai_initiatives`/portfolio rows are not loaded.
- Tower still needs substrate-specific proof beyond route render.
- Sentinel/Nexus hard-answer QA still needs a separate evidence/citation scoring pass.
