# 2026-08-13-ontology-wave2-segmentation — Wave 2: declare segmentation once, inherit it across the graph

## Release ID

`2026-08-13-ontology-wave2-segmentation`

## Status

`candidate`

## Plain-English Summary

Segmentation is what turns a flat inventory into something answerable. "Which systems serve the health
plan's front office" is a semantic-similarity gamble against 500 unlabelled rows, and a deterministic
subgraph selection against 500 labelled ones.

Two facets are now declared per tenant — line of business, and front/middle/back function tier — and
they are declared **once, on the ~20-row function dimension**. Everything else inherits through the
graph. A client tags twenty functions, not five hundred systems; asking them to do the latter is how
segmentation work dies.

Results differ sharply by tenant, and the difference is the finding.

## Layer Impact

Release lane: `client-data-lane`. Layer 1 columns, Layer 3 semantics. Nothing loaded, no cube rebuilt.

## Client Applicability

All clients: no. Specific clients: none — synthetic cover tenants. Internal only: yes. Feature flag: none.

## Changes Included

- `datasets/tenant-inputs/skyharbor-air/segmentation.json` — 22 functions, DRAFT for SME correction
- `datasets/tenant-inputs/meridian-health/segmentation.json` — 7 functions, DRAFT for SME correction
- `scripts/data/apply-segmentation.mjs`
- `datasets/tenant-inputs/templates/universal/standard-2026-07-v3/ontology.json` — propagation widened
- segmentation columns written to both tenants' dimension files

## Two rules that decide whether the output is trustworthy

1. **Inheritance yields a set, not a value.** A system supporting both care delivery and the patient
   portal is correctly both middle and front. Flattening that to one value would be a lie that reads
   as precision.
2. **A node reached by no segmented function is written `UNDECLARED` and counted.** It is never
   defaulted to back office. A defaulted segment is a wrong answer wearing the appearance of a right
   one, and nothing downstream can falsify it.

Hop distance is written alongside every inherited segment. A one-hop system supporting a function and
a three-hop risk attached to that system's infrastructure are not the same strength of claim.

## QA / Validation

### Reference tenant — segmentation works

| Dimension | Segmented |
| --- | --- |
| business functions (declared) | **22 / 22** |
| applications and systems | **503 / 503 (100%)** |
| infrastructure platforms | 31 / 33 (94%) |
| programmes and initiatives | 20 / 20 (100%) |
| risks and controls | 40 / 44 (91%) |
| org ownership | 38 / 150 (25%) |
| metrics | 2 / 26 (8%) |
| data assets | **0 / 499** |
| AI use cases | **0 / 13** |

Hop distance: 541 at one hop, 91 at two, 2 at three.

### Integrity

| Check | Result |
| --- | --- |
| Rows lost, either tenant | **0** |
| Columns removed | **0** |
| Existing cells changed | **0** |
| `npm run release:check` | passed |

## The two findings that matter more than the coverage numbers

**1. A third of the reference tenant's inventory is not in the graph at all.** Data assets (499 rows),
AI use cases (13) and workforce roles (38) appear as endpoints **zero** times in 3,318 edges. They
exist as rows and participate in no relationship. They cannot inherit segmentation, and `UNDECLARED`
is the correct answer rather than a defect in the propagation. It also means "which data assets serve
the health plan" is unanswerable today for a reason that has nothing to do with segmentation.

**2. The second tenant's graph is a different ontology entirely.** Its 1,037 edges use node types
(`contract`, `dependency`, `ai_use_case`, `data_domain`, `leader`, `process`) and relationship types
(`provides`, `depends_on`, `requires_system`, `uses_data_domain`) that the declared ontology does not
contain, and its 30 function endpoints are snake_case identifiers (`clinical_ehr`) rather than the
function names in its own function dimension. Endpoint integrity is 33%; 2,915 violations.

So segmentation propagated **nothing** for that tenant — correctly. Its seven functions carry declared
segments; the graph cannot yet carry them anywhere.

This is the same class of problem GATE-08 resolved for the column contract, one layer up: two tenants,
two incompatible models. GATE-08 settled the *column* contract. Nobody has settled the *graph*
contract. That decision is now unavoidable and belongs in Wave 3.

## Rollout Plan

Merge to `main`. No runtime rollout, no data-plane action.

## Deployment Authority

Repo-owned deploy workflow unchanged. No shared runtime mutator, image, flag or env change. Live
signed-in proof required: no. Note that the reference tenant's active root is read by Home surfaces,
so the added columns ship with the next deploy; they are additive and no runtime code reads them.

## Rollback Plan

Revert the squash commit. All changes are additive columns plus two declaration files.

## Audit Evidence

- `datasets/tenant-inputs/<tenant>/segmentation.json` — every assignment, with `judgementCall` on the
  ones most likely to be wrong.
- `inherited_segment_hops` on every segmented row — how indirect the inference was.
- `reports/tenant-ontology/ontology-validation.json` — the graph mismatch, quantified.

## Known Gaps

- **Both segmentation files are DRAFT.** Every assignment is a proposal from analysis, not client
  knowledge. Four are flagged as judgement calls: in-flight catering (front or middle), safety (middle
  or back), fuel (operating or treasury), and actuarial (back or middle).
- Line-of-business vocabularies are inferred from each tenant's own profile text. Whether the split is
  the legal-entity view or the P&L view is not established, and it changes every downstream slice.
- Metrics inherit at 8% and org units at 25%. Both are low enough to suggest missing edges rather than
  genuinely unsegmentable nodes.
- `integrates_with` is deliberately excluded from propagation: it is symmetric and promiscuous, and
  propagating through a shared integration bus would hand almost every node every segment.
- Two files remain blocked on malformed CSV quoting and so carry no segmentation columns at all.
- The 3-hop limit is a judgement, not a derived value. Nothing tested whether 2 or 4 is better.
- Segmentation is not yet in the column contract. Adding it would make five other tenants
  non-conformant overnight, so it waits until they carry the columns too.

## Follow-ups

1. SME review of both segmentation drafts — this is the client-facing artefact of this wave.
2. Wave 3 — decide the graph contract for the second tenant, connect the disconnected dimensions,
   repair the two malformed files.
3. Add segmentation to the column contract once all tenants carry it.
