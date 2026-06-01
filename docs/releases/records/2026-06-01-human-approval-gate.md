# 2026-06-01-human-approval-gate — Human Approval Gate Primitive

## Release ID

`2026-06-01-human-approval-gate`

## Status

`candidate`

## Plain-English Summary

Adds a shared human approval gate component for consequential AI-assisted actions. The component requires a visible responsibility checkbox and a minimum-length free-text justification before approval can be submitted, then wires the Programs gate approval modal to use it.

## Layer Impact

`global-control-lane`: Shared UI/control-plane approval primitive for human-in-the-loop decisions.

## Client Applicability

- All clients: Programs gate approvals now use the shared human responsibility and rationale control.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/abarva/HumanApprovalGate.tsx`
- `src/components/abarva/__tests__/HumanApprovalGate.test.tsx`
- `src/components/programs/ProgramDetailPage.tsx`

## QA / Validation

- PASS: `npx jest src/components/abarva/__tests__/HumanApprovalGate.test.tsx --runInBand`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` and deploy through the normal Vercel control-plane release. The Programs gate approval modal will require explicit responsibility acceptance plus the existing human rationale before enabling approval.

## Rollback Plan

Revert the PR to restore the previous gate approval modal and remove the shared component. No database migration or tenant data change is involved.

## Audit Evidence

- PR URL
- CI checks
- Local component test, typecheck, release check, and diff hygiene output

## Known Gaps

This slice creates the reusable approval gate and wires the Programs gate modal. Additional consequential-action surfaces still need to adopt the component in follow-on slices.
