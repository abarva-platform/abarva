# 2026-09-19 Agent Identifier Scrub Ownership

## Release ID

`2026-09-19-agent-identifier-scrub-ownership`

## Status

`candidate`

## Plain-English Summary

Documents why internal identifiers are removed in two response passes. The streaming repair owns text while it is arriving, and the shared response shaper owns the settled answer. Both passes are intentionally retained because each can be shown to a user independently.

## Layer Impact

- Release lane: `global-control-lane`.
- Shared assistant response-control documentation only.
- No runtime behavior, data, schema, prompt, configuration, or presentation change.

## Client Applicability

- All clients using assistant answers.
- No tenant-specific behavior.

## Changes Included

- State the authoritative responsibility of the streaming identifier repair.
- State the authoritative responsibility of the settled-answer identifier shaper.
- Record that duplicate identifier removal is an intentional defense, not removable dead code.

## QA / Validation

- PASS: existing identifier consistency behavior suite exercises both real response paths and proves both prevent leakage while producing readable, matching prose.
- BASELINE: broader response-shape sample passed 3 of 5 suites and 44 of 47 tests. Three existing Intelligence, Source, and Tower assertions fail identically outside this comment-only diff; they are not claimed as fixed here.
- PASS: TypeScript, scoped ESLint, release control, and whitespace checks.

## Rollout Plan

Merge through the protected pull-request lane. This documentation-only clarification requires no product runtime deployment to take effect, though it may be included in the next repository-owned ACA image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Not applicable to a documentation-only code-contract clarification.
- ACA runtime invariant: Not required.
- Worker image invariant: Not required.
- Feature/env flag update path: None.
- Live signed-in proof required: No runtime behavior changes.

## Rollback Plan

Revert the ownership comments and this release record. No runtime or data rollback is required.

## Audit Evidence

- Existing identifier consistency behavior suite.
- Related response-shape tests.
- TypeScript, lint, release-control, and diff checks.

## Known Gaps

This change records the existing two-pass ownership contract; it does not add a new architectural enforcement mechanism that prevents a future author from deleting one pass. The focused behavior suite remains the executable guard that fails if an identifier leaks or the two user-visible paths diverge.
