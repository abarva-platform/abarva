# P18 Apex Data Pack Scaffold

## Impact

Adds the committed Apex Retail synthetic data-pack scaffold used by Packet 18 follow-on ingestion work. The scaffold establishes the 120-row application portfolio, 320-edge integration topology, and 12-question Sentinel expected-answer target.

This does not change runtime behavior by itself. It gives future ingestion, Watchlist, and Sentinel verification slices a stable file substrate instead of untracked local references.

## Validation

- `npm run verify:apex-data-pack`
- JSON parse check for `package.json`, `integration-topology.json`, and `expected-sentinel-answers.json`

## Scope

Included:

- `datasets/apex-retail-synthetic-v1/01-portfolio/application-portfolio.csv`
- `datasets/apex-retail-synthetic-v1/01-portfolio/integration-topology.json`
- `datasets/apex-retail-synthetic-v1/99-verification/expected-sentinel-answers.json`
- deterministic scaffold verifier

Not included:

- onboarding upload / parse / confirm / store pipeline
- vendor contracts, DORA baselines, PDFs, corpus chunks, or DB ingestion
- live Sentinel execution harness
