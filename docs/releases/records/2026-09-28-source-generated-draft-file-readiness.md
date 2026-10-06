# 2026-09-28 Source generated-draft file readiness

## Release ID

`2026-09-28-source-generated-draft-file-readiness`

## Status

`candidate`

## Plain-English Summary

The Source file-readiness view now separates unreviewed AI-generated drafts from uploaded evidence. A generated draft no longer inflates the evidence parser backlog or prompts an operator to parse model output as evidence. An existing draft can be regenerated through the governed authoring route without treating regeneration as client-final acceptance.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source file-readiness presentation only.
- Layer 3 Canonical Model: read-only projection of existing origin and acceptance fields. No schema, parser, fact, or approval write.

## Client Applicability

- All clients: Source event Files views containing generated drafts.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Count unreviewed generated drafts separately from stored, parsed, and parser-pending evidence.
- Label generated draft rows as drafts, not gate-ready evidence, and direct their next action to human review.
- Offer a separate Regenerate draft action beside Client Final acceptance. Successful regeneration resets the read-only preview so it fetches the current body rather than showing a stale draft.
- Keep uploaded unparsed evidence on the existing parser path and accepted parsed client finals on the existing workflow-ready path.
- Show a clear empty evidence state when all registered files are generated drafts.

## QA / Validation

- Pass: red-first mounted tests reproduced mixed-file miscounts and the all-draft zero-of-zero state.
- Pass: negative behavior retained parser guidance for uploaded pending evidence and existing client-final readiness.
- Pass: two practical mutations reintroduced draft-as-evidence counting and parser guidance for drafts; each failed the focused test and was restored.
- Pass: the missing regeneration action failed a mounted route test before implementation; removing preview reset after implementation failed the stale-body test and was restored.
- Pass: 18 Source canvas suites / 153 tests, TypeScript with an 8 GB Node 24 heap, scoped ESLint, release:check, and diff check.
- Not run: signed-in post-deployment view replay; required before product acceptance.

## Rollout Plan

Squash merge after applicable CI and review. Deploy only through the repo-owned ACA main workflow. Verify digest-pinned web and workers, then replay the synthetic Files view signed in. Do not run a parser on generated drafts as part of rollout.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: Verify both required workers match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a reviewed PR and the same main deploy workflow. No migration, parser, or data rollback is required.

## Audit Evidence

PR, applicable CI, main deploy run, runtime readback, and signed-in review are tracked in the private execution ledger.

## Known Gaps

This is a presentation correction, not a parser implementation. Unreviewed generated content remains a draft and must not be promoted to canonical facts by an automated parse path. Client-final acceptance and stage gating remain separate governed actions.
