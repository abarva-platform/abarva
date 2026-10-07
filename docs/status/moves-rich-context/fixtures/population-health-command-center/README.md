# Population Health Command Center Rich-Context Fixture

This is an unloaded synthetic evidence pack for exercising Moves rich-context ingestion and prompt coverage. It is not a client record, not PHI, and not loaded into any tenant.

## Contents

- 8 structured tables, each as CSV and XLSX.
- 4 narrative documents, each as Markdown and DOCX.
- 838 CSV data rows across the structured tables.
- 118 measure-by-cohort care-gap cells that reconcile to 1,142,000 open gaps.
- 40 quality measures, including Medicare-only Part D/Stars measures and pediatric-only measures.
- A cheat sheet with 6 phases, 21 watched fields, 5 upload blocks, and 23 file references.

## Use

Run `npm run moves:rich-context-pack:validate` after regeneration. The validator re-opens the XLSX and DOCX files, reconciles care-gap totals, checks upload references, and scans for prohibited location/client hints.

## Boundary

This pack is fixture evidence only. Loading, approval, prompt packing, and generated-artifact citation proof are separate test steps.
