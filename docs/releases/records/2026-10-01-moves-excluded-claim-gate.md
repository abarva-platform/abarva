# 2026-10-01 — Moves Explicitly Excluded Claim Gate

## Release ID

`2026-10-01-moves-excluded-claim-gate`

## Status

`candidate`

## Plain-English Summary

Moves discovery deliverables now suppress numeric claims that governed evidence explicitly marks as unsupported or excluded. A deterministic check blocks export if an equivalent value still appears in generated content, including cited or disclaimed text. Other evidence-backed metrics remain available.

## Layer Impact

- `global-control-lane`: The shared deliverable orchestrator applies the same fail-closed rule to the three Moves discovery artifact types when their evidence declares an excluded numeric claim.

## Client Applicability

- All clients: Moves discovery reports, root-cause worksheets, and design workshop guides with explicitly excluded numeric claims in governed evidence.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None; only explicitly classified exclusions activate the check.

## Changes Included

- Add governed-evidence extraction for explicitly excluded numeric claims.
- Redact those values from model-facing evidence and required-signal prompts.
- Block rendered outputs that repeat equivalent values across prose, tables, recommendations, exhibits, or slide notes.
- Add regression coverage for equivalent number formats and preservation of unrelated cited metrics.

## QA / Validation

- Targeted orchestrator and Moves request suites: `pass` — 32 suites, 425 tests.
- Negative mutation: `pass` — disabling the detector makes all four cited/alternate-format leak cases fail; restored detector passes.
- Repository typecheck: `pass` — `typecheck: clean`.
- Focused ESLint: `pass` — changed TypeScript files.
- Release check: `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD`.
- Live signed-in P2 regeneration and artifact review: `not-run` — requires deployment of the merge SHA.

## Rollout Plan

Merge through the protected main branch and deploy only through the repository-owned ACA main deploy workflow. The check runs synchronously during generation; a blocked output is not exported or eligible for approval. No data migration or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending exact merge-SHA workflow evidence.
- ACA runtime invariant: Pending.
- Worker image invariant: Pending.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Regenerate and inspect the affected P2 artifacts; confirm excluded claims are absent and safe governed metrics remain present.

## Rollback Plan

Revert the merged code through a follow-up protected-branch PR and deploy that merge through the repo-owned ACA workflow. No persisted evidence or approval state is modified by the gate.

## Audit Evidence

- Pull request and exact-SHA CI/deployment workflow runs: pending.
- Targeted test output: pending.
- Signed-in artifact regeneration proof: pending.

## Known Gaps

The deterministic classifier recognizes explicit exclusion language and numeric forms represented by the current parser. It does not infer whether an unlabelled value should be excluded; that disposition must be present in governed evidence.
