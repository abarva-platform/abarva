# AbarVa Source Commit Plan

Date: 2026-04-24

Status: planning only. Do not commit yet.

## Current Snapshot

Observed before updating this plan:

```bash
git status --short --branch
```

```text
## main...origin/main
```

```bash
git diff --stat
```

```text

```

```bash
git diff --name-only
```

```text

```

After switching to the existing dedicated branch:

```bash
git switch codex/source-foundation
git status --short --branch
```

```text
## codex/source-foundation
```

Important note: the current `codex/source-foundation` worktree is clean. The newer Source hardening, context-awareness docs, type contracts, and deterministic context builder work are currently preserved in Source-named stashes, with `stash@{0}` showing the expected latest files:

- `CYCLE_STATE.md`
- `docs/abarva-source/build-pack/16_AGENT_PER_TURN_CONTRACT.md`
- `docs/abarva-source/build-pack/17_CRAWLER_PERSONA_VERIFICATION.md`
- `docs/abarva-source/build-pack/18_FAILURE_MODE_CATALOG.md`
- `docs/abarva-source/build-pack/19_CROSS_PRODUCT_ARCHITECTURE.md`
- `docs/abarva-source/build-pack/20_COMMERCIAL_MODEL.md`
- `docs/abarva-source/build-pack/21_PATTERN_PACK_CONTENT_DEPTH_STANDARD.md`
- `docs/abarva-source/build-pack/22_AGENT_CONTEXT_AWARENESS.md`
- `docs/abarva-source/build-pack/23_CHAT_EXPERIENCE_AND_INPUT_MODEL.md`
- `docs/abarva-source/build-pack/24_CONTEXT_VALIDATION_HARNESS.md`
- `docs/abarva-source/build-pack/implementation-reviews/02_AGENT_CONTEXT_AWARENESS_REVIEW.md`
- `docs/abarva-source/build-pack/implementation-reviews/03_SOURCE_AGENT_TYPES_REVIEW.md`
- `docs/abarva-source/build-pack/implementation-reviews/04_SOURCE_CONTEXT_BUILDER_REVIEW.md`
- `src/lib/source/agent-context.ts`
- `src/lib/source/chat-types.ts`
- `src/lib/source/context-quality.ts`
- `src/lib/source/attachments.ts`
- `src/lib/source/agent-validation.ts`
- `src/lib/source/context-builder.ts`
- `src/lib/source/index.ts`

Do not drop any Source stash until the restored files are committed and reviewed.

## Recommendation

Use the existing dedicated branch `codex/source-foundation`, restore the latest Source WIP from `stash@{0}`, then commit with strict pathspec staging.

This is safer than committing from `main` because the current `main` checkout has no Source WIP restored. It is also safer than creating another branch unless `stash@{0}` applies with conflicts or unexpected unrelated files.

If `stash@{0}` applies cleanly and `git status --short --branch` shows only Source docs/source library changes, it is safe to commit directly on `codex/source-foundation`.

If unrelated files appear after applying the stash, do not stage them. If the branch becomes confusing or conflict-heavy, use the clean-branch fallback below.

## Commit 1: Source Build Pack and Operating Docs

Include:

- `docs/abarva-source/ABARVA_SOURCE_BUILD_PACK.md`
- `docs/abarva-source/ABARVA_SOURCE_BUILD_PACK_ADDENDUM.md`
- `docs/abarva-source/SOURCE_CHECKPOINT.md`
- `docs/abarva-source/SOURCE_COMMIT_PLAN.md`
- `docs/abarva-source/build-pack/**`
- `CYCLE_STATE.md`

This commit should include the Build Pack core docs, wireframes, component specs, implementation review packets, hardening docs, context-awareness docs, and the live operating state file.

Exclude:

- `docs/abarva-source/*.docx`
- `docs/abarva-source/*.zip`
- `docs/design-canon/**`
- `reports/**`
- tmp files

Suggested commit message:

```bash
git commit -m "docs(source): harden AbarVa Source build pack"
```

## Commit 2: Source Foundation UI/Domain Scaffold

Include:

- `src/app/(maestro)/source/**`
- `src/components/source/**`
- `src/lib/source/constants.ts`
- `src/lib/source/types.ts`
- `src/lib/source/lifecycle.ts`
- `src/lib/source/mock-seed.ts`
- `src/lib/source/queries.ts`
- `src/lib/source/scorecard.ts`
- `src/lib/source/value-ledger.ts`
- `src/lib/source/index.ts`

This commit is for the existing Source route family, deterministic foundation components, canonical constants, domain types, seed data, lifecycle helpers, scorecard helpers, value-ledger helpers, and existing Source barrel exports.

Boundary:

- Do not include additional event canvas implementation.
- Do not include additional scorecard UI implementation.
- Do not include artifact drawer extension.
- Do not include value ledger UI extension.
- Do not include vendor response flow.
- Do not include AI/RFP generation.

Index export handling:

- If `src/lib/source/index.ts` only contains foundation exports, include it in Commit 2.
- If the current diff in `src/lib/source/index.ts` is only for agent context/type/context-builder exports, include it in Commit 3 instead.
- Avoid partial staging unless absolutely necessary; prefer putting the whole `index.ts` diff in the commit that matches the actual change.

Suggested commit message:

```bash
git commit -m "feat(source): add Source route family and foundation components"
```

## Commit 3: Source Agent Context Contracts and Deterministic Context Builder

Include:

- `src/lib/source/agent-context.ts`
- `src/lib/source/chat-types.ts`
- `src/lib/source/context-quality.ts`
- `src/lib/source/attachments.ts`
- `src/lib/source/agent-validation.ts`
- `src/lib/source/context-builder.ts`
- `src/lib/source/index.ts` if not already included or if changed after Commit 2

This commit should remain TypeScript contract and deterministic context-builder work only.

Boundary:

- No UI.
- No chat UI.
- No API routes.
- No model calls.
- No upload implementation.
- No parsing implementation.
- No coupling to `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts`.

Suggested commit message:

```bash
git commit -m "feat(source): add context-aware agent contracts"
```

## Commit 4: Source Nav Placement

Include:

- `src/components/AbarvaNav.tsx`
- `src/components/chrome/PrimaryNav.tsx`

This commit should contain only Source as a first-class operator top-nav item:

```text
Home, Programs, Source, Intelligence, Control Tower, Platform
```

Label must be `Source`, not `AbarVa Source`.

Do not expose Source in client nav unless separately approved.

Suggested commit message:

```bash
git commit -m "feat(nav): expose Source in operator navigation"
```

## Explicit Exclusions

Do not include:

- `src/components/deliverables/SeedRouteShell.tsx`
- `src/components/intelligence/SentinelPatternRail.tsx`
- `src/components/deliverables/**`
- `src/app/(maestro)/platform/style-preview/page.tsx`
- `src/components/marketing/AbarVaLogoExploration.tsx`
- `docs/design-canon/**`
- `reports/**`
- `tmp_verify_cycle1_live.ts`
- `docs/abarva-source/*.docx`
- `docs/abarva-source/*.zip`

Also do not include unrelated generated files, temporary verification scripts, local reports, or logo exploration files in the Source commits.

## Restore and Review Commands

Do not run these until commit approval is given.

Confirm current branch and clean state:

```bash
git status --short --branch
git branch --show-current
```

Inspect the latest Source stash before applying:

```bash
git stash list --date=local | sed -n '1,10p'
git stash show -u --name-only stash@{0} | sort
```

Restore latest Source work without dropping the stash:

```bash
git stash apply stash@{0}
```

Immediately review:

```bash
git status --short --branch
git diff --stat
git diff --name-only
git ls-files --others --exclude-standard | sort
```

If `git stash apply stash@{0}` does not contain the context-builder review packet or applies the wrong set of files, stop and inspect `stash@{1}` and `stash@{2}` before proceeding:

```bash
git stash show -u --name-only stash@{1} | sort
git stash show -u --name-only stash@{2} | sort
```

## Clean-Branch Fallback

Use this only if `codex/source-foundation` is not clean, the stash applies with conflicts, or unrelated files appear in a way that makes review unsafe.

```bash
git switch main
git pull --ff-only origin main
git switch -c codex/source-foundation-clean
git stash apply stash@{0}
git status --short --branch
git diff --stat
git diff --name-only
```

If a clean transfer bundle is preferred instead of stash application:

```bash
mkdir -p /tmp/abarva-source-transfer

rsync -a --relative \
  docs/abarva-source/ABARVA_SOURCE_BUILD_PACK.md \
  docs/abarva-source/ABARVA_SOURCE_BUILD_PACK_ADDENDUM.md \
  docs/abarva-source/SOURCE_CHECKPOINT.md \
  docs/abarva-source/SOURCE_COMMIT_PLAN.md \
  docs/abarva-source/build-pack/ \
  CYCLE_STATE.md \
  /tmp/abarva-source-transfer/

rsync -a --relative \
  'src/app/(maestro)/source/' \
  src/components/source/ \
  src/lib/source/ \
  /tmp/abarva-source-transfer/

git diff -- \
  src/components/AbarvaNav.tsx \
  src/components/chrome/PrimaryNav.tsx \
  > /tmp/abarva-source-transfer/source-nav.patch

git switch main
git pull --ff-only origin main
git switch -c codex/source-foundation-clean
rsync -a /tmp/abarva-source-transfer/docs/ docs/
rsync -a /tmp/abarva-source-transfer/src/ src/
rsync -a /tmp/abarva-source-transfer/CYCLE_STATE.md ./CYCLE_STATE.md
git apply /tmp/abarva-source-transfer/source-nav.patch
```

## Staging Plan

Before every commit, run:

```bash
git diff --cached --name-only
```

Stage Commit 1 only:

```bash
git add \
  docs/abarva-source/ABARVA_SOURCE_BUILD_PACK.md \
  docs/abarva-source/ABARVA_SOURCE_BUILD_PACK_ADDENDUM.md \
  docs/abarva-source/SOURCE_CHECKPOINT.md \
  docs/abarva-source/SOURCE_COMMIT_PLAN.md \
  docs/abarva-source/build-pack/ \
  CYCLE_STATE.md

git diff --cached --name-only
```

Stage Commit 2 only:

```bash
git add \
  'src/app/(maestro)/source/' \
  src/components/source/ \
  src/lib/source/constants.ts \
  src/lib/source/types.ts \
  src/lib/source/lifecycle.ts \
  src/lib/source/mock-seed.ts \
  src/lib/source/queries.ts \
  src/lib/source/scorecard.ts \
  src/lib/source/value-ledger.ts

# Add index.ts here only if its diff is foundation-only.
git diff -- src/lib/source/index.ts
git diff --cached --name-only
```

Stage Commit 3 only:

```bash
git add \
  src/lib/source/agent-context.ts \
  src/lib/source/chat-types.ts \
  src/lib/source/context-quality.ts \
  src/lib/source/attachments.ts \
  src/lib/source/agent-validation.ts \
  src/lib/source/context-builder.ts

# Add index.ts here if its diff exports the agent context/type/context-builder layer.
git add src/lib/source/index.ts
git diff --cached --name-only
```

Stage Commit 4 only:

```bash
git add \
  src/components/AbarvaNav.tsx \
  src/components/chrome/PrimaryNav.tsx

git diff --cached --name-only
```

## Validation Plan Before Commit

Run after Source WIP is restored and before committing:

```bash
npx eslint 'src/app/(maestro)/source' src/components/source src/lib/source src/components/AbarvaNav.tsx src/components/chrome/PrimaryNav.tsx
npx tsc --noEmit --pretty false
npm run build
```

Expected validation handling:

- If eslint fails in Source/nav files, fix only the relevant Source/nav issue before commit.
- If TypeScript fails from unrelated files, record the failure and do not broaden the Source slice without approval.
- If build fails from unrelated app areas, record the failure and keep Source staging isolated.

## Final Safety Checklist

Before the first commit:

- `git status --short --branch` shows the intended branch.
- `git diff --stat` shows only Source docs/source code/nav changes plus approved operating docs.
- `git diff --name-only` contains no explicitly excluded paths.
- `git diff --cached --name-only` is reviewed before each commit.
- No `docs/abarva-source/*.docx` or `docs/abarva-source/*.zip` files are staged.
- No `docs/design-canon/**`, `reports/**`, tmp files, deliverables files, or logo/style-preview files are staged.
- No `/programs`, `/preview`, `/demo`, `ProgramSurface`, or `src/lib/programs/mock.ts` files are staged.

## Stop Point

Stop here and wait for approval before applying stashes, validating, staging, or committing.

