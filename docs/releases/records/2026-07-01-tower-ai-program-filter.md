# 2026-07-01 Tower AI Program Filter

## Release ID

`2026-07-01-tower-ai-program-filter`

## Status

`candidate`

## Plain-English Summary

Tower now treats "top AI programs" as a distinct governed answer shape instead of returning the generic top IT programs table. The answer still uses the governed CIO Tower fact layer and Claude-owned final wording, but the selected facts are filtered to AI-tagged programs and the rendered table is capped to the user's requested count.

## Layer Impact

- `global-control-lane`: Updates the shared Tower answer composer and the Tower prompt/raw/render proof script.
- `client-data-lane`: No schema or source data changes. The change reads existing governed Tower facts and attributes.

## Client Applicability

- All clients: Yes, for Tower questions routed through the governed CIO Tower answer path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer.ts`: adds requested-count handling and AI-program filtering for ranked program answers.
- `src/lib/cio-tower/__tests__/answer.test.ts`: adds a regression test for top-5 AI program questions.
- `scripts/qa/tower-prompt-raw-render-trace.mjs`: updates expected-path scoring to recognize the current governed Tower tool + Claude final-answer contract.

## QA / Validation

- PASS: Targeted Jest for `src/lib/cio-tower/__tests__/answer.test.ts` (`21 passed`).
- PASS: Focused ESLint for the touched source/test/QA files.
- PASS: `git diff --check`.
- PASS: `npm run release:check`.
- PENDING: Post-merge signed-in Tower prompt/raw/render trace against `https://app.abarva.ai`.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new image. After deploy, run the signed-in Tower prompt/raw/render trace and verify top AI program questions use the AI-specific governed table.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None.
- Approved image digest: Captured by ACA deploy workflow.
- ACA runtime invariant: Verified by ACA deploy workflow.
- Worker image invariant: Verified by ACA deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and let the main ACA deploy workflow restore the previous Tower answer composer. No database rollback is required.

## Audit Evidence

- PR URL: to be added after PR creation.
- CI run: to be added after PR validation.
- Runtime proof: signed-in Tower prompt/raw/render trace after deploy.

## Known Gaps

This does not expand or rewrite the underlying AI taxonomy. It uses currently loaded AI indicators such as AI/agentic/automation/model/predictive terms and AI-tagged portfolio segments.
