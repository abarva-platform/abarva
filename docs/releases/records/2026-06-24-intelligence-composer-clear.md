# 2026-06-24-intelligence-composer-clear — Immediate aVa Composer Clear

## Release ID

`2026-06-24-intelligence-composer-clear`

## Status

`candidate`

## Plain-English Summary

This follow-up fixes the remaining production crawl issue after the aVa chat shell deployment: the composer kept the submitted prompt visible while the answer streamed. The composer now clears immediately on submit, matching GPT/Claude behavior, while the submitted question remains visible in the conversation history.

## Layer Impact

- `global-control-lane`: shared AgentDock composer behavior and aVa answer chrome.
- No data, schema, tenant, retrieval, or feature-flag change.

## Client Applicability

- All clients using AgentDock, including Intelligence.
- No tenant-specific rollout.

## Changes Included

- `src/components/agent/AgentDock.tsx`: clears the draft and attachments immediately after submit, before awaiting the network stream.
- `src/components/agent/AgentDock.tsx`: preserves agent byline casing instead of forcing uppercase, so `aVa` remains `aVa`.
- `src/components/agent-answer/AgentAnswerRenderer.tsx`: preserves `aVa` casing in the structured answer kicker.

## QA / Validation

- `passed`: focused Jest for Intelligence chat shell, aVa answer renderer, aVa ask, and response policy — 4 suites / 25 tests passed. Existing duplicate manual mock warnings remain unrelated.
- `passed`: focused ESLint for the touched shared components.
- `pending`: `npm run release:check`.
- `pending`: ACA deploy and signed-in production browser crawl after merge.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, then rerun the signed-in Intelligence browser proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- No local/manual ACA runtime mutation is authorized or performed.

## Rollback Plan

Revert this commit and redeploy main through the repo-owned ACA deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Deployment evidence: pending.
- Browser proof: pending.

## Known Gaps

This fixes the remaining chat-composer behavior found by the production crawl. It does not claim broader Intelligence answer-quality stress coverage beyond the focused chat-shell proof.
