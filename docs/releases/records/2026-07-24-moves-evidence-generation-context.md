# 2026-07-24-moves-evidence-generation-context — Uploaded Move evidence reaches generation context

## Release ID

`2026-07-24-moves-evidence-generation-context`

## Status

`candidate`

## Plain-English Summary

A methodology audit of the Strategic Moves generation pipeline (this session) found that uploaded
Move evidence and workshop notes were functionally invisible to AI generation — confirmed live on
the MEMBER AI ASSIST Move, where 15 approved-looking evidence files sat in the vault while the P2
discovery report and P3 architecture both said "NOT IN EVIDENCE" for every current-state fact.

Root cause: two separate, unrelated upload paths existed. The "Upload evidence" button in Files &
Evidence (`artifacts/upload/route.ts`) stored the file and hardcoded `status: "aligned"` with zero
parsing and zero connection to generation. A second, more sophisticated pipeline already existed
(used only by the workspace chat paperclip) that actually parsed, classified, and opened a governed
review — but the two paths never met.

This release unifies them: every uploaded evidence/session-artifact file, from either surface, now
goes through the same governed extraction → classification → review pipeline. It also closes a
separate last-mile gap where the prompt-context reader pulled the 20 most recent evidence items
with no approval filter at all, and adds a flexible, Move-specific extraction layer (observations,
tables, assumptions, open questions, citations) so generation can cite real approved files instead
of a generic "supporting evidence" placeholder.

## Layer Impact

- **global-control-lane**: shared Strategic Moves evidence-ingestion pipeline
  (`src/lib/programs/current-state-doc-ingest.ts`, `evidence-ingestion.ts`, `evidence-context.ts`,
  `evidence-packets.ts`), the `SolutionContext` data model (`solution-context.ts`,
  `assemble-solution-context.ts`), and two upload API routes. No new tables — reuses
  `program_evidence_items`/`program_evidence_reviews` with an additive JSONB shape.

## Client Applicability

- All clients: yes — every tenant's Move evidence upload goes through this path; no flag.

## Changes Included

- `src/lib/programs/evidence-ingestion.ts` — new `FlexibleEvidenceEnvelope` type
  (`observations`/`tables`/`assumptions`/`openQuestions`/`citations`), new
  `extractFlexibleEvidenceEnvelope()` (Claude-based, audited egress path, degrades to `null` on any
  failure), new `enrichWithFlexibleEvidenceEnvelope()` wrapper.
- `src/lib/programs/current-state-doc-ingest.ts` — new shared `ingestUploadedMoveEvidence()`: the
  single governed path for a Move-scoped upload of unknown/inferred family (extract → classify →
  decoded-text PHI rescan, gating the flexible-extraction call → record evidence → open review →
  best-effort discovery-capture apply). Wires the flexible enrichment into the existing
  `ingestCurrentStateDoc()` too, after (never before) its PHI quarantine check.
- `src/app/api/v1/programs/[programId]/artifacts/upload/route.ts` — now calls
  `ingestUploadedMoveEvidence()` for `uploaded_evidence`/`session_artifact` families after saving
  the artifact. Best-effort: a failure here never blocks the upload itself.
- `src/app/api/programs/workspace/[moveId]/upload/route.ts` — refactored to call the same shared
  function instead of its own inline copy of the same sequence.
- `src/lib/programs/evidence-context.ts` — `listProgramEvidenceForPrompt()` now queries
  `program_evidence_reviews` for `decision = 'approved'` rows first, then only fetches those
  `program_evidence_items` — replacing an unfiltered "20 most recent" query. Also surfaces the new
  flexible fields (`observations`, `citations`) in the formatted prompt block.
- `src/lib/programs/solution-context.ts` — new cumulative `evidencePackets: SolutionEvidencePacket[]`
  field (same append-only pattern as `decisions`).
- `src/lib/programs/evidence-packets.ts` (new) — `loadEvidencePacketsForMove()`, reshapes the
  approved-evidence query into `SolutionEvidencePacket[]`.
- `src/lib/programs/assemble-solution-context.ts` — new optional `loadEvidencePackets` source,
  folded in with dedup-by-evidenceId against anything already carried forward.
- `src/lib/deliverables/moves-generate-deps.ts` — wires the real `loadEvidencePacketsForMove` source
  into `createMovesGenerateArtifactDeps`.

## QA / Validation

- `npx eslint` on all changed/new files — clean.
- `NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit` — clean.
- New test suite `evidence-flexible-extraction.test.ts` — 8 tests (success, no-API-key fallback,
  empty-text no-op, malformed JSON, model-call failure — all degrade to `null`/unchanged evidence,
  never blocking ingestion).
- Updated `evidence-context.test.ts` — asserts the two-query approved-only behavior and a
  zero-approved-evidence early return.
- Updated 3 other test fixtures for the new required `SolutionContext`/`ProgramEvidencePromptItem`
  fields.
- Full `src/lib/programs src/lib/deliverables` Jest run: 9 suites showed failures — confirmed via a
  clean `origin/main` baseline checkout that **all 9 are pre-existing failures unrelated to this
  change** (a stale snapshot in `renderers.test.ts`, an unrelated SSN-regex flake in
  `current-state-doc-ingest.test.ts`, etc.), not caused by this PR.

## Rollout Plan

Merge to `main` via squash-merge PR (repository ruleset is PR-only, speed mode). The repo-owned
`aca-main-deploy.yml` workflow builds and deploys the `main-<sha>` image. No feature flag, no
migration (reuses existing `program_evidence_items`/`program_evidence_reviews` schema with an
additive JSONB shape inside `extracted_structured`).

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow
- Approved image digest: to be confirmed post-merge via runtime-invariant check
- ACA runtime invariant: to be verified after deploy
- Worker image invariant: not applicable
- Feature/env flag update path: not applicable
- Live signed-in proof required: yes — upload/approve a real evidence file on a real Move (Anand
  directed this run against MEMBER AI ASSIST specifically) and confirm a regenerated deliverable
  cites it, per the audit's proof target.

## Rollback Plan

Revert the merge commit (or redeploy the prior `main-<sha>` image). No schema migration to roll
back — the additive JSONB shape is backward compatible with existing rows (the `flexible` field is
optional and simply absent on older evidence items).

## Audit Evidence

- PR: to be opened
- Local validation: eslint clean, tsc clean, new/updated tests passing, pre-existing-failure
  baseline confirmed
- Post-deploy: ACA runtime-invariant check and live signed-in evidence upload/approve/regenerate
  proof to be added once captured

## Known Gaps

- No dedicated integration test for `ingestUploadedMoveEvidence()` itself (its constituents are
  each tested) — the live proof against a real Move is the intended verification for the full
  wiring.
- Citations are not yet wired into the rendered Source Register appendix
  (`deliverables/source-labels.ts`) — the structured data now exists in `SolutionContext` and the
  prompt, but the DOCX/PDF/HTML appendix still resolves from the curated static dictionary. Planned
  as a fast-follow.
- "Approve evidence" is not yet surfaced in `FileCabinetPanel.tsx` — the review step still requires
  calling `current-state/evidence/:id/approve` directly; there is no vault-native button yet.
- This is Workstream 1 of 6 identified in the end-to-end methodology audit
  (`docs/architecture` audit doc, not yet committed to the repo). Workstreams 2–6 (structured gate
  inputs, authoritative-lifecycle wiring, document-generation mechanics, workshop feedback loop,
  Tower handoff contract) are explicitly out of scope here.
