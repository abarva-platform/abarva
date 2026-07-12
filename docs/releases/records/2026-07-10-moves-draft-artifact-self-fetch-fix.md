# 2026-07-10-moves-draft-artifact-self-fetch-fix — Stop self-fetching in the draft_artifact chat tool

## Release ID

`2026-07-10-moves-draft-artifact-self-fetch-fix`

## Status

`candidate`

## Plain-English Summary

Live-testing the just-fixed Moves aVa chat, asking it to "draft the traceability matrix now" hit a
real backend error: aVa honestly reported "The artifact service returned a connection error — the
draft was not saved." Root-caused it: the `draft_artifact` agent tool made an actual HTTP fetch
from inside the running container back to its own app's public URL
(`app.abarva.ai/api/programs/workspace/{moveId}/artifact`), constructed from the incoming request's
own URL. That self-referential network round-trip is fragile in this VNet-constrained deployment —
every other deliverable-writing tool in this codebase (`complete_deliverable`, confirmed by reading
its source) calls its underlying mutation function directly, in-process, with no network hop at
all. `draft_artifact` was the one outlier still doing it the fragile way.

This release ports `draft_artifact` to the same in-process pattern: it now calls `generateArtifact`
and `draftModuleDeliverable` directly — the exact same functions
`/api/programs/workspace/[moveId]/artifact/route.ts` calls — using `requireTenancy()` (which reads
the ambient Next.js request context directly, no cookie-forwarding needed) instead of manually
re-authenticating a second HTTP call to itself.

Separately, root-causing the same failed request surfaced a second, distinct gap: there is no
generation profile for "traceability matrix" / "requirements-to-design-to-outcomes trace" anywhere
in the newer `DeliverableKey` system `draft_artifact` uses — so even with the self-fetch fixed,
that specific request would never have produced the right artifact. The correct tool for it is
`complete_deliverable` (which already supports `requirements_traceability` and already has a
passing test for exactly this case). `draft_artifact`'s tool description now explicitly says so, so
Claude's own tool selection routes traceability-style asks to the tool that actually handles them.

## Layer Impact

- `global-control-lane`: `draft_artifact` is a chat tool available on every Moves phase surface,
  for all tenants — this fix applies platform-wide, no flag.

## Client Applicability

- All clients: yes — no tenant gating, no feature flag.

## Changes Included

- `src/lib/agent/tools/program/draftArtifact.ts`: replaced the `fetch()` self-call with direct
  calls to `requireTenancy`, `getProgramById`, `generateArtifact`, `buildGeneratedPhaseDigest`,
  `createMovesGenerateArtifactDeps`, `getDeliverableProfile`, and `draftModuleDeliverable` — the
  same functions and same branching logic (`blocked_gate` / `blocked_context` / `blocked_quality` /
  generated) the underlying route already implements. Each blocked branch now returns a specific,
  actionable `recovery` message instead of one that could only ever say "could not reach the
  service." Updated the tool description to redirect traceability/mapping-artifact requests to
  `complete_deliverable`.
- `src/lib/agent/tools/__tests__/draftArtifact.test.ts` (new): 5 tests — rejects unsupported keys
  before any tenancy/network work; confirms `global.fetch` is never called and the direct functions
  are called with the right arguments on success; confirms `blocked_gate` and `blocked_context`
  produce specific, non-generic error/recovery text; confirms archived/deleted Moves are rejected.

## QA / Validation

- `npx eslint` on both changed/added files: PASS — 0 errors (isolated git worktree off
  `origin/main`, symlinked `node_modules`).
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit -p .`: PASS — 0 errors, same worktree.
- `npx jest src/lib/agent/tools/__tests__/draftArtifact.test.ts`: PASS — 5/5 new tests.
- `npx jest src/lib/agent/tools/__tests__/registry.test.ts`: PASS — 19/19, confirms tool
  registration/discovery is unaffected.
- Confirmed via `grep` that `draftArtifact.ts` is imported only by
  `src/app/api/chat/agent/route.ts` (a server route) — the newly-imported `server-only`-marked
  modules (`moves-generate-deps.ts`) cannot leak into a client bundle.
- Live post-deploy proof: NOT YET RUN — pending merge/deploy. Plan: ask aVa in the live Moves chat
  to draft a supported deliverable (e.g. a design spec) and confirm it persists without the prior
  "could not reach the artifact service" error; separately ask it to draft a traceability matrix
  and confirm it now redirects to `complete_deliverable`-style behavior instead of failing.

## Rollout Plan

Merge to `main` → `aca-main-deploy.yml` builds/deploys → verify ACA runtime invariant → in the live
Moves chat, ask aVa to draft a supported deliverable and confirm it persists cleanly; ask it to
draft a traceability matrix and confirm it now routes to `complete_deliverable` instead of hitting
a dead end.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be confirmed post-merge.
- ACA runtime invariant: to be verified via `scripts/deploy/check-aca-runtime-invariant.mjs`.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — see Rollout Plan.

## Rollback Plan

Revert the commit. No data, migration, or flag impact — this changes how one agent tool calls
existing functions, not what those functions do or what they persist.

## Audit Evidence

- Root-caused live: asked aVa (via the just-fixed chat, see
  `2026-07-10-moves-standalone-ava-chat-wire`) to draft a traceability matrix on CANARY's real P3
  page; it honestly reported a connection error rather than fabricating success. Traced the exact
  error string (`"Could not reach the artifact service..."`) to
  `src/lib/agent/tools/program/draftArtifact.ts`'s catch block.
- Confirmed the established, safer pattern by reading `completeDeliverable.ts` (calls
  `completeDeliverable()` from `@/lib/programs/mutations` directly) and its test file, which
  already has a passing case for `requirements_traceability` — proving that tool is the correct,
  working path for this exact deliverable type.
- Confirmed no dedicated `DeliverableKey` profile for traceability exists in
  `src/lib/deliverables/profiles/types.ts` — `draft_artifact`'s generation pipeline structurally
  cannot produce this artifact type regardless of the self-fetch fix, which is why the tool
  description now redirects that class of request instead of silently failing on it.

## Known Gaps

- This does not add a traceability generation profile to `draft_artifact`'s pipeline — it routes
  that request class to the tool that already handles it correctly. Building a dedicated golden-bar
  generation profile for requirements-traceability content is separate, larger scoped work if the
  quality bar `complete_deliverable`'s simpler direct-write path provides isn't sufficient later.
- Did not pull production logs to confirm the exact underlying network exception (DNS, TLS, VNet
  egress policy, or an Azure ingress timeout) — the fix removes the network hop entirely rather
  than diagnosing the specific failure mode of a call this codebase's own conventions say shouldn't
  have existed in the first place.
