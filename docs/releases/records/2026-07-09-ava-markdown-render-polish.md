# 2026-07-09-ava-markdown-render-polish — aVa Markdown/Table Rendering Polish

## Release ID

`2026-07-09-ava-markdown-render-polish`

## Status

`candidate`

## Plain-English Summary

Fixes the aVa chat renderer so model-generated Markdown tables and headings render like a polished product artifact instead of a raw browser document. The renderer now cleans malformed Markdown table separator rows before display, prevents literal `---` rows from appearing as data, and uses compact heading/table styling suitable for CXO chat sessions.

## Layer Impact

- `global-control-lane`: Updates the shared `AgentMarkdown` renderer used by aVa/AgentDock-style chat surfaces.
- Presentation layer: Tightens Markdown heading and table styles for chat readability.
- Safety/quality layer: Adds regression coverage for malformed tables so a renderer defect cannot make executive evidence look misleading.

## Client Applicability

- All clients: Yes. This is shared aVa chat/rendering behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/agent/markdownTokens.tsx`
- `src/lib/agent/markdownRenderer.tsx`
- `src/lib/agent/__tests__/markdownTokens.test.tsx`

## QA / Validation

- Pass: `npx jest src/lib/agent/__tests__/markdownTokens.test.tsx --runInBand`
- Pass: `npx jest src/components/agent/__tests__/AgentDock.test.tsx --runInBand -t "exports the current chat session"`
- Pending: focused lint/TypeScript checks for changed files.
- Pending: live signed-in Intelligence prompt audit after deploy.
- Pending: browser screenshot proof for a HITL/checkpoint table prompt after deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds the digest-pinned image, updates `ca-abarva-web-lab-eastus`, verifies health and runtime invariant, and shifts traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None from this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA main deploy workflow. No migrations, data changes, feature flags, or environment changes are involved.

## Audit Evidence

- PR URL: Pending.
- CI / local validation: See QA section.
- Live screenshot/export proof: Pending after deploy.
- Claude/aVa answer-quality audit: Pending after deploy.

## Known Gaps

This release fixes rendering quality. It does not by itself prove Claude/aVa answer accuracy; the post-deploy audit must separately score answer grounding, table correctness, supported claims, suggested questions, and export fidelity.
