# 2026-07-08-ava-chat-session-export — aVa Chat Session Export

## Release ID

`2026-07-08-ava-chat-session-export`

## Status

`candidate`

## Plain-English Summary

This release turns aVa export from a single-answer download into a full executive session artifact. Users can export the current chat thread as branded HTML or PDF, including user prompts, aVa responses, governed answer packets, tables, charts, relationship summaries, caveats, next moves, evidence references, and export summary stats. The export uses the same already-generated `AvaAnswerPacket` data and does not make a second model call.

## Layer Impact

- Global control lane: Extends the shared aVa/AgentDock export path for all dock-based agent sessions.
- Product UI/rendering: Adds compact HTML/PDF session export controls to the shared dock header and renders a board/CXO-friendly artifact.
- Governance: Reuses the existing `/api/intelligence/ask/export` route and validates every packet server-side before producing an export.

## Client Applicability

- All clients: Yes, for surfaces using the shared `AgentDock`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentDock.tsx`: adds chat-session HTML/PDF export actions and packages the current thread for export.
- `src/app/api/intelligence/ask/export/route.ts`: accepts `session` export payloads in addition to single `answer` payloads.
- `src/lib/ava-answer/export/session-types.ts`: defines the governed session export contract.
- `src/lib/ava-answer/export/render-answer-html.ts`: renders full-session standalone HTML with stats, turns, visual artifacts, evidence, caveats, and next steps.
- `src/lib/ava-answer/export/render-answer-pdf.tsx`: renders full-session PDF using the same governed packet data.
- Tests cover standalone session HTML rendering and the dock posting a multi-turn session export.

## QA / Validation

- Pass: `npx jest src/lib/ava-answer/export/__tests__/render-answer-html.test.ts --runInBand` — 3 tests passed. Jest printed pre-existing duplicate manual mock warnings.
- Pass: `npx jest src/components/agent/__tests__/AgentDock.test.tsx --runInBand -t "exports the current chat session"` — focused session-export test passed. Jest printed pre-existing duplicate manual mock warnings.
- Pass: `npx eslint src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx src/lib/ava-answer/export/render-answer-html.ts src/lib/ava-answer/export/render-answer-pdf.tsx src/lib/ava-answer/export/session-types.ts src/lib/ava-answer/export/__tests__/render-answer-html.test.ts src/app/api/intelligence/ask/export/route.ts` — no errors; pre-existing warnings remain in `AgentDock.tsx`.
- Pass: focused production TypeScript check over changed production files using `/tmp/tsconfig-chat-session-export-prod.json`.
- Pass: direct smoke generated `proof/chat-session-export/session-export.html` and `proof/chat-session-export/session-export.pdf`.
- Pending: live signed-in export proof after ACA deployment.

## Rollout Plan

Merge through PR, then deploy through the repo-owned Azure Container Apps main deploy workflow. After deployment, verify a signed-in chat session can export HTML and PDF from `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by ACA main deploy after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR. The existing single-answer export path remains conceptually compatible; rollback removes only the session payload handling and dock-level session export controls.

## Audit Evidence

- PR URL: Pending.
- Local proof artifacts: `proof/chat-session-export/session-export.html`, `proof/chat-session-export/session-export.pdf`.
- Live signed-in proof: Pending deploy.

## Known Gaps

PDF preserves chart structure and table content, while HTML remains the highest-fidelity path for inline SVG charts.
