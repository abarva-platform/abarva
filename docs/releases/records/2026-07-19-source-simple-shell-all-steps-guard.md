# 2026-07-19-source-simple-shell-all-steps-guard — Source simple shell all-steps guard

## Release ID

`2026-07-19-source-simple-shell-all-steps-guard`

## Status

`candidate`

## Plain-English Summary

Adds an integration guard that proves every canonical Source lifecycle step uses the new simple Source shell when the simple-front flags are enabled. The guard fails if any step falls back to the old tabbed Source workspace. Also corrects stale AI-surface catalog entries for the archived Source printed report route so the catalog no longer claims controls for a page that now redirects.

## Layer Impact

- `global-control-lane`: Source canvas regression coverage and AI-surface catalog maintenance for an archived Source route.
- Runtime behavior: no production UI, data, gate, chat, export, schema, or feature-flag behavior changes.

## Client Applicability

- All clients: yes, as shared regression coverage for the Source canvas shell.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: verifies behavior when `source_simple_front` and Workspace Explorer are enabled.

## Changes Included

- `src/__tests__/integration/source/source-event-canvas-render.test.tsx` now walks every stage in `SOURCE_STAGE_ORDER` and asserts the rendered canvas contains `source-simple-front`.
- The same guard asserts the legacy workspace and Document/Gate/Evidence/Log tab test IDs are absent for every canonical step under the simple shell flags.
- `docs/legal/AI_GENERATED_UI_CATALOG.md` now marks the archived Source printed event report route as not rendering generated report UI.
- `docs/security/ai-surface-control-catalog.json` removes the obsolete `source-event-report-footer` control and covered-claim entries.

## QA / Validation

- Pass: `npx eslint src/__tests__/integration/source/source-event-canvas-render.test.tsx`.
- Pass: `npx jest src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand --runTestsByPath -t "uses the simple shell instead of legacy tabs for every canonical step"`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `git diff --check`.
- Pass: `npm run audit:ai-surface-controls`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Full-file comparison: `source-event-canvas-render.test.tsx` has the exact same 10 pre-existing failures on this branch and clean `origin/main`; this change adds zero new full-file failures.

## Rollout Plan

Merge through PR to `main`. No runtime rollout is required because this is test and catalog enforcement only.

## Deployment Authority

- Repo-owned deploy workflow: not required for this test-only guard.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this PR does not change runtime behavior.

## Rollback Plan

Revert the PR. No database, feature flag, or deployment rollback is required.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/5048.
- Local validation: focused all-steps guard, ESLint, TypeScript, whitespace, and baseline full-file comparison listed above.

## Known Gaps

- This does not fix the unrelated pre-existing full-file Source canvas render expectations.
- This does not remove the advanced canvas implementation; it prevents simple-front enabled stages from silently regressing back to it.
- This does not restore a printable generated Source report; the archived report route remains a redirect.
