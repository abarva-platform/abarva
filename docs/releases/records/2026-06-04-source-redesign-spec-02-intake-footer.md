# 2026-06-04-source-redesign-spec-02-intake-footer — Source Intake Completion Footer

## Release ID

`2026-06-04-source-redesign-spec-02-intake-footer`

## Status

`candidate`

## Plain-English Summary

The new Source event intake now has a clear finish line. Once all five required intake facts are captured, the page shows a concise approval footer with the captured facts checklist, approval routing preview, Save draft, and Open event action. Opening the event now lands on the approval page instead of jumping directly into the event canvas.

## Layer Impact

- `global-control-lane`: Updates shared Source intake behavior for all clients using the `/source/new` workflow.
- `client-data-lane`: No schema, migration, tenant data, or data-plane contract changes.

## Client Applicability

- All clients: Applies to all Source clients using new sourcing event intake.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `src/components/source/intake/IntakeCompletionFooter.tsx`.
- Updates `src/components/source/SourceOriginatePage.tsx` so the completion state appears only at 5/5 captured facts and routes created events to `/source/events/{eventId}/approval`.
- Adds focused integration and E2E/static coverage for the completion footer and approval redirect contract.

## QA / Validation

- Pass: `npx playwright test tests/e2e/source/intake-completion-footer.spec.ts --workers=1` (1/1 passed).
- Pass: `npm test -- --runInBand src/__tests__/integration/source/source-originate-page.test.ts src/__tests__/behaviors/source-language-canon.test.ts` (21/21 passed; duplicate manual mock warnings are pre-existing and non-fatal).
- Pass: `npx tsc --noEmit --skipLibCheck --pretty false`.
- Pass: Focused ESLint on changed Source files with `--max-warnings 0`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`, deploy through the existing Vercel production flow, and verify `/source/new` on `https://app.abarva.ai`.

## Rollback Plan

Revert this PR to restore the previous trigger-only event creation behavior. No database rollback is required.

## Audit Evidence

- PR URL and CI run after opening.
- Local QA output from the commands listed above.
- Production smoke output after deploy.

## Known Gaps

Spec 2 only governs intake completion and approval routing. It does not implement the full request-changes edit loop for `/source/new?eventId=...`; that is owned by the approval workflow follow-up.
