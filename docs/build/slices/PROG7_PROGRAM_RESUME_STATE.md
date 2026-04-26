# PROG7 · Program Resume State

Slice ID: PROG7
Slice name: Save / Stop / Resume Program State Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)

Operationalizes the **save / stop / resume** lifecycle named in the
PF2 Program Phase Workspace contract and the MW1 Maestro Workshop
Intelligence contract — but **without persistence**. The slice ships
a deterministic read model that answers the question "If I closed
this program last session, where do I pick up?" derived entirely from
the canonical seed (programs, deliverables, workshop readiness,
meeting notes capture).

The Maestro is still the only voice that decides what to resume; the
platform's job is to give the Maestro a known-good shape so the
resume card on the program detail surface is honest, deterministic,
and re-renderable across server requests without divergence.

## What changed

- New module
  [src/lib/programs/program-resume-state.ts](../../../src/lib/programs/program-resume-state.ts):
  - Public types: `ProgramResumeState`, `ProgramResumeCheckpoint`,
    `ProgramResumeSource`, `ProgramResumeRecommendation`,
    `ProgramResumeOpenItem`, `ProgramResumeOpenItemKind`,
    `ProgramResumeConfidence`, `ProgramResumeSummary`.
  - Public helpers:
    - `buildProgramResumeState(tenant, program)` — pure projection
      of a single program's seed into a resume-state record.
    - `buildAllProgramResumeStates(tenants)` — convenience iterator.
    - `summarizeProgramResumeState(states)` — aggregate roll-up
      (totals, byConfidence, perTenant) for the Atlas readout.
    - `getNextResumeAction(state)` — returns the deterministic next
      action label.
    - `getBlockedResumeItems(state)` — returns the union of every
      open item whose status is `blocked` (does NOT promote
      `unknown` items to blocked).

- New tests
  [src/__tests__/integration/programs/program-resume-state.test.ts](../../../src/__tests__/integration/programs/program-resume-state.test.ts):
  40 deterministic tests covering determinism, every demo program
  has a record, shape and id format, last-active workshop checkpoint,
  last-viewed artifact, open items (actions / questions / evidence
  gaps / gate checks / drafts), next recommended action presence,
  blocked items helper, summary reconciliation, no fabricated dollar
  amounts, no fake `E-###` citations, no fake completed decisions,
  honest `unknown` status surfacing, and module hygiene (no banned
  imports, no `Date.now` / `Math.random` / `new Date(` / `fetch(`,
  no Anthropic / OpenAI runtime, no placeholder strings).

## Tracked fields

| Field | Source | Notes |
|---|---|---|
| `lastActivePhase` | `getCurrentCanonicalPhase` | Always 1 of 6 canonical phases. |
| `lastActiveWorkshop` | `buildNextRecommendedWorkshop` | `null` when the program produces no workshops. |
| `lastViewedArtifact` | First-pass: required + current phase + non-stub. Second pass: current phase. Third pass: first deliverable in canonical order. | `null` when the program has no deliverables. |
| `openActions` | `synthesizeMeetingNotes(...).topActionItems` | Only `open` and `in_progress` states; capped per MW4 synthesis. |
| `openQuestions` | `synthesizeMeetingNotes(...).unresolvedQuestions` | `status: 'blocked'` when the question carries a `blocks` flag other than `'none'`. |
| `unresolvedEvidenceGaps` | `deriveEvidenceCandidatesFromMeetingNotes` plus a `registry-not-seeded` honest-fallback row when readiness signals `not_seeded`. | The honest-fallback row carries `status: 'unknown'`. |
| `pendingGateChecks` | `buildCanonicalHardGateStrip` | Gates with `missing_inputs` or `blocked` → `status: 'blocked'`; gates that are `not_wired` and not yet passed → `status: 'unknown'`. |
| `draftDeliverables` | `program.deliverables.filter(d => d.status === 'draft')` | Stable order by phase + code; id keyed by `instanceKey` (unique). |
| `nextRecommendedAction` | Priority chain: blocked-gate workshop link → next-recommended workshop → first draft deliverable → program detail page. | Always non-empty; routes to `program.routePath` for active programs. |
| `resumeConfidence` | Pure rule from signal density. | `'low' / 'medium' / 'high'`; never a percentile. |

## Confidence band rule

Pure deterministic rule — no probability, no time, no randomness:

- `'high'` — workshop checkpoint, last-viewed artifact, ≥1 open
  action, AND ≥1 steward-ready signal all present.
- `'low'` — no workshop checkpoint OR (no artifact AND no open
  actions).
- `'medium'` — everything else.

## Honesty invariants

- Every state carries `createdFrom: 'deterministic_program_seed'`.
- Every state id is `prog-resume:<tenantKey>:<programSlug>` and is
  unique across the portfolio.
- No string field invents a dollar amount, a fake `E-###` evidence
  citation, or a "decision signed" / "decision approved" claim.
- Items the seed cannot derive surface as `status: 'unknown'` with an
  explicit honest reason — the test suite asserts at least one
  `unknown` status appears across the portfolio (driven by the
  `not_seeded` evidence registry signal).
- Confidence labels are pure structured strings — never percentages
  or probabilities.
- No timestamps, no dates, no durations are emitted — labels are
  structured (`'workshop_session'`, `'pending'`, etc.).

## What is NOT yet wired

- **No persistence.** Resume state is reproduced on every read; no
  database row, no `supabase` call, no audit log.
- **No live save trigger.** No "Stop session" button, no auto-save,
  no transcript ingestion. The Maestro's session boundary is not
  recorded.
- **No live resume runtime.** No server-side state machine watches
  workshop activity. The deterministic seed is the only source.
- **No model-backed synthesis.** The synthesis bridge uses MW4's
  deterministic synthesizer; live model summarization is deferred.
- **No UI surface.** The resume card lands in a follow-up slice;
  this slice ships only types + helpers.

## What is deferred

- **Live save / stop / resume persistence** — once the auth, audit,
  and persistence slices land, the read model becomes the projection
  over the persisted lifecycle events.
- **Live deterministic extractors** — replace the seed-driven
  open-action / open-question composition with text-pattern
  extractors over real captured raw text.
- **Live model synthesis** — replace `synthesizeMeetingNotes` with
  a model-backed summarization once the gateway and governance
  slices land.
- **Resume UI card** — a follow-up slice mounts the read model on
  the canonical Programs detail surface and the Workshop Mode shell.

## Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/programs/program-resume-state.test.ts` — 40 passed.
- `npx jest src/__tests__/integration/programs/programs-canonical-surface.test.ts` — pass (no regression).
- `npx jest src/__tests__/integration/programs/workshop-readiness.test.ts` — pass (no regression).
- `npm run build` — pass.

## Status

Code complete. Pending founder review.
