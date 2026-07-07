# 2026-06-03-parser-fallback-policy — Parser Fallback Policy

## Release ID

`2026-06-03-parser-fallback-policy`

## Status

`candidate`

## Plain-English Summary

Adds a testable parser fallback decision policy for documents whose primary
parser fails, produces low confidence, or looks garbled. The policy keeps
sensitive, restricted, regulated, or unknown-sensitivity files on the private
Marker fallback path and allows LlamaParse only for non-sensitive files after
explicit operator approval and customer third-party processing consent.

## Layer Impact

- `global-control-lane`: Adds shared ingestion policy code and architecture
  documentation that future upload processors can call before invoking a
  fallback parser.
- No database schema, migration, Azure resource, third-party parser account, or
  live parsing worker change.

## Client Applicability

- All clients: Applies as the shared fallback parsing governance contract.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/ingestion/parser-fallback-policy.ts` defines the fallback decision
  helper, route ids, gating reasons, and ledger-event metadata.
- `src/lib/ingestion/__tests__/parser-fallback-policy.test.ts` covers malware,
  template mapping, operator approval, sensitive-data, third-party consent, and
  LlamaParse allow-list behavior.
- `docs/architecture/azure/PARSER_FALLBACK_DECISION_TREE.md` documents the
  enterprise fallback workflow.
- `docs/platform-architecture/runtime/05_INGESTION_AND_PARSING_PIPELINE.md`
  links the runtime architecture to the fallback parser boundary.

## QA / Validation

- PASS: `npx jest src/lib/ingestion/__tests__/parser-fallback-policy.test.ts --runInBand` (7 tests passed; Jest reported pre-existing duplicate manual mock warnings).
- PASS: `npx tsc --noEmit --pretty false`.
- PASS: `npx eslint src/lib/ingestion/parser-fallback-policy.ts src/lib/ingestion/__tests__/parser-fallback-policy.test.ts`.
- PASS: `git diff --check`.

## Rollout Plan

Merge through the protected main merge queue. This is a policy/code contract
only; runtime parser workers must call it before any fallback parser becomes
active.

## Rollback Plan

Revert the PR to remove the policy helper, tests, and decision-tree docs. No
data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/2948.
- CI: pending at PR open.
- Local QA: focused Jest, TypeScript, eslint, and diff whitespace pass locally before PR.

## Known Gaps

This does not install Marker, configure LlamaParse, invoke either parser, or
persist fallback output. T186 should remain `In progress` until the runtime
parser integrations are wired through this policy and verified end to end.
