# 2026-07-23-moves-playbook-archetype-routing — Archetype-driven playbook routing fix

## Release ID

`2026-07-23-moves-playbook-archetype-routing`

## Status

`candidate`

## Plain-English Summary

The Moves phase-playbook endpoint (`GET`/`POST /api/v1/programs/:programId/playbook`) decided
whether to serve AI-PDLC-specific facilitated-session content by regex-matching the substrings
"pdlc", "product development lifecycle", "ai-pdlc", or "sdlc" against a Move's coarse UI-label
`archetype` field and its free-text `name` — neither of which reliably contains those substrings,
since the coarse label is one of only 5 generic display categories
(`strategic_transformation`, `workflow_automation`, etc.), not the fine-grained framework
archetype. The codebase already has a canonical 5-archetype registry
(`src/lib/programs/archetypes/registry.ts`) and a resolver
(`resolveMoveArchetypeForProgram()`) that 7 other archetype-aware routes already use correctly —
this route just never called it. This change replaces the regex with the same canonical resolver
call, so AI-PDLC session overrides apply exactly when the resolved archetype id is
`AI_PRODUCT_DEVELOPMENT_LIFECYCLE`, regardless of what the Move happens to be named.

## Layer Impact

- **Lane: `global-control-lane`** (shared app/control-plane behavior for all clients, not
  feature-gated).
- **Application/routing layer only.** `src/app/api/v1/programs/[programId]/playbook/route.ts`:
  the `isAiPdlc` detection now calls `resolveMoveArchetypeForProgram()` instead of a local regex.
  No schema change, no change to the playbook content itself, no change to any other route.

## Client Applicability

- All clients: yes — shared routing logic, not tenant-gated
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — this is a correctness fix to existing, always-on behavior

## Changes Included

- `src/app/api/v1/programs/[programId]/playbook/route.ts` — replaced the free-text regex with a
  canonical-archetype-id check via `resolveMoveArchetypeForProgram()`
- `src/app/api/v1/programs/[programId]/playbook/__tests__/route.test.ts` — new test file, 5
  assertions covering: overrides apply on the canonical id; a Move with a misleading free-text
  name/label but a different resolved archetype does NOT get overrides; the resolver is called
  with the correct `(ctx, programId)` args; a resolver failure degrades gracefully (never a 500);
  an explicit `?phase=` query param still overrides the Move's current phase
- `docs/backlog/moves-product-backlog.md` — new `MOVES-BUG-003` entry

## QA / Validation

- `npx eslint` on both changed files: clean
- `npx tsc --noEmit -p tsconfig.json`: no new errors (3 pre-existing, unrelated missing-module
  errors in `src/components/home/*`)
- `npx jest "src/app/api/v1/programs/[programId]/playbook"`: 5/5 passing (new test file; no
  pre-existing tests for this route existed before)
- `git diff --check`: clean
- `node scripts/release-check.mjs --base origin/main --head HEAD`: to be run before PR open

## Rollout Plan

1. Merge to `main` via the repo-owned ACA deploy workflow.
2. No flag/tenant change — takes effect for every future playbook request immediately on deploy.
3. Live signed-in verification: request the playbook for a known AI-PDLC Move and confirm
   `isAiPdlc: true` and the AI-PDLC-specific phase-3 session content; request it for a
   differently-archetyped Move and confirm `isAiPdlc: false`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none directly
- Approved image digest: produced by the standard `aca-main-deploy` run for this merge SHA
- ACA runtime invariant: verify template image = 100%-traffic revision image post-deploy
- Worker image invariant: n/a (web request path only)
- Feature/env flag update path: none
- Live signed-in proof required: yes — see Rollout Plan step 3; not yet completed as of this
  record

## Rollback Plan

Revert the merge commit. The change is a like-for-like replacement of one detection mechanism
with another inside the same function; reverting restores the previous regex behavior. No data
cleanup required.

## Audit Evidence

- PR: (added at merge time)
- Backlog item: `MOVES-BUG-003` in `docs/backlog/moves-product-backlog.md`
- Test evidence: `npx jest "src/app/api/v1/programs/[programId]/playbook"` output captured in
  this session's validation pass (5/5 passing)

## Known Gaps

- Only the AI-PDLC archetype has a session-override table today (`AI_PDLC_SESSION_OVERRIDES`,
  phase 3 only). The other 4 canonical archetypes (IT Sourcing Event, AI Operations Decision
  Support, Contact Center Agent Assist, Commercial Lending Agent Assist) still fall back to the
  generic phase playbook with no archetype-specific session content — building those override
  packs is separate, not-yet-scoped work this fix does not attempt.
- No live signed-in proof yet that the fix changes real Move behavior in the deployed
  environment — proven via unit tests against a mocked resolver, not an end-to-end request
  against a live Move.
