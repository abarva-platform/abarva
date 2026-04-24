# AbarVa Source PR Readiness

Date: 2026-04-24

Status: ready for PR hygiene review. Do not build additional Source UI before the branch is updated/reviewed.

## 1. Branch Status

- Current branch: `codex/source-foundation`
- Current worktree status: clean
- Current Source commits:
  - `c5ed73a docs(source): add AbarVa Source build pack`
  - `9978d83 feat(source): add context-aware agent contracts`
- Current main divergence:
  - `git rev-list --left-right --count main...HEAD` returned `5 5`
  - The branch has 5 commits not on local `main`, and local `main` has 5 commits not on this branch.
- Rebase/update needed before PR: yes.

The branch should be updated before PR because the raw history includes non-Source or duplicate-equivalent divergence in addition to the two latest Source commits:

```text
> 9978d83 feat(source): add context-aware agent contracts
> c5ed73a docs(source): add AbarVa Source build pack
< 25b49b9 feat(intelligence): SentinelPatternRail on tenant pattern pages · F04 Z4-A
> 49710c7 feat(intelligence): SentinelPatternRail on tenant pattern pages · F04 Z4-A
< e6a0215 feat(tower): Atlas proactive pressure-card surfacing · FM-10 (#187)
< a5a62eb feat(tower): Vendor Portfolio surface at exemplar fidelity · F04 Z1-B (#186)
< 5a486e3 feat(tower): wire PressureCardDerivation drawer into Tower pressure rows · F04 Z1-A (#185)
< c8ee870 docs(cycle3): solo re-anchor + Cycle 2 code-level verification matrix
> eac6aeb docs(cycle3): solo re-anchor + Cycle 2 code-level verification matrix
> 52fc515 docs(source): add AbarVa Source build pack
```

## 2. Commit Summary

### `c5ed73a docs(source): add AbarVa Source build pack`

Adds the Source Build Pack hardening and operating documentation:

- Agent per-turn contract
- Crawler persona verification
- Failure mode catalog
- Cross-product architecture
- Commercial model
- Pattern-pack content depth standard
- Agent context-awareness docs
- Chat/input model docs
- Context validation harness docs
- Review packets for context awareness, Source agent types, and context builder
- `CYCLE_STATE.md`
- Updated `SOURCE_COMMIT_PLAN.md`

### `9978d83 feat(source): add context-aware agent contracts`

Adds the TypeScript contract layer and deterministic context builder:

- `src/lib/source/agent-context.ts`
- `src/lib/source/chat-types.ts`
- `src/lib/source/context-quality.ts`
- `src/lib/source/attachments.ts`
- `src/lib/source/agent-validation.ts`
- `src/lib/source/context-builder.ts`
- `src/lib/source/index.ts` exports

### Skipped Source Foundation/Nav Commits

The planned Source foundation UI/domain scaffold commit was skipped because there were no remaining diffs for:

- `src/app/(maestro)/source/**`
- `src/components/source/**`
- existing Source constants/types/lifecycle/queries/scorecard/value-ledger files

The planned Source nav placement commit was skipped because there were no remaining diffs for:

- `src/components/AbarvaNav.tsx`
- `src/components/chrome/PrimaryNav.tsx`

Source foundation route/components/nav are already present in the branch/base. Confirmed nav placement exists:

- `src/components/AbarvaNav.tsx` includes `sourceActive` and `navLink('Source', '/source', sourceActive)`
- `src/components/chrome/PrimaryNav.tsx` includes `{ label: 'Source', href: '/source', match: (p) => p === '/source' || p.startsWith('/source/') }`

## 3. Validation Summary

Validation run before commit:

```bash
npx eslint 'src/app/(maestro)/source' src/components/source src/lib/source src/components/AbarvaNav.tsx src/components/chrome/PrimaryNav.tsx
npx tsc --noEmit --pretty false
npm run build
```

Results:

- ESLint: passed with warnings only
- TypeScript: passed
- Production build: passed

Existing `src/components/AbarvaNav.tsx` unused-variable warnings:

```text
22:7   DROP_DESC is assigned a value but never used
24:7   DROP_HOVER is assigned a value but never used
38:10  open is assigned a value but never used
48:52  canSwitch is assigned a value but never used
50:9   openDrop is assigned a value but never used
51:9   startClose is assigned a value but never used
52:9   cancelClose is assigned a value but never used
100:9  maestroActive is assigned a value but never used
103:9  dropPanel is assigned a value but never used
```

These warnings were not introduced or fixed in the Source commit sequence.

## 4. Files Intentionally Included

Included categories:

- Source Build Pack docs
- Source Build Pack hardening docs
- Source implementation review packets
- Context-awareness docs
- Context/type contracts
- Deterministic context builder
- `CYCLE_STATE.md` updates
- `SOURCE_COMMIT_PLAN.md` updates

Key included paths:

- `docs/abarva-source/build-pack/**`
- `docs/abarva-source/SOURCE_COMMIT_PLAN.md`
- `CYCLE_STATE.md`
- `src/lib/source/agent-context.ts`
- `src/lib/source/chat-types.ts`
- `src/lib/source/context-quality.ts`
- `src/lib/source/attachments.ts`
- `src/lib/source/agent-validation.ts`
- `src/lib/source/context-builder.ts`
- `src/lib/source/index.ts`

## 5. Files Intentionally Excluded

Excluded from the Source commits:

- `docs/design-canon/**`
- `reports/**`
- tmp files
- docx/zip artifacts
- deliverables files
- `src/components/intelligence/SentinelPatternRail.tsx`
- logo/style-preview files
- `/programs`
- `/preview`
- `/demo`
- `ProgramSurface`
- `src/lib/programs/mock.ts`

Specific excluded examples:

- `tmp_verify_cycle1_live.ts`
- `docs/abarva-source/*.docx`
- `docs/abarva-source/*.zip`
- `src/components/deliverables/**`
- `src/components/deliverables/SeedRouteShell.tsx`
- `src/app/(maestro)/platform/style-preview/page.tsx`
- `src/components/marketing/AbarVaLogoExploration.tsx`
- `src/components/programs/ProgramSurface.tsx`

## 6. Source Stashes

Existing Source WIP stashes:

```text
stash@{Fri Apr 24 14:30:30 2026}: On codex/source-foundation: more-source-wip-stash-again
stash@{Fri Apr 24 14:08:50 2026}: On codex/source-foundation: more-codex-source-wip
stash@{Fri Apr 24 14:03:50 2026}: On codex/source-foundation: codex-source-wip-solo-takeover-2026-04-24
```

Recommendation:

- Keep these stashes until the PR branch is created, pushed, reviewed, and merged.
- After the PR is merged and the final branch is verified clean, inspect each stash before dropping it:

```bash
git stash show -u --name-only stash@{0} | sort
git stash show -u --name-only stash@{1} | sort
git stash show -u --name-only stash@{2} | sort
```

- Drop only after confirming the committed branch contains everything needed:

```bash
git stash drop stash@{0}
git stash drop stash@{1}
git stash drop stash@{2}
```

Do not drop any Source stash yet.

## 7. Rebase/Update Recommendation

Do not do a blind rebase of the current `codex/source-foundation` branch. The branch has raw divergence that includes non-Source or duplicate-equivalent commits. The safest PR path is to create a fresh branch from updated `main` and cherry-pick only the two approved Source commits.

Recommended safe command sequence:

```bash
git status --short --branch
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c codex/source-foundation-pr
git cherry-pick c5ed73a
git cherry-pick 9978d83
git status --short --branch
```

Then rerun validation:

```bash
npx eslint 'src/app/(maestro)/source' src/components/source src/lib/source src/components/AbarvaNav.tsx src/components/chrome/PrimaryNav.tsx
npx tsc --noEmit --pretty false
npm run build
```

If the branch name must remain `codex/source-foundation`, first preserve the current branch name, then create a clean replacement from updated `main`:

```bash
git status --short --branch
git branch codex/source-foundation-pre-pr-safety
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c codex/source-foundation-pr
git cherry-pick c5ed73a
git cherry-pick 9978d83
```

Use the clean `codex/source-foundation-pr` branch for PR unless a maintainer explicitly wants the original branch name reused.

## 8. PR Recommendation

The Source work is ready for PR after update/rebase hygiene, preferably through the clean cherry-pick branch described above.

PR should include:

- Source Build Pack and operating docs
- Source context-awareness hardening docs
- Source agent type contracts
- deterministic Source context builder

PR should not include:

- new UI work
- chat UI
- API routes
- model calls
- upload/parsing implementation
- event canvas expansion
- scorecard UI expansion
- artifact drawer expansion
- value ledger UI expansion
- vendor flow
- AI/RFP generation
- `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts`

