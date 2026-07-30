# PR A / B / C sequence — confirmed and refined for this codebase

## PR A (this PR) — provider reconciliation + view-model assembler

Branch: `feat/knowledge-provider-reconciliation` off `origin/main` @
`628cdda4c91535541e7d2bd9779b8f1289361d8a`.

Scope, as actually executable given the real state of the repo (refined from the original brief now
that `src/lib/knowledge/providers/` is confirmed to not exist on `main`):

1. This reconciliation report (10 docs).
2. `src/lib/knowledge/view-model/` — the new `KnowledgeUiViewModelAssembler`, its types, and its unit
   tests (fixture-backed + a hand-built "real sparse `airline-demo-new`" case for `SOURCE_INCOMPLETE`).
3. No changes to `src/lib/knowledge/providers/**` (does not exist here) or
   `src/components/knowledge/**` (exists but out of scope; read-only reference only).
4. A release record.

No visual change ships in PR A — there is no UI wired to the assembler yet. Reviewable purely as a
data-layer PR: does the assembler compose the real 8 queries correctly, does it never fabricate a
value, does `SOURCE_INCOMPLETE` behave as specified.

## PR B — migrate PR #5772's UI onto the assembler

This is necessarily where `src/lib/knowledge/providers/` first appears on `main`'s history (as a
rebase/cherry-pick of PR #5772's branch), because that is the only place those files can be edited at
all (see `DUPLICATE_FILES_TO_REMOVE.md`). Concretely:

1. Rebase or re-open PR #5772's UI commits against `main` (which now includes PR A).
2. In the same PR: add the deprecation header (given verbatim in `DUPLICATE_FILES_TO_REMOVE.md`) to
   every file in `src/lib/knowledge/providers/` as the first commit.
3. Rewire every component in `COMPONENT_TO_QUERY_MAPPING.md`'s table from `provider.*` calls onto
   `assembler.*` calls, one section (Brief/Explore/Relationships/Evidence/aVa/Compare/Handoff) at a
   time, each as its own commit so review can proceed mode-by-mode.
4. Delete `src/lib/knowledge/providers/` entirely once `git grep -rl "lib/knowledge/providers"
src/components/knowledge` returns nothing.
5. Wire the 9-lens picker and confirm the lens IDs against the actual approved HTML prototype (this
   PR could not — see `VIEW_MODEL_ASSEMBLER_INTERFACES.md` §2's provenance note; `network_scheduling`
   and `safety_compliance` are placeholders pending that confirmation).
6. Ship the honest `SOURCE_INCOMPLETE`/`PROJECTION_UNAVAILABLE`/`MISSING_*` empty states for every
   gapped section per `CURRENTLY_RENDERABLE_COMPONENTS.md` rather than hiding those sections — this is
   itself real, useful governed information for a pilot audience.
7. Full-tree typecheck, `npx eslint src/`, `npm run test:nav`/`test:behaviors` (per this repo's
   convention — jest-green is not proof of type-clean).

PR B does NOT need to wait on tenant activation (`TENANT_ACTIVATION_DEPENDENCY.md`) — it can and
should ship against the admin-canary HTTP path and the fixture path exactly as `vnext/` already does,
with the same render-gate discipline that already makes "no data yet" a first-class, honestly-labeled
state rather than a blocker.

## PR C — signed-in, non-admin tenant-user proof + rollout

1. `clerk-tenant-identity-mapping` and `tenant-user-baseline-proof` (per the foundation-closure
   record's own "Next Allowed Gates" — data-plane/Codex lane, not Claude/UI lane).
2. Signed-in browser proof of PR B's UI against the real (non-canary) `airline-demo-new` session path.
3. Release record classifying the lane (`client-data-lane` for the identity mapping,
   `global-control-lane` for the UI once proven) per this repo's release-control discipline.
4. Only after PR C's live-signed-in proof should any release record say "live-proven" — per this
   repo's own rule that "merged"/"deployed"/"flagged" are not "live-proven" until that proof is
   captured.

## Why this split, not a bigger or smaller one

- A single combined PR would force reviewers to evaluate new data-layer logic and a UI rewrite
  simultaneously, and would re-introduce the exact "shipped a UI before checking what already existed"
  mistake this whole reconciliation exists to fix.
- Splitting B further (e.g. one PR per mode) was considered but rejected: the modes share enough
  context-provider plumbing (`knowledge-app-context.tsx`, `use-envelope.ts`, `state/GatedSection.tsx`)
  that a per-mode PR split would repeatedly touch the same shared files, increasing merge friction
  without a corresponding review-clarity benefit. Per-mode _commits_ within PR B achieve the same
  reviewability without that cost.
- C is kept separate from B because it depends on data-plane/identity work this PR's lane
  (Claude/UI) does not own and should not block a self-contained UI migration on.
