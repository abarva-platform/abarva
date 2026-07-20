# 2026-07-20-authoritative-upload-export-propagation — Exports now honor the human-approved version

## Release ID

`2026-07-20-authoritative-upload-export-propagation`

## Status

`candidate`

## Plain-English Summary

Backlog item 94 asked to propagate an authoritative client-approved upload
across Moves, aVa, and exports. Auditing each surface found: (1) the aVa
chat context builder only reads deliverable metadata (title/status/type),
never content, so it has no version-preference bug to fix; (2) next-phase
content generation (`deliverable-content-signals.ts`/`moves-generate-deps
.ts`) already correctly prefers the signed-off version over a later draft;
but (3) the actual "Word"/"HTML"/"Excel" download route the Documents panel
links to (`content-export/route.ts`) had NO such preference — it always
served the LATEST `deliverable_versions` row by `version DESC`, with zero
awareness of `deliverables_v2.signed_off_version`. Concretely: if a client
approved an uploaded replacement (version 3), and the AI later regenerated
a fresh, unreviewed draft (version 4, which also resets `status` back to
`draft` per the approval-lineage migration's own documented behavior), every
download from the Documents panel would silently hand back the unreviewed
draft instead of what the client actually approved — exactly the failure
mode the `signed_off_version` column exists to prevent, present in every
other content-reading path except this one. This release fixes it.

## Layer Impact

- **global-control-lane**: `src/app/api/programs/[id]/deliverables
  /[deliverableId]/content-export/route.ts`, the download endpoint every
  Documents & Evidence panel across every tenant links to for HTML/Word/
  Excel export.

## Client Applicability

- All clients: yes — every deliverable download for every Move, for every
  tenant. Only observable difference: a deliverable with a recorded
  `signed_off_version` that differs from its `current_version` now downloads
  the approved content instead of the newer draft.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — takes effect on the next download after deploy.

## Changes Included

- `content-export/route.ts`:
  - `ExportDeliverableRow` gained `signed_off_version: number | null`, now
    selected alongside the existing columns.
  - The version fetch changed from `azureRead.maybeSingle` with
    `orderBy: { column: "version", direction: "desc" }` to a raw
    `azureRead.query` using
    `ORDER BY (version = $2) DESC, version DESC LIMIT 1` where `$2` is the
    deliverable's `signed_off_version` — the identical pattern already
    proven in `deliverable-content-signals.ts`/`moves-generate-deps.ts`.
    When `signed_off_version` is `null` (nothing approved yet), this is
    exactly equivalent to the old "always latest" behavior — no change for
    the common unapproved case.
- `content-export/__tests__/route.test.ts` — updated all 4 existing tests'
  mocks from `mockAzureRead.maybeSingle` (for `deliverable_versions`) to
  `mockAzureRead.query`, and added `signed_off_version: null` to their
  `deliverables_v2` mock rows (no behavior change asserted, since these
  cases have nothing signed off). Added 1 new regression test: a
  deliverable with `signed_off_version: 3` and a `current_version`-style
  later draft returns the version-3 content in the actual downloaded bytes,
  asserts the query was called with the deliverable's `signed_off_version`
  as a bind parameter, and asserts the persisted vault-artifact metadata
  records `deliverableVersion: 3` (the approved version), not the draft.

## QA / Validation

- `npx jest --testPathPatterns="content-export/__tests__/route.test.ts"` —
  5/5 pass (4 updated + 1 new).
- `npx eslint` on both changed files — 0 errors.
- `git diff --check` — clean.
- Audited (read-only, no code touched) the other two candidate propagation
  points named in the backlog item:
  - aVa chat context (`assembleContext` in `src/lib/programs/nexus.ts`) —
    only selects `id, title, status, deliverable_type_key` from
    `deliverables_v2`, never reads `deliverable_versions` content at all.
    No version-preference bug exists here to fix.
  - Next-phase content generation
    (`src/lib/deliverables/deliverable-content-signals.ts`,
    `src/lib/deliverables/moves-generate-deps.ts`) — already correctly
    prefer `signed_off_version`, already tested in their own suites
    (`deliverable-content-signals.test.ts`, `moves-generate-deps.test.ts`).
    Confirmed via direct code read; no change needed.
- Local `npx tsc --noEmit -p .` historically crashes in this sandbox; CI's
  "Typecheck + reasoning-layer tests" is authoritative.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). Pure code change
— no migration, no flag. Deploy proceeds through the repo-owned
`aca-main-deploy` workflow; takes effect on the next deliverable download
after the new revision receives traffic.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — to be
  confirmed after merge.
- Shared runtime mutators: none used directly.
- Approved image digest: to be recorded once the deploy workflow runs.
- ACA runtime invariant: to be proven after deploy.
- Worker image invariant: N/A — no worker job serves this export route.
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof required: yes — after deploy, for a real deliverable
  with a recorded `signed_off_version` that differs from a later draft
  version, download HTML/Word/Excel from the Documents panel and confirm the
  approved content is what's returned, not the newer draft.

## Rollback Plan

Revert the merge commit. No schema or data touched — reverting restores the
prior "always latest version" download behavior, reopening the exact gap
this release closes.

## Audit Evidence

- PR URL: to be added when opened.
- CI run: to be added when the PR's checks complete.
- Deployment URL / ACA revision: to be added after deploy.

## Known Gaps

- **`approved_artifact_id` itself is still never surfaced for direct
  download** — a user cannot download the ORIGINAL uploaded file (e.g. the
  client's own .docx with its own formatting) from the Documents panel; they
  can only download the regenerated HTML/DOCX/XLSX built from the parsed
  text of that upload (which, after this fix, is at least the CORRECT
  parsed text). Exposing a direct "download original approved upload" link
  via the existing `/api/v1/artifacts/{approved_artifact_id}` route is a
  real, separate, scoped UI follow-up, not attempted here.
- **No exhaustive repo-wide audit of every content-reading call site** —
  this release checked the specific paths named in the backlog item (aVa
  chat, next-phase generation, exports) plus the Documents-panel download
  route discovered during that audit. A different, not-yet-identified read
  path elsewhere in the codebase could in principle have the same "always
  latest" gap; none were found in the paths actually checked.
- **No live-generated real-upload-then-regenerate-then-download proof yet**
  — deferred to the dedicated live E2E backlog items (95/96), consistent
  with this session's established pattern.
