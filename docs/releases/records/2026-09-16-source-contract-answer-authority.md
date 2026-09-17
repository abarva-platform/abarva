# 2026-09-16-source-contract-answer-authority — Source Contract Answer Authority

## Release ID

`2026-09-16-source-contract-answer-authority`

## Status

`candidate`

## Plain-English Summary

Contract-specific Source answers now use a server-read contract for the resolved, authorized tenant. Browser-submitted contract values and opportunity rows are treated as unverified selection input, not answer or citation evidence. Contract-bearing browser context is removed before generic synthesis even when its declared module is not Source. Previously stored session turns marked with unverified contract context are not replayed into later answer context.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 — Products: Intelligence Ask routing, Source answer context construction, and session-memory read behavior change for all clients. Layer 3 — Canonical model: existing tenant-scoped contract and optimization read adapters are consumed; no canonical records, schema, adapters, loaders, or tenant data are changed.

## Client Applicability

- All clients: Yes, where Source contract answers or Intelligence Ask session context are available.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- Authorize the resolved tenant and rehydrate the selected contract and optimization set through server reads before deterministic visual or export answers.
- Fail closed on absent, ambiguous, foreign, or unreadable contract selection rather than using browser values.
- Strip browser-submitted Source contract facts from generic synthesis, structured exhibits, and newly stored session metadata regardless of the declared module.
- Withhold prior session context when stored turn metadata indicates an unverified contract packet, including packets written before this change.
- Withhold session summaries and turns when the turn-history read fails, rather than treating a read error as an empty history.
- Add route and session-memory behavior tests for forged values, module spoofing, and replay prevention.

## QA / Validation

- Pass: focused Jest route, named-selection, and session-memory behavior suites.
- Pass: TypeScript `--noEmit` with an 8 GB Node heap.
- Pass: ESLint on changed TypeScript files.
- Pass: `git diff --check`.
- Pass: `npm run release:check` on this isolated branch.
- Not done: live signed-in browser, deployed runtime, or tenant data-plane readback.

## Rollout Plan

Keep the branch isolated until review and signed-in proof are complete. A later approved PR may be squash-merged to `main`; only the repo-owned ACA main deploy workflow may build and activate the resulting image. No migration, data job, feature flag, or manual runtime update is part of this change.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared Product/Lab web runtime after an approved merge.
- Shared runtime mutators: None in this release.
- Approved image digest: To be resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required before claiming deployment.
- Worker image invariant: Required before claiming deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; not done.

## Rollback Plan

Revert the approved change or redeploy the previous known-good digest through the repo-owned main deploy path. No schema or tenant-data rollback is required. Re-enabling browser contract facts as answer authority is not an acceptable rollback shortcut.

## Audit Evidence

- Isolated branch diff and focused local Jest, TypeScript, ESLint, diff-hygiene, and release-check output.
- PR, CI, ACA invariant, and signed-in browser evidence are pending and must be recorded separately if the change proceeds.

## Known Gaps

- No live signed-in or deployed proof has been performed.
- Opportunity evidence references currently carry table names rather than stable record IDs. This change blocks browser-forged values but does not establish citation-depth provenance.
- Historical session turns without identifying metadata cannot be classified by the session-history guard; no stored data is rewritten or deleted.
