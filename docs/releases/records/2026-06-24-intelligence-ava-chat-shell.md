# 2026-06-24-intelligence-ava-chat-shell — Intelligence Ava Chat Shell

## Release ID

`2026-06-24-intelligence-ava-chat-shell`

## Status

`candidate`

## Plain-English Summary

The Intelligence Ask page now uses the shared Ava/AgentDock chat shell instead of the older embedded textarea form. Users get a GPT/Claude-like conversation history, multiline composer, sticky input, and the existing controls to lock the chat left, right, top, bottom, expand it, or hide it. The right pane becomes the Intelligence canvas for current answer evidence, reasoning cards, structured exhibits, citations, and handoffs.

## Layer Impact

- `global-control-lane`: changes the shared Intelligence Ask experience for all signed-in tenants.
- Frontend only: reuses the existing `/api/intelligence/ask` endpoint and canonical `AgentAnswer` renderer. It does not change retrieval, tenant resolution, semantic routing, data loading, or model prompts.

## Client Applicability

- All clients: yes, all tenants using `/intelligence/ask`.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx`: replaces the old form/grid with a shared `AgentDock` adapter, durable thread history, multiline composer behavior, Ava branding, answer-canvas rendering, streamed NDJSON handling, citations, reasoning cards, `AgentAnswer` exhibits, and Moves handoff preservation.
- `src/app/intelligence/ask/page.tsx`: updates stale “corpus/librarian” language to Ava Intelligence advisor language.
- `src/app/(maestro)/intelligence/ask/__tests__/SentinelReasoningCards.test.tsx`: covers shared dock mount, multiline prompt submission, prior question/answer history, and dock controls for right/top/expanded/hidden modes.

## QA / Validation

- `passed`: `npx jest --runTestsByPath '/private/tmp/nexus-intelligence-chat-shell/src/app/(maestro)/intelligence/ask/__tests__/SentinelReasoningCards.test.tsx' --runInBand` — 4 tests passed. The repo still prints existing duplicate manual mock warnings for `mdast-util-from-markdown`, `mdast-util-gfm`, and `micromark-extension-gfm`.
- `passed`: focused ESLint for touched files.
- `passed`: `npm run release:check`.
- `blocked`: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --project tsconfig.json` is blocked by pre-existing repo-wide missing declarations/modules for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`; no touched-file TypeScript errors were emitted before those baseline failures.
- `not-run`: deployed browser proof after ACA rollout.

## Rollout Plan

Merge to `main`; deploy through the repo-owned Azure Container Apps main workflow. No data migration, DNS change, worker update, or feature-flag rollout is required.

## Deployment Authority

- Repo-owned deploy workflow: required for `app.abarva.ai`.
- Shared runtime mutators: no local or branch deploy path is authorized.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: template image, active revision image, and 100% traffic revision must match the approved main digest.
- Worker image invariant: unchanged by this frontend-only release, but main deploy workflow still validates worker image alignment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes; verify `/intelligence/ask` for at least one tenant with multiline/history/dock controls, then spot-check the same shared shell across pilot tenants.

## Rollback Plan

Revert this PR and redeploy the previous approved main digest through the ACA main deploy workflow.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3926
- CI run: to be added.
- Deployment evidence: to be added after ACA deployment.
- Browser proof: to be added after signed-in `/intelligence/ask` verification.

## Known Gaps

This release fixes the Intelligence chat interaction model. It does not itself improve answer quality, semantic layer coverage, or the backend prompt/context design.
