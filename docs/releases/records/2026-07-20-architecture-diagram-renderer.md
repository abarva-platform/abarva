# 2026-07-20-architecture-diagram-renderer — Dedicated layered/swimlane rendering for architecture-view exhibits

## Release ID

`2026-07-20-architecture-diagram-renderer`

## Status

`released`

## Plain-English Summary

The four architecture-view exhibit kinds added in the artifact-quality-contract pilot
(`conceptual_architecture`, `logical_architecture`, `physical_architecture`,
`agent_orchestration`) previously rendered through the same generic flow-diagram box
used for everything else — a real, working SVG, but not one that visually distinguished
"what is it conceptually" from "how is it logically composed" from "what exactly gets
deployed." This release gives each of the four kinds its own layout: conceptual and
logical render as labelled swimlanes matching their required-element groupings; physical
adds a visible legend distinguishing illustrative, selected, and client-confirmed
services; agent orchestration renders as the explicit 11-step trigger→router→planner→
context→tool→model→evidence→gate→approval→action→trace flow, with the policy-gate and
human-approval steps visually called out — not a single floating "AI agent" box.

## Layer Impact

- **global-control-lane**: `src/lib/deliverables/orchestrator/renderers.ts` is shared
  rendering infrastructure for the Deliverable Intelligence Orchestrator's HTML preview
  output, used across every module (moves/source/tower/intelligence). This change only
  adds new rendering branches for the four new exhibit kinds — every existing exhibit
  kind (`matrix`, `heatmap`, `timeline`, `diagram`, `flow`, `chart`) renders through
  exactly the same code path as before, unchanged.

## Client Applicability

- All clients: yes — shared rendering infrastructure, no gate.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/orchestrator/renderers.ts`:
  - `svgLayeredArchitectureExhibit(exhibit, lanes, opts)` — renders a labelled swimlane
    stack. Each lane has a fixed label (mirroring the `requiredElements` groupings
    already defined for these exhibit kinds in `briefs/deliverable-structures.ts`) so the
    diagram always shows the full required structure even if the model's own wording
    only touches part of it. The model's free-text exhibit description is split into
    clauses (reusing the existing `exhibitClauses` extraction) and each clause is
    assigned to whichever lane's keywords it best matches.
  - `CONCEPTUAL_LANES` (Personas & Channels / Business Capabilities & Domains / Trust,
    Governance & Outcomes), `LOGICAL_LANES` (Experience & Orchestration / Agents &
    Models / Context, Data & Integration / Identity, Security, Observability &
    Governance), `PHYSICAL_LANES` (Cloud Boundaries & Network / Runtime & Model
    Endpoints / Data, Search & Events / Secrets, Monitoring, CI/CD & Resilience).
  - `svgLegendRow` — a small legend (illustrative / selected / client-confirmed, each
    with a distinct marker color), rendered only for `physical_architecture` (via
    `opts.legend`), matching that exhibit's `legendRequired: true` flag from the brief.
  - `svgAgentOrchestrationExhibit` — a dedicated sequential-flow renderer with the fixed
    11-step canonical sequence (not derived from free text, since the sequence itself is
    the point), annotated with the model's own clauses where available, with the
    Policy/Control Gate and Human Approval nodes visually distinguished (different fill/
    border) plus a legend line explaining why.
  - `exhibitHtml`'s dispatch now routes the four new `kind` values to these new
    renderers; every existing kind is unaffected.

## QA / Validation

- New test file `architecture-diagram-renderer.test.ts` (6 tests): each of the four new
  kinds renders its expected lane labels/flow steps; physical carries a legend and
  conceptual/logical do not (confirming the legend is exhibit-kind-specific, not
  universal); the full 11-step agent-orchestration sequence renders with the gate
  distinction; existing kinds (matrix) are confirmed unaffected.
- Manually rendered a sample `RenderableDeliverable` with all four new exhibit kinds and
  screenshotted the output via Playwright to visually confirm the swimlanes/legend/flow
  render legibly and don't overlap — all four came out clean at both full-page and
  zoomed-in resolution.
- `npx jest src/lib/deliverables/orchestrator/__tests__ src/lib/programs/deliverables/orchestrated/__tests__` —
  167 tests (up from 161), 163 passed / 4 failed — the same 4 pre-existing failures
  confirmed on this branch's own baseline before this change (unrelated fixture
  cover-name mismatch).
- `npx eslint` on both changed/new files — 0 errors.
- Local `npx tsc --noEmit -p .` — known, previously-documented environment crash
  unrelated to this change; CI's typecheck check is authoritative.
- `git diff --check` — clean.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). No feature flag, no migration,
no worker job. Deploy proceeds through the repo-owned `aca-main-deploy` workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, run
  [29715096821](https://github.com/abarva-platform/abarva/actions/runs/29715096821)
  (headSha `e9d32443b31392bb19ecc0c2b1c4e149ba853c02`, the #5096 merge commit),
  conclusion `success`.
- Shared runtime mutators: none used directly; deploy proceeded entirely through the
  standard workflow.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:eb101a9d2faca95f86282d58e7e3cab250166aecf88ed7b571e77ea413fbb729`.
- ACA runtime invariant: **proven.** `az containerapp show` confirms the template image
  and the 100%-traffic revision (`ca-abarva-web-lab-eastus--me9d32443`) both resolve to
  the digest above.
- Worker image invariant: **proven.** `job-abarva-deliv-worker` and
  `job-abarva-deliv-worker-event` both resolve to the same digest.
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof: **not yet performed.** The next real Target State Architecture
  generated via "Approve & Build" should visually show the new swimlane/legend/flow
  rendering instead of the old generic flow boxes; this depends on a Move reaching that
  generation step with real evidence, which was not available in this or the prior
  release's live-proof pass either (same known gap, not force-created for this check).

## Rollback Plan

Revert the merge commit (single self-contained PR, no migration, no data change). Every
existing exhibit kind's rendering is untouched; a revert returns the four new kinds to
the generic flow-diagram fallback they used before, with no other change.

## Audit Evidence

- PR: [abarva-platform/abarva#5096](https://github.com/abarva-platform/abarva/pull/5096),
  20/20 required checks passed, squash-merged as `e9d32443b31392bb19ecc0c2b1c4e149ba853c02`.
- CI/deploy run: [aca-main-deploy #29715096821](https://github.com/abarva-platform/abarva/actions/runs/29715096821),
  conclusion `success`.
- Deployment: ACA revision `ca-abarva-web-lab-eastus--me9d32443` in
  `rg-abarva-controlplane-lab-eastus`, 100% ingress traffic, image digest
  `sha256:eb101a9d2faca95f86282d58e7e3cab250166aecf88ed7b571e77ea413fbb729`.
- Live proof: app-loads/no-regression confirmed on `app.abarva.ai` post-deploy. A live
  generation-cycle proof (real Target State Architecture rendering the new swimlane
  diagrams) was not reachable in this pass — same open item as the artifact-quality-
  contract release.

## Known Gaps

- **Exhibits (of any kind — this is not new to this release) are only rendered in the
  HTML preview output, not in DOCX.** `renderDeliverableDocx` never references
  `doc.exhibits` at all — and DOCX is the default output format
  (`outputFormats: ['docx', 'xlsx']` in `build-request.ts`). This means today, even with
  this release's improved diagrams, a client receiving the default DOCX artifact sees no
  visual diagrams at all, only the HTML preview does. Embedding SVG into a `.docx` via
  the `docx` library requires rasterizing to a PNG buffer first — a real, contained,
  separate piece of work, not attempted in this release to keep scope to "give the
  existing HTML exhibit path real per-kind layouts."
- Lane assignment is a keyword-matching heuristic against the model's free-text exhibit
  description, same class of heuristic already used elsewhere in this pipeline
  (`golden-bar.ts`'s exhibit-presence checks) — not a guarantee that every required
  element is substantively covered, only that the visual structure always shows the full
  required lane/step scaffold. A clause that doesn't match any lane's keywords falls
  back to round-robin placement rather than being dropped.
