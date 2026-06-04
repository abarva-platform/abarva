# Wave 5 Healthcare Estimation + RFP Verification Summary

Wave 5 adds no new corpus rows. It verifies that the authored Wave 1-4 evidence can support two cross-cutting answers: modernization effort estimation and SI bid normalization.

| Check | Verdict |
|---|---|
| W5-EVAL-ESTIMATE-001 | PASS |
| W5-EVAL-RFP-001 | PASS |
| W5-EVAL-COVERAGE-001 | PASS |

## Lakebridge Estimate

P50/P80/P95 effort days: 118 / 163 / 217.

## SI Bid Normalization

| Bid | Avg pillar score | Normalized price | Risk-adjusted price | Recommendation |
|---|---:|---:|---:|---|
| SI-B Governance-first lakehouse bid | 4 | $6,569,767 | $6,569,767 | shortlist with commercial pressure |
| SI-A Factory-heavy modernization bid | 3.71 | $6,666,667 | $6,666,667 | shortlist with commercial pressure |
| SI-C Low-price lift-and-shift bid | 2.43 | $5,486,111 | $7,406,250 | do not award without scope correction |

## Retrieval Status

Live retrieval is not claimed in this wave because the corpus packs have not been committed through the governed admin loader in this run. This is not marked as `RETRIEVAL_DISCONNECT`; it is `DEFERRED_PENDING_GOVERNED_UPLOAD`.
