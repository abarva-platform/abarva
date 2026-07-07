# 2026-06-13-charter-digest-table-leak — Stop raw backing-table id leaking in the readiness digest text

## Release ID

`2026-06-13-charter-digest-table-leak`

## Status

`candidate`

## Plain-English Summary

Follow-up to `2026-06-13-charter-source-label-leak`. Live end-to-end testing on production surfaced one more leak the first fix missed: the current-state **readiness digest** was built as `"<family>: N records committed to <raw table>"` — embedding the raw store name (e.g. `tower_cmdb_cis`) directly in the human-facing claim TEXT. The first fix humanized the *citation* field and scrubbed the Claude-generated markdown, so the narrative charter read clean — but the deterministic deliverable card renders the claim text directly (unscrubbed), so the line "IT systems & application landscape: 4 records committed to tower_cmdb_cis" still showed on screen.

This change removes the raw table id from the digest at its source (the digest now reads "… N records committed." and the source is carried separately as the humanized citation), and adds a defense-in-depth scrub of claim text in the deliverable card so no embedded internal id can render even if some other digest introduces one.

## Layer Impact

- `global-control-lane`: shared current-state readiness + deliverable rendering for all tenants. `current-state-readiness.ts` digest text no longer contains the backing-table id; `DeliverableArtifactCard.tsx` scrubs claim text. No schema/data/auth change.

## Client Applicability

- All clients: Yes — any tenant whose Move charter/deliverable cites a structured (table-backed) evidence family.
- Feature flag: None — correctness fix.

## Changes Included

- `src/lib/programs/current-state-readiness.ts` — committed structured-family digest drops the raw `family.backing.table` reference; clean prose only.
- `src/components/strategic-moves/DeliverableArtifactCard.tsx` — `scrubInternalSourceTags(c.text)` on both claim-text render paths (defense-in-depth).
- `src/lib/programs/deliverables/__tests__/deliverable-quality.test.ts` — regression case for the exact leaked phrase.

## QA / Validation

- Unit: `npx jest deliverable-quality deliverable-narrative-bundle archetype-context-bundle` → 3 suites, 27 tests passed (incl. new regression).
- Lint clean on changed files.
- Live: regenerated the SkyHarbor Care charter on production `app.abarva.ai` after deploy and confirmed no `tower_*` anywhere in the rendered Move page or the deliverable card (state-level).

## Rollout Plan

Merge to main (squash) → Vercel production deploy of project `nexus` (`vercel deploy --prod`) → alias `app.abarva.ai` → re-verify the charter card in the live UI.

## Rollback Plan

Pure rendering/text change, no migration. Revert the squash commit and redeploy the prior production build.

## Audit Evidence

- PR URL (added on open) + CI run.
- Live production screenshot of the clean charter card after deploy.

## Known Gaps

- The `2026-06-13-charter-source-label-leak` release (humanized citation + output scrub) remains the primary fix; this closes the one embedded-text path it missed.
- "CITATION GAP" banner uniformity and the ARTIFACTS-vs-DELIVERABLES count mismatch remain tracked separately (out of scope).
