# Dimension Dossier Crawl Results

Status: local engine pass; signed-in production crawl pending deployment.

## Result

- SkyHarbor: 27/27 passed.
- Lakeshore: 27/27 passed.
- Total: 54/54 passed.
- Critical failures: 0.

## What Was Proven

- Every required question attaches a full relevant dimension dossier plus adjacent dimensions.
- Answers start with synthesis, not engine labels.
- Decision questions are handed off to Intelligence.
- Tenant-fence probes do not expose another tenant's actuals.
- The SkyHarbor org question no longer false-refuses when named leadership is loaded.

Proof bundle: `proof/home-dossier-crawl-20260625/`.
