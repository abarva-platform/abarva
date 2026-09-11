# Source supplemental detail parity

## Change

The Source contract list can promote evidence-backed supplemental contract rows
into the focused list. The contract-detail API now uses the same promoted row
set, so a row that is intentionally visible from the evidence layer remains
openable through Contract 360.

## Layer and applicability

- Layer: Product read path / Source workspace detail route.
- Applicability: Source tenants using supplemental evidence coverage or action
  rows, without changing register-owned headline totals.
- Data mutation: None. This is a read-path consistency fix.

## Validation

- Route regression test covers a supplemental evidence contract.
- The focused contract-detail route test suite passes.
- TypeScript and ESLint pass for the changed route and test.
- Signed-in Source smoke confirms the refreshed workspace lists the supplemental
  contract and exposes it to the detail path.

## Rollout and rollback

Deploy through the protected main ACA workflow using the resulting digest-pinned
image. Rollback is a standard application revision rollback; no database
rollback or data reload is required.

## Evidence

The operator refresh and independent readback remain separate from this code
change. The refresh proof must continue to show the tenant-wide projection
counts and required serving views before the UI is called live-proven.
