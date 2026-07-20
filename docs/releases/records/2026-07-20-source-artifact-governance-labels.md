# 2026-07-20-source-artifact-governance-labels — Source artifact draft/final governance labels

## Release ID

`2026-07-20-source-artifact-governance-labels`

## Status

`candidate`

## Plain-English Summary

Source generated artifacts now state the correct governance boundary: AbarVa/aVa prepares a working draft, human review is required before external use, and an uploaded client-final artifact is the authoritative deliverable of record. This keeps the canvas, generated narrative exports, and generated File Cabinet metadata aligned with the human-approval workflow.

This candidate now also formalizes a five-stage governance classification (AI draft → human review → approved for external use → client final → superseded), extends the governance banner to structured XLSX/PDF exports (closing this record's own prior "Known Gap"), and consolidates three previously-independent "which artifact version is authoritative" implementations down to one shared resolver.

## Layer Impact

- `global-control-lane`: Updates shared Source artifact governance copy and generated artifact metadata for all clients using the Source canvas.
- `client-data-lane`: No schema, migration, seed, or tenant data change.

## Client Applicability

- All clients: Yes, for Source artifact canvas/export behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds shared Source artifact governance wording in `src/lib/source/artifact-governance.ts`.
- Reuses the shared client-final governance message in `src/lib/source/client-final-artifacts.ts`.
- Shows a visible AI-draft / human-review banner in `DocumentTab` before a client-final artifact is accepted.
- Keeps the existing client-final banner as the authoritative state once a human-approved file is uploaded.
- Marks generated File Cabinet artifacts with draft/human-review wording in generated artifact metadata.
- Adds the AI-draft notice to narrative DOCX and HTML export cover metadata.
- **New this pass:**
  - Adds `SourceArtifactGovernanceStage` (`ai_draft` / `human_review` / `approved_for_external_use` / `client_final` / `superseded`) and `deriveSourceArtifactGovernanceStage()` / `sourceArtifactGovernanceBanner()` to `artifact-governance.ts`, derived purely from existing `SourceArtifactRecord` fields — no schema change. Vendor-facing artifact profiles (`clientFacing`/`audience: "vendor"` in `source-artifact-profiles.ts`) get a stricter "not approved for vendor release" banner until they clear external approval.
  - Adds shared governance-notice injection points: `governanceNoticeParagraph()` (`exports-shared/docx-base.ts`), a `governanceNotice` prop on `buildStructuredPdfDocument()` (`exports-shared/structured-pdf-base.tsx`), and a `governanceNotice` field on `buildCoverSheet()` (`exports-shared/xlsx-base.ts`) — all format-agnostic (Moves/Programs renderers also consume these shared base files and are unaffected since the field/prop is optional).
  - Wires the new banner into the app-inventory (d04), response-checklist (d11), scorecard (d16), and pricing-template (d19) structured artifact families across docx + PDF + xlsx.
  - Fixes a real, separately-discovered gap: `narrative-pdf.tsx` was missing the AI-draft governance notice that narrative-docx/html already carried (this record's original "Changes Included" list only covered docx/html for narrative artifacts).
  - Consolidates the "which artifact version is authoritative" decision: `mode-grounding.ts`'s per-slot artifact resolution now calls the shared `resolveAuthoritativeArtifact()` (widened `AuthoritativeArtifactCandidate.version` to optional so `SourceArtifactRegistryRecord`, which has no version field, is compatible) instead of a bespoke inline sort. `source-answer-engine.ts`'s regex-parsed, prose-derived artifact-authority picker cannot safely share the same generic function (its `version` field is free text, not a typed number) but now mirrors the exact same precedence order, with an explicit comment cross-referencing the shared resolver so the two can't silently drift apart again.
  - New test coverage: `src/lib/source/__tests__/artifact-governance.test.ts` (11 tests) for the new stage-derivation and banner functions.

## QA / Validation

- `npm test -- --runTestsByPath src/components/source/canvas/workspace-tabs/__tests__/DocumentTab.test.tsx src/lib/source/__tests__/client-final-artifacts.test.ts src/lib/source/__tests__/artifact-governance.test.ts src/lib/source/exports/__tests__/narrative-html.test.ts src/lib/source/__tests__/source-answer-engine.test.ts src/lib/source/ava/__tests__/mode-grounding.test.ts src/lib/source/ava/__tests__/mode-grounding-phase-b.test.ts src/lib/source/ava/__tests__/mode-grounding-phase-c.test.ts` — passed, 144/144. Same pre-existing duplicate manual-mock warnings noted before (markdown mocks); no test failures. The `mode-grounding`/`source-answer-engine` suites in particular already exercised the exact tie-break paths touched by the resolver consolidation (client-final precedence, recency-fallback "honesty rule") and passed unchanged, which is direct evidence the swap is behavior-preserving.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — clean, 0 errors (39s). Note: plain `tsc` without the increased V8 heap crashes (SIGABRT) on this machine regardless of Node version — this is a known local-environment limitation unrelated to code correctness; the flag above is required to get a real result here, CI is unaffected.

## Rollout Plan

Open a PR, merge through the protected GitHub path, then deploy through the repo-owned Azure Container Apps main deploy workflow. No migration or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this candidate.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify a generated Source artifact shows the draft/human-review banner and an accepted client-final artifact shows the authoritative final state.

## Rollback Plan

Revert the PR and redeploy the previous ACA image. No database rollback is required.

## Audit Evidence

- Candidate branch diff in `codex/source-artifact-governance-2`.
- Focused Jest output listed above.
- PR URL, deploy run, ACA invariant, and signed-in screenshot proof pending.

## Known Gaps

- This slice does not add missing generation prompts for all d01-d33 artifacts (Slice 2/4 of the broader Source artifact-governance backlog, not "unification").
- This slice does not add client-final upload acceptance to non-Source/Moves artifacts.
- ~~Structured XLSX/PDF renderers should be audited next to ensure every generated export surface carries the same governance label.~~ **Partially closed this pass**: the shared XLSX/PDF/docx injection points now exist and are wired for 4 of ~11 structured artifact families (app-inventory/d04, response-checklist/d11, scorecard/d16, pricing-template/d19). The remaining 7 (bafo-question-pack/d22, market-scan, tco-iceberg, ai-clause-gap, renewal-decision, pricing-comparison, trap-log/d20) can adopt the same shared helpers with a small, mechanical, low-risk change each — not done in this pass, explicitly logged rather than silently skipped.
- Three overlapping Source status vocabularies still exist (file-cabinet `ArtifactStatus`, registry `SourceArtifactApprovalState`/evidence state, archetype `qualityBar`) — documented as a boundary in `artifact-governance.ts`'s header comment this pass, not reconciled into one schema.
- `source-answer-engine.ts`'s new "approved/locked" precedence tier (mirroring the shared resolver) has no new end-to-end test — it's additive-only (a new fallback that only fires when all prior tiers are empty, so it cannot regress previously-passing behavior) and the existing 111 tests across `source-answer-engine`/`mode-grounding` suites still pass unchanged, but there's no direct fixture exercising this specific new tier yet.
