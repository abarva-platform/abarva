# 2026-07-23-source-integrity-fixes — Close four Source integrity gaps named in the modernization audit

## Release ID

`2026-07-23-source-integrity-fixes`

## Status

`released` — merged to `main` via [#5600](https://github.com/abarva-platform/abarva/pull/5600)
(squash-merge `86b4ffe9302e4350447ee330c0c5f135eeca5318`), all 20 CI checks passed. ACA deploy and
live signed-in proof still pending — see QA / Validation and Deployment Authority; this record does
not claim live-proven status until those checks are captured.

## Plain-English Summary

`ADR-0013-source-modernization-baseline.md` sequenced Source modernization as: audit baseline
(merged), then immediate integrity fixes, then vendor-proposal ingestion, then contracts, then
storytelling/visuals. This release is that second step — the four fixes explicitly named in the
roadmap, each closing a gap the audit found and cited with exact code references:

1. **Closed the chat-save bypass.** `POST /api/v1/source/:eventId/artifacts/generate` (the
   no-artifact-code route Atlas chat uses to save generated content) previously accepted any
   free-text `artifactKind`, defaulting to a generic label when absent — meaning chat-authored
   content could become a registered Source artifact with no resolvable contract, and ran neither
   the section-conformance nor banned-term checks the primary `[artifactCode]/generate` pipeline
   runs on every draft. The route now requires a real, registered artifact code, runs both checks
   against it, and persists the artifact tagged with that real code instead of a free-text label.
   `AtlasDrawer.tsx` (the only caller) now sends a real code, mapped from the event's current
   stage.
2. **Protected the Decision Brief.** `d24_decision_brief` — the artifact that names a recommended
   vendor — had `upstreamRequired: []` despite depending on the scorecard and pricing workbook;
   those were only optional. It now hard-requires both, matching the pattern already used
   correctly by `d27_selection_memo`.
3. **Made governance banners visible on two more vendor/client-facing export families.** The audit
   found the shared governance-notice helper (already built, already used by 6 families) was
   silently absent from 8 others. This release wires it into the BAFO Question Pack and Market
   Scan renderer families (docx + pdf, 4 files) — the remaining 6 (pricing-comparison,
   tco-iceberg, trap-log, ai-clause-gap, deal-pack, cxo-report) are a named follow-up, not silently
   dropped (see Known Gaps).
4. **Strengthened the "accept as authoritative" permission bar.** The accept route was gated by
   `canUploadSourceArtifacts` — the same permission as a plain file upload — despite its own code
   comment acknowledging acceptance is "a stronger claim." It now requires `canApproveSourceStages`
   (admin-only by default), the same stricter permission the stage-gate approval route already
   uses.

## Layer Impact

- `global-control-lane`: all four changes are Source-scoped application code (a route validation
  rule, a prompt-registry dependency array, two renderer files, one permission check). No schema
  change, no new table, no new migration.

## Client Applicability

- All clients: yes — all four fixes apply uniformly, no tenant-specific behavior.
- Specific clients: none.
- Internal only: no. Public/demo only: no. Feature flag: none.

## Changes Included

- `src/app/api/v1/source/[eventId]/artifacts/generate/route.ts` — requires `artifactCode`,
  validates it against `getSourceArtifactProfile`, runs `verifyArtifactSections`/
  `scanForBannedTerms`, persists `artifactKind` as the validated code, surfaces both check results
  in the response receipt and the file-cabinet description/`missingInputs` fields.
- `src/app/api/v1/source/[eventId]/artifacts/generate/__tests__/route.test.ts` — new: proves the
  artifactCode requirement, the unknown-code rejection, the happy path (real checks actually run,
  `artifactKind` persists as the real code), the compliance-flag signal, and the existing
  permission gate.
- `src/components/shell/AtlasDrawer.tsx` — `GeneratedSourceArtifactSave` now sends a real
  `artifactCode` (derived from the event's current stage) instead of the free-text
  `"agent_generated_packet"` label.
- `src/lib/source/agent-generation/prompt-registry.ts` — `d24_decision_brief.upstreamRequired`
  now includes `d16_scorecard` and `d19_pricing_workbook` (moved out of `upstreamOptional`).
- `src/lib/source/exports/renderers/bafo-question-pack-docx.ts`,
  `bafo-question-pack-pdf.tsx`, `market-scan-docx.ts`, `market-scan-pdf.tsx` — wire in the
  existing `sourceArtifactGovernanceBanner`/`governanceNoticeParagraph` helpers, matching the
  pattern already used by the scorecard renderer family.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/accept/route.ts` — permission check
  changed from `canUploadSourceArtifacts` to `canApproveSourceStages`; error message updated to
  explain why.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/accept/__tests__/route.test.ts` —
  updated existing negative-permission test to the new field name, added a new test proving
  upload-only rights are no longer sufficient.

## QA / Validation

- `pass` — `npx jest --runTestsByPath src/app/api/v1/source/[eventId]/artifacts/generate/__tests__/route.test.ts --runInBand`
  — 5/5 passed.
- `pass` — `npx jest --runTestsByPath src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/accept/__tests__/route.test.ts --runInBand`
  — 7/7 passed.
- `pass` — `npx jest --runTestsByPath src/lib/source/agent-generation/__tests__/prompt-registry.test.ts src/lib/source/agent-generation/__tests__/quality-review.test.ts src/lib/source/agent-generation/__tests__/strategy-authoring.test.ts --runInBand`
  — 52/52 passed (confirms the `d24_decision_brief` upstream change doesn't regress adjacent
  registry tests).
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  — zero errors.
- `pass` — `npx eslint` on all ten touched/added files — clean.
- `pass` — `node scripts/release-check.mjs --base origin/main --head HEAD` — 10 release-relevant
  files, this release record found and matched.
- `pass` — all 20 required CI checks on PR #5600 (typecheck, ESLint, architecture rules, migration
  drift, gitleaks, bundle/Lighthouse budgets, hygiene gate, tenant allowlist, etc.).
- `pending` — live signed-in proof — after deploy: (a) attempt a chat-save with a bogus
  artifact code and confirm 400; (b) attempt generating `d24_decision_brief` on an event with no
  scorecard/pricing workbook and confirm the upstream-block 409; (c) render a BAFO Question Pack
  or Market Scan artifact and confirm the governance banner now appears; (d) confirm a
  upload-rights-only user gets 403 on `/accept`.

## Rollout Plan

Merge to `main` via PR, deploy through the repo-owned ACA main deploy workflow, then live-verify
per the four checks above.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: to be recorded after merge and deploy.
- ACA runtime invariant: to be recorded after merge and deploy.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — see QA / Validation.

## Rollback Plan

Revert the merge commit. All four changes are additive validation/permission tightening or
prompt-registry metadata — no data migration, no schema change, no existing row mutated. Reverting
restores the four previously-open gaps exactly as the audit found them.

## Audit Evidence

- PR: [#5600](https://github.com/abarva-platform/abarva/pull/5600), squash-merged
  `86b4ffe9302e4350447ee330c0c5f135eeca5318`, 2026-07-25.
- Deploy run and live proof: to be recorded after ACA deploy.
- Baseline audit this release closes items from:
  `docs/audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md` (Pipeline Drift Report items D1/D2,
  Approval State Machine section, Visual/Rendering section).
- Sequencing decision: `docs/architecture/adr/ADR-0013-source-modernization-baseline.md`.

## Known Gaps

- Governance-banner wiring covers 2 of the 8 previously-silent renderer families (BAFO Question
  Pack, Market Scan). The remaining 6 (pricing-comparison, tco-iceberg, trap-log, ai-clause-gap,
  deal-pack, cxo-report) are a named, explicit follow-up — not silently dropped.
- Export/download routes (`download/route.ts`, the `render*` family) still do not check quality-
  gate pass status before serving bytes. Given quality-gate failure already blocks save entirely
  for the 5 gated artifact codes (a failing generation returns 422 and nothing persists), the
  practical risk is narrower than initially scoped — this is left for the stage/artifact-contracts
  PR (PR 4 in ADR-0013) rather than bundled here, since a real fix needs the shared
  `SourceArtifactContract` this release doesn't build.
- The chat-save route's stage→artifact-code mapping in `AtlasDrawer.tsx` picks one _primary_
  d-code per stage as a reasonable default; a stage with multiple valid artifact types (e.g. RFP
  stage has d09-d12) will always save as the primary one. A follow-up could let the UI pick
  explicitly instead of defaulting.
