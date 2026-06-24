# 2026-06-24-home-ava-answer-language — Clean Home aVa answer language

## Release ID

`2026-06-24-home-ava-answer-language`

## Status

`candidate`

## Plain-English Summary

Home and aVa now avoid scaffold-style answer labels in the client-facing response surface. The chat answer, Home context panel, source drawer, loading state, and fallback responses use plain client language instead of model-internal phrasing. Home also stops restoring old chat turns into the left rail, and production sign-in remains email-code only unless a server-side demo flag is explicitly enabled.

## Layer Impact

- `global-control-lane`: Updates shared Home/aVa UI copy and fallback answer rendering for all signed-in clients.
- `public-demo`: Improves the demo/client-facing Home experience by keeping the conversation answer-first and hiding internal scaffold language.

## Client Applicability

- All clients: Yes.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Home aVa answer renderer strips old scaffold labels from payload prose before rendering.
- Home context panel labels now say source/context terms instead of proof-process jargon.
- Home KNOW and Intelligence fallback responses no longer prepend scaffold labels.
- Home aVa clears legacy Home chat session storage and shows the current question only.
- The hidden demo-code password sign-in mode is disabled unless `ENABLE_DEMO_CODE_SIGN_IN=1` is set server-side.
- Regression tests cover scaffold-label cleanup in rendered answers.

## QA / Validation

- PASS — `npx jest src/components/home/know/__tests__/HomeKnowAnswerRenderer.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx src/components/home/__tests__/HomeSurface.test.tsx src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand`
- Pending before release: touched-file ESLint, TypeScript, release check, control-plane purity check, ACA deploy, signed-in browser proof.

## Rollout Plan

Merge to `main`, build/deploy through the repo-owned Azure Container Apps workflow, wait for the healthy revision, route 100% traffic, and verify signed-in Home/aVa browser behavior on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy`
- Shared runtime mutators: None.
- Approved image digest: To be recorded after deploy.
- ACA runtime invariant: `app.abarva.ai` must remain served by Azure Container Apps, not Vercel.
- Worker image invariant: No worker image changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this commit and redeploy the previous known-good ACA image through the same workflow. No migration rollback is needed.

## Audit Evidence

- PR/commit: to be filled after merge.
- CI/deploy run: to be filled after ACA deploy.
- Browser proof: to be attached to the Semantic2 shadow Q&A and aVa UX proof report.

## Known Gaps

None known for this scoped language fix.
