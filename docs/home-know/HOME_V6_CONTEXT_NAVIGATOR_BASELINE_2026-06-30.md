# Home V6 Context Navigator Baseline

Date: 2026-06-30
Status: frozen

Home V6 is the frozen baseline context navigator for demo tenant Home questions. The tenant-display-name opening gate is deployed, and the three warning-only Golden 100 cases reran cleanly on the live production app.

## Baseline Contract

- Home answers from the V6 context navigator path, not retired curated semantic dossier layers.
- Claude produces the executive prose through the Home V6 synthesis path.
- The API may apply the established public answer sanitizer and tenant-name opening guard before validation.
- The renderer is a placement layer for the API payload and must not rewrite, summarize, relabel, or substitute visible prose.
- Every user-visible answer must open with the tenant-safe demo display name when Home V6 synthesis is selected.
- Answers must stay executive-friendly: no raw dataset names, source paths, row labels, debug route names, internal IDs, or old client names.
- Data-thin answers must name the missing proof instead of inventing facts.

## Frozen Evidence Standard

The baseline was frozen after the targeted post-fix production rerun showed:

- the same three warning questions rerun against the signed-in live app,
- Claude invoked and selected for each answer,
- fallback not used,
- old semantic layers sunset in trace,
- tenant display name present in the answer opening,
- warnings equal zero,
- ACA revision, image digest, and 100% traffic captured.

## Freeze Evidence

- Live app: `https://app.abarva.ai`
- Current freeze proof revision: `ca-abarva-web-lab-eastus--m1697b28d`
- Image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:76ae770fa6eaf618cc90011105d44e915f83d0ba8abe53fb0db49cdae299fc0d`
- Traffic: 100% to `ca-abarva-web-lab-eastus--m1697b28d`
- Targeted rerun artifact: `/tmp/nexus-home-v6-readiness/audit-artifacts/home-v6-warning-rerun-2026-06-30`
- Targeted rerun result: 3 passed, 0 failed, 0 warnings

## Non-Goals

- This baseline does not expand Home into Tower, Intelligence, Moves, or Source decision ownership.
- This baseline does not certify every future question type; Golden 100 remains the regression gate before material Home V6 answer-contract changes.
- This baseline does not re-enable any retired Home semantic dossier fallback.
