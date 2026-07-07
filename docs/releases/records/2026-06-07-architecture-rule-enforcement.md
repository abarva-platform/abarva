# 2026-06-07-architecture-rule-enforcement — Enforce Azure/Anthropic runtime architecture rules

## Release ID

`2026-06-07-architecture-rule-enforcement`

## Status

`candidate`

## Plain-English Summary

This release turns the current AbarVa architecture rules into executable PR checks. New runtime/code
changes are now blocked when they add Supabase runtime dependencies or fallbacks, Pinecone/Neo4j
runtime dependencies, Vercel production-runtime assumptions, direct model SDK usage outside the
audited egress layer, or OpenAI requirements in Sentinel/Nexus/Source/Tower answer generation.

The guard is diff-aware: it prevents new violations without making old migration/docs/legacy residue
block every PR on day one.

## Layer Impact

- **global-control-lane:** Adds repo-wide PR enforcement for runtime/provider/data-plane architecture
  policy.
- **internal-admin:** Updates agent and PR instructions so operators and background agents follow the
  same Azure/Postgres and Anthropic-only production rules.

## Client Applicability

- All clients: Yes. The guard protects shared runtime architecture for every tenant/client.
- Specific clients: None.
- Internal only: The enforcement scripts/workflows are internal repo governance.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/audit/architecture-rules.mjs` — new diff-aware architecture guard plus self-test mode.
- `package.json` — adds `audit:architecture-rules`, `audit:architecture-rules:full`, and
  `audit:architecture-rules:self-test`.
- `.github/workflows/architecture-rules.yml` — PR/merge-group workflow that runs the guard.
- `.github/pull_request_template.md` — requires architecture/provider-policy reporting.
- `AGENTS.md` — documents Azure/Postgres runtime, Anthropic-only production answer generation, and
  no new Supabase/Pinecone/Neo4j/Vercel production assumptions.

## QA / Validation

- `npm run audit:architecture-rules:self-test` — **passed**. Verifies the guard catches representative Supabase,
  OpenAI reasoning, direct model SDK, and Pinecone violations while allowing docs and egress-layer
  Anthropic usage.
- `npm run audit:architecture-rules -- --base=origin/main --head=HEAD` — **passed**. Validates this PR's changed
  lines.
- `npm run release:check -- --base origin/main --head HEAD` — **passed after this release record update**.
  Validates release-record coverage.
- `git diff --check` — **passed**. Validates whitespace.

## Rollout Plan

Squash-merge to `main`. The new GitHub workflow automatically runs on subsequent PRs and merge-group
checks. No runtime deployment, database migration, DNS change, Vercel change, or account action is
required.

## Rollback Plan

Revert the merge commit. This removes the new workflow, scripts, and template/doc updates. No data or
runtime state needs rollback.

## Audit Evidence

- PR for this release.
- GitHub `Architecture Rules` workflow result.
- Local command outputs listed in QA / Validation.

## Known Gaps

- This PR does not delete historical legacy references. It prevents new/modified code from adding
  runtime violations and leaves legacy cleanup to explicit deprecation/removal PRs.
