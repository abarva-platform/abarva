# Home V6 Context Navigator Baseline

Date: 2026-06-30

Home V6 is the baseline context navigator for demo tenant Home questions once the tenant-display-name opening gate is deployed and the three warning-only live cases rerun cleanly.

## Baseline Contract

- Home answers from the V6 context navigator path, not retired curated semantic dossier layers.
- Claude produces the executive prose through the Home V6 synthesis path.
- The API may apply the established public answer sanitizer and tenant-name opening guard before validation.
- The renderer is a placement layer for the API payload and must not rewrite, summarize, relabel, or substitute visible prose.
- Every user-visible answer must open with the tenant-safe demo display name when Home V6 synthesis is selected.
- Answers must stay executive-friendly: no raw dataset names, source paths, row labels, debug route names, internal IDs, or old client names.
- Data-thin answers must name the missing proof instead of inventing facts.

## Frozen Evidence Standard

The baseline is frozen only when the targeted post-fix production rerun shows:

- the same three warning questions rerun against the signed-in live app,
- Claude invoked and selected for each answer,
- fallback not used,
- old semantic layers sunset in trace,
- tenant display name present in the answer opening,
- warnings equal zero,
- ACA revision, image digest, and 100% traffic captured.

## Non-Goals

- This baseline does not expand Home into Tower, Intelligence, Moves, or Source decision ownership.
- This baseline does not certify every future question type; Golden 100 remains the regression gate before material Home V6 answer-contract changes.
- This baseline does not re-enable any retired Home semantic dossier fallback.
