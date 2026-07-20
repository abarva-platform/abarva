# 2026-07-20-docx-exhibit-rendering — Visual exhibits now embed in DOCX, not just HTML

## Release ID

`2026-07-20-docx-exhibit-rendering`

## Status

`candidate`

## Plain-English Summary

The orchestrator's deliverable exhibits (matrix, timeline, flow, and the
conceptual/logical/physical architecture + agent-orchestration diagrams added
in the architecture-diagram-renderer release) previously rendered ONLY in the
HTML preview — `renderDeliverableDocx`, the default and most commonly
downloaded output format, silently dropped every exhibit. A reader who only
ever opened the Word document never saw a single diagram. This release
rasterises the same SVG each exhibit already produces and embeds it as an
image in the DOCX, under a new "Visual Exhibits" section, with the exhibit's
title and description as accompanying text — so DOCX and HTML readers now see
the same diagrams.

## Layer Impact

- **global-control-lane**: shared orchestrator rendering code
  (`src/lib/deliverables/orchestrator/renderers.ts`) used by every module
  (Moves, Source, Tower, Intelligence) and every deliverable type that goes
  through the orchestrator pipeline. No schema, API, or flag change — purely
  a rendering-output improvement for an existing, already-shipping code path.

## Client Applicability

- All clients: yes — every orchestrator-generated DOCX now carries its
  exhibits, with no per-tenant gate.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — takes effect on the next DOCX generation for any
  deliverable that declares exhibits.

## Changes Included

- `src/lib/deliverables/orchestrator/renderers.ts`:
  - Extracted `exhibitSvg(exhibit, index)` from `exhibitHtml` so the same SVG
    generation is shared by both the HTML and DOCX renderers instead of only
    being reachable from the HTML path.
  - Added `resolveSvgTokens()` — the exhibit SVGs reference the page's
    `:root` CSS custom properties (`var(--fresh)`, `var(--muted)`, etc.,
    declared once in the HTML preview's stylesheet). A standalone
    rasterisation has no such stylesheet, so this substitutes the same
    concrete hex values before handing the SVG to the rasteriser.
  - Added `withXmlns()` — `@resvg/resvg-js` refuses to parse an `<svg>` root
    with no `xmlns` attribute (confirmed by direct reproduction: identical
    markup succeeds with `xmlns="http://www.w3.org/2000/svg"` and fails with
    "the document does not have a root node" without it). The exhibit markup
    intentionally omits it since it's designed to be inlined directly into an
    HTML document. This is added only for the rasterisation path, not to the
    HTML-facing SVG string.
  - Added `exhibitToDocxBlocks()` — rasterises one exhibit via the existing
    `rasteriseSvg` helper (`@resvg/resvg-js`, already used by the PPTX board-
    grade export; no new dependency), embeds it as a `docx` `ImageRun`, and
    falls back to a plain-text notice (never throws) if rasterisation fails
    for any reason, so one malformed exhibit cannot break the whole document.
  - Wired a new "Visual Exhibits" section into `renderDeliverableDocx`,
    rendered after "Tables & Exhibits", one image + caption + description per
    declared exhibit.
- `src/lib/deliverables/orchestrator/__tests__/renderers.test.ts` — new
  `describe('DOCX renderer — visual exhibits')` block: (1) confirms a real
  PNG (verified via magic-number bytes) is embedded as a `word/media/*.png`
  part with a corresponding image relationship, alongside the exhibit's title
  and description as document text; (2) confirms the fallback path (a mocked
  rasteriser failure) degrades to a text notice rather than throwing, and
  that no media part is written in that case.

## QA / Validation

- `npx jest src/lib/deliverables/orchestrator` — 160 tests, 158 passed / 2
  failed. Both failures are pre-existing and unrelated: fixture/test-name
  drift (`ams-rfp.ts`'s fixture uses `clientDisplayName: 'Airline Demo'`
  while two older tests still assert `/SkyHarbor/`) — confirmed pre-existing
  by checking `origin/main`'s copy of the same fixture file directly, not
  introduced by this change.
- `npx eslint src/lib/deliverables/orchestrator/renderers.ts
  src/lib/deliverables/orchestrator/__tests__/renderers.test.ts` — 0 errors.
- Direct reproduction of the `resvg` `xmlns` requirement via a standalone
  script before writing the fix, confirming the exact failure mode and the
  exact fix, rather than guessing at the rasteriser's error surface.
- Local `npx tsc --noEmit -p .` requires the full monorepo type graph and
  historically crashes in this sandbox (established in prior sessions); CI's
  "Typecheck + reasoning-layer tests" is authoritative.
- `git diff --check` — clean.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). Pure code change —
no migration, no flag, no data backfill. Takes effect for every DOCX
generated after the deploy completes; deploy proceeds through the repo-owned
`aca-main-deploy` workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — to be
  confirmed after merge.
- Shared runtime mutators: none used directly; deploy proceeds through the
  standard workflow only.
- Approved image digest: to be recorded once the deploy workflow runs.
- ACA runtime invariant: to be proven after deploy.
- Worker image invariant: to be proven after deploy — DOCX generation runs
  through the same web/worker image as every other orchestrator path.
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof required: yes — after deploy, generate (or re-download)
  a real orchestrator deliverable of a type that declares exhibits (e.g. a
  Target State Architecture) as DOCX and confirm the "Visual Exhibits"
  section renders real diagram images, not just the pre-existing HTML
  preview.

## Rollback Plan

Revert the merge commit. No schema or data is touched — DOCX generation
reverts to silently omitting exhibits, exactly as it did before this release.
No migration to roll back.

## Audit Evidence

- PR URL: to be added when opened.
- CI run: to be added when the PR's checks complete.
- Deployment URL / ACA revision: to be added after deploy.

## Known Gaps

- **PDF still has no exhibit path — in fact no PDF renderer at all for this
  pipeline.** The orchestrator's `RenderableDeliverable` type declares `'pdf'`
  as an `OutputFormat` value, but no `renderDeliverablePdf` function exists
  anywhere in `src/lib/deliverables/orchestrator/`. (A separate, unrelated
  `DeliverableSpec`/`DeliverableKind` export system already has its own
  `@react-pdf/renderer`-based PDF renderer, but for different artifact kinds —
  program-charter, outcome-report, roadmap — not the orchestrator's business
  case / target-state-architecture types.) Building a PDF path for the
  orchestrator pipeline is scoped as its own separate backlog item rather
  than bundled into this one.
- **PPTX is untouched by this release.** The orchestrator's `OutputFormat`
  also includes `'pptx'`; whether/how exhibits should appear there was not
  investigated as part of this change.
- **No live-generated real-artifact screenshot yet** showing the embedded
  DOCX image opened in an actual Word-compatible viewer (only proven via
  direct ZIP/XML inspection and PNG magic-number verification in tests) —
  open until the live-proof step in Deployment Authority above is performed
  post-deploy.
