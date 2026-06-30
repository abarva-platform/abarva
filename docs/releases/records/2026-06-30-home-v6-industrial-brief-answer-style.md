# 2026-06-30-home-v6-industrial-brief-answer-style — Home V6 Industrial Brief Answer Style

## Release ID

`2026-06-30-home-v6-industrial-brief-answer-style`

## Status

`candidate`

## Plain-English Summary

Home V6 answers now give Claude a stricter Industrial Demo communication contract. Industrial answers should be shorter, lead with three executive bullets, keep caveats after the headline takeaways, and offer branch choices instead of long explanatory endings. The prompt also preserves room for an interesting executive point of view, so the answer still reads like a story rather than a mechanical checklist.

## Layer Impact

- `global-control-lane`: updates the shared Home V6 final-answer prompt used by the Home context navigator.
- `public-demo`: improves Industrial Demo answer shape for soft-launch and live demo use.

## Client Applicability

- All clients: receive the general branch-choice clarification when Home V6 asks Claude to write the final answer.
- Specific clients: Industrial Demo receives the compact three-bullet answer shape.
- Internal only: none.
- Public/demo only: Industrial Demo demo-readiness improvement.
- Feature flag: uses existing Home V6 executive synthesis flags.

## Changes Included

- `src/lib/home/know/home-v6-executive-synthesis.ts`
- `src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts`

## QA / Validation

- `pass`: `npx jest src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --runInBand` passed 12/12 tests.
- `pass`: `npx eslint src/lib/home/know/home-v6-executive-synthesis.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --max-warnings 0`.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, verify the active ACA revision/image/traffic/health, then rerun the Industrial Demo warning questions that previously produced long answers.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the normal ACA deploy workflow.
- Approved image digest: assigned by the ACA deploy workflow.
- ACA runtime invariant: `app.abarva.ai` must serve the merged SHA at 100% traffic.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, targeted Industrial Home V6 live questions.

## Rollback Plan

Revert the prompt/test commit and redeploy the previous known-good ACA image. No database, schema, migration, or data-plane rollback is required.

## Audit Evidence

- Focused Jest output.
- Focused ESLint output.
- Post-deploy ACA revision and targeted Industrial Home V6 smoke output after merge.

## Known Gaps

Live signed-in production proof is pending until this release is merged and deployed.
