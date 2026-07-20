# 2026-07-20-source-banned-term-file-cabinet-note — Surface banned-term backstop hits in the file-cabinet registry record

## Release ID

`2026-07-20-source-banned-term-file-cabinet-note`

## Status

`released`

## Plain-English Summary

Follow-up to [[2026-07-20-source-banned-term-backstop-scan]]. That release wired a
deterministic banned-term scan into generation and recorded any hits in
`body_generation_metadata.bannedTermMatches` on the canonical substrate row
(`source_event_artifact_states`) — but disclosed an explicit known gap: nothing
downstream could see that signal, because the live File Cabinet UI reads a *different*
table (`source_artifacts`, the rendered-file registry) that has no column for it.

Investigating that gap found the File Cabinet's registry-record write already has a
precedent for exactly this: the same code path bakes the AI-draft governance detail into
the registry record's existing free-text `description` field
(`SOURCE_AI_DRAFT_GOVERNANCE_DETAIL`, right where the rendered DOCX/HTML/MD files are
registered). This release follows that same pattern — when the backstop scan found a hit,
a short note listing the flagged term(s) is appended to that same `description` field. No
schema change, no migration, no new column.

This closes the "the signal reaches the registry record" half of the original gap. It does
not close the "the live UI renders it" half — `SourceAnalyticsCanvas.tsx`'s file-ledger
view-model (`source-event-shell-v2.ts`'s `toFileItem()`) does not read `description` at
all today, so this note is not yet visible in the product UI. That remains open and is
disclosed below, not implied fixed.

## Layer Impact

- `global-control-lane`: Source artifact generation
  (`generate/route.ts`) for all tenants. Purely additive to an existing free-text field
  already written at this exact point in the flow; no new write path, no schema change.

## Client Applicability

- All clients: yes.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts` — append a
  banned-term note to the file-cabinet registry record's `description` field when
  `bannedTermMatches` is non-empty, following the same pattern already used for the
  AI-draft governance detail at this exact write point.
- This release record.

## QA / Validation

- `pass` — Broader Source regression check:
  `npx jest --testPathPatterns="src/lib/source|src/app/api/v1/source"` — 2199/2231 passed,
  10 suites / 32 tests failing — identical pre-existing failure set confirmed in
  [[2026-07-20-source-quality-gate-artifact-aware]]'s `git stash` comparison; no new
  failures from this change.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  — clean, no errors.
- `pass` — `npm run release:check` — passed (re-verified post-rebase alongside a clean
  typecheck and identical pre-existing test-failure baseline).
- `not run` — Live signed-in proof that the note actually appears in a real registry
  record's `description` column after a generation that trips the scan. No demo tenant's
  in-flight events reached a stage with a registered banned-term hit during this
  investigation; recorded as an honest gap rather than fabricated.

## Rollout Plan

Merge to main via the repo-owned ACA main-deploy workflow. Takes effect on every Source
generation immediately after deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
  (run [29718046488](https://github.com/abarva-platform/abarva/actions/runs/29718046488)).
- Shared runtime mutators: none beyond the standard main-deploy workflow.
- Approved image digest: `sha256:b67974379db9707df146ce0776c22f6ee5b195711184c987a1f99b8396002de3`.
- ACA runtime invariant: verified 2026-07-20T05:06:30Z — template image, active image, and
  the 100%-traffic revision (`ca-abarva-web-lab-eastus--mfd4a3778`) all match the approved
  digest above; health check `ok: true`.
- Worker image invariant: covered by the same main-deploy workflow step (passed).
- Feature/env flag update path: none.
- Live signed-in proof required: not reachable this pass; see Known Gaps.

## Rollback Plan

Revert the merge commit. Purely additive text change to an existing field; no cleanup
required.

## Audit Evidence

- PR URL: recorded post-open.
- Broader Source test log: 2199/2231 passed, identical pre-existing failure baseline.
- Typecheck log: clean.

## Known Gaps

- **The live File Cabinet UI still does not render this signal.**
  `source-event-shell-v2.ts`'s `SourceShellArtifactLike` type and `toFileItem()` function
  do not read the registry's `description` field at all. Making this genuinely visible in
  the product requires: (1) adding `description` to `SourceShellArtifactLike`, (2)
  surfacing it (or a parsed banned-term flag) on `SourceShellFileItem`, (3) rendering it in
  `SourceAnalyticsCanvas.tsx` (e.g. a warning chip on the affected row). That is a real,
  bounded, three-file UI change — deliberately not attempted in this pass, to avoid a
  rushed frontend change without the same test/verification rigor applied to the rest of
  this session's work.
- No live-signed-in proof that the note is actually written correctly end-to-end (see QA /
  Validation) — the logic is typechecked and consistent with the existing, working
  AI-draft-detail pattern at the same call site, but has not been observed firing on a real
  generation.
- This is the second of two places `bannedTermMatches` now lives (the canonical metadata
  field from [[2026-07-20-source-banned-term-backstop-scan]], and now this registry-record
  description note) — they are not kept in sync by any shared mechanism, just written from
  the same in-memory value in the same request. If a future change moves banned-term
  detection to a different code path, both write sites need updating together; there is no
  single source of truth enforced in code.
