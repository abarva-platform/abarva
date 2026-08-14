# 2026-08-13-synthetic-attribute-generation — Generate missing contract attributes for a synthetic tenant

## Release ID

`2026-08-13-synthetic-attribute-generation`

## Status

`candidate`

## Plain-English Summary

The deterministic remediation brought the healthcare package to 19/19 contract conformance but only
54% of contract fields carrying a value, because 125 fields had no source column anywhere in the
original data. This fills the subset of those that can be generated defensibly.

This is generation, and it is labelled as such throughout. It is legitimate only because the tenant is
synthetic — its own rows declare `synthetic_v3_context_generation`, so no client evidence is being
overwritten and no attestation faked. On a real client package this script must never run: an empty
column there is an evidence request, not a gap to fill.

Contract fill moved from **54% to 66%**, 6,388 cells across 32 columns.

## Layer Impact

Release lane: `client-data-lane`. Layer 1 only, and only inside the governed intake draft package. The
active tenant root was not touched. Nothing loaded, no projection or cube rebuilt.

## Client Applicability

All clients: no. Specific clients: none — synthetic cover tenant. Internal only: yes. Feature flag: none.

## Changes Included

- `scripts/data/generate-missing-contract-attributes.mjs`
- `datasets/tenant-inputs/meridian-health/v2026-08-governed-intake/canonical-dimensions/*.csv`

## Four rules that keep it honest

1. **Only wholly-empty columns are filled.** A column populated in some rows is real data with holes;
   filling those would blur sourced and generated values inside a single column.
2. **Values are seeded from each row's own identity**, so output is reproducible and a re-run changes
   nothing. Verified byte-identical on a second run.
3. **Every generated field is recorded per row** in `generated_fields`, with
   `generation_basis = synthetic_demo_attribute_generation_2026_08_not_client_evidence`. A consumer can
   tell a generated value from a sourced one without consulting a manifest.
4. **Money and counts are anchored to the tenant's declared revenue and headcount**, not picked
   arbitrarily, so totals stay defensible against the enterprise profile.

## QA / Validation

| Check | Result |
| --- | --- |
| Contract fill, before → after | 157/286 (54%) → **189/286 (66%)** |
| Cells generated | 6,388 across 32 columns |
| Pre-existing values altered | **0** |
| Rows lost | **0** |
| Idempotent — second run byte-identical | **PASS** |
| `npm run release:check` | passed |

## Rollout Plan

Merge to `main`. No runtime rollout, no data-plane action. The package remains a draft in the governed
intake root; promotion is still `GATE-02`.

## Deployment Authority

Repo-owned deploy workflow unchanged. No shared runtime mutator, image, flag, or env change. Live
signed-in proof required: no.

## Rollback Plan

Revert the squash commit. The remediated package returns to its 54% state; the original source package
was never modified.

## Audit Evidence

- `generated_fields` and `generation_basis` columns on every affected row — the per-row record of what
  was generated and under what basis.
- The strategy table is source code, one entry per column, so a reviewer can disagree with any
  individual generation rule rather than having to accept or reject the whole pass.

## Known Gaps

- **66% is not 98%.** The reference tenant sits at 98%. This does not reach parity and should not be
  described as doing so.
- **97 contract fields remain empty by choice.** They are free-text and identity fields — `org_unit`,
  `decision_rights`, `parent_function`, `objective`, `scope`. Filling them means writing plausible
  prose, which is a qualitatively larger invention than picking an enum or anchoring a number, and it
  is where this pass deliberately stops. That is a separate decision.
- Generated enum distributions are uniform-random within a controlled list. Real estates are skewed —
  most systems are not `Critical`. The values are individually plausible and collectively flat.
- Dates are drawn independently, so a `term_start` and its `term_end` are internally consistent by
  construction but carry no relationship to the vendor's actual contract history.
- Nothing cross-validates generated money against the spend dimension totals. Sums will not tie.
- The generation is not segmented, because segmentation does not exist yet. Once Wave 2 lands, these
  values will not correlate with line of business or function tier in the way real data would.

## Follow-ups

1. Decide whether to generate the remaining 97 free-text fields.
2. Wave 2 — segmentation, then revisit whether generated values should be segment-aware.
3. `GATE-02` — promote the package once content is at an acceptable level.
