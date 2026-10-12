# 2026-10-12-home-ava-compact-presentation - Bounded concise-answer quality gate

## Release ID

`2026-10-12-home-ava-compact-presentation`

## Status

`candidate`

## Plain-English Summary

Home advisory points have a checked 30-word limit, not only a prompt preference. One audited formatting retry may use the same admitted context within the existing request deadline. When that fails, the response retains cited evidence and reports a concise-summary gap rather than cutting away qualifications. Internal claim codes remain in citations, not visible answer copy.

## Layer Impact

Release lane: `global-control-lane`.

- Layers 1-3: no tenant load, ingestion, canonical objects, approval or source-selection changes.
- Layer 4: Home answer presentation validation only. Existing authorization, record markers, admission, count checks and citation validation remain intact.

## Client Applicability

- All clients: existing Home advisor users.
- Specific clients: no special tenant behavior.
- Internal only: no new operator capability.
- Public/demo only: existing source-state and synthetic labels remain.
- Feature flag: none added.

## Changes Included

- Structured-point length validation and requested three-point shape.
- At most one separately audited repair against unchanged context; no deadline reset.
- Safe presentation fallback retaining source citations, without truncated business claims.
- Inline claim-code suppression with the complete citation packet preserved.

## QA / Validation

PASS: 28 focused Home and mounted dock suites / 368 tests; TypeScript; focused ESLint; all 11 release gates; all five context-corpus checks. Existing manifest warnings are unchanged. Home ratchet: 742/770 tests, 12 previously baselined suites, no movement. Tests cover successful and failed repair, invalid repair citations, the shared timeout budget, post-sanitization point length and preservation of evidence beneath clean visible text. Current-head CI and native browser proof remain pending for this candidate.

## Rollout Plan

Protected PR and squash merge followed by the repo-owned ACA main workflow. No data refresh or serving promotion is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: capture from the approved main deployment.
- ACA runtime invariant: web template and 100% traffic revision match the approved digest.
- Worker image invariant: both required worker jobs match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: concise native list, no inline claim codes, retained citations and visible source state.

## Rollback Plan

Protected revert through the same main workflow. No data rollback is required.

## Audit Evidence

Focused tests, release and governance gates, current-head CI, the approved deployment, runtime invariant and private signed-in response captures.

## Known Gaps

A short cited answer is not a proof of all enterprise data, causal entailment or finance-attested outcomes. The independent governed load, review and serving gates are unchanged. A repair can add latency but cannot extend the existing 45-second model deadline.
