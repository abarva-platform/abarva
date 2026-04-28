# PDEL5 · Deliverable / Artifact Canvas Renderer

Slice ID: PDEL5
Slice name: Deliverable / Artifact Canvas Renderer
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Adds the deterministic two-region deliverable / artifact canvas — left
list + right preview pane — that the future Program detail surface uses
to render the artifact inventory produced by PDEL. Composes from the
PDEL read model only. **No live runtime, no upload pipeline, no parse
engine, no model calls, no migrations, no live download or export.**

## What changed

- New view-model module
  [src/lib/programs/program-artifact-canvas-view.ts](../../../src/lib/programs/program-artifact-canvas-view.ts):
  - Public types: `CanvasRenderMode`, `CanvasActionKey`, `CanvasAction`,
    `CanvasPreview`, `ProgramArtifactCanvasSelection`,
    `ProgramArtifactCanvasListEntry`, `ProgramArtifactCanvasView`.
  - Public helper: `buildProgramArtifactCanvasView(programId, selectedArtifactId?)`.
  - Re-exports for test introspection:
    `PROGRAM_ARTIFACT_CANVAS_ACTION_KEYS`,
    `PROGRAM_ARTIFACT_CANVAS_ACTION_REASONS`,
    `PROGRAM_ARTIFACT_CANVAS_HONEST_DISCLAIMER`,
    `PROGRAM_ARTIFACT_CANVAS_PLACEHOLDER_PREVIEW_BODY`.
- New server component
  [src/components/programs/ProgramArtifactCanvas.tsx](../../../src/components/programs/ProgramArtifactCanvas.tsx):
  Renders the two-region canvas (left list + right preview pane). Reads
  only from the prebuilt view-model. Root carries
  `data-program-artifact-canvas="pdel5"`.
- Integration
  [src/components/programs/ProgramCanonicalDetail.tsx](../../../src/components/programs/ProgramCanonicalDetail.tsx):
  Mounts the canvas after the deliverable summary list, with no
  pre-selected artifact (`buildProgramArtifactCanvasView(program.programSlug)`).
- New tests
  [src/__tests__/integration/programs/program-artifact-canvas.test.ts](../../../src/__tests__/integration/programs/program-artifact-canvas.test.ts):
  determinism (byte-equal); non-zero artifact count per canonical
  program; `renderableCount ≤ artifactCount`; every action disabled
  with a non-empty deferred reason; placeholder preview body equals
  the canonical placeholder string; no `https://` and no `E-###`
  citation tokens in the serialized view; placeholder preview body
  never claims a real download path; module hygiene (no Source UI,
  Sentinel / Atlas / Nexus / Agent runtime, supabase, auth,
  `Date.now`, `Math.random`, `new Date(`, `fetch(`, `anthropic`,
  `openai`, `useState`, `useEffect`); ProgramCanonicalDetail mounts
  the new component.

## Notes on PDEL4 (HTML deliverable canvas contract)

`docs/build/slices/PDEL4_HTML_DELIVERABLE_CANVAS_CONTRACT.md` is not
present on this branch. Its concepts are summarized here and reused
without contract changes when that doc lands:

- Per-artifact render mode is one of `html`, `markdown`,
  `pdf_export_later`, `docx_export_later`, `ppt_export_later`.
- HTML body is built deterministically from escaped seed strings —
  never operator-supplied content — and is the only render mode that
  uses `dangerouslySetInnerHTML`.
- Markdown bodies are rendered as `<pre>` text today; the markdown →
  HTML pipeline is deferred.
- PDF / DOCX / PPT modes resolve to the canonical placeholder string
  (`"Preview not yet rendered for this artifact type."`); export
  pipeline is deferred to PDEL5b / PDEL6.

## Two-region canvas contract

- **Left list** (one row per artifact):
  - `FileTypeChip` (DOC / PDF / XLS / PPT / NOTE / HTML / DATA)
  - phase eyebrow
  - title
  - render-mode pill (HTML / Markdown / PDF · later / DOCX · later /
    PPT · later)
  - `EvidenceChip` showing `usable_as_evidence` or `partial`
  - artifact-type label
- **Right canvas** (only when an artifact is selected):
  - Header: file chip · phase · artifact type · render-mode pill ·
    evidence chip, with an `<h3>` title.
  - **Missing-inputs callout** — red-toned `<aside role="note">` when
    `selection.missingInputs.length > 0`.
  - **Origin row** — labels generated / uploaded / workshop_note.
  - **Preview body** — `dangerouslySetInnerHTML` for HTML mode (with
    deterministic, escape-only content), `<pre>` for markdown, dashed
    placeholder card for any other mode.
  - **Actions row** — all four future actions (Edit, Regenerate,
    Download, Approve) rendered with `disabled`, `aria-disabled="true"`,
    and a sub-label naming the deferred reason.

The disclaimer footer carries the honest caption naming the
deterministic seed and the absence of any live download.

## Action deferral table

| Action     | Reason                                           |
| ---------- | ------------------------------------------------ |
| Edit       | Edit deferred to PDEL7                           |
| Regenerate | Regenerate deferred to PDEL7                     |
| Download   | Download deferred to PDEL5b/PDEL6                |
| Approve    | Approve flows through Steward gate (deferred)    |

## What is deterministic today

- View-model is byte-equal across repeated calls per program (test
  enforced).
- `artifactCount` matches `view.list.length` (test enforced).
- `renderableCount ≤ artifactCount` (test enforced).
- Every selection's actions array is exactly the four canonical action
  keys and every action is `enabled: false` with a non-empty `reason`
  (test enforced).
- Placeholder preview body equals the canonical placeholder string and
  carries no real download path (test enforced).
- No `https://` and no `E-###` citation tokens appear anywhere in the
  serialized view (test enforced).

## What is NOT yet wired

- No edit / regenerate flow; future PDEL7 owns those actions.
- No download / export pipeline; PDEL5b / PDEL6 own this.
- No Steward approval state machine; approval action is deferred.
- No live evidence registry binding; evidence usable flag is `false`
  for any artifact whose `evidenceUsability` is not `usable`.
- Markdown bodies are rendered as `<pre>` only; the markdown → HTML
  renderer is deferred.

## What is deferred

- **PDEL5b · download / export** — flips download action to enabled
  and binds a presigned URL when the export slice lands.
- **PDEL6 · canvas integration** — wires real route-level `?artifact=`
  selection state and intersection with the steward gate.
- **PDEL7 · edit / regenerate** — wires the editor and regenerate
  flow once the model invocation seam is live.
- **Evidence registry binding** — promotes `evidenceUsable: false →
  true` when E-id citations are wired (PDEL / ADM3 lifecycle).

## Honest fallbacks used

- HTML preview body is escape-only deterministic content composed
  from seed strings; it never embeds operator-supplied HTML.
- Non-renderable artifacts route to the canonical placeholder string
  (`"Preview not yet rendered for this artifact type."`).
- Action buttons honestly disclose their deferred state via
  `disabled`, `aria-disabled="true"`, and a sub-label `reason`.
- Module imports nothing from Source UI, Sentinel / Atlas / Nexus /
  Agent runtime, legacy `/programs`, `mock.ts`, auth, or supabase.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/program-artifact-canvas.test.ts` — pass
- `npx jest src/__tests__/integration/programs/program-artifact-inventory.test.ts` — pass
- `npx jest src/__tests__/integration/programs/programs-canonical-surface.test.ts` — pass
- `npm run build` — pass

## Status

Code complete. Pending founder review.
