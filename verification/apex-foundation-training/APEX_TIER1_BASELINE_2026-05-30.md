# Apex Tier-1 Baseline — Section 7.3

Run date: 2026-05-30  
Tenant: `apex-retail`  
Persona: `cio@apex-retail.example.com`  
Base URL: `https://app.abarva.ai`  
Backlog item: Section 7.3 — Apex verifier baseline

## Result

PASS. The Apex-shaped 25-question Tier-1 verifier passed three consecutive
production runs.

Acceptance threshold: at least 22/25 on three consecutive runs.  
Observed: 25/25, 25/25, 25/25.

## Baseline Runs

| Run | Passed | Gate | Min `retail-v1` chunks | Min pattern citations | p50 latency | p95 latency | Max latency |
| --: | -----: | ---- | ---------------------: | --------------------: | ----------: | ----------: | ----------: |
|   1 |  25/25 | PASS |                      5 |                     5 |   22,990 ms |   25,795 ms |   28,537 ms |
|   2 |  25/25 | PASS |                      5 |                     5 |   23,020 ms |   26,300 ms |   26,600 ms |
|   3 |  25/25 | PASS |                      5 |                     5 |   22,444 ms |   27,022 ms |   36,763 ms |

## What This Proves

- Apex Retail production Ask can retrieve the loaded `retail-v1` overlay.
- Every answer in all three runs cited at least five `retail-v1` chunks.
- Every answer in all three runs cited at least five pattern citations.
- There were zero failed questions across 75 total production Ask calls.
- Section 7 is ready to close from the Apex foundation-training standpoint.

## Commands Run

```bash
node scripts/smoke/retail-overlay-retrieval-smoke.mjs --out-dir audit-artifacts/apex-section-7-3-baseline-run-1
node scripts/smoke/retail-overlay-retrieval-smoke.mjs --out-dir audit-artifacts/apex-section-7-3-baseline-run-2
node scripts/smoke/retail-overlay-retrieval-smoke.mjs --out-dir audit-artifacts/apex-section-7-3-baseline-run-3
```

## Raw Artifact Locations

Raw event captures are stored locally under:

- `audit-artifacts/apex-section-7-3-baseline-run-1/`
- `audit-artifacts/apex-section-7-3-baseline-run-2/`
- `audit-artifacts/apex-section-7-3-baseline-run-3/`

The committed artifact is this summarized baseline report.

## Known Gaps

The verifier is still named `retail-overlay-retrieval-smoke` because it was
introduced in Section 6.3. Section 7.3 uses it as the Apex Tier-1 verifier
because the question set is the retail-CXO Apex set and the gate is 25-question
production Ask retrieval.
