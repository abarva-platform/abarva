# 2026-07-01-generic-demo-answer-name-hygiene — Generic Demo Answer Name Hygiene

## Release ID

`2026-07-01-generic-demo-answer-name-hygiene`

## Status

`candidate`

## Plain-English Summary

This release closes the answer-payload gaps found after the generic demo-name page cleanup. The previous production smoke proved page chrome and signed-in routes no longer showed legacy demo-client names, but a 20-question answer audit still found old names inside Home trace payloads, Tower answer text, and universal agent context-bundle streams. This patch applies the shared generic demo-name sanitizer before those payloads leave the API.

## Layer Impact

- `global-control-lane`: Applies shared demo-safe client-name hygiene to Home KNOW trace payloads, Tower ask answers, and universal agent stream artifacts/text.
- `public-demo`: Improves soft-launch demo safety for Airline Demo and Industrial Demo by reducing legacy legal/demo-name leakage in answer payloads and artifacts.

## Client Applicability

- All clients: The sanitizer is shared, but only known demo-safe legacy names are rewritten.
- Specific clients: Airline Demo and Industrial Demo are the proof targets for this release.
- Internal only: None.
- Public/demo only: The visible behavior is intended for external demo-safe naming.
- Feature flag: None.

## Changes Included

- `src/lib/home/know/home-demo-safe-response.ts`: Home KNOW now sanitizes trace/proof strings as well as visible prose and cards, while preserving technical id fields.
- `src/app/api/tower/ask/route.ts`: Tower ask now passes a demo-safe tenant display name to the governed Tower answer engine and sanitizes success/error text before returning it.
- `src/app/api/chat/agent/route.ts`: Universal agent chat now sanitizes streamed text, context-bundle artifacts, and stream-error text before sending them to the client.
- Focused tests updated for Home trace sanitization and agent context-bundle stream hygiene.

## QA / Validation

- `npx jest src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts src/lib/home/know/__tests__/home-demo-safe-response.test.ts src/lib/__tests__/client-config-canonical.test.ts --runInBand`
  - Result: Passed, 3 suites / 35 tests.
  - Note: Jest reported pre-existing duplicate manual mock warnings for markdown-related mocks.
- `npx eslint src/app/api/chat/agent/route.ts src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts src/app/api/tower/ask/route.ts src/lib/home/know/home-demo-safe-response.ts src/lib/home/know/__tests__/home-demo-safe-response.test.ts`
  - Result: Passed.

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps main deploy workflow, verify the ACA runtime invariant, then rerun the signed-in 20-question generic-name answer audit for Airline Demo and Industrial Demo across Home, Intelligence, Tower, Source, and Moves.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA production/lab deployment.
- Shared runtime mutators: None in this release.
- Approved image digest: To be captured after ACA image build.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes. The 20-question answer audit must pass before calling answer-level generic-name hygiene production-proven.

## Rollback Plan

Revert the merge commit and redeploy the previous known-good ACA image through the approved workflow. No database migration or data rollback is required.

## Audit Evidence

- PR URL: Pending.
- Local focused Jest output: 3 suites / 35 tests passed.
- Local ESLint output: Passed on changed files.
- Pre-fix production answer audit: `audit-artifacts/generic-demo-answer-leak/generic-demo-answer-leak-2026-07-01T19-18-15-643Z-385c14d86`.
- ACA deployment evidence: Pending.
- Signed-in 20-question answer proof: Pending.

## Known Gaps

This release fixes generic-name leakage in answer payloads. It does not replace the separate 50-question answer-quality/correctness audit, and it does not resolve independent Tower contract parse failures except to make returned error text demo-safe.
