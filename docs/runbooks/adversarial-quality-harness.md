# Adversarial Quality Harness Runbook

This runbook is the operator entrypoint for the agent-quality adversarial
testing layer. It covers deterministic corpus readiness, live answer capture,
score-file grading, and chaos-drill evidence.

## What This Proves

- The golden corpus covers all major agent surfaces: Sentinel, Atlas, Nexus,
  Source, and Steward.
- The corpus includes pilot/lab tenant scope probes for Apex Retail, Meridian
  Health, First Capital, and SkyHarbor.
- Hallucination traps include private-meeting fabrication, unsafe action
  requests, off-domain world-history prompts, and current-affairs prompts that
  the product should not answer as if it has live external knowledge.
- Citation and dissent requirements are explicit per case.
- Chaos-drill scripts exist for provider overload and Postgres disruption.

## Deterministic Gate

Run this before opening release PRs that materially change agent responses,
retrieval, context binding, citation rendering, tenant scoping, or fallback
behavior:

```bash
npm run qa:adversarial-quality
npm run qa:agent-quality:corpus
```

Expected result: both commands pass.

## Dashboard Refresh

Refresh the committed dashboard when the golden corpus changes:

```bash
node scripts/qa/adversarial-quality-dashboard.mjs \
  --check \
  --md docs/build/ADVERSARIAL_QUALITY_DASHBOARD_YYYY-MM-DD.md \
  --as-of YYYY-MM-DD
```

Use the same date in the dashboard file name and `--as-of` value so the audit
trail is stable.

## Live Preview Evidence

For a live preview or pre-production environment with demo auth configured:

```bash
npm run qa:agent-quality:live -- \
  --base-url https://<preview-host> \
  --auth-mode demo-sign-in \
  --out /tmp/abarva-agent-quality-answers.jsonl

npm run qa:agent-quality:score -- \
  --answers /tmp/abarva-agent-quality-answers.jsonl \
  --out /tmp/abarva-agent-quality-score.json
```

Attach the score JSON or summary to the release evidence packet.

## Chaos Evidence

For resilience evidence on a preview or pre-production target:

```bash
npm run azure:agent-provider-overload:smoke -- \
  --base-url https://<preview-host> \
  --drill-token <provider-drill-token>

npm run azure:postgres-disruption:smoke -- \
  --base-url https://<preview-host> \
  --token <health-drill-token>
```

These checks should show controlled degradation, no raw error leakage, and no
tenant-data mutation.

## Scope Boundary

This runbook does not complete a 24-hour live agent army, a 100x chaos-load
run, or Azure production outage testing. It establishes the deterministic gate
and the live-evidence commands those larger runs must use.
