# 2026-08-04-intelligence-curated-dossier-bridge — Add the current-context Postgres dossier as an additive Intelligence retrieval source

## Release ID

`2026-08-04-intelligence-curated-dossier-bridge`

## Status

`candidate`

## Plain-English Summary

Following the same-day Home fix that removed retired V6/V7 fallbacks from `/api/home/know/ask`
(`2026-08-04-home-source-v4-current-layer-bridge`), this release investigates and begins the
equivalent work for Intelligence and Source aVa — but the two surfaces turned out to need very
different treatment.

Source's chat backend (`/api/chat/agent`'s `isSourceSurface` branch and the Source data-model
read-adapter) was audited and confirmed to have zero references to `intelligence_v6`/`intelligence_v7`
anywhere — it already reads only `source.contract_360`/`source.vendor_contract_portfolio`/Cube views.
No fix was needed there.

Intelligence's core retrieval pipeline (`askIntelligence`) is a different and larger problem than
Home's was. Home had a working new-context path (`semantic2_dossiers` via `curated-dossier-store.ts`)
running alongside its old V6/V7 fallback, so removing the fallback was safe. Intelligence had **no**
current-context Postgres path at all — `retrieveV7DossierSources` was called unconditionally on every
question and, when it returned data, suppressed every other tenant-context source in the pipeline
(`hasActiveV7Dossier` zeroed out `legacyTenantSources`). The intended plan for this release was to add
a replacement source first, prove it, and only then gate V7 down — mirroring Home's safe order.

That plan was overtaken mid-session: a separate, concurrent commit
("Retire legacy Tower and Intelligence read paths", `59757a9d8`) removed `retrieveV7DossierSources`
from `askIntelligence` entirely, unconditionally, with no replacement current-context source in place.
That commit landed on `main` and deployed while this PR was still in CI. This means, for a window
between that deploy and this PR merging, Intelligence ran with a real grounding gap — no V7, no
curated-dossier bridge yet. This release closes that gap: it adds `retrieveCuratedDossierSources`
(reading the same `semantic2_dossiers` Postgres layer Home and Atlas already serve from, via the shared
`loadCuratedSemanticDossier` function — no new query shape; the source-block formatting mirrors Atlas's
proven `formatCleanDossierContext` pattern) into the now-V7-free `currentTenantSources` array that
`askIntelligence` already assembles unconditionally on every question.

## Layer Impact

- `global-control-lane`: `src/lib/intelligence/ask/index.ts` is Intelligence's core retrieval pipeline,
  invoked by every `/api/intelligence/ask` question for every tenant. This change is additive only —
  one new retriever call, its result appended into the existing `rawSources`/`clientGroundingPacket`
  source arrays. No existing retriever call, no existing suppression logic
  (`hasActiveV7Dossier`/`legacyTenantSources`), and no prompt-assembly ordering is modified or removed.
  Verified by full typecheck and the existing Intelligence ask test suite passing unchanged (see QA).

## Client Applicability

- All clients: any tenant with an eligible curated Semantic2 dossier (`semantic2_dossiers`, same
  eligibility gate Home and Atlas already use) gets an additional grounding source on Intelligence
  questions. Tenants with no eligible dossier yet see no behavior change — the new retriever degrades
  to an empty result and the pipeline runs exactly as before.

## Changes Included

- `src/lib/intelligence/ask/retrievers/curated-dossier.ts` (new): `retrieveCuratedDossierSources(query, opts)` —
  calls `loadCuratedSemanticDossier` (shared with Home/Atlas), converts the returned dossier into a
  single `AskSource` (facts, measures, gaps — formatting mirrors Atlas's `formatCleanDossierContext`).
  Best-effort: any missing/ineligible/stale dossier or read failure degrades to an empty result rather
  than throwing, matching the existing retriever contract in this pipeline.
- `src/lib/intelligence/ask/index.ts`: rebased onto `59757a9d8` (which removed the V7 retriever from
  this file directly on `main` mid-session). Calls the new retriever and prepends its result into the
  `currentTenantSources` array that both `clientGroundingPacket` and `rawSources` already read from
  unconditionally — no other line from `59757a9d8`'s changes to this file is modified.
- `src/lib/intelligence/ask/retrievers/curated-dossier.test.ts` (new): asserts no-tenant-key degrades
  to empty, a successful dossier load converts correctly (facts/measures/gaps present in the formatted
  detail, correct source id/type), and a failed/ineligible load degrades to empty rather than throwing.
- `docs/architecture/HOME_SOURCE_INTELLIGENCE_CURRENT_LAYER_INSTRUCTION.md`: updates the Source and
  Intelligence sections with verified current-state status (Source: already clean; Intelligence: bridge
  added additively, V7-gating is the explicit next phase, not done here).

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .` (clean worktree off `origin/main`,
  post `#5951`)
- PASS: `npx eslint src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/retrievers/curated-dossier.ts src/lib/intelligence/ask/retrievers/curated-dossier.test.ts`
- PASS: `npx jest src/lib/intelligence/ask/retrievers/curated-dossier.test.ts` (3/3, new)
- PASS: `npx jest src/lib/intelligence/ask/` (148/160; the 12 failures across 4 suites are pre-existing
  static string-matching assertions on `index.ts`'s raw source text and unrelated fixture drift —
  confirmed to fail identically, byte-for-byte (same 4 suites, same 12 tests, same assertion lines), on
  a fresh `origin/main` checkout at the post-rebase commit, i.e. not a regression from this diff)
- Live signed-in proof: pending post-deploy — ask Intelligence a question for a tenant with an eligible
  curated dossier and confirm (a) the answer quality is at least back to parity with pre-`59757a9d8`
  behavior (see Known Gaps — there was a real grounding gap in between), and (b) no error or behavior
  change for tenants without an eligible dossier.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No migration, no
feature flag — additive retrieval source only.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before this release is marked `released`.

## Rollback Plan

Code rollback by reverting the PR. No data mutation, no schema change, and the existing V7 retrieval
path is untouched by this diff — reverting simply removes the additional grounding source and restores
the exact prior retrieval mix.

## Audit Evidence

- Code audit (this session) confirming Source's chat backend has zero `intelligence_v6`/`intelligence_v7`
  references.
- Code audit (this session) tracing `askIntelligence`'s `hasActiveV7Dossier` suppression logic and
  confirming V7 is Intelligence's dominant, unconditionally-queried source today, not a fallback —
  the basis for choosing an additive-first, gate-later migration order instead of Home's
  delete-the-fallback order.
- This PR's diff and CI run.
- Post-deploy: live signed-in question against the deployed endpoint for a tenant with an eligible
  curated dossier.

## Known Gaps

- The intended safe sequencing (add + prove the replacement source, then gate V7 down) did not happen
  as planned — a concurrent commit removed V7 first. There was a real window (this session, before
  this PR merged) where Intelligence answered with less grounding than either the V7-based or the
  curated-dossier-based state. This release closes that gap but does not undo the fact that it existed;
  worth a live spot-check across a few tenants post-deploy to confirm answer quality is at least back to
  parity with pre-`59757a9d8` behavior, not just "not erroring."
- No systematic audit was done in this release of `intelligence_v6` usage elsewhere in Intelligence's
  broader codebase (only the `askIntelligence` retrieval pipeline and `/api/intelligence/ask` route
  were traced) — a fuller inventory (per the Physical Purge Procedure in the instruction doc) is
  separate follow-on work.
- The physical database purge of `intelligence_v6`/`intelligence_v7` schemas remains out of scope for
  any product PR, per the instruction doc's Physical Purge Procedure — this release does not attempt
  it and no product route depends on this release for that purge to eventually proceed safely.
