# AbarVa Source Commit Plan

Date: 2026-04-24

This is a planning note only. Do not commit yet.

## Decision

Chosen path:

1. Create a dedicated Source branch from updated `main`.
2. Move only Source docs, Source code, and Source nav changes into it.
3. Leave design-canon and deliverables work out.
4. Commit in 2-3 clean commits.
5. Continue with the next component only after the clean Source branch is reviewed.

## 1. Recommended Commit Grouping

### Group 1: Source Build Pack Documentation Only

Include:

- `docs/abarva-source/ABARVA_SOURCE_BUILD_PACK.md`
- `docs/abarva-source/ABARVA_SOURCE_BUILD_PACK_ADDENDUM.md`
- `docs/abarva-source/build-pack/**`
- `docs/abarva-source/SOURCE_CHECKPOINT.md`
- `docs/abarva-source/build-pack/implementation-reviews/01_DASHBOARD_REFACTOR_REVIEW.md`
- `docs/abarva-source/SOURCE_COMMIT_PLAN.md` if reviewers want this plan committed with the docs slice.

Do not include:

- `docs/abarva-source/build-pack.zip`
- `docs/abarva-source/*.docx` unless intentionally needed
- `docs/design-canon/**`
- `reports/evidence-citations-*.json`
- `tmp_verify_cycle1_live.ts`

### Group 2: Source Foundation Implementation

Include:

- `src/app/(maestro)/source/**`
- `src/components/source/**`
- `src/lib/source/**`

This group should remain the Source foundation only. It should not include additional event canvas, scorecard, artifact drawer, value ledger, vendor flow, or AI generation work.

### Group 3: Source Nav Placement

Include:

- `src/components/AbarvaNav.tsx`
- `src/components/chrome/PrimaryNav.tsx`

This group should contain only the `Source` top-nav placement and active-route detection.

## 2. Files To Exclude From Source Commits

Explicitly exclude:

- `docs/design-canon/**`
- `reports/evidence-citations-*.json`
- `tmp_verify_cycle1_live.ts`
- `src/components/deliverables/DeliverableTierRenderer.tsx`
- `src/components/deliverables/D02StakeholderSuccessSection.tsx`
- `src/components/deliverables/D04TensionSection.tsx`
- `src/app/(maestro)/platform/style-preview/page.tsx`
- `src/components/marketing/AbarVaLogoExploration.tsx`
- `docs/abarva-source/build-pack.zip` unless we explicitly decide to keep zip artifacts
- `docs/abarva-source/*.docx` unless we explicitly decide to commit generated Word files

## 3. Git State Risk

Requested risk context:

- Current branch was expected to be `code/cycle3-w1-fm04-d02-d04-integration`.
- `main` was previously observed as `ahead 1 / behind 16`.
- Source files are untracked.
- There are unrelated untracked files.

Fresh state observed while preparing this plan:

- Current branch now reports as `code/cycle3-w1-f10-rail-states`.
- `git rev-list --left-right --count main...origin/main` currently reports `0 0`, not `ahead 1 / behind 16`.
- Source files remain untracked.
- There are unrelated untracked files and unrelated tracked modifications, including logo/style-preview work.

Recommendation:

- Prefer **A. create a new dedicated branch for Source from updated main, then move Source changes there**.
- Do not commit Source on the current branch unless reviewers confirm this branch is intentionally carrying Source.
- Do not rebase with this mixed working tree until Source changes are safely captured.

Rationale:

- Source work is untracked and mixed with unrelated docs, reports, deliverables files, and logo exploration work.
- The current branch changed from the expected branch name, which increases accidental-commit risk.
- A clean Source branch makes review and rollback much easier.

## 4. Exact Safe Git Commands

Do not execute these yet. These are proposed commands for a careful transfer to a clean Source branch.

First, capture the current state for review:

```bash
git status --short --branch
git rev-list --left-right --count main...origin/main
```

Create a temporary transfer bundle outside the repo:

```bash
mkdir -p /tmp/abarva-source-transfer
```

Copy Source documentation files intentionally, excluding zip/docx artifacts:

```bash
rsync -a --relative \
  docs/abarva-source/ABARVA_SOURCE_BUILD_PACK.md \
  docs/abarva-source/ABARVA_SOURCE_BUILD_PACK_ADDENDUM.md \
  docs/abarva-source/SOURCE_CHECKPOINT.md \
  docs/abarva-source/SOURCE_COMMIT_PLAN.md \
  docs/abarva-source/build-pack/ \
  /tmp/abarva-source-transfer/
```

Copy Source foundation files:

```bash
rsync -a --relative \
  'src/app/(maestro)/source/' \
  src/components/source/ \
  src/lib/source/ \
  /tmp/abarva-source-transfer/
```

Capture tracked Source nav changes as a patch:

```bash
git diff -- \
  src/components/AbarvaNav.tsx \
  src/components/chrome/PrimaryNav.tsx \
  > /tmp/abarva-source-transfer/source-nav.patch
```

Move to updated main and create a dedicated Source branch:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c codex/source-foundation
```

Restore Source docs and implementation into the clean branch:

```bash
rsync -a /tmp/abarva-source-transfer/docs/ docs/
rsync -a /tmp/abarva-source-transfer/src/ src/
git apply /tmp/abarva-source-transfer/source-nav.patch
```

Review exactly what would be staged:

```bash
git status --short
git diff --stat
```

Stage Group 1 only:

```bash
git add \
  docs/abarva-source/ABARVA_SOURCE_BUILD_PACK.md \
  docs/abarva-source/ABARVA_SOURCE_BUILD_PACK_ADDENDUM.md \
  docs/abarva-source/SOURCE_CHECKPOINT.md \
  docs/abarva-source/SOURCE_COMMIT_PLAN.md \
  docs/abarva-source/build-pack/
```

Verify zip/docx artifacts are not staged:

```bash
git diff --cached --name-only
```

Commit Group 1 only after review:

```bash
git commit -m "docs(source): add AbarVa Source build pack"
```

Stage and commit Group 2 only:

```bash
git add \
  'src/app/(maestro)/source/' \
  src/components/source/ \
  src/lib/source/
git diff --cached --name-only
git commit -m "feat(source): add Source route family and foundation components"
```

Stage and commit Group 3 only:

```bash
git add \
  src/components/AbarvaNav.tsx \
  src/components/chrome/PrimaryNav.tsx
git diff --cached --name-only
git commit -m "feat(nav): expose Source in operator navigation"
```

Alternative if switching branches is blocked by local modifications:

```bash
git status --short --branch
git stash push -u -m "non-source work before source branch transfer" -- \
  'src/app/(maestro)/platform/style-preview/page.tsx' \
  src/components/marketing/AbarVaLogoExploration.tsx \
  src/components/deliverables/DeliverableTierRenderer.tsx \
  src/components/deliverables/D02StakeholderSuccessSection.tsx \
  src/components/deliverables/D04TensionSection.tsx \
  docs/design-canon/ \
  reports/ \
  tmp_verify_cycle1_live.ts
```

Only use the stash alternative after confirming which unrelated files should be preserved.

## 5. Validation Plan

Before commit, run:

```bash
npx eslint 'src/app/(maestro)/source' src/components/source src/lib/source src/components/AbarvaNav.tsx src/components/chrome/PrimaryNav.tsx
npx tsc --noEmit --pretty false
npm run build
```

Validation should happen after the clean-branch transfer and before any commit is finalized.

## 6. Commit Messages

Suggested commit messages:

- `docs(source): add AbarVa Source build pack`
- `feat(source): add Source route family and foundation components`
- `feat(nav): expose Source in operator navigation`

## 7. Recommendation

**Move to clean branch first.**

Do not commit now. The Source work is mixed with unrelated tracked and untracked files, and the current branch does not match the expected branch name from the handoff. A clean branch from updated `main` is the safest path.

Do not build next until the Source branch/commit grouping is reviewed.

Final recommendation: **move to clean branch first**.
