# 2026-06-16-source-approval-routing-foundation — Source Approval Routing Foundation

## Release ID

`2026-06-16-source-approval-routing-foundation`

## Status

`candidate`

## Plain-English Summary

Source gate approvals no longer appear as anonymous label strings only. Gate rows now show whether the accountable approval role resolves to a recorded person/name or is honestly unresolved, and criterion approve/waive actions append a durable approval record before updating the criterion state.

## Layer Impact

- `global-control-lane`: Updates shared Source gate approval behavior, write adapters, and the Source canvas gate UI for all tenants using Source.
- `client-data-lane`: Reuses existing Source approval and gate criterion tables only. No new table, column, or migration is included.

## Client Applicability

- All clients: Applies to Source gate panels and gate-criterion approve/waive actions across tenants.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a pure Source approval-routing resolver for transition labels, criterion owner roles, and unresolved approval posture.
- Adds a server-only best-effort Source approval notification wrapper.
- Extends the Source write adapter to append criterion-level approval records and link them through `source_event_gate_criterion_states.waiver_approval_id`.
- Updates the gate criterion state route so `waived` is accepted only after an approval record is created; RBAC and strict-mode approval rules remain unchanged.
- Adds compact approval status to existing GateTab rows without introducing a second approval list.

## QA / Validation

- `npx jest src/lib/source/__tests__/approval-routing.test.ts src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts src/lib/source/__tests__/gate-auto-assessment-persist.test.ts src/__tests__/integration/source/source-canvas-gate-tab.test.tsx --runInBand` passed.
- `npx jest --runTestsByPath 'src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/__tests__/route.test.ts' --runInBand` passed.
- `npx eslint src/lib/source/ src/components/source/ src/app/api/v1/source/` passed with pre-existing warnings only.
- `npm run test:behaviors` passed.
- `npx tsc --noEmit --pretty false` was run; touched code typechecked, but the local symlinked dependency tree is missing `@azure-rest/ai-document-intelligence` and `@axe-core/playwright`, which causes unrelated module-resolution failures.

## Rollout Plan

Merge to main, let the standard Azure Container Apps image build and deployment process pick up the Source route/UI changes. No migration or data backfill is required.

## Rollback Plan

Revert the PR. Existing approval records are append-only audit rows and can remain; the UI and route will return to the prior label-only/waiver-blocked behavior.

## Audit Evidence

- PR and CI run for this release candidate.
- Unit tests for approval routing and adapter persistence.
- Route test proving waived state is rejected without reason/record and accepted with a durable approval id.
- Browser screenshots from the Source gate panel after deployment verification.

## Known Gaps

- C1 is intentionally migration-free. Finance, legal, EA-council, steward, Sentinel, and Atlas roles remain unresolved unless represented by existing event fields.
- Follow-on Slice C2 should add explicit routing columns/identity fields such as `requirement_id`, `owner_role`, `resolved_person_id`, and approval status, after product review.
