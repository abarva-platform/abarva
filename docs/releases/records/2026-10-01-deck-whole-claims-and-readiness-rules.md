# 2026-10-01 — Deck Whole Claims and Client-Readiness Rules

## Release ID

`2026-10-01-deck-whole-claims-and-readiness-rules`

## Status

`candidate`

## Plain-English Summary

Generated slide decks no longer print half a sentence. When a deck is built from document sections, each slide point used to be cut at a fixed word count and finished with an ellipsis, so a finding could lose its qualifier, its figure, or its verb and still be shown as the finding. A point is now printed whole, shortened only at a semicolon where what remains is a complete statement, or held off the slide and carried in full in the speaker notes.

Three related defects are fixed with it. A paragraph label that only names the paragraph's role in the document is no longer promoted to a slide headline, and is removed from every export format. The cover no longer describes an unapproved draft as board-grade directly above the line saying it is not approved. List items on slides now render with bullet markers and spacing; the option previously used produced neither.

The sign-off readiness scan gains four rules so these defects cannot be signed off unnoticed: a statement ending in an ellipsis, an authoring label used as content, a source-system field compared to a raw value, and a bare column-shaped field name.

## Layer Impact

**Release lane: `global-control-lane`.** This changes shared deliverable rendering and the shared sign-off readiness scan for every client; it is not behind a feature flag.

- **Product layer — deliverable rendering (PPTX, DOCX, HTML, PDF):** Slide text selection for the section-fallback deck moves to a pure module. Cover eyebrow text is single-sourced next to the existing draft-status text. Structural authoring labels are stripped during section normalisation for all formats.
- **Product layer — sign-off readiness scan:** Four new finding kinds. Three are blockers; the bare field-name rule is review-only. Existing rules, lists, and severities are unchanged — nothing is relaxed.
- **Canonical model:** No schema, tenant data, or stored artifact changes. Previously generated files are not rewritten; they are judged by the stricter scan the next time sign-off is attempted.

## Client Applicability

- All clients generating deliverables or signing off generated artifacts receive the behavior after deployment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/slide-text.ts` (new): whole-claim fitting, scaffolding-label handling, headline sizing.
- `src/lib/deliverables/orchestrator/renderers.tsx`: fallback section slides use the new module; cover eyebrow single-sourced; structural labels stripped in section normalisation; slide bullets emit a real bullet and paragraph spacing.
- `src/lib/deliverables/shared/client-readiness-scan.ts`: `truncated_claim`, `authoring_scaffold_label`, `source_field_expression` (blockers) and `source_field_name` (review).
- Tests for each rule in both directions, and a test that renders a deck and runs the produced file through the same extractor and scanner sign-off uses.

## QA / Validation

- Targeted Jest: pass — `111 suites, 1287 tests` across deliverable rendering, the readiness scan and gate, and the deliverable sign-off route.
- Mutation checks: pass — restoring word-cap truncation fails 10 tests; making label stripping a no-op fails 12.
- Targeted ESLint and Prettier on changed files: pass.
- Rendered-file inspection: pass — a worst-case slide (longest admissible headline, six longest admissible points) and a realistic slide were rendered to images and checked for overflow, bullet markers, and spacing.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: pass.
- Typecheck: deferred to CI (the local compiler run is not reliable on this machine).
- Signed-in runtime verification: pending deployment.

## Rollout Plan

Merge through a reviewed PR. Deploy only through the repository-owned ACA main deploy workflow. After the exact merge SHA is live, regenerate a deck on a synthetic workflow and confirm the produced file has no cut statements, no label headlines, and a cover consistent with its draft status.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside the deploy workflow.
- Approved image digest: Pending exact-SHA deployment.
- ACA runtime invariant: Pending exact-SHA verification.
- Worker image invariant: Pending exact-SHA verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, on a synthetic workflow.

## Rollback Plan

Use the repo-owned ACA main deploy workflow to redeploy the prior approved digest, or revert this change. No database migration or data mutation is included, so rollback restores the previous rendering and scan behavior with nothing to undo.

## Audit Evidence

- PR and exact-SHA CI checks: pending.
- Targeted test output, mutation results, and rendered-slide inspection: recorded in the PR.
- Exact-SHA ACA deployment, digest invariants, and signed-in proof: pending.

## Known Gaps

- The stricter scan applies to artifacts generated before this change. One that contains a cut statement will now report a blocker at sign-off; the existing acknowledgement path is unchanged, and regenerating the artifact clears it.
- The field-name rules match shape, not meaning. A legitimate business term written in snake_case with a column-style suffix will be raised for review.
- Slides authored directly by the model (not built from sections) were never truncated and are not changed here, other than gaining bullet markers.
- Label wrapping inside rasterised exhibits still shortens over-long labels with an ellipsis; that text is an image and is outside the scan.
