# Stage Readiness Workbooks Design

Status: Increment 1/2 design baseline.

## Principle

Strategic Moves should ask for only the information needed to complete the next
phase credibly. Approved prior-phase capture, approved artifacts, and approved
evidence are carried forward; the workbook asks only for confirmation, missing
inputs, or evidence gaps.

The workbook is not a new Discovery system. It converges the existing Discovery
Blueprint, evidence-readiness, evidence-need packet, phase-capture, and
next-phase-readiness code paths.

## Existing Capability Audit

| Capability                                      | Current Location                                                               | Status                                    | Reuse Decision                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Discovery evidence families and interview roles | `src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts`              | Live contract used by readiness           | Reuse as the source of required/recommended evidence families.                                 |
| Evidence readiness evaluator                    | `src/lib/programs/discovery/evidence-readiness.ts`                             | Live server-side evaluator                | Reuse for covered/missing evidence state.                                                      |
| Move evidence need packets                      | `src/lib/programs/evidence-readiness/move-evidence-need-packet.ts`             | Live packet builder used by workspace/API | Reuse for owners, formats, examples, next actions, and artifact impact.                        |
| Existing assessment template                    | `src/lib/programs/discovery/assessment-template.ts`                            | Older simple current-state template       | Keep as legacy/simple assessment path; do not extend it into the new shared workbook contract. |
| Existing XLSX renderer                          | `src/lib/programs/discovery/assessment-template-xlsx.ts`                       | Edge renderer for older template          | Reuse style and test pattern, but the new workbook needs hidden metadata and open-item tabs.   |
| Phase capture contracts                         | `src/lib/programs/phase-capture-contract.ts`                                   | Live phase capture contract               | Future prefill source; not duplicated in Increment 1/2.                                        |
| P0/P1 carry-forward                             | `src/lib/programs/phase-templates/*` and phase workspace server preload        | Partially live                            | Future source for resolved known answers.                                                      |
| Next-phase readiness pack                       | `src/lib/programs/phase-templates/next-phase-readiness-pack.ts`                | Live deterministic pack                   | Reuse conceptually; workbook spec adds XLSX/client completion shape.                           |
| Evidence upload/review lifecycle                | `src/app/api/programs/workspace/[moveId]/upload/route.ts` and evidence reviews | Live upload/review path                   | Future upload/parser target; no upload mutation in Increment 1/2.                              |
| Prompt reachability                             | Deliverable orchestrator prompt builders                                       | Exists for artifacts                      | Future tests must assert the resolved workbook/evidence plan reaches the real P2 prompt.       |

## Shared Contract

`StageReadinessWorkbookSpec` is the shared handoff shape:

1. Deterministic dimension plan decides what applies.
2. Existing readiness determines prefilled vs missing state.
3. Existing evidence need packets provide owner, format, example, and next
   action guidance.
4. XLSX rendering is deterministic and keeps workbook metadata hidden.
5. Upload parsing and prompt integration consume the stable question IDs and
   metadata in later increments.

## Hard Rules

- Code decides required/recommended/not-applicable scope.
- Claude may later improve wording, examples, and explanations, but must not
  remove required dimensions.
- Covered evidence becomes prefilled confirmation, not a blank question.
- Missing required evidence becomes `insufficient_evidence`, not plausible
  narrative.
- Workbook uploads must parse to structured responses before they influence
  phase artifacts.

## Increment Boundary

This increment adds the shared spec, deterministic resolver, XLSX renderer, and
tests. It does not add upload parsing, database writes, phase-gate automation,
or P2 prompt integration.
