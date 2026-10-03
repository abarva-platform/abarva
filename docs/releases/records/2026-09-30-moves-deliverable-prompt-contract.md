# 2026-09-30 — Moves Deliverable Prompt Contract

## Release ID

`2026-09-30-moves-deliverable-prompt-contract`

## Status

`candidate`

## Plain-English Summary

Moves artifact generation now receives the matching deliverable's registered generation guidance. The design workshop guide has a fixed five-section structure with section budgets totaling less than its existing 3,000-word hard ceiling. Its prompts no longer require a generic risk register or executive decision ask that the guide's quality contract does not require. The quality ceiling and evidence gates remain unchanged.

## Layer Impact

- `global-control-lane`: Changes prompt composition for Moves artifacts with a matching deliverable registry entry. No tenant data, canonical objects, schema, or gate state is changed.
- `product`: The design workshop guide is bounded to estimate-ready design orchestration, evidence carry-forward, and roadmap handoff; it does not claim to complete detailed process, operating-model, or implementation design.

## Client Applicability

- All clients: Moves artifact generations using a deliverable key with registered generation guidance.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a fixed, purpose-specific design workshop guide brief with five required sections and explicit section word budgets.
- Passes registry-authored guidance into Moves generation prompts.
- Aligns draft, review, rewrite, synthesis, formatting, and length instructions with the working-guide quality contract.
- Keeps the 3,000-word ceiling and existing evidence-validation behavior unchanged.

## QA / Validation

- Focused Moves prompt/brief/quality-bar suites: 92 passed across 4 suites.
- Focused ESLint on changed source and test files: passed.
- Typecheck: `npm run typecheck` passed (`typecheck: clean`).
- Release check: `node scripts/release-check.mjs --base origin/main --head HEAD` passed, including Release Control, Deploy Authority, and current-manual gates.
- Mutation check: removing the registry-guidance prompt injection made the runtime-prompt regression test fail; restoring the injection returned the focused suite to green.

## Rollout Plan

Merge by the protected-branch PR path. Deploy only through the repo-owned ACA main deploy workflow. After deployment, verify the digest-pinned template image, 100%-traffic revision, and required worker job images, then verify the generated guide in a signed-in synthetic Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy proof.
- Worker image invariant: Pending deploy proof.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for the synthetic Moves guide-generation path.

## Rollback Plan

Revert the merged prompt/brief change through a protected-branch PR and deploy through the repo-owned ACA main deploy workflow. No data migration or stored evidence mutation is introduced by this code change.

## Audit Evidence

- PR: Pending.
- CI run: Pending.
- ACA deploy run and runtime invariant: Pending.
- Signed-in synthetic Move proof: Pending.

## Known Gaps

Generated content remains a draft until a human reviews and approves it. The prompt change does not bypass evidence, readiness, sign-off, or phase-gate requirements.
