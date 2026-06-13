# 2026-06-13-charter-source-label-leak — Mask internal source ids in client-visible Move deliverables

## Release ID

`2026-06-13-charter-source-label-leak`

## Status

`candidate`

## Plain-English Summary

A senior-consultant browser walkthrough of the SkyHarbor Air IROPS Move found that the generated Program Charter (and its persisted DOCX, the artifact card, and the grounded Q&A) showed **raw internal data-namespace identifiers** — `tower_cmdb_cis`, `tower_workforce`, `tower_dora_metrics` — as visible source tags (e.g. "cited tower_cmdb_cis", "· tower_workforce"). These are internal table names that should never appear in a client-facing document; they would be immediately embarrassing in a board or sponsor review and were flagged as the single ship-blocking (P0) defect.

This change routes every client-visible deliverable surface on the grounded-narrative path through the existing source-label humanizer (`resolveSourceLabel`), so `tower_cmdb_cis` renders as "Application & Systems Inventory", `tower_dora_metrics` as "Engineering Delivery Baseline (DORA Metrics)", etc. A new defense-in-depth rendering pass (`scrubInternalSourceTags`) scrubs any raw id the LLM might echo before the markdown reaches a client. The machine-readable evidence envelope (`citations`/`evidenceUsed`) deliberately keeps the raw ids for traceability — only human-readable surfaces are humanized.

## Layer Impact

- `global-control-lane`: shared deliverable-rendering behavior for all tenants. The grounded-narrative charter/discovery/business-case generators, their persisted-DOCX renderer, the deterministic fallback renderer, the in-product grounded-answer text, and the deliverable artifact card now all mask internal source ids. No schema, data-plane, or auth change.

## Client Applicability

- All clients: Yes — any tenant generating a grounded narrative deliverable or viewing the artifact card / grounded answers.
- Specific clients: n/a
- Internal only: No
- Public/demo only: No
- Feature flag: None — this is a correctness fix, not gated.

## Changes Included

- `src/lib/programs/deliverables/source-labels.ts` — new `scrubInternalSourceTags(text)` rendering pass (reuses `resolveSourceLabel`; covers `tower_*`, `enterprise_context_*`, `document_extract:*`, `method:*`, `archetype:*`).
- `src/lib/programs/deliverable-narrative.ts` — `buildEvidenceBundle` humanizes each `[source: …]` citation + gap family before they reach Claude; final markdown is scrubbed.
- `src/app/api/v1/programs/[programId]/current-state/deliverable/narrative/route.ts` — deterministic fallback renderer humanizes citations + scrubs.
- `src/app/api/v1/programs/[programId]/current-state/deliverable/persist/route.ts` — persisted-DOCX markdown humanizes citations + `[MISSING EVIDENCE: …]` family + scrubs.
- `src/lib/programs/archetype-context-bundle.ts` — `answerGrounded` humanizes the `cited …` source name in answer text and the hardcoded parenthetical (envelope citations stay raw for traceability).
- `src/components/strategic-moves/DeliverableArtifactCard.tsx` — humanizes the inline citation + missing-evidence labels shown per claim.
- Tests: `src/lib/programs/deliverables/__tests__/deliverable-quality.test.ts` (+3 scrub cases), `src/lib/programs/__tests__/deliverable-narrative-bundle.test.ts` (new).

## QA / Validation

- Unit: `npx jest deliverable-quality archetype-context-bundle deliverable-narrative-bundle` → **3 suites, 26 tests passed**. Includes the pre-existing grounded-contract assertions that the envelope still cites `tower_dora_metrics` (machine traceability preserved) and the new assertions that no `tower_*` / `document_extract:` / `method:` tag survives in any humanized surface (`findForbiddenTags` returns `[]`).
- Lint: `npx eslint` on all 7 changed files → clean (exit 0).
- Typecheck: `npx tsc --noEmit` → no new errors in changed files (only 2 pre-existing missing-optional-dependency errors unrelated to this change).
- Live verification: deploy to ACA lab and regenerate the SkyHarbor charter, confirm no `tower_*` tag in the rendered/persisted document (state-level check below).

## Rollout Plan

Merge to main (squash) → ACA lab image build (`az acr build`) → `containerapp update` on `ca-abarva-web-lab-eastus` → shift 100% traffic → regenerate the SkyHarbor IROPS charter and confirm clean source labels. No migration, no flag flip. Production rollout follows the normal image-promotion path.

## Rollback Plan

Pure rendering change, no data migration. Revert the squash commit and redeploy the prior image. The persisted artifacts generated while this was live are *cleaner* than before; rolling back only reintroduces the raw-tag display, it does not corrupt stored data.

## Audit Evidence

- PR URL (added on open).
- CI: release:check + jest + eslint + tsc.
- Live: regenerated SkyHarbor charter markdown on the lab revision (egress-audited Anthropic call) with a grep proving no `tower_*` tag.

## Known Gaps

- The board-grade orchestrated path (`board-deliverable.ts`) already used numbered `[n]` citations + `resolveSourceLabel` and was never affected — unchanged.
- `[MISSING EVIDENCE: <family>]` markers still display the evidence-family name (now humanized) by design — they are the honest grounded-gap contract, not an internal id leak.
- Other UX findings from the same browser eval (chat auto-scroll, origination scaffold pivot-sync, file-upload drag-drop, "Resolve decision" approval routing) are tracked separately and are out of scope for this P0.
