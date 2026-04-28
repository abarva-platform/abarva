# PROG25 · Workshop notes to actions/deliverables plan

## Objective

Add a workflow-oriented plan panel inside the Program Workshop tab that turns deterministic workshop-note context into execution guidance:

- `Known`
- `Missing`
- `Blocked`
- `Next action`

The panel must remain deterministic and read-only, with an explicit caveat about deferred live capabilities.

## In scope

- `src/lib/programs/workshop-notes-action-plan-view.ts`
- `src/components/programs/WorkshopNotesActionPlanPanel.tsx`
- `src/components/programs/ProgramDetailPage.tsx` (Workshop tab wiring only)
- `src/__tests__/integration/programs/programs-detail-prog25-workshop-notes-plan.test.ts`

## Out of scope

- Model calls
- Upload/parsing pipelines
- Persistence or write paths
- Workflow engine or automation dispatch
- Broad Programs UI redesign

## Behavior summary

1. Build a deterministic workshop plan view model from existing program detail context + deterministic workshop note seed.
2. Surface three execution lanes:
   - `Known` (confirmed actions/completed deliverables)
   - `Missing` (unmet criteria/pending inputs/open questions)
   - `Blocked` (blocked deliverables/gate impacts/phase blocker notes)
3. Surface a clear `Next action` plus a deliverable-focused next action.
4. Show honest caveat text: deterministic seed only; live ingestion/extraction/parsing/persistence/dispatch deferred.

## Validation commands

- `npx jest src/__tests__/integration/programs/programs-detail-prog25-workshop-notes-plan.test.ts`
- `npx eslint --max-warnings=0 src/lib/programs/workshop-notes-action-plan-view.ts src/components/programs/WorkshopNotesActionPlanPanel.tsx src/components/programs/ProgramDetailPage.tsx src/__tests__/integration/programs/programs-detail-prog25-workshop-notes-plan.test.ts`
- `npx tsc --noEmit --pretty false`
- `git diff --check`
