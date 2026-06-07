# 2026-06-07-provider-audit-proof — Provider / audit proof verifier

## Release ID

`2026-06-07-provider-audit-proof`

## Status

`candidate`

## Plain-English Summary

Adds a repeatable provider/audit proof for the Anthropic migration. The verifier
checks that Nexus, Sentinel Ask, and Source chat answer-generation paths use the
audited Anthropic Claude client, that the Anthropic preflight stamps
`provider=anthropic`, and that audit rows flow through the tenant-stamped
`ai_egress_audit` broker path. It also records the SQL an operator must run
after signed-in QA to confirm live audit rows.

## Layer Impact

- Lane: `global-control-lane`.
- Layer: shared model-provider and audit-control evidence. No runtime provider
  routing, schema, data, auth, or UI behavior changes.

## Client Applicability

- All clients: the proof applies to the shared Nexus, Sentinel Ask, and Source
  chat answer-generation paths.
- Specific clients: none.
- Internal only: proof command/docs are internal release evidence.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/audit/provider-audit-proof.mjs`: deterministic static verifier for
  provider/audit wiring.
- `package.json`: adds `npm run audit:provider-proof`.
- `docs/build/azure-container-apps-cutover-2026-06-07/PROVIDER_AUDIT_PROOF.md`:
  proof summary, acceptance criteria, and live audit-row SQL.

## QA / Validation

- `npm run audit:provider-proof` — passed.
- `npx jest src/lib/intelligence/ask/__tests__/provider-audit.test.ts` — passed.
- `npm run release:check` — passed.

## Rollout Plan

Merge to main as a release-control proof addition. No deploy coordination is
required beyond normal docs/script rollout. Operators can run
`npm run audit:provider-proof` before provider migration review or cutover gates.

## Rollback Plan

Revert the commit to remove the verifier, package script, and proof docs. No
runtime or data rollback is required.

## Audit Evidence

- Local command output from `npm run audit:provider-proof`.
- Existing provider regression test
  `src/lib/intelligence/ask/__tests__/provider-audit.test.ts`.
- Live confirmation remains the `ai_egress_audit` SQL recorded in
  `PROVIDER_AUDIT_PROOF.md` after signed-in QA.

## Known Gaps

Signed-in live QA remains blocked in this VM because Clerk session/secret
material is absent. Static proof confirms code wiring; it does not prove that
fresh runtime rows were inserted until a Clerk-capable operator exercises the
authenticated surfaces and runs the recorded SQL.
