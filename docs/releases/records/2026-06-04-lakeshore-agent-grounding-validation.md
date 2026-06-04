# 2026-06-04-lakeshore-agent-grounding-validation — Lakeshore Agent Grounding Validation

## Release ID

`2026-06-04-lakeshore-agent-grounding-validation`

## Status

`candidate`

## Plain-English Summary

Adds a Lakeshore-specific prompt and validation pack for proving that Home,
Sentinel, Moves, Source, and Tower answers are grounded in Lakeshore evidence
after the governed load and embeddings complete. The pack defines what each
agent should cite, what cross-tenant leakage is forbidden, and how reviewers
should fail hallucinated or unsupported answers.

## Layer Impact

- `client-data-lane`: Adds Lakeshore-specific grounding scenarios tied to the
  synthetic corpus manifest, templates, documents, and operating companies.
- `internal-admin`: Adds an operator verifier and reviewer guide for live
  agent-grounding validation.

## Client Applicability

- All clients: No runtime behavior changes.
- Specific clients: Lakeshore Holdings only.
- Internal only: AbarVa operator and reviewer evidence.
- Public/demo only: Not applicable.
- Feature flag: Not applicable.

## Changes Included

- `docs/build/lakeshore/agent-grounding/lakeshore-agent-grounding-prompts.json`
- `docs/build/lakeshore/agent-grounding/README.md`
- `scripts/lakeshore/verify-agent-grounding-prompts.mjs`
- `package.json` script `lakeshore:agent-grounding:verify`
- `docs/releases/records/2026-06-04-lakeshore-agent-grounding-validation.md`

## QA / Validation

- PASS: `npm run lakeshore:agent-grounding:verify` validated 10 prompts across
  Home, Sentinel, Moves, Source, and Tower against the Lakeshore manifest.
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`

## Rollout Plan

Merge to `main` through PR. No application runtime rollout is required. The
pack becomes active when operators run the validation after Lakeshore load,
embedding, Data Trust, and CXO provisioning are complete.

## Rollback Plan

Revert the PR. No database, Clerk, Azure, embedding, or runtime changes are
introduced.

## Audit Evidence

- PR URL and CI once opened.
- Prompt pack JSON.
- Verifier output.
- Later live answer/citation evidence collected from the prompts.

## Known Gaps

- This validates the prompt/evidence contract only. Live grounding proof still
  requires PR #2997, PR #2998, governed load commit, embeddings, Data Trust
  verification, and browser-tested tenant isolation.
