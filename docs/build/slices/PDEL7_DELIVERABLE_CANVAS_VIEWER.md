# PDEL7 · HTML / Markdown Deliverable Viewer

Slice ID: PDEL7
Slice name: HTML / Markdown Deliverable Viewer
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (Lane D, sole)

Adds the deterministic single-deliverable viewer that the future Program
detail surface mounts inside the program canvas. Composes from the PDEL
artifact inventory only. **No live runtime, no upload pipeline, no parse
engine, no model calls, no migrations, no live download, no live edit,
no live regenerate, no live approval.**

## What changed

- New view-model module
  [src/lib/programs/deliverable-canvas-view.ts](../../../src/lib/programs/deliverable-canvas-view.ts):
  - Public types: `DeliverableViewerRenderMode`,
    `DeliverableViewerActionKey`, `DeliverableViewerEvidenceStatus`,
    `DeliverableViewerGenerationLabel`, `DeliverableViewerAction`,
    `DeliverableViewerView`.
  - Public helper:
    `buildDeliverableCanvasView(programId, artifactId)` — pure, returns
    `null` when either id is unknown.
  - Re-exports for test introspection:
    `DELIVERABLE_VIEWER_ACTION_KEYS`,
    `DELIVERABLE_VIEWER_ACTION_REASONS`,
    `DELIVERABLE_VIEWER_HONEST_DISCLAIMER`,
    `DELIVERABLE_VIEWER_RICH_TEXT_PLACEHOLDER_BODY`,
    `DELIVERABLE_VIEWER_RENDER_MODES`.
- New server component
  [src/components/programs/DeliverableCanvasViewer.tsx](../../../src/components/programs/DeliverableCanvasViewer.tsx):
  Renders the deliverable viewer (header, meta row, missing-inputs
  callout, preview body, disabled action row, footer). Server-only —
  no `'use client'`, no `useState`, no `useEffect`, no
  `dangerouslySetInnerHTML`. Root carries
  `data-deliverable-canvas-viewer="pdel7"`.
- New tests
  [src/__tests__/integration/programs/deliverable-canvas-viewer.test.ts](../../../src/__tests__/integration/programs/deliverable-canvas-viewer.test.ts):
  determinism (byte-equal); all three render modes covered across the
  canonical demo seed; all four future actions present and disabled
  with deferred reasons; missing-input visibility for non-usable
  evidence; no fake download URL or `E-###` citation; no
  `dangerouslySetInnerHTML` in the component (regex assert); no
  `'use client'`, no `useState`, no `useEffect`, no `useRef`; module
  hygiene (no Source UI, Sentinel / Atlas / Nexus / Agent runtime,
  supabase, auth, `Date.now`, `Math.random`, `new Date(`, `fetch(`,
  `anthropic`, `openai`).

## Render-mode contract

| Render mode             | Canvas treatment                                              |
| ----------------------- | ------------------------------------------------------------- |
| `html`                  | Deterministic escape-only seed body shown as inspect-only `<pre>` source — never injected as HTML. |
| `markdown`              | Deterministic seed body rendered as a `<pre>` text block.     |
| `rich_text_placeholder` | Canonical placeholder caption (`"Rich-text preview is not yet wired for this artifact type."`). |

## Disabled-action contract

| Action     | Future label | Reason                                                                       |
| ---------- | ------------ | ---------------------------------------------------------------------------- |
| Edit       | `future`     | Edit is not yet available; the deliverable editor is deferred to a future slice. |
| Regenerate | `future`     | Regenerate is not yet available; the model invocation seam is deferred to a future slice. |
| Download   | `future`     | Download is not yet available; export pipeline is deferred to a future slice. |
| Approve    | `future`     | Approve is not yet available; Steward gate sign-off is deferred to a future slice. |

Every action button renders with `disabled`, `aria-disabled="true"`, and
a sub-label naming the deferred destination.

## What is deterministic today

- View-model is byte-equal across repeated calls per (program,
  artifact) pair (test enforced).
- All three render modes (`html`, `markdown`, `rich_text_placeholder`)
  are observable across the canonical demo seed (test enforced).
- All four canvas actions are present and `enabled: false` with a
  non-empty deferred reason (test enforced).
- Missing-input entries always include the evidence binding deferral
  for any artifact whose `evidenceUsability !== 'usable'` (test
  enforced).
- No `https://`, `blob:`, `data:application/`, `download?`, `/files/`,
  `.pdf`, or `E-###` citation tokens appear anywhere in the
  serialized view (test enforced).
- `versionLabel` is `null` today; deliverable-versioning is deferred
  (test enforced).
- `createdFrom === 'deterministic_deliverable_view_seed'`.

## What is NOT yet wired

- No edit / regenerate flow; future slices own those actions.
- No download / export pipeline; export slice owns that.
- No Steward approval state machine; approval action is deferred.
- No live evidence registry binding; `evidenceStatus` mirrors the
  underlying inventory `evidenceUsability` and is `partial` /
  `not_usable` for any artifact without a usable E-id citation.
- Markdown is rendered as `<pre>` text only; the markdown → HTML
  pipeline is deferred.
- `versionLabel` is always `null`; the
  `deliverable-versioning` module is not yet present on this branch
  and will populate the field once it lands.

## Why it is safe

- Server component only — no `'use client'`, no React state hooks.
- Component never uses `dangerouslySetInnerHTML`. The HTML render mode
  surfaces the deterministic seed body as inspect-only escaped source
  inside a `<pre>` block; operator-supplied content can never execute.
- Module imports nothing from Source UI, Sentinel / Atlas / Nexus /
  Agent runtime, legacy `/programs`, `mock.ts`, auth, or supabase.
- No model / API calls. No `Date.now`, `Math.random`, `new Date`,
  `fetch`. No `anthropic` / `openai` import.
- Stages only the six allowed files (view-model module, server
  component, integration test, slice doc, build-slices.json,
  production-readiness.json).

## What is deferred

- **Live edit + regenerate** — flips `edit` / `regenerate` actions to
  enabled when the deliverable editor and model invocation seam land.
- **Live download / export** — flips `download` action to enabled and
  binds an export URL when the export slice lands.
- **Steward gate sign-off** — flips `approve` action to enabled when
  the Steward state machine lands.
- **Evidence registry binding** — promotes `evidenceStatus` to
  `usable` when E-id citations are wired (PDEL / ADM3 lifecycle).
- **Deliverable versioning** — populates `versionLabel` once the
  versioning read model lands on this branch.
- **Markdown → HTML render** — flips the markdown body to a rendered
  HTML view once the deterministic markdown pipeline lands; today the
  body is shown as `<pre>` text.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/deliverable-canvas-viewer.test.ts` — pass (24 / 24)
- `npx jest src/__tests__/integration/programs/program-artifact-canvas.test.ts` — pass (regression)
- `npm run build` — pass

## Status

Code complete. Pending founder review.
