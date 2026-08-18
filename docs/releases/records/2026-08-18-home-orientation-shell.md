# 2026-08-18-home-orientation-shell — Home renders the orientation pack

## Release ID

`2026-08-18-home-orientation-shell`

## Status

`candidate`

## Plain-English Summary

Home now renders the stored orientation pack instead of hand-authored content, and its tabs are
named after the reader's question rather than after our deliverable sections.

The old tab set was Summary, Patterns, Context, Economics, Posture, Coherence, Trajectory,
Watchlist. Nobody arrives at Home asking to see coherence. The new set is Who we are · Strategy ·
How we're measured · What we run · What people say · Where we stand · Explore the data, plus the
authored Architecture, Architecture Evidence and Evidence tabs, which are retained.

Six of the tabs render orientation blocks from the pack. "Explore the data" carries a left rail of
all 26 canonical dimensions grouped by the registry's own sections, each showing distribution,
concentration, quantities, largest instances and which attributes are mostly empty.

Three properties hold throughout:

- **Facts render without narrative.** Every block shows its figures whether or not the generated
  sentence passed validation. A withheld sentence is labelled as withheld and styled as a working
  state, not an error.
- **Absence is displayed.** A tenant with no pack sees "not yet generated" explaining that this
  reports the state of the build, not the state of their estate. A blank panel would assert the
  second.
- **Provenance is on the page.** Build version, validation status, model, and — deliberately
  prominent — whether a human has reviewed the content. `candidate` means generated and validated
  but not yet reviewed, and a reader is entitled to know that before quoting a figure onward.

### Cross-tenant safety

Home previously forked by tenant: one client got the landscape shell, everyone else got a separate
authored page. The orientation shell now serves every tenant, but the **authored** architecture and
evidence tabs are withheld from tenants they were not written for — those tabs are filtered out of
the tab list and their panels do not render at all, so a shared `?view=architecture` link cannot
show one client's architecture to another.

## Layer Impact

Lane: `global-control-lane`. Layer 4 (product surface) only. Reads
`public.home_knowledge_packs` through the orientation read adapter. No canonical object, no schema
change, no migration, no write path.

## Client Applicability

- All clients: yes. Every tenant with a pack gets the orientation shell; every tenant without one
  gets an explicit not-yet-generated state.
- Authored architecture/evidence tabs: restricted to the tenant they were written for.
- Feature flag: none.

## Changes Included

- `src/components/home/orientation/HomeOrientationPanels.tsx` + `.module.css` — new.
- `src/components/home/enterprise-landscape-v2/homeEnterpriseLandscapeV2Model.ts` — new tab union
  and tab list.
- `src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx` — orientation panels,
  authored-tab gating, legacy URL aliases; 628 lines of orphaned code removed (1,740 → 1,112).
- `src/components/home/enterprise-landscape-v2/claudeArchitectureDiagramPack.ts` — five diagrams
  rebound to surviving tabs.
- `src/app/(maestro)/home/page.tsx` — loads the pack, passes it to both tenant branches.
- `__tests__/HomeEnterpriseLandscapeV2.test.tsx` — rewritten.

## QA / Validation

**PASS**, with one item **NOT RUN** and named below.

- `npx tsc --noEmit -p tsconfig.json` — PASS, 0 errors repo-wide.
- `npx eslint` on all changed files — PASS, 0 errors, 0 warnings.
- `npm run test:nav` — PASS, 26/26. `npm run test:behaviors` — PASS, 195/195.
- Home shell tests — PASS, 6/6, covering tab naming, authored-tab withholding for a foreign tenant,
  authored-tab presence for the owning tenant, facts rendering without narrative, the
  not-yet-generated state, and the unreviewed-content badge.

Two defects were found and fixed during the change: two `useCallback` dependency arrays captured a
stale tab list, so keyboard navigation would have moved focus to a tab no longer rendered once
authored tabs were withheld; and five architecture SVGs were bound to tab ids that the rename
retired, which would have left real generated assets unrendered.

The replaced tests asserted `$2.35B` and `$2.18B` — a technology budget and prior-year actual that
were string literals with no data path behind either. They passed only for as long as nobody edited
the literals.

**NOT RUN:** `npx next build` fails in this worktree because `node_modules` is a symlink pointing
outside the filesystem root — a worktree artifact, not a code fault. CI runs the authoritative
build. No live signed-in browser proof was captured: this environment has no Clerk keys and no
route to the VNet-private database, so `/home` cannot be rendered here.

## Rollout Plan

Merge to `main`, then the repo-owned ACA main deploy workflow. Home changes on deploy: tabs are
renamed and orientation tabs render. Because no orientation pack has been built into any
environment yet, every orientation tab will show the explicit not-yet-generated state until the
generator runs. That is the intended sequence — the shell is safe to ship ahead of the content.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: set by the main deploy workflow at build time.
- ACA runtime invariant: must be proven after deploy — template image, 100% traffic revision image
  and worker job images matching the approved digest.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **yes**, before this may be called live-proven. `/home` for both
  tenants, confirming orientation tabs render, and confirming the non-owning tenant sees no
  Architecture tab.

## Rollback Plan

Revert the commit. No migration, no stored data change. Legacy tab aliases mean URLs keep resolving
in both directions.

## Audit Evidence

- PR: see Changes Included.
- Test output above; provenance bar renders build version, validation status and review state on
  every orientation tab.

## Known Gaps

- **No orientation pack exists in any environment.** The generator has never run with an API key,
  so every orientation tab will render the not-yet-generated state until it does. The shell is
  correct and the content is absent; both are visible.
- No live signed-in proof captured — cannot be claimed live-proven yet.
- The authored fallback page for tenants without a pack remains hand-written and tenant-labelled.
  It is now a fallback rather than the destination, but it has not been retired.
- Architecture and Evidence remain authored for a single tenant. Making them derived is a separate
  piece of work.
- aVa is not yet docked into Home. The recommended shape was browse-first with chat present; only
  the browse half is built here.
