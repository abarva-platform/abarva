# 2026-07-17-moves-p1-charter-compact — Compact P1 Charter Generation Contract

## Release ID

`2026-07-17-moves-p1-charter-compact`

## Status

`released`

## Plain-English Summary

Moves P1 Charter generation now behaves like a concise gate decision record instead of a long board-grade discovery pack. The charter records the approved P0 bet, sponsor/title, scope, value hypothesis, evidence plan, caveats, and permission to run P2 Discovery. It must not invent current-state insights, technology stacks, org structures, architecture, roadmap, estimates, operating model, or solution approach from P0-only inputs.

## Layer Impact

- `global-control-lane`: Shared Strategic Moves deliverable-generation contracts, prompts, and Word-equivalent rendering changed for P1 Charter only.
- `client-data-lane`: No client data, schema, ingestion, retrieval, or tenant-specific data behavior changed.

## Client Applicability

- All clients: Yes, for Strategic Moves P1 Charter generation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- Tightened P1 phase package contract to require a compact P1 Charter Brief / Decision Record.
- Reduced P1 charter artifact depth from 2,000-3,500 words to 700-1,200 words.
- Removed P1 requirements for workshop evidence pack and derived visualization inventory.
- Replaced the broad board-grade `program_charter` section contract with a compact five-section charter contract.
- Added P1-specific no-hallucination rules to board and multi-pass orchestrated generation prompts.
- Shortened the P1 Word-equivalent renderer so it does not add TOC, storyline arc, appendix, or diagnostic sections.
- Updated tests so P1 compact behavior is enforced.

## QA / Validation

- Pass: `npx eslint src/lib/programs/phase-deliverable-package-contract.ts src/lib/programs/deliverables/contracts.ts src/lib/programs/deliverables/board-deliverable.ts src/lib/programs/deliverables/artifact-briefs.ts src/lib/programs/deliverables/orchestrator.ts src/lib/deliverables/strategic-moves-artifact-standard.ts src/lib/deliverables/phase-word-equivalent.ts src/lib/deliverables/__tests__/visual-and-prompt.test.ts`
- Pass: `npx jest src/lib/deliverables/__tests__/visual-and-prompt.test.ts src/lib/ai/__tests__/document-generation-policy.test.ts --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`

## Rollout Plan

Open PR against `abarva-platform/abarva`, squash merge to main, then deploy through the repo-owned Azure Container Apps main deploy workflow. After deploy, run a signed-in Meridian or disposable Move proof by generating a fresh P1 Charter and confirming it is concise, evidence-bound, and does not contain P2/P3/P4 content.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Do not use ad-hoc ACA mutation.
- Approved image digest: `sha256:dfe02dba2753af7da1c743f5bc581728385ef0bb52e8356cdc641c7d5c79d2f2`.
- ACA runtime invariant: Passed on `ca-abarva-web-lab-eastus--m8b8e1649` with 100% traffic.
- Worker image invariant: Updated by ACA main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, fresh P1 Charter generation in app.abarva.ai. Pending browser-level regeneration proof.

## Rollback Plan

Revert this PR and redeploy the previous ACA image through the repo-owned deploy workflow. No database rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4977.
- ACA deploy run: https://github.com/abarva-platform/abarva/actions/runs/29617120013.
- Commit SHA: `8b8e1649905935652f68059016f65213dd84b1d2`.
- ACA revision: `ca-abarva-web-lab-eastus--m8b8e1649`.
- Signed-in proof: Pending fresh P1 regeneration proof; route health and runtime invariant passed.

## Known Gaps

- Existing already-generated 42-page P1 charter artifacts are not rewritten in place by this release. They should be regenerated after deploy or archived/replaced by the corrected P1 charter brief.
