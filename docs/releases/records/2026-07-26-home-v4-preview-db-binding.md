# 2026-07-26-home-v4-preview-db-binding — bind /home/v4-preview's explorer to the real persisted candidate

## Release ID

`2026-07-26-home-v4-preview-db-binding`

## Status

`candidate` — verified locally, not yet merged.

## Plain-English Summary

`/home/v4-preview`'s review-queue list already read live from Postgres, but the explorer below it
(chapter navigation, dimension pages, charts, relationship graph) always rendered a build-time-
bundled fixture file — regardless of what candidate a reviewer had just regenerated. A reviewer
could see the correct candidate ID and "Pass" status in the queue, then scroll down to content that
was actually a stale, previously-committed fixture. That gap is why an earlier real regeneration
this session initially looked unchanged: the DB got a fresh candidate, but the page kept rendering
the old fixture underneath it.

Fix: the page now fetches the tenant's latest real persisted candidate (`render_pack`) from Postgres
and renders that when it exists and is shaped correctly, falling back to the static fixture only
when no real candidate exists for that tenant yet. A visible banner above the explorer states,
in plain text, which source is showing: `DB-BACKED` with the real candidate ID, pack version,
generation timestamp, validation status, and finding count — or `FIXTURE-BACKED (not approvable)`
when there's no real candidate to show. This directly prevents a reviewer from approving content
that was never actually re-read from the database.

## Layer Impact

- `internal-admin` lane: `/home/v4-preview` only, platform-admin-gated. No tenant currently has an
  approved V4 pack, so no client-facing surface is affected.

## Client Applicability

- Internal only. No client-visible surface changes.

## Changes Included

- `src/lib/home/home-knowledge-v4-review.ts`: new `getHomeKnowledgeV4LatestCandidateRenderPack(tenantKey)`
  — reads the latest `home_knowledge_packs` row for a tenant, including `render_pack`; never throws,
  returns `null` on any failure or absence.
- `src/app/(maestro)/home/v4-preview/page.tsx`: fetches the real candidate alongside the existing
  review-queue reads; prefers it over the fixture whenever it exists and is shaped like a real
  `HomeV4Candidate` (`tenant` + `dimensions` present); renders a source banner showing tenant key,
  candidate ID, pack version, generation timestamp, validation status, and finding count, or an
  honest fixture-fallback message.
- `src/lib/home/__tests__/home-knowledge-v4-review.test.ts`: 3 new tests (in the same in-memory
  transactional mock pattern as the existing 18) — returns the latest candidate's real render_pack,
  returns `null` for a tenant with no row (not another tenant's data), and surfaces real
  validation_status/finding counts.

## QA / Validation

- `pass` — `npx eslint`, zero findings.
- `pass` — `src/lib/home/__tests__/home-knowledge-v4-review.test.ts`: 21/21 passing (18 existing + 3
  new).
- `pass` — full V4 component test suite: 13/13 passing.
- `pass` — full-project `tsc --noEmit` (expanded heap), zero errors.
- `pass` — full production `npm run build`, zero errors (this exact route previously hit a real
  styled-jsx-in-Server-Component build failure; re-verified clean).
- Live signed-in browser verification pending as part of this rollout, alongside the freshly
  regenerated `skyharbor-air` book-mode candidate this banner is meant to surface.

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds and deploys the new image.
2. Live signed-in verification: confirm the banner shows `DB-BACKED` with the real, freshly
   regenerated `skyharbor-air` candidate's ID/timestamp/validation before any approval decision.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none.
- Live signed-in proof required: yes, as part of this rollout.

## Rollback Plan

Revert the PR. No schema change; the explorer falls back to exactly its prior fixture-only
behavior.

## Audit Evidence

- This PR's diff and CI run.
- New test suite output (21/21 passing).

## Known Gaps

- None disclosed beyond the standing gap already tracked: no tenant has an approved V4 pack, so this
  route remains review-only, never a live client-facing surface.
