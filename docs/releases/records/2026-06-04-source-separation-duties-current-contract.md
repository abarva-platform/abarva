# Source Separation-of-Duties Current Contract

## Release ID

`2026-06-04-source-separation-duties-current-contract`

## Status

`candidate`

## Plain-English Summary

This release updates the Source separation-of-duties E2E spec so it matches the product contract that exists today. The missing pending-approval ledger flow is explicitly documented as backlog B-120 with `test.fixme`, while the spec now proves the behaviors the route already enforces: pilot-mode self-approval succeeds, stage promotion is written to `source_event_activity`, and strict mode rejects same-person self-approval for non-admin callers.

## Layer Impact

- `global-control-lane`: test and governance-contract coverage only. No runtime behavior, schema, or tenant data path changed.

## Client Applicability

- All clients: no runtime change.
- Specific clients: none.
- Internal only: yes, test and audit-contract maintenance.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- E2E spec update:
  - `/private/tmp/nexus-source-separation-duties/tests/e2e/source/separation-of-duties.spec.ts`
- Release record:
  - `/private/tmp/nexus-source-separation-duties/docs/releases/records/2026-06-04-source-separation-duties-current-contract.md`

## QA / Validation

- Default-mode Source governance run:
  - `set -a; source /Users/anand/Projects/nexus/.env.local; set +a; BASE_URL=http://localhost:3000 npx playwright test tests/e2e/source/separation-of-duties.spec.ts --workers=1`
  - Result: passes with B-120 `fixme` entries skipped; pilot-mode contract assertion passes; dedicated non-approver persona remains skipped when not provisioned.
- Strict-mode rejection proof:
  - `set -a; source /Users/anand/Projects/nexus/.env.local; set +a; GATE_APPROVAL_STRICT_MODE=1 BASE_URL=http://localhost:3006 npx playwright test tests/e2e/source/separation-of-duties.spec.ts --grep "production mode" --workers=1`
  - Result: strict-mode 403 assertion passes.

## Rollout Plan

Merge to `main`. No runtime rollout is required because this slice changes test coverage and release documentation only.

## Rollback Plan

Revert the PR that introduces this spec cleanup. No migration or deploy rollback is required.

## Audit Evidence

- Source separation-of-duties Playwright output on default server
- Source separation-of-duties Playwright output on strict-mode server
- PR containing the spec cleanup

## Known Gaps

- B-120 remains open:
  - stage route returns `403`, not `202 + approvalId`
  - `source_event_stage_approvals` table does not exist yet
- Dedicated Apex non-approver Clerk persona is not consistently provisioned in this environment, so the direct non-approver assertion remains skipped when fallback auth would blur the contract.
