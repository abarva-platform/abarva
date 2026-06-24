# 2026-06-24-intelligence-gpt-agent-pane — Intelligence GPT-Style Agent Pane

## Release ID

`2026-06-24-intelligence-gpt-agent-pane`

## Status

`candidate`

## Plain-English Summary

This release fixes the Intelligence Ask experience so the left agent pane behaves like a real chat transcript. The user sees the question, execution/progress state, and the answer in the conversation history without having to scroll the right canvas to discover that a response completed. The right side remains the Intelligence workspace for evidence, experts, corpus, and artifacts.

## Layer Impact

- `global-control-lane`: shared signed-in Intelligence Ask behavior for all clients.
- Frontend shell and answer-policy polish: no tenant data, retrieval, RLS, schema, or feature-flag change.

## Client Applicability

- All clients: yes, all tenants using `/intelligence/ask`.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx`: streams the actual answer into the chat transcript, attaches structured `AgentAnswer` packets to the chat turn, and keeps the right-side workspace synchronized.
- `src/app/intelligence/ask/page.tsx`: removes the old page preamble/mode strip around the chat shell so the left aVa pane owns the viewport and the composer remains visible without page scrolling.
- `src/components/agent/AgentDock.tsx`: focused mode now renders structured `AgentAnswer` packets inside the transcript instead of forcing the user to inspect the workspace.
- `src/lib/intelligence/ask/response-policy.ts`: changes the consultant-answer contract to natural GPT/Claude-style prose and strips visible `Read:`, `Evidence:`, `Implication:`, and `Next move:` labels before return.
- `src/components/agent-answer/AgentAnswerRenderer.tsx` and `src/components/agent-answer/AvaAsk.tsx`: visible answer labels now use `aVa`.
- Regression tests updated for transcript history, structured answer rendering, and label-free answer prose.

## QA / Validation

- `passed`: `npx jest --runTestsByPath src/app/'(maestro)'/intelligence/ask/__tests__/SentinelReasoningCards.test.tsx src/components/agent-answer/__tests__/AgentAnswerRenderer.test.tsx src/components/agent-answer/__tests__/AvaAsk.test.tsx src/lib/intelligence/ask/response-policy.test.ts --runInBand` — 4 suites / 25 tests passed. Jest still prints existing duplicate manual mock warnings unrelated to this release.
- `passed`: focused ESLint for all touched implementation and test files.
- `passed`: local visual inspection reached the branch route and confirmed the pre-fix composer defect: the textarea rendered below the 960px viewport because the old page preamble pushed the dock to `y≈323` while the shell still used the 64px app-bar height.
- `blocked`: authenticated local browser smoke cannot reuse the available Clerk state because the state is scoped to `app.abarva.ai`, not `localhost`; the attempted localhost-cookie copy still redirected to sign-in.
- `passed`: `npm run release:check`.
- `blocked`: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false --project tsconfig.json` reaches the existing repo-wide dependency baseline: missing `js-yaml` declarations, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.
- `pending`: ACA deploy and signed-in production crawl after merge.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, then run a signed-in browser crawl against `https://app.abarva.ai/intelligence/ask`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: no local/manual ACA mutation is authorized.
- Approved image digest: produced by the repo-owned ACA deploy after merge.
- ACA runtime invariant: template image, active revision image, and 100% traffic image must match the approved main digest.
- Worker image invariant: unchanged by this frontend-only release; main deploy workflow should keep worker alignment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify chat history, composer clearing, dock controls, answer transcript, and right-side workspace after deploy.

## Rollback Plan

Revert this release commit and redeploy main through the repo-owned ACA deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deployment evidence: pending.
- Browser proof: pending.

## Known Gaps

This release fixes the Intelligence interaction model and visible answer framing. It does not redesign the semantic retrieval layer or claim expert-consultant answer quality across the larger 100+ question stress suite.
