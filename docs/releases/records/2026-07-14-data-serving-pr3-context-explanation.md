# 2026-07-14-data-serving-pr3-context-explanation - Module Context Explanation

## Release ID

`2026-07-14-data-serving-pr3-context-explanation`

## Status

`validated`

## Plain-English Summary

This release adds DATA-SERVING-PR3: deterministic module context explanation
and packet-local context completeness scores. It extends the module context
serving contract so every future module can receive both the raw context packet
and a consistent executive explanation without each module inventing its own
English.

This remains a data-layer supplier contract. It does not implement Home UI,
Moves Context Extract, Source behavior, Tower calculations, candidate
promotion, Active Tenant Access updates, or module runtime consumption.

## Layer Impact

- `global-control-lane`: adds shared deterministic explanation and completeness
  contracts for all modules.
- `client-data-lane`: exposes packet-local breadth, depth, evidence,
  relationship, and answerability scores without writing tenant data.
- `internal-admin`: adds test coverage proving explanations preserve
  active/candidate and module-runtime guardrails.

## Client Applicability

- All clients: the explanation/completeness contract applies to all current and
  future tenants.
- Specific clients tested: SkyHarbor Air and Meridian Health.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Added `contextCompleteness` to served module context packets.
- Added `explainModuleContext(...)` and `explainServedModuleContext(...)`.
- Added deterministic summary, strengths, limitations, supported questions,
  unsupported questions, and next actions derived from packet contents.
- Updated module context serving tests.
- Updated the architecture contract documentation.
- Added this release record.

## QA / Validation

- Pass: `npm run audit:module-context-serving`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:active-candidate-separation`
- Pass: `npm run audit:candidate-version`
- Pass: `npm run release:check`
- Pass: isolated TypeScript compile for the context serving contract
- Pass: `git diff --check`

## Rollout Plan

Merge through the standard PR path. No Azure Container Apps deployment is
required for this supplier-contract PR because no product route, module runtime
path, database write path, promotion behavior, or Active Tenant Access pointer
is changed.

## Deployment Authority

- Repo-owned deploy workflow: not required for this non-runtime supplier
  contract.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this non-runtime contract.

## Rollback Plan

Revert the PR. No tenant data rollback, promotion rollback, module runtime
rollback, or ACA rollback is required.

## Audit Evidence

- `src/lib/enterprise-data/contracts/module-context-apis.ts`
- `src/lib/enterprise-data/module-context-serving/module-context-serving.ts`
- `src/lib/enterprise-data/module-context-serving/__tests__/module-context-serving.test.ts`
- `docs/architecture/module-context-serving-contract.md`

## Known Gaps

- This PR does not implement Home Executive Briefing UI.
- This PR does not implement Moves Context Extract.
- This PR does not rebuild Home Summary Snapshot from promoted active canonical
  data.
- Candidate preview remains explicit-only and inactive.
