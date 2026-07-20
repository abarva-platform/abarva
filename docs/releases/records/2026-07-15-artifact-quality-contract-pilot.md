# 2026-07-15-artifact-quality-contract-pilot — Phase-appropriate depth for Moves deliverables (pilot: Target State Architecture + Business Case)

## Release ID

`2026-07-15-artifact-quality-contract-pilot`

## Status

`released`

## Plain-English Summary

The concern behind this change: a fix that makes every generated Moves document shorter
would solve the "41-page Charter" problem while creating a worse one — thin, generic
artifacts that don't read as consulting-grade work. The correction is phase-appropriate
depth, not universal brevity: some artifacts should be concise commitment instruments
(a Charter), others must be substantial, visual, and analytical (a Target State
Architecture). This release gives the Moves deliverable orchestrator a per-artifact-type
depth band (a floor AND a ceiling, not just a floor), narrative-spine requirements (a
document must argue a case — central tension, options considered, evidence gaps stated —
not just fill sections), a real three-view architecture requirement (conceptual/logical/
physical, plus an explicit agent-orchestration flow) for Target State Architecture, and a
persistent "AI-generated working draft — not approved" status block on every generated
artifact. It also fixes a real, previously-silent bug found during this work: Target State
Architecture's dedicated section/exhibit structure was registered under the wrong key and
was never actually used.

## Layer Impact

- **global-control-lane**: the Deliverable Intelligence Orchestrator
  (`src/lib/deliverables/orchestrator/*`) is shared infrastructure behind Moves'
  "Approve & Build" generation path. This release changes prompt construction, the
  quality gate, and the rendered output format for every module that goes through it
  (moves/source/tower/intelligence), though the new per-type depth bands are populated
  only for Moves artifact types in this pilot — every other (module, deliverableType)
  falls back to the unchanged default `QualityBar`, so this is additive, not a behavior
  change, for anything not explicitly listed in `quality-bar-registry.ts`.

## Client Applicability

- All clients: yes — the orchestrator is shared infrastructure; the status-block
  disclaimer and the (unchanged-by-default) quality gate apply to every generated
  artifact across every tenant.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none — this changes prompt construction and rendering, not a gated
  capability; there is nothing to roll out gradually per tenant.

## Changes Included

- **Real bug fix (found during this work)**: `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` —
  the Moves Target State Architecture structure was registered as
  `deliverableType: "target_architecture"`, but the real gate-artifact key used
  throughout `governance.ts`/`deliverable-registry.ts` is `"target_state_architecture"`.
  `getDeliverableStructure()` is an exact-string lookup, so this mismatch meant every
  real Target State Architecture generated via "Approve & Build" silently fell through
  to the generic 12-section `defaultBrief()` fallback — which has **zero** expected
  exhibits — regardless of any other work on this artifact type. Fixed the key; added a
  regression test (`brief-library.test.ts`) that asserts the exact key resolves and the
  old one does not.
- `src/lib/deliverables/orchestrator/types.ts` — extended `QualityBar` with
  `targetBodyWordsMax` (a real ceiling; today there was a floor everywhere and no
  ceiling anywhere) + `enforceMaxAsBlocker` (concise artifacts block on it, substantial
  ones only warn) + narrative-spine flags (`requiresCentralTension`,
  `requiresOptionsConsidered`, `requiresEvidenceGapsNoted`). Extended `ExpectedExhibit.kind`
  with `conceptual_architecture` / `logical_architecture` / `physical_architecture` /
  `agent_orchestration` (previously only generic `diagram`/`flow`/etc.), plus
  `requiredElements`/`legendRequired` so a diagram exhibit states exactly what it must
  show, not just "include a diagram." Extended `DeliverableArtifactBrief` with
  `prohibitedContent` (the purpose-boundary control, positive-statement sibling of the
  existing `forbiddenSectionTopics`).
- `src/lib/deliverables/orchestrator/quality-bar-registry.ts` (new) — per-(module,
  deliverableType) `QualityBar` overrides. Charter: ~4-7 pages, ceiling enforced as a
  blocker (this is the artifact the "41-page" complaint was actually about). Business
  Case: ~12-20 pages, narrative-spine required, ceiling is a warning only. Target State
  Architecture: ~20-35 pages, narrative-spine required, ceiling is a warning only — this
  is deliberately NOT squeezed by a brevity rule. Discovery Report / Operating Model /
  Roadmap / Handoff Pack also given real bands. Everything else keeps today's
  floor-only default unchanged.
- `src/lib/deliverables/orchestrator/build-request.ts` — now resolves the `QualityBar`
  from the new registry instead of a single hardcoded object shared by every artifact
  type.
- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts` — Target State
  Architecture gets four required exhibits (conceptual/logical/physical/agent
  orchestration) with the exact required elements from the design spec (personas,
  capabilities, channels, trust boundaries for conceptual; experience/orchestration/
  agents/models/context/integration/data/identity/observability/governance/HITL for
  logical; cloud boundaries/regions/networks/runtimes/endpoints/data platforms/queues/
  secrets/CI-CD/private endpoints/resilience for physical, legend required; the full
  trigger→router→planner→context→tool→model→gate→approval→action→trace flow for agent
  orchestration, legend required) plus four matching sections that narrate them. Added
  `prohibitedContent` (purpose boundary) to Target State Architecture and Business Case.
  Strengthened the Business Case's executive-summary intent to require one coherent
  investment argument, not a list of disconnected subsection summaries.
- `src/lib/deliverables/orchestrator/artifact-brief-registry.ts` — `composeBrief` now
  merges deliverable-type-specific exhibits (new) with archetype-specific exhibits
  (existing), additively. Previously exhibits came ONLY from the archetype pack, so a
  Business Case and a Target State Architecture under the same archetype got the
  identical exhibit list — architecturally wrong for a per-type diagram requirement.
- `src/lib/deliverables/orchestrator/quality-validator.ts` — added the ceiling check
  (mirrors the existing floor check; blocks or warns per `enforceMaxAsBlocker`) and
  three narrative-spine warnings (central tension / options considered / evidence gaps
  noted) — advisory only, never blocking, since the detection is fuzzy heuristic text
  matching, not a structural fact like a missing table.
- `src/lib/deliverables/orchestrator/prompt-builder.ts` — added the exact "do not
  optimize for minimum length OR maximum length — optimize for decision usefulness..."
  instruction (only fires when a type has a real depth band), a narrative-spine
  instruction block driven by the new `QualityBar` flags, a purpose-boundary instruction
  from `prohibitedContent`, and expanded the "EXPECTED EXHIBITS" prompt line to state
  each exhibit's required elements (and legend requirement) explicitly instead of just
  its title.
- `src/lib/deliverables/orchestrator/renderers.ts` (the real, confirmed render path for
  the orchestrator's `RenderableDeliverable` — traced via `generate-phase/route.ts` →
  `persistence.ts` → `./renderers`) — added the required document-status block (Generated
  by / Current status / Required next steps / the "must not be treated as approved..."
  line) to both the DOCX cover page and the HTML preview cover, and the matching footer
  disclaimer to both. This block is unconditional — every generated artifact carries it
  until a real, named human-approval record exists (which does not yet exist as a data
  model; see Known Gaps).
- `src/lib/programs/deliverables/orchestrated/render-html.ts` — a second, separately-used
  renderer (different route family: `current-state/deliverable/board`,
  `.../orchestrate`, and the Source file-cabinet bridge). Added the same status block for
  consistency, since it also renders real AI-generated deliverables.
- Tests: `quality-bar-registry.test.ts` (new), `quality-validator-size-range.test.ts`
  (new — ceiling blocker-vs-warning behavior, narrative-spine advisory-only behavior),
  `brief-library.test.ts` (extended — the key-mismatch regression test, the exhibit-merge
  test proving a Business Case does NOT get architecture exhibits under the same
  archetype, the purpose-boundary passthrough test), `renderers.test.ts` (extended — the
  disclaimer appears in both the HTML preview and, via a real unzipped `.docx`, the DOCX
  cover and footer).

## QA / Validation

- Root-caused the Target State Architecture key-mismatch bug by direct code reading (not
  assumption) — confirmed `getDeliverableStructure` is an exact-string lookup and the
  registered key did not match the real gate-artifact key used elsewhere in the system.
- Corrected course mid-investigation on two claims from an initial research pass that
  turned out to be inaccurate on direct verification: (1) the orchestrator does NOT
  already have a `maxBodyWords` hard-cap mechanism (there was only ever a floor, no
  ceiling, anywhere) — this release adds the ceiling, it does not replace an existing
  one; (2) diagram rendering is NOT purely LLM-freehand SVG with no structure — a real,
  deterministic SVG renderer already exists (`svgFlowExhibit`/`svgMatrixExhibit`/
  `svgTimelineExhibit` in `renderers.ts`, keyed by exhibit kind) and the new architecture
  exhibit kinds render through it today (via the flow-diagram case) without further code.
- `npx jest src/lib/deliverables/orchestrator/__tests__ src/lib/programs/deliverables/orchestrated/__tests__` —
  161 tests (up from 141), 157 passed / 4 failed — the same 4 pre-existing failures
  present on a clean baseline (`git stash` before/after comparison, byte-identical
  failure set both times): a fixture cover-name mismatch (`/SkyHarbor Air/` vs
  `Airline Demo`) unrelated to this change, in 3 files this change did not touch the
  fixture data for.
- `npx eslint` on all 8 changed/new source files and 4 changed/new test files — 0 errors.
- Local `npx tsc --noEmit -p .` crashes on this machine with a native V8 stack trace — a
  known, previously-documented environment quirk unrelated to any specific change; CI's
  "Typecheck + reasoning-layer tests" check is authoritative here.
- `git diff --check` — clean.

## Rollout Plan

Merge to `main` via the protected PR lane (squash merge). No feature flag, no migration,
no worker job. This changes shared orchestrator behavior directly (prompt text, quality
gate, render output) rather than being gated per tenant — every subsequent "Approve &
Build" generation across every module picks up the new status block and, for the 7
Moves artifact types now in `quality-bar-registry.ts`, the new depth band and narrative
requirements. Deploy proceeds through the repo-owned `aca-main-deploy` workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. PR #5092's own
  merge-triggered run ([29713862621](https://github.com/abarva-platform/abarva/actions/runs/29713862621))
  was cancelled by the workflow's concurrency control when PR #5093 merged immediately
  after it — GitHub Actions' `cancel-in-progress` behavior supersedes a queued run for an
  older commit once a newer one on the same branch is triggered. The next run
  ([29713948186](https://github.com/abarva-platform/abarva/actions/runs/29713948186),
  headSha `06516c51eb0822a1cfe4447bb99664d92fe10e84`) completed successfully and deploys
  a commit one ahead of PR #5092's merge commit
  (`bc49f63af34d0659ccf569ffa10a94fe4883278a`) — confirmed via
  `git merge-base --is-ancestor bc49f63af... origin/main` that the merge commit is a real
  ancestor of the deployed commit, so this deploy carries PR #5092's changes.
- Shared runtime mutators: none used directly; deploy proceeded entirely through the
  standard workflow.
- Approved image digest:
  `acrabarvalab001.azurecr.io/abarva/web@sha256:95a3682e86455c02cd7fe3614091f6a5c5ab094b47527355556285f3feaca87f`.
- ACA runtime invariant: **proven.** `az containerapp show -g rg-abarva-controlplane-lab-eastus
  -n ca-abarva-web-lab-eastus` confirms `properties.template.containers[0].image` and the
  100%-traffic revision (`ca-abarva-web-lab-eastus--m06516c51`, `weight: 100`) both resolve
  to the digest above.
- Worker image invariant: **proven.** `job-abarva-deliv-worker` and
  `job-abarva-deliv-worker-event` both resolve to the same digest.
- Feature/env flag update path: N/A — no flag.
- Live signed-in proof: **partially performed.** Signed in and navigated `app.abarva.ai`
  post-deploy — the app loads and functions normally (no regression from this change),
  and drilled into a real Move at P3 "Choose the Approach" (Member AI Assist,
  `healthcare_provider-member-2026`). That Move had not yet generated any P3
  deliverables (0 of 2, 0% ready) — reaching a live "Approve & Build" run would require
  progressing it through Compare Options / Record Decision / Design Canvas first, which
  was not done in this pass. **The specific claim not yet proven live**: a real generated
  Target State Architecture or Business Case rendering the new document-status
  disclaimer and architecture exhibits on `app.abarva.ai`. This remains an open item —
  see Known Gaps.

## Rollback Plan

Revert the merge commit (single self-contained PR, no migration, no data change). Every
change here is additive to existing types/fallbacks (the default `QualityBar` for
un-registered artifact types is unchanged; `defaultBrief()` is unchanged for artifact
types with no dedicated structure) — a revert returns exactly to today's behavior with
no cleanup required.

## Audit Evidence

- PR: [abarva-platform/abarva#5092](https://github.com/abarva-platform/abarva/pull/5092),
  20/20 required checks passed, squash-merged as `bc49f63af34d0659ccf569ffa10a94fe4883278a`.
- CI/deploy run: [aca-main-deploy #29713948186](https://github.com/abarva-platform/abarva/actions/runs/29713948186)
  (deploying commit `06516c51e`, one ahead of and including the #5092 merge commit),
  conclusion `success`.
- Deployment: ACA revision `ca-abarva-web-lab-eastus--m06516c51` in
  `rg-abarva-controlplane-lab-eastus`, 100% ingress traffic, image digest
  `sha256:95a3682e86455c02cd7fe3614091f6a5c5ab094b47527355556285f3feaca87f`.
- Live proof: app-loads/no-regression confirmed on `app.abarva.ai` post-deploy. A live
  generation-cycle proof (real Target State Architecture or Business Case showing the
  new exhibits/disclaimer) was not completed in this pass — tracked as a Known Gap below,
  to be picked up the next time a Move reaches "Approve & Build" at P3/P4 with real
  evidence.

## Known Gaps

- **Live generation-cycle proof not yet performed.** Deploy is confirmed live and the app
  loads/functions normally, but a real Target State Architecture or Business Case has not
  yet been generated on `app.abarva.ai` post-deploy to visually confirm the new
  architecture exhibits and document-status disclaimer render correctly end-to-end. The
  Move checked in this pass (Member AI Assist, P3) had not yet reached "Approve & Build."
  Follow up the next time a real Move progresses through P3/P4 with evidence.
- **Named, multi-role, staged approval lifecycle does not exist** (Draft → Reviewed →
  Approved → Rejected, with separate Business/Technology/Finance/Risk-Security approver
  roles, and a link from an AI-generated draft to a separately-uploaded approved
  version). Confirmed during this work: the only real state today is a single
  `draft`/`signed_off`-style status field with one actor
  (`src/lib/programs/mutations.ts`'s `completeDeliverable`). The status block this
  release adds is a real, always-visible disclaimer, but it is text on the document, not
  a tracked workflow state — building the real approval-record entity, the multi-role
  sign-off tool surface, and the gate-engine integration is a separate, larger piece of
  work, out of scope for this pilot.
- **Session/workshop guidebooks are not yet a first-class deliverable** in the sense
  described in the design conversation (multiple sessions per phase with facilitator
  scripts, a stakeholder-pair alignment matrix, standalone reusable Decision Log / Open
  Issue Log / Assumption Register templates). The existing `move-phase-playbook.ts` /
  `design-session-pack.ts` system is real but thinner than that — one session per phase
  by default, informal `captureTemplate` prose rather than typed reusable templates, no
  stakeholder-pair alignment concept. Extending it is a separate, scoped follow-up.
- **The architecture-view diagrams render through the existing generic flow-diagram SVG
  renderer**, not a dedicated layered/swimlane visual matching conceptual vs. logical vs.
  physical structure. This works today (real SVG, not placeholder) but a purpose-built
  renderer for these four exhibit kinds — with actual swimlanes and the physical-layer
  legend (illustrative/selected/client-confirmed) rendered as a visible key, not just
  instructed in the prompt — would be a natural, contained next step.
- **Narrative-spine and diagram-required-element enforcement is prompt instruction +
  fuzzy heuristic warning, not structural validation.** The model is told exactly what
  each architecture exhibit must contain and told to argue a coherent case; the
  validator can detect the ABSENCE of central-tension/options/evidence-gap language
  as a warning, but cannot verify a diagram actually contains its required elements
  (there is no structured node/edge data to check against, only free-text exhibit
  descriptions). This is consistent with how `visual-artifact-contract.ts`/`golden-bar.ts`
  already work for the sibling (non-orchestrator) generation pipeline, but is worth
  naming as a real limit, not implying stronger enforcement than exists.
- **Pilot scope is 7 Moves artifact types** (charter, business_case,
  target_state_architecture, discovery_report, operating_model, roadmap, handoff_pack);
  Source/Tower/Intelligence deliverable types and the remaining Moves types keep today's
  uniform floor-only default until extended in a follow-up.
