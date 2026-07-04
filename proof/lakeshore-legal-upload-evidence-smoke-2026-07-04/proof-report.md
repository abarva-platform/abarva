# Lakeshore Legal Upload Evidence Smoke Proof

Date: 2026-07-04

## Objective

Prove, locally, that the Moves upload/evidence path is ready for the Lakeshore Shared Services legal-contract-intake demo before attempting a signed-in browser run.

This proof focuses on:

- phase upload guidance;
- evidence extraction/classification;
- evidence readiness metadata;
- client-final workflow compatibility;
- downstream P2 -> P3 -> P4 -> P5/Tower story readiness.

## Demo Use Case

**Move:** Shared Services - Legal Contract Intake and Obligation Control
**Demo tenant:** Lakeshore Holdings / Industrial Demo
**Business problem:** Legal and vendor-management teams struggle with contract intake quality, review cycle time, obligation capture, and handoff visibility.

## Fixture Pack

Source pack:

- `/Users/anand/Downloads/lakeshore-legal-contract-intake-live-demo-2026-07-04.zip`
- `/Users/anand/Projects/nexus/proof/lakeshore-legal-contract-intake-live-demo-2026-07-04/manifest.json`

Copied manifest:

- `proof/lakeshore-legal-upload-evidence-smoke-2026-07-04/fixture-manifest.json`

Fixture counts:

| Metric | Count |
| --- | ---: |
| Total files | 41 |
| Tabular rows | 6,453 |
| DOCX files | 16 |
| XLSX files | 13 |
| CSV files | 3 |
| Markdown files | 9 operator-only notes |

Representative files:

| Phase | Files |
| --- | --- |
| P2 Understand Current State | `Contract Request Log.csv`, `Legal Work Queue Extract.csv`, `Contract Review Cycle Times.xlsx`, `Missing Intake Fields Analysis.xlsx`, `Systems and Data Sources.xlsx`, `P2 Current-State Review Notes.docx`, `P2 Final Current-State View.docx` |
| P3 Choose the Approach | `P3 Solution Options Decision Matrix.xlsx`, `Human and AI Work Split.xlsx`, `P3 Solution Approach Workshop Notes.docx`, `P3 Final Solution Design.docx` |
| P4 Build the Plan | `P4 Value Assumptions Review.xlsx`, `Tower Metric Definition Workshop.xlsx`, `P4 Roadmap and Value Review Notes.docx`, `P4 Final Plan.docx` |
| P5 Prepare to Execute | `Mobilization RACI.xlsx`, `Launch Readiness Checklist.xlsx`, `P5 Execution Readiness Review Notes.docx` |

## Defects Found

| Defect | Why it mattered |
| --- | --- |
| Workspace upload did not synchronously record `program_evidence_items`. | The UI could say a file uploaded while readiness/generation had no reliable phase evidence to use. |
| Upload response did not say what AbarVa found or where the evidence would be used. | The demo needed visible trust feedback after upload. |
| Phase workspace did not guide SMEs on what files to provide. | Clients would not know the expected input by phase. |
| Generic upload evidence type was too broad for Move readiness. | P2/P3/P4/P5 readiness needs business slot metadata, not just "uploaded artifact." |

## Fixes Made

| File | Fix |
| --- | --- |
| `src/lib/programs/uploaded-move-evidence-classification.ts` | Added phase-aware classifier that maps uploaded file names/content to Move evidence type, source type, readiness slots, artifact consumers, what-found, where-used, and citation metadata. |
| `src/app/api/programs/workspace/[moveId]/upload/route.ts` | Added synchronous extraction/classification/recording of Move evidence after attachment storage. Still leaves background chunking in place. |
| `src/app/api/programs/[id]/attachments/upload/route.ts` | Added the same phase-aware evidence metadata to the main program attachment upload route. |
| `src/components/strategic-moves/StrategicMovePhaseClient.tsx` | Added phase-specific "What to upload" guidance and upload-chip feedback showing what AbarVa found and where it will be used. |
| `src/lib/programs/__tests__/uploaded-move-evidence-classification.test.ts` | Added regression coverage for P2/P3/P4 evidence classification and metadata merge. |
| `src/components/strategic-moves/__tests__/StrategicMovePhaseUploadGuidance.test.tsx` | Added regression coverage for client-facing upload guidance and absence of backend/internal labels. |

## Local Validation

Passed:

```bash
npx jest src/lib/programs/__tests__/uploaded-move-evidence-classification.test.ts src/components/strategic-moves/__tests__/StrategicMovePhaseUploadGuidance.test.tsx --runInBand
```

Result:

- 2 test suites passed.
- 7 tests passed.

Passed:

```bash
npx eslint 'src/app/api/programs/workspace/[moveId]/upload/route.ts' 'src/app/api/programs/[id]/attachments/upload/route.ts' src/lib/programs/uploaded-move-evidence-classification.ts src/components/strategic-moves/StrategicMovePhaseClient.tsx src/lib/programs/__tests__/uploaded-move-evidence-classification.test.ts src/components/strategic-moves/__tests__/StrategicMovePhaseUploadGuidance.test.tsx
```

Result:

- No ESLint errors reported for the targeted files.

Passed:

```bash
NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit
```

Passed:

```bash
git diff --check
```

Attempted:

```bash
npm run release:check
```

Result:

- Release Control Gate passed.
- Deploy Authority Gate passed.
- Pilot Data Loader Gate passed.

Blocked:

```bash
npx jest src/lib/programs/__tests__/evidence-ingestion.test.ts --runInBand
```

Reason:

- This local dependency folder is missing `@azure-rest/ai-document-intelligence`, although the package is listed in `package.json` / `package-lock.json`. This is a local dependency setup issue, not a Moves evidence-classifier failure.

Observed non-blocking warnings:

- Existing duplicate Jest manual mocks for markdown/GFM packages.
- Existing Node `--localstorage-file` warning.

## Evidence Classification Smoke

| Uploaded file | Phase | Classified as | Slots / consumers proven by test |
| --- | --- | --- | --- |
| `Contract Request Log.csv` | P2 | `ticket_evidence` | current-state, process pain, volume baseline, operational work item evidence; P2 diagnosis and P4 value baseline |
| `Solution Options Decision Matrix.xlsx` | P3 | `solution_options_decision` | options, weighted decision matrix, chosen architecture option; P3 approach and P4 roadmap |
| `Tower Metric Definitions.xlsx` | P4 | `kpi_value_baseline` | value milestones, KPI baseline/target, P5 measurement contract; P4 value plan and P5/Tower handoff |

## What Is Still Not Proven

- Signed-in browser upload flow on `app.abarva.ai`.
- Azure deploy of the local patch.
- Actual live upload of DOCX/XLSX/CSV fixtures through the app.
- V7 promotion from uploaded Move evidence.
- Export behavior.
- All phase/file variants.
- All P2-P6 Moves variants.

## Browser Proof Status

Not run in this slice.

Reason: the local API/component smoke has passed, but these code changes are not deployed in this proof folder. A signed-in browser proof should be run only after deploying the patch to ACA or on a local authenticated dev lane with real Clerk/Azure credentials.

## Recommended Next Browser Smoke

After deploy or authenticated local setup:

1. Open `app.abarva.ai`.
2. Sign in.
3. Open Industrial Demo / Lakeshore legal-contract-intake Move.
4. Open P2.
5. Confirm "What to upload" guidance is visible.
6. Upload `Contract Request Log.csv`.
7. Confirm upload chip shows what AbarVa found and where it will be used.
8. Confirm Evidence Readiness updates with covered slots.
9. Generate P2 package.
10. Upload final P2 current-state DOCX through client-final review.
11. Approve final.
12. Move to P3 and confirm approved P2 final influences context.
13. Repeat for P3 solution approach and P4 plan/Tower metrics.

## Non-Claims

- No production readiness claim.
- No live browser-visible claim.
- No claim that uploads automatically update V7.
- No claim that all file formats have equal semantic extraction quality.
- No claim that the current demo Move already exists in production with these files loaded.
