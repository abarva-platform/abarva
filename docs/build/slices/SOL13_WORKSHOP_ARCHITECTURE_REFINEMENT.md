# SOL13 · Workshop-to-Architecture Refinement

Slice ID: SOL13
Slice name: Workshop-to-Architecture Refinement
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)

Pure deterministic library that turns structured MW4 meeting note
captures into proposed architecture refinements. Operationalizes the
SOL8 Solution Intelligence Canvas section on dynamic refinement and the
MW1 Maestro Workshop Intelligence Contract section on after-workshop
synthesis, focused on architecture-level proposals (rather than the
program-level proposals MW5 already produces).

**Library only — does not invoke models, does not write any
architecture draft, does not persist, and never auto-applies a
proposal. The Maestro confirms before any downstream architecture
draft module would consume a proposal.**

## What changed

- New module
  [src/lib/solutions/workshop-architecture-refinement.ts](../../../src/lib/solutions/workshop-architecture-refinement.ts):
  - Public unions:
    - `ARCHITECTURE_REFINEMENT_TYPES` — the seven canonical refinement
      types: `add_component`, `remove_component`, `modify_component`,
      `add_assumption`, `add_risk`, `add_evidence_gap`,
      `change_section`.
    - `ARCHITECTURE_TARGET_SECTIONS` — the nine target sections within
      a candidate solution architecture (`components`,
      `integration_boundaries`, `data_foundation`,
      `governance_controls`, `assumptions`, `risks`, `evidence_gaps`,
      `operating_model`, `value_framing`).
  - Public types: `ArchitectureRefinementType`,
    `ArchitectureTargetSection`, `ArchitectureRefinementSource`,
    `ArchitectureRefinementProposal`, `ArchitectureRefinementSummary`.
  - Public helpers:
    - `deriveArchitectureRefinementsFromMeetingNotes(notes)` — flat
      list of proposals in deterministic order (component changes,
      then assumptions, risks, evidence gaps, section changes).
    - `summarizeArchitectureRefinements(proposals)` — counts per
      refinement type and per target section, with the
      `appliedProposals: 0` invariant.
  - Per-type derivation helpers exported for reviewers / future tests:
    `deriveAddComponentProposals`, `deriveRemoveComponentProposals`,
    `deriveModifyComponentProposals`, `deriveAssumptionProposals`,
    `deriveRiskProposals`, `deriveEvidenceGapProposals`,
    `deriveChangeSectionProposals`.

- New tests
  [src/__tests__/integration/solutions/workshop-architecture-refinement.test.ts](../../../src/__tests__/integration/solutions/workshop-architecture-refinement.test.ts):
  35-test deterministic suite covering:
  - All seven refinement types representable on the public union.
  - Every emitted proposal carries `proposed: true`,
    `status: 'proposed'`, and the canonical `createdFrom` marker
    `deterministic_workshop_architecture_refinement_seed`.
  - `summarizeArchitectureRefinements(...).appliedProposals === 0`
    invariant.
  - Structured notes produce expected proposals (one per refinement
    type) and skip non-matching signals (divergent alignment,
    phase-advancement-only open question, empty notes list).
  - Byte-equal output across repeated calls and stable proposal IDs.
  - Summary reconciliation against the proposal list.
  - No DB writes assertion via regex `/await\s+db\./`, plus no
    `prisma`, no remote-storage-backend, no SQL `INSERT INTO` /
    `UPDATE ... SET` / `DELETE FROM` patterns in the module source.
  - Module hygiene (no `Date.now`, `Math.random`, `new Date(`,
    `fetch(`, `anthropic`, `openai`, `useState`, `useEffect`, no
    placeholder copy, no forbidden imports).
  - No fabricated dollar values in serialized proposals.

## Public surface

```ts
deriveArchitectureRefinementsFromMeetingNotes(
  notes: readonly MeetingNoteCapture[],
): readonly ArchitectureRefinementProposal[];

summarizeArchitectureRefinements(
  proposals: readonly ArchitectureRefinementProposal[],
): ArchitectureRefinementSummary;

ARCHITECTURE_REFINEMENT_TYPES;
ARCHITECTURE_TARGET_SECTIONS;
```

Every proposal carries:

- `id`, `refinementType`, `proposed: true`, `status: 'proposed'`,
- `source` (programKey, sourceNoteId, sourceWorkshopType,
  sourceWorkshopOrdinal),
- mirrored `sourceNoteId` and `sourceWorkshopType` (per the SOL13
  contract),
- `targetSection`,
- optional `componentLabel`,
- `description`, `rationale`,
- `createdFrom: 'deterministic_workshop_architecture_refinement_seed'`.

## Derivation rules

| Refinement type | Trigger |
|---|---|
| `add_component` | Decision narrative contains an add-component keyword phrase (`add component`, `introduce component`, `add a service`, `introduce service`, `add a vendor`, `introduce vendor`, `add layer`, `add gateway`, `introduce gateway`). Targets `components`. |
| `remove_component` | Decision narrative contains a remove-component keyword phrase (`remove component`, `retire component`, `deprecate component`, `drop component`, `remove vendor`, `retire vendor`, `eliminate component`). Targets `components`. |
| `modify_component` | Decision narrative contains a modify-component keyword phrase (`modify component`, `change component`, `reconfigure component`, `replace component`, `swap component`, `tune component`, `redirect component`) OR the decision has `affectsDeliverableKey`. Skipped when the decision is already classified as add or remove. Targets `components`. |
| `add_assumption` | Stakeholder alignment with state `aligned` or `pending`. Targets `assumptions`. |
| `add_risk` | Every captured risk. Targets `risks`. |
| `add_evidence_gap` | Open question with `blocks ∈ {gate_signoff, deliverable_approval}` OR evidence candidate with `needsCapture: true`. Targets `evidence_gaps`. |
| `change_section` | Decision in a workshop type that maps to a non-component section (`data_foundation_assessment` → `data_foundation`, `governance_risk_review` → `governance_controls`, `operating_model_alignment` → `operating_model`, `value_framing` → `value_framing`, `architecture_solution_design` → `integration_boundaries`); skipped when the decision already produced a component proposal or affects a deliverable. |

Output ordering across the proposal list is deterministic: component
add → component remove → component modify → assumptions → risks →
evidence gaps → section changes. Within each bucket, notes are walked
in input order and items within a note in their insertion order.

## Hard rules

- No imports from `src/lib/source/**`, `src/lib/nexus/**`,
  `src/lib/sentinel/**`, `src/lib/atlas/**`, `src/lib/agent/**`,
  `src/lib/auth/**`, `src/app/programs/**`, `src/lib/programs/mock`,
  no `supabase`.
- No `Math.random`, no clock reads, no live model calls, no `fetch`,
  no React hooks, no placeholder copy (`Coming soon`, `TBD`,
  `Lorem ipsum`).
- Every proposal is `proposed: true`. The module never returns
  `applied`-shaped records and the summary always reports
  `appliedProposals: 0`.
- `await db.`, `prisma`, supabase-style backends, and SQL
  `INSERT INTO` / `UPDATE ... SET` / `DELETE FROM` patterns are
  asserted absent in the module source by the test suite.
- The module imports the MW4 meeting-notes-capture types and nothing
  else from internal feature folders.

## Validation

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/solutions/workshop-architecture-refinement.test.ts
npx eslint --max-warnings=0 src/lib/solutions/workshop-architecture-refinement.ts src/__tests__/integration/solutions/workshop-architecture-refinement.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

## Acceptance criteria

- Module exports `ArchitectureRefinementProposal`,
  `ArchitectureRefinementType`, `ArchitectureRefinementSource`,
  `ArchitectureRefinementSummary`, `ArchitectureTargetSection`,
  `ARCHITECTURE_REFINEMENT_TYPES`, `ARCHITECTURE_TARGET_SECTIONS`,
  `deriveArchitectureRefinementsFromMeetingNotes`, and
  `summarizeArchitectureRefinements` as the canonical contract.
- All 7 refinement types (`add_component`, `remove_component`,
  `modify_component`, `add_assumption`, `add_risk`,
  `add_evidence_gap`, `change_section`) are representable on the
  public union and are produced by a single deterministic fixture in
  the test suite.
- Every proposal carries `proposed: true`, `status: 'proposed'`,
  `sourceNoteId`, `sourceWorkshopType`, `targetSection`, `rationale`,
  and `createdFrom: 'deterministic_workshop_architecture_refinement_seed'`.
- Structured notes produce the expected proposals: add-component
  keyword → `add_component`; remove-component keyword →
  `remove_component`; deliverable-affecting decision →
  `modify_component`; aligned/pending alignment → `add_assumption`;
  every risk → `add_risk`; gate-signoff / deliverable-approval open
  question and needs-capture evidence → `add_evidence_gap`;
  data-foundation / governance / operating-model / value-framing /
  architecture-design workshop decision → `change_section`.
- `deriveArchitectureRefinementsFromMeetingNotes` is byte-equal across
  repeated calls for the same input and IDs are stable.
- `summarizeArchitectureRefinements` reconciles `totalProposals`,
  per-type counts, per-section counts, and the
  `appliedProposals: 0` invariant against the proposal list.
- Module imports the MW4 meeting-notes-capture types and nothing from
  Sentinel / Atlas / Nexus / Agent runtime, Source UI, legacy
  `/programs`, `mock.ts`, auth, or supabase; module contains no
  `Math.random` / clock reads / `fetch(` / `anthropic` / `openai` /
  `useState` / `useEffect`; no `Coming soon` / `TBD` / `Lorem ipsum`.
- No DB writes: module source contains no `await db.`, no `prisma`,
  no supabase-style backend, and no SQL `INSERT INTO` / `UPDATE ... SET`
  / `DELETE FROM` patterns.

## Notes

- SOL13 is a *library*, not a UI. It is consumed by the future
  Solution Intelligence Canvas refinement loop and by Nexus when
  composing per-tenant architecture-draft proposals. SOL13 itself
  does not render, persist, or apply anything.
- The seven refinement types cover the architecture-level surface
  area the SOL8 contract names; program-level proposals (actions,
  risks, open questions, evidence candidates, deliverable updates,
  gate impacts) remain MW5's responsibility.
- The keyword sets are intentionally conservative; the reviewer
  confirms wording before any architecture draft is updated. The
  Maestro never auto-applies an SOL13 proposal.
- SOL13 lands ahead of the SOL10 architecture draft read model and
  the SOL12 architecture deliverable renderer. When SOL10 lands, the
  refinement loop will consume SOL13 proposals as the canonical
  refinement-input shape.
