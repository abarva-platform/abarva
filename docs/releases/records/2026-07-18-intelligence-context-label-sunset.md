# 2026-07-18-intelligence-context-label-sunset — Intelligence Context Label Sunset

## Release ID

`2026-07-18-intelligence-context-label-sunset`

## Status

`candidate`

## Plain-English Summary

Intelligence still used old V-version wording inside model-visible source packets for the active enterprise context dossier. This release removes that language from the aVa ask path so Claude and visible source cards see business-readable context labels such as "active context dossier", "applications and systems", and "data assets and integrations" instead of legacy version names or internal schema names.

The underlying compatibility schema remains unchanged. This is a runtime presentation and model-packet hygiene fix, not a data-plane migration or schema rename.

## Layer Impact

- `global-control-lane`: Updates the shared Intelligence ask retrieval packet for all tenants that use the active enterprise context dossier.
- `client-data-lane`: No tenant data is created, deleted, mutated, promoted, or migrated.

## Client Applicability

- All clients: Yes, for Intelligence ask source packet wording when the active context dossier is available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/retrievers/v7-dossier.ts`: replaces model-visible V-version labels with active-context business labels and sanitizes old V-named source file labels before they reach Claude.
- `src/lib/intelligence/ask/index.ts`: renames the trace timing marker from `retrieval.v7_dossier.done` to `retrieval.context_dossier.done`.
- `src/lib/intelligence/ask/retrievers/v7-dossier.test.ts`: adds regression assertions that the model-visible source packet does not contain old V-version language, internal schema names, or internal substrate phrasing.

## QA / Validation

- Pass: focused Jest for the Intelligence active context dossier retriever: `npx jest src/lib/intelligence/ask/retrievers/v7-dossier.test.ts --runInBand` (3/3 tests passed).
- Pass: targeted ESLint for the changed Intelligence ask files: `npx eslint src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/retrievers/v7-dossier.ts src/lib/intelligence/ask/retrievers/v7-dossier.test.ts`.
- Pass: release control gate: `npm run release:check`.
- Pass: production-code string sweep found no remaining `V7 executive dossier`, `V7 corpus`, `V7 source file`, `retrieval.v7_dossier.done`, or `Loaded substrate` strings in the Intelligence ask runtime path. Remaining hits are internal SQL/table names or tests that deliberately inject old labels.
- Not run: live signed-in Intelligence proof. This requires merge and ACA deployment first.

## Rollout Plan

Merge to main through PR, then deploy through the repo-owned Azure Container Apps main deployment lane. No feature flag or data migration is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for `app.abarva.ai`.
- Shared runtime mutators: None in this release.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, ask a technology/current-state context question and confirm source packet/output do not expose V-version language.

## Rollback Plan

Revert this release commit and redeploy through the ACA main lane. No database rollback is required.

## Audit Evidence

- PR URL: Pending.
- Focused Jest: Pending.
- Release check: Pending.
- Live proof: Pending.

## Known Gaps

The physical compatibility schema and some internal filenames/function names still use legacy V-version naming. Renaming those requires a separate governed data-plane migration and broader module read-path update.
