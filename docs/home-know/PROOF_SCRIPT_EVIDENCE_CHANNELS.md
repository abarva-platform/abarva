# Proof Script Evidence Channels

Proof scripts must report all evidence channels before issuing a pass/fail
verdict.

## Required Output

Every Home/aVa proof row should include:

- `facts`
- `tables`
- `charts`
- `graphs`
- `citations`
- `sourceCoverage`
- `sections`
- `rollups`
- `relationshipPaths`
- `metrics`
- `gaps`
- `usableEvidence`
- `evidenceReason`

## Correct Scoring

Correct:

```json
{
  "facts": 0,
  "tables": 1,
  "charts": 1,
  "graphs": 1,
  "citations": 14,
  "sourceCoverage": 6,
  "gaps": 3,
  "usableEvidence": true,
  "verdict": "PASS"
}
```

Incorrect:

```json
{
  "factsBound": 0,
  "verdict": "FAIL"
}
```

## Updated Scripts

- `scripts/qa/home-dossier-crawl.ts`
- `scripts/qa/eval-home-know-quality.mjs`
- `scripts/qa/home-live-gate.mjs`

The shared helper is the source of truth for the crawler. Live scripts read the
backend `response.safety.evidenceChannels` packet.
