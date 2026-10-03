# 2026-10-01 — Moves P2 Excluded-Claim Suppression

## Release ID

`2026-10-01-moves-p2-excluded-claim-suppression`

## Status

`candidate`

## Plain-English Summary

Moves discovery reports, root-cause worksheets, and design workshop guides now share a system-level instruction not to repeat numeric amounts or ranges that accepted evidence explicitly excludes. The rule applies even when a draft is disclaiming the value. Distinct evidence-backed metrics that are merely labelled synthetic or unvalidated remain available with their source status and citations.

## Layer Impact

- `global-control-lane`: Aligns the shared generation, review, rewrite, and render prompts for three P2 deliverable types. No tenant data, canonical objects, database schema, or gate state changes.
- `product`: Prevents excluded value hypotheses and external benchmarks from reappearing in narrative P2 artifacts while retaining the evidence status of other metrics.

## Client Applicability

- All clients: Moves P2 discovery reports, root-cause worksheets, and design workshop guides generated after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a shared excluded-claim suppression rule to the Moves P2 system prompt, used by all generation passes.
- Applies the rule consistently to discovery reports, root-cause worksheets, and design workshop guides.
- Adds regression coverage asserting each P2 deliverable's full-draft, review, and render prompts receive the rule.

## QA / Validation

- Focused prompt, brief, quality-bar, and size-validation suites: 145 passed across 5 suites.
- Mutation probe: removing the shared system instruction made the P2 prompt-contract test fail independently for all three deliverable types; restoring it made all three pass.
- Live signed-in review before the fix confirmed excluded-claim leakage in the generated root-cause worksheet and design workshop guide; the generated Discovery Readout did not repeat the excluded value or external benchmark.
- Focused ESLint: passed.
- Repository typecheck: passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: passed.

## Rollout Plan

Merge through the protected-branch PR path. Deploy only through the repo-owned ACA main deploy workflow. After deployment, verify the digest-pinned template image, 100%-traffic revision, and required worker job images, then run a fresh signed-in synthetic P2 generation and inspect the rendered deliverables before any approval.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy proof.
- Worker image invariant: Pending deploy proof.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for the three Moves P2 deliverable generation paths.

## Rollback Plan

Revert the prompt change through a protected-branch PR and deploy through the repo-owned ACA main deploy workflow. No data migration or stored evidence mutation is introduced by this code change.

## Audit Evidence

- PR: Pending.
- CI run: Pending.
- ACA deploy run and runtime invariant: Pending.
- Signed-in synthetic Move proof: Pending.

## Known Gaps

Prompt guidance reduces the risk of excluded values appearing in generated narrative but is not a deterministic output scrubber. Generated artifacts remain drafts until a human reviews and approves them; this change does not bypass evidence, readiness, sign-off, or phase-gate requirements.
